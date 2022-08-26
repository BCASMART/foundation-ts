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
import { $isstring, $isunsigned, $length, $ok, $trim } from './commons';
import { $tmp } from './tsdefaults';
import { $uuid } from './crypto';
import { $inbrowser } from './utils';
import { TSData } from './tsdata';
import { TSError } from './tserrors';
import { Nullable } from './types';

// if $stats() returns null it means that the path does not exist.
export function $stats(src:Nullable<string>):Nullable<Stats> {
    if ($inbrowser()) { throw 'unavailable $stats() function in browser' ; }
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
    if ($inbrowser()) { throw 'unavailable $isfile() function in browser' ; }
    const stats = $stats(src) ;
    return $ok(stats) ? stats!.isFile() : false ;
}

export function $isexecutable(src:Nullable<string>):boolean { 
    if ($inbrowser()) { throw 'unavailable $isexecutable() function in browser' ; }
    return $isfile(src) && _safeCheckPermissions(src, constants.R_OK | constants.X_OK) ; 
}

export function $isreadable(src:Nullable<string>):boolean { 
    if ($inbrowser()) { throw 'unavailable $isreadable() function in browser' ; }
    return $ok($stats(src)) && _safeCheckPermissions(src, constants.R_OK) ; 
}

export function $chmod(src:Nullable<string>, mode:number):boolean {
    if ($inbrowser()) { throw 'unavailable $chmod() function in browser' ; }
    let ret:boolean = false ;
    if ($length(src) && $isunsigned(mode) && mode <= 0o777) {
        try { chmodSync(src!, mode) ; ret = true ;}
        catch { ret = false }
    }
    return ret ;
}

export function $iswritable(src:Nullable<string>):boolean { 
    if ($inbrowser()) { throw 'unavailable $iswritable() function in browser' ; }
    return $ok($stats(src)) && _safeCheckPermissions(src, constants.W_OK) ; 
}


export function $isdirectory(src:Nullable<string>):boolean {
    if ($inbrowser()) { throw 'unavailable $isdirectory() function in browser' ; }
    const stats = $stats(src) ;
    return $ok(stats) ? stats!.isDirectory() : false ;
}

export function $createDirectory(p:Nullable<string>):boolean
{
    if ($inbrowser()) { throw 'unavailable $createDirectory() function in browser' ; }
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
    if ($inbrowser()) { throw 'unavailable $filesize() function in browser' ; }
    const stats = $stats(src) ;
    return $ok(stats) ? stats!.size : 0 ;
}

export function $temporarypath(ext:Nullable<string>='', src:Nullable<string>='') : string 
{
    if ($inbrowser()) { throw 'unavailable $temporarypath() function in browser' ; }
    ext = $trim(ext) ;
    let file = $uniquefile(src) ;
    if ($length(ext)) { file = $newext(file, ext) ; }
    return $path($tmp(), file) ;
}

export function $uniquefile(src?:Nullable<string>, e:Nullable<string>=undefined, internalImplementation:boolean=false) : string
{
	const rand = $uuid() ;
    e = $trim(e) ;
	if (!$length(src)) { return $newext(rand, e, internalImplementation) ; }
	const finalExt = e.length ? e : $ext(src) ;
    return $newext(`${$withoutext(src, internalImplementation)}-${rand}`, finalExt, internalImplementation) ;
}

export function $isabsolutepath(src?:Nullable<string>, internalImplementation:boolean=false) : boolean {
    return $length(src) ? (internalImplementation || $inbrowser() ? src!.startsWith('/') : isAbsolute(src!)): false ;
}

export function $normalizepath(src?:Nullable<string>, internalImplementation:boolean=false) : string {
    if (!$length(src)) { return '' ; }
    return internalImplementation || $inbrowser() ? $path(true, src!) : normalize(src!) ;
}

export function $path(first:string|boolean, ...paths:string[]): string {
    function _internalPath(...paths:string[]):string {
        if (paths.length > 0) {
            const isAbsolute = $isabsolutepath(paths[0], true) ;
            let comps:string[] = [] ;
            for (let p of paths) {
                if (p.length > 0) {
                    for (let s of p.split('/')) {
                        if (s === '..') {
                            if (comps.length > 0) {
                                if (comps[comps.length - 1] != '..') { comps.pop() ; }
                                else { comps.push('..') ; }
                            }
                            else if (!isAbsolute) { comps.push('..') ; }
                        } 
                        else if (s.length > 0 && s !== '.') { comps.push(s) ; }
                    }
                }
            }
            if (comps.length) {
                const s = comps.join('/') ;
                return isAbsolute ? '/' + s : s ;
            }
            else if (isAbsolute) { return '/' ; }
        }
        return '' ;
    }

    if (!$isstring(first)) {
        return (first as boolean) || $inbrowser() ? _internalPath(...paths) : join(...paths) ;
    }
    return $inbrowser() ? _internalPath(first as string, ...paths) : join(first as string, ...paths)
}

