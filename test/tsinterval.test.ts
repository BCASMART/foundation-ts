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
            t.expect0(A).toBe(A) ;
            t.expect1(A).notToBe(B) ;
            t.expect2(A).notToBe(C) ;
            t.expect3(A).notToBe(D) ;
            t.expect4(A).notToBe(Z) ;
            t.expect5(A).toBe(AB) ;
            t.expect6(AB).toBe(A) ;
            t.expect7(B).toBe(TSInterval.make(D1B, null)) ;
            t.expect8(C).toBe(TSInterval.make(null, D2.clone())) ;
            t.expect9(D).toBe(TSInterval.make(null, null)) ;
        }) ;
    
        group.unary(`test comparison`, async (t) => {
            t.expect0(TSInterval.make(D0,D1).compare(A)).toBe(Ascending) ;
            t.expect1(A.compare(TSInterval.make(D0,D1))).toBe(Descending) ;
            t.expect2(A.compare(AB)).toBe(Same) ;
            t.expect3(A.compare(B)).toBeUndefined() ;
        }) ;
    
        group.unary(`test significant ranges`, async (t) => {
            t.expectA(A.hasSignificantRange).toBeTruthy() ;
            t.expectB(B.hasSignificantRange).toBeFalsy() ;
            t.expectC(C.hasSignificantRange).toBeFalsy() ;
            t.expectD(D.hasSignificantRange).toBeFalsy() ;
            t.expectZ(Z.hasSignificantRange).toBeFalsy() ;
        }) ;
    
        group.unary(`test emptiness`, async (t) => {
            t.expectA(A.isEmpty).toBeFalsy() ;
            t.expectB(B.isEmpty).toBeFalsy() ;
            t.expectC(C.isEmpty).toBeFalsy() ;
            t.expectD(D.isEmpty).toBeFalsy() ;
            t.expectZ(Z.isEmpty).toBeTruthy() ;
        }) ;
    
        group.unary(`test validity`, async (t) => {
            t.expectA(A.isValid).toBeTruthy() ;
            t.expectB(B.isValid).toBeTruthy() ;
            t.expectC(C.isValid).toBeFalsy() ;
            t.expectD(D.isValid).toBeFalsy() ;
            t.expectZ(Z.isValid).toBeTruthy() ;
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
            t.expect0(Z.intersects(X)).toBeTruthy() ;
            t.expect1(Z.intersects(Y)).toBeTruthy() ;
            t.expect2(Z.intersects(A)).toBeTruthy() ;
            t.expect3(C.intersects(A)).toBeTruthy() ;
            t.expect4(C.intersects(B)).toBeTruthy() ;
            t.expect5(A.intersects(B)).toBeFalsy() ;
            t.expect6(A.intersects(C)).toBeTruthy() ;
            t.expect7(C.intersects(D)).toBeTruthy() ;
            t.expect8(A.intersects(D)).toBeFalsy() ;
            t.expect9(B.intersects(D)).toBeFalsy() ;
            t.expectA(A.intersects(Y)).toBeFalsy() ;
            t.expectB(B.intersects(Y)).toBeFalsy() ;
            t.expectC(A.intersects(X)).toBeTruthy() ;
            t.expectD(A.intersects(Z)).toBeTruthy() ;
        }) ;
    
        group.unary('interval.contains()', async (t) => {
            t.expect0(Z.contains(X)).toBeTruthy() ;
            t.expect1(Z.contains(Y)).toBeTruthy() ;
            t.expect2(Z.contains(A)).toBeTruthy() ;
            t.expect3(Z.contains(B)).toBeTruthy() ;
            t.expect4(C.contains(A)).toBeTruthy() ;
            t.expect5(C.contains(B)).toBeTruthy() ;
            t.expect6(C.contains(D)).toBeFalsy() ;
            t.expect7(D.contains(C)).toBeFalsy() ;
            t.expect8(Y.contains(D)).toBeTruthy() ;
            t.expect9(Z.contains(D)).toBeTruthy() ;
        }) ;
    
        group.unary('interval.continuousWith()', async (t) => {
            t.expect0(B.continuousWith(D)).toBeTruthy() ;
            t.expect1(B.continuousWith(A)).toBeTruthy() ;
            t.expect2(B.continuousWith(Y)).toBeTruthy() ;
            t.expect3(X.continuousWith(Y)).toBeTruthy() ;
            t.expect4(X.continuousWith(Z)).toBeTruthy() ;
            t.expect5(A.continuousWith(B)).toBeTruthy() ;
            t.expect6(A.continuousWith(D)).toBeFalsy() ;
            t.expect7(A.continuousWith(Y)).toBeFalsy() ;
            t.expect8(D.continuousWith(A)).toBeFalsy() ;
            t.expect9(Y.continuousWith(A)).toBeFalsy() ;
        }) ;
    
    })
] ;