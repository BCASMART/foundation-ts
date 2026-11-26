import { $isstring, $isunsigned, $length, $ok, $value } from "./commons";
import { join, resolve, sep } from 'path'; // NOSONAR: no 'node:' prefix for webpack 5
import { $ext, $isdirectory, $readBuffer } from "./fs";
import { TSCache } from "./tscache";
import { TSError } from "./tserrors";
import { TSResourceMimeChecker, TSWebSiteDefinition } from "./tsserver_types";
import { Nullable, StringDictionary, UINT32_MAX, uint32 } from "./types";

/** @internal */
export class TSStaticWebsite {
    public readonly uri:string ;
    public readonly folder:string ;

    private readonly _root:string ;       // the absolute folder path, ending with a separator

    private readonly _maxCachedFileSize:uint32 ;

    // the least recently used files are evicted when the cache is full. undefined: no cache
    private readonly _cache?:TSCache<string, Buffer> ;
    // the missing files, which are not looked for again during blacklistDuration. undefined: no blacklist
    private readonly _blacklisted?:TSCache<string, true> ;

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

        const maxCacheSize        = _uint32v(def.maxCacheSize, 128 * 1024 * 1024) ;
        const maxCachedFiles      = _uint32v(def.maxCachedFiles, 10000) ;
        const maxBlacklistedFiles = _uint32v(def.maxBlacklistedFiles, 50000) ;
        const blacklistDuration   = _uint32v(def.blacklistDuration, 60) ;
        this._maxCachedFileSize   = _uint32v(def.maxCachedFileSize, 256*1024) ;

        // a 0 limit disables the cache or the blacklist, as before
        if (maxCacheSize > 0 && maxCachedFiles > 0 && this._maxCachedFileSize > 0) {
            this._cache = new TSCache<string, Buffer>({ maxCount:maxCachedFiles, maxSize:maxCacheSize, sizeOf:(b) => b.length }) ;
        }
        if (maxBlacklistedFiles > 0 && blacklistDuration > 0) {
            this._blacklisted = new TSCache<string, true>({ maxCount:maxBlacklistedFiles, ttl:blacklistDuration }) ;
        }

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

        if (this._blacklisted?.has(file)) { return undefined ; }
        const cached = this._cache?.get(file) ;
        if ($ok(cached)) { return cached ; }
        const buf = $readBuffer(file) ;
        if (!$ok(buf)) { 
            this._blacklisted?.set(file, true) ; 
            return undefined ;
        }
        if (buf.length <= this._maxCachedFileSize) { this._cache?.set(file, buf) ; }
        return buf ;
    }

    // removes the expired blacklisted files (both caches are bounded and also remove them lazily)
    public clearCaches() { this._blacklisted?.removeExpired() ; }

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