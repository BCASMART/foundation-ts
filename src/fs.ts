/**
 * 	All File System operations are maint to be in this file
 *  This means that no import of 'fs' module shouls apear elsewere
 * 
 *  We also tries to use sync functions in order not to publish async functions
 *  for those basic stiff. It could be changed at any moment
 *  by using fs.promises... 
 */

import {
    copyFileSync,
    mkdirSync,
    readFileSync,
    renameSync,
    statSync,
    accessSync,
    unlinkSync,
    openSync,
    writeSync,
    constants,
    closeSync,
    Stats,
    chmodSync,
    StatOptions,
    rmSync
} from 'fs'  // NOSONAR: no 'node:' prefix for webpack 5

import {
    basename,
    dirname,
    extname,
    join,
    isAbsolute,
    normalize,
    resolve,
    sep
} from 'path'; // NOSONAR: no 'node:' prefix for webpack 5

import { homedir } from 'os';  // NOSONAR: no 'node:' prefix for webpack 5

import { $isbool, $isstring, $isunsigned, $length, $ok, $strings, $value, $valueornull } from './commons';
import { $tmp } from './tsdefaults';
import { $uuid } from './crypto';
import { $inbrowser, $jsonparse } from './utils';
import { TSData } from './tsdata';
import { TSError } from './tserrors';
import { Nullable, StringEncoding } from './types';
import { $asciifs, $ftrim } from './strings';
import { $charset, TSCharset } from './tscharset';
import { $arrayset } from './array';
import { $declareMethods } from "./object";

/**
 * WARNING: paths functions internalImplementation does not exist on Windows,
 * so, passing internalImplementation boolean to true in $... path oriented
 * functions make them use internal posix-like implementation
 */

// if $stats() returns null it means that the path does not exist.
// statSync(..., { throwIfNoEntry: false }) (Node >= 15.3) returns undefined
// instead of throwing on the "doesn't exist" case (ENOENT, and also ENOTDIR
// when a parent path component isn't a directory), which is the hot path for
// callers like $isfile/$isdirectory/$isreadable and any cache-miss lookup :
// no exception machinery on every miss. Anything else genuinely unexpected
// (EACCES, ELOOP, ...) still throws, exactly as before.
export function $stats(src: Nullable<string>): Nullable<Stats> {
    TSError.assertNotInBrowser('$stats');
    if ($length(src)) {
        return statSync(src!, { throwIfNoEntry: false }) ?? null;
    }
    return null;
}
export interface CommonStats {
    accessedAt:number|bigint ;  // ms from Epoch
    changedAt:number|bigint ;   // ms from Epoch
    createdAt:number|bigint ;   // ms from Epoch
    directory:boolean ;
    executable:boolean ;
    exists:boolean ;
    file:boolean ;
    gid:number|bigint ;
    mode:number|bigint ;
    modifiedAt:number|bigint ;   // ms from Epoch
    readable:boolean ;
    size:number|bigint ;        // Bytes
    uid:number|bigint ;
    writable:boolean ;
} ;

const DoesNotExistCommonStats:CommonStats = {
    accessedAt:0,
    changedAt:0,
    createdAt:0,
    directory:false,
    executable:false,
    exists:false,
    file:false,
    gid:-1,
    mode:0,
    modifiedAt:0,
    readable:false,
    size:0,
    uid:-1,
    writable:false
}

export function $commonstats(src: Nullable<string>, opts?:Nullable<StatOptions>):CommonStats {
    TSError.assertNotInBrowser('$commonstats') ;
    if (!$length(src)) { return DoesNotExistCommonStats ; }
    const stats = statSync(src!, { ...($ok(opts) ? opts! : {}), throwIfNoEntry: false }) ;
    if (!$ok(stats)) { return DoesNotExistCommonStats ; }
    return {
        exists:true,
        uid:stats!.uid,
        gid:stats!.gid,
        directory:stats!.isDirectory(),
        file:stats!.isFile(),
        size:stats!.size,
        mode:stats!.mode,
        changedAt: stats!.ctimeMs,
        modifiedAt: stats!.mtimeMs,
        accessedAt: stats!.atimeMs,
        createdAt: stats!.birthtimeMs,
        readable:_safeCheckPermissions(src, constants.R_OK),
        writable:_safeCheckPermissions(src, constants.W_OK),
        executable:_safeCheckPermissions(src, constants.X_OK),
    }
}

