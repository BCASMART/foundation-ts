import { $isfunction, $ismethod, $isstring, $length, $lse, $ok, $valueornull } from "./commons";
import { $charset, TSCharset } from "./tscharset";
import { TSData } from "./tsdata";
import { Bytes, Nullable, StringEncoding, TSDataLike, TSEndianness, uint32, uint8 } from "./types";

export interface DataInterval {
    start?:Nullable<number>,
    end?:Nullable<number>
}
export interface DataConversionOptions extends DataInterval {
    forceCopy?:Nullable<boolean>
}

// ===================== conversions to Buffer ==============================

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
    return new Blob([data]) ;
}

export function $blobFromDataLike(source: TSDataLike): Blob { 
    return source instanceof ArrayBuffer ? 
            new Blob([source]) : 
            (source instanceof TSData ? new Blob([source.mutableBuffer]) : $blobFromBytes(source)) ;
}

// ===================== conversions to Uint32 ==============================
export function $uint32ArrayFromDataLike(source:TSDataLike,  endianness?:Nullable<TSEndianness>, complete?:Nullable<boolean>): uint32[] {
    return $uint32ArrayFromBuffer($bufferFromDataLike(source), endianness, complete) ;
}

export function $uint32ArrayFromBuffer(source:Buffer, endianness?:Nullable<TSEndianness>, complete?:Nullable<boolean>):uint32[] {
    const supl = source.length % 4 ;
    const compl = !!complete && supl > 0 ? 1 : 0 ;
    const len = (source.length / 4) | 0 ;
    const ret = new Array<number>(len+compl) ;

    if (endianness === 'LE') {
        for (let i = 0 ; i < len ; i++) ret[i] = source.readInt32LE(i<<2) ;
        if (compl) {
            ret[len] = 0 ;
            for (let i = 0, n = len << 2 ; i < supl ; i++) { ret[len] |= source[n+i] << (i<<3) ; }
        }
    }
    else {
        for (let i = 0 ; i < len ; i++) ret[i] = source.readInt32BE(i<<2) ;
        if (compl) {
            ret[len] = 0 ;
            for (let i = 0, n = len << 2 ; i < supl ; i++) { ret[len] |= source[n+i] << (24-(i<<3)) ; }
        }
    }
    return ret as uint32[];
}

// ===================== Base64 conversions ==============================

const base64KeyStr    = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
const base64URLKeyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_=";
const base64Regex     = /[^A-Za-z0-9\+\/\=]/g ;
const base64URLRegex  = /[^A-Za-z0-9\-\_\=]/g ;
const base64URLRightTrimRegex = /[\=]+$/ ;

export function $decodeBase64(input: string): Uint8Array
{ return _decodeBase64(input, base64KeyStr, base64Regex) ; }

export function $decodeBase64URL(input: string): Uint8Array
{ return _decodeBase64(input, base64URLKeyStr, base64URLRegex) ; }

function _decodeBase64(input: string, reference: string, regex:RegExp): Uint8Array {
    let chr1, chr2, chr3;
    let enc1, enc2, enc3, enc4;
    let i = 0;
    let size = 0;
    const len = input.length;

    input = input.replace(regex, "");

    let uint8 = new Uint8Array(input.length);

    while (i < len) {

        enc1 = reference.indexOf(input.charAt(i++));
        enc2 = i < len ? reference.indexOf(input.charAt(i++)) : 64 ;
        enc3 = i < len ? reference.indexOf(input.charAt(i++)) : 64 ;
        enc4 = i < len ? reference.indexOf(input.charAt(i++)) : 64 ;

        chr1 = (enc1 << 2) | (enc2 >> 4);
        chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
        chr3 = ((enc3 & 3) << 6) | enc4;

        uint8[size++] = (chr1 & 0xff);
        if (enc3 !== 64) { uint8[size++] = (chr2 & 0xff) ; }
        if (enc4 !== 64) { uint8[size++] = (chr3 & 0xff) ; }
    }
    return uint8.subarray(0, size);
}

export function $encodeBase64(source: TSDataLike | string, encoding?:Nullable<StringEncoding | TSCharset>): string
{ return _encodeBase64(source, base64KeyStr, encoding) ; }

export function $encodeBase64URL(source: TSDataLike | string, encoding?:Nullable<StringEncoding | TSCharset>): string
{ return _encodeBase64(source, base64URLKeyStr, encoding) ; }

function _encodeBase64(source: TSDataLike | string, ref?: Nullable<string>, encoding?:Nullable<StringEncoding | TSCharset>): string {
    const reference = $length(ref) ? ref as string : base64KeyStr ;
    let output = "";
    let chr1, chr2, chr3, enc1, enc2, enc3, enc4;
    const charset = $charset(encoding, TSCharset.binaryCharset()) ;
    const input = $isstring(source) ? charset.uint8ArrayFromString(source as string) : $uint8ArrayFromDataLike(source as TSDataLike) ;
    const len = input.length;
    let i = 0 ;

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
    return ref === base64URLKeyStr && output.length > 0 ? output.replace(base64URLRightTrimRegex, "") : output ;            
}

