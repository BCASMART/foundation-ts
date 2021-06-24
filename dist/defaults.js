import { $dir, $filename } from "./utils_fs";
/**
 * if you want to change the subfolders to be tested
 * you should use the static method setSubfolders() before
 * calling any functions using LocalDefaults
 */
export class LocalDefaults {
    constructor() {
        this.defaultPath = __dirname;
        for (let sf in LocalDefaults.__subfolders) {
            if ($filename(this.defaultPath) === sf) {
                this.defaultPath = $dir(this.defaultPath);
            }
        }
    }
    static setSubfolders(folders) {
        this.__subfolders = folders;
    }
    static defaults() {
        if (!this.__instance) {
            this.__instance = new LocalDefaults();
        }
        return this.__instance;
    }
}
LocalDefaults.__subfolders = ['utils', 'tests', 'dist'];
//# sourceMappingURL=defaults.js.map