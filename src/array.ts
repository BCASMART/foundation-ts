import { $count, $defined, $isarray, $isfunction, $ismethod, $isnumber, $isstring, $ok } from "./commons";
import { $arrayequal, $arraycompare, $compare, $equal, $visualequal } from "./compare";
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
export interface $mapOptions<T, R> {
    callback?: $mapCallback<T,R>,
    unicity?:Nullable<TSUnicity> ;
}

export function $map<T, R = T>(values: Nullable<Iterable<T>>, options?:Nullable<$mapCallback<T,R> | $mapOptions<T,R>>): R[] {
    const opts = $isfunction(options) ? { callback: options as $mapCallback<T,R> } 
                                      : ($ok(options) ? options as $mapOptions<T,R> : {}) ;
    if (!$ok(opts.callback)) { opts.callback = v => v as any as R ; }
    if (!$ok(opts.unicity)) { opts.unicity = TSUnicity.None ; }

    const ret = new Array<R>() ;
    if ($ok(values)) {
        const fn = opts.callback! ;

        switch (opts.unicity) { 
            case TSUnicity.None: {
                let index = 0;
                for (let v of values!) {
                    const mv = fn(v, index);
                    if ($ok(mv)) { ret.push(mv!); }
                    index++;
                }
                break ;
            }
            case TSUnicity.Objects:
                _mapEquality(ret, values!, fn, (_:R[]) => false)
                break ;

            case TSUnicity.Equality:
                _mapEquality(ret, values!, fn, (src:R[], o?:Nullable<R>) => $includesequal(src, o))
                break ;

            case TSUnicity.Visual:
                _mapEquality(ret, values!, fn, (src:R[], o?:Nullable<R>) => $includesvisual(src, o))
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
        for (let v of values!) {
            const mv = callback!(v, index++) ;
            if ($ok(mv)) { ret.add(mv!) ; }
        }
    }
    return ret ;
}

// $mapset() function is deprecated. use $arrayset() instead
export { $arrayset as $mapset }

export function $includesequal<T = any>(values: Nullable<Iterable<T>>, object:any): boolean {
    if ($ok(values)) {
        for (let v of values!) { if ($equal(object, v)) return true ; }
    }
    return false ;
}

export function $includesvisual<T = any>(values: Nullable<Iterable<T>>, object:any): boolean {
    if ($ok(values)) {
        for (let v of values!) { if ($visualequal(object, v)) return true ; }
    }
    return false ;
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


export interface $averageOptions {
    countsOnlyOKItems?: boolean; // this one superseeds countsOnlyDefinedItems
    countsOnlyDefinedItems?: boolean;
}
export function $average<T = any>(values: Nullable<Iterable<T>>, opts: $averageOptions = {}): number | undefined {
    let [count, definedCount, okCount, sum] = _countsAndSum<T>(values);

    if (opts.countsOnlyOKItems) { count = okCount; }
    else if (opts.countsOnlyDefinedItems) { count = definedCount; }

    return $defined(sum) && count > 0 ? sum! / count : undefined;
}

declare global {
    export interface Array<T> extends TSObject, TSFusionEnumeration {
        average:        (this:T[], opts?: $averageOptions) => number | undefined ;
        filteredMap:    <R = T>(this:T[], options?:Nullable<$mapCallback<T,R> | $mapOptions<T,R>>) => R[];
        filteredSet:    <R = T>(this:T[], callback?:Nullable<$mapCallback<T,R>>) => Set<R>;
        includesequal:  (this:T[], object:any) => boolean ;
        includesvisual: (this:T[], object:any) => boolean ;
        first:          (this:T[]) => T | undefined;
        last:           (this:T[]) => T | undefined;
        max:            (this:T[]) => T | undefined;
        min:            (this:T[]) => T | undefined;
        sum:            (this:T[]) => number | undefined;
    }
}

/**
 * since some modules like pdfjs require to use for ... in on Array.prototype
 * we did decide to use a functional way to declare our new methods on array
 * For now we limit this modification to Array class 
 */

_addArrayMethod('average',           function average<T>(this: T[], opts?: $averageOptions): number | undefined { return $average(this, opts); }) ;
_addArrayMethod('compare',           function compare<T>(this:T[], other:any):Comparison { return $isarray(other) ? $arraycompare(this, other) : undefined ; }) ;
_addArrayMethod('filteredMap',       function filteredMap<T, R>(this: T[], options?:Nullable<$mapCallback<T,R> | $mapOptions<T,R>>): R[] { return $map(this, options); }) ;
_addArrayMethod('filteredSet',       function filteredSet<T, R>(this: T[], callback?:Nullable<$mapCallback<T,R>>): Set<R> { return $arrayset(this, callback); }) ;
_addArrayMethod('includesequal',     function includesequal<T>(this:T[], object:any):boolean { return $includesequal(this, object) ; }) ;
_addArrayMethod('includesvisual',    function includesvisual<T>(this:T[], object:any):boolean { return $includesvisual(this, object) ; }) ;
_addArrayMethod('isEqual',           function isEqual<T>(this:T[], other:any):boolean { return $isarray(other) && $arrayequal(this, other) ; }) ;
_addArrayMethod('first',             function first<T>(this: T[]): T | undefined { return $first(this); }) ;
_addArrayMethod('fusionEnumeration', function fusionEnumeration<T>(this: T[]):any[] { return this as any[] ; }) ;
_addArrayMethod('last',              function first<T>(this: T[]): T | undefined { return $last(this); }) ;
_addArrayMethod('max',               function max<T>(this: T[]): T | undefined { return $max(this); }) ;
_addArrayMethod('min',               function min<T>(this: T[]): T | undefined { return $min(this); }) ;
_addArrayMethod('sum',               function sum<T>(this: T[]): number | undefined { return $sum(this); }) ;
_addArrayMethod('toArray',           function toArray<T>(this:T[]): T[] { return this ; }) ; // QUESTION: should we take a copy here

/*

Array.prototype.average             = function average<T>(this: T[], opts?: $averageOptions): number | undefined { return $average(this, opts); } ;
Array.prototype.compare             = function compare<T>(this:T[], other:any):Comparison { return $isarray(other) ? $arraycompare(this, other) : undefined ; }
Array.prototype.filteredMap         = function filteredMap<T, R>(this: T[], options?:Nullable<$mapCallback<T,R> | $mapOptions<T,R>>): R[] { return $map(this, options); } ;
Array.prototype.filteredSet         = function filteredSet<T, R>(this: T[], callback?:Nullable<$mapCallback<T,R>>): Set<R> { return $arrayset(this, callback); } ;
Array.prototype.includesequal       = function includesequal<T>(this:T[], object:any):boolean { return $includesequal(this, object) ; }
Array.prototype.includesvisual      = function includesvisual<T>(this:T[], object:any):boolean { return $includesvisual(this, object) ; }
Array.prototype.isEqual             = function isEqual<T>(this:T[], other:any):boolean { return $isarray(other) && $arrayequal(this, other) ; }
Array.prototype.first               = function first<T>(this: T[]): T | undefined { return $first(this); } ;
Array.prototype.fusionEnumeration   = function fusionEnumeration():any[] { return this as any[] ; } ;
Array.prototype.last                = function first<T>(this: T[]): T | undefined { return $last(this); } ;
Array.prototype.max                 = function max<T>(this: T[]): T | undefined { return $max(this); } ;
Array.prototype.min                 = function min<T>(this: T[]): T | undefined { return $min(this); } ;
Array.prototype.sum                 = function sum<T>(this: T[]): number | undefined { return $sum(this); } ;
Array.prototype.toArray             = function toArray<T>(this:T[]): T[] { return this ; } // QUESTION: should we take a copy here

*/
// ================================== private functions ==============================
function _addArrayMethod(name:string, method:Function) {
    Object.defineProperty(Array.prototype, name, { value:method, enumerable:false }) ;      
}

function _mapEquality<T, R>(target:R[], values:Iterable<T>, fn:$mapCallback<T,R>, includesFn:(source:R[], v?:Nullable<R>)=>boolean) {
    const set = new Set<R>() ;
    let index = 0;
    for (let v of values!) {
        const mv = fn(v, index++);
        if ($ok(mv) && !set.has(mv!) && !includesFn(target, mv)) { 
            target.push(mv!) ; 
            set.add(mv!) ;
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
    if ($ok(values)) {
        for (let v of values!) {
            if ($defined(v)) {
                if (v !== null) {
                    if ($defined(sum)) {
                        let n = undefined ;
                        if ($isnumber(v)) { n = v ;}
                        else if ($isstring(v)) { n = Number(v) ; }
                        else if ($ismethod(v, 'toNumber')) { n = (v as any).toNumber() } 
                        if (!$isnumber(n)) { sum = undefined ; } // any fails to number conversion definitely invalidates the sum
                        else { sum += n ; }
                    }
                    validCount ++ ;  
                }
                definedCount ++ ;
            }
            totalCount ++ ;
        }    
    }
    return [totalCount, definedCount, validCount, sum]
}

function _minmax<T>(values:Nullable<Iterable<T>>, compValue:Comparison):T|undefined
{
    let ret:undefined|T = undefined ;
    if ($ok(values)) {
        for (let v of values!) { 
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
