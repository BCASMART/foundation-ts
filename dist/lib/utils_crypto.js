"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try {
            step(generator.next(value));
        }
        catch (e) {
            reject(e);
        } }
        function rejected(value) { try {
            step(generator["throw"](value));
        }
        catch (e) {
            reject(e);
        } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function () { if (t[0] & 1)
            throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function () { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f)
            throw new TypeError("Generator is already executing.");
        while (_)
            try {
                if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done)
                    return t;
                if (y = 0, t)
                    op = [op[0] & 2, t.value];
                switch (op[0]) {
                    case 0:
                    case 1:
                        t = op;
                        break;
                    case 4:
                        _.label++;
                        return { value: op[1], done: false };
                    case 5:
                        _.label++;
                        y = op[1];
                        op = [0];
                        continue;
                    case 7:
                        op = _.ops.pop();
                        _.trys.pop();
                        continue;
                    default:
                        if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                            _ = 0;
                            continue;
                        }
                        if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                            _.label = op[1];
                            break;
                        }
                        if (op[0] === 6 && _.label < t[1]) {
                            _.label = t[1];
                            t = op;
                            break;
                        }
                        if (t && _.label < t[2]) {
                            _.label = t[2];
                            _.ops.push(op);
                            break;
                        }
                        if (t[2])
                            _.ops.pop();
                        _.trys.pop();
                        continue;
                }
                op = body.call(thisArg, _);
            }
            catch (e) {
                op = [6, e];
                y = 0;
            }
            finally {
                f = t = 0;
            }
        if (op[0] & 5)
            throw op[1];
        return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.$password = exports.$random = exports.$hashfile = exports.$hash = exports.$decrypt = exports.$encrypt = exports.HashMethod = exports.$uuid = void 0;
var crypto = require("crypto");
var fs_1 = require("fs");
var commons_1 = require("./src/commons");
var uuid_1 = require("uuid");
function $uuid(namespace, data) {
    if (commons_1.$length(namespace)) {
        if (!commons_1.$length(data))
            data = '';
        return uuid_1.v5(namespace, data);
    }
    return uuid_1.v4();
}
exports.$uuid = $uuid;
var HashMethod;
(function (HashMethod) {
    HashMethod["SHA256"] = "SHA256";
    HashMethod["SHA384"] = "SHA384";
    HashMethod["SHA512"] = "SHA512";
})(HashMethod = exports.HashMethod || (exports.HashMethod = {}));
function $encrypt(source, key) {
    if (commons_1.$length(key) !== 32 || !commons_1.$length(source)) {
        return null;
    }
    var returnValue;
    try {
        var iv = crypto.randomBytes(16);
        var cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
        var encrypted = cipher.update(source);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        returnValue = iv.toString('hex') + encrypted.toString('hex');
    }
    catch (e) {
        returnValue = null;
    }
    return returnValue;
}
exports.$encrypt = $encrypt;
function $decrypt(source, key) {
    if (commons_1.$length(key) !== 32 || commons_1.$length(source) < 32) {
        return null;
    }
    var returnValue;
    try {
        var iv = Buffer.from(source.slice(0, 32), 'hex');
        var encryptedText = Buffer.from(source.slice(32), 'hex');
        var decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);
        var decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        returnValue = decrypted.toString();
    }
    catch (e) {
        returnValue = null;
    }
    return returnValue;
}
exports.$decrypt = $decrypt;
function $hash(buf, method) {
    var hash = crypto.createHash(commons_1.$length(method) ? method.toLowerCase() : 'sha256');
    hash.update(buf);
    return hash.digest('hex');
}
exports.$hash = $hash;
function $hashfile(filePath, method) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    var hash = crypto.createHash(commons_1.$length(method) ? method.toLowerCase() : 'sha256');
                    if (!commons_1.$length(filePath)) {
                        return reject(null);
                    }
                    try {
                        fs_1.createReadStream(filePath).on('data', function (data) { return hash.update(data); }).on('end', function () { return resolve(hash.digest('hex')); });
                    }
                    catch (e) {
                        return reject(null);
                    }
                })];
        });
    });
}
exports.$hashfile = $hashfile;
;
// TODO a better random generator
function $random(max) {
    return Math.floor(Math.random() * Math.floor(max));
}
exports.$random = $random;
function $password(len, opts) {
    if (opts === void 0) {
        opts = { hasLowercase: true };
    }
    var MAX_CONSECUTIVE_CHARS = 2;
    if (!opts.hasLowercase && !opts.hasNumeric && !opts.hasSpecials && !opts.hasUppercase) {
        opts.hasUppercase = true;
    }
    if (len < 3 || len > 256)
        return null;
    var base = '';
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
    var charlen = base.length;
    var identicals = 0, i = 0;
    var last = '', password = '';
    while (i < len) {
        var c = base.charAt($random(charlen));
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
exports.$password = $password;
//# sourceMappingURL=utils_crypto.js.map