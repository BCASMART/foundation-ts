import { Nullable, StringDictionary, StringEncoding, TSDataLike, TSDictionary, UINT8_MAX } from './types';
import { $isnumber, $isstring, $length, $ok, $isarray, $tounsigned, $string, $isunsigned, $ismethod } from './commons';
import { TSError, TSUniqueError } from './tserrors';
import { $jsonparse, $timeout } from './utils';
import { $ftrim } from './strings';
import { $encodeBase64 } from './data';
import { TSData } from './tsdata';
import { TSURL } from './tsurl';
import { $map } from './array';
import { $charset, TSCharset } from './tscharset';
import { $iscollection } from './tsobject'
import { $declareMethods } from "./object";


export function $basicauth(login:string, pwd:string, encoding?:Nullable<StringEncoding|TSCharset>) : string
{
    // if we have password with accents, we need to manage charset. Since the new RFC 7617
    // we should analyse WWW-Authenticate header returned by the server to know wich charset
    // to use but since 2018 all browsers will usually default to UTF-8 if a user enters non-ASCII characters 
    // for username or password. So our default is UTF8 (its also $charset() function default).

	return 'Basic ' + $encodeBase64(`${login}:${pwd}`, $charset(encoding)) ;
}

export function $barerauth(base64StringOrData:string|TSDataLike) : string
{
    // there's no charset in bareauth. Tokens are considered as ASCII strings
    const tok = $isstring(base64StringOrData) ? base64StringOrData : $encodeBase64(base64StringOrData) ;
	return `Bearer ${tok}` ;
}

// this method removes null or undefined values from a query
// if a query value is an array, a collection or a Set, it will be enumerated
export function $query(baseURL:string, query:TSDictionary) : string {
    let params = new URLSearchParams() ;
        
    for (let [key, value] of Object.entries(query)) {
        key = $ftrim(key) ;
        if (key.length && $ok(value)) {
            if ($iscollection(value)) { value = value.getItems() ; }
            if ($isarray(value) || value instanceof Set) { _appendUniqueQueryValues(params, key, value as Iterable<any>) ; }
            else { params.append(key, $string(value)) ; }
        }
    }

    const s = params.toString() ;
    return $length(s) ? baseURL + '?' + s : baseURL ;
}

function _appendUniqueQueryValues(params:URLSearchParams, key:string, values:Iterable<any>) {
    let uniques = new Set<string>() ; // we don't want to add the same value twice
    for (let v of values) {
        if ($ok(v)) { 
            v = $string(v) ; 
            if (!uniques.has(v)) {
                uniques.add(v) ;
                params.append(key, v) ; 
            }
        }
    }
}

export enum Resp {
	// info responses
	Continue = 100,
	SwitchingProtocol = 101,
	Processing = 103,

	// success responses
	OK = 200,
	Created = 201,
	Accepted = 202,
	NonAuthoritativeInformation = 203,
	NoContent = 204,
	ResetContent = 205,
	PartialContent = 206,
	MultiStatus = 207,
	AlreadyReported = 208,
	ContentDifferent = 210,
	IMUsed = 226,

	// redirections
	MultipleChoices = 300,
	Moved = 301,
	Found = 302,
	SeeOther = 303,
	NotModified = 304,
	UseProxy = 305,
	SwitchProxy = 306,
	TemporaryRedirect = 307,
	PermanentRedirect = 308,
	TooManyRedirects = 310,

	// client errors
	BadRequest = 400,
	Unauthorized = 401,
	PaymentRequired = 402,
	Forbidden = 403,
	NotFound = 404,
	NotAllowed = 405,
	NotAcceptable = 406,
	ProxyAuthenticationRequired = 407,
	TimeOut = 408,
	Conflict = 409,
	Gone = 410,
	LengthRequired = 411,
	PreconditionFailed = 412,
	TooLarge = 413,
	URITooLong = 414,
	UnsupportedMedia = 415,
	RequestedRangeUnsatisfiable = 416,
	ExpectationFailed = 417,
	TeaPot = 418,
	Misdirected = 421,
	Unprocessable = 422,
	Locked = 423,
	MethodFailure = 424,
	TooEarly = 425,
	UpgradeRequired = 426,
	PreconditionRequired = 428,
	TooManyRequests = 429,
	LegallyUnavailable = 451,
	Unrecoverable = 456,

