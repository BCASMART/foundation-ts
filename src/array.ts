import { $count, $defined, $isarray, $isfunction, $ismethod, $isnumber, $isstring, $ok, $string } from "./commons";
import { $arrayequal, $arraycompare, $compare, $equal, $visualequal, $visualkey, $visualorder } from "./compare";
import { $declareMethods } from "./object";
import { TSFusionEnumeration } from "./tsfusionnode";
import { TSObject } from "./tsobject";
import { Ascending, Comparison, Descending, Nullable, TSUnicity } from "./types";


/*
    This is a map function where callback returns as null or undefined are
    flushed from the result. The function also manages 3 unicity checking :

        TSUnicity.None:     No unicity is guaranteed. You may get the same item several times
        TSUnicity.Object:   An unicity is guaranteed using the object themselves (equivalent to pointers equality).
        TSUnicity.Equality: All returned objects are not equal one to each other using $equal() function.
        TSUnicity.Visual:   All returned objects are not equal one to each other using $visualequal() function. 
 */

export type $mapCallback<T,R> = (value: T, index: number) => Nullable<R> ;  
export interface TSMapOptions<T, R> {
    callback?: $mapCallback<T,R>,
    unicity?:Nullable<TSUnicity> ; // NOSONAR: optional
}
/** @deprecated use TSMapOptions */
export type $mapOptions<T, R> = TSMapOptions<T,R> ;

export function $map<T, R = T>(values: Nullable<Iterable<T>>, options?:Nullable<$mapCallback<T,R> | TSMapOptions<T,R>>): R[] {
    let opts:TSMapOptions<T,R> = {} ;
    if ($isfunction(options)) { opts = { callback: options as $mapCallback<T,R> } ; }
    else if ($ok(options)) { opts = options as TSMapOptions<T,R> ; }
    if (!$ok(opts.callback)) { opts.callback = v => v as any as R ; }
    if (!$ok(opts.unicity)) { opts.unicity = TSUnicity.None ; }

    const ret = new Array<R>() ;
    if ($ok(values)) {
        const fn = opts.callback! ;

        switch (opts.unicity) { 
            case TSUnicity.None: {
                let index = 0;
                for (let v of values) {
                    const mv = fn(v, index);
                    if ($ok(mv)) { ret.push(mv); }
                    index++;
                }
                break ;
            }
            case TSUnicity.Objects:
                _mapObjects(ret, values, fn) ;
                break ;

            case TSUnicity.Equality:
                _mapEquality(ret, values, fn) ;
                break ;

            case TSUnicity.Visual:
                _mapVisual(ret, values, fn) ;
                break ;
        }
    }
    return ret;
}

export function $arrayset<T, R = T>(values: Nullable<Iterable<T>>, callback?:Nullable<$mapCallback<T,R>>): Set<R> {
    if (!$ok(callback)) { callback = function(v:any, _:number){ return v as R ; } ; }
    const ret = new Set<R>() ;
    if ($ok(values)) {
        let index = 0 ;
        for (let v of values) {
            const mv = callback!(v, index++) ;
            if ($ok(mv)) { ret.add(mv) ; }
        }
    }
    return ret ;
}

// $mapset() function is deprecated. use $arrayset() instead
export { $arrayset as $mapset }

export function $includesequal<T = any>(values: Nullable<Iterable<T>>, object:any): boolean {
    if ($ok(values)) {
        for (let v of values) { if ($equal(object, v)) return true ; }
    }
    return false ;
}

export function $includesvisual<T = any>(values: Nullable<Iterable<T>>, object:any): boolean {
    if ($ok(values)) {
        for (let v of values) { if ($visualequal(object, v)) return true ; }
    }
    return false ;
}


/*
    Returns a new array with the given values in the order of $visualorder(), which is the result of
    [...values].sort($visualorder), but the visual key of each value is computed once (instead of twice
    by comparison). As with Array.sort(), undefined values are put at the end (null values come first).
 */
export function $visualsort<T = any>(values: Nullable<Iterable<T>>): T[] {
    if (!$ok(values)) { return [] ; }
    const all = Array.from(values!) ;
    // $visualcompare() compares two URLs with their href and an URL with something else with $string().
    // If these differ (an URL subclass), a key per value is impossible, so we sort as before
    if (all.some((v:any) => v instanceof URL && $string(v) !== v.href)) { return all.sort($visualorder) ; }
    const defined = all.filter(v => v !== undefined) ;
    const keys = defined.map((v:any) => {
        const vk = v instanceof URL ? v.href : v ;
        return $ok(v) ? $visualkey(vk) : undefined ;
    }) ;
    const indexes = defined.map((_, i) => i) ;
    indexes.sort((i, j) => {
        const a = keys[i], b = keys[j] ;
        if (a === undefined) { return b === undefined ? 0 : -1 ; } // null values first, like $visualorder()
        if (b === undefined) { return 1 ; }
        if (a === b) { return 0 ; }
        return a < b ? -1 : 1 ;
    }) ;
    const ret:T[] = indexes.map(i => defined[i]) ;
    for (let n = all.length - defined.length ; n > 0 ; n--) { ret.push(undefined as T) ; }
    return ret ;
}

