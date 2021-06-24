"use strict";
/**
 * 	All File System operations are maint to be in this file
 *  This means that no import of 'fs' module shouls apear elsewere
 *
 *  We also tries to use sync functions in order not to publish async functions
 *  for those basic stiff. It could be changed at any moment
 *  by using fs.promises...
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.$copyFile = exports.$realMoveFile = exports.$removeFile = exports.$writeBuffer = exports.$readBuffer = exports.$writeString = exports.$readString = exports.$defaultpath = exports.$loadJSON = exports.$filename = exports.$dir = exports.$withoutext = exports.$ext = exports.$path = exports.$uniquefile = exports.$filesize = exports.$createDirectory = exports.$isdirectory = exports.$isfile = void 0;
var fs_1 = require("fs");
var path_1 = require("path");
var commons_1 = require("./commons");
var defaults_1 = require("./defaults");
var utils_crypto_1 = require("./utils_crypto");
function $isfile(src) {
    var ret = false;
    try {
        ret = commons_1.$length(src) && fs_1.statSync(src).isFile() ? true : false;
    }
    catch (_a) {
        ret = false;
    }
    return ret;
}
exports.$isfile = $isfile;
function $isdirectory(src) {
    var ret = false;
    try {
        ret = commons_1.$length(src) && fs_1.statSync(src).isDirectory() ? true : false;
    }
    catch (_a) {
        ret = false;
    }
    return ret;
}
exports.$isdirectory = $isdirectory;
function $createDirectory(p) {
    if (!commons_1.$length(p)) {
        return false;
    }
    if ($isdirectory(p)) {
        return true;
    }
    if ($isfile(p)) {
        return false;
    }
    ;
    var ret = false;
    try {
        fs_1.mkdirSync(p, { recursive: true });
        ret = true;
    }
    catch (_a) {
        ret = false;
    }
    return ret;
}
exports.$createDirectory = $createDirectory;
function $filesize(src) {
    if (!$isfile(src))
        return 0;
    var stats = fs_1.statSync(src);
    return commons_1.$ok(stats) ? stats.size : 0;
}
exports.$filesize = $filesize;
function $uniquefile(src) {
    var rand = utils_crypto_1.$uuid();
    if (!commons_1.$length(src)) {
        return rand;
    }
    var ext = $ext(src);
    return commons_1.$length(ext) ? $withoutext(src) + "-" + rand + "." + ext : src + "-" + rand;
}
exports.$uniquefile = $uniquefile;
function $path() {
    var paths = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        paths[_i] = arguments[_i];
    }
    return path_1.join.apply(void 0, paths);
}
exports.$path = $path;
function $ext(s) {
    var e = path_1.extname(s);
    return commons_1.$length(e) ? e.slice(1) : '';
}
exports.$ext = $ext;
function $withoutext(s) {
    var e = path_1.extname(s);
    return commons_1.$length(e) ? s.slice(0, s.length - e.length) : s;
}
exports.$withoutext = $withoutext;
function $dir(s) { return path_1.dirname(s); }
exports.$dir = $dir;
function $filename(s) { return path_1.basename(s); }
exports.$filename = $filename;
function $loadJSON(src) {
    var ret = null;
    var loadedString = $readString(src);
    if (commons_1.$length(loadedString)) {
        try {
            ret = JSON.parse(loadedString);
            ret = commons_1.$ok(ret) ? ret : null;
        }
        catch (e) {
            console.log("Impossible to parse JSON file " + src);
            ret = null;
        }
    }
    return ret;
}
exports.$loadJSON = $loadJSON;
function $defaultpath() { return defaults_1.LocalDefaults.defaults().defaultPath; }
exports.$defaultpath = $defaultpath;
function $readString(src, encoding) {
    if (encoding === void 0) {
        encoding = 'utf-8';
    }
    var ret = null;
    if (commons_1.$length(src)) {
        try {
            ret = fs_1.readFileSync(src, commons_1.$length(encoding) ? encoding : 'utf-8');
        }
        catch (e) {
            ret = null;
        }
    }
    return ret;
}
exports.$readString = $readString;
function $writeString(src, str, encoding) {
    if (encoding === void 0) {
        encoding = 'utf-8';
    }
    var done = false;
    if (commons_1.$length(src)) {
        try {
            fs_1.writeFileSync(src, str, commons_1.$length(encoding) ? encoding : 'utf-8');
            done = true;
        }
        catch (e) {
            done = false;
        }
    }
    return done;
}
exports.$writeString = $writeString;
function $readBuffer(src) {
    var ret = null;
    if (commons_1.$length(src)) {
        try {
            ret = fs_1.readFileSync(src);
        } // readFile without any encoding option returns a buffer
        catch (e) {
            ret = null;
        }
    }
    return ret;
}
exports.$readBuffer = $readBuffer;
function $writeBuffer(src, buf) {
    var done = false;
    if (commons_1.$length(src)) {
        try {
            fs_1.writeFileSync(src, buf);
            done = true;
        }
        catch (e) {
            done = false;
        }
    }
    return done;
}
exports.$writeBuffer = $writeBuffer;
function $removeFile(src) {
    var done = false;
    if ($isfile(src)) {
        try {
            fs_1.unlinkSync(src);
            done = true;
        }
        catch (e) {
            done = false;
        }
    }
    return done;
}
exports.$removeFile = $removeFile;
/*
    src is a file
    dest is a file or a directory
    if it's a directory, it must exist and the src filename is used
 */
function $realMoveFile(src, dest) {
    console.log("$realMoveFile('" + src + "', '" + dest + "')");
    var done = false;
    if (commons_1.$length(src) && commons_1.$length(dest) && src !== dest && $isfile(src)) {
        if ($isdirectory(dest)) {
            dest = $path(dest, $filename(src));
            if (src === dest) {
                return false;
            }
        }
        try {
            fs_1.renameSync(src, dest);
            done = true;
        }
        catch (e) {
            console.log("File rename error " + e.message);
            done = false;
        }
        if (!done) {
            // rename function did not work, so we will try to copy
            // the file
            try {
                fs_1.copyFileSync(src, dest);
                fs_1.unlinkSync(src);
                done = true;
            }
            catch (e) {
                console.log("File copy error " + e.message);
                done = false;
            }
        }
    }
    return done;
}
exports.$realMoveFile = $realMoveFile;
function $copyFile(src, dest, overwrite) {
    if (overwrite === void 0) {
        overwrite = false;
    }
    console.log("$copyFile('" + src + "', '" + dest + "')");
    var done = false;
    if (commons_1.$length(src) && commons_1.$length(dest) && src !== dest && $isfile(src)) {
        if ($isdirectory(dest)) {
            dest = $path(dest, $filename(src));
        }
        if (src === dest || $isdirectory(dest) || (!overwrite && $isfile(dest))) {
            return false;
        }
        try {
            fs_1.copyFileSync(src, dest, (overwrite ? 0 : fs_1.constants.COPYFILE_EXCL));
            done = true;
        }
        catch (e) {
            console.log("File copy error " + e.message);
            done = false;
        }
    }
    return done;
}
exports.$copyFile = $copyFile;
//# sourceMappingURL=utils_fs.js.map