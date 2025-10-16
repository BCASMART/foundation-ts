import { createReadStream } from 'fs';
import { 
    createCipheriv, 
    createDecipheriv, 
    createHash, 
    Hash, 
    randomBytes,
    getRandomValues, 
    randomInt, 
    randomUUID 
} from 'crypto';

import { Nullable, StringDictionary, StringEncoding, TSDataLike, TSDictionary, uint, uint16, uint32, UINT32_MAX, UINT_MAX, UUID, UUIDv1, UUIDv4, UUIDVersion } from './types';
import { $isstring, $length, $ok, $tounsigned, $unsigned, $value, __uuidV1Regex, __uuidV4Regex } from './commons';
import { $bufferFromBytes, $bufferFromDataLike, $uint8ArrayFromDataLike } from './data';
import { $charset, TSCharset } from './tscharset';
import { TSData } from './tsdata';
import { $logterm } from './utils';
import { $ftrim, $trim } from './strings';

import { _TSMD5Config, _TSSHA224HTable, _TSSHA256HTable, _TSSHA384HTable, _TSSHA512HTable, __TSCRC16ARCTable, __TSCRC32Table, __TSSHA256KTable, __TSSHA512KTable } from './crypto_tables';
import { TSError } from './tserrors';
import { _TSHashBuffer } from './crypto_hashBuffer';
import { $declareMethod } from './object';

export type  HashMethod = 'SHA224' | 'SHA256' | 'SHA384' | 'SHA512' | 'MD5' | 'SHA1' ;
export const SHA224:HashMethod = 'SHA224' ;
export const SHA256:HashMethod = 'SHA256' ;
export const SHA384:HashMethod = 'SHA384' ;
export const SHA512:HashMethod = 'SHA512' ;
export const MD5:HashMethod    = 'MD5' ;
export const SHA1:HashMethod   = 'SHA1' ;

export type  EncryptionAlgorithm = 'AES128' | 'AES256' ;
export const AES128:EncryptionAlgorithm = 'AES128' ;
export const AES256:EncryptionAlgorithm = 'AES256' ;

/* we only generate UUID v4. Note that when internal implementation is unknown, we use our own */
export function $uuid(internalImplementation: boolean = false): UUID {
    if (!internalImplementation && typeof randomUUID === 'function') {
        try { return <UUID>(randomUUID as ()=>string)(); }
        catch { $logterm('Warning:crypto.randomUUID() is not available') ; }    
    }
    return $slowuuid(true) ;
}

export function $slowuuid(convertToLowerCase:boolean = false): UUID {
    let uuid = "";
    const rbytes = _randomBytes(32) ;

    for (let i = 0; i < 32; i++) {
        if (i === 12) { uuid += '-4' ; }
        else {
            if (i === 8 || i === 16 || i === 20) { uuid += '-' ; }
            // QUESTION: is it secure to keep the shift here ?
            const rand = (rbytes[i] >> (i % 24)) & 0x0F ;
            uuid += (i == 16 ? (rand & 3 | 8) : rand).toHex1(convertToLowerCase) ; 
        }
    }
    return uuid as UUID ;
}

export function $uuidVersion(str:Nullable<string>):UUIDVersion | undefined {
    const s = $ftrim(str) ; 
    if (!s.length) { return undefined ; }
    if (__uuidV4Regex.test(s)) { return UUIDv4 ; }
    if (__uuidV1Regex.test(s)) { return UUIDv1 ; }
    return undefined ;
}

const __TSNoSpecificIV = Buffer.from([3,67,0,14,2,95,191,0,217,255,7,6,1,67,13,89]) ;
let __CommonInitializationVector: Buffer<ArrayBufferLike> = __TSNoSpecificIV ;

export function $setCommonItializationVector(d?:Nullable<TSDataLike>)
{ __CommonInitializationVector = $length(d) === 16 ? $bufferFromDataLike(d!) : __TSNoSpecificIV ; }

export function $commonInitializationVectorCopy():Buffer
{ return $bufferFromBytes(__CommonInitializationVector, { forceCopy:true }) ; }

export interface $encryptOptions {
    encoding?: Nullable<StringEncoding | TSCharset> ; // default charset is binary
    keyEncoding?:Nullable<StringEncoding | TSCharset> ; // default key charset is binary
    algorithm?: Nullable<EncryptionAlgorithm> ;
    noInitializationVector?:Nullable<boolean> ;
    dataOutput?: Nullable<boolean>;
}

