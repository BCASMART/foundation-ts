var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as qs from 'querystring';
import { $isnumber, $isstring, $length, $ok, $unsigned, $timeout } from './commons';
import axios from 'axios';
import { TSUniqueError } from './tserrors';
export function $basicauth(login, pwd) {
    return 'Basic ' + Buffer.from(`${login}:${pwd}`).toString('base64');
}
export function $barerauth(base64token) {
    return `Bearer ${base64token}`;
}
export function $query(baseURL, query) {
    const q = qs.stringify(query);
    return $length(q) ? `${baseURL}?${q}` : baseURL;
}
export var Resp;
(function (Resp) {
    // info responses
    Resp[Resp["Continue"] = 100] = "Continue";
    Resp[Resp["SwitchingProtocol"] = 101] = "SwitchingProtocol";
    Resp[Resp["Processing"] = 103] = "Processing";
    // success responses
    Resp[Resp["OK"] = 200] = "OK";
    Resp[Resp["Created"] = 201] = "Created";
    Resp[Resp["Accepted"] = 202] = "Accepted";
    Resp[Resp["NonAuthoritativeInformation"] = 203] = "NonAuthoritativeInformation";
    Resp[Resp["NoContent"] = 204] = "NoContent";
    Resp[Resp["ResetContent"] = 205] = "ResetContent";
    Resp[Resp["PartialContent"] = 206] = "PartialContent";
    Resp[Resp["MultiStatus"] = 207] = "MultiStatus";
    Resp[Resp["AlreadyReported"] = 208] = "AlreadyReported";
    Resp[Resp["ContentDifferent"] = 210] = "ContentDifferent";
    Resp[Resp["IMUsed"] = 226] = "IMUsed";
    // redirections
    Resp[Resp["MultipleChoices"] = 300] = "MultipleChoices";
    Resp[Resp["Moved"] = 301] = "Moved";
    Resp[Resp["Found"] = 302] = "Found";
    Resp[Resp["SeeOther"] = 303] = "SeeOther";
    Resp[Resp["NotModified"] = 304] = "NotModified";
    Resp[Resp["UseProxy"] = 305] = "UseProxy";
    Resp[Resp["SwitchProxy"] = 306] = "SwitchProxy";
    Resp[Resp["TemporaryRedirect"] = 307] = "TemporaryRedirect";
    Resp[Resp["PermanentRedirect"] = 308] = "PermanentRedirect";
    Resp[Resp["TooManyRedirects"] = 310] = "TooManyRedirects";
    // client errors
    Resp[Resp["BadRequest"] = 400] = "BadRequest";
    Resp[Resp["Unauthorized"] = 401] = "Unauthorized";
    Resp[Resp["PaymentRequired"] = 402] = "PaymentRequired";
    Resp[Resp["Forbidden"] = 403] = "Forbidden";
    Resp[Resp["NotFound"] = 404] = "NotFound";
    Resp[Resp["NotAllowed"] = 405] = "NotAllowed";
    Resp[Resp["NotAcceptable"] = 406] = "NotAcceptable";
    Resp[Resp["ProxyAuthenticationRequired"] = 407] = "ProxyAuthenticationRequired";
    Resp[Resp["TimeOut"] = 408] = "TimeOut";
    Resp[Resp["Conflict"] = 409] = "Conflict";
    Resp[Resp["Gone"] = 410] = "Gone";
    Resp[Resp["LengthRequired"] = 411] = "LengthRequired";
    Resp[Resp["PreconditionFailed"] = 412] = "PreconditionFailed";
    Resp[Resp["TooLarge"] = 413] = "TooLarge";
    Resp[Resp["URITooLong"] = 414] = "URITooLong";
    Resp[Resp["UnsupportedMedia"] = 415] = "UnsupportedMedia";
    Resp[Resp["RequestedRangeUnsatisfiable"] = 416] = "RequestedRangeUnsatisfiable";
    Resp[Resp["ExpectationFailed"] = 417] = "ExpectationFailed";
    Resp[Resp["TeaPot"] = 418] = "TeaPot";
    Resp[Resp["Misdirected"] = 421] = "Misdirected";
    Resp[Resp["Unprocessable"] = 422] = "Unprocessable";
    Resp[Resp["Locked"] = 423] = "Locked";
    Resp[Resp["MethodFailure"] = 424] = "MethodFailure";
    Resp[Resp["TooEarly"] = 425] = "TooEarly";
    Resp[Resp["UpgradeRequired"] = 426] = "UpgradeRequired";
    Resp[Resp["PreconditionRequired"] = 428] = "PreconditionRequired";
    Resp[Resp["TooManyRequests"] = 429] = "TooManyRequests";
    Resp[Resp["LegallyUnavailable"] = 451] = "LegallyUnavailable";
    Resp[Resp["Unrecoverable"] = 456] = "Unrecoverable";
    // server errors
    Resp[Resp["InternalError"] = 500] = "InternalError";
    Resp[Resp["NotImplemented"] = 501] = "NotImplemented";
    Resp[Resp["BadGateway"] = 502] = "BadGateway";
    Resp[Resp["Unavailable"] = 503] = "Unavailable";
    Resp[Resp["GatewayTimeOut"] = 504] = "GatewayTimeOut";
    Resp[Resp["NotSupported"] = 505] = "NotSupported";
    Resp[Resp["VariantAlsoNegotiates"] = 506] = "VariantAlsoNegotiates";
    Resp[Resp["InsufficientStorage"] = 507] = "InsufficientStorage";
    Resp[Resp["LoopDetected"] = 508] = "LoopDetected";
    Resp[Resp["BandwidthLimitExceeded"] = 509] = "BandwidthLimitExceeded";
    Resp[Resp["NotExtended"] = 510] = "NotExtended";
    Resp[Resp["NetworkAuthenticationRequired"] = 511] = "NetworkAuthenticationRequired";
})(Resp || (Resp = {}));
export var Verb;
(function (Verb) {
    Verb["Get"] = "GET";
    Verb["Post"] = "POST";
    Verb["Put"] = "PUT";
    Verb["Delete"] = "DELETE";
    Verb["Patch"] = "PATCH";
})(Verb || (Verb = {}));
export var RespType;
(function (RespType) {
    RespType["Json"] = "json";
    RespType["Buffer"] = "arraybuffer";
    RespType["String"] = "text";
    RespType["Stream"] = "stream";
})(RespType || (RespType = {}));
export const NO_BODY = undefined;
export const NO_HEADERS = {};
;
export class TSRequest {
    constructor(baseURL = '', headers = {}, auth = null, commonTimeout) {
        this.token = '';
        this.basicAuth = '';
        this.defaultTimeOut = 1000;
        this.baseURL = '';
        this.commonHeaders = {};
        this.baseURL = baseURL;
        this.commonHeaders = headers;
        if ($isstring(auth)) {
            this.setToken(auth);
        }
        else if ($ok(auth)) {
            this.setAuth(auth);
        }
        commonTimeout = $unsigned(commonTimeout);
        if (commonTimeout > 0) {
            this.defaultTimeOut = commonTimeout;
        }
        this.channel = axios.create({ baseURL: baseURL, headers: headers });
    }
    static instantRequest(url, method = Verb.Get, responseType = RespType.Json, statuses = [200], body = null, suplHeaders = {}, auth = null, timeout) {
        return __awaiter(this, void 0, void 0, function* () {
            const req = new TSRequest();
            if (!$ok(req)) {
                return [null, Resp.InternalError];
            }
            if (!$length(url)) {
                return [null, Resp.NotFound];
            }
            if ($ok(auth)) {
                req.setAuth(auth);
            }
            ;
            return yield req.request(url, method, responseType, statuses, body, suplHeaders, timeout);
        });
    }
    setAuth(auth) {
        if ($ok(auth) && $length(auth === null || auth === void 0 ? void 0 : auth.login)) {
            this.basicAuth = $basicauth(auth === null || auth === void 0 ? void 0 : auth.login, auth.password);
        }
        else {
            this.basicAuth = '';
        }
    }
    setToken(token) {
        if ($length(token)) {
            token = $barerauth(token);
        }
        else {
            this.token = '';
        }
    }
    request(relativeURL, method = Verb.Get, responseType = RespType.Json, statuses = [200], body = null, suplHeaders = {}, timeout) {
        return __awaiter(this, void 0, void 0, function* () {
            const config = {
                url: relativeURL,
                method: method,
                responseType: responseType,
                headers: Object.assign(Object.assign({}, this.commonHeaders), suplHeaders),
                validateStatus: function (status) { return statuses.includes(status); }
            };
            if ($length(this.token)) {
                config.headers['Authorization'] = this.token;
            }
            else if ($length(this.basicAuth)) {
                config.headers['Authorization'] = this.basicAuth;
            }
            if ($ok(body)) {
                config.data = body;
            }
            ;
            timeout = $unsigned(timeout);
            if (!timeout) {
                timeout = this.defaultTimeOut;
            }
            let ret = null;
            let status = 0;
            const timeoutError = TSUniqueError.singleton(); // we use a singleton to avoid to use Symbol() in browsers
            try {
                const response = yield $timeout(this.channel(config), timeout, timeoutError);
                ret = responseType === RespType.Buffer ? Buffer.from(response.data) : response.data;
                status = response.status;
            }
            catch (e) {
                if (e === timeoutError || e.code === 'ECONNABORTED' || e.code === 'ETIMEDOUT') {
                    // AxiosError contains a 'code' field
                    ret = null;
                    status = Resp.TimeOut;
                }
                else if ($isnumber(e.statusCode)) {
                    ret = null;
                    status = e.statusCode;
                }
                else if ($isnumber(e.status)) {
                    ret = null;
                    status = e.status;
                }
                else {
                    // all other errors must throw
                    throw e;
                }
            }
            return [ret, status];
        });
    }
}
//# sourceMappingURL=tsrequest.js.map