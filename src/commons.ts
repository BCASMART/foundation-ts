import { FoundationASCIIConversion } from "./string_tables";
import { TSDate } from "./tsdate";
import { $components2string, $parsedatetime, TSDateForm } from "./tsdatecomp";
import { TSDefaults, Translations } from "./tsdefaults";
import { int, INT_MAX, INT_MIN, UINT_MAX, uint, language, email, emailRegex, url, uuid, urlRegex, uuidRegex, Comparison, Same, Ascending, Descending, isodate} from "./types";
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

function $regexvalidatedstring<T>(regex:RegExp, s:string|null|undefined) : T | null 
{
	const v = $trim(s) ;
	if (!v.length || !regex.test(<string>v)) { return null ; }
	return <T><unknown>v ;
}

export function $email(s:string|null|undefined) : email | null
{ return $regexvalidatedstring<email>(emailRegex, s) ; }

export function $url(s:string|null|undefined) : url | null
{ return $regexvalidatedstring<url>(urlRegex, s) ; }

export function $uuid(s:string|null|undefined) : uuid | null
{ return $regexvalidatedstring<uuid>(uuidRegex, s) ; }

export function $isodate(s:string|null|undefined) : isodate | null
{
    const v = $trim(s) ; if (!v.length) { return null ; }
    const cps = $parsedatetime(v, TSDateForm.ISO8601) ;
    return $ok(cps) ? <isodate>$components2string(cps!, TSDateForm.ISO8601) : null ;
}

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

export function $string(v:any) : string {
	if (!$ok(v)) return '' ;
	return typeof v === 'object' && 'toString' in v ? v.toString() : `${v}`;
}

export function $strings(e: string[] | string | undefined | null) : string[]
{
	return $ok(e) ? (typeof e === 'string' ? [<string>e] : <string[]>e) : [] ;
}

export function $trim(s: string | undefined | null) : string
{
	return $length(s) ? (<string>s).replace(/^\s*(\S*(\s+\S+)*)\s*$/, "$1") : '' ;
}

export function $ascii(source: string | undefined | null) : string
{
	const l = $length(source) ;
	if (!l) return '' ;
	let s = (source as string).replace(/\s/g, ' ') ; // replace all weird spaces to ascii space
	s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").normalize("NFKD") ; // does most of the job
	// finally we will try to convert (or remove) the remaining non ascii characters
	return s.replace(/[^\x00-\x7F]/g, x => FoundationASCIIConversion[x] || '') ;
}
export function $numcompare(a:number, b:number):Comparison {
    if (a === b) {return Same ; }
    if (isNaN(a) || isNaN(b)) { return undefined ; }
    return a < b ? Ascending : Descending ;
}


export function $datecompare(
    a:number|string|Date|TSDate|null|undefined, 
    b:number|string|Date|TSDate|null|undefined) : Comparison 
{
	if (a === b) return Same ;
    if (!$ok(a) || !$ok(b)) { return undefined ; }

    /* TODO: WE SHOULD BE PERMITED NOT TO CAST a or b in new TSDate() */
    if (!(a instanceof TSDate)) { a = new TSDate(a as unknown as string /* this is wrong  */) ;}
    if (!(b instanceof TSDate)) { b = new TSDate(b as unknown as string /* this is wrong  */) ;}
    return a.compare(b) ;
}

export function $compare(a:any, b:any):Comparison {
	if (a === b) return Same ;
    if (!$ok(a) || !$ok(b)) { return undefined ; }

    if (typeof a === 'number' && typeof b === 'number') { return $numcompare(a, b) ; }
    if ($isstring(a) && $isstring(b)) {
        return Buffer.compare(Buffer.from(a, 'utf-8'), Buffer.from(b, 'utf-8')) as Comparison ;
    }
	if ($isarray(a) && $isarray(b)) {
        const na = a.length, nb = b.length ;
        let i = 0 ;
        while (i < na && i < nb) {
            const c = $compare(a[i], b[i]) ;
            if (c !== Same) { return c ; }
            i++ ;
        }
        return na === nb ? Same : (i < na ? Descending : Ascending) ;
    }
	if (a instanceof Date && b instanceof Date) { return $numcompare(a.getTime(), b.getTime()) ; }
	if (a instanceof Buffer && b instanceof Buffer) { return Buffer.compare(a, b) as Comparison ; }
	if ((a instanceof ArrayBuffer || ArrayBuffer.isView(a)) && (b instanceof ArrayBuffer || ArrayBuffer.isView(b))) {
		a = new Uint8Array(a as ArrayBufferLike) ;
		b = new Uint8Array(b as ArrayBufferLike) ;
        const na = a.length, nb = b.length ;
        let i = 0 ;
        while (i < na && i < nb) {
            const c = $numcompare(a[i], b[i]) ;
            if (c !== Same) { return c ; }
            i++ ;
        }
        return na === nb ? Same : (i < na ? Descending : Ascending) ;
    }
    return ('compare' in a) ? a.compare(b) : undefined ; 
}

