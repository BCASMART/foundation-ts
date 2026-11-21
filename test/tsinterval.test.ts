import { TSDate } from '../src/tsdate';
import { TSInterval } from '../src/tsinterval' 
import { TSRange } from '../src/tsrange';
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
            t.expectC(C.isValid).true() ;   // ]-inf, end[ and ]-inf, +inf[ used to be invalid
            t.expectD(D.isValid).true() ;
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
            // one-sided intervals: [noon, +inf[ and ]-inf, d20[
            t.expect6(new TSInterval(noon, null).containsDate(before)).false() ;
            t.expect7(new TSInterval(noon, null).containsDate(after)).true() ;
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
    TSTest.group("Testing TSInterval.containsDate()", async (group) => {
        const d2020 = new TSDate(2020, 1, 1) ;
        const d2021 = new TSDate(2021, 1, 1) ;
        const d2022 = new TSDate(2022, 1, 1) ;
        const d2023 = new TSDate(2023, 1, 1) ;
        const d2024 = new TSDate(2024, 1, 1) ;

        group.unary('containsDate() with a start date only [start, +inf[', async (t) => {
            const I = new TSInterval(d2021, null) ;
            t.expect0(I.containsDate(d2022)).true() ;
            t.expect1(I.containsDate(d2021)).true() ;           // start is included
            t.expect2(I.containsDate(d2020)).false() ;
            t.expect3(I.containsDate(new TSDate(2999, 1, 1))).true() ;
        }) ;

        group.unary('containsDate() with an end date only ]-inf, end[', async (t) => {
            const I = new TSInterval(null, d2023) ;
            t.expect0(I.containsDate(d2022)).true() ;
            t.expect1(I.containsDate(d2023)).false() ;          // end is excluded
            t.expect2(I.containsDate(d2024)).false() ;
            t.expect3(I.containsDate(new TSDate(1900, 1, 1))).true() ;
        }) ;

        group.unary('containsDate() with both bounds [start, end[', async (t) => {
            const I = new TSInterval(d2021, d2023) ;
            t.expect0(I.containsDate(d2021)).true() ;
            t.expect1(I.containsDate(d2022)).true() ;
            t.expect2(I.containsDate(d2023)).false() ;
            t.expect3(I.containsDate(d2020)).false() ;
            t.expect4(I.containsDate(d2024)).false() ;
        }) ;

        group.unary('containsDate() with both bounds infinite', async (t) => {
            const I = new TSInterval(null, null) ;
            t.expect0(I.containsDate(d2020)).true() ;
            t.expect1(I.containsDate(d2024)).true() ;
            t.expect2(TSInterval.make(d2021, d2021).containsDate(d2021)).false() ; // empty interval
        }) ;
    }),
    TSTest.group("TSInterval — validity, empty and infinite intervals inclusion", async (group) => {
        const D1 = new TSDate(2021, 1, 1) ;
        const D2 = new TSDate(2022, 1, 1) ;
        const D3 = new TSDate(2023, 1, 1) ;
        const D4 = new TSDate(2024, 1, 1) ;
        const all = new TSInterval(null, null) ;
        const until3 = new TSInterval(null, D3) ;
        const from2 = new TSInterval(D2, null) ;
        const finite = new TSInterval(D1, D3) ;

        group.unary('an inverted interval cannot be created, like a TSRange', async (t) => {
            t.expect0(() => new TSInterval(D3, D1)).toThrow('TSInterval.constructor(): second provided date is anterior to the first one') ;
            t.expect1(() => TSInterval.make(D3, D1)).toThrow(/anterior/) ;
            t.expect2(() => new TSRange(D3, D1)).toThrow(/anterior/) ;
            t.expect3(() => new TSInterval(D1, D1)).notToThrow() ;   // an empty interval is valid
            // an interval inverted afterwards is invalid and contains or intersects nothing
            const changed = new TSInterval(D1, D3) ;
            changed.first = D4 ;
            t.expect4(changed.isValid).false() ;
            t.expect5(changed.containsDate(D4)).false() ;          // used to be [D4, +inf[
            t.expect6(changed.containsDate(new TSDate(2030, 1, 1))).false() ;
            t.expect7(all.contains(changed)).false() ;
            t.expect8(changed.intersects(all)).false() ;
            t.expect9(changed.continuousWith(from2)).false() ;
        }) ;

        group.unary('the infinite intervals are valid', async (t) => {
            t.expect0(all.isValid).true() ;
            t.expect1(until3.isValid).true() ;
            t.expect2(from2.isValid).true() ;
            t.expect3(finite.isValid).true() ;
        }) ;

        group.unary('an empty interval is contained if its date is', async (t) => {
            t.expect0(finite.contains(new TSInterval(D2, D2))).true() ;     // used to be false
            t.expect1(finite.contains(new TSInterval(D1, D1))).true() ;     // at the start
            t.expect2(finite.contains(new TSInterval(D3, D3))).false() ;    // at the excluded end
            t.expect3(finite.contains(new TSInterval(D4, D4))).false() ;
            t.expect4(from2.contains(new TSInterval(D3, D3))).true() ;
            t.expect5(until3.contains(new TSInterval(D3, D3))).false() ;
            t.expect6(all.contains(new TSInterval(D4, D4))).true() ;
            t.expect7(new TSInterval(D2, D2).contains(new TSInterval(D2, D2))).false() ;  // an empty interval contains nothing
            // like TSRange
            t.expect8(new TSRange(0, 10).contains(new TSRange(5, 0))).true() ;
            t.expect9(new TSRange(0, 10).contains(new TSRange(10, 0))).false() ;
            t.expectA(new TSRange(5, 0).contains(new TSRange(5, 0))).false() ;
            // an empty interval still intersects nothing
            t.expectB(finite.intersects(new TSInterval(D2, D2))).false() ;
        }) ;

        group.unary('continuousWith() with an empty interval inside, like TSRange', async (t) => {
            t.expect0(finite.continuousWith(new TSInterval(D2, D2))).true() ;     // used to be false
            t.expect1(new TSInterval(D2, D2).continuousWith(finite)).true() ;
            t.expect2(finite.continuousWith(new TSInterval(D1, D1))).true() ;     // at the start
            t.expect3(finite.continuousWith(new TSInterval(D3, D3))).true() ;     // at the end
            t.expect4(finite.continuousWith(new TSInterval(D4, D4))).false() ;
            t.expect5(all.continuousWith(new TSInterval(D4, D4))).true() ;
            t.expect6(from2.continuousWith(until3)).true() ;
            t.expect7(new TSInterval(D3, D4).continuousWith(new TSInterval(D1, D2))).false() ;
            t.expect8(new TSInterval(D2, D3).continuousWith(new TSInterval(D1, D2))).true() ;  // touching
        }) ;

        group.unary('infinite intervals inclusion', async (t) => {
            t.expect0(all.contains(until3)).true() ;
            t.expect1(all.contains(from2)).true() ;
            t.expect2(all.contains(all)).true() ;               // equal intervals
            t.expect3(all.contains(finite)).true() ;
            t.expect4(until3.contains(new TSInterval(null, D2))).true() ;
            t.expect5(until3.contains(until3)).true() ;
            t.expect6(until3.contains(all)).false() ;
            t.expect7(until3.contains(from2)).false() ;
            t.expect8(from2.contains(new TSInterval(D3, null))).true() ;
            t.expect9(from2.contains(from2)).true() ;
            t.expectA(from2.contains(all)).false() ;
            t.expectB(from2.contains(until3)).false() ;
            t.expectC(from2.contains(new TSInterval(D2, D4))).true() ;
            t.expectD(from2.contains(finite)).false() ;
            t.expectE(finite.contains(until3)).false() ;
            t.expectF(finite.contains(from2)).false() ;
            t.expectG(until3.containedIn(all)).true() ;
        }) ;
    }),
    TSTest.group("TSInterval — unionInterval() and intersectionInterval()", async (group) => {
        const D1 = new TSDate(2021, 1, 1) ;
        const D2 = new TSDate(2022, 1, 1) ;
        const D3 = new TSDate(2023, 1, 1) ;
        const D4 = new TSDate(2024, 1, 1) ;
        const D5 = new TSDate(2025, 1, 1) ;
        const I = (a:TSDate|null, b:TSDate|null) => new TSInterval(a, b) ;
        const all = I(null, null) ;

        group.unary('finite intervals', async (t) => {
            const a = I(D1, D3), b = I(D2, D4) ;
            t.expect0(a.unionInterval(b)).is(I(D1, D4)) ;               // overlapping
            t.expect1(a.intersectionInterval(b)).is(I(D2, D3)) ;
            t.expect2(I(D1, D2).unionInterval(I(D3, D4))).is(I(D1, D4)) ; // disjoint: the union covers the gap
            t.expect3(I(D1, D2).intersectionInterval(I(D3, D4))).null() ;
            const touchU = I(D1, D2).unionInterval(I(D2, D3)) ;          // touching
            t.expect4(touchU).is(I(D1, D3)) ;
            const touchI = I(D1, D2).intersectionInterval(I(D2, D3)) ;
            t.expect5(touchI).is(I(D2, D2)) ;
            t.expect6(touchI!.isEmpty).true() ;
            t.expect7(I(D1, D5).unionInterval(I(D2, D3))).is(I(D1, D5)) ; // containment
            t.expect8(I(D1, D5).intersectionInterval(I(D2, D3))).is(I(D2, D3)) ;
            t.expect9(a.unionInterval(a)).is(a) ;                       // same interval
            t.expectA(a.intersectionInterval(a)).is(a) ;
            t.expectB(a.unionInterval(a) !== a && a.intersectionInterval(a) !== a).true() ; // new objects
        }) ;

        group.unary('intervals with infinite bounds', async (t) => {
            const from2 = I(D2, null), from3 = I(D3, null), until3 = I(null, D3), until4 = I(null, D4) ;
            const finite = I(D1, D4) ;
            t.expect0(from2.unionInterval(from3)).is(from2) ;
            t.expect1(from2.intersectionInterval(from3)).is(from3) ;
            t.expect2(until3.unionInterval(until4)).is(until4) ;
            t.expect3(until3.intersectionInterval(until4)).is(until3) ;
            t.expect4(from2.unionInterval(until3)).is(all) ;
            t.expect5(from2.intersectionInterval(until3)).is(I(D2, D3)) ;
            t.expect6(from3.intersectionInterval(I(null, D2))).null() ;     // disjoint
            t.expect7(from3.unionInterval(I(null, D2))).is(all) ;
            t.expect8(from3.intersectionInterval(until3)).is(I(D3, D3)) ;   // touching
            t.expect9(from3.intersectionInterval(until3)!.isEmpty).true() ;
            t.expectA(finite.unionInterval(from2)).is(I(D1, null)) ;
            t.expectB(finite.intersectionInterval(from2)).is(I(D2, D4)) ;
            t.expectC(finite.unionInterval(until3)).is(I(null, D4)) ;
            t.expectD(finite.intersectionInterval(until3)).is(I(D1, D3)) ;
            t.expectE(I(D4, D5).intersectionInterval(until3)).null() ;
            t.expectF(I(D4, D5).unionInterval(until3)).is(I(null, D5)) ;
            t.expectG(all.unionInterval(finite)).is(all) ;
            t.expectH(all.intersectionInterval(finite)).is(finite) ;
            t.expectI(all.unionInterval(from2)).is(all) ;
            t.expectJ(all.intersectionInterval(from2)).is(from2) ;
            t.expectK(all.intersectionInterval(until3)).is(until3) ;
            t.expectL(all.unionInterval(all)).is(all) ;
            t.expectM(all.intersectionInterval(all)).is(all) ;
            t.expectN(all.intersectionInterval(all) !== all).true() ;
        }) ;

        group.unary('empty intervals', async (t) => {
            const finite = I(D2, D4) ;
            t.expect0(finite.intersectionInterval(I(D3, D3))).is(I(D3, D3)) ;  // inside
            t.expect1(finite.unionInterval(I(D3, D3))).is(finite) ;
            t.expect2(finite.intersectionInterval(I(D2, D2))).is(I(D2, D2)) ;  // at start
            t.expect3(finite.unionInterval(I(D2, D2))).is(finite) ;
            t.expect4(finite.intersectionInterval(I(D4, D4))).is(I(D4, D4)) ;  // at the excluded end
            t.expect5(finite.unionInterval(I(D4, D4))).is(finite) ;
            t.expect6(finite.intersectionInterval(I(D5, D5))).null() ;         // outside, after
            t.expect7(finite.unionInterval(I(D5, D5))).is(I(D2, D5)) ;
            t.expect8(finite.intersectionInterval(I(D1, D1))).null() ;         // outside, before
            t.expect9(finite.unionInterval(I(D1, D1))).is(I(D1, D4)) ;         // [b,b] U [c,d[ = [b,d[
            t.expectA(I(D3, D3).unionInterval(I(D3, D3))).is(I(D3, D3)) ;      // keeps the date (TSRange gives an empty range at 0)
            t.expectB(I(D3, D3).intersectionInterval(I(D3, D3))).is(I(D3, D3)) ;
            t.expectC(I(D1, D1).unionInterval(I(D3, D3))).is(I(D1, D3)) ;      // TSRange gives an empty range at 0
            t.expectD(I(D1, D1).intersectionInterval(I(D3, D3))).null() ;
            t.expectE(I(D3, D3).intersectionInterval(I(D2, null))).is(I(D3, D3)) ;
            t.expectF(I(D3, D3).intersectionInterval(I(null, D3))).is(I(D3, D3)) ;
            t.expectG(I(D3, D3).intersectionInterval(I(null, D2))).null() ;
            t.expectH(I(D3, D3).unionInterval(I(null, D2))).is(I(null, D3)) ;
            t.expectI(all.intersectionInterval(I(D3, D3))).is(I(D3, D3)) ;
            t.expectJ(all.unionInterval(I(D3, D3))).is(all) ;
        }) ;

        group.unary('invalid intervals give null', async (t) => {
            const bad = I(D1, D3) ;
            bad.first = D4 ;
            t.expect0(bad.isValid).false() ;
            t.expect1(bad.unionInterval(I(D1, D2))).null() ;
            t.expect2(bad.intersectionInterval(I(D1, D5))).null() ;
            t.expect3(I(D1, D5).unionInterval(bad)).null() ;
            t.expect4(I(D1, D5).intersectionInterval(bad)).null() ;
            t.expect5(all.unionInterval(bad)).null() ;
            t.expect6(all.intersectionInterval(bad)).null() ;
            t.expect7(bad.unionInterval(bad)).null() ;
        }) ;

        group.unary('symmetry', async (t) => {
            const list = [I(D1, D3), I(D2, D4), I(D3, D5), I(D4, D5), I(D2, D2), I(D3, D3), I(D5, D5), I(D2, null), I(D4, null), I(null, D3), I(null, D1), all] ;
            let unionOK = true, intersectionOK = true, n = 0 ;
            for (const a of list) {
                for (const b of list) {
                    const u1 = a.unionInterval(b), u2 = b.unionInterval(a) ;
                    const i1 = a.intersectionInterval(b), i2 = b.intersectionInterval(a) ;
                    if (!(u1 === null ? u2 === null : u1.isEqual(u2))) { unionOK = false ; }
                    if (!(i1 === null ? i2 === null : i1.isEqual(i2))) { intersectionOK = false ; }
                    n++ ;
                }
            }
            t.expect0(n).is(list.length * list.length) ;
            t.expect1(unionOK).true() ;
            t.expect2(intersectionOK).true() ;
        }) ;

        group.unary('same results as TSRange on integer-like data', async (t) => {
            const E = (n:number) => TSDate.fromEpoch(n)! ;
            const pairs:[number, number][] = [[0, 10], [5, 15], [10, 20], [20, 30], [3, 7], [0, 0], [5, 5], [10, 10], [11, 11], [25, 25], [-5, 2]] ;
            let intersections = 0, unions = 0, disjoints = 0, failures = 0 ;
            for (const [as, ae] of pairs) {
                for (const [bs, be] of pairs) {
                    const a = I(E(as), E(ae)), b = I(E(bs), E(be)) ;
                    const ra = new TSRange(as, ae - as), rb = new TSRange(bs, be - bs) ;
                    const ri = ra.intersectionRange(rb), ii = a.intersectionInterval(b) ;
                    if (ii === null) {
                        disjoints++ ;
                        if (ri.isValid) { failures++ ; } // TSRange gives a bad range for disjoint ranges
                    }
                    else {
                        intersections++ ;
                        if (ri.location !== ii.start.timestamp - E(0).timestamp || ri.length !== ii.end.timestamp - ii.start.timestamp) { failures++ ; }
                    }
                    const ru = ra.unionRange(rb), iu = a.unionInterval(b)! ;   // empty ranges included
                    unions++ ;
                    if (ru.location !== iu.start.timestamp - E(0).timestamp || ru.length !== iu.end.timestamp - iu.start.timestamp) { failures++ ; }
                }
            }
            t.expect0(failures).is(0) ;
            t.expect1(intersections + disjoints).is(pairs.length * pairs.length) ;
            t.expect2(intersections > 0 && disjoints > 0 && unions > 0).true() ;
            // the documented particular cases
            t.expect3(new TSRange(5, 0).intersectionRange(new TSRange(0, 10))).is(new TSRange(5, 0)) ;
            t.expect4(I(E(5), E(5)).intersectionInterval(I(E(0), E(10)))).is(I(E(5), E(5))) ;
            t.expect5(new TSRange(10, 0).intersectionRange(new TSRange(0, 10))).is(new TSRange(10, 0)) ;
            t.expect6(I(E(10), E(10)).intersectionInterval(I(E(0), E(10)))).is(I(E(10), E(10))) ;
            t.expect7(new TSRange(11, 0).intersectionRange(new TSRange(0, 10)).isValid).false() ;
            t.expect8(I(E(11), E(11)).intersectionInterval(I(E(0), E(10)))).null() ;
            t.expect9(new TSRange(5, 0).unionRange(new TSRange(5, 0))).is(new TSRange(5, 0)) ; // TSRange used to lose the location ([0,0[)
            t.expectA(I(E(5), E(5)).unionInterval(I(E(5), E(5)))).is(I(E(5), E(5))) ;            // TSInterval keeps the date
            t.expectB(new TSRange(0, 5).intersectionRange(new TSRange(5, 5))).is(new TSRange(5, 0)) ; // touching
            t.expectC(I(E(0), E(5)).intersectionInterval(I(E(5), E(10)))).is(I(E(5), E(5))) ;
        }) ;
    }),
    TSTest.group("TSInterval — compare() of unbounded intervals", async (group) => {
        group.unary('an unbounded interval overlapping a bounded one is not ordered', async (t) => {
            const m = (mo:number) => new TSDate(2024, mo, 1) ;
            const janMar = new TSInterval(m(1), m(3)) ;
            t.expect0(new TSInterval(m(2), null).compare(janMar)).undef() ;     // [Feb, +inf)
            t.expect1(new TSInterval(null, m(2)).compare(janMar)).undef() ;     // (-inf, Feb)
            t.expect2(new TSInterval(null, null).compare(janMar)).undef() ;     // (-inf, +inf)
            t.expect3(janMar.compare(new TSInterval(m(2), null))).undef() ;     // symmetric
            t.expect4(new TSInterval(m(3), null).compare(janMar)).is(Descending) ;
            t.expect5(new TSInterval(null, m(1)).compare(janMar)).is(Ascending) ;
        }) ;
    }),
] ;