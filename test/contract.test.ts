// P3 #8 / #7 : the TSObject equality / comparison / clone algebra, run uniformly
// over every foundation-ts value type that claims to implement it.

import "../src/array" ;
import "../src/date" ;
import { $compare, $equal } from "../src/compare";
import { TSColor } from "../src/tscolor";
import { TSCouple } from "../src/tscouple";
import { TSData } from "../src/tsdata";
import { TSDate } from "../src/tsdate";
import { TSInterval } from "../src/tsinterval";
import { TSList } from "../src/tslist";
import { TSRange } from "../src/tsrange";
import { TSTest } from "../src/tstester";
import { Ascending, Descending, Same } from "../src/types";
import { ForeignValues } from "./boundaries";

interface ContractCase {
    name:string ;
    a:any ;
    equalToA:any ;          // distinct instance, equal value
    greaterThanA:any ;      // strictly ordered after `a`
}

const cases:ContractCase[] = [
    { name:"TSDate",   a:new TSDate(2024, 1, 1),           equalToA:new TSDate(2024, 1, 1),           greaterThanA:new TSDate(2024, 6, 1) },
    { name:"Date",     a:new Date(2024, 0, 1),             equalToA:new Date(2024, 0, 1),             greaterThanA:new Date(2024, 5, 1) },
    { name:"TSCouple", a:new TSCouple(1, "a"),             equalToA:new TSCouple(1, "a"),             greaterThanA:new TSCouple(2, "a") },
    { name:"TSList",   a:new TSList([1, 2, 3]),            equalToA:new TSList([1, 2, 3]),            greaterThanA:new TSList([1, 2, 4]) },
    { name:"TSRange",  a:new TSRange(0, 3),                equalToA:new TSRange(0, 3),                greaterThanA:new TSRange(5, 3) },
    { name:"TSData",   a:TSData.fromString("aaa"),         equalToA:TSData.fromString("aaa"),         greaterThanA:TSData.fromString("aab") },
    { name:"TSColor",  a:TSColor.rgb(10, 20, 30),          equalToA:TSColor.rgb(10, 20, 30),          greaterThanA:TSColor.rgb(200, 20, 30) },
    // TSInterval.compare() is a *partial* (precedence) order: it only orders disjoint
    // intervals, so the ordered pair below must not overlap.
    { name:"TSInterval",
      a:new TSInterval(new TSDate(2024, 1, 1), new TSDate(2024, 2, 1)),
      equalToA:new TSInterval(new TSDate(2024, 1, 1), new TSDate(2024, 2, 1)),
      greaterThanA:new TSInterval(new TSDate(2024, 3, 1), new TSDate(2024, 4, 1)) },
] ;

export const contractGroups = TSTest.group("TSObject equality / comparison / clone contract", async (group) => {

    for (const c of cases) {
        group.unary(`${c.name} : isEqual() / compare() algebra`, async(t) => {
            const { a, equalToA: eq, greaterThanA: gt } = c ;

            // isEqual : reflexive, symmetric, consistent with $equal
            t.expect0(a.isEqual(a)).true() ;
            t.expect1(a.isEqual(eq)).true() ;
            t.expect2(eq.isEqual(a)).true() ;
            t.expect3(a.isEqual(gt)).false() ;
            t.expect4(gt.isEqual(a)).false() ;
            t.expect5($equal(a, eq)).true() ;
            t.expect6($equal(a, gt)).false() ;

            // compare : Same <=> isEqual, antisymmetric ordering, agrees with $compare
            t.expect7(a.compare(a)).is(Same) ;
            t.expect8(a.compare(eq)).is(Same) ;
            t.expect9(a.compare(gt)).is(Ascending) ;
            t.expectA(gt.compare(a)).is(Descending) ;
            t.expectB($compare(a, eq)).is(Same) ;
            t.expectC($compare(a, gt)).is(Ascending) ;
            t.expectD($compare(gt, a)).is(Descending) ;

            // foreign values : never equal, compare() is undefined, never throws
            for (let i = 0 ; i < ForeignValues.length ; i++) {
                const f = ForeignValues[i] ;
                t.expect(a.isEqual(f), `${c.name}.isEqual(foreign#${i})`).false() ;
                t.expect(a.compare(f), `${c.name}.compare(foreign#${i})`).undef() ;
            }
        }) ;

        group.unary(`${c.name} : clone() equivalence`, async(t) => {
            const a = c.a ;
            if (typeof a.clone !== "function") { t.expect0(true).true() ; return ; }
            const cl = a.clone() ;
            // immutable value types are allowed to return `this` from clone(); what
            // matters is that the result is equal by value in every way.
            t.expect0(cl.isEqual(a)).true() ;
            t.expect1(a.isEqual(cl)).true() ;
            t.expect2($equal(a, cl)).true() ;
            t.expect3(cl.compare(a)).is(Same) ;
        }) ;
    }
}) ;
