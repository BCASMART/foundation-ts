import { $equal } from "./compare";
import { FoundationStringEncodingsMap, FoundationWhiteSpacesNumberCodeSet, FoundationWhiteSpacesStringCodeSet } from "./string_tables";
import { $components, $components2string, $parsedatetime, TSDateComp, TSDateForm } from "./tsdatecomp";
import { $country } from "./tsdefaults";
import { int, INT_MAX, INT_MIN, UINT_MAX, uint, email, url, UUID, UUIDVersion, isodate, Address, Nullable, UINT_MIN, StringEncoding, NormativeStringEncoding, Bytes, INT_MIN_BIG, INT_MAX_BIG, UINT_MIN_BIG, UINT_MAX_BIG, TSDataLike, TSDictionary, EMAIL_MIN_LENGTH, UUID_LENGTH } from "./types";
import { TSData } from "./tsdata";
import { TSDate } from "./tsdate";
import { $ftrim } from "./strings";
import { $icast } from "./number";
import { TSError } from "./tserrors";
import { TSCountry } from "./tscountry";
import { PhoneValidity, TSPhoneNumber } from "./tsphonenumber";
import { TSURL, TSURLParseOptions } from "./tsurl";

export function $defined<T>(o: T): o is Exclude<T, undefined>
{ return o !== undefined ; }

export function $ok<T>(o: T): o is NonNullable<T>
{ return o !== null && o !== undefined ; }

export function $value<T>(o:Nullable<T>, v:T):T
{ return $ok(o) ? o : v ; }

export function $valueornull<T>(o:Nullable<T>):T|null
{ return $ok(o) ? o : null ;}

export function $valueorundefine<T>(o:Nullable<T>):T|undefined
{ return $ok(o) ? o : undefined ;}

export function $isstring(o: any): o is string
{ return typeof o === 'string' ; }

export function $iswhitespace(s: Nullable<string|number>) : boolean
{ return typeof s === 'string' ? FoundationWhiteSpacesStringCodeSet.has(s) : ($ok(s) ? FoundationWhiteSpacesNumberCodeSet.has(s) : false) ; }

export function $isnumber(o: any): o is number
{ return typeof o === 'number' && isFinite(o) ; }

export function $isint(o:any, minimum:number = INT_MIN, maximum:number = INT_MAX) : o is number
{ return typeof o === 'number' && Number.isSafeInteger(<number>o) && <number>o >= minimum && <number>o <= maximum; }

export function $isunsigned(o:any, maximum:number=UINT_MAX) : o is number
{ return typeof o === 'number' && Number.isSafeInteger(<number>o) && <number>o >= 0 && <number>o <= maximum ; }

export function $isbool(o: any): o is boolean
{ return typeof o === 'boolean' ; }

export function $isobject(o: any): o is object
{ return $ok(o) && typeof o === 'object' ; }

export function $objectcount(o:any) : number 
{ return o instanceof Map ? o.size : ($isobject(o) ? $keys(o).length : 0) ; }

export function $isarray(o:any) : o is any[]
{ return Array.isArray(o) ; }

export function $isiterable(o:any) : boolean 
{ return $isarray(o) || $ismethod(o, Symbol.iterator) ;}

export function $isdate(o:any) : o is Date | TSDate | string
{ return (o instanceof Date || o instanceof TSDate || typeof o === 'string') && $ok($isodate(o)) ; }

export function $isemail(o:any) : o is string 
{ return typeof o === 'string' && $ok($email(o)) ; }

export function $isurl(o:any, opts?:Nullable<TSURLParseOptions>) : o is TSURL | URL | string
{ return (o instanceof TSURL) || (o instanceof URL && $ok(TSURL.from(o, opts))) || (typeof o === 'string' && $ok(TSURL.url(o, opts))) ; }

export function $isphonenumber(o:any, country?:Nullable<TSCountry>) : o is TSPhoneNumber | string
{ return o instanceof TSPhoneNumber || (typeof o === 'string' && TSPhoneNumber.validity(o, country) === PhoneValidity.OK) ; }

