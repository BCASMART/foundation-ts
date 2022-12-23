
import { $defined, $dict, $email, $fusion, $includesdict, $int, $intornull, $isdate, $isuuid, $keys, $ok, $toint, $tounsigned, $unsigned, $unsignedornull, $url } from "../src/commons";
import { TSDate } from "../src/tsdate";
import { INT_MAX, INT_MIN, UINT_MAX } from "../src/types";
import { TSTest } from '../src/tstester';
import { $uuid } from "../src/crypto";
import { FoundationWhiteSpaces } from "../src/string_tables";
import { TSDateForm } from "../src/tsdatecomp";
import { $decodeBase64, $encodeBase64 } from "../src/data";

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

    group.unary("verifying $ok()", async(t) => {
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

    group.unary("verifying $defined()", async(t) => {
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

    group.unary("verifying $intornull()", async(t) => {
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

    group.unary("verifying $unsignedornull()", async(t) => {
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

    group.unary("verifying $int()", async(t) => {
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

    group.unary("verifying $unsigned()", async(t) => {
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

    group.unary("verifying $toint()", async(t) => {
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

    group.unary("verifying $tounsigned()", async(t) => {
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

    group.unary("verifying $isdate(d)", async(t) => {
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
        
        t.expectW($isdate(FoundationWhiteSpaces)).false() ;
        t.expectX($isdate("")).false() ;
        t.expectY($isdate(null)).false() ;
        t.expectZ($isdate(undefined)).false() ;
    }) ;

    group.unary("verifying $keys(object)", async(t) => {
        t.expect1($keys(DICT)).is(['a', 'b', 'c']) ;
        t.expect2($keys(DICT_B)).is(['a', 'd', 'e', 'f', 'g', 'h']) ;
        t.expect3($keys(DICT_C)).is(['a', 'd', 'e', 'f', 'g', 'h', 'c', 'b']) ;
    }) ;

    group.unary("verifying $dict(object, keys)", async(t) => {
        t.expect1($dict(DICT, ['a', 'c'])).is(SUB) ;
        t.expect2($dict(DICT, ['a', 'c', 'd' as any])).is(SUB) ; // force TS to ignore 'd' because it knows this key is not in DICT
    }) ;
    
    group.unary("verifying $includesdict(object, dict, keys)", async(t) => {
        t.expect1($includesdict(DICT, SUB)).true() ;
        t.expect2($includesdict(DICT, SUB, ['c'])).true() ;
        t.expect3($includesdict(DICT, SUB, ['a', 'd'])).true() ; // because 'd' key is absent on both dicts
    }) ;
    
    group.unary("verifying $fusion(objectA, objectB)", async(t) => {
        const [fusion1,] = $fusion(DICT, DICT_B) ; 
        t.expect1(fusion1).is({a:'A', b:'b', c:'c', d:'D', h:[0,1]}) ;

        const [fusion2,] = $fusion(DICT, DICT_C) ; 
        t.expect2(fusion2).is({a:'A', b:'b', c:'c', d:'D', h:[0,1]}) ;
    }) ;

    group.unary("verifying $url(s)", async(t) => {
        t.expectA($url('http://example.com')).is('http://example.com') ;
        t.expectB($url('https://example.com')).is('https://example.com') ;
        t.expectC($url('//example.com', {acceptsProtocolRelativeUrl:true})).is('//example.com') ;
        t.expectD($url('//example.com')).is(null) ;
        t.expectE($url('//example')).is(null) ;
        t.expectF($url('/example.com')).null() ;
        t.expectG($url('/example')).null() ;
        t.expectH('example.com'.isUrl()).false() ;
        t.expectI($url('example')).null() ;
        t.expectJ($url('http://example.com', {acceptedProtocols:['file', 'fpt']})).null() ;
        t.expectK($url('file://example.com', {acceptedProtocols:['file', 'fpt']})).is('file://example.com') ;
        t.expectL($url('ftp://example.com', {acceptedProtocols:['file', 'ftps', 'ftp']})).is('ftp://example.com') ;
        t.expectM($url('ftps://example.com', {acceptedProtocols:['file', 'FTPS', 'ftp']})).is('ftps://example.com') ;
    }) ;

    group.unary("verifying $email(s)", async(t) => {
        t.expect0($email('a@b.ca')).is('a@b.ca') ;
        t.expect1($email('A@B.CA')).is('a@b.ca') ;
        t.expect2($email('@b')).null() ;
        t.expect3($email('myEmail;toto@yahoo.fr')).null() ;
        t.expect4($email('\"myEmail;toto\"@yahoo.fr')).is('\"myemail;toto\"@yahoo.fr') ;
        t.expect5($email('myEmailtoto@yah:oo.fr')).is('myemailtoto@yah:oo.fr') ;
        t.expect6($email('myEmailtoto@yahoo.c;om')).null() ;
        t.expect7('\"myEmail;toto\"@yahoo.fr'.isEmail()).true() ;
    }) ;

    group.unary("verifying $UUID(s)", async(t) => {
        t.expect0(U.isUUID()).true() ;
        t.expect1($isuuid('3C244E6D-A03E-4D45-A87C-B1E1F967B362')).true() ;
        t.expect2($isuuid('3C244E6D-A03E-4D45-A87C-B1E1F967B36')).false() ;
        t.expect3($isuuid('3C244E6D-A03E-4D45-A87C-B1E1H967B362')).false() ;
    }) ;

    group.unary("Testing function $decodeBase64(s) && $encodeBase64()", async(t) => {
        const b64 = 'JVBERi0xLjQKJcKlwrEKCgoKMSAwIG9iagogIDw8IC9UeXBlIC9DYXRhbG9nCiAgICAgL1BhZ2VzIDIgMCBSCiAgPj4KZW5kb2JqCgoyIDAgb2JqCiAgPDwgL1R5cGUgL1BhZ2VzCiAgICAgL0tpZHMgWzMgMCBSXQogICAgIC9Db3VudCAxCiAgICAgL01lZGlhQm94IFswIDAgMzAwIDE0NF0KICA+PgplbmRvYmoKCjMgMCBvYmoKICA8PCAgL1R5cGUgL1BhZ2UKICAgICAgL1BhcmVudCAyIDAgUgogICAgICAvUmVzb3VyY2VzCiAgICAgICA8PCAvRm9udAogICAgICAgICAgIDw8IC9GMQogICAgICAgICAgICAgICA8PCAvVHlwZSAvRm9udAogICAgICAgICAgICAgICAgICAvU3VidHlwZSAvVHlwZTEKICAgICAgICAgICAgICAgICAgL0Jhc2VGb250IC9UaW1lcy1Sb21hbgogICAgICAgICAgICAgICA+PgogICAgICAgICAgID4+CiAgICAgICA+PgogICAgICAvQ29udGVudHMgNCAwIFIKICA+PgplbmRvYmoKCjQgMCBvYmoKICA8PCAvTGVuZ3RoIDU1ID4+CnN0cmVhbQogIEJUCiAgICAvRjEgMTggVGYKICAgIDAgMCBUZAogICAgKEhlbGxvIFdvcmxkKSBUagogIEVUCmVuZHN0cmVhbQplbmRvYmoKCnhyZWYKMCA1CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAxOCAwMDAwMCBuIAowMDAwMDAwMDc3IDAwMDAwIG4gCjAwMDAwMDAxNzggMDAwMDAgbiAKMDAwMDAwMDQ1NyAwMDAwMCBuIAp0cmFpbGVyCiAgPDwgIC9Sb290IDEgMCBSCiAgICAgIC9TaXplIDUKICA+PgpzdGFydHhyZWYKNTY1CiUlRU9GCg==' ;
        const array = $decodeBase64(b64) ;
        t.expect0(array).is(Buffer.from(b64, 'base64')) ;
        const b64_2 = $encodeBase64(array) ;
        t.expect1(b64_2).is(b64) ;

        const str = 'This is a string' ;
        const str64 = $encodeBase64(str) ;
        t.expect2(str64).is(Buffer.from(str, 'binary').toString('base64')) ;
    })
}) ;
