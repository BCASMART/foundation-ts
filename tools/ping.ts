import { $ok, $unsigned } from "../src/commons";
import { TSError } from "../src/tserrors";
import { TSParser, TSParserActionOptions } from "../src/tsparser";
import { Resp, RespType, TSRequest, Verb } from "../src/tsrequest";
import { UINT32_MAX, uint, uint16 } from "../src/types";
import { $ellapsed, $inbrowser, $logterm, $mark, $writeterm } from "../src/utils";
import { EchoStructure, PingStructure, ServiceURL } from "./echoping";


const args = process.argv.slice(2) ;
let servicePort = 3000 as uint16 ;
let hostURL:string = 'http://localhost' ;
let pingLimit:number = UINT32_MAX ;

if (args.length) {
    hostURL = args[0] ;
}
if (args.length > 1) {
    const port:number = $unsigned(args[1], 3000 as uint) ;
    servicePort = Math.max(Math.min(65534, port), 1025) as uint16 ;
}

if (args.length > 2) {
    pingLimit = $unsigned(args[2], 100 as uint) ;
}

const client = new TSRequest(`${hostURL}:${servicePort}`) ;
const pingParser = TSParser.define(PingStructure)! ;
const echoParser = TSParser.define(EchoStructure)! ;

(async () => {
    const inBrowser = $inbrowser() ;
    const process = inBrowser ? undefined : require('process') ;
    const resp = await client.req(ServiceURL) ;
    
    if (resp.status !== Resp.OK) {
        $logterm(`&0&R&w Impossible to connect to echo service on server &P ${client.baseURL} &0`) ;
        process?.exit() ;
        throw new TSError(`Impossible to connect to echo service on server '${client.baseURL}'`) ;
    }
    for (let i = 1 ; i <= pingLimit; i++) {
        const sendOptions:TSParserActionOptions = { errors:[], context:'json' } ;
        const d = new Date() ;
        const isod = d.toISOString() ;
        const body = pingParser.encode({n:i, date:d}, sendOptions) ;
        $writeterm(`&0&c sending ping &C&w ${i} &0&x ... &0`) ;
        const mark = $mark() ;
        const resp = await client.req(ServiceURL, Verb.Post, RespType.Json, body) ;
        if (resp.status !== Resp.OK) {
            $logterm(` &0&R&w Error ${resp.status} &0`) ;
            (resp.response as any).info?.errors?.forEach((e:any) => $logterm(`&0&o  - ${e}&0`)) ;
            process?.exit() ;
            throw new TSError(`Error. Returned status ${resp.status} on ping ${i}`) ;
        }
        const retOptions:TSParserActionOptions = { errors:[], context:'json' } ;
        const ret = echoParser.interpret(resp.response, retOptions) ;
        if (!$ok(ret) || ret?.n !== i || ret?.date?.toISOString() !== isod) {
            $logterm(` &0&R&w Echo error &0`) ;
            if (!$ok(ret)) { 
                $logterm('&onull or undefined returned value&0') ; 
                retOptions.errors?.forEach(e => $logterm(`&0&o  - ${e}&0`))
            }
            else {
                if (ret?.n !== i) { `&0&o returned ping ${ret?.n} <> ${i}&0` ; }
                if (ret?.date?.toISOString() !== isod) { `&0&o returned date ${ret?.date} <> ${d}&0` ; }
                (resp.response as any).info?.errors?.forEach((e:any) => $logterm(`&0&o  - ${e}&0`)) ;
            }
            process?.exit() ;
            throw new TSError(`Echo error on ping '${i}'`) ;
        }
        $logterm(`&0 &G&w OK &0&w in &o${$ellapsed(mark)}&0`) ;
    }

})() ;
