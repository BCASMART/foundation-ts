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
    public static readonly DefaultMessage = "TSError generic message" ;

    private _errorCode:number = NaN ;

	public constructor(message:string) ;
    public constructor(message:string, errorCode:Nullable<number>) ;
    public constructor(message:string, info:Nullable<TSDictionary>) ;
    public constructor(message:string, info:Nullable<TSDictionary>, errorCode:Nullable<number>) ;
	public constructor() {
		const n = arguments.length ;
        const s = n>0?$ftrim(arguments[0] as string):"" ;
        super(s.length?s:TSError.DefaultMessage) ;
        switch (n) {
			case 1: break ;
            case 2:
                if (typeof arguments[1] === 'number') { this.errorCode = arguments[1] ; }
                else if ($ok(arguments[1])) { this.info = arguments[1] as TSDictionary ; }
                break ;
            case 3:
                if ($ok(arguments[1])) { this.info = arguments[1] as TSDictionary ; }
                if ($ok(arguments[2])) { this.errorCode = arguments[2] as number ; } 
                break ;
            default:
                break ;
        }
    }

    public static assertIntParam(v:Nullable<number>, fn:string, param:string) {
        if ($ok(v) && !$isint(v)) {
            throw new TSError(`parameter '${param}' of ${fn}() must be an integer`, {
                fn:fn,
                param:param,
                value:v
            }) ;    
        }
    }

    public static assertNotInBrowser(fn:string) {
        if ($inbrowser()) { 
            throw new TSError(`unavailable ${fn}() ${fn.includes('.')?'method':'function'} in browser`, { functionName:fn}) ; 
        }
    }

    public static assertUnsignedParam(v:Nullable<number>, fn:string, param:string) {
        if ($ok(v) && !$isunsigned(v)) {
            throw new TSError(`parameter '${param}' of ${fn}() must be an unsigned`, {
                fn:fn,
                param:param,
                value:v
            }) ;
        }
    }

    public get errorCode() { return this._errorCode ; }
    public set errorCode(code:Nullable<number>) { if ($isint(code)) { this._errorCode = code! ;} } 

    public entries(): [string, any][] { return Object.entries({ name:this.name, errorCode:this.errorCode, message:this.message, info:this.info}) ; }

}

export function $subclassReponsabililty(instance:object, method:Function):any {
    const c = instance.constructor ;
    if (c === Function) {
        throw new TSError(`implementation of static method ${(instance as any).name}.${method.name}() is subclasses reponsabillity.`, {
            isStatic:true,
            object:instance,
            method:method
        }) ;
    }

    throw new TSError(`implementation of method ${c.name}.${method.name}() is subclasses reponsabillity.`, {
        isStatic:false,
        object:instance,
        method:method
    }) ;
}

export class TSHttpError extends TSError {
    public readonly status:Resp ;
    public constructor(message:string, status:Resp, info?:Nullable<TSDictionary>, errorCode?:Nullable<number>) {
        super(message, info, errorCode) ;
        this.status = status ;
    }

    public entries(): [string, any][] { return Object.entries({ name:this.name, status:this.status, errorCode:this.errorCode, message:this.message, info:this.info}) ; }

}
