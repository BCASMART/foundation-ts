import { ServerResponse } from "http" ; // NOSONAR: no 'node:' prefix for webpack 5

import { $defined, $isfunction, $isproperty, $isstring, $keys, $length, $ok, $string, $valueorundefine } from "./commons";
import { $ftrim } from "./strings";
import { TSCharset } from "./tscharset";
import { TSError } from "./tserrors";
import { TSLeafOptionalNode, TSNode, TSParser, TSParserOptions, isLeafParserType } from "./tsparser";
import { Resp, Verb } from "./tsrequest";
import { TSServerLogger, TSServerLogType } from "./tsserver";
import { TSEndPoint, TSEndPointController, TSEndPointsDefinitionDictionary, TSEndpointsDefinition, TSServerErrorCodes, TSServerRequest, TSServerResponse } from "./tsserver_types";
import { Nullable, TSDictionary } from "./types";
import { $inspect, $jsonparse, $logterm, $readStreamBuffer } from "./utils";

export class TSServerEndPoint {

    public readonly uri:string ;
    public readonly depth:number ; // measures the number of components of the path
    private readonly _logger: TSServerLogger|undefined;
    private readonly _managers:Map<Verb,TSServerEndPointManager> ;
    private readonly _pathRegex:RegExp|null ;
    private readonly _tokens:TSPathToken[] ;

    constructor (path: string, definition: TSEndpointsDefinition, logger?: TSServerLogger) {
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
            this._managers.set(m, new TSServerEndPointManager(m, ($isfunction(def[m]) ? { controller:def[m] } : def[m]) as TSEndPoint, errorOptions, logger)) ;
        }) ;

        // ========== path regex construction =========
        const parsed = new TSPathParser(path, errorOptions).parse() ;
        this.uri = parsed.uri ;
        this.depth = parsed.depth ;
        this._tokens = parsed.tokens ;
        this._pathRegex = parsed.regString.length === 0 ? null : new RegExp('^'+parsed.regString+'$', 'i') ; 
        this._logger = logger;
    }

    public get isStatic():boolean { return !$ok(this._pathRegex) ; } 

    public parametersFromPath(path:string):TSDictionary|null {
        if (!_startsWithUri(path, this.uri)) { return null ; }
        const parametricPart = path.slice(this.uri.length) ;
        // a static end point only matches its exact uri, a parametric one needs a parametric part
        if (!$ok(this._pathRegex)) { return parametricPart.length ? null : {} ; }
        if (!parametricPart.length) { return null ; }

        const m = this._pathRegex.exec(parametricPart) ;
        if (!$ok(m)) { return null ; }

        const ret:TSDictionary = {} ;
        if (m.length !== this._tokens.length + 1) { return ret ; }
        this._tokens.forEach((token, i) => {
            const value = m[i+1] ;
            if (!token.parser.validate(value)) {
                TSError.throw(`Bad parameter '${token.name}' of type '${token.parser.nodeType()}' in url path '${path}'`, Resp.BadRequest, {
                    token:token.name,
                    type:token.parser.nodeType(),
                    path:path,
                    serverError:TSServerErrorCodes.BadParameter
                  }) ; 
            }
            ret[token.name] = token.parser.rawInterpret(value) ;
        }) ;
        return ret ;
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
        if (logme) { await this._logger?.(TSServerLogType.Developer, manager.developerDesc(req.url.pathname), undefined, req.message); }
        await manager!.execute(req, res, logme) ;
    }

}

export interface TSEndPointRoute {
    endPoint:TSServerEndPoint ;
    parameters:TSDictionary ;
}

