import { IncomingMessage, ServerResponse } from "http";

import { StringDictionary, uint32 } from "./types";
import { $ext, $isdirectory, $isfile, $path, $readBuffer } from "./fs";
import { $keys, $length, $objectcount, $ok, $trim } from "./commons";
import { Resp, Verb } from "./tsrequest";
import { TSHttpError } from "./tserrors";

import { TSEndPoints, TSServerLogger } from "./tsserver";

export interface TSStaticWebSiteOptions {
    logger?:TSServerLogger ;
    managedTypes?:StringDictionary ;
    maxCacheSize?:uint32,
    maxCachedFileSize?:uint32,
    maxCachedFiles?:uint32,
    maxBlacklistedFiles?:uint32
}

export class TSStaticWebsite {
    public readonly uri:string ;
    public readonly folder:string ;
    
    private _cache:Map<string, Buffer> ;
    private _cacheMemory:number ;
    private _blacklisted:Set<string> ;
    private _opts:TSStaticWebSiteOptions ;

    constructor(uri:string, folder:string, opts:TSStaticWebSiteOptions) {
        if (!$length(uri)) { throw `Static website url not defined for folder '${folder}'` ; }
        if (!$isdirectory(folder)) { throw `website ${uri} root folder ${folder} was not found.` ; }
  
        this.uri = uri.toLowerCase() ;
        this.folder = folder ;
    
        this._opts = { ... opts} ;
        this._cache = new Map<string,Buffer>() ;
        this._cacheMemory = 0 ;
        this._blacklisted = new Set<string>() ;

        if (!$ok(this._opts.logger))                { throw 'You must specify a logger to a new TSStaticWebsite' ; }
        if (!$objectcount(this._opts.managedTypes)) { this._opts.managedTypes = { ... TSStaticWebsite.__TSServerStandardsTypes } ; }
        if (!$ok(this._opts.maxCacheSize))          { this._opts.maxCacheSize = 128 * 1024 * 1024 as uint32 ; }
        if (!$ok(this._opts.maxCachedFiles))        { this._opts.maxCachedFiles = 10000 as uint32 ; }
        if (!$ok(this._opts.maxCachedFileSize))     { this._opts.maxCachedFileSize = 256*1024 as uint32 ; }
        if (!$ok(this._opts.maxBlacklistedFiles))   { this._opts.maxBlacklistedFiles = 50000 as uint32 ; }
    }

    public getStaticResource(uri:string):[Buffer|undefined|null, string] {
        let ret:Buffer|undefined|null = undefined ;
        let type = '' ;
        const lcUri = uri.toLowerCase() ;
        if (lcUri.startsWith(this.uri)) {
            const ext = $ext(lcUri) ;
            type = $length(ext) ? this._opts.managedTypes![ext] : '' ;
            if ($length(type)) {
                const path = uri.slice(this.uri.length) ;
                if (!this._blacklisted.has(path)) {
                    ret = this._cache.get(path) ;
                    if (!$ok(ret)) {
                        const file = $path(this.folder, path) ;
                        if ($isfile(file)) {
                            ret = $readBuffer(file) ;
                            if ($ok(ret)) { this._cacheContent(path, ret!) ; }
                            else { this._blacklist(path) ; }
                        }
                        else { this._blacklist(path) ; }
                    }
                }
            }
        }
        return [ret, type] ;
    }

    public async clearCaches() {
        this._cacheMemory = 0 ;
        this._cache.clear() ;
        this._blacklisted.clear() ;
    }

    private _cacheContent(path:string, b:Buffer) {
        if (this._cache.size < this._opts.maxCachedFiles! && b.length <= this._opts.maxCachedFileSize! && this._cacheMemory + b.length <= this._opts.maxCacheSize!) { 
            this._cache.set(path, b) ; 
            this._cacheMemory += b.length ;
        }
    }

    private _blacklist(path:string) {
        if (this._blacklisted.size < this._opts.maxBlacklistedFiles!) { this._blacklisted.add(path) ; }
    }

    private static readonly __TSServerStandardsTypes:StringDictionary = {
        'html': 'text/html',        
        'htm':  'text/html',
        'css':  'text/css',
        'js':   'text/javascript',
        'svg':  'image/svg+xml',    
        'svgz': 'image/svg+xml',
        'jpeg': 'image/jpeg',       
        'jpg':  'image/jpg',
        'png':  'image/png',
        'gif':  'image/gif',
        'ico':  'image/x-icon',
        'pdf':  'application/pdf'
    } ;

}

export class TSParametricEndPoints {
    public readonly uri:string ;
    public readonly depth:number ; // measures the number of components of the path
    public readonly tokens:string[] ;
    public readonly endPoints:TSEndPoints ;
    public readonly caseInsensitive:boolean ;

    private _regex:RegExp|null ;
    private _tlen ;
    private static __verbs = Object.values(Verb) ;

