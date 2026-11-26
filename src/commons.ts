import { $equal } from "./compare";
import { FoundationStringEncodingsMap, FoundationWhiteSpacesNumberCodeSet, FoundationWhiteSpacesStringCodeSet } from "./string_tables";
import { $components, $components2string, $parsedatetime, TSDateComp, TSDateForm } from "./tsdatecomp";
import { $country } from "./tsdefaults";
import { int, INT_MAX, INT_MIN, UINT_MAX, uint, email, url, UUID, UUIDVersion, isodate, Address, Nullable, UINT_MIN, StringEncoding, NormativeStringEncoding, Bytes, INT_MIN_BIG, INT_MAX_BIG, UINT_MIN_BIG, UINT_MAX_BIG, TSDataLike, TSDictionary, EMAIL_MIN_LENGTH, EMAIL_MAX_LENGTH, UUID_LENGTH } from "./types";
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
{
    if (typeof s === 'string') { return FoundationWhiteSpacesStringCodeSet.has(s) ; }
    return $ok(s) && FoundationWhiteSpacesNumberCodeSet.has(s) ;
}

export function $isnumber(o: any): o is number
{ return typeof o === 'number' && Number.isFinite(o) ; }

export function $isint(o:any, minimum:number = INT_MIN, maximum:number = INT_MAX) : o is number
{ return typeof o === 'number' && Number.isSafeInteger(<number>o) && <number>o >= minimum && <number>o <= maximum; }

export function $isunsigned(o:any, maximum:number=UINT_MAX) : o is number
{ return typeof o === 'number' && Number.isSafeInteger(<number>o) && <number>o >= 0 && <number>o <= maximum ; }

export function $isbool(o: any): o is boolean
{ return typeof o === 'boolean' ; }

export function $isobject(o: any): o is object
{ return $ok(o) && typeof o === 'object' ; }

export function $objectcount(o:any) : number 
{
    if (o instanceof Map) { return o.size ; }
    return $isobject(o) ? $keys(o).length : 0 ;
}

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

// '__proto__', 'constructor' and 'prototype' are never read or written from external data: writing
// obj['__proto__'] changes the prototype of obj, and these keys give access to the functions which
// build the objects. A key which is not a string (eg. a symbol) is not a safe key either
const __unsafeKeys = new Set(['__proto__', 'constructor', 'prototype']) ;
export function $issafekey(k:any):boolean { return typeof k === 'string' && !__unsafeKeys.has(k) ; }

export function $isproperty(obj:any, prop:string):boolean
{ return prop.length > 0 && $isobject(obj) && (prop in obj) ; }

export function $ismethod(obj:any, meth:Nullable<string|symbol>):boolean
{ return (typeof meth === 'symbol' || $length(meth) > 0) && $ok(obj) && $isfunction(obj[meth!]) ; }

export function $isipv4(o:any):o is string
{ return typeof o === 'string' && __IPV4Regex.test($ftrim(o)) ; }

export function $isipv6(o:any):o is string
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

export function $intornull(n:Nullable<string|number|bigint>) : int | null // NOSONAR: union used only here, no alias needed
{
	if (!$ok(n)) { return null ; }
	else if (typeof n === 'string') { n = Number.parseInt(n, 10) ; }
    else if (typeof n === 'bigint') {
        return n >= INT_MIN_BIG && n <= INT_MAX_BIG ? Number(n) as int : null ;
    
    }
	return $isint(n) ? <int>n : null ;
}

export function $int(n:Nullable<string|number|bigint>, defaultValue:int=<int>0) : int
{ return $value($intornull(n), defaultValue) ; }

// the smallest email is a@b.xx where xx is the domain name, and the longest one
// has 254 characters (RFC 5321), which also bounds the validation time
export function $email(s:Nullable<string>) : email | null
{
    const v = $ftrim(s) ;
    if (v.length < EMAIL_MIN_LENGTH || v.length > EMAIL_MAX_LENGTH || !_isEmailString(v)) { return null ; }
    return v.toLowerCase() as email ;
}

export function $phonenumber(s:Nullable<string>, country?:Nullable<TSCountry>): TSPhoneNumber | null
{ return TSPhoneNumber.fromString(s, country) ; }

export function $isophone(s:Nullable<string>, country?:Nullable<TSCountry>): string | null
{ return $valueornull(TSPhoneNumber.fromString(s, country)?.toString()) ;}

export function $url(s:Nullable<string>, opts?:Nullable<TSURLParseOptions>) : url | null
{ return $valueornull(TSURL.url(s, opts)?.href); }