	// server errors
	InternalError = 500,
	NotImplemented = 501,
	BadGateway = 502,
	Unavailable = 503,
	GatewayTimeOut = 504,
	NotSupported = 505,
	VariantAlsoNegotiates = 506,
	InsufficientStorage = 507,
	LoopDetected = 508,
	BandwidthLimitExceeded = 509,
	NotExtended = 510,
	NetworkAuthenticationRequired = 511	
}

export enum Verb {
	Get = 'GET',
	Post = 'POST',
	Put = 'PUT',
	Delete = 'DELETE',
	Patch = 'PATCH'
}

export enum RespType {
	Json = 'json',
    OptionalJson = 'json?',
	Buffer = 'arraybuffer',
	String = 'text',
	Stream = 'stream'
}


export const NO_BODY = undefined ;
export const NO_HEADERS = {} ;

export type TSRequestHeaders = { [key:string]: string | string[] | number } ;
export type TSResponseHeaders = Headers ;
export type TSRequestAuth = { login:string, password:string, encoding?:Nullable<StringEncoding|TSCharset> } ; // NOSONAR: optional

export type TSResponseType = Nullable<object | string | number | boolean | ReadableStream> ;
export interface TSResponse {
    status:Resp,
    response:TSResponseType,
    headers:TSResponseHeaders
    statusDescription?:string ;
} ;
export interface TSRequestOptions {
    headers?:Nullable<TSRequestHeaders> ;   // NOSONAR: optional
    timeout?:Nullable<number> ;             // NOSONAR: optional
    managesCredentials?:Nullable<boolean> ; // NOSONAR: optional
    auth?:Nullable<TSRequestAuth|string|TSDataLike> ; // NOSONAR: optional. if TSDataLike, we need to convert it to base64
}

export class TSRequest {
    public static readonly DefaultURL = 'http://localhost/' ;
	public token:string = '' ;
	public basicAuth:string = '' ;
	public defaultTimeOut = 1000 ;
    public commonHeaders:TSRequestHeaders={} ;

    private _baseURL:string = TSRequest.DefaultURL ;
    private _managesCredential:boolean = false ;

    public constructor(baseURL:string='', opts:TSRequestOptions = {}) {
        this.baseURL = baseURL ;
        this.commonHeaders= $ok(opts?.headers) ? _standardHeaders(opts.headers!) : {} ;
		
        if (opts.auth instanceof ArrayBuffer || opts.auth instanceof Uint8Array /* covers Buffer */ || opts.auth instanceof TSData || $isstring(opts.auth)) {
            this.setToken(opts.auth as TSDataLike | string) ;
        }
        else if ($isarray(opts.auth)) {
            for (let v of opts.auth as any[]) {
                if (!$isunsigned(v, UINT8_MAX)) {
                    TSError.throw('TSRequest.constructor(): malformed authentification token', { baseURL:baseURL, options:opts}) ;
                }
            } 
            this.setToken(opts.auth as TSDataLike) ;
        }
        else if ($ok(opts.auth)) {
            this.setAuth(opts.auth as TSRequestAuth) ;
        }

        if ($ok(opts.timeout) && opts.timeout! < 0) { 
            TSError.throw('TSRequest.constructor(): if set, timeout option should be positive', { baseURL:baseURL, options:opts}) ; 
        }
        
		const commonTimeout = $tounsigned(opts.timeout) ;
		if (commonTimeout > 0) { this.defaultTimeOut = commonTimeout ; }
        this._managesCredential = !!opts.managesCredentials ;
        this._baseURL = baseURL.length > 0 ? baseURL : TSRequest.DefaultURL ;
        // this._resetChannel() ;
	} 
    public get baseURL():string { return this._baseURL ; }
    public set baseURL(s:string) {
        if (!s.length) { s = TSRequest.DefaultURL ; }
        if (s !== this._baseURL) {
            this._baseURL = s ;
            // this._resetChannel() ;
        }
    } 

