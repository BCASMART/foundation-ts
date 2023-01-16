import { $compare, $datecompare, $equal, $numcompare, $order, $unorderedEqual, $visualcompare, $visualequal } from "../src/compare";
import { $arrayBufferFromBytes } from "../src/data";
import { TSDate } from "../src/tsdate";
import { TSTest } from "../src/tstester";
import { Ascending, Descending, Same, UINT_MAX } from "../src/types";

/**
 * Group name: 'compare'
 */

export const compareGroups = TSTest.group("Comparison functions", async (group) => {
    const S1 = "Texte accentué avec ça et c'est shön";
    const S2 = "Texte accentue avec ca et c'est shon";
    const S = "1966-04-13T12:05:22";
    const B1 = Buffer.from(S1, 'utf8');
    const B2 = Buffer.from(S2, 'utf8');
    const A = "1984-06-11";
    const AT = new TSDate(A);
    const D = new Date(1966, 3, 13, 12, 5, 22);
    const T = new TSDate(1966, 4, 13, 12, 5, 22);

    group.unary("$datecompare() function", async(t) => {
        t.expect1($datecompare(S, D)).is(Same);
        t.expect2($datecompare(S, T)).is(Same);
        t.expect3($datecompare(T, D)).is(Same);
        t.expect4($datecompare(S, null)).undef();
        t.expect5($datecompare(null, null)).undef();
        t.expect6($datecompare(null, D)).undef();
        t.expect7($datecompare(A, D)).is(Descending);
        t.expect8($datecompare(T, A)).is(Ascending);
    }) ;

    group.unary("$compare() function", async(t) => {
        t.expect1($compare(1, 1)).toBe(Same);
        t.expect2($compare(1, 2)).toBe(Ascending);
        t.expect3($compare(0, -2)).toBe(Descending);
        t.expect4($compare(0, NaN)).toBeUndefined();
        t.expect5($compare(NaN, NaN)).toBeUndefined();
        t.expect6($compare(NaN, 0)).toBeUndefined();
        t.expect7($compare(S1, S1)).toBe(Same);
        t.expect8($compare(S1, S2)).toBe(Descending);
        t.expect9($compare(B1, B1)).toBe(Same);
        t.expectA($compare(B1, B2)).toBe(Descending);
        t.expectB($compare($arrayBufferFromBytes(B1), $arrayBufferFromBytes(B1))).toBe(Same);
        t.expectC($compare($arrayBufferFromBytes(B1), $arrayBufferFromBytes(B2))).toBe(Descending);
        t.expectD($compare(T, D)).toBe(Same);
        t.expectE($compare(D, null)).toBeUndefined();
        t.expectF($compare(null, null)).toBeUndefined();
        t.expectG($compare(null, D)).toBeUndefined();
        t.expectH($compare(AT, D)).toBe(Descending);
        t.expectI($compare(T, AT)).toBe(Ascending);
        t.expectJ($compare(['A', 'B'], [])).toBe(Descending);
        t.expectK($compare(['A', 'B'], ['A', 'BBB'])).toBe(Ascending);
        t.expectL($compare([T, D], [D, T])).toBe(Same);
    }) ;

    group.unary("$order() function", async(t) => {
        t.expect1($order(1, 1)).toBe(Same);
        t.expect2($order(1, 2)).toBe(Ascending);
        t.expect3($order(0, -2)).toBe(Descending);
        t.expect4($order(0, NaN)).toBe(Descending);
        t.expect5($order(NaN, NaN)).toBe(Same);
        t.expect6($order(NaN, 0)).toBe(Ascending);
        t.expect7($order(S1, S1)).toBe(Same);
        t.expect8($order(S1, S2)).toBe(Descending);
        t.expect9($order(B1, B1)).toBe(Same);
        t.expectA($order(B1, B2)).toBe(Descending);
        t.expectB($order($arrayBufferFromBytes(B1), $arrayBufferFromBytes(B1))).toBe(Same);
        t.expectC($order($arrayBufferFromBytes(B1), $arrayBufferFromBytes(B2))).toBe(Descending);
        t.expectD($order(T, D)).toBe(Same);
        t.expectE($order(D, null)).toBe(Descending);
        t.expectF($order(null, null)).toBe(Same);
        t.expectG($order(null, D)).toBe(Ascending);
        t.expectH($order(AT, D)).toBe(Descending);
        t.expectI($order(T, AT)).toBe(Ascending);
        t.expectJ($order(['A', 'B'], [])).toBe(Descending);
        t.expectK($order(['A', 'B'], ['A', 'BBB'])).toBe(Ascending);
        t.expectL($order([T, D], [D, T])).toBe(Same);
        /**
         * since NaN is considered as a non defined value, everything is larger
         * or smaller than NaN
         */
        t.expectM($order(NaN, Infinity)).toBe(Ascending);
        t.expectN($order(Infinity, NaN)).toBe(Descending);
        t.expectO($order(-Infinity, NaN)).toBe(Descending);
        t.expectP($order(-Infinity, Infinity)).toBe(Ascending);
        t.expectQ($order(-Infinity, -Infinity)).toBe(Same);
        t.expectR($order(Infinity, Infinity)).toBe(Same);
        t.expectS($order(Infinity, -Infinity)).toBe(Descending);
        t.expectT($order(NaN, -Infinity)).toBe(Ascending);
        t.expectU($order(undefined, -Infinity)).toBe(Ascending);
        t.expectV($order(null, -Infinity)).toBe(Ascending);
        t.expectW($order(undefined, null)).toBe(Same);
        t.expectX($order(undefined, undefined)).toBe(Same);
    }) ;

    group.unary("$equal() function", async(t) => {
        t.expectA($equal(1, 1)).true();
        t.expectB($equal(1, 2)).toBeFalsy();
        t.expectC($equal(0, NaN)).toBeFalsy();
        t.expectD($equal(NaN, NaN)).toBeFalsy();
        t.expectE($equal(NaN, 0)).toBeFalsy();
        t.expectF($equal(S1, S1)).true();
        t.expectG($equal(B1, B1)).true();
        t.expectH($equal(B1, B2)).toBeFalsy();
        t.expectI($equal(['A', 'B'], [])).toBeFalsy();
        t.expectJ($equal(['A', 'B'], ['A', 'BBB'])).toBeFalsy();
        t.expectK($equal(['A', 727], ['A', 727])).true();
        t.expectL($equal([T, D], [D, T])).true();
    }) ;

    group.unary("$numcompare() function", async(t) => {
        t.expect1($numcompare(1, 1)).is(Same);
        t.expect2($numcompare(1, 2)).is(Ascending);
        t.expect3($numcompare(0, -2)).is(Descending);
        t.expect4($numcompare(0, NaN)).undef();
        t.expect5($numcompare(NaN, NaN)).undef();
        t.expect6($numcompare(NaN, 0)).undef();
        t.expect7($numcompare(-Infinity, 0)).is(Ascending);
        t.expect8($numcompare(0, Infinity)).is(Ascending);
        t.expect9($numcompare(-Infinity, NaN)).undef();
        t.expectA($numcompare(NaN, Infinity)).undef();
        t.expectA($numcompare(-Infinity, Infinity)).is(Ascending);
        t.expectB($numcompare(Infinity, -Infinity)).is(Descending);
        t.expectB($numcompare(Infinity, UINT_MAX)).is(Descending);
        t.expectC($numcompare(100, -Infinity)).is(Descending);
        t.expectD($numcompare(Infinity, Infinity)).is(Same);
        t.expectE($numcompare(-Infinity, -Infinity)).is(Same);
    }) ;

    group.unary("$visualequal() function", async(t) => {
        t.expect1($visualequal(123, '  \n123\t')).true() ;
        t.expect2($visualequal('Je ne sais pas pourquoi la pluie ©', '  JE\n ñe\t  SAIS PaS pourquoi là Pluie (c)\t\t\t')).true() ;
    }) ;

    group.unary("$visualcompare() and $visualorder() function", async(t) => {
        t.expect1($visualcompare(123, '  \n123\t')).is(Same) ;
        t.expect2($visualcompare('Je ne sais pas pourquoi la pluie ©', '  Je\n ne\t  SAIS PaS pourquoi là Pluie (c)\t\t\t')).is(Same) ;
        t.expect3($visualcompare(1421, '009999')).is(Descending) ;
        t.expect3($visualcompare('à plus tard', 'B minus')).is(Ascending) ;
    }) ;

    group.unary("$unorderedEqual() function", async(t) => {
        t.expect1($unorderedEqual(['a', 'b', 1, 33, null], [null, 'b', 1, 'a', 33])).true() ;
        t.expect2($unorderedEqual(['a', 'b', 1, 33, null], [null, 'b', 1, 'a', 33, 33])).false() ;
    })
}) ;
