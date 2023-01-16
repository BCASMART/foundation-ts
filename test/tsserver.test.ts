import { ServerResponse } from "http";
import { Agent } from "https";
import axios from "axios";

import { TSEndPointsDictionary, TSServer, TSServerOptions, TSServerRequest, TSServerStartStatus } from "../src/tsserver";
import { TSParametricEndPoints } from "../src/tsservercomp";
import { $keys, $length, $string } from "../src/commons";

import { TSTest } from '../src/tstester';
import { $absolute, $path, $readBuffer } from "../src/fs";
import { uint16 } from "../src/types";
import { $inbrowser } from "../src/utils";
import { Resp, RespType, TSRequest, Verb } from "../src/tsrequest";
import { TSError } from "../src/tserrors";

export const serverGroups = [
    TSTest.group("Testing TSServer API definitions", async (group) => {
        const apis: TSEndPointsDictionary = {
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
            let ep: TSParametricEndPoints | undefined = undefined;
            try {
                ep = new TSParametricEndPoints($string(api), apis[api], true);
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
        const options:TSServerOptions = {
            port:port,
            logInfo:false,
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
                t.expect3(await TSServer.start(null, options)).toBe(TSServerStartStatus.AlreadyRunning) ;

                const client = new TSRequest(`http://localhost:8327/`) ;
                const [ret, status] = await client.request('index.html', Verb.Get, RespType.Buffer) ;
                if (t.expectA(status).toBe(Resp.OK)) {
                    t.expectB(ret).toBe(content) ;
                }
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
                t.expect3(await TSServer.start(null, options)).toBe(TSServerStartStatus.AlreadyRunning) ;
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
const sameCallFunction = async (req: TSServerRequest, res: ServerResponse) => { };
