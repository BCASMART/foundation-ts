import { Interval, TSRange } from '../src/tsrange'
import { TSRangeSet } from '../src/tsrangeset';
import { TSTest } from '../src/tstester';
import { Ascending, Descending, Same } from '../src/types';

// a plain object conforming to the Interval protocol but NOT a TSRange, so the
// `$comformsToInterval` branches of TSRangeSet get exercised.
function IV(loc:number, len:number):Interval {
    const r = new TSRange(loc, len) ;
    return { range:r, hasSignificantRange:r.hasSignificantRange, isValid:r.isValid, isEmpty:r.isEmpty } ;
}
const BAD_IV:Interval = { range:new TSRange(Number.NaN, 0), hasSignificantRange:false, isValid:false, isEmpty:true } ;

export const rangeSetGroups = [

TSTest.group("Testing TSRangeSet operations", async (group) => {
    const RS = new TSRangeSet([[1,3], [2,6], [10,15]]) ;
    const RS1 = new TSRangeSet([[1,7], [10, 15]]) ;
    const RS2 = new TSRangeSet(new TSRange(1,5)) ;
    RS2.unionWidth(TSRange.fromArray([5,3])!) ;
    RS2.unionWidth([11,14]) ;
    RS2.unionWidth([10,4]) ;

    //printRS('RS2', RS2) ;

    group.unary(`TSRangeSet creation & TSRangeSet.unionWidth()`, async (t) => {
        t.expect0(RS).is(RS1) ;
        t.expect1(RS).is(RS2) ;
        t.expect2(RS1).is(RS2) ;
    }) ;


    group.unary(`TSRangeSet.intersects() & TSRangeSet.complement()`, async (t) => {
        t.expect0(RS.intersects(new TSRangeSet([12,10]))).true() ;
        t.expect1(RS.intersects([8,2])).false() ;
        t.expect2(RS2.intersects([8,2])).false() ;
        t.expect3(RS.intersects(RS.complement())).false() ;
        t.expect4(RS2.intersects([25,50])).false() ;
        t.expect5(RS.intersects([-1,6])).true() ;
    }) ;

    group.unary('TSRangeSet.contains()', async (t) => {
        t.expect0(RS.contains([2,2])).true() ;
        t.expect1(RS.contains([2,8])).false() ;
        t.expect2(RS.contains(new TSRangeSet([[2,2], [11,2]]))).true() ;
    }) ;

    group.unary(`TSRangeSet.intersection()`, async (t) => {
        t.expect0(RS.intersection([12, 10])).is(new TSRangeSet([12, 10]))
        t.expect1(RS.intersection([8, 4])).is(new TSRangeSet([10, 2]))
        t.expect2(RS.intersection([0, 100])).is(RS1)
    }) ;

    group.unary('TSRangeSet.substraction()', async (t) => {
        t.expect0(RS.substraction([8,50])).is(new TSRangeSet([1,7])) ;
        t.expect1(RS.substraction([7,4])).is(new TSRangeSet([[1,6],[11,14]])) ;
    }) ;
}),

TSTest.group("TSRangeSet constructor variants & errors", async (group) => {

    group.unary("empty range set", async (t) => {
        const e = new TSRangeSet() ;
        t.expect0(e.hasSignificantRange).false() ;
        t.expect1(e.length).is(0) ;
        t.expect2(e.isValid).false() ;
        t.expect3(Number.isNaN(e.location)).true() ;
        t.expect4(Number.isNaN(e.maxRange)).true() ;
        t.expect5(e).empty() ;
    }) ;

    group.unary("every accepted parameter shape", async (t) => {
        t.expect0(new TSRangeSet(5)).is(new TSRangeSet([5, 1])) ;                 // number
        t.expect1(new TSRangeSet(new TSRange(3, 4))).is(new TSRangeSet([3, 4])) ; // TSRange
        t.expect2(new TSRangeSet([2, 3]).length).is(3) ;                          // [loc,len]
        t.expect3(new TSRangeSet(IV(4, 2))).is(new TSRangeSet([4, 2])) ;          // Interval object
        t.expect4(new TSRangeSet([[1, 2], [5, 3]]).length).is(5) ;               // array of ranges
        const src = new TSRangeSet([[1, 3], [10, 2]]) ;
        t.expect5(new TSRangeSet(src)).is(src) ;                                  // from another set
        t.expect6(new TSRangeSet([IV(1, 2), new TSRange(5, 2)]).length).is(4) ;   // mixed array
    }) ;

    group.unary("invalid parameters throw", async (t) => {
        t.expect0(() => new TSRangeSet("nope" as any)).throws() ;
        t.expect1(() => new TSRangeSet(true as any)).throws() ;
        t.expect2(() => new TSRangeSet([1, 2, 3] as any)).throws() ;      // 3 numbers -> not ranges
        t.expect3(() => new TSRangeSet([Number.NaN, 3] as any)).throws() ;        // bad range as array
        t.expect4(() => new TSRangeSet([[1, 0]] as any)).throws() ;        // empty range
        t.expect5(() => new TSRangeSet([BAD_IV] as any)).throws() ;
        t.expect6(() => new TSRangeSet(["x"] as any)).throws() ;
        t.expect7(() => new TSRangeSet([1, -1] as any)).throws('TSRangeSet.constructor(): invalid range as array parameter') ;   // negative length
        t.expect8(() => new TSRangeSet([1.5, 2] as any)).throws('TSRangeSet.constructor(): invalid range as array parameter') ;
        t.expect9(() => new TSRangeSet([Number.NaN, 3] as any)).throws('TSRangeSet.constructor(): invalid array parameter') ;     // not 2 numbers
    }) ;

    group.unary("length / range / location / maxRange / clone", async (t) => {
        const rs = new TSRangeSet([[1, 3], [2, 6], [10, 15]]) ;      // -> {[1,7],[10,25)}
        t.expect0(rs.length).is(22) ;
        t.expect1(rs.location).is(1) ;
        t.expect2(rs.maxRange).is(25) ;
        t.expect3(rs.range).is(new TSRange(1, 24)) ;
        t.expect4(rs.isValid).true() ;
        t.expect5(rs.isEmpty).false() ;
        const c = rs.clone() ;
        t.expect6(c).is(rs) ;
        t.expect7(c === rs).false() ;
        c.unionWidth(100) ;
        t.expect8(rs.length).is(22) ;   // clone is independent
    }) ;
}),

TSTest.group("TSRangeSet contains / intersects — all shapes", async (group) => {
    const RS = new TSRangeSet([[1, 7], [10, 15]]) ;   // covers 1..7 and 10..24

    group.unary("contains()", async (t) => {
        t.expect0(RS.contains(2)).true() ;
        t.expect1(RS.contains(8)).false() ;
        t.expect2(RS.contains(new TSRange(2, 3))).true() ;
        t.expect3(RS.contains(new TSRange(5, 8))).false() ;         // spans the gap
        t.expect4(RS.contains([11, 3])).true() ;
        t.expect5(RS.contains(IV(3, 2))).true() ;
        t.expect6(RS.contains(new TSRangeSet([[2, 2], [11, 2]]))).true() ;
        t.expect7(RS.contains(new TSRangeSet([[2, 2], [8, 2]]))).false() ;
        t.expect8(new TSRangeSet().contains(3)).false() ;           // empty set
    }) ;

    group.unary("intersects()", async (t) => {
        t.expect0(RS.intersects(3)).true() ;
        t.expect1(RS.intersects(8)).false() ;                       // gap
        t.expect2(RS.intersects(new TSRange(5, 8))).true() ;
        t.expect3(RS.intersects([7, 2])).true() ;                   // 7 is still in [1,7]
        t.expect4(RS.intersects(IV(0, 3))).true() ;
        t.expect5(RS.intersects(new TSRangeSet([[8, 1], [50, 2]]))).false() ;
        t.expect6(new TSRangeSet().intersects(3)).false() ;
    }) ;

    // like TSRange, an empty range is a location, an invalid range or an empty set has no location
    // (they used to throw). Only an argument of a wrong type throws
    group.unary("contains / intersects with empty, invalid or non integer parameters", async (t) => {
        t.expect0(RS.contains(new TSRange(0, 0))).false() ;
        t.expect1(RS.contains(new TSRange(3, 0))).true() ;           // an empty range is contained if its location is
        t.expect2(RS.contains(new TSRange(8, 0))).false() ;          // in the gap
        t.expect3(RS.contains([1, 0])).true() ;
        t.expect4(RS.contains(new TSRangeSet())).false() ;
        t.expect5(RS.contains(BAD_IV)).false() ;
        t.expect6(RS.intersects(new TSRange(3, 0))).false() ;        // an empty range intersects nothing
        t.expect7(RS.intersects([1, 0])).false() ;
        t.expect8(RS.intersects(new TSRangeSet())).false() ;
        t.expect9(RS.intersects(BAD_IV)).false() ;
        t.expectA(RS.contains(new TSRange(0, 10).intersectionRange(new TSRange(20, 5)))).false() ;  // a bad range
        // a number is a location, like for TSRange.contains()
        t.expectB(RS.contains(1.5)).true() ;                         // used to throw
        t.expectC(RS.contains(7.5)).true() ;
        t.expectD(RS.contains(8.5)).false() ;
        t.expectE(RS.intersects(24.5)).true() ;
        t.expectF(new TSRange(1, 7).contains(1.5)).true() ;
        // wrong types still throw
        t.expectG(() => RS.contains('x' as any)).throws(/invalid parameter/) ;
        t.expectH(() => RS.contains([1, 2, 3] as any)).throws(/invalid range array parameter/) ;
        t.expectI(() => RS.intersects({} as any)).throws(/invalid parameter/) ;
    }) ;

    group.unary("containsLocation()", async (t) => {
        t.expect0(RS.containsLocation(1)).true() ;
        t.expect1(RS.containsLocation(7)).true() ;
        t.expect2(RS.containsLocation(8)).false() ;                  // half-open: [1,8[
        t.expect3(RS.containsLocation(24.9)).true() ;
        t.expect4(RS.containsLocation(25)).false() ;
        t.expect5(RS.containsLocation(Number.NaN)).false() ;
        t.expect6(RS.containsLocation('3' as any)).false() ;
        t.expect7(new TSRangeSet().containsLocation(0)).false() ;
    }) ;

    group.unary("containedIn() and continuousWith()", async (t) => {
        t.expect0(RS.containedIn(new TSRange(0, 30))).true() ;
        t.expect1(RS.containedIn(new TSRange(1, 24))).true() ;       // [1,25[ exactly
        t.expect2(RS.containedIn(new TSRange(2, 30))).false() ;
        t.expect3(RS.containedIn(new TSRangeSet([[0, 9], [10, 20]]))).true() ;
        t.expect4(RS.containedIn(new TSRangeSet([[0, 9], [11, 20]]))).false() ;
        t.expect5(RS.containedIn([0, 30])).true() ;
        t.expect6(RS.containedIn(IV(0, 30))).true() ;
        t.expect7(RS.containedIn(new TSRange(5, 0))).false() ;
        t.expect8(new TSRangeSet().containedIn(new TSRange(0, 10))).false() ;
        t.expect9(RS.containedIn(RS)).true() ;

        t.expectA(RS.continuousWith(new TSRange(8, 2))).true() ;     // touches both ranges
        t.expectB(RS.continuousWith(new TSRange(25, 5))).true() ;    // touches the end
        t.expectC(RS.continuousWith(new TSRange(26, 5))).false() ;
        t.expectD(RS.continuousWith(new TSRange(8, 0))).true() ;     // an empty range at the end of [1,8[
        t.expectE(RS.continuousWith(new TSRange(9, 0))).false() ;
        t.expectF(RS.continuousWith(new TSRangeSet([[30, 1], [25, 1]]))).true() ;
        t.expectG(RS.continuousWith(new TSRangeSet([30, 1]))).false() ;
        t.expectH(RS.continuousWith(new TSRangeSet())).false() ;
        t.expectI(new TSRangeSet().continuousWith(new TSRange(0, 1))).false() ;
        t.expectJ(RS.continuousWith(BAD_IV)).false() ;
        t.expectK(RS.continuousWith([3, 2])).true() ;                // intersects
    }) ;
}),

TSTest.group("TSRangeSet union / substraction / intersection / complement", async (group) => {
    const base = () => new TSRangeSet([[1, 7], [10, 15]]) ;   // 1..7 , 10..24

    group.unary("union() bridges and appends, does not mutate", async (t) => {
        const rs = base() ;
        t.expect0(rs.union(8)).is(new TSRangeSet([[1, 8], [10, 15]])) ;   // [1,7]∪[8,1]=[1,8], still a gap to 10
        t.expect1(rs.union([7, 4])).is(new TSRangeSet([1, 24])) ;         // 7..10 closes the gap
        t.expect2(rs.union(new TSRange(30, 5))).is(new TSRangeSet([[1, 7], [10, 15], [30, 5]])) ;
        t.expect3(rs.union(IV(100, 2))).is(new TSRangeSet([[1, 7], [10, 15], [100, 2]])) ;
        t.expect4(rs.union(new TSRangeSet([[8, 2], [40, 1]]))).is(new TSRangeSet([[1, 24], [40, 1]])) ; // [8,2] closes the gap too
        t.expect5(rs).is(base()) ;                                        // untouched
    }) ;

    group.unary("unionWidth() with empty or invalid parameters changes nothing", async (t) => {
        const rs = base() ;   // they used to throw
        rs.unionWidth(new TSRange(0, 0)) ;
        rs.unionWidth([1, 0]) ;
        rs.unionWidth(new TSRangeSet()) ;
        rs.unionWidth(BAD_IV) ;
        rs.unionWidth(new TSRange(0, 10).intersectionRange(new TSRange(20, 5))) ;  // a bad range
        t.expect0(rs).is(base()) ;
        t.expect1(() => rs.unionWidth('x' as any)).throws(/invalid parameter/) ;
    }) ;

    group.unary("substraction() splits, trims and empties", async (t) => {
        const rs = base() ;
        t.expect0(rs.substraction(3)).is(new TSRangeSet([[1, 2], [4, 4], [10, 15]])) ; // punch a hole
        t.expect1(rs.substraction([1, 7])).is(new TSRangeSet([10, 15])) ;              // drop a whole range
        t.expect2(rs.substraction([0, 100]).hasSignificantRange).false() ;             // drop everything
        t.expect3(rs.substraction([5, 10])).is(new TSRangeSet([[1, 4], [15, 10]])) ;   // trim both ends
        t.expect4(rs.substraction(new TSRangeSet([[2, 2], [11, 2]]))).is(new TSRangeSet([[1, 1], [4, 4], [10, 1], [13, 12]])) ;
        t.expect5(rs.substraction(IV(1, 3))).is(new TSRangeSet([[4, 4], [10, 15]])) ;
        t.expect6(rs).is(base()) ;
    }) ;

    group.unary("substractFrom() with empty or invalid parameters changes nothing", async (t) => {
        const rs = base() ;   // they used to throw
        rs.substractFrom(new TSRange(0, 0)) ;
        rs.substractFrom([1, 0]) ;
        rs.substractFrom(new TSRangeSet()) ;
        rs.substractFrom(BAD_IV) ;
        rs.substractFrom(new TSRange(0, 10).intersectionRange(new TSRange(20, 5))) ;  // a bad range
        t.expect0(rs).is(base()) ;
        t.expect1(() => rs.substractFrom('x' as any)).throws(/invalid parameter/) ;
    }) ;

    group.unary("intersection() keeps the overlap, clears when disjoint", async (t) => {
        const rs = base() ;
        t.expect0(rs.intersection([5, 10])).is(new TSRangeSet([[5, 3], [10, 5]])) ; // 5..7 ∩ , 10..14 ∩
        t.expect1(rs.intersection(3)).is(new TSRangeSet([3, 1])) ;
        t.expect2(rs.intersection([100, 5]).hasSignificantRange).false() ;             // disjoint -> cleared
        t.expect3(rs.intersection(IV(0, 30))).is(base()) ;
        // leading + trailing range removal inside _intersectRange
        const three = new TSRangeSet([[1, 3], [10, 3], [20, 3]]) ;
        t.expect4(three.intersection([10, 3])).is(new TSRangeSet([10, 3])) ;           // drops [1,3] and [20,3]
        // intersectWidth(TSRangeSet) intersects with the union of the ranges of the argument
        t.expect5(three.intersection(new TSRangeSet([[1, 1], [21, 1]]))).is(new TSRangeSet([[1, 1], [21, 1]])) ;
        t.expect6(rs).is(base()) ;
    }) ;

    group.unary("intersectWidth() with empty or invalid parameters empties the set", async (t) => {
        // they used to throw
        const params:any[] = [new TSRange(0, 0), new TSRange(3, 0), [1, 0], new TSRangeSet(), BAD_IV, new TSRange(0, 10).intersectionRange(new TSRange(20, 5))] ;
        t.expect0(params.every(p => { const rs = base() ; rs.intersectWidth(p) ; return !rs.hasSignificantRange ; })).true() ;
        t.expect1(base().intersection(new TSRangeSet()).hasSignificantRange).false() ;
        t.expect2(() => base().intersectWidth('x' as any)).throws(/invalid parameter/) ;
    }) ;

    group.unary("the given ranges are never stored, so never modified", async (t) => {
        const r = new TSRange(0, 10) ;
        const s = new TSRangeSet() ;
        s.unionWidth(r) ;
        s.substractFrom([5, 10]) ;
        t.expect0(r).is(new TSRange(0, 10)) ;                    // used to become [0,5[
        const r2 = new TSRange(0, 10) ;
        const s2 = new TSRangeSet([r2]) ;
        s2.substractFrom([5, 10]) ;
        t.expect1(r2).is(new TSRange(0, 10)) ;
        const a = new TSRangeSet([0, 10]) ;
        const b = new TSRangeSet() ;
        b.unionWidth(a) ;
        b.substractFrom([5, 10]) ;
        t.expect2(a).is(new TSRangeSet([0, 10])) ;
        t.expect3(b).is(new TSRangeSet([0, 5])) ;
    }) ;

    group.unary("complement()", async (t) => {
        const rs = base() ;
        t.expect0(rs.complement()).is(new TSRangeSet([8, 2])) ;                  // the internal gap (8,9)
        t.expect1(rs.complement([0, 30])).is(new TSRangeSet([[0, 1], [8, 2], [25, 5]])) ;
        t.expect2(rs.complement(new TSRange(0, 30))).is(rs.complement([0, 30])) ;
        t.expect3(rs.complement(IV(0, 30))).is(rs.complement([0, 30])) ;
        t.expect4(rs.intersects(rs.complement())).false() ;
        t.expect5(() => new TSRangeSet().complement()).throws() ;               // empty, no param
        t.expect6(new TSRangeSet().complement([1, 5])).is(new TSRangeSet([1, 5])) ;
        t.expect7(() => rs.complement([1, 0])).throws() ;
        t.expect8(() => rs.complement(new TSRange(0, 0))).throws() ;
        t.expect9(() => rs.complement(BAD_IV)).throws() ;
    }) ;
}),

TSTest.group("TSRangeSet isEqual / compare", async (group) => {
    const RS = new TSRangeSet([[1, 7], [10, 15]]) ;

    group.unary("isEqual()", async (t) => {
        t.expect0(RS.isEqual(RS)).true() ;
        t.expect1(RS.isEqual(new TSRangeSet([[1, 3], [2, 6], [10, 15]]))).true() ;
        t.expect2(RS.isEqual("x")).false() ;
        t.expect3(RS.isEqual(new TSRange(1, 24))).false() ;
        t.expect4(RS.isEqual(null)).false() ;
    }) ;

    group.unary("compare()", async (t) => {
        t.expect0(RS.compare(RS)).is(Same) ;
        t.expect1(new TSRangeSet([1, 3]).compare(new TSRangeSet([10, 3]))).is(Ascending) ;
        t.expect2(new TSRangeSet([10, 3]).compare(new TSRangeSet([1, 3]))).is(Descending) ;
        t.expect3(new TSRangeSet([1, 5]).compare(new TSRangeSet([3, 5]))).is(undefined) ;   // overlap
        t.expect4(RS.compare("x")).is(undefined) ;
        t.expect5(RS.compare(new TSRange(100, 5))).is(Ascending) ;
        t.expect6(RS.compare(new TSRange(-10, 3))).is(Descending) ;
    }) ;
}),

TSTest.group("TSRangeSet.intersects(rangeSet) needs only one common range", async (group) => {
    group.unary("intersects() with another range set", async (t) => {
        const S = new TSRangeSet([0, 5]) ;                                                  // {[0,5[}
        t.expect0(S.intersects(new TSRangeSet([[2, 1], [10, 1]]))).true() ;                 // only [2,3[ is common
        t.expect1(new TSRangeSet([[2, 1], [10, 1]]).intersects(S)).true() ;                 // symmetric
        t.expect2(S.intersects(new TSRangeSet([[6, 2], [10, 1]]))).false() ;                // no common range
        t.expect3(new TSRangeSet([[0, 5], [10, 5]]).intersects(new TSRangeSet([[3, 1], [12, 1]]))).true() ; // several common ranges
        t.expect4(new TSRangeSet([[0, 3], [10, 3]]).intersects(new TSRangeSet([[4, 3], [20, 3]]))).false() ; // overall ranges overlap, sub-ranges do not
        t.expect5(S.intersects(new TSRangeSet([5, 5]))).false() ;                           // [0,5[ and [5,10[ are adjacent (half-open)
        t.expect6(new TSRangeSet([5, 5]).intersects(S)).false() ;
        t.expect7(S.intersects(new TSRangeSet([[-3, 1], [4, 1], [5, 5]]))).true() ;          // only [4,5[ is common
    }) ;
}),

TSTest.group("TSRangeSet.intersection(rangeSet) with several ranges", async (group) => {
    const LR = (s:TSRangeSet) => [...s].map(r => [r.location, r.length]) ;

    group.unary("intersection() with a range set is the intersection with all its ranges", async (t) => {
        const S = new TSRangeSet([0, 10]) ;
        const V = new TSRangeSet([[1, 1], [5, 1]]) ;
        t.expect0(LR(S.intersection(V))).is([[1, 1], [5, 1]]) ;                             // {[0,10[} ∩ {[1,2[,[5,6[}
        const A = new TSRangeSet([[0, 3], [5, 3], [10, 2]]) ;                               // {[0,3[,[5,8[,[10,12[}
        const B = new TSRangeSet([[2, 4], [7, 4]]) ;                                        // {[2,6[,[7,11[}
        t.expect1(LR(A.intersection(B))).is([[2, 1], [5, 1], [7, 1], [10, 1]]) ;           // {[2,3[,[5,6[,[7,8[,[10,11[}
        t.expect2(A.intersection(B)).is(B.intersection(A)) ;                                // symmetry
        t.expect3(LR(A)).is([[0, 3], [5, 3], [10, 2]]) ;                                    // sources untouched
        t.expect4(LR(B)).is([[2, 4], [7, 4]]) ;
        t.expect5(A.intersection(new TSRangeSet([[3, 2], [8, 2], [20, 5]])).hasSignificantRange).false() ;  // no common part
        t.expect6(A.intersection(new TSRangeSet([[3, 2], [12, 3]])).hasSignificantRange).false() ;          // touching only (half-open)
        t.expect7(A.intersection(A)).is(A) ;                                                // with itself
        t.expect8(LR(A)).is([[0, 3], [5, 3], [10, 2]]) ;
        const C = A.clone() ; C.intersectWidth(C) ;
        t.expect9(C).is(A) ;                                                                // intersectWidth() with itself
        const D = A.clone() ; D.intersectWidth(B) ;
        t.expectA(LR(D)).is([[2, 1], [5, 1], [7, 1], [10, 1]]) ;                            // in place
        t.expectB(LR(B)).is([[2, 4], [7, 4]]) ;
        D.unionWidth(4) ;                                                                   // result does not share ranges with B
        t.expectC(LR(B)).is([[2, 4], [7, 4]]) ;
        t.expectD(new TSRangeSet().intersection(B).hasSignificantRange).false() ;           // empty receiver
    }) ;

    group.unary("intersection() of random range sets vs brute force", async (t) => {
        let seed = 0x2545F491 ;
        const rnd = (n:number) => { seed = (Math.imul(seed, 1103515245) + 12345) >>> 0 ; return (seed >>> 8) % n ; } ;
        const randomSet = () => {
            const s = new TSRangeSet() ;
            const n = rnd(6) ;
            for (let k = 0 ; k < n ; k++) { s.unionWidth(new TSRange(rnd(56), 1 + rnd(8))) ; }
            return s ;
        } ;
        let badMembership = 0, badRangeArg = 0, badSymmetry = 0, badSources = 0 ;
        for (let c = 0 ; c < 400 ; c++) {
            const a = randomSet(), b = randomSet() ;
            if (!b.hasSignificantRange) { continue ; }
            const a0 = a.clone(), b0 = b.clone() ;
            const res = a.intersection(b) ;
            for (let i = 0 ; i <= 60 ; i++) {
                if ((a.contains(i) && b.contains(i)) !== res.contains(i)) { badMembership++ ; }
            }
            if (a.hasSignificantRange && !res.isEqual(b.intersection(a))) { badSymmetry++ ; }
            if (!a.isEqual(a0) || !b.isEqual(b0)) { badSources++ ; }
            // single TSRange argument: compare with a one range set
            const r = new TSRange(rnd(56), 1 + rnd(10)) ;
            if (!a.intersection(r).isEqual(a.intersection(new TSRangeSet(r)))) { badRangeArg++ ; }
        }
        t.expect0(badMembership).is(0) ;
        t.expect1(badSymmetry).is(0) ;
        t.expect2(badSources).is(0) ;
        t.expect3(badRangeArg).is(0) ;
    }) ;
}),

] ;
