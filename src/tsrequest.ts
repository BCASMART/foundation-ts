import { Nullable, StringDictionary, StringEncoding, TSDataLike, TSDictionary, UINT8_MAX } from './types';
import { $isnumber, $isstring, $length, $ok, $isarray, $tounsigned, $string, $isunsigned, $ismethod } from './commons';
import { TSError, TSUniqueError } from './tserrors';
import { $timeout } from './utils';
import { $ftrim } from './strings';
import { $encodeBase64 } from './data';
import { TSData } from './tsdata';
import { TSURL } from './tsurl';
import { $map } from './array';
import { $charset, TSCharset } from './tscharset';
import { $iscollection } from './tsobject'


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
    const tok = $isstring(base64StringOrData) ? base64StringOrData as string : $encodeBase64(base64StringOrData as TSDataLike) ;
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
            if ($isarray(value) || value instanceof Set) {
                let uniques = new Set<string>() ; // we don't want to add the same value twice
                for (let v of (value as any[] || Set)) {
                    if ($ok(v)) { 
                        v = $string(v) ; 
                        if (!uniques.has(v)) {
                            uniques.add(v) ;
                            params.append(key, v) ; 
                        }
                    }
                }
            }
            else { params.append(key, $string(value)) ; }
        }
    }

    const s = params.toString() ;
    return $length(s) ? baseURL + '?' + s : baseURL ;
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
	Buffer = 'arraybuffer',
	String = 'text',
	Stream = 'stream'
}


export const NO_BODY = undefined ;
export const NO_HEADERS = {} ;

export type TSRequestHeaders = { [key:string]: string | string[] | number } ;
export type TSResponseHeaders = Headers ;
export type TSRequestAuth = { login:string, password:string, encoding?:Nullable<StringEncoding|TSCharset> } ;

export type TSResponseType = Nullable<object | string | number | boolean | ReadableStream> ;
export interface TSResponse {
    status:Resp,
    response:TSResponseType,
    headers:TSResponseHeaders
    statusDescription?:string ;
} ;
export interface TSRequestOptions {
    headers?:Nullable<TSRequestHeaders> ;
    timeout?:Nullable<number> ;
    managesCredentials?:Nullable<boolean> ;
    auth?:Nullable<TSRequestAuth|string|TSDataLike> ; // if TSDataLike, we need to convert it to base64
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

    // if you pass as string it's a base64string. If you pass a data, it is converted to base64
	public setToken(token?:Nullable<string|TSDataLike>) {
		if ($length(token)) {
			token = $barerauth(token!) ;
		}
		else {
			this.token = '' ;
		}
	}

    // we keep this method for backward compatibility
	public async request(
		relativeURL:string, 
		method?:Verb, 
		responseType?:RespType, 
		statuses:number[] = [200], 
		body?:Nullable<BodyInit|TSData>, 
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
		body:Nullable<BodyInit|TSData>=null, 
		suplHeaders:TSRequestHeaders={},
		timeout?:number
	) : Promise<TSResponse> 
	{
        const requestHeaders:StringDictionary = _finalHeaders({... this.commonHeaders, ..._standardHeaders(suplHeaders)}) ;
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
        let finalURL = TSURL.compose(this.baseURL, $string(relativeURL))?.href as Nullable<string> ;
        if (!$ok(finalURL)) {
            TSError.throw('TSRequest.req(): impossible to compose base URL and relativeURL', { 
                relativeURL:relativeURL, 
                method:method, 
                responseType:responseType, 
                body:body,
                suplHeaders:suplHeaders,
                timeout:timeout
            }) ; 
        }
        if ($length(finalURL) > 1 && finalURL?.endsWith('/')) { finalURL = finalURL.slice(0, finalURL.length-1) ; }
        //$logterm(`request body => &p\n${$insp(body)}&0`) ;
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
                if (body === null) { break ; }
                else if (body instanceof TSData) { config.body = body.mutableBuffer ; }
                else if (body instanceof FormData || body instanceof ArrayBuffer || ArrayBuffer.isView(body) || _isReadableStream(body!)) { config.body = body as BodyInit ; }
                else if (body instanceof URLSearchParams) { 
                    config.body = body.toString() ;
                    _maySetContentType(requestHeaders, RequestBodyType.UrlEncoded) ;
                }
                else {
                    const stringBody = ($ismethod(body, 'toString') ? body.toString() : `${body}`) ;
                    if (stringBody === '[object File]' || stringBody === '[object Blob') { config.body = body as BodyInit ; }
                    else {
                        config.body = JSON.stringify(body) ;
                        _maySetContentType(requestHeaders, RequestBodyType.Json) ;        
                        //$logterm(`JSON body => &c\n${$insp(config.body)}&0`) ;
                    }
                }
                break ;
            default:
                TSError.throw(`TSRequest.req(): impossible to send a ${typeof body} as a body`, { 
                    relativeURL:relativeURL, 
                    method:method, 
                    responseType:responseType, 
                    body:body,
                    suplHeaders:suplHeaders,
                    timeout:timeout
                }) ; 
        }