export function $isuuid(o:any, version?:Nullable<UUIDVersion> /* default version is UUIDv1 */) : o is string
{ return typeof o === 'string' && $ok($UUID(o, version)) ; }

// a very restrictive test excluding arrays of numbers or other kind of object
export function $isdataobject(o:any) : o is TSData | Uint8Array | ArrayBuffer
{ return o instanceof TSData || o instanceof Uint8Array || o instanceof ArrayBuffer ; }

export function $isfunction(o:any):o is Function { return typeof o === 'function' ; }

export function $isproperty(obj:any, prop:string):boolean
{ return prop.length > 0 && $isobject(obj) && (prop in obj) ; }

export function $ismethod(obj:any, meth:Nullable<string|symbol>):boolean
{ return (typeof meth === 'symbol' || $length(meth) > 0) && $ok(obj) && $isfunction(obj[meth!]) ; }

export function $isipv4(o:any):o is string
{ return typeof o === 'string' && __IPV4Regex.test($ftrim(o)) ; }

export function $isipv6(o:any):boolean
{ return typeof o === 'string' && __IPV6Regex.test($ftrim(o)) ; }

export function $isipaddress(o:any):o is string
{ 
    if (typeof o !== 'string') { return false ; }
    o = $ftrim(o) ; 
    return __IPV4Regex.test(o) || __IPV6Regex.test(o) ; 
}

export function $hasproperties(obj:any, properties:Nullable<string[]>)
{
    if (!$isobject(obj) || !$count(properties)) { return false ; }
    for (let p of properties!) { if (!p.length || !(p in obj)) return false ; }
    return true ;
}

export function $intornull(n:Nullable<string|number|bigint>) : int | null
{
	if (!$ok(n)) { return null ; }
	else if (typeof n === 'string') { n = parseInt(n, 10) ; }
    else if (typeof n === 'bigint') {
        return n >= INT_MIN_BIG && n <= INT_MAX_BIG ? Number(n) as int : null ;
    
    }
	return $isint(n) ? <int>n : null ;
}

export function $int(n:Nullable<string|number|bigint>, defaultValue:int=<int>0) : int
{ return $value($intornull(n), defaultValue) ; }

export function $email(s:Nullable<string>) : email | null
{
    const m = _regexvalidatedstring<email>(__emailRegex, s, EMAIL_MIN_LENGTH) ; // smallest email is a@b.xx where xx is the domain name
    return $ok(m) ? m!.toLowerCase() as email : null ;
}

export function $phonenumber(s:Nullable<string>, country?:Nullable<TSCountry>): TSPhoneNumber | null
{ return TSPhoneNumber.fromString(s, country) ; }

export function $isophone(s:Nullable<string>, country?:Nullable<TSCountry>): string | null
{ return $valueornull(TSPhoneNumber.fromString(s, country)?.toString()) ;}

export function $url(s:Nullable<string>, opts?:Nullable<TSURLParseOptions>) : url | null
{ return $valueornull(TSURL.url(s, opts)?.href); }

export function $UUID(s:Nullable<string>, version?:Nullable<UUIDVersion> /* default version is UUIDv1 */) : UUID | null
{ return typeof s === 'string' ? _regexvalidatedstring<UUID>(version === 4 ? __uuidV4Regex : __uuidV1Regex, s, UUID_LENGTH, UUID_LENGTH) : null ; }

export type IsoDateFormat = TSDateForm.ISO8601C | TSDateForm.ISO8601L | TSDateForm.ISO8601

export function $isodate(s:Nullable<Date|TSDate|string>, format:IsoDateFormat=TSDateForm.ISO8601) : isodate | null
{
    let cps:TSDateComp|null = null ;
    if ($ok(s)) {
        if (s instanceof Date) { cps = $components(s) ; }
        else if (s instanceof TSDate) { cps = s.toComponents() ; }
        else if (typeof s === 'string') { cps = $parsedatetime($ftrim(s), format) ; } // we parse the string to verify it
    }
    return $ok(cps) ? <isodate>$components2string(cps, format) : null ;
}
export function $address(a:Nullable<Address>) : Address | null 
{
    if (!$isobject(a)) { return null ; }
    const city = $ftrim(a?.city) ;
    const country = $country(a?.country) ;
    if (typeof city !== 'string' || city.length === 0 || !$ok(country)) { return null ; }

    let ret:Address = {...a!} ;
    ret.city = city! ;
    ret.country = country! ;

    return ret ;
}

