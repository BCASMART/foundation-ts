import { $equal } from "../src/compare";
import { TSCouple } from "../src/tscouple";
import { TSDate } from "../src/tsdate";
import { TSTest } from "../src/tstester";
import { Ascending, Descending, Same } from "../src/types";

export const coupleGroups = TSTest.group("TSCouple class", async (group) => {

    group.unary("construction, iteration, toArray() & toJSON()", async(t) => {
        const c = new TSCouple<string, number>("a", 3) ;
        t.expect0(c.first).is("a") ;
        t.expect1(c.second).is(3) ;
        t.expect2(c.toArray()).is(["a", 3]) ;
        t.expect3([...c]).is(["a", 3]) ;
        t.expect4(c.toJSON()).is({ first:"a", second:3 }) ;
        // toJSON() unwraps TSObject members through $jsonobj
        const d = new TSCouple(new TSDate(2024, 1, 1), "x") ;
        t.expect5(d.toJSON().second).is("x") ;
        t.expect6(d.toString().length).gt(0) ;
    }) ;

    group.unary("clone() is a shallow, independent copy", async(t) => {
        const c = new TSCouple<number, number[]>(1, [2, 3]) ;
        const cc = c.clone() ;
        t.expect0(cc).is(c) ;
        t.expect1(cc === c).false() ;
        t.expect2(cc.second === c.second).true() ;   // shallow: the array is shared
        cc.first = 99 ;
        t.expect3(c.first).is(1) ;                   // but the couple itself is independent
    }) ;

    group.unary("isEqual()", async(t) => {
        const c = new TSCouple("a", 1) ;
        t.expect0(c.isEqual(c)).true() ;
        t.expect1(c.isEqual(new TSCouple("a", 1))).true() ;
        t.expect2(c.isEqual(new TSCouple("a", 2))).false() ;
        t.expect3(c.isEqual(new TSCouple("b", 1))).false() ;
        t.expect4(c.isEqual(["a", 1])).false() ;      // a tuple is not a TSCouple
        t.expect5(c.isEqual(null)).false() ;
        t.expect6(c.isEqual(undefined)).false() ;
        // nested TSObject members are compared by value
        const e = new TSCouple(new TSDate(2024, 1, 1), 1) ;
        t.expect7(e.isEqual(new TSCouple(new TSDate(2024, 1, 1), 1))).true() ;
        // $equal() free function must agree with the method
        t.expect8($equal(c, new TSCouple("a", 1))).true() ;
        t.expect9($equal(c, new TSCouple("a", 2))).false() ;
    }) ;

    group.unary("compare()", async(t) => {
        const c = new TSCouple(1, 1) ;
        t.expect0(c.compare(c)).is(Same) ;
        t.expect1(c.compare(new TSCouple(1, 1))).is(Same) ;
        t.expect2(c.compare(new TSCouple(2, 0))).is(Ascending) ;   // first decides
        t.expect3(c.compare(new TSCouple(0, 9))).is(Descending) ;
        t.expect4(c.compare(new TSCouple(1, 2))).is(Ascending) ;   // first equal -> second decides
        t.expect5(c.compare(new TSCouple(1, 0))).is(Descending) ;
        t.expect6(c.compare("not a couple" as any)).undef() ;
        t.expect7(c.compare(null)).undef() ;
        // non-comparable members -> undefined
        t.expect8(new TSCouple({}, 1).compare(new TSCouple({}, 2))).undef() ;
    }) ;
}) ;