// default encryption mode is AES256-CBC with a random generated initialization vector
// default output is an hexa string
// FIXME: have a replacement in browser when not available
export function $encrypt(src: string | TSDataLike, skey: string | TSDataLike, opts?: Nullable<$encryptOptions>):  TSData | string | null {
    if (typeof createCipheriv === 'undefined') {
        TSError.throw(`$encrypt() : function createCipheriv() is not available in your system.`, { source:src, options:opts }) ;
    }

    const [charset, key, algo] = _charsetKeyAndAlgo(skey, opts);
    if (!charset) { return null; }
    
    const source = $isstring(src) ? charset!.uint8ArrayFromString(src as string) : $uint8ArrayFromDataLike(src as TSDataLike);
    if (!$length(source)) { return null; }

    let returnValue = null ;
    try {
        const addIV = !opts?.noInitializationVector ;
        const iv = addIV ? _randomBytes(16) : __CommonInitializationVector ;

        const cipher = createCipheriv(algo, key, iv);
        let encrypted = addIV ? new TSData(iv) : new TSData() ; 
        encrypted.appendBytes(cipher.update(source)) ;
        encrypted.appendBytes(cipher.final()) ;
        returnValue = !opts?.dataOutput ? encrypted.toString('hex') : encrypted; // output is a TSData OR an hexa string
    }
    catch (e) {
        console.log(e) ;
        returnValue = null;
    }
    return returnValue;
}

export interface $decryptOptions extends $encryptOptions {}

// default returned value is a string to be conform to "standard" encrypt/decryp functions
export function $decrypt(source: string|TSDataLike, skey: string | TSDataLike, opts?: Nullable<$decryptOptions>): TSData | string | null {
    if (typeof createDecipheriv === 'undefined') {
        TSError.throw(`$decrypt() : function createDecipheriv() is not available in your system.`, { source:source, options:opts }) ;
    }

    const hasVector = !opts?.noInitializationVector ;
    const isString = $isstring(source) ;
    const len = $length(source) ;
    
    // AES encryption generate data whith multiple of 16 bytes (32 hex chars) length. 
    // The minimal encrypted data length, without any IV is 16 bytes (32 if hex string). 
    // With an IV, it's 32 bytes (64 if hex string)
    if (len % (isString ? 32 : 16) !== 0 || len < (hasVector ? (isString ? 64 : 32) : (isString ? 32 : 16)) ) { return null ; }
    
    const [charset, key, algo] = _charsetKeyAndAlgo(skey, opts);
    if (!charset) { return null ; }

    let returnValue = null ;

    try {
        let src:Buffer ;
        let iv:Buffer ;
        
        if (isString) {
            // this is an hexadecimal string source. IV is always 16 bytes, so 32 hexa characters
            src = Buffer.from(hasVector ? (source as string).slice(32) : source as string, 'hex') ;
            iv = hasVector ? Buffer.from((source as string).slice(0, 32), 'hex') : __CommonInitializationVector ;
        }
        else {
            // this is a data source
            src = $bufferFromDataLike(source as TSDataLike, { start:hasVector?16:0 }) ;
            iv = hasVector ? $bufferFromDataLike(source as TSDataLike, { end:16 }) : __CommonInitializationVector ;
        }
        let decipher = createDecipheriv(algo, key, iv);
        let decrypted = new TSData(decipher.update(src));
        decrypted.appendBytes(decipher.final());
        returnValue = !opts?.dataOutput ? decrypted.toString(charset) : decrypted ;
    }
    catch (e) {
        returnValue = null ;
    }

    return returnValue ;
}

// CRC-16/ARC algorithm
export function $crc16(source: string | TSDataLike, encoding?: Nullable<StringEncoding | TSCharset>): uint16
{ return _crc(source, 0, __TSCRC16ARCTable, 0xffff, encoding) >>> 0 as uint16 ; }

// CRC-32 algorithm
export function $crc32(source: string | TSDataLike, encoding?: Nullable<StringEncoding | TSCharset>): uint32
{ return (_crc(source, 0 ^ -1, __TSCRC32Table, 0x00ffffff, encoding) ^ -1) >>> 0 as uint32 ; }

