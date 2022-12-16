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
    chmodSync
}  from 'fs'

import {
	basename, 
	dirname,
	extname,
	join,
    isAbsolute,
    normalize 
} from 'path' ;
import { $isstring, $isunsigned, $length, $ok } from './commons';
import { $tmp } from './tsdefaults';
import { $uuid } from './crypto';
import { $inbrowser, $logterm } from './utils';
import { TSData } from './tsdata';
import { TSError } from './tserrors';
import { Nullable, StringEncoding, TSDataLike } from './types';
import { $ftrim } from './strings';
import { $charset, TSCharset } from './tscharset';
import { $bufferFromArrayBuffer } from './data';

const isWindows = process.platform === "win32";
const windowsAbsolutePathRegex = /^(([a-zA-Z]:|\\)\\).*/


// if $stats() returns null it means that the path does not exist.
export function $stats(src:Nullable<string>):Nullable<Stats> {
    TSError.assertNotInBrowser('$stats') ;
    if ($length(src)) {
        try { return statSync(src!) ; }
        catch (e) {
            if ((e as any)?.code === 'ENOENT') return null ;
            throw e ;
        }
    }
    return null ;
}

export function $isfile(src:Nullable<string>):boolean {
    TSError.assertNotInBrowser('$isfile') ;
    const stats = $stats(src) ;
    return $ok(stats) ? stats!.isFile() : false ;
}

export function $isexecutable(src:Nullable<string>):boolean { 
    TSError.assertNotInBrowser('$isexecutable') ;
    return $isfile(src) && _safeCheckPermissions(src, constants.R_OK | constants.X_OK) ; 
}

export function $isreadable(src:Nullable<string>):boolean { 
    TSError.assertNotInBrowser('$isreadable') ;
    return $ok($stats(src)) && _safeCheckPermissions(src, constants.R_OK) ; 
}

export function $chmod(src:Nullable<string>, mode:number):boolean {
    TSError.assertNotInBrowser('$chmod') ;
    let ret:boolean = false ;
    if ($length(src) && $isunsigned(mode) && mode <= 0o777) {
        try { chmodSync(src!, mode) ; ret = true ;}
        catch { ret = false }
    }
    return ret ;
}

export function $iswritable(src:Nullable<string>):boolean { 
    TSError.assertNotInBrowser('$iswritable') ;
    return $ok($stats(src)) && _safeCheckPermissions(src, constants.W_OK) ; 
}


export function $isdirectory(src:Nullable<string>):boolean {
    TSError.assertNotInBrowser('$isdirectory') ;
    const stats = $stats(src) ;
    return $ok(stats) ? stats!.isDirectory() : false ;
}

export function $createDirectory(p:Nullable<string>):boolean
{
    TSError.assertNotInBrowser('$createDirectory') ;
    let ret:boolean = false ;
    if ($length(p)) {
        const stats = $stats(p) ;
        if ($ok(stats) && stats!.isDirectory()) { ret = true ; }
        else if (!$ok(stats) || !stats!.isFile()) {
            try { 
                mkdirSync(p!, { recursive: true }) ; 
                ret = true ;
            } 
            catch { ret = false ; }
        }
    }
    return ret ;
}

export function $filesize(src:Nullable<string>) : number
{
    TSError.assertNotInBrowser('$filesize') ;
    const stats = $stats(src) ;
    return $ok(stats) ? stats!.size : 0 ;
}

export function $temporarypath(ext:Nullable<string>='', src:Nullable<string>='') : string 
{
    TSError.assertNotInBrowser('$temporarypath') ;
    ext = $ftrim(ext) ;
    let file = $uniquefile(src) ;
    if ($length(ext)) { file = $newext(file, ext) ; }
    return $path($tmp(), file) ;
}

export function $uniquefile(src?:Nullable<string>, e:Nullable<string>=undefined, internalImplementation:boolean=false) : string
{
	const rand = $uuid() ;
    e = $ftrim(e) ;
	if (!$length(src)) { return $newext(rand, e, internalImplementation) ; }
	const finalExt = e.length ? e : $ext(src) ;
    return $newext(`${$withoutext(src, internalImplementation)}-${rand}`, finalExt, internalImplementation) ;
}

export function $isabsolutepath(src?:Nullable<string>, internalImplementation:boolean=false) : boolean {
    const browser = $inbrowser() ;
    return $length(src) > 0 ? (internalImplementation || browser ? _isAbsolutePath(src!, !browser && isWindows) : isAbsolute(src!)) : false ;
}

export function $normalizepath(src?:Nullable<string>, internalImplementation:boolean=false) : string {
    if (!$length(src)) { return '' ; }
    return internalImplementation || $inbrowser() ? $path(true, src!) : normalize(src!) ;
}


