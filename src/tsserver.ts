import * as http from "http";    // NOSONAR: no 'node:' prefix for webpack 5
import * as https from "https";  // NOSONAR: no 'node:' prefix for webpack 5

import { $isarray, $ismethod, $isnumber, $isunsigned, $keys, $length, $objectcount, $ok, $string, $strings, $unsigned, $value } from "./commons";
import { $bufferFromDataLike } from "./data";
import { $isabsolutepath } from "./fs";
import { $conditionalClearMap } from "./mapset";
import { $ftrim } from "./strings";
import { $isRespCode, TSError } from "./tserrors";
import { Resp, Verb } from "./tsrequest";
import Socket = NodeJS.Socket;
import { TSPreflightController, TSPreflightResponse, TSEndpointsDefinition, TSServerErrorCodes, TSServerStartStatus, TSWebSiteDefinition } from "./tsserver_types";
import { TSEndPointRouter, TSServerEndPoint } from "./tsserver_endpoints";
import { TSStaticWebsite } from "./tsserver_websites";
import { TSURL } from "./tsurl";
import { Nullable, StringDictionary, TSDataLike, TSDictionary, uint, uint16, UINT16_MAX } from "./types";
import { $inbrowser, $insp, $logterm, $mark } from "./utils";

/**
 * This is a minimal singleton HTTP server class provided for testing
 * 
 * You start a new async API server on default port 3000 by a single line : 
 *   TSServer.start({ ... my endpoints definitions dictionary ... }) ;
 * 
 * in order to create an https server, you only need to provide your valid 
 * key and certificate in TSServerOptions
 */

export type TSServerLogger = (type:TSServerLogType, messages:string, server?: TSServer, req?: http.IncomingMessage) => Promise<void> ;

export enum TSServerLogLevel {
    None = 0,
    Errors = 1,
    Warnings = 2,
    Infos = 3,
    Developer = 4
}

export enum TSServerLogType {
    Developer = 'Dev',
    Log       = 'Info',
    Warning   = 'Warning',
    Error     = 'Error'
} ;

export interface TSServerOptions {
    host?:string ;
    port?:uint16 ;
    rootPath?:string ; // set that path to a real page if you want to have an available root page. Must be absolute
    webSites?:TSDictionary<TSWebSiteDefinition|string> ; // [starting path] => folders
    key?:Nullable<TSDataLike> ; // NOSONAR: optional
    certificate?:Nullable<TSDataLike> ; // NOSONAR: optional
    certificateAuthority?:Nullable<TSDataLike> ; // NOSONAR: optional
    mtls?:Nullable<boolean> ; // NOSONAR: optional. if true, the server will request a client certificate for mTLS authentication
    maxHeaderSize?:Nullable<number> ; // NOSONAR: optional
    tlsSecTimeout?:Nullable<number> ; // NOSONAR: optional. The number of seconds after which a TLS session will no longer be resumable. default 300.
    handshakeMsTimeout?:Nullable<number> ; // NOSONAR: optional. Abort the connection if the SSL/TLS handshake does not finish in the specified number of milliseconds.
    forceCloseMsTimeout?:Nullable<number> ; // NOSONAR: optional. timeout to force remaining connection after server stop. Default is 15000
    preflightController?:Nullable<TSPreflightController>|'default'|'permisive' ; // NOSONAR: optional
    clearCacheInterval?:Nullable<number> ; // NOSONAR: optional. default is 900s (15 mn)
    log?: {
        logger?: TSServerLogger;
        level?: TSServerLogLevel;
        sensitiveHeaders?: TSHeaderName[];
    };
}

type KnownKeys<T> = keyof {
  [K in keyof T as {} extends Record<K, 1> ? never : K]: T[K];
};
type TSHeaderName = KnownKeys<http.IncomingHttpHeaders>;

