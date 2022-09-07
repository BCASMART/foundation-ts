import { createServer, IncomingMessage, Server, ServerResponse } from "http";

import { $defined, $isunsigned, $keys, $length, $ok, $string, $toint, $ftrim } from "./commons";
import { TSHttpError } from "./tserrors";
import { Resp, Verb } from "./tsrequest";
import { AnyDictionary, StringDictionary, TSDictionary, uint16, UINT16_MAX } from "./types";
import { $inbrowser, $logterm } from "./utils";

import { TSParametricEndPoints, TSStaticWebsite, TSStaticWebSiteOptions } from "./tsservercomp";
import { TSDate } from "./tsdate";
import { TSColor } from "./tscolor";

/**
 * This is a minimal singleton HTTP server class provided for testing
 * 
 * You start a new async API server on default port 3000 by a single line : 
 *   TSServer.start({ ... my endpoints definitions dictionary ... }) ;
 * 
 */
export interface TSServerRequest {
    method:Verb,                      // request method
    url:URL,                          // request URL
    parameters:TSParameterDictionary, // a key-value parametric path dictionary
    query:TSQueryDictionary,          // a key-value query dictionary
    message:IncomingMessage           // Node object
}
export type TSServerResponse = ServerResponse ;

export type TSEndPointManager = (req:TSServerRequest, resp:TSServerResponse) => Promise<void> ;
export interface TSEndPoint {
    manager:TSEndPointManager,
    query?: TSQueryDefinition // for future usage
}

export type TSEndPoints = { [key in Verb]?: TSEndPoint|TSEndPointManager; };
export type TSEndPointsDictionary = TSDictionary<TSEndPoints|TSEndPoint|TSEndPointManager> ;
export type TSEndPointParameter = string|number|boolean|TSDate|TSColor ; // QUESTION: should we remove some types here ?
export type TSParameterDictionary = TSDictionary<TSEndPointParameter> ;
export type TSQueryValue = TSEndPointParameter ; // QUESTION: more types here ?
export type TSQueryDictionary = TSDictionary<TSQueryValue> ; 

export const TSParametricTokenType = {
    string   : 'string',
    number   : 'number',
    int      : 'int',
    unsigned : 'unsigned',
    boolean  : 'boolean',
    date     : 'date',
    color    : 'color',
    uuid     : 'uuid',
    email    : 'email'
} as const ;

export type TSParametricTokenType = typeof TSParametricTokenType[keyof typeof TSParametricTokenType];

export interface TSParametricToken {
    name:string,
    type:TSParametricTokenType ;
}
export interface TSQueryItem {
    type:TSParametricTokenType,
    mandatory?:boolean
}
export type TSQueryDefinition = TSDictionary<TSParametricTokenType|TSQueryItem> ; // if there's only a TSParametricTokenType as value, the item is optional

export interface TSServerOptions extends TSStaticWebSiteOptions {
    host?:string,
    port?:uint16,
    webSites?:StringDictionary, // [starting path] => folders
    logInfos?:boolean 
} 
export class TSServer {
    public readonly host:string ;
    public readonly port:number ;

    private static __server:TSServer|undefined = undefined ;

    private _httpServer:Server|undefined ;
    private _endPoints:TSParametricEndPoints[] ;
    private _sites:TSStaticWebsite[] ;
    private _logger:TSServerLogger ;
    private _logInfos:boolean ;

    // =================== static methods =======================
    public static async start(endPoints:TSEndPointsDictionary, opts:TSServerOptions) {
        if (!TSServer.__server) {
            TSServer.__server = new TSServer(endPoints, opts) ;
            await TSServer.__server._start() ;
        }
    }

    public static async clearCaches() { if (TSServer.__server) { await TSServer.__server._clearCaches() ; }}

    // returns undefined if the server is stoped.
    // after that you can do a new server start
    public static async stop():Promise<Error|undefined> {
        if (TSServer.__server) { 
            const e = await TSServer.__server._stop() ; 
            if (!$ok(e)) { delete TSServer.__server ; }
            return e ;
        }
        return undefined ;
    }

    // =================== CONSTRUCTOR =======================

    private constructor(endPoints:TSEndPointsDictionary, opts:TSServerOptions = {}) {

        this._logger = $ok(opts.logger) ? opts.logger! : _internalLogger ;
        this._logInfos = !!opts.logInfos ;

        // ========= first construct the static websites architecture (only if we're not inside a browser )==========
        this._sites = [] ;
        if ($ok(opts.webSites)) {
            const keys = $keys(opts.webSites!) ;
            if ($inbrowser() && keys.length) { throw 'TSServer cannot handle static websides inside a browser' ; }
            keys.forEach(u => {
                this._sites.push(new TSStaticWebsite(u as string, opts.webSites![u], {
                    logger:this._logger,
                    managedTypes:opts.managedTypes,
                    maxCacheSize:opts.maxCacheSize,
                    maxCachedFileSize:opts.maxCachedFileSize,
                    maxCachedFiles:opts.maxCachedFiles,
                    maxBlacklistedFiles:opts.maxBlacklistedFiles
                })) ;
            }) ;

        }

        // ========= second construct the dynamic endpoints ==========
        this._endPoints = [] ;
        $keys(endPoints).forEach(path => {
            this._endPoints.push(new TSParametricEndPoints(path as string, endPoints[path], true)) ;
        }) ;

        if ($ok(opts.port)) {
            this.port = $toint(opts.port, UINT16_MAX) ;
            if (this.port <= 0 || this.port > UINT16_MAX) { throw `Bad HTTP server port ${this.port}.` ; }    
        }
        else { this.port = 3000 ; }

        this.host = $ftrim(opts.host) ;
        if (!this.host.length) { this.host = 'http://localhost/' ; }
    }


