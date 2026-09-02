import { $average, $first, $includesequal, $includesvisual, $last, $map, $arrayset, $max, $min, $sum } from "../src/array";
import { $count, $defined, $ok } from "../src/commons";
import { TSTest } from "../src/tstester";
import { Ascending, Descending, Same, TSUnicity } from "../src/types";

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

    group.unary("$map() / $arrayset() over non-array iterables and options forms", async(t) => {
        function* gen() { yield 1 ; yield 2 ; yield 3 ; yield 2 ; }
        t.expect0($map(new Set([1, 2, 3]), e => e * 10)).is([10, 20, 30]) ;
        t.expect1($map(gen(), e => e)).is([1, 2, 3, 2]) ;
        t.expect2($map("abc", c => c.toUpperCase())).is(["A", "B", "C"]) ;   // strings are iterable
        // options object with an explicit callback + unicity
        t.expect3($map(gen(), { callback:e => e, unicity:TSUnicity.Equality })).is([1, 2, 3]) ;
        // the index argument is the running index over the iterable
        t.expect4($map(["a", "b", "c"], (_, i) => i)).is([0, 1, 2]) ;
        t.expect5($arrayset(gen())).is(new Set([1, 2, 3])) ;
        t.expect6($arrayset(new Set([1, 2]), e => e % 2 === 0 ? e : null)).is(new Set([2])) ;
        t.expect7($map(null, e => e)).is([]) ;
        t.expect8($arrayset(undefined)).is(new Set()) ;
    }) ;

    group.unary("$sum() numeric coercion via valueOf / Symbol.toPrimitive", async(t) => {
        t.expect0($sum([1, { valueOf:():number => 10 }, 2])).is(13) ;
        t.expect1($sum([new Date(1000), new Date(2000)])).is(3000) ;      // Date -> primitive number
        t.expect2($sum(["1", "2", "3"])).is(6) ;                          // numeric strings
        t.expect3($sum(["1", "not-a-number"])).undef() ;                  // one bad conversion kills the sum
        t.expect4($sum([1, null, undefined, 2])).is(3) ;                  // null/undefined counted as 0
        t.expect5($sum([{ valueOf:():string => "oops" }])).undef() ;
    }) ;

    group.unary("$average() count options", async(t) => {
        const v = [2, 4, null, undefined, 6] ;                            // sum 12
        t.expect0($average(v)).is(12 / 5) ;                               // default: counts everything
        t.expect1($average(v, { countsOnlyDefinedItems:true })).is(12 / 4) ; // excludes undefined only
        t.expect2($average(v, { countsOnlyOKItems:true })).is(12 / 3) ;   // excludes null and undefined
        t.expect3($average([])).undef() ;
    }) ;

    group.unary("$min() / $max() ordering, single element, strings", async(t) => {
        t.expect0($min([5])).is(5) ;
        t.expect1($max([5])).is(5) ;
        t.expect2($min([3, 1, 2])).is(1) ;
        t.expect3($max([3, 1, 2])).is(3) ;
        t.expect4($min(["banana", "apple", "cherry"])).is("apple") ;
        t.expect5($max(["banana", "apple", "cherry"])).is("cherry") ;
        t.expect6($min([])).undef() ;
        t.expect7($max(null)).undef() ;
        t.expect8($min([1, null, 2])).undef() ;                           // a nullish element voids the result
    }) ;

    group.unary("Array.prototype.compare() / isEqual()", async(t) => {
        t.expect0([1, 2, 3].isEqual([1, 2, 3])).true() ;
        t.expect1([1, 2, 3].isEqual([1, 2])).false() ;
        t.expect2([1, 2, 3].isEqual([1, 2, 4])).false() ;
        t.expect3([1, 2, 3].isEqual("not an array" as any)).false() ;
        t.expect4([1, 2, 3].compare([1, 2, 3])).is(Same) ;
        t.expect5([1, 2, 3].compare([1, 2, 4])).is(Ascending) ;
        t.expect6([1, 2, 4].compare([1, 2, 3])).is(Descending) ;
        t.expect7([1, 2].compare([1, 2, 3])).is(Ascending) ;              // shorter prefix sorts first
        t.expect8([1, 2, 3].compare([1, 2])).is(Descending) ;
        t.expect9([1, 2, 3].compare({} as any)).undef() ;
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


