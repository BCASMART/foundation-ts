
import { $address, $array, $count, $defined, $dict, $email, $fusion, $hasproperties, $includesdict, $int, $intornull, $isdate, $isemail, $isipaddress, $isiterable, $iswhitespace, $isurl, $isuuid, $jsonobj, $keys, $lengthin, $objectcount, $objectMap, $ok, $string, $strings, $toint, $totype, $tounsigned, $unsigned, $unsignedornull, $url, $UUID, $stringOptions, $symbol2string } from "../src/commons";
import { TSDate } from "../src/tsdate";
import { INT_MAX, INT_MIN, UINT_MAX, UUIDv1, UUIDv4 } from "../src/types";
import { TSTest } from '../src/tstester';
import { $uuid } from "../src/crypto";
import { FoundationWhiteSpaces } from "../src/string_tables";
import { TSDateForm } from "../src/tsdatecomp";
import { $equal, $objectsequal } from "../src/compare";

export const commonsGroups = [

TSTest.group("Commons — misc predicates & helpers", async (group) => {

    group.unary('$iswhitespace()', async (t) => {
        t.expect0($iswhitespace(' ')).true() ;
        t.expect1($iswhitespace('\t')).true() ;
        t.expect2($iswhitespace(' ')).true() ;
        t.expect3($iswhitespace('a')).false() ;
        t.expect4($iswhitespace('  ')).false() ;          // set holds single code points
        t.expect5($iswhitespace(0x20)).true() ;           // by code point
        t.expect6($iswhitespace(0x41)).false() ;
        t.expect7($iswhitespace(null)).false() ;
        t.expect8($iswhitespace(undefined)).false() ;
    }) ;

    group.unary('$isiterable()', async (t) => {
        t.expect0($isiterable([1, 2])).true() ;
        t.expect1($isiterable('str')).true() ;
        t.expect2($isiterable(new Set())).true() ;
        t.expect3($isiterable(new Map())).true() ;
        t.expect4($isiterable({})).false() ;
        t.expect5($isiterable(42)).false() ;
        t.expect6($isiterable(null)).false() ;
    }) ;

    group.unary('$isipaddress()', async (t) => {
        t.expect0($isipaddress('192.168.1.1')).true() ;
        t.expect1($isipaddress('  10.0.0.255  ')).true() ;         // trimmed
        t.expect2($isipaddress('::1')).true() ;
        t.expect3($isipaddress('2001:db8::ff00:42:8329')).true() ;
        t.expect4($isipaddress('999.1.1.1')).false() ;
        t.expect5($isipaddress('not an ip')).false() ;
        t.expect6($isipaddress(123 as any)).false() ;
    }) ;

    group.unary('$address()', async (t) => {
        t.expect0($address({ city:'Paris', country:'FR' })).is({ city:'Paris', country:'FR' as any }) ;
        t.expect1($address({ city:' Lyon ', country:'france', zipCode:'69000' } as any))
         .is({ city:'Lyon', country:'FR' as any, zipCode:'69000' } as any) ;   // city trimmed, country normalised
        t.expect2($address({ city:'', country:'FR' } as any)).null() ;
        t.expect3($address({ city:'X', country:'ZZ' } as any)).null() ;         // unknown country
        t.expect4($address(null)).null() ;
        t.expect5($address('x' as any)).null() ;
    }) ;

    group.unary('$array() / $totype() / $lengthin()', async (t) => {
        t.expect0($array(1, 2, 3)).is([1, 2, 3]) ;
        t.expect1($array()).is([]) ;
        t.expect2($totype<string>('hi')).is('hi') ;
        t.expect3($totype<string>(null)).null() ;
        t.expect4($totype<string>(undefined)).null() ;
        t.expect5($lengthin('abc', 1, 5)).true() ;
        t.expect6($lengthin('abc', 4)).false() ;
        t.expect7($lengthin('abcdef', 0, 3)).false() ;
        t.expect8($lengthin(null, 0, 3)).true() ;               // length 0
        t.expect9($lengthin(Buffer.from([1, 2]), 2, 2)).true() ;
    }) ;

    group.unary('$objectMap()', async (t) => {
        t.expect0($objectMap({ a:1, b:2 })).is(new Map([['a', 1], ['b', 2]])) ;
        t.expect1($objectMap(new Map<any, any>([[1, 'x'], [2, 'y']]))).is(new Map([['1', 'x'], ['2', 'y']])) ;
        t.expect2($objectMap(null)).is(new Map()) ;
        const doubled = $objectMap({ a:1, b:2, c:3 }, (k, v) => [k === 'b' ? undefined : `${k}${k}`, v * 2]) ;
        t.expect3(doubled).is(new Map([['aa', 2], ['cc', 6]])) ;   // 'b' dropped (undefined key)
        t.expect4($objectMap({ x:undefined })).is(new Map()) ;     // undefined value dropped
    }) ;
}),

TSTest.group("Commons interpretation functions", async (group) => {
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
        t.expect3($unsignedornull(NaN)).null();
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
        // safe integers in the ]int32, uint32] range must be kept as-is (not int32-wrapped)
        t.expectJ($toint(3000000000)).is(3000000000);
        t.expectK($toint(3000000000.7)).is(3000000000);
        t.expectL($toint(-3000000000)).is(-3000000000);
        t.expectM($toint(4294967295)).is(4294967295);
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
        // safe integers in the ]int32, uint32] range must be kept as-is (not int32-wrapped to a negative then clamped to 0)
        t.expectD($tounsigned(3000000000)).is(3000000000);
        t.expectE($tounsigned(3000000000.7)).is(3000000000);
        t.expectF($tounsigned(4294967295)).is(4294967295);
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
        // 4, 5, 6 : regression test: $keys() used to use Object.getOwnPropertyNames() 
        // which would leak an Array's own, non-enumerable "length". 
        // New implementation only returns enumerable keys.
        t.expect4($keys([10, 20, 30])).is(['0', '1', '2']) ;
        t.expect5($keys([10, 20, 30]).length).is(3) ;
        t.expect6($objectcount([10, 20, 30])).is(3) ;
    }) ;

    group.unary("$dict() function", async(t) => {
        t.expect1($dict(DICT, ['a', 'c'])).is(SUB) ;
        t.expect2($dict(DICT, ['a', 'c', 'd' as any])).is(SUB) ; // force TS to ignore 'd' because it knows this key is not in DICT
    }) ;
    
    group.unary("$includesdict() function", async(t) => {
        t.expect1($includesdict(DICT, SUB)).true() ;
        t.expect2($includesdict(DICT, SUB, ['c'])).true() ;
        t.expect3($includesdict(DICT, SUB, ['a', 'd'])).true() ; // because 'd' key is absent on both dicts
        t.expect4($includesdict(DICT, { a:'not-the-right-value' })).false() ; // value mismatch
        t.expect5($includesdict({}, {})).false() ;                            // nothing to check -> false
        t.expect6($includesdict(null, { a:1 })).false() ;                     // null source -> false
    }) ;

    group.unary("$fusion() function", async(t) => {
        const [fusion1,] = $fusion(DICT, DICT_B) ;
        t.expect1(fusion1).is({a:'A', b:'b', c:'c', d:'D', h:[0,1]}) ;

        const [fusion2,] = $fusion(DICT, DICT_C) ;
        t.expect2(fusion2).is({a:'A', b:'b', c:'c', d:'D', h:[0,1]}) ;

        // custom array / object fusion callbacks
        const [fusion3,] = $fusion({ h:[1, 2], o:{ x:1 } }, { h:[3, 4], o:{ y:2 } }, {
            fusionArrays:(a, b) => [...a, ...b],
            fusionObjects:(a, b) => ({ ...a, ...b }),
        }) ;
        t.expect3(fusion3).is({ h:[1, 2, 3, 4], o:{ x:1, y:2 } }) ;

        // a non-string property name is rejected
        t.expect4(() => $fusion({ a:1 }, { b:2 }, { B:{ properties:[Symbol('nope')] as any } }))
            .throws(/valid string properties/) ;
    }) ;

    group.unary("$intornull() / $unsignedornull() / $toint() / $tounsigned() — bigint inputs", async(t) => {
        const HUGE = 10n ** 40n ;

        t.expect0($intornull(7n)).is(7) ;
        t.expect1($intornull(HUGE)).null() ;
        t.expect2($intornull(-HUGE)).null() ;

        t.expect3($unsignedornull(7n)).is(7) ;
        t.expect4($unsignedornull(-3n)).null() ;
        t.expect5($unsignedornull(HUGE)).null() ;

        t.expect6($toint(7n)).is(7) ;
        t.expect7($toint(HUGE)).is(0) ;
        t.expect8($toint(HUGE, 42 as any)).is(42) ;

        t.expectA($tounsigned(7n as any)).is(7) ;
        t.expectB($tounsigned(-5n as any)).is(0) ;
        t.expectC($tounsigned(HUGE as any)).is(0) ;
    }) ;

    group.unary("$jsonobj() — symbol / function fall-through", async(t) => {
        t.expect0($jsonobj(Symbol('x'))).undef() ;
        t.expect1($jsonobj(() => 1)).undef() ;
        t.expect2($jsonobj(null)).null() ;
        t.expect3($jsonobj(42)).is(42) ;
        t.expect4($jsonobj({ a:1 })).is({ a:1 }) ;   // object case
        t.expect5($jsonobj(true)).is(true) ;         // boolean case
    }) ;

    group.unary("commons — remaining small branches", async(t) => {
        // $objectcount / $count with Map & Set operands
        t.expect0($objectcount(new Map([['a', 1], ['b', 2]]))).is(2) ;
        t.expect1($count(new Set([1, 2, 3]))).is(3) ;

        // $isurl via the URL instance arm
        t.expect2($isurl(new URL('http://example.org/'))).true() ;

        // $hasproperties: empty prop name and missing property
        t.expect3($hasproperties({ a:1 }, [''])).false() ;
        t.expect4($hasproperties({ a:1 }, ['b'])).false() ;

        // $UUID with a non-string argument
        t.expect5($UUID(123 as any)).null() ;

        // $toint / string branch
        t.expect6($toint('42abc')).is(42) ;

        // $objectMap default callback: a key that stringifies to '' -> [undefined, v]
        t.expect7($objectMap(new Map<any, any>([[undefined, 1], ['k', 2]]))).is(new Map([['k', 2]])) ;

        // $fusion: null operands and a function-valued property (default filter -> undefined)
        t.expect8($fusion(null, { x:1 })[0]).is({ x:1 }) ;
        t.expect9($fusion({ x:1 }, null)[0]).is({ x:1 }) ;
        t.expectA($fusion(null, null)[0]).is({}) ;
        t.expectB($fusion({ a:1 }, { b:() => 1 })[0]).is({ a:1 }) ;   // function value filtered out
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
        t.expectM($isurl('http://52.33.2040.12')).false() ;
        t.expectN($isurl('http://520.33.204.12')).false() ;
        t.expectO($isurl('http://52.330.204.12')).false() ;
        t.expectP($isurl('http://52.33.204.1200')).false() ;
        t.expectQ($isurl('http://localhost/tutu?titi=1')).true() ;
        t.expectR($isurl('http://localhost/tutu?titi=1', {refusesParameters:true})).false() ;

    }) ;
    group.unary("$url() function", async(t) => {
        t.expect0($url('http://example.com')).is('http://example.com/') ;
        t.expect1($url('https://example.com')).is('https://example.com/') ;
        t.expect3($url('//example.com')).null() ;
        t.expect4($url('//example')).null() ;
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
        t.expect7($email('a@b.c')).null() ;
        t.expect8($email('a@b.')).null() ;
        t.expect9($email('a@b')).null() ;
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
        t.expectM($isemail('a@b.c')).false() ;
        t.expectN($isemail('a@b.')).false() ;
        t.expectO($isemail('a@b')).false() ;
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

    group.unary("$string() function", async(t) => {
        const conversionOptions:$stringOptions = {
            trueValue: "YES",
            falseValue: "NO",
            nullRepresentation: "<null>",
            undefinedRepresentation: "<undefined>",
            objectToStringConversion: (v:any) => {
                const toPrimitive = v[Symbol.toPrimitive] ;
                if (typeof toPrimitive === 'function') {
                    try {
                        const p = toPrimitive.call(v, 'string') ;
                        if (typeof p === 'string') { return p ; }
                        if (typeof p === 'symbol') { return $symbol2string(p) ; }
                    }
                    catch { /* v's [Symbol.toPrimitive] misbehaved : fall through to valueOf() */ }
                }
                const valueOf = v.valueOf ;
                if (typeof valueOf === 'function') {
                    try {
                        const p = valueOf.call(v) ;
                        if (typeof p === 'string') { return p ; }
                        if (typeof p === 'number') { return $string(p) ; }
                    }
                    catch { /* nothing left to try */ }
                }
                return '<no representation>' ;
            },
        } ;
        t.expect0($string("abc")).is("abc") ;
        t.expect1($string("")).is("") ;
        t.expect2($string(undefined)).is("") ;
        t.expect3($string(null)).is("") ;
        t.expect4($string(42)).is("42") ;
        t.expect5($string(-3.5)).is("-3.5") ;
        t.expect6($string(42n)).is("42") ;
        t.expect7($string(true)).is("true") ;
        t.expect8($string(false)).is("false") ;
        t.expect9($string(true, conversionOptions)).is("YES") ;
        t.expectA($string(false, conversionOptions)).is("NO") ;
        t.expectB($string(undefined, conversionOptions)).is("<undefined>") ;
        t.expectC($string(null, conversionOptions)).is("<null>") ;
        t.expectD($string(new Set(), conversionOptions)).is("<no representation>") ;
        t.expectE($string({ a:1 }, conversionOptions)).is("<no representation>") ;
        t.expectF($string([1, 2, 3])).is("1,2,3") ;
        t.expectG($string({ toString:() => "custom" })).is("custom") ;
        t.expectH($string({ a:1 })).is("[object Object]") ;
        // symbols: the description / registered key is returned, not "Symbol(x)"
        t.expectI($string(Symbol("foo"))).is("foo") ;
        t.expectJ($string(Symbol())).is("") ;
        t.expectH($string(Symbol.for("global-key"))).is("global-key") ;
    }) ;

    group.unary('$objectsequal() function', async(t) => {
        const a = {
            ammo: 100000,
            contact: {
              birthday: "1966-04-13T00:00:00.000Z",
              completeName: 'John Doe',
              firstName: 'John',
              lang: 'en',
              lastName: 'Doe'
            },
            kind: 'four',
            name: 'A test object'
        } ;
        const b = {
            name: 'A test object',
            contact: {
              lastName: 'Doe',
              firstName: 'John',
              lang: 'en',
              birthday: "1966-04-13T00:00:00.000Z",
              completeName: 'John Doe'
            },
            ammo: 100000            
        }
        t.expect0($objectsequal(undefined,undefined)).true() ;
        t.expect1($objectsequal(null,null)).true() ;

        t.expect2($objectsequal(undefined,null)).false() ;
        t.expect3($objectsequal(null,undefined)).false() ;

        t.expect4($objectsequal(a,a)).true() ;
        t.expect5($objectsequal(b,b)).true() ;

        t.expect6($objectsequal(a,b)).false() ;
        t.expect7($objectsequal(b,a)).false() ;

        t.expectA($objectsequal({},{})).true() ;
        t.expectB($objectsequal({},undefined)).false() ;
        t.expectC($objectsequal({},null)).false() ;
        t.expectD($objectsequal(undefined,{})).false() ;
        t.expectE($objectsequal(null,{})).false() ;
                
        t.expectF($objectsequal(a,null)).false() ;
        t.expectG($objectsequal(a,undefined)).false() ;
        t.expectH($objectsequal(a,{})).false() ;
        t.expectI($objectsequal(null,a)).false() ;
        t.expectJ($objectsequal(undefined,a)).false() ;
        t.expectK($objectsequal({},a)).false() ;

        (b as any).kind = 'four' ;
        t.expectL($objectsequal(a,b)).true() ;
        t.expectM($objectsequal(b,a)).true() ;

        (b as any).kind = null ;
        t.expectN($objectsequal(a,b)).false() ;
        t.expectO($objectsequal(b,a)).false() ;

        (b as any).kind = undefined ;
        t.expectP($objectsequal(a,b)).false() ;
        t.expectQ($objectsequal(b,a)).false() ;

        (a as any).kind = null ;
        t.expectR($objectsequal(a,b)).false() ;
        t.expectS($objectsequal(b,a)).false() ;

        (a as any).kind = undefined ;
        t.expectT($objectsequal(a,b)).true() ;
        t.expectU($objectsequal(b,a)).true() ;

        delete (a as any).kind ;
        t.expectV($objectsequal(a,b)).true() ;
        t.expectW($objectsequal(b,a)).true() ;
        
        delete (b as any).kind ;
        t.expectX($objectsequal(a,b)).true() ;
        t.expectY($objectsequal(b,a)).true() ;

    }) ;

    group.unary('$equal() function used as $objectequals()', async(t) => {
        const a = {
            ammo: 100000,
            contact: {
              birthday: "1966-04-13T00:00:00.000Z",
              completeName: 'John Doe',
              firstName: 'John',
              lang: 'en',
              lastName: 'Doe'
            },
            kind: 'four',
            name: 'A test object'
        } ;
        const b = {
            name: 'A test object',
            contact: {
              lastName: 'Doe',
              firstName: 'John',
              lang: 'en',
              birthday: "1966-04-13T00:00:00.000Z",
              completeName: 'John Doe'
            },
            ammo: 100000            
        }
        t.expect0($equal(undefined,undefined)).true() ;
        t.expect1($equal(null,null)).true() ;

        t.expect2($equal(undefined,null)).false() ;
        t.expect3($equal(null,undefined)).false() ;

        t.expect4($equal(a,a)).true() ;
        t.expect5($equal(b,b)).true() ;

        t.expect6($equal(a,b)).false() ;
        t.expect7($equal(b,a)).false() ;

        t.expectA($equal({},{})).true() ;
        t.expectB($equal({},undefined)).false() ;
        t.expectC($equal({},null)).false() ;
        t.expectD($equal(undefined,{})).false() ;
        t.expectE($equal(null,{})).false() ;
                
        t.expectF($equal(a,null)).false() ;
        t.expectG($equal(a,undefined)).false() ;
        t.expectH($equal(a,{})).false() ;
        t.expectI($equal(null,a)).false() ;
        t.expectJ($equal(undefined,a)).false() ;
        t.expectK($equal({},a)).false() ;

        (b as any).kind = 'four' ;
        t.expectL($equal(a,b)).true() ;
        t.expectM($equal(b,a)).true() ;

        (b as any).kind = null ;
        t.expectN($equal(a,b)).false() ;
        t.expectO($equal(b,a)).false() ;

        (b as any).kind = undefined ;
        t.expectP($equal(a,b)).false() ;
        t.expectQ($equal(b,a)).false() ;

        (a as any).kind = null ;
        t.expectR($equal(a,b)).false() ;
        t.expectS($equal(b,a)).false() ;

        (a as any).kind = undefined ;
        t.expectT($equal(a,b)).true() ;
        t.expectU($equal(b,a)).true() ;

        delete (a as any).kind ;
        t.expectV($equal(a,b)).true() ;
        t.expectW($equal(b,a)).true() ;
        
        delete (b as any).kind ;
        t.expectX($equal(a,b)).true() ;
        t.expectY($equal(b,a)).true() ;

    })




}),

] ;
