import { TSDate } from '../src/tsdate';
import { TSBadRange, TSRange } from '../src/tsrange' 
import { TSInterval } from '../src/tsinterval' 
import { Ascending, Descending, Same } from '../src/types';

describe("Testing TSRange creation & comparison", () => {
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
    
    it(`test significant ranges`, () => {
        expect(A.hasSignificantRange).toBeFalsy() ;
        expect(B.hasSignificantRange).toBeFalsy() ;
        expect(C.hasSignificantRange).toBeFalsy() ;
        expect(X.hasSignificantRange).toBeTruthy() ;
        expect(Y.hasSignificantRange).toBeTruthy() ;
    }) ;

    it(`expect that bad ranges are all equals`, () => {
        
        expect(X.isEqual(Y)).toBeTruthy() ;
        expect(Y.isEqual(X)).toBeTruthy() ;

        expect(A.isEqual(B)).toBeTruthy() ;
        expect(A.isEqual(C)).toBeTruthy() ;
        expect(B.isEqual(A)).toBeTruthy() ;
        expect(B.isEqual(C)).toBeTruthy() ;
        expect(C.isEqual(A)).toBeTruthy() ;
        expect(C.isEqual(B)).toBeTruthy() ;
    });



    it(`Date range of ${diff} seconds`, () => {
        expect(DR.length).toBe(diff) ;
    }) ;


    it(`All same ranges must be equals`, () => {
        expect(DR.isEqual(DRR)).toBeTruthy() ;
        expect(DR.isEqual(DRI)).toBeTruthy() ;
        expect(DRR.isEqual(DR)).toBeTruthy() ;
        expect(DRR.isEqual(DRI)).toBeTruthy() ;
        expect(DRI.isEqual(DR)).toBeTruthy() ;
        expect(DRI.isEqual(DRR)).toBeTruthy() ;
    }) ;

    it(`No more equality after changing location or length`, () => {
        expect(DR.isEqual(DRT)).toBeFalsy() ;
        expect(DRT.isEqual(DR)).toBeFalsy() ;
        expect(DR.isEqual(DRJ)).toBeFalsy() ;
        expect(DRJ.isEqual(DR)).toBeFalsy() ;
    }) ;

    it(`Comparisons`, () => {
        expect(DR.compare(DRR)).toBe(Same) ;
        expect(DR.compare(DRJ)).toBe(Ascending) ;
        expect(DRJ.compare(DR)).toBe(Descending) ;
        expect(DR.compare(DRT)).toBeUndefined() ;
    }) ;

}) ;

describe("Testing TSRange operations", () => {

    it('range.className', () => { expect(TSBadRange().className).toBe("TSRange") ; }) ;
    it(`range.isValid`, () => {
        expect(TSRange.make(NaN,0).isValid).toBeFalsy() ;
        expect(TSRange.make(0,NaN).isValid).toBeFalsy() ;
        expect(TSRange.make(NaN,NaN).isValid).toBeFalsy() ;
        expect(TSRange.make(3,0).isValid).toBeTruthy() ;
        expect(TSRange.make(3,1).isValid).toBeTruthy() ;
    }) ;

    it(`range.isEmpty`, () => {
        expect(TSRange.make(NaN,0).isEmpty).toBeTruthy() ;
        expect(TSRange.make(0,NaN).isEmpty).toBeTruthy() ;
        expect(TSRange.make(NaN,NaN).isEmpty).toBeTruthy() ;
        expect(TSRange.make(3,0).isEmpty).toBeTruthy() ;
        expect(TSRange.make(3,1).isEmpty).toBeFalsy() ;
    }) ;


    it(`range.containsLocation()`, () => {
        expect(TSRange.make(1,2).containsLocation(0)).toBeFalsy() ;
        expect(TSRange.make(1,2).containsLocation(4)).toBeFalsy() ;
        expect(TSRange.make(1,2).containsLocation(3)).toBeFalsy() ;
        expect(TSRange.make(1,2).containsLocation(1)).toBeTruthy() ;
        expect(TSRange.make(1,2).containsLocation(2)).toBeTruthy() ;
    }) ;

    it(`range.contains() and range.containedIn()`, () => {
        expect(TSRange.make(1,2).contains(TSRange.make(2,8))).toBeFalsy() ;
        expect(TSRange.make(1,2).contains(TSRange.make(0,8))).toBeFalsy() ;
        expect(TSRange.make(1,2).containedIn(TSRange.make(0,8))).toBeTruthy() ;
        expect(TSRange.make(-1,11).contains(TSRange.make(1,5))).toBeTruthy() ;
        expect(TSRange.make(-1,11).contains(TSRange.make(-3,5))).toBeFalsy() ;
    }) ;

    it(`range.intersects()`, () => {
        expect(TSRange.make(1,2).intersects(TSRange.make(3,8))).toBeFalsy() ;
        expect(TSRange.make(1,2).intersects(TSRange.make(2,8))).toBeTruthy() ;
    }) ;

    it(`range.intersectionRange()`, () => {
        expect(TSRange.make(1,2).intersectionRange(TSRange.make(3,8)).isEmpty).toBeTruthy() ;
        expect(TSRange.make(1,2).intersectionRange(TSRange.make(2,8)).isEqual(TSRange.make(2,1))).toBeTruthy() ;
    }) ;

    it(`range.unionRange()`, () => {
        expect(TSRange.make(1,2).unionRange(TSRange.make(3,8)).isEqual(TSRange.make(1,10))).toBeTruthy() ;
        expect(TSRange.make(1,2).unionRange(TSRange.make(2,8)).isEqual(TSRange.make(1,9))).toBeTruthy() ;
    }) ;

    it(`range.continuousWith()`, () => {
        expect(TSRange.make(1,2).continuousWith(TSRange.make(3,8))).toBeTruthy() ;
        expect(TSRange.make(1,2).continuousWith(TSRange.make(2,8))).toBeTruthy() ;
        expect(TSRange.make(1,2).continuousWith(TSRange.make(-2,3))).toBeTruthy() ;
        expect(TSRange.make(1,2).continuousWith(TSRange.make(4,8))).toBeFalsy() ;
        expect(TSRange.make(1,2).continuousWith(TSRange.make(-2,2))).toBeFalsy() ;
    }) ;
}) ;
