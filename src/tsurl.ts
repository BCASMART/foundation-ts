import { Ascending, Comparison, Descending, Nullable, Same, url } from "./types";
import { $defined, $isipv4, $isipv6, $isstring, $ok, $value } from "./commons";
import { $ftrim } from "./strings";
import { TSError } from "./tserrors";
import { TSClone, TSObject } from "./tsobject";

/**
 * Since this class is inpired from the node-url package by defunctzombie
 * (https://github.com/defunctzombie/node-url.git),
 * here is the copyright notice included in the url.js original file :
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to permit
 * persons to whom the Software is furnished to do so, subject to the
 * following conditions:
 *
 * The above copyright notice and this permission notice shall be included
 * in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
 * NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
 * USE OR OTHER DEALINGS IN THE SOFTWARE.
 * 
 * 
 * For now, TSURL class:
 * - does not handle non ASCII domains (no use of punycode).
 * - it calculates href and searchParams only if needed
 * - makes hostname validation
 * - does not provide user and password
 */
export interface TSURLParseOptions {
    acceptedProtocols?:string[] | null ;
    refusesParameters?:boolean | null ;
    throwsError?:boolean | null ;
}

export class TSURL implements TSObject, TSClone<TSURL> {
    public static readonly HostMaxLength = 255 ;
    public static readonly AutoEscapeChars = ['{', '}', '|', '\\', '^', '`', "'", '<', '>', '"', '`', ' ', '\r', '\n', '\t'] ;
    public static readonly StandardURLProtocols = new Set(['http:', 'https:', 'file:', 'ftp:', 'ws:', 'wss:']) ;
    public static readonly AutoEscapeCharSet = new Set(TSURL.AutoEscapeChars) ;
    public static readonly EndhostCharSet = new Set(['%', '/', '?', ';', '#', ...TSURL.AutoEscapeChars]) ;

    private readonly _auth:string ;
    private readonly _hash:string ;
    private readonly _hostname:string ;
    private _pathname:string ;
    private _port:string ;
    private _protocol: string ;
    private readonly _search:string ;
    private _w3cProtocol:boolean ;
    private readonly _ipv6:boolean ;
    private readonly _acceptedProtocols:string[] ;

    private _searchParams:URLSearchParams|undefined = undefined ; // calculated only if needed
    private _href:url | undefined = undefined ; // idem

    public static from(source:URL, options?:Nullable<TSURLParseOptions>):TSURL | null {
        if (!$ok(options)) {
            options = {} ;
            const protocol = source.protocol.toLowerCase() ;
            const w3c = TSURL.StandardURLProtocols.has(source.protocol.toLowerCase()) ;
            if (!w3c && protocol.length) { options.acceptedProtocols = [protocol] ; }
            if (!source.search.length) { options.refusesParameters = true ; }
        }
        return TSURL.url(source.href, options!)
    }

    // the path is always a path of the origin: an absolute URL ('https://host/x') or a path starting with '//'
    // (another host for new URL()) is refused, and so is an origin with a query string or a fragment (the
    // path would be written after them). They used to give an absurd URL (eg. 'http://localhost/https://host/x')
    public static compose(origin:Nullable<string>, path:string, options?:Nullable<TSURLParseOptions>):TSURL|null {
        const opts = $value(options, {}) ;
        let o = $ftrim(origin) ;
        let p = $ftrim(path) ;
        if (__absoluteURLRegex.test(p) || p.startsWith('//')) { return _urlError(opts, `TSURL.compose(): '${p}' is not a path`) ; }
        if (!o.length) { o = 'http://localhost/' ; }
        else if (o.includes('?') || o.includes('#')) { return _urlError(opts, `TSURL.compose(): origin '${o}' has a query string or a fragment`) ; }
        if (!o.endsWith('/')) { o += '/' ; }
        if (p.startsWith('/')) { p = p.slice(1) ; }
        return this.url(o+p, options) ;
    }

