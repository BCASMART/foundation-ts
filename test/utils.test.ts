import { $inbrowser, $term, $termclean } from "../src/utils";
import { TSTest } from '../src/tstester';

export const utilsGroups = TSTest.group("Utils functions", async (group) => {
    const v0 = "Ceci est un test  RED  " ;
    const vl = "&Z&0Ceci est un &!test&0&Y&r  RED  &0" ;
    const vl2 = "&Z&0Ceci est un &!test&0&Y&r  RED  \x1b[0m" ;
    const v2 = "\x1b[2J\x1b[H\x1b[0mCeci est un \x1b[1mtest\x1b[0m\x1b[43m\x1b[31m  RED  \x1b[0m" ;
    const v3 = "\x1b[2J\x1b[H\x1b[0mCeci est un \x1b[1mtest\x1b[0m\x1b[43\x1b[31m  RED  \x1b[0m" ;
    const v4 = "Ceci est un test\x1b[43  RED  " ;
    const v5 = "&Y&0\x1b[2J&\x1b[H\x1b[0mCeci est& un && \x1b[1mtest\x1b[0m\x1b[43\x1b[31m  RED  \x1b[0m" ;
    const v6 = "&Ceci est& un & test\x1b[43  RED  " ;
    group.unary("Testing terminal functions()", async(t) => {
        t.expect0($term(vl)).toBe(v2) ;
        t.expect0($term(vl2)).toBe(v2) ;
        t.expect0($termclean(v2)).toBe(v0) ;
        t.expect1($termclean(vl)).toBe(v0) ;
        t.expect2($termclean(v3)).toBe(v4) ;
        t.expect2($termclean(v5)).toBe(v6) ;
    }) ;

    group.unary("verifying $inbrowser()", async(t) => {
        t.expect($inbrowser()).toBeFalsy() ;
    }) ;

}) ;
