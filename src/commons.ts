import { $equal } from "./compare";
import { FoundationStringEncodingsMap, FoundationWhiteSpacesNumberCodeSet, FoundationWhiteSpacesStringCodeSet } from "./string_tables";
import { $components, $components2string, $parsedatetime, TSDateComp, TSDateForm } from "./tsdatecomp";
import { $country } from "./tsdefaults";
import { int, INT_MAX, INT_MIN, UINT_MAX, uint, email, emailRegex, url, UUID, urlRegex, uuidV1Regex, uuidV4Regex, UUIDVersion, isodate, Address, AnyDictionary, Nullable, UINT_MIN, StringEncoding, NormativeStringEncoding, Bytes, INT_MIN_BIG, INT_MAX_BIG, UINT_MIN_BIG, UINT_MAX_BIG, TSDataLike, UUIDv1, UUIDv4 } from "./types";
import { TSData } from "./tsdata";
import { TSDate } from "./tsdate";
import { $ftrim } from "./strings";
import { $icast } from "./number";
import { TSError } from "./tserrors";

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
{ return typeof o === 'string' ; }

export function $iswhitespace(s: Nullable<string|number>) : boolean
{ return $isstring(s) ? FoundationWhiteSpacesStringCodeSet.has(s as string) : ($ok(s) ? FoundationWhiteSpacesNumberCodeSet.has(s as number) : false) ; }

export function $isnumber(o:any) : boolean
{ return typeof o === 'number' && !isNaN(<number>o) && isFinite(<number>o) ; }

export function $isint(o:any) : boolean
{ return typeof o === 'number' && Number.isSafeInteger(<number>o) && <number>o >= INT_MIN && <number>o <= INT_MAX; }

export function $isunsigned(o:any, maximum:number=UINT_MAX) : boolean
{ return typeof o === 'number' && Number.isSafeInteger(<number>o) && <number>o >= 0 && <number>o <= maximum ; }

export function $isbool(o:any) : boolean
{ return typeof o === 'boolean' ; }

export function $isobject(o:any) : boolean
{ return $ok(o) && typeof o === 'object' ; }

export function $objectcount(o:any) : number 
{ return $isobject(o) ? $keys(o).length : 0 ; }

export function $isarray(o:any) : boolean
{ return Array.isArray(o) ; }

export function $isiterable(o:any) : boolean 
{ return $isarray(o) || $ismethod(o, Symbol.iterator) ;}

export function $isdate(o:any) : boolean
{ return (o instanceof Date || o instanceof TSDate || $isstring(o)) && $ok($isodate(o)) ; }

export function $isemail(o:any) : boolean
{ return $isstring(o) && $ok($email(o)) ; }

export function $isurl(o:any, opts?:$urlOptions) : boolean
{ return o instanceof URL || ($isstring(o) && $ok($url(o, opts))) ; }

export function $isuuid(o:any, version?:Nullable<UUIDVersion> /* default version is UUIDv1 */) : boolean
{ return $isstring(o) && $ok($UUID(o, version)) ; }

export function $isfunction(o:any):boolean { return typeof o === 'function' ; }

export function $isproperty(obj:any, prop:string):boolean
{ return prop.length > 0 && $isobject(obj) && (prop in obj) ; }

export function $ismethod(obj:any, meth:Nullable<string|symbol>):boolean
{ return (typeof meth === 'symbol' || $length(meth) > 0) && $ok(obj) && $isfunction(obj![meth!]) ; }

export function $hasproperties(obj:any, properties:Nullable<string[]>)
{
    if (!$isobject(obj) || !$count(properties)) { return false ; }
    for (let p of properties!) { if (!p.length || !(p in obj)) return false ; }
    return true ;
}

export function $intornull(n:Nullable<string|number|bigint>) : int | null
{
	if (!$ok(n)) { return null ; }
	else if ($isstring(n)) { n = parseInt(<string>n, 10) ; }
    else if (typeof n === 'bigint') {
        return n >= INT_MIN_BIG && n <= INT_MAX_BIG ? Number(n as bigint) as int : null ;
    
    }
	return $isint(n) ? <int>n : null ;
}

export function $int(n:Nullable<string|number|bigint>, defaultValue:int=<int>0) : int
{ return $value($intornull(n), defaultValue) ; }

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

