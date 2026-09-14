import { $defined, $isfunction, $ismethod, $isstring, $length, $lse, $ok, $valueornull } from "./commons";
import { $charset, TSCharset } from "./tscharset";
import { TSData } from "./tsdata";
import { TSError } from "./tserrors";
import { Bytes, Nullable, StringEncoding, TSDataLike, uint32, uint8 } from "./types";

export interface DataInterval {
    start?:Nullable<number>,
    end?:Nullable<number>
}
export interface DataConversionOptions extends DataInterval {
    forceCopy?:Nullable<boolean>
}

// ===================== conversions to Buffer ==============================
export function $bufferFromHexaString(source:Nullable<string>): Nullable<Buffer>
{ return _foundationFromHex(source, Buffer.alloc) as Nullable<Buffer>; }

export function $decodeHexa(source:string):Buffer
{ 
    const ret = _foundationFromHex(source, Buffer.alloc) as Nullable<Buffer>;
    if ($ok(ret)) { return ret ; }
    TSError.throw("$decodeHexa() function cannot decode given buffer") ;
}

export function $bufferFromArrayBuffer(a: ArrayBuffer): Buffer 
{ return ArrayBuffer.isView(a) ? Buffer.from(a.buffer, a.byteOffset, a.byteLength) : Buffer.from(a); }

export function $bufferFromBytes(source:Bytes, opts:DataConversionOptions = {}): Buffer
{
    const [sourceLen, start, end, len] = $lse(source, opts.start, opts.end) ;

    if (!opts.forceCopy && source instanceof Buffer) {
        return start === 0 && end === sourceLen ? source : source.subarray(start, end) ;
    }
    else if (!opts.forceCopy && source instanceof Uint8Array) {
        return Buffer.from(source.buffer, source.byteOffset+start, len) ;   
    }
    else if (start === 0 && end === sourceLen) { return Buffer.from(source as any) ; }

    const ret = Buffer.allocUnsafe(len) ;
    for (let i = start, j = 0; i < end; i++, j++) { ret[j] = source[i]; }
    return ret ;
}

export function $bufferFromDataLike(source:TSDataLike, options?:DataConversionOptions): Buffer
{
    const [src, opts] = _toBytesOpts(source, options) ;
    return $bufferFromBytes(src, opts) ;
}


// ===================== conversions to Uint8Array ==============================

export { $bufferFromArrayBuffer as $uint8ArrayFromArrayBuffer }

export function $uint8ArrayFromHexaString(source:Nullable<string>, foundationCode?:Nullable<boolean>): Nullable<Uint8Array>
{ return _foundationFromHex(source, _Uint8ArrayAlloc, !foundationCode ? Uint8Array.fromHex : undefined) ; }

export function $uint8ArrayFromBytes(source:Bytes, opts:DataConversionOptions = {}): Uint8Array
{
    const [sourceLen, start, end, len] = $lse(source, opts.start, opts.end) ;
    if (!opts.forceCopy && source instanceof Uint8Array /* includes Buffer */) {
        return start === 0 && end === sourceLen ? source as Uint8Array : (source as Uint8Array).subarray(start, end) ;
    }
    const ret = new Uint8Array(len);
    for (let i = start, j = 0; i < end; i++, j++) { ret[j] = source[i]; }
    return ret ;
}

export function $uint8ArrayFromDataLike(source:TSDataLike, options?:DataConversionOptions): Uint8Array
{
    const [src, opts] = _toBytesOpts(source, options) ;
    return $uint8ArrayFromBytes(src, opts) ;
}

// ===================== conversions to Bytes ==============================
export { $bufferFromArrayBuffer as $bytesFromArrayBuffer }

export function $bytesFromDataLike(source:TSDataLike, opts:DataConversionOptions = {}): Bytes
{
    if (source instanceof TSData || source instanceof ArrayBuffer) { return $bufferFromDataLike(source, opts) ; }
    
    return !opts.forceCopy ? source as Bytes : $bufferFromDataLike(source, opts) ;
}