export function $UUID(s:Nullable<string>, version?:Nullable<UUIDVersion> /* default version is UUIDv1 */) : UUID | null
{
    if (typeof s !== 'string') { return null ; }
    const regex = version === 4 ? __uuidV4Regex : __uuidV1Regex ;
    return _regexvalidatedstring<UUID>(regex, s, UUID_LENGTH, UUID_LENGTH) ;
}

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
	else if (typeof n === 'string') { n = Number.parseInt(<string>n, 10) ; }
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
    else if (typeof v === 'string') { v = Number.parseInt(v, 10) ; }
    return Number.isNaN(v) ? defaultValue : Math.max(INT_MIN, $icast(Math.min(v, INT_MAX))) as int ;
}

export function $tounsigned(v:Nullable<string|number>, defaultValue:uint=<uint>0) : uint
{
    if (!$ok(v)) { return defaultValue ; }
    else if (typeof v === 'bigint') {
        v = v >= UINT_MIN_BIG && v <= UINT_MAX_BIG ? Number(v) : defaultValue ;
    }
    else if (typeof v === 'string') { v = Number.parseInt(v, 10) ; }
    return Number.isNaN(v) ? defaultValue : Math.max(UINT_MIN, $icast(Math.min(v, UINT_MAX))) as uint ;
}
export interface TSStringOptions {
    objectToStringConversion: (v:any) => string ;
    nullRepresentation:string ;
    undefinedRepresentation:string ;
    trueValue: string ;
    falseValue: string ;
}
/** @deprecated use TSStringOptions */
export type $stringOptions = TSStringOptions ;

const __default$stringOptions: TSStringOptions = {
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
    // (string/symbol/number) ever depend on TSStringOptions to format, so the
    // bare recursive $string(p) below needs no options forwarded.
    objectToStringConversion: (v:any):string => {
        const p = _safecall(v, Symbol.toPrimitive, 'string') ;
        if (typeof p === 'string') { return p ; }
        if (typeof p === 'symbol') { return $symbol2string(p) ; }

        const s = _safecall(v, 'toString') ;
        if (typeof s === 'string') { return s ; }

        const n = _safecall(v, 'valueOf') ;
        if (typeof n === 'string') { return n ; }
        return typeof n === 'number' ? ''+n : '' ; // fastest number conversion (see $string() for details)
    },
    nullRepresentation: '',
    undefinedRepresentation: '',
    trueValue: 'true',
    falseValue: 'false'
} ;

