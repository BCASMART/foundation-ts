import { IncomingMessage, ServerResponse } from "http";

import { StringDictionary } from "../src/types";
import { TSEndPointsDictionary } from "../src/tsserver";
import { TSParametricEndPoints } from "../src/tsservercomp";
import { $keys, $string } from "../src/commons";

import { TSTest } from '../src/tstester';

export const serverGroups = TSTest.group("Testing TSServer API definitions", async (group) => {
    const apis:TSEndPointsDictionary = {
        '/sessions/callBack':{
            'PUT': sameCallFunction,
            'POST':sameCallFunction
        },
        '/v{vers}/session/{sid}/signature/{ssid}/updatestatus':{
            'GET': sameCallFunction,
            'POST': sameCallFunction,
            'DELETE': sameCallFunction,
            'PATCH': sameCallFunction,
        },
        '/v{vers}/session/{sid/signature/{ssid}/updatestatus':{ "GET": sameCallFunction },
        '/v{vers}/session/{sid}}/signature/{ssid}/updatestatus':{ "GET": sameCallFunction },
        '/v{vers}/session/{sid01_0-2.4}/signature/{ssid}/updatestatus':{ "GET": sameCallFunction },
        '/v{vers}/session/{sid01_0-2.$4}/signature/{ssid}/updatestatus':{ "GET": sameCallFunction },
        '/v{vers}/session2/{sid}':{ "PATCH": sameCallFunction}
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
    group.unary(`Testing api '/v{vers}/session/{sid01_0-2.$4}/signature/{ssid}/updatestatus'`, async (t) => {
        t.expect(objects[5]).toBeUndefined() ;
    }) ;
    group.unary(`Testing api '/v{vers}/session2/{sid}'`, async (t) => {
        t.expect(objects[6]).toBeDefined() ;
    }) ;
}) ;

const sameCallFunction = async (url:URL, parameters:StringDictionary, msg: IncomingMessage, res: ServerResponse) => {} ;

/*



describe("Testing TSServer API definitions", async (t) => {

}) ;
*/