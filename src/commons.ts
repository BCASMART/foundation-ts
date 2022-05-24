import { $equal } from "./compare";
import { FoundationASCIIConversion } from "./string_tables";
import { TSDate } from "./tsdate";
import { $components, $components2string, $parsedatetime, TSDateComp, TSDateForm } from "./tsdatecomp";
import { $country } from "./tsdefaults";
import { int, INT_MAX, INT_MIN, UINT_MAX, uint, email, emailRegex, url, UUID, urlRegex, uuidRegex, isodate, Address, AnyDictionary} from "./types";

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


export function $email(s:string|null|undefined) : email | null
{ 
    const m = _regexvalidatedstring<email>(emailRegex, s) ;
    return $ok(m) ? m!.toLowerCase() as email : null ;
}

export interface $urlOptions { 
    acceptsProtocolRelativeUrl?:boolean ;
    acceptedProtocols?:string[] ;
}

export function $url(s:string|null|undefined, opts:$urlOptions = {}) : url | null
{
    if (!$length(s)) { return null ;}
    const m = s!.match(urlRegex) ;
    if (m?.length !== 2) { return null ; }
    if ($ok(m![1])) {
        const protocol = m![1].toLowerCase() ;
        if (!protocol.length) { return null ; }
        if ($count(opts.acceptedProtocols)) {
            return $ok(opts.acceptedProtocols!.find(v => v.toLowerCase() === protocol)) ? s as url : null ;
        }
        return protocol === 'http' || protocol === 'https' ? s as url : null  ;
    }
    return m![1] !== null && opts.acceptsProtocolRelativeUrl ? s as url : null ; 
}

export function $UUID(s:string|null|undefined) : UUID | null
{ return _regexvalidatedstring<UUID>(uuidRegex, s) ; }

export type IsoDateFormat = TSDateForm.ISO8601C | TSDateForm.ISO8601L | TSDateForm.ISO8601

export function $isodate(s:Date|TSDate|string|null|undefined, format:IsoDateFormat=TSDateForm.ISO8601) : isodate | null
{
    let cps:TSDateComp|null = null ;
    if ($ok(s)) {
        if (s instanceof Date) { cps = $components(s as Date) ; }
        else if (s instanceof TSDate) { cps = (s as TSDate).toComponents() ; }
        else { cps = $parsedatetime($trim(s as string), format) ; } // we parse the string to verify it
    }
    return $ok(cps) ? <isodate>$components2string(cps!, format) : null ;
}

export function $address(a:Address|null|undefined) : Address | null {
    if (!$ok(a)) { return null ; }
    const city = $trim(a?.city) ;
    const country = $country(a?.country) ;
    if (!city.length || !$ok(country)) { return null ; }

    let ret:Address = {...a!} ;
    ret.city = city! ;
    ret.country = country! ;

    return ret ;
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

export function $div(a: number, b: number) : number { return a/b | 0 ; }

export function $string(v:any) : string {
	if (!$ok(v)) return '' ;
	return typeof v === 'object' && 'toString' in v ? v.toString() : `${v}`;
}

export function $strings(v: string[] | string | undefined | null) : string[]
{ return $ok(v) ? ($isarray(v) ? v as string[] : [v as string]) : [] ; }

export function $totype<T>(v:any):T|null { return  $ok(v) ? <T>v : null ; }

export function $trim(s: string | undefined | null) : string
{ return $length(s) ? (s as string).replace(/^\s*(\S*(\s+\S+)*)\s*$/, "$1") : '' ; }

export function $fpad2(v: uint) : string { return $fpad(v,2) ; }
export function $fpad3(v: uint) : string { return $fpad(v,3) ; }
export function $fpad4(v: uint) : string { return $fpad(v,4) ; }
export function $fpad(v: uint, pad:number) : string { return v.toString().padStart(pad, '0') ; }

// for now $ascii() does not mak any transliterations from
// non-latin languages like Greek
export function $ascii(source: string | undefined | null) : string
{
	const l = $length(source) ;
	if (!l) return '' ;
    let s = (source as string).replace(/≠/g, "") ;
	s = s.normalize("NFD").replace(/[\u0300-\u036f]|\u00a8|\u00b4/g, "").normalize("NFKD") ; // does most of the job
	// finally we will try to convert (or remove) the remaining non ascii characters
	return s.replace(/[^\x00-\x7F]/g, x => FoundationASCIIConversion[x] || '') ;
}

export function $count(a:any[] | undefined | null) : number
{ return $ok(a) && Array.isArray(a) ? (<any[]>a).length : 0 ; }

export function $length(s:string | Buffer | undefined | null) : number
{ return $ok(s) ? (<string|Buffer>s).length : 0 ; }

export function $lengthin(s:string | Buffer | undefined | null, min:number=0, max:number=INT_MAX) : boolean
{ const l = $length(s) ; return l >= min && l <= max ; }

export function $arraybuffer(buf:Buffer) : ArrayBuffer {
    const ret = new ArrayBuffer(buf.length) ;
    const view = new Uint8Array(ret) ;
    for (let i = 0; i < buf.length; ++i) { view[i] = buf[i]; }
    return ret ;
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

// TODO: review all AnyDictionary functions to make a specific file 
// and a more thorough specificaiton
export function $dict(source:object|null|undefined, keys:string[]):AnyDictionary {
    const ret:AnyDictionary = {} ;
    if ($ok(source) && $count(keys)) {
        const v = source as AnyDictionary ;
        for (let k of keys) { ret[k] = v[k] ; }
    }
    return ret ;
}

export function $includesdict(source:object|null|undefined, dict:AnyDictionary, keys?:string[]):boolean {
    if ($ok(source)) {
        if (!$ok(keys)) { keys = Object.getOwnPropertyNames(dict) ; }
        if ($count(keys)) {
            const v = source as AnyDictionary ;
            for (let k of keys!) { if (!$equal(v[k], dict[k])) { return false ; }}
            return true ;
        }
    }
    return false ;
}

export function $json(v:any, replacer: (number | string)[] | null = null, space: string | number = 2): string
{ return JSON.stringify(v, replacer, space) ; }

// ===== private functions ===================================
function _regexvalidatedstring<T>(regex:RegExp, s:string|null|undefined) : T | null 
{
	const v = $trim(s) ;
	if (!v.length || !regex.test(<string>v)) { return null ; }
	return <T><unknown>v ;
}
