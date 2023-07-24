import { $ok } from "./commons";
import { TSFusionEnumeration } from "./tsfusionnode";
import { Nullable, uint } from "./types";

declare global {
    export interface Set<T, U=T> extends TSFusionEnumeration {
        conditionalClear: (this:Set<T>, clearFunction:(element:T)=>boolean) => uint ;
        map:(this:Set<T>, mapFunction:(element:T)=>Nullable<U>) => Set<U> ;
        toArray:(this:Set<T>) => T[] ; 
        keysArray:(this:Set<T>) => T[] ;
        valuesArray:(this:Set<T>) => T[] ;
    }
    export interface Map<K,V, U=V> extends TSFusionEnumeration {
        conditionalClear: (this:Map<K,V>, clearFunction:(key:K, value:V)=>boolean) => uint ;
        map:(this:Map<K,V>, mapFunction:(key:K, value:V)=>Nullable<U>) => Map<K,U> ;
        toArray:(this:Map<K,V>) => Array<[K,V]> ; 
        keysArray:(this:Map<K,V>) => K[] ;
        valuesArray:(this:Map<K,V>) => V[] ;
    }
}

Set.prototype.fusionEnumeration = function fusionEnumeration():any[] { return Array.from(this) ; }
Set.prototype.conditionalClear = function conditionalClear<T>(this:Set<T>, clearFunction:(element:T)=>boolean):uint {
    const toBeCleared:T[] = [] ;
    this.forEach(e => { if (clearFunction(e)) { toBeCleared.push(e) ; }}) ;
    toBeCleared.forEach(e => this.delete(e)) ;
    return toBeCleared.length as uint ;
}

Set.prototype.map = function map<T,U=T>(this:Set<T>, mapFunction:(element:T)=>U):Set<U> {
    const ret = new Set<U>() ;
    this.forEach(e => { 
        const u = mapFunction(e) ; if ($ok(u)) { ret.add(u!) ; }
    }) ;
    return ret ;
}

Set.prototype.toArray = function toArray<T>(this:Set<T>):T[] { return Array.from(this.values()) ; }
Set.prototype.keysArray = Set.prototype.toArray ;
Set.prototype.valuesArray = Set.prototype.toArray ;


Map.prototype.conditionalClear = function conditionalClear<K, V>(this:Map<K, V>, clearFunction:(element:K, value:V)=>boolean):uint {
    const toBeCleared:K[] = [] ;
    this.forEach((v,k) => { if (clearFunction(k,v)) { toBeCleared.push(k) ; }}) ;
    toBeCleared.forEach(k => this.delete(k)) ;
    return toBeCleared.length as uint ;
}

Map.prototype.map = function map<K,V,U=V>(this:Map<K,V>, mapFunction:(key:K, value:V)=>Nullable<U>):Map<K,U> {
    const ret = new Map<K,U>() ;
    this.forEach((v,k) => { 
        const u = mapFunction(k, v) ; if ($ok(u)) { ret.set(k,u!) ; }
    }) ;
    return ret ;
}

Map.prototype.fusionEnumeration = function fusionEnumeration():any[] {
    const ret:any[] = [] ;
    this.forEach((value:any, key:any) => ret.push({key:key, value:value})) ;
    return ret ;
}

Map.prototype.toArray = function toArray<K,V>(this:Map<K,V>):Array<[K,V]> { return Array.from(this.entries()) ; }
Map.prototype.keysArray = function keysArray<K,V>(this:Map<K,V>):K[] { return Array.from(this.keys()) ; }
Map.prototype.valuesArray = function valuesArray<K,V>(this:Map<K,V>):V[] { return Array.from(this.values()) ; }
