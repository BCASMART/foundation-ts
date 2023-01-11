import { $map } from "./array";
import { $array, $count, $email, $int, $intornull, $isarray, $isbool, $isdate, $isemail, $isfunction, $isint, $isiterable, $ismethod, $isnumber, $isobject, $isodate, $isstring, $isunsigned, $isurl, $isuuid, $iswhitespace, $json, $jsonobj, $keys, $length, $lengthin, $objectcount, $ok, $string, $strings, $toint, $tounsigned, $unsigned, $unsignedornull, $url, $UUID, $value, $valueornull, $valueorundefine } from "./commons";
import { $bytescompare, $bytesequal, $compare, $datecompare, $equal, $numcompare, $setequal, $unorderedEqual } from "./compare";
import { $bufferFromArrayBuffer, $bufferFromBytes, $uint8ArrayFromBytes, $uint8ArrayFromDataLike, $arrayBufferFromBytes, $decodeBase64, $encodeBase64 } from "./data"
import { $timeBetweenDates } from "./date"
import { $div, $fpad, $fpad2, $fpad3, $fpad4, $icast, $meters, $octets, $round } from "./number";
import { $ascii, $capitalize, $firstcap, $HTML, $left, $lines, $ltrim, $normspaces, $right, $rtrim, $trim } from "./strings";
import { $dayisvalid, $dayOfWeekFromTimestamp, $dayOfYear, $hourFromTimestamp, $insettimestamp, $isleap, $minuteFromTimestamp, $secondFromTimestamp, $timeisvalid, $timestamp, $timestampWithoutTime, $weekOfYear, TSDate } from "./tsdate";
import { TSDefaults, $tmp, $locales, $country, $language, $currency, $default } from "./tsdefaults";
import { TSError } from "./tserrors";
import { TSFusionProcedure, TSFusionTemplate } from "./tsfusion";
import { $iscollection } from "./tsobject";
import { Bytes, Nullable, TSDictionary } from "./types";
import { $inbrowser, $insp, $inspect, $stack, $term, $termclean } from "./utils";

export enum TSFusionContextType {
    Local = 'local',           // path aplying to local context
    Global = 'global',         // path applying to global context
    Root = 'root',             // path applying to root context
    System = 'system',         // path applying to system calculated data
    Procedure = 'procedure',   // path is a procedure
    User = 'user'              // path to global context with a user defined variable
} ;

export enum TSFusionNodeType {
    Root = 'root',
    Data = 'data',
    Variable = 'variable',
    Test = 'test-variable',
    NegativeTest = 'nagative-test-variable',
    Enumeration = 'enumeration-variable'
}


export interface TSFusionEnumeration {
    fusionEnumeration():any[] ;
}
export interface TSFusionOptions {
    globalContext?:Nullable<TSDictionary> ;
    procedures?:Nullable<TSDictionary<TSFusionProcedure>> ;
    globalFunctions?:Nullable<TSDictionary<Function>> ;
    errors?:Nullable<string[]> ;
    addStandardGlobalFunctions?:Nullable<boolean> ;
}
export class TSFusionTreeNode {
    type:TSFusionNodeType ;
    value?:string|Bytes  ;
    nodes?:TSFusionTreeNode[] ;
    parameters?:any[] ;
    parent?:TSFusionTreeNode ;
    contextType:TSFusionContextType = TSFusionContextType.Local ;
    private _localContext:TSDictionary = {} ;
    private _pathCache:string[]|undefined ;

    public static root() { return new TSFusionTreeNode(TSFusionNodeType.Root) ; }

    private constructor(type:TSFusionNodeType, value?:string|Bytes, parent?:TSFusionTreeNode) {
        this.type = type ;
        if ($ok(value)) { this.value = value ; }
        if ($ok(parent)) { this.parent = parent}
    }
    
    public get label():string {
        switch (this.type) {
            case TSFusionNodeType.Root: return 'Root' ;
            case TSFusionNodeType.Data: return 'Data' ;
            default: return this.value! as string ;
        }
    }
    
    public get isContainerVariable() {
        return this.type === TSFusionNodeType.Test || this.type === TSFusionNodeType.NegativeTest || this.type === TSFusionNodeType.Enumeration ;
    }