// in this implementation we always tries $slowhash() if internal methods fails. Both calls are exception protected.
// in browser, you may prefer to directly call $slowhash()
export function $hash(buf: string | TSDataLike, method?: Nullable<HashMethod>, encoding?: Nullable<StringEncoding | TSCharset>): string | null {
    let ret: string | null = null;
    if (typeof createHash !== 'undefined') {
        // if we have an internal implementation, we use it
        try {
            const source = $isstring(buf) ?
                        $charset(encoding, TSCharset.binaryCharset())!.uint8ArrayFromString(buf as string) :
                        $uint8ArrayFromDataLike(buf as TSDataLike);
            let hash = _createHash(method) ;
            hash.update(source) ;
            ret = hash.digest('hex');
        }
        catch {
            $logterm(`Warning: crypto hash functions did fail for method '${$length(method)?method:'SHA256'}'`) ;    
            ret = null ;
        }
    }
    if ($ok(ret)) { return ret ; }
    try { 
        ret = $slowhash(buf, { method:method, encoding:encoding }) as string | null ; 
    }
    catch { 
        $logterm(`Warning: function $slowhash(buffer, { method:"${$length(method)?method:'SHA256'}" }) did fail`) ;    
        ret = null ; 
    }
    return ret;
}
export interface $hashOptions {
    encoding?: Nullable<StringEncoding | TSCharset> ; // default charset is binary
    method?: Nullable<HashMethod> ;
    separator?:Nullable<string> ;
    dataOutput?: Nullable<boolean>;
}

// $slowhash() is 5 to 7 times slower than node.js implementation
// which, considering, is not so bad, since node.js implementation is written in C
// QUESTION: protect $slowhash() with a try/catch ?
export function $slowhash(source: string | TSDataLike, options:$hashOptions = {}):string|Buffer {
    const buf = $isstring(source) ?
                $charset(options.encoding, TSCharset.binaryCharset())!.bufferFromString(source as string) :
                source as TSDataLike ;
    if (!$ok(options.method) || options.method === SHA256) {
        return $sha256(buf, options.separator, options.dataOutput) ;
    }
    else if (options.method === SHA224) {
        return $sha224(buf, options.separator, options.dataOutput) ;
    }
    else if (options.method === SHA384) {
        return $sha384(buf, options.separator, options.dataOutput) ;
    }
    else if (options.method === SHA512) {
        return $sha512(buf, options.separator, options.dataOutput) ;
    }
    else if (options.method === SHA1) {
        return $sha1(buf, options.separator, options.dataOutput) ;
    }
    else if (options.method === MD5) {
        return $md5(buf, options.separator, options.dataOutput) ;
    }

    TSError.throw(`$slowHash() : ${options.method} hashing method is unknown`, { source:source, options:options }) ;
}

export async function $hashfile(filePath: Nullable<string>, method?: Nullable<HashMethod>): Promise<string | null> {
    TSError.assertNotInBrowser('$hashfile') ;
    return new Promise((resolve, reject) => {
        let hash = _createHash(method) ;
        if (!$length(filePath)) { return reject(null); }
        try {
            createReadStream(<string>filePath).on('data', data => hash.update(data)).on('end', () => resolve(hash.digest('hex')));
        }
        catch (e) { return reject(null); }
    });
}

export function $uuidhash(buf: string | TSDataLike, version?:Nullable<UUIDVersion>): string | null
{ return _uuidHash($hash(buf, MD5), version) ; }

export async function $uuidhashfile(filePath: Nullable<string>, version?:Nullable<UUIDVersion>): Promise<string|null>
{ 
    TSError.assertNotInBrowser('$uuidhashfile') ;
    return _uuidHash(await $hashfile(filePath, MD5), version) ; 
}

// QUESTION: protect $random() with a try/catch ?
export function $random(max?: Nullable<number>): uint {
    let m = $unsigned(max) ; if (!m) { m = UINT32_MAX ; } 
    
    if (typeof randomInt === 'function') {
        return randomInt(Math.min(m, UINT_MAX)) as uint ; 
    }
    else if (typeof randomBytes === 'function') {
        const is32bits = m <= UINT32_MAX ;
        return _randomFromBytes(m, randomBytes(is32bits?4:8), is32bits) ;
    }
    else if (typeof getRandomValues === 'function') {
        const is32bits = m <= UINT32_MAX ;
        return _randomFromBytes(m, getRandomValues(Buffer.allocUnsafe(is32bits?4:8)), is32bits) ;
    }
    else {
        return Math.floor(Math.random() * Math.min(m, UINT_MAX)) as uint ;
    }
}

export function $randomBytes(length:number):Uint8Array {
    length = $tounsigned(length) ;
    return length > 0 ? _randomBytes(length!) : new Uint8Array() ;
}