/**
 * other available options we don't considere for now in our small http/https server:
 * 
 * > for http:
 *   ========
 *   - insecureHTTPParser?:Nullable<boolean>: Use an insecure HTTP parser that accepts invalid HTTP headers when true.
 *     Using the insecure parser should be avoided.
 *   - noDelay?:Nullable<boolean>: If set to `true`, it disables the use of 
 *     Nagle's algorithm immediately after a new incoming connection is received
 *   - keepAlive?:Nullable<boolean>: If set to `true`, it enables keep-alive functionality 
 *     on the socket immediately after a new incoming connection is received, similarly 
 *     on what is done in `socket.setKeepAlive([enable][, initialDelay])`.   
 *   - keepAliveInitialDelay?: Nullable<number>: If set to a positive number, 
 *     it sets the initial delay before the first keepalive probe is sent on an idle socket.   
 * 
 * > for https:
 *   =========
 * 
 *   - ca?:Nullable<sring|Buffer|Array<string|Buffer>>: override the trusted CA certificates
 *   – cert?:Nullable<sring|Buffer|Array<string|Buffer>>: Cert chains in PEM format.
 *   – sigalgs?: Nullable<string>: Colon-separated list of supported signature algorithms.
 *   – ciphers?: Nullable<string>: Cipher suite specification, replacing the default.
 *   - clientCertEngine?: Nullable<string>: Name of an OpenSSL engine which can provide 
 *     the client certificate.
 *   - crl?:Nullable<sring|Buffer|Array<string|Buffer>>: PEM formatted CRLs
 *     (Certificate Revocation Lists).
 *   - dhparam?:Nullable<string|undefined>: Diffie Hellman parameters, required for Perfect Forward Secrecy.
 *   - ecdhCurve?:Nullable<string>: A string describing a named curve or a colon separated list of curve
 *     NIDs or names, for example P-521:P-384:P-256, to use for ECDH key agreement.
 *   - honorCipherOrder?:Nullable<boolean>: Attempt to use the server's cipher suite preferences 
 *     instead of the client's. When true, causes SSL_OP_CIPHER_SERVER_PREFERENCE to be set in secureOptions.
 *   - keys?:Nullable<sring|Buffer|Array<string|Buffer>>: Private keys in PEM format.
 *   - privateKeyEngine?:Nullable<string>: Name of an OpenSSL engine to get private key from.
 *   - privateKeyIdentifier?:Nullable<string>: Identifier of a private key managed by an OpenSSL engine.
 *   - maxVersion?:Nullable<SecureVersion>: Optionally set the maximum TLS version to allow.
 *     One of `'TLSv1.3'`, `'TLSv1.2'`, `'TLSv1.1'`, or `'TLSv1'`
 *   - minVersion?:Nullable<SecureVersion>: IDEM for minimal version
 *   - passphrase?:Nullable<string>: Shared passphrase used for a single private key and/or a PFX
 *   - pfx?:Nullable<sring|Buffer|Array<string|Buffer|PxfObject>>: PFX or PKCS12 encoded private key 
 *     and certificate chain. Alternative to providing key and cert individually.
 *   - secureOptions?:Nullable<number>: Value is a numeric bitmask of the `SSL_OP_*` options.
 *   - secureProtocol?:Nullable<string>: Legacy mechanism to select the TLS protocol version to use,
 *     it does support independent control of the minimum and maximum version. The possible values 
 *     are listed as SSL_METHODS. Use the function names as strings.
 *   - sessionIdContext?:Nullable<string>: Opaque identifier used by servers to ensure session 
 *     state is not shared between applications.
 *   - ticketKeys?:Nullable<Buffer>: 48-bytes of cryptographically strong pseudo-random data.
 *
 *   – pskCallback?(socket: TLSSocket, identity: string): DataView | NodeJS.TypedArray | null
 *   - pskIdentityHint?: string | undefined
 *  
 */


export class TSServer {
    private static __server:TSServer|undefined = undefined ;
    private static readonly SENSITIVE_HEADER_REPLACED_VALUE = "xxxx";
    private static readonly DEFAULT_CLOSE_TIMEOUT = 15000 ;
    private static readonly __methodColors:{[key in Verb]:string} = { GET:'&j', POST:'&u', PUT:'&v', DELETE:'&r', PATCH:'&o' }
    private static _internalClearTimer:any = undefined ;
    private static _lastClearTimerInterval:number = 900 ;