// Groups endpoints by their literal uri prefix (the part of the path before the
// first {token}, or the whole path for a static endpoint) and records each
// endpoint's registration rank, once, at construction — so route() only runs
// parametersFromPath() (a regex match, for parametric endpoints) against
// endpoints sharing a uri prefix the requested path actually starts with,
// instead of against every registered endpoint on every request.
//
// Ties (several endpoints match at the same depth — e.g. a static '/a/b' and a
// parametric '/a/{id}' can both match '/a/b') resolve by earliest registration,
// exactly like a plain "test every endpoint, keep the first one to reach the
// max depth" linear scan would — spelled out explicitly here (deepest match
// wins, lowest registration rank wins a depth tie) so it stays correct
// regardless of the order uri prefixes happen to be visited in.
export class TSEndPointRouter {
    private readonly _endPointsByUri = new Map<string, TSServerEndPoint[]>() ;
    private readonly _uriPrefixes:string[] = [] ;
    private readonly _endPointIndex = new Map<TSServerEndPoint, number>() ;

    constructor(endPoints:TSServerEndPoint[]) {
        endPoints.forEach((ep, index) => {
            this._endPointIndex.set(ep, index) ;
            const bucket = this._endPointsByUri.get(ep.uri) ;
            if ($ok(bucket)) { bucket!.push(ep) ; }
            else { this._endPointsByUri.set(ep.uri, [ep]) ; }
        }) ;
        this._uriPrefixes = Array.from(this._endPointsByUri.keys()) ;
    }

    public route(pathname:string):TSEndPointRoute|undefined {
        let sep:TSServerEndPoint|undefined = undefined ;
        let sepIndex = -1 ;
        let parameters:TSDictionary = {} ;

        for (let uri of this._uriPrefixes) {
            if (!_startsWithUri(pathname, uri)) { continue ; }
            for (let ep of this._endPointsByUri.get(uri)!) {
                const params = ep.parametersFromPath(pathname) ;
                if (!$ok(params)) { continue ; }
                const index = this._endPointIndex.get(ep)! ;
                if (!sep || sep.depth < ep.depth || (sep.depth === ep.depth && index < sepIndex)) {
                    sep = ep ;
                    sepIndex = index ;
                    parameters = params! ;
                }
            }
        }
        return $ok(sep) ? { endPoint:sep!, parameters:parameters } : undefined ;
    }
}

class TSServerEndPointManager {
    private readonly _method:Verb ;
    private readonly _controller: TSEndPointController ;
    private readonly _queryParser?:TSParser ;
    private readonly _bodyParser?:TSParser ;
    private readonly _responseParser?:TSParser ;
    private readonly _context:TSDictionary|undefined ;
    private readonly _logger: TSServerLogger|undefined;

    static readonly __textMimes = [
        'application/json',
        'application/calendar+xml', 
        'application/gml+xml', 
        'application/javascript', 
        'application/xhtml+xml',
        'application/x-latex'
    ] ;

    constructor(m:Verb, ep:TSEndPoint, errorOptions:TSServerEndPointErrorOptions, logger?: TSServerLogger) {
        if (!$isfunction(ep.controller)) {
            TSError.throw(`TSServerEndPointManager.constructor() : end points path '${errorOptions.path}' has no valid controller function.`, errorOptions) ; 
        }

        this._queryParser    = _defineParser(ep.query, 'query', errorOptions) ;
        this._bodyParser     = _defineParser(ep.body, 'body', errorOptions) ;
        this._responseParser = _defineParser(ep.response, 'response', errorOptions) ;
        this._controller = ep.controller ;
        this._method = m ;
        this._context = $valueorundefine(ep.context) ;
        this._logger = logger;
    }

    public developerDesc(msg:string):string { return `${this._method}:${$string(msg)} [queryParser:${$ok(this._queryParser)}, bodyParser:${$ok(this._bodyParser)}, responseParser:${$ok(this._responseParser)}]` ; }
    
    public async execute(req: TSServerRequest, res: ServerResponse, logme?:boolean):Promise<void> {
        if ($ok(this._queryParser)) { await this._parseQuery(this._queryParser, req, logme) ; }
        if ($ok(this._bodyParser)) { await this._parseBody(this._bodyParser, req, logme) ; }

        await this._debug(logme, req, 'calling internal controller') ; 
        await this._controller(req, new TSServerResponse(res, this._responseParser), this._context) ; // QUESTION: this method may also throw, so get the stack in the info ?
        await this._debug(logme, req, 'resumed from internal controller') ;
    }