export function $shuffle<T = any>(values:Nullable<ArrayLike<T>|Iterable<T>>, max?:Nullable<number>): T[] {
    const ret:Array<T> = [] ;
    if ($ok(values)) {
        const source = Array.from(values!) ;
        let n = source.length ;
        if (n > 0) {
            const m = Math.min(n, $tounsigned(max, n as uint)) ;
            for (let i = 0 ; i < m ; i++) {
                const index = $random(n) ;
                ret.push(source[index]) ;
                source.splice(index, 1) ; 
                n-- ;
            }    
        }
    }
    return ret ;
}

export interface $passwordOptions {
    usesLowercase?: boolean,
    usesUppercase?: boolean,
    usesDigits?:    boolean,
    usesSpecials?:  boolean,
};

// QUESTION: do we need to add a max identical chars ?
// this function is not made to generate arbitrary random buffers, so the
// generated password length is limited to 64 characters
export const TS_MAX_PASSWORD_LENGTH = 64
export function $password(len:number, opts: $passwordOptions = {}):string 
{
    if (!opts.usesLowercase && !opts.usesDigits && !opts.usesSpecials && !opts.usesUppercase) {
        opts.usesLowercase = true ;
    }

    const minLen = Math.max((!opts.usesLowercase?0:1)+(!opts.usesUppercase?0:1)+(!opts.usesDigits?0:1)+(!opts.usesSpecials?0:1), 3) ; 
    if (len < minLen) {
        TSError.throw(`$password(): asked length is too short (${len}<${minLen}) for your gneration options`, { length:len, min:minLen, max:TS_MAX_PASSWORD_LENGTH, ... opts})
    }
    else if (len > TS_MAX_PASSWORD_LENGTH) {
        TSError.throw(`$password(): asked length is too long (${len}>${TS_MAX_PASSWORD_LENGTH})`, { length:len, min:minLen, max:TS_MAX_PASSWORD_LENGTH, ... opts})
    } 

    const pwd:string[] = [] ;
    const rbytes = _randomBytes(len) ;
    let i = 0 ;
    const base:string[] = [] ;

    function _randomchar(b:string, idx:number) { return b.charAt(idx % b.length) ; }
    function _makeBase(b:string) {
        base.push(b) ;
        pwd.push(_randomchar(b, rbytes[i++])) ; 
    }
    if (!!opts.usesLowercase) { _makeBase('abcdefghijklmnopqrstuvwxyz') ; }
    if (!!opts.usesUppercase) { _makeBase('ABCDEFGHIJKLMNOPQRSTUVWXYZ') ; }
    if (!!opts.usesDigits)    { _makeBase('01234567890123456789') ; }
    if (!!opts.usesSpecials)  { _makeBase('!#$-_&*@()+/-=[]{}^:;,.') ; } // no <,>,", \ or '
    
    while (i < len) { pwd.push(_randomchar(base[$random(base.length)], rbytes[i++])) ; }

    return $shuffle(pwd).join('') ;
}

declare global {
    export interface String {
        crc16:    (this: string, encoding?: Nullable<StringEncoding | TSCharset>) => uint16;
        crc32:    (this: string, encoding?: Nullable<StringEncoding | TSCharset>) => uint32;
        hash:     (this: string, method?: Nullable<HashMethod>, encoding?: Nullable<StringEncoding | TSCharset>) => string|null;
        slowhash: (this: string, options?:$hashOptions) => string | Buffer ;
    }
    export interface Uint8Array {
        crc16: (this: any) => uint16;
        crc32: (this: any) => uint32;
        hash:  (this: any, method?: Nullable<HashMethod>) => string|null ;
        slowhash: (this: any, options?:$hashOptions) => string | Buffer ;
        uuidhash: (this: any, version?:Nullable<UUIDVersion>) => string | null ;
    }
    export interface ArrayBuffer {
        crc16:    (this: any) => uint16;
        crc32:    (this: any) => uint32;
        hash:     (this: any, method?: Nullable<HashMethod>) => string|null;
        slowhash: (this: any, options?:$hashOptions) => string | Buffer ;
        uuidhash: (this: any, version?:Nullable<UUIDVersion>) => string|null;
    }
    export interface Array<T> {
        shuffle:        (this:T[], max?:number) => T[];
    }
}

String.prototype.crc16         = function crc16(this: string, encoding?: Nullable<StringEncoding | TSCharset>): uint16 { return $crc16(this, encoding) ; }
String.prototype.crc32         = function crc32(this: string, encoding?: Nullable<StringEncoding | TSCharset>): uint32 { return $crc32(this, encoding) ; }
String.prototype.hash          = function hash(this: string, method?: Nullable<HashMethod>, encoding?: Nullable<StringEncoding | TSCharset>): string|null { return $hash(this, method, encoding) ; }
String.prototype.slowhash      = function slowhash(this: any, options?:$hashOptions): string|Buffer { return $slowhash(this, options) ; }

