import { $count, $isfunction, $isstring, $isunsigned, $length, $ok, $tounsigned } from "./commons";
import { Nullable, uint8 } from "./types";

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

export function $bufferFromArrayBuffer(a:ArrayBuffer) : Buffer {
    return ArrayBuffer.isView(a) ? Buffer.from(a!.buffer, a!.byteOffset, a!.byteLength) : Buffer.from(a) ;
}

export function $arrayBufferFromBuffer(source:Buffer, start:number = 0, end:number = source.length) : ArrayBuffer {
    if (!$isunsigned(start) || !$isunsigned(end)) { throw '$arrayBufferFromBuffer(): start and end parameters must be true unsigned values' ; }       
    end = Math.min(source.length, $tounsigned(end)) ;
    start = Math.min(end, $tounsigned(start)) ;

    const ret = new ArrayBuffer(end - start) ;
    const view = new Uint8Array(ret) ;
    for (let i = start, j = 0 ; i < end; i++, j++) { view[j] = source[i]; }

    return ret ;
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

interface $bufferAspectOptions {
    prefix?:string ;
    suffix?:string ;
    name?:string ;
    separator?:string ;
    showLength?:boolean ;
    transformFn?:(n:number) => string ;
} 

export function $bufferAspect(
    source:Uint8Array|Uint16Array|Uint32Array|Buffer, 
    opts:$bufferAspectOptions = { prefix:'[', suffix:']', separator:',', showLength:true }
) {
    const fn = $isfunction(opts.transformFn) ? opts.transformFn! :  (n:number) => n.toString() ;
    const n = source.length ;
    let s = $ok(opts.name) ? opts.name! : source.constructor.name ;
    if (opts.showLength) { s += `(${n})` ; }
    if (s.length > 0) { s += ' ' ; }
    if (opts.prefix?.length) { s += opts.prefix! } ;
    if (n > 0) {
        if (opts.prefix?.length) { s += ' ' } ;
        s += fn(source[0]) ;
        for (let i = 1 ; i < n ; i++) { s += opts.separator+' '+fn(source[i]) ; }
    }
    return opts.suffix?.length ? s + ` ${opts.suffix}` : s ;
}

declare global {
    export interface Uint8Array {
        leafInspect: (this:Uint8Array) => string ;
    }
    export interface Uint16Array {
        leafInspect: (this:Uint16Array) => string ;        
    }
    export interface Uint32Array {
        leafInspect: (this:Uint32Array) => string ;        
    }
    export interface ArrayBuffer {
        leafInspect: (this:any) => string ;        
    }
}

if (!('leafInspect' in Uint8Array.prototype)) {
    Buffer.prototype.leafInspect = function leafInspect(this:Uint8Array):string { return '<'+$bufferAspect(this, { prefix: '', suffix:'', separator:'', showLength:false, transformFn: (n) => n.toHex2() })+'>' ; }
    Uint8Array.prototype.leafInspect = function leafInspect(this:Uint8Array):string { return $bufferAspect(this) ; }
    Uint16Array.prototype.leafInspect = function leafInspect(this:Uint16Array):string { return $bufferAspect(this) ; }
    Uint32Array.prototype.leafInspect = function leafInspect(this:Uint32Array):string { return $bufferAspect(this) ; }
    ArrayBuffer.prototype.leafInspect = function leafInspect(this:any):string {
        const buf = $bufferFromArrayBuffer(this) ;
        return 'ArrayBuffer { [Uint8Contents]: <'+$bufferAspect(buf, { prefix:'', suffix:'', separator:'', showLength:false, name:'', transformFn: (n) => n.toHex2(true)})+'>, byteLength: '+buf.length+' }' ;
    }
}
