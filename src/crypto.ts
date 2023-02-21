import { createReadStream } from 'fs';
import * as crypto from 'crypto';

import { Nullable, StringDictionary, StringEncoding, TSDataLike, TSDictionary, uint, uint16, uint32, UINT32_MAX, UINT_MAX, UUID, UUIDv1, uuidV1Regex, UUIDv4, uuidV4Regex, UUIDVersion } from './types';
import { $isstring, $length, $ok, $unsigned, $value } from './commons';
import { $bufferFromBytes, $bufferFromDataLike, $uint8ArrayFromDataLike } from './data';
import { $charset, TSCharset } from './tscharset';
import { TSData } from './tsdata';
import { $logterm } from './utils';
import { $ftrim, $trim } from './strings';

import { __TSCRC16ARCTable, __TSCRC32Table } from './crypto_tables';

export type  HashMethod = 'SHA256' | 'SHA384' | 'SHA512' | 'MD5' | 'SHA1' ;
export const SHA256:HashMethod = 'SHA256' ;
export const SHA384:HashMethod = 'SHA384' ;
export const SHA512:HashMethod = 'SHA512' ;
export const MD5:HashMethod    = 'MD5' ;
export const SHA1:HashMethod   = 'SHA1' ;

export type  EncryptionAlgorithm = 'AES128' | 'AES256' ;
export const AES128:EncryptionAlgorithm = 'AES128' ;
export const AES256:EncryptionAlgorithm = 'AES256' ;

/* we only generate UUID v4 */
export function $uuid(internalImplementation: boolean = false): UUID {
    if (!internalImplementation) {
        try { return <UUID>crypto.randomUUID(); }
        catch { $logterm('Warning:crypto.randomUUID() is not available') ; }    
    }
    return _generateV4UUID(true) as UUID ;
}

export function $uuidVersion(str:Nullable<string>):UUIDVersion | undefined {
    const s = $ftrim(str) ; 
    if (!s.length) { return undefined ; }
    if (uuidV4Regex.test(s)) { return UUIDv4 ; }
    if (uuidV1Regex.test(s)) { return UUIDv1 ; }
    return undefined ;
}


