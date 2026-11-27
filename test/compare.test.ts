import { $arraycompare, $arrayequal, $bytescompare, $bytesequal, $bytesorder, $compare, $datecompare, $dateorder, $equal, $mapequal, $numcompare, $numorder, $order, $setequal, $unorderedEqual, $visualcompare, $visualequal, $visualorder } from "../src/compare";
import { $arrayBufferFromBytes } from "../src/data";
import "../src/array" ;
import "../src/date" ;
import "../src/mapset" ;
import { TSColor } from "../src/tscolor";
import { TSCouple } from "../src/tscouple";
import { TSData } from "../src/tsdata";
import { TSRange } from "../src/tsrange";
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
        t.expectD($datecompare(DM, Number.NaN)).undef() ;
        t.expectE($datecompare(T, Number.NaN)).undef() ;
        t.expectF($datecompare(Number.NaN, D)).undef() ;
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
        t.expect4($compare(0, Number.NaN)).toBeUndefined();
        t.expect5($compare(Number.NaN, Number.NaN)).toBeUndefined();
        t.expect6($compare(Number.NaN, 0)).toBeUndefined();
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
        t.expect4($order(0, Number.NaN)).is(Descending);
        t.expect5($order(Number.NaN, Number.NaN)).is(Same);
        t.expect6($order(Number.NaN, 0)).is(Ascending);
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
        t.expectM($order(Number.NaN, Infinity)).is(Ascending);
        t.expectN($order(Infinity, Number.NaN)).is(Descending);
        t.expectO($order(-Infinity, Number.NaN)).is(Descending);
        t.expectP($order(-Infinity, Infinity)).is(Ascending);
        t.expectQ($order(-Infinity, -Infinity)).is(Same);
        t.expectR($order(Infinity, Infinity)).is(Same);
        t.expectS($order(Infinity, -Infinity)).is(Descending);
        t.expectT($order(Number.NaN, -Infinity)).is(Ascending);
        t.expectU($order(undefined, -Infinity)).is(Ascending);
        t.expectV($order(null, -Infinity)).is(Ascending);
        t.expectW($order(undefined, null)).is(Same);
        t.expectX($order(undefined, undefined)).is(Same);
    }) ;

    group.unary("$equal() function", async(t) => {
        t.expectA($equal(1, 1)).true();
        t.expectB($equal(1, 2)).false();
        t.expectC($equal(0, Number.NaN)).false();
        t.expectD($equal(Number.NaN, Number.NaN)).false();
        t.expectE($equal(Number.NaN, 0)).false();
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
        t.expect4($numcompare(0, Number.NaN)).undef();
        t.expect5($numcompare(Number.NaN, Number.NaN)).undef();
        t.expect6($numcompare(Number.NaN, 0)).undef();
        t.expect7($numcompare(-Infinity, 0)).is(Ascending);
        t.expect8($numcompare(0, Infinity)).is(Ascending);
        t.expect9($numcompare(-Infinity, Number.NaN)).undef();
        t.expectA($numcompare(Number.NaN, Infinity)).undef();
        t.expectA($numcompare(-Infinity, Infinity)).is(Ascending);
        t.expectB($numcompare(Infinity, -Infinity)).is(Descending);
        t.expectB($numcompare(Infinity, UINT_MAX)).is(Descending);
        t.expectC($numcompare(100, -Infinity)).is(Descending);
        t.expectD($numcompare(Infinity, Infinity)).is(Same);
        t.expectE($numcompare(-Infinity, -Infinity)).is(Same);
        // anything that is not a number is not comparable (no coercion)
        t.expectF($numcompare("5" as any, 3)).undef();
        t.expectG($numcompare(3, "5" as any)).undef();
        t.expectH($numcompare(undefined as any, 3)).undef();
        t.expectI($numcompare(null as any, null as any)).undef();
    }) ;

    group.unary("$numorder() function", async(t) => {
        t.expect1($numorder(2, 1)).is(Descending);
        t.expect2($numorder(-Infinity, 2)).is(Ascending);
        t.expect3($numorder(Number.NaN, -Infinity)).is(Ascending);
        // anything that is not a number is ordered like NaN (an undefined number)
        t.expect4($numorder(undefined as any, 3)).is(Ascending);
        t.expect5($numorder(3, "5" as any)).is(Descending);
        t.expect6($numorder("abc" as any, Number.NaN)).is(Same);
        t.expect7($numorder({} as any, null as any)).is(Same);
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
        // each element must be present the same number of times (the duplicates used to be ignored)
        t.expect6($unorderedEqual([1, 1, 2], [1, 2, 2])).false() ;
        t.expect7($unorderedEqual([1, 1, 2], [2, 1, 1])).true() ;
        t.expect8($unorderedEqual([1, 1, 2], new Set([1, 2]))).false() ;       // a Set has each element once
        t.expect9($unorderedEqual([Number.NaN, 0], [-0, Number.NaN])).true() ;  // SameValueZero, like Set.has()
        const o = { a:1 } ;
        t.expectA($unorderedEqual([o, 2], [2, o])).true() ;
        t.expectB($unorderedEqual([{ a:1 }], [{ a:1 }])).false() ;              // objects are compared by reference
        t.expectC($unorderedEqual([], new Set())).true() ;
        t.expectD($unorderedEqual('ab' as any, ['a', 'b'])).false() ;
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

    group.unary("$compare() between binary data and another kind of object (1.8.13)", async(t) => {
        const d = new TSData(Buffer.from([1, 2, 3])) ;
        const pairs:[any, string][] = [
            [Buffer.from([1, 2, 3]), 'Buffer'], [Buffer.from([1, 2, 4]), 'greater Buffer'], [new Uint8Array([1, 2]), 'shorter Uint8Array'],
            [new Uint8Array([1, 2, 3]).buffer, 'ArrayBuffer'],
        ] ;
        // a Buffer first used to throw a TypeError (Buffer.prototype.compare() refuses a TSData)
        for (const [b, label] of pairs) {
            t.expect($compare(b, d), label).is(-($compare(d, b) as number) || 0) ;
        }
        t.expect0($compare(Buffer.from([1, 2, 3]), d)).is(Same) ;
        t.expect1($compare(Buffer.from([1, 2, 4]), d)).is(Descending) ;
        t.expect2($compare(new Uint8Array([1, 2]), d)).is(Ascending) ;
        // still not comparable: no exception
        t.expect3($compare(Buffer.from([1, 2]), [1, 2])).undef() ;
        t.expect4($compare(Buffer.from([1, 2]), { a:1 })).undef() ;
        t.expect5($compare(Buffer.from([1, 2]), new Date())).undef() ;
        t.expect6($compare(new ArrayBuffer(2), 'ab')).undef() ;
        // binary data between themselves: unchanged
        t.expect7($compare(Buffer.from([1, 2]), new Uint8Array([1, 3]))).is(Ascending) ;
        t.expect8($compare(Buffer.from([1, 2]), Buffer.from([1, 2]))).is(Same) ;
    }) ;

    group.unary("$equal() / $compare() are symmetric between an array and an object (1.8.13)", async(t) => {
        const inverse = (c:any) => c === Ascending ? Descending : (c === Descending ? Ascending : c) ;
        const data = new TSData(Buffer.from([0, 1, 2])) ;
        const arrays:any[] = [[0, 1, 2], [0, 1], [0, 1, 2, 3], [0, 1, 3], [0, 0, 255], [256, 1, 2], [0, 1, 2.7], ['0', 1, 2], []] ;
        for (let i = 0 ; i < arrays.length ; i++) {
            const a = arrays[i] ;
            t.expect($equal(a, data), `$equal(array#${i}, data)`).is($equal(data, a)) ;
            t.expect($compare(a, data), `$compare(array#${i}, data)`).is(inverse($compare(data, a))) ;
        }
        t.expect0($equal([0, 1, 2], data)).true() ;
        t.expect1($compare([0, 1, 2], data)).is(Same) ;
        t.expect2($compare([0, 1], data)).is(Ascending) ;
        t.expect3($compare([0, 1, 3], data)).is(Descending) ;
        t.expect4($compare([256, 1, 2], data)).undef() ;
        t.expect5($equal([256, 1, 2], data)).false() ;
        // unchanged with the objects which do not compare themselves with arrays
        const objects:any[] = [new Date(2024, 0, 1), new TSDate(2024, 1, 1), new Set([1]), new Map([[1, 1]]), new TSRange(0, 3), new TSCouple(1, 2), TSColor.rgb(1, 2, 3)] ;
        for (let i = 0 ; i < objects.length ; i++) {
            const o = objects[i] ;
            t.expect($equal([1], o), `$equal([1], object#${i})`).false() ;
            t.expect($equal(o, [1]), `$equal(object#${i}, [1])`).false() ;
            t.expect($compare([1], o), `$compare([1], object#${i})`).undef() ;
            t.expect($compare(o, [1]), `$compare(object#${i}, [1])`).undef() ;
        }
        // arrays with arrays: unchanged
        t.expect6($equal([1, 2], [1, 2])).true() ;
        t.expect7($compare([1, 2], [1, 3])).is(Ascending) ;
        t.expect8($compare([1, 2, 3], [1, 2])).is(Descending) ;
        // a typed array is never equal to a number[]
        t.expect9($equal(Buffer.from([1, 2]), [1, 2])).false() ;
        t.expectA($equal([1, 2], Buffer.from([1, 2]))).false() ;
        t.expectB($equal(Uint8Array.from([1, 2]), [1, 2])).false() ;
        t.expectC($equal([1, 2], Uint8Array.from([1, 2]))).false() ;
        t.expectD($compare([1, 2], Buffer.from([1, 2]))).undef() ;
        t.expectE($compare([1, 2], Uint8Array.from([1, 2]))).undef() ;
        t.expectF($compare(Uint8Array.from([1, 2]), [1, 2])).undef() ;
    }) ;

    group.unary("$bytescompare() / $bytesequal() with plain arrays holding non bytes (1.8.13)", async(t) => {
        const x = [1, 256] as any ;
        t.expect0($bytesequal([256] as any, [256] as any)).false() ;
        t.expect1($bytesequal([0, 1.5] as any, [0, 1.5] as any)).false() ;
        t.expect2($bytesequal(x, x)).false() ;
        t.expect3($bytesequal([1, 2] as any, [1, 2] as any)).true() ;
        t.expect4($bytesequal([1, 2] as any, Uint8Array.from([1, 2]))).true() ;
        t.expect5($bytesequal([1, 258] as any, Uint8Array.from([1, 2]))).false() ;
        t.expect6($bytescompare([256] as any, [0] as any)).undef() ;
        t.expect7($bytescompare([1, 2] as any, [2, 300] as any)).undef() ;
        t.expect8($bytescompare(x, x)).undef() ;
        t.expect9($bytescompare([1, 2] as any, [1, 3] as any)).is(Ascending) ;
        t.expectA($bytescompare(Uint8Array.from([1, 2, 3]), [1, 2] as any)).is(Descending) ;
        t.expectB($bytescompare([0, 1, 2] as any, [0, 1, 2, 256] as any)).undef() ; // beyond the common part
        t.expectC($bytesequal(null, null)).true() ;
        const u = Uint8Array.from([1, 2]) ;
        t.expectD($bytescompare(u, u)).is(Same) ;
        t.expectE($bytesequal(u, u)).true() ;
    }) ;
}) ;
