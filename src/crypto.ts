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
{  return TSCrypto.crc16(_uint8ArrayFromStringOrDataLike(source, encoding)) ; }

// CRC-32 algorithm
export function $crc32(source: string | TSDataLike, encoding?: Nullable<StringEncoding | TSCharset>): uint32
{  return TSCrypto.crc32(_uint8ArrayFromStringOrDataLike(source, encoding)) ; }

// in this implementation we always tries $slowhash() if internal methods fails. Both calls are exception protected.
// in browser, you may prefer to directly call $slowhash()
export function $hash(buf: string | TSDataLike, method?: Nullable<HashMethod>, encoding?: Nullable<StringEncoding | TSCharset>): string | null {
    let ret: string | null = null;
    if (typeof createHash !== 'undefined') {
        // if we have an internal implementation, we use it
        try {
            const source = _uint8ArrayFromStringOrDataLike(buf, encoding);
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
        ret = $slowhash(buf, { method:method, encoding:encoding }) as string ; 
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
    const buf = $ok(source) ? $uint8ArrayFromDataLike(source!) : undefined ;
    return !dataoutput ? TSCrypto.sha1String(buf) : TSCrypto.sha1(buf) ;
}

export function $sha224(source:Nullable<TSDataLike>, dataoutput?:Nullable<boolean>):string|Uint8Array {
    const buf = $ok(source) ? $uint8ArrayFromDataLike(source!) : undefined ;
    return !dataoutput ? TSCrypto.sha224String(buf) : TSCrypto.sha224(buf) ;
}

export function $sha256(source:Nullable<TSDataLike>, dataoutput?:Nullable<boolean>):string|Uint8Array {
    const buf = $ok(source) ? $uint8ArrayFromDataLike(source!) : undefined ;
    return !dataoutput ? TSCrypto.sha256String(buf) : TSCrypto.sha256(buf) ;
}

export function $sha384(source:Nullable<TSDataLike>, dataoutput?:Nullable<boolean>):string|Uint8Array {
    const buf = $ok(source) ? $uint8ArrayFromDataLike(source!) : undefined ;
    return !dataoutput ? TSCrypto.sha384String(buf) : TSCrypto.sha384(buf) ;
}

export function $sha512(source:Nullable<TSDataLike>, dataoutput?:Nullable<boolean>):string|Uint8Array {
    const buf = $ok(source) ? $uint8ArrayFromDataLike(source!) : undefined ;
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
           $charset(encoding, TSCharset.binaryCharset())!.uint8ArrayFromString(source as string) :
           $uint8ArrayFromDataLike(source as TSDataLike);
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
