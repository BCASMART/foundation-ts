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
const BAD_IV:Interval = { range:new TSRange(NaN, 0), hasSignificantRange:false, isValid:false, isEmpty:true } ;

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
        t.expect3(isNaN(e.location)).true() ;
        t.expect4(isNaN(e.maxRange)).true() ;
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
        t.expect3(() => new TSRangeSet([NaN, 3] as any)).throws() ;        // bad range as array
        t.expect4(() => new TSRangeSet([[1, 0]] as any)).throws() ;        // empty range
        t.expect5(() => new TSRangeSet([BAD_IV] as any)).throws() ;
        t.expect6(() => new TSRangeSet(["x"] as any)).throws() ;
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

    group.unary("contains / intersects reject non-significant parameters", async (t) => {
        t.expect0(() => RS.contains(new TSRange(0, 0))).throws() ;
        t.expect1(() => RS.contains(new TSRangeSet())).throws() ;
        t.expect2(() => RS.contains([1, 0])).throws() ;
        t.expect3(() => RS.contains(BAD_IV)).throws() ;
        t.expect4(() => RS.intersects(new TSRange(0, 0))).throws() ;
        t.expect5(() => RS.intersects(new TSRangeSet())).throws() ;
        t.expect6(() => RS.intersects([1, 0])).throws() ;
        t.expect7(() => RS.intersects(BAD_IV)).throws() ;
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

    group.unary("unionWidth() rejects bad parameters", async (t) => {
        const rs = base() ;
        t.expect0(() => rs.unionWidth(new TSRange(0, 0))).throws() ;
        t.expect1(() => rs.unionWidth([1, 0])).throws() ;
        t.expect2(() => rs.unionWidth(new TSRangeSet())).throws() ;
        t.expect3(() => rs.unionWidth(BAD_IV)).throws() ;
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

    group.unary("substractFrom() rejects bad parameters", async (t) => {
        const rs = base() ;
        t.expect0(() => rs.substractFrom(new TSRange(0, 0))).throws() ;
        t.expect1(() => rs.substractFrom([1, 0])).throws() ;
        t.expect2(() => rs.substractFrom(new TSRangeSet())).throws() ;
        t.expect3(() => rs.substractFrom(BAD_IV)).throws() ;
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
        // NOTE: intersectWidth(TSRangeSet) intersects *sequentially* with each range
        // of the argument (this ∩ r1 ∩ r2 …), not with their union -- so two disjoint
        // ranges always give an empty result. Kept as-is to lock in current behavior.
        t.expect5(three.intersection(new TSRangeSet([[1, 1], [21, 1]])).hasSignificantRange).false() ;
        t.expect6(rs).is(base()) ;
    }) ;

    group.unary("intersectWidth() rejects bad parameters", async (t) => {
        const rs = base() ;
        t.expect0(() => rs.intersectWidth(new TSRange(0, 0))).throws() ;
        t.expect1(() => rs.intersectWidth([1, 0])).throws() ;
        t.expect2(() => rs.intersectWidth(new TSRangeSet())).throws() ;
        t.expect3(() => rs.intersectWidth(BAD_IV)).throws() ;
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

] ;