    public readonly host:string ;
    public readonly port:number ;
    public readonly rootPath:string = '' ;
    public readonly isHTTPs:boolean = false ;
    private readonly _serverOptions:InternalServerOptions ;
    private readonly _endPoints:TSServerEndPoint[] ;
    private readonly _router:TSEndPointRouter = new TSEndPointRouter([]) ; // rebuilt once _endPoints is populated
    private readonly _sites:TSStaticWebsite[] ;
    private readonly _logger:TSServerLogger ;
    private readonly _logInfo:boolean ;
    private readonly _logErrors:boolean ;
    private readonly _logWarnings:boolean ;
    private readonly _developerMode:boolean ;
    private readonly _connections = new Map<Socket, ConnectionStatus>;
    private readonly _forceCloseTimeout:number ;
    private readonly _preflightControler:TSPreflightController ;
    private readonly _allowedMethodsSet:Set<string> = new Set(Object.values(Verb) as string[]) ;
    private readonly _preflightResponseCache = new Map<string, TSPreflightResponse>() ; // origin => response
    private readonly _sensitiveHeaders: TSHeaderName[];
    private _terminating:boolean = false ;
    private _httpServer:http.Server|https.Server|undefined ;

    // =================== static methods =======================
    public static async start(endPoints:Nullable<TSDictionary<TSEndpointsDefinition>>, opts?:Nullable<TSServerOptions>):Promise<TSServerStartStatus|Error> {

        if (TSServer.__server) { return TSServerStartStatus.AlreadyRunning ; }
        
        if ($objectcount(endPoints) === 0 && $objectcount(opts?.webSites) === 0) {
            return new TSError('TSServer must at least serve one static website or one end point', { 
                endPoints:endPoints, 
                options:opts 
            }) ; 
        }

        let server:TSServer ;
        try { server = new TSServer($value(endPoints, {}), $value(opts, {})) ; }
        catch (e) { return e as Error ; }
        TSServer.__server = server ;

        // the server is really started when it listens to its port (which may fail, eg. if the port is already used)
        const error = await server._start() ;
        if ($ok(error)) {
            TSServer.stopClearCachesInterval() ;
            delete TSServer.__server ;
            if (server._logErrors) { await server._logger(TSServerLogType.Error, `cannot start for reason ${error.name}:\n${error.message}`, server) ; }
            return error ;
        }
        if (server._logInfo) { await server._logger(TSServerLogType.Log, `running on port ${server.port} '${server.host}' ...`, server) ; }

        return server.isHTTPs ? TSServerStartStatus.HTTPS : TSServerStartStatus.HTTP ;
    }

    public static isRunning():boolean { return $ok(TSServer.__server) ; }

    public static clearCaches():void { 
        if (TSServer.__server) { TSServer.__server._clearCaches() ; }
        else { TSServer.stopClearCachesInterval() ; }
    }
    
    public static stopClearCachesInterval() {
        if ($ok(TSServer._internalClearTimer)) { 
            clearInterval(TSServer._internalClearTimer) ; 
            TSServer._internalClearTimer = undefined ;
        } 
    }
    public static setClearCachesInterval(seconds?:Nullable<number>) {
        this.stopClearCachesInterval() ;
        this._lastClearTimerInterval = Math.max(Math.min($isnumber(seconds) ? seconds! : TSServer._lastClearTimerInterval, 86400), 60) ;
        TSServer._internalClearTimer = setInterval(__clearCaches, this._lastClearTimerInterval*1000) ;
    }

    // returns undefined if the server is stoped.
    // after that you can do a new server start
    public static async stop():Promise<Error|undefined> {
        if (TSServer.__server) { 
            const e = await TSServer.__server._stop() ; 
            if (!$ok(e)) {
                TSServer.stopClearCachesInterval() ;
                delete TSServer.__server ; 
                return undefined ; 
            }
            return e ;
        }
        return undefined ;
    }


    // =================== CONSTRUCTOR =======================

