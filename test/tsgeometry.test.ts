import { TSmm2Pixels, TSRect } from '../src/tsgeometry';
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

    group.unary("verifying TSRect creation", async(t) => {
        t.expect0(A).toBe(B) ;
        t.expect1(A).toBe(C) ;
        t.expect2(A).toBe(D) ;
        t.expect3(A).toBe(E) ;
        t.expect4(A).toBe(F) ;
        t.expect5(G).toBe(H) ;
    }) ;

    group.unary("verifying TSRect.contains()", async(t) => {
        t.expect0(B.contains({x:A.midX, y:A.midY})).toBeTruthy() ;
        t.expect1(B.contains([A.midX, A.midY])).toBeTruthy() ;
        t.expect2(B.contains([A.midX, NaN])).toBeFalsy() ;
        t.expect3(B.contains([NaN, A.midY])).toBeFalsy() ;
        t.expect4(B.contains([NaN, NaN])).toBeFalsy() ;
        t.expect5(B.contains({x:0, y:A.midY})).toBeFalsy() ;
        t.expect6(B.contains([0, A.midY])).toBeFalsy() ;
        t.expect7(B.contains(A)).toBeTruthy() ;
        t.expect8(A.contains(B)).toBeTruthy() ;
        t.expect9(G.integralRect().contains(H)).toBeTruthy() ;
        t.expectA(G.integralRect().contains([H.x, H.y])).toBeTruthy() ;
        t.expectB(G.integralRect().contains([H.x, H.y, H.w, H.h])).toBeTruthy() ;
        t.expectC(A.integralRect().contains(A)).toBeTruthy() ;
    }) ;

    group.unary("verifying TSRect.integralRect()", async(t) => {
        t.expect0(A.integralRect()).toBe(new TSRect(10,20,4,8))
        t.expect1(A.integralRect().integralRect()).toBe(new TSRect(10,20,4,8))
    }) ;

    group.unary("verifying TSRect.intersection()", async(t) => {
        t.expect0(A.integralRect().intersection(A)).toBe(A) ;
        t.expect1(A.intersection(A.integralRect())).toBe(A) ;
        t.expect2(G.intersection(new TSRect(10,15,1000,2000))).toBe(new TSRect(10,15,G.width-10, G.height-15)) ;
        t.expect3(G.intersection([10,15,1000,2000])).toBe(new TSRect(10,15,G.width-10, G.height-15)) ;
        t.expect4(G.intersection(new TSRect(1000,1000,1000,2000))).toBe(new TSRect()) ;
        t.expect5(G.intersection([1000,1000,1000,2000])).toBe(new TSRect()) ;
        t.expect6(G.intersection([10,15,1000,NaN])).toBe(new TSRect()) ;
        t.expect7(G.intersection([10,15,NaN,2000])).toBe(new TSRect()) ;
        t.expect8(G.intersection([10, NaN, 1000, 2000])).toBe(new TSRect()) ;
        t.expect9(G.intersection([NaN,15,1000,2000])).toBe(new TSRect()) ;
    }) ;

    group.unary("verifying TSRect.intersects()", async(t) => {
        t.expect0(A.integralRect().intersects(A)).toBeTruthy() ;
        t.expect1(A.intersects(A.integralRect())).toBeTruthy() ;
        t.expect2(A.intersects(new TSRect(10,15,1000,2000))).toBeTruthy() ;
        t.expect3(G.intersects(new TSRect(1000,1000,1000,2000))).toBeFalsy() ;
        t.expect4(A.intersects([10,15,1000,2000])).toBeTruthy() ;
        t.expect5(A.intersects([10,NaN,1000,2000])).toBeFalsy() ;
        t.expect6(G.intersects([1000,1000,1000,2000])).toBeFalsy() ;
        t.expect7(G.intersects([1000,1000,NaN,2000])).toBeFalsy() ;
    }) ;

    group.unary("verifying TSRect.union()", async(t) => {
        t.expect0(A.integralRect().union(A)).toBe(A.integralRect()) ;
        t.expect1(A.union(A.integralRect())).toBe(A.integralRect()) ;
        t.expect2(G.union(new TSRect(10,15,1000,2000))).toBe(new TSRect(0,0,1010, 2015)) ;
        t.expect3(G.union(new TSRect(1000,1000,1000,2000))).toBe(new TSRect(0,0,2000,3000)) ;
        t.expect4(G.union([10,15,1000,2000])).toBe(new TSRect(0,0,1010, 2015)) ;
        t.expect5(G.union([1000,1000,1000,2000])).toBe(new TSRect(0,0,2000,3000)) ;

        let equality = false ;
        try {
            // G.union should throw if the passed array parameter is not a valid TSRect
            equality = G.union([10,15,NaN,2000]).isEqual(new TSRect(0,0,1010, 2015)) ;
        }
        catch { equality = false ;}
        t.expectA(equality).toBeFalsy() ;
    }) ;


}) ;