// ===================== conversions to array of uint8[] ==============================

export function $arrayFromBytes(source:Bytes, opts:DataConversionOptions = {}): uint8[]
{
    const [sourceLen, start, end,] = $lse(source, opts.start, opts.end) ;

    if (!opts.forceCopy && !(source instanceof Uint8Array /* includes buffer */)) {
        return start === 0 && end === sourceLen ? source : source.slice(start, end) ;
    }
    const ret:uint8[] = [] ;
    for (let i = start, j = 0; i < end; i++, j++) { ret[j] = source[i] as uint8 ; }
    return ret ;
}

export function $arrayFromDataLike(source:TSDataLike, options?:DataConversionOptions): uint8[]
{
    const [src, opts] = _toBytesOpts(source, options) ;
    return $arrayFromBytes(src, opts) ;
}


// ===================== conversions to ArrayBuffer ==============================
// WARNING: opts.forceCopy is useless here since we always have a copy
export function $arrayBufferFromBytes(source: Bytes, opts:DataConversionOptions = {}): ArrayBuffer {
    const [, start, end, len] = $lse(source, opts.start, opts.end) ;
    const ret = new ArrayBuffer(len);

    if (len > 0) {
        const view = new Uint8Array(ret);
        for (let i = start, j = 0; i < end; i++, j++) { view[j] = source[i]; }
    }
    return ret ;
}

export function $arrayBufferFromHexaString(source: Nullable<string>): Nullable<ArrayBuffer> {
    const u8 = _foundationFromHex(source, n => new Uint8Array(n)) ;
    if (!$ok(u8)) { return u8 as Nullable<ArrayBuffer> ; }
    return u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength) as ArrayBuffer ;
}

export function $arrayBufferFromDataLike(source:TSDataLike, opts:DataConversionOptions = {}): ArrayBuffer
{
    if (source instanceof ArrayBuffer) {
        const [sourceLen, start, end,] = $lse(source, opts.start, opts.end) ;
        return !opts.forceCopy && start === 0 && end === sourceLen ? source : source.slice(start, end) ;
    }
    else if (source instanceof TSData) { source = source.mutableBuffer ; }
    return $arrayBufferFromBytes(source as Bytes, opts)
}

// ===================== conversions to Blob ==============================
export async function $arrayBufferFromBlob(source:Blob):Promise<ArrayBuffer|null> {
    if (!$ok(source)) { return null ;}
    try { return await source.arrayBuffer() ; }
    catch { return null ; }
} 

export async function $bufferFromBlob(source:Blob):Promise<Buffer|null> {
    const data = await $arrayBufferFromBlob(source) ;
    return $ok(data) ? $bufferFromArrayBuffer(data!) : null ;
}

export async function $uint8ArrayFromBlob(source:Blob):Promise<Uint8Array|null> {
    if ($ismethod(source, 'bytes')) {
        try { return $valueornull(await (source as any).bytes()) ; }
        catch { return null ; }    
    }
    return await $bufferFromBlob(source) as Uint8Array | null ;
}

export function $blobFromBytes(source:Bytes): Blob {
    const data = source instanceof Uint8Array ? source : _uint8ArrayFromArray(source) ;
    return new Blob([data as BlobPart]) ;
}

export function $blobFromDataLike(source: TSDataLike): Blob { 
    return source instanceof ArrayBuffer ? 
            new Blob([source]) : 
            (source instanceof TSData ? new Blob([source.mutableBuffer as BlobPart]) : $blobFromBytes(source)) ;
}

// ===================== conversions to Uint32 ==============================
export function $uint32ArrayFromDataLike(source:TSDataLike,  isLittleEndian?:Nullable<boolean>, complete?:Nullable<boolean>): uint32[] {
    return $uint32ArrayFromUint8Array($uint8ArrayFromDataLike(source), isLittleEndian, complete) ;
}

