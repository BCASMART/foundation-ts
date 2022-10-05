
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
        t.expect0($ok(undefined)).toBeFalsy() ;
        t.expect1($ok(null)).toBeFalsy() ;
        t.expect2($ok(false)).toBeTruthy() ;
        t.expect3($ok(true)).toBeTruthy() ;
        t.expect4($ok({})).toBeTruthy() ;
        t.expect5($ok(0)).toBeTruthy() ;
        t.expect6($ok(1)).toBeTruthy() ;
        t.expect7($ok(1.5)).toBeTruthy() ;
        t.expect8($ok(NaN)).toBeTruthy() ;
        t.expect9($ok(Infinity)).toBeTruthy() ;
        t.expectA($ok(-Infinity)).toBeTruthy() ;
    }) ;

    group.unary("verifying $defined()", async(t) => {
        t.expect0($defined(undefined)).toBeFalsy() ;
        t.expect1($defined(null)).toBeTruthy() ;
        t.expect2($defined(false)).toBeTruthy() ;
        t.expect3($defined(true)).toBeTruthy() ;
        t.expect4($defined({})).toBeTruthy() ;
        t.expect5($defined(0)).toBeTruthy() ;
        t.expect6($defined(1)).toBeTruthy() ;
        t.expect7($defined(1.5)).toBeTruthy() ;
        t.expect8($defined(NaN)).toBeTruthy() ;
        t.expect9($defined(Infinity)).toBeTruthy() ;
        t.expectA($defined(-Infinity)).toBeTruthy() ;
    }) ;

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

    group.unary("verifying $isdate(d)", async(t) => {
        t.expect0($isdate(A)).toBeTruthy() ;
        t.expect1($isdate(S)).toBeTruthy() ;
        t.expect2($isdate(D)).toBeTruthy() ;
        t.expect3($isdate(AT)).toBeTruthy() ;
        t.expect4($isdate(TD)).toBeTruthy() ;
        t.expect6($isdate(FoundationWhiteSpaces+A+FoundationWhiteSpaces)).toBeTruthy() ;
        t.expect7($isdate(FoundationWhiteSpaces+A+FoundationWhiteSpaces+".")).toBeFalsy() ;
        t.expect8($isdate(FoundationWhiteSpaces+S+FoundationWhiteSpaces)).toBeTruthy() ;
       
        t.register("D.toISOString", D.toISOString()) ;
        t.register("TD.toISOString", TD.toISOString()) ;
       
        t.expect9($isdate(D.toISOString())).toBeTruthy() ;
        t.expectA($isdate(FoundationWhiteSpaces+TD.toISOString()+FoundationWhiteSpaces)).toBeTruthy() ;
        t.expectB($isdate(FoundationWhiteSpaces+TD.toIsoString()+FoundationWhiteSpaces)).toBeTruthy() ;
        t.expectC($isdate(FoundationWhiteSpaces+TD.toIsoString(TSDateForm.ISO8601C)+FoundationWhiteSpaces)).toBeTruthy() ;
        t.expectD($isdate(FoundationWhiteSpaces+TD.toIsoString(TSDateForm.ISO8601L)+FoundationWhiteSpaces)).toBeTruthy() ;
        
        t.expectW($isdate(FoundationWhiteSpaces)).toBeFalsy() ;
        t.expectX($isdate("")).toBeFalsy() ;
        t.expectY($isdate(null)).toBeFalsy() ;
        t.expectZ($isdate(undefined)).toBeFalsy() ;
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

    group.unary("Testing function $decodeBase64(s) && $encodeBase64()", async(t) => {
        const b64 = 'JVBERi0xLjQKJcKlwrEKCgoKMSAwIG9iagogIDw8IC9UeXBlIC9DYXRhbG9nCiAgICAgL1BhZ2VzIDIgMCBSCiAgPj4KZW5kb2JqCgoyIDAgb2JqCiAgPDwgL1R5cGUgL1BhZ2VzCiAgICAgL0tpZHMgWzMgMCBSXQogICAgIC9Db3VudCAxCiAgICAgL01lZGlhQm94IFswIDAgMzAwIDE0NF0KICA+PgplbmRvYmoKCjMgMCBvYmoKICA8PCAgL1R5cGUgL1BhZ2UKICAgICAgL1BhcmVudCAyIDAgUgogICAgICAvUmVzb3VyY2VzCiAgICAgICA8PCAvRm9udAogICAgICAgICAgIDw8IC9GMQogICAgICAgICAgICAgICA8PCAvVHlwZSAvRm9udAogICAgICAgICAgICAgICAgICAvU3VidHlwZSAvVHlwZTEKICAgICAgICAgICAgICAgICAgL0Jhc2VGb250IC9UaW1lcy1Sb21hbgogICAgICAgICAgICAgICA+PgogICAgICAgICAgID4+CiAgICAgICA+PgogICAgICAvQ29udGVudHMgNCAwIFIKICA+PgplbmRvYmoKCjQgMCBvYmoKICA8PCAvTGVuZ3RoIDU1ID4+CnN0cmVhbQogIEJUCiAgICAvRjEgMTggVGYKICAgIDAgMCBUZAogICAgKEhlbGxvIFdvcmxkKSBUagogIEVUCmVuZHN0cmVhbQplbmRvYmoKCnhyZWYKMCA1CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAxOCAwMDAwMCBuIAowMDAwMDAwMDc3IDAwMDAwIG4gCjAwMDAwMDAxNzggMDAwMDAgbiAKMDAwMDAwMDQ1NyAwMDAwMCBuIAp0cmFpbGVyCiAgPDwgIC9Sb290IDEgMCBSCiAgICAgIC9TaXplIDUKICA+PgpzdGFydHhyZWYKNTY1CiUlRU9GCg==' ;
        const array = $decodeBase64(b64) ;
        t.expect0(array).toBe(Buffer.from(b64, 'base64')) ;
        const b64_2 = $encodeBase64(array) ;
        t.expect1(b64_2).toBe(b64) ;

        const str = 'This is a string' ;
        const str64 = $encodeBase64(str) ;
        t.expect2(str64).toBe(Buffer.from(str, 'binary').toString('base64')) ;
    })
}) ;