    private async _parseQuery(parser:TSParser, req: TSServerRequest, logme?:boolean) {
        const options:TSParserOptions = { errors:[], context:'url' } ;
        const params = _queryParameters(req.url.searchParams, parser, options.errors!) ;
        await this._debug(logme, req, 'request query', params) ;
        if (options.errors!.length > 0 || !parser.validate(params, options)) {
            await this._debug(logme, req, 'impossible to validate query') ;
            this._throwBadRequest(req, `Bad query for ${this._method} request on url '${req.url.pathname}'`, TSServerErrorCodes.BadQueryStructure, options.errors) ;
        }
        req.query = parser.rawInterpret(params) ;
        await this._debug(logme, req, 'final interpreted query', req.query) ;
    }

    private async _parseBody(parser:TSParser, req: TSServerRequest, logme?:boolean) {
        const buffer = await $readStreamBuffer(req.message) ;
        const options:TSParserOptions = { errors:[] } ;
        await this._debug(logme, req, 'request body', buffer) ;

        // an empty body is an absent body (it used to be decoded, so that a missing JSON body gave a bad JSON error)
        if (!$length(buffer)) {
            if (parser.mandatory) {
                await this._debug(logme, req, 'missing body content') ;
                this._throwBadRequest(req, `No body content for ${this._method} request on url '${req.url.pathname}'`, TSServerErrorCodes.MissingBody) ;
            }
            req.body = undefined ;
            return ;
        }
            
        const mtype = $ftrim(req.message.headers['content-type']).toLowerCase() ;
        await this._debug(logme, req, 'MIME type', mtype) ;
        if (mtype.length === 0) {
            await this._debug(logme, req, 'bad MIME type') ;
            this._throwBadRequest(req, `No mime type specifies for body of ${this._method} request on url '${req.url.pathname}'`, TSServerErrorCodes.MissingMimeType) ;
        }

        const body = await this._decodedBody(buffer, mtype, options, req, logme) ;
        if (!parser.validate(body, options)) {
            await this._debug(logme, req, 'impossible to validate body') ;
            this._throwBadRequest(req, `Bad body content for ${this._method} request on url '${req.url.pathname}'`, TSServerErrorCodes.BadBodyStructure, options.errors) ;
        }
        req.body = parser.rawInterpret(body) ;
        await this._debug(logme, req, 'final intepreted body', req.body) ;
    }

    // text bodies are decoded as UTF8 strings and JSON bodies are parsed (which sets the parser context to json)
    private async _decodedBody(buffer:any, mtype:string, options:TSParserOptions, req: TSServerRequest, logme:boolean = false):Promise<any> { 
        if (!mtype.startsWith('text/') && !TSServerEndPointManager.__textMimes.includes(mtype)) { return buffer ; }

        // we have a string. we consider only UTF8 charsets
        await this._debug(logme, req, 'text type', true) ;
        const text = TSCharset.utf8Charset().stringFromBytes(buffer) ;
        if (mtype !== 'application/json') { return text ; }

        await this._debug(logme, req, 'json type', true) ;
        options.context = 'json' ;
        const json = $jsonparse(text) ;
        if (!$defined(json)) { 
            await this._debug(logme, req, 'impossible to decode JSON body') ;
            this._throwBadRequest(req, `Unable to parse JSON body of ${this._method} request on url '${req.url.pathname}'`, TSServerErrorCodes.BadJSONBody) ;
        }
        await this._debug(logme, req, 'json decoded body', json) ;
        return json ;
    }

    private _throwBadRequest(req: TSServerRequest, message:string, serverError:TSServerErrorCodes, errors?:Nullable<string[]>):never {
        TSError.throw(message, Resp.BadRequest, {
            method:this._method,
            path:$length(req.url.pathname) ? req.url.pathname : '/',
            ...(errors !== undefined ? { errors:errors } : {}),
            serverError:serverError
        }) ;
    }