Uint8Array.prototype.crc16     = function crc16(this: any): uint16 { return $crc16(this) ; }
Uint8Array.prototype.crc32     = function crc32(this: any): uint32 { return $crc32(this) ; }
Uint8Array.prototype.hash      = function hash(this: any, method?: Nullable<HashMethod>): string|null { return $hash(this, method) ; }
Uint8Array.prototype.slowhash  = function slowhash(this: any, options?:$hashOptions): string|Buffer { return $slowhash(this, options) ; }
Uint8Array.prototype.uuidhash  = function uuidhash(this: any, version?:Nullable<UUIDVersion>): string|null { return $uuidhash(this, version) ; }

ArrayBuffer.prototype.crc16    = function crc16(this: any): uint16 { return $crc16(this) ; }
ArrayBuffer.prototype.crc32    = function crc32(this: any): uint32 { return $crc32(this) ; }
ArrayBuffer.prototype.hash     = function hash(this: any, method?: Nullable<HashMethod>): string|null { return $hash(this, method) ; }
ArrayBuffer.prototype.slowhash = function slowhash(this: any, options?:$hashOptions): string|Buffer { return $slowhash(this, options) ; }
ArrayBuffer.prototype.uuidhash = function uuidhash(this: any, version?:Nullable<UUIDVersion>): string|null { return $uuidhash(this, version) ; }

/**
 * since some modules like pdfjs require to use for ... in on Array.prototype
 * we did decide to use a functional way to declare our new methods on array
 * For now we limit this modification to Array class 
 */
$declareMethod(Array, { 
    element:'shuffle', 
    implementation:function shuffle<T>(this:T[], max?:Nullable<number>): T[] { return $shuffle(this, max) ; }
}) ;


export function $md5(buf:Nullable<TSDataLike>, separator?:Nullable<string>, dataoutput?:Nullable<boolean>):string|Buffer {
    let H = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476] ;
    const HB = new _TSHashBuffer(buf, {integersCount:16, separator:separator, dataoutput:dataoutput, endianness:'LE'}) ;

    const fn  = [
        (a:number, b:number, c:number, d:number, m:number, k:number, n:number):number => 
        { return (_rol(n, (a + ((b & c) | ((~b) & d)) + m + k) | 0) + b) | 0 ; },
        (a:number, b:number, c:number, d:number, m:number, k:number, n:number):number =>
        { return (_rol(n, (a + ((b & d) | (c & (~d))) + m + k) | 0) + b) | 0 ; },
        (a:number, b:number, c:number, d:number, m:number, k:number, n:number):number =>
        { return (_rol(n, (a + (b ^ c ^ d) + m + k) | 0) + b) | 0 ; },
        (a:number, b:number, c:number, d:number, m:number, k:number, n:number):number =>
        { return (_rol(n, (a + ((c ^ (b | (~d)))) + m + k) | 0) + b) | 0 ;}
    ]
    HB.hash(M => {
        let h = [...H] ;
        _TSMD5Config.forEach(c => {
            h[c[0]] = fn[c[1]](h[c[2]], h[c[3]], h[c[4]], h[c[5]], M[c[6]], c[7], c[8]) ;
        }) ;
        for (let i = 0 ; i < 4 ; i++) { H[i] = (H[i]+h[i]) >>> 0 ; }
    }) ;
    return HB.output(H) ;
}


export function $sha1(buf:Nullable<TSDataLike>, separator?:Nullable<string>, dataoutput?:Nullable<boolean>):string|Buffer {
    const K = [0x5a827999, 0x6ed9eba1, 0x8f1bbcdc, 0xca62c1d6] ;
    let H = [0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476, 0xC3D2E1F0] ;
    let W = new Array<number>(80);

    const HB = new _TSHashBuffer(buf, {integersCount:16, separator:separator, dataoutput:dataoutput}) ;

    function _ft(s:number, b:number, c:number, d:number) {
        if (s === 0) { return _choice(b,c,d) ; }
        if (s === 2) { return _majority(b,c,d) ; }
        return b ^ c ^ d
    }
      
    HB.hash(M => {
        let h = [...H] ;
        for (let i = 0  ; i < 16 ; i++) { W[i] = M[i] ; }
        for (let i = 16 ; i < 80 ; i++) { W[i] = _rol(1, W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16]) ; }
        for (let i = 0 ; i < 80 ; ++i) {
            const s = Math.floor(i/20) ;
            const T = _rol(5, h[0]) + _ft(s, h[1], h[2], h[3]) + h[4] +  K[s] + W[i] ;
            h[4] = h[3] ; h[3] = h[2] ;
            h[2] = _rol(30, h[1]) ;
            h[1] = h[0] ; 
            h[0] = T ;
        }
        for (let i = 0 ; i < 5 ; i++) { H[i] = (H[i]+h[i]) >>> 0 ; }
    }) ;
    return HB.output(H) ;
}

