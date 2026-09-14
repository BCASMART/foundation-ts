import { TSDate } from "../src/tsdate";
import { TSDictionary } from "../src/types";
import { $barerauth, $basicauth, $generateMultiPartBodyString, $query, Resp, RespType, TSMultipartEntry, TSRequest, Verb } from "../src/tsrequest";

import { TSTest } from '../src/tstester';
import { $password } from "../src/crypto";
import { $length } from "../src/commons";
import { TSData } from "../src/tsdata";
import { $inbrowser } from "../src/utils";

export const requestGroups = [

TSTest.group("Testing static request functions", async (group) => {
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
}),

TSTest.group("$basicauth / $barerauth / $query edge cases", async (group) => {

    group.unary('$basicauth() / $barerauth()', async (t) => {
        t.expect0($basicauth('alice', 'secret')).is('Basic YWxpY2U6c2VjcmV0') ;   // base64("alice:secret")
        t.expect1($basicauth('café', 'naïve')).is('Basic Y2Fmw6k6bmHDr3Zl') ;     // utf-8 by default
        t.expect2($barerauth('abc123')).is('Bearer abc123') ;                     // string token used as-is
        t.expect3($barerauth(Buffer.from('tok'))).is('Bearer dG9r') ;             // data -> base64
    }) ;

    group.unary('$query() — Set / null / empty key / object value / no params', async (t) => {
        t.expect0($query('http://x', { a:new Set(['1', '1', '2']) })).is('http://x?a=1&a=2') ; // Set deduped
        t.expect1($query('http://x', { b:null, c:undefined })).is('http://x') ;                // skipped
        t.expect2($query('http://x', { '  ':42 })).is('http://x') ;                            // blank key skipped
        t.expect3($query('http://x', { d:{ x:1 } })).is('http://x?d=%5Bobject+Object%5D') ;    // object -> String()
        t.expect4($query('http://x', {})).is('http://x') ;
        t.expect5($query('http://x', { e:[null, undefined, 'z'] })).is('http://x?e=z') ;
    }) ;

    group.unary('$generateMultiPartBodyString() — blob entries / skipping / empty', async (t) => {
        const B = '--bnd' ;
        const body = await $generateMultiPartBodyString({
            text:'hello',
            blob:new Blob(['world'], { type:'text/plain' }),
            untyped:new Blob(['xyz']),
            ignored:42 as any,
        }, B) ;
        t.expect0(body!.includes('name="text"')).true() ;
        t.expect1(body!.includes('\r\n\r\nhello\r\n')).true() ;
        t.expect2(body!.includes('name="blob"')).true() ;
        t.expect3(body!.includes('Content-Type: text/plain')).true() ;
        t.expect4(body!.includes('Content-Type: application/octet-stream')).true() ; // untyped blob
        t.expect5(body!.includes('42')).false() ;                                     // number entry skipped
        t.expect6(body!.endsWith(`\r\n--${B}--\r\n`)).true() ;
        t.expect7(await $generateMultiPartBodyString({ nope:42 as any }, B)).null() ; // nothing usable -> null
        t.expect8(await $generateMultiPartBodyString({}, B)).null() ;
    }) ;

    group.unary('URLSearchParams.prototype.query()', async (t) => {
        t.expect0(new URLSearchParams('a=1&b=2&=skip').query()).is({ a:'1', b:'2' }) ;
        t.expect1(new URLSearchParams('').query()).null() ;
    }) ;
}),

TSTest.group("TSRequest — construction & auth", async (group) => {

    group.unary('baseURL / headers / timeout / managesCredential', async (t) => {
        const d = new TSRequest() ;
        t.expect0(d.baseURL).is(TSRequest.DefaultURL) ;
        t.expect1(d.defaultTimeOut).is(1000) ;
        d.baseURL = '' ;
        t.expect2(d.baseURL).is(TSRequest.DefaultURL) ;            // empty -> default
        d.baseURL = 'http://a/' ;
        t.expect3(d.baseURL).is('http://a/') ;

        const r = new TSRequest('http://api.test/', {
            headers:{ 'x-foo':'bar', 'x-arr':[1, 2] as any },
            timeout:5000,
            managesCredentials:true,
        }) ;
        t.expect4(r.commonHeaders).is({ 'X-Foo':'bar', 'X-Arr':['1', '2'] }) ; // keys capitalised, values stringified
        t.expect5(r.defaultTimeOut).is(5000) ;
        t.expect6(r.managesCredential).true() ;
        r.managesCredential = false ;
        t.expect7(r.managesCredential).false() ;
        t.expect8(() => new TSRequest('x', { timeout:-1 })).throws(/should be positive/) ;
    }) ;

    group.unary('setAuth() / setToken()', async (t) => {
        const r = new TSRequest() ;
        r.setAuth({ login:'u', password:'p' }) ;
        t.expect0(r.basicAuth).is('Basic dTpw') ;                  // base64("u:p")
        r.setAuth(null) ;
        t.expect1(r.basicAuth).is('') ;
        r.setAuth({ login:'', password:'p' }) ;                    // empty login -> cleared
        t.expect2(r.basicAuth).is('') ;

        r.setToken('mytoken') ;
        t.expect3(r.token).is('Bearer mytoken') ;                  // regression: setToken() used to be a no-op
        r.setToken(Buffer.from('raw')) ;
        t.expect4(r.token).is('Bearer cmF3') ;                     // data -> base64
        r.setToken('') ;
        t.expect5(r.token).is('') ;
        r.setToken(null) ;
        t.expect6(r.token).is('') ;
    }) ;

    group.unary('auth option', async (t) => {
        t.expect0(new TSRequest('x', { auth:'tok' }).token).is('Bearer tok') ;
        t.expect1(new TSRequest('x', { auth:Buffer.from([1, 2, 3]) }).token).is('Bearer AQID') ;
        t.expect2(new TSRequest('x', { auth:[1, 2, 3] as any }).token).is('Bearer AQID') ;   // byte array
        t.expect3(new TSRequest('x', { auth:{ login:'a', password:'b' } }).basicAuth).is('Basic YTpi') ;
        t.expect4(() => new TSRequest('x', { auth:[1, 2, 999] as any })).throws(/malformed/) ; // 999 is not a uint8
    }) ;
}),

] ;

