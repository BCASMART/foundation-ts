import { $array, $count, $email, $int, $intornull, $isarray, $isbool, $isdate, $isemail, $isfunction, $isint, $isiterable, $ismethod, $isnumber, $isobject, $isodate, $issafekey, $isstring, $isunsigned, $isurl, $isuuid, $iswhitespace, $json, $jsonobj, $keys, $length, $lengthin, $objectcount, $ok, $string, $strings, $toint, $tounsigned, $unsigned, $unsignedornull, $url, $UUID, $value, $valueornull, $valueorundefine } from "./commons";
import { $bytescompare, $bytesequal, $compare, $datecompare, $equal, $numcompare, $setequal, $unorderedEqual } from "./compare";
import { $bufferFromArrayBuffer, $bufferFromBytes, $uint8ArrayFromBytes, $uint8ArrayFromDataLike, $arrayBufferFromBytes, $decodeBase64, $encodeBase64 } from "./data"
import { $timeBetweenDates } from "./date"
import { $bytes, $div, $fpad, $fpad2, $fpad3, $fpad4, $icast, $meters, $round } from "./number";
import { $ascii, $capitalize, $firstcap, $HTML, $left, $lines, $ltrim, $normspaces, $right, $rtrim, $trim } from "./strings";
import { $dayisvalid, $dayOfWeekFromTimestamp, $dayOfYear, $hourFromTimestamp, $insettimestamp, $isleap, $minuteFromTimestamp, $secondFromTimestamp, $timeisvalid, $timestamp, $timestampWithoutTime, $weekOfYear, TSDate } from "./tsdate";
import { TSDefaults, $tmp, $locales, $country, $language, $currency, $default } from "./tsdefaults";
import { TSError } from "./tserrors";
import { TSFusionProcedure, TSFusionTemplate } from "./tsfusion";
import { $iscollection } from "./tsobject";
import { Bytes, Nullable, TSDictionary } from "./types";
import { $inbrowser, $insp, $inspect, $stack, $term, $termclean } from "./utils";
import { $declareMethods } from "./object";

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
    globalContext?:TSDictionary | null ;
    procedures?:TSDictionary<TSFusionProcedure> | null ;
    globalFunctions?:TSDictionary<Function> | null ;
    errors?:string[] | null ;
    addStandardGlobalFunctions?:boolean | null ;
}

const customInspectSymbol = Symbol.for('nodejs.util.inspect.custom') ;

export class TSFusionTreeNode {
    type:TSFusionNodeType ;
    value?:string|Bytes  ;
    nodes?:TSFusionTreeNode[] ;
    parameters?:any[] ;
    parent?:TSFusionTreeNode ;
    contextType:TSFusionContextType = TSFusionContextType.Local ;
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
    
    public toString():string { return `[FusionNode ${this.label}]` ; }
    public leafInspect(): string  { return this.toString() ; }

    // @ts-ignore
    [customInspectSymbol]() { return this.leafInspect() ; }

    public get isContainerVariable() {
        return this.type === TSFusionNodeType.Test || this.type === TSFusionNodeType.NegativeTest || this.type === TSFusionNodeType.Enumeration ;
    }

    public pushData(data:Bytes) {
        if (this.type === TSFusionNodeType.Data) { TSError.throw('Impossible to add subnode to a text FusionTreeNode', { text:this.value} ) ; }
        if (data.length) {
            if (!$ok(this.nodes)) { this.nodes = [] ; }
            this.nodes!.push(new TSFusionTreeNode(TSFusionNodeType.Data, data, this)) ;    
        }
    }

