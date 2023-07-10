import { $unsigned } from "../src/commons";
import { TSError } from "../src/tserrors";
import { Resp } from "../src/tsrequest";
import { TSServer, TSServerOptions } from "../src/tsserver";
import { TSEndpointsDefinition, TSServerRequest, TSServerResponse, TSServerStartStatus } from "../src/tsserver_types";
import { TSDictionary, uint, uint16 } from "../src/types";
import { $inbrowser, $logterm } from "../src/utils";

import { EchoStructure, PingStructure, ServiceURL } from "./echoping";

const args = process.argv.slice(2) ;
const port:number = $unsigned(args.first(), 3000 as uint) ;
const servicePort = Math.max(Math.min(65534, port), 1025) as uint16 ;

const serverEndPoints:TSDictionary<TSEndpointsDefinition> = {} ;
serverEndPoints[ServiceURL] = { 
    GET:async (_:TSServerRequest, resp:TSServerResponse):Promise<void> => {
        resp.response.writeHead(Resp.OK) ;
        resp.response.end() ;
    },
    POST:{
        controller:async (req:TSServerRequest, resp:TSServerResponse):Promise<void> => {
            resp.returnObject({ n:req.body.n, date:req.body.date, responseDate:new Date()}) ;
        },
        body:PingStructure,
        response:EchoStructure
    }
}

const serverOptions: TSServerOptions = {
    port:servicePort,
    logInfo:true
} ;

(async () => {
    const inBrowser = $inbrowser() ;
    const process = inBrowser ? undefined : require('process') ;
    const startStatus = await TSServer.start(serverEndPoints, serverOptions) ;
    if (startStatus !== TSServerStartStatus.HTTP) {
        $logterm(`&0&R&w Impossible to launch echo server on port &P ${serverOptions.port} &0`) ;
        $logterm('&0&oExiting...&0') ;
        process?.exit() ;
        throw new TSError(`Impossible to launch echo server on port '${serverOptions.port}'`) ;

    }
    if (!(await TSServer.isRunning())) {
        $logterm(`&0&R&w Echo server was not properly launch on port &P ${serverOptions.port} &0`) ;
        $logterm('&0&oExiting...&0') ;
        process?.exit() ;
        throw new TSError(`Echo server was not properly launch on port '${serverOptions.port}'`) ;
    }
})();
