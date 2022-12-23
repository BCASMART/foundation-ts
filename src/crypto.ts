import * as crypto from 'crypto';
import { createReadStream } from 'fs';
import { $isstring, $length } from './commons';
import { $uint8ArrayFromDataLike } from './data';
import { $charset, TSCharset } from './tscharset';
import { TSData } from './tsdata';
import { Nullable, StringEncoding, TSDataLike, uint32, UUID } from './types';
import { $logterm } from './utils';

export function $uuid(): UUID {
    try { return <UUID>crypto.randomUUID(); }
    catch {
        $logterm('Warning:crypto.randomUUID() is not available');
        let uuid = "";
        for (let i = 0; i < 32; i++) {
            const rand = Math.random() * 16 | 0;
            if (i == 8 || i == 12 || i == 16 || i == 20) { uuid += '-'; }
            uuid += (i == 12 ? 4 : (i == 16 ? (rand & 3 | 8) : rand)).toString(16);
        }
        return uuid as UUID;
    }
}

export enum HashMethod {
    SHA256 = 'SHA256',
    SHA384 = 'SHA384',
    SHA512 = 'SHA512'
}

export interface $encryptOptions {
    encoding?: Nullable<StringEncoding | TSCharset>; // default charset is binary
}

export function $encrypt(ssource: string | TSDataLike, skey: string | TSDataLike | crypto.KeyObject, opts?: Nullable<$encryptOptions>): string | null {
    const [charset, key] = _charsetAndKey(skey, opts);
    if (!charset) { return null; }
    const source = $isstring(ssource) ? charset!.uint8ArrayFromString(ssource as string) : $uint8ArrayFromDataLike(ssource as TSDataLike);
    if (!$length(source)) { return null; }

    let returnValue;
    try {
        let iv = crypto.randomBytes(16);
        let cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
        let encrypted = cipher.update(source);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        returnValue = iv.toString('hex') + encrypted.toString('hex');
    }
    catch (e) {
        returnValue = null;
    }
    return returnValue;
}

export interface $decryptOptions extends $encryptOptions {
    dataOutput?: Nullable<boolean>;
}

const __crcTable = (function __buildCRCTable() {
    var ret:number[] = [] ;
    for (let n = 0 ; n < 256 ; n++) {
        let crc = n ;
        for (let i = 0 ; i < 8 ; i++) {
            crc = ((crc & 1) ? (0xedb88320 ^ (crc >>> 1)) : (crc >>> 1)) ;
        }
        ret[n] = crc ;
    }
    return ret;
})();

export function $crc32(ssource: string | TSDataLike, encoding?: Nullable<StringEncoding | TSCharset>): uint32 {
    const source = $isstring(ssource) ?
        $charset(encoding, TSCharset.binaryCharset())!.uint8ArrayFromString(ssource as string) :
        $uint8ArrayFromDataLike(ssource as TSDataLike);
    let crc = 0 ^ -1;
    const len = source.length;
    for (let i = 0; i < len; i++) {
        crc = ((crc >> 8) & 0x00ffffff) ^ __crcTable[(crc ^ source[i]) & 0xff];
    }
    return (crc ^ -1) >>> 0 as uint32;
}

// default returned value is a string to be conform to "standard" encrypt/decryp functions
export function $decrypt(source: string, skey: string | TSDataLike | crypto.KeyObject, opts?: Nullable<$decryptOptions>): TSData | string | null {
    if (!$length(source)) { return null; }
    const [charset, key] = _charsetAndKey(skey, opts);
    if (!charset) { return null; }

    let returnValue;
    try {
        let iv = Buffer.from(source.slice(0, 32), 'hex');
        let encryptedText = Buffer.from(source.slice(32), 'hex');
        let decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        let decrypted = new TSData(decipher.update(encryptedText));
        decrypted.appendBytes(decipher.final());
        returnValue = !opts?.dataOutput ? decrypted.toString(charset) : decrypted;
    }
    catch (e) {
        returnValue = null;
    }
    return returnValue;
}