    public static validRequestMethod(method:string|undefined|null):Verb|null {
        if ($ok(method)) {
            method = method!.toUpperCase() ;
            if (TSParametricEndPoints.__verbs.includes(method as Verb)) { return method as Verb ; }
        }
        return null ;
    }

    constructor (path:string, ep:TSEndPoints, caseInsensitive:boolean=false) {
        path = $trim(path) ;
        const len = path.length ;
        
        if (len < 2) { throw `End points path '${path}' is too short`; }
        const methods = $keys(ep) ;
        if (methods.length === 0) { throw `End points path '${path}' has no method defined.` ; }
        methods.forEach(m => { if (!$ok(TSParametricEndPoints.validRequestMethod(m))) {
            throw `End points path '${path}' did define invalid '${m}' request method.`
        }}) ;
        this.endPoints = ep ;
        this.caseInsensitive = caseInsensitive ;

        // ================= automat initialization ===============
        this.uri = '/' ;
        this.tokens = [] ;
        this.depth = 1 ;
        enum State { Start, Standard, Bracket, Token} ;
        let state = State.Start ;
        let regString = '' ;
        let currentToken = '' ;    
        let constructUri = true ;
    
        // ================= automated path analysis ===============
        for (let i = 0 ; i < len ; i++) {
            const c = path.charAt(i) ;
            //console.log(`state = ${state}, char = "${c}"`) ;
            switch (state) {
                case State.Start:
                    if (c !== '/') { throw `End points path '${path}' is not absolute.` ; }
                    state = State.Standard ;
                    break ;
                case State.Standard:
                    switch (c) {
                        case '{': state = State.Bracket ; constructUri = false ; break ;
                        case '}': throw `Misplaced '}' character in path '${path}'.` ;
                        case '/':
                            if (constructUri) { this.uri += c ; } else { regString += '\\/' ; }
                            this.depth++ ;
                            break ;
                        case '-': case '$': case '+': case '*': case '?': case '.': case '(':  case ')':
                            if (constructUri) { this.uri += c ; } else { regString += '\\'+c ; }
                            break ;
                        case '^': case '\\': case '[': case ']': case '`': case '|':
                            throw `Found forbidden character '${c}' in path '${path}'.` ;
                        default:
                            if (constructUri) { this.uri += caseInsensitive ? c.toLowerCase() : c ; }
                            else { regString += caseInsensitive ? c.toLowerCase() : c ; } 
                            break ;
                    }
                    break ;
                case State.Bracket:
                    if ((c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z')) { 
                        currentToken = c ; state = State.Token ; break ; 
                    }
                    throw `Found formidden first character '${c}' in parametric token in path '${path}'.` ;
                case State.Token:
                    if ((c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z') || (c >= '0' && c <= '9') || c === '-' || c === '_' || c === '.') {
                        currentToken += c ; 
                        break ;
                    } 
                    else if (c === '}') {
                        this.tokens.push(currentToken) ;
                        regString += '([a-zA-Z][.a-zA-Z0-9_\-]*)' ;
                        currentToken = '' ;
                        state = State.Standard ;
                        break ;
                    }
                    throw `Found formidden character '${c}' in parametric token in path '${path}'.` ;
            }
        }
        if (state !== State.Standard) { 
            throw `Malformed parametric path '${path}'.` ; 
        }
        this._regex = regString.length === 0 ? null : (caseInsensitive?new RegExp('^'+regString+'$', 'i') : new RegExp('^'+regString+'$')) ; 
        this._tlen = this.tokens.length ;
    }
    
    public get static():boolean { return !$ok(this._regex) ; } 

    public async execute(url:URL, method:Verb, parameters:StringDictionary, req: IncomingMessage, res: ServerResponse):Promise<void> {
        const ep = this.endPoints[method] ;
        if (!$ok(ep)) { 
           throw new TSHttpError(`Method '${method}' not implemented on url '${url.pathname}'`, Resp.NotImplemented) ; 
        }
        await ep!(url, parameters, req, res) ; // this method may also throw
    }

    // can return an empty string dictionary which means that our path is not parametric
    public valuesFromPath(path:string):StringDictionary|null {
        if (this.caseInsensitive) { path = path.toLowerCase() ; }
        if (path.startsWith(this.uri)) {
            const rp = path.slice(this.uri.length) ;
            const ret:StringDictionary = {}
            if (!rp.length && !$ok(this._regex)) { return ret ; }               
            else if (rp.length && $ok(this._regex)) {
                const m = rp.match(this._regex!) ;
                if ($ok(m)) {
                    if (m!.length === this._tlen + 1) {
                        for (let i = 0 ; i < this._tlen ; i++ ) {
                            ret[this.tokens[i]] = m![i+1] ;
                        }
                    }
                    return ret ;    
                }
            }
        }
        return null ;
    }
}