    // =================== instance methods =======================

    private async _start() {
        this._httpServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
            try {
                // validating method
                const method = TSParametricEndPoints.validRequestMethod(req.method) ;
                const url = new URL($string(req.url), this.host);

                if (!$ok(method)) {
                    throw new TSHttpError(`Request method '${req.method}' is not allowed.`, Resp.NotAllowed, {
                        method:req.method,
                        path:$length(url.pathname) ? url.pathname : '/' 
                    }) ;
                }

                // validating url
                if (!$length(url.pathname) || url.pathname === '/') {
                    throw new TSHttpError('Root path is not Accessible', Resp.Forbidden, {
                        method:req.method,
                        path:'/'
                    }) ;
                }

                let pep:TSParametricEndPoints|undefined = undefined ;
                let parameters:TSParameterDictionary = {} ;
                this._endPoints.forEach(ep => {
                    const params = ep.parametersFromPath(url.pathname) ;
                    if ($ok(params) && (!$defined(pep) || pep!.depth < ep.depth)) {
                        pep = ep ;
                        parameters = params!
                    }
                })

                if ($ok(pep)) {
                    // we have a potential dynamic resource ;
                    await pep!.execute({
                        url:url, 
                        method:method!, 
                        parameters:parameters, 
                        message:req,
                        query:{} // the final query will be calculated after
                    }, res) ; 
                    if (this._logInfos) { await this._logger(this, req, TSServerLogType.Log, `did handle resource '${url.pathname}'.`) ; }
                    return ;
                }
                else if (method === Verb.Get) {
                    for (let s of this._sites) {
                        const [b, type] = s.getStaticResource(url.pathname) ;
                        if ($ok(b)) {
                            if (this._logInfos) { await this._logger(this, req, TSServerLogType.Log, `did handle static resource '${url.pathname}'.`) ; }
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
                }) ;
            }
            catch (e:any) {
                let ret:AnyDictionary = {} ;
                ret.status = $isunsigned(e?.status) && Object.values(Resp).includes(e!.status!) ? e!.status! : Resp.InternalError ;
                ret.error = (e as Error).message ; if (!$length(ret.error)) { ret.error = 'Unknown internal Error' ; } ;
                if ($ok(e.infos)) { ret.infos = e.infos ; }
                await this._logger(this, req, TSServerLogType.Warning, `${ret.status} - ${ret.error}`)
                res.writeHead(ret.status, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(ret)) ;
            }

        }) ;        
        this._httpServer.listen(this.port, async ()=>{
            await this._logger(this, undefined, TSServerLogType.Log, `running on port ${this.port} '${this.host}' ...`) ;
        }) ;
    }
    
    private async _clearCaches() { for (let s of this._sites) { await s.clearCaches() ; }}

    private async _stop():Promise<Error|undefined> { 
        await this._logger(this, undefined, TSServerLogType.Log, `server is exiting...`) ;
        if ($ok(this._httpServer)) {
            const ret = await _internalStopServer(this._httpServer!) ;
            if ($ok(ret)) {
                await this._logger(this, undefined, TSServerLogType.Error, `cannot stop for reason ${ret!.name}:\n${ret!.message}`) ;
            }
            return ret ;
        } ; 
        return undefined
    }

}


export enum TSServerLogType {
    Log     = 'Info',
    Warning = 'Warning',
    Error   = 'Error'
} ;
export type TSServerLogger = (server:TSServer, req:IncomingMessage|undefined, type:TSServerLogType, messages:string) => Promise<void> ;


// ================ private functions =======================
const _internalStopServer = async (server:Server):Promise<Error|undefined> => {
    return new Promise((resolve, reject) => {
        server.close((error) => {
            if ($ok(error)) { return reject(error) ; }
            resolve(undefined);
        }) ;
    }) ;
} ;

const _internalLogger = async (server:TSServer, _:IncomingMessage|undefined, type:TSServerLogType, message:string) => {
    $logterm(`&0&xfoundation-ts[&wminimal server&x:${server.port}]-` + __TSServerlogHeaders[type] + "&0 &w" + message + "&0") ;
} ;

const __TSServerlogHeaders:StringDictionary = {
    'Info':     "&C&w LOGGING ",
    'Warning':  "&O&w WARNING ",
    'Error':    "&R&w  ERROR  "
} ;

