import { $ok } from "./commons";

// TODO: several singletons for each kind of errors...
export class TSUniqueError extends Error {
	private static __instance:TSUniqueError ;

	private constructor(message: string) {
		super(message);
	}

	public static singleton() : TSUniqueError {
		if (!$ok(this.__instance)) {
			this.__instance = new TSUniqueError('ESINGLETONERROR') ;
		}
		return this.__instance ;
	}

}