export function $isfile(src: Nullable<string>): boolean {
    TSError.assertNotInBrowser('$isfile');
    const stats = $stats(src);
    return $ok(stats) ? stats!.isFile() : false;
}

export function $isexecutable(src: Nullable<string>): boolean {
    TSError.assertNotInBrowser('$isexecutable');
    return $ok(src) && _safeCheckPermissions(src, constants.X_OK);
}

export function $isexecutablefile(src: Nullable<string>): boolean {
    TSError.assertNotInBrowser('$isexecutablefile');
    return $isfile(src) && _safeCheckPermissions(src, constants.X_OK);
}

export function $isreadable(src: Nullable<string>): boolean {
    TSError.assertNotInBrowser('$isreadable');
    return $ok($stats(src)) && _safeCheckPermissions(src, constants.R_OK);
}

export function $chmod(src: Nullable<string>, mode: number): boolean {
    TSError.assertNotInBrowser('$chmod');
    let ret: boolean = false;
    if ($length(src) && $isunsigned(mode, 0o777) && mode > 0) {
        try { chmodSync(src!, mode); ret = true; }
        catch { ret = false }
    }
    return ret;
}

export function $iswritable(src: Nullable<string>): boolean {
    TSError.assertNotInBrowser('$iswritable');
    return $ok($stats(src)) && _safeCheckPermissions(src, constants.W_OK);
}


export function $isdirectory(src: Nullable<string>): boolean {
    TSError.assertNotInBrowser('$isdirectory');
    const stats = $stats(src);
    return $ok(stats) ? stats!.isDirectory() : false;
}

export function $createDirectory(p: Nullable<string>, wantedMode?:Nullable<number>, errors?:Nullable<string[]>): boolean {
    TSError.assertNotInBrowser('$createDirectory');
    let mode = $value(wantedMode, 0o755);
    if (!$length(p)) {
        errors?.push('Invalid directory path');
        return false ;
    }
    if (!$isunsigned(mode, 0o777) || mode === 0) {
        errors?.push(`Invalid mode 0o${mode.toString(8)}`);
        return false;
    }
    const stats = $stats(p);
    if ($ok(stats)) { 
        if (stats.isDirectory()) { 
            if (!$ok(wantedMode) || (stats.mode & 0o777) === mode) { // stats.mode also holds the file type bits
                return true ; // folder is here and mode matches (or no specific mode was requested)
            }
            errors?.push(`Path exists and is a directory but mode does not match: "${p}"`);
            return false
        }
        if (stats.isFile()) { 
            errors?.push(`Path exists and is a file: "${p}"`); 
        }
        else {
            errors?.push(`Something exists already at this location: "${p}"`);
        }
        return false ;
    }

    let ret: boolean = false;
    try {
        mkdirSync(p!, { recursive: true, mode:mode });
        ret = true;
    }
    catch (e:any) {
        errors?.push(e.message);
        ret = false; 
    }
    return ret ; 
}

export function $filesize(src: Nullable<string>): number {
    TSError.assertNotInBrowser('$filesize');
    const stats = $stats(src);
    return $ok(stats) ? stats!.size : 0;
}

export function $temporarypath(ext: Nullable<string> = '', src: Nullable<string> = ''): string {
    TSError.assertNotInBrowser('$temporarypath');
    ext = $ftrim(ext);
    let file = $uniquefile(src);
    if ($length(ext)) { file = $newext(file, ext); }
    return $path($tmp(), file);
}

export function $uniquefile(src?: Nullable<string>, ext: Nullable<string> = undefined, internalImplementation: boolean = false): string {
    const rand = $uuid();
    ext = $ftrim(ext);
    if (!$length(src)) { return $newext(rand, ext, internalImplementation); }
    const finalExt = ext.length ? ext : $ext(src);
    return $newext(`${$withoutext(src, internalImplementation)}-${rand}`, finalExt, internalImplementation);
}

export function $isabsolutepath(src?: Nullable<string>, internalImplementation: boolean = false): boolean {
    if (!$length(src)) { return false ; }
    return internalImplementation || $inbrowser() ? src!.startsWith('/') : isAbsolute(src!) ;
}
export { $isabsolutepath as $isabsolute }

