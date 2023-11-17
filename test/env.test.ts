import { $string } from "../src/commons";
import { $args, $env, $parsedenv, TSArgument, TSArgumentDictionary } from "../src/env";
import { $ext, $withoutext } from "../src/fs";
import { TSDate } from "../src/tsdate";
import { TSLeafNode } from "../src/tsparser";
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

        const definitionWithNegative:TSArgumentDictionary = {
            file:  { 
                struct:{
                    _type:'path',
                    _checker:(v:any) => $withoutext(v).length > 0 && $ext(v).toLowerCase() === 'json'
                }, 
                short:'f', 
                defaultValue:"accounts.json" 
            },
            save: { struct:'boolean', short:'s', negative:'no-save', negativeShort:'n', defaultValue:true },
            output: { struct:'path', short:'o', defaultValue:"created-users.json"}
        } ;

        errors = [] ;
        const [d4,] = $args(definitionWithNegative, { errors:errors, arguments:["-n"] }) ;
        if (!t.expect8(d4).is({
            save:false,
            file:'accounts.json',
            output: 'created-users.json'
        })) { console.log('******************', errors.join('\n')), '******************'} ;

    }),



    group.unary("$env() function", async (t) => {
        const debug = { debug:true } ;
        const b = "\n \t   # empty line with commentaries\n# a last line as commentaries" ;
        const longvar = "__abcdefghijklmnopqrstuvwxyz_0123456789_" ;
        function _var(k:string,v:string):StringDictionary { const d:StringDictionary = {} ; d[k] = v ; return d ; }
        function _b(s:string) { return b+"\n"+s ; }
        t.expect0($env(b, debug)).is({}) ;
        t.expect1($env(_b("export#toto"))).null() ;
        t.expect2($env(_b(" export    #toto"))).null() ;
        t.expect3($env(_b( " export    \n"))).null() ;
        t.expect4($env(_b("a="), debug)).is({a:''});
        t.expect5($env(_b("a=\n"), debug)).is({a:''});
        t.expect6($env(_b("a= \t   \n"), debug)).is({a:''}) ;
        t.expect7($env(_b("a=1"), debug)).is({a:'1'}) ;
        t.expect8($env(_b("export a= \t   \nb=1"), debug)).is({a:'', b:'1'}) ;
        t.expect9($env(_b("exporta= \t   \n"))).null() ;
        t.expectA($env(_b("_a=1"), debug)).is({"_a":'1'}) ;
        t.expectB($env(_b("__a=1"), debug)).is({"__a":'1'}) ;
        t.expectC($env(_b("___a=1"))).null() ;
        t.expectD($env(_b("____a=1"), { underscoreMax:8 })).is({"____a":'1'}) ; ;
        t.expectE($env(_b("_____________a=1"), { underscoreMax:8 })).null() ; ;
        t.expectF($env(_b(longvar+"=myValue is marvelous  \t\t\n"))).is(_var(longvar, 'myValue is marvelous')) ;
        t.expectG($env(_b(longvar+"=1"), { variableMax:16 })).null() ;
        t.expectH($env(_b("first=1\n\r export second=0${first}23"), debug)).is({first:'1', second:"0123"}) ;
        t.expectI($env(_b('first=1\n\r export second="0${first}23"  # commentary\n'), debug)).is({first:'1', "second":"0123"}) ;
        t.expectJ($env(_b("first=1\n\r export second='0${first}23'  # commentary\n"), debug)).is({first:'1', "second":"0${first}23"}) ;
        t.expectK($env(_b("first=1\n\r export second=0${first}23"), { reference:{ first:'2' }, ...debug})).is({first:'1', second:"0123"}) ;
        const mergeBase = { first:'2', third:'3' } ;
        const mergeResult = $env(_b("first=1\n\r export second=0${first}23"), { merge:mergeBase, ...debug}) ;
        t.expectL(mergeResult).is({first:'1', second:"0123", third:"3"}) ;
        t.expectM(mergeBase === mergeResult).OK() ;
        t.expectN($env(_b("first=1\n\r export second=0${third}23"), { reference:{ first:'2', third:'3' }, ...debug})).is({first:'1', second:"0323"}) ;
        t.expectO($env(_b("a='1'   hello"))).null() ;
        t.expectP($env(_b('a="1"   hello'))).null() ;
        t.expectQ($env(_b('a=1   hello'))).is({"a":'1   hello'}) ;

        if (!$inbrowser()) {
            const env = process.env as StringDictionary ;
            const PATH = `${env.PATH}` ;
            const result = $env('NEWPATH=${PATH};/usr/src\nBB="${A}B"', { merge:env, reference:{ A:"B"}, ...debug }) ;
            if (t.expectX(result).is(process.env)) {
                t.expectY(process.env.NEWPATH).is(PATH+';/usr/src') ;
                t.expectZ(process.env.BB).is('BB') ;                
            } 
        }
    }) ;

    group.unary("$parsedEnv() function", async (t) => {
        const check:TSDictionary<TSLeafNode> = {
            ONE:'uint32!',
            TITLE:'string!',
            APP:'string!',
            DATE:'date!',
            XLANG:{
                _type:'language',
                _default:'en'
            }
        }
        const source = [
            'ONE=1',
            'APP="My application"',
            'TITLE="This is ${APP}"',
            'DATE=2023-04-01T10:21:32'
        ].join('\n') ;
        const date = new TSDate(2023,4,1,10,21,32) ;
        const parsed1 = {
            ONE:1, 
            APP:'My application', 
            TITLE:'This is My application',
            DATE:date,
            XLANG:'en'
        } ;

        t.expect1($parsedenv(source, { debug:true, parser:check})).is(parsed1) ;
        t.expect2($parsedenv(`${source}\nTUTU=ABCDEF`, { debug:true, parser:check})).KO() ;

        t.expect3($parsedenv(`${source}\nTUTU=TEST`, { debug:true, parser:check, acceptsUnparsed:true})).is({
            ...parsed1,
            TUTU:'TEST'
        })

        t.expect4($parsedenv(`${source}\nXLANG=1`, { debug:true, parser:check})).KO() ;
        t.expect5($parsedenv(`${source}\nXLANG=`, { debug:true, parser:check})).KO() ;

        t.expect6($parsedenv(`${source}\nXLANG=fr`, { debug:true, parser:check})).is({
            ...parsed1,
            XLANG:'fr'
        })

        t.expect7($parsedenv(source, { debug:true, parser:check, merge:{a:1,b:2, ONE:4, x:'YES', y:undefined, z:null}})).is({
            ...parsed1,
            a:1,
            b:2,
            x:'YES',
            z:null
        }) ;


    }) ;

}) ;
