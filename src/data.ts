import { $isfunction, $isstring, $lse, $ok } from "./commons";
import { TSCharset } from "./tscharset";
import { TSData } from "./tsdata";
import { Bytes, Nullable, TSDataLike, uint8 } from "./types";

export interface DataConversionOptions {
    start?:Nullable<number>,
    end?:Nullable<number>,
    forceCopy?:Nullable<boolean>
}

// ===================== conversions to Buffer ==============================

export function $bufferFromArrayBuffer(a: ArrayBuffer): Buffer 
{ return ArrayBuffer.isView(a) ? Buffer.from(a!.buffer, a!.byteOffset, a!.byteLength) : Buffer.from(a); }

export function $bufferFromBytes(source:Bytes, opts:DataConversionOptions = {}): Buffer
{
    const [sourceLen, start, end, len] = $lse(source, opts.start, opts.end) ;

    if (!opts.forceCopy && source instanceof Buffer) {
        return start === 0 && end === sourceLen ? source : source.subarray(start, end) ;
    }
    else if (start === 0 && end === sourceLen) { return Buffer.from(source) ; }

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
    if (!opts.forceCopy && (source instanceof Uint8Array || source instanceof Buffer)) {
        return start === 0 && end === sourceLen ? source : source.subarray(start, end) ;
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

    if (!opts.forceCopy && !(source instanceof Uint8Array) && !(source instanceof Buffer)) {
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

// ===================== Base64 conversions ==============================

const base64KeyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

export function $decodeBase64(input: string, reference: string = base64KeyStr): Uint8Array {
    var chr1, chr2, chr3;
    var enc1, enc2, enc3, enc4;
    var i = 0;
    var size = 0;
    const len = input.length;

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
        if (enc3 !== 64) { uint8[size++] = (chr2 & 0xff) ; }
        if (enc4 !== 64) { uint8[size++] = (chr3 & 0xff) ; }

    }
    return uint8.subarray(0, size);
}

export function $encodeBase64(source: Uint8Array | string, reference: string = base64KeyStr): string {
    var output = "";
    var chr1, chr2, chr3, enc1, enc2, enc3, enc4;

    const input = $isstring(source) ? TSCharset.binaryCharset().uint8ArrayFromString(source as string) : source as Uint8Array;
    const len = input.length;
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
        toBase64:    (this: string) => string;
    }
    export interface Uint8Array {
        leafInspect:         (this: Uint8Array) => string;
        toBase64:            (this: Uint8Array) => string;
        isGenuineUint8Array: (this:Uint8Array) => boolean ;
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
String.prototype.toBase64         = function toBase64(this: string): string { return $encodeBase64(this); }
Uint8Array.prototype.toBase64     = function toBase64(this: Uint8Array): string { return $encodeBase64(this); } // since Buffer is a subclass of Uint8Array, also available on buffer
ArrayBuffer.prototype.toBase64    = function toBase64(this: any): string { return $encodeBase64($bufferFromArrayBuffer(this)) ; }

// ===================== private functions ==============================
export function _toBytesOpts(source:TSDataLike, opts:DataConversionOptions = {}): [Bytes, DataConversionOptions]
{
    if (source instanceof ArrayBuffer) {
        opts = {...opts, forceCopy: false } // here we already force a conversion, so no need to do it twice
        return [$bufferFromArrayBuffer(source), {...opts, forceCopy: false }] ;
    }
    else if (source instanceof TSData) { return [source.mutableBuffer, opts] ; }
    return [source, opts] ;
}

