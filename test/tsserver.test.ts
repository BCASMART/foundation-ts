import { ServerResponse } from "http";

import { TSEndPointsDictionary, TSServerRequest } from "../src/tsserver";
import { TSParametricEndPoints } from "../src/tsservercomp";
import { $keys, $string } from "../src/commons";

import { TSTest } from '../src/tstester';

export const serverGroups = TSTest.group("Testing TSServer API definitions", async (group) => {
    const apis:TSEndPointsDictionary = {
        // 0
        '/sessions/callBack':{ 
            PUT: sameCallFunction,
            POST:sameCallFunction
        },

        // 1
        '/v{vers}/session/{sid}/signature/{ssid}/updatestatus':{
            GET: sameCallFunction,
            POST: sameCallFunction,
            DELETE: sameCallFunction,
            PATCH: sameCallFunction,
        },

        // 2
        '/v{vers}/session/{sid/signature/{ssid}/updatestatus':{ GET: sameCallFunction },
        
        // 3
        '/v{vers}/session/{sid}}/signature/{ssid}/updatestatus':{ GET: sameCallFunction },
        
        // 4
        '/v{vers}/session/{sid01_0-2.4}/signature/{ssid}/updatestatus':{ GET: sameCallFunction},

        // 5
        '/v{vers}/session/{sid01_0-2.4}/signature/{ssid}/deleteStatus':sameCallFunction, // this provides a simple GET API

        // 6
        '/v{vers}/session/{sid01_0-2.$4}/signature/{ssid}/updatestatus':{ GET: sameCallFunction },
        
        // 7
        '/v{vers}/session2/{sid}':{ PATCH: sameCallFunction},

        // 8
        '/v{vers}/session2/{sid:date}': sameCallFunction,

        // 9
        '/v{vers}/session2/{sid:identifier}': sameCallFunction,

        // 10
        '/v{vers}/session2/{sid:boolean}': sameCallFunction

    }
    const objects:Array<any> = [] ;

    for (let api of $keys(apis)) {
        let ep:TSParametricEndPoints|undefined = undefined ;
        try {
            ep = new TSParametricEndPoints($string(api), apis[api], true) ;
        }
        catch (e) {
            ep = undefined ;
        }
        objects.push(ep) ;
    }
    group.unary(`Testing api '/sessions/callBack'`, async (t) => {
        t.expect(objects[0]).toBeDefined() ;
    }) ;
    group.unary(`Testing api '/v{vers}/session/{sid}/signature/{ssid}/updatestatus'`, async (t) => {
        t.expect(objects[1]).toBeDefined() ;
    }) ;
    group.unary(`Testing api '/v{vers}/session/{sid/signature/{ssid}/updatestatus'`, async (t) => {
        t.expect(objects[2]).toBeUndefined() ;
    }) ;
    group.unary(`Testing api '/v{vers}/session/{sid}}/signature/{ssid}/updatestatus'`, async (t) => {
        t.expect(objects[3]).toBeUndefined() ;
    }) ;
    group.unary(`Testing api '/v{vers}/session/{sid01_0-2.4}/signature/{ssid}/updatestatus'`, async (t) => {
        t.expect(objects[4]).toBeDefined() ;
    }) ;
    group.unary(`Testing api '/v{vers}/session/{sid01_0-2.4}/signature/{ssid}/deleteStatus'`, async (t) => {
        t.expect(objects[5]).toBeDefined() ;
    }) ;
    group.unary(`Testing api '/v{vers}/session/{sid01_0-2.$4}/signature/{ssid}/updatestatus'`, async (t) => {
        t.expect(objects[6]).toBeUndefined() ;
    }) ;
    group.unary(`Testing api '/v{vers}/session2/{sid}'`, async (t) => {
        t.expect(objects[7]).toBeDefined() ;
    }) ;
    group.unary(`Testing api '/v{vers}/session2/{sid:date}'`, async (t) => {
        t.expect(objects[8]).toBeDefined() ;
    }) ;
    group.unary(`Testing api '/v{vers}/session2/{sid:identifier}'`, async (t) => {
        t.expect(objects[9]).toBeUndefined() ;
    }) ;
    group.unary(`Testing api '/v{vers}/session2/{sid:boolean}'`, async (t) => {
        t.expect(objects[10]).toBeDefined() ;
    }) ;
}) ;

const sameCallFunction = async (req:TSServerRequest, res: ServerResponse) => {} ;
