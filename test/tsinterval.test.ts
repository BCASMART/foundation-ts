import { TSDate } from '../src/tsdate';
import { TSInterval } from '../src/tsinterval' 
import { Ascending, Descending, Same } from '../src/types';

import { TSTest } from '../src/tstester';

export const intervalGroups = [
    TSTest.group("Testing TSInterval creation & comparison", async (group) => {
        const D0   = new TSDate(1945,5,8) ;
        const D1  = new TSDate(1945,5,8, 23, 1, 0) ;
        const D1B = D1.clone() ;
        const D2  = new TSDate(1945,5,8, 23, 12, 10) ;
    //    const D3  = new TSDate(1945,5,8, 23, 50, 0) ;
    
    //    const diff = D2.timeSinceDate(D1) ;
    
        const A = new TSInterval(D1, D2) ;
        const B = new TSInterval(D1, null) ;
        const C = new TSInterval(null, D2) ;
        const D = new TSInterval(null, null) ;
        const Z = TSInterval.make(D1, D1) ;
        const AB = TSInterval.make(D1B, D2) ;
    
        group.unary(`test intervals equality`, async (t) => {
            t.expect0(A).is(A) ;
            t.expect1(A).isnot(B) ;
            t.expect2(A).isnot(C) ;
            t.expect3(A).isnot(D) ;
            t.expect4(A).isnot(Z) ;
            t.expect5(A).is(AB) ;
            t.expect6(AB).is(A) ;
            t.expect7(B).is(TSInterval.make(D1B, null)) ;
            t.expect8(C).is(TSInterval.make(null, D2.clone())) ;
            t.expect9(D).is(TSInterval.make(null, null)) ;
        }) ;
    
        group.unary(`test comparison`, async (t) => {
            t.expect0(TSInterval.make(D0,D1).compare(A)).is(Ascending) ;
            t.expect1(A.compare(TSInterval.make(D0,D1))).is(Descending) ;
            t.expect2(A.compare(AB)).is(Same) ;
            t.expect3(A.compare(B)).toBeUndefined() ;
        }) ;
    
        group.unary(`test significant ranges`, async (t) => {
            t.expectA(A.hasSignificantRange).true() ;
            t.expectB(B.hasSignificantRange).false() ;
            t.expectC(C.hasSignificantRange).false() ;
            t.expectD(D.hasSignificantRange).false() ;
            t.expectZ(Z.hasSignificantRange).false() ;
        }) ;
    
        group.unary(`test emptiness`, async (t) => {
            t.expectA(A.isEmpty).false() ;
            t.expectB(B.isEmpty).false() ;
            t.expectC(C.isEmpty).false() ;
            t.expectD(D.isEmpty).false() ;
            t.expectZ(Z.isEmpty).true() ;
        }) ;
    
        group.unary(`test validity`, async (t) => {
            t.expectA(A.isValid).true() ;
            t.expectB(B.isValid).true() ;
            t.expectC(C.isValid).false() ;
            t.expectD(D.isValid).false() ;
            t.expectZ(Z.isValid).true() ;
        }) ;
    }),
    TSTest.group("Testing TSInterval operations", async (group) => {
        const D0  = new TSDate(1945,5,8) ;
        const D1  = new TSDate(1945,5,8, 23, 1, 0) ;
        const D2  = new TSDate(1945,5,8, 23, 12, 10) ;
        const D3  = new TSDate(1945,5,8, 23, 50, 0) ;
    
        const A = TSInterval.make(D0, D1) ;
        const B = TSInterval.make(D1, D2) ;
        const C = TSInterval.make(D0, D3) ;
        const D = TSInterval.make(D2, TSDate.fromEpoch(0)) ;
        const X = TSInterval.make(null, D2) ;
        const Y = TSInterval.make(D2, null) ;
        const Z = TSInterval.make(null, null) ;
    
        group.unary('interval.intersects()', async (t) => {
            t.expect0(Z.intersects(X)).true() ;
            t.expect1(Z.intersects(Y)).true() ;
            t.expect2(Z.intersects(A)).true() ;
            t.expect3(C.intersects(A)).true() ;
            t.expect4(C.intersects(B)).true() ;
            t.expect5(A.intersects(B)).false() ;
            t.expect6(A.intersects(C)).true() ;
            t.expect7(C.intersects(D)).true() ;
            t.expect8(A.intersects(D)).false() ;
            t.expect9(B.intersects(D)).false() ;
            t.expectA(A.intersects(Y)).false() ;
            t.expectB(B.intersects(Y)).false() ;
            t.expectC(A.intersects(X)).true() ;
            t.expectD(A.intersects(Z)).true() ;
        }) ;
    
        group.unary('interval.contains()', async (t) => {
            t.expect0(Z.contains(X)).true() ;
            t.expect1(Z.contains(Y)).true() ;
            t.expect2(Z.contains(A)).true() ;
            t.expect3(Z.contains(B)).true() ;
            t.expect4(C.contains(A)).true() ;
            t.expect5(C.contains(B)).true() ;
            t.expect6(C.contains(D)).false() ;
            t.expect7(D.contains(C)).false() ;
            t.expect8(Y.contains(D)).true() ;
            t.expect9(Z.contains(D)).true() ;
        }) ;
    
        group.unary('interval.continuousWith()', async (t) => {
            t.expect0(B.continuousWith(D)).true() ;
            t.expect1(B.continuousWith(A)).true() ;
            t.expect2(B.continuousWith(Y)).true() ;
            t.expect3(X.continuousWith(Y)).true() ;
            t.expect4(X.continuousWith(Z)).true() ;
            t.expect5(A.continuousWith(B)).true() ;
            t.expect6(A.continuousWith(D)).false() ;
            t.expect7(A.continuousWith(Y)).false() ;
            t.expect8(D.continuousWith(A)).false() ;
            t.expect9(Y.continuousWith(A)).false() ;
        }) ;
    
    })
] ;