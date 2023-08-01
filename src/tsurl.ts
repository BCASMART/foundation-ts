import { $ok, $value } from "./commons";
import { $ascii, $ftrim } from "./strings";
import { TSError } from "./tserrors";
import { TSClone, TSObject } from "./tsobject";
import { Ascending, Comparison, Descending, Nullable, Same } from "./types";

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
    public static EndhostCharSet = new Set(['%', '/', '?', ';', '#', ...TSURL.AutoEscapeChars]) 

    private _auth:string ;
    private _hash:string ;
    private _hostname:string ;
    private _pathname:string ;
    private _port:string ;
    private _protocol: string ;
    private _search:string ;
    private _w3cProtocol:boolean ;
    private _ipv6:boolean ;

    public readonly searchParams:URLSearchParams ;

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

    public static url(source:Nullable<string>, opts:TSURLParseOptions = {}):TSURL|null {
        const url = _normalizeURLString(source) ;
        const len = url.length ;
        const protocol = _completeProtocol(_findProtocol(url)) ;
        if (protocol instanceof TSError) { 
            if (!!opts.throwsError) { throw protocol ; }
            return null ;
        }
        const w3c = TSURL.StandardURLProtocols.has(protocol) ;
        if (!w3c) {
            if (!_validateProtocol(protocol, opts.acceptedProtocols)) {
                if (!!opts.throwsError) { new TSError(`TSURL: unknown protocol in '${url}'`) ; }
                return null ;
            }
        }

        let p = protocol.length ;
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

        const atpos = url.lastIndexOf('@', hostendpos < len ? hostendpos : p) ; 

        let auth = '' ;
        if (atpos >= 0) {
            auth = decodeURIComponent(url.slice(p, atpos)) ;
            p = atpos + 1 ;
            //console.log('auth', auth) ;
        }
        hostendpos = p ;
        while (hostendpos < len) {
            //console.log('examining character', url[hostendpos])
            if (TSURL.EndhostCharSet.has(url[hostendpos])) { break ; } 
            hostendpos++ 
        } 
        let [hostname, port] = _parseHostAndPort(url.slice(p, hostendpos)) ;

        if (!hostname.length || hostname.length > TSURL.HostMaxLength) {
            if (!!opts.throwsError) { new TSError(`TSURL: bad hostname in url '${url}'`) ; }
            return null ;
        }

        let ipv6Hostname = hostname.startsWith('[') && hostname.endsWith(']') ;
        if (ipv6Hostname) {
            hostname = hostname.slice(1, hostname.length-1) ;
        }


        p = hostendpos ;
        let path = '' ;
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

        return new TSURL(protocol, hostname, port, path, hash, auth, search, ipv6Hostname, w3c) ;

    }
    
    private constructor (protocol:string, hostname:string, port:string, pathname:string, hash:string, auth:string, search:string, ipv6:boolean, w3c:boolean) {
        this._auth = auth ;
        this._hash = hash ;
        this._hostname = hostname ;
        this._pathname = pathname ;
        this._port = port ;
        this._protocol = protocol ;
        this._search = search ;
        this.searchParams = new URLSearchParams(search) ; 
        this._w3cProtocol = w3c ;
        this._ipv6 = ipv6 ;
    }
    
    public get w3c():boolean { return this._w3cProtocol ; }

    public get origin():string { return this._protocol + '//' + this.host ; }
    
    public get host():string { 
        let ret = this._ipv6 ? '['+this._hostname+']' : this._hostname ;
        if (this._port.length) { ret += ':' ; ret += this._port ; }
        return ret ; 
    }
    public get href():string {
        let auth = this._auth ;
        if (auth.length) {
            auth = encodeURIComponent(auth) ;
            auth = auth.replace(/%3A/i, ':');
            auth += '@';
        }

        let hash = this._hash ; 
        if (hash.length && hash.charAt(0) !== '#') { hash = '#' + hash ; }
        
        let search = this._search ;
        if (search.length && search.charAt(0) !== '?') { search = '?' + search; }
        let pathname = this._pathname ;
        if (!pathname.startsWith('/')) { pathname = '/' + pathname ; }
        return this._protocol + '//' + auth + this.host + pathname + search + hash ; 
    }

    public get auth():string { return this._auth ; }
    // TODO: set auth(s:string)

    public get hash():string { return this._hash ; }
    // TODO: set hash(s:string)

    public get search():string { return this._search ; }
    // TODO: set search(s:string) ??

    public get pathname():string { return this._pathname ; }
    public get hostname():string { return this._hostname ; }
    public set hostname(h:string) { 
        const hn = $ascii($ftrim(h)).toLowerCase() ;
        if (!hn.length) { new TSError('TSURL: trying to set empry hostname') ; }
        if (hn.length > TSURL.HostMaxLength) { new TSError('TSURL: trying to set a too large hostname') ; }
        this._hostname = hn ;
    }

    public get port():string { return this._port ; }
    public set port(p:string) { this._port = p ; }
    
    public get protocol():string { return this._protocol ; }
    public set protocol(s:string) { 
        const v = _completeProtocol(s) ;
        if (v instanceof TSError) { throw v } ;
        this._protocol = v ; 
    }

    public isValid(opts:TSURLParseOptions = {}):boolean {
        if (!!opts.refusesParameters && this._search.length > 0) { return false ; }
        this._w3cProtocol = TSURL.StandardURLProtocols.has(this.protocol) ;
        return this._w3cProtocol || _validateProtocol(this.protocol, opts.acceptedProtocols) ;
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
    public toArray():string[] { return [this.href] ; }

    // =============== TSClone protocol ====================
    public clone(): TSURL {
        return new TSURL(this._protocol, this._hostname, this._port, this._pathname, this._hash, this._auth, this._search, this._ipv6, this._w3cProtocol) ;
    }

}

