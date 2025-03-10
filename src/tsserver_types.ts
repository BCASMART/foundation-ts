import * as http from "http";
import { Resp, Verb } from "./tsrequest";
import { Nullable, TSDataLike, TSDictionary } from "./types";
import { TSLeafNode, TSNode, TSParser, TSParserOptions } from "./tsparser" ;
import { $isdataobject, $ok, $string, $value } from "./commons";
import { $uint8ArrayFromDataLike } from "./data";
import { TSError } from "./tserrors";
import { TSURL } from "./tsurl";


export interface TSServerRequest {
    message:http.IncomingMessage      // Node object
    method:Verb,                      // request method
    url:TSURL,                        // request url
    parameters:TSDictionary,          // a key-value parametric path dictionary
    query:TSDictionary,               // a key-value query dictionary
    body: any,
}

export class TSServerResponse 
{
    constructor(public response:http.ServerResponse, public responseParser:Nullable<TSParser>) {}
    
    public setHeader(name: string, value: number | string | ReadonlyArray<string>): this { this.response.setHeader(name, value) ; return this ; }

    public returnData(data:Nullable<TSDataLike>):void ;
    public returnData(data:Nullable<TSDataLike>, statusOrType:Resp|string):void ;
    public returnData(data:Nullable<TSDataLike>, type:string, status:Resp):void ;
    public returnData():void { _returnData(this, arguments) ; }

    public returnString(s:Nullable<string>):void ;
    public returnString(s:Nullable<string>, statusOrType:Resp|string):void ;
    public returnString(s:Nullable<string>, type:string, status:Resp):void ;
    public returnString():void { _returnString(this, arguments) ; }

    public returnObject(v:any):void ; 
    public returnObject(v:any, statusOrType:Resp|string):void ; 
    public returnObject(v:any, type:string, status:Resp):void ;
    public returnObject():void { _returnObject(this, arguments) ; }

    public returnEmpty(status:Resp = Resp.NoContent):void 
    { this.response.writeHead(status) ; this.response.end() ; }

    public returnError(jsonErrorDescriptionOrStatus:Nullable<object>|Resp):void ;
    public returnError(jsonErrorDescription:Nullable<object>, status:Resp):void ;
    public returnError():void { _returnError(this, arguments) ; }

}

export type TSEndPointController = (req:TSServerRequest, resp:TSServerResponse, context?:TSDictionary) => Promise<void> ;

export interface TSEndPoint {
    controller:TSEndPointController ;
    query?: {[key: string]: TSLeafNode } ;
    body?:TSNode ;
    response?:TSNode ;
    context?:Nullable<TSDictionary> ;
}

/** 
 * TSEndpointsDefinition is used to define what kind of end-point we
 * have on a specific url :
 * 1) a unique controller on a GET method: use a TSEndPointController
 * 2) a unique end point on a  GET method: use a TSEndPoint
 * 3) several methods (GET, POST, ...): use [key in Verb]?: TSEndPoint|TSEndPointController; }
 *    which is a dictionary with the method as a key and a TSEndPointController or TSEndoint
 *    as the endpoint definition
*/
export type TSEndPointsDefinitionDictionary = { [key in Verb]?: TSEndPoint | TSEndPointController; } ;
export type TSEndpointsDefinition = TSEndPointsDefinitionDictionary | TSEndPoint | TSEndPointController ;



// response of OPTIONS preflights requests
export interface TSPreflightResponse {
    allowedOrigin:Nullable<string> ; // if not set or empty, allowed origin is '*'
    allowedMethods:Nullable<string|string[]> ; // allowed methods. if not set or '*', all Verb union
    allowedHeaders:Nullable<string|string[]> ; // if not set '*'
    timeout?:Nullable<number> ;  // max age value in seconds
    // if not set or 0 or >= 86400 (1 day) the response is valid 1 day. if duration > 0 and duration < 10, duration = 10 
}

// Preflight controller functions are activated when reciving a preflight OPTIONS request
// if the response is null or undefined, the preflight request returns an error
export type TSPreflightController = (url:TSURL, headers:http.IncomingHttpHeaders, res:http.ServerResponse) => Promise<Nullable<TSPreflightResponse>> ; 

