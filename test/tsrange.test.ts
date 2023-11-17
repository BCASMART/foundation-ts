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
            t.expectA(A.hasSignificantRange).false() ;
            t.expectB(B.hasSignificantRange).false() ;
            t.expectC(C.hasSignificantRange).false() ;
            t.expectX(X.hasSignificantRange).true() ;
            t.expectY(Y.hasSignificantRange).true() ;
        }) ;
    
        group.unary(`expect that bad ranges are all equals`, async (t) => {        
            t.expect0(X).is(Y) ;
            t.expect1(Y).is(X) ;
            t.expect2(A).is(B) ;
            t.expect3(A).is(C) ;
            t.expect4(B).is(A) ;
            t.expect5(B).is(C) ;
            t.expect6(C).is(A) ;
            t.expect7(C).is(B) ;
        });
    
        group.unary(`Date range of ${diff} seconds`, async (t) => {
            t.expect(DR.length).is(diff) ;
        }) ;
    
        group.unary(`All same ranges must be equals`, async (t) => {
            t.expect0(DR).is(DRR) ;
            t.expect1(DR).is(DRI) ;
            t.expect2(DRR).is(DR) ;
            t.expect3(DRR).is(DRI) ;
            t.expect4(DRI).is(DR) ;
            t.expect5(DRI).is(DRR) ;
        }) ;
    
        group.unary(`No more equality after changing location or length`, async (t) => {
            t.expect0(DR).isnot(DRT) ;
            t.expect1(DRT).isnot(DR) ;
            t.expect2(DR).isnot(DRJ) ;
            t.expect3(DRJ).isnot(DR) ;
        }) ;
    
        group.unary(`Comparisons`, async (t) => {
            t.expect0(DR.compare(DRR)).is(Same) ;
            t.expect1(DR.compare(DRJ)).is(Ascending) ;
            t.expect2(DRJ.compare(DR)).is(Descending) ;
            t.expect3(DR.compare(DRT)).toBeUndefined() ;
        }) ;    
    }),
    TSTest.group("TSRange operations", async (group) => {
        group.unary(`range.isValid`, async (t) => {
            t.expect0(TSRange.make(NaN,0).isValid).false() ;
            t.expect1(TSRange.make(0,NaN).isValid).false() ;
            t.expect2(TSRange.make(NaN,NaN).isValid).false() ;
            t.expect3(TSRange.make(3,0).isValid).true() ;
            t.expect4(TSRange.make(3,1).isValid).true() ;
        }) ;
    
        group.unary(`range.isEmpty`, async (t) => {
            t.expect0(TSRange.make(NaN,0).isEmpty).true() ;
            t.expect1(TSRange.make(0,NaN).isEmpty).true() ;
            t.expect2(TSRange.make(NaN,NaN).isEmpty).true() ;
            t.expect3(TSRange.make(3,0).isEmpty).true() ;
            t.expect4(TSRange.make(3,1).isEmpty).false() ;
        }) ;
    
    
        group.unary(`range.containsLocation()`, async (t) => {
            t.expect0(TSRange.make(1,2).containsLocation(0)).false() ;
            t.expect1(TSRange.make(1,2).containsLocation(4)).false() ;
            t.expect2(TSRange.make(1,2).containsLocation(3)).false() ;
            t.expect3(TSRange.make(1,2).containsLocation(1)).true() ;
            t.expect4(TSRange.make(1,2).containsLocation(2)).true() ;
        }) ;
    
        group.unary(`range.contains() and range.containedIn()`, async (t) => {
            t.expect0(TSRange.make(1,2).contains(TSRange.make(2,8))).false() ;
            t.expect1(TSRange.make(1,2).contains(TSRange.make(0,8))).false() ;
            t.expect2(TSRange.make(1,2).containedIn(TSRange.make(0,8))).true() ;
            t.expect3(TSRange.make(-1,11).contains(TSRange.make(1,5))).true() ;
            t.expect4(TSRange.make(-1,11).contains(TSRange.make(-3,5))).false() ;
        }) ;
    
        group.unary(`range.intersects()`, async (t) => {
            t.expect0(TSRange.make(1,2).intersects(TSRange.make(3,8))).false() ;
            t.expect1(TSRange.make(1,2).intersects(TSRange.make(2,8))).true() ;
        }) ;
    
        group.unary(`range.intersectionRange()`, async (t) => {
            t.expect0(TSRange.make(1,2).intersectionRange(TSRange.make(3,8)).isEmpty).true() ;
            t.expect1(TSRange.make(1,2).intersectionRange(TSRange.make(2,8))).is(TSRange.make(2,1)) ;
        }) ;
    
        group.unary(`range.unionRange()`, async (t) => {
            t.expect0(TSRange.make(1,2).unionRange(TSRange.make(3,8))).is(TSRange.make(1,10)) ;
            t.expect1(TSRange.make(1,2).unionRange(TSRange.make(2,8))).is(TSRange.make(1,9)) ;
        }) ;
    
        group.unary(`range.continuousWith()`, async (t) => {
            t.expect0(TSRange.make(1,2).continuousWith(TSRange.make(3,8))).true() ;
            t.expect1(TSRange.make(1,2).continuousWith(TSRange.make(2,8))).true() ;
            t.expect2(TSRange.make(1,2).continuousWith(TSRange.make(-2,3))).true() ;
            t.expect3(TSRange.make(1,2).continuousWith(TSRange.make(4,8))).false() ;
            t.expect4(TSRange.make(1,2).continuousWith(TSRange.make(-2,2))).false() ;
        }) ;
    })
] ;