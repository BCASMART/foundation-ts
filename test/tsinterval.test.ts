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

        // TSInterval.compare() implements a PARTIAL (precedence / Allen "before"-"after")
        // order, exactly like TSRange.compare(): two intervals are only ordered when one
        // lies entirely at or before the other. Overlapping non-equal intervals -> undefined.
        // This is by design, not a bug.
        group.unary(`compare() is a partial precedence order`, async (t) => {
            const m = (mo:number) => new TSDate(2024, mo, 1) ;
            const janFeb = new TSInterval(m(1), m(2)) ;
            const marApr = new TSInterval(m(3), m(4)) ;
            const febMar = new TSInterval(m(2), m(3)) ;   // touches janFeb at its end
            const janMar = new TSInterval(m(1), m(3)) ;   // overlaps janFeb (shared start)
            const fromMar = new TSInterval(m(3), null) ;  // [Mar 1, +inf)
            const untilJan = new TSInterval(null, m(1)) ; // (-inf, Jan 1)

            // disjoint intervals are strictly ordered, antisymmetrically
            t.expect0(janFeb.compare(marApr)).is(Ascending) ;
            t.expect1(marApr.compare(janFeb)).is(Descending) ;
            // adjacency counts as "before" (end <= start)
            t.expect2(janFeb.compare(febMar)).is(Ascending) ;
            t.expect3(febMar.compare(janFeb)).is(Descending) ;
            // genuine overlap -> no precedence relation
            t.expect4(janFeb.compare(janMar)).undef() ;
            t.expect5(janMar.compare(janFeb)).undef() ;
            // half-infinite intervals still order against a disjoint bounded one
            t.expect6(janFeb.compare(fromMar)).is(Ascending) ;
            t.expect7(fromMar.compare(janFeb)).is(Descending) ;
            t.expect8(janFeb.compare(untilJan)).is(Descending) ;
            t.expect9(untilJan.compare(janFeb)).is(Ascending) ;
            // the fully-infinite interval cannot be ordered against a bounded one
            t.expectA(janFeb.compare(new TSInterval(null, null))).undef() ;
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

    }),

    TSTest.group("TSInterval — daysInterval / hasSameRange / containsDate / JSON", async (group) => {
        const day  = new TSDate(2000, 1, 10) ;                       // 2000-01-10 00:00
        const noon = new TSDate(2000, 1, 10, 12, 0, 0) ;
        const eve  = new TSDate(2000, 1, 10, 18, 0, 0) ;
        const d20  = new TSDate(2000, 1, 20, 12, 0, 0) ;
        const before = new TSDate(1999, 12, 31) ;
        const after  = new TSDate(2000, 2, 1) ;

        group.unary('daysInterval()', async (t) => {
            t.expect0(new TSInterval(noon, d20).daysInterval())
             .is(new TSInterval(new TSDate(2000, 1, 10), new TSDate(2000, 1, 20))) ;
            t.expect1(new TSInterval(noon, noon).daysInterval())     // empty -> single day
             .is(new TSInterval(day, day)) ;
            t.expect2(new TSInterval(noon, eve).daysInterval())      // same day, not empty -> +1 day
             .is(new TSInterval(day, new TSDate(2000, 1, 11))) ;
            t.expect3(new TSInterval(noon, null).daysInterval())
             .is(new TSInterval(day, null)) ;
            t.expect4(new TSInterval(null, d20).daysInterval())
             .is(new TSInterval(null, new TSDate(2000, 1, 20))) ;
            t.expect5(new TSInterval(null, null).daysInterval())
             .is(new TSInterval(null, null)) ;
        }) ;

        group.unary('hasSameRange()', async (t) => {
            const a = new TSInterval(noon, d20) ;
            t.expect0(a.hasSameRange(a.clone())).true() ;
            t.expect1(a.hasSameRange(new TSInterval(noon, eve))).false() ;
            t.expect2(a.hasSameRange(new TSInterval(noon, null))).false() ;   // infinite: never
            t.expect3(new TSInterval(noon, null).hasSameRange(new TSInterval(noon, null))).false() ;
        }) ;

        group.unary('containsDate()', async (t) => {
            const a = new TSInterval(noon, d20) ;
            t.expect0(a.containsDate(new TSDate(2000, 1, 15))).true() ;
            t.expect1(a.containsDate(noon)).true() ;
            t.expect2(a.containsDate(d20)).false() ;                          // half-open
            t.expect3(a.containsDate(before)).false() ;
            t.expect4(new TSInterval(noon, noon).containsDate(noon)).false() ; // empty
            t.expect5(new TSInterval(null, null).containsDate(after)).true() ; // both-infinite
            // one-sided intervals (semantics as implemented)
            t.expect6(new TSInterval(noon, null).containsDate(before)).true() ;
            t.expect7(new TSInterval(noon, null).containsDate(after)).false() ;
            t.expect8(new TSInterval(null, d20).containsDate(before)).true() ;
            t.expect9(new TSInterval(null, d20).containsDate(after)).false() ;
        }) ;

        group.unary('toJSON() / toArray() / start / end / make', async (t) => {
            const a = TSInterval.make(noon, d20) ;
            t.expect0(a.toArray()).is([a]) ;
            const j = a.toJSON() ;
            t.expect1(j.start).is(noon.toJSON()) ;
            t.expect2(j.end).is(d20.toJSON()) ;
            t.expect3(new TSInterval(null, null).start.isEqual(new TSDate(TSDate.PAST))).true() ;
            t.expect4(new TSInterval(null, null).end.isEqual(new TSDate(TSDate.FUTURE))).true() ;
        }) ;
    }),

    TSTest.group("TSInterval — infinite-interval compare / contains / intersects", async (group) => {
        const d1 = new TSDate(2000, 1, 10) ;
        const d2 = new TSDate(2000, 1, 20) ;
        const from2  = new TSInterval(d2, null) ;    // [d2, +inf)
        const until1 = new TSInterval(null, d1) ;    // (-inf, d1)
        const from1  = new TSInterval(d1, null) ;
        const until2 = new TSInterval(null, d2) ;

        group.unary('compare() between one-sided infinite intervals', async (t) => {
            t.expect0(until1.compare(from2)).is(Ascending) ;    // (-inf,d1) before [d2,+inf)
            t.expect1(from2.compare(until1)).is(Descending) ;
            t.expect2(from1.compare(from2)).is(undefined) ;     // both open on the right
            t.expect3(until1.compare(until2)).is(undefined) ;
        }) ;

        group.unary('contains() / intersects() with one-sided intervals', async (t) => {
            t.expect0(from1.contains(from2)).true() ;           // [d1,+inf) contains [d2,+inf)
            t.expect1(from2.contains(from1)).false() ;
            t.expect2(until2.contains(until1)).true() ;
            t.expect3(from1.intersects(from2)).true() ;
            t.expect4(until1.intersects(from2)).false() ;
            t.expect5(from1.intersects(new TSInterval(null, null))).true() ;
        }) ;
    }),
] ;