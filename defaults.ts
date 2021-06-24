import { $dir, $filename } from "./utils_fs";

/**
 * if you want to change the subfolders to be tested
 * you should use the static method setSubfolders() before
 * calling any functions using LocalDefaults 
 */

export class LocalDefaults {
	private static __instance: LocalDefaults ;
	private static __subfolders:string[] = ['utils', 'tests', 'dist'] ;
	public defaultPath ;
	private constructor() {
		this.defaultPath = __dirname ;
		for (let sf in LocalDefaults.__subfolders) {
			if ($filename(this.defaultPath) === sf) {
				this.defaultPath = $dir(this.defaultPath) ;
			}
		}
	}
	
	public static setSubfolders(folders:string[]) {
		this.__subfolders = folders ;
	}

	public static defaults(): LocalDefaults {
		if (!this.__instance) {
			this.__instance = new LocalDefaults() ;
		}
		return this.__instance ;
	}
}
