import { $ok } from "./commons";
import { Resp } from "./tsrequest";
import { AnyDictionary } from "./types";

export class TSUniqueError extends Error {
	private static __timeoutInstance:TSUniqueError ;
	private static __genericInstance:TSUniqueError ;

	private constructor(message: string) {
		super(message);
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

}
export class TSError extends Error {
    public readonly infos:AnyDictionary|undefined ;
    public constructor(message:string, infos?:AnyDictionary) {
        super(message) ;
        this.infos = infos ;
    }
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
    public constructor(message:string, status:Resp, infos?:AnyDictionary) {
        super(message, infos) ;
        this.status = status ;
    }
}