    public pushVariable(name:string, type:TSFusionNodeType, contextType:TSFusionContextType, parameters?:any[]):TSFusionTreeNode {
        if (this.type === TSFusionNodeType.Data) { TSError.throw('Impossible to add subnode to a text FusionTreeNode', { text:this.value} ) ; }
        if (!$length(name)) { TSError.throw(`Impossible to add an unamed fusion variable to ${this.label} variable.`)}
        if (type === TSFusionNodeType.Root || type === TSFusionNodeType.Data) {
            TSError.throw(`Impossible to add fusion variable '${name}' as a ${type} variable`, { name:name, type:type } ) ;
        }
        if (!$ok(this.nodes)) { this.nodes = [] ; }
        let node = new TSFusionTreeNode(type, name, this) ;
        if ($ok(contextType)) { node.contextType = contextType ;}
        if ($count(parameters)) { node.parameters = parameters ; }
        node._pathCache = name.split('.') ;
        this.nodes!.push(node) ;
        return node ;
    }

    public fusion(template:TSFusionTemplate, data:any, options:TSFusionOptions = {}):boolean {

        if (this.type !== TSFusionNodeType.Root) { 
            TSError.throw('Impossible invoque fusion() method on non-root FusionNodeType', { label:this.label, type:this.type } ) ; 
        }
        try {
            
            const callerContext = $ok(options.globalContext) ? options.globalContext! : {} ;
            // the global functions are no longer added to the caller's global context (another template
            // using the same context did get the functions of the first one): they are kept apart, and
            // the fusion sees both through a proxy. A value of the caller's context comes first, and the
            // values written by the procedures are still written in the caller's context
            const functions:TSDictionary<Function> = {} ;
            const globalContext = _globalContextView(callerContext, functions) ;

            function _addGlobalFunctions(fns:Nullable<TSDictionary<Function>>) {
                if ($ok(fns)) {
                    for (let [name, fn] of Object.entries(fns)) {
                        if (!$ok(globalContext[name])) { functions[name] = fn ; }
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
                    $div, $icast, $round, $fpad, $fpad2, $fpad3, $fpad4, $bytes, $meters,
                    $ascii, $trim, $rtrim, $ltrim, $left, $right, $lines, $firstcap, $capitalize, $normspaces, $HTML,
                    $isleap, $dayisvalid, $timeisvalid, $timestamp, $secondFromTimestamp, $minuteFromTimestamp, $hourFromTimestamp, $timestampWithoutTime, $dayOfYear, $dayOfWeekFromTimestamp, $weekOfYear, $insettimestamp,
                    $tmp, $locales, $country, $language, $currency, $default,
                    $inspect, $insp, $term, $termclean, $stack
                ].forEach( fn => {
                    const name = fn.name.slice(1) ; // we remove the front $ sign
                    if (!$ok(globalContext[name])) { functions[name] = fn ; }
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
            const run:FusionRun = {
                template:template,
                globalContext:globalContext,
                procedures:$value(options.procedures, {}),
                errors:$ok(options.errors) ? options.errors! : undefined
            } ;
            // each fusion starts with a new empty local context for the first level of the template
            this._fusion(run, [data], [{}], {
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
            }) ;
            return true ;
        }
        catch (e) {
            if ($ok(options.errors)) {
                options.errors.push('Fusion did encounter error:') ;
                $lines($inspect(e)).forEach(l => options.errors?.push(l)) ;
                options.errors!.push('STACK:') ;
                $lines((e as Error).stack).forEach(l => options.errors?.push(l)) ;
            }
        }
        return false ;
    }
    

    // merges all the sub-nodes of this node in the template
    private _fusion(run:FusionRun, stack:any[], localStack:TSDictionary[], systemContext:TSDictionary) {
        for (const node of this.nodes ?? []) {
            if (node.type === TSFusionNodeType.Data) {
                run.template.pushFusionData(node.value! as Bytes) ;
            }
            else {
                const v = node.contextType === TSFusionContextType.Procedure ?
                          node._procedureValue(run, stack, localStack, systemContext) :
                          node._keyPathValue(run, stack, localStack, systemContext) ;
                node._fusionValue(v, run, stack, localStack, systemContext) ;
            }
        }
    }

    // value returned by the procedure named by this node (eg. {{*name}}). The procedure receives
    // the local context of the current level of the template (the one used to search the keys)
    private _procedureValue(run:FusionRun, stack:any[], localStack:TSDictionary[], systemContext:TSDictionary):any {
        if (this._pathCache?.length !== 1 || !$length(this.value as string)) {
            run.errors?.push(`!ERROR!: Malformed procedure name ${this.value}() (undefined, empty or with '.' character in it)`) ;
            return undefined ;
        }
        const proc = run.procedures[this.value! as string] ;
        if (!$isfunction(proc)) {
            run.errors?.push(`!ERROR!: Procedure ${this.value}() does not exist`) ;
            return undefined ;
        }
        try {
            return proc(stack.last(), stack.first(), localStack[localStack.length-1], run.globalContext, {...systemContext}) ; // NOSONAR: localStack is never empty (it starts with [{}]) 
                                                                                                                               // and indexing keeps the TSDictionary type, 
                                                                                                                               //  whereas .at(-1) and .last() return T|undefined
        }
        catch {
            run.errors?.push(`!ERROR!: Procedure ${this.value}() execution did fail`) ;
            return undefined ;
        }
    }

    // value found following the key path of this node in its context (local, root, global...)
    private _keyPathValue(run:FusionRun, stack:any[], localStack:TSDictionary[], systemContext:TSDictionary):any {
        const hasRedefinedLocalItems = $objectcount(localStack.last()) > 0 ;
        const [target, dataType] = _contextTarget(this.contextType, stack, localStack, hasRedefinedLocalItems, run.globalContext, systemContext) ;
        // map() and not $map(), which skips the null and undefined values (they would shift the next parameters)
        const parameters = $count(this.parameters) ? this.parameters!.map(p => p === run.template ? stack.last() : p) : undefined ;
        if (this.contextType !== TSFusionContextType.Local || !hasRedefinedLocalItems) {
            return _valueForKeyPath(target, this._pathCache, dataType, false, parameters, run.errors) ;
        }
        // local fusion context is always predominant to local data if it exists. Since a key
        // which is not in the local context is then searched in the data, the messages of the
        // local context search are only reported if the key is not found in the data either
        const localErrors:string[]|undefined = $ok(run.errors) ? [] : undefined ;
        const v = _valueForKeyPath(target, this._pathCache, dataType, false, parameters, localErrors) ;
        if ($ok(v)) {
            run.errors?.push(...localErrors!) ;
            return v ;
        }
        const dataErrors:string[]|undefined = $ok(run.errors) ? [] : undefined ;
        const dv = _valueForKeyPath(stack, this._pathCache, 'target object', true, parameters, dataErrors) ;
        if (!$ok(dv)) { run.errors?.push(...localErrors!) ; }
        run.errors?.push(...dataErrors!) ;
        return dv ;
    }

    // uses the value v of this variable node according to its type
    private _fusionValue(v:any, run:FusionRun, stack:any[], localStack:TSDictionary[], systemContext:TSDictionary) {
        switch (this.type) {
            case TSFusionNodeType.Variable:
                if ($ok(v)) { run.template.pushFusionValue(v) ; }
                else { run.errors?.push(`WARNING: value returned for '${this.value!}' was undefined or null and should have result in data to merge in fusion.`) ; }
                break ;
            case TSFusionNodeType.Test:
                if (_isTrue(v)) { this._fusion(run, stack, localStack, systemContext) ; }
                break ;
            case TSFusionNodeType.NegativeTest:
                if (!_isTrue(v)) { this._fusion(run, stack, localStack, systemContext) ; }
                break ;
            case TSFusionNodeType.Enumeration:
                if ($ok(v)) { this._fusionEnumeration(v, run, stack, localStack, systemContext) ; }
                break ;
            default:
                break ;
        }
    }

    // merges the sub-nodes of this enumeration node once for each enumerated item,
    // each iteration having its own new local context
    private _fusionEnumeration(v:any, run:FusionRun, stack:any[], localStack:TSDictionary[], systemContext:TSDictionary) {
        const items = _enumeratedItems(v) ;
        const count = $length(items) ;
        for (let j = 0 ; j < count ; j++) {
            const item = items[j] ;
            this._fusion(run, [...stack, item], [...localStack, {}], {...systemContext, count:count, index:j, position:j+1, remaining:count-j-1}) ;
        }
    }
}

// parameters of a fusion which are the same for all the nodes
interface FusionRun {
    template:TSFusionTemplate ;
    globalContext:TSDictionary ;
    procedures:TSDictionary<TSFusionProcedure> ;
    errors?:string[] ;
}

// objects in which a key path is searched, and their description for error messages
function _isUnknownMember(v:any, m:string):boolean {
    if ($isobject(v)) { return !(m in v) ; }
    const t = typeof v ;
    return (t === 'string' || t === 'number' || t === 'boolean' || t === 'bigint' || t === 'symbol') && !(m in Object(v)) ;
}

// the value of a test: an empty array, set, map or collection (eg. a TSList) is false, like false,
// 0, NaN, '', null and undefined (an empty array, set... used to be true)
function _isTrue(v:any):boolean {
    if (!v) { return false ; }
    if ($isarray(v)) { return v.length > 0 ; }
    if (v instanceof Set || v instanceof Map) { return v.size > 0 ; }
    if ($iscollection(v)) { return $count(v.getItems()) > 0 ; }
    return true ;
}

// a view of the caller's global context and of the global functions: reading or testing a name looks
// in the caller's context first, writing a value writes it in the caller's context
function _globalContextView(callerContext:TSDictionary, functions:TSDictionary<Function>):TSDictionary {
    return new Proxy(callerContext, {
        get(target, name, receiver) {
            const v = Reflect.get(target, name, receiver) ;
            // a null or undefined value of the caller's context lets the function be used, as before
            return $ok(v) || typeof name !== 'string' || !Object.hasOwn(functions, name) ? v : functions[name] ;
        },
        has(target, name) { return name in target || Object.hasOwn(functions, name) ; }
    }) ;
}

function _contextTarget(contextType:TSFusionContextType, stack:any[], localStack:TSDictionary[], hasRedefinedLocalItems:boolean, globalContext:TSDictionary, systemContext:TSDictionary):[any[], string] {
    switch (contextType) {
        case TSFusionContextType.Root:   return [[stack.first()], 'root'] ;
        case TSFusionContextType.Local:  return [hasRedefinedLocalItems ? localStack : stack, 'local context'] ;
        case TSFusionContextType.Global: return [[globalContext], 'global context'] ;
        case TSFusionContextType.User:   return [[globalContext], 'user global context'] ;
        case TSFusionContextType.System: return [[systemContext], 'system context'] ;
        default:                         return [[], 'unknown target'] ;
    }
}

function _enumeratedItems(v:any):any {
    if ($iscollection(v)) { return v.getItems() ; }
    return $ismethod(v, 'fusionEnumeration') ? v.fusionEnumeration() : [v] ;
}

function _valueForKeyPath(stack:any[], keyPath:string[]|undefined, dataType:string, unknownAsError:boolean, parameters:any[]|undefined, errors?:string[]):any 
{
    if (!$ok(keyPath)) { keyPath = [] ; }
    const kcount = keyPath.length ;
    if (!kcount) {
        errors?.push('ERROR: empty key path') ;
        return undefined ; 
    }

    // each leading empty component (ie. each leading '.') goes one level up in the stack
    let i = 0 ;
    while (i < kcount && !keyPath[i].length) { i++ ; }
    if (i >= stack.length) { 
        errors?.push(`!ERROR!: key path '${keyPath.join('.')}' did underflow the stack.`) ;
        return undefined ; 
    }

    const walk:KeyPathWalk = { keyPath:keyPath, dataType:dataType, unknownAsError:unknownAsError, parameters:parameters, parametersCount:$count(parameters), errors:errors } ;
    let v = stack[stack.length-i-1] ;
    for ( ; i < kcount && $ok(v) ; i++) {
        const step = _keyPathStep(v, i, walk) ;
        if (step.stop) { return step.value ; }
        v = step.value ;
    }
    return v ;
}

// what is common to all the steps of a key path walk
interface KeyPathWalk {
    keyPath:string[] ;
    dataType:string ;           // description of the walked object for error messages
    unknownAsError:boolean ;    // unknown members are reported as errors instead of warnings
    parameters:any[]|undefined ;
    parametersCount:number ;
    errors?:string[] ;
}

// result of one step of a key path walk: the next value, or the final value if stop is true
interface KeyPathStep {
    value:any ;
    stop?:boolean ;
}

// follows the i-th component of the key path from the value v
function _keyPathStep(v:any, i:number, w:KeyPathWalk):KeyPathStep {
    const m = w.keyPath[i] ;
    const level = w.unknownAsError ? '!ERROR!' : 'WARNING' ;
    // parameters are given to the method named by the last component of the key path
    const isCall = w.parametersCount > 0 && i + 1 === w.keyPath.length ;

    if (!m.length) { return _keyPathStop(w, `!ERROR!: key path '${w.keyPath.join('.')}' contains internal '..'.`) ; }
    if (!isCall && m === 'self') { return { value:v } ; } // special keyword for referencing itself
    // '__proto__', 'constructor' and 'prototype' cannot be read: they give access to the functions which
    // build the objects (eg. {{f.constructor('code')}} did compile a function), see $issafekey()
    if (!$issafekey(m)) { return _keyPathStop(w, `!ERROR!: property '${m}' cannot be read in a fusion template.`) ; }
    // an unknown member of a primitive value (eg. {{s.foo}} for a string) is reported like the one of an
    // object (only the final 'undefined or null' warning was given)
    if (_isUnknownMember(v, m)) { return _keyPathStop(w, `${level}: unknown method or property '${m}' in ${w.dataType}.`) ; }

    const member = v[m] ;
    if (!$isfunction(member)) {
        return isCall ? _keyPathStop(w, `${level}: unknown method '${m}()' in ${w.dataType}.`) : _keyPathValue(member, w) ;
    }
    if (member.length > 0 && !isCall) { return _keyPathStop(w, `!ERROR!: method ${m}() is not a simple accessor in ${w.dataType}.`) ; }

    let result:any ;
    try { result = isCall ? member.apply(v, w.parameters) : member.call(v) ; }
    catch { return _keyPathStop(w, `!ERROR!: method ${m}() execution did fail on ${w.dataType}`) ; }
    return _keyPathValue(result, w) ;
}

// a NaN value stops the walk and is transformed to null
function _keyPathValue(v:any, w:KeyPathWalk):KeyPathStep {
    if (typeof v === 'number' && Number.isNaN(v)) {
        w.errors?.push(`WARNING: key path '${w.keyPath.join('.')}' would return NaN which was transformed to null.`) ;
        return { value:null, stop:true } ;
    }
    return { value:v } ;
}

// stops the walk with an undefined value after having reported the error
function _keyPathStop(w:KeyPathWalk, error:string):KeyPathStep {
    w.errors?.push(error) ;
    return { value:undefined, stop:true } ;
}

declare global {
    export interface Set<T> extends TSFusionEnumeration {}
    export interface Map<K,V> extends TSFusionEnumeration {}
}

$declareMethods(Set, {
    fusionEnumeration(this:Set<any>):any[] { return Array.from(this) ; },
}) ;
$declareMethods(Map, {
    fusionEnumeration(this:Map<any,any>):any[] {
        const ret:any[] = [] ;
        this.forEach((value:any, key:any) => ret.push({key:key, value:value})) ;
        return ret ;
    },
}) ;
