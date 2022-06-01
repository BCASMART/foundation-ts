import { createServer, IncomingMessage, Server, ServerResponse } from "http";

import { $defined, $isunsigned, $length, $ok, $string } from "./commons";
import { $ext, $isdirectory, $isfile, $path, $readBuffer } from "./fs";
import { Resp } from "./tsrequest";
import { StringDictionary, uint16, UINT16_MAX, uint32 } from "./types";
import { $logterm } from "./utils";

/**
 * This is a minimal HTTP server class provided for testing
 */

export type TSEndPoint = (url:URL, req:IncomingMessage, resp:ServerResponse) => void ;
export type TSEndPoints = { [key:string]:TSEndPoint }

export enum TSLogType {
    Log     = 'Info',
    Warning = 'Warning',
    Error   = 'Error'
} ;

export type TSServerLogger = (server:TSServer, req:IncomingMessage|undefined, type:TSLogType, messages:string) => void ;

export interface TSServerOptions {
    host?:string,
    port?:uint16,
    staticFolders?:string[],
    staticContentTypes?:StringDictionary,
    maxCacheSize?:uint32,
    maxCachedFileSize?:uint32,
    logger?:TSServerLogger
} 

export class TSServer {
    private static __server:TSServer|undefined = undefined ;
    private static readonly __logHeaders:StringDictionary = {
        'Info':     "&C&w LOGGING ",
        'Warning':  "&O&w WARNING ",
        'Error':    "&R&w  ERROR  "
    } ;
    private _httpServer:Server|undefined ;
    private _endPoints:TSEndPoints ;
    private _statics:string[] ;
    private _cache:Map<string, Buffer> ;
    private _blacklisted:Set<string> ;
    private _maxBlacklistedFiles:number = 50000 ; // after that amount of blacklisted static files we will slowing down to answer on not found files
    private _cachedFileSizeMax:number ;
    private _maxCachedFiles:number = 10000 ;
    private _maxCacheMemorySize:number ;
    private _cacheMemory:number ;
    private _managedTypes:StringDictionary ;
    private _logger = (server:TSServer, _:IncomingMessage|undefined, type:TSLogType, message:string) => {
        $logterm(`&0&xfoundation-ts[&wminimal server&x:${server.port}]-` + TSServer.__logHeaders[type] + "&0 &w" + message + "&0") ;
    } ;

    public host:string ;
    public port:number ;

    // =================== static methods =======================

    public static async start(endPoints:TSEndPoints, opts:TSServerOptions={}) {
        if (!TSServer.__server) {
            TSServer.__server = new TSServer(
                endPoints, 
                $length(opts.host) ? opts.host as string:'http://localhost/', 
                $isunsigned(opts.port) && opts.port! < UINT16_MAX ? opts.port! : 3000,
                opts.staticFolders,
                opts.staticContentTypes,
                opts.maxCachedFileSize,
                opts.maxCacheSize
            ) ;
            await TSServer.__server._start() ;
        }
    }

    public static async clearCaches() {
        if (TSServer.__server) { await TSServer.__server._clearCaches() ; }
    }

    // returns undefined if the server is stoped.
    // after that you can do a new server start
    public static async stop():Promise<Error|undefined> {
        if (TSServer.__server) { 
            const e = await TSServer.__server._stop() ; 
            if (!$ok(e)) { delete TSServer.__server ; }
            return e ;
        }
        return undefined
    }

    public static standardTypes():StringDictionary {
        return {
            'html': 'text/html',        'htm':  'text/html',
            '.css': 'text/css',
            '.js':  'text/javascript',
            '.svg': 'image/svg+xml',    '.svgz':'image/svg+xml',
            'jpeg': 'image/jpeg',       'jpg':  'image/jpg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.ico': 'image/x-icon',
            '.pdf': 'application/pdf',
        } ;
    }

    // =================== CONSTRUCTOR =======================

    private constructor(
        endPoints:TSEndPoints, 
        host:string, 
        port:number, 
        staticFolders:string[] = [], 
        managedTypes:StringDictionary=TSServer.standardTypes(),
        fileCacheSize:uint32 = 256*1024 as uint32,          // default 256 ko cache file size max
        maxCacheSize:uint32 = 128 * 1024 * 1024 as uint32,  // default 128 Mo of memory cache
        logger?:TSServerLogger) 
    {
        staticFolders.forEach(p => {
            if (!$isdirectory(p)) {
                throw `Static resource folder '${p}' was not found on disk.`
            }
        }) ;
        this.port = port ;
        this.host = host ;
        this._endPoints = endPoints ;
        this._statics = staticFolders ;
        this._managedTypes = managedTypes ;
        this._cacheMemory = 0 ;
        this._cache = new Map<string, Buffer>() ;
        this._blacklisted = new Set<string>() ;
        this._cachedFileSizeMax = fileCacheSize ;
        this._maxCacheMemorySize = maxCacheSize ;
        if ($ok(logger)) { this._logger = logger! ; }
    }