export function $sha224(buf:Nullable<TSDataLike>, separator?:Nullable<string>, dataoutput?:Nullable<boolean>):string|Buffer {
    let H = [ ... _TSSHA224HTable] ;
    let W = new Array<number>(64);
    const HB = new _TSHashBuffer(buf, {integersCount:16, separator:separator, dataoutput:dataoutput}) ;
    HB.hash(_insideHash256(H,W)) ;
    return HB.output(H.slice(0,7)) ;
}

export function $sha256(buf:Nullable<TSDataLike>, separator?:Nullable<string>, dataoutput?:Nullable<boolean>):string|Buffer {
    let H = [... _TSSHA256HTable] ;
    let W = new Array<number>(64);
    const HB = new _TSHashBuffer(buf, {integersCount:16, separator:separator, dataoutput:dataoutput}) ;
    HB.hash(_insideHash256(H,W)) ;
    return HB.output(H) ;

}
export interface PartialHash {
    partial:string|Buffer ;
    calculatedBlocks:number ;
    lastBlock:Buffer ;
} ;

export function $sha256partial(buf:Nullable<TSDataLike>, separator?:Nullable<string>, dataoutput?:Nullable<boolean>):PartialHash {
    let H = [... _TSSHA256HTable] ;
    let W = new Array<number>(64);
    const HB = new _TSHashBuffer(buf, {integersCount:16, separator:separator, dataoutput:dataoutput}) ;
    HB.partialHash(_insideHash256(H,W)) ;
    return {
        partial:HB.output(H),
        calculatedBlocks:HB.blocksCount - 1,
        lastBlock:HB.lastPartialBlock()
    }
}

export function $sha384(buf:Nullable<TSDataLike>, separator?:Nullable<string>, dataoutput?:Nullable<boolean>):string|Buffer {
    // H vector contains a high bytes, a low butes, b high bytes, b low bytes, ...
    let H = [... _TSSHA384HTable] ;
    let W = new Array(160) ;
    const HB = new _TSHashBuffer(buf, {integersCount:32, separator:separator, dataoutput:dataoutput}) ;
    HB.hash(_insideHash512(H, W)) ;
    return HB.output(H.slice(0, 12)) ;
}

export function $sha512(buf:Nullable<TSDataLike>, separator?:Nullable<string>, dataoutput?:Nullable<boolean>):string|Buffer {
    let H = [... _TSSHA512HTable] ;
    let W = new Array(160) ;
    const HB = new _TSHashBuffer(buf, {integersCount:32, separator:separator, dataoutput:dataoutput}) ;
    HB.hash(_insideHash512(H, W)) ;
    return HB.output(H) ;
}

// ================= private functions =================

const __TSEncryptKeyLength:TSDictionary<number> = {
    'AES128': 16,
    'AES256': 32
} ;
const __TSEncryptAlgoRef:StringDictionary = {
    'AES128': 'aes-128-cbc',
    'AES256': 'aes-256-cbc'
} ;

const __TSHashMethodRef:StringDictionary = {
    'SHA224': 'sha224',
    'SHA256': 'sha256',
    'SHA384': 'sha384',
    'SHA512': 'sha512',
    'MD5':    'md5',
    'SHA1':   'sha1'
} ;

function _uuidHash(h:Nullable<string>, version?:Nullable<UUIDVersion>) {
    if ($length(h) === 32) {
        const v = $value(version, UUIDv1) ;
        const s = h!.toLowerCase() ;
        return s.slice(0,8) + '-'  + s.slice(8,12) 
            + (v === UUIDv1 ? '-'  + s.slice(12,16) + '-' + s.slice(16,20) 
                            : '-4' + s.slice(13,16) + '-' + _hnab(s.charAt(16)) + s.slice(17,20)) 
            + '-' + s.slice(20,32);
    }
    return null ;
}

function _randomFromBytes(m:uint, bytes:Buffer, is32bits:boolean):uint {
    return is32bits ? 
           (bytes.readUInt32LE(0) % m) as uint :
           ((bytes.readUInt32LE(0) << 20) + (bytes.readUInt32LE(4) & 0x000fffff)) % Math.min(m, UINT_MAX) as uint ;
}