export function $path(first:string|boolean, ...paths:string[]): string {
    const browser = $inbrowser() ;
    
    function _internalPath(...paths:string[]):string {
        const n = paths.length ;
        if (n > 0) {
            const [isAbsolute, prefix, sepa, firstComponents] = _internalPathComponents(paths[0], !browser && isWindows)
            const comps:string[] = []

            function _addComponent(comps:string[], s:string) {
                if (s === '..') {
                    if (comps.length > 0) {
                        if (comps[comps.length - 1] != '..') { comps.pop() ; }
                        else { comps.push('..') ; }
                    }
                    else if (!isAbsolute) { comps.push('..') ; }
                } 
                else if (s.length > 0 && s !== '.') { comps.push(s) ; }
            }
            
            for (let p of firstComponents) { _addComponent(comps, p) ; }
            for (let i = 1 ; i < n ; i++) {
                const p = paths[i] ;
                if (p.length > 0) {
                    for (let s of p.split(sepa)) { _addComponent(comps, s) ; }
                }
            }
            if (comps.length) {
                const s = comps.join(sepa) ;
                return isAbsolute ? prefix + s : s ;
            }
            else if (isAbsolute) { return prefix ; }
        }
        return '' ;
    }

    if (!$isstring(first)) {
        return (first as boolean) || browser ? _internalPath(...paths) : join(...paths) ;
    }
    return browser ? _internalPath(first as string, ...paths) : join(first as string, ...paths)
}

export function $ext(s:Nullable<string>, internalImplementation:boolean=false):string 
{ 
    if ($length(s)) { 
        const browser = $inbrowser() ;
        if (internalImplementation || browser) {
            const [,,,comps] = _internalPathComponents(s!, !browser && isWindows) ;
            if (!comps.length) { return '' ; }
            const search = comps.last()! ;
            const p = search.lastIndexOf('.') ;
            return p >= 0 ? search.slice(p+1) : '' ;
        }
        else {
            const e = extname(s!) ;
            if ($length(e)) { return e.slice(1) ; }
        }
    } 
	return '' ;
}

export function $withoutext(s:Nullable<string>, internalImplementation?:boolean):string
{
    if (!$length(s)) { return '' ;}
	const e = $ext(s, internalImplementation) ;
	s = e.length ? s!.slice(0, s!.length - e.length) : s! ;
    return s.length && s.charAt(s.length-1) === '.' ? s.slice(0, s!.length - 1) : s ;
}

export function $newext(s:Nullable<string>, e:Nullable<string>=undefined, internalImplementation?:boolean):string {
    let b = $withoutext(s, internalImplementation) ;
    return $length(e) ? `${b}.${e}` : b ;
}

export function $dir(s:Nullable<string>, internalImplementation:boolean=false):string { 
    if (!$length(s)) { return '' ; } 
    const browser = $inbrowser() ;
    if (internalImplementation || browser) {
        const [isAbsolute, prefix, sepa, comps] = _internalPathComponents(s!, !browser && isWindows) ;
        const n = comps.length ;
        if (n > 1) {
            const s = comps.slice(0, n - 1).join(sepa) ;
            return isAbsolute ? prefix + s : s ;
        }
        return isAbsolute ? prefix : '.' ; 
    }
    return dirname(s!) ; 
}

export function $filename(s:Nullable<string>, internalImplementation:boolean=false):string { 
    if (!$length(s)) { return '' ; } 
    const browser = $inbrowser() ;
    if (internalImplementation || browser) {
        const [,,,comps] = _internalPathComponents(s!, !browser && isWindows) ;
        const ret = comps!.last() ;
        return $ok(ret) ? ret! : ''
    }
    return basename(s!) ; 
}

export function $loadJSON(source:Nullable<string|TSDataLike>) : any | null
{
    const pathParameter = $isstring(source) ;
    if (pathParameter) { TSError.assertNotInBrowser('$loadJSON') ; }
	let ret = null ;
    const src = source instanceof ArrayBuffer ? $bufferFromArrayBuffer(source) : source ;
    if ($length(src)) {
        const charset = TSCharset.utf8Charset() ;
        let loadedString = pathParameter ? $readString(src as string, charset) : charset.stringFromData(source as TSDataLike) ;
        if ($length(loadedString)) {
            try {
                ret = JSON.parse(<string>loadedString) ;
                ret = $ok(ret) ? ret : null ;
            }
            catch (e) {
                if (pathParameter) { $logterm(`&R&w Impossible to parse JSON file &P ${src} &0`) ; }
                else { $logterm(`&R&w Impossible to parse &P ${src!.length} bytes &R given JSON buffer &0`) ; }
                ret = null ;			
            }
        }    
    }
	return ret ;
}

