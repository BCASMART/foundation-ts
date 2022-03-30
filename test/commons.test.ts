import { $arraybuffer, $ascii, $compare, $datecompare, $equal, $intornull, $map, $numcompare, $ok, $unsignedornull } from "../src/commons";
import { TSDate } from "../src/tsdate";
import { Ascending, Descending, INT_MAX, INT_MIN, Same, UINT_MAX } from "../src/types";

describe("Interpretation functions", () => {
    //$intornull(n:string|number|null|undefined)
    const s = $ascii('´');
    console.log(`s.length = ${s.length}, c0=${s.charCodeAt(0)}`);

    const A = "1984-06-11";
    const AT = new TSDate(A);
    const S = "1966-04-13T12:05:22";
    const D = new Date(1966, 3, 13, 12, 5, 22);
    const T = new TSDate(1966, 4, 13, 12, 5, 22);
    const S1 = "Texte accentué avec ça et c'est shön";
    const S2 = "Texte accentue avec ca et c'est shon";
    const B1 = Buffer.from(S1, 'utf-8');
    const B2 = Buffer.from(S2, 'utf-8');

    it('verifying $intornull()', () => {
        expect($intornull(null)).toBe(null);
        expect($intornull(undefined)).toBe(null);
        expect($intornull(NaN)).toBe(null);
        expect($intornull(Number.MAX_SAFE_INTEGER)).toBe(null);
        expect($intornull(Number.MIN_SAFE_INTEGER)).toBe(null);
        expect($intornull(INT_MIN)).toBe(INT_MIN);
        expect($intornull(INT_MAX)).toBe(INT_MAX);
        expect($intornull(0)).toBe(0);
        expect($intornull(1001)).toBe(1001);
        expect($intornull(-333.0)).toBe(-333);
        expect($intornull(-111.5)).toBe(null);
        expect($intornull('78,2')).toBe(78);
        expect($intornull('78.2')).toBe(78);
        expect($intornull('45A')).toBe(45);
        expect($intornull('   111   A')).toBe(111);
        expect($intornull('45.5A')).toBe(45);
        expect($intornull('-4 5c')).toBe(-4);
        expect($intornull('- 4 5c')).toBe(null);
    });

    it('verifying $unsignedornull()', () => {
        expect($unsignedornull(null)).toBe(null);
        expect($unsignedornull(undefined)).toBe(null);
        expect($unsignedornull(NaN)).toBe(null);
        expect($unsignedornull(Number.MAX_SAFE_INTEGER)).toBe(null);
        expect($unsignedornull(UINT_MAX)).toBe(UINT_MAX);
        expect($unsignedornull(0)).toBe(0);
        expect($unsignedornull(1001)).toBe(1001);
        expect($unsignedornull(-333.0)).toBe(null);
        expect($unsignedornull('78,2')).toBe(78);
        expect($unsignedornull('78.2')).toBe(78);
        expect($unsignedornull('45A')).toBe(45);
        expect($unsignedornull('   111   A')).toBe(111);
        expect($unsignedornull('45.5A')).toBe(45);
        expect($unsignedornull('-4 5c')).toBe(null);
        expect($unsignedornull('- 4 5c')).toBe(null);
    });

    it('verifying $numcompare(a,b)', () => {
        expect($numcompare(1, 1)).toBe(Same);
        expect($numcompare(1, 2)).toBe(Ascending);
        expect($numcompare(0, -2)).toBe(Descending);
        expect($numcompare(0, NaN)).toBe(undefined);
        expect($numcompare(NaN, NaN)).toBe(undefined);
        expect($numcompare(NaN, 0)).toBe(undefined);
    });

    it('verifying $datecompare(a,b)', () => {
        expect($datecompare(S, D)).toBe(Same);
        expect($datecompare(S, T)).toBe(Same);
        expect($datecompare(T, D)).toBe(Same);
        expect($datecompare(S, null)).toBe(undefined);
        expect($datecompare(null, null)).toBe(undefined);
        expect($datecompare(null, D)).toBe(undefined);
        expect($datecompare(A, D)).toBe(Descending);
        expect($datecompare(T, A)).toBe(Ascending);
    });

    it('verifying $compare(a,b)', () => {
        expect($compare(1, 1)).toBe(Same);
        expect($compare(1, 2)).toBe(Ascending);
        expect($compare(0, -2)).toBe(Descending);
        expect($compare(0, NaN)).toBe(undefined);
        expect($compare(NaN, NaN)).toBe(undefined);
        expect($compare(NaN, 0)).toBe(undefined);
        expect($compare(S1, S1)).toBe(Same);
        expect($compare(S1, S2)).toBe(Descending);
        expect($compare(B1, B1)).toBe(Same);
        expect($compare(B1, B2)).toBe(Descending);
        expect($compare($arraybuffer(B1), $arraybuffer(B1))).toBe(Same);
        expect($compare($arraybuffer(B1), $arraybuffer(B2))).toBe(Descending);
        expect($compare(T, D)).toBe(Same);
        expect($compare(D, null)).toBe(undefined);
        expect($compare(null, null)).toBe(undefined);
        expect($compare(null, D)).toBe(undefined);
        expect($compare(AT, D)).toBe(Descending);
        expect($compare(T, AT)).toBe(Ascending);
        expect($compare(['A', 'B'], [])).toBe(Descending);
        expect($compare(['A', 'B'], ['A', 'BBB'])).toBe(Ascending);
        expect($compare([T, D], [D, T])).toBe(Same);
    });

    it('verifying $equal(a,b)', () => {
        expect($equal(1, 1)).toBeTruthy();
        expect($equal(1, 2)).toBeFalsy();
        expect($equal(0, NaN)).toBeFalsy();
        expect($equal(NaN, NaN)).toBeFalsy();
        expect($equal(NaN, 0)).toBeFalsy();
        expect($equal(S1, S1)).toBeTruthy();
        expect($equal(B1, B1)).toBeTruthy();
        expect($equal(B1, B2)).toBeFalsy();
        expect($equal(['A', 'B'], [])).toBeFalsy();
        expect($equal(['A', 'B'], ['A', 'BBB'])).toBeFalsy();
        expect($equal(['A', 727], ['A', 727])).toBeTruthy();
        expect($equal([T, D], [D, T])).toBeTruthy();
    });

    it('verifying $map<T,R>(x)', () => {
        expect($map([1, 5, null, 6, 'A', undefined], e => e)).toStrictEqual([1, 5, 6, 'A']);
        expect($map([1, 5, null, 6, 'A', undefined], e => $ok(e) ? e!.toString() : undefined)).toStrictEqual(['1', '5', '6', 'A']);
    });

    it('verifying $ascii(s)', () => {
        expect($ascii(S1)).toBe(S2) ;
        expect($ascii(S1)).toBe($ascii(S2)) ;
        expect($ascii('@&é"\'(§è!çà)-#1234567890°_•ë“‘{¶«¡Çø}—´„”’[å»ÛÁØ]–')).toBe('@&e"\'(e!ca)-#1234567890_.e"\'{"!Co}-""\'[a"UAO]-');
        expect($ascii('azertyuiop^$AZERTYUIOP¨*æê®†Úºîœπô€Æ‚ÅÊ™ŸªïŒ∏Ô¥')).toBe('azertyuiop^$AZERTYUIOP*aee(R)UoioeoEURAE\'AETMYaiOEOJPY');
        expect($ascii('qsdfghjklmù`QSDFGHJKLM%£‡Ò∂ƒﬁÌÏÈ¬µÙ@Ω∑∆·ﬂÎÍË|Ó‰#')).toBe('qsdfghjklmu`QSDFGHJKLM%GBPOdffiIIEU@.flIIE|O#');
        expect($ascii('<wxcvbn,;:=>WXCVBN?./+≤‹≈©◊ß~∞…÷≠≥›⁄¢√ı¿•\\±')).toBe('<wxcvbn,;:=>WXCVBN?./+<=<(C)ss~.../>=>/ci?.\\') ;
        expect($ascii('âêîôûäëïöüÂÊÎÔÛÄËÏÖÜàèìòùÀÈÌÒÙñÑãÃõÕÁÉÍÓÚáéíóú')).toBe('aeiouaeiouAEIOUAEIOUaeiouAEIOUnNaAoOAEIOUaeiou') ;
    });

});