    public pushData(data:Bytes) {
        if (this.type === TSFusionNodeType.Data) { throw new TSError('Impossible to add subnode to a text FusionTreeNode', { text:this.value} ) ; }
        if (data.length) {
            if (!$ok(this.nodes)) { this.nodes = [] ; }
            this.nodes!.push(new TSFusionTreeNode(TSFusionNodeType.Data, data, this)) ;    
        }
    }

    public pushVariable(name:string, type:TSFusionNodeType, contextType:TSFusionContextType, parameters?:any[]):TSFusionTreeNode {
        if (this.type === TSFusionNodeType.Data) { throw new TSError('Impossible to add subnode to a text FusionTreeNode', { text:this.value} ) ; }
        if (!$length(name)) { throw new TSError (`Impossible to add an unamed fusion variable to ${this.label} variable.`)}
        if (type === TSFusionNodeType.Root || type === TSFusionNodeType.Data) {
            throw new TSError(`Impossible to add fusion variable '${name}' as a ${type} variable`, { name:name, type:type } ) ;
        }
        if (!$ok(this.nodes)) { this.nodes = [] ; }
        let node = new TSFusionTreeNode(type, name, this) ;
        if ($ok(contextType)) { node.contextType = contextType! ;}
        if ($count(parameters)) { node.parameters = parameters ; }
        node._pathCache = name.split('.') ;
        this.nodes!.push(node) ;
        return node ;
    }

    public fusion(template:TSFusionTemplate, data:any, options:TSFusionOptions = {}):boolean {

        if (this.type !== TSFusionNodeType.Root) { 
            throw new TSError('Impossible invoque fusion() method on non-root FusionNodeType', { label:this.label, type:this.type } ) ; 
        }
        try {
            
            this._cleanLocalContexts() ;
            const globalContext = $ok(options.globalContext) ? options.globalContext! : {} ;
            
            function _addGlobalFunctions(functions:Nullable<TSDictionary<Function>>) {
                if ($ok(functions)) {
                    for (let [name, fn] of Object.entries(functions!)) {
                        if (!$ok(globalContext[name])) { globalContext[name] = fn ; }
                    }    
                }
            }
            
            _addGlobalFunctions(options.globalFunctions) ;

            if (options.addStandardGlobalFunctions) {
                [
                    $value, $valueornull, $valueorundefine, 
                    $isstring, $iswhitespace, $isnumber, $isint, $isunsigned, $isbool, $isobject, $isarray, $isiterable, $isdate, $isemail, $isurl, $isuuid, $isfunction, 
                    $int, $intornull, $email, $url, $UUID, $isodate, $unsignedornull, $unsigned, $toint, $tounsigned, $string, $array, $strings,
                    $count, $length, $objectcount, $lengthin,
                    $jsonobj, $json, $keys,
                    $numcompare, $datecompare, $bytescompare, $compare, $bytesequal, $equal, $setequal, $unorderedEqual,
                    $bufferFromArrayBuffer, $bufferFromBytes, $uint8ArrayFromBytes, $uint8ArrayFromDataLike, $arrayBufferFromBytes, $decodeBase64, $encodeBase64,
                    $timeBetweenDates,
                    $div, $icast, $round, $fpad, $fpad2, $fpad3, $fpad4, $octets, $meters,
                    $ascii, $trim, $rtrim, $ltrim, $left, $right, $lines, $firstcap, $capitalize, $normspaces, $HTML,
                    $isleap, $dayisvalid, $timeisvalid, $timestamp, $secondFromTimestamp, $minuteFromTimestamp, $hourFromTimestamp, $timestampWithoutTime, $dayOfYear, $dayOfWeekFromTimestamp, $weekOfYear, $insettimestamp,
                    $tmp, $locales, $country, $language, $currency, $default,
                    $inspect, $insp, $term, $termclean, $stack
                ].forEach( fn => {
                    const name = fn.name.slice(1) ; // we remove the front $ sign
                    if (!$ok(globalContext[name])) { globalContext[name] = fn ; }
                }) ;

                _addGlobalFunctions({
                    'abs':  Math.abs,
                    'sign': Math.sign,
                    'max':  Math.max,
                    'min':  Math.min,
                    'cos':  Math.cos,
                    'sin':  Math.sin,
                    'tan':  Math.tan,
                    'log':  Math.log,
                    'exp':  Math.exp,
                    'sqrt': Math.sqrt
                }) ;
            }

            const defaults =  TSDefaults.defaults() ;
            this._fusion(template, globalContext, [data], [this._localContext], {
                zulu:TSDate.zulu(),
                date: new TSDate(),
                language: defaults.language(),
                languages: defaults.managedLanguages(),
                currency: defaults.currency(),
                locales: defaults.locales(),
                index: 0,
                position: 1,
                remaining:0,
                count: 1,
                browser: $inbrowser(),
                log: (data:any):string => { options.errors?.push(`USERLOG:${data}`) ; return '' ; }
            },
            $value(options.procedures, {}),
            $ok(options.errors) ? options.errors! : undefined
            ) ;
            return true ;
        }
        catch (e) {
            if ($ok(options.errors)) {
                options.errors!.push('Fusion did encounter error:') ;
                $lines($inspect(e)).forEach(l => options.errors?.push(l)) ;
                options.errors!.push('STACK:') ;
                $lines((e as Error).stack).forEach(l => options.errors?.push(l)) ;
            }
        }
        return false ;
    }
    