    public get managesCredential():boolean { return this._managesCredential ; }
    public set managesCredential(flag:boolean) {this._managesCredential = !!flag ; }

	public setAuth(auth?:Nullable<TSRequestAuth>) {
		if ($ok(auth) && $length(auth!.login)) {
			this.basicAuth = $basicauth(auth!.login, auth!.password, auth!.encoding) ;
		}
		else { 
			this.basicAuth = '' ;
		}
	}

    // if you pass a string it's a base64string. If you pass a data, it is converted to base64
	public setToken(token?:Nullable<string|TSDataLike>) {
		this.token = $length(token) ? $barerauth(token!) : '' ;
	}

    // we keep this method for backward compatibility
	public async request(
		relativeURL:string, 
		method?:Verb, 
		responseType?:RespType, 
		statuses:number[] = [200], 
		body?:Nullable<BodyInit|TSData|number|boolean|object>, 
		suplHeaders?:TSRequestHeaders,
		timeout?:number
	) : Promise<[TSResponseType, number]> 
    {
        const resp = await this.req(relativeURL, method, responseType, body, suplHeaders, timeout) ;
        return [statuses.includes(resp.status) ? resp.response : null, resp.status] ;
    }

	public async req(
		relativeURL:string, 
		method:Verb = Verb.Get, 
		responseType:RespType = RespType.Json, 
		body:Nullable<BodyInit|TSData|number|boolean|object>=null, 
		suplHeaders:TSRequestHeaders={},
		timeout?:number
	) : Promise<TSResponse> 
	{
        // commonHeaders is already normalised (done once, in the constructor) ;
        // suplHeaders is merged in raw and normalised in the single pass _finalHeaders()
        // already does — no need to normalise it a second time before merging. Object
        // spread still lets suplHeaders win over commonHeaders on the same header,
        // whatever casing either one used : _finalHeaders() normalises every key as it
        // writes into the result, so the later (suplHeaders) entry is what survives.
        const requestHeaders:StringDictionary = _finalHeaders({ ...this.commonHeaders, ...suplHeaders }) ;
        const config:RequestInit = {
            method:method,
            headers:requestHeaders,
            cache:"no-cache",
            redirect:"follow",
            keepalive:false
        } ;

        if (this.managesCredential) {
            config.credentials = 'include' ;
        }
		if ($length(this.token)) {
			requestHeaders!['Authorization'] = this.token! ;
		}
		else if ($length(this.basicAuth)) {
			requestHeaders!['Authorization'] = this.basicAuth! ;
		}
        const errorInfo = { 
            relativeURL:relativeURL, 
            method:method, 
            responseType:responseType, 
            body:body,
            suplHeaders:suplHeaders,
            timeout:timeout
        } ;
        let finalURL = TSURL.compose(this.baseURL, $string(relativeURL))?.href as Nullable<string> ;
        if (!$ok(finalURL)) {
            TSError.throw('TSRequest.req(): impossible to compose base URL and relativeURL', errorInfo) ; 
        }
        if ($length(finalURL) > 1 && finalURL?.endsWith('/')) { finalURL = finalURL.slice(0, -1) ; }

        _setRequestBody(config, requestHeaders, body, errorInfo) ;
        // checked before the network is used, like the other parameters (fetch() used to throw a TypeError)
        const upperMethod = $string(method).toUpperCase() ;
        if ($ok(config.body) && (upperMethod === Verb.Get || upperMethod === 'HEAD')) {
            TSError.throw(`TSRequest.req(): a ${upperMethod} request cannot have a body`, errorInfo) ;
        }

        if ($ok(timeout) && timeout < 0) { 
            TSError.throw('TSRequest.req(): if set, timeout parameter should be positive or 0', errorInfo) ; 
        }

		timeout = $tounsigned(timeout) ;
		if (!timeout) { timeout = this.defaultTimeOut ; }
		let ret = null ;
		let status = 0 ;
        let headers:TSResponseHeaders = new Headers() ;
        
        _maySetAccept(requestHeaders, responseType) ;
        _maySetHeader(requestHeaders, 'connection', 'close') ;

		const timeoutError = TSUniqueError.timeoutError() ;
		try {
			const resp = await $timeout(fetch(finalURL!, config), timeout, timeoutError) ;
            if ($ok(resp)) {
                const response:Response = resp ;
                status = response.status ;
                headers = response.headers ;
                ret = await _responseContent(response, responseType) ;
            }
		}
		catch (e:any) {
            ret = null ;
            status = _fetchErrorStatus(e, timeoutError) ; // throws e if this is not a known error
		}
		return { status:status, response:ret, headers:headers}  ;
	}

