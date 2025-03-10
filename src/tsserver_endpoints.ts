import { Nullable, TSDictionary } from "./types";
import { $isfunction, $isproperty, $isstring, $keys, $length, $ok, $string, $valueorundefine } from "./commons";
import { $ftrim } from "./strings";
import { TSError } from "./tserrors";
import { TSLeafOptionalNode, TSNode, TSParser, TSParserOptions, isLeafParserType } from "./tsparser";
import { Resp, Verb } from "./tsrequest";
import { TSEndPoint, TSEndPointController, TSEndPointsDefinitionDictionary, TSEndpointsDefinition, TSServerErrorCodes, TSServerRequest, TSServerResponse } from "./tsserver_types";
import { $inspect, $logterm, $readStreamBuffer } from "./utils";
import { TSCharset } from "./tscharset";
import { ServerResponse } from "http" ;

export class TSServerEndPoint {

    public readonly uri:string ;
    public readonly depth:number ; // measures the number of components of the path

    private _managers:Map<Verb,TSServerEndPointManager> ;
    private _pathRegex:RegExp|null ;
    private _tokens:TSPathToken[] ;

    constructor (path:string, definition:TSEndpointsDefinition|TSEndPoint|TSEndPointController) {
        path = $ftrim(path) ;
        const len = path.length ;
        if ($isfunction(definition)) { definition = { GET: { controller:definition } as TSEndPoint } as TSEndpointsDefinition ; }
        else if ($isproperty(definition, 'controller')) { definition = { GET:definition as TSEndPoint} as TSEndpointsDefinition ; }

        const def = definition as TSEndPointsDefinitionDictionary ;
        const errorOptions = { path:path, definition:def } ;

        if (len < 2) { 
            TSError.throw(`TSServerEndPoint.constructor(): end points path '${path}' is too short`, errorOptions) ; 
        }
        // ========== final end points construction =========
        const methods = $keys(def) as Verb[] ;
        if (methods.length === 0) { 
            TSError.throw(`TSServerEndPoint.constructor() : end points path '${path}' has no method defined.`, errorOptions) ; 
        }

        this._managers = new Map<Verb, TSServerEndPointManager>() ;
        methods.forEach(m => {
            if (!Object.values(Verb).includes(m)) {
                TSError.throw(`TSServerEndPoint.constructor() : end points path '${path}' did define invalid '${m}' request method.`, errorOptions) ; 
            }
            this._managers.set(m, new TSServerEndPointManager(m, ($isfunction(def[m]) ? { controller:def[m] } : def[m]) as TSEndPoint, errorOptions)) ;
        }) ;

        // ========== path regex construction =========
        this.uri = '/' ;
        this._tokens = [] ;
        this.depth = 1 ;
        enum State { Start, Standard, Bracket, Token, TokenType } ;
        let state = State.Start ;
        let constructUri = true ;
        let regString = '' ;
        let currentToken = '' ;
        let currentType = '' ;    

        for (let i = 0 ; i < len ; i++) {
            const c = path.charAt(i) ;
            switch (state) {
                case State.Start:
                    if (c !== '/') { 
                        TSError.throw(`TSServerEndPoint.constructor(): end points path '${path}' is not absolute.`, { position:i, ...errorOptions}) ; 
                    }
                    state = State.Standard ;
                    break ;
                case State.Standard:
                    switch (c) {
                        case '{': state = State.Bracket ; constructUri = false ; break ;
                        case '}': 
                            TSError.throw(`TSServerEndPoint.constructor(): Misplaced '}' character in path '${path}'.`, { position:i, ...errorOptions}) ; 
                        case '/':
                            if (constructUri) { this.uri += c ; } else { regString += '\\/' ; }
                            this.depth++ ;
                            break ;
                        case '-': case '$': case '+': case '*': case '?': case '.': case '(':  case ')':
                            if (constructUri) { this.uri += c ; } else { regString += '\\'+c ; }
                            break ;
                        case '^': case '\\': case '[': case ']': case '`': case '|':
                            TSError.throw(`TSServerEndPoint.constructor(): found forbidden character '\\u${c.charCodeAt(0).toHex4}' in path '${path}'.`, { 
                                position:i, 
                                character:c, 
                                ...errorOptions
                            }) ; 
                        default:
                            if (constructUri) { this.uri += c.toLowerCase() ; }
                            else { regString += c ; } 
                            break ;                                
                    }
                    break ;
                case State.Bracket:
                    if ((c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z')) { 
                        currentToken = c ; 
                        state = State.Token ; 
                        break ; 
                    }
                    TSError.throw(`TSServerEndPoint.constructor(): found forbidden first character '\\u${c.charCodeAt(0).toHex4}' in parametric token in path '${path}'.`, { 
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
                        this._tokens.push({ name:currentToken, parser:TSParser.define('string')! }) ;
                        regString += '([a-zA-Z0-9][.a-zA-Z0-9_\-]*)' ;
                        currentToken = '' ;
                        currentType = '' ;
                        state = State.Standard ;
                        break ;
                    }
                    TSError.throw(`TSServerEndPoint.constructor(): found forbidden character '\\u${c.charCodeAt(0).toHex4}' in parametric token in path '${path}'.`, { 
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
                        if (isLeafParserType(currentType)) {
                            this._tokens.push({name:currentToken, parser:TSParser.define(currentType as TSLeafOptionalNode)!}) ;
                            regString += '([a-zA-Z0-9][.a-zA-Z0-9_\-]*)' ;
                            currentToken = '' ;
                            currentType = '' ;
                            state = State.Standard ;
                            break ;    
                        }
                        TSError.throw(`TSServerEndPoint.constructor(): found unknown type '${currentType}' of token '${currentToken}' in path '${path}'.`, { 
                            position:i, 
                            character:c, 
                            ...errorOptions
                        }) ; 
                    }

                    TSError.throw(`TSServerEndPoint.constructor(): found forbidden first character '\\u${c.charCodeAt(0).toHex4}' in parametric type of token '${currentToken}' in path '${path}'.`, { 
                        position:i, 
                        character:c, 
                        ...errorOptions
                    }) ; 
            }
        }
        if (state !== State.Standard) { 
            TSError.throw(`TSServerEndPoint.constructor(): malformed parametric path '${path}'.`, errorOptions) ; 
        }
        this._pathRegex = regString.length === 0 ? null : new RegExp('^'+regString+'$', 'i') ; 
    }

    public get isStatic():boolean { return !$ok(this._pathRegex) ; } 

    public parametersFromPath(path:string):TSDictionary|null {
        if (path.startsWith(this.uri)) {
            const parametricPart = path.slice(this.uri.length) ;
            const ret:TSDictionary = {} ;
            if (!parametricPart.length && !$ok(this._pathRegex)) { return ret ; }               
            else if (parametricPart.length && $ok(this._pathRegex)) {
                const m = parametricPart.match(this._pathRegex!) ;
                if ($ok(m)) {
                    const len = this._tokens.length ;
                    if (m!.length === len + 1) {
                        for (let i = 0 ; i < len ; i++ ) {
                            const token = this._tokens[i] ;
                            const value = m![i+1] ;
                            if (!token.parser.validate(value)) {
                                TSError.throw(`Bad parameter '${token.name}' of type '${token.parser.nodeType}' in url path '${path}'`, Resp.BadRequest, {
                                    token:token.name,
                                    type:token.parser.nodeType,
                                    path:path,
                                    serverError:TSServerErrorCodes.BadParameter
                                  }) ; 
                            }
                            ret[token.name] = token.parser.rawInterpret(value) ;
                        }
                    }
                    return ret ;
                }
            }
        }
        return null ;
    }

    public async execute(req: TSServerRequest, res: ServerResponse, logme?:boolean):Promise<void> {
        const manager = this._managers.get(req.method) ;
        if (!$ok(manager)) { 
           TSError.throw(`Method '${req.method}' not implemented on url '${req.url.pathname}'`, Resp.NotImplemented, {
             method:req.method,
             path:$length(req.url.pathname) ? req.url.pathname : '/',
             serverError:TSServerErrorCodes.MethodNotImplemented
            }) ; 
        }
        if (!!logme) { _logme(req, 'will execute manager', manager?.developerDesc(req.url.pathname)) ; }
        await manager!.execute(req, res, logme) ;
    }

}

class TSServerEndPointManager {
    private _method:Verb ;
    private _controller: TSEndPointController ;
    private _queryParser?:TSParser ;
    private _bodyParser?:TSParser ;
    private _responseParser?:TSParser ;
    private _context:TSDictionary|undefined ;

    static __textMimes = [
        'application/json',
        'application/calendar+xml', 
        'application/gml+xml', 
        'application/javascript', 
        'application/xhtml+xml',
        'application/x-latex'
    ] ;

    constructor(m:Verb, ep:TSEndPoint, errorOptions:TSServerEndPointErrorOptions) {
        
        this._queryParser    = _defineParser(ep.query, 'query', errorOptions) ;
        this._bodyParser     = _defineParser(ep.body, 'body', errorOptions) ;
        this._responseParser = _defineParser(ep.response, 'response', errorOptions) ;
        
        if (!$isfunction(ep.controller)) {
            TSError.throw(`TSServerEndPointManager.constructor() : end points path '${errorOptions.path}' has no valid controller function.`, errorOptions) ; 
        }

        this._controller = ep.controller ;
        this._method = m ;
        this._context = $valueorundefine(ep.context) ;
    }

    public developerDesc(msg:string):string { return `${this._method}:${$string(msg)} [queryParser:${_yesNo(this._queryParser)}, bodyParser:${_yesNo(this._bodyParser)}, responseParser:${_yesNo(this._responseParser)}]` ; }
    
    public async execute(req: TSServerRequest, res: ServerResponse, logme?:boolean):Promise<void> {

        if ($ok(this._queryParser)) {
            const params = req.url.searchParams.query() ;
            const options:TSParserOptions = { errors:[], context:'url' } ;
            if (!!logme) {
                _logme(req, 'request query', params) ;                
                _logme(req, 'request headers', params) ;
            }                

            if (!this._queryParser!.validate(params, options)) {
                if (!!logme) { _logme(req, 'impossible to validate query') ; }                
                TSError.throw(`Bad query for ${this._method} request on url '${req.url.pathname}'`, Resp.BadRequest, {
                    method:this._method,
                    path:$length(req.url.pathname) ? req.url.pathname : '/',
                    errors:options.errors,
                    serverError:TSServerErrorCodes.BadQueryStructure
                }) ; 
            }
            req.query = this._queryParser!.rawInterpret(params) ;
            if (!!logme) { _logme(req, 'final interpreted query', req.query) ; }                
        }
        if ($ok(this._bodyParser)) {
            let body:any = await $readStreamBuffer(req.message) ;
            const options:TSParserOptions = { errors:[] } ;

            if (!!logme) { _logme(req, 'request body', body) ; }                

            if (!$ok(body) && this._bodyParser!.mandatory) {
                if (!!logme) { _logme(req, 'missing body content') ; }                
                TSError.throw(`No body content for ${this._method} request on url '${req.url.pathname}'`, Resp.BadRequest, {
                    method:this._method,
                    path:$length(req.url.pathname) ? req.url.pathname : '/',
                    serverError:TSServerErrorCodes.MissingBody
                }) ;
            } ;
            
            const mtype = $ftrim(req.message.headers['content-type']).toLowerCase() ;
            if (!!logme) { _logme(req, 'MIME type', mtype) ; }                

            if (!mtype.length) {
                if (!!logme) { _logme(req, 'bad MIME type') ; }                
                TSError.throw(`No mime type specifies for body of ${this._method} request on url '${req.url.pathname}'`, Resp.BadRequest, {
                    method:this._method,
                    path:$length(req.url.pathname) ? req.url.pathname : '/',
                    serverError:TSServerErrorCodes.MissingMimeType
                }) ;
            }
            

            if (mtype.startsWith('text/') || TSServerEndPointManager.__textMimes.includes(mtype)) {
                // we have a string. we consider only UTF8 charsets
                if (!!logme) { _logme(req, 'text type', true) ; }                
                body = TSCharset.utf8Charset().stringFromBytes(body) ;
                if (mtype === 'application/json') {
                    if (!!logme) { _logme(req, 'json type', true) ; }                
                    options.context = 'json' ;
                    try { body = JSON.parse(body) ; }
                    catch (e) { 
                        if (!!logme) { _logme(req, 'impossible to decode JSON body') ; }                
                        TSError.throw(`Unable to parse JSON body of ${this._method} request on url '${req.url.pathname}'`, Resp.BadRequest, {
                            method:this._method,
                            path:$length(req.url.pathname) ? req.url.pathname : '/',
                            parsingError:e,
                            serverError:TSServerErrorCodes.BadJSONBody
                        }) ;
                    }
                    if (!!logme) { _logme(req, 'json decoded body', body) ; }               
                }
            }
            if (!this._bodyParser!.validate(body, options)) {
                if (!!logme) { _logme(req, 'impossible to validate body') ; }                
                TSError.throw(`Bad body content for ${this._method} request on url '${req.url.pathname}'`, Resp.BadRequest, {
                    method:this._method,
                    path:$length(req.url.pathname) ? req.url.pathname : '/',
                    errors:options.errors,
                    serverError:TSServerErrorCodes.BadBodyStructure
                }) ; 
            }
            req.body = this._bodyParser!.rawInterpret(body) ;
            if (!!logme) { _logme(req, 'final intepreted body', req.body) ; }                
        }

        if (!!logme) { _logme(req, 'calling internal controller') ; }                
        await this._controller(req, new TSServerResponse(res, this._responseParser), this._context) ; // QUESTION: this method may also throw, so get the stack in the info ?
        if (!!logme) { _logme(req, 'resumed from internal controller') ; }                
    }

}

                                   
interface TSPathToken {
    name:string ;
    parser:TSParser ;
}

interface TSServerEndPointErrorOptions {
    path:string ;
    definition:TSEndpointsDefinition ;
}

function _defineParser(node:Nullable<TSNode>, instanceVar:string, errorOptions:TSServerEndPointErrorOptions):TSParser|undefined {
    if ($ok(node)) {
        const errors:string[] = []
        const parser = TSParser.define(node!, errors) ;
        if (!$ok(parser)) {
            TSError.throw(`TSServerEndPointManager.constructor() : end points path '${errorOptions.path}' has invalid ${instanceVar} definition.`, 
                              { parserErrors:errors, ...errorOptions}) ; 

        }
        return parser! ;
    }
    return undefined ;
}
function _yesNo(v:any):boolean { return $ok(v)?true:false ; }
function _logme(_:TSServerRequest, item:string, value:any = undefined) {
    const is = $isstring(value) ;
    const ok = $ok(value) ;
    $logterm(`&0&xfoundation-ts[&pDEBUG&x]-${item}:&0${is?' "':(ok?'\n':' ')}&y${$inspect(value)}${is?'&x"':''}&0`) ;
}
