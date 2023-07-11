import { $value } from "../src/commons";
import { $args } from "../src/env";
import { TSError } from "../src/tserrors";
import { Resp } from "../src/tsrequest";
import { TSServer, TSServerOptions } from "../src/tsserver";
import { TSEndpointsDefinition, TSServerRequest, TSServerResponse, TSServerStartStatus } from "../src/tsserver_types";
import { TSDictionary, uint16 } from "../src/types";
import { $exit, $inbrowser, $logterm } from "../src/utils";

import { EchoStructure, PingStructure, ServiceURL } from "./echoping";

if ($inbrowser()) {
    throw new TSError(`Impossible to launch echo server inside a browser`) ;
}
const [decrypted,] = $args({
    port:  { struct:'number', short:'p', defaultValue:8000 },
    verbose: { struct:'boolean', short:'v', negative:'silent', negativeShort:'s', defaultValue:true }
}) ;
const args = $value(decrypted, [])
const servicePort = Math.max(Math.min(65534, $value(args['limit'], 8000))) as uint16 ;
const verbose = $value(args['verbose'], true) ;

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
    logInfo:verbose
} ;

(async () => {
    const startStatus = await TSServer.start(serverEndPoints, serverOptions) ;
    if (startStatus !== TSServerStartStatus.HTTP) {
        $logterm(`&0&R&w Impossible to launch echo server on port &P ${serverOptions.port} &0`) ;
        $logterm('&0&oExiting...&0') ;
        $exit(-1)

    }
    if (!(await TSServer.isRunning())) {
        $logterm(`&0&R&w Echo server was not properly launch on port &P ${serverOptions.port} &0`) ;
        $logterm('&0&oExiting...&0') ;
        $exit(-2)
    }
})();