    // ============== private methods ======================
    /* private _resetChannel() {
        this._channel = axios.create({baseURL:this._baseURL, withCredentials:!!this._managesCredential}) ;
    } */

}

type RequestBodyValue = BodyInit|TSData|number|boolean|object ;

function _setRequestBody(config:RequestInit, requestHeaders:StringDictionary, body:Nullable<RequestBodyValue>, errorInfo:TSDictionary) {
    switch (typeof body) {
        case 'undefined': break ;
        case 'string': 
            // QUESTION: should we not JSON.stringify the string here ? Or do we consider in that case that the user should have done it before
            config.body = body ; 
            break ; 
        case 'number': 
        case 'boolean':
            config.body = JSON.stringify(body) ;
            _maySetContentType(requestHeaders, RequestBodyType.Json) ;        
            break ;
        case 'object':
            if (body !== null) { _setObjectRequestBody(config, requestHeaders, body) ; }
            break ;
        default:
            TSError.throw(`TSRequest.req(): impossible to send a ${typeof body} as a body`, errorInfo) ; 
    }
}

function _setObjectRequestBody(config:RequestInit, requestHeaders:StringDictionary, body:NonNullable<object>) {
    if (body instanceof TSData) { config.body = new Uint8Array(body.mutableBuffer) ; }
    else if (body instanceof FormData || body instanceof ArrayBuffer || ArrayBuffer.isView(body) || _isReadableStream(body) || body instanceof Blob) { config.body = body as BodyInit ; }
    else if (body instanceof URLSearchParams) { 
        config.body = body.toString() ;
        _maySetContentType(requestHeaders, RequestBodyType.UrlEncoded) ;
    } else {
        config.body = JSON.stringify(body) ;
        _maySetContentType(requestHeaders, RequestBodyType.Json) ;        
    }
}

// wa don't catch conversion errors because they should not occur and
// an occurence means a local error or a protocol discrepency between
// the server and the client
async function _responseContent(response:Response, responseType:RespType):Promise<TSResponseType> {
    switch (responseType) {
        case RespType.Buffer:
            return Buffer.from(await response.arrayBuffer()) ;
        case RespType.OptionalJson: {
            const text = $ftrim(await response.text());
            // here we consider that an empty body, meaning no body or a body with only whitespaces, 
            // is a valid response and we return null in that case
            return text.length ? $jsonparse(text) : null ;
        }
        case RespType.Json:
            return await response.json() ;
        case RespType.Stream:
            return response.body ;
        case RespType.String:
            return await response.text() ;
        default:
            return null ;
    }
}