    private constructor(endPoints:TSDictionary<TSEndpointsDefinition>, opts:TSServerOptions = {}) {
        const ll = $value(opts.log?.level, TSServerLogLevel.Warnings) ;
        this._logger = $ok(opts.log?.logger) ? opts.log.logger : _internalLogger ;
        this._logErrors = ll > TSServerLogLevel.Errors ;
        this._logWarnings = ll > TSServerLogLevel.Warnings ;
        this._logInfo = ll > TSServerLogLevel.Infos ;
        this._developerMode = ll === TSServerLogLevel.Developer ;
        this._sensitiveHeaders = $value(opts.log?.sensitiveHeaders, []);
        this.isHTTPs = $length(opts.key) > 0 && $length(opts.certificate) > 0 ;
        this._serverOptions = _internalServerOptions(opts, this.isHTTPs) ;

        const ft = $unsigned(opts.forceCloseMsTimeout) ;
        this._forceCloseTimeout = ft === 0 ? TSServer.DEFAULT_CLOSE_TIMEOUT : ft ;

        const rp = $ftrim(opts.rootPath) ;
        if (rp.length > 1 && $isabsolutepath(rp)) { this.rootPath = rp ; }

        // first construct the static websites architecture (only if we're not inside a browser), then the dynamic endpoints
        this._sites = _staticWebsites(endPoints, opts) ;
        this._endPoints = $keys(endPoints).map(path => new TSServerEndPoint(path as string, endPoints[path], this._logger)) ;
        this._router = new TSEndPointRouter(this._endPoints) ;

        this.port = _serverPort(endPoints, opts, this.isHTTPs) ;
        this.host = $ftrim(opts.host) ;
        if (!this.host.length) { this.host = `${this.isHTTPs?'https':'http'}://localhost/` ; }
        this._preflightControler = _preflightController(opts) ;
        TSServer.setClearCachesInterval(opts?.clearCacheInterval) ;
    }


    // =================== instance methods =======================

    // resolves when the server listens to its port, or with the error which prevents it to
    private async _start():Promise<Error|undefined> {

        // Node does not wait for the promise returned by _handleRequest(), which handles its own
        // errors. This catches the ones which could happen in its error handling (eg. in an external logger)
        const requestListener = (req: http.IncomingMessage, res: http.ServerResponse) => {
            this._handleRequest(req, res).catch(() => {
                if (!res.headersSent) { res.writeHead(Resp.InternalError) ; }
                res.end() ;
            }) ;
        } ;

        let server:http.Server ;
        try {
            // with bad TLS options (eg. an invalid certificate or key), createServer() throws
            server = this.isHTTPs ?
                       https.createServer(this._serverOptions, requestListener) : 
                       http.createServer(this._serverOptions, requestListener) ;   
        }
        catch (e) { return e instanceof Error ? e : new Error(String(e)) ; }
        this._httpServer = server ;
        server.on('connection', this._onConnection.bind(this));
        server.on('request', this._onRequest.bind(this));

        return new Promise(resolve => {
            const onError = (e:Error) => { server.off('listening', onListening) ; resolve(e) ; } ;
            const onListening = () => { server.off('error', onError) ; resolve(undefined) ; } ;
            server.once('error', onError) ;
            server.once('listening', onListening) ;
            server.listen(this.port) ;
        }) ;
    }
    
    // =================== request management =======================

    private async _handleRequest(req: http.IncomingMessage, res: http.ServerResponse) {
        try { await this._routeRequest(req, res) ; }
        catch (e:any) { await this._sendError(e, req, res) ; }
    }

    // handles the request or throws a TSError giving the response status
    private async _routeRequest(req: http.IncomingMessage, res: http.ServerResponse) {
        const sm = $value(req.method?.toUpperCase(), Verb.Get) ;
        const url = TSURL.compose(this.host, $string(req.url)) ;
        if (!$ok(url)) {
            TSError.throw('Bad request url endpoint', Resp.NotFound, {
                host:this.host,
                path:$string(req.url),
                serverError:TSServerErrorCodes.BadEndPointPath
            }) ;    
        }
        const originKey = `${url.pathname}[${$value(req.headers["origin"], '*')}]`; 
        if (sm === 'OPTIONS') { return this._handlePreflight(url, originKey, req, res) ; }

        const method = this._allowedMethodsSet.has(sm) ? sm as Verb : undefined ;
        if (!$ok(method)) {
            TSError.throw(`Request method '${req.method}' is not allowed.`, Resp.NotAllowed, {
                method:req.method,
                path:$length(url.pathname) ? url.pathname : '/',
                serverError:TSServerErrorCodes.UnknownMethod
            }) ;
        }
        this._validateRootPath(url, req) ;

        // the end points are routed with the decoded path (it used to be the percent-encoded one, 
        // so a path with a space or an accent, like '/café', was never found)
        const route = this._router.route(_routedPathname(url.pathname)) ;
        if ($ok(route?.endPoint)) { return this._executeEndPoint(route.endPoint, route.parameters ?? {}, url, method, originKey, req, res) ; }
        if (method === Verb.Get && await this._sendStaticResource(url, req, res)) { return ; }

        // here the resource is not found
        TSError.throw(`endpoint ${method} '${url.pathname}' was not found.`, Resp.NotFound, {
            method:method,
            path:$length(url.pathname) ? url.pathname : '/',
            serverError:TSServerErrorCodes.ResourceNotFound
        }) ;
    }