export function $ext(s:Nullable<string>, internalImplementation:boolean=false):string 
{ 
    if ($length(s)) { 
        if (internalImplementation || $inbrowser()) {
            const p = s!.lastIndexOf('.') ;
            return p >= 0 ? s!.slice(p+1) : '' ;
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
    if (internalImplementation || $inbrowser()) {
        const p = s!.lastIndexOf('/') ;
        return p === 0 ? '/' : (p > 0 ? s!.slice(0,p) : '.') ;
    }
    return dirname(s!) ; 
}
export function $filename(s:Nullable<string>, internalImplementation:boolean=false):string { 
    if (!$length(s)) { return '' ; } 
    if (internalImplementation || $inbrowser()) {
        const p = s!.lastIndexOf('/') ;
        return p >= 0 ? s!.slice(p+1) : s! ;
    }
    return basename(s!) ; 
}

export function $loadJSON(src:Nullable<string|Buffer>) : any | null
{
    if ($inbrowser()) { throw 'unavailable function in browser' ; }
	let ret = null ;
    if ($length(src)) {
        let loadedString = src instanceof Buffer ? src.toString('utf-8') : $readString(src, 'utf-8') ;
        if ($length(loadedString)) {
            try {
                ret = JSON.parse(<string>loadedString) ;
                ret = $ok(ret) ? ret : null ;
            }
            catch (e) {
                console.log(`Impossible to parse JSON file ${src}`) ;
                ret = null ;			
            }
        }    
    }
	return ret ;
}

export function $readString(src:Nullable<string>, encoding:BufferEncoding='utf-8') : string|null
{
    if ($inbrowser()) { throw 'unavailable $readString() function in browser' ; }
	let ret:string|null = null ;
	if ($length(src) && Buffer.isEncoding(encoding)) {
		try { ret = readFileSync(src!, encoding) ; }
		catch(e) { ret = null ; }
	}
	return ret ;
}

export interface BasicWriteOptions {
    attomically?:boolean,
    removePrecedentVersion?:boolean
}

export interface $writeStringOptions extends BasicWriteOptions {
    encoding?:BufferEncoding,
}

export function $writeString(src:Nullable<string>, str:string, opts:$writeStringOptions = {}):boolean {
    const [res,] = $fullWriteString(src, str, opts) ;
    return res ;
}

// returns [OK/KO and the name of the precedent version if it exists
export function $fullWriteString(src:Nullable<string>, str:string, opts:$writeStringOptions) : [boolean, string|null]
{
    if ($inbrowser()) { throw 'unavailable $writeString() function in browser' ; }
    let encoding = $length(opts.encoding) ? opts.encoding! : 'utf-8' ;
    if (!Buffer.isEncoding(encoding)) { return [false, null] ; }

    return $fullWriteBuffer(src, Buffer.from(str, encoding), opts as BasicWriteOptions )
}


export function $readBuffer(src:Nullable<string>) : Buffer|null
{
    if ($inbrowser()) { throw 'unavailable $readBuffer() function in browser' ; }
	let ret:Buffer|null = null ;
	if ($length(src)) {
		try { ret = <Buffer>readFileSync(<string>src) ; } // readFile without any encoding option returns a buffer
		catch(e) { ret = null ; }
	}
	return ret ;
}

export function $readData(src:Nullable<string>) : TSData|null
{
    if ($inbrowser()) { throw 'unavailable $readData() function in browser' ; }
    const buf = $readBuffer(src) ;
    return $ok(buf) ? new TSData(buf, { dontCopySourceBuffer:true }) : null ;
}
export interface $writeBufferOptions extends BasicWriteOptions {
    byteStart?:number,
    byteEnd?:number
}

export function $writeBuffer(src:Nullable<string>, buf:TSData|NodeJS.ArrayBufferView, opts:$writeBufferOptions = {}):boolean {
    const [res,] = $fullWriteBuffer(src, buf, opts) ;
    return res ;
}

// returns [OK/KO and the name of the precedent version if it exists
export function $fullWriteBuffer(src:Nullable<string>, buf:TSData|NodeJS.ArrayBufferView, opts:$writeBufferOptions) : [boolean, string|null]
{
    if ($inbrowser()) { throw 'unavailable $writeBuffer() function in browser' ; }
	let done = false ;
    let precedent:string|null = null ;

    let start = $ok(opts.byteStart) ? opts.byteStart : 0 ;
    let end   = $ok(opts.byteEnd) ? opts.byteEnd : buf.byteLength ; 

    if ($length(src) && $isunsigned(start) || !$isunsigned(end)) {
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
                    if (retries > MAX_TRY) { throw `Tried to fs.writeSync() ${retries} times without any success.` ; }
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
                    // destroy anything and will throw an Error will all the infos in it 
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
    if ($inbrowser()) { throw 'unavailable $localRenameFile() function in browser' ; }
    return $length(src) > 0 && $length(dest) > 0 && src !== dest && $isfile(src) && _safeRename(src!, dest!) ;
}

export function $removeFile(src:Nullable<string>) : boolean
{
    if ($inbrowser()) { throw 'unavailable $removeFile() function in browser' ; }
    return $length(src) > 0 && $isfile(src) && _safeUnlink(src!) ;
}

/*
	src is a file
	dest is a file or a directory
	if it's a directory, it must exist and the src filename is used
 */
export function $realMoveFile(src:Nullable<string>, dest:Nullable<string>) : boolean
{
    if ($inbrowser()) { throw 'unavailable $realMoveFile() function in browser' ; }
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
    if ($inbrowser()) { throw 'unavailable $copyFile() function in browser' ; }
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