export function $UUID(s:Nullable<string>, version?:Nullable<UUIDVersion> /* default version is UUIDv1 */) : UUID | null
{ 
    if (!$isstring(s)) { return null ; } 
    return _regexvalidatedstring<UUID>($value(version, UUIDv1) === UUIDv4 ? uuidV4Regex:uuidV1Regex, s) ; 
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

export function $unsignedornull(n:Nullable<string|number|bigint>) : uint | null
{
	if (!$ok(n)) { return null ; }
	else if ($isstring(n)) { n = parseInt(<string>n, 10) ; }
    else if (typeof n === 'bigint') {
        return n >= UINT_MIN_BIG && n <= UINT_MAX_BIG ? Number(n as bigint) as uint : null ;
    }
	return $isunsigned(n) ? n as uint : null ;
}

export function $unsigned(v:Nullable<string|number|bigint>, defaultValue:uint=<uint>0) : uint
{ return $value($unsignedornull(v), defaultValue) ; }

export function $toint(v:Nullable<string|number|bigint>, defaultValue:int=<int>0) : int
{
    if (!$ok(v)) { return defaultValue ; }
    else if (typeof v === 'bigint') {
        v = v >= INT_MIN_BIG && v <= INT_MAX_BIG ? Number(v as bigint) : defaultValue ;
    }
    else if ($isstring(v)) { v = parseInt(<string>v, 10) ; }
    return isNaN(v as number) ? defaultValue : Math.max(INT_MIN, $icast(Math.min(v as number, INT_MAX))) as int ;
}

export function $tounsigned(v:Nullable<string|number>, defaultValue:uint=<uint>0) : uint
{
    if (!$ok(v)) { return defaultValue ; }
    else if (typeof v === 'bigint') {
        v = v >= UINT_MIN_BIG && v <= UINT_MAX_BIG ? Number(v as bigint) : defaultValue ;
    }
    else if ($isstring(v)) { v = parseInt(<string>v, 10) ; }
    return isNaN(v as number) ? defaultValue : Math.max(UINT_MIN, $icast(Math.min(v as number, UINT_MAX))) as uint ;
}

export function $string(v:any) : string {
    if ($isstring(v)) { return v ; }
    else if ($ismethod(v, 'toString')) { return v.toString() ; }
    else { return $ok(v) ? `${v}` : '' ; }
}

export function $array<T=any>(...values:T[]):T[] { return values ; }

export function $strings(...values: Array<Nullable<string[] | string>>) : string[]
{
    // for now we try to avoid single parameter string[] or string copy
    switch (values.length) {
        case 0: 
            return [] ;
        case 1: 
            return $isstring(values[0]) ? values as string[] : ($isarray(values[0]) ? values[0] as string[] : []) ;
        default:{
            const ret:string[] = [] ;
            values.forEach(v => {
                if ($isstring(v)) { ret.push(v as string) ; }
                else if ($isarray(v)) { (v as string[]).forEach(s => ret.push(s))}
            });
            return ret ;        
        }
    }
}

export function $totype<T>(v:any):T|null { return  $ok(v) ? <T>v : null ; }

export function $capacityForCount(count:number):uint
{
    count = count <= 0 ? 0 : Math.ceil(count) ;
    return (count < 128 ? __capacitiesForCounts[count] : ((count + (count >> 1)) & ~255) + 256) as uint; 
}

export function $count<T=any>(a: Nullable<ArrayLike<T>>) : number
{ return $ok(a) ? (<ArrayLike<T>>a).length : 0 ; }

export function $length(s: Nullable<string | TSDataLike>) : number
{ return s instanceof ArrayBuffer ? s.byteLength : ($ok(s) ? (<string|Bytes|TSData>s).length : 0) ; }

export function $lse<T>(s:Nullable<string | TSDataLike | ArrayLike<T>>, start?:Nullable<number>, end?:Nullable<number>) : [uint, uint, uint, uint] {
    if (!$ok(s)) { return [0, 0, 0, 0] as [uint, uint, uint, uint];}
    const len = s instanceof ArrayBuffer ? s.byteLength : s!.length ;
    start = $tounsigned(start);
    end = Math.min($tounsigned(end, len as uint), len) ;
    return [len, start, end, Math.max(end-start, 0)] as [uint, uint, uint, uint] ;
}

export function $lengthin(s: Nullable<string | Bytes | TSData>, min:number=0, max:number=INT_MAX) : boolean
{ const l = $length(s) ; return l >= min && l <= max ; }

export function $jsonobj(v:any): any
{

    if (!$ok(v)) { return v ; }
    if ($ismethod(v, 'toJSON')) { return v.toJSON() ; }

	switch(typeof v) {
		case 'object':
		case 'boolean':
		case 'number':
		case 'bigint':
		case 'string':
			return v ;
		default:
            // JSON.stringify() on symbol returns undefined, so keep it that way
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

// unknown encoding returns utf8
export function $encoding(e:Nullable<StringEncoding>):NormativeStringEncoding {
    if ($length(e) === 0 || e === 'utf8') { return 'utf8' ; }
    return $value(FoundationStringEncodingsMap.get(e!), 'utf8') ;
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
            if (!$isstring(p)) { 
                throw new TSError(`${fn}() needs to have valid string properties`, 
                { function:fn, source:source, destination:destination, options:opts}) ; 
            }
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