export function $unsignedornull(n:Nullable<string|number|bigint>) : uint | null
{
	if (!$ok(n)) { return null ; }
	else if (typeof n === 'string') { n = parseInt(<string>n, 10) ; }
    else if (typeof n === 'bigint') {
        return n >= UINT_MIN_BIG && n <= UINT_MAX_BIG ? Number(n) as uint : null ;
    }
	return $isunsigned(n) ? n as uint : null ;
}

export function $unsigned(v:Nullable<string|number|bigint>, defaultValue:uint=<uint>0) : uint
{ return $value($unsignedornull(v), defaultValue) ; }

export function $toint(v:Nullable<string|number|bigint>, defaultValue:int=<int>0) : int
{
    if (!$ok(v)) { return defaultValue ; }
    else if (typeof v === 'bigint') {
        v = v >= INT_MIN_BIG && v <= INT_MAX_BIG ? Number(v) : defaultValue ;
    }
    else if (typeof v === 'string') { v = parseInt(v, 10) ; }
    return isNaN(v) ? defaultValue : Math.max(INT_MIN, $icast(Math.min(v, INT_MAX))) as int ;
}

export function $tounsigned(v:Nullable<string|number>, defaultValue:uint=<uint>0) : uint
{
    if (!$ok(v)) { return defaultValue ; }
    else if (typeof v === 'bigint') {
        v = v >= UINT_MIN_BIG && v <= UINT_MAX_BIG ? Number(v) : defaultValue ;
    }
    else if (typeof v === 'string') { v = parseInt(v, 10) ; }
    return isNaN(v) ? defaultValue : Math.max(UINT_MIN, $icast(Math.min(v, UINT_MAX))) as uint ;
}
export interface $stringOptions {
    objectToStringConversion: (v:any) => string ;
    nullRepresentation:string ;
    undefinedRepresentation:string ;
    trueValue: string ;
    falseValue: string ;
}

const __default$stringOptions: $stringOptions = {
    // mirrors what `${v}` / String(v) actually do — ToPrimitive with hint
    // "string" — but never throws, and is stricter than the real algorithm
    // about what counts as a usable answer at each step, since none of these
    // methods are trusted to respect the contract their name implies :
    //   1. [Symbol.toPrimitive]('string') : only a string or a symbol counts.
    //      A symbol is routed back through $string()'s own symbol case rather
    //      than used directly, since `${aSymbol}` throws. Anything else
    //      (including a number — it did not honour the 'string' hint we gave
    //      it) is trashed : we don't trust a hint-ignoring answer.
    //   2. toString() : only a string counts — its entire contract is to
    //      return one, and every standard/native object that has a callable
    //      toString (own or inherited, right down to boxed Boolean/BigInt/
    //      Symbol) already does. Anything else is trashed.
    //   3. valueOf() : last resort ; a string or a number counts (the two
    //      shapes real wrapper objects hand back), anything else — including
    //      the default Object.prototype.valueOf, which just returns the
    //      object itself — is trashed.
    // A method that throws is treated exactly like one that returned nothing
    // usable : move on to the next. None of the three accepted result types
    // (string/symbol/number) ever depend on $stringOptions to format, so the
    // bare recursive $string(p) below needs no options forwarded.
    objectToStringConversion: (v:any):string => {
        const toPrimitive = v[Symbol.toPrimitive] ;
        if (typeof toPrimitive === 'function') {
            try {
                const p = toPrimitive.call(v, 'string') ;2
                if (typeof p === 'string') { return p ; }
                if (typeof p === 'symbol') { return $symbol2string(p) ; }
            }
            catch { /* v's [Symbol.toPrimitive] misbehaved : fall through to toString() */ }
        }
        const toString = v.toString ;
        if (typeof toString === 'function') {
            try {
                const p = toString.call(v) ;
                if (typeof p === 'string') { return p ; }
            }
            catch { /* fall through to valueOf() */ }
        }
        const valueOf = v.valueOf ;
        if (typeof valueOf === 'function') {
            try {
                const p = valueOf.call(v) ;
                if (typeof p === 'string') { return p ; }
                if (typeof p === 'number') { return ''+p ; } // fastest number conversion (see $string() for details)
            }
            catch { /* nothing left to try */ }
        }
        return '' ;
    },
    nullRepresentation: '',
    undefinedRepresentation: '',
    trueValue: 'true',
    falseValue: 'false'
} ;