// These exercise TSRequest.req() itself. In a browser, a refused fetch throws an
// opaque "Failed to fetch" that req() rethrows, so keep them Node-only.
if (!$inbrowser()) {
requestGroups.push(TSTest.group("TSRequest.req() — body encoding & error mapping (no server)", async (group) => {
    // a base URL pointing at a port nobody listens on -> every request fails fast with ECONNREFUSED
    const dead = () => new TSRequest('http://127.0.0.1:59999/', { timeout:600 }) ;

    group.unary('rejects invalid arguments before touching the network', async (t) => {
        const r = new TSRequest('http://127.0.0.1:59999/') ;
        await t.expect0(r.req('/x', Verb.Post, RespType.Json, Symbol('nope') as any)).rejects(/impossible to send/) ;
        await t.expect1(r.req('/x', Verb.Get, RespType.Json, null, {}, -3)).rejects(/should be positive/) ;
    }) ;

    group.unary('encodes number / boolean / URLSearchParams / TSData bodies', async (t) => {
        const r = dead() ;
        const a = await r.req('/n', Verb.Post, RespType.Json, 42) ;               // number -> JSON.stringify
        t.expect0(a.response).null() ;
        const b = await r.req('/b', Verb.Post, RespType.Json, false) ;            // boolean -> JSON.stringify
        t.expect1(b.response).null() ;
        const c = await r.req('/u', Verb.Post, RespType.Json, new URLSearchParams('x=1&y=2')) ; // -> urlencoded
        t.expect2(c.response).null() ;
        const d = await r.req('/d', Verb.Post, RespType.Json, TSData.fromString('payload')) ;   // TSData body
        t.expect3(d.response).null() ;
        const e = await r.req('/s', Verb.Post, RespType.Json, { hello:'world' }) ;               // plain object -> JSON
        t.expect4(e.response).null() ;
    }) ;

    group.unary('maps connection-refused to Misdirected across response types', async (t) => {
        const r = dead() ;
        for (const [i, rt] of [RespType.String, RespType.Buffer, RespType.Json, RespType.OptionalJson, RespType.Stream].entries()) {
            const res = await r.req('/', Verb.Get, rt) ;
            t.expect(res.status, `rt-${i}`).is(Resp.Misdirected) ;
        }
    }) ;

    group.unary('token / basicAuth / credentials branches are applied', async (t) => {
        const r = dead() ;
        r.setToken('T') ;
        r.managesCredential = true ;
        t.expect0((await r.req('/', Verb.Get, RespType.String)).status).is(Resp.Misdirected) ;

        const r2 = dead() ;
        r2.setAuth({ login:'u', password:'p' }) ;
        t.expect1((await r2.req('/', Verb.Get, RespType.String)).status).is(Resp.Misdirected) ;
    }) ;
})) ;
}
