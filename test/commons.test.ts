
import { $ascii, $average, $capitalize, $count, $defined, $dict, $email, $first, $firstcap, $fpad, $ftrim, $fusion, $includesdict, $int, $intornull, $isdate, $isuuid, $keys, $last, $lines, $ltrim, $map, $meters, $normspaces, $octets, $ok, $rtrim, $sum, $toint, $tounsigned, $trim, $unit, $unsigned, $unsignedornull, $url } from "../src/commons";
import { $compare, $datecompare, $equal, $max, $min, $numcompare } from "../src/compare";
import { TSDate } from "../src/tsdate";
import { Ascending, Descending, INT_MAX, INT_MIN, Same, UINT32_MAX, UINT_MAX } from "../src/types";
import { TSTest } from '../src/tstester';
import { $uuid } from "../src/crypto";
import { FoundationNewLines, FoundationWhiteSpaces } from "../src/string_tables";
import { TSDateForm } from "../src/tsdatecomp";
import { $arrayBufferFromBuffer } from "../src/tsdata";

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
    const SPACES = FoundationWhiteSpaces ;

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

    group.unary("verifying $int()", async(t) => {
        t.expect0($int(null)).toBe(0);
        t.expect1($int(undefined)).toBe(0);
        t.expect2($int(NaN)).toBe(0);
        t.expect3($int(Number.MAX_SAFE_INTEGER)).toBe(0);
        t.expect4($int(INT_MAX)).toBe(INT_MAX);
        t.expect5($int(0)).toBe(0);
        t.expect6($int(-1)).toBe(-1);
        t.expect7($int(1.3)).toBe(0);
        t.expect8($int(-1.2)).toBe(0);
        t.expect9($int(Infinity)).toBe(0);
        t.expectA($int(-Infinity)).toBe(0);
        t.expectB($int(1.5)).toBe(0);
        t.expectC($int(1.6)).toBe(0);
        t.expectD($int(Number.MIN_SAFE_INTEGER)).toBe(0);
        t.expectE($int(INT_MIN)).toBe(INT_MIN);
    }) ;

    group.unary("verifying $unsigned()", async(t) => {
        t.expect0($unsigned(null)).toBe(0);
        t.expect1($unsigned(undefined)).toBe(0);
        t.expect2($unsigned(NaN)).toBe(0);
        t.expect3($unsigned(Number.MAX_SAFE_INTEGER)).toBe(0);
        t.expect4($unsigned(UINT_MAX)).toBe(UINT_MAX);
        t.expect5($unsigned(0)).toBe(0);
        t.expect6($unsigned(-1)).toBe(0);
        t.expect7($unsigned(1.3)).toBe(0);
        t.expect8($unsigned(-1.2)).toBe(0);
        t.expect9($unsigned(Infinity)).toBe(0);
        t.expectA($unsigned(-Infinity)).toBe(0);
        t.expectB($unsigned(1.5)).toBe(0);
        t.expectC($unsigned(1.6)).toBe(0);
    }) ;

    group.unary("verifying $toint()", async(t) => {
        t.expect0($toint(null)).toBe(0);
        t.expect1($toint(undefined)).toBe(0);
        t.expect2($toint(NaN)).toBe(0);
        t.expect3($toint(Number.MAX_SAFE_INTEGER)).toBe(INT_MAX);
        t.expect4($toint(INT_MAX)).toBe(INT_MAX);
        t.expect5($toint(0)).toBe(0);
        t.expect6($toint(-1)).toBe(-1);
        t.expect7($toint(1.3)).toBe(1);
        t.expect8($toint(-1.2)).toBe(-1);
        t.expect9($toint(Infinity)).toBe(INT_MAX);
        t.expectA($toint(-Infinity)).toBe(INT_MIN);
        t.expectB($toint(1.5)).toBe(1);
        t.expectC($toint(1.6)).toBe(1);
        t.expectD($toint(Number.MIN_SAFE_INTEGER)).toBe(INT_MIN);
        t.expectE($toint(INT_MIN)).toBe(INT_MIN);
        t.expectF($toint(UINT_MAX)).toBe(INT_MAX);
        t.expectG($toint(-UINT_MAX)).toBe(INT_MIN);
        t.expectH($toint(-1.5)).toBe(-1);
        t.expectI($toint(-1.6)).toBe(-1);
    }) ;

    group.unary("verifying $tounsigned()", async(t) => {
        t.expect0($tounsigned(null)).toBe(0);
        t.expect1($tounsigned(undefined)).toBe(0);
        t.expect2($tounsigned(NaN)).toBe(0);
        t.expect3($tounsigned(Number.MAX_SAFE_INTEGER)).toBe(UINT_MAX);
        t.expect4($tounsigned(UINT_MAX)).toBe(UINT_MAX);
        t.expect5($tounsigned(0)).toBe(0);
        t.expect6($tounsigned(-1)).toBe(0);
        t.expect7($tounsigned(1.3)).toBe(1);
        t.expect8($tounsigned(-1.2)).toBe(0);
        t.expect9($tounsigned(Infinity)).toBe(UINT_MAX);
        t.expectA($tounsigned(-Infinity)).toBe(0);
        t.expectB($tounsigned(1.5)).toBe(1);
        t.expectC($tounsigned(1.6)).toBe(1);
    }) ;

    group.unary("verifying $fpad() functions", async(t) => {
        const n = 12 ;
        t.expect0($fpad(1,5)).toBe('00001') ;
        t.expect1($fpad(0,5)).toBe('00000') ;
        t.expect2($fpad(9999,5)).toBe('09999') ;
        t.expect3($fpad(99999,5)).toBe('99999') ;
        t.expect4($fpad(99999999,5)).toBe('99999999') ;
        t.expect5($fpad(-1,5)).toBe('XXXXX') ;
        t.expect6($fpad(-99999,5)).toBe('XXXXX') ;
        t.expect7($fpad(1.3,5)).toBe('XXXXX') ;
        t.expect8($fpad(-1.3,5)).toBe('XXXXX') ;
        t.expect9($fpad(NaN,5)).toBe('XXXXX') ;
        t.expectA($fpad(Infinity,5)).toBe('XXXXX') ;
        t.expectB($fpad(-Infinity,5)).toBe('XXXXX') ;
        t.expectC($fpad(UINT32_MAX,5)).toBe(UINT32_MAX.toString()) ;
        t.expectD($fpad(UINT_MAX,5)).toBe(UINT_MAX.toString()) ;
        t.expectE($fpad(Number.MAX_SAFE_INTEGER,5)).toBe('XXXXX') ;
        t.expectF($fpad(Number.MAX_SAFE_INTEGER,6, "*")).toBe("******") ;
        t.expectG(Number.MAX_SAFE_INTEGER.fpad(6, "*")).toBe("******") ;
        t.expectH(n.fpad2()).toBe("12") ;
        t.expectI(n.fpad3()).toBe("012") ;
        t.expectJ(n.fpad4()).toBe("0012") ;
        t.expectK(n.fpad(6)).toBe("000012") ;
        t.expectL(Number.MAX_SAFE_INTEGER.fpad2('-')).toBe("--") ;
        t.expectM(UINT32_MAX.fpad2('-')).toBe(UINT32_MAX.toString()) ;
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
    group.unary("verifying $isdate(d)", async(t) => {
        t.expect0($isdate(A)).toBeTruthy() ;
        t.expect1($isdate(S)).toBeTruthy() ;
        t.expect2($isdate(D)).toBeTruthy() ;
        t.expect3($isdate(AT)).toBeTruthy() ;
        t.expect4($isdate(T)).toBeTruthy() ;
        t.expect6($isdate(SPACES+A+SPACES)).toBeTruthy() ;
        t.expect7($isdate(SPACES+A+SPACES+".")).toBeFalsy() ;
        t.expect8($isdate(SPACES+S+SPACES)).toBeTruthy() ;
       
        t.register("D.toISOString", D.toISOString()) ;
        t.register("T.toISOString", T.toISOString()) ;
       
        t.expect9($isdate(D.toISOString())).toBeTruthy() ;
        t.expectA($isdate(SPACES+T.toISOString()+SPACES)).toBeTruthy() ;
        t.expectB($isdate(SPACES+T.toIsoString()+SPACES)).toBeTruthy() ;
        t.expectC($isdate(SPACES+T.toIsoString(TSDateForm.ISO8601C)+SPACES)).toBeTruthy() ;
        t.expectD($isdate(SPACES+T.toIsoString(TSDateForm.ISO8601L)+SPACES)).toBeTruthy() ;
        
        t.expectW($isdate(SPACES)).toBeFalsy() ;
        t.expectX($isdate("")).toBeFalsy() ;
        t.expectY($isdate(null)).toBeFalsy() ;
        t.expectZ($isdate(undefined)).toBeFalsy() ;
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

    group.unary("verifying $map<T,R>(x)", async(t) => {
        let array:string[] = [] ;
        array[3] = '3' ;
        array[5] = '5' ;
        t.register("array", array) ;
        t.expect1($map([1, 5, null, 6, 'A', undefined], e => e)).toBe([1, 5, 6, 'A']);
        t.expect2([1, 5, null, 6, 'A', undefined].filteredMap(e => $ok(e) ? e!.toString() : undefined)).toBe(['1', '5', '6', 'A']);
        t.expect3(array.filteredMap(e => e)).toBe(['3','5']) ;
        t.expect4(array.filteredMap((e,i) => $defined(e) ? null : `<undef ${i}>`))
         .toBe(['<undef 0>','<undef 1>', '<undef 2>','<undef 4>']) ;
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

    group.unary("Testing $octets(v)", async(t) => {
        const s = 1324756810 ;
        t.expect0($octets(1324)).toBe("1.32 ko") ;
        t.expect1($octets(132475)).toBe("132.47 ko") ;
        t.expect2($octets(132475.1)).toBe("132.48 ko") ;
        t.expect3($octets(1324756)).toBe("1.32 Mo") ;
        t.expect4($octets(13247568)).toBe("13.25 Mo") ;
        t.expect5($octets(132475681)).toBe("132.48 Mo") ;
        t.expect6($octets(1324756810, 3)).toBe("1.325 Go") ;
        t.expect7(s.octets(3)).toBe("1.325 Go") ;
        t.expect8($octets(12)).toBe("12 octets") ;
        t.expect9($octets(0)).toBe("0 octets") ;
    }) ;

    group.unary("Testing $meters(v)", async(t) => {
        const v = 0.13 ;
        t.expect0($meters(0.13)).toBe("130.00 mm") ;
        t.expect1($meters(0.13, 0)).toBe("130 mm") ;
        t.expect2(v.meters(0)).toBe("130 mm") ;
        t.expect3($meters(0.132)).toBe("132.00 mm") ;
        t.expect4($meters(0.1324)).toBe("132.40 mm") ;
        t.expect5($meters(0.13247)).toBe("132.47 mm") ;
        t.expect6($meters(0.132479)).toBe("132.48 mm") ;
        t.expect7($meters(0.132479, 0)).toBe("132 mm") ;
        t.expect8($meters(0)).toBe("0.00 m") ;
        t.expect9($meters(0, 1)).toBe("0.0 m") ;
    }) ;

    group.unary("Testing $unit(v)", async(t) => {
        const volume = 0.0023 ;
        t.expect0($unit(volume, { unit:'l' })).toBe("2.30 ml") ;
        t.expect1(volume.unit({ unit:'l' })).toBe("2.30 ml") ;
        t.expect2($unit(323.256, { unit:'l', unitName:'liters' })).toBe("323.26 liters") ;
        t.expect3($unit(3231.256, { unit:'l' })).toBe("3.23 kl") ;
        t.expect4($unit(3231.256, { unit:'l', maximalUnit:0 })).toBe("3231.26 l") ;
        t.expect5(volume.unit({ unit:'l', minimalUnit:0, decimals:3 })).toBe("0.002 l") ;
        t.expect6(volume.unit({ unit:'l', minimalUnit:0 })).toBe("0.00 l") ;
        t.expect7($unit(volume/10, { unit:'l' })).toBe("230.00 µl") ;
        t.expect8($unit(volume/10, { unit:'l', minimalUnit:-1 })).toBe("0.23 ml") ;
        t.expect9($unit(volume/100, { unit:'l', minimalUnit:-1 })).toBe("0.02 ml") ;
        t.expectA($unit(323.256, { unitName:'liters' })).toBe("323.26 liters") ;
        t.expectB($unit(volume/100, { unitName:'liters', minimalUnit:-1 })).toBe("0.02 ml") ;
        t.expectC($unit(volume,{ unit:'l', minimalUnit:0, ignoreZeroDecimals:true })).toBe("0.00 l") ;
        t.expectD($unit(volume,{ unit:'l', minimalUnit:0, ignoreMinimalUnitDecimals:true })).toBe("0 l") ;
        t.expectE($unit(0,{ unit:'l', minimalUnit:0, ignoreZeroDecimals:true })).toBe("0 l") ;
        t.expectF($unit(0,{ unit:'l', minimalUnit:0, ignoreMinimalUnitDecimals:true })).toBe("0 l") ;
    }) ;

    group.unary("Testing trim functions", async(t) => {
        const w = "TEST ME, I'M A CENTRAL\u0009PHRASE" ;
        const a = SPACES+w+SPACES ;
        t.expect0($rtrim(a)).toBe(SPACES+w) ;
        t.expect1($ltrim(a)).toBe(w+SPACES) ;
        t.expect2($trim(a)).toBe(w) ;
        t.expect3($rtrim(SPACES)).toBe("") ;
        t.expect4($ltrim(SPACES)).toBe("") ;
        t.expect5(SPACES.ftrim()).toBe("") ;
        t.expect6($rtrim("")).toBe("") ;
        t.expect7($ltrim("")).toBe("") ;
        t.expect8($trim("")).toBe("") ;
        t.expect9($rtrim(undefined)).toBe("") ;
        t.expectA($ltrim(undefined)).toBe("") ;
        t.expectB($trim(undefined)).toBe("") ;
        t.expectC($rtrim(null)).toBe("") ;
        t.expectD($ltrim(null)).toBe("") ;
        t.expectE($trim(null)).toBe("") ;
        t.expectF($ftrim(a)).toBe(w) ;
        t.expectG(a.ftrim()).toBe(w) ;
        t.expectH(a.rtrim()).toBe(SPACES+w) ;
        t.expectI(a.ltrim()).toBe(w+SPACES) ;
    }) ;

    group.unary("Testing function $normspaces(v)", async(t) => {
        const str = SPACES+"I'm "+SPACES+"a super"+SPACES+" function"+SPACES ;
        t.expect0($normspaces(str)).toBe("I'm a super function") ;
        t.expect1($normspaces("")).toBe("") ;
        t.expect2($normspaces(null)).toBe("") ;
        t.expect3($normspaces(undefined)).toBe("") ;
        t.expect4(str.normalizeSpaces()).toBe("I'm a super function") ;
    }) ;

    group.unary("Testing x.isWhiteSpace() methods", async(t) => {
        const n = SPACES.length ;
        for (let i = 0 ; i < n ; i++) {
            t.expect(SPACES.charAt(i).isWhiteSpace(),'Sws'+i).toBeTruthy() ;
            t.expect(SPACES.charCodeAt(i).isWhiteSpace(),'Nws'+i).toBeTruthy() ;
        }
        const c = 64 ;
        t.expect0(c.isWhiteSpace()).toBeFalsy() ;
        t.expect1(NaN.isWhiteSpace()).toBeFalsy() ;
        t.expect2(Infinity.isWhiteSpace()).toBeFalsy() ;
        t.expect3((-Infinity).isWhiteSpace()).toBeFalsy() ;
        t.expectA('a'.isWhiteSpace()).toBeFalsy() ;
        t.expectB(' a'.isWhiteSpace()).toBeFalsy() ;
        t.expectC('  '.isWhiteSpace()).toBeFalsy() ;
        t.expectD(SPACES.isWhiteSpace()).toBeFalsy() ;
        t.expectE(' '.isStrictWhiteSpace()).toBeTruthy() ;
        t.expectF('\n'.isStrictWhiteSpace()).toBeFalsy() ;
    }) ;

    group.unary("Testing x.isNewLine() methods", async(t) => {
        const NLS = FoundationNewLines ;
        const n = NLS.length ;
        for (let i = 0 ; i < n ; i++) {
            t.expect(NLS.charAt(i).isWhiteSpace(),'Sws'+i).toBeTruthy() ;
            t.expect(NLS.charCodeAt(i).isWhiteSpace(),'Nws'+i).toBeTruthy() ;
            t.expect(NLS.charAt(i).isNewLine(),'Snl'+i).toBeTruthy() ;
            t.expect(NLS.charCodeAt(i).isNewLine(),'Nnl'+i).toBeTruthy() ;
        }
        const c = 64 ;
        t.expect0(c.isNewLine()).toBeFalsy() ;
        t.expect1(NaN.isNewLine()).toBeFalsy() ;
        t.expect2(Infinity.isNewLine()).toBeFalsy() ;
        t.expect3((-Infinity).isNewLine()).toBeFalsy() ;
        t.expectA('a'.isNewLine()).toBeFalsy() ;
        t.expectB('\na'.isNewLine()).toBeFalsy() ;
        t.expectC('\n\t'.isNewLine()).toBeFalsy() ;
        t.expectD(NLS.isNewLine()).toBeFalsy() ;
        t.expectE(' '.isNewLine()).toBeFalsy() ;
        t.expectE('\t'.isNewLine()).toBeFalsy() ;
    }) ;

    group.unary("Testing functions $firstcap(v) && $capitalize(v)", async(t) => {
        const str = " , jean-françois is my !!friend. yes!" ;
        t.expect0($firstcap(str)).toBe(" , Jean-françois is my !!friend. yes!") ;
        t.expect1($capitalize(str)).toBe(" , Jean-François Is My !!Friend. Yes!") ;
        t.expect2($firstcap(null)).toBe("") ;
        t.expect3($firstcap(undefined)).toBe("") ;
        t.expect4($capitalize(null)).toBe("") ;
        t.expect5($capitalize(undefined)).toBe("") ;
        t.expect6(str.firstCap()).toBe(" , Jean-françois is my !!friend. yes!") ;
        t.expect7(str.capitalize()).toBe(" , Jean-François Is My !!Friend. Yes!") ;
    }) ;

    group.unary("Testing function $lines(s)", async(t) => {
        const str = `  Testing \n\tsplit ${FoundationNewLines}function\u000B` ;
        const res = ["  Testing ", "\tsplit ", "", "", "", "function", ""] ;
        t.expect0($lines(str)).toBe(res) ;
        t.expect1(str.lines()).toBe(res) ;
        t.expect2(FoundationNewLines.lines()).toBe(["", "", "", "", ""]) ;
        t.expect3("".lines()).toBe([""]) ;
        t.expect4($lines(undefined)).toBe([]) ;
        t.expect5($lines(null)).toBe([]) ;
    }) ;

}) ;