// returns the status corresponding to a fetch error or throws the error
function _fetchErrorStatus(e:any, timeoutError:any):number {
    if (e === timeoutError) { return Resp.TimeOut ; }
    if ($isnumber(e?.statusCode)) { return e.statusCode ; }
    if ($isnumber(e?.status)) { return e.status ; }
    let code = (((e as TypeError)?.cause) as any)?.code ;
    if (!$length(code)) {
        code = $string(e?.code)
    }
    switch (code) {
        case 'ECONNREFUSED': 
        case 'DEPTH_ZERO_SELF_SIGNED_CERT':
            return Resp.Misdirected ; 
        case 'ECONNABORTED': case 'ETIMEDOUT': case 'ERR_PARSE_TIMEOUT':
            return Resp.TimeOut ;
        default:
            // all other errors must throw
            throw e ;
    }
}

function _maySetContentType(headers:StringDictionary, type:RequestBodyType){
    switch (type) {
        case RequestBodyType.Json:
            _maySetHeader(headers, 'Content-Type', 'application/json')
            break ;
        case RequestBodyType.UrlEncoded:
            _maySetHeader(headers, 'Content-Type', 'application/x-www-form-urlencoded')
            break ;
        default:
            break ;
    }
}

function _maySetAccept(headers:StringDictionary, type:RespType) {
    switch (type) {
        case RespType.Json:
            _maySetHeader(headers, 'Accept', 'application/json')
            break ;
        case RespType.String:
            _maySetHeader(headers, 'Accept', 'text/plain')
            break ;
        default:
            break ;
    }
}

// HTTP header names are plain ASCII tokens (RFC 7230) — .capitalize() (the
// Unicode letter/mark-aware routine, see C9) is real overkill here, and the
// same handful of names (Content-Type, Accept, Authorization, ...) recur on
// every single request, so a small cache turns every repeat into a lookup.
// Same contract as .capitalize() (only the first letter of each word — any
// run of letters right after a non-letter — is uppercased ; every other
// character, letter or not, is left exactly as given), just narrowed from
// Unicode letters to ASCII a-z/A-Z, which is all a header name can contain.
const _headerNameCache = new Map<string, string>() ;
function _capitalizeHeaderName(s:string):string {
    let ret = _headerNameCache.get(s) ;
    if ($ok(ret)) { return ret! ; }
    ret = '' ;
    let lastCharWasNotLetter = true ;
    for (let i = 0, n = s.length ; i < n ; i++) {
        const c = s[i] ;
        const code = s.codePointAt(i)! ;
        const isLetter = (code >= 0x41 && code <= 0x5a) || (code >= 0x61 && code <= 0x7a) ; // A-Z or a-z
        ret += (isLetter && lastCharWasNotLetter) ? c.toUpperCase() : c ;
        lastCharWasNotLetter = !isLetter ;
    }
    _headerNameCache.set(s, ret) ;
    return ret ;
}

function _maySetHeader(headers:StringDictionary, header:string, value:string) {
    header = _capitalizeHeaderName(header) ;
    if (!$length(headers[header]) && $length(value)) {
        headers[header] = value ;
    }
}

function _isReadableStream(v:NonNullable<any>):boolean {
    return $ismethod(v, 'pipe') && $ismethod(v, '_read') ;
}

function _finalHeaders(headers:Nullable<TSRequestHeaders>):StringDictionary {
    const entries = $ok(headers) ? Object.entries(headers!) : [] ;
    const ret:StringDictionary = {} ;
    for (let [key, value] of entries) {
        ret[_capitalizeHeaderName(key)] = $isarray(value) ? (value as Array<string|number>).join(', ') : `${value}` ;
    }
    return ret ;
}