        if ($ok(timeout) && timeout! < 0) { 
            TSError.throw('TSRequest.req(): if set, timeout parameter should be positive or 0', { 
                relativeURL:relativeURL, 
                method:method, 
                responseType:responseType, 
                body:body,
                suplHeaders:suplHeaders,
                timeout:timeout
            }) ; 
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
                const response:Response = resp! ;
                status = response.status ;
                headers = response.headers ;
                // wa don't catch conversion errors because they should not occur and
                // an occurence means a local error or a protocol discrepency between
                // the server and the client
                switch (responseType) {
                    case RespType.Buffer:
                        ret = Buffer.from(await response.arrayBuffer()) ;
                        break ;
                    case RespType.Json:
                        ret = await response.json() ;
                        break ;
                    case RespType.Stream:
                        ret = response.body ;
                        break ;
                    case RespType.String:
                        ret = await response.text() ;
                        break ;
                }
            }
		}
		catch (e:any) {
            ret = null ;
            if (e === timeoutError) {
				status = Resp.TimeOut ;
            }
			else if ($isnumber(e?.statusCode)) {
				status = e!.statusCode as number ;
			}
			else if ($isnumber(e?.status)) {
				status = e!.status as number ;
			}
			else {
                let code = (((e as TypeError)?.cause) as any)?.code ;
                if (!$length(code)) {
                    code = $string(e?.code)
                }
                switch (code) {
                    case 'ECONNREFUSED': 
                    case 'DEPTH_ZERO_SELF_SIGNED_CERT':
                        status = Resp.Misdirected ; 
                        break ;
                    case 'ECONNABORTED': case 'ETIMEDOUT': case 'ERR_PARSE_TIMEOUT':
                        status = Resp.TimeOut ;
                        break ;
                    default:
        				// all other errors must throw
                        throw e ;
                }
			}
		}
		return { status:status, response:ret, headers:headers}  ;
	}

    // ============== private methods ======================
    /* private _resetChannel() {
        this._channel = axios.create({baseURL:this._baseURL, withCredentials:!!this._managesCredential}) ;
    } */

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

function _maySetHeader(headers:StringDictionary, header:string, value:string) {
    header = header.capitalize() ;
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
        ret[key.capitalize()] = $isarray(value) ? (value as Array<string|number>).join(', ') : `${value}` ;
    }
    return ret ;
}

function _standardHeaders(headers:Nullable<TSRequestHeaders>):TSRequestHeaders {
    const entries = $ok(headers) ? Object.entries(headers!) : [] ;
    const ret:TSRequestHeaders = {} ;
    for (let [key, value] of entries) {
        ret[key.capitalize()] = $isarray(value) ? $map(value as string[], i => `${i}`) : `${value}` ;
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

URLSearchParams.prototype.query = function query(this: URLSearchParams): StringDictionary | null {
    const ret:StringDictionary = {} ;
    let total = 0 ;
    // FIXME: do net we need to care about arrays here ?
    for (const [key, value] of this) {
        if (key.length > 0) { ret[key] = value ; total ++ ; }
    }
    return total > 0 ? ret : null ;
} ;

export type TSMultipartEntry = string | Blob ;

export async function $generateMultiPartBodyString(dict:TSDictionary<TSMultipartEntry>, boundary:string):Promise<string|null>
{
    const entries = Object.entries(dict) ;
    const body: string[] = [] ;
    let total = 0 ;
    
    for (let [key, value] of entries) {
        const isstr = $isstring(value) ;
        if (!isstr && !(value instanceof Blob)) { // File is an subclass of Blob, so it should fit here
            continue ;  // we could throw an exception or return null instead 
        }

        let type = 'text/plain' ;
        body.push(`--${boundary}`) ;

        if (isstr) {
            body.push(`Content-Disposition: form-data; name="${key}"`) ;
        } 
        else {
            type = (value as Blob).type ;
            if (!$length(type)) { type = 'application/octet-stream' ; }
            value = await (value as Blob).text() ;
            if ($ismethod(value, 'name')) {
                // this is a file or anything like it
                body.push(`Content-Disposition: form-data; name="${key}"; filename="${(value as any).name}"`) ;
            }
            else {
                // this is a blob
                body.push(`Content-Disposition: form-data; name="${key}"`) ;
            }
        }
        body.push(`Content-Type: ${type}`) ;
        body.push('') ;
        body.push(value as string) ;
        total ++ ;
    }
    
    if (!total) { return null ; }

    body.push(`--${boundary}--`) ;
    body.push('') ;

    return body.join('\r\n') ;
}