const __TSNoSpecificIV = Buffer.from([3,67,0,14,2,95,191,0,217,255,7,6,1,67,13,89]) ;
let __CommonInitializationVector = __TSNoSpecificIV ;

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
export function $encrypt(src: string | TSDataLike, skey: string | TSDataLike | crypto.KeyObject, opts?: Nullable<$encryptOptions>):  TSData | string | null {
    const [charset, key, algo] = _charsetKeyAndAlgo(skey, opts);
    if (!charset) { return null; }
    
    const source = $isstring(src) ? charset!.uint8ArrayFromString(src as string) : $uint8ArrayFromDataLike(src as TSDataLike);
    if (!$length(source)) { return null; }

    let returnValue = null ;
    try {
        const addIV = !opts?.noInitializationVector ;
        const iv = addIV ? crypto.randomBytes(16) : __CommonInitializationVector ;

        const cipher = crypto.createCipheriv(algo, key, iv);
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
export function $decrypt(source: string|TSDataLike, skey: string | TSDataLike | crypto.KeyObject, opts?: Nullable<$decryptOptions>): TSData | string | null {
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
        let decipher = crypto.createDecipheriv(algo, key, iv);
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

export function $hash(buf: string | TSDataLike, method?: Nullable<HashMethod>, encoding?: Nullable<StringEncoding | TSCharset>): string | null {
    let ret: string | null = null;
    try {
        const source = $isstring(buf) ?
                       $charset(encoding, TSCharset.binaryCharset())!.uint8ArrayFromString(buf as string) :
                       $uint8ArrayFromDataLike(buf as TSDataLike);
        let hash = _createHash(method) ;
        hash.update(source) ;
        ret = hash.digest('hex');
    }
    catch (e) { ret = null; }
    return ret;
}

export async function $hashfile(filePath: Nullable<string>, method?: Nullable<HashMethod>): Promise<string | null> {
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
{ return _uuidHash(await $hashfile(filePath, MD5), version) ; }

// default random range is [0,UINT32_MAX]
export function $random(max?: Nullable<number>): uint 
{
    let m = $unsigned(max) ; if (!m) { m = UINT32_MAX ; } 
    return crypto.randomInt(Math.min(m, UINT_MAX)) as uint ; 
}

export interface $passwordOptions {
    hasLowercase?: boolean,
    hasUppercase?: boolean,
    hasNumeric?: boolean,
    hasSpecials?: boolean
};

export function $password(len: number, opts: $passwordOptions = { hasLowercase: true }): string | null {
    const MAX_CONSECUTIVE_CHARS = 2;
    const rand = crypto.randomInt ; 
    if (!opts.hasLowercase && !opts.hasNumeric && !opts.hasSpecials && !opts.hasUppercase) {
        opts.hasUppercase = true;
    }
    if (len < 3 || len > 256) return null;

    let base = '';
    if (opts.hasLowercase) { base = base + "abcdefghijklmnopqrstuvwxyz"; }
    if (opts.hasUppercase) { base = base + "ABCDEFGHIJKLMNOPQRSTUVWXYZ"; }
    if (opts.hasNumeric) { base = base + "0123456789"; }
    if (opts.hasLowercase && (rand(891) % 7)) { base = base + "abcdefghijklmnopqrstuvwxyz"; }
    if (opts.hasLowercase) { base = base + "abcdefghijklmnopqrstuvwxyz"; }
    if (opts.hasSpecials) { base = base + "!#$-_&*@()+/"; }
    if (opts.hasSpecials && (rand(1795) % 3)) { base = base + "-#@*!"; }
    if (opts.hasNumeric && (rand(733) % 2)) { base = base + "0123456789"; }
    if (opts.hasNumeric) { base = base + "0123456789"; }
    if (opts.hasLowercase) { base = base + "abcdefghijklmnopqrstuvwxyz"; }
    const charlen = base.length;
    let identicals = 0, i = 0;
    let last = '', password = '';

    while (i < len) {
        let c = base.charAt(rand(charlen));
        if (c == last) {
            if (++identicals == MAX_CONSECUTIVE_CHARS) { identicals--; }
            else {
                password = password + c;
                i++
            };
        }
        else {
            last = c;
            identicals = 0;
            password = password + c;
            i++;
        }
    }
    return password;
}

declare global {
    export interface Uint8Array {
        crc16: (this: any) => uint16;
        crc32: (this: any) => uint32;
        hash:  (this: any, method?: Nullable<HashMethod>) => string|null;
        uuidhash: (this: any, version?:Nullable<UUIDVersion>) => string|null;
    }
    export interface ArrayBuffer {
        crc16:    (this: any) => uint16;
        crc32:    (this: any) => uint32;
        hash:     (this: any, method?: Nullable<HashMethod>) => string|null;
        uuidhash: (this: any, version?:Nullable<UUIDVersion>) => string|null;
    }
}

Uint8Array.prototype.crc16     = function crc16(this: any): uint16 { return $crc16(this) ; }
Uint8Array.prototype.crc32     = function crc32(this: any): uint32 { return $crc32(this) ; }
Uint8Array.prototype.hash      = function hash(this: any, method?: Nullable<HashMethod>): string|null { return $hash(this, method) ; }
Uint8Array.prototype.uuidhash  = function uuidhash(this: any, version?:Nullable<UUIDVersion>): string|null { return $uuidhash(this, version) ; }
ArrayBuffer.prototype.crc16    = function crc16(this: any): uint16 { return $crc16(this) ; }
ArrayBuffer.prototype.crc32    = function crc32(this: any): uint32 { return $crc32(this) ; }
ArrayBuffer.prototype.hash     = function hash(this: any, method?: Nullable<HashMethod>): string|null { return $hash(this, method) ; }
ArrayBuffer.prototype.uuidhash = function uuidhash(this: any, version?:Nullable<UUIDVersion>): string|null { return $uuidhash(this, version) ; }

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

function _algo(algo:Nullable<string>):string
{
    const a = $trim(algo).toUpperCase() ;
    return $ok(__TSEncryptKeyLength[a]) ? a : AES256 ;
}

function _createHash(method?:Nullable<HashMethod>):crypto.Hash
{ return crypto.createHash($value(__TSHashMethodRef[$trim(method).toUpperCase()], 'sha256')) ; }

function _charsetKeyAndAlgo(skey: string | TSDataLike | crypto.KeyObject, opts?: Nullable<$encryptOptions>): [TSCharset | null, crypto.KeyObject | Uint8Array, string] {
    const defaultCharset = TSCharset.binaryCharset() ;
    const keyCharset = $charset(opts?.keyEncoding, defaultCharset);
    const algo = _algo(opts?.algorithm) ;
    const isKeyObject = skey instanceof crypto.KeyObject;
    let key = isKeyObject ?
        skey as crypto.KeyObject :
        ($isstring(skey) ?
            keyCharset.uint8ArrayFromString(skey as string) :
            $uint8ArrayFromDataLike(skey as TSDataLike)
        );
    if (!isKeyObject && (key as Uint8Array).length !== __TSEncryptKeyLength[algo]) { return [null, key, __TSEncryptAlgoRef[AES256]]; }
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

function _generateV4UUID(convertToLowerCase:boolean):string {
    let uuid = "";
    for (let i = 0; i < 32; i++) {
        if (i === 12) { uuid += '-4' ; }
        else {
            if (i === 8 || i === 16 || i === 20) { uuid += '-' ; }
            const rand = crypto.randomInt(16) | 0 ;
            uuid += (i == 16 ? (rand & 3 | 8) : rand).toHex1(convertToLowerCase) ; 
        }
    }
    return uuid ;
}