export function $normalizepath(src?: Nullable<string>, internalImplementation: boolean = false): string {
    if (!$length(src)) { return '.'; }
    if (internalImplementation || $inbrowser()) {
        const p = _internalPath(src!) ;
        return p !== '/' && src!.endsWith('/') && !p.endsWith('/') ? p + '/' : p ;
    }
    return normalize(src!);
}

export function $fromposix(src?:Nullable<string>):string {
    if (!$length(src)) { return '' ; }
    return sep === '\\' ? src!.split('/').join(sep) : src! ;
}

/**
 * There's no usage of internalImplementation 
 * boolean parameter in $absolute() function
 * because this cannot works if we are on a browser
 * and if we want to concatenate homedir and curdir, we need
 * to use the FS standard implementation
 * $absolute() accepts unix relative paths even in windows environment
 * (contrary is not true because '\\' is considered as a plain char in unix)
 */
export function $absolute(src: Nullable<string>): string {
    TSError.assertNotInBrowser('$absolute') ;

    if (!$length(src) || src === '.') { return $currentdirectory(); }
    if ($isabsolutepath(src)) { return src!; }
    if (src!.startsWith('~')) { return $path($homedirectory(), $fromposix(src!.slice(1))); }
    return $path($currentdirectory(), $fromposix(src));
}

export function $homedirectory(): string {
    TSError.assertNotInBrowser('$currentdirectory');
    const p = homedir() ;
    return p.endsWith(sep) ? p : p + sep ;
}

export function $currentdirectory(): string {
    TSError.assertNotInBrowser('$currentdirectory');
    const p = resolve(process.cwd());
    return p.endsWith(sep) ? p : p + sep ;
}

export function $path(first: string | boolean, ...paths: string[]): string {
    if ($isbool(first)) {
        return first || $inbrowser() ? _internalPath(...paths) : join(...paths) ;
    }
    return $inbrowser() ? _internalPath(first, ...paths) : join(first, ...paths) ;
}

export function $ext(s: Nullable<string>, internalImplementation: boolean = false): string {
    if ($length(s)) {
        if (internalImplementation || $inbrowser()) {
            const slash = s!.lastIndexOf('/');
            const dot = s!.lastIndexOf('.');
            return dot > slash + 1 ? s!.slice(dot + 1) : '';
        }
        else {
            const e = extname(s!);
            if ($length(e)) { return e.slice(1); }
        }
    }
    return '';
}

export function $extset(extensions:Nullable<string|string[]>, transform:(s:string) => string = s => s.toLowerCase()):Set<string> {
    return $arrayset($strings(extensions), (e) => { 
        e = $ftrim(e) ; 
        if (e.startsWith('.')) { e = e.slice(1) ; }
        if (e.length > 0) { e = transform(e) ; }
        return e.length > 0 ? e : null ; 
    }) ;
}

export function $withoutext(s: Nullable<string>, internalImplementation?: boolean): string {
    if (!$length(s)) { return ''; }
    const e = $ext(s, internalImplementation);
    s = e.length ? s!.slice(0, s!.length - e.length) : s!;
    return s.length && s.endsWith('.') ? s.slice(0, - 1) : s;
}

export function $newext(s: Nullable<string>, e: Nullable<string> = undefined, internalImplementation?: boolean): string {
    let b = $withoutext(s, internalImplementation);
    return $length(e) ? `${b}.${e}` : b;
}

export function $dir(source: Nullable<string>, internalImplementation: boolean = false): string {
    let len = $length(source);
    if (!len) { return '.'; }
    let s = source!;

    if (!internalImplementation && !$inbrowser()) {
        return dirname(s!);
    }

    let start = 0;
    while (start < len && s.charAt(start) === '/') { start++ }
    if (start === len) { return '/'; } else if (len === 1) { return '.'; }

    let end = len - 1;
    while (end > start && s.charAt(end) === '/') { end-- };
    end++;
    if (start === 0 && end === len) {
        const slash = s.lastIndexOf('/');
        return slash > 0 ? s.slice(0, slash) : '.';
    }

    const t = s.slice(start, end);
    const slash = t.lastIndexOf('/');
    if (slash > 0) { return s.slice(0, start) + t.slice(0, slash) ; }
    return start > 0 ? s.slice(0, start) : '.' ;
}

