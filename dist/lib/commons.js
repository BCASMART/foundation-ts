"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.$exit = exports.$timeout = exports.$json = exports.$map = exports.$length = exports.$count = exports.$trim = exports.$strings = exports.$div = exports.$unsigned = exports.$unsignedornull = exports.$uuid = exports.$url = exports.$email = exports.$int = exports.$intornull = exports.$isarray = exports.$isobject = exports.$isbool = exports.$isunsigned = exports.$isint = exports.$isnumber = exports.$isstring = exports.$ok = void 0;
var types_1 = require("./types");
var utils_fs_1 = require("./utils_fs");
function $ok(o) { return o !== null && o !== undefined && typeof o !== 'undefined'; }
exports.$ok = $ok;
function $isstring(o) { return o !== null && o !== undefined && typeof o === 'string'; }
exports.$isstring = $isstring;
function $isnumber(o) { return o !== null && o !== undefined && typeof o === 'number' && !isNaN(o) && isFinite(o); }
exports.$isnumber = $isnumber;
function $isint(o) { return o !== null && o !== undefined && typeof o === 'number' && Number.isSafeInteger(o) && o >= types_1.INT_MIN && o <= types_1.INT_MAX; }
exports.$isint = $isint;
function $isunsigned(o) { return o !== null && o !== undefined && typeof o === 'number' && Number.isSafeInteger(o) && o >= 0 && o <= types_1.UINT_MAX; }
exports.$isunsigned = $isunsigned;
function $isbool(o) { return o !== null && o !== undefined && typeof o === 'boolean'; }
exports.$isbool = $isbool;
function $isobject(o) { return o !== null && o !== undefined && typeof o === 'object'; }
exports.$isobject = $isobject;
function $isarray(o) { return o !== null && o !== undefined && Array.isArray(o); }
exports.$isarray = $isarray;
function $intornull(n) {
    if (!$ok(n)) {
        return null;
    }
    if (typeof n === 'string') {
        n = parseInt(n, 10);
    }
    return $isint(n) ? n : null;
}
exports.$intornull = $intornull;
function $int(n, defaultValue) {
    if (defaultValue === void 0) {
        defaultValue = 0;
    }
    n = $intornull(n);
    return $ok(n) ? n : defaultValue;
}
exports.$int = $int;
function _regexValidatedType(regex, s) {
    var v = $trim(s);
    if (!v.length || !regex.test(v)) {
        return null;
    }
    return v;
}
function $email(s) { return _regexValidatedType(types_1.emailRegex, s); }
exports.$email = $email;
function $url(s) { return _regexValidatedType(types_1.urlRegex, s); }
exports.$url = $url;
function $uuid(s) { return _regexValidatedType(types_1.uuidRegex, s); }
exports.$uuid = $uuid;
function $unsignedornull(n) {
    if (!$ok(n)) {
        return null;
    }
    if (typeof n === 'string') {
        n = parseInt(n, 10);
    }
    return $isunsigned(n) ? n : null;
}
exports.$unsignedornull = $unsignedornull;
function $unsigned(n, defaultValue) {
    if (defaultValue === void 0) {
        defaultValue = 0;
    }
    n = $unsignedornull(n);
    return $ok(n) ? n : defaultValue;
}
exports.$unsigned = $unsigned;
function $div(a, b) { return a / b | 0; }
exports.$div = $div;
function $strings(e) {
    return $ok(e) ? (typeof e === 'string' ? [e] : e) : [];
}
exports.$strings = $strings;
function $trim(s) {
    return $length(s) ? s.replace(/^\s*(\S*(\s+\S+)*)\s*$/, "$1") : '';
}
exports.$trim = $trim;
function $count(a) {
    return $ok(a) && Array.isArray(a) ? a.length : 0;
}
exports.$count = $count;
function $length(s) {
    return $ok(s) ? s.length : 0;
}
exports.$length = $length;
/*
    This is a map function where callback returns as null or undefined are
    flushed from the result
 */
function $map(a, callBack) {
    var ret = new Array();
    a === null || a === void 0 ? void 0 : a.forEach(function (e) {
        var v = callBack(e);
        if ($ok(v))
            ret.push(v);
    });
    return ret;
}
exports.$map = $map;
function $json(v) {
    return JSON.stringify(v, null, 2);
}
exports.$json = $json;
function $timeout(promise, time, exception) {
    var timer;
    return Promise.race([
        promise,
        new Promise(function (_, rejection) { return timer = setTimeout(rejection, time, exception); })
    ]).finally(function () { return clearTimeout(timer); });
}
exports.$timeout = $timeout;
function $exit(reason, status, name) {
    if (reason === void 0) {
        reason = '';
    }
    if (status === void 0) {
        status = 0;
    }
    if (status !== 0) {
        var processName = $length(name) ? name : "node process " + utils_fs_1.$filename(process.argv[1]);
        console.log('----------------------------------------------------');
        if ($length(reason)) {
            console.log("Exiting " + processName + " with status " + status + " for reason:\n\t" + reason);
        }
        else {
            console.log("Exiting " + processName + " with status " + status);
        }
        console.log('----------------------------------------------------');
    }
    else if ($length(reason)) {
        console.log(reason);
    }
    process.exit(status);
}
exports.$exit = $exit;
//# sourceMappingURL=commons.js.map