    // =================== instance methods =======================

    private async _start() {
        this._httpServer = createServer((req: IncomingMessage, res: ServerResponse) => {
            let status:Resp|undefined = undefined ;
            try {
                const url = new URL($string(req.url), this.host);              // new URL(request.url, `http://${request.headers.host}`);
                const path = url.pathname;
                if (!$length(path)) {
                    status = Resp.Forbidden ;
                    this._logger(this, req, TSLogType.Warning, 'root path not accessible.') ;
                    throw 'Root path is not Accessible'
                }
                
                // we manage static resources of certain kinds
                const [staticResource, contentType] = this.getStaticResource(path) ;
                if ($defined(staticResource)) {
                    if (staticResource === null) {
                        const m = `impossible to read static resource '${path}'.` ;
                        this._logger(this, req, TSLogType.Warning, m) ;
                        throw `Internal Error: ${m}` ;
                    }
                    res.setHeader('Content-Type', contentType)
                    res.writeHead(Resp.OK);
                    res.end(staticResource!) ;
                }

                const fn = this._endPoints[path!] ;
                if (!$ok(fn)) {
                    status = Resp.NotFound ;
                    const m = `resource '&r${path}&o' was not found.` ;
                    this._logger(this, req, TSLogType.Warning, m) ;
                    throw m ;
                }
                fn(url, req, res) ; // handling the response is user responsability
                                    // every unhandled exception will be treated as Internal Error
                this._logger(this, req, TSLogType.Log, `did handle resource '${path}'.`)
            }
            catch (e) {
                let error = (e as Error).message ;
                if (!$length(error)) { error = 'Internal Error' ; }
                if (!$ok(status)) { status = Resp.InternalError ; }
                res.setHeader('Content-Type', 'text/plain')
                res.writeHead(status!);
                res.end(`${status} - ${error}`) ;
            }
        }) ;        
        this._httpServer.listen(this.port, ()=>{
            this._logger(this, undefined, TSLogType.Log, `running on port ${this.port} '${this.host}' ...`) ;
        }) ;
    }
    
    public getStaticResource(path:string):[Buffer|undefined|null, string] {
        if (this._statics.length) {
            let ret:Buffer|undefined|null = undefined ;
            const ext = $ext(path) ;
            const type = $length(ext) ? this._managedTypes[ext.toLowerCase()] : undefined ;
            if ($defined(type) && !this._blacklisted.has(path)) {
                ret = this._cache.get(path) ;
                if (!$defined(ret)) {
                    for (let folder of this._statics) {
                        const file = $path(folder, path) ;
                        if ($isfile(file)) {
                            ret = $readBuffer(file) ;
                            if ($ok(ret) && 
                                ret!.length <= this._cachedFileSizeMax &&
                                ret!.length + this._cacheMemory <= this._maxCacheMemorySize && 
                                this._cache.size < this._maxCachedFiles) 
                            {
                                this._cache.set(path, ret!) ;
                                this._cacheMemory += ret!.length ;
                            }
                            else if (!$ok(ret) && this._blacklisted.size < this._maxBlacklistedFiles) {
                                // it will next time be considered as not found
                                this._blacklisted.add(path) ;
                            }
                            return [ret, type!] ;            
                        }
                    }
                    // forever marked as not found
                    if (this._blacklisted.size < this._maxBlacklistedFiles) {
                        this._blacklisted.add(path) ;
                    }
                }
                return [ret, type!] ;
            }    
        }
        return [undefined, 'text/plain'] ;
    }

    private async _clearCaches() {
        this._cache.clear() ;
        this._blacklisted.clear() ;
    }

    private async _stop():Promise<Error|undefined> { 
        this._logger(this, undefined, TSLogType.Log, `server is exiting...`) ;
        if ($ok(this._httpServer)) {
            const ret = await _internalStopServer(this._httpServer!) ;
            if ($ok(ret)) {
                this._logger(this, undefined, TSLogType.Error, `cannot stop for reason ${ret!.name}:\n${ret!.message}`) ;
            }
            return ret ;
        } ; 
        return undefined
    }

}

const _internalStopServer = async (server:Server):Promise<Error|undefined> => {
    return new Promise((resolve, reject) => {
        server.close((error) => {
            if ($ok(error)) { return reject(error) ; }
            resolve(undefined);
        }) ;
    }) ;
} ;