export function $string(v:any, options?:$stringOptions) : string {
    const opts = options ?? __default$stringOptions ;
    const t = typeof(v) ;
    switch (t) {
        case 'string': return v ;
        case 'symbol': return $symbol2string(v) ; // exports the symbol local or global key xxx instead of 'Symbol(xxx)
        case 'undefined': return opts.undefinedRepresentation ;
        case 'object':
            if (v === null) { return opts.nullRepresentation ; }
            // a boxed Boolean (`new Boolean(...)`/`Object(true)`) is the one wrapper
            // whose plain-object route (toString() -> "true"/"false") would silently
            // bypass trueValue/falseValue ; boxed Number/BigInt/String have no such
            // customizable representation to bypass, so only this one needs
            // intercepting before it ever reaches objectToStringConversion.
            if (v instanceof Boolean) { return v.valueOf() ? opts.trueValue : opts.falseValue ; }
            return opts.objectToStringConversion(v) ;
        case 'boolean': return v ? opts.trueValue : opts.falseValue ;
        case 'number': return ''+v ; // fastest way to convert a number to string (twice as fast as calling v.toString() or String(v))
        default: return v.toString() ; // Function, BigInt and Number have a toString() method
    }
}


export function $array<T=any>(...values:T[]):T[] { return values ; }

