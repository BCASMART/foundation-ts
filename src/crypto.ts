import { createReadStream } from 'fs';
import {
    createCipheriv,
    createDecipheriv,
    createHash,
    randomBytes,
} from 'crypto';


import { Nullable, StringDictionary, StringEncoding, TSDataLike, TSDictionary, uint, uint16, uint32, UINT32_MAX, UINT_MAX, UUID, UUIDv1, UUIDv4, UUIDVersion } from './types';
import { $isstring, $length, $ok, $tounsigned, $unsigned, $value, __uuidV1Regex, __uuidV4Regex } from './commons';
import { $bufferFromBytes, $bufferFromDataLike, $bufferFromHexaString, $uint8ArrayFromDataLike } from './data';
import { $charset, TSCharset } from './tscharset';
import { TSData } from './tsdata';
import { $logterm } from './utils';
import { $ftrim, $trim } from './strings';

import { TSError } from './tserrors';
import { $declareMethod } from './object';
import { TSCrypto } from './tscrypto';

export type  HashMethod = 'SHA224' | 'SHA256' | 'SHA384' | 'SHA512' | 'SHA1' ;
export const SHA224:HashMethod = 'SHA224' ;
export const SHA256:HashMethod = 'SHA256' ;
export const SHA384:HashMethod = 'SHA384' ;
export const SHA512:HashMethod = 'SHA512' ;
export const SHA1:HashMethod   = 'SHA1' ;

export type  EncryptionAlgorithm = 'AES128' | 'AES256' ;
export const AES128:EncryptionAlgorithm = 'AES128' ;
export const AES256:EncryptionAlgorithm = 'AES256' ;

const __wcENGINE = (): Crypto | undefined => (globalThis as any).crypto ?? undefined ;

// ================= pluggable crypto provider =================
//
// By default foundation-ts resolves each primitive as:
//   provider  ->  node:crypto (createHash/createCipheriv/randomBytes)
//             ->  globalThis.crypto (getRandomValues/randomUUID)
//             ->  pure JS (TSCrypto for hashing, Math.random for bytes)
//
// A consumer (typically a browser bundle whose crypto polyfill lacks some
// primitives, or a test needing a deterministic engine) can override any subset:
//
//   import { $setCryptoProvider } from 'foundation-ts/crypto' ;
//   $setCryptoProvider({ getRandomValues, randomUUID }) ;   // e.g. from globalThis.crypto
//
// Pass null / {} to clear all overrides and return to the built-in resolution.

export interface TSHasher {
    update(data: Uint8Array | string): unknown ;
    digest(encoding: 'hex'): string ;
}
export interface TSCipher {
    update(data: Uint8Array): Uint8Array ;
    final(): Uint8Array ;
}
export interface TSCryptoProvider {
    randomBytes?:      (size: number) => Uint8Array ;
    getRandomValues?:  (view: Uint8Array<ArrayBuffer>) => unknown ; // ArrayBuffer, not …Like: matches Crypto.getRandomValues
    randomUUID?:       () => string ;
    createHash?:       (algorithm: string) => TSHasher ;
    createCipheriv?:   (algorithm: string, key: Uint8Array, iv: Uint8Array) => TSCipher ;
    createDecipheriv?: (algorithm: string, key: Uint8Array, iv: Uint8Array) => TSCipher ;
}

let __cryptoProvider: TSCryptoProvider = {} ;

export function $setCryptoProvider(provider: Nullable<TSCryptoProvider>): void
{ __cryptoProvider = $ok(provider) ? { ...provider } : {} ; }

export function $cryptoProvider(): Readonly<TSCryptoProvider> { return __cryptoProvider ; }

function _providerFn<K extends keyof TSCryptoProvider>(k:K): NonNullable<TSCryptoProvider[K]> | undefined {
    const fn = __cryptoProvider[k] ;
    return typeof fn === 'function' ? fn as NonNullable<TSCryptoProvider[K]> : undefined ;
}