function _algo(algo:Nullable<string>):string
{
    const a = $trim(algo).toUpperCase() ;
    return $ok(__TSEncryptKeyLength[a]) ? a : AES256 ;
}

function _randomBytes(length:number):Uint8Array {
    if (typeof randomBytes === 'function') { return randomBytes(length) ; }
    else {
        const array = new Uint8Array(length) ;
        if (typeof getRandomValues === 'function') { return getRandomValues(array) ; }
        else if (typeof randomInt === 'function') {
            for (let i = 0 ; i < length ; i++) { array[i] = randomInt(255) ; }
        }
        else {
            for (let i = 0 ; i < length ; i++) { array[i] = Math.floor(Math.random() * 255) ;}
        }
        return array ;
    }
}

function _createHash(method?:Nullable<HashMethod>):Hash
{ return createHash($value(__TSHashMethodRef[$trim(method).toUpperCase()], 'sha256')) ; }

function _charsetKeyAndAlgo(skey: string | TSDataLike, opts?: Nullable<$encryptOptions>): [TSCharset | null, Uint8Array, string] {
    const defaultCharset = TSCharset.binaryCharset() ;
    const keyCharset = $charset(opts?.keyEncoding, defaultCharset);
    const algo = _algo(opts?.algorithm) ;
    const key = $isstring(skey) ? keyCharset.uint8ArrayFromString(skey as string) : $uint8ArrayFromDataLike(skey as TSDataLike) ;
    if (key.length !== __TSEncryptKeyLength[algo]) { return [null, key, __TSEncryptAlgoRef[AES256]]; }
    return [$charset(opts?.encoding, defaultCharset), key, __TSEncryptAlgoRef[algo]]
}

function _hnab(c:string):string { return '89ab'.includes(c) ? c : '8' ; }

function _crc(source: string | TSDataLike, crc:number, table:number[], andValue:number, encoding?: Nullable<StringEncoding | TSCharset>):number
{
    const src = $isstring(source) ?
        $charset(encoding, TSCharset.binaryCharset())!.uint8ArrayFromString(source as string) :
        $uint8ArrayFromDataLike(source as TSDataLike) ;
    const len = src.length;
    for (let i = 0; i < len; i++) {
        crc = ((crc >> 8) & andValue) ^ table[(crc ^ src[i]) & 0xff] ;
    }
    return crc ;
}

function _insideHash256(H:number[], W:number[]) {
    function _gamma0(x:number):number { return _ror(7,  x) ^ _ror(18, x) ^ (x>>>3) ;  }
    function _gamma1(x:number):number { return _ror(17, x) ^ _ror(19, x) ^ (x>>>10) ; }
    function _sigma0(x:number):number { return _ror(2,  x) ^ _ror(13, x) ^ _ror(22, x) ; }
    function _sigma1(x:number):number { return _ror(6,  x) ^ _ror(11, x) ^ _ror(25, x) ; }

    return function(M:number[]):void {
        let h = [...H] ;
        let i = 0 ;

        for (; i < 16 ; i++) { W[i] = M[i] ; }
        for (; i < 64 ; i++) { W[i] = (_gamma1(W[i - 2]) + W[i - 7] + _gamma0(W[i - 15]) + W[i - 16]) >>> 0 ; }
        for (i = 0 ; i < 64 ; i++) {
            const T1 = h[7] + _sigma1(h[4]) + _choice(h[4], h[5], h[6]) + __TSSHA256KTable[i] + W[i];
            const T2 =        _sigma0(h[0]) + _majority(h[0], h[1], h[2]);
            h[7] = h[6] ; h[6] = h[5] ; h[5] = h[4] ;
            h[4] = (h[3] + T1) >>> 0 ;
            h[3] = h[2] ; h[2] = h[1] ; h[1] = h[0] ;
            h[0] = (T1 + T2) >>> 0 ;
        }
        for (let i = 0 ; i < 8 ; i++) { H[i] = (H[i]+h[i]) >>> 0 ; }
    }
}


