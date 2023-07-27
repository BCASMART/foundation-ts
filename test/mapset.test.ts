import { TSTest } from "../src/tstester";
import "../src/mapset"

export const mapsetGroups = TSTest.group("Commons map and set additions", async (group) => {
    const base = "A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z,0,1,2,3,4,5,6,7,8,9".split(',') ;
    const vstring = 'AEIOUY' ;
    
    group.unary("conditionalClear(), map() and toArray() methods", async(t) => {
        const set = new Set(base) ;
        t.expect0(set.toArray()).is(base) ;
        t.expect1(set.map(e => vstring.includes(e) ? e : null ).toArray().join('')).is(vstring)
        set.conditionalClear(e => !(vstring.includes(e)))
        t.expect2(set.toArray().join('')).is(vstring) ;
        t.expect3(set.keysArray().join('')).is(vstring) ;
        t.expect4(set.valuesArray().join('')).is(vstring) ;
    }) ;

    group.unary("conditionalClear(), map(), keysArray() and valuesArray() methods", async(t) => {
        const map = new Map<string,string>() ;
        base.forEach(e => map.set(e,e)) ;
        t.expect0(map.keysArray()).is(base) ;
        t.expect1(map.valuesArray()).is(base) ;

        const voyelles = map.map((k,v) => vstring.includes(k) ? v : null) ;
        t.expect2(voyelles.keysArray().join('')).is(vstring) ;
        t.expect3(voyelles.valuesArray().join('')).is(vstring) ;

        map.conditionalClear((_,v) => !(vstring.includes(v))) ;
        t.expect4(map.keysArray().join('')).is(vstring) ;
        t.expect5(map.valuesArray().join('')).is(vstring) ;
    }) ;

}) ;