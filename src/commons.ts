import { $equal } from "./compare";
import { FoundationASCIIConversion } from "./string_tables";
import { $components, $components2string, $parsedatetime, TSDateComp, TSDateForm } from "./tsdatecomp";
import { $country } from "./tsdefaults";
import { int, INT_MAX, INT_MIN, UINT_MAX, uint, email, emailRegex, url, UUID, urlRegex, uuidRegex, isodate, Address, AnyDictionary} from "./types";
import { TSData } from "./tsdata";
import { TSDate } from "./tsdate";

export function $defined(o:any):boolean 
{ return o !== undefined && typeof o !== 'undefined' }

export function $ok(o:any | undefined | null) : boolean
{ return o !== null && o !== undefined && typeof o !== 'undefined' ; }

export function $value<T>(o:T|null|undefined, v:T):T
{ return $ok(o) ? o! : v ; }

export function $isstring(o:any | null | undefined) : boolean
{ return o !== null && o !== undefined && typeof o === 'string' ; }

export function $isnumber(o:any | null | undefined) : boolean
{ return o !== null && o !== undefined && typeof o === 'number' && !isNaN(<number>o) && isFinite(<number>o) ; }

export function $isint(o:any | null | undefined) : boolean
{ return o !== null && o !== undefined && typeof o === 'number' && Number.isSafeInteger(<number>o) && <number>o >= INT_MIN && <number>o <= INT_MAX; }

export function $isunsigned(o:any | null | undefined, maximum:number=UINT_MAX) : boolean
{ return o !== null && o !== undefined && typeof o === 'number' && Number.isSafeInteger(<number>o) && <number>o >= 0 && <number>o <= maximum ; }

export function $isbool(o:any | null | undefined) : boolean
{ return o !== null && o !== undefined && typeof o === 'boolean' ; }

export function $isobject(o:any | null | undefined) : boolean
{ return o !== null && o !== undefined && typeof o === 'object' ; }

export function $objectcount(o:any | null | undefined) : number 
{ return $isobject(o) ? $keys(o).length : 0 ; }

export function $isarray(o:any | null | undefined) : boolean
{ return o !== null && o !== undefined && Array.isArray(o) ; }

export function $isdate(o:any | null | undefined) : boolean
{ return o instanceof Date || o instanceof TSDate || ($isstring(o) && $ok($isodate(o))) ; }

export function $isemail(o:any | null | undefined) : boolean
{ return $isstring(o) && $ok($email(o)) ; }

export function $isurl(o:any | null | undefined, opts?:$urlOptions) : boolean
{ return o instanceof URL || ($isstring(o) && $ok($url(o, opts))) ; }

export function $isuuid(o:any | null | undefined) : boolean
{ return $isstring(o) && $ok($UUID(o)) ; }


export function $isfunction(o:any):boolean { return typeof o === 'function' ; }

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
{ 
    if (!$isstring(s)) { return null ; } 
    return _regexvalidatedstring<UUID>(uuidRegex, s) ; 
}

export type IsoDateFormat = TSDateForm.ISO8601C | TSDateForm.ISO8601L | TSDateForm.ISO8601

export function $isodate(s:Date|TSDate|string|null|undefined, format:IsoDateFormat=TSDateForm.ISO8601) : isodate | null
{
    let cps:TSDateComp|null = null ;
    if ($ok(s)) {
        if (s instanceof Date) { cps = $components(s as Date) ; }
        else if (s instanceof TSDate) { cps = (s as TSDate).toComponents() ; }
        else if ($isstring(s)) { cps = $parsedatetime($trim(s as string), format) ; } // we parse the string to verify it
    }
    return $ok(cps) ? <isodate>$components2string(cps!, format) : null ;
}

