var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as crypto from 'crypto';
import { createReadStream } from 'fs';
import { $length } from './commons';
import { v4 as uuidv4, v5 as uuidv5 } from 'uuid';
export function $uuid(namespace, data) {
    if ($length(namespace)) {
        if (!$length(data))
            data = '';
        return uuidv5(namespace, data);
    }
    return uuidv4();
}
export var HashMethod;
(function (HashMethod) {
    HashMethod["SHA256"] = "SHA256";
    HashMethod["SHA384"] = "SHA384";
    HashMethod["SHA512"] = "SHA512";
})(HashMethod || (HashMethod = {}));
export function $encrypt(source, key) {
    if ($length(key) !== 32 || !$length(source)) {
        return null;
    }
    let returnValue;
    try {
        let iv = crypto.randomBytes(16);
        let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
        let encrypted = cipher.update(source);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        returnValue = iv.toString('hex') + encrypted.toString('hex');
    }
    catch (e) {
        returnValue = null;
    }
    return returnValue;
}
export function $decrypt(source, key) {
    if ($length(key) !== 32 || $length(source) < 32) {
        return null;
    }
    let returnValue;
    try {
        let iv = Buffer.from(source.slice(0, 32), 'hex');
        let encryptedText = Buffer.from(source.slice(32), 'hex');
        let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        returnValue = decrypted.toString();
    }
    catch (e) {
        returnValue = null;
    }
    return returnValue;
}
export function $hash(buf, method) {
    let ret = null;
    try {
        let hash = crypto.createHash($length(method) ? method.toLowerCase() : 'sha256');
        hash.update(buf);
        ret = hash.digest('hex');
    }
    catch (e) {
        ret = null;
    }
    return ret;
}
export function $hashfile(filePath, method) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            let hash = crypto.createHash($length(method) ? method.toLowerCase() : 'sha256');
            if (!$length(filePath)) {
                return reject(null);
            }
            try {
                createReadStream(filePath).on('data', data => hash.update(data)).on('end', () => resolve(hash.digest('hex')));
            }
            catch (e) {
                return reject(null);
            }
        });
    });
}
;
// TODO a better random generator
export function $random(max) {
    return Math.floor(Math.random() * Math.floor(max));
}
export function $password(len, opts = { hasLowercase: true }) {
    const MAX_CONSECUTIVE_CHARS = 2;
    if (!opts.hasLowercase && !opts.hasNumeric && !opts.hasSpecials && !opts.hasUppercase) {
        opts.hasUppercase = true;
    }
    if (len < 3 || len > 256)
        return null;
    let base = '';
    if (opts.hasLowercase) {
        base = base + "abcdefghijklmnopqrstuvwxyz";
    }
    if (opts.hasUppercase) {
        base = base + "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    }
    if (opts.hasNumeric) {
        base = base + "0123456789";
    }
    if (opts.hasLowercase && ($random(891) % 7)) {
        base = base + "abcdefghijklmnopqrstuvwxyz";
    }
    if (opts.hasLowercase) {
        base = base + "abcdefghijklmnopqrstuvwxyz";
    }
    if (opts.hasSpecials) {
        base = base + "!#$-_&*@()+/";
    }
    if (opts.hasSpecials && ($random(1795) % 3)) {
        base = base + "-#@*!";
    }
    if (opts.hasNumeric && ($random(733) % 2)) {
        base = base + "0123456789";
    }
    if (opts.hasNumeric) {
        base = base + "0123456789";
    }
    if (opts.hasLowercase) {
        base = base + "abcdefghijklmnopqrstuvwxyz";
    }
    const charlen = base.length;
    let identicals = 0, i = 0;
    let last = '', password = '';
    while (i < len) {
        let c = base.charAt($random(charlen));
        if (c == last) {
            if (++identicals == MAX_CONSECUTIVE_CHARS) {
                identicals--;
            }
            else {
                password = password + c;
                i++;
            }
            ;
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
//# sourceMappingURL=utils_crypto.js.map