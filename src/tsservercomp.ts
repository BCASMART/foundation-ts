import { ServerResponse } from "http";

import { Nullable, StringDictionary, TSDictionary, uint32 } from "./types";
import { $ext, $isdirectory, $isfile, $path, $readBuffer } from "./fs";
import { $email, $intornull, $isfunction, $isstring, $keys, $length, $objectcount, $ok, $string, $unsignedornull, $UUID } from "./commons";
import { Resp, Verb } from "./tsrequest";
import { TSError, TSHttpError } from "./tserrors";

import { TSEndPoint, TSEndPoints, TSEndPointParameter, TSParameterDictionary, TSServerLogger, TSParametricTokenType, TSParametricToken, TSEndPointManager, TSQueryItem, TSServerRequest, TSQueryDictionary, TSQueryValue } from "./tsserver";
import { TSDate } from "./tsdate";
import { TSColor } from "./tscolor";
import { $ftrim } from "./strings";

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
        const errorOptions = { uri:uri, folder:folder, options:opts} ;
        if (!$length(uri)) { 
            throw new TSError(`TSStaticWebsite.constructor(): url not defined for folder '${folder}'`, errorOptions) ; 
        }
        if (!$isdirectory(folder)) { 
            throw new TSError(`TSStaticWebsite.constructor(): website ${uri} root folder ${folder} was not found on disk.`, errorOptions) ;
        }
  
        this.uri = uri.toLowerCase() ;
        this.folder = folder ;
    
        this._opts = { ... opts} ;
        this._cache = new Map<string,Buffer>() ;
        this._cacheMemory = 0 ;
        this._blacklisted = new Set<string>() ;

        if (!$ok(this._opts.logger)) { 
            throw new TSError('TSStaticWebsite.constructor(): You must specify a logger to a new TSStaticWebsite', errorOptions) ; 
        }
        if (!$objectcount(this._opts.managedTypes)) { this._opts.managedTypes = { ... TSStaticWebsite.__TSServerStandardsTypes } ; }
        if (!$ok(this._opts.maxCacheSize))          { this._opts.maxCacheSize = 128 * 1024 * 1024 as uint32 ; }
        if (!$ok(this._opts.maxCachedFiles))        { this._opts.maxCachedFiles = 10000 as uint32 ; }
        if (!$ok(this._opts.maxCachedFileSize))     { this._opts.maxCachedFileSize = 256*1024 as uint32 ; }
        if (!$ok(this._opts.maxBlacklistedFiles))   { this._opts.maxBlacklistedFiles = 50000 as uint32 ; }
    }

    public getStaticResource(uri:string):[Nullable<Buffer>, string] {
        let ret:Nullable<Buffer> = undefined ;
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


const TSParametersConversions:{[key in TSParametricTokenType]:(s:string) => Nullable<TSEndPointParameter>} = {
    string: (s:string) => s,
    number: (s:string) => Number(s),
    int: (s:string) => $intornull(s),
    unsigned: (s:string) => $unsignedornull(s),
    boolean: (s:string) => { 
        s = $ftrim(s).toLowerCase() ; 
        if (s === '1' || s === 'true' || s === 'y' || s === 'yes') { return true ; }
        if (s === '0' || s === 'false' || s === 'n' || s === 'no') { return false ; }
        return undefined ;
    }, 
    date: (s:string) => TSDate.fromIsoString(s), // since it may not be a good think to have ':' chars in a path, the date encoding should be TSDateForm.ISO8601C
    color: (s:string) => { 
        let c:TSColor|undefined ; 
        try { c = TSColor.rgb(s) ; } 
        catch { c =  undefined ; } 
        return c ; 
    },
    uuid: (s:string) => $UUID(s),
    email: (s:string) => $email(s)
} as const ;


export type TSParametricQueryDefinition = TSDictionary<TSQueryItem>
export interface TSParametricEndPoint {
    manager:TSEndPointManager,
    query?: TSParametricQueryDefinition
}

export type TSParametricEndPointsDefinitions = { [key in Verb]?: TSParametricEndPoint; } ;
export class TSParametricEndPoints {
    public readonly uri:string ;
    public readonly depth:number ; // measures the number of components of the path
    public readonly tokens:TSParametricToken[] ;
    public readonly endPoints:TSParametricEndPointsDefinitions ;
    public readonly caseInsensitive:boolean ;

    private _regex:RegExp|null ;
    private _tlen ;
    private static __verbs = Object.values(Verb) ;

    public static validRequestMethod(method:Nullable<string>):Verb|null {
        if ($ok(method)) {
            method = method!.toUpperCase() ;
            if (TSParametricEndPoints.__verbs.includes(method as Verb)) { return method as Verb ; }
        }
        return null ;
    }

    constructor (path:string, ep:TSEndPoints|TSEndPoint|TSEndPointManager, caseInsensitive:boolean=false) {
        const errorOptions = { path:path, endPoints:ep, options:{ caseSensitive:!caseInsensitive }} ;

        path = $ftrim(path) ;
        const len = path.length ;
        if ($isfunction(ep)) { ep = { GET: { manager:ep } as TSEndPoint } as TSEndPoints ; }
        else if ('manager' in ep) { ep = { GET:ep as TSEndPoint} as TSEndPoints ; }
        if (len < 2) { 
            throw new TSError(`TSParametricEndPoints.constructor(): end points path '${path}' is too short`, errorOptions) ; 
        }

        const methods = $keys(ep as TSEndPoints) ;
        if (methods.length === 0) { 
            throw new TSError(`TSParametricEndPoints.constructor() : end points path '${path}' has no method defined.`, errorOptions) ; 
        }

        this.endPoints = {} ;
        methods.forEach(m => {
            if (!$ok(TSParametricEndPoints.validRequestMethod(m))) {
                throw new TSError(`TSParametricEndPoints.constructor() : end points path '${path}' did define invalid '${m}' request method.`, errorOptions) ; 
            }
            const v:TSEndPoint|TSEndPointManager = (ep as TSEndPoints)[m]! ;
            let def = $isfunction(v) ? { manager: v as TSEndPointManager} : v as TSEndPoint ;
            let newQuery:TSParametricQueryDefinition = {} ;
            $keys(def.query).forEach(name => {
                const n = $ftrim($string(name)) ;
                if (!n.length) { 
                    throw new TSError(`TSParametricEndPoints.constructor(): end points path [${m}]'${path}' did define an unamed query variable.`, errorOptions) ; 
                }
                else if (n !== n.ascii()) { 
                    throw new TSError(`TSParametricEndPoints.constructor(): end points path [${m}]'${path}' did define an an invalid ${name} variable.`, errorOptions) ; 
                }
                const q0 = def.query![name] ;
                const q = $isstring(q0) ? { type:q0 as TSParametricTokenType } : q0 as TSQueryItem ;
                newQuery[n.toLowerCase()] = q ;
            }) ;
            def.query = newQuery ; // can be an empty one
            this.endPoints[m as Verb] = def as TSParametricEndPoint ;
        }) ;

        this.caseInsensitive = caseInsensitive ;

        // ================= automat initialization ===============
        this.uri = '/' ;
        this.tokens = [] ;
        this.depth = 1 ;
        enum State { Start, Standard, Bracket, Token, TokenType } ;
        let state = State.Start ;
        let regString = '' ;
        let currentToken = '' ;
        let currentType = '' ;    
        let constructUri = true ;
    
        // ================= automated path analysis ===============
        for (let i = 0 ; i < len ; i++) {
            const c = path.charAt(i) ;
            //$logterm(`state = ${state}, char = "${c}"`) ;
            switch (state) {
                case State.Start:
                    if (c !== '/') { 
                        throw new TSError(`TSParametricEndPoints.constructor(): end points path '${path}' is not absolute.`, { position:i, ...errorOptions}) ; 
                    }
                    state = State.Standard ;
                    break ;
                case State.Standard:
                    switch (c) {
                        case '{': state = State.Bracket ; constructUri = false ; break ;
                        case '}': 
                            throw new TSError(`TSParametricEndPoints.constructor(): Misplaced '}' character in path '${path}'.`, { position:i, ...errorOptions}) ; 
                        case '/':
                            if (constructUri) { this.uri += c ; } else { regString += '\\/' ; }
                            this.depth++ ;
                            break ;
                        case '-': case '$': case '+': case '*': case '?': case '.': case '(':  case ')':
                            if (constructUri) { this.uri += c ; } else { regString += '\\'+c ; }
                            break ;
                        case '^': case '\\': case '[': case ']': case '`': case '|':
                            throw new TSError(`TSParametricEndPoints.constructor(): found forbidden character '\\u${c.charCodeAt(0).toHex4}' in path '${path}'.`, { 
                                position:i, 
                                character:c, 
                                ...errorOptions
                            }) ; 
                        default:
                            if (constructUri) { this.uri += caseInsensitive ? c.toLowerCase() : c ; }
                            else { regString += caseInsensitive ? c.toLowerCase() : c ; } 
                            break ;
                    }
                    break ;
                case State.Bracket:
                    if ((c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z')) { 
                        currentToken = c ; 
                        state = State.Token ; 
                        break ; 
                    }
                    throw new TSError(`TSParametricEndPoints.constructor(): found forbidden first character '\\u${c.charCodeAt(0).toHex4}' in parametric token in path '${path}'.`, { 
                        position:i, 
                        character:c, 
                        ...errorOptions
                    }) ; 
                case State.Token:
                    if ((c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z') || (c >= '0' && c <= '9') || c === '-' || c === '_' || c === '.') {
                        currentToken += c ; break ;
                    }
                    else if (c === ':') {
                        // we have a token type here.
                        state = State.TokenType ; 
                        currentType = '' ;
                        break ;
                    } 
                    else if (c === '}') {
                        // default token type is string
                        this.tokens.push({name:currentToken, type:TSParametricTokenType.string}) ;
                        regString += '([a-zA-Z][.a-zA-Z0-9_\-]*)' ;
                        currentToken = '' ;
                        currentType = '' ;
                        state = State.Standard ;
                        break ;
                    }
                    throw new TSError(`TSParametricEndPoints.constructor(): found forbidden character '\\u${c.charCodeAt(0).toHex4}' in parametric token in path '${path}'.`, { 
                        position:i, 
                        character:c, 
                        ...errorOptions
                    }) ; 
                case State.TokenType:
                    if ((c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z')) { 
                        currentType += c.toLowerCase() ;
                        break ;
                    }
                    else if (c === '}') {
                        if (Object.values(TSParametricTokenType).includes(currentType as TSParametricTokenType)) {
                            this.tokens.push({name:currentToken, type:currentType as TSParametricTokenType}) ;
                            regString += '([a-zA-Z][.a-zA-Z0-9_\-]*)' ;
                            currentToken = '' ;
                            currentType = '' ;
                            state = State.Standard ;
                            break ;    
                        }
                        throw new TSError(`TSParametricEndPoints.constructor(): found unknown type '${currentType}' of token '${currentToken}' in path '${path}'.`, { 
                            position:i, 
                            character:c, 
                            ...errorOptions
                        }) ; 
                    }

                    throw new TSError(`TSParametricEndPoints.constructor(): found forbidden first character '\\u${c.charCodeAt(0).toHex4}' in parametric type of token '${currentToken}' in path '${path}'.`, { 
                        position:i, 
                        character:c, 
                        ...errorOptions
                    }) ; 
            }
        }
        if (state !== State.Standard) { 
            throw new TSError(`TSParametricEndPoints.constructor(): malformed parametric path '${path}'.`, errorOptions) ; 
        }
        this._regex = regString.length === 0 ? null : (caseInsensitive?new RegExp('^'+regString+'$', 'i') : new RegExp('^'+regString+'$')) ; 
        this._tlen = this.tokens.length ;
    }
    
    public get static():boolean { return !$ok(this._regex) ; } 

    public async execute(req: TSServerRequest, res: ServerResponse):Promise<void> {
        const ep = this.endPoints[req.method] ;
        if (!$ok(ep)) { 
           throw new TSHttpError(`Method '${req.method}' not implemented on url '${req.url.pathname}'`, Resp.NotImplemented, {
             method:req.method,
             path:$length(req.url.pathname) ? req.url.pathname : '/'
           }) ; 
        }
        if ($ok(ep!.query)) { _calculateQuery(req, ep!.query!) ; }
        await ep!.manager(req, res) ; // QUESTION: this method may also throw, so get the stack in the info ?
    }

    // can return an empty string dictionary which means that our path is not parametric
    public parametersFromPath(path:string):TSParameterDictionary|null {
        if (this.caseInsensitive) { path = path.toLowerCase() ; }
        if (path.startsWith(this.uri)) {
            const rp = path.slice(this.uri.length) ;
            const ret:TSParameterDictionary = {}
            if (!rp.length && !$ok(this._regex)) { return ret ; }               
            else if (rp.length && $ok(this._regex)) {
                const m = rp.match(this._regex!) ;
                if ($ok(m)) {
                    if (m!.length === this._tlen + 1) {
                        for (let i = 0 ; i < this._tlen ; i++ ) {
                            const token = this.tokens[i] ;
                            const r = TSParametersConversions[token.type](m![i+1]) ;
                            if (!$ok(r)) {
                                throw new TSHttpError(`Bad parameter '${token.name}' of type '${token.type}' in url path '${path}'`, Resp.BadRequest, {
                                    token:token.name,
                                    type:token.type,
                                    path:path
                                  }) ; 
                            }
                            ret[token.name] = r! ;
                        }
                    }
                    return ret ;    
                }
            }
        }
        return null ;
    }
}

function _calculateQuery(req:TSServerRequest, qdef:TSParametricQueryDefinition) {
    let   query:TSQueryDictionary = {} ;

    req.url.searchParams.forEach((v,k) => { 
        k = $ftrim(k).toLowerCase() ; 
        if (!$length(k)) { 
            throw new TSHttpError(`Unamed query key for endpoint ${req.method} '${req.url.pathname}'`, Resp.BadRequest, {
            method:req.method,
            path:req.url.pathname
        }) ; }
        const queryItem = qdef[k] ; 
        if (!$ok(queryItem)) {
            throw new TSHttpError(`Unexpected query key '${k}' for endpoint ${req.method} '${req.url.pathname}'`, Resp.BadRequest, {
                method:req.method,
                path:req.url.pathname,
                queryKey:k
        }) ; }
        if ($length(v)) {
            const r = TSParametersConversions[queryItem!.type](v) ;
            if (!$ok(r)) {
                throw new TSHttpError(`Bad query value type for key '${k}' for endpoint ${req.method} '${req.url.pathname}'`, Resp.BadRequest, {
                    method:req.method,
                    path:req.url.pathname,
                    queryKey:k,
                    queryValue:v
                }) ; 
            }
            query[k] = r as TSQueryValue ;
        } 
    }) ;

    const possibleItems = $keys(qdef) as string[] ;
    possibleItems.forEach(qn => {
        if (qdef[qn].mandatory && !$ok(query[qn])) {
            throw new TSHttpError(`Mandatory query value for key '${qn}' is missing for endpoint ${req.method} '${req.url.pathname}'`, Resp.BadRequest, {
                method:req.method,
                path:req.url.pathname,
                queryKey:qn
        }) ; }
    }) ;

    req.query = query ;
}