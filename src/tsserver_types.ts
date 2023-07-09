import * as http from "http";
import { Resp, Verb } from "./tsrequest";
import { Nullable, TSDataLike, TSDictionary } from "./types";
import { TSLeafNode, TSNode, TSParser, TSParserActionOptions } from "./tsparser" ;
import { $isdataobject, $ok, $value } from "./commons";
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
    
    public returnData(data:Nullable<TSDataLike>, type:string = 'application/octet-stream', status:Resp = Resp.OK)
    { this.response.writeHead(status, { 'Content-Type': type }) ; this.response.end(_compatibleData(data)) ; }

    public returnString(s:Nullable<string>, type:string = 'text/plain', status:Resp = Resp.OK) 
    { this.response.writeHead(status, { 'Content-Type': type }) ; this.response.end($value(s, '')) ; }

    public returnObject(v:any, type:string = 'application/json', status:Resp = Resp.OK) 
    {
        if ($isdataobject(v)) { throw new TSHttpError('Impossible to return data as object response', Resp.InternalError, undefined, TSServerErrorCodes.ForbiddenDataResponse) ; }
        if ($ok(this.responseParser)) {
            const opts:TSParserActionOptions = { errors:[], context:'json' }
            if (!this.responseParser!.validate(v, opts)) { throw new TSHttpError('Invalid structured response', Resp.InternalError, { errors: opts.errors}, TSServerErrorCodes.BadResponseStructure) ; }
            v = this.responseParser!.rawEncode(v, opts) ;
        } 
        this.response.writeHead(status, { 'Content-Type': type });
        this.response.end(JSON.stringify(v, undefined, 2)) ; 
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

function _compatibleData(data:Nullable<TSDataLike>):Uint8Array|ArrayBuffer {
    if (!$ok(data)) { return Buffer.from('') ; }
    if (data instanceof Uint8Array || data instanceof ArrayBuffer) { return data as Uint8Array }
    return $bufferFromDataLike(data!) ;
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
