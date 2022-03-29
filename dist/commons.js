import { FoundationASCIIConversion } from "./string_tables";
import { TSDate } from "./tsdate";
import { $components, $components2string, $parsedatetime, TSDateForm } from "./tsdatecomp";
import { TSDefaults } from "./tsdefaults";
import { INT_MAX, INT_MIN, UINT_MAX, emailRegex, urlRegex, uuidRegex, Same, Ascending, Descending, Languages, Countries } from "./types";
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
export function $regexvalidatedstring(regex, s) {
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
    let cps = null;
    if ($ok(s)) {
        if (s instanceof Date) {
            cps = $components(s);
        }
        else if (s instanceof TSDate) {
            cps = s.toComponents();
        }
        else {
            cps = $parsedatetime($trim(s), TSDateForm.ISO8601);
        } // we parse the string to verify it
    }
    return $ok(cps) ? $components2string(cps, TSDateForm.ISO8601) : null;
}
// $country && $language function are permisive. Eg $language("  Fr ") will return Languages.fr 
let countriesMap;
export function $country(s) {
    if (!$ok(countriesMap)) {
        countriesMap = new Map();
        Object.keys(Countries).forEach(e => countriesMap.set(e, e));
    }
    const v = $trim(s);
    if (v.length !== 2) {
        return null;
    }
    const ret = countriesMap.get(v.toUpperCase());
    return $ok(ret) ? ret : null;
}
let languagesMap;
export function $language(s) {
    if (!$ok(languagesMap)) {
        languagesMap = new Map();
        Object.keys(Languages).forEach(e => languagesMap.set(e, e));
    }
    const v = $trim(s);
    if (v.length !== 2) {
        return null;
    }
    const ret = languagesMap.get(v.toLowerCase());
    return $ok(ret) ? ret : null;
}
export function $address(a) {
    if (!$ok(a) || !$length(a === null || a === void 0 ? void 0 : a.city)) {
        return null;
    }
    const c = $country(a === null || a === void 0 ? void 0 : a.country);
    if (!$ok(c)) {
        return null;
    }
    let ret = Object.assign({}, a);
    ret.country = c;
    return ret;
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
export function $fpad2(v) {
    return v >= 10 ? ('' + v) : ('0' + v);
}
export function $fpad3(v) {
    return v >= 100 ? ('0' + v) : (v >= 10 ? ('00' + v) : ('000' + v));
}
export function $fpad4(v) {
    return v >= 1000 ? ('' + v) : (v >= 100 ? ('0' + v) : (v >= 10 ? ('00' + v) : ('000' + v)));
}
// for now $ascii() does not mak any transliterations from
// non-latin languages like Greek
export function $ascii(source) {
    const l = $length(source);
    if (!l)
        return '';
    let s = source.replace(/≠/g, "");
    s = s.normalize("NFD").replace(/[\u0300-\u036f]|\u00a8|\u00b4/g, "").normalize("NFKD"); // does most of the job
    // finally we will try to convert (or remove) the remaining non ascii characters
    return s.replace(/[^\x00-\x7F]/g, x => FoundationASCIIConversion[x] || '');
}
export function $numcompare(a, b) {
    if (isNaN(a) || isNaN(b)) {
        return undefined;
    }
    if (a === b) {
        return Same;
    }
    return a < b ? Ascending : Descending;
}
export function $datecompare(a, b) {
    if (!$ok(a) || !$ok(b)) {
        return undefined;
    }
    if (a === b) {
        return Same;
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
    if (!$ok(a) || !$ok(b)) {
        return undefined;
    }
    if (a === b) {
        return Same;
    }
    if (typeof a === 'number' && typeof b === 'number') {
        return $numcompare(a, b);
    }
    if ($isstring(a) && $isstring(b)) {
        // before, we used Buffer.compare() to make bytes comparison
        return a > b ? Descending : (a < b ? Ascending : Same);
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
    if ((a instanceof Date || a instanceof TSDate) && (b instanceof Date || b instanceof TSDate)) {
        return $datecompare(a, b);
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
    return $isobject(a) && ('compare' in a) ? a.compare(b) : undefined;
}
export function $equal(a, b) {
    if (a === b) {
        return true;
    }
    if (typeof a === 'number' && typeof b === 'number') {
        return a === b;
    } // in order to cover NaN inequality and infinity equality
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
    if (a instanceof Date && b instanceof Date) {
        return a.getTime() === b.getTime();
    }
    if ((a instanceof Date || a instanceof TSDate) && (b instanceof Date || b instanceof TSDate)) {
        if (a instanceof Date) {
            a = new TSDate(a);
        }
        if (b instanceof Date) {
            b = new TSDate(b);
        }
        return a.isEqual(b);
    }
    if (($isobject(a) && ('isEqual' in a)) && ($isobject(b) && ('isEqual' in b))) {
        return a.isEqual(b);
    }
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
export function $arraybuffer(buf) {
    const ret = new ArrayBuffer(buf.length);
    const view = new Uint8Array(ret);
    for (let i = 0; i < buf.length; ++i) {
        view[i] = buf[i];
    }
    return ret;
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
export function $locales(lang) { return TSDefaults.defaults().locales(lang); }
//# sourceMappingURL=commons.js.map