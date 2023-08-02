import { Ascending, Comparison, Descending, Nullable, Same, url } from "./types";
import { $defined, $isipv4, $isipv6, $ok, $value } from "./commons";
import { $ascii, $ftrim } from "./strings";
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
    acceptedProtocols?:Nullable<string[]> ;
    refusesParameters?:Nullable<boolean> ;
    throwsError?:Nullable<boolean> ;
}

export class TSURL implements TSObject, TSClone<TSURL> {
    public static HostMaxLength = 255 ;
    public static AutoEscapeChars = ['{', '}', '|', '\\', '^', '`', "'", '<', '>', '"', '`', ' ', '\r', '\n', '\t'] ;
    public static StandardURLProtocols = new Set(['http:', 'https:', 'file:', 'ftp:', 'ws:', 'wss:']) ;
    public static AutoEscapeCharSet = new Set(TSURL.AutoEscapeChars) ;
    public static EndhostCharSet = new Set(['%', '/', '?', ';', '#', ...TSURL.AutoEscapeChars]) ;

    private _auth:string ;
    private _hash:string ;
    private _hostname:string ;
    private _pathname:string ;
    private _port:string ;
    private _protocol: string ;
    private _search:string ;
    private _w3cProtocol:boolean ;
    private _ipv6:boolean ;
    private _acceptedProtocols:string[] ;

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

    public static compose(origin:Nullable<string>, path:string, options?:Nullable<TSURLParseOptions>):TSURL|null {
        let o = $ftrim(origin) ;
        let p = $ftrim(path) ;
        if (!o.length) { o = 'http://localhost/' ; }
        if (!o.endsWith('/')) { o += '/' ; }
        if (p.startsWith('/')) { p = p.slice(1) ; }
        return this.url(o+p, options) ;
    }

    public static url(source:Nullable<string>, options?:Nullable<TSURLParseOptions>):TSURL|null {
        const opts = $value(options, {}) ;
        const url = _normalizeURLString(source) ;
        const len = url.length ;
        const [protocol, w3c, aps] = _validateProtocolInfo(_findProtocol(url), opts.acceptedProtocols) ;
        let p = protocol.length ;
        if (!p) {
            if (!!opts.throwsError) { new TSError(`TSURL: bad protocol in '${url}'`) ; }
            return null ;
        }

        if (url[p] !== '/' || url[p+1] !== '/') {
            if (!!opts.throwsError) { new TSError(`TSURL: unable to find // before hostname in url '${url}'`) ; }
            return null ;
        }
        let c = '' ;
        p += 2 ;
        let hostendpos = p ;
        while (hostendpos < len) { 
            c = url[hostendpos] ;
            if (c === '?' || c === '#' || c === '/') { break ; } 
            hostendpos++ ;
        } 
        const potentialHost = url.slice(p, hostendpos) ;
        const atpos = potentialHost.lastIndexOf('@') ;

        let auth = '' ;
        if (atpos >= 0) {
            auth = decodeURIComponent(url.slice(p, p+atpos)) ;
            p += atpos + 1 ;
        }

        hostendpos = p ;
        while (hostendpos < len) {
            if (TSURL.EndhostCharSet.has(url[hostendpos])) { break ; } 
            hostendpos++ 
        } 
        let [hostname, port] = _parseHostAndPort(url.slice(p, hostendpos)) ;
        let path = '' ;

        if (!hostname.length || hostname.length > TSURL.HostMaxLength) {
            if (!!opts.throwsError) { new TSError(`TSURL: bad hostname in url '${url}'`) ; }
            return null ;
        }

        let ipv6Hostname = hostname.startsWith('[') && hostname.endsWith(']') ;
        if (ipv6Hostname) {
            hostname = hostname.slice(1, hostname.length-1) ;
            if (!$isipv6(hostname)) {
                if (!!opts.throwsError) { new TSError(`TSURL: bad ipv6 hostname in url '${url}'`) ; }
                return null ;
            }
        }
        else {
            if (!_checkPotentialIPV4HostName(hostname)) {
                if (!!opts.throwsError) { new TSError(`TSURL: bad ipv4 hostname in url '${url}'`) ; }
                return null ;
            }
            [hostname, path] = _validateHostName(hostname) ;    
        }
        
        // FIXME: we should use punycode (which is deprecated) to transform URL in full ASCII

        p = hostendpos ;
        for (let p = hostendpos ; p < len ; p++) {
            const c = url[p] ;
            if (c === "'") { path += '%27' ; }
            else { path += TSURL.AutoEscapeCharSet.has(c) ? encodeURIComponent(c) : c ; }
        }

        let hash = '' ;
        const hashIndex = path.indexOf('#') ;
        if (hashIndex >= 0) {
            hash = path.slice(hashIndex) ;
            path = path.slice(0, hashIndex) ;
        }

        let search = '' ;
        const qmIndex = path.indexOf('?') ;
        if (qmIndex >= 0) {
            search = path.slice(qmIndex) ; 
            if (search.length === 1) { search = '' ; }
            path = path.slice(0, qmIndex) ; 
        }
        if (search.length > 0 && !!opts.refusesParameters) {
            if (!!opts.throwsError) { new TSError(`TSURL: unexpected parameters in url '${url}'`) ; }
            return null ;
        }
        if (!path.length) { path = '/' ; }

        return new TSURL(protocol, hostname, port, path, hash, auth, search, ipv6Hostname, w3c, aps) ;

    }
    
