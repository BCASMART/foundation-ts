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
	writeFileSync,
	constants
}  from 'fs'

import {
	basename, 
	dirname,
	extname,
	join,
    isAbsolute,
    normalize 
} from 'path' ;
import { $isstring, $length, $ok, $trim } from './commons';
import { $tmp } from './tsdefaults';
import { $uuid } from './crypto';
import { $inbrowser } from './utils';
import { TSData } from './tsdata';

export function $isfile(src:string | null | undefined) {
    if ($inbrowser()) { throw 'unavailable $isfile() function in browser' ; }
	let ret:boolean = false ;
    if ($length(src)) {
        try { ret = statSync(<string>src).isFile() ; }
	    catch { ret = false ; }
    }
	return ret ;
}

export function $isexecutable(src:string | null | undefined) {
    if ($inbrowser()) { throw 'unavailable $isexecutable() function in browser' ; }
	let ret:boolean = false ;
    if ($length(src)) {
        try {
            if (statSync(<string>src).isFile()) {
                // we cound use stats.mode but we should take care of who we are, so better to rely on accessSync(-)
                accessSync(src as string, constants.R_OK | constants.X_OK);
                ret = true ;
            }
        }
        catch { ret = false ; }    
    }
	return ret ;
}


export function $isdirectory(src:string | null | undefined) {
    if ($inbrowser()) { throw 'unavailable $isdirectory() function in browser' ; }
	let ret:boolean = false ;
    if ($length(src)) {
        try { ret = statSync(<string>src).isDirectory() ; }
	    catch { ret = false ; }
    }
	return ret ;
}

export function $createDirectory(p:string|null|undefined) : boolean
{
    if ($inbrowser()) { throw 'unavailable $createDirectory() function in browser' ; }
    let ret:boolean = false ;
    if ($length(p)) {
        try { 
            const stats = statSync(p!) ;
            ret = stats.isDirectory() ;
            if (!ret && !stats.isFile()) {
                mkdirSync(p!, { recursive: true }) ; 
                ret = true ;
            }
        } 
        catch { ret = false ; }
    }
    return ret ;
}

export function $filesize(src:string|null|undefined) : number
{
    if ($inbrowser()) { throw 'unavailable $filesize() function in browser' ; }
	let ret:number = 0 ;
    if ($length(src)) {
        try { ret = statSync(<string>src).size ; }
	    catch { ret = 0 ; }
    }
    return ret ;
}

export function $temporarypath(ext:string|null|undefined='', src:string|null|undefined='') : string 
{
    if ($inbrowser()) { throw 'unavailable $temporarypath() function in browser' ; }
    ext = $trim(ext) ;
    let file = $uniquefile(src) ;
    if ($length(ext)) { file = $newext(file, ext) ; }
    return $path($tmp(), file) ;
}

export function $uniquefile(src?:string|null|undefined, e:string|null|undefined=undefined, internalImplementation:boolean=false) : string
{
	const rand = $uuid() ;
    e = $trim(e) ;
	if (!$length(src)) { return $newext(rand, e, internalImplementation) ; }
	const finalExt = e.length ? e : $ext(src) ;
    return $newext(`${$withoutext(src, internalImplementation)}-${rand}`, finalExt, internalImplementation) ;
}

export function $isabsolutepath(src?:string|null|undefined, internalImplementation:boolean=false) : boolean {
    return $length(src) ? (internalImplementation || $inbrowser() ? src!.startsWith('/') : isAbsolute(src!)): false ;
}