export function $safeFilename(s: Nullable<string>, posix:boolean = false, internalImplementation: boolean = false): string 
{ return $asciifs($filename(s, internalImplementation), posix) ; }

export function $filename(s: Nullable<string>, internalImplementation: boolean = false): string {
    let len = $length(s);
    if (!len) { return ''; }

    if (!internalImplementation && !$inbrowser()) {
        return basename(s!);
    }

    let end = len - 1;
    while (end >= 0 && s!.charAt(end) === '/') { end-- };
    end++;
    if (end === 0) { return ''; }
    else if (end < len) { s = s!.slice(0, end); }
    const slash = s!.lastIndexOf('/');
    return slash >= 0 ? s!.slice(slash + 1) : s!;
}

// JSON buffer is always considered as UTF8 buffer
// we now don't read data here: use $jsonparse() instead
// we also now can use standard reviver function for $jsonparse()
export function $loadJSON(source: Nullable<string>, acceptedExtensions?:Nullable<string|string[]>, reviver?: (this: any, key: string, value: any) => any): any
{
    TSError.assertNotInBrowser('$loadJSON') ;
    if (!$isstring(source) || !source.length) { return null ; }

    const extensions = $extset(acceptedExtensions) ;
    if (extensions.size === 0) { extensions.add('json') ; } // if no extensions, we accept json
    source = extensions.has($ext(source)) ? $readString(source, TSCharset.utf8Charset()) : '' ;    

    return $valueornull($jsonparse(source, true, reviver)) ; // strips by default
}

export function $readString(src: Nullable<string>, encoding?: Nullable<StringEncoding | TSCharset>): string | null {
    TSError.assertNotInBrowser('$readString');
    const buffer = $readBuffer(src);
    return $ok(buffer) ? $charset(encoding).stringFromData(buffer!) : null;
}

export interface BasicWriteOptions { 
    attomically?: Nullable<boolean>; // NOSONAR: optional
    removePrecedentVersion?: Nullable<boolean>; // NOSONAR: optional
    mode?: Nullable<number>; // NOSONAR: optional
    errors?: Nullable<string[]>; // NOSONAR: optional. when set, every error encountered (not warnings) is pushed here
}

export interface TSWriteStringOptions extends BasicWriteOptions {
    encoding?: Nullable<StringEncoding | TSCharset>, // NOSONAR: optional
    stringStart?: Nullable<number>, // NOSONAR: optional
    stringEnd?: Nullable<number> // NOSONAR: optional
}
/** @deprecated use TSWriteStringOptions */
export type $writeStringOptions = TSWriteStringOptions ;

export function $writeString(src: Nullable<string>, str: string, opts: TSWriteStringOptions = {}): boolean {
    TSError.assertNotInBrowser('$writeString');
    const [res,] = $fullWriteString(src, str, opts);
    return res;
}

// returns [OK/KO and the name of the precedent version if it exists
export function $fullWriteString(src: Nullable<string>, str: string, opts: TSWriteStringOptions): [boolean, string | null] {
    TSError.assertNotInBrowser('$fullWriteString');
    return $fullWriteBuffer(src, $charset(opts.encoding).dataFromString(str, opts.stringStart, opts.stringEnd), opts as BasicWriteOptions)
}


export function $readBuffer(src: Nullable<string>): Buffer | null {
    TSError.assertNotInBrowser('$readBuffer');
    let ret: Buffer | null = null;
    if ($length(src)) {
        try { ret = <Buffer>readFileSync(<string>src); } // readFile without any encoding option returns a buffer
        catch (e) { ret = null; }
    }
    return ret;
}

export function $readData(src: Nullable<string>): TSData | null {
    TSError.assertNotInBrowser('$readData');
    const buf = $readBuffer(src);
    return $ok(buf) ? new TSData(buf, { dontCopySourceBuffer: true }) : null;
}

export interface TSWriteBufferOptions extends BasicWriteOptions {
    byteStart?: number,
    byteEnd?: number
}
/** @deprecated use TSWriteBufferOptions */
export type $writeBufferOptions = TSWriteBufferOptions ;

export function $writeBuffer(src: Nullable<string>, buf: TSData | NodeJS.ArrayBufferView, opts: TSWriteBufferOptions = {}): boolean {
    TSError.assertNotInBrowser('$writeBuffer');
    const [res,] = $fullWriteBuffer(src, buf, opts);
    return res;
}

