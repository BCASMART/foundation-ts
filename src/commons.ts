import { int, INT_MAX, INT_MIN, UINT_MAX, uint, email, emailRegex, url, uuid, urlRegex, uuidRegex } from "./types";
import { $filename } from "./utils_fs";

export function $ok(o:any | undefined | null) : boolean
{ return o !== null && o !== undefined && typeof o !== 'undefined' ; }

export function $isstring(o:any | null | undefined) : boolean
{ return o !== null && o !== undefined && typeof o === 'string' ; }

export function $isnumber(o:any | null | undefined) : boolean
{ return o !== null && o !== undefined && typeof o === 'number' && !isNaN(<number>o) && isFinite(<number>o) ; }

export function $isint(o:any | null | undefined) : boolean
{ return o !== null && o !== undefined && typeof o === 'number' && Number.isSafeInteger(<number>o) && <number>o >= INT_MIN && <number>o <= INT_MAX; }

export function $isunsigned(o:any | null | undefined) : boolean
{ return o !== null && o !== undefined && typeof o === 'number' && Number.isSafeInteger(<number>o) && <number>o >= 0 && <number>o <= UINT_MAX ; }

export function $isbool(o:any | null | undefined) : boolean
{ return o !== null && o !== undefined && typeof o === 'boolean' ; }

export function $isobject(o:any | null | undefined) : boolean
{ return o !== null && o !== undefined && typeof o === 'object' ; }

export function $isarray(o:any | null | undefined) : boolean
{ return o !== null && o !== undefined && Array.isArray(o) ; }

export function $intornull(n:string|number|null|undefined) : int | null
{
	if (!$ok(n)) { return null ; }
	if (typeof n === 'string') { n = parseInt(<string>n, 10) ; }
	return $isint(n) ? <int>n : null ;
}

export function $int(n:string|number|null|undefined, defaultValue:int=<int>0) : int
{
	n = $intornull(n) ;
	return $ok(n) ? <int>n : defaultValue ;
}

function _regexValidatedType<T>(regex:RegExp, s:string|null|undefined) : T | null 
{
	const v = $trim(s) ;
	if (!v.length || !regex.test(<string>v)) { return null ; }
	return <T><unknown>v ;
}

export function $email(s:string|null|undefined) : email | null
{ return _regexValidatedType<email>(emailRegex, s) ; }

export function $url(s:string|null|undefined) : url | null
{ return _regexValidatedType<url>(urlRegex, s) ; }

export function $uuid(s:string|null|undefined) : uuid | null
{ return _regexValidatedType<uuid>(uuidRegex, s) ; }


export function $unsignedornull(n:string|number|null|undefined) : uint | null
{
	if (!$ok(n)) { return null ; }
	if (typeof n === 'string') { n = parseInt(<string>n, 10) ; }
	return $isunsigned(n) ? <uint>n : null ;
}

export function $unsigned(n:string|number|null|undefined, defaultValue:uint=<uint>0) : uint
{
	n = $unsignedornull(n) ;
	return $ok(n) ? <uint>n : defaultValue ;
}

export function $div(a: number, b: number) : number
{ return a/b | 0 ; }


export function $strings(e: string[] | string | undefined | null) : string[]
{
	return $ok(e) ? (typeof e === 'string' ? [<string>e] : <string[]>e) : [] ;
}

export function $trim(s: string | undefined | null) : string
{
	return $length(s) ? (<string>s).replace(/^\s*(\S*(\s+\S+)*)\s*$/, "$1") : '' ;
}

export function $count(a:any[] | undefined | null) : number
{
	return $ok(a) && Array.isArray(a) ? (<any[]>a).length : 0 ;
}

export function $length(s:string | Buffer | undefined | null) : number
{
	return $ok(s) ? (<string|Buffer>s).length : 0 ;
}

/*
	This is a map function where callback returns as null or undefined are
	flushed from the result
 */
export function $map<T, R>(a:Array<T> | undefined | null, callBack:(e:T) => R|null|undefined) : Array<R>
{
	const ret = new Array<R>() ;
	a?.forEach(e => {
		const v = callBack(e) ;
		if ($ok(v)) ret.push(<R>v) ;
	}) ;
	return ret ;
}

export function $json(v:any): string
{
	return JSON.stringify(v, null , 2) ;
}

export function $timeout(promise:Promise<any>, time:number, exception:any) : Promise<any> {
	let timer:any ;
	return Promise.race([
		promise, 
		new Promise((_,rejection) => timer = setTimeout(rejection, time, exception))
	]).finally(() => clearTimeout(timer)) ;
}

export function $exit(reason:string='', status:number=0, name?:string) {
	if (status !== 0) {
		const processName = $length(name) ? name : `node process ${$filename(process.argv[1])}` ;
		console.log('----------------------------------------------------') ;
		if ($length(reason)) {
			console.log(`Exiting ${processName} with status ${status} for reason:\n\t${reason}`) ;
		}
		else {
			console.log(`Exiting ${processName} with status ${status}`) ;
		}
		console.log('----------------------------------------------------') ;
	}
	else if ($length(reason)) { console.log(reason) ; }
	process.exit(status) ;
}
