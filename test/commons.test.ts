
import { $arraybuffer, $ascii, $average, $count, $dict, $email, $first, $fusion, $includesdict, $intornull, $isuuid, $keys, $last, $map, $ok, $sum, $unit, $unsignedornull, $url } from "../src/commons";
import { $compare, $datecompare, $equal, $max, $min, $numcompare } from "../src/compare";
import { TSDate } from "../src/tsdate";
import { Ascending, Descending, INT_MAX, INT_MIN, Same, UINT_MAX } from "../src/types";
import { TSTest } from '../src/tstester';
import { $uuid } from "../src/crypto";

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
    const U = $uuid() ;

    group.unary("verifying $intornull()", async(t) => {
        t.expect1($intornull(null)).toBeNull();
        t.expect2($intornull(undefined)).toBeNull();
        t.expect3($intornull(NaN)).toBeNull();
        t.expect4($intornull(Number.MAX_SAFE_INTEGER)).toBeNull();
        t.expect5($intornull(Number.MIN_SAFE_INTEGER)).toBeNull();
        t.expect6($intornull(INT_MIN)).toBe(INT_MIN);
        t.expect7($intornull(INT_MAX)).toBe(INT_MAX);
        t.expect8($intornull(0)).toBe(0);
        t.expect9($intornull(1001)).toBe(1001);
        t.expectA($intornull(-333.0)).toBe(-333);
        t.expectB($intornull(-111.5)).toBeNull();
        t.expectC($intornull('78,2')).toBe(78);
        t.expectD($intornull('78.2')).toBe(78);
        t.expectE($intornull('45A')).toBe(45);
        t.expectF($intornull('   111   A')).toBe(111);
        t.expectG($intornull('45.5A')).toBe(45);
        t.expectH($intornull('-4 5c')).toBe(-4);
        t.expectI($intornull('- 4 5c')).toBeNull();    
    }) ;

    group.unary("verifying $unsignedornull()", async(t) => {
        t.expect1($unsignedornull(null)).toBeNull();
        t.expect2($unsignedornull(undefined)).toBeNull();
        t.expect3($unsignedornull(NaN)).toBe(null);
        t.expect4($unsignedornull(Number.MAX_SAFE_INTEGER)).toBeNull();
        t.expect5($unsignedornull(UINT_MAX)).toBe(UINT_MAX);
        t.expect6($unsignedornull(0)).toBe(0);
        t.expect7($unsignedornull(1001)).toBe(1001);
        t.expect8($unsignedornull(-333.0)).toBeNull();
        t.expect8($unsignedornull(333.0)).toBe(333);
        t.expect8($unsignedornull(333.5)).toBeNull();
        t.expect9($unsignedornull('78,2')).toBe(78);
        t.expectA($unsignedornull('78.2')).toBe(78);
        t.expectB($unsignedornull('45A')).toBe(45);
        t.expectC($unsignedornull('   111   A')).toBe(111);
        t.expectD($unsignedornull('45.5A')).toBe(45);
        t.expectE($unsignedornull('-4 5c')).toBeNull();
        t.expectF($unsignedornull('- 4 5c')).toBeNull();
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
        t.expectB($compare($arraybuffer(B1), $arraybuffer(B1))).toBe(Same);
        t.expectC($compare($arraybuffer(B1), $arraybuffer(B2))).toBe(Descending);
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

    group.unary("verifying $map<T,R>(x)", async(t) => {
        t.expect1($map([1, 5, null, 6, 'A', undefined], e => e)).toBe([1, 5, 6, 'A']);
        t.expect2([1, 5, null, 6, 'A', undefined].filteredMap(e => $ok(e) ? e!.toString() : undefined)).toBe(['1', '5', '6', 'A']);
    }) ;

    group.unary("verifying $keys(object)", async(t) => {
        t.expect1($keys(DICT)).toBe(['a', 'b', 'c']) ;
        t.expect2($keys(DICT_B)).toBe(['a', 'd', 'e', 'f', 'g', 'h']) ;
        t.expect3($keys(DICT_C)).toBe(['a', 'd', 'e', 'f', 'g', 'h', 'c', 'b']) ;
    }) ;

    group.unary("verifying $dict(object, keys)", async(t) => {
        t.expect1($dict(DICT, ['a', 'c'])).toBe(SUB) ;
        t.expect2($dict(DICT, ['a', 'c', 'd' as any])).toBe(SUB) ; // force TS to ignore 'd' because it knows this key is not in DICT
    }) ;
    
    group.unary("verifying array functions", async(t) => {
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

    group.unary("verifying $includesdict(object, dict, keys)", async(t) => {
        t.expect1($includesdict(DICT, SUB)).toBeTruthy() ;
        t.expect2($includesdict(DICT, SUB, ['c'])).toBeTruthy() ;
        t.expect3($includesdict(DICT, SUB, ['a', 'd'])).toBeTruthy() ; // because 'd' key is absent on both dicts
    }) ;
    
    group.unary("verifying $fusion(objectA, objectB)", async(t) => {
        const [fusion1,] = $fusion(DICT, DICT_B) ; 
        t.expect1(fusion1).toBe({a:'A', b:'b', c:'c', d:'D', h:[0,1]}) ;

        const [fusion2,] = $fusion(DICT, DICT_C) ; 
        t.expect2(fusion2).toBe({a:'A', b:'b', c:'c', d:'D', h:[0,1]}) ;
    }) ;

    group.unary("verifying $ascii(s)", async(t) => {
        t.expect1($ascii(S1)).toBe(S2) ;
        t.expect2($ascii(S1)).toBe(S2.ascii()) ;
        t.expect3($ascii('@&é"\'(§è!çà)-#1234567890°_•ë“‘{¶«¡Çø}—´„”’[å»ÛÁØ]–')).toBe('@&e"\'(e!ca)-#1234567890_.e"\'{"!Co}-""\'[a"UAO]-');
        t.expect4($ascii('azertyuiop^$AZERTYUIOP¨*æê®†Úºîœπô€Æ‚ÅÊ™ŸªïŒ∏Ô¥')).toBe('azertyuiop^$AZERTYUIOP*aee(R)UoioeoEURAE\'AETMYaiOEOJPY');
        t.expect5($ascii('qsdfghjklmù`QSDFGHJKLM%£‡Ò∂ƒﬁÌÏÈ¬µÙ@Ω∑∆·ﬂÎÍË|Ó‰#')).toBe('qsdfghjklmu`QSDFGHJKLM%GBPOdffiIIEU@.flIIE|O#');
        t.expect6($ascii('<wxcvbn,;:=>WXCVBN?./+≤‹≈©◊ß~∞…÷≠≥›⁄¢√ı¿•\\±')).toBe('<wxcvbn,;:=>WXCVBN?./+<=<(C)ss~.../>=>/ci?.\\') ;
        t.expect7($ascii('âêîôûäëïöüÂÊÎÔÛÄËÏÖÜàèìòùÀÈÌÒÙñÑãÃõÕÁÉÍÓÚáéíóú')).toBe('aeiouaeiouAEIOUAEIOUaeiouAEIOUnNaAoOAEIOUaeiou') ;
        t.expect7('âêîôûäëïöüÂÊÎÔÛÄËÏÖÜàèìòùÀÈÌÒÙñÑãÃõÕÁÉÍÓÚáéíóú'.ascii()).toBe('aeiouaeiouAEIOUAEIOUaeiouAEIOUnNaAoOAEIOUaeiou') ;
    }) ;

    group.unary("verifying $url(s)", async(t) => {
        t.expectA($url('http://example.com')).toBe('http://example.com') ;
        t.expectB($url('https://example.com')).toBe('https://example.com') ;
        t.expectC($url('//example.com', {acceptsProtocolRelativeUrl:true})).toBe('//example.com') ;
        t.expectD($url('//example.com')).toBe(null) ;
        t.expectE($url('//example')).toBe(null) ;
        t.expectF($url('/example.com')).toBeNull() ;
        t.expectG($url('/example')).toBeNull() ;
        t.expectH('example.com'.isUrl()).toBeFalsy() ;
        t.expectI($url('example')).toBeNull() ;
        t.expectJ($url('http://example.com', {acceptedProtocols:['file', 'fpt']})).toBeNull() ;
        t.expectK($url('file://example.com', {acceptedProtocols:['file', 'fpt']})).toBe('file://example.com') ;
        t.expectL($url('ftp://example.com', {acceptedProtocols:['file', 'ftps', 'ftp']})).toBe('ftp://example.com') ;
        t.expectM($url('ftps://example.com', {acceptedProtocols:['file', 'FTPS', 'ftp']})).toBe('ftps://example.com') ;
    }) ;

    group.unary("verifying $email(s)", async(t) => {
        t.expect0($email('a@b.ca')).toBe('a@b.ca') ;
        t.expect1($email('A@B.CA')).toBe('a@b.ca') ;
        t.expect2($email('@b')).toBeNull() ;
        t.expect3($email('myEmail;toto@yahoo.fr')).toBeNull() ;
        t.expect4($email('\"myEmail;toto\"@yahoo.fr')).toBe('\"myemail;toto\"@yahoo.fr') ;
        t.expect5($email('myEmailtoto@yah:oo.fr')).toBe('myemailtoto@yah:oo.fr') ;
        t.expect6($email('myEmailtoto@yahoo.c;om')).toBeNull() ;
        t.expect7('\"myEmail;toto\"@yahoo.fr'.isEmail()).toBeTruthy() ;
    }) ;

    group.unary("verifying $UUID(s)", async(t) => {
        t.expect0(U.isUUID()).toBeTruthy() ;
        t.expect1($isuuid('3C244E6D-A03E-4D45-A87C-B1E1F967B362')).toBeTruthy() ;
        t.expect2($isuuid('3C244E6D-A03E-4D45-A87C-B1E1F967B36')).toBeFalsy() ;
        t.expect3($isuuid('3C244E6D-A03E-4D45-A87C-B1E1H967B362')).toBeFalsy() ;
    }) ;

    group.unary("Testing $unit() function", async(t) => {
        t.expect0($unit(1324)).toBe("1.32 ko") ;
        t.expect1($unit(132475)).toBe("132.47 ko") ;
        t.expect2($unit(132475.1)).toBe("132.48 ko") ;
        t.expect3($unit(1324756)).toBe("1.32 Mo") ;
        t.expect4($unit(13247568)).toBe("13.25 Mo") ;
        t.expect5($unit(132475681)).toBe("132.48 Mo") ;
        t.expect6($unit(1324756810, {decimals:3})).toBe("1.325 Go") ;

        const v = 0.13 ;
        t.expectA($unit(0.13, {unit:'m', subUnits:true})).toBe("130.00 mm") ;
        t.expectB($unit(0.13, {unit:'m', subUnits:true, decimals:0})).toBe("130 mm") ;
        t.expectC(v.unit({unit:'m', subUnits:true, decimals:0})).toBe("130 mm") ;
        t.expectD($unit(0.132, {unit:'m', subUnits:true})).toBe("132.00 mm") ;
        t.expectE($unit(0.1324, {unit:'m', subUnits:true})).toBe("132.40 mm") ;
        t.expectF($unit(0.13247, {unit:'m', subUnits:true})).toBe("132.47 mm") ;
        t.expectG($unit(0.132479, {unit:'m', subUnits:true})).toBe("132.48 mm") ;
        t.expectH($unit(0.132479, {unit:'m', subUnits:true, decimals:0})).toBe("132 mm") ;

    }) ;
}) ;
