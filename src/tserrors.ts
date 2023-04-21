import { $isint, $isunsigned, $ok } from "./commons";
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

    private _errorCode:number = NaN ;

    public constructor(message:string, info?:Nullable<TSDictionary>, errorCode?:Nullable<number>) {
        super(message) ;
        if ($ok(info)) { this.info = info! } ;
        this.errorCode = errorCode ;
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