    private constructor (protocol:string, hostname:string, port:string, pathname:string, hash:string, auth:string, search:string, ipv6:boolean, w3c:boolean, protocols:string[]) {
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
        return this._href! ; 
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
        return this._searchParams! ;
    }

    public get auth():string { return this._auth ; }
    // TODO: set auth(s:string)

    public get hash():string { return this._hash ; }
    // TODO: set hash(s:string)

    public get search():string { return this._search ; }
    // TODO: set search(s:string) ??

    public get pathname():string { return this._pathname ; }
    public set pathname(s:string) {
        // TODO: verify we don't have any end path characters 
        let path = '' ;
        for (const c of s) {
            if (c === "'") { path += '%27' ; }
            else { path += TSURL.AutoEscapeCharSet.has(c) ? encodeURIComponent(c) : c ; }
        }
        if (!path.length) { path = '/' ; }
        this.pathname = path ;
        this._href = undefined ;
    }

    public get hostname():string { return this._hostname ; }
    // TODO: public set hostname(h:string) 

    public get port():string { return this._port ; }
    public set port(p:string) { this._port = p ; this._href = undefined ; }
    
    public get protocol():string { return this._protocol ; }
    public set protocol(s:string) { 
        const [protocol, w3c,] = _validateProtocolInfo(s, this._acceptedProtocols) ;
        if (!protocol.length) { throw new TSError(`TSURL.protocol = value. Impossible to set new protocol '${s}'.`) ; }
        this._w3cProtocol = w3c ;
        this._protocol = protocol ;
        this._href = undefined ;
    }

    // ============ TSObject conformance ==================
    public isEqual(other:any):boolean {
        return this === other || (other instanceof TSURL && this.href === other.href)
    }

    public compare(other:any):Comparison {
        if (other === this) { return Same ; }
        if (!(other instanceof TSURL)) { return undefined ; }
        return this.href < other.href ? Ascending : ( this.href > other.href ? Descending : Same ) ;
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
            search = search.replace('#', '%23');
            if (!search.startsWith('?')) { search = '?' + search; }
        }
        let pathname = this._pathname ;
        if (!pathname.startsWith('/')) { pathname = '/' + pathname ; }
        return (this._protocol + '//' + auth + this.host + pathname + search + hash) as url ; 
    }

}

// ====================== private constants and functions ===============================

const __protocolRegex = /^([a-z0-9.+-]+:)/i ;
const __protocolCompleteRegex = /^([a-z0-9.+-]+:)$/i ;
const __backslashRegex = /\\/g ;
const __portRegex = /:[0-9]*$/ ;
const __mayBeIPV4Regex = /^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$/ ;
const __hostnamePartRegex = /^[+a-z0-9A-Z_-]{0,63}$/ ;
const __hostnamePartStartRegex = /^([+a-z0-9A-Z_-]{0,63})(.*)$/ ;
const __nonASCIIGlobalRegex = /[^\x00-\x7F]/g ;
function _checkPotentialIPV4HostName(hostname:string):boolean {
    return !__mayBeIPV4Regex.test(hostname) || $isipv4(hostname) ;
}

function _normalizeURLString(source:Nullable<string>):string {
    let s = $ftrim(source) ;
    if (s.startsWith('file:///')) { s = 'file://localhost/' + s.slice(8) ; }
    const index = s.indexOf('?') ;
    const splitchar = index > -1 && index < s.indexOf('#') ? '?' : '#' ;
    const parts = s.split(splitchar) ;
    parts[0] = parts[0].replace(__backslashRegex, '/') ;
    return parts.join(splitchar) ;
}

function _validateProtocolInfo(s:Nullable<string>, acceptedProtocols?:Nullable<string[]>):[string, boolean, string[]] {
    const aps = $ok(acceptedProtocols) ? [...acceptedProtocols!] : [] ;
    const p = $ftrim(s).toLowerCase() ;
    if (p.length > 0 && p.match(__protocolCompleteRegex)) { 
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
    s = $ascii($ftrim(s)).toLowerCase()
    const m = __portRegex.exec(s) ;
    if ($ok(m)) {
        const port = m![0] ;
        return [s.slice(0, s.length - port.length), port.slice(1)] ;
    }
    return [s, ''] ;
}

function _validateOtherProtocol(protocol:string, acceptedProtocols:string[]):boolean {
    let found = acceptedProtocols.find(a => { 
        let p = $ftrim(a).toLowerCase() ;
        if (!p.endsWith(':')) { p += ':' ; }
        return p === protocol ? protocol : undefined ;
    }) ;
    return $ok(found) ;
}

function _validateHostName(hostname:string):[string, string] {
    const hostparts = hostname.split(/\./) ;
    const n = hostparts.length ;
    for (let i = 0 ; i < n ; i++) {
        var part = hostparts[i];

        if (!part.length) { continue; }
        if (!part.match(__hostnamePartRegex)) {
            var newPart = part.replace(__nonASCIIGlobalRegex, _ => 'x') ; // replace non ASCII chars with 'x'
            if (!newPart.match(__hostnamePartRegex)) {
                const validParts = hostparts.slice(0, i);
                const invalidParts = hostparts.slice(i+1) ;
                const m = part.match(__hostnamePartStartRegex);
                if ($ok(m)) {
                    validParts.push(m![1]);
                    invalidParts.unshift(m![2]);
                }
                return [validParts.join('.'), invalidParts.length ? '/'+invalidParts.join('.') : ''] ;
            }
        }

    }
    return [hostname, '']
}
