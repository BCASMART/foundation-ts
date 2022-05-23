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
	join 
} from 'path' ;
import { $length, $ok, $trim } from './commons';
import { $tmp } from './tsdefaults';
import { $uuid } from './crypto';
import { $inbrowser } from './utils';

export function $isfile(src:string | null | undefined) {
    if ($inbrowser()) { throw 'unavailable function in browser' ; }
	let ret:boolean = false ;
    if ($length(src)) {
        try { ret = statSync(<string>src).isFile() ; }
	    catch { ret = false ; }
    }
	return ret ;
}

export function $isexecutable(src:string | null | undefined) {
    if ($inbrowser()) { throw 'unavailable function in browser' ; }
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
    if ($inbrowser()) { throw 'unavailable function in browser' ; }
	let ret:boolean = false ;
    if ($length(src)) {
        try { ret = statSync(<string>src).isDirectory() ; }
	    catch { ret = false ; }
    }
	return ret ;
}

export function $createDirectory(p:string|null|undefined) : boolean
{
    if ($inbrowser()) { throw 'unavailable function in browser' ; }
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
    if ($inbrowser()) { throw 'unavailable function in browser' ; }
	let ret:number = 0 ;
    if ($length(src)) {
        try { ret = statSync(<string>src).size ; }
	    catch { ret = 0 ; }
    }
    return ret ;
}

export function $temporarypath(ext:string|null|undefined='', src:string|null|undefined='') : string 
{
    if ($inbrowser()) { throw 'unavailable function in browser' ; }
    ext = $trim(ext) ;
    let file = $uniquefile(src) ;
    if ($length(ext)) { file = $newext(file, ext) ; }
    return $path($tmp(), file) ;
}

export function $uniquefile(src?:string|null|undefined) : string
{
    if ($inbrowser()) { throw 'unavailable function in browser' ; }
	const rand = $uuid() ;
	if (!$length(src)) { return rand ; }
	const ext = $ext(src) ;
	return $length(ext) ? `${$withoutext(<string>src)}-${rand}.${ext}` : `${src}-${rand}` ;
}

export function $path(...paths:string[]): string { 
    if ($inbrowser()) { throw 'unavailable function in browser' ; }
    return join(...paths) ; 
}
export function $ext(s:string|null|undefined):string 
{ 
    if ($length(s)) { 
        if ($inbrowser()) {
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

export function $withoutext(s:string|null|undefined):string
{
    if ($inbrowser()) { throw 'unavailable function in browser' ; }
    if (!$length(s)) { return '' ;}
	const e = $ext(s) ;
	s = e.length ? s!.slice(0, s!.length - e.length) : s! ;
    return s.length && s.charAt(s.length-1) === '.' ? s.slice(0, s!.length - 1) : s ;
}

export function $newext(s:string|null|undefined, e:string|null|undefined=undefined):string {
    if ($inbrowser()) { throw 'unavailable function in browser' ; }
    let b = $withoutext(s) ;
    return $length(e) ? `${b}.${e}` : b ;
}

export function $dir(s:string|null|undefined):string { 
    if ($inbrowser()) { throw 'unavailable function in browser' ; }
    return $length(s) ? dirname(s!) : '' ; 
}
export function $filename(s:string|null|undefined):string { 
    if ($inbrowser()) { throw 'unavailable function in browser' ; }
    return $length(s) ? basename(s!) : '' ; 
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
    if ($inbrowser()) { throw 'unavailable function in browser' ; }
	let ret:Buffer|null = null ;
	if ($length(src)) {
		try { ret = <Buffer>readFileSync(<string>src) ; } // readFile without any encoding option returns a buffer
		catch(e) { ret = null ; }
	}
	return ret ;
}

export function $writeBuffer(src:string|null|undefined, buf:Buffer) : boolean
{
    if ($inbrowser()) { throw 'unavailable function in browser' ; }
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
    if ($inbrowser()) { throw 'unavailable function in browser' ; }
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
    if ($inbrowser()) { throw 'unavailable function in browser' ; }
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
    if ($inbrowser()) { throw 'unavailable function in browser' ; }
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