export function $string(v:any, options?:TSStringOptions) : string {
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
            if (v instanceof Boolean) { return v.valueOf() ? opts.trueValue : opts.falseValue ; } // NOSONAR: here we check an object, so instanceof is necessary
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
            if (typeof values[0] === 'string') { return values as string[] ; }
            return $isarray(values[0]) ? values[0] : [] ;
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
{
    if (a instanceof Set) { return a.size ; }
    return $ok(a) ? (<ArrayLike<T>>a).length : 0 ;
}

export function $length(s: Nullable<string | TSDataLike | Blob>) : number
{ 
    if (s instanceof Blob) { return s.size ; }
    if (s instanceof ArrayBuffer) { return s.byteLength ; }
    return $ok(s) ? (<string|Bytes|TSData>s).length : 0 ;
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

export interface TSPartialOptions<T,U> {
    properties?:Array<keyof T | keyof U>,
    filter?: (v:T[keyof T]) => T[keyof T]|U[keyof U]|undefined;
}
/** @deprecated use TSPartialOptions */
export type $partialOptions<T,U> = TSPartialOptions<T,U> ;

// default filter supress undefined, null values and functions (methods for real class instances)
// if properties is not set, we use all the object keys to apply the filter
// a is an object with properties (a plain object or a class instance) or null or undefined. A string,
// a number, an array, a Date, a Map... throws an error (eg. a string used to give its characters)
export function $partial<T,U>(a:Nullable<T>, opts:TSPartialOptions<T,U>={}):[U, number]
{
    _checkFusionArgument('partial', a) ;
    let ret:any = {} ;
    let n = 0 ;
    if ($ok(a)) {
        n = _fillObject<T,U>('partial', ret, a, opts) ;
    }
    return [ret as U, n] ;
}

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
export interface TSObjectFusionOptions<T,U> {
    A?:TSPartialOptions<T,U>,
    B?:TSPartialOptions<T,U>
    fusionArrays?:(a:Array<any>, b:Array<any>) => Array<any>
    fusionObjects?:(a:object, b:object) => object
}
/** @deprecated use TSObjectFusionOptions */
export type $fusionOptions<T,U> = TSObjectFusionOptions<T,U> ;

export function $fusion<T,U>(a:Nullable<T>, b:Nullable<U>, opts:TSObjectFusionOptions<T,U> = {}):[Partial<T> & Partial<U>, number]
{
    _checkFusionArgument('fusion', a) ;
    _checkFusionArgument('fusion', b) ;
    if (!$ok(a)) { return $ok(b) ? $partial(b, opts.B as any) : [{}, 0] }
    else if (!$ok(b)) { return $partial(a, opts.A as any) ; }

    let [ret,] = $partial(a, opts.A) ;
    let fopts:FillObjectOptions<T,U> = $ok(opts.B) ? { ... opts.B!} : {} ;
    if ($ok(opts.fusionArrays)) { fopts.fusionArrays = opts.fusionArrays ; }
    if ($ok(opts.fusionObjects)) { fopts.fusionObjects = opts.fusionObjects ; }
    _fillObject<T,U>('fusion', ret, b, fopts) ;
    // the number of properties of the result, like $partial() (a property of a and b used to be counted twice)
    return [ret as any, Object.keys(ret as any).length] ;
}

// the arguments of $partial() and $fusion() are objects with properties, or null or undefined
function _checkFusionArgument(fn:string, v:any) {
    if (!$ok(v)) { return ; }
    if (typeof v !== 'object' || Array.isArray(v) || v instanceof Date || v instanceof Map || v instanceof Set || v instanceof RegExp || ArrayBuffer.isView(v) || v instanceof ArrayBuffer) {
        TSError.throw(`$${fn}() needs objects with properties (or null or undefined)`, { function:fn, argument:v }) ;
    }
}

// fusionObjects() only applies to plain objects (it also did to Dates or class instances, which became {})
function _isPlainObject(v:any):boolean {
    if (v === null || typeof v !== 'object') { return false ; }
    const p = Object.getPrototypeOf(v) ;
    return p === Object.prototype || p === null ;
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
        return s.slice(7, -1) ;
    }
    return $value(Symbol.keyFor(v), '') ;
}

// ===== private exported objects ============================
/** @internal */
export const __uuidV1Regex:RegExp   = /^[A-F\d]{8}-[A-F\d]{4}-[A-F\d]{4}-[A-F\d]{4}-[A-F\d]{12}$/i ;

/** @internal */
export const __uuidV4Regex:RegExp = /^[A-F\d]{8}-[A-F\d]{4}-4[A-F\d]{3}-[89AB][A-F\d]{3}-[A-F\d]{12}$/i ;

// ===== private functions ===================================
// calls v[method](...args) and returns its result, or undefined if v has no such
// method or if the call throws (a method that throws is treated like one that
// returned nothing usable). The method itself is read outside of the try block.
function _safecall(v:any, method:string|symbol, ...args:any[]):any {
    const fn = v[method] ;
    if (typeof fn !== 'function') { return undefined ; }
    try { return fn.apply(v, args) ; }
    catch { return undefined ; }
}


// BUG fixed:
// ===========================================================================
// An email is split on its last '@' (the domain part cannot contain any '@'), and its two parts
// are checked separately. Both regular expressions are linear: each label is a run of non-dot
// characters which must be followed by an actual '.', so there is only one way to partition a
// given string. The domain is either a dot separated list of labels whose last one has at least
// 2 characters, or an IPv4 address. It used to end with an alternative [\d.]+ which overlapped the
// labels (eg. "a@" + "1.".repeat(n) + "!" had a quadratic backtracking : 1.3 s for n = 20000).
const __emailLocalPartRegex:RegExp = /^(?:[^<>()[\]\s@".,;:]+(?:\.[^<>()[\]\s@".,;:]+)*|".+")$/ ;
const __emailDomainRegex:RegExp = /^(?:(?:[^<>()\s@".,;]+\.)*[^<>()\s@".,;:]{2,}|\d{1,3}(?:\.\d{1,3}){3})$/ ;

function _isEmailString(v:string):boolean {
    const i = v.lastIndexOf('@') ;
    return i > 0 && __emailLocalPartRegex.test(v.slice(0, i)) && __emailDomainRegex.test(v.slice(i + 1)) ;
}

function _regexvalidatedstring<T>(regex:RegExp, s:Nullable<string>, minLength?:Nullable<number>, maxLength?:number) : T | null 
{
	const v = $ftrim(s) ;
    const min = $value(minLength, 1) ;
    const max = $value(maxLength, UINT_MAX) ;
	if (v.length < min || v.length > max || !regex.test(v)) { return null ; }
	return <T><unknown>v ;
}

interface FillObjectOptions<T,U> extends TSPartialOptions<T,U> {
    fusionArrays?:(a:Array<any>, b:Array<any>) => Array<any>
    fusionObjects?:(a:object, b:object) => object
}

// shared across every _fillObject() call with no explicit filter (the common
// case for $partial/$dict/$fusion) instead of allocating a fresh arrow per call.
const _defaultFillObjectFilter = (v:any):any => $ok(v) && typeof v !== 'function' ? v : undefined ;

function _fillObject<T,U>(fn:string, destination:any, source:any, opts:FillObjectOptions<T,U>={}):number
{
    // read into locals instead of `opts = {...opts}` + writing defaults back :
    // $fusion() passes its caller's opts.A straight through (no pre-clone on
    // that path), so mutating `opts` in place would leak _fillObject's
    // internal defaults onto an object the caller still owns.
    const properties = $ok(opts.properties) ? opts.properties! : $keys(source) as Array<keyof T | keyof U> ;
    if (properties.length === 0) { return 0 ; }

    let ret = 0 ;
    const fusion_arrays = $isfunction(opts.fusionArrays) ;
    const fusion_objects = $isfunction(opts.fusionObjects) ;
    const filter = $isfunction(opts.filter) ? opts.filter! : _defaultFillObjectFilter ;

    for (let p of properties) {
        if (typeof p !== 'string') {
            TSError.throw(`$${fn}() needs to have valid string properties`,
            { function:fn, source:source, destination:destination, options:opts}) ;
        }
        // an unsafe key is never read nor written (it used to change the prototype of the result)
        const v = $issafekey(p) ? filter(source[p]) : undefined ;
        if ($defined(v)) {
            destination[p] = _filledValue(destination[p], v, fusion_arrays, fusion_objects, opts) ;
            ret++ ;
        }
    }
    return ret ;
}

function _filledValue<T,U>(previous:any, v:any, fusionArrays:boolean, fusionObjects:boolean, opts:FillObjectOptions<T,U>):any {
    if (fusionArrays && $isarray(v) && $isarray(previous)) { return opts.fusionArrays!(previous, v) ; }
    if (fusionObjects && _isPlainObject(v) && _isPlainObject(previous)) { return opts.fusionObjects!(previous, v) ; }
    return v ;
}
const __IPV4Regex = _ipv4Regex() ;
const __IPV6Regex = _ipv6Regex() ;

// IPv4 address: 4 decimal bytes, leading zeros accepted (eg. 010.001.1.1)
function _ipv4Regex():RegExp {
    const b = String.raw`(?:25[0-5]|2[0-4]\d|[01]?\d\d?)` ;
    return new RegExp(String.raw`^${b}(?:\.${b}){3}$`) ;
}

/**
 * IPv6 address: 8 groups of 1 to 4 hexadecimal digits, where a run of null groups
 * may be compressed with '::' and where the 2 last groups may be written as an IPv4
 * address (without leading zeros), followed by an optional zone index (eg. %eth0).
 * There is one alternative per number of groups before the '::' (or per form if no '::').
 * All groups are non capturing and all quantifiers are bounded except the zone index one,
 * which avoids any polynomial backtracking.
 * WARNING: the tested string must have been trimmed with $ftrim() before: the regex does
 * not handle leading or trailing spaces ($ftrim() removes all the \s characters)
 */
function _ipv6Regex():RegExp {
    const h = String.raw`[\da-f]{1,4}` ;
    const b = String.raw`(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)` ;
    const v4 = String.raw`${b}(?:\.${b}){3}` ;
    const forms = [
        `(?:${h}:){7}(?:${h}|:)`,
        `(?:${h}:){6}(?::${h}|${v4}|:)`,
        `(?:${h}:){5}(?:(?::${h}){1,2}|:${v4}|:)`,
        `(?:${h}:){4}(?:(?::${h}){1,3}|(?::${h})?:${v4}|:)`,
        `(?:${h}:){3}(?:(?::${h}){1,4}|(?::${h}){0,2}:${v4}|:)`,
        `(?:${h}:){2}(?:(?::${h}){1,5}|(?::${h}){0,3}:${v4}|:)`,
        `${h}:(?:(?::${h}){1,6}|(?::${h}){0,4}:${v4}|:)`,
        `:(?:(?::${h}){1,7}|(?::${h}){0,5}:${v4}|:)`,
    ] ;
    return new RegExp(`^(?:${forms.join('|')})(?:%.+)?$`, 'i') ;
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
