import { $equal } from "./compare";
import { FoundationStringEncodings, FoundationASCIIConversion, FoundationFindAllWhitespacesRegex, FoundationLeftTrimRegex, FoundationNewLinesSplitRegex, FoundationRightTrimRegex, FoundationStrictWhiteSpacesStringCodeSet, FoundationStricWhiteSpacesNumberCodeSet, FoundationWhiteSpacesNumberCodeSet, FoundationWhiteSpacesStringCodeSet } from "./string_tables";
import { $components, $components2string, $parsedatetime, TSDateComp, TSDateForm } from "./tsdatecomp";
import { $country } from "./tsdefaults";
import { int, INT_MAX, INT_MIN, UINT_MAX, uint, email, emailRegex, url, UUID, urlRegex, uuidRegex, isodate, Address, AnyDictionary, Nullable, UINT_MIN, UINT32_MAX, INT32_MIN, uint8, StringEncoding, NormativeStringEncoding } from "./types";
import { TSData } from "./tsdata";
import { TSDate } from "./tsdate";

export function $defined(o:any):boolean 
{ return o !== undefined && typeof o !== 'undefined' }

export function $ok(o:any) : boolean
{ return o !== null && o !== undefined && typeof o !== 'undefined' ; }

export function $value<T>(o:Nullable<T>, v:T):T
{ return $ok(o) ? o! : v ; }

export function $valueornull<T>(o:Nullable<T>):T|null
{ return $ok(o) ? o! : null ;}

export function $valueorundefine<T>(o:Nullable<T>):T|undefined
{ return $ok(o) ? o! : undefined ;}

export function $isstring(o:any) : boolean
{ return o !== null && o !== undefined && typeof o === 'string' ; }

export function $iswhitespace(s: Nullable<string|number>) : boolean
{ return $isstring(s) ? FoundationWhiteSpacesStringCodeSet.has(s as string) : ($ok(s) ? FoundationWhiteSpacesNumberCodeSet.has(s as number) : false) ; }

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

export function $intornull(n:Nullable<string|number>) : int | null
{
	if (!$ok(n)) { return null ; }
	if (typeof n === 'string') { n = parseInt(<string>n, 10) ; }
	return $isint(n) ? <int>n : null ;
}

export function $int(n:Nullable<string|number>, defaultValue:int=<int>0) : int
{
	n = $intornull(n) ;
	return $ok(n) ? <int>n : defaultValue ;
}


export function $email(s:Nullable<string>) : email | null
{
    const m = _regexvalidatedstring<email>(emailRegex, s) ;
    return $ok(m) ? m!.toLowerCase() as email : null ;
}

export interface $urlOptions { 
    acceptsProtocolRelativeUrl?:boolean ;
    acceptedProtocols?:string[] ;
}

export function $url(s:Nullable<string>, opts:$urlOptions = {}) : url | null
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

export function $UUID(s:Nullable<string>) : UUID | null
{ 
    if (!$isstring(s)) { return null ; } 
    return _regexvalidatedstring<UUID>(uuidRegex, s) ; 
}

export type IsoDateFormat = TSDateForm.ISO8601C | TSDateForm.ISO8601L | TSDateForm.ISO8601

export function $isodate(s:Nullable<Date|TSDate|string>, format:IsoDateFormat=TSDateForm.ISO8601) : isodate | null
{
    let cps:TSDateComp|null = null ;
    if ($ok(s)) {
        if (s instanceof Date) { cps = $components(s as Date) ; }
        else if (s instanceof TSDate) { cps = (s as TSDate).toComponents() ; }
        else if ($isstring(s)) { cps = $parsedatetime($ftrim(s as string), format) ; } // we parse the string to verify it
    }
    return $ok(cps) ? <isodate>$components2string(cps!, format) : null ;
}

export function $address(a:Nullable<Address>) : Address | null 
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

export function $unsignedornull(n:Nullable<string|number>) : uint | null
{
	if (!$ok(n)) { return null ; }
	if (typeof n === 'string') { n = parseInt(<string>n, 10) ; }
	return $isunsigned(n) ? n as uint : null ;
}

