import { TSDate } from '../src/tsdate';
import { TSInterval } from '../src/tsinterval' 
import { Ascending, Descending, Same } from '../src/types';

describe("Testing TSInterval creation & comparison", () => {
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

    it(`test intervals equality`, () => {
        expect(A.isEqual(A)).toBeTruthy() ;
        expect(A.isEqual(B)).toBeFalsy() ;
        expect(A.isEqual(C)).toBeFalsy() ;
        expect(A.isEqual(D)).toBeFalsy() ;
        expect(A.isEqual(Z)).toBeFalsy() ;
        expect(A.isEqual(AB)).toBeTruthy() ;
        expect(AB.isEqual(A)).toBeTruthy() ;
        expect(B.isEqual(TSInterval.make(D1B, null))).toBeTruthy() ;
        expect(C.isEqual(TSInterval.make(null, D2.clone()))).toBeTruthy() ;
        expect(D.isEqual(TSInterval.make(null, null))).toBeTruthy() ;
    }) ;

    it(`test comparison`, () => {
        expect(TSInterval.make(D0,D1).compare(A)).toBe(Ascending) ;
        expect(A.compare(TSInterval.make(D0,D1))).toBe(Descending) ;
        expect(A.compare(AB)).toBe(Same) ;
        expect(A.compare(B)).toBeUndefined() ;
    }) ;

    it(`test significant ranges`, () => {
        expect(A.hasSignificantRange).toBeTruthy() ;
        expect(B.hasSignificantRange).toBeFalsy() ;
        expect(C.hasSignificantRange).toBeFalsy() ;
        expect(D.hasSignificantRange).toBeFalsy() ;
        expect(Z.hasSignificantRange).toBeFalsy() ;
    }) ;

    it(`test emptiness`, () => {
        expect(A.isEmpty).toBeFalsy() ;
        expect(B.isEmpty).toBeFalsy() ;
        expect(C.isEmpty).toBeFalsy() ;
        expect(D.isEmpty).toBeFalsy() ;
        expect(Z.isEmpty).toBeTruthy() ;
    }) ;

    it(`test validity`, () => {
        expect(A.isValid).toBeTruthy() ;
        expect(B.isValid).toBeTruthy() ;
        expect(C.isValid).toBeFalsy() ;
        expect(D.isValid).toBeFalsy() ;
        expect(Z.isValid).toBeTruthy() ;
    }) ;
}) ;

describe("Testing TSInterval operations", () => {
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

    it('interval.intersects()', () => {
        expect(Z.intersects(X)).toBeTruthy() ;
        expect(Z.intersects(Y)).toBeTruthy() ;
        expect(Z.intersects(A)).toBeTruthy() ;
        expect(C.intersects(A)).toBeTruthy() ;
        expect(C.intersects(B)).toBeTruthy() ;
        expect(A.intersects(B)).toBeFalsy() ;
        expect(A.intersects(C)).toBeTruthy() ;
        expect(C.intersects(D)).toBeTruthy() ;
        expect(A.intersects(D)).toBeFalsy() ;
        expect(B.intersects(D)).toBeFalsy() ;
        expect(A.intersects(Y)).toBeFalsy() ;
        expect(B.intersects(Y)).toBeFalsy() ;
        expect(A.intersects(X)).toBeTruthy() ;
        expect(A.intersects(Z)).toBeTruthy() ;
    }) ;

    it('interval.contains()', () => {
        expect(Z.contains(X)).toBeTruthy() ;
        expect(Z.contains(Y)).toBeTruthy() ;
        expect(Z.contains(A)).toBeTruthy() ;
        expect(Z.contains(B)).toBeTruthy() ;
        expect(C.contains(A)).toBeTruthy() ;
        expect(C.contains(B)).toBeTruthy() ;
        expect(C.contains(D)).toBeFalsy() ;
        expect(D.contains(C)).toBeFalsy() ;
        expect(Y.contains(D)).toBeTruthy() ;
        expect(Z.contains(D)).toBeTruthy() ;
    }) ;

    it('interval.continuousWith()', () => {
        expect(B.continuousWith(D)).toBeTruthy() ;
        expect(B.continuousWith(A)).toBeTruthy() ;
        expect(B.continuousWith(Y)).toBeTruthy() ;
        expect(X.continuousWith(Y)).toBeTruthy() ;
        expect(X.continuousWith(Z)).toBeTruthy() ;
        expect(A.continuousWith(B)).toBeTruthy() ;
        expect(A.continuousWith(D)).toBeFalsy() ;
        expect(A.continuousWith(Y)).toBeFalsy() ;
        expect(D.continuousWith(A)).toBeFalsy() ;
        expect(Y.continuousWith(A)).toBeFalsy() ;
    }) ;


    it('interval.className', () => { expect(TSInterval.make(null,null).className).toBe("TSInterval") ; }) ;


}) ;