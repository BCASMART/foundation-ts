/**
 * 	All File System operations are maint to be in this file
 *  This means that no import of 'fs' module shouls apear elsewere
 *
 *  We also tries to use sync functions in order not to publish async functions
 *  for those basic stiff. It could be changed at any moment
 *  by using fs.promises...
 */
import { copyFileSync, mkdirSync, readFileSync, renameSync, statSync, unlinkSync, writeFileSync, constants } from 'fs';
import { basename, dirname, extname, join } from 'path';
import { $length, $ok } from './commons';
import { LocalDefaults } from './defaults';
import { $uuid } from './utils_crypto';
export function $isfile(src) {
    let ret = false;
    try {
        ret = $length(src) && statSync(src).isFile() ? true : false;
    }
    catch (_a) {
        ret = false;
    }
    return ret;
}
export function $isdirectory(src) {
    let ret = false;
    try {
        ret = $length(src) && statSync(src).isDirectory() ? true : false;
    }
    catch (_a) {
        ret = false;
    }
    return ret;
}
export function $createDirectory(p) {
    if (!$length(p)) {
        return false;
    }
    if ($isdirectory(p)) {
        return true;
    }
    if ($isfile(p)) {
        return false;
    }
    ;
    let ret = false;
    try {
        mkdirSync(p, { recursive: true });
        ret = true;
    }
    catch (_a) {
        ret = false;
    }
    return ret;
}
export function $filesize(src) {
    if (!$isfile(src))
        return 0;
    let stats = statSync(src);
    return $ok(stats) ? stats.size : 0;
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
    const e = extname(s);
    return $length(e) ? e.slice(1) : '';
}
export function $withoutext(s) {
    const e = extname(s);
    return $length(e) ? s.slice(0, s.length - e.length) : s;
}
export function $dir(s) { return dirname(s); }
export function $filename(s) { return basename(s); }
export function $loadJSON(src) {
    let ret = null;
    let loadedString = $readString(src);
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
    return ret;
}
export function $defaultpath() { return LocalDefaults.defaults().defaultPath; }
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
    console.log(`$realMoveFile('${src}', '${dest}')`);
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
        catch (e) {
            console.log(`File rename error ${e.message}`);
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
            catch (e) {
                console.log(`File copy error ${e.message}`);
                done = false;
            }
        }
    }
    return done;
}
export function $copyFile(src, dest, overwrite = false) {
    console.log(`$copyFile('${src}', '${dest}')`);
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
        catch (e) {
            console.log(`File copy error ${e.message}`);
            done = false;
        }
    }
    return done;
}
//# sourceMappingURL=utils_fs.js.map