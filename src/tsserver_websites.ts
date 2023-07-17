import { $isstring, $isunsigned, $length, $ok, $value } from "./commons";
import { $ext, $isdirectory, $isfile, $path, $readBuffer } from "./fs";
import { TSError } from "./tserrors";
import { TSResourceMimeChecker, TSWebSiteDefinition } from "./tsserver_types";
import { Nullable, StringDictionary, UINT32_MAX, uint32 } from "./types";

/** @internal */
export class TSStaticWebsite {
    public readonly uri:string ;
    public readonly folder:string ;

    private _maxCacheSize:uint32 ;
    private _maxCachedFileSize:uint32 ;
    private _maxCachedFiles:uint32 ;
    private _maxBlacklistedFiles:uint32 ;

    private _cache:Map<string, Buffer> ;
    private _cacheMemory:number ;
    private _blacklisted:Set<string> ;

    private _mimeChecker:TSResourceMimeChecker ;

    constructor(uri:string, definition:TSWebSiteDefinition|string) {
        const def = $isstring(definition) ? { folder:definition as string} : definition as TSWebSiteDefinition ;
        if (!$length(uri)) { 
            throw new TSError(`TSStaticWebsite.constructor(): url not defined for folder '${def.folder}'`, { uri:uri, ...def }) ; 
        }
        if (!$isdirectory(def.folder)) { 
            throw new TSError(`TSStaticWebsite.constructor(): website ${uri} root folder ${def.folder} was not found on disk.`, { uri:uri, ...def }) ;
        }

        this.uri = uri.toLowerCase() ;
        this.folder = def.folder ;

        this._maxCacheSize        = _uint32v(def.maxCacheSize, 128 * 1024 * 1024) ;
        this._maxCachedFiles      = _uint32v(def.maxCachedFiles, 10000) ;
        this._maxCachedFileSize   = _uint32v(def.maxCachedFileSize, 256*1024) ;
        this._maxBlacklistedFiles = _uint32v(def.maxBlacklistedFiles, 50000) ;

        this._cache = new Map<string,Buffer>() ;
        this._cacheMemory = 0 ;
        this._blacklisted = new Set<string>() ;

        this._mimeChecker = $value(def.mimeChecker, (s:Nullable<string>): Nullable<string> => {
            return $length(s) ? TSStaticWebsite.__TSServerStandardsTypes[s!] : s ;
        }) ;
    }

    public getStaticResource(uri:string):[Nullable<Buffer>, string] {
        let ret:Nullable<Buffer> = undefined ;
        let type = '' ;
        const lcUri = uri.toLowerCase() ;
        if (lcUri.startsWith(this.uri)) {
            const ext = $ext(lcUri) ;
            type = $value(this._mimeChecker(ext), '') ;
            if (type.length) {
                const path = uri.slice(this.uri.length) ;
                if (!this._blacklisted.has(path)) {
                    ret = this._cache.get(path) ;
                    if (!$ok(ret)) {
                        const file = $path(this.folder, path) ;
                        if ($isfile(file)) {
                            ret = $readBuffer(file) ;
                            if ($ok(ret)) { this._cacheContent(path, ret!) ; }
                            else { this._blacklist(path) ; }
                        }
                        else { this._blacklist(path) ; }
                    }
                }
            }
        }
        return [ret, type] ;
    }

    private _cacheContent(path:string, b:Buffer) {
        if (this._cache.size < this._maxCachedFiles! && b.length <= this._maxCachedFileSize! && this._cacheMemory + b.length <= this._maxCacheSize!) { 
            this._cache.set(path, b) ; 
            this._cacheMemory += b.length ;
        }
    }

    private _blacklist(path:string) {
        if (this._blacklisted.size < this._maxBlacklistedFiles!) { this._blacklisted.add(path) ; }
    }

    public clearCaches() {
        this._cacheMemory = 0 ;
        this._cache.clear() ;
        this._blacklisted.clear() ;
    }

    private static readonly __TSServerStandardsTypes:StringDictionary = {
        'html': 'text/html',        
        'htm':  'text/html',
        'css':  'text/css',
        'js':   'text/javascript',
        'svg':  'image/svg+xml',    
        'svgz': 'image/svg+xml',
        'jpeg': 'image/jpeg',       
        'jpg':  'image/jpg',
        'png':  'image/png',
        'gif':  'image/gif',
        'ico':  'image/x-icon',
        'pdf':  'application/pdf'
    } ;


}

function _uint32v(v:Nullable<number>, defaultValue:number):uint32 {
    return ($ok(v) && $isunsigned(v, UINT32_MAX) ? v : defaultValue) as uint32 ;
}