export function $uint32ArrayFromUint8Array(source:Uint8Array, isLittleEndian?:Nullable<boolean>, complete?:Nullable<boolean>):uint32[] {
    const littleEndian = !!isLittleEndian ;
    const remainder = source.length % 4 ;
    const compl = !!complete && remainder > 0 ? 1 : 0 ;
    const len = (source.length / 4) | 0 ;
    const dv = new DataView(source.buffer, source.byteOffset, source.byteLength);
    const ret = new Array<number>(len+compl) ;

    for (let i = 0 ; i < len ; i++) {
        ret[i] = dv.getUint32(i << 2, littleEndian) as uint32;
    }
    if (compl > 0) {
        const n = len << 2 ;
        ret[len] = 0 ;
        if (littleEndian) {
            for (let i = 0 ; i < remainder ; i++) { ret[len] |= source[n+i] << (i<<3) ; }
        }
        else {
            for (let i = 0 ; i < remainder ; i++) { ret[len] |= source[n+i] << (24-(i<<3)) ; }
        }
    }    
    return ret as uint32[] ;
}


// ===================== Base64 conversions ==============================

const base64KeyStr    = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const base64URLKeyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

// Native Node's Buffer carries C++ base64 / hex codecs that are worth the
// (zero-copy) Uint8Array <-> Buffer bridge — up to ~50x faster than a JS scan on
// real payloads. The browser 'buffer' polyfill only ships JS codecs that are
// *slower* than the loops in this file, so there we stay pure-JS. Support for
// the 'base64url' encoding name is a reliable native-only marker.
const _nativeBuffer = typeof Buffer !== 'undefined'
                   && typeof Buffer.isEncoding === 'function'
                   && Buffer.isEncoding('base64url') ;

// char code -> sextet value ; both the '+/' and the '-_' alphabets resolve, and
// everything else (whitespace, '=' padding, junk) maps to -1 and is skipped.
const _base64Sextets: Int8Array = (() => {
    const t = new Int8Array(256).fill(-1) ;
    for (let i = 0 ; i < 64 ; i++) { t[base64KeyStr.charCodeAt(i)] = i ; }
    t[0x2D /* - */] = 62 ; t[0x5F /* _ */] = 63 ;
    return t ;
})() ;

export function $decodeBase64(input: string): Uint8Array    { return _decodeBase64(input) ; }
export function $decodeBase64URL(input: string): Uint8Array { return _decodeBase64(input) ; }

function _decodeBase64(input: string): Uint8Array {
    if (!input.length) { return new Uint8Array(0) ; }
    if (_nativeBuffer) {
        // 'base64' mode is lenient : accepts both alphabets, skips whitespace and
        // stray padding. Wrapped so the result is a plain Uint8Array, not a
        // pooled Buffer view.
        return new Uint8Array(Buffer.from(input, 'base64')) ;
    }
    return __pureDecodeBase64(input) ;
}

/** @internal — the pure-JS decoder used when no native base64 codec is available */
export function __pureDecodeBase64(input: string): Uint8Array {
    const n = input.length ;
    const out = new Uint8Array((n * 3) >> 2) ; // upper bound on the byte count
    let acc = 0, bits = 0, size = 0 ;
    for (let i = 0 ; i < n ; i++) {
        const cc = input.charCodeAt(i) ;
        const v = cc < 256 ? _base64Sextets[cc] : -1 ;
        if (v < 0) { continue ; } // whitespace / '=' / invalid
        acc = (acc << 6) | v ;
        bits += 6 ;
        if (bits >= 8) { bits -= 8 ; out[size++] = (acc >>> bits) & 0xff ; }
    }
    return size === out.length ? out : out.subarray(0, size) ;
}

export function $encodeBase64(source: TSDataLike | string, encoding?:Nullable<StringEncoding | TSCharset>): string
{ return _encodeBase64(source, false, encoding) ; }

