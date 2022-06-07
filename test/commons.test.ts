
import { $arraybuffer, $ascii, $dict, $email, $fusion, $includesdict, $intornull, $keys, $map, $ok, $unsignedornull, $url } from "../src/commons";
import { $compare, $datecompare, $equal, $numcompare } from "../src/compare";
import { TSDate } from "../src/tsdate";
import { Ascending, Descending, INT_MAX, INT_MIN, Same, UINT_MAX } from "../src/types";
import { TSTest } from '../src/tstester';

export const commonsGroups = TSTest.group("Commons interpretation functions", async (group) => {
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
    const DICT_B = {a:'A', d:'D', e:null, f:undefined, g:function() {}, h:[0,1]} ;
    const DICT_C = {...DICT_B, c:null, b:undefined} ;

    group.unary("verifying $intornull()", async(t) => {
        t.expect($intornull(null)).toBeNull();
        t.expect($intornull(undefined)).toBeNull();
        t.expect($intornull(NaN)).toBeNull();
        t.expect($intornull(Number.MAX_SAFE_INTEGER)).toBeNull();
        t.expect($intornull(Number.MIN_SAFE_INTEGER)).toBeNull();
        t.expect($intornull(INT_MIN)).toBe(INT_MIN);
        t.expect($intornull(INT_MAX)).toBe(INT_MAX);
        t.expect($intornull(0)).toBe(0);
        t.expect($intornull(1001)).toBe(1001);
        t.expect($intornull(-333.0)).toBe(-333);
        t.expect($intornull(-111.5)).toBeNull();
        t.expect($intornull('78,2')).toBe(78);
        t.expect($intornull('78.2')).toBe(78);
        t.expect($intornull('45A')).toBe(45);
        t.expect($intornull('   111   A')).toBe(111);
        t.expect($intornull('45.5A')).toBe(45);
        t.expect($intornull('-4 5c')).toBe(-4);
        t.expect($intornull('- 4 5c')).toBeNull();    
    }) ;

    group.unary("verifying $unsignedornull()", async(t) => {
        t.expect($unsignedornull(null)).toBeNull();
        t.expect($unsignedornull(undefined)).toBeNull();
        t.expect($unsignedornull(NaN)).toBe(null);
        t.expect($unsignedornull(Number.MAX_SAFE_INTEGER)).toBeNull();
        t.expect($unsignedornull(UINT_MAX)).toBe(UINT_MAX);
        t.expect($unsignedornull(0)).toBe(0);
        t.expect($unsignedornull(1001)).toBe(1001);
        t.expect($unsignedornull(-333.0)).toBeNull();
        t.expect($unsignedornull('78,2')).toBe(78);
        t.expect($unsignedornull('78.2')).toBe(78);
        t.expect($unsignedornull('45A')).toBe(45);
        t.expect($unsignedornull('   111   A')).toBe(111);
        t.expect($unsignedornull('45.5A')).toBe(45);
        t.expect($unsignedornull('-4 5c')).toBeNull();
        t.expect($unsignedornull('- 4 5c')).toBeNull();
    }) ;

    group.unary("verifying $numcompare(a,b)", async(t) => {
        t.expect($numcompare(1, 1)).toBe(Same);
        t.expect($numcompare(1, 2)).toBe(Ascending);
        t.expect($numcompare(0, -2)).toBe(Descending);
        t.expect($numcompare(0, NaN)).toBeUndefined();
        t.expect($numcompare(NaN, NaN)).toBeUndefined();
        t.expect($numcompare(NaN, 0)).toBeUndefined();
    }) ;

    group.unary("verifying $datecompare(a,b)", async(t) => {
        t.expect($datecompare(S, D)).toBe(Same);
        t.expect($datecompare(S, T)).toBe(Same);
        t.expect($datecompare(T, D)).toBe(Same);
        t.expect($datecompare(S, null)).toBeUndefined();
        t.expect($datecompare(null, null)).toBeUndefined();
        t.expect($datecompare(null, D)).toBeUndefined();
        t.expect($datecompare(A, D)).toBe(Descending);
        t.expect($datecompare(T, A)).toBe(Ascending);
    }) ;

    group.unary("verifying $compare(a,b)", async(t) => {
        t.expect($compare(1, 1)).toBe(Same);
        t.expect($compare(1, 2)).toBe(Ascending);
        t.expect($compare(0, -2)).toBe(Descending);
        t.expect($compare(0, NaN)).toBeUndefined();
        t.expect($compare(NaN, NaN)).toBeUndefined();
        t.expect($compare(NaN, 0)).toBeUndefined();
        t.expect($compare(S1, S1)).toBe(Same);
        t.expect($compare(S1, S2)).toBe(Descending);
        t.expect($compare(B1, B1)).toBe(Same);
        t.expect($compare(B1, B2)).toBe(Descending);
        t.expect($compare($arraybuffer(B1), $arraybuffer(B1))).toBe(Same);
        t.expect($compare($arraybuffer(B1), $arraybuffer(B2))).toBe(Descending);
        t.expect($compare(T, D)).toBe(Same);
        t.expect($compare(D, null)).toBeUndefined();
        t.expect($compare(null, null)).toBeUndefined();
        t.expect($compare(null, D)).toBeUndefined();
        t.expect($compare(AT, D)).toBe(Descending);
        t.expect($compare(T, AT)).toBe(Ascending);
        t.expect($compare(['A', 'B'], [])).toBe(Descending);
        t.expect($compare(['A', 'B'], ['A', 'BBB'])).toBe(Ascending);
        t.expect($compare([T, D], [D, T])).toBe(Same);
    }) ;

    group.unary("verifying $equal(a,b)", async(t) => {
        t.expect($equal(1, 1)).toBeTruthy();
        t.expect($equal(1, 2)).toBeFalsy();
        t.expect($equal(0, NaN)).toBeFalsy();
        t.expect($equal(NaN, NaN)).toBeFalsy();
        t.expect($equal(NaN, 0)).toBeFalsy();
        t.expect($equal(S1, S1)).toBeTruthy();
        t.expect($equal(B1, B1)).toBeTruthy();
        t.expect($equal(B1, B2)).toBeFalsy();
        t.expect($equal(['A', 'B'], [])).toBeFalsy();
        t.expect($equal(['A', 'B'], ['A', 'BBB'])).toBeFalsy();
        t.expect($equal(['A', 727], ['A', 727])).toBeTruthy();
        t.expect($equal([T, D], [D, T])).toBeTruthy();
    }) ;

    group.unary("verifying $map<T,R>(x)", async(t) => {
        t.expect($map([1, 5, null, 6, 'A', undefined], e => e)).toBe([1, 5, 6, 'A']);
        t.expect($map([1, 5, null, 6, 'A', undefined], e => $ok(e) ? e!.toString() : undefined)).toBe(['1', '5', '6', 'A']);
    }) ;

    group.unary("verifying $keys(object)", async(t) => {
        t.expect($keys(DICT)).toBe(['a', 'b', 'c']) ;
        t.expect($keys(DICT_B)).toBe(['a', 'd', 'e', 'f', 'g', 'h']) ;
        t.expect($keys(DICT_C)).toBe(['a', 'd', 'e', 'f', 'g', 'h', 'c', 'b']) ;
    }) ;

    group.unary("verifying $dict(object, keys)", async(t) => {
        t.expect($dict(DICT, ['a', 'c'])).toBe(SUB) ;
        t.expect($dict(DICT, ['a', 'c', 'd'])).toBe(SUB) ;
    }) ;

    group.unary("verifying $includesdict(object, dict, keys)", async(t) => {
        t.expect($includesdict(DICT, SUB)).toBeTruthy() ;
        t.expect($includesdict(DICT, SUB, ['c'])).toBeTruthy() ;
        t.expect($includesdict(DICT, SUB, ['a', 'd'])).toBeTruthy() ; // because 'd' key is absent on both dicts
    }) ;
    
    group.unary("verifying $fusion(objectA, objectB)", async(t) => {
        const [fusion1,] = $fusion(DICT, DICT_B) ; 
        //$logterm('&yfusion 1:&o'+inspect(fusion1)+'&0') ;
        t.expect(fusion1).toBe({a:'A', b:'b', c:'c', d:'D', h:[0,1]}) ;
        const [fusion2,] = $fusion(DICT, DICT_C) ; 
        //$logterm('&rfusion 2:&p'+inspect(fusion1)+'&0') ;
        t.expect(fusion2).toBe({a:'A', b:'b', c:'c', d:'D', h:[0,1]}) ;
    }) ;

    group.unary("verifying $ascii(s)", async(t) => {
        t.expect($ascii(S1)).toBe(S2) ;
        t.expect($ascii(S1)).toBe($ascii(S2)) ;
        t.expect($ascii('@&é"\'(§è!çà)-#1234567890°_•ë“‘{¶«¡Çø}—´„”’[å»ÛÁØ]–')).toBe('@&e"\'(e!ca)-#1234567890_.e"\'{"!Co}-""\'[a"UAO]-');
        t.expect($ascii('azertyuiop^$AZERTYUIOP¨*æê®†Úºîœπô€Æ‚ÅÊ™ŸªïŒ∏Ô¥')).toBe('azertyuiop^$AZERTYUIOP*aee(R)UoioeoEURAE\'AETMYaiOEOJPY');
        t.expect($ascii('qsdfghjklmù`QSDFGHJKLM%£‡Ò∂ƒﬁÌÏÈ¬µÙ@Ω∑∆·ﬂÎÍË|Ó‰#')).toBe('qsdfghjklmu`QSDFGHJKLM%GBPOdffiIIEU@.flIIE|O#');
        t.expect($ascii('<wxcvbn,;:=>WXCVBN?./+≤‹≈©◊ß~∞…÷≠≥›⁄¢√ı¿•\\±')).toBe('<wxcvbn,;:=>WXCVBN?./+<=<(C)ss~.../>=>/ci?.\\') ;
        t.expect($ascii('âêîôûäëïöüÂÊÎÔÛÄËÏÖÜàèìòùÀÈÌÒÙñÑãÃõÕÁÉÍÓÚáéíóú')).toBe('aeiouaeiouAEIOUAEIOUaeiouAEIOUnNaAoOAEIOUaeiou') ;
    }) ;

    group.unary("verifying $url(s)", async(t) => {
        t.expect($url('http://example.com')).toBe('http://example.com') ;
        t.expect($url('https://example.com')).toBe('https://example.com') ;
        t.expect($url('//example.com', {acceptsProtocolRelativeUrl:true})).toBe('//example.com') ;
        t.expect($url('//example.com')).toBe(null) ;
        t.expect($url('//example')).toBe(null) ;
        t.expect($url('/example.com')).toBeNull() ;
        t.expect($url('/example')).toBeNull() ;
        t.expect($url('example.com')).toBeNull() ;
        t.expect($url('example')).toBeNull() ;
        t.expect($url('http://example.com', {acceptedProtocols:['file', 'fpt']})).toBeNull() ;
        t.expect($url('file://example.com', {acceptedProtocols:['file', 'fpt']})).toBe('file://example.com') ;
        t.expect($url('ftp://example.com', {acceptedProtocols:['file', 'ftps', 'ftp']})).toBe('ftp://example.com') ;
        t.expect($url('ftps://example.com', {acceptedProtocols:['file', 'FTPS', 'ftp']})).toBe('ftps://example.com') ;
    }) ;

    group.unary("verifying $email(s)", async(t) => {
        t.expect($email('a@b.ca')).toBe('a@b.ca') ;
        t.expect($email('A@B.CA')).toBe('a@b.ca') ;
        t.expect($email('@b')).toBeNull() ;
        t.expect($email('myEmail;toto@yahoo.fr')).toBeNull() ;
        t.expect($email('\"myEmail;toto\"@yahoo.fr')).toBe('\"myemail;toto\"@yahoo.fr') ;
        t.expect($email('myEmailtoto@yah:oo.fr')).toBe('myemailtoto@yah:oo.fr') ;
        t.expect($email('myEmailtoto@yahoo.c;om')).toBeNull() ;
    }) ;

}) ;