// returns [OK/KO and the name of the precedent version if it exists
export function $fullWriteBuffer(src: Nullable<string>, buf: TSData | NodeJS.ArrayBufferView, opts: TSWriteBufferOptions): [boolean, string | null] {
    TSError.assertNotInBrowser('$fullWriteBuffer');
    let start = $ok(opts.byteStart) ? opts.byteStart! : 0;
    let end = $ok(opts.byteEnd) ? opts.byteEnd! : buf.byteLength;
    const mode = $ok(opts.mode) ? opts.mode! : 0o666;

    if (!$length(src) || !$isunsigned(start) || !$isunsigned(end) || !$isunsigned(mode)) {
        _writeFailure(opts, `$fullWriteBuffer(): bad parameters for '${src}' (path, byteStart, byteEnd or mode).`) ;
        return [false, null];
    }

    const pathToWrite = opts.attomically ? $uniquefile(src) : src!;
    end = Math.min(end, buf.byteLength);
    start = Math.min(start, end);
    const stats = $stats(src) ;

    if ($ok(stats) && !stats!.isFile()) {
        _writeFailure(opts, `$fullWriteBuffer(): '${src}' exists and is not a regular file.`) ;
        return [false, null];
    }

    // never move the next line of code before this point because
    // TSData.byteLength may be different from its internal storage buffer length
    // warning: this method works because it's not async so we can
    // consider that TSData is immutable during this scope
    const data = buf instanceof TSData ? buf.internalStorage[0] : buf ;

    if (!_writeFileRange(src!, pathToWrite, data, start, end, mode, opts)) { return [false, null]; }
    if (!opts.attomically) { return [true, null]; }
    return $ok(stats) ? _atomicReplaceFile(src!, pathToWrite, opts) : [_atomicRenameFile(src!, pathToWrite, opts), null];
}

function _writeFailure(opts: TSWriteBufferOptions, message: string) { if (opts.errors) { opts.errors.push(message); } }

// writes data[start..end[ in pathToWrite. returns false on failure
function _writeFileRange(src: string, pathToWrite: string, data: NodeJS.ArrayBufferView, start: number, end: number, mode: number, opts: TSWriteBufferOptions): boolean {
    try {
        const fd = openSync(pathToWrite, 'w', mode);
        try { _writeAll(fd, src, data, start, end, opts) ; }
        finally { closeSync(fd); }
        return true ;
    }
    catch (e) {
        _writeFailure(opts, `$fullWriteBuffer(): unable to write file '${pathToWrite}' (${(e as Error)?.message ?? e}).`) ;
        return false ;
    }
}

function _writeAll(fd: number, src: string, data: NodeJS.ArrayBufferView, start: number, end: number, opts: TSWriteBufferOptions) {
    const MAX_TRY = 3;
    let retries = 0;
    while (start < end) {
        const wlen = writeSync(fd, data, start, end - start);
        if (wlen === 0) { retries++; } else { retries = 0; } // we never should have wlen === 0 but ...
        if (retries > MAX_TRY) {
            const message = `$fullWriteBuffer(): tried to fs.writeSync() ${retries} times without any success.` ;
            _writeFailure(opts, message) ;
            TSError.throw(message, {
                path: src,
                buffer: data,
                options: opts
            });
        }
        start += wlen;
    }
}

// src exists: it is renamed, then replaced by the written file
function _atomicReplaceFile(src: string, pathToWrite: string, opts: TSWriteBufferOptions): [boolean, string | null] {
    const renamedExistingFile = $uniquefile(src);
    let done = _safeRename(src, renamedExistingFile, opts.errors);
    if (!done) {
        _writeFailure(opts, `$fullWriteBuffer(): unable to rename existing file '${src}' to '${renamedExistingFile}' before atomic replace.`) ;
    }
    if (done && !_safeRename(pathToWrite, src, opts.errors)) {
        // we immediately try to give back its name to our original file
        if (!_safeRename(renamedExistingFile, src, opts.errors)) {
            // we should have been able to give our initial file its original name back
            // but we could'nt do it, so, in this very hypothetical case, we will not
            // destroy anything and will throw an Error will all the info in it
            const message = `Unable to atomically finish writing file '${src}'` ;
            _writeFailure(opts, message) ;
            TSError.throw(message, {
                wantedPath: src,
                renamedExistingFile: renamedExistingFile,
                writtenDataFile: pathToWrite
            });
        }
        _writeFailure(opts, `$fullWriteBuffer(): unable to atomically replace '${src}' with the new content ; original file restored.`) ;
        done = false;
    }
    if (!done) {
        _removeTemporaryFile(pathToWrite, opts) ;
        return [false, null] ;
    }
    if (opts.removePrecedentVersion) {
        _safeUnlink(renamedExistingFile, opts.errors);
        return [true, null] ;
    }
    return [true, renamedExistingFile] ;
}