    private async _handlePreflight(url:TSURL, originKey:string, req: http.IncomingMessage, res: http.ServerResponse) {
        const preflightResponse = await this._preflightControler(url, req.headers, res) ;
        if (!$ok(preflightResponse)) {
            res.writeHead(Resp.NotAllowed) ;
            res.end() ;
            if (this._logWarnings) {
                await this._logger(TSServerLogType.Warning, `did refuse preflight request for resource '${url.pathname}'.`, this, req) ;
            }
            return ;
        }
        const npfr = _normalizePreflightResponse(preflightResponse, this._allowedMethodsSet) ;
        res.setHeader("Access-Control-Allow-Origin", npfr.allowedOrigin!);
        res.setHeader("Access-Control-Allow-Methods", npfr.allowedMethods!);
        res.setHeader("Access-Control-Allow-Headers", npfr.allowedHeaders!);
        res.setHeader("Access-Control-Max-Age", $string(npfr.timeout!)) ;                    
        res.writeHead(Resp.NoContent) ;
        res.end() ;
        npfr.timeout = npfr.timeout! + $mark() ; // we change the duration in a moment in time
        this._preflightResponseCache.set(originKey, npfr) ;
        if (this._logInfo) { await this._logger(TSServerLogType.Log, `did accept preflight request for resource '${url.pathname}'.`, this, req) ; }
    }

    // an empty path is replaced by the root path, if there's one
    private _validateRootPath(url:TSURL, req: http.IncomingMessage) {
        if ($length(url.pathname) && url.pathname !== '/') { return ; }
        if (!this.rootPath.length) {
            TSError.throw('Root path is not Accessible', Resp.Forbidden, {
                method:req.method,
                path:'/',
                serverError:TSServerErrorCodes.InnaccessibleRoot
            }) ;    
        }
        url.pathname = this.rootPath ;
    }

    private async _executeEndPoint(endPoint:TSServerEndPoint, parameters:TSDictionary, url:TSURL, method:Verb, originKey:string, req: http.IncomingMessage, res: http.ServerResponse) {
        this._applyValidPreflight(originKey, res) ;
        if (this._developerMode) { await this._logRequestHeaders(req) ; }
        await endPoint.execute({
            url:url, 
            method:method, 
            parameters:parameters, 
            message:req,
            query:{}, // the final query will be calculated later
            body:undefined // the final body will be calculated later
        }, res, this._developerMode) ; 
        if (this._logInfo) { await this._logger(TSServerLogType.Log, `did handle ${TSServer.__methodColors[method]}${method}&w resource '${url.pathname}'.`, this, req) ; }
    }

    // a valid preflight response gives its allowed origin to the request response
    private _applyValidPreflight(originKey:string, res: http.ServerResponse) {
        const preflightResponse = this._preflightResponseCache.get(originKey) ;
        if (!$ok(preflightResponse)) { return ; }
        if (!_isValidPreflight(preflightResponse, $mark())) {
            this._preflightResponseCache.delete(originKey) ;
            return ;
        }
        if ($ok(preflightResponse.allowedOrigin)) { res.setHeader('Access-Control-Allow-Origin', preflightResponse.allowedOrigin) ; }
    }

