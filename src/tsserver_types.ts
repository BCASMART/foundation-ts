import * as http from "http";
import { Resp, Verb } from "./tsrequest";
import { Nullable, TSDataLike, TSDictionary } from "./types";
import { TSLeafNode, TSNode, TSParser, TSParserOptions } from "./tsparser" ;
import { $isdataobject, $ok, $string, $value } from "./commons";
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

    public returnEmpty(status:Resp = Resp.OK):void { this.response.writeHead(status) ; this.response.end() ; }

    public returnError(jsonErrorDescriptionOrStatus:Nullable<object>|Resp):void ;
    public returnError(jsonErrorDescription:Nullable<object>, status:Resp):void ;
    public returnError():void { _returnError(this, arguments) ; }

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
function _returnString(r:TSServerResponse, args:ArrayLike<any>) {
    _statusAndType(r, 'returnString', 'text/plain', args) ;
    r.response.end($value($string(args[0]), '')) ;
}

function _returnData(r:TSServerResponse, args:ArrayLike<any>) {
    _statusAndType(r, 'returnData', 'application/octet-stream', args) ;
    r.response.end(_compatibleData(args[0])) ;
}

function _returnObject(r:TSServerResponse, args:ArrayLike<any>) {
    _statusAndType(r, 'returnObject', 'application/json', args) ;
    let v = args[0] ;
    if ($isdataobject(v)) { throw new TSHttpError('TSServerResponse.returnObject() : Impossible to return data as object response', Resp.InternalError, undefined, TSServerErrorCodes.ForbiddenDataResponse) ; }
    if ($ok(r.responseParser)) {
        const opts:TSParserOptions = { errors:[], context:'json' }
        if (!r.responseParser!.validate(v, opts)) { throw new TSHttpError('TSServerResponse.returnObject(): Invalid structured response', Resp.InternalError, { errors: opts.errors}, TSServerErrorCodes.BadResponseStructure) ; }
        v = r.responseParser!.rawEncode(v, opts) ;
    } 
    r.response.end(JSON.stringify(v, undefined, 2)) ;
}

function _returnError(r:TSServerResponse, args:ArrayLike<any>) {
    if (args.length > 2) {
        throw new TSHttpError('TSServerResponse.returnError() : Bad arguments', Resp.InternalError) ;
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
        default: throw new TSHttpError('TSServerResponse.returnError() : Bad arguments', Resp.InternalError) ;
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
        default: throw new TSHttpError(`TSServerResponse.${fn}() : Bad arguments`, Resp.InternalError) ;
    }
    r.response.writeHead(status, { 'Content-Type': type }) ;
}

function _compatibleData(data:Nullable<TSDataLike>):Uint8Array|ArrayBuffer {
    if (!$ok(data)) { return Buffer.from('') ; }
    if (data instanceof Uint8Array || data instanceof ArrayBuffer) { return data as Uint8Array }
    return $bufferFromDataLike(data!) ;
}
