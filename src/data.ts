import { $defined, $isfunction, $ismethod, $isstring, $length, $lse, $ok, $valueornull } from "./commons";
import { $charset, EncodingOrCharset, TSCharset } from "./tscharset";
import { TSData } from "./tsdata";
import { TSError } from "./tserrors";
import { Bytes, Nullable, TSDataLike, uint32, uint8, UINT8_MAX } from "./types";
import { $declareMethods } from "./object";

export interface DataInterval {
    start?:number|null ;
    end?:number|null ;
}
export interface DataConversionOptions extends DataInterval {
    forceCopy?: boolean | null ;
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
{ return __bufferFromBytes('$bufferFromBytes()', source, opts) ; }

/** @internal — $bufferFromBytes() for the library functions: a non byte element is reported under their name (fn) */
export function __bufferFromBytes(fn:string, source:Bytes, opts:DataConversionOptions = {}): Buffer
{
    const [sourceLen, start, end, len] = $lse(source, opts.start, opts.end) ;

    if (source instanceof Uint8Array /* includes Buffer */) {
        if (opts.forceCopy) { return Buffer.from(source.subarray(start, end)) ; } // Buffer.from() copies a typed array
        if (source instanceof Buffer) { return start === 0 && end === sourceLen ? source : source.subarray(start, end) ; }
        return Buffer.from(source.buffer, source.byteOffset+start, len) ;
    }
    // Buffer.from(array) silently truncated the non byte elements (258 -> 2): we copy and check them in one loop
    return _copyCheckedBytes(fn, source, start, end, Buffer.allocUnsafe(len)) ;
}

export function $bufferFromDataLike(source:TSDataLike, options?:DataConversionOptions): Buffer
{ return __bufferFromDataLike('$bufferFromDataLike()', source, options) ; }

/** @internal — $bufferFromDataLike() reporting a non byte element under the name fn */
export function __bufferFromDataLike(fn:string, source:TSDataLike, options?:DataConversionOptions): Buffer
{
    const [src, opts] = _toBytesOpts(source, options) ;
    return __bufferFromBytes(fn, src, opts) ;
}


// ===================== conversions to Uint8Array ==============================

export { $bufferFromArrayBuffer as $uint8ArrayFromArrayBuffer }

export function $uint8ArrayFromHexaString(source:Nullable<string>, foundationCode?:Nullable<boolean>): Nullable<Uint8Array>
{ return _foundationFromHex(source, _Uint8ArrayAlloc, !foundationCode ? Uint8Array.fromHex : undefined) ; }

export function $uint8ArrayFromBytes(source:Bytes, opts:DataConversionOptions = {}): Uint8Array
{ return __uint8ArrayFromBytes('$uint8ArrayFromBytes()', source, opts) ; }

/** @internal — $uint8ArrayFromBytes() reporting a non byte element under the name fn */
export function __uint8ArrayFromBytes(fn:string, source:Bytes, opts:DataConversionOptions = {}): Uint8Array
{
    const [sourceLen, start, end, len] = $lse(source, opts.start, opts.end) ;
    if (source instanceof Uint8Array /* includes Buffer */) {
        if (opts.forceCopy) { return new Uint8Array(source.subarray(start, end)) ; } // a genuine Uint8Array copy, even from a Buffer
        return start === 0 && end === sourceLen ? source : source.subarray(start, end) ;
    }
    return _copyCheckedBytes(fn, source, start, end, new Uint8Array(len)) ;
}

export function $uint8ArrayFromDataLike(source:TSDataLike, options?:DataConversionOptions): Uint8Array
{ return __uint8ArrayFromDataLike('$uint8ArrayFromDataLike()', source, options) ; }

/** @internal — $uint8ArrayFromDataLike() reporting a non byte element under the name fn */
export function __uint8ArrayFromDataLike(fn:string, source:TSDataLike, options?:DataConversionOptions): Uint8Array
{
    const [src, opts] = _toBytesOpts(source, options) ;
    return __uint8ArrayFromBytes(fn, src, opts) ;
}

// ===================== conversions to Bytes ==============================
export { $bufferFromArrayBuffer as $bytesFromArrayBuffer }

export function $bytesFromDataLike(source:TSDataLike, opts:DataConversionOptions = {}): Bytes
{ return __bytesFromDataLike('$bytesFromDataLike()', source, opts) ; }

/** @internal — $bytesFromDataLike() reporting a non byte element under the name fn */
export function __bytesFromDataLike(fn:string, source:TSDataLike, opts:DataConversionOptions = {}): Bytes
{
    if (source instanceof TSData || source instanceof ArrayBuffer || opts.forceCopy) { return __bufferFromDataLike(fn, source, opts) ; }
    // a plain array is returned as it is (whatever the start and end options): it is only checked
    if (!(source instanceof Uint8Array)) { __checkBytes(fn, source, 0, source.length) ; }
    return source ;
}

/** @internal — the bytes of a TSDataLike, without copy and without checking a plain array:
 *  for the functions which check the elements while they read them */
export function __uncheckedBytesFromDataLike(source:TSDataLike): Bytes {
    if (source instanceof TSData) { return source.mutableBuffer ; }
    return source instanceof ArrayBuffer ? $bufferFromArrayBuffer(source) : source ;
}

// ===================== conversions to array of uint8[] ==============================

export function $arrayFromBytes(source:Bytes, opts:DataConversionOptions = {}): uint8[]
{ return _arrayFromBytes('$arrayFromBytes()', source, opts) ; }

export function $arrayFromDataLike(source:TSDataLike, options?:DataConversionOptions): uint8[]
{
    const [src, opts] = _toBytesOpts(source, options) ;
    return _arrayFromBytes('$arrayFromDataLike()', src, opts) ;
}

function _arrayFromBytes(fn:string, source:Bytes, opts:DataConversionOptions): uint8[]
{
    const [sourceLen, start, end,] = $lse(source, opts.start, opts.end) ;
    const ret:uint8[] = [] ;

    if (source instanceof Uint8Array /* includes buffer */) {
        for (let i = start, j = 0; i < end; i++, j++) { ret[j] = source[i] as uint8 ; }
        return ret ;
    }
    if (!opts.forceCopy && start === 0 && end === sourceLen) {
        __checkBytes(fn, source, start, end) ; // returned as it is: only checked
        return source ;
    }
    // the part used to be sliced: we copy and check it in one loop
    for (let i = start, j = 0; i < end; i++, j++) { ret[j] = __checkedByte(fn, source, i) ; }
    return ret ;
}


// ===================== conversions to ArrayBuffer ==============================
// WARNING: opts.forceCopy is useless here since we always have a copy
export function $arrayBufferFromBytes(source: Bytes, opts:DataConversionOptions = {}): ArrayBuffer
{ return _arrayBufferFromBytes('$arrayBufferFromBytes()', source, opts) ; }

function _arrayBufferFromBytes(fn:string, source: Bytes, opts:DataConversionOptions): ArrayBuffer {
    const [, start, end, len] = $lse(source, opts.start, opts.end) ;
    const ret = new ArrayBuffer(len);

    if (len > 0) {
        const view = new Uint8Array(ret);
        if (source instanceof Uint8Array) { view.set(source.subarray(start, end)) ; }
        else { _copyCheckedBytes(fn, source, start, end, view) ; }
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
    return _arrayBufferFromBytes('$arrayBufferFromDataLike()', source, opts) ;
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

export function $blobFromBytes(source:Bytes): Blob
{ return _blobFromBytes('$blobFromBytes()', source) ; }

export function $blobFromDataLike(source: TSDataLike): Blob { 
    if (source instanceof ArrayBuffer) { return new Blob([source]) ; }
    if (source instanceof TSData) { return new Blob([source.mutableBuffer as BlobPart]) ; }
    return _blobFromBytes('$blobFromDataLike()', source) ;
}

function _blobFromBytes(fn:string, source:Bytes): Blob {
    const data = source instanceof Uint8Array ? source : _copyCheckedBytes(fn, source, 0, source.length, new Uint8Array(source.length)) ;
    return new Blob([data as BlobPart]) ;
}

// ===================== conversions to Uint32 ==============================
export function $uint32ArrayFromDataLike(source:TSDataLike,  isLittleEndian?:Nullable<boolean>, complete?:Nullable<boolean>): uint32[] {
    return $uint32ArrayFromUint8Array(__uint8ArrayFromDataLike('$uint32ArrayFromDataLike()', source), isLittleEndian, complete) ;
}

export function $uint32ArrayFromUint8Array(source:Uint8Array, isLittleEndian?:Nullable<boolean>, complete?:Nullable<boolean>):uint32[] {
    const littleEndian = !!isLittleEndian ;
    const remainder = source.length % 4 ;
    const compl = !!complete && remainder > 0 ? 1 : 0 ;
    const len = Math.trunc(source.length / 4) ;
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
    for (let i = 0 ; i < 64 ; i++) { t[base64KeyStr.codePointAt(i)!] = i ; }
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
        const cc = input.codePointAt(i)! ;
        const v = cc < 256 ? _base64Sextets[cc] : -1 ;
        if (v < 0) { continue ; } // whitespace / '=' / invalid
        acc = (acc << 6) | v ;
        bits += 6 ;
        if (bits >= 8) { bits -= 8 ; out[size++] = (acc >>> bits) & 0xff ; }
    }
    return size === out.length ? out : out.subarray(0, size) ;
}

export function $encodeBase64(source: TSDataLike | string, encoding?:Nullable<EncodingOrCharset>): string
{ return __encodeBase64('$encodeBase64()', source, false, encoding) ; }

export function $encodeBase64URL(source: TSDataLike | string, encoding?:Nullable<EncodingOrCharset>): string
{ return __encodeBase64('$encodeBase64URL()', source, true, encoding) ; }

/** @internal — $encodeBase64() or $encodeBase64URL() reporting a non byte element under the name fn */
export function __encodeBase64(fn:string, source: TSDataLike | string, url: boolean, encoding?:Nullable<EncodingOrCharset>): string {
    const charset = $charset(encoding, TSCharset.binaryCharset()) ;
    const input = $isstring(source) ? charset.uint8ArrayFromString(source) : __uint8ArrayFromDataLike(fn, source) ;
    if (_nativeBuffer) {
        const b = Buffer.from(input.buffer, input.byteOffset, input.length) ; // zero-copy view
        return b.toString(url ? 'base64url' : 'base64') ; // 'base64url' emits no '=' padding
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
            bytes[j++] = Number.parseInt(source!.slice(i, i+2), 16);
        }        
        return bytes;
    }
}

export function $encodeHexa(source:TSDataLike, toLowerCase?:boolean):string
{
    // toLowerCase used to be forgotten for a TSData and an ArrayBuffer
    if (source instanceof TSData) { return _encodeBytesToHexa('$encodeHexa()', source.mutableBuffer, toLowerCase) ; }
    else if (source instanceof ArrayBuffer) { return _encodeBytesToHexa('$encodeHexa()', $bufferFromArrayBuffer(source), toLowerCase) ; }
    return _encodeBytesToHexa('$encodeHexa()', source, toLowerCase) ;
}

export function $encodeBytesToHexa(source:Bytes, toLowerCase?:boolean):string
{ return _encodeBytesToHexa('$encodeBytesToHexa()', source, toLowerCase) ; }

function _encodeBytesToHexa(fn:string, source:Bytes, toLowerCase?:boolean):string {
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
    const typed = source instanceof Uint8Array ; // only the elements of a plain array need a check
    let s = '' ;
    for (let i = 0 ; i < len ; i++) { s += table[typed ? source[i] : __checkedByte(fn, source, i)] ; }
    return s ;
}

// ===================== Data operations ==============================
export function $dataXOR(a:TSDataLike, b:TSDataLike):Buffer {
    const len = Math.max($length(a), $length(b)) ;
    const ret = Buffer.allocUnsafe(len) ;
    if (!len) { return ret ; }
    // the elements of a plain array are checked while they are read (a single pass)
    const ab = __uncheckedBytesFromDataLike(a) ;
    const bb = __uncheckedBytesFromDataLike(b) ;
    for (let i = 0 ; i < len ; i++) { ret[i] = _xorOperand(ab, i) ^ _xorOperand(bb, i) ; }
    return ret ;
}

// the byte at index i, 0 beyond the end (the shortest operand is completed with zeros)
function _xorOperand(bytes:Bytes, i:number):number {
    if (i >= bytes.length) { return 0 ; }
    return bytes instanceof Uint8Array ? bytes[i] : __checkedByte('$dataXOR()', bytes, i) ;
}

// ===================== Data description ==============================
interface BufferAspectOptions {
    prefix?: string;
    suffix?: string;
    name?: string;
    separator?: string;
    showLength?: boolean;
    transformFn?: (n: number) => string;
}

const __dataAspectDefaultOptions: BufferAspectOptions = {
    prefix: '[',
    suffix: ']',
    separator: ',',
    showLength: true
};


export function $dataAspect(source: Bytes | Uint16Array | Uint32Array, opts: BufferAspectOptions = __dataAspectDefaultOptions) {
    const fn = $isfunction(opts.transformFn) ? opts.transformFn! : (n: number) => n.toString();
    const hasPrefix = !!opts.prefix?.length ;
    let s = _dataAspectHeader(source, opts) ;
    if (hasPrefix) { s += opts.prefix! ; }
    if (source.length > 0) {
        if (hasPrefix) { s += ' ' ; }
        s += Array.from(source, v => fn(v)).join(opts.separator + ' ') ;
    }
    return opts.suffix?.length ? s + ` ${opts.suffix}` : s;
}

// the name and the length of the data, followed by a space if not empty
function _dataAspectHeader(source: Bytes | Uint16Array | Uint32Array, opts: BufferAspectOptions):string {
    let s = $ok(opts.name) ? opts.name! : source.constructor.name;
    if (opts.showLength) { s += `(${source.length})`; }
    return s.length > 0 ? s + ' ' : s ;
}

declare global {
    export interface String {
        base64String:    (this: string, encoding?:Nullable<EncodingOrCharset>) => string; // warning: default string encoding is Bynary
        base64URL:       (this: string, encoding?:Nullable<EncodingOrCharset>) => string; // idem
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
$declareMethods(Uint8Array, {
    isGenuineUint8Array(this:Uint8Array): boolean { return this.constructor.name === 'Uint8Array' ; }, 
    leafInspect(this: Uint8Array): string { 
        return this.constructor.name === 'Uint8Array' ? $dataAspect(this) : '<' + $dataAspect(this, { prefix: '', suffix: '', separator: '', showLength: false, transformFn: (n) => n.toHex2() }) + '>' ; 
    },
    base64String(this: Uint8Array): string { return $encodeBase64(this); }, // since Buffer is a subclass of Uint8Array, also available on buffer
    base64URL(this: Uint8Array): string { return $encodeBase64URL(this); }, //idem
    hexaString(this: any, toLowerCase?:boolean): string { return $encodeBytesToHexa(this, toLowerCase) ; }, // since Buffer is a subclass of Uint8Array, also available on buffer
    XOR(this:TSDataLike, other:TSDataLike) { return $dataXOR(this, other) ; },
}) ;

$declareMethods(Uint16Array, {
    leafInspect(this: Uint16Array): string { return $dataAspect(this); },
}) ;

$declareMethods(Uint32Array, {
    leafInspect(this: Uint32Array): string { return $dataAspect(this); },
}) ;

$declareMethods(ArrayBuffer, {
    leafInspect(this: any): string {
        const buf = $bufferFromArrayBuffer(this);
        return 'ArrayBuffer { [Uint8Contents]: <' + $dataAspect(buf, { prefix: '', suffix: '', separator: '', showLength: false, name: '', transformFn: (n) => n.toHex2(true) }) + '>, [byteLength]: ' + buf.length + ' }';
    },
    base64String(this: any): string { return $encodeBase64(this) ; },
    base64URL(this: any): string { return $encodeBase64URL(this) ; },
    hexaString(this: any, toLowerCase?:boolean): string { return $encodeBytesToHexa($bufferFromArrayBuffer(this), toLowerCase) ; },
    XOR(this:TSDataLike, other:TSDataLike) { return $dataXOR(this, other) ; },
}) ;

$declareMethods(String, {
    decodeBase64(this: string): Uint8Array { return $decodeBase64(this); },
    decodeBase64URL(this: string): Uint8Array { return $decodeBase64URL(this); },
    base64String(this: string,  encoding?:Nullable<EncodingOrCharset>): string { return $encodeBase64(this, encoding); },
    base64URL(this: string, encoding?:Nullable<EncodingOrCharset>): string { return $encodeBase64URL(this, encoding); },
}) ;

// ===================== bytes checking ==============================
// For TypeScript an uint8[] only holds bytes, but at run time a plain array can hold anything. Its elements
// are checked when they are read as bytes: Buffer.from() or an Uint8Array silently truncated them (258 -> 2,
// -1 -> 255, 2.7 -> 2, '1' -> 1). A typed array (Uint8Array, Buffer) only holds bytes and is never scanned.

/** @internal — source[i] if it is a byte (an integer from 0 to 255), otherwise a TSError naming the function fn */
export function __checkedByte(fn:string, source:ArrayLike<any>, i:number):uint8 {
    const v = source[i] ;
    // the same test as $isunsigned(v, UINT8_MAX), without its calls (it runs for each element):
    // only an integer from 0 to 255 keeps its value through '& 0xFF' (NaN, 256, -1, 2.7 do not)
    if (typeof v !== 'number' || (v & UINT8_MAX) !== v) { __throwNotAByte(fn, i, v) ; }
    return v as uint8 ;
}

/** @internal — checks source[start, end[ when source is a plain array (nothing is done for a typed array) */
export function __checkBytes(fn:string, source:Bytes, start:number, end:number):void {
    if (source instanceof Uint8Array) { return ; }
    for (let i = start ; i < end ; i++) { __checkedByte(fn, source, i) ; }
}

/** @internal */
export function __throwNotAByte(fn:string, index:number, value:any):never {
    TSError.throw(`${fn}: element #${index} (${_valueDescription(value)}) is not a byte (an integer from 0 to 255).`, { index:index, value:value }) ;
}

function _valueDescription(v:any):string {
    if (typeof v === 'string') { return `'${v}'` ; } // '1' must not look like 1
    try { return String(v) ; }
    catch { return typeof v ; } // eg. an object without prototype
}

// copies source[start, end[ (a plain array) at the start of target, checking each element.
// An Uint8Array keeps a written value unchanged only if it is a byte (256 -> 0, '1' -> 1, NaN -> 0),
// so comparing it with the source value checks the element at almost no cost (testing each element
// before writing it doubled the copy time). The faulty element is only looked for after the loop.
function _copyCheckedBytes<T extends Uint8Array>(fn:string, source:ArrayLike<any>, start:number, end:number, target:T):T {
    let changed = false ;
    try {
        for (let i = start, j = 0; i < end; i++, j++) {
            const v = source[i] ;
            target[j] = v ;
            if (target[j] !== v) { changed = true ; }
        }
    }
    catch { changed = true ; } // a Symbol or a BigInt cannot be written in an Uint8Array
    if (changed) { __checkBytes(fn, source as Bytes, start, end) ; } // throws for the first non byte element
    return target ;
}

// ===================== private functions ==============================

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

