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
        t.expect(A).toBe(B) ;
        t.expect(A).toBe(C) ;
        t.expect(A).toBe(D) ;
        t.expect(A).toBe(E) ;
        t.expect(A).toBe(F) ;
        t.expect(G).toBe(H) ;
    }) ;

    group.unary("verifying TSRect.contains()", async(t) => {
        t.expect(B.contains({x:A.midX, y:A.midY})).toBeTruthy() ;
        t.expect(B.contains([A.midX, A.midY])).toBeTruthy() ;
        t.expect(B.contains([A.midX, NaN])).toBeFalsy() ;
        t.expect(B.contains([NaN, A.midY])).toBeFalsy() ;
        t.expect(B.contains([NaN, NaN])).toBeFalsy() ;
        t.expect(B.contains({x:0, y:A.midY})).toBeFalsy() ;
        t.expect(B.contains([0, A.midY])).toBeFalsy() ;
        t.expect(B.contains(A)).toBeTruthy() ;
        t.expect(A.contains(B)).toBeTruthy() ;
        t.expect(G.integralRect().contains(H)).toBeTruthy() ;
        t.expect(G.integralRect().contains([H.x, H.y])).toBeTruthy() ;
        t.expect(G.integralRect().contains([H.x, H.y, H.w, H.h])).toBeTruthy() ;
        t.expect(A.integralRect().contains(A)).toBeTruthy() ;
    }) ;

    group.unary("verifying TSRect.integralRect()", async(t) => {
        t.expect(A.integralRect()).toBe(new TSRect(10,20,4,8))
        t.expect(A.integralRect().integralRect()).toBe(new TSRect(10,20,4,8))
    }) ;

    group.unary("verifying TSRect.intersection()", async(t) => {
        t.expect(A.integralRect().intersection(A)).toBe(A) ;
        t.expect(A.intersection(A.integralRect())).toBe(A) ;
        t.expect(G.intersection(new TSRect(10,15,1000,2000))).toBe(new TSRect(10,15,G.width-10, G.height-15)) ;
        t.expect(G.intersection([10,15,1000,2000])).toBe(new TSRect(10,15,G.width-10, G.height-15)) ;
        t.expect(G.intersection(new TSRect(1000,1000,1000,2000))).toBe(new TSRect()) ;
        t.expect(G.intersection([1000,1000,1000,2000])).toBe(new TSRect()) ;
        t.expect(G.intersection([10,15,1000,NaN])).toBe(new TSRect()) ;
        t.expect(G.intersection([10,15,NaN,2000])).toBe(new TSRect()) ;
        t.expect(G.intersection([10, NaN, 1000, 2000])).toBe(new TSRect()) ;
        t.expect(G.intersection([NaN,15,1000,2000])).toBe(new TSRect()) ;
    }) ;

    group.unary("verifying TSRect.intersects()", async(t) => {
        t.expect(A.integralRect().intersects(A)).toBeTruthy() ;
        t.expect(A.intersects(A.integralRect())).toBeTruthy() ;
        t.expect(A.intersects(new TSRect(10,15,1000,2000))).toBeTruthy() ;
        t.expect(G.intersects(new TSRect(1000,1000,1000,2000))).toBeFalsy() ;
        t.expect(A.intersects([10,15,1000,2000])).toBeTruthy() ;
        t.expect(A.intersects([10,NaN,1000,2000])).toBeFalsy() ;
        t.expect(G.intersects([1000,1000,1000,2000])).toBeFalsy() ;
        t.expect(G.intersects([1000,1000,NaN,2000])).toBeFalsy() ;
    }) ;

    group.unary("verifying TSRect.union()", async(t) => {
        t.expect(A.integralRect().union(A)).toBe(A.integralRect()) ;
        t.expect(A.union(A.integralRect())).toBe(A.integralRect()) ;
        t.expect(G.union(new TSRect(10,15,1000,2000))).toBe(new TSRect(0,0,1010, 2015)) ;
        t.expect(G.union(new TSRect(1000,1000,1000,2000))).toBe(new TSRect(0,0,2000,3000)) ;
        t.expect(G.union([10,15,1000,2000])).toBe(new TSRect(0,0,1010, 2015)) ;
        t.expect(G.union([1000,1000,1000,2000])).toBe(new TSRect(0,0,2000,3000)) ;

        let equality = false ;
        try {
            // G.union should throw if the passed array parameter is not a valid TSRect
            equality = G.union([10,15,NaN,2000]).isEqual(new TSRect(0,0,1010, 2015)) ;
        }
        catch { equality = false ;}
        t.expect(equality).toBeFalsy() ;
    }) ;


}) ;