    private async _logRequestHeaders(req: http.IncomingMessage) {
        const headers: NodeJS.Dict<string | string[]> = { ...req.headers };
        this._sensitiveHeaders.forEach(name => {
            const value = headers[name];
            if (value !== undefined) {
                headers[name] = Array.isArray(value) ? value.map(() => TSServer.SENSITIVE_HEADER_REPLACED_VALUE) : TSServer.SENSITIVE_HEADER_REPLACED_VALUE;
            }
        });
        await this._logger(TSServerLogType.Developer, `****** request headers ****:\n&j${$insp(headers)}&0`, this, req);
    }

    // returns true if one of the static web sites did send the resource
    private async _sendStaticResource(url:TSURL, req: http.IncomingMessage, res: http.ServerResponse):Promise<boolean> {
        for (const s of this._sites) {
            const [b, type] = s.getStaticResource(url.pathname) ;
            if ($ok(b)) {
                if (this._logInfo) { 
                    await this._logger(TSServerLogType.Log, `did handle static resource '${url.pathname}'.`, this, req) ; // NOSONAR: sequential by design
                }
                res.setHeader('Content-Type', type)
                res.writeHead(Resp.OK);
                res.end(b) ;
                return true ;
            }
        }
        return false ;
    }

    private async _sendError(e:any, req: http.IncomingMessage, res: http.ServerResponse) {
        const ret:TSDictionary = {} ;
        ret.status = $isunsigned(e?.status) && $isRespCode(e!.status!) ? e!.status! : Resp.InternalError ;
        ret.error = (e as Error).message ; 
        if (!$length(ret.error)) { ret.error = 'Unknown internal Error' ; }
        if ($ok(e.info)) { ret.info = e.info ; }
        if ($isnumber(e.errorCode)) { ret.errorCode = e.errorCode ; }
        if (this._logWarnings) { await this._logErrorResponse(ret, req) ; }
        res.writeHead(ret.status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(ret)) ;
    }

    private async _logErrorResponse(ret:TSDictionary, req: http.IncomingMessage) {
        await this._logger(TSServerLogType.Warning, `${ret.status} - ${ret.error}`, this, req) ;
        const errors = ret.info?.errors ;
        if (!$isarray(errors)) { return ; }
        for (let i = 0 ; i < errors.length ; i++) {
            await this._logger(TSServerLogType.Warning, `      + error[${i+1}]: ${$string(errors[i])}`, this, req) ; // NOSONAR: sequential by design
        }
    }

    private _onConnection(socket:Socket) {
        this._connections.set(socket, { refcount:0, closeHeaderSent:false }) ;
        socket.once('close', () => this._connections.delete(socket)) ;
    }

    private _onRequest(request: http.IncomingMessage, response: http.ServerResponse) {
        const socket = request.socket ;
        const info = this._connections.get(socket) ;
        if (info) { 
            info.refcount ++ ;
            if (this._terminating && !response.headersSent) {
                response.setHeader('Connection', 'close') ;
                info.closeHeaderSent = true ;
            }
        }
        response.on('finish', () => { this._requestDidEnd(request) ; }) ;
    }
    
    private _requestDidEnd(request: http.IncomingMessage) {
        const socket = request.socket ;
        const info = this._connections.get(socket) ;
        if (info) {
            info.refcount -- ;
            if (this._terminating && info.refcount === 0 && info.closeHeaderSent) { 
                socket.end() ;
            }
        }
    }

    // TSStaticWebsite.clearCaches() is synchronous: there is nothing to await here
    private _clearCaches() {
        // clearing expired preflights
        const timestamp = $mark() ;
        $conditionalClearMap(this._preflightResponseCache, (_,v) => !_isValidPreflight(v, timestamp)) ;
        // clearing web sites caches
        this._sites.forEach(s => s.clearCaches()) ;
    }

    private async _stop():Promise<Error|undefined> { 
        if (this._logInfo) {
            await this._logger(TSServerLogType.Log, `server is exiting...`, this) ;
        }
        if ($ok(this._httpServer)) {
            const ret = await this._internalStopServer() ;
            if ($ok(ret) && this._logErrors) {
                await this._logger(TSServerLogType.Error, `cannot stop for reason ${ret.name}:\n${ret.message}`, this) ;
            }
            return ret ;
        } ; 
        return undefined
    }