export function $first<T = any>(values: Nullable<ArrayLike<T>>): T | undefined {
    const n = $count(values); return n > 0 ? values![0] : undefined;
}

export function $last<T = any>(values: Nullable<ArrayLike<T>>): T | undefined {
    const n = $count(values); return n > 0 ? values![n - 1] : undefined;
}

// the sum of null, undefined or an empty array is always 0, 
// regardless of what it could contain
export function $sum<T = any>(values: Nullable<Iterable<T>>): number | undefined {
    // with that implementation undefined and null values are considered as 0 for the sum
    const [, , , sum] = _countsAndSum<T>(values);
    return sum;
}

export function $min<T=any>(values:Nullable<Iterable<T>>):T|undefined
{ return _minmax(values, Descending) ;}

export function $max<T=any>(values:Nullable<Iterable<T>>):T|undefined 
{ return _minmax(values, Ascending) ;}


export interface TSAverageOptions {
    countsOnlyOKItems?: boolean; // this one superseeds countsOnlyDefinedItems
    countsOnlyDefinedItems?: boolean;
}
/** @deprecated use TSAverageOptions */
export type $averageOptions = TSAverageOptions ;
export function $average<T = any>(values: Nullable<Iterable<T>>, opts: TSAverageOptions = {}): number | undefined {
    let [count, definedCount, okCount, sum] = _countsAndSum<T>(values);

    if (opts.countsOnlyOKItems) { count = okCount; }
    else if (opts.countsOnlyDefinedItems) { count = definedCount; }

    return $defined(sum) && count > 0 ? sum / count : undefined;
}

declare global {
    export interface Array<T> extends TSObject, TSFusionEnumeration {
        average:        (this:T[], opts?: TSAverageOptions) => number | undefined ;
        filteredMap:    <R = T>(this:T[], options?:Nullable<$mapCallback<T,R> | TSMapOptions<T,R>>) => R[];
        filteredSet:    <R = T>(this:T[], callback?:Nullable<$mapCallback<T,R>>) => Set<R>;
        includesequal:  (this:T[], object:any) => boolean ;
        includesvisual: (this:T[], object:any) => boolean ;
        first:          (this:T[]) => T | undefined ;
        last:           (this:T[]) => T | undefined ;
        max:            (this:T[]) => T | undefined ;
        min:            (this:T[]) => T | undefined ;
        singular:       (this:T[]) => boolean ;
        sum:            (this:T[]) => number | undefined ;
        visualSort:     (this:T[]) => T[] ;
        toVisualSorted: (this:T[]) => T[] ;
    }
}

/**
 * since some modules like pdfjs require to use for ... in on Array.prototype
 * we declare our new methods as non enumerable ones with $declareMethods()
 */

$declareMethods(Array, {
    average<T>(this: T[], opts?: TSAverageOptions): number | undefined { return $average(this, opts); },
    compare<T>(this:T[], other:any):Comparison { return $isarray(other) ? $arraycompare(this, other) : undefined ; },
    filteredMap<T, R>(this: T[], options?:Nullable<$mapCallback<T,R> | TSMapOptions<T,R>>): R[] { return $map(this, options); },
    filteredSet<T, R>(this: T[], callback?:Nullable<$mapCallback<T,R>>): Set<R> { return $arrayset(this, callback); },
    includesequal<T>(this:T[], object:any):boolean { return $includesequal(this, object) ; },
    includesvisual<T>(this:T[], object:any):boolean { return $includesvisual(this, object) ; },
    isEqual<T>(this:T[], other:any):boolean { return $isarray(other) && $arrayequal(this, other) ; },
    first<T>(this: T[]): T | undefined { return $first(this); },
    fusionEnumeration<T>(this: T[]):any[] { return this as any[] ; },
    last<T>(this: T[]): T | undefined { return $last(this); },
    max<T>(this: T[]): T | undefined { return $max(this); },
    min<T>(this: T[]): T | undefined { return $min(this); },
    sum<T>(this: T[]): number | undefined { return $sum(this); },
    singular<T>(this: T[]): boolean { return this.length === 1 ; },
    toArray<T>(this:T[]): T[] { return this ; }, // QUESTION: should we take a copy here
    // sorts the array in place and returns it, like this.sort($visualorder) (but faster, see $visualsort()).
    // As with sort(), the undefined values are put at the end, followed by the empty slots of a sparse array
    visualSort<T>(this:T[]): T[] {
        const n = this.length ;
        const present:T[] = [] ;
        for (let i = 0 ; i < n ; i++) { if (i in this) { present.push(this[i]) ; } }
        const sorted = $visualsort(present) ;
        for (let i = 0 ; i < sorted.length ; i++) { this[i] = sorted[i] ; }
        // the empty slots at the end: truncating the array removes its last elements, restoring its length leaves them empty
        this.length = sorted.length ;
        this.length = n ;
        return this ;
    },
    // returns a sorted copy of the array, like this.toSorted($visualorder) (but faster, see $visualsort())
    toVisualSorted<T>(this:T[]): T[] { return $visualsort(this) ; },
}) ;