/*
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
    const DICT_B = {a:'A', d:'D', e:null, f:undefined, g:function() {}, h:[0,1]} ;
    const DICT_C = {...DICT_B, c:null, b:undefined} ;

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

    it('verifying $keys(object)', () => {
        expect($keys(DICT)).toStrictEqual(['a', 'b', 'c']) ;
        expect($keys(DICT_B)).toStrictEqual(['a', 'd', 'e', 'f', 'g', 'h']) ;
        expect($keys(DICT_C)).toStrictEqual(['a', 'd', 'e', 'f', 'g', 'h', 'c', 'b']) ;
    }) ;
    it('verifying $dict(object, keys)', () => {
        expect($equal($dict(DICT, ['a', 'c']), SUB)).toBeTruthy() ;
        expect($equal($dict(DICT, ['a', 'c', 'd']), SUB)).toBeTruthy() ;
    }) ;

    it('verifying $includesdict(object, dict, keys)', () => {
        expect($includesdict(DICT, SUB)).toBeTruthy() ;
        expect($includesdict(DICT, SUB, ['c'])).toBeTruthy() ;
        expect($includesdict(DICT, SUB, ['a', 'd'])).toBeTruthy() ; // because 'd' key is absent on both dicts
    }) ;

    it('verifying $fusion(objectA, objectB)', () => {
        const [fusion1,] = $fusion(DICT, DICT_B) ; 
        //$logterm('&yfusion 1:&o'+inspect(fusion1)+'&0') ;
        expect($equal(fusion1, {a:'A', b:'b', c:'c', d:'D', h:[0,1]})).toBeTruthy() ;
        const [fusion2,] = $fusion(DICT, DICT_C) ; 
        //$logterm('&rfusion 2:&p'+inspect(fusion1)+'&0') ;
        expect($equal(fusion2, {a:'A', b:'b', c:'c', d:'D', h:[0,1]})).toBeTruthy() ;
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
*/