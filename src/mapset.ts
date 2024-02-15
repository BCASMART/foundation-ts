import { Comparison, Nullable, Same, UINT_MIN, uint, TSDictionary } from "./types";
import { $length, $ok, $string } from "./commons";
import { $mapequal, $setequal } from "./compare";
import { TSFusionEnumeration } from "./tsfusionnode";
import { TSObject } from "./tsobject";
import { $declareAccessor } from "./object";

// $mapset() function was similar to $mapset(<iterable>,...) in array.ts. 
// name change was mandatory this function, so it goes to $setmap() which
// is consistant with $mapmap()
export function $setmap<T, U=T>(set:Nullable<Set<T>>, mapFunction:(element:T)=>Nullable<U>):Set<U> {
    const ret = new Set<U>() ;
    set?.forEach(e => { const u = mapFunction(e) ; if ($ok(u)) { ret.add(u!) ; }}) ;
    return ret ;
}

export function $mapmap<K,V,U=V>(map:Nullable<Map<K,V>>, mapFunction:(key:K, value:V)=>Nullable<U>):Map<K,U> {
    const ret = new Map<K,U>() ;
    map?.forEach((v,k) => { const u = mapFunction(k, v) ; if ($ok(u)) { ret.set(k,u!) ; }}) ;
    return ret ;
}

export function $conditionalClearSet<T>(set:Nullable<Set<T>>, clearFunction:(element:T)=>boolean):uint {
    if ($ok(set)) {
        const toBeCleared:T[] = [] ;
        set!.forEach(e => { if (clearFunction(e)) { toBeCleared.push(e) ; }}) ;
        toBeCleared.forEach(e => set!.delete(e)) ;
        return toBeCleared.length as uint ;
    }
    return UINT_MIN ;
}

export function $conditionalClearMap<K,V>(map:Nullable<Map<K,V>>, clearFunction:(element:K, value:V)=>boolean):uint {
    if ($ok(map)) {
        const toBeCleared:K[] = [] ;
        map!.forEach((v,k) => { if (clearFunction(k,v)) { toBeCleared.push(k) ; }}) ;
        toBeCleared.forEach(k => map!.delete(k)) ;
        return toBeCleared.length as uint ;
    }
    return UINT_MIN ;
}

export function $dictionaryFromMap<K,V, U=V>(map:Nullable<Map<K,V>>, mapFunction?:Nullable<(key:K, value:V)=>[Nullable<string>,Nullable<U>]>):TSDictionary<U> {
    const ret:TSDictionary<U> = {} ;
    const fn = $ok(mapFunction) ? mapFunction! : _simpleConvert ;
    map?.forEach((v0,k0) => { 
        const [k,u] = fn(k0, v0) ; 
        if ($ok(u) && $length(k) > 0) { ret[k!] = u! ; }
    }) ;
    return ret ;
}

function _simpleConvert<K,V, U=V>(key:K, value:V):[Nullable<string>, Nullable<U>] { return [$string(key), value as any] }
declare global {
    export interface Set<T> extends TSObject, TSFusionEnumeration {
        length:number ;
        conditionalClear:   (this:Set<T>, clearFunction:(element:T)=>boolean) => uint ;
        keysArray:          (this:Set<T>) => T[] ;
        map:                (this:Set<T>, mapFunction:(element:T)=>any) => Set<any> ;
        singular:           (this:Set<T>) => boolean ;
        valuesArray:        (this:Set<T>) => T[] ;
    }
    export interface Map<K,V> extends TSObject, TSFusionEnumeration {
        conditionalClear:   (this:Map<K,V>, clearFunction:(key:K, value:V)=>boolean) => uint ;
        dictionary:         (this:Map<K,V>, mapFunction?:Nullable<(key:K, value:V)=>[Nullable<string>, any]>) => TSDictionary<any> ;
        keysArray:          (this:Map<K,V>) => K[] ;
        map:                (this:Map<K,V>, mapFunction:(key:K, value:V)=>any) => Map<K,any> ;
        valuesArray:        (this:Map<K,V>) => V[] ;
    }
}

$declareAccessor(Set, { element:'length', getter:function<T>(this:Set<T>):number { return this.size ; }})

Set.prototype.compare = function compare<T>(this:Set<T>, other:any):Comparison { return other instanceof Set && $setequal(this, other) ? Same : undefined ; }
Set.prototype.conditionalClear = function conditionalClear<T>(this:Set<T>, clearFunction:(element:T)=>boolean):uint { return $conditionalClearSet(this, clearFunction) ; }
Set.prototype.fusionEnumeration = function fusionEnumeration():any[] { return Array.from(this) ; }
Set.prototype.isEqual = function isEqual<T>(this:Set<T>, other:any):boolean { return other instanceof Set && $setequal(this, other) ; }
Set.prototype.keysArray = function keysArray<T>(this:Set<T>):T[] { return Array.from(this.values()) ; }
Set.prototype.map = function map<T, U=T>(this:Set<T>, mapFunction:(element:T)=>Nullable<U>):Set<U> { return $setmap(this, mapFunction) ; }
Set.prototype.singular = function singular<T>(this:Set<T>):boolean { return this.size === 1 ; }
Set.prototype.toArray = function toArray<T>(this:Set<T>):T[] { return Array.from(this.values()) ; }
Set.prototype.valuesArray = function valuesArray<T>(this:Set<T>):T[] { return Array.from(this.values()) ; }

Map.prototype.compare = function compare<K,V>(this:Map<K,V>, other:any):Comparison { return other instanceof Map && $mapequal(this, other) ? Same : undefined ; }
Map.prototype.conditionalClear = function conditionalClear<K, V>(this:Map<K, V>, clearFunction:(element:K, value:V)=>boolean):uint { return $conditionalClearMap(this, clearFunction) ; }
Map.prototype.dictionary = function dictionary<K,V,U=V>(this:Map<K,V>, mapFunction?:Nullable<(key:K, value:V)=>[Nullable<string>, Nullable<U>]>):TSDictionary<U> { 
    return $dictionaryFromMap(this, mapFunction) ; 
}
Map.prototype.fusionEnumeration = function fusionEnumeration():any[] {
    const ret:any[] = [] ;
    this.forEach((value:any, key:any) => ret.push({key:key, value:value})) ;
    return ret ;
}
Map.prototype.isEqual = function isEqual<K,V>(this:Map<K,V>, other:any):boolean { return other instanceof Map && $mapequal(this, other) ; }
Map.prototype.keysArray = function keysArray<K,V>(this:Map<K,V>):K[] { return Array.from(this.keys()) ; }
Map.prototype.map = function map<K,V,U=V>(this:Map<K,V>, mapFunction:(key:K, value:V)=>Nullable<U>):Map<K,U> { return $mapmap(this, mapFunction) ; }
Map.prototype.toArray = function toArray<K,V>(this:Map<K,V>):Array<[K,V]> { return Array.from(this.entries()) ; }
Map.prototype.valuesArray = function valuesArray<K,V>(this:Map<K,V>):V[] { return Array.from(this.values()) ; }