export function $normalizepath(src?:string|null|undefined, internalImplementation:boolean=false) : string {
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

export function $ext(s:string|null|undefined, internalImplementation:boolean=false):string 
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

export function $withoutext(s:string|null|undefined, internalImplementation?:boolean):string
{
    if (!$length(s)) { return '' ;}
	const e = $ext(s, internalImplementation) ;
	s = e.length ? s!.slice(0, s!.length - e.length) : s! ;
    return s.length && s.charAt(s.length-1) === '.' ? s.slice(0, s!.length - 1) : s ;
}

export function $newext(s:string|null|undefined, e:string|null|undefined=undefined, internalImplementation?:boolean):string {
    let b = $withoutext(s, internalImplementation) ;
    return $length(e) ? `${b}.${e}` : b ;
}

export function $dir(s:string|null|undefined, internalImplementation:boolean=false):string { 
    if (!$length(s)) { return '' ; } 
    if (internalImplementation || $inbrowser()) {
        const p = s!.lastIndexOf('/') ;
        return p === 0 ? '/' : (p > 0 ? s!.slice(0,p) : '.') ;
    }
    return dirname(s!) ; 
}
export function $filename(s:string|null|undefined, internalImplementation:boolean=false):string { 
    if (!$length(s)) { return '' ; } 
    if (internalImplementation || $inbrowser()) {
        const p = s!.lastIndexOf('/') ;
        return p >= 0 ? s!.slice(p+1) : s! ;
    }
    return basename(s!) ; 
}

export function $loadJSON(src:string|null|undefined|Buffer) : any | null
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

export function $readString(src:string|null|undefined, encoding:BufferEncoding='utf-8') : string|null
{
    if ($inbrowser()) { throw 'unavailable function in browser' ; }
	let ret:string|null = null ;
	if ($length(src)) {
		try { ret = readFileSync(<string>src, $length(encoding) ? encoding:'utf-8') ; }
		catch(e) { ret = null ; }
	}
	return ret ;
}

export function $writeString(src:string|null|undefined, str:string, encoding:BufferEncoding='utf-8') : boolean
{
    if ($inbrowser()) { throw 'unavailable function in browser' ; }
	let done = false ;
	if ($length(src)) {
		try {
			writeFileSync(<string>src, str, $length(encoding) ? encoding:'utf-8') ;
			done = true ;
		}
		catch(e) {
			done = false ;
		}
	}
	return done ;
}

export function $readBuffer(src:string|null|undefined) : Buffer|null
{
    if ($inbrowser()) { throw 'unavailable $readBuffer() function in browser' ; }
	let ret:Buffer|null = null ;
	if ($length(src)) {
		try { ret = <Buffer>readFileSync(<string>src) ; } // readFile without any encoding option returns a buffer
		catch(e) { ret = null ; }
	}
	return ret ;
}

export function $readdata(src:string|null|undefined) : TSData|null
{
    if ($inbrowser()) { throw 'unavailable $readdata() function in browser' ; }
    const buf = $readBuffer(src) ;
    return $ok(buf) ? new TSData(buf) : null ;
}

export function $writeBuffer(src:string|null|undefined, buf:Buffer) : boolean
{
    if ($inbrowser()) { throw 'unavailable $writeBuffer(() function in browser' ; }
	let done = false ;
	if ($length(src)) {
		try {
			writeFileSync(src!, buf) ;
			done = true ;
		}
		catch(e) {
			done = false ;
		}
	}
	return done ;
}

export function $removeFile(src:string|null|undefined) : boolean
{
    if ($inbrowser()) { throw 'unavailable $removeFile() function in browser' ; }
	let done = false
	if ($isfile(src)) {
		try {
			unlinkSync(src!) ;
			done = true ;	
		}
		catch (e) {
			done = false ;
		}
	}
	return done ;
}
/*
	src is a file
	dest is a file or a directory
	if it's a directory, it must exist and the src filename is used
 */
export function $realMoveFile(src:string|null|undefined, dest:string|null|undefined) : boolean
{
    if ($inbrowser()) { throw 'unavailable $realMoveFile() function in browser' ; }
	let done = false ;
	if ($length(src) && $length(dest) && src !== dest && $isfile(src)) {
		if ($isdirectory(dest)) {
			dest = $path(dest!, $filename(src)) ;
			if (src === dest) { return false ; }
		}
		try {
			renameSync(src!, dest!) ;
			done = true ;
		}
		catch { done = false ; }
		if (!done) {
			// rename function did not work, so we will try to copy
			// the file
			try {
				copyFileSync(src!, dest!) ;
				unlinkSync(src!) ;
				done = true ;
			}	
			catch { done = false ; } // WARNING: if we fails here, we may made the copy() but not the unlink()
		}
	}
	return done ;
}

export function $copyFile(src:string|null|undefined, dest:string|null|undefined, overwrite:boolean=false) : boolean
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
