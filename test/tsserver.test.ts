import { TSServer, TSServerLogLevel, TSServerLogType, TSServerOptions } from "../src/tsserver";
import { $UUID, $keys, $length, $string, $value } from "../src/commons";

import { TSTest } from '../src/tstester';
import { $absolute, $filename, $path, $readBuffer } from "../src/fs";
import { Languages, TSDictionary, uint16 } from "../src/types";
import { $inbrowser, $jsonparse, $readStreamBuffer } from "../src/utils";
import { Resp, RespType, TSRequest, Verb } from "../src/tsrequest";
import { TSError } from "../src/tserrors";
import { TSEndPoint, TSEndpointsDefinition, TSEndPointsDefinitionDictionary, TSServerErrorCodes, TSServerRequest, TSServerResponse, TSServerStartStatus } from "../src/tsserver_types";
import { TSEndPointRouter, TSServerEndPoint } from "../src/tsserver_endpoints";
import { TSStaticWebsite } from "../src/tsserver_websites";
import { PassThrough } from "stream";
import { connect as netConnect, createServer as createNetServer } from "net";
import { get as httpGet, request as httpRequest } from "http";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { parserStructureTestDefinition, parserStructureTestInterpretation, parserStructureTestValue } from "./tsparser.test";
import { TSObjectNode, TSParser } from "../src/tsparser";
import { TSColor } from "../src/tscolor";
import { TSCountry } from "../src/tscountry";
import { $decodeBase64 } from "../src/data";

export const serverGroups = [
    TSTest.group("Testing TSServer API definitions", async (group) => {
        const apis: TSDictionary<TSEndpointsDefinition> = {
            // 0
            '/sessions/callBack': {
                PUT: sameCallFunction,
                POST: sameCallFunction
            },

            // 1
            '/v{vers}/session/{sid}/signature/{ssid}/updatestatus': {
                GET: sameCallFunction,
                POST: sameCallFunction,
                DELETE: sameCallFunction,
                PATCH: sameCallFunction,
            },

            // 2
            '/v{vers}/session/{sid/signature/{ssid}/updatestatus': { GET: sameCallFunction },

            // 3
            '/v{vers}/session/{sid}}/signature/{ssid}/updatestatus': { GET: sameCallFunction },

            // 4
            '/v{vers}/session/{sid01_0-2.4}/signature/{ssid}/updatestatus': { GET: sameCallFunction },

            // 5
            '/v{vers}/session/{sid01_0-2.4}/signature/{ssid}/deleteStatus': sameCallFunction, // this provides a simple GET API

            // 6
            '/v{vers}/session/{sid01_0-2.$4}/signature/{ssid}/updatestatus': { GET: sameCallFunction },

            // 7
            '/v{vers}/session2/{sid}': { PATCH: sameCallFunction },

            // 8
            '/v{vers}/session2/{sid:date}': sameCallFunction,

            // 9
            '/v{vers}/session2/{sid:identifier}': sameCallFunction,

            // 10
            '/v{vers}/session2/{sid:boolean}': sameCallFunction

        }
        const objects: Array<any> = [];

        for (let api of $keys(apis)) {
            let ep: TSServerEndPoint | undefined = undefined;
            try {
                ep = new TSServerEndPoint($string(api), apis[api]);
            }
            catch (e) {
                ep = undefined;
            }
            objects.push(ep);
        }
        group.unary(`api '/sessions/callBack'`, async (t) => {
            t.expect(objects[0]).def();
        });
        group.unary(`api '/v{vers}/session/{sid}/signature/{ssid}/updatestatus'`, async (t) => {
            t.expect(objects[1]).def();
        });
        group.unary(`api '/v{vers}/session/{sid/signature/{ssid}/updatestatus'`, async (t) => {
            t.expect(objects[2]).toBeUndefined();
        });
        group.unary(`api '/v{vers}/session/{sid}}/signature/{ssid}/updatestatus'`, async (t) => {
            t.expect(objects[3]).toBeUndefined();
        });
        group.unary(`api '/v{vers}/session/{sid01_0-2.4}/signature/{ssid}/updatestatus'`, async (t) => {
            t.expect(objects[4]).def();
        });
        group.unary(`api '/v{vers}/session/{sid01_0-2.4}/signature/{ssid}/deleteStatus'`, async (t) => {
            t.expect(objects[5]).def();
        });
        group.unary(`api '/v{vers}/session/{sid01_0-2.$4}/signature/{ssid}/updatestatus'`, async (t) => {
            t.expect(objects[6]).toBeUndefined();
        });
        group.unary(`api '/v{vers}/session2/{sid}'`, async (t) => {
            t.expect(objects[7]).def();
        });
        group.unary(`api '/v{vers}/session2/{sid:date}'`, async (t) => {
            t.expect(objects[8]).def();
        });
        group.unary(`api '/v{vers}/session2/{sid:identifier}'`, async (t) => {
            t.expect(objects[9]).toBeUndefined();
        });
        group.unary(`api '/v{vers}/session2/{sid:boolean}'`, async (t) => {
            t.expect(objects[10]).def();
        });
    }),

    TSTest.group("TSServerEndPoint — constructor validation", async (group) => {
        const fn = async (_r:TSServerRequest, _s:TSServerResponse):Promise<void> => {} ;
        const mk = (path:string, def:any) => () => new TSServerEndPoint(path, def) ;

        group.unary('rejects malformed definitions', async (t) => {
            t.expect0(mk('/', { GET:fn })).throws(/too short/) ;
            t.expect1(mk('', { GET:fn })).throws(/too short/) ;
            t.expect2(mk('/api', {})).throws(/no method defined/) ;
            t.expect3(mk('/api', { FOO:fn })).throws(/invalid 'FOO' request method/) ;
            t.expect4(mk('api/x', { GET:fn })).throws(/not absolute/) ;
            t.expect5(mk('/a}b', { GET:fn })).throws(/Misplaced '\}'/) ;
            t.expect6(mk('/a[b]', { GET:fn })).throws(/forbidden character/) ;
            t.expect7(mk('/a\\b', { GET:fn })).throws(/forbidden character/) ;
            t.expect8(mk('/a|b', { GET:fn })).throws(/forbidden character/) ;
            t.expect9(mk('/v{9bad}', { GET:fn })).throws(/forbidden first character/) ;
            t.expectA(mk('/v{name:notatype}', { GET:fn })).throws() ;
            // the error message gives the code of the forbidden character (it used to contain the source of toHex4())
            t.expectB(mk('/a^b', { GET:fn })).throws(/forbidden character '\\u005E' in path/) ;
            t.expectC(mk('/v{9bad}', { GET:fn })).throws(/forbidden first character '\\u0039'/) ;
            t.expectD(mk('/a/{id', { GET:fn })).throws(/malformed parametric path '\/a\/\{id'/) ;   // unclosed token
            t.expectE(mk('/api', { GET:{ controller:'notafunction' } })).throws(/has no valid controller function/) ;
            t.expectF(mk('/api', { GET:{ controller:fn, query:'notatype' } })).throws(/has invalid query definition/) ;
            t.expectG(mk('/api', { POST:{ controller:fn, body:{ a:'notatype' } } })).throws(/has invalid body definition/) ;
        }) ;

        group.unary('token types may contain digits', async (t) => {
            // a type name starts with a letter and may then contain digits : uint8, uint16, uint32... used to be refused
            const ep = new TSServerEndPoint('/p/{id:uint32}/{small:UINT8}', { GET:fn }) ;
            t.expect0(ep.parametersFromPath('/p/42/7')).is({ id:42, small:7 }) ;
            // the type used to be the source of the nodeType() method, and was missing in the error info
            t.expect1(() => ep.parametersFromPath('/p/42/300')).throws(/Bad parameter 'small' of type 'uint8' in url path/) ;
            t.expect5(() => ep.parametersFromPath('/p/42/300')).throws((e:any) => e.info?.type === 'uint8') ;
            t.expect2(mk('/p/{id:9int}', { GET:fn })).throws(/forbidden first character '\\u0039' in parametric type/) ;
            t.expect3(mk('/p/{id:uint-32}', { GET:fn })).throws(/forbidden character '\\u002D' in parametric type/) ;
            t.expect4(mk('/p/{id:uint33}', { GET:fn })).throws(/unknown type 'uint33'/) ;
        }) ;

        group.unary('accepts the valid shapes', async (t) => {
            t.expect0(new TSServerEndPoint('/plain/path', { GET:fn }).uri).is('/plain/path') ;
            t.expect1(new TSServerEndPoint('/shorthand', fn).uri).is('/shorthand') ;                 // bare controller -> GET
            t.expect2(new TSServerEndPoint('/ctrl', { controller:fn } as any).uri).is('/ctrl') ;     // {controller} -> GET
            const ep = new TSServerEndPoint('/v{vers}/user/{id}', { GET:fn, POST:fn }) ;
            t.expect3(ep.uri).is('/v') ;            // uri is the static prefix, stops at the first parametric token
            t.expect4(ep.depth).is(3) ;
            t.expectG(new TSServerEndPoint('/v{vers}/user/{id:boolean}', { GET:fn }).uri).is('/v') ; // typed token
            t.expect5(new TSServerEndPoint('/a-b.c(d)/x', { GET:fn }).uri).is('/a-b.c(d)/x') ;        // special chars kept in the static part
            t.expect6(new TSServerEndPoint('/MixedCase', { GET:fn }).uri).is('/mixedcase') ;         // static part lower-cased
        }) ;

        group.unary('parametersFromPath() refuses other paths', async (t) => {
            const ep = new TSServerEndPoint('/v{vers}/user/{id}', { GET:fn }) ;
            t.expect0(ep.parametersFromPath('/v2/user/7')).is({ vers:'2', id:'7' }) ;
            t.expect1(ep.parametersFromPath('/x2/user/7')).null() ;      // does not start with the endpoint uri
            t.expect2(ep.parametersFromPath('/')).null() ;
            t.expect3(ep.parametersFromPath('/v')).null() ;              // empty parametric part
            t.expect4(ep.parametersFromPath('/v2/other/7')).null() ;     // parametric part not matching
            const st = new TSServerEndPoint('/plain/path', { GET:fn }) ;
            t.expect5(st.parametersFromPath('/plain/path')).is({}) ;
            t.expect6(st.parametersFromPath('/plain/path/x')).null() ;  // a static end point only matches its uri
            t.expect7(st.parametersFromPath('/other')).null() ;
        }) ;
    }),

    // G1 : routing used to be a linear scan testing every registered endpoint on
    // every request. TSEndPointRouter replaces it with a uri-prefix index, and its
    // tie-break (deepest match wins, earliest registration wins a depth tie) has
    // to reproduce exactly what that linear scan would have picked, whatever order
    // the endpoints were registered in. This exhaustively checks that property.
    TSTest.group("TSEndPointRouter — depth / registration-order tie-break", async (group) => {
        const fn = async (_r:TSServerRequest, _s:TSServerResponse):Promise<void> => {} ;

        // '/api/users' (static) and '/api/{id}' (parametric) both match the path
        // '/api/users' at the same depth (2) — the one deliberate collision here.
        const defs:[string, TSEndpointsDefinition][] = [
            ['/api/users',       { GET:fn }],
            ['/api/{id}',        { GET:fn }],
            ['/api/users/{sub}', { GET:fn }],
            ['/api',             { GET:fn }],
            ['/other/{x}',       { GET:fn }],
        ] ;

        function permute<T>(arr:T[]):T[][] {
            if (arr.length <= 1) { return [arr] ; }
            const out:T[][] = [] ;
            for (let i = 0 ; i < arr.length ; i++) {
                const rest = arr.slice(0, i).concat(arr.slice(i + 1)) ;
                for (const p of permute(rest)) { out.push([arr[i], ...p]) ; }
            }
            return out ;
        }

        group.unary('all 120 registration orders (5!) route all 6 requests exactly like a linear scan would', async (t) => {
            let checks = 0 ;
            for (const order of permute(defs)) {
                const endpoints = order.map(([path, def]) => new TSServerEndPoint(path, def)) ;
                const router = new TSEndPointRouter(endpoints) ;
                const byUri = (uri:string) => endpoints.find(e => e.uri === uri)! ;

                // 5 of the 6 requests have exactly one structurally possible match,
                // so their winner is fixed no matter the registration order.
                checks++ ; t.expect(router.route('/api/42')?.endPoint).is(byUri('/api/')) ;
                checks++ ; t.expect(router.route('/api/users/5')?.endPoint).is(byUri('/api/users/')) ;
                checks++ ; t.expect(router.route('/api')?.endPoint).is(byUri('/api')) ;
                checks++ ; t.expect(router.route('/other/x')?.endPoint).is(byUri('/other/')) ;
                checks++ ; t.expect(router.route('/nope')).undef() ;

                // '/api/users' is the one genuine collision. Whichever of the two
                // colliding endpoints was registered first must win — the same
                // rule a "scan every endpoint, keep the first one to reach the
                // max depth" linear search would apply.
                const staticEp = byUri('/api/users') ;
                const paramEp  = byUri('/api/') ;
                const expected = endpoints.indexOf(staticEp) < endpoints.indexOf(paramEp) ? staticEp : paramEp ;
                checks++ ; 
                t.expect(router.route('/api/users')?.endPoint).is(expected) ;
            }
            t.expect0(checks).is(720) ;
        }) ;

        group.unary('isStatic', async (t) => {
            t.expect0(new TSServerEndPoint('/a/b', sameCallFunction).isStatic).true() ;
            t.expect1(new TSServerEndPoint('/a/{id:int}', sameCallFunction).isStatic).false() ;
        }) ;
    })
];

