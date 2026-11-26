import { $isfunction, $isnumber, $ok } from "./commons";
import { TSDate, TSSecsFrom19700101To20010101 } from "./tsdate";
import { TSError } from "./tserrors";
import { Nullable } from "./types";

/**
 * TSCache is a cache whose keys can be any value (compared like the keys of a Map, objects by identity)
 * and whose values are kept as they are (they are not copied). Its rules can be combined:
 *   - a time to live (ttl, in seconds), absolute (from the time the item is set) or sliding (each
 *     reading delays the expiration), which can be given for each item, as well as an end of life (a Date,
 *     a TSDate or a TSDate timestamp, never delayed). The ttlOf() option can also give the life of an item
 *     from its value (eg. a token giving its own lifetime), notably for getOrSet() and $memoize()
 *   - a maximum number of items (maxCount) and/or a maximum size (maxSize, the size of an item being
 *     given by the sizeOf() function, 1 by default)
 *   - the policy used to evict items when the cache is full: 'lru' (the least recently used item),
 *     'fifo' (the oldest set item) or 'lfu' (the least frequently used item, the least recently used
 *     one for the same frequency). The expired items are always evicted first.
 * All the operations are made in constant time, except the removal of the expired items which is lazy
 * (an expired item is removed when it is read) and made by a periodic sweep if sweepInterval is set.
 * getOrSet() computes a missing value only once, even if several calls ask for it at the same time, and
 * can give a value which has just expired while computing the new one (staleWhileRevalidate option).
 */
export type TSCachePolicy = 'lru' | 'fifo' | 'lfu' ;
export type TSCacheEvictionReason = 'expired' | 'evicted' | 'deleted' | 'replaced' ;

export interface TSCacheOptions<K, V> {
    ttl?:Nullable<number> ;                     // NOSONAR: optional. Time to live in seconds (0 or absent: no expiration)
    sliding?:Nullable<boolean> ;                // NOSONAR: optional. Each reading delays the expiration of the item
    maxCount?:Nullable<number> ;                // NOSONAR: optional. Maximum number of items
    maxSize?:Nullable<number> ;                 // NOSONAR: optional. Maximum total size of the items (see sizeOf)
    sizeOf?:Nullable<(value:V, key:K) => number> ; // NOSONAR: optional. Size of an item (default: 1)
    ttlOf?:Nullable<(value:V, key:K) => Nullable<TSCacheLifetime>> ; // NOSONAR: optional. Life of an item, used when set() has no ttl nor expires option (undefined or null: the ttl option)
    policy?:Nullable<TSCachePolicy> ;           // NOSONAR: optional. Eviction policy when the cache is full (default: 'lru')
    staleWhileRevalidate?:Nullable<number> ;    // NOSONAR: optional. Seconds during which getOrSet() gives an expired value while computing the new one
    sweepInterval?:Nullable<number> ;           // NOSONAR: optional. Seconds between two removals of the expired items (0 or absent: none)
    onEvict?:Nullable<(key:K, value:V, reason:TSCacheEvictionReason) => void> ; // NOSONAR: optional
    now?:Nullable<() => number> ;               // NOSONAR: optional. Clock in milliseconds (default: Date.now), eg. for tests
}

// the end of life of an item: a Date, a TSDate or a TSDate timestamp (seconds from 2001-01-01 UTC)
export type TSCacheExpiration = Date | TSDate | number ;

// the life of an item returned by the ttlOf() option: a ttl in seconds (0: no expiration) or an end of life
// (a number is always a ttl here, never a TSDate timestamp)
export type TSCacheLifetime = number | Date | TSDate ;

export interface TSCacheSetOptions {
    ttl?:Nullable<number> ;                     // NOSONAR: optional. Time to live of this item in seconds (0: no expiration)
    expires?:Nullable<TSCacheExpiration> ;      // NOSONAR: optional. End of life of this item, instead of a ttl (never delayed by the sliding expiration)
    size?:Nullable<number> ;                    // NOSONAR: optional. Size of this item (default: sizeOf())
}

export interface TSCacheStats {
    hits:number ;           // readings which found a value
    misses:number ;         // readings which found no value
    evictions:number ;      // items evicted because the cache was full
    expirations:number ;    // expired items removed
    loads:number ;          // values computed by getOrSet()
}

