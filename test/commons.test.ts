import { $arraybuffer, $ascii, $dict, $email, $includesdict, $intornull, $map, $ok, $unsignedornull, $url } from "../src/commons";
import { $compare, $datecompare, $equal, $numcompare } from "../src/compare";
import { TSDate } from "../src/tsdate";
import { Ascending, Descending, INT_MAX, INT_MIN, Same, UINT_MAX } from "../src/types";


describe("Interpretation functions", () => {
    //$intornull(n:string|number|null|undefined)
    const A = "1984-06-11";
    const AT = new TSDate(A);
    const S = "1966-04-13T12:05:22";
    const D = new Date(1966, 3, 13, 12, 5, 22);
    const T = new TSDate(1966, 4, 13, 12, 5, 22);
    const S1 = "Texte accentué avec ça et c'est shön";
    const S2 = "Texte accentue avec ca et c'est shon";
    const B1 = Buffer.from(S1, 'utf-8');
    const B2 = Buffer.from(S2, 'utf-8');
    const DICT = {a:'a', b:'b', c:'c'};
    const SUB = {a:'a', c:'c'};

    it('verifying $intornull()', () => {
        expect($intornull(null)).toBeNull();
        expect($intornull(undefined)).toBeNull();
        expect($intornull(NaN)).toBeNull();
        expect($intornull(Number.MAX_SAFE_INTEGER)).toBeNull();
        expect($intornull(Number.MIN_SAFE_INTEGER)).toBeNull();
        expect($intornull(INT_MIN)).toBe(INT_MIN);
        expect($intornull(INT_MAX)).toBe(INT_MAX);
        expect($intornull(0)).toBe(0);
        expect($intornull(1001)).toBe(1001);
        expect($intornull(-333.0)).toBe(-333);
        expect($intornull(-111.5)).toBeNull();
        expect($intornull('78,2')).toBe(78);
        expect($intornull('78.2')).toBe(78);
        expect($intornull('45A')).toBe(45);
        expect($intornull('   111   A')).toBe(111);
        expect($intornull('45.5A')).toBe(45);
        expect($intornull('-4 5c')).toBe(-4);
        expect($intornull('- 4 5c')).toBeNull();
    });

    it('verifying $unsignedornull()', () => {
        expect($unsignedornull(null)).toBeNull();
        expect($unsignedornull(undefined)).toBeNull();
        expect($unsignedornull(NaN)).toBe(null);
        expect($unsignedornull(Number.MAX_SAFE_INTEGER)).toBeNull();
        expect($unsignedornull(UINT_MAX)).toBe(UINT_MAX);
        expect($unsignedornull(0)).toBe(0);
        expect($unsignedornull(1001)).toBe(1001);
        expect($unsignedornull(-333.0)).toBeNull();
        expect($unsignedornull('78,2')).toBe(78);
        expect($unsignedornull('78.2')).toBe(78);
        expect($unsignedornull('45A')).toBe(45);
        expect($unsignedornull('   111   A')).toBe(111);
        expect($unsignedornull('45.5A')).toBe(45);
        expect($unsignedornull('-4 5c')).toBeNull();
        expect($unsignedornull('- 4 5c')).toBeNull();
    });

    it('verifying $numcompare(a,b)', () => {
        expect($numcompare(1, 1)).toBe(Same);
        expect($numcompare(1, 2)).toBe(Ascending);
        expect($numcompare(0, -2)).toBe(Descending);
        expect($numcompare(0, NaN)).toBeUndefined();
        expect($numcompare(NaN, NaN)).toBeUndefined();
        expect($numcompare(NaN, 0)).toBeUndefined();
    });

    it('verifying $datecompare(a,b)', () => {
        expect($datecompare(S, D)).toBe(Same);
        expect($datecompare(S, T)).toBe(Same);
        expect($datecompare(T, D)).toBe(Same);
        expect($datecompare(S, null)).toBeUndefined();
        expect($datecompare(null, null)).toBeUndefined();
        expect($datecompare(null, D)).toBeUndefined();
        expect($datecompare(A, D)).toBe(Descending);
        expect($datecompare(T, A)).toBe(Ascending);
    });

    it('verifying $compare(a,b)', () => {
        expect($compare(1, 1)).toBe(Same);
        expect($compare(1, 2)).toBe(Ascending);
        expect($compare(0, -2)).toBe(Descending);
        expect($compare(0, NaN)).toBeUndefined();
        expect($compare(NaN, NaN)).toBeUndefined();
        expect($compare(NaN, 0)).toBeUndefined();
        expect($compare(S1, S1)).toBe(Same);
        expect($compare(S1, S2)).toBe(Descending);
        expect($compare(B1, B1)).toBe(Same);
        expect($compare(B1, B2)).toBe(Descending);
        expect($compare($arraybuffer(B1), $arraybuffer(B1))).toBe(Same);
        expect($compare($arraybuffer(B1), $arraybuffer(B2))).toBe(Descending);
        expect($compare(T, D)).toBe(Same);
        expect($compare(D, null)).toBeUndefined();
        expect($compare(null, null)).toBeUndefined();
        expect($compare(null, D)).toBeUndefined();
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

    it('verifying $dict(object, keys)', () => {
        expect($equal($dict(DICT, ['a', 'c']), SUB)).toBeTruthy() ;
        expect($equal($dict(DICT, ['a', 'c', 'd']), SUB)).toBeTruthy() ;
    }) ;

    it('verifying $includesdict(object, dict, keys)', () => {
        expect($includesdict(DICT, SUB)).toBeTruthy() ;
        expect($includesdict(DICT, SUB, ['c'])).toBeTruthy() ;
        expect($includesdict(DICT, SUB, ['a', 'd'])).toBeTruthy() ; // because 'd' key is absent on both dicts
    }) ;

    it('verifying $ascii(s)', () => {
        expect($ascii(S1)).toBe(S2) ;
        expect($ascii(S1)).toBe($ascii(S2)) ;
        expect($ascii('@&é"\'(§è!çà)-#1234567890°_•ë“‘{¶«¡Çø}—´„”’[å»ÛÁØ]–')).toBe('@&e"\'(e!ca)-#1234567890_.e"\'{"!Co}-""\'[a"UAO]-');
        expect($ascii('azertyuiop^$AZERTYUIOP¨*æê®†Úºîœπô€Æ‚ÅÊ™ŸªïŒ∏Ô¥')).toBe('azertyuiop^$AZERTYUIOP*aee(R)UoioeoEURAE\'AETMYaiOEOJPY');
        expect($ascii('qsdfghjklmù`QSDFGHJKLM%£‡Ò∂ƒﬁÌÏÈ¬µÙ@Ω∑∆·ﬂÎÍË|Ó‰#')).toBe('qsdfghjklmu`QSDFGHJKLM%GBPOdffiIIEU@.flIIE|O#');
        expect($ascii('<wxcvbn,;:=>WXCVBN?./+≤‹≈©◊ß~∞…÷≠≥›⁄¢√ı¿•\\±')).toBe('<wxcvbn,;:=>WXCVBN?./+<=<(C)ss~.../>=>/ci?.\\') ;
        expect($ascii('âêîôûäëïöüÂÊÎÔÛÄËÏÖÜàèìòùÀÈÌÒÙñÑãÃõÕÁÉÍÓÚáéíóú')).toBe('aeiouaeiouAEIOUAEIOUaeiouAEIOUnNaAoOAEIOUaeiou') ;
    });

    it('verifying $url(s)', () => {
        expect($url('http://example.com')).toBe('http://example.com') ;
        expect($url('https://example.com')).toBe('https://example.com') ;
        expect($url('//example.com', {acceptsProtocolRelativeUrl:true})).toBe('//example.com') ;
        expect($url('//example.com')).toBe(null) ;
        expect($url('//example')).toBe(null) ;
        expect($url('/example.com')).toBeNull() ;
        expect($url('/example')).toBeNull() ;
        expect($url('example.com')).toBeNull() ;
        expect($url('example')).toBeNull() ;
        expect($url('http://example.com', {acceptedProtocols:['file', 'fpt']})).toBeNull() ;
        expect($url('file://example.com', {acceptedProtocols:['file', 'fpt']})).toBe('file://example.com') ;
        expect($url('ftp://example.com', {acceptedProtocols:['file', 'ftps', 'ftp']})).toBe('ftp://example.com') ;
        expect($url('ftps://example.com', {acceptedProtocols:['file', 'FTPS', 'ftp']})).toBe('ftps://example.com') ;
    }) ;

    it('verifying $email(s)', () => {
        expect($email('a@b.ca')).toBe('a@b.ca') ;
        expect($email('A@B.CA')).toBe('a@b.ca') ;
        expect($email('@b')).toBeNull() ;
        expect($email('myEmail;toto@yahoo.fr')).toBeNull() ;
        expect($email('\"myEmail;toto\"@yahoo.fr')).toBe('\"myemail;toto\"@yahoo.fr') ;
        expect($email('myEmailtoto@yah:oo.fr')).toBe('myemailtoto@yah:oo.fr') ;
        expect($email('myEmailtoto@yahoo.c;om')).toBeNull() ;
    }) ;


});