    public static url(source:Nullable<string>, options?:Nullable<TSURLParseOptions>):TSURL|null {
        const opts = $value(options, {}) ;
        const url = _normalizeURLString(source) ;
        const [protocol, w3c, aps] = _validateProtocolInfo(_findProtocol(url), opts.acceptedProtocols) ;
        const p = protocol.length ;
        if (!p) { return _urlError(opts, `TSURL: bad protocol in '${url}'`) ; }
        if (url[p] !== '/' || url[p+1] !== '/') { return _urlError(opts, `TSURL: unable to find // before hostname in url '${url}'`) ; }

        const [auth, hostStart] = _parseAuth(url, p + 2) ;
        let hostEnd = hostStart ;
        while (hostEnd < url.length && !TSURL.EndhostCharSet.has(url[hostEnd])) { hostEnd++ ; }
        const host = _parseHost(url.slice(hostStart, hostEnd)) ;
        if ($isstring(host)) { return _urlError(opts, `TSURL: ${host} in url '${url}'`) ; }

        const [rawPath, rawSearch, rawHash] = _splitPath(host.path + url.slice(hostEnd)) ;
        // each part is escaped with its own set of characters, like the native URL class does
        const path = _escapedURLPart(rawPath, __pathEscapes) ;
        const search = _escapedURLPart(rawSearch, w3c ? __specialQueryEscapes : __queryEscapes) ;
        const hash = _escapedURLPart(rawHash, __fragmentEscapes) ;
        if (search.length > 0 && !!opts.refusesParameters) { return _urlError(opts, `TSURL: unexpected parameters in url '${url}'`) ; }

        return new TSURL(protocol, host.hostname, host.port, path, hash, auth, search, host.ipv6, w3c, aps) ;
    }
    
    private constructor (protocol:string, // NOSONAR: private, only called by from() and clone() with already parsed parts
                         hostname:string, 
                         port:string, 
                         pathname:string, 
                         hash:string, 
                         auth:string, 
                         search:string, 
                         ipv6:boolean, 
                         w3c:boolean, 
                         protocols:string[]) {
        this._auth = auth ;
        this._hash = hash ;
        this._hostname = hostname ;
        this._pathname = pathname ;
        this._port = port ;
        this._protocol = protocol ;
        this._search = search ;
        this._w3cProtocol = w3c ;
        this._ipv6 = ipv6 ;
        this._acceptedProtocols = protocols ;
    }

    public get href():url { 
        if (!$defined(this._href)) { this._href = this._calculated_href() ; }
        return this._href ; 
    }

    /**
     * The href as a readable UTF-8 string, for display purposes: the percent-encoded UTF-8 
     * non-ASCII characters are decoded and an internationalized hostname is given in Unicode.
     * The percent-encoded ASCII characters (like %20, %2F, %3F or %23), the invalid sequences 
     * and the invisible or bidirectional characters (like browsers do) stay encoded, so the 
     * result is not ambiguous. Use href to send the url.
     */
    public get utf8Href():string {
        const [auth, tail] = this._hrefParts() ;
        let host = this._ipv6 ? '['+this._hostname+']' : _unicodeHostname(this._hostname) ;
        if (this._port.length) { host += ':' + this._port ; }
        return this._protocol + '//' + _utf8Decoded(auth) + host + _utf8Decoded(tail) ;
    }

    public get w3c():boolean { return this._w3cProtocol ; }

    public get origin():string { return this._protocol + '//' + this.host ; }
    
    public get host():string { 
        let ret = this._ipv6 ? '['+this._hostname+']' : this._hostname ;
        if (this._port.length) { ret += ':' ; ret += this._port ; }
        return ret ; 
    }

    public get searchParams() {
        if (!$defined(this._searchParams)) { 
            this._searchParams = new URLSearchParams(this.search) ;
        }
        return this._searchParams ;
    }

    public get auth():string { return this._auth ; }

    public get hash():string { return this._hash ; }

    public get search():string { return this._search ; }

    public get pathname():string { return this._pathname ; }
    public set pathname(s:string) {
        // '?' and '#' end a path (they start the search and the hash parts), so they are
        // escaped here, as the native URL class does, in order to keep a consistent href
        let path = _escapedURLPart(s, __pathSetterEscapes) ;
        if (!path.startsWith('/')) { path = '/' + path ; }   // also gives '/' for an empty path
        this._pathname = path ;
        this._href = undefined ;
    }

    public get hostname():string { return this._hostname ; }

    public get port():string { return this._port ; }
    public set port(p:string) { this._port = p ; this._href = undefined ; }
    
