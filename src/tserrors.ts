import { $ok } from "./commons";

export class TSUniqueError extends Error {
	private static __esInstance:TSUniqueError ;
	private static __genericInstance:TSUniqueError ;

	private constructor(message: string) {
		super(message);
	}

	public static genericError() : TSUniqueError {
		if (!$ok(this.__genericInstance)) {
			this.__genericInstance = new TSUniqueError('GENERICSINGLETONERROR') ;
		}
		return this.__genericInstance ;
    }

    public static esError() : TSUniqueError {
		if (!$ok(this.__esInstance)) {
			this.__esInstance = new TSUniqueError('ESSINGLETONERROR') ;
		}
		return this.__esInstance ;
	}

}

