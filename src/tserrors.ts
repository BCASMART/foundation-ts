import { $isint, $isunsigned, $ok } from "./commons";
import { $ftrim } from "./strings";
import { TSLeafInspect } from "./tsobject";
import { Resp } from "./tsrequest";
import { Nullable, TSDictionary } from "./types";
import { $inbrowser } from "./utils";
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

}
export class TSError extends Error {
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
    public static assert():void {
		const n = arguments.length ;
        switch (n) {
            case 0: break ;
            case 1: if (!arguments[0]) { throw new this(`${this.name}.assert() did fail`) ; } break ;
            case 1: if (!arguments[0]) { throw new this(arguments[1]) ; } break ;
            case 2: if (!arguments[0]) { throw new this(arguments[1], arguments[2]) ; } break ; 
            default: if (!arguments[0]) { throw new this(arguments[1], arguments[2], arguments[3]) ; } break ; 
        }        
    }

    public constructor(message:string) ;
    public constructor(message:string, info:Nullable<number|TSDictionary>) ;
    public constructor(message:string, info:Nullable<TSDictionary>, errorCode:Nullable<number>) ;
    public constructor(message:string, errorCode:Nullable<number>, info:Nullable<TSDictionary>) ;
	public constructor() {
		const n = arguments.length ;
        const s = n > 0 ? $ftrim(arguments[0] as string): "" ;
        
        super(s.length?s:TSError.DefaultMessage) ;

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

    public static assertIntParam(v:Nullable<number>, fn:string, param:string)
    { this.assert(!$ok(v) || $isint(v), `parameter '${param}' of ${fn}() must be an integer`, { functionName:fn, param:param, value:v}) ; }

    public static assertUnsignedParam(v:Nullable<number>, fn:string, param:string)
    { this.assert(!$ok(v) || $isunsigned(v), `parameter '${param}' of ${fn}() must be an unsigned`, { functionName:fn, param:param, value:v}) ; }

    public static assertNotInBrowser(fn:string)
    { this.assert(!$inbrowser(), `unavailable ${fn}() ${fn.includes('.')?'method':'function'} in browser`, { functionName:fn}) ; }


    public get errorCode():number { return this._errorCode ; }
    public set errorCode(code:Nullable<number>) { if ($isint(code)) { this._errorCode = code! ;} } 
    
    // TSError status is here to handle specific HTTP errors
    public get status():Resp 
    { return $ok(this._errorCode) && !isNaN(this._errorCode) && Object.values(Resp).includes(this._errorCode) ? this._errorCode as Resp : Resp.InternalError ; }
    
    public set status(s:Resp) 
    { if (Object.values(Resp).includes(s)) { this._errorCode = s ; } }

    public entries(): [string, any][] { return Object.entries({ name:this.name, errorCode:this.errorCode, message:this.message, info:this.info}) ; }

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