    public get protocol():string { return this._protocol ; }
    public set protocol(s:string) { 
        const [protocol, w3c,] = _validateProtocolInfo(s, this._acceptedProtocols) ;
        if (!protocol.length) { TSError.throw(`TSURL.protocol = value. Impossible to set new protocol '${s}'.`) ; }
        this._w3cProtocol = w3c ;
        this._protocol = protocol ;
        this._href = undefined ;
    }

    public [Symbol.toPrimitive](hint: "number" | "string" | "default") {
        return hint === 'number' ? Number.NaN : this.href ;
    }

    // ============ TSObject conformance ==================
    public isEqual(other:any):boolean {
        return this === other || (other instanceof TSURL && this.href === other.href) ;
    }

    public compare(other:any):Comparison {
        if (other === this) { return Same ; }
        if (!(other instanceof TSURL)) { return undefined ; }
        if (this.href === other.href) { return Same ; }
        return this.href < other.href ? Ascending : Descending ;
    }

    public toString():string { return this.href ; }
    toJSON = TSURL.prototype.toString ;
    public toArray():TSURL[] { return [this] ; }

    // =============== TSClone protocol ====================
    public clone(): TSURL {
        return new TSURL(this._protocol, this._hostname, this._port, this._pathname, this._hash, this._auth, this._search, this._ipv6, this._w3cProtocol, this._acceptedProtocols) ;
    }

    // ============ private methods ==================
    private _calculated_href():url {
        const [auth, tail] = this._hrefParts() ;
        return (this._protocol + '//' + auth + this.host + tail) as url ; 
    }

    // the encoded auth part (with its '@') and the path, search and hash part of the href
    private _hrefParts():[string, string] {
        let auth = this._auth ;
        if (auth.length) {
            auth = encodeURIComponent(auth) ;
            auth = auth.replace(/%3A/i, ':');
            auth += '@';
        }

        let hash = this._hash ; 
        if (hash.length && !hash.startsWith('#')) { hash = '#' + hash ; }
        
        let search = this._search ;
        if (search.length) {
            search = search.replaceAll('#', '%23');
            if (!search.startsWith('?')) { search = '?' + search; }
        }
        let pathname = this._pathname ;
        if (!pathname.startsWith('/')) { pathname = '/' + pathname ; }
        return [auth, pathname + search + hash] ;
    }

}

// ====================== private constants and functions ===============================

const __protocolRegex = /^([a-z0-9.+-]+:)/i ;
const __protocolCompleteRegex = /^([a-z0-9.+-]+:)$/i ;
const __portRegex = /:\d*$/ ;
const __mayBeIPV4Regex = /^\d+\.\d+\.\d+\.\d+$/ ;
const __hostnamePartRegex = /^[+a-z0-9A-Z_-]{0,63}$/ ;
const __hostnamePartStartRegex = /^([+a-z0-9A-Z_-]{0,63})(.*)$/ ;
const __nonASCIIRegex = /[^\x00-\x7F]/ ;
function _checkPotentialIPV4HostName(hostname:string):boolean {
    return !__mayBeIPV4Regex.test(hostname) || $isipv4(hostname) ;
}

