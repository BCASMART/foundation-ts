import { $isstring, $isunsigned, $length, $ok, $value } from "./commons";
import { join, resolve, sep } from 'path'; // NOSONAR: no 'node:' prefix for webpack 5
import { $ext, $isdirectory, $readBuffer } from "./fs";
import { $conditionalClearMap } from "./mapset";
import { TSError } from "./tserrors";
import { TSResourceMimeChecker, TSWebSiteDefinition } from "./tsserver_types";
import { Nullable, StringDictionary, UINT32_MAX, uint32 } from "./types";
import { $mark } from "./utils";

/** @internal */
export class TSStaticWebsite {
    public readonly uri:string ;
    public readonly folder:string ;

    private readonly _root:string ;       // the absolute folder path, ending with a separator

    private readonly _maxCacheSize:uint32 ;
    private readonly _maxCachedFileSize:uint32 ;
    private readonly _maxCachedFiles:uint32 ;
    private readonly _maxBlacklistedFiles:uint32 ;

    private readonly _cache:Map<string, TSResourceCache> ;
    private _cacheMemory:number ;
    private readonly _blacklisted:Set<string> ;

    private readonly _mimeChecker:TSResourceMimeChecker ;

    constructor(uri:string, definition:TSWebSiteDefinition|string) {
        const def = $isstring(definition) ? { folder:definition } : definition ;
        if (!$length(uri)) { 
            TSError.throw(`TSStaticWebsite.constructor(): url not defined for folder '${def.folder}'`, { uri:uri, ...def }) ; 
        }
        if (!$isdirectory(def.folder)) { 
            TSError.throw(`TSStaticWebsite.constructor(): website ${uri} root folder ${def.folder} was not found on disk.`, { uri:uri, ...def }) ;
        }

        this.uri = uri.toLowerCase() ;
        this.folder = def.folder ;
        const root = resolve(def.folder) ;
        this._root = root.endsWith(sep) ? root : root + sep ;

        this._maxCacheSize        = _uint32v(def.maxCacheSize, 128 * 1024 * 1024) ;
        this._maxCachedFiles      = _uint32v(def.maxCachedFiles, 10000) ;
        this._maxCachedFileSize   = _uint32v(def.maxCachedFileSize, 256*1024) ;
        this._maxBlacklistedFiles = _uint32v(def.maxBlacklistedFiles, 50000) ;

        this._cache = new Map<string, TSResourceCache>() ;
        this._cacheMemory = 0 ;
        this._blacklisted = new Set<string>() ;

        this._mimeChecker = $value(def.mimeChecker, (s:Nullable<string>): Nullable<string> => {
            return $length(s) ? TSStaticWebsite.__TSServerStandardsTypes[s!] : s ;
        }) ;
    }

    // returns the resource content (if found) and its mime type (if the uri belongs to this website)
    public getStaticResource(uri:string):[Nullable<Buffer>, string] {
        const lcUri = uri.toLowerCase() ;
        if (!lcUri.startsWith(this.uri)) { return [undefined, ''] ; }
        const type = $value(this._mimeChecker($ext(lcUri)), '') ;
        if (!type.length) { return [undefined, type] ; }
        return [this._resource(uri.slice(this.uri.length)), type] ;
    }

    // returns the cached file content or reads it, caching it or blacklisting its path
    private _resource(path:string):Buffer|undefined {
        // the request path is percent-encoded (eg. 'caf%C3%A9.html' for 'café.html'): it is decoded before 
        // looking for the file (it used to be searched as is, so names with spaces or accents were never found).
        // The decoding must be done before the following check ('%2e%2e/' is '../')
        const decoded = _decodedPath(path) ;
        if (!$ok(decoded)) { return undefined ; }
        // the '..' segments are resolved here: a file outside the website folder is never served
        const file = resolve(join(this._root, decoded)) ;
        if (!file.startsWith(this._root)) { return undefined ; }

        if (this._blacklisted.has(file)) { return undefined ; }
        const cache = this._cache.get(file) ;
        if ($ok(cache)) {
            cache.usage ++ ;
            return cache.buffer ;
        }
        const buf = $readBuffer(file) ;
        if (!$ok(buf)) { 
            this._blacklist(file) ; 
            return undefined ;
        }
        this._cacheContent(file, buf) ;
        return buf ;
    }

    private _cacheContent(path:string, b:Buffer) {
        if (this._cache.size < this._maxCachedFiles! && b.length <= this._maxCachedFileSize! && this._cacheMemory + b.length <= this._maxCacheSize!) { 
            this._cache.set(path, { buffer:b, timestamp:$mark(), usage:1} ) ; 
            this._cacheMemory += b.length ;
        }
    }

    private _blacklist(path:string) {
        if (this._blacklisted.size < this._maxBlacklistedFiles!) { this._blacklisted.add(path) ; }
    }

    public clearCaches() {
        this._cacheMemory = 0 ;
        
        if (this._blacklisted.size > this._maxBlacklistedFiles * 0.75) {
            this._blacklisted.clear() ;
        }

        // we will clear all web site with no usage and put all other to zero for next clear
        $conditionalClearMap(this._cache, (_,v) => {
            if (!v.usage) { return true ; }
            v.usage = 0 ; 
            this._cacheMemory += v.buffer.length ; 
            return false ;
        })
    }

    private static readonly __TSServerStandardsTypes:StringDictionary = {
        'html': 'text/html',        
        'htm':  'text/html',
        'css':  'text/css',
        'js':   'text/javascript',
        'svg':  'image/svg+xml',    
        'svgz': 'image/svg+xml',
        'jpeg': 'image/jpeg',       
        'jpg':  'image/jpeg',
        'png':  'image/png',
        'gif':  'image/gif',
        'ico':  'image/x-icon',
        'pdf':  'application/pdf'
    } ;


}

interface TSResourceCache {
    buffer:Buffer ;
    timestamp:number ;
    usage:number ;
}

// returns undefined for a malformed percent-encoding (eg. '%ZZ') or a NUL character
function _decodedPath(path:string):string|undefined {
    let ret:string ;
    try { ret = decodeURIComponent(path) ; }
    catch { return undefined ; }
    return ret.includes('\0') ? undefined : ret ;
}

function _uint32v(v:Nullable<number>, defaultValue:number):uint32 {
    return ($ok(v) && $isunsigned(v, UINT32_MAX) ? v : defaultValue) as uint32 ;
}