// ====================== private constants and functions ===============================

const __protocolRegex = /^([a-z0-9.+-]+:)/i ;
const __protocolCompleteRegex = /^([a-z0-9.+-]+:)$/i ;
const __backslashRegex = /\\/g ;
const __portRegex = /:[0-9]*$/ ;

function _normalizeURLString(source:Nullable<string>):string {
    const s = $ftrim(source) ;
    const index = s.indexOf('?') ;
    const splitchar = index > -1 && index < s.indexOf('#') ? '?' : '#' ;
    const parts = s.split(splitchar) ;
    parts[0] = parts[0].replace(__backslashRegex, '/') ;
    return parts.join(splitchar) ;
}

function _completeProtocol(s:string|null|TSError):string|TSError {
    if (s instanceof TSError) { return s ; }
    const p = $ftrim(s).toLowerCase() ;
    if (!p.length || !p.match(__protocolCompleteRegex)) { return _protocolError(p) ; }
    return p ;
}

function _findProtocol(s:string):string|TSError {
    const m = __protocolRegex.exec(s) ;
    return $ok(m) ? m![0] : _protocolError(s) ;
}

function _protocolError(p:string) { return new TSError(`TSURL: impossible to set protocol '${p}'`) ; }

function _parseHostAndPort(s:string):[string, string] {
    s = $ascii($ftrim(s)).toLowerCase()
    const m = __portRegex.exec(s) ;
    if ($ok(m)) {
        const port = m![0] ;
        return [s.slice(0, s.length - port.length), port.slice(1)] ;
    }
    return [s, ''] ;
}

function _validateProtocol(protocol:string, acceptedProtocols:Nullable<string[]>) {
    acceptedProtocols = $value(acceptedProtocols, []) ;
    let found = acceptedProtocols.find(a => { 
        let p = $ftrim(a).toLowerCase() ;
        if (!p.endsWith(':')) { p += ':' ; }
        return p === protocol ? protocol : undefined ;
    }) ;
    return $ok(found) ;
}