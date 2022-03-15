import { FoundationASCIIConversion } from "./string_tables";
import { TSDate } from "./tsdate";
import { $components2string, $parsedatetime, TSDateForm } from "./tsdatecomp";
import { TSDefaults } from "./tsdefaults";
import { INT_MAX, INT_MIN, UINT_MAX, emailRegex, urlRegex, uuidRegex, Same, Ascending, Descending } from "./types";
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
function $regexvalidatedstring(regex, s) {
    const v = $trim(s);
    if (!v.length || !regex.test(v)) {
        return null;
    }
    return v;
}
export function $email(s) { return $regexvalidatedstring(emailRegex, s); }
export function $url(s) { return $regexvalidatedstring(urlRegex, s); }
export function $uuid(s) { return $regexvalidatedstring(uuidRegex, s); }
export function $isodate(s) {
    const v = $trim(s);
    if (!v.length) {
        return null;
    }
    const cps = $parsedatetime(v, TSDateForm.ISO8601);
    return $ok(cps) ? $components2string(cps, TSDateForm.ISO8601) : null;
}
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
export function $string(v) {
    if (!$ok(v))
        return '';
    return typeof v === 'object' && 'toString' in v ? v.toString() : `${v}`;
}
export function $strings(e) {
    return $ok(e) ? (typeof e === 'string' ? [e] : e) : [];
}
export function $trim(s) {
    return $length(s) ? s.replace(/^\s*(\S*(\s+\S+)*)\s*$/, "$1") : '';
}
export function $ascii(source) {
    const l = $length(source);
    if (!l)
        return '';
    let s = source.replace(/\s/g, ' '); // replace all weird spaces to ascii space
    s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").normalize("NFKD"); // does most of the job
    // finally we will try to convert (or remove) the remaining non ascii characters
    return s.replace(/[^\x00-\x7F]/g, x => FoundationASCIIConversion[x] || '');
}
export function $numcompare(a, b) {
    if (a === b) {
        return Same;
    }
    if (isNaN(a) || isNaN(b)) {
        return undefined;
    }
    return a < b ? Ascending : Descending;
}
export function $datecompare(a, b) {
    if (a === b)
        return Same;
    if (!$ok(a) || !$ok(b)) {
        return undefined;
    }
    /* TODO: WE SHOULD BE PERMITED NOT TO CAST a or b in new TSDate() */
    if (!(a instanceof TSDate)) {
        a = new TSDate(a /* this is wrong  */);
    }
    if (!(b instanceof TSDate)) {
        b = new TSDate(b /* this is wrong  */);
    }
    return a.compare(b);
}
export function $compare(a, b) {
    if (a === b)
        return Same;
    if (!$ok(a) || !$ok(b)) {
        return undefined;
    }
    if (typeof a === 'number' && typeof b === 'number') {
        return $numcompare(a, b);
    }
    if ($isstring(a) && $isstring(b)) {
        return Buffer.compare(Buffer.from(a, 'utf-8'), Buffer.from(b, 'utf-8'));
    }
    if ($isarray(a) && $isarray(b)) {
        const na = a.length, nb = b.length;
        let i = 0;
        while (i < na && i < nb) {
            const c = $compare(a[i], b[i]);
            if (c !== Same) {
                return c;
            }
            i++;
        }
        return na === nb ? Same : (i < na ? Descending : Ascending);
    }
    if (a instanceof Date && b instanceof Date) {
        return $numcompare(a.getTime(), b.getTime());
    }
    if (a instanceof Buffer && b instanceof Buffer) {
        return Buffer.compare(a, b);
    }
    if ((a instanceof ArrayBuffer || ArrayBuffer.isView(a)) && (b instanceof ArrayBuffer || ArrayBuffer.isView(b))) {
        a = new Uint8Array(a);
        b = new Uint8Array(b);
        const na = a.length, nb = b.length;
        let i = 0;
        while (i < na && i < nb) {
            const c = $numcompare(a[i], b[i]);
            if (c !== Same) {
                return c;
            }
            i++;
        }
        return na === nb ? Same : (i < na ? Descending : Ascending);
    }
    return ('compare' in a) ? a.compare(b) : undefined;
}
export function $equal(a, b) {
    if (a === b) {
        return true;
    }
    if (typeof a === 'number' && typeof b === 'number')
        return a === b; // in order to cover NaN inequality and infinity equality
    if (!$ok(a) || !$ok(b))
        return false;
    if ($isarray(a) && $isarray(b)) {
        const n = a.length;
        if (n !== b.length)
            return false;
        for (let i = 0; i < n; i++) {
            if (!$equal(a[i], b[i]))
                return false;
        }
        return true;
    }
    if ('isEqual' in a && 'isEqual' in b)
        return a.isEqual(b);
    if (a instanceof Date && b instanceof Date)
        return a.getTime() === b.getTime();
    if (a instanceof Set && b instanceof Set) {
        return a.size === b.size && [...a.keys()].every(e => b.has(e));
    }
    if (a instanceof Map && b instanceof Map) {
        const ak = a.keys();
        const bk = b.keys();
        const keys = a.size >= b.size ? ak : bk;
        // we may have different expressed keys with undefined as value...
        // eg: MapA{a:1, b:undefined} equals MapB{a:1} since MapB.get('b') returns undefined 
        for (let k of keys) {
            if (!$equal(a.get(k), b.get(k)))
                return false;
        }
        return true;
    }
    if (a instanceof Buffer && b instanceof Buffer) {
        return Buffer.compare(a, b) === 0;
    }
    if ((a instanceof ArrayBuffer || ArrayBuffer.isView(a)) && (b instanceof ArrayBuffer || ArrayBuffer.isView(b))) {
        a = new Uint8Array(a);
        b = new Uint8Array(b);
        const n = a.length;
        if (n !== b.length)
            return false;
        for (let i = 0; i < n; i++) {
            if (a[i] !== b[i])
                return false;
        }
        return true;
    }
    if (Object.getPrototypeOf(a) === Object.prototype && Object.getPrototypeOf(b) === Object.prototype) {
        const ak = Object.getOwnPropertyNames(a);
        const bk = Object.getOwnPropertyNames(a);
        const keys = ak.length >= bk.length ? ak : bk;
        // we may have different expressed keys with undefined as value...
        // eg: {a:1, b:undefined} equals {a:1}
        for (let k of keys) {
            if (!$equal(a[k], b[k]))
                return false;
        }
        return true;
    }
    return false;
}
export function $count(a) { return $ok(a) && Array.isArray(a) ? a.length : 0; }
export function $length(s) { return $ok(s) ? s.length : 0; }
export function $lengthin(s, min = 0, max = INT_MAX) { const l = $length(s); return l >= min && l <= max; }
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
export function $jsonobj(v) {
    if (v === null || v === undefined)
        return v;
    const t = typeof v;
    switch (t) {
        case 'object':
            return 'toJSON' in v ? v.toJSON() : v;
        case 'boolean':
        case 'number':
        case 'bigint':
        case 'string':
            return v;
        default:
            return undefined;
    }
}
export function $json(v, replacer = null, space = 2) { return JSON.stringify(v, replacer, space); }
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
export function $default(key) { return TSDefaults.defaults().getValue(key); }
export function $setdefault(key, value = undefined) { return TSDefaults.defaults().setValue(key, value); }
export function $removedefault(key) { return TSDefaults.defaults().setValue(key, undefined); }
export function $translations(lang) { return TSDefaults.defaults().translations(lang); }
//# sourceMappingURL=commons.js.map