export function $strings(...values: Array<Nullable<string[] | string>>) : string[]
{
    // for now we try to avoid single parameter string[] or string copy
    switch (values.length) {
        case 0: 
            return [] ;
        case 1: 
            return typeof values[0] === 'string' ? values as string[] : ($isarray(values[0]) ? values[0] : []) ;
        default:{
            const ret:string[] = [] ;
            values.forEach(v => {
                if (typeof v === 'string') { ret.push(v) ; }
                else if ($isarray(v)) { v.forEach(s => ret.push(s))}
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

export function $count<T=any>(a: Nullable<ArrayLike<T> | Set<T>>) : number
{ return a instanceof Set ? a.size : ($ok(a) ? (<ArrayLike<T>>a).length : 0) ; }

export function $length(s: Nullable<string | TSDataLike | Blob>) : number
{ 
    return s instanceof Blob ? 
        s.size : 
        (s instanceof ArrayBuffer ? 
            s.byteLength : 
            ($ok(s) ? (<string|Bytes|TSData>s).length : 0)) ; 
}

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

// own enumerable keys only : getOwnPropertyNames() would also return non-enumerable
// own properties, e.g. an Array's own "length" — $objectcount([1,2,3]) must stay 3.
export function $keys<T>(o:Nullable<T>):Array<keyof T> { return $ok(o) ? Object.keys(o!) as (keyof T)[] : [] ; }

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

// TODO: review all TSDictionary functions to make a specific file 
// and a more thorough specifications. Here, all null, undefined and function
// properties are removed
export function $dict<T = object>(source:Nullable<T>, keys?:Array<keyof T>):TSDictionary {    
    const ret:TSDictionary = {} ;
    if ($ok(source)) { 
        _fillObject<object,TSDictionary>('dict', ret, source, { properties:keys as any[] }) ;
    }
    return ret ;
}

// WARNING: we only discard key, value pair if undefined is returned by 
//          the callback function on any value of the tupple 
//          default callback function transform key to string and discards
//          the entry if the returned key is null, undefined or an empty string
export function $objectMap<T = object>(source:Nullable<T>, callback?:(key:any, value: any) => [string|undefined, any]):Map<string, any> {
    if (!$ok(callback)) { 
        callback = function(k:string, v:any) {
            const tk = $string(k) ; 
            return tk.length > 0 ? [tk, v] : [undefined, v] ; 
        } ; 
    }
    const map = new Map<string, any>() ;

    if (source instanceof Map) {
        const entries = (source as Map<any, any>).entries() ;
        for (let [k0, v0] of entries) {
            const [k, v] = callback!(k0, v0) ;
            if ($defined(k) && $defined(v)) { map.set(k, v) ;}
        }
    }
    else {
        const keys = $keys(source) ;
        for (let key of keys) {
            const [k, v] = callback!(key as string, (source as T)[key]) ;
            if ($defined(k) && $defined(v)) { map.set(k, v) ;}
        }    
    }
    return map ;
}

export function $includesdict(source:Nullable<object>, dict:TSDictionary, keys?:string[]):boolean {
    if ($ok(source)) {
        keys = $ok(keys) ? keys : $keys(dict) as string[] ;
        if (keys.length) {
            const v = source as TSDictionary ;
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
    if ($ok(opts.fusionArrays)) { fopts.fusionArrays = opts.fusionArrays ; }
    if ($ok(opts.fusionObjects)) { fopts.fusionObjects = opts.fusionObjects ; }
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

export function $symbol2string(v:symbol):string {
    const s = v.toString() ;
    if (s.startsWith('Symbol(') && s.endsWith(')')) {
        return s.slice(7, s.length - 1) ;
    }
    return $value(Symbol.keyFor(v), '') ;
}

// ===== private exported objects ============================
/** @internal */
export const __uuidV1Regex:RegExp   = /^[A-F\d]{8}-[A-F\d]{4}-[A-F\d]{4}-[A-F\d]{4}-[A-F\d]{12}$/i ;

/** @internal */
export const __uuidV4Regex:RegExp = /^[A-F\d]{8}-[A-F\d]{4}-4[A-F\d]{3}-[89AB][A-F\d]{3}-[A-F\d]{12}$/i ;

// ===== private functions ===================================

// BUG fixed:
// ===========================================================================
// domain part used to read (label\.{0,1})+ : a label is one-or-more non-dot
// chars followed by an OPTIONAL dot, repeated one-or-more times. Since the
// trailing dot is optional on every repetition, a long dot-free run of chars
// can be re-partitioned across that outer "+" in 2^(n-1) different ways, so a
// crafted "a@" + "a".repeat(n) + "<" input (garbage the pattern can never
// consume) made the engine explore all of them before failing : catastrophic
// backtracking, ~doubling in time every 2 extra chars (n=24 -> ~1s, n=26+ ->
// many seconds). Requiring the dot on every repetition (label\.)* removes the
// ambiguity : each repetition must consume an actual "." from the input, so
// there is exactly one way to partition a given string, not exponentially many.
const __emailRegex:RegExp = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()\.,;\s@\"]+\.)*([^<>()\.,;:\s@\"]{2,}|[\d\.]+))$/ ;

function _regexvalidatedstring<T>(regex:RegExp, s:Nullable<string>, minLength?:Nullable<number>, maxLength?:number) : T | null 
{
	const v = $ftrim(s) ;
    const min = $value(minLength, 1) ;
    const max = $value(maxLength, UINT_MAX) ;
	if (v.length < min || v.length > max || !regex.test(v)) { return null ; }
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
            if (typeof p !== 'string') { 
                TSError.throw(`$${fn}() needs to have valid string properties`, 
                { function:fn, source:source, destination:destination, options:opts}) ; 
            }
            const v = opts.filter(source[p]) ; 
            if ($defined(v)) {
                if (fusion_arrays && $isarray(v) && $isarray(destination[p])) { 
                    destination[p] = opts.fusionArrays!(destination[p], v) ;
                }
                else if (fusion_objects && $isobject(v) && $isobject(destination[p])) {
                    destination[p] = opts.fusionObjects!(destination[p], v) ;
                }
                else { destination[p] = v ; }
                ret++ ; 
            } 
        }    
    }
    return ret ;
}
const __IPV6Regex = /^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$/
const __IPV4Regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/

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
