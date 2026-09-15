import { $isint, $isunsigned, $length, $ok } from "./commons";
import { $ftrim } from "./strings";
import { TSLeafInspect } from "./tsobject";
import { Resp } from "./tsrequest";
import { Nullable, TSDictionary } from "./types";
import { $inbrowser } from "./utils";

const customInspectSymbol = Symbol.for('nodejs.util.inspect.custom') ;

// Built once, lazily, on first use rather than at module top level : tserrors
// and tsrequest import each other (TSError/TSUniqueError <- Resp), so an eager
// Object.values(Resp) here can run before tsrequest.ts has finished evaluating
// Resp, if something requires tserrors/tsrequest before commons has already
// pulled the whole graph in — Object.values(undefined) then throws. Deferring
// the computation to first call sidesteps the load-order hazard entirely,
// since nothing invokes it during synchronous module evaluation.
//
// Object.values() on a numeric TS enum returns both the forward (name ->
// number) and reverse (number -> name) mappings, so a bare
// Object.values(Resp).includes(x) call re-walks and re-allocates that mixed
// array every time. Filter down to the numeric half once and query a Set.
let _respValues:Set<number>|undefined = undefined ;
function _respValueSet():Set<number> {
    if (!_respValues) { _respValues = new Set<number>(Object.values(Resp).filter(v => typeof v === 'number') as number[]) ; }
    return _respValues ;
}

// true for any value that is a legit HTTP status code known to Resp. Used both
// to validate TSError.status and to decide whether a TSError is an expected
// HTTP-status outcome (see the constructor : those skip stack capture).
export function $isRespCode(v:Nullable<number>):v is Resp { return $ok(v) && _respValueSet().has(v!) ; }

export class TSUniqueError extends Error implements TSLeafInspect {
	private static __timeoutInstance:TSUniqueError ;
	private static __genericInstance:TSUniqueError ;

	private constructor(message: string) {
		super(message);
        this.name = message ;
	}

	public static genericError() : TSUniqueError {
		if (!$ok(this.__genericInstance)) {
			this.__genericInstance = new TSUniqueError('GenericSingletonError') ;
		}
		return this.__genericInstance ;
    }

    public static timeoutError() : TSUniqueError {
		if (!$ok(this.__timeoutInstance)) {
			this.__timeoutInstance = new TSUniqueError('TimeoutSingletonError') ;
		}
		return this.__timeoutInstance ;
	}

    leafInspect():string { return this.name ; }

    // @ts-ignore
    [customInspectSymbol]() { return this.leafInspect() ; }

}
export class TSError extends Error implements TSLeafInspect {
    public readonly info:TSDictionary|undefined ;
    public static readonly DefaultMessage = "TSError did throw" ;

    protected _errorCode:number = NaN ;

	public static throw(message:string):never ;
    public static throw(message:string, errorCode:Nullable<number|TSDictionary>):never ;
    public static throw(message:string, info:Nullable<TSDictionary>, errorCode:Nullable<number>):never ;
    public static throw(message:string, errorCode:Nullable<number>, info:Nullable<TSDictionary>):never ;
    public static throw():never {
		const n = arguments.length ;
        switch (n) {
            case 0: throw new this(`${this.name} did throw`) ;
            case 1: throw new this(arguments[0]) ;
            case 2: throw new this(arguments[0], arguments[1]) 
            default: throw new this(arguments[0], arguments[1], arguments[2]) 
        }        
    }

    public static assert(condition:boolean):void ;
	public static assert(condition:boolean, message:string):void ;
    public static assert(condition:boolean, message:string, errorCode:Nullable<number|TSDictionary>):void ;
    public static assert(condition:boolean, message:string, info:Nullable<TSDictionary>, errorCode:Nullable<number>):void ;
    public static assert(condition:boolean, message:string, errorCode:Nullable<number>, info:Nullable<TSDictionary>):void ;
    public static assert(condition:boolean, ...rest:any[]):void {
        if (condition) { return ; }
        const message = $length(rest[0]) ? rest[0] as string : `${this.name}.assert() did fail` ;
        switch (rest.length) {
            case 0: case 1: throw new this(message) ;
            case 2:         throw new this(message, rest[1]) ;
            default:        throw new this(message, rest[1], rest[2]) ;
        }
    }