interface TSCacheEntry<V> {
    value:V ;
    expires:number ;        // ms, Infinity for no expiration
    ttl:number ;            // ms, 0 for no expiration (used by the sliding expiration)
    size:number ;
    frequency:number ;      // number of readings + 1 (lfu policy)
}

export class TSCache<K = any, V = any> {
    private readonly _items = new Map<K, TSCacheEntry<V>>() ;
    private readonly _frequencies = new Map<number, Set<K>>() ;    // lfu policy: the keys of each frequency, least recently used first
    private readonly _pending = new Map<K, Promise<V>>() ;         // the values being computed by getOrSet()
    private readonly _ttl:number ;
    private readonly _sliding:boolean ;
    private readonly _maxCount:number ;
    private readonly _maxSize:number ;
    private readonly _sizeOf:(value:V, key:K) => number ;
    private readonly _ttlOf?:(value:V, key:K) => Nullable<TSCacheLifetime> ;
    private readonly _staleTime:number ;
    private readonly _onEvict?:(key:K, value:V, reason:TSCacheEvictionReason) => void ;
    private readonly _now:() => number ;
    private _minFrequency = 0 ;
    private _totalSize = 0 ;
    private _earliestEnd = Infinity ;  // the earliest end (expiration + stale time) of the items: no expired item before it
    private _timer:any = undefined ;
    private _stats:TSCacheStats = _emptyStats() ;
    public readonly policy:TSCachePolicy ;

    public constructor(options:TSCacheOptions<K, V> = {}) {
        this._ttl = _seconds('ttl', options.ttl) ;
        this._staleTime = _seconds('staleWhileRevalidate', options.staleWhileRevalidate) ;
        this._maxCount = _limit('maxCount', options.maxCount) ;
        this._maxSize = _limit('maxSize', options.maxSize) ;
        this._sliding = !!options.sliding ;
        this._sizeOf = $isfunction(options.sizeOf) ? options.sizeOf! : () => 1 ;
        if ($isfunction(options.ttlOf)) { this._ttlOf = options.ttlOf! ; }
        this.policy = $ok(options.policy) ? options.policy! : 'lru' ;
        if (!['lru', 'fifo', 'lfu'].includes(this.policy)) { TSError.throw(`TSCache: unknown policy '${this.policy}'`, { options:options }) ; }
        if ($isfunction(options.onEvict)) { this._onEvict = options.onEvict! ; }
        this._now = $isfunction(options.now) ? options.now! : Date.now ;
        const sweep = _seconds('sweepInterval', options.sweepInterval) ;
        if (sweep > 0) {
            this._timer = setInterval(() => this.removeExpired(), sweep) ;
            this._timer?.unref?.() ; // the sweep does not keep node running
        }
    }

    // ===== reading
    // the value of a key, or undefined if it is absent or expired. It is a use of the item (lru, lfu, sliding expiration)
    public get(key:K):V|undefined {
        const e = this._fresh(key) ;
        if (!e) { this._stats.misses++ ; return undefined ; }
        this._stats.hits++ ;
        this._use(key, e) ;
        return e.value ;
    }

    // the value of a key without using the item (no lru, lfu or sliding expiration change)
    public peek(key:K):V|undefined { return this._fresh(key)?.value ; }

    // true if the key has a value which is not expired (it is not a use of the item)
    public has(key:K):boolean { return $ok(this._fresh(key)) ; }

    // ===== writing
    // returns false if the item is not stored, its size being greater than maxSize
    public set(key:K, value:V, options:TSCacheSetOptions = {}):boolean {
        const size = $ok(options.size) ? options.size! : this._sizeOf(value, key) ;
        if (!$isnumber(size) || size < 0) { TSError.throw('TSCache.set(): the size of an item must be a positive number', { key:key, size:size }) ; }
        const previous = this._items.get(key) ;
        if (previous) { this._remove(key, previous, previous.value !== value ? 'replaced' : undefined) ; }
        const now = this._now() ;
        const [ttl, expires] = this._lifetime(key, value, options, now) ;
        if (size > this._maxSize || expires <= now) { return false ; } // too big or already expired
        const e:TSCacheEntry<V> = { value:value, ttl:ttl, expires:expires, size:size, frequency:1 } ;
        this._makeRoom(size) ;
        this._items.set(key, e) ;
        this._totalSize += size ;
        if (this.policy === 'lfu') { this._addFrequency(key, 1) ; this._minFrequency = 1 ; }
        this._earliestEnd = Math.min(this._earliestEnd, e.expires + this._staleTime) ;
        return true ;
    }

