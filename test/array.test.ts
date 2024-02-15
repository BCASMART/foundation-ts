import { $average, $first, $includesequal, $includesvisual, $last, $map, $arrayset, $max, $min, $sum } from "../src/array";
import { $count, $defined, $ok } from "../src/commons";
import { TSTest } from "../src/tstester";
import { TSUnicity } from "../src/types";

export const arrayGroups = TSTest.group("Commons array functions", async (group) => {
    group.unary("functions $map(), $arrayset(), $includesequal(), $includesvisual", async(t) => {
        let array:string[] = [] ;
        array[3] = '3' ;
        array[5] = '5' ;
        t.register("array", array) ;
        t.expect1($map([1, 5, null, 6, 'A', undefined], e => e)).is([1, 5, 6, 'A']);
        t.expect2([1, 5, null, 6, 'A', undefined].filteredMap(e => $ok(e) ? e!.toString() : undefined)).is(['1', '5', '6', 'A']);
        t.expect3(array.filteredMap(e => e)).is(['3','5']) ;
        t.expect4(array.filteredMap((e,i) => $defined(e) ? null : `<undef ${i}>`))
         .is(['<undef 0>','<undef 1>', '<undef 2>','<undef 4>']) ;
        
        const source = [1, 5, null, 6, 'A', undefined, 5, "1"] ;
        t.expectA($map(source, e => e)).is([1, 5, 6, 'A', 5, "1"]);
        t.expectB($map(source, { unicity:TSUnicity.Objects })).is([1, 5, 6, 'A', "1"]);
        t.expectC($map(source, { unicity:TSUnicity.Equality })).is([1, 5, 6, 'A', "1"]);
        t.expectD($map(source, { unicity:TSUnicity.Visual })).is([1, 5, 6, 'A']);

        t.expectL($includesequal(source, null)).true();
        t.expectM($includesequal(source, undefined)).true();
        t.expectN($includesequal(source, 1)).true();
        t.expectO($includesequal(source, "1")).true();
        t.expectP($includesequal(source, "5")).false();

        t.expectS($includesvisual(source, null)).true();
        t.expectT($includesvisual(source, undefined)).true();
        t.expectU($includesvisual(source, 1)).true();
        t.expectV($includesvisual(source, "1")).true();
        t.expectW($includesvisual(source, "5")).true();

        t.expectZ($arrayset(source)).is(new Set([1, 5, 6, 'A', "1"])) ;
    }) ;

    group.unary("functions $count(), $min(), $max(), $sum(), $average(), $first() and $last()", async(t) => {
        const values =  [1, 4, 6, '10', '-4', undefined, null, 7] ;
        const values1 = [1, 4, 6, 10, -4, 7] ;
        const values2 = [1, 4, 6, null, undefined, 7, {a:-1,b:20}, null] ;
        const values3 = [3, {a:1, b:2}] ;

        t.register('values', values) ;
        t.register('values1', values1) ;
        t.register('values2', values2) ;
        t.register('values3', values2) ;

        t.expect0(values.first()).is(1) ;
        t.expect1(values.last()).is(7) ;
        t.expect2($sum(values)).is(24) ;
        t.expect3($average(values)).is(3) ;
        t.expect4([].sum()).is(0) ;
        t.expect5([].average()).toBeUndefined() ;
        t.expect7(values2.last()).null() ;
        t.expect8(values2.sum()).toBeUndefined() ;
        t.expect9(values2.average()).toBeUndefined() ;
        t.expectA($sum(null)).is(0) ;
        t.expectB($sum(undefined)).is(0) ;
        t.expectA($average(null)).toBeUndefined() ;
        t.expectB($average(undefined)).toBeUndefined() ;
        t.expectC($first(null)).undef() ;
        t.expectD($first(undefined)).undef() ;
        t.expectE($first([])).undef() ;
        t.expectF($last(null)).undef() ;
        t.expectG($last(undefined)).undef() ;
        t.expectH($last([])).undef() ;
        t.expectI($count(null)).is(0) ;
        t.expectJ($count(undefined)).is(0) ;
        t.expectK($count([])).is(0) ;
        t.expectL(values.min()).toBeUndefined() ;
        t.expectM(values.max()).toBeUndefined() ;
        t.expectN(values1.sum()).is(values.sum()) ;
        t.expectO(values1.average()).is(4) ;
        t.expectP(values.average({countsOnlyOKItems:true})).is(values1.average())
        t.expectQ(values1.average({countsOnlyOKItems:true})).is(values1.average())
        t.expectR(values1.min()).is(-4) ;
        t.expectS(values1.max()).is(10) ;
        t.expectT($min(values2)).toBeUndefined() ;
        t.expectU($max(values2)).toBeUndefined() ;
        t.expectV(values3.min()).toBeUndefined() ;
        t.expectW(values3.max()).toBeUndefined() ;
    }) ;

    group.unary("Array.singular() method", async (t) => {
        t.expect0([].singular()).false() ;
        t.expect1([10].singular()).true() ;
        t.expect2([45,12].singular()).false() ;
        t.expect3([undefined].singular()).true() ;
        t.expect4(["45",undefined].singular()).false() ;
        t.expect5([undefined,333].singular()).false() ;
        t.expect6([undefined,undefined].singular()).false() ;
    }) ;

}) ;


