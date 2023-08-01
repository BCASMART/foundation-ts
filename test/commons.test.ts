
import { $defined, $dict, $email, $fusion, $includesdict, $int, $intornull, $isdate, $isemail, $isurl, $isuuid, $keys, $ok, $strings, $toint, $tounsigned, $unsigned, $unsignedornull, $url, $UUID } from "../src/commons";
import { TSDate } from "../src/tsdate";
import { INT_MAX, INT_MIN, UINT_MAX, UUIDv1, UUIDv4 } from "../src/types";
import { TSTest } from '../src/tstester';
import { $uuid } from "../src/crypto";
import { FoundationWhiteSpaces } from "../src/string_tables";
import { TSDateForm } from "../src/tsdatecomp";

export const commonsGroups = TSTest.group("Commons interpretation functions", async (group) => {
    const A = "1984-06-11";
    const AT = new TSDate(A);
    const S = "1966-04-13T12:05:22";
    const D = new Date(1966, 3, 13, 12, 5, 22);
    const TD = new TSDate(1966, 4, 13, 12, 5, 22);
    const DICT = {a:'a', b:'b', c:'c'};
    const SUB = {a:'a', c:'c'};
    const DICT_B = {a:'A', d:'D', e:null, f:undefined, g:function() {}, h:[0,1]} ;
    const DICT_C = {...DICT_B, c:null, b:undefined} ;
    const U = $uuid() ;

    group.unary("$ok() function", async(t) => {
        t.expect0($ok(undefined)).false() ;
        t.expect1($ok(null)).false() ;
        t.expect2($ok(false)).true() ;
        t.expect3($ok(true)).true() ;
        t.expect4($ok({})).true() ;
        t.expect5($ok(0)).true() ;
        t.expect6($ok(1)).true() ;
        t.expect7($ok(1.5)).true() ;
        t.expect8($ok(NaN)).true() ;
        t.expect9($ok(Infinity)).true() ;
        t.expectA($ok(-Infinity)).true() ;
    }) ;

    group.unary("$defined() function", async(t) => {
        t.expect0($defined(undefined)).false() ;
        t.expect1($defined(null)).true() ;
        t.expect2($defined(false)).true() ;
        t.expect3($defined(true)).true() ;
        t.expect4($defined({})).true() ;
        t.expect5($defined(0)).true() ;
        t.expect6($defined(1)).true() ;
        t.expect7($defined(1.5)).true() ;
        t.expect8($defined(NaN)).true() ;
        t.expect9($defined(Infinity)).true() ;
        t.expectA($defined(-Infinity)).true() ;
    }) ;

    group.unary("$intornull() function", async(t) => {
        t.expect1($intornull(null)).null();
        t.expect2($intornull(undefined)).null();
        t.expect3($intornull(NaN)).null();
        t.expect4($intornull(Number.MAX_SAFE_INTEGER)).null();
        t.expect5($intornull(Number.MIN_SAFE_INTEGER)).null();
        t.expect6($intornull(INT_MIN)).is(INT_MIN);
        t.expect7($intornull(INT_MAX)).is(INT_MAX);
        t.expect8($intornull(0)).is(0);
        t.expect9($intornull(1001)).is(1001);
        t.expectA($intornull(-333.0)).is(-333);
        t.expectB($intornull(-111.5)).null();
        t.expectC($intornull('78,2')).is(78);
        t.expectD($intornull('78.2')).is(78);
        t.expectE($intornull('45A')).is(45);
        t.expectF($intornull('   111   A')).is(111);
        t.expectG($intornull('45.5A')).is(45);
        t.expectH($intornull('-4 5c')).is(-4);
        t.expectI($intornull('- 4 5c')).null();    
    }) ;

    group.unary("$unsignedornull() function", async(t) => {
        t.expect1($unsignedornull(null)).null();
        t.expect2($unsignedornull(undefined)).null();
        t.expect3($unsignedornull(NaN)).is(null);
        t.expect4($unsignedornull(Number.MAX_SAFE_INTEGER)).null();
        t.expect5($unsignedornull(UINT_MAX)).is(UINT_MAX);
        t.expect6($unsignedornull(0)).is(0);
        t.expect7($unsignedornull(1001)).is(1001);
        t.expect8($unsignedornull(-333.0)).null();
        t.expect8($unsignedornull(333.0)).is(333);
        t.expect8($unsignedornull(333.5)).null();
        t.expect9($unsignedornull('78,2')).is(78);
        t.expectA($unsignedornull('78.2')).is(78);
        t.expectB($unsignedornull('45A')).is(45);
        t.expectC($unsignedornull('   111   A')).is(111);
        t.expectD($unsignedornull('45.5A')).is(45);
        t.expectE($unsignedornull('-4 5c')).null();
        t.expectF($unsignedornull('- 4 5c')).null();
    }) ;

    group.unary("$int() function", async(t) => {
        t.expect0($int(null)).is(0);
        t.expect1($int(undefined)).is(0);
        t.expect2($int(NaN)).is(0);
        t.expect3($int(Number.MAX_SAFE_INTEGER)).is(0);
        t.expect4($int(INT_MAX)).is(INT_MAX);
        t.expect5($int(0)).is(0);
        t.expect6($int(-1)).is(-1);
        t.expect7($int(1.3)).is(0);
        t.expect8($int(-1.2)).is(0);
        t.expect9($int(Infinity)).is(0);
        t.expectA($int(-Infinity)).is(0);
        t.expectB($int(1.5)).is(0);
        t.expectC($int(1.6)).is(0);
        t.expectD($int(Number.MIN_SAFE_INTEGER)).is(0);
        t.expectE($int(INT_MIN)).is(INT_MIN);
    }) ;

    group.unary("$unsigned() function", async(t) => {
        t.expect0($unsigned(null)).is(0);
        t.expect1($unsigned(undefined)).is(0);
        t.expect2($unsigned(NaN)).is(0);
        t.expect3($unsigned(Number.MAX_SAFE_INTEGER)).is(0);
        t.expect4($unsigned(UINT_MAX)).is(UINT_MAX);
        t.expect5($unsigned(0)).is(0);
        t.expect6($unsigned(-1)).is(0);
        t.expect7($unsigned(1.3)).is(0);
        t.expect8($unsigned(-1.2)).is(0);
        t.expect9($unsigned(Infinity)).is(0);
        t.expectA($unsigned(-Infinity)).is(0);
        t.expectB($unsigned(1.5)).is(0);
        t.expectC($unsigned(1.6)).is(0);
    }) ;

    group.unary("$toint() function", async(t) => {
        t.expect0($toint(null)).is(0);
        t.expect1($toint(undefined)).is(0);
        t.expect2($toint(NaN)).is(0);
        t.expect3($toint(Number.MAX_SAFE_INTEGER)).is(INT_MAX);
        t.expect4($toint(INT_MAX)).is(INT_MAX);
        t.expect5($toint(0)).is(0);
        t.expect6($toint(-1)).is(-1);
        t.expect7($toint(1.3)).is(1);
        t.expect8($toint(-1.2)).is(-1);
        t.expect9($toint(Infinity)).is(INT_MAX);
        t.expectA($toint(-Infinity)).is(INT_MIN);
        t.expectB($toint(1.5)).is(1);
        t.expectC($toint(1.6)).is(1);
        t.expectD($toint(Number.MIN_SAFE_INTEGER)).is(INT_MIN);
        t.expectE($toint(INT_MIN)).is(INT_MIN);
        t.expectF($toint(UINT_MAX)).is(INT_MAX);
        t.expectG($toint(-UINT_MAX)).is(INT_MIN);
        t.expectH($toint(-1.5)).is(-1);
        t.expectI($toint(-1.6)).is(-1);
    }) ;

    group.unary("$tounsigned() function", async(t) => {
        t.expect0($tounsigned(null)).is(0);
        t.expect1($tounsigned(undefined)).is(0);
        t.expect2($tounsigned(NaN)).is(0);
        t.expect3($tounsigned(Number.MAX_SAFE_INTEGER)).is(UINT_MAX);
        t.expect4($tounsigned(UINT_MAX)).is(UINT_MAX);
        t.expect5($tounsigned(0)).is(0);
        t.expect6($tounsigned(-1)).is(0);
        t.expect7($tounsigned(1.3)).is(1);
        t.expect8($tounsigned(-1.2)).is(0);
        t.expect9($tounsigned(Infinity)).is(UINT_MAX);
        t.expectA($tounsigned(-Infinity)).is(0);
        t.expectB($tounsigned(1.5)).is(1);
        t.expectC($tounsigned(1.6)).is(1);
    }) ;

    group.unary("$isdate(d) function", async(t) => {
        t.expect0($isdate(A)).true() ;
        t.expect1($isdate(S)).true() ;
        t.expect2($isdate(D)).true() ;
        t.expect3($isdate(AT)).true() ;
        t.expect4($isdate(TD)).true() ;
        t.expect6($isdate(FoundationWhiteSpaces+A+FoundationWhiteSpaces)).true() ;
        t.expect7($isdate(FoundationWhiteSpaces+A+FoundationWhiteSpaces+".")).false() ;
        t.expect8($isdate(FoundationWhiteSpaces+S+FoundationWhiteSpaces)).true() ;
       
        t.register("D.toISOString", D.toISOString()) ;
        t.register("TD.toISOString", TD.toISOString()) ;
       
        t.expect9($isdate(D.toISOString())).true() ;
        t.expectA($isdate(FoundationWhiteSpaces+TD.toISOString()+FoundationWhiteSpaces)).true() ;
        t.expectB($isdate(FoundationWhiteSpaces+TD.toIsoString()+FoundationWhiteSpaces)).true() ;
        t.expectC($isdate(FoundationWhiteSpaces+TD.toIsoString(TSDateForm.ISO8601C)+FoundationWhiteSpaces)).true() ;
        t.expectD($isdate(FoundationWhiteSpaces+TD.toIsoString(TSDateForm.ISO8601L)+FoundationWhiteSpaces)).true() ;
        
        t.expectU($isdate(5)).false() ;
        t.expectV($isdate({})).false() ;
        t.expectW($isdate(FoundationWhiteSpaces)).false() ;
        t.expectX($isdate("")).false() ;
        t.expectY($isdate(null)).false() ;
        t.expectZ($isdate(undefined)).false() ;
    }) ;

    group.unary("$keys() function", async(t) => {
        t.expect1($keys(DICT)).is(['a', 'b', 'c']) ;
        t.expect2($keys(DICT_B)).is(['a', 'd', 'e', 'f', 'g', 'h']) ;
        t.expect3($keys(DICT_C)).is(['a', 'd', 'e', 'f', 'g', 'h', 'c', 'b']) ;
    }) ;

    group.unary("$dict() function", async(t) => {
        t.expect1($dict(DICT, ['a', 'c'])).is(SUB) ;
        t.expect2($dict(DICT, ['a', 'c', 'd' as any])).is(SUB) ; // force TS to ignore 'd' because it knows this key is not in DICT
    }) ;
    
    group.unary("$includesdict() function", async(t) => {
        t.expect1($includesdict(DICT, SUB)).true() ;
        t.expect2($includesdict(DICT, SUB, ['c'])).true() ;
        t.expect3($includesdict(DICT, SUB, ['a', 'd'])).true() ; // because 'd' key is absent on both dicts
    }) ;
    
    group.unary("$fusion() function", async(t) => {
        const [fusion1,] = $fusion(DICT, DICT_B) ; 
        t.expect1(fusion1).is({a:'A', b:'b', c:'c', d:'D', h:[0,1]}) ;

        const [fusion2,] = $fusion(DICT, DICT_C) ; 
        t.expect2(fusion2).is({a:'A', b:'b', c:'c', d:'D', h:[0,1]}) ;
    }) ;

    group.unary("$isurl() function", async(t) => {
        t.expect0($isurl('http://example.com')).true() ;
        t.expect1($isurl('//example.com')).false() ;
        t.expect3('example.com'.isUrl()).false() ;
        t.expect4($isurl('ftps://example.com', {acceptedProtocols:['file', 'FTPS', 'ftp']})).true() ;
        t.expect5($isurl(null)).false() ;
        t.expect6($isurl(undefined)).false() ;
        t.expect7($isurl('')).false() ;
        t.expect8($isurl(5)).false() ;
        t.expect9($isurl({})).false() ;
        t.expectA($isurl('http://example.com/')).true() ;
        t.expectB($isurl('https://example.com')).true() ;
        t.expectC($isurl('https://example.com/')).true() ;
        t.expectD($isurl('http://example.com:8000')).true() ;
        t.expectE($isurl('http://example.com:8000/')).true() ;
        t.expectF($isurl('http://example.com:8000/toto')).true() ;
        t.expectG($isurl('http://example.com:8000/toto', { acceptedProtocols:['file', 'fpt']})).true() ;
        t.expectH($isurl('http://127.0.0.1')).true() ;
        t.expectI($isurl('http://127.0.0.1/')).true() ;
        t.expectJ($isurl('http://localhost')).true() ;
        t.expectK($isurl('http://localhost/')).true() ;
        t.expectL($isurl('http://52.33.204.12')).true() ;
        /* we may re-test ipv4 addresses later
        t.expectM($isurl('http://52.33.2040.12')).false() ;
        t.expectN($isurl('http://520.33.204.12')).false() ;
        t.expectO($isurl('http://52.330.204.12')).false() ;
        t.expectP($isurl('http://52.33.204.1200')).false() ;
        */
        t.expectQ($isurl('http://localhost/tutu?titi=1')).true() ;
        t.expectR($isurl('http://localhost/tutu?titi=1', {refusesParameters:true})).false() ;

    }) ;
    group.unary("$url() function", async(t) => {
        t.expect0($url('http://example.com')).is('http://example.com/') ;
        t.expect1($url('https://example.com')).is('https://example.com/') ;
        t.expect3($url('//example.com')).is(null) ;
        t.expect4($url('//example')).is(null) ;
        t.expect5($url('/example.com')).null() ;
        t.expect6($url('/example')).null() ;
        t.expect7($url('example')).null() ;
        t.expect8($url('http://example.com', {acceptedProtocols:['file', 'fpt']})).is('http://example.com/') ;
        t.expect9($url('file://example.com', {acceptedProtocols:['file', 'fpt']})).is('file://example.com/') ;
        t.expectA($url('ftp://example.com', {acceptedProtocols:['file', 'ftps', 'ftp']})).is('ftp://example.com/') ;
        t.expectB($url('ftps://example.com', {acceptedProtocols:['file', 'FTPS', 'ftp']})).is('ftps://example.com/') ;
        t.expectC($url('ftps://example.com/', {acceptedProtocols:['file', 'FTPS', 'ftp']})).is('ftps://example.com/') ;
        t.expect9($url('file://example.com/titi', {acceptedProtocols:['file', 'fpt']})).is('file://example.com/titi') ;
    })

    group.unary("$isemail() and $email() functions", async(t) => {
        t.expect0($email('a@b.ca')).is('a@b.ca') ;
        t.expect1($email('A@B.CA')).is('a@b.ca') ;
        t.expect2($email('@b')).null() ;
        t.expect3($email('myEmail;toto@yahoo.fr')).null() ;
        t.expect4($email('\"myEmail;toto\"@yahoo.fr')).is('\"myemail;toto\"@yahoo.fr') ;
        t.expect5($email('myEmailtoto@yah:oo.fr')).is('myemailtoto@yah:oo.fr') ;
        t.expect6($email('myEmailtoto@yahoo.c;om')).null() ;
        t.expectA($isemail('a@b.ca')).true() ;
        t.expectB($isemail('A@B.CA')).true() ;
        t.expectC($isemail('@b')).false() ;
        t.expectD($isemail('myEmail;toto@yahoo.fr')).false() ;
        t.expectE('\"myEmail;toto\"@yahoo.fr'.isEmail()).true() ;
        t.expectF($isemail('myEmailtoto@yah:oo.fr')).true() ;
        t.expectG($isemail('myEmailtoto@yahoo.c;om')).false() ;
        t.expectH($isemail(null)).false() ;
        t.expectI($isemail(undefined)).false() ;
        t.expectJ($isemail('')).false() ;
        t.expectK($isemail(5)).false() ;
        t.expectL($isemail({})).false() ;
    }) ;

    group.unary("$isuuid() and $UUID() functions", async(t) => {
        t.expect0(U.isUUID()).true() ;
        t.expect1($isuuid('3C244E6D-A03E-4D45-A87C-B1E1F967B362')).true() ;
        t.expect2($isuuid('3C244E6D-A03E-4D45-A87C-B1E1F967B36')).false() ;
        t.expect3($isuuid('3C244E6D-A03E-4D45-A87C-B1E1H967B362')).false() ;
        t.expect4($isuuid(null)).false() ;
        t.expect5($isuuid(undefined)).false() ;
        t.expect6($isuuid('')).false() ;
        t.expect7($isuuid(5)).false() ;
        t.expect8($isuuid({})).false() ;
        t.expect9($isuuid('a14ceb40-ac4f-11ed-b648-67a97617e043')).true() ;
        t.expectA($isuuid('a14ceb40-ac4f-11ed-b648-67a97617e043', UUIDv1)).true() ;
        t.expectB($isuuid('a14ceb40-ac4f-11ed-b648-67a97617e043', UUIDv4)).false() ;
        t.expectC($isuuid('3C244E6D-A03E-4D45-A87C-B1E1F967B362', UUIDv1)).true() ;
        t.expectD($isuuid('3C244E6D-A03E-4D45-A87C-B1E1F967B362', UUIDv4)).true() ;
        t.expectE($isuuid('3C244E6D-A03E-5D45-A87C-B1E1F967B362', UUIDv4)).false() ;
        t.expectF($isuuid('3C244E6D-A03E-4D45-187C-B1E1F967B362', UUIDv4)).false() ;

        t.expectX($UUID('3C244E6D-A03E-4D45-A87C-B1E1F967B362')).is('3C244E6D-A03E-4D45-A87C-B1E1F967B362') ;
        t.expectY($UUID('3C244E6D-A03E-4D45-A87C-B1E1F967B36')).null() ;
        t.expectZ($UUID('3C244E6D-A03E-4D45-A87C-B1E1H967B362')).null() ;
    }) ;

    group.unary("$strings() function", async(t) => {
        t.expect0($strings()).is([]) ;
        t.expect1($strings(null)).is([]) ;
        t.expect2($strings(undefined)).is([]) ;
        t.expect3($strings("")).is(['']) ;
        t.expect4($strings([""])).is(['']) ;
        t.expect5($strings("44")).is(['44']) ;
        t.expect6($strings(["44"])).is(['44']) ;
        t.expect7($strings(null, '1', undefined, ["2"], null, ['3', '4'], '5', [], ['6'])).is(['1', '2', '3', '4', '5', '6']) ;
        t.expect8($strings([])).is([]) ;
        t.expect9($strings(null, [], undefined, null,[])).is([]) ;
    }) ;

}) ;
