import { $equal } from "./compare";
import { FoundationASCIIConversion, FoundationFindAllWhitespacesRegex, FoundationLeftTrimRegex, FoundationRightTrimRegex, FoundationWhiteSpaces } from "./string_tables";
import { $components, $components2string, $parsedatetime, TSDateComp, TSDateForm } from "./tsdatecomp";
import { $country } from "./tsdefaults";
import { int, INT_MAX, INT_MIN, UINT_MAX, uint, email, emailRegex, url, UUID, urlRegex, uuidRegex, isodate, Address, AnyDictionary} from "./types";
import { TSData } from "./tsdata";
import { TSDate } from "./tsdate";

export function $defined(o:any):boolean 
{ return o !== undefined && typeof o !== 'undefined' }

export function $ok(o:any) : boolean
{ return o !== null && o !== undefined && typeof o !== 'undefined' ; }

export function $value<T>(o:T|null|undefined, v:T):T
{ return $ok(o) ? o! : v ; }

export function $valueornull<T>(o:T|null|undefined):T|null
{ return $ok(o) ? o! : null ;}

export function $valueorundefine<T>(o:T|null|undefined):T|undefined
{ return $ok(o) ? o! : undefined ;}

export function $isstring(o:any) : boolean
{ return o !== null && o !== undefined && typeof o === 'string' ; }

export function $iswhitespace(c:string|null|undefined) : boolean
{ return $length(c) >= 1 && FoundationWhiteSpaces.includes(c!.charAt(0)) ; }

export function $isnumber(o:any) : boolean
{ return o !== null && o !== undefined && typeof o === 'number' && !isNaN(<number>o) && isFinite(<number>o) ; }

export function $isint(o:any) : boolean
{ return o !== null && o !== undefined && typeof o === 'number' && Number.isSafeInteger(<number>o) && <number>o >= INT_MIN && <number>o <= INT_MAX; }

export function $isunsigned(o:any, maximum:number=UINT_MAX) : boolean
{ return o !== null && o !== undefined && typeof o === 'number' && Number.isSafeInteger(<number>o) && <number>o >= 0 && <number>o <= maximum ; }

export function $isbool(o:any) : boolean
{ return o !== null && o !== undefined && typeof o === 'boolean' ; }

export function $isobject(o:any) : boolean
{ return o !== null && o !== undefined && typeof o === 'object' ; }

export function $objectcount(o:any) : number 
{ return $isobject(o) ? $keys(o).length : 0 ; }

export function $isarray(o:any) : boolean
{ return Array.isArray(o) ; }

export function $isiterable(o:any) : boolean 
{ return $isarray(o) || ($ok(o) && $isfunction(o[Symbol.iterator]))}

export function $isdate(o:any) : boolean
{ return (o instanceof Date || o instanceof TSDate || $isstring(o)) && $ok($isodate(o)) ; }

export function $isemail(o:any) : boolean
{ return $isstring(o) && $ok($email(o)) ; }

export function $isurl(o:any, opts?:$urlOptions) : boolean
{ return o instanceof URL || ($isstring(o) && $ok($url(o, opts))) ; }

export function $isuuid(o:any) : boolean
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
        else if ($isstring(s)) { cps = $parsedatetime($ftrim(s as string), format) ; } // we parse the string to verify it
    }
    return $ok(cps) ? <isodate>$components2string(cps!, format) : null ;
}

