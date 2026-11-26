import { $cache, $clearcaches, $hascache, $memoize, $removecache, $removecaches, TSCache, TSCacheEvictionReason } from "../src/tscache";
import { TSDate } from "../src/tsdate";
import { TSTest } from "../src/tstester";

// a cache with an injected clock (in ms)
function clock() {
    const c = { t:0, now:() => c.t } ;
    return c ;
}
function tick():Promise<void> { return new Promise(resolve => setTimeout(resolve, 0)) ; }

export const cacheGroups = TSTest.group("TSCache", async (group) => {

    group.unary("get(), set(), has(), peek(), delete(), clear() and any kind of key", async(t) => {
        const c = new TSCache<any, any>() ;
        const objectKey = { id:1 } ;
        const value = { a:[1, 2] } ;
        t.expect0(c.set('a', 1)).true() ;
        t.expect1(c.set(objectKey, value)).true() ;
        t.expect2(c.set(42, 'n')).true() ;
        t.expect3(c.get('a')).is(1) ;
        t.expect4(c.get(objectKey)).strictis(value) ; // the value is kept as it is
        t.expect5(c.get({ id:1 })).undef() ;           // objects are keys by identity
        t.expect6(c.has(42)).true() ;
        t.expect7(c.peek(42)).is('n') ;
        t.expect8(c.size).is(3) ;
        t.expect9(c.delete('a')).true() ;
        t.expectA(c.delete('a')).false() ;
        // get() moved 'a' then objectKey at the end (lru), has() and peek() did not move 42
        t.expectB([...c.keys()]).is([42, objectKey]) ;
        t.expectC([...c.values()]).is(['n', value]) ;
        t.expectD([...c]).is([[42, 'n'], [objectKey, value]]) ;
        c.clear() ;
        t.expectE(c.size).is(0) ;
        t.expectF(c.get(42)).undef() ;
        t.expectG(c.set(undefined, undefined)).true() ; // undefined is a valid key and a valid value
        t.expectH(c.has(undefined)).true() ;
    }) ;

    group.unary("absolute, per item and sliding expiration", async(t) => {
        const k = clock() ;
        const c = new TSCache<string, number>({ ttl:10, now:k.now }) ;
        c.set('a', 1) ;
        c.set('b', 2, { ttl:20 }) ;
        c.set('c', 3, { ttl:0 }) ; // never expires
        k.t = 9999 ;
        t.expect0(c.get('a')).is(1) ;
        k.t = 10000 ;
        t.expect1(c.get('a')).undef() ;
        t.expect2(c.has('b')).true() ;
        t.expect3(c.size).is(2) ;
        k.t = 1_000_000 ;
        t.expect4([...c.keys()]).is(['c']) ;

        const k2 = clock() ;
        const s = new TSCache<string, number>({ ttl:10, sliding:true, now:k2.now }) ;
        s.set('a', 1) ;
        k2.t = 8000 ; t.expect5(s.get('a')).is(1) ;  // delays the expiration to 18000
        k2.t = 16000 ; t.expect6(s.peek('a')).is(1) ; // peek() and has() do not delay it
        t.expect7(s.has('a')).true() ;
        k2.t = 18000 ; t.expect8(s.get('a')).undef() ;
    }) ;

    group.unary("end of life given as a Date, a TSDate or a TSDate timestamp", async(t) => {
        const k = clock() ;
        k.t = Date.UTC(2026, 10, 25, 12, 0, 0) ;
        const c = new TSCache<string, number>({ ttl:100, sliding:true, now:k.now }) ;
        const end = TSDate.fromEpoch(k.t / 1000 + 20)! ;
        t.expect0(c.set('date', 1, { expires:new Date(k.t + 10000) })).true() ;
        t.expect1(c.set('tsdate', 2, { expires:end })).true() ;
        t.expect2(c.set('timestamp', 3, { expires:end.timestamp + 10 })).true() ;
        t.expect3(c.set('ttl', 4)).true() ;
        k.t += 9000 ;
        t.expect4(c.get('date')).is(1) ; // an end of life is not delayed by the sliding expiration
        k.t += 1000 ;
        t.expect5(c.get('date')).undef() ;
        k.t += 9999 ;
        t.expect6([...c.keys()].sort()).is(['timestamp', 'tsdate', 'ttl']) ;
        k.t += 1 ;
        t.expect7([...c.keys()].sort()).is(['timestamp', 'ttl']) ;
        k.t += 10000 ;
        t.expect8([...c.keys()]).is(['ttl']) ;
        // a past end of life is not stored and removes the previous value
        t.expect9(c.set('ttl', 5, { expires:new Date(k.t) })).false() ;
        t.expectA(c.has('ttl')).false() ;
        t.expectB(c.set('x', 6, { expires:end })).false() ;
        t.expectC(() => c.set('x', 6, { ttl:10, expires:end })).throws() ;
        t.expectD(() => c.set('x', 6, { expires:new Date(NaN) })).throws() ;
        t.expectE(() => c.set('x', 6, { expires:NaN })).throws() ;
        t.expectF(c.size).is(0) ;
    }) ;

    group.unary("ttlOf(): the life of an item given by its value", async(t) => {
        const k = clock() ;
        k.t = Date.UTC(2026, 10, 25, 12, 0, 0) ;
        const start = k.t ;
        type Item = { life?:any } ;
        const c = new TSCache<string, Item>({ ttl:100, sliding:true, now:k.now, ttlOf:(v) => v.life }) ;
        c.set('seconds', { life:10 }) ;
        c.set('date', { life:new Date(start + 20000) }) ;
        c.set('tsdate', { life:TSDate.fromEpoch(start / 1000 + 30)! }) ;
        c.set('never', { life:0 }) ;
        c.set('default', {}) ;                          // undefined: the ttl option (100 s)
        c.set('null', { life:null }) ;                  // null: the ttl option too
        c.set('option', { life:10 }, { ttl:50 }) ;      // the options of set() come first
        c.set('expires', { life:10 }, { expires:new Date(start + 60000) }) ;
        c.set('forever', { life:10 }, { ttl:0 }) ;
        k.t = start + 9000 ;
        t.expect0(c.get('seconds')).OK() ; // a ttl given by ttlOf() slides
        t.expect1(c.get('date')).OK() ;
        k.t = start + 18999 ; // 'seconds' now expires at start + 19000
        t.expect2(c.has('seconds')).true() ;
        k.t = start + 20000 ;
        t.expect3(c.has('date')).false() ; // an end of life does not slide
        k.t = start + 30000 ;
        t.expect4(c.has('tsdate')).false() ;
        t.expect5(c.has('seconds')).false() ;
        k.t = start + 55000 ;
        t.expect6(c.has('option')).false() ;
        t.expect7(c.has('expires')).true() ;
        k.t = start + 60000 ;
        t.expect8(c.has('expires')).false() ;
        k.t = start + 100000 ;
        t.expect9([...c.keys()].sort()).is(['forever', 'never']) ;
        t.expectA(c.set('past', { life:new Date(k.t - 1) })).false() ;
        t.expectB(() => c.set('x', { life:-1 })).throws() ;
        t.expectC(() => c.set('x', { life:'10' })).throws() ;
        t.expectD(() => c.set('x', { life:NaN })).throws() ;
    }) ;

    group.unary("ttlOf() with getOrSet() and $memoize()", async(t) => {
        const k = clock() ;
        const tokens = new TSCache<string, { token:string, expires_in:number }>({ now:k.now, ttlOf:(v) => v.expires_in - 60 }) ;
        let calls = 0 ;
        const fetchToken = async (id:string) => { calls++ ; return { token:`${id}-${calls}`, expires_in:3600 } ; } ;
        t.expect0((await tokens.getOrSet('client', fetchToken)).token).is('client-1') ;
        k.t = 3539000 ;
        t.expect1((await tokens.getOrSet('client', fetchToken)).token).is('client-1') ;
        k.t = 3540000 ;
        t.expect2((await tokens.getOrSet('client', fetchToken)).token).is('client-2') ;

        // a value not found is kept for a shorter time
        const k2 = clock() ;
        const users:Record<string, string> = { a:'Alice' } ;
        const find = $memoize((id:string) => users[id] ?? null, { ttl:3600, now:k2.now, ttlOf:(v) => v === null ? 30 : undefined }) ;
        t.expect3(find('a')).is('Alice') ;
        t.expect4(find('b')).null() ;
        users.b = 'Bob' ;
        k2.t = 30000 ;
        t.expect5(find('b')).is('Bob') ;
        users.a = 'Anna' ;
        t.expect6(find('a')).is('Alice') ;
    }) ;

    group.unary("lru, fifo and lfu eviction with maxCount", async(t) => {
        const lru = new TSCache<string, number>({ maxCount:3 }) ;
        lru.set('a', 1) ; lru.set('b', 2) ; lru.set('c', 3) ;
        lru.get('a') ;
        lru.set('d', 4) ;
        t.expect0([...lru.keys()]).is(['c', 'a', 'd']) ;
        lru.peek('c') ; // peek() is not a use
        lru.set('e', 5) ;
        t.expect1([...lru.keys()]).is(['a', 'd', 'e']) ;

        const fifo = new TSCache<string, number>({ maxCount:3, policy:'fifo' }) ;
        fifo.set('a', 1) ; fifo.set('b', 2) ; fifo.set('c', 3) ;
        fifo.get('a') ;
        fifo.set('d', 4) ;
        t.expect2([...fifo.keys()]).is(['b', 'c', 'd']) ;
        fifo.set('b', 22) ; // a replacement is a new insertion
        fifo.set('e', 5) ;
        t.expect3([...fifo.keys()]).is(['d', 'b', 'e']) ;

        const lfu = new TSCache<string, number>({ maxCount:3, policy:'lfu' }) ;
        lfu.set('a', 1) ; lfu.set('b', 2) ; lfu.set('c', 3) ;
        lfu.get('a') ; lfu.get('a') ; lfu.get('b') ;
        lfu.set('d', 4) ; // c is the least frequently used
        t.expect4(lfu.has('c')).false() ;
        lfu.set('e', 5) ; // d has the lowest frequency
        t.expect5(lfu.has('d')).false() ;
        lfu.get('e') ; lfu.get('e') ; lfu.get('e') ;
        lfu.set('f', 6) ; // b (2 uses) is evicted before a (3 uses) and e (4 uses)
        t.expect6([...lfu.keys()].sort()).is(['a', 'e', 'f']) ;
        lfu.delete('f') ;
        lfu.set('g', 7) ;
        lfu.set('h', 8) ; // g is the least frequently used
        t.expect7([...lfu.keys()].sort()).is(['a', 'e', 'h']) ;
        t.expect8(lfu.stats.evictions).is(4) ;
    }) ;

    group.unary("maxSize and sizeOf()", async(t) => {
        const c = new TSCache<string, string>({ maxSize:10, sizeOf:(v) => v.length }) ;
        t.expect0(c.set('a', 'aaaa')).true() ;
        t.expect1(c.set('b', 'bbbb')).true() ;
        t.expect2(c.totalSize).is(8) ;
        t.expect3(c.set('c', 'ccc')).true() ; // a is evicted
        t.expect4([...c.keys()]).is(['b', 'c']) ;
        t.expect5(c.set('d', 'ddddddddddd')).false() ; // too big to be stored
        t.expect6(c.has('d')).false() ;
        t.expect7([...c.keys()]).is(['b', 'c']) ;
        t.expect8(c.set('e', 'e', { size:10 })).true() ;
        t.expect9([...c.keys()]).is(['e']) ;
        t.expectA(c.totalSize).is(10) ;
    }) ;

    group.unary("onEvict() reasons and expired items evicted first", async(t) => {
        const k = clock() ;
        const reasons:string[] = [] ;
        const c = new TSCache<string, number>({ maxCount:2, now:k.now, onEvict:(key, v, r:TSCacheEvictionReason) => reasons.push(`${key}${v}:${r}`) }) ;
        c.set('a', 1, { ttl:1 }) ;
        c.set('b', 2) ;
        c.get('a') ; // b is the least recently used
        k.t = 1000 ;
        c.set('c', 3) ; // a has expired: it is removed instead of b
        t.expect0([...c.keys()]).is(['b', 'c']) ;
        c.set('b', 22) ;
        c.set('b', 22) ; // NOSONAR: set twice on purpose, the same value is not a replacement
        c.set('d', 4) ;
        c.delete('b') ;
        t.expect1(reasons).is(['a1:expired', 'b2:replaced', 'c3:evicted', 'b22:deleted']) ;
        c.clear() ;
        t.expect2(reasons[4]).is('d4:deleted') ;
    }) ;

    group.unary("iterating, clearing and removing expired items while onEvict() or get() change the cache", async(t) => {
        const c = new TSCache<string, number>() ;
        c.set('a', 1) ; c.set('b', 2) ;
        const seen:string[] = [] ;
        for (const [k] of c) { seen.push(k) ; c.get(k) ; } // get() moves the item at the end (lru)
        t.expect0(seen).is(['a', 'b']) ;

        const r = new TSCache<string, number>({ onEvict:(k, v, reason) => { if (reason === 'deleted' && !k.endsWith('+')) { r.set(k + '+', v) ; } } }) ;
        r.set('a', 1) ; r.set('b', 2) ;
        r.clear() ; // the items set by onEvict() during clear() are kept
        t.expect1([...r.keys()]).is(['a+', 'b+']) ;

        const k = clock() ;
        const e = new TSCache<string, number>({ now:k.now, onEvict:(key, v, reason) => { if (reason === 'expired' && key === 'a') { e.set('n', v, { ttl:1 }) ; } } }) ;
        e.set('a', 1, { ttl:1 }) ;
        e.set('z', 2, { ttl:100 }) ;
        k.t = 1000 ;
        t.expect2(e.removeExpired()).is(1) ;
        t.expect3([...e.keys()]).is(['z', 'n']) ;
        k.t = 2000 ;
        t.expect4(e.size).is(1) ; // the item set by onEvict() counted for the next removal
    }) ;

    group.unary("lfu eviction just after the removal of the least frequently used items", async(t) => {
        const k = clock() ;
        const c = new TSCache<string, string>({ policy:'lfu', maxSize:6, sizeOf:(v) => v.length, now:k.now }) ;
        c.set('a', 'a', { ttl:1 }) ;   // frequency 1
        c.set('b', 'bbbbb') ;
        c.get('b') ;                   // frequency 2
        k.t = 1000 ;
        t.expect0(c.set('c', 'ccc')).true() ; // a expires, then b is evicted
        t.expect1([...c.keys()]).is(['c']) ;
        t.expect2(c.stats.expirations).is(1) ;
        t.expect3(c.stats.evictions).is(1) ;
    }) ;

    group.unary("stats and resetStats()", async(t) => {
        const k = clock() ;
        const c = new TSCache<string, number>({ ttl:1, maxCount:2, now:k.now }) ;
        c.set('a', 1) ; c.set('b', 2) ; c.set('c', 3) ;
        c.get('b') ; c.get('c') ; c.get('a') ;
        k.t = 1000 ;
        c.get('b') ;
        t.expect0(c.stats).is({ hits:2, misses:2, evictions:1, expirations:1, loads:0 }) ;
        c.resetStats() ;
        t.expect1(c.stats).is({ hits:0, misses:0, evictions:0, expirations:0, loads:0 }) ;
        t.expect2(c.removeExpired()).is(1) ;
        t.expect3(c.size).is(0) ;
    }) ;

    group.unary("getOrSet() loads once and stale-while-revalidate", async(t) => {
        const c = new TSCache<string, number>() ;
        let calls = 0 ;
        let release:(v:number) => void = () => {} ;
        const loader = () => { calls++ ; return new Promise<number>(resolve => { release = resolve ; }) ; } ;
        const p1 = c.getOrSet('a', loader) ;
        const p2 = c.getOrSet('a', loader) ;
        await tick() ; // the loader runs in a microtask
        release(7) ;
        t.expect0(await p1).is(7) ;
        t.expect1(await p2).is(7) ;
        t.expect2(calls).is(1) ;
        t.expect3(await c.getOrSet('a', loader)).is(7) ;
        t.expect4(calls).is(1) ;
        await t.expect5(c.getOrSet('x', () => { throw new Error('boom') ; })).rejects('boom') ;
        t.expect6(c.has('x')).false() ;

        const k = clock() ;
        const s = new TSCache<string, number>({ ttl:1, staleWhileRevalidate:10, now:k.now }) ;
        let n = 0 ;
        t.expect7(await s.getOrSet('a', () => n++)).is(0) ;
        k.t = 1500 ;
        t.expect8(await s.getOrSet('a', () => n++)).is(0) ; // the stale value, 1 being computed
        await tick() ;
        t.expect9(s.get('a')).is(1) ;
        k.t = 3000 ;
        t.expectA(await s.getOrSet('a', () => { throw new Error('down') ; })).is(1) ;
        await tick() ;
        t.expectB(s.peek('a')).undef() ;                                         // expired...
        t.expectC(await s.getOrSet('a', () => { throw new Error('down') ; })).is(1) ; // ...but still stale
        await tick() ;
        k.t = 12500 ;
        t.expectD(await s.getOrSet('a', () => n++)).is(2) ;
        t.expectE(s.stats.loads).is(3) ;
    }) ;

    group.unary("named caches", async(t) => {
        const c = $cache<string, number>('tests.cache', { maxCount:1 }) ;
        t.expect0($cache('tests.cache')).strictis(c) ;
        t.expect1($cache('tests.cache', { maxCount:10 })).strictis(c) ; // the options are not changed
        c.set('a', 1) ;
        $clearcaches() ;
        t.expect2(c.size).is(0) ;
        t.expect3($hascache('tests.cache')).true() ;
        t.expect4($removecache('tests.cache')).true() ;
        t.expect5($removecache('tests.cache')).false() ;
        t.expect6($cache('tests.cache')).notToStrictlyBe(c) ;
        $cache('tests.cache2', { sweepInterval:1 }) ;
        $removecaches() ;
        t.expect7($hascache('tests.cache')).false() ;
        t.expect8($hascache('tests.cache2')).false() ;
    }) ;

    group.unary("$memoize()", async(t) => {
        let calls = 0 ;
        const double = $memoize((x:number) => { calls++ ; return x * 2 ; }) ;
        t.expect0(double(2)).is(4) ;
        t.expect1(double(2)).is(4) ;
        t.expect2(double(3)).is(6) ;
        t.expect3(calls).is(2) ;
        t.expect4(double.cache.size).is(2) ;

        const add = $memoize((a:number, b:number) => { calls++ ; return a + b ; }, { key:(a:number, b:number) => `${a}+${b}`, maxCount:1 }) ;
        t.expect5(add(1, 2)).is(3) ;
        t.expect6(add(1, 3)).is(4) ;
        t.expect7(add(1, 3)).is(4) ;
        t.expect8(calls).is(4) ;

        let fails = 1 ;
        const load = $memoize(async (x:string) => { if (fails-- > 0) { throw new Error('first') ; } return x ; }) ;
        await t.expect9(load('a')).rejects('first') ;
        await tick() ;
        t.expectA(load.cache.has('a')).false() ; // a rejected promise is not kept
        t.expectB(await load('a')).is('a') ;
        t.expectC(load.cache.has('a')).true() ;
    }) ;

    group.unary("invalid options", async(t) => {
        t.expect0(() => new TSCache({ ttl:-1 })).throws() ;
        t.expect1(() => new TSCache({ maxCount:0 })).throws() ;
        t.expect2(() => new TSCache({ maxSize:-3 })).throws() ;
        t.expect3(() => new TSCache({ staleWhileRevalidate:-1 })).throws() ;
        t.expect4(() => new TSCache({ policy:'mru' as any })).throws() ;
        t.expect5(() => new TSCache().set('a', 1, { size:-1 })).throws() ;
        t.expect6(() => new TSCache().set('a', 1, { ttl:-1 })).throws() ;
        t.expect7(new TSCache().policy).is('lru') ;
    }) ;
}) ;