function _standardHeaders(headers:Nullable<TSRequestHeaders>):TSRequestHeaders {
    const entries = $ok(headers) ? Object.entries(headers!) : [] ;
    const ret:TSRequestHeaders = {} ;
    for (let [key, value] of entries) {
        ret[_capitalizeHeaderName(key)] = $isarray(value) ? $map(value, i => `${i}`) : `${value}` ;
    }
    return ret ;
}
enum RequestBodyType {
    Json = 0,
    UrlEncoded
} ;

declare global {
    export interface URLSearchParams {
        query:(this: URLSearchParams) => StringDictionary | null;
    }
}

$declareMethods(URLSearchParams, {
    query(this: URLSearchParams): StringDictionary | null {
        const ret:StringDictionary = {} ;
        let total = 0 ;
        // a repeated key keeps its last value: TSServer end points use the query parser
        // definition instead, to get arrays and to refuse repeated scalar parameters
        for (const [key, value] of this) {
            if (key.length > 0) { ret[key] = value ; total ++ ; }
        }
        return total > 0 ? ret : null ;
    },
}) ;

export type TSMultipartEntry = string | Blob ;

/**
 * Generates a multipart/form-data body. Strings are sent as text fields, Blobs and Files 
 * as files, with their content unchanged. Like with a browser FormData, a File is sent 
 * with its name and a Blob with the name 'blob'. Other entries are skipped.
 * The request Content-Type should be `multipart/form-data; boundary=<boundary>`.
 * @returns the body bytes, or null if there is no entry to send
 */
export async function $generateMultiPartBody(dict:TSDictionary<TSMultipartEntry>, boundary:string):Promise<Uint8Array|null>
{
    const encoder = new TextEncoder() ;
    const parts:Uint8Array[] = [] ;
    for (const [key, value] of Object.entries(dict)) {
        if (!$isstring(value) && !(value instanceof Blob)) { continue ; } // File is a subclass of Blob
        parts.push(
            encoder.encode(_multipartHeaders(key, value, boundary)),
            // the blob content is sent unchanged (it used to be decoded as an UTF-8 text, which did corrupt binary files)
            $isstring(value) ? encoder.encode(value) : new Uint8Array(await value.arrayBuffer()), // NOSONAR: blobs read one by one in part order, parallel reads would gain nothing
            encoder.encode('\r\n')
        ) ;
    }
    if (!parts.length) { return null ; }
    parts.push(encoder.encode(`--${boundary}--\r\n`)) ;

    const ret = new Uint8Array(parts.reduce((n, p) => n + p.length, 0)) ;
    let offset = 0 ;
    for (const p of parts) { ret.set(p, offset) ; offset += p.length ; }
    return ret ;
}

/**
 * @deprecated for binary files: a string cannot hold them, use $generateMultiPartBody() instead.
 * Text fields and text files give the same body as $generateMultiPartBody().
 */
export async function $generateMultiPartBodyString(dict:TSDictionary<TSMultipartEntry>, boundary:string):Promise<string|null>
{
    const body = await $generateMultiPartBody(dict, boundary) ;
    return $ok(body) ? new TextDecoder().decode(body) : null ;
}

// a blob is sent as a file, with a file name: without it, it would be read as a text field
// (the file names used to be never sent)
function _multipartHeaders(key:string, value:TSMultipartEntry, boundary:string):string {
    let disposition = `Content-Disposition: form-data; name="${_multipartQuoted(key)}"` ;
    let type = 'text/plain' ;
    if (!$isstring(value)) {
        type = $length(value.type) ? value.type : 'application/octet-stream' ;
        const name = (value as any).name ;
        disposition += `; filename="${_multipartQuoted($isstring(name) ? name : 'blob')}"` ;
    }
    return `--${boundary}\r\n${disposition}\r\nContent-Type: ${type}\r\n\r\n` ;
}

// like browsers do (HTML standard): the quotes and line breaks of names are percent-encoded
function _multipartQuoted(s:string):string 
{ return s.replaceAll("\r", '%0D').replaceAll("\n", '%0A').replaceAll("\"", '%22') ; }