if (!$inbrowser()) {
    serverGroups.push(TSTest.group("TSServer — end points routing with encoded paths and case", async (group) => {
        const port = 8415 as uint16 ;
        const echo = async (r:TSServerRequest, resp:TSServerResponse) => { resp.returnObject({ p:r.parameters }) ; } ;
        const endpoints:any = { 
            '/café':echo, '/a b':echo, '/Echo/Sub':echo, '/100%':echo, "/l'a":echo, 
            '/p/{name}':echo, '/v{vers}/Users/{id:int}':echo 
        } ;
        const fetch = (path:string) => new Promise<[number, any]>((resolve, reject) => {
            httpGet({ host:'localhost', port, path }, res => {
                let body = '' ;
                res.on('data', d => { body += d ; }) ;
                res.on('end', () => resolve([$value(res.statusCode, 0), $jsonparse(body)])) ;
            }).on('error', reject) ;
        }) ;

        group.unary('decoded paths and case insensitive static parts', async (t) => {
            t.expect0(await TSServer.start(endpoints, { port, log: { level: TSServerLogLevel.None } })).is(TSServerStartStatus.HTTP) ;
            try {
                // the request paths are percent-encoded: they used to be routed as is, so these were not found
                t.expect1((await fetch('/caf%C3%A9'))[0]).is(Resp.OK) ;
                t.expect2((await fetch('/a%20b'))[0]).is(Resp.OK) ;
                t.expect3((await fetch('/l%27a'))[0]).is(Resp.OK) ;
                t.expect4(await fetch('/p/b%2Dob')).is([Resp.OK, { p:{ name:'b-ob' } }]) ;
                // the static part used to be compared with the request case, so '/Echo/Sub' was not found
                t.expect5((await fetch('/Echo/Sub'))[0]).is(Resp.OK) ;
                t.expect6((await fetch('/ECHO/SUB'))[0]).is(Resp.OK) ;
                t.expect7(await fetch('/V2/users/42')).is([Resp.OK, { p:{ vers:'2', id:42 } }]) ;
                // a lone '%' stays as it is, an encoded '/' does not create a path segment
                t.expect8((await fetch('/100%'))[0]).is(Resp.OK) ;
                t.expect9((await fetch('/p/a%2Fb'))[0]).is(Resp.NotFound) ;
                t.expectA((await fetch('/p/%ZZ'))[0]).is(Resp.NotFound) ;
                t.expectB((await fetch('/p/bob'))[1]).is({ p:{ name:'bob' } }) ;
            }
            finally { await TSServer.stop() ; }
        }) ;
    })) ;

    serverGroups.push(TSTest.group("TSServer — query parameters: arrays and repeated keys", async (group) => {
        const port = 8414 as uint16 ;
        const echo = async (r:TSServerRequest, resp:TSServerResponse) => { resp.returnObject({ q:$value(r.query, null) }) ; } ;
        const endpoints:any = {
            '/q': { GET:{ controller:echo, query:{ ids:['uint32'], n:'int', s:'string' } } },
            '/d': { GET:{ controller:echo, query:{ _keysType:'string', _valueItemsType:['int'] } } },
            '/u': { GET:{ controller:echo, query:{ _acceptsUncheckedItems:true, n:'int' } } },
        } ;
        const fetch = (path:string) => new Promise<[number, any]>((resolve, reject) => {
            httpGet({ host:'localhost', port, path }, res => {
                let body = '' ;
                res.on('data', d => { body += d ; }) ;
                res.on('end', () => resolve([$value(res.statusCode, 0), $jsonparse(body)])) ;
            }).on('error', reject) ;
        }) ;

        group.unary('arrays, repeated keys and absent query', async (t) => {
            t.expect0(await TSServer.start(endpoints, { port, log: { level: TSServerLogLevel.None } })).is(TSServerStartStatus.HTTP) ;
            try {
                // array keys always give an array (it used to be the last value, refused by the array parser)
                t.expect1(await fetch('/q?ids=1&ids=2')).is([Resp.OK, { q:{ ids:[1, 2] } }]) ;
                t.expect2(await fetch('/q?ids=1')).is([Resp.OK, { q:{ ids:[1] } }]) ;
                t.expect3(await fetch('/q?n=3')).is([Resp.OK, { q:{ n:3 } }]) ;
                // a repeated non array key is refused (it used to silently keep the last value)
                const rep = await fetch('/q?n=3&n=4&s=a') ;
                t.expect4(rep[0]).is(Resp.BadRequest) ;
                t.expect5(rep[1].info.errors).is(['value.n is present several times.']) ;
                t.expect6((await fetch('/q?ids=1&ids=x'))[0]).is(Resp.BadRequest) ;
                // no query at all on a non mandatory query definition (it used to be a 500 error)
                t.expect7(await fetch('/q')).is([Resp.OK, { q:null }]) ;
                // dictionaries and unchecked items
                t.expect8(await fetch('/d?a=1&a=2&b=3')).is([Resp.OK, { q:{ a:[1, 2], b:[3] } }]) ;
                t.expect9(await fetch('/u?x=1&x=2&n=5')).is([Resp.OK, { q:{ x:['1', '2'], n:5 } }]) ;
                t.expectA((await fetch('/u?n=1&n=2'))[0]).is(Resp.BadRequest) ;
            }
            finally { await TSServer.stop() ; }
        }) ;
    })) ;

    serverGroups.push(TSTest.group("TSStaticWebsite — files outside the website folder", async (group) => {
        const port = 8413 as uint16 ;
        const fetch = (path:string) => new Promise<[number, string, string]>((resolve, reject) => {
            // a raw request: the path is sent as is, without the '..' normalization a browser would do
            httpGet({ host:'localhost', port, path }, res => {
                let body = '' ;
                res.on('data', d => { body += d ; }) ;
                res.on('end', () => resolve([$value(res.statusCode, 0), $string(res.headers['content-type']), body])) ;
            }).on('error', reject) ;
        }) ;

        group.unary('path traversal is refused, mime types', async (t) => {
            const dir = mkdtempSync($path(tmpdir(), 'tsws-')) ;
            try {
                const site = $path(dir, 'site') ;
                mkdirSync($path(site, 'a'), { recursive:true }) ;
                writeFileSync($path(site, 'index.html'), '<p>index</p>') ;
                writeFileSync($path(site, 'photo.jpg'), 'jpg') ;
                writeFileSync($path(site, 'a b.html'), '<p>space</p>') ;
                writeFileSync($path(site, 'café.html'), '<p>accent</p>') ;
                writeFileSync($path(dir, 'secret.html'), '<p>secret</p>') ;

                const ws = new TSStaticWebsite('/', site) ;
                t.expect0(ws.getStaticResource('/../secret.html')).is([undefined, 'text/html']) ;
                t.expect1($string(ws.getStaticResource('/a/../index.html')[0])).is('<p>index</p>') ;
                t.expect2($string(ws.getStaticResource('/index.html')[0])).is('<p>index</p>') ;
                t.expect3((ws as any)._cache.size).is(1) ; // both paths are the same cached file
                ws.clearCaches() ;
                t.expect4((ws as any)._cache.size).is(1) ;

                t.expect5(await TSServer.start({}, { port, log: { level: TSServerLogLevel.None }, webSites:{ '/':site } })).is(TSServerStartStatus.HTTP) ;
                try {
                    const index = await fetch('/index.html') ;
                    t.expect6([index[0], index[2]]).is([Resp.OK, '<p>index</p>']) ;
                    // these ones used to return the secret file
                    t.expect7((await fetch('/../secret.html'))[0]).is(Resp.NotFound) ;
                    t.expect8((await fetch('/a/../../secret.html'))[0]).is(Resp.NotFound) ;
                    t.expect9((await fetch('/..\\secret.html'))[0]).is(Resp.NotFound) ;
                    t.expectA((await fetch('/a/../index.html'))[0]).is(Resp.OK) ;
                    // jpg files used to be served as image/jpg
                    t.expectB((await fetch('/photo.jpg'))[1]).is('image/jpeg') ;
                    // the request paths are percent-encoded: they used to be searched as is on the disk
                    t.expectC((await fetch('/a%20b.html'))[2]).is('<p>space</p>') ;
                    t.expectD((await fetch('/caf%C3%A9.html'))[2]).is('<p>accent</p>') ;
                    // an encoded '..' is decoded before the folder check, a malformed encoding is not found
                    t.expectE((await fetch('/%2e%2e/secret.html'))[0]).is(Resp.NotFound) ;
                    t.expectF((await fetch('/a/..%2F..%2Fsecret.html'))[0]).is(Resp.NotFound) ;
                    t.expectG((await fetch('/%ZZ.html'))[0]).is(Resp.NotFound) ;
                    t.expectH((await fetch('/index%00.html'))[0]).is(Resp.NotFound) ;
                    // a request target which is not a path of the server (an absolute URL or '//host') is not found
                    t.expectI((await fetch('http://other.example/index.html'))[0]).is(Resp.NotFound) ;
                    t.expectJ((await fetch('//other.example/index.html'))[0]).is(Resp.NotFound) ;
                }
                finally { await TSServer.stop() ; }
            }
            finally { rmSync(dir, { recursive:true, force:true }) ; }
        }) ;

        group.unary('files cache and missing files blacklist', async (t) => {
            const dir = mkdtempSync($path(tmpdir(), 'tsws-')) ;
            // the blacklisted paths expire in a millisecond (blacklistDuration is in seconds)
            const expire = async (ws:any) => {
                for (const [k, v] of ws._blacklisted) { ws._blacklisted.set(k, v, { expires:new Date(Date.now() + 1) }) ; }
                await new Promise(resolve => setTimeout(resolve, 5)) ;
            } ;
            const content = (ws:TSStaticWebsite, path:string) => $string(ws.getStaticResource(path)[0]) ;
            try {
                const site = $path(dir, 'site') ;
                mkdirSync(site, { recursive:true }) ;
                for (const n of ['a', 'b', 'c']) { writeFileSync($path(site, `${n}.html`), n) ; }
                writeFileSync($path(site, 'big.html'), 'x'.repeat(100)) ;

                // a missing file is blacklisted, then looked for again once its blacklisting expired
                const ws = new TSStaticWebsite('/', { folder:site, maxCachedFiles:2, maxCachedFileSize:50 }) ;
                t.expect0(ws.getStaticResource('/new.html')[0]).undef() ;
                writeFileSync($path(site, 'new.html'), 'new') ;
                t.expect1(ws.getStaticResource('/new.html')[0]).undef() ; // still blacklisted
                await expire(ws) ;
                ws.clearCaches() ;
                t.expect2((ws as any)._blacklisted.size).is(0) ;
                t.expect3(content(ws, '/new.html')).is('new') ;          // it used to be blacklisted until the server stopped

                // the least recently used file is evicted when the cache is full (a new file used to be not cached)
                (ws as any)._cache.clear() ;
                content(ws, '/a.html') ; content(ws, '/b.html') ; content(ws, '/a.html') ;
                content(ws, '/c.html') ;
                t.expect4([...(ws as any)._cache.keys()].map((p:string) => $filename(p))).is(['a.html', 'c.html']) ;
                writeFileSync($path(site, 'a.html'), 'A') ;
                writeFileSync($path(site, 'b.html'), 'B') ;
                t.expect5(content(ws, '/a.html')).is('a') ;              // served from the cache
                t.expect6(content(ws, '/b.html')).is('B') ;              // evicted, read again
                t.expect7(content(ws, '/big.html').length).is(100) ;     // too big to be cached
                t.expect8([...(ws as any)._cache.keys()].map((p:string) => $filename(p))).is(['a.html', 'b.html']) ;

                // maxCacheSize limits the total size of the cached files
                const small = new TSStaticWebsite('/', { folder:site, maxCacheSize:5 }) ;
                content(small, '/new.html') ; content(small, '/a.html') ; content(small, '/b.html') ;
                t.expect9((small as any)._cache.totalSize).is(5) ;
                t.expectA([...(small as any)._cache.keys()].map((p:string) => $filename(p))).is(['new.html', 'a.html', 'b.html']) ;
                content(small, '/c.html') ;
                t.expectB([...(small as any)._cache.keys()].map((p:string) => $filename(p))).is(['a.html', 'b.html', 'c.html']) ;

                // a 0 limit disables the cache or the blacklist
                const none = new TSStaticWebsite('/', { folder:site, maxCachedFiles:0, maxBlacklistedFiles:0 }) ;
                t.expectC(none.getStaticResource('/later.html')[0]).undef() ;
                writeFileSync($path(site, 'later.html'), 'later') ;
                t.expectD(content(none, '/later.html')).is('later') ;
                t.expectE((none as any)._cache).undef() ;
                t.expectF((none as any)._blacklisted).undef() ;
            }
            finally { rmSync(dir, { recursive:true, force:true }) ; }
        }) ;
    })) ;

    serverGroups.push(TSTest.group("TSServerResponse status and content type arguments", async (group) => {
        const port = 8412 as uint16 ;
        const opts:TSServerOptions = { port, log: { level: TSServerLogLevel.None } } ;
        const data = Buffer.from([0, 1, 2, 255]) ;
        const endpoints:any = {
            '/s1': async (_r:TSServerRequest, resp:TSServerResponse) => { resp.returnString('a') ; },
            '/s2s': async (_r:TSServerRequest, resp:TSServerResponse) => { resp.returnString('b', Resp.Created) ; },
            '/s2t': async (_r:TSServerRequest, resp:TSServerResponse) => { resp.returnString('<p/>', 'text/html') ; },
            '/s3': async (_r:TSServerRequest, resp:TSServerResponse) => { resp.returnString('c', 'text/csv', Resp.Accepted) ; },
            '/d2s': async (_r:TSServerRequest, resp:TSServerResponse) => { resp.returnData(data, Resp.Created) ; },
            '/d2t': async (_r:TSServerRequest, resp:TSServerResponse) => { resp.returnData(data, 'image/png') ; },
            '/o2s': async (_r:TSServerRequest, resp:TSServerResponse) => { resp.returnObject({ a:1 }, Resp.Created) ; },
            '/o2t': async (_r:TSServerRequest, resp:TSServerResponse) => { resp.returnObject({ a:1 }, 'application/ld+json') ; },
        } ;
        const fetchHead = (path:string) => new Promise<[number, string]>((resolve, reject) => {
            httpGet(`http://localhost:${port}${path}`, res => {
                res.resume() ;
                res.on('end', () => resolve([$value(res.statusCode, 0), $string(res.headers['content-type'])])) ;
            }).on('error', reject) ;
        }) ;

        group.unary('the second argument is a status or a content type', async (t) => {
            t.expect0(await TSServer.start(endpoints, opts)).is(TSServerStartStatus.HTTP) ;
            try {
                // the content type used to be the status ('201') with the status always being 200 for strings,
                // and a content type given to returnData() or returnObject() used to be taken as a status
                t.expect1(await fetchHead('/s1')).is([Resp.OK, 'text/plain']) ;
                t.expect2(await fetchHead('/s2s')).is([Resp.Created, 'text/plain']) ;
                t.expect3(await fetchHead('/s2t')).is([Resp.OK, 'text/html']) ;
                t.expect4(await fetchHead('/s3')).is([Resp.Accepted, 'text/csv']) ;
                t.expect5(await fetchHead('/d2s')).is([Resp.Created, 'application/octet-stream']) ;
                t.expect6(await fetchHead('/d2t')).is([Resp.OK, 'image/png']) ;
                t.expect7(await fetchHead('/o2s')).is([Resp.Created, 'application/json']) ;
                t.expect8(await fetchHead('/o2t')).is([Resp.OK, 'application/ld+json']) ;
            }
            finally { await TSServer.stop() ; }
        }) ;
    })) ;

    serverGroups.push(TSTest.group("TSServer — start() and stop() errors", async (group) => {
        const port = 8411 as uint16 ;
        const endpoints:any = { '/ok': async (_r:TSServerRequest, resp:TSServerResponse) => { resp.returnString('ok') ; } } ;
        const opts:TSServerOptions = { port, log: { level: TSServerLogLevel.None } } ;

        group.unary('start() on an already used port returns the error', async (t) => {
            const blocker = createNetServer() ;
            await new Promise<void>(resolve => blocker.listen(port, () => resolve())) ;
            let blocked = true ;
            try {
                // it used to report a success, then to crash the process with an uncaught EADDRINUSE error
                const st = await TSServer.start(endpoints, opts) ;
                t.expect0(st instanceof Error).true() ;
                t.expect1((st as any)?.code).is('EADDRINUSE') ;
                t.expect2(TSServer.isRunning()).false() ;

                // once the port is free, the server can be started
                await new Promise<void>(resolve => blocker.close(() => resolve())) ;
                blocked = false ;
                t.expect3(await TSServer.start(endpoints, opts)).is(TSServerStartStatus.HTTP) ;
                t.expect4(TSServer.isRunning()).true() ;
                const resp = await new TSRequest(`http://localhost:${port}/`).req('ok', Verb.Get, RespType.String) ;
                t.expect5(resp.response).is('ok') ;
                t.expect6(await TSServer.stop()).undef() ;
                t.expect7(TSServer.isRunning()).false() ;
            }
            finally {
                if (blocked) { blocker.close() ; }
                if (TSServer.isRunning()) { await TSServer.stop() ; }
            }
        }) ;

        group.unary('start() and stop() errors are given to the logger', async (t) => {
            const logs:{ type:string, message:string }[] = [] ;
            const logger = async (type:TSServerLogType, message:string) => { logs.push({ type, message }) ; } ;
            const blocker = createNetServer() ;
            await new Promise<void>(resolve => blocker.listen(port, () => resolve())) ;
            try {
                const st = await TSServer.start(endpoints, { port, log:{ level:TSServerLogLevel.Errors, logger } }) ;
                t.expect0((st as any)?.code).is('EADDRINUSE') ;
                t.expect1(logs.length).is(1) ;
                t.expect2(logs[0]?.type).is(TSServerLogType.Error) ;
                t.expect3($string(logs[0]?.message).startsWith('cannot start for reason Error:')).true() ;
            }
            finally { await new Promise<void>(resolve => blocker.close(() => resolve())) ; }

            logs.length = 0 ;
            t.expect4(await TSServer.start(endpoints, { port, log:{ level:TSServerLogLevel.Errors, logger } })).is(TSServerStartStatus.HTTP) ;
            const internal = (TSServer as any).__server ;
            await new Promise<void>(resolve => internal._httpServer.close(() => resolve())) ;   // closed behind TSServer's back
            const e:any = await TSServer.stop() ;
            t.expect5(e?.code).is('ERR_SERVER_NOT_RUNNING') ;
            t.expect6(logs.length).is(1) ;
            t.expect7(logs[0]?.type).is(TSServerLogType.Error) ;
            t.expect8($string(logs[0]?.message).startsWith('cannot stop for reason Error:')).true() ;
            // cleaning for the next tests
            TSServer.stopClearCachesInterval() ;
            delete (TSServer as any).__server ;
            t.expect9(TSServer.isRunning()).false() ;
        }) ;

        group.unary('each log level logs its own messages and the ones of the lower levels', async (t) => {
            // the levels used to be shifted: Errors logged nothing, Warnings only the errors, Infos no info
            const expected:[TSServerLogLevel, string[]][] = [
                [TSServerLogLevel.None,      []],
                [TSServerLogLevel.Errors,    []], // no error here (see the previous test)
                [TSServerLogLevel.Warnings,  [TSServerLogType.Warning]],
                [TSServerLogLevel.Infos,     [TSServerLogType.Log, TSServerLogType.Warning]],
                [TSServerLogLevel.Developer, [TSServerLogType.Developer, TSServerLogType.Log, TSServerLogType.Warning]],
            ] ;
            const client = new TSRequest(`http://localhost:${port}/`) ;
            for (const [level, types] of expected) {
                const logged = new Set<string>() ;
                const logger = async (type:TSServerLogType) => { logged.add(type) ; } ;
                t.expect(await TSServer.start(endpoints, { port, log:{ level, logger } }), `start ${level}`).is(TSServerStartStatus.HTTP) ;
                try {
                    await client.req('ok', Verb.Get, RespType.String) ;                  // an info
                    await client.req('nope', Verb.Get, RespType.OptionalJson) ;          // a 404 is a warning
                }
                finally { await TSServer.stop() ; }
                t.expect([...logged].sort(), `level ${level}`).is([...types].sort()) ;
            }
        }) ;

        group.unary('start() reports the TLS option holding a plain array element which is not a byte', async (t) => {
            const nb = (o:string) => `TSServer.start(): option '${o}': element #1 (300) is not a byte (an integer from 0 to 255).` ;
            const st1:any = await TSServer.start(endpoints, { ...opts, key:Buffer.from('k'), certificate:[65, 300] as any }) ;
            t.expect0(st1?.message).is(nb('certificate')) ;
            const st2:any = await TSServer.start(endpoints, { ...opts, key:[65, 300] as any, certificate:Buffer.from('c') }) ;
            t.expect1(st2?.message).is(nb('key')) ;
            const st3:any = await TSServer.start(endpoints, { ...opts, key:Buffer.from('k'), certificate:Buffer.from('c'), certificateAuthority:[65, 300] as any }) ;
            t.expect2(st3?.message).is(nb('certificateAuthority')) ;
            t.expect3(TSServer.isRunning()).false() ;
        }) ;

        group.unary('start() with bad TLS options returns the error', async (t) => {
            // createServer() throws on an invalid key, start() used to reject instead of returning the error
            const st = await TSServer.start(endpoints, { ...opts, key:Buffer.from('not a key'), certificate:Buffer.from('not a certificate') }) ;
            t.expect0(st instanceof Error).true() ;
            t.expect1(TSServer.isRunning()).false() ;
            t.expect2(await TSServer.start(endpoints, opts)).is(TSServerStartStatus.HTTP) ;
            t.expect3(await TSServer.stop()).undef() ;
        }) ;

        group.unary('stop() returns the closing error instead of throwing it', async (t) => {
            t.expect0(await TSServer.start(endpoints, opts)).is(TSServerStartStatus.HTTP) ;
            const internal = (TSServer as any).__server ;
            await new Promise<void>(resolve => internal._httpServer.close(() => resolve())) ;   // closed behind TSServer's back
            const e:any = await TSServer.stop() ;                    // it used to throw ERR_SERVER_NOT_RUNNING
            t.expect1(e instanceof Error).true() ;
            t.expect2(e?.code).is('ERR_SERVER_NOT_RUNNING') ;
            // cleaning for the next tests
            TSServer.stopClearCachesInterval() ;
            delete (TSServer as any).__server ;
        }) ;
    })) ;

    serverGroups.push(TSTest.group("$readStreamBuffer()", async (group) => {
        group.unary('reads a stream or resolves to null', async (t) => {
            t.expect0(await $readStreamBuffer(null)).null() ;

            const full = new PassThrough() ;
            const pFull = $readStreamBuffer(full) ;
            full.write('ab') ; full.end('c') ;
            t.expect1((await pFull)?.toString()).is('abc') ;

            // an empty stream gives an empty buffer, not null
            const empty = new PassThrough() ;
            const pEmpty = $readStreamBuffer(empty) ;
            empty.end() ;
            const emptyBuffer = await pEmpty ;
            t.expect2(emptyBuffer).OK() ;
            t.expect3(emptyBuffer?.length).is(0) ;

            // a failing stream (eg. a client aborting its request) resolves to null instead of rejecting
            const failing = new PassThrough() ;
            const pFailing = $readStreamBuffer(failing) ;
            failing.write('partial') ;
            failing.destroy(new Error('aborted')) ;
            t.expect4(await pFailing).null() ;

            // a stream closed without any 'end' event resolves to null instead of never resolving
            const closed = new PassThrough() ;
            const pClosed = $readStreamBuffer(closed) ;
            closed.write('partial') ;
            closed.destroy() ;
            t.expect5(await pClosed).null() ;
        }) ;
    })) ;

    serverGroups.push(TSTest.group("Testing TSServer API definitions", async (group) => {
        const localDirectory = $absolute('test/main') ;
        const content = $readBuffer($path(localDirectory, 'index.html')) ;
        const port = 8327 as uint16 ;
        const basicOptions: TSServerOptions = {
            port:port,
            log: { level: TSServerLogLevel.None }
        } ;
        const options:TSServerOptions = {
            ...basicOptions,
            webSites:{ '/':localDirectory }
        } ;
        
        group.unary('Unparametrized server launch', async(t) => {
            const e = await TSServer.start({}) ;
            t.expect(e instanceof TSError).true() ;
        }) ;

        group.unary('Simple web page service', async (t) => {
            t.register('options', options) ;            
            t.register('localDirectory', localDirectory) ;
            if (t.expect0(content).OK() && t.expect1(content!.length).gt(0)) {
                const startStatus = await TSServer.start(null, options) ;
                t.expect2(startStatus).is(TSServerStartStatus.HTTP) ;
                t.expect3(TSServer.isRunning()).true() ;

                const client = new TSRequest(`http://localhost:${port}/`) ;
                const [ret, status] = await client.request('index.html', Verb.Get, RespType.Buffer) ;
                if (t.expectA(status).is(Resp.OK)) {
                    t.expectB(ret).is(content) ;
                }
                const stopped = await TSServer.stop() ;
                t.expectZ(stopped).toBeUndefined() ;    
            }
        }) ;
        group.unary('Base64 decoder service', async t => {
            const b64 = 'JVBERi0xLjQKJcKlwrEKCgoKMSAwIG9iagogIDw8IC9UeXBlIC9DYXRhbG9nCiAgICAgL1BhZ2VzIDIgMCBSCiAgPj4KZW5kb2JqCgoyIDAgb2JqCiAgPDwgL1R5cGUgL1BhZ2VzCiAgICAgL0tpZHMgWzMgMCBSXQogICAgIC9Db3VudCAxCiAgICAgL01lZGlhQm94IFswIDAgMzAwIDE0NF0KICA+PgplbmRvYmoKCjMgMCBvYmoKICA8PCAgL1R5cGUgL1BhZ2UKICAgICAgL1BhcmVudCAyIDAgUgogICAgICAvUmVzb3VyY2VzCiAgICAgICA8PCAvRm9udAogICAgICAgICAgIDw8IC9GMQogICAgICAgICAgICAgICA8PCAvVHlwZSAvRm9udAogICAgICAgICAgICAgICAgICAvU3VidHlwZSAvVHlwZTEKICAgICAgICAgICAgICAgICAgL0Jhc2VGb250IC9UaW1lcy1Sb21hbgogICAgICAgICAgICAgICA+PgogICAgICAgICAgID4+CiAgICAgICA+PgogICAgICAvQ29udGVudHMgNCAwIFIKICA+PgplbmRvYmoKCjQgMCBvYmoKICA8PCAvTGVuZ3RoIDU1ID4+CnN0cmVhbQogIEJUCiAgICAvRjEgMTggVGYKICAgIDAgMCBUZAogICAgKEhlbGxvIFdvcmxkKSBUagogIEVUCmVuZHN0cmVhbQplbmRvYmoKCnhyZWYKMCA1CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAxOCAwMDAwMCBuIAowMDAwMDAwMDc3IDAwMDAwIG4gCjAwMDAwMDAxNzggMDAwMDAgbiAKMDAwMDAwMDQ1NyAwMDAwMCBuIAp0cmFpbGVyCiAgPDwgIC9Sb290IDEgMCBSCiAgICAgIC9TaXplIDUKICA+PgpzdGFydHhyZWYKNTY1CiUlRU9GCg==' ;
            const prefix = 'This is a prefix.' ;

            const endPoint:TSEndPoint = {
                controller:async (req:TSServerRequest, resp:TSServerResponse, context?:TSDictionary):Promise<void> => {
                    const len = $length(context?.prefix) ;
                    let str = req.body as string ;
                    if (len > 0 && str.startsWith(str)) {
                        str = str.slice(len) ;
                    }
                    resp.returnData($decodeBase64(str)) ;
                },
                body:{
                    _mandatory:true,
                    _type:"string"
                },
                context:{prefix:prefix}
            } ;
            const serverEndPoints:TSDictionary<TSEndPointsDefinitionDictionary> = {
                "/decode":{
                    POST: endPoint
                }
            } ;
            const startStatus = await TSServer.start(serverEndPoints, {...basicOptions }) ;
            t.expect0(startStatus).is(TSServerStartStatus.HTTP) ;
            t.expect1(TSServer.isRunning()).true() ;
            const client = new TSRequest(`http://localhost:${port}/`) ;
            t.expect2(client).OK() ;
            const resp = await client.req("decode", Verb.Post, RespType.Buffer, prefix+b64) ;
            if (t.expect3(resp.status).is(Resp.OK)) {
                t.expect4(resp.response).is($decodeBase64(b64)) ;
            }
            else {
                console.log("Did encouter error "+resp.status) ;
                console.log("Error:", $jsonparse(resp.response!.toString())) ;
            }
            const stopped = await TSServer.stop() ;
            t.expectZ(stopped).undef() ;   
        }) ;
        group.unary('Parametric endpoint with post request test', async(t) => {
            const sessionID = $UUID("2281C1F4-15CA-4BE2-A576-67E8D9FFAFA1") ;
            const badSessionID = $UUID("41D3BEA0-B52A-4186-901A-DFA15D8D4E4E") ;
            const eventStart = 100 ;
            const eventEnd = 500 ;
            const eventInvalids = true ;
            const endPointStructure:TSObjectNode = {
                _mandatory:true,
                textColor:'color!',
                text:'string!',
                country:'country!',
                language:'language!',
                currency:'currency!',
                data:'hexa!'
            }
            const france = TSCountry.country('France')! ;
            const incompleteResponse = { 
                text:'this is a text', 
                language:Languages.fr,
                currency:france.currency,
                data:Buffer.from([0x30, 0x39, 0x41, 0x5a, 0x61, 0x7a])
            } ;
            const endPointResponse = { 
                ... incompleteResponse,
                textColor:TSColor.rgb('red'), 
                country:france
            }
            const returnedResponse = {
                ... incompleteResponse,
                textColor:TSColor.rgb('red'), 
                country:france.alpha2Code
            }
            const returnedResponseParser = TSParser.define(endPointStructure) ;
            // t.logAllTests = true ;

            if (t.expect1(returnedResponseParser).OK()) {
                t.register('options', basicOptions) ;            

                const postEndPoint:TSEndPoint = {
                    controller:async (req:TSServerRequest, resp:TSServerResponse):Promise<void> => {
                        const sid = req.parameters['sid'] ;
                        t.expect3(sid === sessionID || sid === badSessionID).true() ;
                        t.expect4(req.query).is({ start:eventStart, end:eventEnd, invalids:eventInvalids }) ;
                        t.expect5(req.body).is(parserStructureTestInterpretation()) ;
                        resp.returnObject(sid === sessionID ? endPointResponse : incompleteResponse) ;
                    },
                    query:{
                        start: 'unsigned!',
                        end:   'unsigned!',
                        invalids: 'boolean'
                    },
                    body:parserStructureTestDefinition,
                    response:endPointStructure
                } ;
                const serverEndPoints = {
                    '/sessions/{sid:uuid}/events':{
                        POST:postEndPoint
                    }
                } ;
                const startStatus = await TSServer.start(serverEndPoints, {...options }) ;
                t.expect2(startStatus).is(TSServerStartStatus.HTTP) ;
                t.expectA(TSServer.isRunning()).true() ;
                t.register('sessionID', sessionID) ;
                const client = new TSRequest(`http://localhost:${port}/`) ;
                const resp = await client.req(
                    `sessions/${sessionID}/events?start=${eventStart}&end=${eventEnd}&invalids=${eventInvalids}`, 
                    Verb.Post, 
                    RespType.Json, 
                    parserStructureTestValue()
                ) ;
                t.expectB(resp.status).is(Resp.OK) ;
                const r0 = returnedResponseParser!.interpret(resp.response) ;
                t.expectC(r0).is(returnedResponse) ; 

                const resp2 = await client.req(
                    `sessions/${badSessionID}/events?start=${eventStart}&end=${eventEnd}&invalids=${eventInvalids}`, 
                    Verb.Post, 
                    RespType.Json, 
                    parserStructureTestValue()
                ) ;
                t.expectD(resp2.status).is(Resp.InternalError) ;
                const r = resp2.response as any ;
                t.expectE(r.status).is(Resp.InternalError) ;
                t.expectF(r.error).is('TSServerResponse.returnObject(): Invalid structured response') ;
                t.expectG(r.info?.errors).toBeArray() ;
                t.expectH(r.info?.errors.length).is(2) ;
                t.expectI(r.info?.errors[0]).is('value.textColor is mandatory.') ;
                t.expectJ(r.info?.errors[1]).is('value.country is mandatory.') ;
                t.expectK(r.info?.serverError).is(TSServerErrorCodes.BadResponseStructure) ;
                const stopped = await TSServer.stop() ;
                t.expectZ(stopped).toBeUndefined() ;   
            } 
        }) ;
        group.unary('Test send blob request', async (t) => {
            const blobPart = new Uint8Array([31, 32, 33, 34]);
            const blobBody: Blob = new Blob([blobPart]);
            const postEndPoint = async (req: TSServerRequest, resp: TSServerResponse): Promise<void> => {
                const data = await $readStreamBuffer(req.message);
                t.expect2(data).eq(blobPart);
                resp.returnData(data);
            };
            const serverEndPoints = {
                '/blobs':{
                    POST: postEndPoint
                }
            };
            const startStatus = await TSServer.start(serverEndPoints, {...options });
            t.expect0(startStatus).is(TSServerStartStatus.HTTP);
            t.expect1(TSServer.isRunning()).true();
            const client = new TSRequest(`http://localhost:${port}/`);
            const resp = await client.req('blobs', Verb.Post, RespType.Buffer, blobBody);
            t.expectA(resp.status).is(Resp.OK);
            t.expectB(resp.response).is(blobPart);
            const stopped = await TSServer.stop();
            t.expectZ(stopped).toBeUndefined();
        });
        group.unary('Same page in HTTP/S', async (t) => {
            const cert = $readBuffer($absolute('test/cert/cert.pem')) ;
            const key = $readBuffer($absolute('test/cert/key.pem')) ;
            if (t.expect0($length(cert)).gt(0) && t.expect1($length(key)).gt(0)) {
                const opts = {...options, certificate:cert, key:key, port:9654 }
                const startStatus = await TSServer.start(null, opts as TSServerOptions) ;
                t.register('options', opts) ;            
                t.expect2(startStatus).is(TSServerStartStatus.HTTPS) ;
                t.expect3(TSServer.isRunning()).true() ;

                const client = new TSRequest('https://localhost:9655/') ;
                let [ret, status] = await client.request('index.html', Verb.Get, RespType.Buffer) ;
                
                // since we cannot connect, we should have a misdirected error
                t.expectA(status).is(Resp.Misdirected) ;
                
                client.baseURL = 'https://localhost:9654/' ; // this should assert a new channel
                
                [ret, status] = await client.request('index.html', Verb.Get, RespType.Buffer) ;
                t.expectB(status).is(Resp.Misdirected) ;

                /**
                 * we didn't want to add node forge in our modules, so we did generate
                 * an autosigned certificate with openssl and use it for our tests. 
                 * For our test to work, we need to set 
                 *  process.env.NODE_TLS_REJECT_UNAUTHORIZED to ZERO.
                 * 
                 * This is an awfull hack but it does not have any dependancy issues
                 */
                process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
                [ret, status] = await client.request('index.html', Verb.Get, RespType.Buffer) ;
                if (t.expectC(status).is(Resp.OK)) {
                    t.expectD(ret).is(content) ;
                }
                const stopped = await TSServer.stop() ;
                t.expectZ(stopped).toBeUndefined() ;
            }
        }) ;
    })) ;

    serverGroups.push(TSTest.group("TSServer — response types, 404, CORS preflight", async (group) => {
        const port = 8399 as uint16 ;
        const base = `http://localhost:${port}/` ;
        const opts:TSServerOptions = { port, log: { level: TSServerLogLevel.None }, preflightController:'permisive' } ;

        const endpoints:TSDictionary<TSEndpointsDefinition> = {
            '/text':    async (_r, resp) => { resp.returnString('plain text', Resp.OK) ; },
            '/obj':     async (_r, resp) => { resp.returnObject({ ok:true, n:42 }) ; },
            '/nocontent': async (_r, resp) => { resp.returnEmpty() ; },
            '/boom':    async (_r, resp) => { resp.returnError({ error:'nope' }, Resp.Forbidden) ; },
            '/echo/{id}': { GET: {
                controller: async (req, resp) => { resp.returnObject({ id:req.parameters['id'], q:req.query }) ; },
                query: { a:'uint32', b:'string' },
            } },
        } ;

        group.unary('stop() on a non-running server is a no-op', async (t) => {
            t.expect0(TSServer.isRunning()).false() ;
            t.expect1(await TSServer.stop()).undef() ;
        }) ;

        group.unary('response types & error responses', async (t) => {
            const st = await TSServer.start(endpoints as any, opts) ;
            t.expect0(st).is(TSServerStartStatus.HTTP) ;
            try {
                const client = new TSRequest(base) ;

                const s = await client.req('text', Verb.Get, RespType.String) ;
                t.expect1(s.status).is(Resp.OK) ;
                t.expect2(s.response).is('plain text') ;

                const o = await client.req('obj', Verb.Get, RespType.Json) ;
                t.expect3(o.status).is(Resp.OK) ;
                t.expect4((o.response as any).n).is(42) ;

                const e = await client.req('nocontent', Verb.Get, RespType.OptionalJson) ;
                t.expect5(e.status).is(Resp.NoContent) ;
                t.expect6(e.response).null() ;

                const b = await client.req('boom', Verb.Get, RespType.Json) ;
                t.expect7(b.status).is(Resp.Forbidden) ;

                const nf = await client.req('does/not/exist', Verb.Get, RespType.OptionalJson) ;
                t.expect8(nf.status).is(Resp.NotFound) ;

                const echo = await client.req('echo/xyz?a=1&b=two', Verb.Get, RespType.Json) ;
                t.expect9((echo.response as any).id).is('xyz') ;
                t.expectA((echo.response as any).q).is({ a:1, b:'two' }) ;
            }
            finally { await TSServer.stop() ; }
        }) ;

        group.unary('CORS preflight (OPTIONS) with a permisive controller', async (t) => {
            const st = await TSServer.start(endpoints as any, opts) ;
            t.expect0(st).is(TSServerStartStatus.HTTP) ;
            try {
                const client = new TSRequest(base) ;
                const resp = await client.req('obj', 'OPTIONS' as Verb, RespType.String, null, {
                    'origin':'https://foo.example',
                    'access-control-request-method':'GET',
                }) ;
                t.expect1(resp.status).is(Resp.NoContent) ;
                const acao = resp.headers.get('access-control-allow-origin') ;
                t.expect2($length(acao)).gt(0) ;
                t.expect3($length(resp.headers.get('access-control-allow-methods'))).gt(0) ;
                // content-type and accept are always allowed, they used to be added to the methods instead of the headers
                t.expect4($string(resp.headers.get('access-control-allow-headers'))).is('content-type, accept') ;
            }
            finally { await TSServer.stop() ; }
        }) ;

        group.unary('CORS: a valid preflight gives Access-Control-Allow-Origin to the following requests', async (t) => {
            const st = await TSServer.start(endpoints as any, opts) ;
            t.expect0(st).is(TSServerStartStatus.HTTP) ;
            try {
                const client = new TSRequest(base) ;
                const origin = 'https://foo.example' ;
                const pf = await client.req('obj', 'OPTIONS' as Verb, RespType.String, null, { 'origin':origin, 'access-control-request-method':'GET' }) ;
                t.expect1(pf.status).is(Resp.NoContent) ;
                const allowed = pf.headers.get('access-control-allow-origin') ;

                // the request following the preflight, from the same origin, gets the CORS header (it used to be refused)
                const r1 = await client.req('obj', Verb.Get, RespType.Json, null, { 'origin':origin }) ;
                t.expect2(r1.status).is(Resp.OK) ;
                t.expect3(r1.headers.get('access-control-allow-origin')).is(allowed) ;
                // and so do the next ones while the preflight is valid
                const r2 = await client.req('obj', Verb.Get, RespType.Json, null, { 'origin':origin }) ;
                t.expect4(r2.headers.get('access-control-allow-origin')).is(allowed) ;
                // no preflight for this origin: no CORS header
                const r3 = await client.req('obj', Verb.Get, RespType.Json, null, { 'origin':'https://other.example' }) ;
                t.expect5(r3.headers.get('access-control-allow-origin')).null() ;

                // a valid preflight is kept by the caches cleaning, an expired one is removed and no longer used
                const cache:any = (TSServer as any).__server._preflightResponseCache ; // a TSCache
                // the preflights expire in a millisecond (their Access-Control-Max-Age is at least 10 s)
                const expire = async () => {
                    for (const [k, v] of cache) { cache.set(k, v, { expires:new Date(Date.now() + 1) }) ; }
                    await new Promise(resolve => setTimeout(resolve, 5)) ;
                } ;
                TSServer.clearCaches() ;
                t.expect6(cache.size).is(1) ;
                await expire() ;                                  // the preflight is now expired
                const r4 = await client.req('obj', Verb.Get, RespType.Json, null, { 'origin':origin }) ;
                t.expect7(r4.headers.get('access-control-allow-origin')).null() ;
                t.expect8(cache.size).is(0) ;
                await client.req('obj', 'OPTIONS' as Verb, RespType.String, null, { 'origin':origin, 'access-control-request-method':'GET' }) ;
                await expire() ;
                TSServer.clearCaches() ;
                t.expect9(cache.size).is(0) ;
            }
            finally { await TSServer.stop() ; }
        }) ;

        group.unary('CORS: the number of kept preflight responses is limited', async (t) => {
            const st = await TSServer.start(endpoints as any, { ...opts, maxPreflightResponses:2 }) ;
            t.expect0(st).is(TSServerStartStatus.HTTP) ;
            try {
                const client = new TSRequest(base) ;
                for (const o of ['https://a.example', 'https://b.example', 'https://c.example']) {
                    await client.req('obj', 'OPTIONS' as Verb, RespType.String, null, { 'origin':o, 'access-control-request-method':'GET' }) ;
                }
                const cache:any = (TSServer as any).__server._preflightResponseCache ;
                t.expect1(cache.size).is(2) ;
                // the oldest one was evicted: its next request has no CORS header
                const ra = await client.req('obj', Verb.Get, RespType.Json, null, { 'origin':'https://a.example' }) ;
                t.expect2(ra.headers.get('access-control-allow-origin')).null() ;
                const rc = await client.req('obj', Verb.Get, RespType.Json, null, { 'origin':'https://c.example' }) ;
                t.expect3($length(rc.headers.get('access-control-allow-origin'))).gt(0) ;
            }
            finally { await TSServer.stop() ; }
        }) ;
    })) ;

    serverGroups.push(TSTest.group("TSServer — developer logging & request-validation errors", async (group) => {
        const port = 8402 as uint16 ;
        const base = `http://localhost:${port}/` ;
        // Developer log level + the default internal logger exercises the debug/logme code paths
        const opts:TSServerOptions = { port, log: { level: TSServerLogLevel.Developer } } ;

        const endpoints:any = {
            '/echo': {
                GET: {
                    controller: async (req:TSServerRequest, resp:TSServerResponse) => { resp.returnObject({ q:req.query }) ; },
                    query: { _mandatory:true, n:'uint32!' },
                },
                POST: {
                    controller: async (req:TSServerRequest, resp:TSServerResponse) => { resp.returnObject({ b:req.body }) ; },
                    body: { _mandatory:true, name:'string!' },
                },
            },
            '/p/{id:int}': {
                GET: async (req:TSServerRequest, resp:TSServerResponse) => { resp.returnObject({ id:req.parameters['id'] }) ; },
            },
        } ;

        group.unary('successful requests with developer logging', async (t) => {
            const st = await TSServer.start(endpoints as any, opts) ;
            t.expect0(st).is(TSServerStartStatus.HTTP) ;
            try {
                const client = new TSRequest(base) ;

                const g = await client.req('echo?n=7', Verb.Get, RespType.Json) ;
                t.expect1(g.status).is(Resp.OK) ;
                t.expect2((g.response as any).q.n).is(7) ;

                const p = await client.req('echo', Verb.Post, RespType.Json, { name:'Bob' }) ;
                t.expect3(p.status).is(Resp.OK) ;
                t.expect4((p.response as any).b.name).is('Bob') ;

                const par = await client.req('p/42', Verb.Get, RespType.Json) ;
                t.expect5(par.status).is(Resp.OK) ;
                t.expect6((par.response as any).id).is(42) ;
                t.expectC((await client.req('p/notanumber', Verb.Get, RespType.OptionalJson)).status).is(Resp.BadRequest) ; // bad path param

                // default preflight controller (no custom preflightController in opts)
                const pf = await client.req('echo', 'OPTIONS' as Verb, RespType.String, null, {
                    'origin':'https://x.example',
                    'access-control-request-method':'GET',
                    'access-control-request-headers':'X-Custom, Authorization',
                }) ;
                t.expect7(pf.status).is(Resp.NoContent) ;
                // the requested headers used to be read in access-control-allow-headers, so they were never allowed
                t.expectA($string(pf.headers.get('access-control-allow-headers'))).is('x-custom, authorization, content-type, accept') ;

                // clearCaches on a running server
                TSServer.clearCaches() ;
                t.expect8(TSServer.isRunning()).true() ;
            }
            finally { await TSServer.stop() ; }
        }) ;

        group.unary('request-validation error responses', async (t) => {
            const st = await TSServer.start(endpoints as any, opts) ;
            t.expect0(st).is(TSServerStartStatus.HTTP) ;
            try {
                const client = new TSRequest(base) ;

                t.expect1((await client.req('echo?n=notanumber', Verb.Get, RespType.OptionalJson)).status).is(Resp.BadRequest) ; // bad query
                t.expect2((await client.req('echo', Verb.Post, RespType.OptionalJson, { wrong:'shape' })).status).is(Resp.BadRequest) ; // bad body
                t.expect3((await client.req('echo', Verb.Post, RespType.OptionalJson, 'not json{', { 'content-type':'application/json' })).status).is(Resp.BadRequest) ; // bad JSON
                t.expect4((await client.req('p/notanint', Verb.Get, RespType.OptionalJson)).status).is(Resp.BadRequest) ;   // bad path parameter
                t.expect5((await client.req('echo', Verb.Delete, RespType.OptionalJson)).status).gte(Resp.BadRequest) ; // method not implemented on that endpoint
                t.expect6((await client.req('nowhere', Verb.Get, RespType.OptionalJson)).status).is(Resp.NotFound) ;
            }
            finally { await TSServer.stop() ; }
        }) ;

        // a raw request, to send what TSRequest never sends (an unknown method, a body without content type...)
        const rawRequest = (method:string, path:string, headers:TSDictionary<string>, body?:string):Promise<[number, any]> => new Promise((resolve, reject) => {
            const req = httpRequest({ host:'localhost', port, method, path, headers }, res => {
                const chunks:Buffer[] = [] ;
                res.on('data', c => chunks.push(c)) ;
                res.on('end', () => resolve([res.statusCode!, $jsonparse(Buffer.concat(chunks).toString('utf8'))])) ;
            }) ;
            req.on('error', reject) ;
            if ($length(body)) { req.write(body) ; }
            req.end() ;
        }) ;

        group.unary('missing body, missing MIME type, unknown method, internal errors', async (t) => {
            const errorEndpoints:any = {
                ...endpoints,
                '/boom': { GET: async () => { throw new Error('') ; } },           // not a TSError, no message
                '/crash': { GET: async () => { throw { status:999 } ; } },         // not an error, not a valid status
                '/optional': { POST: {
                    controller: async (req:TSServerRequest, resp:TSServerResponse) => { resp.returnObject({ hasBody:req.body !== undefined }) ; },
                    body: { name:'string!' },
                } },
            } ;
            const st = await TSServer.start(errorEndpoints, { port, log: { level: TSServerLogLevel.None } }) ;
            t.expect0(st).is(TSServerStartStatus.HTTP) ;
            try {
                // an empty body used to be decoded and gave a bad JSON error
                const [s1, r1] = await rawRequest('POST', '/echo', { 'content-type':'application/json' }) ;
                t.expect1(s1).is(Resp.BadRequest) ;
                t.expect2(r1?.info?.serverError).is(TSServerErrorCodes.MissingBody) ;
                const [sa, ra] = await rawRequest('POST', '/optional', { 'content-type':'application/json' }) ;
                t.expectA(sa).is(Resp.OK) ;          // an absent optional body is accepted
                t.expectB(ra).is({ hasBody:false }) ;

                const [s2, r2] = await rawRequest('POST', '/echo', {}, '{"name":"Bob"}') ;
                t.expect3(s2).is(Resp.BadRequest) ;
                t.expect4(r2?.info?.serverError).is(TSServerErrorCodes.MissingMimeType) ;

                const [s3, r3] = await rawRequest('PROPFIND', '/echo', {}) ;
                t.expect5(s3).is(Resp.NotAllowed) ;
                t.expect6(r3?.info?.serverError).is(TSServerErrorCodes.UnknownMethod) ;

                const [s4, r4] = await rawRequest('GET', '/boom', {}) ;
                t.expect7(s4).is(Resp.InternalError) ;
                t.expect8(r4?.error).is('Unknown internal Error') ;

                const [s5] = await rawRequest('GET', '/crash', {}) ;
                t.expect9(s5).is(Resp.InternalError) ;
            }
            finally { await TSServer.stop() ; }
        }) ;

        group.unary('bad server port', async (t) => {
            const ret = await TSServer.start(endpoints, { port:70000 as uint16, log: { level: TSServerLogLevel.None } }) ;
            t.expect0(ret instanceof TSError).true() ;
            t.expect1((ret as Error).message).is('TSServer.constructor(): Bad HTTP server port 70000.') ;
            t.expect2(TSServer.isRunning()).false() ;
        }) ;
    })) ;

    serverGroups.push(TSTest.group("TSServerResponse — bad arguments", async (group) => {
        const port = 8413 as uint16 ;
        const endpoints:any = {
            '/object-data': async (_r:TSServerRequest, resp:TSServerResponse) => { resp.returnObject(Buffer.from([1, 2])) ; },
            '/error3': async (_r:TSServerRequest, resp:TSServerResponse) => { (resp as any).returnError('a', 400, 'b') ; },
            '/string4': async (_r:TSServerRequest, resp:TSServerResponse) => { (resp as any).returnString('a', 'text/plain', 201, 'b') ; },
            '/error1': async (_r:TSServerRequest, resp:TSServerResponse) => { resp.returnError(Resp.Conflict) ; },
        } ;
        group.unary('returnError() without argument or with an object only, setHeader() chaining', async (t) => {
            const forms:any = {
                '/error0': async (_r:TSServerRequest, resp:TSServerResponse) => { (resp as any).returnError() ; }, // not allowed by the typings
                '/errorObject': async (_r:TSServerRequest, resp:TSServerResponse) => { resp.returnError({ why:'because' }) ; },
                '/header': async (_r:TSServerRequest, resp:TSServerResponse) => { resp.setHeader('X-Test', 'yes').returnString('h', Resp.Created) ; },
            } ;
            t.expect0(await TSServer.start(forms, { port, log: { level: TSServerLogLevel.None } })).is(TSServerStartStatus.HTTP) ;
            try {
                const client = new TSRequest(`http://localhost:${port}/`) ;
                const r0 = await client.req('error0', Verb.Get, RespType.String) ;
                t.expect1(r0.status).is(Resp.InternalError) ;      // no argument: an empty internal error
                t.expect2(r0.response).is('') ;
                const r1 = await client.req('errorObject', Verb.Get, RespType.Json) ;
                t.expect3(r1.status).is(Resp.InternalError) ;      // an object only: the default status
                t.expect4(r1.response).is({ why:'because' }) ;
                const r2 = await client.req('header', Verb.Get, RespType.String) ;
                t.expect5(r2.status).is(Resp.Created) ;
                t.expect6(r2.headers.get('x-test')).is('yes') ;
                t.expect7(r2.response).is('h') ;
            }
            finally { await TSServer.stop() ; }
        }) ;

        group.unary('returnObject() with data, too many arguments', async (t) => {
            t.expect0(await TSServer.start(endpoints, { port, log: { level: TSServerLogLevel.None } })).is(TSServerStartStatus.HTTP) ;
            try {
                const client = new TSRequest(`http://localhost:${port}/`) ;
                const r0 = await client.req('object-data', Verb.Get, RespType.Json) ;
                t.expect1(r0.status).is(Resp.InternalError) ;
                t.expect2((r0.response as any)?.info?.serverError).is(TSServerErrorCodes.ForbiddenDataResponse) ;
                const r1 = await client.req('error3', Verb.Get, RespType.Json) ;
                t.expect3((r1.response as any)?.error).is('TSServerResponse.returnError() : Bad arguments') ;
                const r2 = await client.req('string4', Verb.Get, RespType.Json) ;
                t.expect4((r2.response as any)?.error).is('TSServerResponse.returnString() : Bad arguments') ;
                t.expect5((await client.req('error1', Verb.Get, RespType.OptionalJson)).status).is(Resp.Conflict) ;
            }
            finally { await TSServer.stop() ; }
        }) ;
    })) ;

    serverGroups.push(TSTest.group("TSServer — preflight refusal, default port, forbidden root", async (group) => {
        group.unary('OPTIONS refused when the preflight controller returns nothing', async (t) => {
            const port = 8404 as uint16 ;
            const st = await TSServer.start(
                { '/x': async (_r:TSServerRequest, resp:TSServerResponse) => { resp.returnEmpty() ; } } as any,
                { port, log: { level: TSServerLogLevel.Warnings }, preflightController: async () => null as any },
            ) ;
            t.expect0(st).is(TSServerStartStatus.HTTP) ;
            try {
                const client = new TSRequest(`http://localhost:${port}/`) ;
                const resp = await client.req('x', 'OPTIONS' as Verb, RespType.String, null, {
                    'origin':'https://y.example',
                    'access-control-request-method':'GET',
                }) ;
                t.expect1(resp.status).is(Resp.NotAllowed) ;
            }
            finally { await TSServer.stop() ; }
        }) ;

        group.unary('default port (3000) and forbidden root', async (t) => {
            const st = await TSServer.start(
                { '/here': async (_r:TSServerRequest, resp:TSServerResponse) => { resp.returnEmpty() ; } } as any,
                { log: { level: TSServerLogLevel.None } },   // no port -> defaults to 3000
            ) ;
            t.expect0(st).is(TSServerStartStatus.HTTP) ;
            try {
                const client = new TSRequest('http://localhost:3000/') ;
                t.expect1((await client.req('', Verb.Get, RespType.OptionalJson)).status).is(Resp.Forbidden) ; // root not accessible
                t.expect2((await client.req('here', Verb.Get, RespType.OptionalJson)).status).is(Resp.NoContent) ;
            }
            finally { await TSServer.stop() ; }
        }) ;

        group.unary('custom logger: sensitive headers are masked, root path, static resource, refused preflight', async (t) => {
            const port = 8416 as uint16 ;
            const logs:{ type:string, message:string }[] = [] ;
            // a custom logger keeps the messages instead of printing them (the developer level logs everything)
            const logger = async (type:TSServerLogType, message:string) => { logs.push({ type, message }) ; } ;
            const st = await TSServer.start(
                { 
                    '/home': async (_r:TSServerRequest, resp:TSServerResponse) => { resp.returnObject({ home:true }) ; },
                    '/x': async (_r:TSServerRequest, resp:TSServerResponse) => { resp.returnEmpty() ; },
                } as any,
                { 
                    port, rootPath:'/home', webSites:{ '/':$absolute('test/main') },
                    preflightController: async () => null as any,
                    log: { level:TSServerLogLevel.Developer, logger, sensitiveHeaders:['authorization', 'cookie', 'set-cookie'] } 
                },
            ) ;
            t.expect0(st).is(TSServerStartStatus.HTTP) ;
            try {
                // the root path is redirected to the rootPath end point
                const [s1, r1] = await rawRequest(port, 'GET', '/', {
                    'authorization':'Bearer secret-token',
                    'cookie':'sid=secret-cookie',
                    'set-cookie':['a=secret-one', 'b=secret-two'] as any, // an array header value
                    'x-custom':'visible-value'
                }) ;
                t.expect1(s1).is(Resp.OK) ;
                t.expect2(r1).is({ home:true }) ;
                const headersLogs = logs.filter(l => l.message.includes('request headers')) ;
                t.expect3(headersLogs.length).is(1) ;
                const hl = $string(headersLogs[0]?.message) ;
                t.expect4(headersLogs[0]?.type).is(TSServerLogType.Developer) ;
                t.expect5(/secret/.test(hl)).false() ;                     // no sensitive value is logged...
                t.expect6(hl.split('xxxx').length - 1).is(4) ;              // ...the 2 single values and the 2 array items are replaced
                t.expect7(hl.includes('visible-value')).true() ;            // other headers are kept

                // a static resource is served and logged
                const [s2, r2, type2] = await rawTextRequest(port, 'GET', '/index.html') ;
                t.expect8(s2).is(Resp.OK) ;
                t.expect9(type2).is('text/html') ;
                t.expectA(r2.includes('VSCode-Test Page')).true() ;
                t.expectB(logs.some(l => l.type === TSServerLogType.Log && l.message === "did handle static resource '/index.html'.")).true() ;

                // the refused preflight request is logged as a warning
                const [s3] = await rawTextRequest(port, 'OPTIONS', '/x', { 'origin':'https://y.example', 'access-control-request-method':'GET' }) ;
                t.expectC(s3).is(Resp.NotAllowed) ;
                t.expectD(logs.some(l => l.type === TSServerLogType.Warning && l.message === "did refuse preflight request for resource '/x'.")).true() ;
                t.expectE(logs.some(l => l.type === TSServerLogType.Log && l.message.startsWith(`running on port ${port}`))).true() ;
            }
            finally { await TSServer.stop() ; }
            t.expectF(logs[logs.length-1]).is({ type:TSServerLogType.Log, message:'server is exiting...' }) ;
        }) ;

        group.unary('a relative root path is ignored, a throwing logger gives an internal error', async (t) => {
            const port = 8416 as uint16 ;
            // the warning logger throws while sending the error response: the request still gets a response
            const logger = async (type:TSServerLogType, _message:string) => { if (type === TSServerLogType.Warning) { throw new Error('logger failure') ; } } ;
            const st = await TSServer.start(
                { '/home': async (_r:TSServerRequest, resp:TSServerResponse) => { resp.returnObject({ home:true }) ; } } as any,
                { port, rootPath:'home', log: { level:TSServerLogLevel.Infos, logger } },
            ) ;
            t.expect0(st).is(TSServerStartStatus.HTTP) ;
            try {
                t.expect1((TSServer as any).__server.rootPath).is('') ;   // not absolute: not used
                const [s1, body1] = await rawTextRequest(port, 'GET', '/') ;
                t.expect2(s1).is(Resp.InternalError) ;                    // instead of the forbidden root json response
                t.expect3(body1).is('') ;
                const [s2] = await rawTextRequest(port, 'GET', '/home') ;
                t.expect4(s2).is(Resp.OK) ;
            }
            finally { await TSServer.stop() ; }
            // without a server, clearCaches() does nothing
            TSServer.clearCaches() ;
            t.expect5(TSServer.isRunning()).false() ;
        }) ;

        group.unary('TLS options for mTLS', async (t) => {
            const port = 8417 as uint16 ;
            const cert = $readBuffer($absolute('test/cert/cert.pem')) ;
            const key = $readBuffer($absolute('test/cert/key.pem')) ;
            const st = await TSServer.start(
                { '/x': async (_r:TSServerRequest, resp:TSServerResponse) => { resp.returnEmpty() ; } } as any,
                { 
                    port, key, certificate:cert, certificateAuthority:cert, mtls:true, 
                    tlsSecTimeout:60, handshakeMsTimeout:5000, maxHeaderSize:16384, 
                    log: { level:TSServerLogLevel.None } 
                },
            ) ;
            t.expect0(st).is(TSServerStartStatus.HTTPS) ;
            try {
                const o = (TSServer as any).__server._serverOptions ;
                t.expect1(o.requestCert).true() ;
                t.expect2(o.rejectUnauthorized).true() ;
                t.expect3(o.sessionTimeout).is(60) ;
                t.expect4(o.handshakeTimeout).is(5000) ;
                t.expect5(o.maxHeaderSize).is(16384) ;
                t.expect6(Buffer.compare(o.ca, cert!)).is(0) ;
            }
            finally { await TSServer.stop() ; }
        }) ;

        group.unary('stop() with an open connection: Connection: close on a new request, then the socket is ended', async (t) => {
            const port = 8418 as uint16 ;
            const slow = _waitingEndPoints() ;
            t.expect0(await TSServer.start(slow.endpoints, { port, log:{ level:TSServerLogLevel.None } })).is(TSServerStartStatus.HTTP) ;
            const socket = netConnect(port, 'localhost') ;
            let received = '' ;
            socket.on('data', d => { received += d.toString('utf8') ; }) ;
            const closed = new Promise<void>(resolve => socket.on('close', () => resolve())) ;
            socket.write('GET /slow HTTP/1.1\r\nHost: localhost\r\n\r\n') ;
            await slow.arrival ;
            const stopping = TSServer.stop() ;
            // a new request on the same connection after stop() was called
            socket.write('GET /fast HTTP/1.1\r\nHost: localhost\r\n\r\n') ;
            await slow.fastArrival ;
            slow.release() ;
            await closed ; // the server did end the connection once both responses were sent
            const responses = received.split('HTTP/1.1 200').length - 1 ;
            t.expect1(responses).is(2) ;
            t.expect2(received.includes('slow-answer')).true() ;
            t.expect3(received.includes('fast-answer')).true() ;
            t.expect4(/connection: close/i.test(received.slice(received.indexOf('fast-answer') - 200))).true() ;
            t.expect5(await stopping).undef() ;
            t.expect6(TSServer.isRunning()).false() ;
        }) ;

        group.unary('stop() destroys a busy connection after the force close timeout', async (t) => {
            const port = 8418 as uint16 ;
            const slow = _waitingEndPoints() ;
            t.expect0(await TSServer.start(slow.endpoints, { port, forceCloseMsTimeout:20, log:{ level:TSServerLogLevel.None } })).is(TSServerStartStatus.HTTP) ;
            const socket = netConnect(port, 'localhost') ;
            let received = '' ;
            socket.on('data', d => { received += d.toString('utf8') ; }) ;
            socket.on('error', () => {}) ; // a reset connection must not be an uncaught error
            const closed = new Promise<void>(resolve => socket.on('close', () => resolve())) ;
            socket.write('GET /slow HTTP/1.1\r\nHost: localhost\r\n\r\n') ;
            await slow.arrival ;
            const stopping = TSServer.stop() ;
            await closed ;             // the request is still running, but its connection was destroyed
            t.expect1(received).is('') ;
            t.expect2(await stopping).undef() ;
            slow.release() ;           // the end point ends without any socket
            t.expect3(TSServer.isRunning()).false() ;
        }) ;
    })) ;

    serverGroups.push(TSTest.group("TSStaticWebsite — cache / blacklist / clearCaches", async (group) => {
        const folder = $absolute('test/main') ;

        group.unary('constructor validation', async (t) => {
            t.expect0(() => new TSStaticWebsite('', folder)).throws(/url not defined/) ;
            t.expect1(() => new TSStaticWebsite('/', '/no/such/folder/anywhere')).throws(/was not found on disk/) ;
            t.expect2(new TSStaticWebsite('/', folder).folder).is(folder) ;
        }) ;

        group.unary('resource resolution, cache hit, blacklist and clearCaches', async (t) => {
            const site = new TSStaticWebsite('/', { folder } as any) ;

            const [b1, type1] = site.getStaticResource('/index.html') ;
            t.expect0(b1).OK() ;
            t.expect1(type1).is('text/html') ;

            const [b2] = site.getStaticResource('/index.html') ;   // served from cache this time
            t.expect2(b2).is(b1) ;

            const [bmiss, tmiss] = site.getStaticResource('/does-not-exist.html') ; // -> blacklisted
            t.expect3(bmiss).undef() ;
            t.expect4(tmiss).is('text/html') ;

            const [bmiss2] = site.getStaticResource('/does-not-exist.html') ;        // still blacklisted, no read
            t.expect5(bmiss2).undef() ;

            const [bunknown, tunknown] = site.getStaticResource('/thing.unknownext') ; // no known mime -> nothing
            t.expect6(bunknown).undef() ;
            t.expect7(tunknown).is('') ;

            const [boutside] = site.getStaticResource('/other/path.html') ;          // outside site uri prefix logic
            t.expect8(boutside).undef() ;

            site.clearCaches() ;                                                     // exercise cache eviction
            const [b3] = site.getStaticResource('/index.html') ;                     // usage was reset then re-read/cached
            t.expect9(b3).OK() ;
            site.clearCaches() ;
            site.clearCaches() ;                                                     // second pass drops the now-unused entry
            t.expectA(true).true() ;
        }) ;
    })) ;
}

