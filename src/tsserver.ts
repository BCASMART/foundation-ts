import * as http from "http";
import * as https from "https"

//import { createServer, IncomingMessage, Server, ServerResponse } from "http";

import { $count, $defined, $isarray, $ismethod, $isnumber, $isunsigned, $keys, $length, $objectcount, $ok, $string, $strings, $unsigned, $value } from "./commons";
import { $ftrim } from "./strings";
import { $isabsolutepath } from "./fs";
import { TSError, TSHttpError } from "./tserrors";
import { Resp, Verb } from "./tsrequest";
import { Nullable, StringDictionary, TSDictionary, uint, uint16, UINT16_MAX } from "./types";
import { $inbrowser, $logterm, $mark } from "./utils";

import Socket = NodeJS.Socket;
import { TSPreflightController, TSPreflightResponse, TSEndpointsDefinition, TSServerErrorCodes, TSServerStartStatus, TSWebSiteDefinition } from "./tsserver_types";
import { TSServerEndPoint } from "./tsserver_endpoints";
import { TSStaticWebsite } from "./tsserver_websites";

/**
 * This is a minimal singleton HTTP server class provided for testing
 * 
 * You start a new async API server on default port 3000 by a single line : 
 *   TSServer.start({ ... my endpoints definitions dictionary ... }) ;
 * 
 * in order to create an https server, you only need to provide your valid 
 * key and certificate in TSServerOptions
 */

export type TSServerLogger = (server:TSServer, req:http.IncomingMessage|undefined, type:TSServerLogType, messages:string) => Promise<void> ;

export enum TSServerLogType {
    Developer = 'Dev',
    Log       = 'Info',
    Warning   = 'Warning',
    Error     = 'Error'
} ;