export function $readString(src:Nullable<string>, encoding?:Nullable<StringEncoding|TSCharset>) : string|null
{
    TSError.assertNotInBrowser('$readString') ;    
    const buffer = $readBuffer(src) ;
    return $ok(buffer) ? $charset(encoding).stringFromData(buffer!) : null ;
}

export interface BasicWriteOptions {
    attomically?:boolean,
    removePrecedentVersion?:boolean
}

export interface $writeStringOptions extends BasicWriteOptions {
    encoding?:Nullable<StringEncoding|TSCharset>,
    stringStart?:number,
    stringEnd?:number
}

export function $writeString(src:Nullable<string>, str:string, opts:$writeStringOptions = {}):boolean {
    TSError.assertNotInBrowser('$writeString') ;
    const [res,] = $fullWriteString(src, str, opts) ;
    return res ;
}

// returns [OK/KO and the name of the precedent version if it exists
export function $fullWriteString(src:Nullable<string>, str:string, opts:$writeStringOptions) : [boolean, string|null]
{
    TSError.assertNotInBrowser('$fullWriteString') ;
    return $fullWriteBuffer(src, $charset(opts.encoding).dataFromString(str, opts.stringStart, opts.stringEnd), opts as BasicWriteOptions )
}


export function $readBuffer(src:Nullable<string>) : Buffer|null
{
    TSError.assertNotInBrowser('$readBuffer') ;
	let ret:Buffer|null = null ;
	if ($length(src)) {
		try { ret = <Buffer>readFileSync(<string>src) ; } // readFile without any encoding option returns a buffer
		catch(e) { ret = null ; }
	}
	return ret ;
}

export function $readData(src:Nullable<string>) : TSData|null
{
    TSError.assertNotInBrowser('$readData') ;
    const buf = $readBuffer(src) ;
    return $ok(buf) ? new TSData(buf, { dontCopySourceBuffer:true }) : null ;
}
export interface $writeBufferOptions extends BasicWriteOptions {
    byteStart?:number,
    byteEnd?:number
}

export function $writeBuffer(src:Nullable<string>, buf:TSData|NodeJS.ArrayBufferView, opts:$writeBufferOptions = {}):boolean {
    TSError.assertNotInBrowser('$writeBuffer') ;
    const [res,] = $fullWriteBuffer(src, buf, opts) ;
    return res ;
}

// returns [OK/KO and the name of the precedent version if it exists
export function $fullWriteBuffer(src:Nullable<string>, buf:TSData|NodeJS.ArrayBufferView, opts:$writeBufferOptions) : [boolean, string|null]
{
    TSError.assertNotInBrowser('$fullWriteBuffer') ;
	let done = false ;
    let precedent:string|null = null ;

    let start = $ok(opts.byteStart) ? opts.byteStart : 0 ;
    let end   = $ok(opts.byteEnd) ? opts.byteEnd : buf.byteLength ; 

    if ($length(src) && $isunsigned(start) && $isunsigned(end)) {
        const pathToWrite = opts.attomically ? $uniquefile(src) : src! ;
        end = Math.min(end!, buf.byteLength) ;
        start = Math.min(start!, end) ;

        // never move the next line of code before this point because 
        // TSData.byteLength may be different from its internal storage buffer length
        // warning: this method works because it's not async so we can
        // consider that TSData is immutable during this scope
        if (buf instanceof TSData) { [buf,] = (buf as TSData).internalStorage ; }
	
		try {
            const fd = openSync(pathToWrite, 'w', 0o666) ;
            const MAX_TRY = 3 ;
            try {
                let retries = 0 ;
                while (start < end) {
                    const wlen = writeSync(fd, buf, start, end - start) ;
                    if (wlen === 0) { retries++ ; } else { retries = 0 ;} // we never should have wlen === 0 but ...
                    if (retries > MAX_TRY) { 
                        throw new TSError(`$fullWriteBuffer(): tried to fs.writeSync() ${retries} times without any success.`, {
                            path:src,
                            buffer:buf,
                            options:opts
                        }) ;
                    }
                    start += wlen ;
                }
    			done = true ;
            }
            finally {
                closeSync(fd) ;
            }
		}
		catch(e) {
			done = false ;
		}

        if (done && opts.attomically) {
            const renamedExistingFile = $uniquefile(src) ;
            done = _safeRename(src!, renamedExistingFile) ;
            if (done && !_safeRename(pathToWrite, src!)) {
                // we immediately try to give back its name to our original file
                if (!_safeRename(renamedExistingFile, src!)) {
                    // we should have been able to give our initial file its original name back
                    // but we could'nt do it, so, in this very hypothetical case, we will not
                    // destroy anything and will throw an Error will all the info in it 
                    throw new TSError(`Unable to atomically finish writing file '${src}'`, {
                        wantedPath:src,
                        renamedExistingFile:renamedExistingFile,
                        writtenDataFile:pathToWrite
                    }) ;
                }
                done = false ;
            }
            if (!done) { _safeUnlink(pathToWrite) ; } // we may let a newly created temporary file here if unlink does not succeed
            else if (opts.removePrecedentVersion) { _safeUnlink(renamedExistingFile) ; }
            else { precedent = renamedExistingFile ; }
        }        
	}
	return [done, precedent] ;
}

