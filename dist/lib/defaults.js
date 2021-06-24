"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalDefaults = void 0;
var utils_fs_1 = require("./utils_fs");
/**
 * if you want to change the subfolders to be tested
 * you should use the static method setSubfolders() before
 * calling any functions using LocalDefaults
 */
var LocalDefaults = /** @class */ (function () {
    function LocalDefaults() {
        this.defaultPath = __dirname;
        for (var sf in LocalDefaults.__subfolders) {
            if (utils_fs_1.$filename(this.defaultPath) === sf) {
                this.defaultPath = utils_fs_1.$dir(this.defaultPath);
            }
        }
    }
    LocalDefaults.setSubfolders = function (folders) {
        this.__subfolders = folders;
    };
    LocalDefaults.defaults = function () {
        if (!this.__instance) {
            this.__instance = new LocalDefaults();
        }
        return this.__instance;
    };
    LocalDefaults.__subfolders = ['utils', 'tests', 'dist'];
    return LocalDefaults;
}());
exports.LocalDefaults = LocalDefaults;
//# sourceMappingURL=defaults.js.map