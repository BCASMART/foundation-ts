import { Nullable, TSDataLike, TSDictionary } from './types';
import { $isnumber, $isstring, $length, $ok, $isarray, $tounsigned } from './commons';
import { TSError, TSUniqueError } from './tserrors';
import { $timeout } from './utils';
import { $ftrim } from './strings';

// TODO: for now, we use axios, but as good as axios is, it comes with a lot of
// dependancies and in near future, we will upgrade this class to be autonomous
import axios, {AxiosInstance, AxiosRequestConfig } from 'axios';
import { $arrayBufferFromBytes, $encodeBase64 } from './data';
import { TSData } from './tsdata';
import { $map } from './array';


export function $basicauth(login:string, pwd:string) : string
{
	return 'Basic ' + $encodeBase64(`${login}:${pwd}`) ;
}
export function $barerauth(base64token:string) : string
{
	return `Bearer ${base64token}` ;
}

// this method removes null or undefined values from a query
export function $query(baseURL:string, query:TSDictionary) : string {
    let params = new URLSearchParams() ;
        
    for (let [key, value] of Object.entries(query)) {
        key = $ftrim(key) ;
        if (key.length) {
            if ($isarray(value)) {
                let uniques = new Set<Nullable<string>>() ; // we don't want to add the same value twice
                for (let v of (value as Array<any>)) {
                    if ($ok(v)) { 
                        v = v.toString() ; 
                        if (!uniques.has(v)) {
                            uniques.add(v) ;
                            params.append(key, v) ; 
                        }
                    }
                }
            }
            else if ($ok(value)) { params.append(key, value.toString()) ; } 
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
export type RequestAuth = { login:string, password:string }

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
    headers?:RequestHeaders,
    timeout?:number,
    managesCredentials?:boolean,
    auth?:RequestAuth|string
}

export class TSRequest {
	public channel:AxiosInstance ;
	public token:string = '' ;
	public basicAuth:string = '' ;
	public defaultTimeOut = 1000 ;
    public baseURL:string = '' ;
    public commonHeaders:RequestHeaders={} ;

    public constructor(baseURL:string='', opts:TSRequestOptions = {}) {
        this.baseURL = baseURL ;
        this.commonHeaders= $ok(opts?.headers) ? _standardHeaders(opts.headers!) : {} ;
		if ($isstring(opts.auth)) { this.setToken(<string>opts.auth) ; }
		else if ($ok(opts.auth)) { this.setAuth(<RequestAuth>opts.auth) ; }

        if ($ok(opts.timeout) && opts.timeout! < 0) { 
            throw new TSError('TSRequest.constructor(): if set, timeout option should be positive', { baseURL:baseURL, options:opts}) ; 
        }

		const commonTimeout = $tounsigned(opts.timeout) ;
		if (commonTimeout > 0) { this.defaultTimeOut = commonTimeout ; }
		this.channel = axios.create({baseURL:baseURL, withCredentials:opts.managesCredentials}) ;
	} 

	public setAuth(auth?:Nullable<RequestAuth>) {
		if ($ok(auth) && $length(auth?.login)) {
			this.basicAuth = $basicauth(<string>auth?.login, (<RequestAuth>auth).password) ;
		}
		else { 
			this.basicAuth = '' ;
		}
	}

	public setToken(token?:Nullable<string>) {
		if ($length(token)) {
			token = $barerauth(<string>token) ;
		}
		else {
			this.token = '' ;
		}
	}

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
            if (body instanceof TSData) { config.data = (body as TSData).mutableBuffer ; } 
            else if (body instanceof Uint8Array) { config.data = $arrayBufferFromBytes(body as Uint8Array) ; }
            else { config.data = body ; } 
        } ;
		
        if ($ok(timeout) && timeout! < 0) { 
            throw new TSError('TSRequest.req(): if set, timeout parameter should be positive or 0', { 
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
			const response = await $timeout(this.channel(config), timeout, timeoutError)
			ret = responseType === RespType.Buffer ? Buffer.from(response.data) : response.data ;
			status = response.status ;
            headers = response.headers ;
		}
		catch (e) {
			if (e === timeoutError || (e as TSRequestError).code === 'ECONNABORTED' || (e as TSRequestError).code === 'ETIMEDOUT') { 
				// AxiosError contains a 'code' field
				ret = null ;
				status = Resp.TimeOut ;
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
}

function _standardHeaders(headers:Nullable<RequestHeaders>):RequestHeaders {
    const entries = $ok(headers) ? Object.entries(headers!) : [] ;
    const ret:RequestHeaders = {} ;
    for (let [key, value] of entries) {
        ret[key.capitalize()] = $isarray(value) ? $map(value as string[], i => `${i}`) : `${value}` ;
    }
    return ret ;
}