// src does not exist: the written file is simply renamed
function _atomicRenameFile(src: string, pathToWrite: string, opts: TSWriteBufferOptions): boolean {
    if (_safeRename(pathToWrite, src, opts.errors)) { return true ; }
    _writeFailure(opts, `$fullWriteBuffer(): unable to rename temporary file '${pathToWrite}' to '${src}'.`) ;
    _removeTemporaryFile(pathToWrite, opts) ;
    return false ;
}

function _removeTemporaryFile(pathToWrite: string, opts: TSWriteBufferOptions) {
    // we may let a newly created temporary file here if unlink does not succeed
    if (!_safeUnlink(pathToWrite, opts.errors)) { _writeFailure(opts, `$fullWriteBuffer(): temporary file '${pathToWrite}' could not be removed after a failed atomic write.`) ; }
}

export function $localRenameFile(src: Nullable<string>, dest: Nullable<string>, errors?: Nullable<string[]>): boolean {
    TSError.assertNotInBrowser('$localRenameFile');
    return $length(src) > 0 && $length(dest) > 0 && src !== dest && $isfile(src) && _safeRename(src!, dest!, errors);
}

export function $removeFile(src: Nullable<string>, errors?:Nullable<string[]>): boolean {
    TSError.assertNotInBrowser('$removeFile');
    return $length(src) > 0 && $isfile(src) && _safeUnlink(src!, errors);
}

// removeDirectory is always recursive
export function $removeDirectory(src: Nullable<string>, force?:Nullable<boolean>, errors?: Nullable<string[]>): boolean {
    TSError.assertNotInBrowser('$removeDirectory');
    return $length(src) > 0 && $isdirectory(src) && _safeRmdir(src!, !!force, errors) ;
}

/*
    src is a file
    dest is a file or a directory
    if it's a directory, it must exist and the src filename is used
 */
export function $realMoveFile(src: Nullable<string>, dest: Nullable<string>, errors?: Nullable<string[]>): boolean {
    TSError.assertNotInBrowser('$realMoveFile');
    if (!$length(src) || !$length(dest) || src === dest || !$isfile(src)) { return false ; }
    if ($isdirectory(dest)) {
        dest = $path(dest!, $filename(src));
        if (src === dest) { return false; }
    }
    // we dont want any error stored here since we may want to copy the file if rename fails
    if (_safeRename(src!, dest!, undefined)) { return true ; }
    // rename function did not work, so we will try to copy the file
    return _copyThenUnlink(src!, dest!, errors) ;
}

function _copyThenUnlink(src: string, dest: string, errors?: Nullable<string[]>): boolean {
    try { copyFileSync(src, dest); }
    catch (e:any) {
        errors?.push(`Failed to copy "${src}" to "${dest}" with error: ${e.message}`);
        return false ;
    }
    try { unlinkSync(src); }
    catch (e:any) {
        // WARNING: if we fails here, we may have made the copy() done properly but not the unlink()
        errors?.push(`Failed to unlink "${src}" after copying to "${dest}" with error: ${e.message}`);
        return false ;
    }
    return true ;
}

export function $copyFile(src: Nullable<string>, dest: Nullable<string>, overwrite: boolean = false): boolean {
    TSError.assertNotInBrowser('$copyFile');
    let done = false;
    if ($length(src) && $length(dest) && src !== dest && $isfile(src)) {
        if ($isdirectory(dest)) {
            dest = $path(dest!, $filename(src));
        }
        if (src === dest || $isdirectory(dest) || (!overwrite && $isfile(dest))) { return false; }
        try {
            copyFileSync(src!, dest!, (overwrite ? 0 : constants.COPYFILE_EXCL));
            done = true;
        }
        catch { done = false; }
    }
    return done;
}

