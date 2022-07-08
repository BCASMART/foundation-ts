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

export class TSHttpError extends TSError {
    public readonly status:Resp ;
    public constructor(message:string, status:Resp, infos?:AnyDictionary) {
        super(message, infos) ;
        this.status = status ;
    }
}
