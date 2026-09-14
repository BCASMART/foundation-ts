import { inspect } from "util";

import { $hexadump, $inbrowser, $insp, $jsonparse, $jsonstrip, $mark, $noop, $sleep, $stack, $term, $termclean } from "../src/utils";
import { TSTest } from '../src/tstester';
import { TSDate } from "../src/tsdate";
import { TSRange } from "../src/tsrange";
import { TSColor } from "../src/tscolor";
import { TSData } from "../src/tsdata";
import { TSCountry } from "../src/tscountry";
import { TSCharset } from "../src/tscharset";

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

    group.unary('$inbrowser() function', async(t) => {
        if ($inbrowser()) {
            t.expect1(typeof document === 'undefined').false() ;
        }
        else {
            t.expect2(typeof document === 'undefined').true() ;
        }
    }) ;

    group.unary("$sleep() function", async (t) => {
        const start = $mark();
        await $sleep(150);
        const end = $mark();
        // setTimeout never fires early, so the meaningful assertion is the lower
        // bound ; the upper bound only guards against $sleep() hanging and must
        // stay loose enough for a loaded event loop / a slow headless engine.
        t.expect0(end-start).gte(0.145) ;
        t.expect1(end-start).lte(0.5) ;
    });

    group.unary("$term() && $termclean() functions()", async (t) => {
        if ($inbrowser()) {
            t.expect0($term(vl)).is(v0);
            t.expect0($term(vl2)).is(v0);
        }
        else {
            t.expect0($term(vl)).is(v2);
            t.expect1($term(vl2)).is(v2);
        }
        t.expect2($termclean(v2)).is(v0);
        t.expect3($termclean(vl)).is(v0);
        t.expect4($termclean(v3)).is(v4);
        t.expect5($termclean(v5)).is(v6);
        // unknown '&?' escape sequence -> exercises the default branch of the escape switch
        t.expect6(typeof $term('&Q text')).is('string') ;
    });

    group.unary("$noop() / $stack() / $hexadump()", async (t) => {
        t.expect0($noop()).undef() ;

        const st = $stack() ;
        if (!$inbrowser()) {
            // structured call-frame stacks rely on Error.prepareStackTrace, a V8/Node-only API
            t.expect1(Array.isArray(st)).true() ;
            t.expect2((st as any[]).length).gt(0) ;
            t.expect3(typeof (st as any[])[0].getFileName === 'function').true() ;
        }
        else {
            t.expect1(!!st).true() ;   // some stack representation is returned (a string under SpiderMonkey)
        }

        // $hexadump just needs to run over a buffer holding '&', printable, and high bytes
        t.expect4($hexadump(Buffer.from([0x26, 0x41, 0x42, 0xff, 0x00, 0x7f, 0x80]))).undef() ;
        t.expect5($hexadump(null)).undef() ;
    }) ;

    group.unary("$jsonstrip() && $jsonparse() functions", async (t) => {
        // $jsonstrip() removes // and /* */ comments but keeps them inside strings
        t.expect0($jsonstrip(null)).is("") ;
        t.expect1($jsonstrip("")).is("") ;
        t.expect2($jsonstrip(`{"a":1} // trailing`)).is(`{"a":1} `) ;
        t.expect3($jsonstrip(`{ /* c */ "a":1 }`)).is(`{  "a":1 }`) ;
        t.expect4($jsonstrip(`{"u":"http://x/y","s":"a//b"}`)).is(`{"u":"http://x/y","s":"a//b"}`) ;
        t.expect5($jsonstrip(`{"s":"a\\"b//c"}`)).is(`{"s":"a\\"b//c"}`) ;   // escaped quote inside the string
        t.expect6($jsonstrip("[1] /* unclosed")).is("[1] ") ;

        // $jsonparse() : trims, optionally strips comments, returns undefined on failure
        t.expect7($jsonparse(`  {"a":1,"b":[2,3]}  `)).is({ a:1, b:[2,3] }) ;
        t.expect8($jsonparse(`{"a":1} // x`, true)).is({ a:1 }) ;
        t.expect9($jsonparse(`{"a":1} // x`)).undef() ;   // no strip -> invalid JSON
        t.expectA($jsonparse(null)).undef() ;
        t.expectB($jsonparse("   ")).undef() ;
        t.expectC($jsonparse("not json")).undef() ;
        t.expectD($jsonparse(TSData.fromString(`/*c*/[1,2,3]`), true)).is([1,2,3]) ;   // UTF-8 data source

        // the optional reviver is forwarded to JSON.parse()
        const dateReviver = (k:string, v:any) => k === 'd' ? new Date(v) : v ;
        const revived = $jsonparse(`{"d":"2020-01-02T00:00:00.000Z","n":5}`, false, dateReviver) ;
        t.expectE(revived?.d instanceof Date).true() ;
        t.expectF(revived?.n).is(5) ;
        // reviver + comment stripping together
        t.expectG($jsonparse(`/*c*/{"d":"2020-01-02T00:00:00.000Z"}`, true, dateReviver)?.d instanceof Date).true() ;
        // a throwing reviver is swallowed like any other parse failure
        t.expectH($jsonparse(`{"a":1}`, false, () => { throw new Error('boom') ; })).undef() ;
        // reviver can drop keys (returning undefined)
        t.expectI($jsonparse(`{"a":1,"secret":2}`, false, (k:string, v:any) => k === 'secret' ? undefined : v)).is({ a:1 }) ;
    }) ;

    group.description("==========================================");
    if ($inbrowser()) {
        group.description("Utils functions test is running in browser");
        group.description("==========================================");
    }
    else {
        group.description("Utils functions test is running in node.js");
        group.description("==========================================");

        // we don't run this test in browser mode because $insp() and $inspect() are the same in this context
        group.unary("$insp() function", async (t) => {
            t.expect($insp(tree).normalizeSpaces()).is(inspect(tree, false, 10).normalizeSpaces());
            t.description("-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.");
        });
    }

});