/* we only generate UUID v4. Note that when internal implementation is unknown, we use our own */
export function $uuid(internalImplementation: boolean = false): UUID {
    if (!internalImplementation) {
        const provided = _providerFn('randomUUID') ;
        const engine = __wcENGINE() ;
        const impl = provided ?? (typeof engine?.randomUUID === 'function' ? engine.randomUUID.bind(engine) : undefined) ;
        if ($ok(impl)) {
            try { const u = impl() ; if ($length(u) === 36) { return u as UUID ; } }
            catch {}
        }
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
    if (!_cipherAvailable(false)) {
        TSError.throw(`$encrypt() : function createCipheriv() is not available in your system.`, { source:src, options:opts }) ;
    }

    const [charset, key, algo] = _charsetKeyAndAlgo(skey, opts);
    if (!charset) { return null; }
    
    const source = $isstring(src) ? charset!.uint8ArrayFromString(src) : $uint8ArrayFromDataLike(src);
    if (!$length(source)) { return null; }

    let returnValue = null ;
    try {
        const addIV = !opts?.noInitializationVector ;
        const iv = addIV ? _randomBytes(16) : __CommonInitializationVector ;

        const cipher = _createCipher(false, algo, key, iv);
        let encrypted = addIV ? new TSData(iv) : new TSData() ;
        encrypted.appendBytes(cipher.update(source)) ;
        encrypted.appendBytes(cipher.final()) ;
        returnValue = !opts?.dataOutput ? encrypted.hexaString() : encrypted; // output is a TSData OR an hexa string
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
    if (!_cipherAvailable(true)) {
        TSError.throw(`$decrypt() : function createDecipheriv() is not available in your system.`, { source:source, options:opts }) ;
    }

    const hasVector = !opts?.noInitializationVector ;
    const isString = $isstring(source) ;
    const len = $length(source) ;
    
    // AES encryption generate data whith multiple of 16 bytes (32 hexa chars) length. 
    // The minimal encrypted data length, without any IV is 16 bytes (32 if hexa string). 
    // With an IV, it's 32 bytes (64 if hexa string)
    if (len % (isString ? 32 : 16) !== 0 || len < (hasVector ? (isString ? 64 : 32) : (isString ? 32 : 16)) ) { return null ; }
    
    const [charset, key, algo] = _charsetKeyAndAlgo(skey, opts);
    if (!charset) { return null ; }

    let returnValue = null ;

    try {
        let src:Nullable<Buffer> ;
        let iv:Nullable<Buffer> ;
        
        if (isString) {
            // this is an hexadecimal string source. IV is always 16 bytes, so 32 hexa characters
            src = $bufferFromHexaString(hasVector ? (source as string).slice(32) : source as string) ;
            if (!$ok(src)) { return null ; }
            iv = hasVector ? $bufferFromHexaString((source as string).slice(0, 32)) : __CommonInitializationVector ;
            if (!$ok(iv)) { return null ; }
        }
        else {
            // this is a data source
            src = $bufferFromDataLike(source as TSDataLike, { start:hasVector?16:0 }) ;
            iv = hasVector ? $bufferFromDataLike(source as TSDataLike, { end:16 }) : __CommonInitializationVector ;
        }
        let decipher = _createCipher(true, algo, key, iv!);
        let decrypted = new TSData(decipher.update(src!));
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
{  return TSCrypto.crc16(_uint8ArrayFromStringOrDataLike(source, encoding)) ; }

// CRC-32 algorithm
export function $crc32(source: string | TSDataLike, encoding?: Nullable<StringEncoding | TSCharset>): uint32
{  return TSCrypto.crc32(_uint8ArrayFromStringOrDataLike(source, encoding)) ; }

// in this implementation we always tries $slowhash() if internal methods fails. Both calls are exception protected.
// in browser, you may prefer to directly call $slowhash()
export function $hash(buf: string | TSDataLike, method?: Nullable<HashMethod>, encoding?: Nullable<StringEncoding | TSCharset>): string | null {
    let ret = $nativeHash(buf, method, encoding) ;
    if ($ok(ret)) { return ret ; }
    try { 
        ret = $slowhash(buf, { method:method, encoding:encoding }) as string ; 
    }
    catch { 
        $logterm(`Warning: function $slowhash(buffer, { method:"${$length(method)?method:'SHA256'}" }) did fail`) ;    
        ret = null ; 
    }
    return ret;
}

export function $nativeHash(buf: string | TSDataLike, method?: Nullable<HashMethod>, encoding?: Nullable<StringEncoding | TSCharset>): string | null {
    let ret: string | null = null;
    if (_hashAvailable()) {
        // if we have an internal implementation, we use it
        try {
            const source = _uint8ArrayFromStringOrDataLike(buf, encoding);
            let hash = _createHash(method) ;
            hash.update(source) ;
            ret = hash.digest('hex');
        }
        catch {
            $logterm(`Warning: native crypto hash functions did fail for method '${$length(method)?method:'SHA256'}'`) ;    
            ret = null ;
        }
    }
    return ret ;
}

export interface $hashOptions {
    encoding?: Nullable<StringEncoding | TSCharset> ; // default charset is binary
    method?: Nullable<HashMethod> ;
    dataOutput?: Nullable<boolean>;
}

// $slowhash() is 5 to 7 times slower than node.js implementation
// which, considering, is not so bad, since node.js implementation is written in C
export function $slowhash(source: string | TSDataLike, options:$hashOptions = {}):string|Uint8Array {
    const buf = _uint8ArrayFromStringOrDataLike(source, options.encoding) ;
    const outstring = !options.dataOutput ;
    if (!$ok(options.method) || options.method === SHA256) {
        return outstring ? TSCrypto.sha256String(buf) : TSCrypto.sha256(buf) ;
    }
    else if (options.method === SHA512) {
        return outstring ? TSCrypto.sha512String(buf) : TSCrypto.sha512(buf) ;
    }
    else if (options.method === SHA1) {
        return outstring ? TSCrypto.sha1String(buf) : TSCrypto.sha1(buf) ;
    }
    else if (options.method === SHA224) {
        return outstring ? TSCrypto.sha224String(buf) : TSCrypto.sha224(buf) ;
    }
    else if (options.method === SHA384) {
        return outstring ? TSCrypto.sha384String(buf) : TSCrypto.sha384(buf) ;
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

// $random(max) returns a uniformly-distributed unsigned integer in [0, max).
// Unbiased: a raw 53-bit value is drawn and rejection-sampled so that the kept
// range is an exact multiple of `max` before the final modulo. The byte source
// is _randomBytes() (node crypto / globalThis.crypto / Math.random fallback).
export function $random(max?: Nullable<number>): uint {
    let m:number = $unsigned(max) ; if (!m) { m = UINT32_MAX ; }
    m = Math.min(m, UINT_MAX) ;
    if (m <= 1) { return 0 as uint ; }

    const SPAN = 9007199254740992 ;          // 2**53, exact as a double
    const limit = SPAN - (SPAN % m) ;        // largest exact multiple of m <= 2**53
    let v = limit ;
    for (let guard = 0 ; v >= limit && guard < 64 ; guard++) {
        const b = _randomBytes(7) ;          // 56 bits, top byte masked to 5 -> 53 bits
        v = b[0] + b[1] * 0x100 + b[2] * 0x10000 + b[3] * 0x1000000 +
            b[4] * 0x100000000 + b[5] * 0x10000000000 + (b[6] & 0x1f) * 0x1000000000000 ;
    }
    return (v % m) as uint ;
}

export function $randomBytes(length:number):Uint8Array {
    length = $tounsigned(length) ;
    return length > 0 ? _randomBytes(length!) : new Uint8Array() ;
}

export function $shuffle<T = any>(values:Nullable<ArrayLike<T>|Iterable<T>>, max?:Nullable<number>): T[] {
    const ret:Array<T> = [] ;
    if ($ok(values)) {
        const source = Array.from(values) ;
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
        slowhash: (this: string, options?:$hashOptions) => string | Uint8Array ;
    }
    export interface Uint8Array {
        crc16: (this: any) => uint16;
        crc32: (this: any) => uint32;
        hash:  (this: any, method?: Nullable<HashMethod>) => string|null ;
        slowhash: (this: any, options?:$hashOptions) => string | Uint8Array ;
    }
    export interface ArrayBuffer {
        crc16:    (this: any) => uint16;
        crc32:    (this: any) => uint32;
        hash:     (this: any, method?: Nullable<HashMethod>) => string|null;
        slowhash: (this: any, options?:$hashOptions) => string | Uint8Array ;
    }
    export interface Array<T> {
        shuffle:        (this:T[], max?:number) => T[];
    }
}

String.prototype.crc16         = function crc16(this: string, encoding?: Nullable<StringEncoding | TSCharset>): uint16 { return $crc16(this, encoding) ; }
String.prototype.crc32         = function crc32(this: string, encoding?: Nullable<StringEncoding | TSCharset>): uint32 { return $crc32(this, encoding) ; }
String.prototype.hash          = function hash(this: string, method?: Nullable<HashMethod>, encoding?: Nullable<StringEncoding | TSCharset>): string|null { return $hash(this, method, encoding) ; }
String.prototype.slowhash      = function slowhash(this: any, options?:$hashOptions): string|Uint8Array { return $slowhash(this, options) ; }

Uint8Array.prototype.crc16     = function crc16(this: any): uint16 { return TSCrypto.crc16(this) ; }
Uint8Array.prototype.crc32     = function crc32(this: any): uint32 { return TSCrypto.crc32(this) ; }
Uint8Array.prototype.hash      = function hash(this: any, method?: Nullable<HashMethod>): string|null { return $hash(this, method) ; }
Uint8Array.prototype.slowhash  = function slowhash(this: any, options?:$hashOptions): string|Uint8Array { return $slowhash(this, options) ; }

ArrayBuffer.prototype.crc16    = function crc16(this: any): uint16 { return $crc16(this) ; }
ArrayBuffer.prototype.crc32    = function crc32(this: any): uint32 { return $crc32(this) ; }
ArrayBuffer.prototype.hash     = function hash(this: any, method?: Nullable<HashMethod>): string|null { return $hash(this, method) ; }
ArrayBuffer.prototype.slowhash = function slowhash(this: any, options?:$hashOptions): string|Uint8Array { return $slowhash(this, options) ; }

/**
 * since some modules like pdfjs require to use for ... in on Array.prototype
 * we did decide to use a functional way to declare our new methods on array
 * For now we limit this modification to Array class 
 */
$declareMethod(Array, { 
    element:'shuffle', 
    implementation:function shuffle<T>(this:T[], max?:Nullable<number>): T[] { return $shuffle(this, max) ; }
}) ;

export function $sha1(source:Nullable<TSDataLike>, dataoutput?:Nullable<boolean>):string|Uint8Array {
    const buf = $ok(source) ? $uint8ArrayFromDataLike(source) : undefined ;
    return !dataoutput ? TSCrypto.sha1String(buf) : TSCrypto.sha1(buf) ;
}

export function $sha224(source:Nullable<TSDataLike>, dataoutput?:Nullable<boolean>):string|Uint8Array {
    const buf = $ok(source) ? $uint8ArrayFromDataLike(source) : undefined ;
    return !dataoutput ? TSCrypto.sha224String(buf) : TSCrypto.sha224(buf) ;
}

export function $sha256(source:Nullable<TSDataLike>, dataoutput?:Nullable<boolean>):string|Uint8Array {
    const buf = $ok(source) ? $uint8ArrayFromDataLike(source) : undefined ;
    return !dataoutput ? TSCrypto.sha256String(buf) : TSCrypto.sha256(buf) ;
}

export function $sha384(source:Nullable<TSDataLike>, dataoutput?:Nullable<boolean>):string|Uint8Array {
    const buf = $ok(source) ? $uint8ArrayFromDataLike(source) : undefined ;
    return !dataoutput ? TSCrypto.sha384String(buf) : TSCrypto.sha384(buf) ;
}

export function $sha512(source:Nullable<TSDataLike>, dataoutput?:Nullable<boolean>):string|Uint8Array {
    const buf = $ok(source) ? $uint8ArrayFromDataLike(source) : undefined ;
    return !dataoutput ? TSCrypto.sha512String(buf) : TSCrypto.sha512(buf) ;
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
    'SHA1':   'sha1'
} ;

function _uint8ArrayFromStringOrDataLike(source:string|TSDataLike, encoding: Nullable<StringEncoding | TSCharset>) {
    return $isstring(source) ?
           $charset(encoding, TSCharset.binaryCharset())!.uint8ArrayFromString(source) :
           $uint8ArrayFromDataLike(source);
}

function _algo(algo:Nullable<string>):string
{
    const a = $trim(algo).toUpperCase() ;
    return $ok(__TSEncryptKeyLength[a]) ? a : AES256 ;
}

function _randomBytes(length:number):Uint8Array {
    const providedBytes = _providerFn('randomBytes') ;
    if (providedBytes) { return providedBytes(length) ; }

    const providedGRV = _providerFn('getRandomValues') ;
    if (providedGRV) { return _fillRandom(providedGRV, length) ; }

    if (typeof randomBytes === 'function') { return randomBytes(length) ; }

    const engine = __wcENGINE() ;
    if ($ok(engine) && typeof engine.getRandomValues === 'function') {
        return _fillRandom(v => engine.getRandomValues(v), length) ;
    }

    // last-resort, non-cryptographic fallback : 
    // draw 32 bits at a time instead of calling Math.random() once per byte.
    const array = new Uint8Array(length) ;
    let i = 0 ;
    for ( ; i + 4 <= length ; i += 4) {
        const r = (Math.random() * 0x100000000) >>> 0 ;
        array[i]   = r & 0xff ;
        array[i+1] = (r >>> 8) & 0xff ;
        array[i+2] = (r >>> 16) & 0xff ;
        array[i+3] = (r >>> 24) & 0xff ;
    }
    for ( ; i < length ; i++) { array[i] = Math.floor(Math.random() * 256) ; }
    return array ;
}

// fills `length` bytes through a getRandomValues-like function, in <=64KiB
// chunks (the Web Crypto quota) so large requests do not throw. The view is
// always backed by a fresh ArrayBuffer (never SharedArrayBuffer), which is what
// Crypto.getRandomValues() now requires in its type signature.
function _fillRandom(grv:(view:Uint8Array<ArrayBuffer>) => unknown, length:number):Uint8Array {
    const array = new Uint8Array(length) ;
    for (let o = 0 ; o < length ; o += 65536) {
        grv(array.subarray(o, Math.min(o + 65536, length))) ;
    }
    return array ;
}

function _createHash(method?:Nullable<HashMethod>):TSHasher {
    const algo = $value(__TSHashMethodRef[$trim(method).toUpperCase()], 'sha256') ;
    const provided = _providerFn('createHash') ;
    return provided ? provided(algo) : createHash(algo) ;
}

function _hashAvailable():boolean
{ return $ok(_providerFn('createHash')) || typeof createHash !== 'undefined' ; }

function _createCipher(decrypt:boolean, algo:string, key:Uint8Array, iv:Uint8Array):TSCipher {
    const provided = _providerFn(decrypt ? 'createDecipheriv' : 'createCipheriv') ;
    if (provided) { return provided(algo, key, iv) ; }
    return decrypt ? createDecipheriv(algo, key, iv) : createCipheriv(algo, key, iv) ;
}

function _cipherAvailable(decrypt:boolean):boolean {
    return $ok(_providerFn(decrypt ? 'createDecipheriv' : 'createCipheriv')) ||
           typeof (decrypt ? createDecipheriv : createCipheriv) !== 'undefined' ;
}

function _charsetKeyAndAlgo(skey: string | TSDataLike, opts?: Nullable<$encryptOptions>): [TSCharset | null, Uint8Array, string] {
    const defaultCharset = TSCharset.binaryCharset() ;
    const keyCharset = $charset(opts?.keyEncoding, defaultCharset);
    const algo = _algo(opts?.algorithm) ;
    const key = $isstring(skey) ? keyCharset.uint8ArrayFromString(skey) : $uint8ArrayFromDataLike(skey) ;
    if (key.length !== __TSEncryptKeyLength[algo]) { return [null, key, __TSEncryptAlgoRef[AES256]]; }
    return [$charset(opts?.encoding, defaultCharset), key, __TSEncryptAlgoRef[algo]]
}
