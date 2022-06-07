import { TSDate } from '../src/tsdate';
import { TSBadRange, TSRange } from '../src/tsrange' 
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
            t.expect(A.hasSignificantRange).toBeFalsy() ;
            t.expect(B.hasSignificantRange).toBeFalsy() ;
            t.expect(C.hasSignificantRange).toBeFalsy() ;
            t.expect(X.hasSignificantRange).toBeTruthy() ;
            t.expect(Y.hasSignificantRange).toBeTruthy() ;
        }) ;
    
        group.unary(`expect that bad ranges are all equals`, async (t) => {        
            t.expect(X).toBe(Y) ;
            t.expect(Y).toBe(X) ;
            t.expect(A).toBe(B) ;
            t.expect(A).toBe(C) ;
            t.expect(B).toBe(A) ;
            t.expect(B).toBe(C) ;
            t.expect(C).toBe(A) ;
            t.expect(C).toBe(B) ;
        });
    
        group.unary(`Date range of ${diff} seconds`, async (t) => {
            t.expect(DR.length).toBe(diff) ;
        }) ;
    
        group.unary(`All same ranges must be equals`, async (t) => {
            t.expect(DR).toBe(DRR) ;
            t.expect(DR).toBe(DRI) ;
            t.expect(DRR).toBe(DR) ;
            t.expect(DRR).toBe(DRI) ;
            t.expect(DRI).toBe(DR) ;
            t.expect(DRI).toBe(DRR) ;
        }) ;
    
        group.unary(`No more equality after changing location or length`, async (t) => {
            t.expect(DR).notToBe(DRT) ;
            t.expect(DRT).notToBe(DR) ;
            t.expect(DR).notToBe(DRJ) ;
            t.expect(DRJ).notToBe(DR) ;
        }) ;
    
        group.unary(`Comparisons`, async (t) => {
            t.expect(DR.compare(DRR)).toBe(Same) ;
            t.expect(DR.compare(DRJ)).toBe(Ascending) ;
            t.expect(DRJ.compare(DR)).toBe(Descending) ;
            t.expect(DR.compare(DRT)).toBeUndefined() ;
        }) ;    
    }),
    TSTest.group("Testing TSRange operations", async (group) => {
        group.unary('range.className', async (t) => { t.expect(TSBadRange().className).toBe("TSRange") ; }) ;
        group.unary(`range.isValid`, async (t) => {
            t.expect(TSRange.make(NaN,0).isValid).toBeFalsy() ;
            t.expect(TSRange.make(0,NaN).isValid).toBeFalsy() ;
            t.expect(TSRange.make(NaN,NaN).isValid).toBeFalsy() ;
            t.expect(TSRange.make(3,0).isValid).toBeTruthy() ;
            t.expect(TSRange.make(3,1).isValid).toBeTruthy() ;
        }) ;
    
        group.unary(`range.isEmpty`, async (t) => {
            t.expect(TSRange.make(NaN,0).isEmpty).toBeTruthy() ;
            t.expect(TSRange.make(0,NaN).isEmpty).toBeTruthy() ;
            t.expect(TSRange.make(NaN,NaN).isEmpty).toBeTruthy() ;
            t.expect(TSRange.make(3,0).isEmpty).toBeTruthy() ;
            t.expect(TSRange.make(3,1).isEmpty).toBeFalsy() ;
        }) ;
    
    
        group.unary(`range.containsLocation()`, async (t) => {
            t.expect(TSRange.make(1,2).containsLocation(0)).toBeFalsy() ;
            t.expect(TSRange.make(1,2).containsLocation(4)).toBeFalsy() ;
            t.expect(TSRange.make(1,2).containsLocation(3)).toBeFalsy() ;
            t.expect(TSRange.make(1,2).containsLocation(1)).toBeTruthy() ;
            t.expect(TSRange.make(1,2).containsLocation(2)).toBeTruthy() ;
        }) ;
    
        group.unary(`range.contains() and range.containedIn()`, async (t) => {
            t.expect(TSRange.make(1,2).contains(TSRange.make(2,8))).toBeFalsy() ;
            t.expect(TSRange.make(1,2).contains(TSRange.make(0,8))).toBeFalsy() ;
            t.expect(TSRange.make(1,2).containedIn(TSRange.make(0,8))).toBeTruthy() ;
            t.expect(TSRange.make(-1,11).contains(TSRange.make(1,5))).toBeTruthy() ;
            t.expect(TSRange.make(-1,11).contains(TSRange.make(-3,5))).toBeFalsy() ;
        }) ;
    
        group.unary(`range.intersects()`, async (t) => {
            t.expect(TSRange.make(1,2).intersects(TSRange.make(3,8))).toBeFalsy() ;
            t.expect(TSRange.make(1,2).intersects(TSRange.make(2,8))).toBeTruthy() ;
        }) ;
    
        group.unary(`range.intersectionRange()`, async (t) => {
            t.expect(TSRange.make(1,2).intersectionRange(TSRange.make(3,8)).isEmpty).toBeTruthy() ;
            t.expect(TSRange.make(1,2).intersectionRange(TSRange.make(2,8))).toBe(TSRange.make(2,1)) ;
        }) ;
    
        group.unary(`range.unionRange()`, async (t) => {
            t.expect(TSRange.make(1,2).unionRange(TSRange.make(3,8))).toBe(TSRange.make(1,10)) ;
            t.expect(TSRange.make(1,2).unionRange(TSRange.make(2,8))).toBe(TSRange.make(1,9)) ;
        }) ;
    
        group.unary(`range.continuousWith()`, async (t) => {
            t.expect(TSRange.make(1,2).continuousWith(TSRange.make(3,8))).toBeTruthy() ;
            t.expect(TSRange.make(1,2).continuousWith(TSRange.make(2,8))).toBeTruthy() ;
            t.expect(TSRange.make(1,2).continuousWith(TSRange.make(-2,3))).toBeTruthy() ;
            t.expect(TSRange.make(1,2).continuousWith(TSRange.make(4,8))).toBeFalsy() ;
            t.expect(TSRange.make(1,2).continuousWith(TSRange.make(-2,2))).toBeFalsy() ;
        }) ;
    })
] ;