import { $declareAccessor, $declareMethod, $declareMethods, TSConstructor } from "../src/object";
import { TSTest } from "../src/tstester";
import "../src/date";   // declares the Date.prototype.timestamp accessor
import "../src/mapset"; // declares the Set.prototype.length accessor
import "../src/array";  // declares the Array.prototype methods

// $declareMethod() / $declareAccessor() throw plain strings (the file is kept
// independent from tserrors) ; t.expect(fn).toThrow() handles that.

export const objectGroups = TSTest.group("object.ts prototype declaration helpers", async (group) => {

    group.unary("$declareMethod() installs a working, non-enumerable method by default", async(t) => {
        class A { public v = 21 ; }
        $declareMethod(A as TSConstructor, { element:'double', implementation:function(this:any) { return this.v * 2 ; } }) ;
        const a = new A() as any ;
        t.expect0(a.double()).is(42) ;
        // default descriptor: not enumerable, not configurable
        const desc = Object.getOwnPropertyDescriptor(A.prototype, 'double')! ;
        t.expect1(desc.enumerable).false() ;
        t.expect2(desc.configurable).false() ;
        t.expect3(Object.keys(a).includes('double')).false() ;
    }) ;

    group.unary("$declareMethod() honours enumerable / configurable flags", async(t) => {
        class B {}
        $declareMethod(B as TSConstructor, { element:'m', implementation:() => 1, enumerable:true, configurable:true }) ;
        const desc = Object.getOwnPropertyDescriptor(B.prototype, 'm')! ;
        t.expect0(desc.enumerable).true() ;
        t.expect1(desc.configurable).true() ;
    }) ;

    group.unary("$declareMethod() rejects bad declarations", async(t) => {
        class C {}
        const impl = () => 0 ;
        t.expect0(() => $declareMethod(undefined as any, { element:'x', implementation:impl })).toThrow() ;
        t.expect1(() => $declareMethod(C as TSConstructor, { element:'', implementation:impl })).toThrow() ;
        t.expect2(() => $declareMethod(C as TSConstructor, { element:'x', implementation:null as any })).toThrow() ;
        t.expect3(() => $declareMethod(C as TSConstructor, { element:'x', implementation:'nope' as any })).toThrow() ;
        // a valid one still works after the failures
        t.expect4(() => $declareMethod(C as TSConstructor, { element:'ok', implementation:impl })).notToThrow() ;
    }) ;

    group.unary("$declareAccessor() installs getter and/or setter", async(t) => {
        class D { public _x = 0 ; }
        $declareAccessor(D as TSConstructor, {
            element:'x',
            getter:function(this:any) { return this._x ; },
            setter:function(this:any, v:any) { this._x = v * 10 ; },
        }) ;
        const d = new D() as any ;
        d.x = 4 ;
        t.expect0(d.x).is(40) ;
        t.expect1(d._x).is(40) ;

        class E {}
        $declareAccessor(E as TSConstructor, { element:'ro', getter:() => 'read-only' }) ;
        const e = new E() as any ;
        t.expect2(e.ro).is('read-only') ;
        const desc = Object.getOwnPropertyDescriptor(E.prototype, 'ro')! ;
        t.expect3(typeof desc.get).is('function') ;
        t.expect4(desc.set).undef() ;
        t.expect5(desc.enumerable).false() ;
    }) ;

    group.unary("$declareAccessor() rejects bad declarations", async(t) => {
        class F {}
        t.expect0(() => $declareAccessor(undefined as any, { element:'x', getter:() => 1 })).toThrow() ;
        t.expect1(() => $declareAccessor(F as TSConstructor, { element:'', getter:() => 1 })).toThrow() ;
        t.expect2(() => $declareAccessor(F as TSConstructor, { element:'x' })).toThrow() ;                 // neither getter nor setter
        t.expect3(() => $declareAccessor(F as TSConstructor, { element:'x', getter:'nope' as any })).toThrow() ;
        t.expect4(() => $declareAccessor(F as TSConstructor, { element:'x', setter:42 as any })).toThrow() ;
    }) ;
    group.unary("foundation-ts accessors on built-in classes can be declared again", async(t) => {
        // this is what happens when 2 copies of foundation-ts are loaded in the same application:
        // the second copy declares again the same accessors, which must not throw
        const tsDesc = Object.getOwnPropertyDescriptor(Date.prototype, 'timestamp')! ;
        const lenDesc = Object.getOwnPropertyDescriptor(Set.prototype, 'length')! ;
        t.expect0(tsDesc.configurable).true() ;
        t.expect1(lenDesc.configurable).true() ;
        t.expect2(tsDesc.enumerable).false() ;
        t.expect3(lenDesc.enumerable).false() ;
        try {
            t.expect4(() => $declareAccessor(Date, { element:'timestamp', configurable:true, getter:() => 'second copy' })).notToThrow() ;
            t.expect5(() => $declareAccessor(Set, { element:'length', configurable:true, getter:() => -1 })).notToThrow() ;
            t.expect6((new Date(0) as any).timestamp).is('second copy') ;  // the last declaration wins
            t.expect7(new Set([1, 2]).length).is(-1) ;
        }
        finally {
            // restore the original accessors for the other tests
            Object.defineProperty(Date.prototype, 'timestamp', tsDesc) ;
            Object.defineProperty(Set.prototype, 'length', lenDesc) ;
        }
        t.expect8(new Set([1, 2]).length).is(2) ;
        t.expect9(new Date(0).timestamp).is(tsDesc.get!.call(new Date(0))) ;
    }) ;
    group.unary("$declareMethod() honours the writable flag", async(t) => {
        class W {}
        $declareMethod(W as TSConstructor, { element:'fixed', implementation:() => 1 }) ;
        $declareMethod(W as TSConstructor, { element:'free', implementation:() => 2, writable:true }) ;
        t.expect0(Object.getOwnPropertyDescriptor(W.prototype, 'fixed')!.writable).false() ;    // default
        t.expect1(Object.getOwnPropertyDescriptor(W.prototype, 'free')!.writable).true() ;
    }) ;

    group.unary("$declareMethods() declares methods like native ones", async(t) => {
        class G {
            public v = 21 ;
            declare double:() => number ;
            declare add:(n:number) => number ;
        }
        $declareMethods(G, {
            double(this:G) { return this.v * 2 ; },
            add(this:G, n:number) { return this.v + n ; },
        }) ;
        const g = new G() ;
        t.expect0(g.double()).is(42) ;
        t.expect1(g.add(1)).is(22) ;
        t.expect2(g.double.name).is('double') ;                  // methods are named after their key
        // same descriptor as native methods: not enumerable, writable and configurable
        const desc = Object.getOwnPropertyDescriptor(G.prototype, 'double')! ;
        t.expect3(desc.enumerable).false() ;
        t.expect4(desc.writable).true() ;
        t.expect5(desc.configurable).true() ;
        const keys:string[] = [] ;
        for (const k in g) { keys.push(k) ; }
        t.expect6(keys).is(['v']) ;                              // invisible to for...in loops
        // declaring again (eg. a second copy of foundation-ts) does not throw and the last one wins
        t.expect7(() => $declareMethods(G, { double(this:G) { return this.v * 3 ; } })).notToThrow() ;
        t.expect8(g.double()).is(63) ;
        // a bad implementation is still rejected
        t.expect9(() => $declareMethods(G, { add:null as any })).toThrow() ;
    }) ;

    group.unary("methods declared by foundation-ts on built-in classes", async(t) => {
        const desc = Object.getOwnPropertyDescriptor(Array.prototype, 'sum')! ;
        t.expect0(desc.enumerable).false() ;
        t.expect1(desc.writable).true() ;
        t.expect2(desc.configurable).true() ;
        const keys:string[] = [] ;
        for (const k in [10, 20]) { keys.push(k) ; }
        t.expect3(keys).is(['0', '1']) ;                         // no added method in for...in loops
        t.expect4([1, 2, 3].sum()).is(6) ;
        t.expect5([].last.name).is('last') ;
        // aliases share the implementation of the aliased method
        t.expect6(Date.prototype.leafInspect === Date.prototype.toISOString).true() ;
    }) ;
}) ;