// Like the native URL class does, the tabs and new lines are removed, and the backslashes are 
// replaced by slashes before the search and the hash, for the standard protocols only. 
// (the backslashes of the search used to be also replaced when there was no hash)
function _normalizeURLString(source:Nullable<string>):string {
    let s = $ftrim(source).replaceAll(/[\t\n\r]/g, '') ;
    if (s.startsWith('file:///')) { s = 'file://localhost/' + s.slice(8) ; }
    if (!TSURL.StandardURLProtocols.has($value(_findProtocol(s), '').toLowerCase())) { return s ; }
    const end = s.search(/[?#]/) ;
    return end < 0 ? s.replaceAll('\\', '/') : s.slice(0, end).replaceAll('\\', '/') + s.slice(end) ;
}

function _validateProtocolInfo(s:Nullable<string>, acceptedProtocols?:Nullable<string[]>):[string, boolean, string[]] {
    const aps = $ok(acceptedProtocols) ? [...acceptedProtocols!] : [] ;
    const p = $ftrim(s).toLowerCase() ;
    if (p.length > 0 && __protocolCompleteRegex.test(p)) { 
        const w3c = TSURL.StandardURLProtocols.has(p) ;

        if (w3c || _validateOtherProtocol(p, aps)) { return [p, w3c, aps] ; }
    }
    return ['', false, aps] ; 
}

function _findProtocol(s:string):string|null {
    const m = __protocolRegex.exec(s) ;
    return $ok(m) ? m![0] : null ;
}


function _parseHostAndPort(s:string):[string, string] {
    s = $ftrim(s) ;
    const m = __portRegex.exec(s) ;
    if ($ok(m)) {
        const port = m[0] ;
        return [_asciiHostname(s.slice(0, s.length - port.length)), port.slice(1)] ;
    }
    return [_asciiHostname(s), ''] ;
}

// an internationalized hostname (IDN) is converted in its ASCII form (punycode, eg. 'xn--mnchen-3ya.de'
// for 'münchen.de'), as browsers do, using the native URL class (the punycode module is deprecated).
// Returns an empty string (ie. a bad hostname) if the IDN is invalid.
function _asciiHostname(hostname:string):string {
    if (!__nonASCIIRegex.test(hostname)) { return hostname.toLowerCase() ; }
    try { return new URL(`http://${hostname}`).hostname ; }
    catch { return '' ; }
}

function _validateOtherProtocol(protocol:string, acceptedProtocols:string[]):boolean {
    let found = acceptedProtocols.find(a => { 
        let p = $ftrim(a).toLowerCase() ;
        if (!p.endsWith(':')) { p += ':' ; }
        return p === protocol ;
    }) ;
    return $ok(found) ;
}

// in an url like 'http://my.host_ok.and{part/x', the hostname stops at the first invalid hostname part
// ('my.host_ok.and'), the remaining being the start of the path ('/{part/x' here)
function _validateHostName(hostname:string):[string, string] {
    const hostparts = hostname.split('.') ;
    const i = hostparts.findIndex(part => part.length > 0 && !__hostnamePartRegex.test(part)) ;
    if (i < 0) { return [hostname, ''] ; }

    const validParts = hostparts.slice(0, i);
    const invalidParts = hostparts.slice(i+1) ;
    const m = __hostnamePartStartRegex.exec(hostparts[i]);
    if ($ok(m)) {
        validParts.push(m[1]);
        invalidParts.unshift(m[2]);
    }
    return [validParts.join('.'), invalidParts.length ? '/'+invalidParts.join('.') : ''] ;
}

// returns null or throws an error with the message, according to the throwsError option
/** @internal — a scheme followed by '//' (RFC 3986): an absolute URL, not a path */
export const __absoluteURLRegex = /^[a-z][a-z0-9+.-]*:\/\//i ;

function _urlError(opts:TSURLParseOptions, message:string):null {
    if (opts.throwsError) { TSError.throw(message) ; }
    return null ;
}

// the authentication part of an url which hostname starts at position p (eg. 'user:pwd' in
// 'http://user:pwd@host/'), and the real hostname start position
function _parseAuth(url:string, p:number):[string, number] {
    let end = p ;
    while (end < url.length && url[end] !== '?' && url[end] !== '#' && url[end] !== '/') { end++ ; }
    const atpos = url.slice(p, end).lastIndexOf('@') ;
    return atpos >= 0 ? [decodeURIComponent(url.slice(p, p+atpos)), p + atpos + 1] : ['', p] ;
}

interface URLHost {
    hostname:string ;
    port:string ;
    ipv6:boolean ;
    path:string ;   // start of the path found after the valid hostname parts
}

// hostname and port of an url, or the description of the error
function _parseHost(s:string):URLHost|string {
    let [hostname, port] = _parseHostAndPort(s) ;
    if (!hostname.length || hostname.length > TSURL.HostMaxLength) { return 'bad hostname' ; }
    if (hostname.startsWith('[') && hostname.endsWith(']')) {
        hostname = hostname.slice(1, -1) ;
        return $isipv6(hostname) ? { hostname:hostname, port:port, ipv6:true, path:'' } : 'bad ipv6 hostname' ;
    }
    if (!_checkPotentialIPV4HostName(hostname)) { return 'bad ipv4 hostname' ; }
    const [validHostname, path] = _validateHostName(hostname) ;
    return { hostname:validHostname, port:port, ipv6:false, path:path } ;
}

// The characters escaped in each part of an url, as the WHATWG URL standard (and the native URL class) does.
// Each part used to be escaped with the same set of characters (TSURL.AutoEscapeChars), so some
// characters were escaped while URL does not escape them (like ' | ^ in a path), and conversely.
// The C0 controls, DEL and the non-ASCII characters are always escaped.
const __fragmentEscapes = new Set([' ', '"', '<', '>', '`']) ;
const __queryEscapes = new Set([' ', '"', '#', '<', '>']) ;
const __specialQueryEscapes = new Set([...__queryEscapes, "'"]) ;   // query of the standard protocols (http:, https:, file:...)
// '^' was added to the path set by the standard in 2024 (Chrome and Firefox did already escape it, Node 24 does not yet)
const __pathEscapes = new Set([...__queryEscapes, '?', '^', '`', '{', '}']) ;
const __pathSetterEscapes = __pathEscapes ;                          // '?' and '#' must be escaped by the pathname setter

function _escapedURLPart(s:string, escapes:Set<string>):string {
    let ret = '' ;
    for (const c of s) {
        const code = c.codePointAt(0)! ;
        if (code > 0x7f) { ret += _encodedNonASCIIChar(c) ; }
        // encodeURIComponent() is not used here: it does not escape some characters, like '
        else if (code < 0x20 || code === 0x7f || escapes.has(c)) { ret += '%' + code.toString(16).toUpperCase().padStart(2, '0') ; }
        else { ret += c ; }
    }
    return ret ;
}

// a lone surrogate cannot be encoded in UTF-8 : like the URL class, it is replaced by U+FFFD
function _encodedNonASCIIChar(c:string):string {
    try { return encodeURIComponent(c) ; }
    catch { return '%EF%BF%BD' ; }
}

// splits a path in its pathname, search and hash parts. An empty pathname gives '/' and a lone '?' an empty search
function _splitPath(path:string):[string, string, string] {
    let hash = '' ;
    const hashIndex = path.indexOf('#') ;
    if (hashIndex >= 0) {
        hash = path.slice(hashIndex) ;
        path = path.slice(0, hashIndex) ;
    }
    let search = '' ;
    const qmIndex = path.indexOf('?') ;
    if (qmIndex >= 0) {
        search = qmIndex + 1 < path.length ? path.slice(qmIndex) : '' ;
        path = path.slice(0, qmIndex) ;
    }
    return [path.length ? path : '/', search, hash] ;
}

// ====================== UTF-8 href functions ===============================

// decodes the percent-encoded UTF-8 non-ASCII characters which are not invisible or bidirectional ones
function _utf8Decoded(s:string):string 
{ return s.replace(/(?:%[0-9A-Fa-f]{2})+/g, run => _decodedPercentRun(run)) ; }

function _decodedPercentRun(run:string):string {
    const bytes:number[] = [] ;
    for (let i = 0 ; i < run.length ; i += 3) { bytes.push(Number.parseInt(run.slice(i+1, i+3), 16)) ; }
    let ret = '' ;
    let i = 0 ;
    while (i < bytes.length) {
        const [cp, len] = _utf8CodePoint(bytes, i) ;
        if (cp >= 0x80 && !_keptEncoded(cp)) { 
            ret += String.fromCodePoint(cp) ;
            i += len ;
        }
        else { // an ASCII character, an invalid sequence or a kept character: the original encoding stays
            ret += run.slice(i*3, i*3+3) ;
            i++ ;
        }
    }
    return ret ;
}

const __utf8Sequences:[number, number, number, number, number][] = [ 
    // [first byte min, first byte max, length, second byte min, second byte max] (no overlong or surrogate form)
    [0xC2, 0xDF, 2, 0x80, 0xBF], [0xE0, 0xE0, 3, 0xA0, 0xBF], [0xE1, 0xEC, 3, 0x80, 0xBF], [0xED, 0xED, 3, 0x80, 0x9F], 
    [0xEE, 0xEF, 3, 0x80, 0xBF], [0xF0, 0xF0, 4, 0x90, 0xBF], [0xF1, 0xF3, 4, 0x80, 0xBF], [0xF4, 0xF4, 4, 0x80, 0x8F]
] ;
// returns the code point of the valid UTF-8 sequence at index i and its length, or [-1, 1]
function _utf8CodePoint(bytes:number[], i:number):[number, number] {
    const b = bytes[i] ;
    const seq = __utf8Sequences.find(([min, max]) => b >= min && b <= max) ;
    if (!seq || i + seq[2] > bytes.length || bytes[i+1] < seq[3] || bytes[i+1] > seq[4]) { return [-1, 1] ; }
    const len = seq[2] ;
    let cp = b & (0xFF >> (len + 1)) ;
    for (let j = 1 ; j < len ; j++) {
        const c = bytes[i+j] ;
        if (c < 0x80 || c > 0xBF) { return [-1, 1] ; }
        cp = (cp << 6) | (c & 0x3F) ;
    }
    return [cp, len] ;
}

// C1 controls, no-break and invisible spaces, bidirectional and format characters
function _keptEncoded(cp:number):boolean {
    return cp <= 0xA0 || cp === 0xAD || (cp >= 0x2000 && cp <= 0x200F) || (cp >= 0x2028 && cp <= 0x202F) 
        || (cp >= 0x205F && cp <= 0x206F) || cp === 0x3000 || cp === 0xFEFF ;
}

// the punycode labels ('xn--' prefix) are decoded, a label which cannot be decoded stays as it is
function _unicodeHostname(hostname:string):string {
    return hostname.split('.').map(label => {
        if (!label.toLowerCase().startsWith('xn--')) { return label ; }
        const decoded = _punycodeDecoded(label.slice(4)) ;
        return $ok(decoded) ? decoded : label ;
    }).join('.') ;
}

// RFC 3492 punycode decoding
const __puny = { base:36, tMin:1, tMax:26, skew:38, damp:700, initialBias:72, initialN:128 } ;

function _punycodeDecoded(input:string):string|null {
    const output:number[] = [] ;
    const basic = Math.max(input.lastIndexOf('-'), 0) ;
    for (let j = 0 ; j < basic ; j++) {
        const c = input.codePointAt(j)! ;
        if (c >= 0x80) { return null ; }
        output.push(c) ;
    }
    let i = 0, n = __puny.initialN, bias = __puny.initialBias ;
    let index = basic > 0 ? basic + 1 : 0 ;
    while (index < input.length) {
        const oldi = i ;
        const delta = _punycodeDelta(input, index, bias) ;
        if (!$ok(delta)) { return null ; }
        i += delta[0] ;
        index = delta[1] ;
        const count = output.length + 1 ;
        bias = _punycodeAdapt(i - oldi, count, oldi === 0) ;
        n += Math.floor(i / count) ;
        i %= count ;
        if (n > 0x10FFFF) { return null ; }
        output.splice(i, 0, n) ;
        i++ ;
    }
    return String.fromCodePoint(...output) ;
}

// decodes the generalized variable-length integer at index: returns it with the index which follows it
function _punycodeDelta(input:string, index:number, bias:number):[number, number]|null {
    let delta = 0 ;
    let w = 1 ;
    for (let k = __puny.base ; ; k += __puny.base) {
        if (index >= input.length) { return null ; }
        const digit = _punycodeDigit(input.codePointAt(index++)!) ;
        if (digit >= __puny.base) { return null ; }
        delta += digit * w ;
        const t = _punycodeThreshold(k, bias) ;
        if (digit < t) { return [delta, index] ; }
        w *= __puny.base - t ;
        if (w > 0x7FFFFFFF) { return null ; }
    }
}

function _punycodeThreshold(k:number, bias:number):number {
    if (k <= bias) { return __puny.tMin ; }
    return k >= bias + __puny.tMax ? __puny.tMax : k - bias ;
}

function _punycodeDigit(c:number):number {
    if (c >= 0x30 && c <= 0x39) { return c - 22 ; }   // '0'..'9' -> 26..35
    if (c >= 0x41 && c <= 0x5A) { return c - 0x41 ; } // 'A'..'Z' -> 0..25
    if (c >= 0x61 && c <= 0x7A) { return c - 0x61 ; } // 'a'..'z' -> 0..25
    return __puny.base ;
}

function _punycodeAdapt(delta:number, count:number, first:boolean):number {
    delta = first ? Math.floor(delta / __puny.damp) : delta >> 1 ;
    delta += Math.floor(delta / count) ;
    let k = 0 ;
    const limit = ((__puny.base - __puny.tMin) * __puny.tMax) >> 1 ;
    while (delta > limit) {
        delta = Math.floor(delta / (__puny.base - __puny.tMin)) ;
        k += __puny.base ;
    }
    return k + Math.floor((__puny.base - __puny.tMin + 1) * delta / (delta + __puny.skew)) ;
}