function _charsetAndKey(skey: string | TSDataLike | crypto.KeyObject, opts?: Nullable<$encryptOptions>): [TSCharset | null, crypto.KeyObject | Uint8Array] {
    const charset = $charset(opts?.encoding, TSCharset.binaryCharset());
    const isKeyObject = skey instanceof crypto.KeyObject;
    let key = isKeyObject ?
        skey as crypto.KeyObject :
        ($isstring(skey) ?
            charset.uint8ArrayFromString(skey as string) :
            $uint8ArrayFromDataLike(skey as TSDataLike)
        );
    if (!isKeyObject && (key as Uint8Array).length !== 32) { return [null, key]; }
    return [charset, key]
}

export function $hash(buf: string | TSDataLike, method?: Nullable<HashMethod>, encoding?: Nullable<StringEncoding | TSCharset>): string | null {
    let ret: string | null = null;
    try {
        const source = $isstring(buf) ?
                       $charset(encoding, TSCharset.binaryCharset())!.uint8ArrayFromString(buf as string) :
                       $uint8ArrayFromDataLike(buf as TSDataLike);

        let hash = crypto.createHash($length(method) ? (method as HashMethod).toLowerCase() : 'sha256');
        hash.update(source) ;
        ret = hash.digest('hex');
    }
    catch (e) { ret = null; }
    return ret;
}

export async function $hashfile(filePath: Nullable<string>, method?: HashMethod): Promise<string | null> {
    return new Promise((resolve, reject) => {
        let hash = crypto.createHash($length(method) ? (<string>method).toLowerCase() : 'sha256');
        if (!$length(filePath)) { return reject(null); }
        try {
            createReadStream(<string>filePath).on('data', data => hash.update(data)).on('end', () => resolve(hash.digest('hex')));
        }
        catch (e) { return reject(null); }
    });
}

interface PasswordOptions {
    hasLowercase?: boolean,
    hasUppercase?: boolean,
    hasNumeric?: boolean,
    hasSpecials?: boolean
};

// TODO: a better random generator
export function $random(max: number): number {
    return Math.floor(Math.random() * Math.floor(max));
}

export function $password(len: number, opts: PasswordOptions = { hasLowercase: true }): string | null {
    const MAX_CONSECUTIVE_CHARS = 2;

    if (!opts.hasLowercase && !opts.hasNumeric && !opts.hasSpecials && !opts.hasUppercase) {
        opts.hasUppercase = true;
    }
    if (len < 3 || len > 256) return null;

    let base = '';
    if (opts.hasLowercase) { base = base + "abcdefghijklmnopqrstuvwxyz"; }
    if (opts.hasUppercase) { base = base + "ABCDEFGHIJKLMNOPQRSTUVWXYZ"; }
    if (opts.hasNumeric) { base = base + "0123456789"; }
    if (opts.hasLowercase && ($random(891) % 7)) { base = base + "abcdefghijklmnopqrstuvwxyz"; }
    if (opts.hasLowercase) { base = base + "abcdefghijklmnopqrstuvwxyz"; }
    if (opts.hasSpecials) { base = base + "!#$-_&*@()+/"; }
    if (opts.hasSpecials && ($random(1795) % 3)) { base = base + "-#@*!"; }
    if (opts.hasNumeric && ($random(733) % 2)) { base = base + "0123456789"; }
    if (opts.hasNumeric) { base = base + "0123456789"; }
    if (opts.hasLowercase) { base = base + "abcdefghijklmnopqrstuvwxyz"; }
    const charlen = base.length;
    let identicals = 0, i = 0;
    let last = '', password = '';

    while (i < len) {
        let c = base.charAt($random(charlen));
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
        crc32: (this: any) => uint32;
    }
    export interface ArrayBuffer {
        crc32: (this: any) => uint32;
    }
}

Uint8Array.prototype.crc32  = function crc32(this: any): uint32 { return $crc32(this) ; }
ArrayBuffer.prototype.crc32 = function crc32(this: any): uint32 { return $crc32(this) ; }