// ================================== private functions ==============================

function _mapObjects<T, R>(target:R[], values:Iterable<T>, fn:$mapCallback<T,R>) {
    const set = new Set<R>() ;
    let index = 0;
    for (let v of values) {
        const mv = fn(v, index++);
        if ($ok(mv) && !set.has(mv)) { 
            target.push(mv) ; 
            set.add(mv) ;
        }
    }
}

// $equal() is === on two primitive values (NaN apart), so the primitive values already kept are
// found in a Set. An object (or NaN) is still compared with $equal() to all the kept values, and a
// primitive value to the kept objects (since an object isEqual() method may accept it)
function _mapEquality<T, R>(target:R[], values:Iterable<T>, fn:$mapCallback<T,R>) {
    const primitives = new Set<R>() ;
    const objects:R[] = [] ;
    let index = 0;
    for (let v of values) {
        const mv = fn(v, index++);
        if (!$ok(mv)) { continue ; }
        if (_isprimitive(mv)) {
            if (primitives.has(mv) || $includesequal(objects, mv)) { continue ; }
            primitives.add(mv) ;
        }
        else {
            // the identity check comes first, as before (so a second NaN is not kept)
            if (objects.includes(mv) || $includesequal(target, mv)) { continue ; }
            objects.push(mv) ;
        }
        target.push(mv) ;
    }
}

function _isprimitive(v:any):boolean {
    const t = typeof v ;
    return t === 'string' || t === 'boolean' || t === 'bigint' || (t === 'number' && !Number.isNaN(v)) ;
}

// two values are visually equal if and only if their visual keys are equal
function _mapVisual<T, R>(target:R[], values:Iterable<T>, fn:$mapCallback<T,R>) {
    const keys = new Set<string>() ;
    let index = 0;
    for (let v of values) {
        const mv = fn(v, index++);
        if ($ok(mv)) {
            const key = $visualkey(mv) ;
            if (!keys.has(key)) { 
                target.push(mv) ; 
                keys.add(key) ;
            }
        }
    }
}

function _countsAndSum<T>(values:Nullable<Iterable<T>>):[number, number, number, number|undefined] {
    // since we work on Iterable, we don't use any length
    // and count our collection when trying to perform a sum
    let sum:number|undefined = 0 ;
    let validCount = 0 ;
    let definedCount = 0 ;
    let totalCount = 0 ;

    if (!$ok(values)) { return [0, 0, 0, 0] ; }

    for (const v of values) {
        totalCount++ ;
        if (!$defined(v)) { continue ; }
        definedCount++ ;
        if (v === null) { continue ; }
        validCount++ ;
        // once a conversion has failed, the sum stays definitely invalid
        // and we don't even try to convert the next values
        if ($defined(sum)) { sum = _addToSum(sum, v) ; }
    }
    return [totalCount, definedCount, validCount, sum] ;
}

function _addToSum(sum:number, v:any):number|undefined {
    const n = _toNumber(v) ;
    return $isnumber(n) ? sum + n : undefined ;
}

// returns the numeric value of v or anything else (undefined, NaN, object...)
// if no valid conversion is possible. The caller checks the result with $isnumber()
function _toNumber(v:any):any {
    if ($isnumber(v)) { return v ; }
    if ($isstring(v)) { return Number(v) ; }
    if ($ismethod(v, Symbol.toPrimitive)) {
        const n = v[Symbol.toPrimitive]('number') ;
        if ($ok(n)) { return n ; }
    }
    return $ismethod(v, 'valueOf') ? v.valueOf() : undefined ;
}

function _minmax<T>(values:Nullable<Iterable<T>>, compValue:Comparison):T|undefined
{
    let ret:undefined|T = undefined ;
    if ($ok(values)) {
        for (let v of values) { 
            if (!$ok(v)) { return undefined ; }
            else if (!$ok(ret)) { ret = v ; }
            else { 
                let comp = $compare(ret, v) ;
                if (!$defined(comp)) { return undefined ; }
                else if (comp === compValue) { ret = v ; }
            }
        }    
    }
    return ret ;
}
