import { INT_MAX, INT_MIN, UINT_MAX, emailRegex, urlRegex, uuidRegex } from "./types";
import { $filename } from "./utils_fs";
export function $ok(o) { return o !== null && o !== undefined && typeof o !== 'undefined'; }
export function $isstring(o) { return o !== null && o !== undefined && typeof o === 'string'; }
export function $isnumber(o) { return o !== null && o !== undefined && typeof o === 'number' && !isNaN(o) && isFinite(o); }
export function $isint(o) { return o !== null && o !== undefined && typeof o === 'number' && Number.isSafeInteger(o) && o >= INT_MIN && o <= INT_MAX; }
export function $isunsigned(o) { return o !== null && o !== undefined && typeof o === 'number' && Number.isSafeInteger(o) && o >= 0 && o <= UINT_MAX; }
export function $isbool(o) { return o !== null && o !== undefined && typeof o === 'boolean'; }
export function $isobject(o) { return o !== null && o !== undefined && typeof o === 'object'; }
export function $isarray(o) { return o !== null && o !== undefined && Array.isArray(o); }
export function $intornull(n) {
    if (!$ok(n)) {
        return null;
    }
    if (typeof n === 'string') {
        n = parseInt(n, 10);
    }
    return $isint(n) ? n : null;
}
export function $int(n, defaultValue = 0) {
    n = $intornull(n);
    return $ok(n) ? n : defaultValue;
}
function _regexValidatedType(regex, s) {
    const v = $trim(s);
    if (!v.length || !regex.test(v)) {
        return null;
    }
    return v;
}
export function $email(s) { return _regexValidatedType(emailRegex, s); }
export function $url(s) { return _regexValidatedType(urlRegex, s); }
export function $uuid(s) { return _regexValidatedType(uuidRegex, s); }
export function $unsignedornull(n) {
    if (!$ok(n)) {
        return null;
    }
    if (typeof n === 'string') {
        n = parseInt(n, 10);
    }
    return $isunsigned(n) ? n : null;
}
export function $unsigned(n, defaultValue = 0) {
    n = $unsignedornull(n);
    return $ok(n) ? n : defaultValue;
}
export function $div(a, b) { return a / b | 0; }
export function $strings(e) {
    return $ok(e) ? (typeof e === 'string' ? [e] : e) : [];
}
export function $trim(s) {
    return $length(s) ? s.replace(/^\s*(\S*(\s+\S+)*)\s*$/, "$1") : '';
}
export function $count(a) {
    return $ok(a) && Array.isArray(a) ? a.length : 0;
}
export function $length(s) {
    return $ok(s) ? s.length : 0;
}
/*
    This is a map function where callback returns as null or undefined are
    flushed from the result
 */
export function $map(a, callBack) {
    const ret = new Array();
    a === null || a === void 0 ? void 0 : a.forEach(e => {
        const v = callBack(e);
        if ($ok(v))
            ret.push(v);
    });
    return ret;
}
export function $json(v) {
    return JSON.stringify(v, null, 2);
}
export function $timeout(promise, time, exception) {
    let timer;
    return Promise.race([
        promise,
        new Promise((_, rejection) => timer = setTimeout(rejection, time, exception))
    ]).finally(() => clearTimeout(timer));
}
export function $exit(reason = '', status = 0, name) {
    if (status !== 0) {
        const processName = $length(name) ? name : `node process ${$filename(process.argv[1])}`;
        console.log('----------------------------------------------------');
        if ($length(reason)) {
            console.log(`Exiting ${processName} with status ${status} for reason:\n\t${reason}`);
        }
        else {
            console.log(`Exiting ${processName} with status ${status}`);
        }
        console.log('----------------------------------------------------');
    }
    else if ($length(reason)) {
        console.log(reason);
    }
    process.exit(status);
}
//# sourceMappingURL=commons.js.map