    private async _internalStopServer():Promise<Error|undefined> {
        if ($ok(this._httpServer)) {
            this._terminating = true ; // when _internalStopServer() is called once, we stay in terminating mode
            // the closing error is returned (and not thrown), as stated by stop() signature
            const ret = new Promise<Error|undefined>(resolve => {
                this._httpServer!.close(error => resolve($ok(error) ? error : undefined)) ;
            }) ;

            /**
             * whatever we have in effective server close, as we asked for closing,
             * we will firt try to close all idle known connections and then 
             * effective force all remaining connections closing after a while
             */
            this._connections.forEach((info:ConnectionStatus, socket:Socket) => { 
                if (info.refcount === 0) { socket.end() ; }
            }) ;

            // unref() : this timer must not keep the process alive once everything is closed
            setTimeout(() => {
                this._connections.forEach((_:ConnectionStatus, socket:Socket) => { 
                    if ($ismethod(socket, 'destroy')) { (socket as any).destroy() ; }
                    else { socket.end() ; } 
                }) ;
                this._connections.clear() ; 
            }, this._forceCloseTimeout).unref() ;

            return ret ;
        }
        return undefined ;
    }
}

// ================ private interfaces =======================
interface InternalServerOptions {
    cert?:Buffer, 
    key?:Buffer,
    ca?:Buffer 
    maxHeaderSize?:number,
    sessionTimeout?:number,
    handshakeTimeout?:number
    requestCert?:boolean,
    rejectUnauthorized?:boolean
}

interface ConnectionStatus {
    refcount:number,
    closeHeaderSent:boolean
}

// ================ private functions =======================
function _internalServerOptions(opts:TSServerOptions, isHTTPs:boolean):InternalServerOptions {
    const ret:InternalServerOptions = {} ;
    if (isHTTPs) {
        ret.cert = $bufferFromDataLike(opts.certificate!) ;
        ret.key = $bufferFromDataLike(opts.key!) ;
        if ($length(opts.certificateAuthority) > 0) { ret.ca = $bufferFromDataLike(opts.certificateAuthority!) ; }
        if (opts.mtls) { 
            ret.requestCert = true ; 
            ret.rejectUnauthorized = true ; 
        }
        const sessionTimeout = $unsigned(opts.tlsSecTimeout) ;
        if (sessionTimeout > 0) { ret.sessionTimeout = sessionTimeout ; }
        const handshakeTimeout = $unsigned(opts.handshakeMsTimeout) ;
        if (handshakeTimeout > 0) { ret.handshakeTimeout = handshakeTimeout ; }
    }
    const n = $unsigned(opts.maxHeaderSize) ;
    if (n > 0) { ret.maxHeaderSize = n ; }
    return ret ;
}

function _staticWebsites(endPoints:TSDictionary<TSEndpointsDefinition>, opts:TSServerOptions):TSStaticWebsite[] {
    const keys = $ok(opts.webSites) ? $keys(opts.webSites) : [] ;
    if ($inbrowser() && keys.length) { 
        TSError.throw('TSServer cannot handle static websides inside a browser', { endPoints:endPoints, options:opts }) ; 
    }
    return keys.map(u => new TSStaticWebsite(u as string, opts.webSites![u])) ;
}

function _serverPort(endPoints:TSDictionary<TSEndpointsDefinition>, opts:TSServerOptions, isHTTPs:boolean):number {
    if (!$ok(opts.port)) { return 3000 ; }
    if (!$isunsigned(opts.port, UINT16_MAX)) { 
        TSError.throw(`TSServer.constructor(): Bad ${isHTTPs?'HTTPS':'HTTP'} server port ${opts.port}.`, {
            endPoints:endPoints,
            options:opts
        }) ;
    } 
    return opts.port ;
}

function _preflightController(opts:TSServerOptions):TSPreflightController {
    if (!$ok(opts.preflightController) || opts.preflightController === 'default') { return _defaultPreflightController ; }
    if (opts.preflightController === 'permisive') { return _permisivePreflightController ; }
    return opts.preflightController ;
}

// decodes the valid percent-encoded sequences of a path. An encoded '/' stays encoded, so it cannot 
// create a new path segment, and a '%' which does not start a valid UTF-8 sequence stays as it is
// (like in '/100%', which URL accepts)
function _routedPathname(pathname:string):string {
    return pathname.replaceAll(/(?:%[0-9A-Fa-f]{2})+/g, run => {
        let decoded:string ;
        try { decoded = decodeURIComponent(run) ; }
        catch { return run ; }
        return decoded.replaceAll('/', '%2F') ;
    }) ;
}

