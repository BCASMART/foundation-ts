"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s)
                if (Object.prototype.hasOwnProperty.call(s, p))
                    t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try {
            step(generator.next(value));
        }
        catch (e) {
            reject(e);
        } }
        function rejected(value) { try {
            step(generator["throw"](value));
        }
        catch (e) {
            reject(e);
        } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function () { if (t[0] & 1)
            throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function () { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f)
            throw new TypeError("Generator is already executing.");
        while (_)
            try {
                if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done)
                    return t;
                if (y = 0, t)
                    op = [op[0] & 2, t.value];
                switch (op[0]) {
                    case 0:
                    case 1:
                        t = op;
                        break;
                    case 4:
                        _.label++;
                        return { value: op[1], done: false };
                    case 5:
                        _.label++;
                        y = op[1];
                        op = [0];
                        continue;
                    case 7:
                        op = _.ops.pop();
                        _.trys.pop();
                        continue;
                    default:
                        if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                            _ = 0;
                            continue;
                        }
                        if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                            _.label = op[1];
                            break;
                        }
                        if (op[0] === 6 && _.label < t[1]) {
                            _.label = t[1];
                            t = op;
                            break;
                        }
                        if (t && _.label < t[2]) {
                            _.label = t[2];
                            _.ops.push(op);
                            break;
                        }
                        if (t[2])
                            _.ops.pop();
                        _.trys.pop();
                        continue;
                }
                op = body.call(thisArg, _);
            }
            catch (e) {
                op = [6, e];
                y = 0;
            }
            finally {
                f = t = 0;
            }
        if (op[0] & 5)
            throw op[1];
        return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WRequest = exports.NO_HEADERS = exports.NO_BODY = exports.RespType = exports.Verb = exports.Resp = exports.$query = exports.$barerauth = exports.$basicauth = void 0;