    private _cleanLocalContexts() {
        this._localContext = {} ;
        this.nodes?.forEach(n => n._cleanLocalContexts())
    }

    private _fusion(template:TSFusionTemplate, globalContext:TSDictionary, stack:any[], localStack:TSDictionary[], systemContext:TSDictionary, procedures:TSDictionary<TSFusionProcedure>, errors?:string[]) {
        const debug = $ok(errors) ;
        const count = $count(this.nodes) ;

        for (let i = 0 ; i < count ; i++) {
            const node = this.nodes![i] ;
            if (node.type === TSFusionNodeType.Data) {
                template.pushFusionData(node.value! as Bytes)
            }
            else {
                let v:any = undefined ;
                if (node.contextType === TSFusionContextType.Procedure) {
                    if (node._pathCache?.length === 1 && $length(node.value as string) > 0) {
                        const proc = procedures[node.value! as string] ;
                        if ($isfunction(proc)) { 
                            try { 
                                v = proc(stack.last(), stack.first(), this._localContext, globalContext, {...systemContext}) ;
                            }
                            catch (e) {
                                if (debug) { errors!.push(`!ERROR!: Procedure ${node.value}() execution did fail`) ; }
                                v = undefined ;
                            }
                        }
                        else if (debug) { errors!.push(`!ERROR!: Procedure ${node.value}() does not exist`) ; }
                    }
                    else if (debug) { errors!.push(`!ERROR!: Malformed procedure name ${node.value}() (undefined, empty or with '.' character in it)`) ; }
                }
                else {
                    let target:any[] = [];
                    let dataType = 'unknown target' ;
                    const hasRedefinedLocalItems = $objectcount(localStack.last()) > 0 ;

                    switch (node.contextType) {
                        case TSFusionContextType.Root: 
                            target = [stack.first()] ;
                            dataType = 'root'
                            break ;
                        case TSFusionContextType.Local:
                            target = hasRedefinedLocalItems ? localStack : stack ;
                            dataType = 'local context' ;
                            break ;
                        case TSFusionContextType.Global: 
                            target = [globalContext] ; 
                            dataType = 'global context'
                            break ;
                        case TSFusionContextType.User: 
                            target = [globalContext] ; 
                            dataType = 'user global context'
                            break ;
                        case TSFusionContextType.System: 
                            target = [systemContext] ;
                            dataType = 'system context'
                            break ;
                    }
                    // local fusion context is always predominant to local data if it exists
                    const parameters = $count(node.parameters) ? $map(node.parameters, p => p === template ? stack.last() : p) : undefined ;
                    v = _valueForKeyPath(target, node._pathCache, dataType, false, parameters, errors) ;
                    if (node.contextType === TSFusionContextType.Local && !$ok(v) && hasRedefinedLocalItems) {
                        v = _valueForKeyPath(stack, node._pathCache, 'target object', true, parameters, errors) ;
                    }
                }
                switch (node.type) {
                    case TSFusionNodeType.Variable:
                        if ($ok(v)) { template.pushFusionValue(v) ; }
                        else { errors?.push(`WARNING: value returned for '${node.value!}' was undefined or null and should have result in data to merge in fusion.`) ; }
                        break ;
                    case TSFusionNodeType.Test:
                        if (v) { node._fusion(template, globalContext, stack, localStack, systemContext, procedures, errors) ; }
                        break ;
                    case TSFusionNodeType.NegativeTest:
                        if (!v) { node._fusion(template, globalContext, stack, localStack, systemContext, procedures, errors) ; }
                        break ;
                    case TSFusionNodeType.Enumeration:
                        if ($ok(v)) {
                            const a = $iscollection(v) ? v.getItems() : ($ismethod(v, 'fusionEnumeration') ? v.fusionEnumeration() : [v]) ;
                            const acount = $length(a) ;
                            for (let j = 0 ; j < acount ; j++) {
                                node._fusion(template, globalContext, [...stack, a[j]], [...localStack, a[j]._localContext], {...systemContext, count:acount, index:j, position:j+1, remaining:count-j-1}, procedures, errors) ;
                            }
                        }
                        break ;
                    default:break ;
                }
            }
        } 
    }
}
function _valueForKeyPath(stack:any[], keyPath:string[] = [], dataType:string, unknownAsError:boolean, parameters:any[]|undefined, errors?:string[]):any 
{
    const scount = stack.length ; 
    const kcount = keyPath.length ;
    if (!kcount) {
        errors?.push('ERROR: empty key path') ;
        return undefined ; 
    }    

    let i = 0 ;
    for ( ; i < kcount && keyPath[i].length === 0; i++) {}
    if (i >= scount) { 
        errors?.push(`!ERROR!: key path '${keyPath.join('.')}' did underflow the stack.`) ;
        return undefined ; 
    }
    let v = stack[scount-i-1]
    const pcount = $count(parameters) ;

    for ( ; i < kcount && $ok(v) ; i++) {
        const m = keyPath[i] ;
        const shouldHandleParameters = pcount > 0 && i + 1 === kcount ;

        if (!m.length) { 
            errors?.push(`!ERROR!: key path '${keyPath.join('.')}' contains internal '..'.`) ;
            return undefined ; 
        }
        if (!shouldHandleParameters && m === 'self') { continue ; } // special keyword for referencing itself
        if ($isobject(v) && !(m in v)) { 
            errors?.push(`${unknownAsError?'!ERROR!':'WARNING'}: unknown method or preperty '${m}' in ${dataType}.`) ;
            return undefined ; 
        }
        let res = v[m] ;
        if ($isfunction(res)) {
            if (res.length > 0 && !shouldHandleParameters) { 
                errors?.push(`!ERROR!: method ${m}() is not an sinple accessor in ${dataType}.`) ;
                return undefined ; 
            }
            try {
                v = shouldHandleParameters ? res.apply(v, parameters) : res.call(v) ;
            }
            catch (e) {
                errors?.push(`!ERROR!: method ${m}() execution did fail on ${dataType}`) ;
                return undefined ;
            }
        }
        else if (!shouldHandleParameters) { v = res ; }
        else { 
            errors?.push(`${unknownAsError?'!ERROR!':'WARNING'}: unknown method '${m}()' in ${dataType}.`) ;
            return undefined ; 
        }    
        if (typeof v === 'number' && isNaN(v)) { 
            errors?.push(`WARNING: key path '${keyPath.join('.')}' would return NaN which was transformed to null.`) ;
            return null ; 
        }
    }
    return v ;
}

declare global {
    export interface Set<T> extends TSFusionEnumeration {}
    export interface Map<K,V> extends TSFusionEnumeration {}
}

Set.prototype.fusionEnumeration = function fusionEnumeration():any[] { return Array.from(this) ; }
Map.prototype.fusionEnumeration = function fusionEnumeration():any[] {
    const ret:any[] = [] ;
    this.forEach((value:any, key:any) => ret.push({key:key, value:value})) ;
    return ret ;
}
