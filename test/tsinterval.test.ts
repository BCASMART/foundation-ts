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
            t.expect(A).toBe(A) ;
            t.expect(A).notToBe(B) ;
            t.expect(A).notToBe(C) ;
            t.expect(A).notToBe(D) ;
            t.expect(A).notToBe(Z) ;
            t.expect(A).toBe(AB) ;
            t.expect(AB).toBe(A) ;
            t.expect(B).toBe(TSInterval.make(D1B, null)) ;
            t.expect(C).toBe(TSInterval.make(null, D2.clone())) ;
            t.expect(D).toBe(TSInterval.make(null, null)) ;
        }) ;
    
        group.unary(`test comparison`, async (t) => {
            t.expect(TSInterval.make(D0,D1).compare(A)).toBe(Ascending) ;
            t.expect(A.compare(TSInterval.make(D0,D1))).toBe(Descending) ;
            t.expect(A.compare(AB)).toBe(Same) ;
            t.expect(A.compare(B)).toBeUndefined() ;
        }) ;
    
        group.unary(`test significant ranges`, async (t) => {
            t.expect(A.hasSignificantRange).toBeTruthy() ;
            t.expect(B.hasSignificantRange).toBeFalsy() ;
            t.expect(C.hasSignificantRange).toBeFalsy() ;
            t.expect(D.hasSignificantRange).toBeFalsy() ;
            t.expect(Z.hasSignificantRange).toBeFalsy() ;
        }) ;
    
        group.unary(`test emptiness`, async (t) => {
            t.expect(A.isEmpty).toBeFalsy() ;
            t.expect(B.isEmpty).toBeFalsy() ;
            t.expect(C.isEmpty).toBeFalsy() ;
            t.expect(D.isEmpty).toBeFalsy() ;
            t.expect(Z.isEmpty).toBeTruthy() ;
        }) ;
    
        group.unary(`test validity`, async (t) => {
            t.expect(A.isValid).toBeTruthy() ;
            t.expect(B.isValid).toBeTruthy() ;
            t.expect(C.isValid).toBeFalsy() ;
            t.expect(D.isValid).toBeFalsy() ;
            t.expect(Z.isValid).toBeTruthy() ;
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
            t.expect(Z.intersects(X)).toBeTruthy() ;
            t.expect(Z.intersects(Y)).toBeTruthy() ;
            t.expect(Z.intersects(A)).toBeTruthy() ;
            t.expect(C.intersects(A)).toBeTruthy() ;
            t.expect(C.intersects(B)).toBeTruthy() ;
            t.expect(A.intersects(B)).toBeFalsy() ;
            t.expect(A.intersects(C)).toBeTruthy() ;
            t.expect(C.intersects(D)).toBeTruthy() ;
            t.expect(A.intersects(D)).toBeFalsy() ;
            t.expect(B.intersects(D)).toBeFalsy() ;
            t.expect(A.intersects(Y)).toBeFalsy() ;
            t.expect(B.intersects(Y)).toBeFalsy() ;
            t.expect(A.intersects(X)).toBeTruthy() ;
            t.expect(A.intersects(Z)).toBeTruthy() ;
        }) ;
    
        group.unary('interval.contains()', async (t) => {
            t.expect(Z.contains(X)).toBeTruthy() ;
            t.expect(Z.contains(Y)).toBeTruthy() ;
            t.expect(Z.contains(A)).toBeTruthy() ;
            t.expect(Z.contains(B)).toBeTruthy() ;
            t.expect(C.contains(A)).toBeTruthy() ;
            t.expect(C.contains(B)).toBeTruthy() ;
            t.expect(C.contains(D)).toBeFalsy() ;
            t.expect(D.contains(C)).toBeFalsy() ;
            t.expect(Y.contains(D)).toBeTruthy() ;
            t.expect(Z.contains(D)).toBeTruthy() ;
        }) ;
    
        group.unary('interval.continuousWith()', async (t) => {
            t.expect(B.continuousWith(D)).toBeTruthy() ;
            t.expect(B.continuousWith(A)).toBeTruthy() ;
            t.expect(B.continuousWith(Y)).toBeTruthy() ;
            t.expect(X.continuousWith(Y)).toBeTruthy() ;
            t.expect(X.continuousWith(Z)).toBeTruthy() ;
            t.expect(A.continuousWith(B)).toBeTruthy() ;
            t.expect(A.continuousWith(D)).toBeFalsy() ;
            t.expect(A.continuousWith(Y)).toBeFalsy() ;
            t.expect(D.continuousWith(A)).toBeFalsy() ;
            t.expect(Y.continuousWith(A)).toBeFalsy() ;
        }) ;
    
        group.unary('interval.className', async (t) => { 
            t.expect(TSInterval.make(null,null).className).toBe("TSInterval") ; 
        }) ;    
    })
] ;