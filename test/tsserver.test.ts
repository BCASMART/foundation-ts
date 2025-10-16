// import { Agent } from "https";
// import axios from "axios";

import { TSServer, TSServerLogLevel, TSServerOptions } from "../src/tsserver";
import { $UUID, $keys, $length, $string } from "../src/commons";

import { TSTest } from '../src/tstester';
import { $absolute, $path, $readBuffer } from "../src/fs";
import { Languages, TSDictionary, uint16 } from "../src/types";
import { $inbrowser, $readStreamBuffer } from "../src/utils";
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
                console.log("Error:", JSON.parse(resp.response!.toString())) ;
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
}

// @ts-ignore
const sameCallFunction = async (req: TSServerRequest, res: TSServerResponse) => { };