export function $unsigned(v:Nullable<string|number>, defaultValue:uint=<uint>0) : uint
{
	const n = $unsignedornull(v) ;
	return $ok(n) ? n as uint : defaultValue ;
}

export function $toint(v:Nullable<string|number>, defaultValue:int=<int>0) : int
{
    if (!$ok(v)) { return defaultValue ; }
    if (typeof v === 'string') { v = parseInt(<string>v, 10) ; }
    return isNaN(v!) ? defaultValue : Math.max(INT_MIN, _icast(Math.min(v!, INT_MAX))) as int ;
}

export function $tounsigned(v:Nullable<string|number>, defaultValue:uint=<uint>0) : uint
{
    if (!$ok(v)) { return defaultValue ; }
    if (typeof v === 'string') { v = parseInt(<string>v, 10) ; }
    return isNaN(v!) ? defaultValue : Math.max(UINT_MIN, _icast(Math.min(v!, UINT_MAX))) as uint ;
}

export function $div(a: number, b: number) : number { return _icast(a/b) ; }

export function $string(v:any) : string {
	if (!$ok(v)) return '' ;
	return typeof v === 'object' && 'toString' in v ? v.toString() : `${v}`;
}

export function $strings(v: Nullable<string[] | string>) : string[]
{ return $ok(v) ? ($isarray(v) ? v as string[] : [v as string]) : [] ; }

export function $totype<T>(v:any):T|null { return  $ok(v) ? <T>v : null ; }

/**
 *   We don't use standard trim because it does not trim all unicode whitespaces! 
 */
// left-trim
export function $ltrim(s:Nullable<string>) : string
{ return $length(s) ? (s as string).replace(FoundationLeftTrimRegex, "") : '' ; }

// right-trim
export function $rtrim(s: Nullable<string>) : string
{ return $length(s) ? (s as string).replace(FoundationRightTrimRegex, "") : '' ; }

// full-trim
export function $ftrim(s: Nullable<string>) : string
{ return $length(s) ? (s as string).replace(FoundationLeftTrimRegex, "").replace(FoundationRightTrimRegex, "") : '' ; }

export { $ftrim as $trim }

export function $lines(s: Nullable<string>) : string[]
{ return $ok(s) ? s!.split(FoundationNewLinesSplitRegex) : [] ; }

export function $normspaces(s: Nullable<string>) : string
{ return $ftrim(s).replace(FoundationFindAllWhitespacesRegex, " ") ; }

export function $firstcap(s: Nullable<string>) : string
{ return _capitalize(s, 1) ; }

export function $capitalize(s: Nullable<string>) : string
{ return _capitalize(s) ; }

export function $fpad2(v: number, failedChar?:string) : string { return $fpad(v,2, failedChar) ; }
export function $fpad3(v: number, failedChar?:string) : string { return $fpad(v,3, failedChar) ; }
export function $fpad4(v: number, failedChar?:string) : string { return $fpad(v,4, failedChar) ; }
export function $fpad(v: number, pad:number, failedChar?:string) : string {
    const isUnsigned = $isunsigned(v) ;
    return (isUnsigned ? v.toString() : '').padStart(pad, isUnsigned ? '0' : $length(failedChar) === 1 ? failedChar! : 'X') ; 
}
// for now $ascii() does not mak any transliterations from
// non-latin languages like Greek
export function $ascii(source: Nullable<string>) : string
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

export function $count<T=any>(a: Nullable<ArrayLike<T>>) : number
{ return $ok(a) ? (<ArrayLike<T>>a).length : 0 ; }

export function $length(s: Nullable<string | Uint8Array | TSData>) : number
{ return $ok(s) ? (<string|Uint8Array|TSData>s).length : 0 ; }

