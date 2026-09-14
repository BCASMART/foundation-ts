import { $arraycompare, $arrayequal, $bytescompare, $bytesequal, $bytesorder, $compare, $datecompare, $dateorder, $equal, $mapequal, $numcompare, $numorder, $order, $setequal, $unorderedEqual, $visualcompare, $visualequal, $visualorder } from "../src/compare";
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
    const DM = new Date(1966, 3, 13, 12, 5, 22, 10);

    group.unary("$datecompare() function", async(t) => {
        t.expect1($datecompare(S, D)).is(Same);
        t.expect2($datecompare(S, T)).is(Same);
        t.expect3($datecompare(T, D)).is(Same);
        t.expect4($datecompare(S, null)).undef();
        t.expect5($datecompare(null, null)).undef();
        t.expect6($datecompare(null, D)).undef();
        t.expect7($datecompare(A, D)).is(Descending);
        t.expect8($datecompare(T, A)).is(Ascending);
        t.expect9($datecompare(D, DM)).is(Ascending) ;
        t.expectA($datecompare(DM, D)).is(Descending) ;
        t.expectB($datecompare(T, DM)).is(Ascending) ;
        t.expectC($datecompare(DM, T)).is(Descending) ;
        t.expectD($datecompare(DM, NaN)).undef() ;
        t.expectE($datecompare(T, NaN)).undef() ;
        t.expectF($datecompare(NaN, D)).undef() ;
        t.expectG($datecompare(undefined, D)).undef() ;
        t.expectH($datecompare(D, null)).undef() ;
        t.expectI($datecompare(T, null)).undef() ;
        t.expectJ($datecompare(null, T)).undef() ;
        t.expectK(DM.compare(D)).is(Descending) ; // internaly use $datecompare() 
        t.expectL(T.compare(DM)).is(Ascending) ;  // idem
        t.expectM(D.compare(T)).is(Same) ;        // idem
        t.expectN(T.compare(D)).is(Same) ;        // idem
        t.expectO(D.isEqual(T)).true() ;          // idem
        t.expectP(T.isEqual(D)).true() ;          // idem
        t.expectO(DM.isEqual(T)).false() ;        // idem
        t.expectP(T.isEqual(DM)).false() ;        // idem
    }) ;

    group.unary("$compare() function", async(t) => {
        t.expect1($compare(1, 1)).is(Same);
        t.expect2($compare(1, 2)).is(Ascending);
        t.expect3($compare(0, -2)).is(Descending);
        t.expect4($compare(0, NaN)).toBeUndefined();
        t.expect5($compare(NaN, NaN)).toBeUndefined();
        t.expect6($compare(NaN, 0)).toBeUndefined();
        t.expect7($compare(S1, S1)).is(Same);
        t.expect8($compare(S1, S2)).is(Descending);
        t.expect9($compare(B1, B1)).is(Same);
        t.expectA($compare(B1, B2)).is(Descending);
        t.expectB($compare($arrayBufferFromBytes(B1), $arrayBufferFromBytes(B1))).is(Same);
        t.expectC($compare($arrayBufferFromBytes(B1), $arrayBufferFromBytes(B2))).is(Descending);
        t.expectD($compare(T, D)).is(Same);
        t.expectE($compare(D, null)).toBeUndefined();
        t.expectF($compare(null, null)).toBeUndefined();
        t.expectG($compare(null, D)).toBeUndefined();
        t.expectH($compare(AT, D)).is(Descending);
        t.expectI($compare(T, AT)).is(Ascending);
        t.expectJ($compare(['A', 'B'], [])).is(Descending);
        t.expectK($compare(['A', 'B'], ['A', 'BBB'])).is(Ascending);
        t.expectL($compare([T, D], [D, T])).is(Same);
    }) ;

    group.unary("$order() function", async(t) => {
        t.expect1($order(1, 1)).is(Same);
        t.expect2($order(1, 2)).is(Ascending);
        t.expect3($order(0, -2)).is(Descending);
        t.expect4($order(0, NaN)).is(Descending);
        t.expect5($order(NaN, NaN)).is(Same);
        t.expect6($order(NaN, 0)).is(Ascending);
        t.expect7($order(S1, S1)).is(Same);
        t.expect8($order(S1, S2)).is(Descending);
        t.expect9($order(B1, B1)).is(Same);
        t.expectA($order(B1, B2)).is(Descending);
        t.expectB($order($arrayBufferFromBytes(B1), $arrayBufferFromBytes(B1))).is(Same);
        t.expectC($order($arrayBufferFromBytes(B1), $arrayBufferFromBytes(B2))).is(Descending);
        t.expectD($order(T, D)).is(Same);
        t.expectE($order(D, null)).is(Descending);
        t.expectF($order(null, null)).is(Same);
        t.expectG($order(null, D)).is(Ascending);
        t.expectH($order(AT, D)).is(Descending);
        t.expectI($order(T, AT)).is(Ascending);
        t.expectJ($order(['A', 'B'], [])).is(Descending);
        t.expectK($order(['A', 'B'], ['A', 'BBB'])).is(Ascending);
        t.expectL($order([T, D], [D, T])).is(Same);
        /**
         * since NaN is considered as a non defined value, everything is larger
         * or smaller than NaN
         */
        t.expectM($order(NaN, Infinity)).is(Ascending);
        t.expectN($order(Infinity, NaN)).is(Descending);
        t.expectO($order(-Infinity, NaN)).is(Descending);
        t.expectP($order(-Infinity, Infinity)).is(Ascending);
        t.expectQ($order(-Infinity, -Infinity)).is(Same);
        t.expectR($order(Infinity, Infinity)).is(Same);
        t.expectS($order(Infinity, -Infinity)).is(Descending);
        t.expectT($order(NaN, -Infinity)).is(Ascending);
        t.expectU($order(undefined, -Infinity)).is(Ascending);
        t.expectV($order(null, -Infinity)).is(Ascending);
        t.expectW($order(undefined, null)).is(Same);
        t.expectX($order(undefined, undefined)).is(Same);
    }) ;

    group.unary("$equal() function", async(t) => {
        t.expectA($equal(1, 1)).true();
        t.expectB($equal(1, 2)).false();
        t.expectC($equal(0, NaN)).false();
        t.expectD($equal(NaN, NaN)).false();
        t.expectE($equal(NaN, 0)).false();
        t.expectF($equal(S1, S1)).true();
        t.expectG($equal(B1, B1)).true();
        t.expectH($equal(B1, B2)).false();
        t.expectI($equal(['A', 'B'], [])).false();
        t.expectJ($equal(['A', 'B'], ['A', 'BBB'])).false();
        t.expectK($equal(['A', 727], ['A', 727])).true();
        t.expectL($equal([T, D], [D, T])).true();
        t.expectM($arrayequal([T, D], [D, T])).true();
        t.expectN($equal(new Set([A, T]), new Set([A, T]))).true();
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
        // Set operands (covers the `instanceof Set` branches)
        t.expect3($unorderedEqual(new Set(['a', 'b', 'c']), ['c', 'b', 'a'])).true() ;
        t.expect4($unorderedEqual(['a', 'b'], new Set(['b', 'a']))).true() ;
        t.expect5($unorderedEqual(new Set(['a', 'b']), new Set(['a', 'b', 'c']))).false() ;
    }) ;

    group.unary("$datecompare() — number vs string and non-dateable operands", async(t) => {
        // a is a bare timestamp number, b is a date string -> b gets promoted to TSDate,
        // then compared as timestamps (returns a defined Comparison, never throws)
        t.expect0($datecompare(0, "1970-01-01T00:00:00")).def() ;
        t.expect1($datecompare(10, "1970-01-01T00:00:00")).def() ;
        t.expect2($datecompare(-5, "1970-01-01T00:00:10")).def() ;
        // neither operand is dateable -> undefined (final fall-through)
        t.expect3($datecompare(true as any, false as any)).undef() ;
    }) ;

    group.unary("$bytesorder() / $visualorder() functions", async(t) => {
        t.expect0($bytesorder(B1, B1)).is(Same) ;
        t.expect1($bytesorder(B2, B1)).is(Ascending) ;
        t.expect2($bytesorder(B1, B2)).is(Descending) ;
        t.expect3($bytesorder(null, B1)).is(Ascending) ;
        t.expect4($bytesorder(B1, null)).is(Descending) ;
        t.expect5($bytesorder(null, null)).is(Same) ;

        t.expect6($visualorder('abc', 'abc')).is(Same) ;
        t.expect7($visualorder(' ABC ', 'abc')).is(Same) ;         // visual normalisation
        t.expect8($visualorder('a', 'b')).is(Ascending) ;
        t.expect9($visualorder('b', 'a')).is(Descending) ;
        t.expectA($visualorder(null, 'a')).is(Ascending) ;
        t.expectB($visualorder('a', null)).is(Descending) ;
    }) ;

    group.unary("$order() throws on incomparable operands", async(t) => {
        t.expect0(() => $order({ a:1 }, { b:2 })).throws(/Impossible to order/) ;
    }) ;

    group.unary("comparison functions — remaining branches", async(t) => {
        const U1 = new URL('http://host/a') ;
        const U1b = new URL('http://host/a') ;
        const U2 = new URL('http://host/b') ;
        const ba = Buffer.from([1, 2, 3]) ;

        // $numorder identity shortcut
        t.expect0($numorder(3, 3)).is(Same) ;

        // $datecompare identity + number/number shortcuts
        t.expect1($datecompare(D, D)).is(Same) ;
        t.expect2($datecompare(5, 9)).is(Ascending) ;

        // $arraycompare
        t.expect3($arraycompare(null, [1])).undef() ;
        t.expect4($arraycompare(ba as any, ba as any)).is(Same) ;   // identity

        // $dateorder (all four outcomes)
        t.expect5($dateorder(T, D)).is(Same) ;
        t.expect6($dateorder(D, null)).is(Descending) ;
        t.expect7($dateorder(null, D)).is(Ascending) ;
        t.expect8($dateorder(null, null)).is(Same) ;

        // $bytescompare
        t.expect9($bytescompare(B1, null)).undef() ;
        t.expectA($bytescompare(ba, ba)).is(Same) ;                 // identity
        t.expectB($bytescompare(Buffer.from([1]), Buffer.from([1, 2]))).is(Ascending) ; // a shorter
        t.expect($bytescompare(Buffer.from([1, 2]), Buffer.from([1, 2])), 'bc-eq').is(Same) ; // equal, distinct refs
        t.expect($bytescompare(Buffer.from([1, 2, 3]), Buffer.from([1, 2])), 'bc-longer').is(Descending) ; // a longer

        // $compare: URL/URL, plain Uint8Array, other ArrayBuffer views
        t.expectC($compare(U1, U2)).is(Ascending) ;
        t.expectD($compare(U1, U1b)).is(Same) ;
        t.expectE($compare(new Uint8Array([1]), new Uint8Array([2]))).is(Ascending) ;
        t.expectF($compare(new Int8Array([1]), new Int8Array([2]))).is(Ascending) ;

        // $visualcompare branches
        t.expectG($visualcompare(null, 'x')).undef() ;
        const obj = { toString:() => 'z' } ;
        t.expectH($visualcompare(obj, obj)).is(Same) ;              // identity
        t.expectI($visualcompare(U1, U2)).is(Ascending) ;
        t.expectJ($visualcompare(5, '5')).is(Same) ;                // equal after stringify
        t.expect($visualcompare('x', 5), 'vc-b-nonstr').is(Descending) ; // b needs stringification ('X' > '5')

        // $bytesequal branches
        t.expectK($bytesequal(ba, ba)).true() ;                     // identity
        t.expectL($bytesequal(null, ba)).false() ;
        t.expectM($bytesequal(Buffer.from([1]), Buffer.from([1, 2]))).false() ; // length mismatch
        t.expectN($bytesequal(Buffer.from([1]), Buffer.from([2]))).false() ;    // byte mismatch

        // $equal URL/URL
        t.expectO($equal(U1, U1b)).true() ;
        t.expectP($equal(U1, U2)).false() ;

        // $arrayequal / $mapequal / $setequal / $unorderedEqual identity & null
        const arr = [1, 2] ; const map = new Map([['a', 1]]) ; const set = new Set([1]) ;
        t.expectQ($arrayequal(arr, arr)).true() ;
        t.expectR($arrayequal(null, arr)).false() ;
        t.expectS($mapequal(map, map)).true() ;
        t.expectT($mapequal(null, map)).false() ;
        t.expectU($mapequal(new Map([['a', 1]]), new Map([['a', 1], ['b', 2]]))).false() ; // b larger
        t.expectV($setequal(set, set)).true() ;
        t.expectW($unorderedEqual(arr, arr)).true() ;
        t.expectX($unorderedEqual(null, arr)).false() ;
    }) ;
}) ;
