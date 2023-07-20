import { Agent } from "https";
import axios from "axios";

import { TSServer, TSServerOptions } from "../src/tsserver";
import { $UUID, $keys, $length, $string } from "../src/commons";

import { TSTest } from '../src/tstester';
import { $absolute, $path, $readBuffer } from "../src/fs";
import { Languages, TSDictionary, uint16 } from "../src/types";
import { $inbrowser } from "../src/utils";
import { Resp, RespType, TSRequest, Verb } from "../src/tsrequest";
import { TSError } from "../src/tserrors";
import { TSEndPoint, TSEndpointsDefinition, TSServerErrorCodes, TSServerRequest, TSServerResponse, TSServerStartStatus } from "../src/tsserver_types";
import { TSServerEndPoint } from "../src/tsserver_endpoints";
import { parserStructureTestDefinition, parserStructureTestInterpretation, parserStructureTestValue } from "./tsparser.test";
import { TSObjectNode, TSParser } from "../src/tsparser";
import { TSColor } from "../src/tscolor";
import { TSCountry } from "../src/tscountry";

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
            t.expect(objects[0]).toBeDefined();
        });
        group.unary(`api '/v{vers}/session/{sid}/signature/{ssid}/updatestatus'`, async (t) => {
            t.expect(objects[1]).toBeDefined();
        });
        group.unary(`api '/v{vers}/session/{sid/signature/{ssid}/updatestatus'`, async (t) => {
            t.expect(objects[2]).toBeUndefined();
        });
        group.unary(`api '/v{vers}/session/{sid}}/signature/{ssid}/updatestatus'`, async (t) => {
            t.expect(objects[3]).toBeUndefined();
        });
        group.unary(`api '/v{vers}/session/{sid01_0-2.4}/signature/{ssid}/updatestatus'`, async (t) => {
            t.expect(objects[4]).toBeDefined();
        });
        group.unary(`api '/v{vers}/session/{sid01_0-2.4}/signature/{ssid}/deleteStatus'`, async (t) => {
            t.expect(objects[5]).toBeDefined();
        });
        group.unary(`api '/v{vers}/session/{sid01_0-2.$4}/signature/{ssid}/updatestatus'`, async (t) => {
            t.expect(objects[6]).toBeUndefined();
        });
        group.unary(`api '/v{vers}/session2/{sid}'`, async (t) => {
            t.expect(objects[7]).toBeDefined();
        });
        group.unary(`api '/v{vers}/session2/{sid:date}'`, async (t) => {
            t.expect(objects[8]).toBeDefined();
        });
        group.unary(`api '/v{vers}/session2/{sid:identifier}'`, async (t) => {
            t.expect(objects[9]).toBeUndefined();
        });
        group.unary(`api '/v{vers}/session2/{sid:boolean}'`, async (t) => {
            t.expect(objects[10]).toBeDefined();
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
            logInfo:false
        } ;
        const options:TSServerOptions = {
            ...basicOptions,
            webSites:{ '/':localDirectory }
        } ;
        
        group.unary('Unparametrized server launch', async(t) => {
            const e = await TSServer.start({}) ;
            t.expect(e instanceof TSError).toBeTruthy() ;
        }) ;

        group.unary('Simple web page service', async (t) => {
            t.register('options', options) ;            
            t.register('localDirectory', localDirectory) ;
            if (t.expect0(content).OK() && t.expect1(content!.length).gt(0)) {
                const startStatus = await TSServer.start(null, options) ;
                t.expect2(startStatus).toBe(TSServerStartStatus.HTTP) ;
                t.expect3(TSServer.isRunning()).true() ;

                const client = new TSRequest(`http://localhost:${port}/`) ;
                const [ret, status] = await client.request('index.html', Verb.Get, RespType.Buffer) ;
                if (t.expectA(status).toBe(Resp.OK)) {
                    t.expectB(ret).toBe(content) ;
                }
                const stopped = await TSServer.stop() ;
                t.expectZ(stopped).toBeUndefined() ;    
            }
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
                const startStatus = await TSServer.start(serverEndPoints, {...options, developer:false}) ;
                t.expect2(startStatus).toBe(TSServerStartStatus.HTTP) ;
                t.expectA(await TSServer.isRunning()).true() ;
                t.register('sessionID', sessionID) ;
                const client = new TSRequest(`http://localhost:${port}/`) ;
                const resp = await client.req(
                    `sessions/${sessionID}/events?start=${eventStart}&end=${eventEnd}&invalids=${eventInvalids}`, 
                    Verb.Post, 
                    RespType.Json, 
                    parserStructureTestValue()
                ) ;
                t.expectB(resp.status).toBe(Resp.OK) ;
                const r0 = returnedResponseParser!.interpret(resp.response) ;
                t.expectC(r0).is(returnedResponse) ; 

                const resp2 = await client.req(
                    `sessions/${badSessionID}/events?start=${eventStart}&end=${eventEnd}&invalids=${eventInvalids}`, 
                    Verb.Post, 
                    RespType.Json, 
                    parserStructureTestValue()
                ) ;
                t.expectD(resp2.status).toBe(Resp.InternalError) ;
                const r = resp2.response as any ;
                t.expectE(r.status).is(Resp.InternalError) ;
                t.expectF(r.error).is('TSServerResponse.returnObject(): Invalid structured response') ;
                t.expectG(r.info?.errors).toBeArray() ;
                t.expectH(r.info?.errors.length).toBe(2) ;
                t.expectI(r.info?.errors[0]).toBe('value.textColor is mandatory') ;
                t.expectJ(r.info?.errors[1]).toBe('value.country is mandatory') ;
                t.expectK(r.errorCode).toBe(TSServerErrorCodes.BadResponseStructure) ;
                const stopped = await TSServer.stop() ;
                t.expectZ(stopped).toBeUndefined() ;   
            } 
        }) ;
        
        group.unary('Same page in HTTP/S', async (t) => {

            /**
             * warning: this code directly put on axios defaults
             * allows us to ignore self signed certificate error
             * during axios request. Should be removed when axios
             * will be removed from foundation-ts
             */
            axios.defaults.httpsAgent = new Agent({
                rejectUnauthorized: false,
            }) ;
            /**
             * we didn't want to add node forge in our modules, so we did generate
             * an autosigned certificate with openssl and use it for our tests. 
             */
            const cert = $readBuffer($absolute('test/cert/cert.pem')) ;
            const key = $readBuffer($absolute('test/cert/key.pem')) ;
            if (t.expect0($length(cert)).gt(0) && t.expect1($length(key)).gt(0)) {
                const opts = {...options, certificate:cert, key:key, port:9654 }
                const startStatus = await TSServer.start(null, opts as TSServerOptions) ;
                t.register('options', opts) ;            
                t.expect2(startStatus).toBe(TSServerStartStatus.HTTPS) ;
                t.expect3(TSServer.isRunning()).true() ;

                const client = new TSRequest(`https://localhost:9654/`) ;
                const [ret, status] = await client.request('index.html', Verb.Get, RespType.Buffer) ;
                if (t.expectA(status).toBe(Resp.OK)) {
                    t.expectB(ret).toBe(content) ;
                }
                const stopped = await TSServer.stop() ;
                t.expectZ(stopped).toBeUndefined() ;    
            }
        }) ;
    })) ;
}

// @ts-ignore
const sameCallFunction = async (req: TSServerRequest, res: TSServerResponse) => { };