export interface TSServerOptions {
    logger?:TSServerLogger ;
    host?:string ;
    port?:uint16 ;
    rootPath?:string ; // set that path to a real page if you want to have an available root page. Must be absolute
    webSites?:TSDictionary<TSWebSiteDefinition|string> ; // [starting path] => folders
    logInfo?:boolean ;
    developer?:boolean ;
    key?:Nullable<Buffer> ;
    certificate?:Nullable<Buffer> ;
    maxHeaderSize?:Nullable<number> ;
    tlsSecTimeout?:Nullable<number> ; // The number of seconds after which a TLS session will no longer be resumable. default 300.
    handshakeMsTimeout?:Nullable<number> ; // Abort the connection if the SSL/TLS handshake does not finish in the specified number of milliseconds.
    forceCloseMsTimeout?:Nullable<number> ; // timeout to force remaining connection after server stop. Default is 15000
    preflightController?:Nullable<TSPreflightController>|'default'|'permisive' ;
    clearCacheInterval?:Nullable<number> ; // default is 900s (15 mn)
} 

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
    private static readonly DEFAULT_CLOSE_TIMEOUT = 15000 ;
    private static __methodColors:{[key in Verb]:string} = { GET:'&j', POST:'&u', PUT:'&v', DELETE:'&r', PATCH:'&o' }
    private static _internalClearTimer:any = undefined ;
    private static _lastClearTimerInterval:number = 900 ;
    public readonly host:string ;
    public readonly port:number ;
    public readonly rootPath:string = '' ;
    public readonly isHTTPs:boolean = false ;
    private _serverOptions:InternalServerOptions = {} ;
    private _httpServer:http.Server|https.Server|undefined ;
    private _endPoints:TSServerEndPoint[] ;
    private _sites:TSStaticWebsite[] ; 
    private _logger:TSServerLogger ;
    private _logInfo:boolean ;
    private _connections = new Map<Socket, ConnectionStatus>;
    private _terminating:boolean = false ;
    private _forceCloseTimeout:number ;
    private _developerMode:boolean ;
    private _preflightControler:TSPreflightController ;
    private _allowedMethodsSet:Set<string> = new Set(Object.values(Verb) as string[]) ;
    private _preflightResponseCache = new Map<string, TSPreflightResponse>() ; // origin => response

    // =================== static methods =======================
    public static async start(endPoints:Nullable<TSDictionary<TSEndpointsDefinition>>, opts?:Nullable<TSServerOptions>):Promise<TSServerStartStatus|Error> {

        if (TSServer.__server) { return TSServerStartStatus.AlreadyRunning ; }
        
        if ($objectcount(endPoints) === 0 && $objectcount(opts?.webSites) === 0) {
            return new TSError('TSServer must at least serve one static website or one end point', { 
                endPoints:endPoints, 
                options:opts 
            }) ; 
        }

        try { TSServer.__server = new TSServer($value(endPoints, {}), $value(opts, {})) ; }
        catch (e) { return e as Error ; }
        
        await TSServer.__server._start() ;

        return TSServer.__server.isHTTPs ? TSServerStartStatus.HTTPS : TSServerStartStatus.HTTP ;
    }

    public static async isRunning() { return $ok(TSServer.__server) ; }

    public static async clearCaches() { 
        if (TSServer.__server) { await TSServer.__server._clearCaches() ; }
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
        this._logger = $ok(opts.logger) ? opts.logger! : _internalLogger ;
        this._developerMode = !!opts.developer ;
        this._logInfo = !!opts.logInfo || this._developerMode ;
        this.isHTTPs = $length(opts.key) > 0 && $length(opts.certificate) > 0 ;

        if (this.isHTTPs) {
            this._serverOptions.cert = opts.certificate! ;
            this._serverOptions.key = opts.key! ;
            let t = $unsigned(opts.tlsSecTimeout) ;
            if (t > 0) { this._serverOptions.sessionTimeout = t ; }
            t = $unsigned(opts.handshakeMsTimeout) ;
            if (t > 0) { this._serverOptions.handshakeTimeout = t ; }
        }
        const n = $unsigned(opts.maxHeaderSize) ;
        if (n > 0) { this._serverOptions.maxHeaderSize = n ; }

        const ft = $unsigned(opts.forceCloseMsTimeout) ;
        this._forceCloseTimeout = ft === 0 ? TSServer.DEFAULT_CLOSE_TIMEOUT : ft ;

        const rp = $ftrim(opts.rootPath) ;
        if (rp.length > 1 && $isabsolutepath(rp)) { this.rootPath = rp ; }

        // ========= first construct the static websites architecture (only if we're not inside a browser )==========
        this._sites = [] ;
        if ($ok(opts.webSites)) {
            const keys = $keys(opts.webSites!) ;
            if ($inbrowser() && keys.length) { 
                throw new TSError('TSServer cannot handle static websides inside a browser', { endPoints:endPoints, options:opts }) ; 
            }
            if ($count(keys)) {
                keys.forEach(u => {
                    this._sites.push(new TSStaticWebsite(u as string, opts.webSites![u])) ;
                }) ;    
            }

        }

        // ========= second construct the dynamic endpoints ==========
        this._endPoints = [] ;
        $keys(endPoints).forEach(path => {
            this._endPoints.push(new TSServerEndPoint(path as string, endPoints[path])) ;
        }) ;

        if ($ok(opts.port)) {
            if (!$isunsigned(opts.port, UINT16_MAX)) { 
                throw new TSError(`TSServer.constructor(): Bad ${this.isHTTPs?'HTTPS':'HTTP'} server port ${opts.port}.`, {
                    endPoints:endPoints,
                    options:opts
                }) ;
            } 
            this.port = opts.port!;
        }
        else { this.port = 3000 ; }

        this.host = $ftrim(opts.host) ;
        if (!this.host.length) { this.host = `${this.isHTTPs?'https':'http'}://localhost/` ; }
        if (!$ok(opts.preflightController) || opts.preflightController === 'default') { this._preflightControler = _defaultPreflightController ; }
        else if (opts.preflightController === 'permisive') { this._preflightControler = _permisivePreflightController ; }
        else { this._preflightControler = opts.preflightController! ; }
        TSServer.setClearCachesInterval(opts?.clearCacheInterval) ;
    }


    // =================== instance methods =======================

    private async _start() {
        const managementCallBack = async (req: http.IncomingMessage, res: http.ServerResponse) => {
            try {
                // validating method
                const sm = $value(req.method?.toUpperCase(), Verb.Get) ;
                const url = new URL($string(req.url), this.host);
                const originKey = `${url.pathname}[${$value(req.headers["origin"], '*')}]`; 
                
                if (sm === 'OPTIONS') {
                    const preflightResponse = await this._preflightControler(url, req.headers, res) ;
                    if ($ok(preflightResponse)) {
                        const npfr = _normalizePreflightResponse(preflightResponse!, this._allowedMethodsSet) ;
    
                        res.setHeader("Access-Control-Allow-Origin", npfr.allowedOrigin!);
                        res.setHeader("Access-Control-Allow-Methods", npfr.allowedMethods!);
                        res.setHeader("Access-Control-Allow-Headers", npfr.allowedHeaders!);
                        res.setHeader("Access-Control-Max-Age", $string(npfr.timeout!)) ;                    
                        res.writeHead(Resp.NoContent) ;
                        res.end() ;
                        npfr.timeout = npfr.timeout! + $mark() ; // we change the duration in a moment in time
                        this._preflightResponseCache.set(originKey, npfr) ;

                        if (this._logInfo) { await this._logger(this, req, TSServerLogType.Log, `did accept preflight request for resource '${url.pathname}'.`) ; }
                    }
                    else {
                        res.writeHead(Resp.NotAllowed) ;
                        res.end() ;
                        await this._logger(this, req, TSServerLogType.Warning, `did refuse preflight request for resource '${url.pathname}'.`) ;
                    }
                    return ;
                }

                const method = this._allowedMethodsSet.has(sm) ? sm as Verb : undefined ;

                if (!$ok(method)) {
                    throw new TSHttpError(`Request method '${req.method}' is not allowed.`, Resp.NotAllowed, {
                        method:req.method,
                        path:$length(url.pathname) ? url.pathname : '/' 
                    }, TSServerErrorCodes.UnknownMethod) ;
                }

                // validating url
                if (!$length(url.pathname) || url.pathname === '/') {
                    if (this.rootPath.length) { url.pathname = this.rootPath ; }
                    else {
                        throw new TSHttpError('Root path is not Accessible', Resp.Forbidden, {
                            method:req.method,
                            path:'/'
                        }, TSServerErrorCodes.InnaccessibleRoot) ;    
                    }
                }
                
                let sep:TSServerEndPoint|undefined = undefined ;
                let parameters:TSDictionary = {} ;
                this._endPoints.forEach(ep => {
                    const params = ep.parametersFromPath(url.pathname) ;
                    if ($ok(params) && (!$defined(sep) || sep!.depth < ep.depth)) {
                        sep = ep ;
                        parameters = params!
                    }
                })

                if ($ok(sep)) {
                    let preflightResponse = this._preflightResponseCache.get(originKey) ;
                    if ($ok(preflightResponse) && (!$ok(preflightResponse?.timeout) || preflightResponse!.timeout! >= $mark())) {
                        this._preflightResponseCache.delete(originKey) ;
                        preflightResponse = undefined ;
                    }
                    if ($ok(preflightResponse?.allowedOrigin)) {
                        if ($ok(preflightResponse!.timeout) && preflightResponse!.timeout! < $mark()) {
                            res.setHeader('Access-Control-Allow-Origin', preflightResponse!.allowedOrigin!) ;
                        }
                    }

                    await sep!.execute({
                        url:url, 
                        method:method!, 
                        parameters:parameters, 
                        message:req,
                        developerMode:this._developerMode,
                        query:{}, // the final query will be calculated later
                        body:undefined // the final body will be calculated later
                    }, res) ; 
                    if (this._logInfo) { await this._logger(this, req, TSServerLogType.Log, `did handle ${TSServer.__methodColors[method!]}${method!}&w resource '${url.pathname}'.`) ; }
                    return ;
                }
                else if (method === Verb.Get) {
                    for (let s of this._sites) {
                        const [b, type] = s.getStaticResource(url.pathname) ;
                        if ($ok(b)) {
                            if (this._logInfo) { await this._logger(this, req, TSServerLogType.Log, `did handle static resource '${url.pathname}'.`) ; }
                            res.setHeader('Content-Type', type)
                            res.writeHead(Resp.OK);
                            res.end(b!) ;
                            return ;
                        }
                    }
                }
                
                // here the resource is not found
                throw new TSHttpError(`endpoint ${method} '${url.pathname}' was not found.`, Resp.NotFound, {
                    method:method,
                    path:$length(url.pathname) ? url.pathname : '/'
                }, TSServerErrorCodes.ResourceNotFound) ;
            }
            catch (e:any) {
                let ret:TSDictionary = {} ;
                ret.status = $isunsigned(e?.status) && Object.values(Resp).includes(e!.status!) ? e!.status! : Resp.InternalError ;
                ret.error = (e as Error).message ; 
                if (!$length(ret.error)) { ret.error = 'Unknown internal Error' ; } ;
                if ($ok(e.info)) { ret.info = e.info ; }
                if ($isnumber(e.errorCode)) { ret.errorCode = e.errorCode! ; }
                await this._logger(this, req, TSServerLogType.Warning, `${ret.status} - ${ret.error}`) ;
                const errors = ret.info?.errors ;
                if ($isarray(errors)) {
                    const n = $count(errors) ;
                    for (let i = 0 ; i < n ; i++) {
                        await this._logger(this, req, TSServerLogType.Warning, `      + error[${i+1}]: ${$string(errors[i])}`) ;
                    }
                }
                res.writeHead(ret.status, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(ret)) ;
            }
        } ;

        this._httpServer = this.isHTTPs ?
                           https.createServer(this._serverOptions, managementCallBack) : 
                           http.createServer(this._serverOptions, managementCallBack) ;   
        
        this._httpServer.on('connection', this._onConnection.bind(this));
        this._httpServer.on('request', this._onRequest.bind(this));
                            
        this._httpServer.listen(this.port, async ()=>{
            if (this._logInfo) {
                await this._logger(this, undefined, TSServerLogType.Log, `running on port ${this.port} '${this.host}' ...`) ;
            }
        }) ;
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

    private async _clearCaches() {
        // clearing old preflights
        const timestamp = $mark() ;
        this._preflightResponseCache.conditionalClear((_,v) => !$ok(v.timeout) || v.timeout! > timestamp) ;

        // clearing web sites caches
        for (let s of this._sites) { await s.clearCaches() ; }
    }

    private async _stop():Promise<Error|undefined> { 
        if (this._logInfo) {
            await this._logger(this, undefined, TSServerLogType.Log, `server is exiting...`) ;
        }
        if ($ok(this._httpServer)) {
            const ret = await this._internalStopServer() ;
            if ($ok(ret)) {
                await this._logger(this, undefined, TSServerLogType.Error, `cannot stop for reason ${ret!.name}:\n${ret!.message}`) ;
            }
            return ret ;
        } ; 
        return undefined
    }

    private async _internalStopServer():Promise<Error|undefined> {
        if ($ok(this._httpServer)) {
            this._terminating = true ; // when _internalStopServer() is called once, we stay in terminating mode
            const ret = new Promise((resolve, reject) => {
                this._httpServer!.close((error) => {
                    if ($ok(error)) { return reject(error) ; }
                    resolve(undefined);
                }) ;
            }) as Promise<Error|undefined> ;

            /**
             * whatever we have in effective server close, as we asked for closing,
             * we will firt try to close all idle known connections and then 
             * effective force all remaining connections closing after a while
             */
            this._connections.forEach((info:ConnectionStatus, socket:Socket) => { 
                if (info.refcount === 0) { socket.end() ; }
            }) ;

            setTimeout(() => {
                this._connections.forEach((_:ConnectionStatus, socket:Socket) => { 
                    if ($ismethod(socket, 'destroy')) { (socket as any).destroy() ; }
                    else { socket.end() ; } 
                }) ;
                this._connections.clear() ; 
            }, this._forceCloseTimeout)

            return ret ;
        }
        return undefined ;
    }
}