var qs = require("querystring");
var commons_1 = require("./commons");
var axios_1 = require("axios");
var errors_1 = require("./errors");
function $basicauth(login, pwd) {
    return 'Basic ' + Buffer.from(login + ":" + pwd).toString('base64');
}
exports.$basicauth = $basicauth;
function $barerauth(base64token) {
    return "Bearer " + base64token;
}
exports.$barerauth = $barerauth;
function $query(baseURL, query) {
    var q = qs.stringify(query);
    return commons_1.$length(q) ? baseURL + "?" + q : baseURL;
}
exports.$query = $query;
var Resp;
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
})(Resp = exports.Resp || (exports.Resp = {}));
var Verb;
(function (Verb) {
    Verb["Get"] = "GET";
    Verb["Post"] = "POST";
    Verb["Put"] = "PUT";
    Verb["Delete"] = "DELETE";
    Verb["Patch"] = "PATCH";
})(Verb = exports.Verb || (exports.Verb = {}));
var RespType;
(function (RespType) {
    RespType["Json"] = "json";
    RespType["Buffer"] = "arraybuffer";
    RespType["String"] = "text";
    RespType["Stream"] = "stream";
})(RespType = exports.RespType || (exports.RespType = {}));
exports.NO_BODY = undefined;
exports.NO_HEADERS = {};
var WRequest = /** @class */ (function () {
    function WRequest(baseURL, commonHeaders, auth, commonTimeout) {
        if (baseURL === void 0) {
            baseURL = '';
        }
        if (commonHeaders === void 0) {
            commonHeaders = {};
        }
        if (auth === void 0) {
            auth = null;
        }
        this.baseURL = baseURL;
        this.commonHeaders = commonHeaders;
        this.token = '';
        this.basicAuth = '';
        this.defaultTimeOut = 1000;
        if (commons_1.$isstring(auth)) {
            this.setToken(auth);
        }
        else if (commons_1.$ok(auth)) {
            this.setAuth(auth);
        }
        commonTimeout = commons_1.$unsigned(commonTimeout);
        if (commonTimeout > 0) {
            this.defaultTimeOut = commonTimeout;
        }
        this.channel = axios_1.default.create({ baseURL: baseURL, headers: commonHeaders });
    }
    WRequest.instantRequest = function (url, method, responseType, statuses, body, suplHeaders, auth, timeout) {
        if (method === void 0) {
            method = Verb.Get;
        }
        if (responseType === void 0) {
            responseType = RespType.Json;
        }
        if (statuses === void 0) {
            statuses = [200];
        }
        if (body === void 0) {
            body = null;
        }
        if (suplHeaders === void 0) {
            suplHeaders = {};
        }
        if (auth === void 0) {
            auth = null;
        }
        return __awaiter(this, void 0, void 0, function () {
            var req;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        req = new WRequest();
                        if (!commons_1.$ok(req)) {
                            return [2 /*return*/, [null, Resp.InternalError]];
                        }
                        if (!commons_1.$length(url)) {
                            return [2 /*return*/, [null, Resp.NotFound]];
                        }
                        if (commons_1.$ok(auth)) {
                            req.setAuth(auth);
                        }
                        ;
                        return [4 /*yield*/, req.request(url, method, responseType, statuses, body, suplHeaders, timeout)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    WRequest.prototype.setAuth = function (auth) {
        if (commons_1.$ok(auth) && commons_1.$length(auth === null || auth === void 0 ? void 0 : auth.login)) {
            this.basicAuth = $basicauth(auth === null || auth === void 0 ? void 0 : auth.login, auth.password);
        }
        else {
            this.basicAuth = '';
        }
    };
    WRequest.prototype.setToken = function (token) {
        if (commons_1.$length(token)) {
            token = $barerauth(token);
        }
        else {
            this.token = '';
        }
    };
    WRequest.prototype.request = function (relativeURL, method, responseType, statuses, body, suplHeaders, timeout) {
        if (method === void 0) {
            method = Verb.Get;
        }
        if (responseType === void 0) {
            responseType = RespType.Json;
        }
        if (statuses === void 0) {
            statuses = [200];
        }
        if (body === void 0) {
            body = null;
        }
        if (suplHeaders === void 0) {
            suplHeaders = {};
        }
        return __awaiter(this, void 0, void 0, function () {
            var config, ret, status, timeoutError, response, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        config = {
                            url: relativeURL,
                            method: method,
                            responseType: responseType,
                            headers: __assign({}, suplHeaders),
                            validateStatus: function (status) { return statuses.includes(status); }
                        };
                        if (commons_1.$length(this.token)) {
                            config.headers['Authorization'] = this.token;
                        }
                        else if (commons_1.$length(this.basicAuth)) {
                            config.headers['Authorization'] = this.basicAuth;
                        }
                        if (commons_1.$ok(body)) {
                            config.data = body;
                        }
                        ;
                        timeout = commons_1.$unsigned(timeout);
                        if (!timeout) {
                            timeout = this.defaultTimeOut;
                        }
                        ret = null;
                        status = 0;
                        timeoutError = errors_1.UniqueError.singleton();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, commons_1.$timeout(this.channel(config), timeout, timeoutError)];
                    case 2:
                        response = _a.sent();
                        ret = responseType === RespType.Buffer ? Buffer.from(response.data) : response.data;
                        status = response.status;
                        return [3 /*break*/, 4];
                    case 3:
                        e_1 = _a.sent();
                        if (e_1 === timeoutError || e_1.code === 'ECONNABORTED' || e_1.code === 'ETIMEDOUT') {
                            // AxiosError contains a 'code' field
                            ret = null;
                            status = Resp.TimeOut;
                        }
                        else if (commons_1.$isnumber(e_1.statusCode)) {
                            ret = null;
                            status = e_1.statusCode;
                        }
                        else if (commons_1.$isnumber(e_1.status)) {
                            ret = null;
                            status = e_1.status;
                        }
                        else {
                            // all other errors must throw
                            throw e_1;
                        }
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/, [ret, status]];
                }
            });
        });
    };
    return WRequest;
}());
exports.WRequest = WRequest;
//# sourceMappingURL=request.js.map