    private async _debug(logme:Nullable<boolean>, req: TSServerRequest, item:string, value: any = undefined) {
        if (logme) { await this._logme(req, item, value) ; }
    }

    private async _logme(req: TSServerRequest, item:string, value: any = undefined) {
        if ($isfunction(this._logger)) {
            const message = item + ($ok(value) ? `: ${$inspect(value)}`: "");
            await this._logger?.(TSServerLogType.Developer, message, undefined, req.message)
        } else {
            _logme(req, item, value);
        }
    }
}

enum TSPathParserState { Start, Standard, Bracket, Token, TokenType }

// parses an end point path like '/a/b/{id:int}/{name}' in its static uri ('/a/b/'), 
// its depth, its parametric tokens and the regular expression of its parametric part
class TSPathParser {
    public uri = '/' ;
    public depth = 1 ;
    public tokens:TSPathToken[] = [] ;
    public regString = '' ;

    private _state = TSPathParserState.Start ;
    private _constructUri = true ;
    private _currentToken = '' ;
    private _currentType = '' ;

    public constructor(private readonly _path:string, private readonly _errorOptions:TSServerEndPointErrorOptions) {}

    public parse():this {
        const len = this._path.length ;
        for (let i = 0 ; i < len ; i++) {
            const c = this._path.charAt(i) ;
            switch (this._state) {
                case TSPathParserState.Start:     this._start(c, i) ; break ;
                case TSPathParserState.Standard:  this._standard(c, i) ; break ;
                case TSPathParserState.Bracket:   this._bracket(c, i) ; break ;
                case TSPathParserState.Token:     this._token(c, i) ; break ;
                case TSPathParserState.TokenType: this._tokenType(c, i) ; break ;
            }
        }
        if (this._state !== TSPathParserState.Standard) { 
            TSError.throw(`TSServerEndPoint.constructor(): malformed parametric path '${this._path}'.`, this._errorOptions) ; 
        }
        return this ;
    }

    private _start(c:string, i:number) {
        if (c !== '/') { 
            TSError.throw(`TSServerEndPoint.constructor(): end points path '${this._path}' is not absolute.`, { position:i, ...this._errorOptions}) ; 
        }
        this._state = TSPathParserState.Standard ;
    }

    private _standard(c:string, i:number) {
        switch (c) {
            case '{': 
                this._state = TSPathParserState.Bracket ; 
                this._constructUri = false ; 
                break ;
            case '}':
                return TSError.throw(`TSServerEndPoint.constructor(): Misplaced '}' character in path '${this._path}'.`, { position:i, ...this._errorOptions}) ; 
            case '/':
                this._append(c, String.raw`\/`) ;
                this.depth++ ;
                break ;
            case '-': case '$': case '+': case '*': case '?': case '.': case '(':  case ')':
                this._append(c, '\\'+c) ;
                break ;
            case '^': case '\\': case '[': case ']': case '`': case '|':
                return this._throwForbidden(String.raw`found forbidden character '\u${_hex(c)}' in path '${this._path}'.`, c, i) ;
            default:
                this._append(c.toLowerCase(), c) ;
                break ;                                
        }
    }

    // the static part of the path goes in the uri, the parametric part goes in the regular expression
    private _append(uriPart:string, regPart:string) {
        if (this._constructUri) { this.uri += uriPart ; } 
        else { this.regString += regPart ; }
    }

    private _bracket(c:string, i:number) {
        if (!_isLetter(c)) {
            this._throwForbidden(String.raw`found forbidden first character '\u${_hex(c)}' in parametric token in path '${this._path}'.`, c, i) ;
        }
        this._currentToken = c ; 
        this._state = TSPathParserState.Token ; 
    }

    private _token(c:string, i:number) {
        if (_isLetter(c) || (c >= '0' && c <= '9') || c === '-' || c === '_' || c === '.') { this._currentToken += c ; }
        else if (c === ':') {
            // we have a token type here.
            this._state = TSPathParserState.TokenType ; 
            this._currentType = '' ;
        } 
        else if (c === '}') { this._pushToken('string') ; } // default token type is string
        else {
            this._throwForbidden(String.raw`found forbidden character '\u${_hex(c)}' in parametric token in path '${this._path}'.`, c, i) ;
        }
    }

