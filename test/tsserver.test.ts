import { IncomingMessage, ServerResponse } from "http";

import { StringDictionary } from "../src/types";
import { TSEndPointsDictionary } from "../src/tsserver";
import { TSParametricEndPoints } from "../src/tsservercomp";
import { $keys, $string } from "../src/commons";

const sameCallFunction = async (url:URL, parameters:StringDictionary, msg: IncomingMessage, res: ServerResponse) => {} ;

describe("Testing TSServer API definitions", () => {
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
        '/v{vers}/session1/{sid}':{ "DONE": sameCallFunction},
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
    it(`Testing api '/sessions/callBack'`, () => {
        expect(objects[0]).toBeDefined() ;
    }) ;
    it(`Testing api '/v{vers}/session/{sid}/signature/{ssid}/updatestatus'`, () => {
        expect(objects[1]).toBeDefined() ;
    }) ;
    it(`Testing api '/v{vers}/session/{sid/signature/{ssid}/updatestatus'`, () => {
        expect(objects[2]).toBeUndefined() ;
    }) ;
    it(`Testing api '/v{vers}/session/{sid}}/signature/{ssid}/updatestatus'`, () => {
        expect(objects[3]).toBeUndefined() ;
    }) ;
    it(`Testing api '/v{vers}/session/{sid01_0-2.4}/signature/{ssid}/updatestatus'`, () => {
        expect(objects[4]).toBeDefined() ;
    }) ;
    it(`Testing api '/v{vers}/session/{sid01_0-2.$4}/signature/{ssid}/updatestatus'`, () => {
        expect(objects[5]).toBeUndefined() ;
    }) ;
    it(`Testing api '/v{vers}/session1/{sid}'`, () => {
        expect(objects[6]).toBeUndefined() ;
    }) ;
    it(`Testing api '/v{vers}/session2/{sid}'`, () => {
        expect(objects[7]).toBeDefined() ;
    }) ;
}) ;
