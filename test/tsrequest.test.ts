import { TSDate } from "../src/tsdate";
import { TSError } from "../src/tserrors";
import { TSDictionary } from "../src/types";
import { $barerauth, $basicauth, $generateMultiPartBody, $generateMultiPartBodyString, $query, Resp, RespType, TSMultipartEntry, TSRequest, Verb } from "../src/tsrequest";

import { TSTest } from '../src/tstester';
import { $password } from "../src/crypto";
import { $length } from "../src/commons";
import { TSData } from "../src/tsdata";
import { $inbrowser } from "../src/utils";
import { TSServer, TSServerLogLevel } from "../src/tsserver";
import { uint16 } from "../src/types";
import * as http from "http";

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

    group.unary('$barerauth() and setToken() report a plain array element which is not a byte under their name', async (t) => {
        const nb = (fn:string) => (e:any) => e?.message === `${fn}: element #1 (300) is not a byte (an integer from 0 to 255).` ;
        t.expect0(() => $barerauth([65, 300] as any)).throws(nb('$barerauth()')) ;
        t.expect1(() => new TSRequest('http://localhost/').setToken([65, 300] as any)).throws(nb('TSRequest.setToken()')) ;
        t.expect2($barerauth([65, 66] as any)).is('Bearer QUI=') ;
    }) ;

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
        t.expect2(body!.includes('name="blob"; filename="blob"')).true() ;  // like a browser FormData
        t.expect3(body!.includes('Content-Type: text/plain')).true() ;
        t.expect4(body!.includes('Content-Type: application/octet-stream')).true() ; // untyped blob
        t.expect5(body!.includes('42')).false() ;                                     // number entry skipped
        t.expect6(body!.endsWith(`\r\n--${B}--\r\n`)).true() ;
        t.expect7(await $generateMultiPartBodyString({ nope:42 as any }, B)).null() ; // nothing usable -> null
        t.expect8(await $generateMultiPartBodyString({}, B)).null() ;
    }) ;

    group.unary('$generateMultiPartBody() — binary files, file names and quoting', async (t) => {
        const B = '----bnd123' ;
        // these bytes are not valid UTF-8, and contain CR LF and '--' : they used to be corrupted (sent as an UTF-8 text)
        const bin = new Uint8Array([0, 1, 2, 0x80, 0xfe, 0xff, 0xc3, 0x28, 13, 10, 45, 45]) ;
        const file = new File([bin], 'pho"to\r\n.png', { type:'image/png' }) ;
        const body = await $generateMultiPartBody({ field:'valeur é', file:file, blob:new Blob([bin]), 'we"ird\nkey':'v' }, B) ;
        t.expect0(body instanceof Uint8Array).true() ;
        const text = new TextDecoder().decode(body!) ;
        // file names used to be never sent, quotes and line breaks are percent-encoded like browsers do
        t.expect1(text.includes('name="file"; filename="pho%22to%0D%0A.png"\r\nContent-Type: image/png\r\n')).true() ;
        t.expect2(text.includes('name="blob"; filename="blob"\r\nContent-Type: application/octet-stream\r\n')).true() ;
        t.expect3(text.includes('name="we%22ird%0Akey"')).true() ;
        // the file bytes are in the body, unchanged
        const header = new TextEncoder().encode('Content-Type: image/png\r\n\r\n') ;
        const start = _indexOf(body!, header) + header.length ;
        t.expect4(Array.from(body!.slice(start, start + bin.length))).is(Array.from(bin)) ;
        t.expect5(await $generateMultiPartBody({ nope:42 as any }, B)).null() ;
        // the string version also sends the file names
        t.expect6((await $generateMultiPartBodyString({ f:new File(['txt'], 'a.txt', { type:'text/plain' }) }, B))!.includes('filename="a.txt"')).true() ;

        // the standard multipart parser reads the same values. The parsers differ on the escaped names :
        // Node (undici) decodes %22 %0D %0A, Chrome keeps them as they were sent
        let fd:FormData|undefined = undefined ;
        try { fd = await new Response(body as BodyInit, { headers:{ 'content-type':`multipart/form-data; boundary=${B}` } }).formData() ; }
        catch { fd = undefined ; } // a simulated environment may not have a complete Response implementation
        if (fd) {
            t.expect7(fd.get('field')).is('valeur é') ;
            const parsed = fd.get('file') as File ;
            t.expect8(['pho"to\r\n.png', 'pho%22to%0D%0A.png'].includes(parsed.name)).true() ;
            t.expectC(parsed.type).is('image/png') ;
            t.expect9(Array.from(new Uint8Array(await parsed.arrayBuffer()))).is(Array.from(bin)) ;
            t.expectA(Array.from(new Uint8Array(await (fd.get('blob') as File).arrayBuffer()))).is(Array.from(bin)) ;
            t.expectB(fd.get('we"ird\nkey') ?? fd.get('we%22ird%0Akey')).is('v') ;
        }
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

// Node-only too : a local TSServer and fetch() errors which differ in a browser
if (!$inbrowser()) {
requestGroups.push(TSTest.group("TSRequest.req() — composition, response type, timeout & unknown errors", async (group) => {
    group.unary('impossible URL composition and unknown network errors throw', async (t) => {
        await t.expect0(new TSRequest('not a url').req('/x')).rejects(/impossible to compose base URL and relativeURL/) ;
        // an error without any known code is rethrown as it is
        const r = new TSRequest('http://127.0.0.1:59999/') ;
        await t.expect1(r.req('/x', 'BAD METHOD' as any)).rejects((e:any) => e instanceof TypeError && /not a valid HTTP method/.test(e.message)) ;
        await t.expect2(r.req('/x', Verb.Get, RespType.String, null, { 'X-Bad':'a\nb' })).rejects((e:any) => e instanceof TypeError) ;
        // a GET or HEAD request with a body is refused before using the network (fetch() used to throw a TypeError)
        await t.expect3(r.req('/x', Verb.Get, RespType.String, 'body')).rejects((e:any) => e instanceof TSError && e.message === 'TSRequest.req(): a GET request cannot have a body') ;
        await t.expect4(r.req('/x', 'head' as any, RespType.String, { a:1 })).rejects(/a HEAD request cannot have a body/) ;
        await t.expect5(r.req('/x', Verb.Get, RespType.String, 12)).rejects(/a GET request cannot have a body/) ;
    }) ;

    group.unary('timeout and unknown response type with a local server', async (t) => {
        const port = 8431 as uint16 ;
        const slow = async (_r:any, resp:any) => { await new Promise(res => setTimeout(res, 300)) ; resp.returnObject({ a:1 }) ; } ;
        const fast = async (_r:any, resp:any) => { resp.returnObject({ a:1 }) ; } ;
        t.expect0(await TSServer.start({ '/slow':{ GET:slow }, '/fast':{ GET:fast } } as any, { port, log:{ level:TSServerLogLevel.None } })).OK() ;
        try {
            const r = new TSRequest(`http://localhost:${port}/`) ;
            const a = await r.req('/slow', Verb.Get, RespType.Json, null, {}, 50) ;
            t.expect1([a.status, a.response]).is([Resp.TimeOut, null]) ;
            const b = await r.req('/fast', Verb.Get, 99 as any) ;        // not a response type : no content
            t.expect2([b.status, b.response]).is([Resp.OK, null]) ;
            const c = await r.req('/fast', Verb.Get, RespType.Json) ;
            t.expect3([c.status, c.response]).is([Resp.OK, { a:1 }]) ;
        }
        finally { await TSServer.stop() ; }
    }) ;
})) ;
}

// Node-only : a raw local HTTP server, to see the exact received paths
if (!$inbrowser()) {
requestGroups.push(TSTest.group("TSRequest.req() — trailing slash and non JSON responses", async (group) => {
    group.unary('an absolute URL is used as it is, whatever the base URL', async (t) => {
        const paths:string[] = [] ;
        const server = http.createServer((req, res) => {
            paths.push(req.url!) ;
            res.writeHead(200, { 'content-type':'application/json' }) ; res.end('{"ok":true}') ;
        }) ;
        await new Promise<void>(resolve => server.listen(0, '127.0.0.1', () => resolve())) ;
        try {
            const url = `http://127.0.0.1:${(server.address() as any).port}` ;
            const sent = async (r:TSRequest, rel:string):Promise<[number, string]> => { paths.length = 0 ; const resp = await r.req(rel) ; return [resp.status, paths[0]] ; } ;
            // without base URL (http://localhost/), it used to request http://localhost/http://127.0.0.1:...
            t.expect0(await sent(new TSRequest(), `${url}/.well-known/openid-configuration`)).is([200, '/.well-known/openid-configuration']) ;
            paths.length = 0 ;
            const [ret, status] = await new TSRequest().request(`${url}/a/b?x=1`) ;
            t.expect1([ret, status]).is([{ ok:true }, 200]) ;
            t.expect2(paths[0]).is('/a/b?x=1') ;
            // another base URL (unreachable) is ignored
            t.expect3(await sent(new TSRequest('http://127.0.0.1:1/api'), `${url}/c`)).is([200, '/c']) ;
            t.expect4(await sent(new TSRequest('http://127.0.0.1:1/api'), `HTTP://127.0.0.1:${(server.address() as any).port}/d`)).is([200, '/d']) ;
            // the final '/' follows the keepsTrailingSlash option, like with a relative URL
            t.expect5(await sent(new TSRequest(), `${url}/e/`)).is([200, '/e']) ;
            t.expect6(await sent(new TSRequest('', { keepsTrailingSlash:true }), `${url}/e/`)).is([200, '/e/']) ;
            t.expect7(await sent(new TSRequest('', { keepsTrailingSlash:true }), url)).is([200, '/']) ;
            // a relative URL which is not a path, or a base URL with a query string, is refused before any request
            const nc = 'TSRequest.req(): impossible to compose base URL and relativeURL' ;
            paths.length = 0 ;
            await t.expectA(new TSRequest(url).req('//other.example/x')).rejects(nc) ;
            await t.expectB(new TSRequest(`${url}/api?x=1`).req('b')).rejects(nc) ;
            await t.expectC(new TSRequest(`${url}/api?x=1`).request('b')).rejects(nc) ;
            t.expectD(paths.length).is(0) ;
            // relative URLs are unchanged
            t.expect8(await sent(new TSRequest(`${url}/api`), '/f')).is([200, '/api/f']) ;
            t.expect9(await sent(new TSRequest(`${url}/api`), 'g')).is([200, '/api/g']) ;
        }
        finally { await new Promise<void>(resolve => server.close(() => resolve())) ; }
    }) ;

    group.unary('keepsTrailingSlash option and RespType.Json on a non JSON response', async (t) => {
        const paths:string[] = [] ;
        const server = http.createServer((req, res) => {
            paths.push(req.url!) ;
            if (req.url!.startsWith('/html')) { res.writeHead(404, { 'content-type':'text/html' }) ; res.end('<html>not found</html>') ; }
            else if (req.url!.startsWith('/empty')) { res.writeHead(204) ; res.end() ; }
            else { res.writeHead(200, { 'content-type':'application/json' }) ; res.end('{"ok":true}') ; }
        }) ;
        await new Promise<void>(resolve => server.listen(0, '127.0.0.1', () => resolve())) ;
        try {
            const port = (server.address() as any).port ;
            const sent = async (r:TSRequest, rel:string) => { paths.length = 0 ; await r.req(rel) ; return paths[0] ; } ;
            const byDefault = new TSRequest(`http://127.0.0.1:${port}/api`) ;
            t.expect0(byDefault.keepsTrailingSlash).false() ;
            t.expect1(await sent(byDefault, '/alerts/')).is('/api/alerts') ; // as before, the final '/' is removed
            t.expect2(await sent(byDefault, '')).is('/api') ;
            const keeping = new TSRequest(`http://127.0.0.1:${port}/api`, { keepsTrailingSlash:true }) ;
            t.expect3(await sent(keeping, '/alerts/')).is('/api/alerts/') ;
            t.expect4(await sent(keeping, '/alerts')).is('/api/alerts') ;
            t.expect5(await sent(keeping, '')).is('/api') ; // the '/' added by TSURL.compose() is removed
            t.expect6(await sent(keeping, '/alerts/?a=1')).is('/api/alerts/?a=1') ;
            t.expect7(await sent(new TSRequest(`http://127.0.0.1:${port}/api/`, { keepsTrailingSlash:true }), '')).is('/api/') ;
            keeping.keepsTrailingSlash = false ;
            t.expect8(await sent(keeping, '/alerts/')).is('/api/alerts') ;

            // RespType.Json on a non JSON response gives the HTTP status and a null response (it used to throw)
            const r = new TSRequest(`http://127.0.0.1:${port}/`) ;
            const html = await r.req('/html', Verb.Get, RespType.Json) ;
            t.expect9([html.status, html.response]).is([404, null]) ;
            const empty = await r.req('/empty', Verb.Get, RespType.Json) ;
            t.expectA([empty.status, empty.response]).is([204, null]) ;
            const json = await r.req('/json', Verb.Get, RespType.Json) ;
            t.expectB([json.status, json.response]).is([200, { ok:true }]) ;
        }
        finally { await new Promise(resolve => server.close(resolve)) ; }
    }) ;

    group.unary('RespType.Stream gives the readable body stream', async (t) => {
        const server = http.createServer((_req, res) => { res.writeHead(200, { 'content-type':'text/plain' }) ; res.end('streamed content') ; }) ;
        await new Promise<void>(resolve => server.listen(0, '127.0.0.1', () => resolve())) ;
        try {
            const port = (server.address() as any).port ;
            const r = await new TSRequest(`http://127.0.0.1:${port}/`).req('/s', Verb.Get, RespType.Stream) ;
            t.expect0(r.status).is(200) ;
            t.expect1(r.response instanceof ReadableStream).true() ;
            t.expect2(await new Response(r.response as any).text()).is('streamed content') ;
        }
        finally { await new Promise(resolve => server.close(resolve)) ; }
    }) ;
})) ;
}

function _indexOf(data:Uint8Array, search:Uint8Array):number {
    for (let i = 0 ; i + search.length <= data.length ; i++) {
        let j = 0 ;
        while (j < search.length && data[i+j] === search[j]) { j++ ; }
        if (j === search.length) { return i ; }
    }
    return -1 ;
}
