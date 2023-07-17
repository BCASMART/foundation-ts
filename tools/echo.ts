import { $argCheck, $args } from "../src/env";
import { TSError } from "../src/tserrors";
import { Resp } from "../src/tsrequest";
import { TSServer, TSServerOptions } from "../src/tsserver";
import { TSEndpointsDefinition, TSServerRequest, TSServerResponse, TSServerStartStatus } from "../src/tsserver_types";
import { TSDictionary, UINT16_MAX } from "../src/types";
import { $exit, $inbrowser, $logheader, $logterm } from "../src/utils";

import { EchoStructure, PingStructure } from "./echoping";

if ($inbrowser()) {
    throw new TSError(`Impossible to launch echo server inside a browser`) ;
}
const errors:string[] = []
const [args,] = $args({
    port:{ 
        struct:{
            _type:'number',
            _checker:(v:any) => v > 1024 && v < UINT16_MAX
        }, 
        short:'p', 
        defaultValue:8000 
    },
    endpoint:{ 
        struct:{
            _type:'path',
        }, 
        short:'e', 
        defaultValue:'/ping'
    },
    verbose: { struct:'boolean', short:'v', negative:'silent', negativeShort:'s', defaultValue:true }
}, {errors:errors}) ;

$argCheck(-1, errors, 'echo script') ;

const serverEndPoints:TSDictionary<TSEndpointsDefinition> = {} ;
let ep = args!.endpoint ; if (!ep.startsWith('/')) { ep = '/'+ep ; }
serverEndPoints[ep] = { 
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
    port:args!.port,
    logInfo:!!args?.verbose
} ;

(async () => {
    const startStatus = await TSServer.start(serverEndPoints, serverOptions) ;
    if (startStatus !== TSServerStartStatus.HTTP) {
        $logterm(`&0&R&w Impossible to launch echo server on port &P ${serverOptions.port} &0`) ;
        $logterm('&0&oExiting...&0') ;
        $exit(-100)
    }
    if (!(await TSServer.isRunning())) {
        $logterm(`&0&R&w Echo server was not properly launch on port &P ${serverOptions.port} &0`) ;
        $logterm('&0&oExiting...&0') ;
        $exit(-101)
    }
    $logheader(`Echoing ${ep} on port ${args?.port}`) ;

})();