    public delete(key:K):boolean {
        const e = this._items.get(key) ;
        if (!e) { return false ; }
        this._remove(key, e, 'deleted') ;
        return true ;
    }

    public clear():void {
        // the copy is needed: onEvict() may set items again, which would be visited (and removed) again, endlessly
        for (const [k, e] of [...this._items]) { this._remove(k, e, 'deleted') ; } // NOSONAR: copy needed, see above
    }

    // ===== computed values
    // the value of a key, computed by loader() (once, even for simultaneous calls) if it is absent or expired.
    // With the staleWhileRevalidate option, a value which expired less than staleWhileRevalidate seconds ago
    // is given at once, the new value being computed in the background (an error of this computation keeps
    // the stale value until the end of its stale time)
    public async getOrSet(key:K, loader:(key:K) => V|Promise<V>, options:TSCacheSetOptions = {}):Promise<V> {
        const e = this._items.get(key) ;
        if (e) {
            const now = this._now() ;
            if (now < e.expires) { this._stats.hits++ ; this._use(key, e) ; return e.value ; }
            if (now < e.expires + this._staleTime) {
                this._stats.hits++ ;
                this._load(key, loader, options).catch(() => { /* the stale value is kept */ }) ;
                return e.value ;
            }
            this._expire(key, e) ;
        }
        this._stats.misses++ ;
        return this._load(key, loader, options) ;
    }

    // ===== items
    public get size():number { this.removeExpired() ; return this._items.size ; }
    public get totalSize():number { this.removeExpired() ; return this._totalSize ; }
    public get stats():TSCacheStats { return { ...this._stats } ; }
    public resetStats():void { this._stats = _emptyStats() ; }

    // the not expired items, in their eviction order (the first one would be evicted first, except for lfu)
    public *entries():IterableIterator<[K, V]> {
        const now = this._now() ;
        // the copy is needed: a get() during the iteration moves the item at the end of the map (lru),
        // where it would be visited again, endlessly
        for (const [k, e] of [...this._items]) { if (now < e.expires) { yield [k, e.value] ; } } // NOSONAR: copy needed, see above
    }
    public *keys():IterableIterator<K> { for (const [k] of this.entries()) { yield k ; } }
    public *values():IterableIterator<V> { for (const [, v] of this.entries()) { yield v ; } }
    public [Symbol.iterator]():IterableIterator<[K, V]> { return this.entries() ; }

    // removes the expired items (and the stale ones). Returns the number of removed items
    public removeExpired():number {
        const now = this._now() ;
        if (now < this._earliestEnd) { return 0 ; }
        let n = 0, earliest = Infinity ;
        // no copy: an item set by onEvict() during the loop must count for the earliest end
        for (const [k, e] of this._items) {
            const end = e.expires + this._staleTime ;
            if (now >= end) { this._expire(k, e) ; n++ ; }
            else { earliest = Math.min(earliest, end) ; }
        }
        this._earliestEnd = earliest ;
        return n ;
    }

    // stops the periodic sweep. The cache can still be used
    public close():void {
        if ($ok(this._timer)) { clearInterval(this._timer) ; this._timer = undefined ; }
    }

    // ===== private methods
    // the ttl (ms, used by the sliding expiration: 0 for an end date) and the expiration time (ms) of a new item
    // in this order: the options of set(), the ttlOf() option, the ttl option
    private _lifetime(key:K, value:V, options:TSCacheSetOptions, now:number):[number, number] {
        if ($ok(options.expires)) {
            if ($ok(options.ttl)) { TSError.throw('TSCache.set(): ttl and expires options cannot be given together', { options:options }) ; }
            return [0, _expirationTime(options.expires!)] ;
        }
        if ($ok(options.ttl)) { return _ttlLifetime(_seconds('ttl', options.ttl), now) ; }
        const life = this._ttlOf?.(value, key) ;
        if (life instanceof Date || life instanceof TSDate) { return [0, _expirationTime(life)] ; }
        if (!$ok(life)) { return _ttlLifetime(this._ttl, now) ; }
        if (!$isnumber(life) || life! < 0) { TSError.throw('TSCache: ttlOf() must return a positive number of seconds, a Date or a TSDate', { key:key, life:life }) ; }
        return _ttlLifetime(life! * 1000, now) ;
    }

