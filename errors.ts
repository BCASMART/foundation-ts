import { $ok } from "./commons";

// TODO: several singletons for each kind of errors...
export class UniqueError extends Error {
	private static __instance:UniqueError ;

	private constructor(message: string) {
		super(message);
	}

	public static singleton() : UniqueError {
		if (!$ok(this.__instance)) {
			this.__instance = new UniqueError('ESINGLETONERROR') ;
		}
		return this.__instance ;
	}

}