export function $encodeBase64URL(source: TSDataLike | string, encoding?:Nullable<StringEncoding | TSCharset>): string
{ return _encodeBase64(source, true, encoding) ; }

function _encodeBase64(source: TSDataLike | string, url: boolean, encoding?:Nullable<StringEncoding | TSCharset>): string {
    const charset = $charset(encoding, TSCharset.binaryCharset()) ;
    const input = $isstring(source) ? charset.uint8ArrayFromString(source) : $uint8ArrayFromDataLike(source) ;
    if (_nativeBuffer) {
        const b = Buffer.from(input.buffer, input.byteOffset, input.length) ; // zero-copy view
        return b.toString(url ? 'base64url' : 'base64') ;                       // 'base64url' emits no '=' padding
    }
    return __pureEncodeBase64(input, url) ;
}

/** @internal — the pure-JS encoder used when no native base64 codec is available */
export function __pureEncodeBase64(input: Uint8Array, url: boolean): string {
    const alphabet = url ? base64URLKeyStr : base64KeyStr ;
    const len = input.length ;
    let out = "" ;
    let i = 0 ;
    for ( ; i + 3 <= len ; i += 3) {
        const c = (input[i] << 16) | (input[i + 1] << 8) | input[i + 2] ;
        out += alphabet[(c >>> 18) & 63] + alphabet[(c >>> 12) & 63] + alphabet[(c >>> 6) & 63] + alphabet[c & 63] ;
    }
    const rem = len - i ;
    if (rem === 1) {
        const c = input[i] << 16 ;
        out += alphabet[(c >>> 18) & 63] + alphabet[(c >>> 12) & 63] + (url ? "" : "==") ;
    }
    else if (rem === 2) {
        const c = (input[i] << 16) | (input[i + 1] << 8) ;
        out += alphabet[(c >>> 18) & 63] + alphabet[(c >>> 12) & 63] + alphabet[(c >>> 6) & 63] + (url ? "" : "=") ;
    }
    return out ;
}


const FoundationHexaChars = '0123456789ABCDEF' ;
const FoundationHexaLowerChars = '0123456789abcdef' ;
const FoundationHexaStringRegex = /^[0-9a-fA-F]*$/ ;
function _Uint8ArrayAlloc(n:number) { return new Uint8Array(n) ; }

// byte -> 2 hex chars, precomputed once for both cases (used by the non-Buffer path)
const _hexBytesUpper:string[] = new Array(256) ;
const _hexBytesLower:string[] = new Array(256) ;
for (let i = 0 ; i < 256 ; i++) {
    _hexBytesUpper[i] = FoundationHexaChars[i >> 4]      + FoundationHexaChars[i & 0xF] ;
    _hexBytesLower[i] = FoundationHexaLowerChars[i >> 4] + FoundationHexaLowerChars[i & 0xF] ;
}

function _foundationFromHex(source:Nullable<string>, allocate:(n:number)=>Uint8Array, systemFunction?:(s:string)=>Uint8Array): Nullable<Uint8Array>
{
    if (!$defined(source)) { return undefined ; }
    if (typeof source !== 'string') { return null ; }
    const slen = source.length ;
    if (!slen) { return allocate(0) ; }
    if (slen % 2 !== 0 || !FoundationHexaStringRegex.test(source!)) { return null ; }

    if (systemFunction) {
        try { return systemFunction(source!) ; }
        catch { return null ; }
    }
    else {
        const bytes = allocate(slen/2) ;
        for (let i = 0, j = 0 ; i < slen ; i += 2) {
            bytes[j++] = parseInt(source!.slice(i, i+2), 16);
        }        
        return bytes;
    }
}

export function $encodeHexa(source:TSDataLike, toLowerCase?:boolean):string
{
    if (source instanceof TSData) { return $encodeBytesToHexa(source.mutableBuffer) ; }
    else if (source instanceof ArrayBuffer) { return $encodeBytesToHexa($bufferFromArrayBuffer(source)) ; }
    return $encodeBytesToHexa(source, toLowerCase) ;
}

