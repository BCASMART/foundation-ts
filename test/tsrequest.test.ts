import { TSDate } from "../src/tsdate";
import { TSDictionary } from "../src/types";
import { $query, $generateMultiPartBodyString, TSMultipartEntry } from "../src/tsrequest";

import { TSTest } from '../src/tstester';
import { $password } from "../src/crypto";
import { $length } from "../src/commons";

export const requestGroups = TSTest.group("Testing static request functions", async (group) => {
    const uri = "https://example.com" ;
    const dict:TSDictionary = {
        foo1:'1',
        foo2:'2',
        foo3:new TSDate('19660413T120522'),
        foo4:null,
        foo5:undefined,
        foo6:['1', '1', 1, '2', 3, 'A', 'B']
    } ;

    const s = $query(uri, dict) ;

    group.unary(`$query() function`, async (t) => {
        t.expect(s).is('https://example.com?foo1=1&foo2=2&foo3=1966-04-13T12%3A05%3A22&foo6=1&foo6=2&foo6=3&foo6=A&foo6=B') ;
    }) ;

    group.unary('$generateMultiPartBodyString() function', async t => {
        const str = $password(64, {
            usesLowercase:false,
            usesUppercase:false,
            usesDigits:true,
            usesSpecials:false                
        }) ;
        const dict:TSDictionary<TSMultipartEntry> = {
            'hash':str
        } ;
        t.expect0($length(dict['hash'])).is(64) ;
        const b = '----formdata-bca-093319703357' ;
        const body = await $generateMultiPartBodyString(dict, b) ;
        t.expect1(body).is(`--${b}\r\nContent-Disposition: form-data; name="hash"\r\nContent-Type: text/plain\r\n\r\n${str}\r\n--${b}--\r\n`) ;
    })
}) ;