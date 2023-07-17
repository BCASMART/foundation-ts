import * as http from "http";
import { Resp, Verb } from "./tsrequest";
import { Nullable, TSDataLike, TSDictionary } from "./types";
import { TSLeafNode, TSNode, TSParser, TSParserOptions } from "./tsparser" ;
import { $isdataobject, $isobject, $isstring, $ok, $value } from "./commons";
import { $bufferFromDataLike } from "./data";
import { TSHttpError } from "./tserrors";

export interface TSServerRequest {
    message:http.IncomingMessage      // Node object
    method:Verb,                      // request method
    url:URL,                          // request URL
    parameters:TSDictionary,          // a key-value parametric path dictionary
    query:TSDictionary,               // a key-value query dictionary
    body: any,
}

export class TSServerResponse 
{
    constructor(public response:http.ServerResponse, public responseParser:Nullable<TSParser>) {}
    
    public returnData(data:Nullable<TSDataLike>, type:string = 'application/octet-stream', status:Resp = Resp.OK):void
    { this.response.writeHead(status, { 'Content-Type': type }) ; this.response.end(_compatibleData(data)) ; }

    public returnString(s:Nullable<string>, type:string = 'text/plain', status:Resp = Resp.OK):void 
    { this.response.writeHead(status, { 'Content-Type': type }) ; this.response.end($value(s, '')) ; }

    public returnObject(v:any):void ; 
    public returnObject(v:any, type:string):void ; 
    public returnObject(v:any, status:Resp):void ; 
    public returnObject(v:any, type:string, status:Resp):void ;
    public returnObject():void {
        switch (arguments.length) {
            case 0: this.returnEmpty() ; break ;
            case 1: _responseReturnObject(this, true, arguments[0], 'application/json', Resp.OK) ; break ;
            case 2:
                const ty = $isstring(arguments[1]) 
                _responseReturnObject(this, true, arguments[0], ty?arguments[1]:'application/json', ty?Resp.OK:arguments[1]) ;
                break ;
            case 3: _responseReturnObject(this, true, arguments[0], arguments[1], arguments[2]) ; break ;
            default: throw new TSHttpError('TSServerResponse.returnObject() : Bad arguments', Resp.InternalError) ;
        }
    }

    public returnEmpty(status:Resp = Resp.OK):void 
    { this.response.writeHead(status) ; this.response.end() ; }

    public returnError(status:Resp):void ;
    public returnError(jsonErrorDescription:Nullable<object>):void ;
    public returnError(jsonErrorDescription:Nullable<object>, status:Resp):void ;
    public returnError():void {
        switch (arguments.length) {
            case 0: this.returnEmpty(Resp.InternalError) ; break ;
            case 1:
                const obj = !$ok(arguments[0]) || $isobject(arguments[0]) 
                _responseReturnObject(this, true, obj?arguments[0]:undefined, 'application/json', obj?Resp.InternalError:arguments[0]) ;
                break ;
            case 2: _responseReturnObject(this, true, arguments[0], 'application/json', arguments[1]) ; break ;
            default: throw new TSHttpError('TSServerResponse.returnError() : Bad arguments', Resp.InternalError) ;
        }
    }
}


export type TSEndPointController = (req:TSServerRequest, resp:TSServerResponse) => Promise<void> ;

export interface TSEndPoint {
    controller:TSEndPointController ;
    query?: {[key: string]: TSLeafNode } ;
    body?:TSNode ;
    response?:TSNode ;
}

/** 
 * TSEndpointsDefinition is used to define what kind of end-point we
 * have on a specific URL :
 * 1) a unique controller on a GET method: use a TSEndPointController
 * 2) a unique end point on a  GET method: use a TSEndPoint
 * 3) several methods (GET, POST, ...): use [key in Verb]?: TSEndPoint|TSEndPointController; }
 *    which is a dictionary with the method as a key and a TSEndPointController or TSEndoint
 *    as the endpoint definition
*/
export type TSEndPointsDefinitionDictionary = { [key in Verb]?: TSEndPoint|TSEndPointController; } ;
export type TSEndpointsDefinition = TSEndPointsDefinitionDictionary | TSEndPoint | TSEndPointController ;

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
    BadJSONBody = 10011
}

// ================= private functions =======================

function _compatibleData(data:Nullable<TSDataLike>):Uint8Array|ArrayBuffer {
    if (!$ok(data)) { return Buffer.from('') ; }
    if (data instanceof Uint8Array || data instanceof ArrayBuffer) { return data as Uint8Array }
    return $bufferFromDataLike(data!) ;
}

function _responseReturnObject(r:TSServerResponse, userResponseParser:boolean, v:any, type:string, status:Resp) {
    if ($isdataobject(v)) { throw new TSHttpError('TSServerResponse() : Impossible to return data as object response', Resp.InternalError, undefined, TSServerErrorCodes.ForbiddenDataResponse) ; }
    if (userResponseParser && $ok(r.responseParser)) {
        const opts:TSParserOptions = { errors:[], context:'json' }
        if (!r.responseParser!.validate(v, opts)) { throw new TSHttpError('Invalid structured response', Resp.InternalError, { errors: opts.errors}, TSServerErrorCodes.BadResponseStructure) ; }
        v = r.responseParser!.rawEncode(v, opts) ;
    } 
    if ($ok(v)) {
        r.response.writeHead(status, { 'Content-Type': type });
        r.response.end(JSON.stringify(v, undefined, 2)) ;
    }
    else { r.returnEmpty(status) ; } 
}
