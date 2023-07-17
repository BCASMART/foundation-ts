import { $URL, $ok } from "../src/commons";
import { $argCheck, $args } from "../src/env";
import { TSError } from "../src/tserrors";
import { TSParser, TSParserOptions } from "../src/tsparser";
import { Resp, RespType, TSRequest, TSResponse, Verb } from "../src/tsrequest";
import { UINT32_MAX } from "../src/types";
import { $ellapsed, $exit, $inbrowser, $logheader, $logterm, $mark, $writeterm } from "../src/utils";
import { EchoStructure, PingStructure } from "./echoping";

if ($inbrowser()) {
    throw new TSError(`Impossible to launch ping tool inside a browser`) ;
}
const errors:string[] = []
const [args,] = $args({
    host:  { 
        struct:'url', 
        short:'h', 
        defaultValue:$URL('http://localhost:8000/ping') 
    },
    limit: { 
        struct:{
            _type:'unsigned',
            _checker:(v:any) => v > 0
        }, 
        short:'l', 
        defaultValue:UINT32_MAX 
    },
    verbose: { struct:'boolean', short:'v', negative:'silent', negativeShort:'s', defaultValue:true }
}, {errors:errors}) ;

$argCheck(-1, errors, 'ping script') ;

const pingLimit:number = args!.limit! ;

const client = new TSRequest(args!.host.origin) ;
const pingParser = TSParser.define(PingStructure)! ;
const echoParser = TSParser.define(EchoStructure)! ;

(async () => {
    let resp:TSResponse ;
    try {
        resp = await client.req(args!.host.pathname) ;
    }
    catch (e) {
        resp = { status:Resp.NotFound, response:null, headers:{} }
    }
    
    if (resp.status !== Resp.OK) {
        $logterm(`&0&R&w Impossible to reach endpoint &J&w GET &C ${args!.host} &0`) ;
        $exit(-101) ;
    }
    $logheader(`Will ping url '${args!.host}'`) ;
    for (let i = 1 ; i <= pingLimit; i++) {
        const sendOptions:TSParserOptions = { errors:[], context:'json' } ;
        const d = new Date() ;
        const isod = d.toISOString() ;
        const body = pingParser.encode({n:i, date:d}, sendOptions) ;
        $writeterm(`&0&c sending ping &C&w ${i} &0&x ... &0`) ;
        const mark = $mark() ;
        const resp = await client.req(args!.host.pathname, Verb.Post, RespType.Json, body) ;
        if (resp.status !== Resp.OK) {
            $logterm(` &0&R&w Error ${resp.status} &0`) ;
            (resp.response as any).info?.errors?.forEach((e:any) => $logterm(`&0&o  - ${e}&0`)) ;
            $exit(-102) ;
        }
        const retOptions:TSParserOptions = { errors:[], context:'json' } ;
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
            $exit(-103) ;
        }
        $logterm(`&0 &G&w OK &0&w in &o${$ellapsed(mark)}&0`) ;
    }
    $exit() ;
})() ;
