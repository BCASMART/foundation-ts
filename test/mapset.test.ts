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

    group.unary("testing Map.dictionary() methods", async(t) => {
        const map = new Map<string,string>() ;
        ['T', 'E', 'A'].forEach(e => map.set(e,e)) ;
        t.expect0(map.keysArray().join('')).is('TEA') ;
        t.expect1(map.valuesArray().join('')).is('TEA') ;
        t.expect3(map.dictionary()).is({ T:'T', E:'E', A:'A' })
        t.expect4(map.dictionary((k,v) => [k.toLowerCase(), `-${v}-`])).is({ t:'-T-', e:'-E-', a:'-A-' })
        t.expect5(map.dictionary((k,v) => k === 'E' ? [null, null] : [k.toLowerCase(), `-${v}-`])).is({ t:'-T-', a:'-A-' })
        t.expect6(map.dictionary((k,v) => k === 'E' ? [k, null] : [k.toLowerCase(), `-${v}-`])).is({ t:'-T-', a:'-A-' })
        t.expect7(map.dictionary((k,v) => k === 'E' ? [null, v] : [k.toLowerCase(), `-${v}-`])).is({ t:'-T-', a:'-A-' })
        t.expect8(map.dictionary((k,v) => k === 'E' ? ['', v] : [k.toLowerCase(), `-${v}-`])).is({ t:'-T-', a:'-A-' })
    }) ;

    group.unary("Set.length property", async (t) => {
        t.expect0(new Set([]).length).is(0) ;
        t.expect1(new Set([10]).length).is(1) ;
        t.expect2(new Set([45,12]).length).is(2) ;
        t.expect3(new Set([undefined]).length).is(1) ;
        t.expect4(new Set(["45",undefined]).length).is(2) ;
        t.expect5(new Set([undefined,333]).length).is(2) ;
        t.expect6(new Set([undefined,undefined]).length).is(1) ;
        t.expect7(new Set([13,13]).length).is(1) ;
    }) ;
    group.unary("Set.singular() method", async (t) => {
        t.expect0(new Set([]).singular()).false() ;
        t.expect1(new Set([10]).singular()).true() ;
        t.expect2(new Set([45,12]).singular()).false() ;
        t.expect3(new Set([undefined]).singular()).true() ;
        t.expect4(new Set(["45",undefined]).singular()).false() ;
        t.expect5(new Set([undefined,333]).singular()).false() ;
        t.expect6(new Set([undefined,undefined]).singular()).true() ;
        t.expect7(new Set([13,13]).singular()).true() ;
    }) ;

}) ;