export function $localRenameFile(src:Nullable<string>, dest:Nullable<string>) : boolean {
    TSError.assertNotInBrowser('$localRenameFile') ;
    return $length(src) > 0 && $length(dest) > 0 && src !== dest && $isfile(src) && _safeRename(src!, dest!) ;
}

export function $removeFile(src:Nullable<string>) : boolean
{
    TSError.assertNotInBrowser('$removeFile') ;
    return $length(src) > 0 && $isfile(src) && _safeUnlink(src!) ;
}

/*
	src is a file
	dest is a file or a directory
	if it's a directory, it must exist and the src filename is used
 */
export function $realMoveFile(src:Nullable<string>, dest:Nullable<string>) : boolean
{
    TSError.assertNotInBrowser('$realMoveFile') ;
	let done = false ;
	if ($length(src) && $length(dest) && src !== dest && $isfile(src)) {
		if ($isdirectory(dest)) {
			dest = $path(dest!, $filename(src)) ;
			if (src === dest) { return false ; }
		}
        done = _safeRename(src!, dest!) ;
		if (!done) {
			// rename function did not work, so we will try to copy
			// the file
			try {
				copyFileSync(src!, dest!) ;
				unlinkSync(src!) ;
				done = true ;
			}	
			catch { done = false ; } // WARNING: if we fails here, we may have made the copy() but not the unlink()
		}
	}
	return done ;
}

export function $copyFile(src:Nullable<string>, dest:Nullable<string>, overwrite:boolean=false) : boolean
{
    TSError.assertNotInBrowser('$copyFile') ;
	let done = false ;
	if ($length(src) && $length(dest) && src !== dest && $isfile(src)) {
		if ($isdirectory(dest)) {
			dest = $path(dest!, $filename(src)) ;
		}
		if (src === dest || $isdirectory(dest) || (!overwrite && $isfile(dest))) { return false ; }
		try {
			copyFileSync(src!, dest!, (overwrite?0:constants.COPYFILE_EXCL)) ;
			done = true ;
		}	
        catch { done = false ; }
	}
	return done ;
}

function _safeRename(s:string, d:string):boolean { let done = false ; try { renameSync(s,d) ; done = true ; } catch { done = false ; } return done ; }

function _safeUnlink(p:string):boolean { let done = false ; try { unlinkSync(p) ; done = true ; } catch { done = false ; } return done ; }

function _safeCheckPermissions(src:Nullable<string>, permissions:number):boolean {
	let ret:boolean = false ;
    try {
        if (statSync(<string>src).isFile()) {
            // we cound use stats.mode but we should take care of who we are, so better to rely on accessSync(-)
            accessSync(src as string, permissions);
            ret = true ;
        }
    }
    catch { ret = false ; }    
	return ret ;
}

function _isAbsolutePath(s:string, windowsPath:boolean = false):boolean {
    return $length(s) > 0 && (
        (windowsPath && (s!.startsWith('\\') || windowsAbsolutePathRegex.test(s!))) ||
        (!windowsPath && s!.startsWith('/'))
    ) ;
}

function _internalPathComponents(s:string, windowsPath:boolean = false):[absolute:boolean, prefix:string, separator:string, components:string[]]
{
    const absolute = _isAbsolutePath(s, windowsPath) ;
    const sepa = windowsPath ? '\\' : '/' ;
    const components = s.split(sepa) ;
    if (windowsPath && absolute) {
        return s.startsWith(sepa+sepa) ?
            [true, sepa+sepa+components[2] + sepa, sepa, components.slice(3)] : // format \\server\path
            [true, components[0]+sepa, sepa, components.slice(1)] ; // format \toto or c:\toto. if \toto, we have components[0] === ''
    }
    return [absolute, sepa, sepa, absolute ? components.slice(1) : components] ;
}