    private _tokenType(c:string, i:number) {
        // a type name starts with a letter and may then contain digits (eg. uint32)
        if (_isLetter(c) || (this._currentType.length > 0 && c >= '0' && c <= '9')) { 
            this._currentType += c.toLowerCase() ;
            return ;
        }
        if (c !== '}') {
            const which = this._currentType.length ? 'character' : 'first character' ;
            this._throwForbidden(String.raw`found forbidden ${which} '\u${_hex(c)}' in parametric type of token '${this._currentToken}' in path '${this._path}'.`, c, i) ;
        }
        if (!isLeafParserType(this._currentType)) {
            this._throwForbidden(`found unknown type '${this._currentType}' of token '${this._currentToken}' in path '${this._path}'.`, c, i) ;
        }
        this._pushToken(this._currentType as TSLeafOptionalNode) ;
    }

    private _pushToken(type:TSLeafOptionalNode) {
        this.tokens.push({ name:this._currentToken, parser:TSParser.define(type)! }) ;
        this.regString += '([a-zA-Z0-9][.a-zA-Z0-9_-]*)' ;
        this._currentToken = '' ;
        this._currentType = '' ;
        this._state = TSPathParserState.Standard ;
    }

    private _throwForbidden(message:string, c:string, i:number):never {
        TSError.throw(`TSServerEndPoint.constructor(): ${message}`, { 
            position:i, 
            character:c, 
            ...this._errorOptions
        }) ; 
    }
}

// The values of a key declared as an array in the query parser are always given as an array.
// Any other key keeps its unique value: a repeated key declared as a non array is an error
// (an undeclared repeated key, accepted as an unchecked item, is given as an array).
function _queryParameters(searchParams:URLSearchParams, parser:TSParser, errors:string[]):TSDictionary|null {
    const ret:TSDictionary = {} ;
    let total = 0 ;
    for (const key of new Set(searchParams.keys())) {
        if (!key.length) { continue ; }
        const values = searchParams.getAll(key) ;
        const itemParser = parser.itemParserForKey(key) ;
        if (itemParser?.nodeType() === 'array' || (values.length > 1 && !$ok(itemParser))) { ret[key] = values ; }
        else if (values.length > 1) { errors.push(`value.${key} is present several times.`) ; }
        else { ret[key] = values[0] ; }
        total++ ;
    }
    return total > 0 ? ret : null ;
}

// the static part of an end point path (its uri) is stored in lowercase, so it is compared without
// case, like its parametric part (it used to be compared with the original case of the request, so
// an end point declared as '/Echo' was not found with the request path '/Echo')
function _startsWithUri(path:string, uri:string):boolean 
{ return path.length >= uri.length && path.slice(0, uri.length).toLowerCase() === uri ; }

function _isLetter(c:string):boolean { return (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z') ; }
function _hex(c:string):string { return c.codePointAt(0)!.toHex4() ; }

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
        const parser = TSParser.define(node, errors) ;
        // a root leaf node with an unknown type gives an invalid parser (it used to be accepted)
        if (!parser?.isValid) {
            TSError.throw(`TSServerEndPointManager.constructor() : end points path '${errorOptions.path}' has invalid ${instanceVar} definition.`, 
                              { parserErrors:[...errors, ...(parser?.errors ?? [])], ...errorOptions}) ; 
        }
        return parser ;
    }
    return undefined ;
}

function _logme(_:TSServerRequest, item:string, value:any = undefined) {
    const is = $isstring(value) ;
    const lineReturn = $ok(value) ? '\n' : '';
    $logterm(`&0&xfoundation-ts[&pDEBUG&x]-${item}:&0${is?' "':lineReturn}&y${$inspect(value)}${is?'&x"':''}&0`) ;
}