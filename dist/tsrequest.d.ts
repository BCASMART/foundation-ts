/// <reference types="node" />
import { AnyDictionary } from './types';
import { AxiosInstance } from 'axios';
export declare function $basicauth(login: string, pwd: string): string;
export declare function $barerauth(base64token: string): string;
export declare function $query(baseURL: string, query: AnyDictionary): string;
export declare enum Resp {
    Continue = 100,
    SwitchingProtocol = 101,
    Processing = 103,
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
export declare enum Verb {
    Get = "GET",
    Post = "POST",
    Put = "PUT",
    Delete = "DELETE",
    Patch = "PATCH"
}
export declare enum RespType {
    Json = "json",
    Buffer = "arraybuffer",
    String = "text",
    Stream = "stream"
}
export declare const NO_BODY: undefined;
export declare const NO_HEADERS: {};
export declare type RequestHeaders = {
    [key: string]: string | string[] | number;
};
export declare type RequestAuth = {
    login: string;
    password: string;
};
export declare class TSRequest {
    channel: AxiosInstance;
    token: string;
    basicAuth: string;
    defaultTimeOut: number;
    baseURL: string;
    commonHeaders: RequestHeaders;
    static instantRequest(url: string, method?: Verb, responseType?: RespType, statuses?: number[], body?: object | Buffer | ArrayBuffer | null | undefined, suplHeaders?: RequestHeaders, auth?: RequestAuth | string | null | undefined, timeout?: number): Promise<[Buffer | object | string | ReadableStream | null, number]>;
    constructor(baseURL?: string, headers?: RequestHeaders, auth?: RequestAuth | string | null | undefined, commonTimeout?: number);
    setAuth(auth?: RequestAuth | null | undefined): void;
    setToken(token?: string | null | undefined): void;
    request(relativeURL: string, method?: Verb, responseType?: RespType, statuses?: number[], body?: object | Buffer | ArrayBuffer | null | undefined, suplHeaders?: RequestHeaders, timeout?: number): Promise<[Buffer | object | string | ReadableStream | null, number]>;
}