export function $encodeBytesToHexa(source:Bytes, toLowerCase?:boolean):string {
    // The native Buffer hex codec (C++, single pass) beats the JS table loop once
    // the payload is big enough to amortize the zero-copy Uint8Array -> Buffer
    // bridge ; below that, and always with the browser polyfill, the loop wins.
    if (_nativeBuffer && source instanceof Uint8Array && source.length >= 32) {
        const b = source instanceof Buffer ? source
                : Buffer.from(source.buffer, source.byteOffset, source.length) ;
        const hex = b.toString('hex') ; // always lowercase
        return toLowerCase ? hex : hex.toUpperCase() ;
    }
    const len = $length(source) ;
    if (!len) { return '' ; }
    const table = toLowerCase ? _hexBytesLower : _hexBytesUpper ;
    let s = '' ;
    for (let i = 0 ; i < len ; i++) { s += table[source[i] & 0xff] ; }
    return s ;
}

// ===================== Data operations ==============================
export function $dataXOR(a:TSDataLike, b:TSDataLike):Buffer {
    const len = Math.max($length(a), $length(b)) ;
    const ret = Buffer.allocUnsafe(len) ;
    if (!len) { return ret ; }
    const ab = $bytesFromDataLike(a) ;
    const bb = $bytesFromDataLike(b) ;
    for (let i = 0 ; i < len ; i++) { ret[i] = (ab[i] ^ bb[i]) & 0xff ; }
    return ret ;
}

// ===================== Data description ==============================
interface $bufferAspectOptions {
    prefix?: string;
    suffix?: string;
    name?: string;
    separator?: string;
    showLength?: boolean;
    transformFn?: (n: number) => string;
}


export function $dataAspect(
    source: Bytes | Uint16Array | Uint32Array,
    opts: $bufferAspectOptions = { prefix: '[', suffix: ']', separator: ',', showLength: true }
) {
    const fn = $isfunction(opts.transformFn) ? opts.transformFn! : (n: number) => n.toString();
    const n = source.length;
    let s = $ok(opts.name) ? opts.name! : source.constructor.name;
    if (opts.showLength) { s += `(${n})`; }
    if (s.length > 0) { s += ' '; }
    if (opts.prefix?.length) { s += opts.prefix! };
    if (n > 0) {
        if (opts.prefix?.length) { s += ' ' };
        s += fn(source[0]);
        for (let i = 1; i < n; i++) { s += opts.separator + ' ' + fn(source[i]); }
    }
    return opts.suffix?.length ? s + ` ${opts.suffix}` : s;
}

