import { $keys } from '../src/commons';
import { TSAssertFormat, TSDocumentFormats, TSmm2Pixels, TSRect } from '../src/tsgeometry';
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

        let equality = false ;
        try {
            // G.union should throw if the passed array parameter is not a valid TSRect
            equality = G.union([10,15,NaN,2000]).isEqual(new TSRect(0,0,1010, 2015)) ;
        }
        catch { equality = false ;}
        t.expectA(equality).false() ;
    }) ;

    group.unary("TSRect creation with formats", async(t) => {
        const formatKeys = $keys(TSDocumentFormats) ;
        for (let f of formatKeys) {
            const newRect = new TSRect(f) ;
            t.expect(newRect.size,f as string).is(TSDocumentFormats[f]) ;
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
        t.expectJ(TSAssertFormat({w:100,h:Infinity})).is(mini) ;
        t.expectK(TSAssertFormat({w:Infinity,h:100})).is(mini) ;
    }) ;

}) ;