import { $declareAccessor, $declareMethod, TSConstructor } from "../src/object";
import { TSTest } from "../src/tstester";

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
}) ;