export function _insideHash512(H:number[], W:number[]) {
    function _sigma0(xh:number,  xl:number):number  { return (xh >>> 28 | xl << 4) ^ (xl >>> 2 | xh << 30) ^ (xl >>> 7 | xh << 25) ; }
    function _sigma1(xh:number,  xl:number):number  { return (xh >>> 14 | xl << 18) ^ (xh >>> 18 | xl << 14) ^ (xl >>> 9 | xh << 23) ; }

    function _gamma0(xh:number,  xl:number):number { return (xh >>> 1 | xl << 31) ^ (xh >>> 8 | xl << 24) ^ (xh >>> 7) ;  }
    function _gamma0l(xh:number, xl:number):number { return (xh >>> 1 | xl << 31) ^ (xh >>> 8 | xl << 24) ^ (xh >>> 7 | xl << 25) ; }
    function _gamma1(xh:number,  xl:number):number { return (xh >>> 19 | xl << 13) ^ (xl >>> 29 | xh << 3) ^ (xh >>> 6) ; }
    function _gamma1l(xh:number, xl:number):number { return (xh >>> 19 | xl << 13) ^ (xl >>> 29 | xh << 3) ^ (xh >>> 6 | xl << 26) ; }
    function _carry(a:number,b:number):number { return (a >>> 0) < (b >>> 0) ? 1 : 0 ; }

    return function(M:number[]):void {
        let h = [...H] ;

        for (let i = 0  ; i < 32 ; i++) { W[i] = M[i] ; }
        for (let i = 32 ; i < 160 ; i+=2) {
            // W64[i] = gamma0(W64[i-15]) + W64[i - 7] + gamma1(W64[i-2]) + W64[i - 16]

            let wh = W[i - 30], wl = W[i - 29] ;
            const gamma0  = _gamma0(wh, wl) ;
            const gamma0l = _gamma0l(wl, wh) ;
            
            wh = W[i-4] ; wl = W[i-3] ;
            const gamma1  = _gamma1(wh, wl) ;
            const gamma1l = _gamma1l(wl, wh) ;

            wl = (gamma0l + W[i - 13]) | 0
            wh = (gamma0 + W[i - 14] + _carry(wl, gamma0l)) | 0
            wl = (wl + gamma1l) | 0
            wh = (wh + gamma1 + _carry(wl, gamma1l)) | 0

            const w16l = W[i - 31]
            wl = (wl + w16l) | 0
            wh = (wh + W[i - 32] + _carry(wl, w16l)) | 0

            W[i]   = wh ;
            W[i+1] = wl ;
        }

        for (let i = 0; i < 160; i += 2) {
            let wh = W[i], wl = W[i+1] ;
            const sigma0l = _sigma0(h[1], h[0]) ;
            const KH = __TSSHA512KTable[i], KL = __TSSHA512KTable[i + 1] ;
            const choicel = _choice(h[9], h[11], h[13]) ;

            let T1L = (h[15] + _sigma1(h[9], h[8])) | 0 ;
            let T1H = (h[14] + _sigma1(h[8], h[9]) + _carry(T1L, h[15])) | 0
            T1L = (T1L + choicel) | 0
            T1H = (T1H + _choice(h[8], h[10], h[12]) + _carry(T1L, choicel)) | 0
            T1L = (T1L + KL) | 0
            T1H = (T1H + KH + _carry(T1L, KL)) | 0
            T1L = (T1L + wl) | 0
            T1H = (T1H + wh + _carry(T1L, wl)) | 0
        
            const T2L = (sigma0l + _majority(h[1], h[3], h[5])) | 0
            const T2H = (_sigma0(h[0], h[1]) + _majority(h[0], h[2], h[4]) + _carry(T2L, sigma0l)) | 0
        
            h[14] = h[12] ; h[15] = h[13] ; h[12] = h[10] ; 
            h[13] = h[11] ; h[10] = h[8] ; h[11] = h[9] ;
            h[9] = (h[7] + T1L) | 0 ;
            h[8] = (h[6] + T1H + _carry(h[9], h[7])) | 0 ;
            h[6] = h[4] ; h[7] = h[5] ; h[4] = h[2] ;
            h[5] = h[3] ; h[2] = h[0] ; h[3] = h[1] ;
            h[1] = (T1L + T2L) | 0 ;
            h[0] = (T1H + T2H + _carry(h[1], T1L)) | 0 ;
        }
        for (let i = 0 ; i < 16 ; i += 2) {
            H[i+1] = (H[i+1] + h[i+1]) >>> 0 ; 
            H[i]   = (H[i]   + h[i] + _carry(H[i+1],  h[i+1])) >>> 0 ; 
        }
    }
}

function _majority(x:number, y:number, z:number):number { return (x & y) | (z & (x | y)) ; }
function _choice(x:number, y:number, z:number):number { return z ^ (x & (y ^ z)) ; }
function _rol(n:number, x:number):number { return (x << n) | (x >>> (32-n)) ; }
function _ror(n:number, x:number):number { return (x >>> n) | (x << (32-n)); }