export function $equal(a:any, b:any) {
	if (a === b) { return true ; }
	if (typeof a === 'number' && typeof b === 'number') return a === b ; // in order to cover NaN inequality and infinity equality
	if (!$ok(a) || !$ok(b)) return false ;
	if ($isarray(a) && $isarray(b)) {
		const n = a.length ;
		if (n !== b.length) return false ;
		for(let i = 0 ; i < n ; i++) { if (!$equal(a[i], b[i])) return false ; }
		return true ;
	}
	if ('isEqual' in a && 'isEqual' in b) return a.isEqual(b) ;	
	if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime() ;
	if (a instanceof Set && b instanceof Set) {
		return a.size === b.size && [...a.keys()].every(e => b.has(e)) ;
	}
	if (a instanceof Map && b instanceof Map) {
		const ak = a.keys() ;
		const bk = b.keys() ;
		const keys = a.size >= b.size ? ak : bk ;
		// we may have different expressed keys with undefined as value...
		// eg: MapA{a:1, b:undefined} equals MapB{a:1} since MapB.get('b') returns undefined 
		for (let k of keys) { if (!$equal(a.get(k), b.get(k))) return false ; }
		return true ;
	}
	if (a instanceof Buffer && b instanceof Buffer) { return Buffer.compare(a, b) === 0 ; }
	if ((a instanceof ArrayBuffer || ArrayBuffer.isView(a)) && (b instanceof ArrayBuffer || ArrayBuffer.isView(b))) {
		a = new Uint8Array(a as ArrayBufferLike) ;
		b = new Uint8Array(b as ArrayBufferLike) ;
		const n = a.length ;
		if (n !== b.length) return false ;
		for(let i = 0 ; i < n ; i++) { if (a[i] !== b[i]) return false ; }
		return true ;
	}

	if (Object.getPrototypeOf(a) === Object.prototype && Object.getPrototypeOf(b) === Object.prototype) {
		const ak = Object.getOwnPropertyNames(a) ;
		const bk = Object.getOwnPropertyNames(a) ;
		const keys = ak.length >= bk.length ? ak : bk ;
		// we may have different expressed keys with undefined as value...
		// eg: {a:1, b:undefined} equals {a:1}
		for (let k of keys) { if (!$equal(a[k], b[k])) return false ; }
		return true ;
	}
	return false ; 
}

export function $count(a:any[] | undefined | null) : number
{ return $ok(a) && Array.isArray(a) ? (<any[]>a).length : 0 ; }

export function $length(s:string | Buffer | undefined | null) : number
{ return $ok(s) ? (<string|Buffer>s).length : 0 ; }

export function $lengthin(s:string | Buffer | undefined | null, min:number=0, max:number=INT_MAX) : boolean
{ const l = $length(s) ; return l >= min && l <= max ; }

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

export function $jsonobj(v:any): any
{
	if (v === null || v === undefined) return v ;

	const t = typeof v ;
	switch(t) {
		case 'object':
			return 'toJSON' in v ? v.toJSON() : v ; 
		case 'boolean':
		case 'number':
		case 'bigint':
		case 'string':
			return v ;
		default:
			return undefined ;
	} 
}

export function $json(v:any, replacer: (number | string)[] | null = null, space: string | number = 2): string
{ return JSON.stringify(v, replacer, space) ; }

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

export function $default(key:string):any { return TSDefaults.defaults().getValue(key) ; }
export function $setdefault(key:string, value:any=undefined) { return TSDefaults.defaults().setValue(key, value) ; }
export function $removedefault(key:string) { return TSDefaults.defaults().setValue(key, undefined) ; }
export function $translations(lang?:language|undefined|null):Translations { return TSDefaults.defaults().translations(lang) ; }
