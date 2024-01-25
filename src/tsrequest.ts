import { Nullable, StringDictionary, StringEncoding, TSDataLike, TSDictionary, UINT8_MAX } from './types';
import { $isnumber, $isstring, $length, $ok, $isarray, $tounsigned, $string, $isunsigned } from './commons';
import { TSError, TSUniqueError } from './tserrors';
import { $timeout } from './utils';
import { $ftrim } from './strings';

// TODO: for now, we use axios, but as good as axios is, it comes with a lot of
// dependancies and in near future, we will upgrade this class to be autonomous
import axios, {AxiosInstance, AxiosRequestConfig } from 'axios';
import { $arrayBufferFromBytes, $encodeBase64 } from './data';
import { TSData } from './tsdata';
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

export type RequestHeaders = { [key:string]: string | string[] | number}
export type RequestAuth = { login:string, password:string, encoding?:Nullable<StringEncoding|TSCharset> }

interface TSRequestError {
    status?:number ;
    statusCode?:number ;
    code?:string ;
} ;

export interface TSResponse {
    status:Resp,
    response:Buffer|object|string|ReadableStream|null, // WARNING: should we accept number and boolean return ?
    headers:RequestHeaders
}
export interface TSRequestOptions {
    headers?:Nullable<RequestHeaders> ;
    timeout?:Nullable<number> ;
    managesCredentials?:Nullable<boolean> ;
    auth?:Nullable<RequestAuth|string|TSDataLike> ; // if TSDataLike, we need to convert it to base64
}

export class TSRequest {
    public static readonly DefaultURL = 'http://localhost/' ;
	public token:string = '' ;
	public basicAuth:string = '' ;
	public defaultTimeOut = 1000 ;
    public commonHeaders:RequestHeaders={} ;

    private _baseURL:string = TSRequest.DefaultURL ;
    private _managesCredential:boolean ;

    // @ts-ignore (_channel is defined in _resetChannel() private method)
    private _channel:AxiosInstance ;

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
            this.setAuth(opts.auth as RequestAuth) ;
        }

        if ($ok(opts.timeout) && opts.timeout! < 0) { 
            TSError.throw('TSRequest.constructor(): if set, timeout option should be positive', { baseURL:baseURL, options:opts}) ; 
        }
        
		const commonTimeout = $tounsigned(opts.timeout) ;
		if (commonTimeout > 0) { this.defaultTimeOut = commonTimeout ; }
        this._managesCredential = !!opts.managesCredentials ;
        this._baseURL = baseURL.length > 0 ? baseURL : TSRequest.DefaultURL ;
        this._resetChannel() ;
	} 
    public get baseURL():string { return this._baseURL ; }
    public set baseURL(s:string) {
        if (!s.length) { s = TSRequest.DefaultURL ; }
        if (s !== this._baseURL) {
            this._baseURL = s ;
            this._resetChannel() ;
        }
    } 

    public get managesCredential():boolean { return this._managesCredential ; }
    public set managesCredential(flag:boolean) {
        if ((flag && !this._managesCredential) || (!flag && this._managesCredential)) {
            this._managesCredential = flag ;
            this._resetChannel() ;
        }
    }

	public setAuth(auth?:Nullable<RequestAuth>) {
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
		body?:Nullable<object|TSDataLike>, 
		suplHeaders?:RequestHeaders,
		timeout?:number
	) : Promise<[Buffer|object|string|ReadableStream|null, number]> 
    {
        const resp = await this.req(relativeURL, method, responseType, body, suplHeaders, timeout) ;
        return [statuses.includes(resp.status) ? resp.response : null, resp.status] ;
    }

	public async req(
		relativeURL:string, 
		method:Verb = Verb.Get, 
		responseType:RespType = RespType.Json, 
		body:Nullable<object|TSDataLike>=null, 
		suplHeaders:RequestHeaders={},
		timeout?:number
	) : Promise<TSResponse> 
	{
		const config:AxiosRequestConfig = {
			url:relativeURL,
			method:method,
			responseType:responseType,
			headers: {... this.commonHeaders, ... _standardHeaders(suplHeaders)},
            validateStatus: () => true
		} ;

		if ($length(this.token)) {
			config.headers!['Authorization'] = this.token! ;
		}
		else if ($length(this.basicAuth)) {
			config.headers!['Authorization'] = this.basicAuth! ;
		}

		if ($ok(body)) {
            // TODO: we should make a better conversion here but since
            // our goal is to remove the Axio's dependancy, it can wait
            if (body instanceof TSData) { config.data = (body as TSData).mutableBuffer ; } 
            else if (body instanceof Uint8Array) { config.data = $arrayBufferFromBytes(body as Uint8Array) ; }
            else { config.data = body ; } 
        } ;
		
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
        let headers:RequestHeaders = {} ;

		const timeoutError = TSUniqueError.timeoutError() ;
		try {
			const response = await $timeout(this._channel(config), timeout, timeoutError)
			ret = responseType === RespType.Buffer ? Buffer.from(response.data) : response.data ;
			status = response.status ;
            headers = response.headers ;
		}
		catch (e) {
			if (e === timeoutError || (e as TSRequestError).code === 'ECONNABORTED' || (e as TSRequestError).code === 'ETIMEDOUT' || (e as TSRequestError).code === 'ERR_PARSE_TIMEOUT') { 
				ret = null ;
				status = Resp.TimeOut ;
			}
            else if ((e as TSRequestError).code === 'ECONNREFUSED') {
                ret = null ;
                status = Resp.Misdirected ;
            }
			else if ($isnumber((e as TSRequestError).statusCode)) {
				ret = null ;
				status = (e as TSRequestError).statusCode as number ;
			}
			else if ($isnumber((e as TSRequestError).status)) {
				ret = null ;
				status = (e as TSRequestError).status as number ;
			}
			else {
				// all other errors must throw
				throw e ;
			}
		}
		return { status:status, response:ret, headers:headers}  ;
	}

    // ============== private methods ======================
    private _resetChannel() {
        this._channel = axios.create({baseURL:this._baseURL, withCredentials:!!this._managesCredential}) ;
    }

}

function _standardHeaders(headers:Nullable<RequestHeaders>):RequestHeaders {
    const entries = $ok(headers) ? Object.entries(headers!) : [] ;
    const ret:RequestHeaders = {} ;
    for (let [key, value] of entries) {
        ret[key.capitalize()] = $isarray(value) ? $map(value as string[], i => `${i}`) : `${value}` ;
    }
    return ret ;
}

declare global {
    export interface URLSearchParams {
        query:              (this: URLSearchParams) => StringDictionary | null;
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