function __clearCaches() { TSServer.clearCaches() ; }

// a cached preflight response is valid until its timeout, which is the moment it expires
// (the Access-Control-Max-Age duration added to the moment of the preflight request)
function _isValidPreflight(response:TSPreflightResponse, now:number):boolean {
    return $ok(response.timeout) && response.timeout! >= now ;
}

let __logIndex:number = 0 ;
// the TSServerLogger contract is asynchronous: a resolved promise is returned
const _internalLogger = (type:TSServerLogType, message:string, server?: TSServer, _req?: http.IncomingMessage):Promise<void> => {
    if (!__logIndex) { $logterm('') ; }

    let serverLog = '';
    if ($ok(server)) {
        const httpLog = server.isHTTPs ? 'https' : 'http';
        serverLog = `&w${httpLog} server&x:${server.port}`;
    }
    $logterm(`&0&xfoundation-ts[${serverLog}]-${__TSServerlogHeaders[type]}&0 &w${message} &d(${++__logIndex})&0`) ;
    return Promise.resolve() ;
} ;

const __TSServerlogHeaders:StringDictionary = {
    'Dev':      "&X&w DEVELOP ",
    'Info':     "&C&w LOGGING ",
    'Warning':  "&O&w WARNING ",
    'Error':    "&R&w  ERROR  "
} ;

function _normalizePreflightResponse(r:TSPreflightResponse, verbSet:Set<string>):Required<TSPreflightResponse> {
    let origin = $ftrim(r.allowedOrigin) ; if (!origin.length) { origin = '*' ; }
    let timeout = $unsigned(r.timeout) ;
    if (!timeout || timeout > 86400) { timeout = 86400 as uint ; }   // one day max
    if (timeout < 10) { timeout = 10 as uint ; }                      // 10 seconds min

    let methodSet = $strings(r.allowedMethods).filteredSet(m => { 
        m = $ftrim(m).toUpperCase() ;
        return verbSet.has(m) ? m : undefined ; 
    }) ;
    let methods = methodSet.size && !methodSet.has('*') ? Array.from(methodSet) : Object.values(Verb) ;
    methods.push('OPTIONS') ;

    let headersSet =  $strings(r.allowedHeaders).filteredSet(h => {
        h = $ftrim(h).toLowerCase() ;
        return h.length ? h : undefined ;
    }) ;
    let headers:string|string[] ;
    if (headersSet.has('*')) { headers = '*' ; }
    else {
        headersSet.add('content-type') ;
        headersSet.add('accept') ;
        headers = Array.from(headersSet) ;
    }

    return { allowedOrigin:origin, allowedMethods:methods, allowedHeaders:headers, timeout:timeout}

}

// the TSPreflightController contract is asynchronous: resolved promises are returned
function _permisivePreflightController(_url:TSURL, _headers:http.IncomingHttpHeaders, _res:http.ServerResponse):Promise<TSPreflightResponse> {
    return Promise.resolve({ allowedOrigin:undefined, allowedHeaders:undefined, allowedMethods:undefined }) ;
}

function _defaultPreflightController(_url:TSURL, headers:http.IncomingHttpHeaders, _res:http.ServerResponse):Promise<TSPreflightResponse> {
    // the preflight request gives the headers the actual request wants to send in Access-Control-Request-Headers
    const acceptedHeaders = $value(headers["access-control-request-headers"]?.split(',').map(s=>$ftrim(s).toLowerCase()), []) ;
    //if (!acceptedHeaders.includes('accept')) { acceptedHeaders.push('accept') ; }
    if (!acceptedHeaders.includes('content-type')) { acceptedHeaders.push('content-type') ; }

    const acceptedMethods = headers["access-control-request-method"]?.split(',').map(s=>$ftrim(s).toUpperCase()) ;


    return Promise.resolve({ allowedOrigin:headers["origin"], allowedHeaders:acceptedHeaders, allowedMethods:acceptedMethods }) ;
}

