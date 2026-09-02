// import { Agent } from "https";
// import axios from "axios";

import { TSServer, TSServerLogLevel, TSServerOptions } from "../src/tsserver";
import { $UUID, $keys, $length, $string } from "../src/commons";

import { TSTest } from '../src/tstester';
import { $absolute, $path, $readBuffer } from "../src/fs";
import { Languages, TSDictionary, uint16 } from "../src/types";
import { $inbrowser, $jsonparse, $readStreamBuffer } from "../src/utils";
import { Resp, RespType, TSRequest, Verb } from "../src/tsrequest";
import { TSError } from "../src/tserrors";
import { TSEndPoint, TSEndpointsDefinition, TSEndPointsDefinitionDictionary, TSServerErrorCodes, TSServerRequest, TSServerResponse, TSServerStartStatus } from "../src/tsserver_types";
import { TSServerEndPoint } from "../src/tsserver_endpoints";
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
    })
];

if (!$inbrowser()) {
    serverGroups.push(TSTest.group("Testing TSServer API definitions", async (group) => {
        const localDirectory = $absolute('test/main') ;
        const content = $readBuffer($path(localDirectory, 'index.html')) ;
        const port = 8327 as uint16 ;
        const basicOptions: TSServerOptions = {
            port:port,
            logLevel:TSServerLogLevel.None        
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
            t.expect1(await TSServer.isRunning()).true() ;
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
                t.expectA(await TSServer.isRunning()).true() ;
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
                t.expectI(r.info?.errors[0]).is('value.textColor is mandatory') ;
                t.expectJ(r.info?.errors[1]).is('value.country is mandatory') ;
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
            t.expect1(await TSServer.isRunning()).true();
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
        const opts:TSServerOptions = { port, logLevel:TSServerLogLevel.None, preflightController:'permisive' } ;

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
            t.expect0(await TSServer.isRunning()).false() ;
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
            }
            finally { await TSServer.stop() ; }
        }) ;
    })) ;
}

// @ts-ignore
const sameCallFunction = async (req: TSServerRequest, res: TSServerResponse) => { };
