import { $string } from "../src/commons";
import { $args, $env, TSArgument, TSArgumentDictionary } from "../src/env";
import { TSTest } from "../src/tstester";
import { StringDictionary, TSDictionary } from "../src/types";
import { $inbrowser } from "../src/utils";

export const envGroups = TSTest.group("Environment manipulation functions", async (group) => {
    group.unary("$args() function", async (t) => {
        const limit:TSArgument = {
            struct:'boolean',
            short:'l',
            negative:'no-limit'
        }
        const definition:TSArgumentDictionary = {
            'verbose':{
                struct:'boolean',
                short:'v'
            },
            input:'string!',
            output:'string!',
            limit:limit,
            history:{
                struct:'number',
                short:'n'
            }
        }
        const dict1:TSDictionary = {
            verbose:true,
            history:30,
            input:'input-file.txt',
            output:'output-file.gen'
        }
        const arg1 = ['-v', 'one', '-n', $string(dict1.history), '--input', dict1.input, '-output', dict1.output, 'two', 'three'] ;
        let errors:string[] = [] ;
        const arr1 = ['one', 'two', 'three'] ;
        const [d1, a1] = $args(definition, { errors:errors, arguments:arg1 }) ;
        if (!t.expect1(d1).is(dict1)) { console.log('******************', errors.join('\n')), '******************'} ;
        t.expect2(a1).is(arr1) ;

        const [d11, a11] = $args({... definition, limit:{...limit, defaultValue:true}}, { errors:errors, arguments:arg1 }) ;
        if (!t.expect1(d11).is({...dict1, limit:true})) { console.log('******************', errors.join('\n')), '******************'} ;
        t.expect2(a11).is(arr1) ;

        const arg2 = ['-vl', 'zero', ...arg1.slice(1)] ;
        const dict2 = {limit:true, ...dict1} ;
        const arr2 = ['zero', ...arr1] ;
        errors = [] ;
        const [d2, a2] = $args(definition, { errors:errors, arguments:arg2 }) ;
        if (!t.expect5(d2).is(dict2)) { console.log('******************', errors.join('\n')), '******************'} ;
        t.expect6(a2).is(arr2) ;

        errors = [] ;
        const [d3,] = $args(definition, { errors:errors, arguments:['-H', ...arg2] }) ;
        t.expect7(d3).KO() ;


    }),



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
}) ;
