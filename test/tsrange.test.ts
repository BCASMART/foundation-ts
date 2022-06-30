import { TSDate } from '../src/tsdate';
import { TSRange } from '../src/tsrange' 
import { TSInterval } from '../src/tsinterval' 
import { Ascending, Descending, Same } from '../src/types';
import { TSTest } from '../src/tstester';

export const rangeGroups = [
    TSTest.group("Testing TSRange creation & comparison", async (group) => {
        const A = new TSRange(NaN, 8) ;
        const B = new TSRange(12, NaN) ;
        const C = new TSRange(NaN, NaN) ;
        const X = TSRange.make(4, 8) ;
        const Y = new TSRange([4.0, 8.0]) ;
        const D1 = new TSDate(1945,5,8, 23, 1, 0) ;
        const D2 = new TSDate(1945,5,8, 23, 12, 10) ;
        const diff = D2.timeSinceDate(D1) ;
        const DR = new TSRange(D1, D2) ;
        const DRR = new TSRange(DR) ;
        const DRI = new TSRange(new TSInterval(D1, D2)) ;
        const DRT = DRR.clone() ;
        const DRJ = DRI.clone() ;
        DRT.length = 3600 ;
        DRJ.location = 0 ;
        
        group.unary(`test significant ranges`, async (t) => {
            t.expectA(A.hasSignificantRange).toBeFalsy() ;
            t.expectB(B.hasSignificantRange).toBeFalsy() ;
            t.expectC(C.hasSignificantRange).toBeFalsy() ;
            t.expectX(X.hasSignificantRange).toBeTruthy() ;
            t.expectY(Y.hasSignificantRange).toBeTruthy() ;
        }) ;
    
        group.unary(`expect that bad ranges are all equals`, async (t) => {        
            t.expect0(X).toBe(Y) ;
            t.expect1(Y).toBe(X) ;
            t.expect2(A).toBe(B) ;
            t.expect3(A).toBe(C) ;
            t.expect4(B).toBe(A) ;
            t.expect5(B).toBe(C) ;
            t.expect6(C).toBe(A) ;
            t.expect7(C).toBe(B) ;
        });
    
        group.unary(`Date range of ${diff} seconds`, async (t) => {
            t.expect(DR.length).toBe(diff) ;
        }) ;
    
        group.unary(`All same ranges must be equals`, async (t) => {
            t.expect0(DR).toBe(DRR) ;
            t.expect1(DR).toBe(DRI) ;
            t.expect2(DRR).toBe(DR) ;
            t.expect3(DRR).toBe(DRI) ;
            t.expect4(DRI).toBe(DR) ;
            t.expect5(DRI).toBe(DRR) ;
        }) ;
    
        group.unary(`No more equality after changing location or length`, async (t) => {
            t.expect0(DR).notToBe(DRT) ;
            t.expect1(DRT).notToBe(DR) ;
            t.expect2(DR).notToBe(DRJ) ;
            t.expect3(DRJ).notToBe(DR) ;
        }) ;
    
        group.unary(`Comparisons`, async (t) => {
            t.expect0(DR.compare(DRR)).toBe(Same) ;
            t.expect1(DR.compare(DRJ)).toBe(Ascending) ;
            t.expect2(DRJ.compare(DR)).toBe(Descending) ;
            t.expect3(DR.compare(DRT)).toBeUndefined() ;
        }) ;    
    }),
    TSTest.group("Testing TSRange operations", async (group) => {
        group.unary(`range.isValid`, async (t) => {
            t.expect0(TSRange.make(NaN,0).isValid).toBeFalsy() ;
            t.expect1(TSRange.make(0,NaN).isValid).toBeFalsy() ;
            t.expect2(TSRange.make(NaN,NaN).isValid).toBeFalsy() ;
            t.expect3(TSRange.make(3,0).isValid).toBeTruthy() ;
            t.expect4(TSRange.make(3,1).isValid).toBeTruthy() ;
        }) ;
    
        group.unary(`range.isEmpty`, async (t) => {
            t.expect0(TSRange.make(NaN,0).isEmpty).toBeTruthy() ;
            t.expect1(TSRange.make(0,NaN).isEmpty).toBeTruthy() ;
            t.expect2(TSRange.make(NaN,NaN).isEmpty).toBeTruthy() ;
            t.expect3(TSRange.make(3,0).isEmpty).toBeTruthy() ;
            t.expect4(TSRange.make(3,1).isEmpty).toBeFalsy() ;
        }) ;
    
    
        group.unary(`range.containsLocation()`, async (t) => {
            t.expect0(TSRange.make(1,2).containsLocation(0)).toBeFalsy() ;
            t.expect1(TSRange.make(1,2).containsLocation(4)).toBeFalsy() ;
            t.expect2(TSRange.make(1,2).containsLocation(3)).toBeFalsy() ;
            t.expect3(TSRange.make(1,2).containsLocation(1)).toBeTruthy() ;
            t.expect4(TSRange.make(1,2).containsLocation(2)).toBeTruthy() ;
        }) ;
    
        group.unary(`range.contains() and range.containedIn()`, async (t) => {
            t.expect0(TSRange.make(1,2).contains(TSRange.make(2,8))).toBeFalsy() ;
            t.expect1(TSRange.make(1,2).contains(TSRange.make(0,8))).toBeFalsy() ;
            t.expect2(TSRange.make(1,2).containedIn(TSRange.make(0,8))).toBeTruthy() ;
            t.expect3(TSRange.make(-1,11).contains(TSRange.make(1,5))).toBeTruthy() ;
            t.expect4(TSRange.make(-1,11).contains(TSRange.make(-3,5))).toBeFalsy() ;
        }) ;
    
        group.unary(`range.intersects()`, async (t) => {
            t.expect0(TSRange.make(1,2).intersects(TSRange.make(3,8))).toBeFalsy() ;
            t.expect1(TSRange.make(1,2).intersects(TSRange.make(2,8))).toBeTruthy() ;
        }) ;
    
        group.unary(`range.intersectionRange()`, async (t) => {
            t.expect0(TSRange.make(1,2).intersectionRange(TSRange.make(3,8)).isEmpty).toBeTruthy() ;
            t.expect1(TSRange.make(1,2).intersectionRange(TSRange.make(2,8))).toBe(TSRange.make(2,1)) ;
        }) ;
    
        group.unary(`range.unionRange()`, async (t) => {
            t.expect0(TSRange.make(1,2).unionRange(TSRange.make(3,8))).toBe(TSRange.make(1,10)) ;
            t.expect1(TSRange.make(1,2).unionRange(TSRange.make(2,8))).toBe(TSRange.make(1,9)) ;
        }) ;
    
        group.unary(`range.continuousWith()`, async (t) => {
            t.expect0(TSRange.make(1,2).continuousWith(TSRange.make(3,8))).toBeTruthy() ;
            t.expect1(TSRange.make(1,2).continuousWith(TSRange.make(2,8))).toBeTruthy() ;
            t.expect2(TSRange.make(1,2).continuousWith(TSRange.make(-2,3))).toBeTruthy() ;
            t.expect3(TSRange.make(1,2).continuousWith(TSRange.make(4,8))).toBeFalsy() ;
            t.expect4(TSRange.make(1,2).continuousWith(TSRange.make(-2,2))).toBeFalsy() ;
        }) ;
    })
] ;