import { $average, $first, $last, $map, $max, $min, $sum } from "../src/array";
import { $count, $defined, $ok } from "../src/commons";
import { TSTest } from "../src/tstester";

export const arrayGroups = TSTest.group("Commons array functions", async (group) => {
    group.unary("verifying $map<T,R>(x)", async(t) => {
        let array:string[] = [] ;
        array[3] = '3' ;
        array[5] = '5' ;
        t.register("array", array) ;
        t.expect1($map([1, 5, null, 6, 'A', undefined], e => e)).toBe([1, 5, 6, 'A']);
        t.expect2([1, 5, null, 6, 'A', undefined].filteredMap(e => $ok(e) ? e!.toString() : undefined)).toBe(['1', '5', '6', 'A']);
        t.expect3(array.filteredMap(e => e)).toBe(['3','5']) ;
        t.expect4(array.filteredMap((e,i) => $defined(e) ? null : `<undef ${i}>`))
         .toBe(['<undef 0>','<undef 1>', '<undef 2>','<undef 4>']) ;
    }) ;

    group.unary("verifying $count(), $min(), $max(), $sum(), $average(), $first() and $last() functions", async(t) => {
        const values =  [1, 4, 6, '10', '-4', undefined, null, 7] ;
        const values1 = [1, 4, 6, 10, -4, 7] ;
        const values2 = [1, 4, 6, null, undefined, 7, {a:-1,b:20}, null] ;
        const values3 = [3, {a:1, b:2}] ;

        t.register('values', values) ;
        t.register('values1', values1) ;
        t.register('values2', values2) ;
        t.register('values3', values2) ;

        t.expect0(values.first()).toBe(1) ;
        t.expect1(values.last()).toBe(7) ;
        t.expect2($sum(values)).toBe(24) ;
        t.expect3($average(values)).toBe(3) ;
        t.expect4([].sum()).toBe(0) ;
        t.expect5([].average()).toBeUndefined() ;
        t.expect7(values2.last()).toBeNull() ;
        t.expect8(values2.sum()).toBeUndefined() ;
        t.expect9(values2.average()).toBeUndefined() ;
        t.expectA($sum(null)).toBe(0) ;
        t.expectB($sum(undefined)).toBe(0) ;
        t.expectA($average(null)).toBeUndefined() ;
        t.expectB($average(undefined)).toBeUndefined() ;
        t.expectC($first(null)).toBe(undefined) ;
        t.expectD($first(undefined)).toBe(undefined) ;
        t.expectE($first([])).toBe(undefined) ;
        t.expectF($last(null)).toBe(undefined) ;
        t.expectG($last(undefined)).toBe(undefined) ;
        t.expectH($last([])).toBe(undefined) ;
        t.expectI($count(null)).toBe(0) ;
        t.expectJ($count(undefined)).toBe(0) ;
        t.expectK($count([])).toBe(0) ;
        t.expectL(values.min()).toBeUndefined() ;
        t.expectM(values.max()).toBeUndefined() ;
        t.expectN(values1.sum()).toBe(values.sum()) ;
        t.expectO(values1.average()).toBe(4) ;
        t.expectP(values.average({countsOnlyOKItems:true})).toBe(values1.average())
        t.expectQ(values1.average({countsOnlyOKItems:true})).toBe(values1.average())
        t.expectR(values1.min()).toBe(-4) ;
        t.expectS(values1.max()).toBe(10) ;
        t.expectT($min(values2)).toBeUndefined() ;
        t.expectU($max(values2)).toBeUndefined() ;
        t.expectV(values3.min()).toBeUndefined() ;
        t.expectW(values3.max()).toBeUndefined() ;
    }) ;
}) ;