    public constructor(message:string) ;
    public constructor(message:string, info:Nullable<number|TSDictionary>) ;
    public constructor(message:string, info:Nullable<TSDictionary>, errorCode:Nullable<number>) ;
    public constructor(message:string, errorCode:Nullable<number>, info:Nullable<TSDictionary>) ;
	public constructor() {
		const n = arguments.length ;
        const s = n > 0 ? $ftrim(arguments[0]): "" ;

        // Server routing/validation throws a TSError carrying a Resp code (404,
        // 405, 400, ...) for every not-found / bad-request outcome — control
        // flow, not a bug. Every one otherwise pays V8's stack-frame walk, the
        // dominant cost of constructing an Error. Detect that family here,
        // before super() runs the capture, and skip it : same object, same
        // API, just an empty (unformatted) .stack.
        const candidateCode = n >= 3 && typeof arguments[2] === 'number' ? arguments[2]
                             : (n >= 2 && typeof arguments[1] === 'number' ? arguments[1] : undefined) ;
        const skipStack = typeof candidateCode === 'number' && _respValueSet().has(candidateCode) ;
        const stackHolder = Error as unknown as { stackTraceLimit?:number } ;
        const hasStackLimit = skipStack && typeof stackHolder.stackTraceLimit === 'number' ;
        const savedStackLimit = hasStackLimit ? stackHolder.stackTraceLimit : undefined ;
        if (hasStackLimit) { stackHolder.stackTraceLimit = 0 ; }

        super(s.length?s:TSError.DefaultMessage) ;

        if (hasStackLimit) { stackHolder.stackTraceLimit = savedStackLimit! ; }

        switch (n) {
			case 1: break ;
            case 2:
                if (typeof arguments[1] === 'number') { this.errorCode = arguments[1] ; }
                else if ($ok(arguments[1])) { this.info = arguments[1] as TSDictionary ; }
                break ;

            case 3:
                if (typeof arguments[1] === 'number') { this.errorCode = arguments[1] ; }
                else if ($ok(arguments[1])) { this.info = arguments[1] as TSDictionary ; }
                if (typeof arguments[2] === 'number') { this.errorCode = arguments[2] ; }
                else if ($ok(arguments[2])) { this.info = arguments[2] as TSDictionary ; }
                break ;

            default:
                break ;
        }
    }

    public static assertIntParam(v:Nullable<number>, fn:string, param:string):void
    { this.assert(!$ok(v) || $isint(v), `parameter '${param}' of ${fn}() must be an integer`, { functionName:fn, param:param, value:v}) ; }

    public static assertUnsignedParam(v:Nullable<number>, fn:string, param:string):void
    { this.assert(!$ok(v) || $isunsigned(v), `parameter '${param}' of ${fn}() must be an unsigned`, { functionName:fn, param:param, value:v}) ; }

    public static assertNotInBrowser(fn:string):void
    { this.assert(!$inbrowser(), `unavailable ${fn}() ${fn.includes('.')?'method':'function'} in browser`, { functionName:fn}) ; }

    public get errorCode():number { return this._errorCode ; }
    public set errorCode(code:Nullable<number>) { if ($isint(code)) { this._errorCode = code! ;} } 
    
    // TSError status is here to handle specific HTTP errors
    public get status():Resp
    { return $isRespCode(this._errorCode) ? this._errorCode as Resp : Resp.InternalError ; }

    public set status(s:Resp)
    { if (_respValueSet().has(s)) { this._errorCode = s ; } }

    public entries(): [string, any][] { return Object.entries({ name:this.name, errorCode:this.errorCode, message:this.message, info:this.info}) ; }

    public leafInspect():string { return `[TSError ${this.errorCode}] ${this.message}` ; }

    // @ts-ignore
    [customInspectSymbol]() { return this.leafInspect() ; }

}

// @deprecated HttpError class does not exist anymore, use TSError instead
export { TSError as TSHttpError }

export function $subclassReponsabililty(instance:object, method:Function):never {
    const c = instance.constructor ;
    if (c === Function) {
        TSError.throw(`implementation of static method ${(instance as any).name}.${method.name}() is subclasses reponsabillity.`, {
            isStatic:true,
            object:instance,
            method:method
        }) ;
    }

    TSError.throw(`implementation of method ${c.name}.${method.name}() is subclasses reponsabillity.`, {
        isStatic:false,
        object:instance,
        method:method
    }) ;
}