    // the entry of a key if it is not expired (an expired entry is kept during its stale time)
    private _fresh(key:K):TSCacheEntry<V>|undefined {
        const e = this._items.get(key) ;
        if (!e) { return undefined ; }
        const now = this._now() ;
        if (now < e.expires) { return e ; }
        if (now >= e.expires + this._staleTime) { this._expire(key, e) ; }
        return undefined ;
    }

    // a use of an item: lru moves it at the end, lfu increases its frequency, sliding delays its expiration
    private _use(key:K, e:TSCacheEntry<V>):void {
        if (this._sliding && e.ttl > 0) {
            e.expires = this._now() + e.ttl ;
            this._earliestEnd = Math.min(this._earliestEnd, e.expires + this._staleTime) ;
        }
        switch (this.policy) {
            case 'lru':
                this._items.delete(key) ;
                this._items.set(key, e) ;
                break ;
            case 'lfu':
                this._removeFrequency(key, e.frequency) ;
                if (this._minFrequency === e.frequency && !this._frequencies.has(e.frequency)) { this._minFrequency++ ; }
                e.frequency++ ;
                this._addFrequency(key, e.frequency) ;
                break ;
            default: // fifo: the order is the one of the insertions
                break ;
        }
    }

    private _load(key:K, loader:(key:K) => V|Promise<V>, options:TSCacheSetOptions):Promise<V> {
        const pending = this._pending.get(key) ;
        if (pending) { return pending ; }
        // the loader runs in a microtask: the promise is registered as pending before it runs (a loader
        // throwing at once would otherwise leave a rejected promise as pending forever)
        const p = Promise.resolve().then(async () => {
            try {
                const v = await loader(key) ;
                this._stats.loads++ ;
                this.set(key, v, options) ;
                return v ;
            }
            finally { this._pending.delete(key) ; }
        }) ;
        this._pending.set(key, p) ;
        return p ;
    }

    // evicts items until an item of this size can be added
    private _makeRoom(size:number):void {
        if (this._items.size < this._maxCount && this._totalSize + size <= this._maxSize) { return ; }
        this.removeExpired() ; // the expired items are always evicted first
        while (this._items.size > 0 && (this._items.size >= this._maxCount || this._totalSize + size > this._maxSize)) {
            const key = this._victim() ;
            this._stats.evictions++ ;
            this._remove(key, this._items.get(key)!, 'evicted') ;
        }
    }

    // the key of the item to evict
    private _victim():K {
        if (this.policy !== 'lfu') { return this._items.keys().next().value as K ; } // the least recently used or the oldest item
        let keys = this._frequencies.get(this._minFrequency) ;
        if (!keys) { // the minimal frequency may be outdated after removals
            this._minFrequency = Math.min(...this._frequencies.keys()) ;
            keys = this._frequencies.get(this._minFrequency)! ;
        }
        return keys.values().next().value as K ;
    }

    private _expire(key:K, e:TSCacheEntry<V>):void {
        this._stats.expirations++ ;
        this._remove(key, e, 'expired') ;
    }

    private _remove(key:K, e:TSCacheEntry<V>, reason?:TSCacheEvictionReason):void {
        this._items.delete(key) ;
        this._totalSize -= e.size ;
        if (this.policy === 'lfu') { this._removeFrequency(key, e.frequency) ; }
        if (reason && this._onEvict) { this._onEvict(key, e.value, reason) ; }
    }

    private _addFrequency(key:K, frequency:number):void {
        let keys = this._frequencies.get(frequency) ;
        if (!keys) { keys = new Set<K>() ; this._frequencies.set(frequency, keys) ; }
        keys.add(key) ;
    }

    private _removeFrequency(key:K, frequency:number):void {
        const keys = this._frequencies.get(frequency) ;
        if (keys) {
            keys.delete(key) ;
            if (!keys.size) { this._frequencies.delete(frequency) ; }
        }
    }
}

