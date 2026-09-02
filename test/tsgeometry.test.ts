import { $keys } from '../src/commons';
import { Ascending, Descending, Same } from '../src/types';
import { TSAssertFormat, TSDocumentFormats, TSmm2Pixels, TSRect, TSRectEdge } from '../src/tsgeometry';
import { TSTest } from '../src/tstester';

export const geometryGroups = TSTest.group("Geometry functions and classes", async (group) => {
    const A = new TSRect(10.5, 20.5, 3.5, 7.2) ;
    const B = new TSRect([10.5, 20.5, 3.5, 7.2]) ;
    const C = new TSRect(A) ;
    const D = new TSRect(A.origin, 3.5, 7.2) ;
    const E = new TSRect(10.5, 20.5, A.size) ;
    const F = new TSRect(A.origin, A.size) ;
    const G = new TSRect(0, 0, TSmm2Pixels(210), TSmm2Pixels(297)) ;
    const H = new TSRect('a4') ;
    const FA = new TSRect({x:10.5, y:20.5, w:3.5, h:7.2})
    const FB = new TSRect(B.frame)

    group.unary("TSRect creation", async(t) => {
        t.expect0(A).is(B) ;
        t.expect1(A).is(C) ;
        t.expect2(A).is(D) ;
        t.expect3(A).is(E) ;
        t.expect4(A).is(F) ;
        t.expect5(G).is(H) ;
        t.expect6(FA).is(A) ;
        t.expect7(FB).is(B) ;
    }) ;

    group.unary("TSRect.closedPolygon()", async(t) => {
        let p = A.closedPolygon() ;
        t.expect0(p[0]).is({x:10.5, y:20.5}) ;
        t.expect1(p[1]).is({x:14, y:20.5}) ;
        t.expect2(p[2]).is({x:14, y:27.7}) ;
        t.expect3(p[3]).is({x:10.5, y:27.7}) ;
        t.expect4(p[4]).is({x:10.5, y:20.5}) ;

        p = A.closedPolygon(true) ;
        t.expectA(p[0]).is({x:10.5, y:20.5}) ;
        t.expectB(p[1]).is({x:10.5, y:27.7}) ;
        t.expectC(p[2]).is({x:14, y:27.7}) ;
        t.expectD(p[3]).is({x:14, y:20.5}) ;
        t.expectE(p[4]).is({x:10.5, y:20.5}) ;
    }) ;

    group.unary("TSRect.contains()", async(t) => {
        t.expect0(B.contains({x:A.midX, y:A.midY})).true() ;
        t.expect1(B.contains([A.midX, A.midY])).true() ;
        t.expect2(B.contains([A.midX, NaN])).false() ;
        t.expect3(B.contains([NaN, A.midY])).false() ;
        t.expect4(B.contains([NaN, NaN])).false() ;
        t.expect5(B.contains({x:0, y:A.midY})).false() ;
        t.expect6(B.contains([0, A.midY])).false() ;
        t.expect7(B.contains(A)).true() ;
        t.expect8(A.contains(B)).true() ;
        t.expect9(G.integralRect().contains(H)).true() ;
        t.expectA(G.integralRect().contains([H.x, H.y])).true() ;
        t.expectB(G.integralRect().contains([H.x, H.y, H.w, H.h])).true() ;
        t.expectC(A.integralRect().contains(A)).true() ;
    }) ;

    group.unary("TSRect.integralRect()", async(t) => {
        t.expect0(A.integralRect()).is(new TSRect(10,20,4,8))
        t.expect1(A.integralRect().integralRect()).is(new TSRect(10,20,4,8))
    }) ;

    group.unary("TSRect.intersection()", async(t) => {
        t.expect0(A.integralRect().intersection(A)).is(A) ;
        t.expect1(A.intersection(A.integralRect())).is(A) ;
        t.expect2(G.intersection(new TSRect(10,15,1000,2000))).is(new TSRect(10,15,G.width-10, G.height-15)) ;
        t.expect3(G.intersection([10,15,1000,2000])).is(new TSRect(10,15,G.width-10, G.height-15)) ;
        t.expect4(G.intersection(new TSRect(1000,1000,1000,2000))).is(new TSRect()) ;
        t.expect5(G.intersection([1000,1000,1000,2000])).is(new TSRect()) ;
        t.expect6(G.intersection([10,15,1000,NaN])).is(new TSRect()) ;
        t.expect7(G.intersection([10,15,NaN,2000])).is(new TSRect()) ;
        t.expect8(G.intersection([10, NaN, 1000, 2000])).is(new TSRect()) ;
        t.expect9(G.intersection([NaN,15,1000,2000])).is(new TSRect()) ;
    }) ;

    group.unary("TSRect.intersects()", async(t) => {
        t.expect0(A.integralRect().intersects(A)).true() ;
        t.expect1(A.intersects(A.integralRect())).true() ;
        t.expect2(A.intersects(new TSRect(10,15,1000,2000))).true() ;
        t.expect3(G.intersects(new TSRect(1000,1000,1000,2000))).false() ;
        t.expect4(A.intersects([10,15,1000,2000])).true() ;
        t.expect5(A.intersects([10,NaN,1000,2000])).false() ;
        t.expect6(G.intersects([1000,1000,1000,2000])).false() ;
        t.expect7(G.intersects([1000,1000,NaN,2000])).false() ;
    }) ;

    group.unary("TSRect.union()", async(t) => {
        t.expect0(A.integralRect().union(A)).is(A.integralRect()) ;
        t.expect1(A.union(A.integralRect())).is(A.integralRect()) ;
        t.expect2(G.union(new TSRect(10,15,1000,2000))).is(new TSRect(0,0,1010, 2015)) ;
        t.expect3(G.union(new TSRect(1000,1000,1000,2000))).is(new TSRect(0,0,2000,3000)) ;
        t.expect4(G.union([10,15,1000,2000])).is(new TSRect(0,0,1010, 2015)) ;
        t.expect5(G.union([1000,1000,1000,2000])).is(new TSRect(0,0,2000,3000)) ;

        // union() throws when the passed array parameter is not a valid TSRect
        t.expectA(() => G.union([10,15,NaN,2000])).toThrow() ;
    }) ;

    group.unary("TSRect getters, clone(), toArray() && toJSON()", async(t) => {
        const R = new TSRect(10, 20, 100, 40) ;
        t.expect0(R.minX).is(10) ;
        t.expect1(R.minY).is(20) ;
        t.expect2(R.maxX).is(110) ;
        t.expect3(R.maxY).is(60) ;
        t.expect4(R.midX).is(60) ;
        t.expect5(R.midY).is(40) ;
        t.expect6(R.width).is(100) ;
        t.expect7(R.height).is(40) ;
        t.expect8(R.origin).is({ x:10, y:20 }) ;
        t.expect9(R.size).is({ w:100, h:40 }) ;
        t.expectA(R.frame).is({ x:10, y:20, w:100, h:40 }) ;
        t.expectB(R.isEmpty).false() ;
        t.expectC(new TSRect(10, 20, 0, 40).isEmpty).true() ;
        t.expectD(new TSRect(10, 20, 100, 0).isEmpty).true() ;
        t.expectE(new TSRect().isEmpty).true() ;
        // toArray() sends [minX, minY, maxX, maxY] -- NOT [x, y, w, h]
        t.expectF(R.toArray()).is([10, 20, 110, 60]) ;
        t.expectG(R.toJSON()).is({ x:10, y:20, w:100, h:40 }) ;
        const c = R.clone() ;
        t.expectH(c).is(R) ;
        t.expectI(c === R).false() ;
        c.x = 999 ;
        t.expectJ(R.minX).is(10) ;   // clone is independent
    }) ;

    group.unary("TSRect.offset() && inset()", async(t) => {
        const R = new TSRect(10, 20, 100, 40) ;
        t.expect0(R.offset(5, -3)).is(new TSRect(15, 17, 100, 40)) ;
        t.expect1(R.offset(0, 0)).is(R) ;
        t.expect2(R.offsetRect(-10, -20)).is(new TSRect(0, 0, 100, 40)) ;
        // inset() with a positive amount actually grows the rect (negative amount shrinks it)
        t.expect3(R.inset(10, 5)).is(new TSRect(0, 15, 120, 50)) ;
        t.expect4(R.inset(-10, -5)).is(new TSRect(20, 25, 80, 30)) ;
        t.expect5(R.insetRect(0, 0)).is(R) ;

        t.expect6(() => R.offset(NaN, 0)).toThrow() ;
        t.expect7(() => R.inset(-60, 0)).toThrow() ;   // would make width negative
    }) ;

    group.unary("TSRect.divide()", async(t) => {
        const R = new TSRect(10, 20, 100, 40) ;   // maxX 110, maxY 60

        let [slice, rem] = R.divide(30, TSRectEdge.TSMinXEdge) ;
        t.expect0(slice).is(new TSRect(10, 20, 30, 40)) ;
        t.expect1(rem).is(new TSRect(40, 20, 70, 40)) ;

        [slice, rem] = R.divide(200, TSRectEdge.TSMinXEdge) ;   // amount > width
        t.expect2(slice).is(new TSRect(10, 20, 100, 40)) ;
        t.expect3(rem).is(new TSRect(110, 20, 0, 40)) ;

        [slice, rem] = R.divide(10, TSRectEdge.TSMinYEdge) ;
        t.expect4(slice).is(new TSRect(10, 20, 100, 10)) ;
        t.expect5(rem).is(new TSRect(10, 30, 100, 30)) ;

        [slice, rem] = R.divide(30, TSRectEdge.TSMaxXEdge) ;
        t.expect6(slice).is(new TSRect(80, 20, 30, 40)) ;
        t.expect7(rem).is(new TSRect(10, 20, 70, 40)) ;

        [slice, rem] = R.divide(10, TSRectEdge.TSMaxYEdge) ;
        t.expect8(slice).is(new TSRect(10, 50, 100, 10)) ;
        t.expect9(rem).is(new TSRect(10, 20, 100, 30)) ;

        [slice, rem] = R.divide(Number.POSITIVE_INFINITY, TSRectEdge.TSMinXEdge) ;   // amount clamped to max(w,h)
        t.expectA(slice).is(new TSRect(10, 20, 100, 40)) ;
        t.expectB(rem).is(new TSRect(110, 20, 0, 40)) ;

        [slice, rem] = R.divide(-5, TSRectEdge.TSMinXEdge) ;   // negative amount clamped to 0
        t.expectC(slice).is(new TSRect(10, 20, 0, 40)) ;
        t.expectD(rem).is(new TSRect(10, 20, 100, 40)) ;

        t.expectE(() => R.divide(10, 99 as TSRectEdge)).toThrow() ;   // invalid edge
    }) ;

    group.unary("TSRect.containsPoint(), containsRect() && containedIn()", async(t) => {
        const R = new TSRect(10, 20, 100, 40) ;
        t.expect0(R.containsPoint({ x:60, y:40 })).true() ;
        t.expect1(R.containsPoint([60, 40])).true() ;
        t.expect2(R.containsPoint([10, 20])).true() ;          // border is inside
        t.expect3(R.containsPoint([9, 40])).false() ;
        t.expect4(R.containsPoint([60, 40, 1, 1])).false() ;   // a 4-element array is not a point

        t.expect5(R.containsRect(new TSRect(20, 30, 10, 10))).true() ;
        t.expect6(R.containsRect([20, 30, 10, 10])).true() ;
        t.expect7(R.containsRect([200, 200, 10, 10])).false() ;
        t.expect8(R.containsRect([60, 40])).false() ;          // a 2-element array is not a rect

        t.expect9(R.containedIn(new TSRect(0, 0, 200, 200))).true() ;
        t.expectA(R.containedIn([0, 0, 200, 200])).true() ;
        t.expectB(R.containedIn(R)).true() ;
        t.expectC(R.containedIn(new TSRect(0, 0, 50, 50))).false() ;
        t.expectD(R.containedIn(null)).false() ;
        t.expectE(R.containedIn([0, 0, NaN, 200])).false() ;   // invalid array -> false, no throw
    }) ;

    group.unary("TSRect.compare()", async(t) => {
        const R = new TSRect(10, 20, 100, 40) ;
        const A = new TSRect(0, 0, 10, 10) ;     // area 100
        const B = new TSRect(5, 5, 10, 10) ;     // area 100, origin > A on both axis
        const C = new TSRect(0, 0, 5, 5) ;       // area 25
        const D = new TSRect(0, 7, 10, 10) ;     // area 100, same minX as A
        const A2 = new TSRect(0, 5, 10, 10) ;    // area 100
        const E = new TSRect(5, 0, 10, 10) ;     // area 100, origin not comparable to A2

        t.expect0(R.compare(R)).is(Same) ;
        t.expect1(R.compare(R.clone())).is(Same) ;
        t.expect2(A.compare(B)).is(Ascending) ;
        t.expect3(B.compare(A)).is(Descending) ;
        t.expect4(C.compare(A)).is(Ascending) ;      // smaller area
        t.expect5(A.compare(C)).is(Descending) ;
        t.expect6(A.compare(D)).is(Ascending) ;      // same area, same minX, A above D
        t.expect7(A2.compare(E)).undef() ;     // same area, origins not comparable
        t.expect8(R.compare('not a rect' as any)).undef() ;
        t.expect9(R.compare(null as any)).undef() ;
    }) ;

    group.unary("TSRect creation with formats", async(t) => {
        const formatKeys = $keys(TSDocumentFormats) ;
        for (let f of formatKeys) {
            const newRect = new TSRect(f) ;
            t.expect(newRect.size,f).is(TSDocumentFormats[f]) ;
        }
    }) ;

    group.unary("TSAssertFormat() function", async(t) => {
        const mini = TSDocumentFormats['min'] ;
        const maxi = TSDocumentFormats['max'] ;
        const dflt = TSDocumentFormats['a4'] ;
        t.expect0(TSAssertFormat({w:2,h:105})).is(mini) ;
        t.expect1(TSAssertFormat({w:105,h:2})).is(mini) ;
        t.expect2(TSAssertFormat({w:2,h:2})).is(mini) ;
        t.expect3(TSAssertFormat({w:2,h:200000})).is(mini) ;
        t.expect4(TSAssertFormat({w:200000,h:2})).is(mini) ;
        t.expect5(TSAssertFormat({w:200000,h:200000})).is(maxi) ;
        t.expect6(TSAssertFormat({w:0,h:0})).is(mini) ;
        t.expect7(TSAssertFormat({w:1000,h:-1})).is(dflt) ;
        t.expect8(TSAssertFormat({w:-1,h:1000})).is(dflt) ;
        t.expect9(TSAssertFormat({w:200000,h:-1})).is(dflt) ;
        t.expectA(TSAssertFormat({w:-1,h:200000})).is(dflt) ;
        t.expectB(TSAssertFormat({w:20000,h:200000})).is(maxi) ;
        t.expectC(TSAssertFormat({w:200000,h:20000})).is(maxi) ;
        t.expectD(TSAssertFormat({w:-100,h:-100})).is(dflt) ;
        t.expectE(TSAssertFormat({w:20000,h:NaN})).is(dflt) ;
        t.expectF(TSAssertFormat({w:NaN,h:20000})).is(dflt) ;
        t.expectG(TSAssertFormat({w:NaN,h:NaN})).is(dflt) ;
        t.expectH(TSAssertFormat({w:20000,h:Infinity})).is(maxi) ;
        t.expectI(TSAssertFormat({w:Infinity,h:20000})).is(maxi) ;
        t.expectJ(TSAssertFormat({w:10,h:Infinity})).is(mini) ;
        t.expectK(TSAssertFormat({w:Infinity,h:10})).is(mini) ;
    }) ;

}) ;