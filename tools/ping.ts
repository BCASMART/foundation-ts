import { $ok, $value } from "../src/commons";
import { $args } from "../src/env";
import { TSError } from "../src/tserrors";
import { TSParser, TSParserActionOptions } from "../src/tsparser";
import { Resp, RespType, TSRequest, Verb } from "../src/tsrequest";
import { UINT32_MAX } from "../src/types";
import { $ellapsed, $exit, $inbrowser, $logheader, $logterm, $mark, $writeterm } from "../src/utils";
import { EchoStructure, PingStructure, ServiceURL } from "./echoping";

if ($inbrowser()) {
    throw new TSError(`Impossible to launch ping tool inside a browser`) ;
}
const [decrypted,] = $args({
    host:  { struct:'string', short:'h' },
    limit: { struct:'number', short:'l' }
}) ;
const args = $value(decrypted, [])
const hostURL = $value(args['string'], 'http://localhost:8000')
const pingLimit:number = $value(args['limit'], UINT32_MAX) ;

const firstURL = new URL(ServiceURL, hostURL) ;
const commonFirstBase = hostURL.slice(firstURL.origin.length) ;
const url = new URL(`${commonFirstBase}${ServiceURL}`,`${firstURL.origin}`) ;

const client = new TSRequest(url.origin) ;
$logheader(`Will ping server '${client.baseURL}'`) ;
const pingParser = TSParser.define(PingStructure)! ;
const echoParser = TSParser.define(EchoStructure)! ;

(async () => {
    const resp = await client.req(url.pathname) ;
    
    if (resp.status !== Resp.OK) {
        $logterm(`&0&R&w Impossible to connect to echo service on server &P ${client.baseURL} &0`) ;
        $exit(-1) ;
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
            $exit(-2) ;
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
            $exit(-3) ;
        }
        $logterm(`&0 &G&w OK &0&w in &o${$ellapsed(mark)}&0`) ;
    }

})() ;