// ===== named caches
const __caches = new Map<string, TSCache>() ;

// the cache of this name, created with these options if it does not exist (the options of an existing
// cache are not changed)
export function $cache<K = any, V = any>(name:string, options?:Nullable<TSCacheOptions<K, V>>):TSCache<K, V> {
    let c = __caches.get(name) ;
    if (!c) {
        c = new TSCache<K, V>($ok(options) ? options! : {}) ;
        __caches.set(name, c) ;
    }
    return c as TSCache<K, V> ;
}

export function $hascache(name:string):boolean { return __caches.has(name) ; }

// closes and forgets the cache of this name. Returns false if there is no such cache
export function $removecache(name:string):boolean {
    const c = __caches.get(name) ;
    if (!c) { return false ; }
    c.close() ;
    c.clear() ;
    return __caches.delete(name) ;
}

// clears all the named caches
export function $clearcaches():void { for (const c of __caches.values()) { c.clear() ; } }

// closes, clears and forgets all the named caches (eg. when a server stops)
export function $removecaches():void { for (const name of __caches.keys()) { $removecache(name) ; } }

// ===== memoized functions
export interface TSMemoizeOptions<K, V> extends TSCacheOptions<K, V> {
    key?:Nullable<(...args:any[]) => K> ; // NOSONAR: optional. The key of the arguments (default: the first argument)
}

/**
 * A function which caches the results of fn, the key of its arguments being given by the key option
 * (by default, the first argument: give a key function for a function with several arguments). A result
 * which is a rejected promise is removed from the cache. The cache of the function is its cache property.
 */
export function $memoize<F extends (...args:any[]) => any>(fn:F, options:TSMemoizeOptions<any, ReturnType<F>> = {}):F & { cache:TSCache<any, ReturnType<F>> } {
    const cache = new TSCache<any, ReturnType<F>>(options) ;
    const keyOf = $isfunction(options.key) ? options.key! : (...args:any[]) => args[0] ;
    const memoized = function(this:any, ...args:any[]):ReturnType<F> {
        const key = keyOf(...args) ;
        if (cache.has(key)) { return cache.get(key)! ; }
        const v = fn.apply(this, args) ;
        cache.set(key, v) ;
        if (v instanceof Promise) { v.catch(() => { if (cache.peek(key) === v) { cache.delete(key) ; } }) ; }
        return v ;
    } as F & { cache:TSCache<any, ReturnType<F>> } ;
    memoized.cache = cache ;
    return memoized ;
}

// ===== private functions
function _emptyStats():TSCacheStats { return { hits:0, misses:0, evictions:0, expirations:0, loads:0 } ; }

// a duration in seconds, given in milliseconds
function _seconds(name:string, v:Nullable<number>):number {
    if (!$ok(v)) { return 0 ; }
    if (!$isnumber(v) || v! < 0) { TSError.throw(`TSCache: ${name} must be a positive number of seconds`, { value:v }) ; }
    return v! * 1000 ;
}

// the ttl and the expiration time of an item living ttl ms (0: no expiration)
function _ttlLifetime(ttl:number, now:number):[number, number] { return [ttl, ttl > 0 ? now + ttl : Infinity] ; }

// the time (ms from 1970-01-01, the one of Date.now()) of an end of life
function _expirationTime(d:TSCacheExpiration):number {
    let t = Number.NaN ;
    if (d instanceof Date) { t = d.getTime() ; }
    else if (d instanceof TSDate) { t = d.toEpoch() * 1000 ; }
    else if ($isnumber(d)) { t = (d + TSSecsFrom19700101To20010101) * 1000 ; }
    if (Number.isNaN(t)) { TSError.throw('TSCache.set(): expires must be a valid Date, TSDate or TSDate timestamp', { expires:d }) ; }
    return t ;
}

// a maximum count or size (Infinity if absent)
function _limit(name:string, v:Nullable<number>):number {
    if (!$ok(v)) { return Infinity ; }
    if (!$isnumber(v) || v! <= 0) { TSError.throw(`TSCache: ${name} must be a strictly positive number`, { value:v }) ; }
    return v! ;
}