export function $lengthin(s: Nullable<string | Uint8Array | TSData>, min:number=0, max:number=INT_MAX) : boolean
{ const l = $length(s) ; return l >= min && l <= max ; }

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
export function $unit(n: Nullable<number>, opts:$unitOptions = {}) {
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

export function $octets(n: Nullable<number>, decimals:number = 2) {
    return $unit(n, { 
        decimals:decimals, 
        unit:'o', 
        unitName:'octets', 
        minimalUnit:0, 
        ignoreZeroDecimals:true,
        ignoreMinimalUnitDecimals:true
    }) ;
}

export function $meters(n: Nullable<number>, decimals:number = 2) {
    return $unit(n, { decimals:decimals})
}

/*
	This is a map function where callback returns as null or undefined are
	flushed from the result
 */
export function $map<T, R=T>(values: Nullable<Iterable<T>>, callback:(value: T, index: number) => Nullable<R>): R[]
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

export function $first<T = any>(values: Nullable<ArrayLike<T>>):T|undefined {
    const n = $count(values) ; return n > 0 ? values![0] : undefined ;
}

export function $last<T = any>(values: Nullable<ArrayLike<T>>):T|undefined {
    const n = $count(values) ; return n > 0 ? values![n-1] : undefined ;
}

// the sum of null, undefined or an empty array is always 0, 
// regardless of what it could contain
export function $sum<T=any>(values: Nullable<Iterable<T>>):number|undefined {
    // with that implementation undefined and null values are considered as 0 for the sum
    const [,,,sum] = _countsAndSum<T>(values) ;
    return sum ;
}

export interface $averageOptions {
    countsOnlyOKItems?:boolean ; // this one superseeds countsOnlyDefinedItems
    countsOnlyDefinedItems?:boolean ;
}

export function $average<T=any>(values:Nullable<Iterable<T>>, opts:$averageOptions = {}):number|undefined {
    let [count, definedCount, okCount, sum] = _countsAndSum<T>(values) ;
    
    if (opts.countsOnlyOKItems) { count = okCount ; }
    else if (opts.countsOnlyDefinedItems) { count = definedCount ; }

    return $defined(sum) && count > 0 ? sum!/count : undefined ;
}

function _countsAndSum<T>(values:Nullable<Iterable<T>>):[number, number, number, number|undefined] {
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
                        else if ('toNumber' in v!) { n = (v as any).toNumber() } 
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

export function $keys<T>(o:Nullable<T>):Array<keyof T> { return $ok(o) ? Object.getOwnPropertyNames(o!) as (keyof T)[] : [] ; }

export interface $partialOptions<T,U> {
    properties?:Array<keyof T | keyof U>,
    filter?: (v:T[keyof T]) => T[keyof T]|U[keyof U]|undefined;
}

// default filter supress undefined, null values and functions (methods for real class instances)
// if properties is not set, we use all the object keys to apply the filter
export function $partial<T,U>(a:Nullable<T>, opts:$partialOptions<T,U>={}):[U, number]
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
export function $dict<T = object>(source:Nullable<T>, keys?:Array<keyof T>):AnyDictionary {    
    const ret:AnyDictionary = {} ;
    if ($ok(source)) { 
        _fillObject<object,AnyDictionary>('dict', ret, source, { properties:keys as any[] }) ;
    }
    return ret ;
}

export function $includesdict(source:Nullable<object>, dict:AnyDictionary, keys?:string[]):boolean {
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

export function $fusion<T,U>(a:Nullable<T>, b:Nullable<U>, opts:$fusionOptions<T,U> = {}):[Partial<T> & Partial<U>, number]
{
    if (!$ok(a)) { return $ok(b) ? $partial(b, opts.B as any) : [{}, 0] }
    else if (!$ok(b)) { return $partial(a, opts.A as any) ; }

    let [ret, n] = $partial(a, opts.A) ;
    let fopts:_fillObjectOptions<T,U> = $ok(opts.B) ? { ... opts.B!} : {} ;
    if ($ok(opts.fusionArrays)) { fopts.fusionArrays = opts.fusionArrays! ; }
    if ($ok(opts.fusionObjects)) { fopts.fusionObjects = opts.fusionObjects! ; }
    n += _fillObject<T,U>('fusion', ret, b, fopts) ;
    return [ret as any, n] ;
}


export function $json(v:any, replacer: (number | string)[] | null = null, space: string | number = 2): string
{ return JSON.stringify(v, replacer, space) ; }

export function $bytesFromAsciiString(source:Nullable<string>, start:number = 0, end:number = $length(source)):uint8[] {
    let bytes:uint8[] = [] ;
    if (!$isunsigned(start) || !$isunsigned(end)) { throw '$bytesFromAsciiString(): start and end parameters must be true unsigned values' ; }       
    end = Math.min($length(source), $tounsigned(end)) ;
    start = Math.min(end, $tounsigned(start)) ;

    for (let i = start, j = 0 ; i < end ; i++, j++ ) {
        const c = source!.charCodeAt(i) ;
        if (c < 128) { bytes[j] = c as uint8 ; }
    }
    return bytes ;
}

// unknown encoding returns utf8
export function $encoding(e:Nullable<StringEncoding>):NormativeStringEncoding {
    if ($length(e) === 0 || e === 'utf8') { return 'utf8' ; }
    e = FoundationStringEncodings[e!] ;
    return e ? e : 'utf8' ;
}

export function $uint8ArrayToBinaryString(source:Nullable<Uint8Array>):string {
    const len = $count(source) ;
    let s = "" ;

    for (let i = 0 ; i < len ; i++) {
        s += String.fromCharCode(source![i])
    }
    return s ;

}

export function $binaryStringToUint8Array(source:Nullable<string>):Uint8Array {
    const len = $length(source) ;
    const ret = new Uint8Array(len) ;

    for (let i = 0 ; i < len ; i++) {
        ret[i] = source!.charCodeAt(i) & 0xff ;
    }

	return ret ;
}

const base64KeyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=" ;

export function $decodeBase64(input:string, reference:string=base64KeyStr) : Uint8Array
{
    var chr1, chr2, chr3;
    var enc1, enc2, enc3, enc4;
    var i = 0;
    var size = 0;
    const len = input.length ;
            
    input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

    var uint8 = new Uint8Array(input.length);

    while (i < len) {

        enc1 = reference.indexOf(input.charAt(i++));
        enc2 = reference.indexOf(input.charAt(i++));
        enc3 = reference.indexOf(input.charAt(i++));
        enc4 = reference.indexOf(input.charAt(i++));

        chr1 = (enc1 << 2) | (enc2 >> 4);
        chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
        chr3 = ((enc3 & 3) << 6) | enc4;

        uint8[size++] = (chr1 & 0xff);
        if (enc3 !== 64) {
            uint8[size++] = (chr2 & 0xff);
        }
	if (enc4 !== 64) {
            uint8[size++] = (chr3 & 0xff);
	}

    }
    return uint8.subarray(0,size);
}

export function $encodeBase64(source:Uint8Array|string, reference:string=base64KeyStr):string
{
    var output = "";
    var chr1, chr2, chr3, enc1, enc2, enc3, enc4;

    const input = $isstring(source) ? $binaryStringToUint8Array(source as string) : source as Uint8Array ;
    const len = input.length ;
    var i = 0;
    
    while (i < len) {
        chr1 = input[i++];
        chr2 = input[i++];
        chr3 = input[i++];
 
        enc1 = chr1 >> 2;
        enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
        enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
        enc4 = chr3 & 63;
 
        if (isNaN(chr2)) {
            enc3 = enc4 = 64;
        } else if (isNaN(chr3)) {
            enc4 = 64;
        }
        output = output + reference.charAt(enc1) + reference.charAt(enc2) + reference.charAt(enc3) + reference.charAt(enc4);
    }
    return output;
}

// ===== private functions ===================================
function _regexvalidatedstring<T>(regex:RegExp, s:Nullable<string>) : T | null 
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
        filteredMap: <R = T>(callback:(value: T, index: number) => Nullable<R>) => R[] ;
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
        lines: (this:string) => string[] ;
        toInt:  (this:string, defaultValue?:int) => int ;
        toUnsigned:  (this:string, defaultValue?:uint) => uint ;
        isNewLine:   (this:string) => boolean ;
        isWhiteSpace:(this:string) => boolean ;
        isStrictWhiteSpace:(this:string) => boolean ;
    }

    export interface Number {
        unit:   (this:number, opts?:$unitOptions) => string ;
        meters: (this:number, decimals?:number) => string ;
        octets: (this:number, decimals?:number) => string ;
        fpad:   (this:number, pad:number, failedChar?:string) => string ;
        fpad2:  (this:number, failedChar?:string) => string ;
        fpad3:  (this:number, failedChar?:string) => string ;
        fpad4:  (this:number, failedChar?:string) => string ;
        toInt:  (this:number, defaultValue?:int) => int ;
        toUnsigned:  (this:number, defaultValue?:uint) => uint ;
        isNewLine:   (this:number) => boolean ;
        isWhiteSpace:(this:number) => boolean ;
        isStrictWhiteSpace:(this:number) => boolean ;
    }
}

if (!('fpad' in Number.prototype)) {
    Number.prototype.unit = function unit(this:number, opts?:$unitOptions) { return $unit(this, opts) ; }
    Number.prototype.meters = function meters(this:number, decimals?:number) { return $meters(this, decimals) ; }
    Number.prototype.octets = function octets(this:number, decimals?:number) { return $octets(this, decimals) ; }
    Number.prototype.fpad  = function fpad(this:number, pad:number, failedChar?:string) { return $fpad(this, pad, failedChar) ; }
    Number.prototype.fpad2 = function fpad(this:number, failedChar?:string) { return $fpad(this, 2, failedChar) ; }
    Number.prototype.fpad3 = function fpad(this:number, failedChar?:string) { return $fpad(this, 3, failedChar) ; }
    Number.prototype.fpad4 = function fpad(this:number, failedChar?:string) { return $fpad(this, 4, failedChar) ; }
    Number.prototype.isNewLine = function isNewLine(this:number) { return this === 10 || this === 11 || this === 12 || this === 13 ; }
    Number.prototype.isWhiteSpace = function isWhiteSpace(this:number) { return FoundationWhiteSpacesNumberCodeSet.has(this) ; }
    Number.prototype.isStrictWhiteSpace = function isWhiteSpace(this:number) { return FoundationStricWhiteSpacesNumberCodeSet.has(this) ; }
}

if (!('toInt' in Number.prototype)) {
    Number.prototype.toInt = function toInt(this:number, defaultValue?:int) { return $toint(this, defaultValue) ; }
}
if (!('toInt' in String.prototype)) {
    String.prototype.toInt = function toInt(this:string, defaultValue?:int) { return $toint(this, defaultValue) ; }
}

if (!('toUnsigned' in Number.prototype)) {
    Number.prototype.toUnsigned = function toUnsigned(this:number, defaultValue?:int) { return $tounsigned(this, defaultValue) ; }
}
if (!('toUnsigned' in String.prototype)) {
    String.prototype.toUnsigned = function toUnsigned(this:string, defaultValue?:int) { return $tounsigned(this, defaultValue) ; }
}

if (!('isWhiteSpace' in String.prototype)) {
    String.prototype.isWhiteSpace = function isNewLine(this:string) { return FoundationWhiteSpacesStringCodeSet.has(this) ; }
    String.prototype.isStrictWhiteSpace = function isNewLine(this:string) { return FoundationStrictWhiteSpacesStringCodeSet.has(this) ; }
}
if (!('isNewLine' in String.prototype)) {
    String.prototype.isNewLine = function isNewLine(this:string) { return this === '\u000a' || this === '\u000b' || this === '\u000c' || this === '\u000d' ; }
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
if (!('lines' in String.prototype)) {
    String.prototype.lines  = function lines(this:string):string[] { return $lines(this) ; }
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
    Array.prototype.filteredMap = function filteredMap<T, R>(this: T[], callback:(e:T,index:number) => Nullable<R>):R[] { return $map(this, callback) ; }
}

function _icast(v:number):number {
    return v >= 0 ? (v! <= UINT32_MAX ? v | 0 : Math.floor(v)) : (v! >= INT32_MIN ? -((-v) | 0) : -Math.floor(-v)) ;
}

function _capitalize(s:Nullable<string>, max:number = 0) : string 
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