export function $address(a:Address|null|undefined) : Address | null 
{
    if (!$isobject(a)) { return null ; }
    const city = $ftrim(a?.city) ;
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

/**
 *   We don't use standard trim because it does not trim all unicode whitespaces! 
 */
// left-trim
export function $ltrim(s: string | undefined | null) : string
{ return $length(s) ? (s as string).replace(FoundationLeftTrimRegex, "") : '' ; }

// right-trim
export function $rtrim(s: string | undefined | null) : string
{ return $length(s) ? (s as string).replace(FoundationRightTrimRegex, "") : '' ; }

// full-trim
export function $ftrim(s: string | undefined | null) : string
{ return $length(s) ? (s as string).replace(FoundationLeftTrimRegex, "").replace(FoundationRightTrimRegex, "") : '' ; }

export { $ftrim as $trim }

export function $normspaces(s: string | undefined | null) : string
{ return $ftrim(s).replace(FoundationFindAllWhitespacesRegex, " ") ; }

export function $firstcap(s:string|null|undefined) : string
{ return _capitalize(s, 1) ; }

export function $capitalize(s: string | undefined | null) : string
{ return _capitalize(s) ; }

export function $fpad2(v: uint) : string { return $fpad(v,2) ; }
export function $fpad3(v: uint) : string { return $fpad(v,3) ; }
export function $fpad4(v: uint) : string { return $fpad(v,4) ; }
export function $fpad(v: uint, pad:number) : string { 
    return ($isunsigned(v) ? v.toString() : '').padStart(pad, '0') ; 
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
export function $capacityForCount(count:uint):uint
{ return (count < 128 ? __capacitiesForCounts[count] : ((count + (count >> 1)) & ~255) + 256) as uint; }

export function $count<T=any>(a:ArrayLike<T> | undefined | null) : number
{ return $ok(a) ? (<ArrayLike<T>>a).length : 0 ; }

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


export interface $unitOptions {
    unitName?:string ;
    unit?:string ;
    minimalUnit?: number ;
    maximalUnit?: number ;
    decimals?:number ;
    ignoreZeroDecimals?:boolean ;
    ignoreMinimalUnitDecimals?:boolean ;
}

const TSUnitMultiples = ['y', 'z', 'a', 'f', 'p', 'n', 'µ', 'm', '', 'k', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y'] ;
const TSLog1000 = Math.log(1000) ;

// default unit is m (for meters)
export function $unit(n:number|undefined|null, opts:$unitOptions = {}) {
    const v = $ok(n) ? n! : 0 ;
    const sn = $ftrim(opts.unitName) ;
    const su = $ftrim(opts.unit) ;

    const unitName = sn.length ? sn : (su.length ? su : 'm') ;
    const minU = $ok(opts.minimalUnit) ? Math.min(0, Math.max(-8, opts.minimalUnit!)) : -8 ;
    const maxU = $ok(opts.maximalUnit) ? Math.min(8, Math.max(0, opts.maximalUnit!)) : 8 ;
    let   dm = $isunsigned(opts.decimals) ? opts.decimals as number : 2 ;
    if (v === 0) {
        if (dm === 0 || opts.ignoreZeroDecimals || (minU === 0 && opts.ignoreMinimalUnitDecimals)) { return '0 ' + unitName ; }
        return '0.'.padEnd(2+dm, '0') + ' ' + unitName ;
    }
    const unit = su.length ? su : unitName.charAt(0) ;
    const i = Math.max(minU, Math.min(maxU, Math.floor(Math.log(Math.abs(v)) / TSLog1000))) ;
    if (i === minU && opts.ignoreMinimalUnitDecimals) { dm = 0 ;}
    return ((0.0+v) / (0.0+Math.pow(1000, i))).toFixed(dm) + ' ' + TSUnitMultiples[i+8]+(i==0?unitName:unit) ;
}

export function $octets(n:number|undefined|null, decimals:number = 2) {
    return $unit(n, { 
        decimals:decimals, 
        unit:'o', 
        unitName:'octets', 
        minimalUnit:0, 
        ignoreZeroDecimals:true,
        ignoreMinimalUnitDecimals:true
    }) ;
}

export function $meters(n:number|undefined|null, decimals:number = 2) {
    return $unit(n, { decimals:decimals})
}

/*
	This is a map function where callback returns as null or undefined are
	flushed from the result
 */
export function $map<T, R=T>(values:Iterable<T> | undefined | null, callback:(value: T, index: number) => R|null|undefined): R[]
{
	const ret = new Array<R>() ;
    if ($ok(values)) {
        let index = 0 ;
        for (let v of values!) {
		    const mv = callback(v, index) ;
		    if ($ok(mv)) { ret.push(mv!) ; }
            index++;
	    }
    }
	return ret ;
}

export function $first<T = any>(values:ArrayLike<T>|null|undefined):T|undefined {
    const n = $count(values) ; return n > 0 ? values![0] : undefined ;
}

export function $last<T = any>(values:ArrayLike<T>|null|undefined):T|undefined {
    const n = $count(values) ; return n > 0 ? values![n-1] : undefined ;
}

// the sum of null, undefined or an empty array is always 0, 
// regardless of what it could contain
export function $sum<T=any>(values:Iterable<T>|null|undefined):number|undefined {
    // with that implementation undefined and null values are considered as 0 for the sum
    const [,,,sum] = _countsAndSum<T>(values) ;
    return sum ;
}

export interface $averageOptions {
    countsOnlyOKItems?:boolean ; // this one superseeds countsOnlyDefinedItems
    countsOnlyDefinedItems?:boolean ;
}

export function $average<T=any>(values:Iterable<T>|null|undefined, opts:$averageOptions = {}):number|undefined {
    let [count, definedCount, okCount, sum] = _countsAndSum<T>(values) ;
    
    if (opts.countsOnlyOKItems) { count = okCount ; }
    else if (opts.countsOnlyDefinedItems) { count = definedCount ; }

    return $defined(sum) && count > 0 ? sum!/count : undefined ;
}

function _countsAndSum<T>(values:Iterable<T>|null|undefined):[number, number, number, number|undefined] {
    // since we work on Iterable, we don't use any length
    // and count our collection when trying to perform a sum

    let sum:number|undefined = 0 ;
    let validCount = 0 ;
    let definedCount = 0 ;
    let totalCount = 0 ;
    if ($ok(values)) {
        for (let v of values!) {
            if ($defined(v)) {
                if (v !== null) {
                    if ($defined(sum)) {
                        let n = undefined ;
                        if ($isnumber(v)) { n = v ;}
                        else if ($isstring(v)) { n = Number(v) ; }
                        else if ('toNumber' in v) { n = (v as any).toNumber() } 
                        if (!$isnumber(n)) { sum = undefined ; } // any fails to number conversion definitely invalidates the sum
                        else { sum += n ; }
                    }
                    validCount ++ ;  
                }
                definedCount ++ ;
            }
            totalCount ++ ;
        }    
    }
    return [totalCount, definedCount, validCount, sum]
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
export function $dict<T = object>(source:T|null|undefined, keys?:Array<keyof T>):AnyDictionary {    
    const ret:AnyDictionary = {} ;
    if ($ok(source)) { 
        _fillObject<object,AnyDictionary>('dict', ret, source, { properties:keys as any[] }) ;
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
	const v = $ftrim(s) ;
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

declare global {
    export interface Array<T> {
        first: () => T|undefined ;
        last: () => T|undefined ;
        sum: () => number|undefined ;
        average: (opts?:$averageOptions) => number | undefined ;
        filteredMap: <R = T>(callback:(value: T, index: number) => R|null|undefined) => R[] ;
    }
    export interface String {
        ascii: (this:string) => string ;
        firstCap: (this:string) => string ;
        capitalize: (this:string) => string ;
        normalizeSpaces: (this:string) => string ;
        ftrim: (this:string) => string ;
        ltrim: (this:string) => string ;
        rtrim: (this:string) => string ;
        isDate: (this:string) => boolean ;
        isEmail: (this:string) => boolean ;
        isUrl: (this:string) => boolean ;
        isUUID: (this:string) => boolean ;
    }

    export interface Number {
        unit:   (this:number, opts?:$unitOptions) => string ;
        meters: (this:number, decimals?:number) => string ;
        octets: (this:number, decimals?:number) => string ;
        fpad:   (this:number, pad:number) => string ;
        fpad2:  (this:number) => string ;
        fpad3:  (this:number) => string ;
        fpad4:  (this:number) => string ;
    }

}

if (!('fpad' in Number.prototype)) {
    Number.prototype.unit = function unit(this:number, opts?:$unitOptions) { return $unit(this, opts) ; }
    Number.prototype.meters = function meters(this:number, decimals?:number) { return $meters(this, decimals) ; }
    Number.prototype.octets = function octets(this:number, decimals?:number) { return $octets(this, decimals) ; }
    Number.prototype.fpad  = function fpad(this:number, pad:number) { return $fpad($unsigned(this), pad) ; }
    Number.prototype.fpad2 = function fpad(this:number) { return $fpad($unsigned(this), 2) ; }
    Number.prototype.fpad3 = function fpad(this:number) { return $fpad($unsigned(this), 3) ; }
    Number.prototype.fpad4 = function fpad(this:number) { return $fpad($unsigned(this), 4) ; }
}

if (!('ascii' in String.prototype)) {
    String.prototype.ascii   = function ascii(this:string):string { return $ascii(this) ; }
}
if (!('firstCap' in String.prototype)) {
    String.prototype.firstCap = function firstCap(this:string):string { return $firstcap(this) ; }
}
if (!('capitalize' in String.prototype)) {
    String.prototype.capitalize = function capitalize(this:string):string { return $capitalize(this) ; }
}
if (!('normalizeSpaces' in String.prototype)) {
    String.prototype.normalizeSpaces = function normalizeSpaces(this:string):string { return $normspaces(this) ; }
}
if (!('ftrim' in String.prototype)) {
    String.prototype.ftrim = function ftrim(this:string):string { return $ftrim(this) ; }
}
if (!('ltrim' in String.prototype)) {
    String.prototype.ltrim = function ltrim(this:string):string { return $ltrim(this) ; }
}
if (!('rtrim' in String.prototype)) {
    String.prototype.rtrim = function rtrim(this:string):string { return $rtrim(this) ; }
}
if (!('isDate' in String.prototype)) {
    String.prototype.isDate  = function isDate(this:string):boolean { return $ok($isodate(this)) ; }
}
if (!('isEmail' in String.prototype)) {
    String.prototype.isEmail = function isEmail(this:string):boolean { return $ok($email(this)) ; }
}
if (!('isUrl' in String.prototype)) {
    String.prototype.isUrl   = function isUrl(this:string):boolean { return $ok($url(this)) ; }
}
if (!('isUUID' in String.prototype)) {
    String.prototype.isUUID  = function isUUID(this:string):boolean { return $ok($UUID(this)) ; }
}

if (!('first' in Array.prototype)) {
    Array.prototype.first = function first<T>(this: T[]):T|undefined { return $first(this) ; }
}
if (!('last' in Array.prototype)) {
    Array.prototype.last = function first<T>(this: T[]):T|undefined { return $last(this) ; }
}
if (!('sum' in Array.prototype)) {
    Array.prototype.sum = function sum<T>(this: T[]):number|undefined { return $sum(this) ; }
}
if (!('average' in Array.prototype)) {
    Array.prototype.average = function average<T>(this: T[], opts?:$averageOptions):number|undefined { return $average(this, opts) ; }
}
if (!('filteredMap' in Array.prototype)) {
    Array.prototype.filteredMap = function filteredMap<T, R>(this: T[], callback:(e:T,index:number) => R|null|undefined):R[] { return $map(this, callback) ; }
}

function _capitalize(s:string|null|undefined, max:number = 0) : string 
{
    const len = $length(s) ;
    let ret = "" ;
    if (!max) { max = len} ;
    let lastCharWasNotLetter = true ;
    let n = 0 ;

    for (let i = 0 ; i < len ; i++) {
        const c = s!.charAt(i) ;
        const isLetter = _charAssimilableAsLetter(c) ;
        if (isLetter && lastCharWasNotLetter && n < max) { ret += c.toUpperCase() ; n++ ; }
        else { ret +=c ; }
        lastCharWasNotLetter = !isLetter ;
    }

    return ret ;
}

function _charAssimilableAsLetter(c:string):boolean
{
    c = $ascii(c) ;
    if (c.length) {
        const v = c.charCodeAt(0) & ~32 ;
        return v >= 65 && v <= 90 ;
    }
    return false ;
}
