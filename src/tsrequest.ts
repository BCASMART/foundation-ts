import { AnyDictionary } from './types';
import * as qs from 'querystring'
import { $isnumber, $isstring, $length, $ok, $unsigned, $timeout } from './commons';
import axios, {AxiosInstance, AxiosRequestConfig } from 'axios';
import { TSUniqueError } from './tserrors';


export function $basicauth(login:string, pwd:string) : string
{
	return 'Basic ' + Buffer.from(`${login}:${pwd}`).toString('base64') ;
}
export function $barerauth(base64token:string) : string
{
	return `Bearer ${base64token}` ;
}

export function $query(baseURL:string, query:AnyDictionary) : string
{
	const q = qs.stringify(query) ;
	return $length(q) ? `${baseURL}?${q}` : baseURL ;
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

export class TSRequest {
	public channel:AxiosInstance ;
	public token:string = '' ;
	public basicAuth:string = '' ;
	public defaultTimeOut = 1000 ;
    public baseURL:string = '' ;
    public commonHeaders:RequestHeaders={} ;

	public static async instantRequest(
		url:string, 
		method:Verb = Verb.Get, 
		responseType:RespType = RespType.Json,
		statuses:number[] = [200],
		body:object|Buffer|ArrayBuffer|null|undefined=null, 
		suplHeaders:RequestHeaders={},
		auth:RequestAuth|string|null|undefined=null,
		timeout?:number
	) : Promise<[Buffer|object|string|ReadableStream|null, number]> {
		const req = new TSRequest() ;
		if (!$ok(req)) { return [null, Resp.InternalError] ;}
		if (!$length(url)) { return [null, Resp.NotFound] ; }
		if ($ok(auth)) { req.setAuth(<RequestAuth>auth) } ;
		return await req.request(url, method, responseType, statuses, body, suplHeaders, timeout) ;
	}

	public constructor(baseURL:string='', headers:RequestHeaders={}, auth:RequestAuth|string|null|undefined=null, commonTimeout?:number) {
        this.baseURL = baseURL ;
        this.commonHeaders= headers ;
		if ($isstring(auth)) { this.setToken(<string>auth) ; }
		else if ($ok(auth)) { this.setAuth(<RequestAuth>auth) ; }
		commonTimeout = $unsigned(commonTimeout) ;
		if (commonTimeout>0) { this.defaultTimeOut = commonTimeout ; }
		this.channel = axios.create({baseURL:baseURL, headers:headers}) ;
	} 

	public setAuth(auth?:RequestAuth|null|undefined) {
		if ($ok(auth) && $length(auth?.login)) {
			this.basicAuth = $basicauth(<string>auth?.login, (<RequestAuth>auth).password) ;
		}
		else { 
			this.basicAuth = '' ;
		}
	}

	public setToken(token?:string|null|undefined) {
		if ($length(token)) {
			token = $barerauth(<string>token) ;
		}
		else {
			this.token = '' ;
		}
	}

    
	public async request(
		relativeURL:string, 
		method:Verb = Verb.Get, 
		responseType:RespType = RespType.Json, 
		statuses:number[] = [200], 
		body:object|Buffer|ArrayBuffer|null|undefined=null, 
		suplHeaders:RequestHeaders={},
		timeout?:number
	) : Promise<[Buffer|object|string|ReadableStream|null, number]> 
	{
		const config:AxiosRequestConfig = {
			url:relativeURL,
			method:method,
			responseType:responseType,
			headers: {... suplHeaders},
			validateStatus: function(status) { return statuses.includes(status) ; }
		} ;

		if ($length(this.token)) {
			config.headers['Authorization'] = this.token ;
		}
		else if ($length(this.basicAuth)) {
			config.headers['Authorization'] = this.basicAuth ;
		}
		if ($ok(body)) { config.data = body } ;
		
		timeout = $unsigned(timeout) ;
		if (!timeout) { timeout = this.defaultTimeOut ; }
		let ret = null ;
		let status = 0 ;

		const timeoutError = TSUniqueError.singleton() ; // we use a singleton to avoid to use Symbol() in browsers
		try {
			const response = await $timeout(this.channel(config), timeout, timeoutError)
			ret = responseType === RespType.Buffer ? Buffer.from(response.data) : response.data ;
			status = response.status ;
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
		return [ret, status]  ;
	}
}