function _safeRename(s: string, d: string, errors:Nullable<string[]>): boolean { 
    let done = false; 
    try { renameSync(s, d); done = true; } 
    catch (e:any) { 
        errors?.push(`System failed to rename "${s}" to "${d}" with error: ${e.message}`);
        done = false; 
    } 
    return done; 
}

function _safeUnlink(p: string, errors:Nullable<string[]>): boolean { 
    let done = false ; 
    try { 
        unlinkSync(p); 
        done = true; 
    } catch (e:any) { 
        errors?.push(`System failed to unlink "${p}" with error: ${e.message}`);
        done = false; 
    } return done ; 
}

function _safeRmdir(p: string, force:boolean, errors:Nullable<string[]>): boolean { 
    let done = false ; 
    try { 
        rmSync(p, { recursive: true, force: force }); 
        done = true; 
    } catch (e:any) { 
        errors?.push(`System failed to remove directory "${p}" with error: ${e.message}`);
        done = false; 
    } return done ; 
}


// this function should be only called if the result of stat() ot statsync() is defined.
function _safeCheckPermissions(src: Nullable<string>, permissions: number): boolean {
    let ret: boolean = false;
    try {
        // we cound use stats.mode but we should take care of who we are, so better to rely on accessSync(-)
        accessSync(src as string, permissions);
        ret = true;
    }
    catch { ret = false; }
    return ret;
}

function _internalPath(...paths: string[]): string {
    const n = paths.length;
    if (n === 0) { return ''; }
    const isAbsolute = paths[0].startsWith('/');
    const comps: string[] = []

    for (let p of paths[0].split('/')) { _addPathComponent(comps, p, isAbsolute); }
    for (let i = 1; i < n; i++) {
        const p = paths[i];
        if (p.length > 0) {
            for (let s of p.split('/')) { _addPathComponent(comps, s, isAbsolute); }
        }
    }
    if (comps.length) {
        const s = comps.join('/');
        return isAbsolute ? '/' + s : s;
    }
    return isAbsolute ? '/' : '';
}

function _addPathComponent(comps: string[], s: string, isAbsolute: boolean) {
    if (s === '..') {
        if (comps.length > 0) {
            if (comps.at(-1) !== '..') { comps.pop(); }
            else { comps.push('..'); }
        }
        else if (!isAbsolute) { comps.push('..'); }
    }
    else if (s.length > 0 && s !== '.') { comps.push(s); }
}

declare global {
    // all methodes automatically use standard implementation if available
    // all methods work in node environment and inside a browser
    export interface String {
        addPath:            (this: string, ...components:string[]) => string ;
        addPaths:           (this: string, ...components:string[]) => string ;
        ext:                (this: string) => string ;
        extension:          (this: string) => string ;
        directory:          (this: string) => string ;
        filename:           (this: string) => string ;
        hasExtension:       (this: string, e?:Nullable<string>) => boolean ; // this method is not case sensitive
        isAbsolutePath:     (this: string) => boolean ;
        newExtension:       (this: string, e?:Nullable<string>) => string ; 
        normalizePath:      (this: string) => string ;
        safeFilename:       (this: string) => string ;
    }
}

$declareMethods(String, {
    addPaths(this:string, ...comps:string[]):string
    { return $inbrowser() ? _internalPath(this, ...comps) : join(this, ... comps) ; },
}) ;
$declareMethods(String, {
    addPath:   String.prototype.addPaths,
    extension(this:string):string { return $ext(this) ; },
}) ;
$declareMethods(String, {
    ext:            String.prototype.extension,
    directory(this:string):string { return $dir(this) ; },
    filename(this:string):string { return $filename(this) ; },
    hasExtension(this:string, e?:Nullable<string>)
    {
        if (!$ok(e)) { e = '' ; }
        const ext = $ext(this) ;
        return e === ext || (e.length > 0 && e.toLowerCase() === ext.toLowerCase()) ; 
    },
    isAbsolutePath(this:string):boolean { return $isabsolutepath(this) ; },
    newExtension(this:string, e?:Nullable<string>):string { return $newext(this, e) ; },
    normalizePath(this:string):string { return $normalizepath(this) ; },
    safeFilename(this:string):string { return $safeFilename(this) ; },
}) ;