export function $address(a:Address|null|undefined) : Address | null 
{
    if (!$isobject(a)) { return null ; }
    const city = $trim(a?.city) ;
    const country = $country(a?.country) ;
    if (!$isstring(city) || !$length(city) || !$ok(country)) { return null ; }

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
export function $capacityForCount(count:uint):uint
{ return (count < 128 ? __capacitiesForCounts[count] : ((count + (count >> 1)) & ~255) + 256) as uint; }

export function $count(a:any[] | Uint8Array | undefined | null) : number
{ return $ok(a) && (a instanceof Uint8Array || Array.isArray(a)) ? (<any[]|Uint8Array>a).length : 0 ; }

export function $length(s:string | Uint8Array | TSData | undefined | null) : number
{ return $ok(s) ? (<string|Uint8Array|TSData>s).length : 0 ; }

export function $lengthin(s:string | Uint8Array | TSData | undefined | null, min:number=0, max:number=INT_MAX) : boolean
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

export function $keys<T>(o:T|undefined|null):Array<keyof T> { return $ok(o) ? Object.getOwnPropertyNames(o!) as (keyof T)[] : [] ; }

export interface $partialOptions<T,U> {
    properties?:Array<keyof T | keyof U>,
    filter?: (v:T[keyof T]) => T[keyof T]|U[keyof U]|undefined;
}

// default filter supress undefined, null values and functions (methods for real class instances)
// if properties is not set, we use all the object keys to apply the filter
export function $partial<T,U>(a:T|undefined|null, opts:$partialOptions<T,U>={}):[U, number]
{
    let ret:any = {} ;
    let n = 0 ;
    if ($ok(a)) {
        n = _fillObject<T,U>('partial', ret, a, opts) ;
    }
    return [ret as U, n] ;
}

// TODO: review all AnyDictionary functions to make a specific file 
// and a more thorough specificaiton. Here, all null, undefined and function
// properties are removed
export function $dict(source:object|null|undefined, keys?:string[]):AnyDictionary {    
    const ret:AnyDictionary = {} ;
    if ($ok(source)) { 
        _fillObject<object,AnyDictionary>('dict', ret, source, { properties:keys }) ;
    }
    return ret ;
}

export function $includesdict(source:object|null|undefined, dict:AnyDictionary, keys?:string[]):boolean {
    if ($ok(source)) {
        keys = $ok(keys) ? keys! : $keys(dict) as string[] ;
        if (keys.length) {
            const v = source as AnyDictionary ;
            for (let k of keys) { if (!$equal(v[k], dict[k])) { return false ; }}
            return true ;
        }
    }
    return false ;
}

// undefined or null values are not present in the destination object
// when fusioning, b.values are replacing a.values. if properties options are set, 
// only the given properties of a and b are fusionned
// by default there is no fusion of array or sub-object properties.
// you can turn that on by providing a fusionArray and a fusionObject method
export interface $fusionOptions<T,U> {
    A?:$partialOptions<T,U>,
    B?:$partialOptions<T,U>
    fusionArrays?:(a:Array<any>, b:Array<any>) => Array<any>
    fusionObjects?:(a:object, b:object) => object
}

export function $fusion<T,U>(a:T|undefined|null, b:U|undefined|null, opts:$fusionOptions<T,U> = {}):[Partial<T> & Partial<U>, number]
{
    if (!$ok(a)) { return $ok(b) ? $partial(b, opts.B as any) : [{}, 0] }
    else if (!$ok(b)) { return $partial(a, opts.A) ; }

    let [ret, n] = $partial(a, opts.A) ;
    let fopts:_fillObjectOptions<T,U> = $ok(opts.B) ? { ... opts.B!} : {} ;
    if ($ok(opts.fusionArrays)) { fopts.fusionArrays = opts.fusionArrays! ; }
    if ($ok(opts.fusionObjects)) { fopts.fusionObjects = opts.fusionObjects! ; }
    n += _fillObject<T,U>('fusion', ret, b, fopts) ;
    return [ret, n] ;
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

interface _fillObjectOptions<T,U> extends $partialOptions<T,U> {
    fusionArrays?:(a:Array<any>, b:Array<any>) => Array<any>
    fusionObjects?:(a:object, b:object) => object
}

function _fillObject<T,U>(fn:string, destination:any, source:any, opts:_fillObjectOptions<T,U>={}):number 
{
    let ret = 0 ;
    opts = { ... opts } ;
    opts.properties = $ok(opts.properties) ? opts.properties! : $keys(source) as Array<keyof T | keyof U> ;
    if (opts.properties.length) {
        const fusion_arrays = $isfunction(opts.fusionArrays) ;
        const fusion_objects = $isfunction(opts.fusionObjects) ;
        opts.filter = $isfunction(opts.filter) ? opts.filter! : (v:T[keyof T]) => $ok(v) && typeof v !== 'function' ? v : undefined ; 
        
        for (let p of opts.properties) {
            if (!$isstring(p)) { throw `${fn}() needs to have valid string properties` ; }
            const v = opts.filter(source[p]) ; 
            if ($defined(v)) {
                if (fusion_arrays && $isarray(v) && $isarray(destination[p])) { 
                    destination[p] = opts.fusionArrays!(destination[p], v as unknown as Array<any>) ;
                }
                else if (fusion_objects && $isobject(v) && $isobject(destination[p])) {
                    destination[p] = opts.fusionObjects!(destination[p], v as unknown as object) ;
                }
                else { destination[p] = v ; }
                ret++ ; 
            } 
        }    
    }
    return ret ;
}

const __capacitiesForCounts = [
    /* 000 */   2,   2,   4,   4,   8,   8,   8,   8,
    /* 008 */  16,  16,  16,  16,  16,  16,  16,  16,
    /* 016 */  32,  32,  32,  32,  32,  32,  32,  32,
    /* 024 */  32,  32,  32,  32,  32,  32,  32,  32,
    /* 032 */  64,  64,  64,  64,  64,  64,  64,  64,
    /* 040 */  64,  64,  64,  64,  64,  64,  64,  64,
    /* 048 */  64,  64,  64,  64,  64,  64,  64,  64,
    /* 056 */ 128, 128, 128, 128, 128, 128, 128, 128,
    /* 064 */ 128, 128, 128, 128, 128, 128, 128, 128,
    /* 072 */ 128, 128, 128, 128, 128, 128, 128, 128,
    /* 080 */ 128, 128, 128, 128, 128, 128, 128, 128,
    /* 088 */ 128, 128, 128, 128, 128, 128, 128, 128,
    /* 096 */ 128, 128, 128, 128, 128, 128, 128, 128,
    /* 104 */ 256, 256, 256, 256, 256, 256, 256, 256,
    /* 112 */ 256, 256, 256, 256, 256, 256, 256, 256,
    /* 120 */ 256, 256, 256, 256, 256, 256, 256, 256] ;
  