export enum TSServerStartStatus {
    AlreadyRunning = 0,
    HTTP = 1,
    HTTPS = 2
}
export type TSResourceMimeChecker = (extension:Nullable<string>) => Nullable<string> ;

export interface TSWebSiteDefinition {
    folder:string ;
    mimeChecker?:TSResourceMimeChecker ;
    maxCacheSize?:number,
    maxCachedFileSize?:number,
    maxCachedFiles?:number,
    maxBlacklistedFiles?:number
}

export enum TSServerErrorCodes {
    MissingMimeType = 10000,
    UnknownMethod = 10001,
    ResourceNotFound = 10002,
    MethodNotImplemented = 10003,
    InnaccessibleRoot = 10004,
    BadParameter = 10005,
    BadQueryStructure = 10006,
    BadBodyStructure = 10007,
    MissingBody = 10008,
    BadResponseStructure = 10009,
    ForbiddenDataResponse = 10010,
    BadJSONBody = 10011,
    BadEndPointPath = 10012
}

// ================= private functions =======================
function _returnString(r:TSServerResponse, args:ArrayLike<any>) {
    _statusAndType(r, 'returnString', 'text/plain', args) ;
    r.response.end($value($string(args[0]), '')) ;
}

function _returnData(r:TSServerResponse, args:ArrayLike<any>) {
    _statusAndType(r, 'returnData', 'application/octet-stream', args) ;
    r.response.end(_compatibleData(args[0])) ;
}

function _returnObject(r:TSServerResponse, args:ArrayLike<any>) {
    let v = args[0] ;
    if ($isdataobject(v)) { 
        TSError.throw('TSServerResponse.returnObject() : Impossible to return data as object response', {
            serverError:TSServerErrorCodes.ForbiddenDataResponse
        }) ; 
    }
    if ($ok(r.responseParser)) {
        const opts:TSParserOptions = { errors:[], context:'json' }
        if (!r.responseParser!.validate(v, opts)) { 
            TSError.throw('TSServerResponse.returnObject(): Invalid structured response', { 
                errors: opts.errors,
                serverError:TSServerErrorCodes.BadResponseStructure
            }) ; 
        }
        v = r.responseParser!.rawEncode(v, opts) ;
    } 
    _statusAndType(r, 'returnObject', 'application/json', args) ;
    r.response.end(JSON.stringify(v, undefined, 2)) ;
}

function _returnError(r:TSServerResponse, args:ArrayLike<any>) {
    if (args.length > 2) {
        TSError.throw('TSServerResponse.returnError() : Bad arguments') ;
    }
    let v:any = undefined ;
    let status = Resp.InternalError ;
    switch (args.length) {
        case 0: r.returnEmpty(status) ; return ;
        case 1:
            if (typeof args[0] === 'number') { r.returnEmpty(args[0] as Resp) ; return ;}
            v = args[0] ;
            break ;
        case 2:
            v = args[0] ;
            status = args[1] as Resp ;
            break ;
        default: 
            TSError.throw('TSServerResponse.returnError() : Bad arguments') ;
    }

    r.response.writeHead(status, { 'Content-Type': 'application/json' }) ;
    r.response.end(JSON.stringify(v, undefined, 2)) ;
}

function _statusAndType(r:TSServerResponse, fn:string, defaultType:string, args:ArrayLike<any>) {
    let status = Resp.OK ;
    let type = defaultType ;
    switch (args.length) {
        case 1: break ;
        case 2:
            if (typeof args[0] === 'string') { type = args[1] as string }
            else { status = args[1] as Resp ; }
            break ;
        case 3:
            type = args[1] as string ;
            status = args[2] as Resp ;
            break ;
        default: 
            TSError.throw(`TSServerResponse.${fn}() : Bad arguments`) ;
    }
    r.response.writeHead(status, { 'Content-Type': type }) ;
}

function _compatibleData(data:Nullable<TSDataLike>):Uint8Array
{ return $ok(data) ? $uint8ArrayFromDataLike(data!) : new Uint8Array() ; }

