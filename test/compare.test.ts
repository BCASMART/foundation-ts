import { $compare, $datecompare, $equal, $numcompare } from "../src/compare";
import { $arrayBufferFromBuffer } from "../src/data";
import { TSDate } from "../src/tsdate";
import { TSTest } from "../src/tstester";
import { Ascending, Descending, Same, UINT_MAX } from "../src/types";

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

    group.unary("verifying $datecompare(a,b)", async(t) => {
        t.expect1($datecompare(S, D)).toBe(Same);
        t.expect2($datecompare(S, T)).toBe(Same);
        t.expect3($datecompare(T, D)).toBe(Same);
        t.expect4($datecompare(S, null)).toBeUndefined();
        t.expect5($datecompare(null, null)).toBeUndefined();
        t.expect6($datecompare(null, D)).toBeUndefined();
        t.expect7($datecompare(A, D)).toBe(Descending);
        t.expect8($datecompare(T, A)).toBe(Ascending);
    }) ;

    group.unary("verifying $compare(a,b)", async(t) => {
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
        t.expectB($compare($arrayBufferFromBuffer(B1), $arrayBufferFromBuffer(B1))).toBe(Same);
        t.expectC($compare($arrayBufferFromBuffer(B1), $arrayBufferFromBuffer(B2))).toBe(Descending);
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

    group.unary("verifying $equal(a,b)", async(t) => {
        t.expectA($equal(1, 1)).toBeTruthy();
        t.expectB($equal(1, 2)).toBeFalsy();
        t.expectC($equal(0, NaN)).toBeFalsy();
        t.expectD($equal(NaN, NaN)).toBeFalsy();
        t.expectE($equal(NaN, 0)).toBeFalsy();
        t.expectF($equal(S1, S1)).toBeTruthy();
        t.expectG($equal(B1, B1)).toBeTruthy();
        t.expectH($equal(B1, B2)).toBeFalsy();
        t.expectI($equal(['A', 'B'], [])).toBeFalsy();
        t.expectJ($equal(['A', 'B'], ['A', 'BBB'])).toBeFalsy();
        t.expectK($equal(['A', 727], ['A', 727])).toBeTruthy();
        t.expectL($equal([T, D], [D, T])).toBeTruthy();
    }) ;

    group.unary("verifying $numcompare(a,b)", async(t) => {
        t.expect1($numcompare(1, 1)).toBe(Same);
        t.expect2($numcompare(1, 2)).toBe(Ascending);
        t.expect3($numcompare(0, -2)).toBe(Descending);
        t.expect4($numcompare(0, NaN)).toBeUndefined();
        t.expect5($numcompare(NaN, NaN)).toBeUndefined();
        t.expect6($numcompare(NaN, 0)).toBeUndefined();
        t.expect7($numcompare(-Infinity, 0)).toBe(Ascending);
        t.expect8($numcompare(0, Infinity)).toBe(Ascending);
        t.expect9($numcompare(-Infinity, NaN)).toBe(undefined);
        t.expectA($numcompare(NaN, Infinity)).toBe(undefined);
        t.expectA($numcompare(-Infinity, Infinity)).toBe(Ascending);
        t.expectB($numcompare(Infinity, -Infinity)).toBe(Descending);
        t.expectB($numcompare(Infinity, UINT_MAX)).toBe(Descending);
        t.expectC($numcompare(100, -Infinity)).toBe(Descending);
        t.expectD($numcompare(Infinity, Infinity)).toBe(Same);
        t.expectE($numcompare(-Infinity, -Infinity)).toBe(Same);
    }) ;

}) ;