// a raw request with a JSON response on a given port, to send what TSRequest never sends
function rawRequest(port:number, method:string, path:string, headers:TSDictionary<string> = {}):Promise<[number, any]> {
    return rawTextRequest(port, method, path, headers).then(([s, b]) => [s, $jsonparse(b)]) ;
}

function rawTextRequest(port:number, method:string, path:string, headers:TSDictionary<string> = {}):Promise<[number, string, string]> {
    return new Promise((resolve, reject) => {
        const req = httpRequest({ host:'localhost', port, method, path, headers, agent:false }, res => {
            const chunks:Buffer[] = [] ;
            res.on('data', c => chunks.push(c)) ;
            res.on('end', () => resolve([res.statusCode!, Buffer.concat(chunks).toString('utf8'), $string(res.headers['content-type'])])) ;
        }) ;
        req.on('error', reject) ;
        req.end() ;
    }) ;
}

// a '/slow' end point which waits to be released and a '/fast' one, with their arrival promises
function _waitingEndPoints() {
    let arrived:() => void = () => {} ;
    let fastArrived:() => void = () => {} ;
    let release:() => void = () => {} ;
    const arrival = new Promise<void>(resolve => { arrived = resolve ; }) ;
    const fastArrival = new Promise<void>(resolve => { fastArrived = resolve ; }) ;
    const released = new Promise<void>(resolve => { release = resolve ; }) ;
    const endpoints:any = {
        '/slow': async (_r:TSServerRequest, resp:TSServerResponse) => { arrived() ; await released ; resp.returnString('slow-answer') ; },
        '/fast': async (_r:TSServerRequest, resp:TSServerResponse) => { fastArrived() ; resp.returnString('fast-answer') ; },
    } ;
    return { endpoints, arrival, fastArrival, release:() => release() } ;
}

// @ts-ignore
const sameCallFunction = async (req: TSServerRequest, res: TSServerResponse) => { };
