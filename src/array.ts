import { $count, $defined, $isnumber, $isstring, $ok } from "./commons";
import { $compare } from "./compare";
import { TSFusionEnumeration } from "./tsfusionnode";
import { Ascending, Comparison, Descending, Nullable } from "./types";


export function $mapset<T, R = T>(values: Nullable<Iterable<T>>, callback:(value: T, index: number) => Nullable<R>): Set<R> {
    if (!$ok(callback)) { callback = function(v:any, _:number){ return v as R ; } ; }
    const ret = new Set<R>() ;
    if ($ok(values)) {
        let index = 0 ;
        for (let v of values!) {
            const mv = callback!(v, index) ;
            if ($ok(mv)) { ret.add(mv!) ; }
            index ++ ;
        }
    }
    return ret ;
}

/*
    This is a map function where callback returns as null or undefined are
    flushed from the result
 */
export function $map<T, R = T>(values: Nullable<Iterable<T>>, callback: (value: T, index: number) => Nullable<R>): R[] {
    const ret = new Array<R>();
    if ($ok(values)) {
        let index = 0;
        for (let v of values!) {
            const mv = callback(v, index);
            if ($ok(mv)) { ret.push(mv!); }
            index++;
        }
    }
    return ret;
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
    export interface Array<T> extends TSFusionEnumeration {
        first: (this:T[]) => T | undefined;
        last: (this:T[]) => T | undefined;
        min: (this:T[]) => T | undefined;
        max: (this:T[]) => T | undefined;
        sum: (this:T[]) => number | undefined;
        average: (this:T[], opts?: $averageOptions) => number | undefined;
        filteredMap: <R = T>(this:T[], callback: (value: T, index: number) => Nullable<R>) => R[];
        filteredSet: <R = T>(this:T[], callback: (value: T, index: number) => Nullable<R>) => Set<R>;
    }
}

Array.prototype.fusionEnumeration = function fusionEnumeration():any[] { return this as any[] ; }

if (!('first' in Array.prototype)) {
    Array.prototype.first = function first<T>(this: T[]): T | undefined { return $first(this); }
}
if (!('last' in Array.prototype)) {
    Array.prototype.last = function first<T>(this: T[]): T | undefined { return $last(this); }
}
if (!('min' in Array.prototype)) {
    Array.prototype.min = function min<T>(this: T[]): T | undefined { return $min(this); }
}
if (!('max' in Array.prototype)) {
    Array.prototype.max = function max<T>(this: T[]): T | undefined { return $max(this); }
}
if (!('sum' in Array.prototype)) {
    Array.prototype.sum = function sum<T>(this: T[]): number | undefined { return $sum(this); }
}
if (!('average' in Array.prototype)) {
    Array.prototype.average = function average<T>(this: T[], opts?: $averageOptions): number | undefined { return $average(this, opts); }
}
if (!('filteredMap' in Array.prototype)) {
    Array.prototype.filteredMap = function filteredMap<T, R>(this: T[], callback: (e: T, index: number) => Nullable<R>): R[] { return $map(this, callback); }
}
if (!('filteredSet' in Array.prototype)) {
    Array.prototype.filteredSet = function filteredMap<T, R>(this: T[], callback: (e: T, index: number) => Nullable<R>): Set<R> { return $mapset(this, callback); }
}

// ================================== private functions ==============================
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
                        else if ('toNumber' in v!) { n = (v as any).toNumber() } 
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
