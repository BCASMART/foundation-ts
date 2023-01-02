import { $env, $inbrowser, $insp, $term, $termclean } from "../src/utils";
import { TSTest } from '../src/tstester';
import { inspect } from "util";
import { TSDate } from "../src/tsdate";
import { TSRange } from "../src/tsrange";
import { TSColor } from "../src/tscolor";
import { TSData } from "../src/tsdata";
import { TSCountry } from "../src/tscountry";
import { TSCharset } from "../src/tscharset";
import { StringDictionary } from "../src/types";

function stringifyMe(e: any) { return `${e}`; }

export const utilsGroups =TSTest.group("Other utils functions", async (group) => {
    const v0 = "Ceci est un test  RED  ";
    const vl = "&Z&0Ceci est un &!test&0&Y&r  RED  &0";
    const vl2 = "&Z&0Ceci est un &!test&0&Y&r  RED  \x1b[0m";
    const v2 = "\x1b[2J\x1b[H\x1b[0mCeci est un \x1b[1mtest\x1b[0m\x1b[43m\x1b[31m  RED  \x1b[0m";
    const v3 = "\x1b[2J\x1b[H\x1b[0mCeci est un \x1b[1mtest\x1b[0m\x1b[43\x1b[31m  RED  \x1b[0m";
    const v4 = "Ceci est un test\x1b[43  RED  ";
    const v5 = "&Y&0\x1b[2J&\x1b[H\x1b[0mCeci est& un && \x1b[1mtest\x1b[0m\x1b[43\x1b[31m  RED  \x1b[0m";
    const v6 = "&Ceci est& un & test\x1b[43  RED  ";

    const leaf = { leaf: 'common leaf' };
    const leaf2 = { leaf: 'common leaf2' };
    const set = new Set<any>();
    const map = new Map<any, any>();
    const uint8array = TSCharset.binaryCharset().uint8ArrayFromString('ABCDEFG\u0001') ;
    const uint16array = new Uint16Array([1, 2, 614]) ;
    const uint32array = new Uint32Array([1, 2, 614, 100000]) ;
    const ab = new ArrayBuffer(4) ;
    const ab8 = new Uint8Array(ab) ;
    ab8[0] = 7 ;
    ab8[1] = 11  ;
    ab8[2] = 128 ;
    ab8[3] = 255 ;   

    const ab2 = new ArrayBuffer(8) ;
    const ab16 = new Uint16Array(ab2) ;
    ab16[0] = 7 ;
    ab16[1] = 42  ;
    ab16[2] = 1542 ;
    ab16[3] = 25000 ;   

    set.add(leaf);
    set.add(leaf2);
    map.set('L1', leaf);
    map.set('L2', leaf2);

    let tree: any = {
        one: 1,
        two: 'two',
        abuf: ab,
        abuf2: ab2,
        buf: Buffer.from('ABCDEFG\u0001'),
        data: new TSData(uint8array),
        array8: uint8array,
        array16: uint16array,
        array32: uint32array,
        leaf: leaf,
        list: ['l', 'e', 'a', 'f', leaf],
        date: new TSDate(),
        date2: new Date(),
        range: new TSRange(1, 5),
        color: TSColor.rgb('red'),
        country: TSCountry.country("GB"),
        sub1: {
            sub: 1,
            sub2: {
                sub: 2,
                leaf: leaf,
                undef: undefined,
                fn: stringifyMe,
                nil: null,
                sub3: {
                    sub: 3,
                    flag: false,
                    sub4: {
                        sub: 4,
                        flag: true
                    },
                    sub4a: [
                        'sub4a',
                        leaf2,
                    ]
                }
            }
        },
        set: set,
        map: map
    }
    tree.sub1.sub2.parent = tree.sub1;
    tree.sub1.sub2.root = tree;
    tree.sub1.sub2.sub3.root = tree;
    tree.sub1.sub2.sub3.parent = tree.sub1.sub2;



    group.unary("Testing terminal functions()", async (t) => {
        if ($inbrowser()) {
            t.expect0($term(vl)).toBe(v0);
            t.expect0($term(vl2)).toBe(v0);
        }
        else {
            t.expect0($term(vl)).toBe(v2);
            t.expect1($term(vl2)).toBe(v2);
        }
        t.expect2($termclean(v2)).toBe(v0);
        t.expect3($termclean(vl)).toBe(v0);
        t.expect4($termclean(v3)).toBe(v4);
        t.expect5($termclean(v5)).toBe(v6);
    });
    group.description("==========================================");
    if ($inbrowser()) {
        group.description("Utils functions test is running in browser");
        group.description("==========================================");
    }
    else {
        group.description("Utils functions test is running in node.js");
        group.description("==========================================");

        // we don't run this test in browser mode because $insp() and $inspect() are the same in this context
        group.unary("Testing $insp() function", async (t) => {
            t.expect($insp(tree).normalizeSpaces()).toBe(inspect(tree, false, 10).normalizeSpaces());
            t.description("-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.");
        });
    }

    group.unary("$env() function", async (t) => {
        const debug = { debug:true } ;
        const b = "\n \t   # empty line with commentaries\n# a last line as commentaries" ;
        const longvar = "__abcdefghijklmnopqrstuvwxyz_0123456789_" ;
        function _var(k:string,v:string):StringDictionary { const d:StringDictionary = {} ; d[k] = v ; return d ; }
        function _b(s:string) { return b+"\n"+s ; }
        t.expect0($env(b, debug)).toBe({}) ;
        t.expect1($env(_b("export#toto"))).toBeNull() ;
        t.expect2($env(_b(" export    #toto"))).toBeNull() ;
        t.expect3($env(_b( " export    \n"))).toBeNull() ;
        t.expect4($env(_b("a="), debug)).toBe({a:''});
        t.expect5($env(_b("a=\n"), debug)).toBe({a:''});
        t.expect6($env(_b("a= \t   \n"), debug)).toBe({a:''}) ;
        t.expect7($env(_b("a=1"), debug)).toBe({a:'1'}) ;
        t.expect8($env(_b("export a= \t   \nb=1"), debug)).toBe({a:'', b:'1'}) ;
        t.expect9($env(_b("exporta= \t   \n"))).toBeNull() ;
        t.expectA($env(_b("_a=1"), debug)).toBe({"_a":'1'}) ;
        t.expectB($env(_b("__a=1"), debug)).toBe({"__a":'1'}) ;
        t.expectC($env(_b("___a=1"))).toBeNull() ;
        t.expectD($env(_b("____a=1"), { underscoreMax:8 })).toBe({"____a":'1'}) ; ;
        t.expectE($env(_b("_____________a=1"), { underscoreMax:8 })).toBeNull() ; ;
        t.expectF($env(_b(longvar+"=myValue is marvelous  \t\t\n"))).toBe(_var(longvar, 'myValue is marvelous')) ;
        t.expectG($env(_b(longvar+"=1"), { variableMax:16 })).toBeNull() ;
        t.expectH($env(_b("first=1\n\r export second=0${first}23"), debug)).toBe({first:'1', second:"0123"}) ;
        t.expectI($env(_b('first=1\n\r export second="0${first}23"  # commentary\n'), debug)).toBe({first:'1', "second":"0123"}) ;
        t.expectJ($env(_b("first=1\n\r export second='0${first}23'  # commentary\n"), debug)).toBe({first:'1', "second":"0${first}23"}) ;
        t.expectK($env(_b("first=1\n\r export second=0${first}23"), { reference:{ first:'2' }, ...debug})).toBe({first:'1', second:"0123"}) ;
        const mergeBase = { first:'2', third:'3' } ;
        const mergeResult = $env(_b("first=1\n\r export second=0${first}23"), { merge:mergeBase, ...debug}) ;
        t.expectL(mergeResult).toBe({first:'1', second:"0123", third:"3"}) ;
        t.expectM(mergeBase === mergeResult).toBeTruthy() ;
        t.expectN($env(_b("first=1\n\r export second=0${third}23"), { reference:{ first:'2', third:'3' }, ...debug})).toBe({first:'1', second:"0323"}) ;
        t.expectO($env(_b("a='1'   hello"))).toBeNull() ;
        t.expectP($env(_b('a="1"   hello'))).toBeNull() ;
        t.expectQ($env(_b('a=1   hello'))).toBe({"a":'1   hello'}) ;

        if (!$inbrowser()) {
            const env = process.env as StringDictionary ;
            const PATH = `${env.PATH}` ;
            const result = $env('NEWPATH=${PATH};/usr/src\nBB="${A}B"', { merge:env, reference:{ A:"B"}, ...debug }) ;
            if (t.expectX(result).toBe(process.env)) {
                t.expectY(process.env.NEWPATH).toBe(PATH+';/usr/src') ;
                t.expectZ(process.env.BB).toBe('BB') ;                
            } 
        }
    }) ;
});