// ================ private interfaces =======================
interface InternalServerOptions {
    cert?:Buffer, 
    key?:Buffer, 
    maxHeaderSize?:number,
    sessionTimeout?:number,
    handshakeTimeout?:number
}

interface ConnectionStatus {
    refcount:number,
    closeHeaderSent:boolean
}

// ================ private functions =======================
async function __clearCaches() { TSServer.clearCaches() ; }

let __logIndex:number = 0 ;
const _internalLogger = async (server:TSServer, _:http.IncomingMessage|undefined, type:TSServerLogType, message:string) => {
    if (!__logIndex) { $logterm('') ; }
    $logterm(`&0&xfoundation-ts[&w${server.isHTTPs?'https':'http'} server&x:${server.port}]-${__TSServerlogHeaders[type]}&0 &w${message} &d(${++__logIndex})&0`) ;
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
        methodSet.add('content-type') ;
        methodSet.add('accept') ; // TODO: do we need to keep it here
        headers = Array.from(headersSet) ;
    }

    return { allowedOrigin:origin, allowedMethods:methods, allowedHeaders:headers, timeout:timeout}

}

// @ts-ignore
async function _permisivePreflightController(url:URL, headers:http.IncomingHttpHeaders, res:http.ServerResponse):Promise<TSPreflightResponse> {
    return { allowedOrigin:undefined, allowedHeaders:undefined, allowedMethods:undefined } ;
}

// @ts-ignore
async function _defaultPreflightController(url:URL, headers:http.IncomingHttpHeaders, res:http.ServerResponse):Promise<TSPreflightResponse> {
    const acceptedHeaders = $value(headers["access-control-allow-headers"]?.split(',').map(s=>$ftrim(s).toLowerCase()), []) ;
    //if (!acceptedHeaders.includes('accept')) { acceptedHeaders.push('accept') ; }
    if (!acceptedHeaders.includes('content-type')) { acceptedHeaders.push('content-type') ; }

    const acceptedMethods = headers["access-control-request-method"]?.split(',').map(s=>$ftrim(s).toUpperCase()) ;


    return { allowedOrigin:headers["origin"], allowedHeaders:acceptedHeaders, allowedMethods:acceptedMethods }
}