export function $decodeHexa(s:string):Buffer { return Buffer.from(s, 'hex') ; }

const FoundationHexaChars = '0123456789ABCDEF' ;
const FoundationHexaLowerChars = '0123456789abcdef' ;

export function $encodeHexa(source:TSDataLike, toLowerCase?:boolean):string
{
    if (source instanceof TSData) { return $encodeBytesToHexa(source.mutableBuffer) ; }
    else if (source instanceof ArrayBuffer) { return $encodeBytesToHexa($bufferFromArrayBuffer(source)) ; }
    return $encodeBytesToHexa(source, toLowerCase) ;
}

export function $encodeBytesToHexa(source:Bytes, toLowerCase?:boolean):string {
    if (source instanceof Buffer && !!toLowerCase) { return source.toString('hex') ; } // fast implementation
    
    let s = '' ;
    const len = $length(source) ;
    if (len) {
        const b = !toLowerCase ? FoundationHexaChars : FoundationHexaLowerChars ;

        for (let i = 0 ; i < len ; i++) {
            const n = source[i] ;
            s += b[(n>>4) & 0xF] + b[n & 0xF] ;
        }
    }   
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
        toBase64:        (this: string, encoding?:Nullable<StringEncoding | TSCharset>) => string; // warning: default string encoding is Bynary
        toBase64URL:     (this: string, encoding?:Nullable<StringEncoding | TSCharset>) => string; // idem
        decodeBase64:    (this: string) => Uint8Array;
        decodeBase64URL: (this: string) => Uint8Array;
    }
    export interface Uint8Array {
        leafInspect:         (this: any) => string;
        toBase64URL:         (this: any) => string;
        toBase64:            (this: any) => string;
        toHexa:              (this: any, toLowerCase?:boolean) => string;
        isGenuineUint8Array: (this: any) => boolean ;
        XOR:                 (this: TSDataLike, other:TSDataLike) => Buffer;
    }
    export interface Uint16Array {
        leafInspect: (this: Uint16Array) => string;
    }
    export interface Uint32Array {
        leafInspect: (this: Uint32Array) => string;
    }
    export interface ArrayBuffer {
        leafInspect: (this: any) => string;
        toBase64:    (this: any) => string;
        toBase64URL: (this: any) => string;
        toHexa:      (this: any, toLowerCase?:boolean) => string;
        XOR:         (this: TSDataLike, other:TSDataLike) => Buffer;
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
    return 'ArrayBuffer { [Uint8Contents]: <' + $dataAspect(buf, { prefix: '', suffix: '', separator: '', showLength: false, name: '', transformFn: (n) => n.toHex2(true) }) + '>, byteLength: ' + buf.length + ' }';
}

String.prototype.decodeBase64     = function decodeBase64(this: string): Uint8Array { return $decodeBase64(this); }
String.prototype.decodeBase64URL  = function decodeBase64URL(this: string): Uint8Array { return $decodeBase64URL(this); }
String.prototype.toBase64         = function toBase64(this: string, encoding?:Nullable<StringEncoding | TSCharset>): string { return $encodeBase64(this, encoding); }
String.prototype.toBase64URL      = function toBase64URL(this: string, encoding?:Nullable<StringEncoding | TSCharset>): string { return $encodeBase64URL(this, encoding); }
Uint8Array.prototype.toBase64     = function toBase64(this: Uint8Array): string { return $encodeBase64(this); } // since Buffer is a subclass of Uint8Array, also available on buffer
Uint8Array.prototype.toBase64URL  = function toBase64(this: Uint8Array): string { return $encodeBase64URL(this); } //idem
ArrayBuffer.prototype.toBase64    = function toBase64(this: any): string { return $encodeBase64(this) ; }
ArrayBuffer.prototype.toBase64URL = function toBase64(this: any): string { return $encodeBase64URL(this) ; }

Uint8Array.prototype.toHexa       = function toHexa(this: any, toLowerCase?:boolean): string { return $encodeBytesToHexa(this, toLowerCase) ; } // since Buffer is a subclass of Uint8Array, also available on buffer
ArrayBuffer.prototype.toHexa      = function toHexa(this: any, toLowerCase?:boolean): string { return $encodeBytesToHexa($bufferFromArrayBuffer(this), toLowerCase) ; }

Uint8Array.prototype.XOR          = function xor(this:TSDataLike, other:TSDataLike) { return $dataXOR(this, other) ; }
ArrayBuffer.prototype.XOR         = function xor(this:TSDataLike, other:TSDataLike) { return $dataXOR(this, other) ; }

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

