import { FoundationASCIIConversion } from "./string_tables";
import { TSDate } from "./tsdate";
import { $components, $components2string, $parsedatetime, TSDateComp, TSDateForm } from "./tsdatecomp";
import { $country } from "./tsdefaults";
import { int, INT_MAX, INT_MIN, UINT_MAX, uint, email, emailRegex, url, uuid, urlRegex, uuidRegex, isodate, Address} from "./types";

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

export function $url(s:string|null|undefined) : url | null
{ return _regexvalidatedstring<url>(urlRegex, s) ; }

export function $uuid(s:string|null|undefined) : uuid | null
{ return _regexvalidatedstring<uuid>(uuidRegex, s) ; }

export function $isodate(s:Date|TSDate|string|null|undefined) : isodate | null
{
    let cps:TSDateComp|null = null ;
    if ($ok(s)) {
        if (s instanceof Date) { cps = $components(s as Date) ; }
        else if (s instanceof TSDate) { cps = (s as TSDate).toComponents() ; }
        else { cps = $parsedatetime($trim(s as string), TSDateForm.ISO8601) ; } // we parse the string to verify it
    }
    return $ok(cps) ? <isodate>$components2string(cps!, TSDateForm.ISO8601) : null ;
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
export function $fpad2(v: uint) : string
{ 
    return v >= 10 ? (''+v) : ('0' + v) ; 
}

export function $fpad3(v: uint) : string
{ 
    return v >= 100 ? ('0' + v) : (v >= 10 ? ('00'+v) : ('000'+v)) ; 
}

export function $fpad4(v: uint) : string
{ 
    return v >= 1000 ? (''+v) : (v >= 100 ? ('0' + v) : (v >= 10 ? ('00'+v) : ('000'+v)));
}

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

export function $json(v:any, replacer: (number | string)[] | null = null, space: string | number = 2): string
{ return JSON.stringify(v, replacer, space) ; }

export function $timeout(promise:Promise<any>, time:number, exception:any) : Promise<any> {
	let timer:any ;
	return Promise.race([
		promise, 
		new Promise((_,rejection) => timer = setTimeout(rejection, time, exception))
	]).finally(() => clearTimeout(timer)) ;
}

export function $term(s:string, escapeChar:string = '&'):string {
    let fmtlen = $length(s) ;
    let escape = false ;
    let ret = "" ;
    if (fmtlen) {
        if ($length(escapeChar) !== 1) { escapeChar = '&' ; }
        for (let i = 0 ; i < fmtlen ; i++) {
            const c = s.charAt(i) ;
            if (escape) {
                escape = false ;
                switch (c) {
                    case escapeChar: ret += escapeChar ; break ;
                    case 'r': ret += "\x1b[31m" ; break ;
                    case 'R': ret += "\x1b[41m" ; break ;
                    case 'g': ret += "\x1b[32m" ; break ;
                    case 'G': ret += "\x1b[42m" ; break ;
                    case 'b': ret += "\x1b[34m" ; break ;
                    case 'B': ret += "\x1b[44m" ; break ;
                    case 'y': ret += "\x1b[33m" ; break ;
                    case 'Y': ret += "\x1b[43m" ; break ;
                    case 'm': ret += "\x1b[35m" ; break ;
                    case 'M': ret += "\x1b[45m" ; break ;
                    case 'c': ret += "\x1b[36m" ; break ;
                    case 'C': ret += "\x1b[46m" ; break ;
                    case 'k': ret += "\x1b[30m" ; break ;
                    case 'K': ret += "\x1b[40m" ; break ;
                    case 'w': ret += "\x1b[37m" ; break ;
                    case 'W': ret += "\x1b[47m" ; break ;
                    case '0': ret += "\x1b[0m"  ; break ;   // reset
                    case '1': ret += "\x1b[1m"  ; break ;   // bright
                    case 'u': ret += "\x1b[4m"  ; break ;   // underscore
                    case 'd': ret += "\x1b[2m"  ; break ;   // dimmed
                    case 'i': ret += "\x1b[7m"  ; break ;   // inversed
                    case '_': ret += "\x1b[5m"  ; break ;   // blinked
                    default:
                        ret += escapeChar ;
                        ret += c ;
                        break ;
                }
            }
            else if (c === escapeChar) { escape = true ; }
            else { ret += c ; }
        }    
        if (escape) { ret += escapeChar ; }
    }
    return ret ;
}

export function $logterm(format:string, escapeChar:string = '', ...args:any[]) {
    if ($length(format)) {
        format = $term(format, escapeChar) ;
        if ($count(args)) { format += args.join() ; }
        console.log(format)
    }
}

// ===== private functions ===================================
function _regexvalidatedstring<T>(regex:RegExp, s:string|null|undefined) : T | null 
{
	const v = $trim(s) ;
	if (!v.length || !regex.test(<string>v)) { return null ; }
	return <T><unknown>v ;
}
