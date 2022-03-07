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
import { $length, $ok } from './commons';
import { LocalDefaults } from './defaults';
import { $uuid } from './utils_crypto';

export function $isfile(src:string | null | undefined) {
	let ret:boolean = false ;
	try {
		ret =  $length(src) && statSync(<string>src).isFile() ? true : false ;
	}
	catch {
		ret = false ;
	}
	return ret ;
}

export function $isdirectory(src:string | null | undefined) {
	let ret = false ;
	try {
		ret =  $length(src) && statSync(<string>src).isDirectory() ? true : false ;
	}
	catch {
		ret = false ;
	}
	return ret ;
}

export function $createDirectory(p:string|null|undefined) : boolean
{
	if (!$length(p)) { return false ; }
	if ($isdirectory(p)) { return true ; }
	if ($isfile(p)) { return false } ;
	let ret = false ;
	try { 
		mkdirSync(<string>p, { recursive: true }) ; 
		ret = true ;
	}
	catch { 
		ret = false ; 
	}
	return ret ;
}

export function $filesize(src:string|null|undefined) : number
{
	if (!$isfile(src)) return 0 ;
	let stats = statSync(<string>src);
	return $ok(stats) ? stats.size : 0 ;

}

export function $uniquefile(src?:string|null|undefined) : string
{
	const rand = $uuid() ;
	if (!$length(src)) { return rand ; }
	const ext = $ext(<string>src) ;
	return $length(ext) ? `${$withoutext(<string>src)}-${rand}.${ext}` : `${src}-${rand}` ;
}

export function $path(...paths:string[]): string { return join(...paths) ; }
export function $ext(s:string):string 
{ 
	const e = extname(s) ; 
	return $length(e) ? e.slice(1) : '' ;
}
export function $withoutext(s:string):string
{
	const e = extname(s) ;
	return $length(e) ? s.slice(0, s.length - e.length) : s ;
}

export function $dir(s:string):string 			 { return dirname(s) ; }
export function $filename(s:string):string 	     { return basename(s) ; }

export function $loadJSON(src:string|null|undefined) : any | null
{
	let ret = null ;
	let loadedString = $readString(src) ;
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
	return ret ;
}

export function $defaultpath() : string { return LocalDefaults.defaults().defaultPath ; }

export function $readString(src:string|null|undefined, encoding:BufferEncoding='utf-8') : string|null
{
	let ret:string|null = null ;
	if ($length(src)) {
		try { ret = readFileSync(<string>src, $length(encoding) ? encoding:'utf-8') ; }
		catch(e) { ret = null ; }
	}
	return ret ;
}

export function $writeString(src:string|null|undefined, str:string, encoding:BufferEncoding='utf-8') : boolean
{
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
	let ret:Buffer|null = null ;
	if ($length(src)) {
		try { ret = <Buffer>readFileSync(<string>src) ; } // readFile without any encoding option returns a buffer
		catch(e) { ret = null ; }
	}
	return ret ;
}

export function $writeBuffer(src:string|null|undefined, buf:Buffer) : boolean
{
	let done = false ;
	if ($length(src)) {
		try {
			writeFileSync(<string>src, buf) ;
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
	let done = false
	if ($isfile(src)) {
		try {
			unlinkSync(<string>src) ;
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
	console.log(`$realMoveFile('${src}', '${dest}')`) ;
	let done = false ;
	if ($length(src) && $length(dest) && src !== dest && $isfile(src)) {
		if ($isdirectory(dest)) {
			dest = $path(<string>dest, $filename(<string>src)) ;
			if (src === dest) { return false ; }
		}
		try {
			renameSync(<string>src, <string>dest) ;
			done = true ;
		}
		catch (e) { 
			console.log(`File rename error ${(e as Error).message}`) ;
			done = false ;
		}
		if (!done) {
			// rename function did not work, so we will try to copy
			// the file
			try {
				copyFileSync(<string>src, <string>dest) ;
				unlinkSync(<string>src) ;
				done = true ;
			}	
			catch (e) {
				console.log(`File copy error ${(e as Error).message}`) ;
				done = false ; 
			}
		}
	}
	return done ;
}

export function $copyFile(src:string|null|undefined, dest:string|null|undefined, overwrite:boolean=false) : boolean
{
	console.log(`$copyFile('${src}', '${dest}')`) ;
	let done = false ;
	if ($length(src) && $length(dest) && src !== dest && $isfile(src)) {
		if ($isdirectory(dest)) {
			dest = $path(<string>dest, $filename(<string>src)) ;
		}
		if (src === dest || $isdirectory(dest) || (!overwrite && $isfile(dest))) { return false ; }
		try {
			copyFileSync(<string>src, <string>dest, (overwrite?0:constants.COPYFILE_EXCL)) ;
			done = true ;
		}	
		catch (e) {
			console.log(`File copy error ${(e as Error).message}`) ;
			done = false ; 
		}
	}
	return done ;
}