declare global {
    export interface String {
        base64String:    (this: string, encoding?:Nullable<StringEncoding | TSCharset>) => string; // warning: default string encoding is Bynary
        base64URL:       (this: string, encoding?:Nullable<StringEncoding | TSCharset>) => string; // idem
        decodeBase64:    (this: string) => Uint8Array;
        decodeBase64URL: (this: string) => Uint8Array;
    }

    // TypeScript does not know this valid static method
    export interface Uint8ArrayConstructor {
        fromHex(hexaString: string): Uint8Array;
    }
    export interface Uint8Array {
        leafInspect:         (this: any) => string;
        base64String:        (this: any) => string;
        base64URL:           (this: any) => string;
        hexaString:          (this: any, toLowerCase?:boolean) => string;
        isGenuineUint8Array: (this: any) => boolean ;
        XOR:                 (this: TSDataLike, other: TSDataLike) => Buffer;
    }
    export interface Uint16Array {
        leafInspect: (this: Uint16Array) => string;
    }
    export interface Uint32Array {
        leafInspect: (this: Uint32Array) => string;
    }
    export interface ArrayBuffer {
        leafInspect:  (this: any) => string;
        base64String: (this: any) => string;
        base64URL:    (this: any) => string;
        hexaString:   (this: any, toLowerCase?:boolean) => string;
        XOR:          (this: TSDataLike, other:TSDataLike) => Buffer;
    }
}
Uint8Array.prototype.isGenuineUint8Array = function isGenuine(this:Uint8Array): boolean { return this.constructor.name === 'Uint8Array' ; } 
Uint8Array.prototype.leafInspect  = function leafInspect(this: Uint8Array): string { 
    return this.constructor.name === 'Uint8Array' ? $dataAspect(this) : '<' + $dataAspect(this, { prefix: '', suffix: '', separator: '', showLength: false, transformFn: (n) => n.toHex2() }) + '>' ; 
}
Uint16Array.prototype.leafInspect = function leafInspect(this: Uint16Array): string { return $dataAspect(this); }
Uint32Array.prototype.leafInspect = function leafInspect(this: Uint32Array): string { return $dataAspect(this); }
ArrayBuffer.prototype.leafInspect = function leafInspect(this: any): string {
    const buf = $bufferFromArrayBuffer(this);
    return 'ArrayBuffer { [Uint8Contents]: <' + $dataAspect(buf, { prefix: '', suffix: '', separator: '', showLength: false, name: '', transformFn: (n) => n.toHex2(true) }) + '>, [byteLength]: ' + buf.length + ' }';
}

String.prototype.decodeBase64      = function decodeBase64(this: string): Uint8Array { return $decodeBase64(this); }
String.prototype.decodeBase64URL   = function decodeBase64URL(this: string): Uint8Array { return $decodeBase64URL(this); }
String.prototype.base64String      = function base64String(this: string,  encoding?:Nullable<StringEncoding | TSCharset>): string { return $encodeBase64(this, encoding); }
String.prototype.base64URL         = function base64URL(this: string, encoding?:Nullable<StringEncoding | TSCharset>): string { return $encodeBase64URL(this, encoding); }
Uint8Array.prototype.base64String  = function base64String(this: Uint8Array): string { return $encodeBase64(this); } // since Buffer is a subclass of Uint8Array, also available on buffer
Uint8Array.prototype.base64URL     = function base64URL(this: Uint8Array): string { return $encodeBase64URL(this); } //idem
ArrayBuffer.prototype.base64String = function base64String(this: any): string { return $encodeBase64(this) ; }
ArrayBuffer.prototype.base64URL    = function base64URL(this: any): string { return $encodeBase64URL(this) ; }

Uint8Array.prototype.hexaString    = function toHexa(this: any, toLowerCase?:boolean): string { return $encodeBytesToHexa(this, toLowerCase) ; } // since Buffer is a subclass of Uint8Array, also available on buffer
ArrayBuffer.prototype.hexaString   = function toHexa(this: any, toLowerCase?:boolean): string { return $encodeBytesToHexa($bufferFromArrayBuffer(this), toLowerCase) ; }

Uint8Array.prototype.XOR           = function xor(this:TSDataLike, other:TSDataLike) { return $dataXOR(this, other) ; }
ArrayBuffer.prototype.XOR          = function xor(this:TSDataLike, other:TSDataLike) { return $dataXOR(this, other) ; }

// ===================== private functions ==============================
function _uint8ArrayFromArray(a:uint8[]):Uint8Array {
    const len = a.length ;
    const ret = new Uint8Array(len);
    for (let i = 0 ; i < len; i++) { ret[i] = a[i] ; }
    return ret ;
}

function _toBytesOpts(source:TSDataLike, opts:DataConversionOptions = {}): [Bytes, DataConversionOptions]
{
    if (source instanceof ArrayBuffer) {
        return [$bufferFromArrayBuffer(source), {...opts, forceCopy: false }] ; // we alreay are forced to do a conversion here, don't do it twice
    }
    else if (source instanceof TSData) {
        return [source.mutableBuffer, opts] ; 
    }
    return [source, opts] ;
}

