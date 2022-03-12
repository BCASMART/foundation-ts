/**
 * 	All File System operations are maint to be in this file
 *  This means that no import of 'fs' module shouls apear elsewere
 *
 *  We also tries to use sync functions in order not to publish async functions
 *  for those basic stiff. It could be changed at any moment
 *  by using fs.promises...
 */
import { copyFileSync, mkdirSync, readFileSync, renameSync, statSync, accessSync, unlinkSync, writeFileSync, constants } from 'fs';
import { basename, dirname, extname, join } from 'path';
import { $length, $ok, $trim } from './commons';
import { LocalDefaults } from './defaults';
import { $uuid } from './utils_crypto';
export function $isfile(src) {
    let ret = false;
    if ($length(src)) {
        try {
            ret = statSync(src).isFile();
        }
        catch (_a) {
            ret = false;
        }
    }
    return ret;
}
export function $isexecutable(src) {
    let ret = false;
    if ($length(src)) {
        try {
            if (statSync(src).isFile()) {
                // we cound use stats.mode but we should take care of who we are, so better to rely on accessSync(-)
                accessSync(src, constants.R_OK | constants.X_OK);
                ret = true;
            }
        }
        catch (_a) {
            ret = false;
        }
    }
    return ret;
}
export function $isdirectory(src) {
    let ret = false;
    if ($length(src)) {
        try {
            ret = statSync(src).isDirectory();
        }
        catch (_a) {
            ret = false;
        }
    }
    return ret;
}
export function $createDirectory(p) {
    let ret = false;
    if ($length(p)) {
        try {
            const stats = statSync(p);
            ret = stats.isDirectory();
            if (!ret && !stats.isFile()) {
                mkdirSync(p, { recursive: true });
                ret = true;
            }
        }
        catch (_a) {
            ret = false;
        }
    }
    return ret;
}
export function $filesize(src) {
    let ret = 0;
    if ($length(src)) {
        try {
            ret = statSync(src).size;
        }
        catch (_a) {
            ret = 0;
        }
    }
    return ret;
}
export function $temporarypath(ext = '', src = '') {
    ext = $trim(ext);
    let file = $uniquefile(src);
    if ($length(ext)) {
        file = $newext(file, ext);
    }
    return $path(LocalDefaults.defaults().tmpDirectory, file);
}
export function $uniquefile(src) {
    const rand = $uuid();
    if (!$length(src)) {
        return rand;
    }
    const ext = $ext(src);
    return $length(ext) ? `${$withoutext(src)}-${rand}.${ext}` : `${src}-${rand}`;
}
export function $path(...paths) { return join(...paths); }
export function $ext(s) {
    if (!$length(s)) {
        const e = extname(s);
        if ($length(e)) {
            return e.slice(1);
        }
    }
    return '';
}
export function $withoutext(s) {
    if (!$length(s)) {
        return '';
    }
    const e = $ext(s);
    return e.length ? s.slice(0, s.length - e.length) : s;
}
export function $newext(s, e = undefined) {
    let b = $withoutext(s);
    return $length(e) ? `${b}.${e}` : b;
}
export function $dir(s) { return $length(s) ? dirname(s) : ''; }
export function $filename(s) { return $length(s) ? basename(s) : ''; }
export function $loadJSON(src) {
    let ret = null;
    if ($length(src)) {
        let loadedString = src instanceof Buffer ? src.toString('utf-8') : $readString(src, 'utf-8');
        if ($length(loadedString)) {
            try {
                ret = JSON.parse(loadedString);
                ret = $ok(ret) ? ret : null;
            }
            catch (e) {
                console.log(`Impossible to parse JSON file ${src}`);
                ret = null;
            }
        }
    }
    return ret;
}
export function $defaultpath() { return LocalDefaults.defaults().defaultPath; }
export function $defaulttmp() { return LocalDefaults.defaults().tmpDirectory; }
export function $readString(src, encoding = 'utf-8') {
    let ret = null;
    if ($length(src)) {
        try {
            ret = readFileSync(src, $length(encoding) ? encoding : 'utf-8');
        }
        catch (e) {
            ret = null;
        }
    }
    return ret;
}
export function $writeString(src, str, encoding = 'utf-8') {
    let done = false;
    if ($length(src)) {
        try {
            writeFileSync(src, str, $length(encoding) ? encoding : 'utf-8');
            done = true;
        }
        catch (e) {
            done = false;
        }
    }
    return done;
}
export function $readBuffer(src) {
    let ret = null;
    if ($length(src)) {
        try {
            ret = readFileSync(src);
        } // readFile without any encoding option returns a buffer
        catch (e) {
            ret = null;
        }
    }
    return ret;
}
export function $writeBuffer(src, buf) {
    let done = false;
    if ($length(src)) {
        try {
            writeFileSync(src, buf);
            done = true;
        }
        catch (e) {
            done = false;
        }
    }
    return done;
}
export function $removeFile(src) {
    let done = false;
    if ($isfile(src)) {
        try {
            unlinkSync(src);
            done = true;
        }
        catch (e) {
            done = false;
        }
    }
    return done;
}
/*
    src is a file
    dest is a file or a directory
    if it's a directory, it must exist and the src filename is used
 */
export function $realMoveFile(src, dest) {
    let done = false;
    if ($length(src) && $length(dest) && src !== dest && $isfile(src)) {
        if ($isdirectory(dest)) {
            dest = $path(dest, $filename(src));
            if (src === dest) {
                return false;
            }
        }
        try {
            renameSync(src, dest);
            done = true;
        }
        catch (_a) {
            done = false;
        }
        if (!done) {
            // rename function did not work, so we will try to copy
            // the file
            try {
                copyFileSync(src, dest);
                unlinkSync(src);
                done = true;
            }
            catch (_b) {
                done = false;
            } // WARNING: if we fails here, we may made the copy() but not the unlink()
        }
    }
    return done;
}
export function $copyFile(src, dest, overwrite = false) {
    let done = false;
    if ($length(src) && $length(dest) && src !== dest && $isfile(src)) {
        if ($isdirectory(dest)) {
            dest = $path(dest, $filename(src));
        }
        if (src === dest || $isdirectory(dest) || (!overwrite && $isfile(dest))) {
            return false;
        }
        try {
            copyFileSync(src, dest, (overwrite ? 0 : constants.COPYFILE_EXCL));
            done = true;
        }
        catch (_a) {
            done = false;
        }
    }
    return done;
}
//# sourceMappingURL=utils_fs.js.map