import { $count, $isfunction, $isobject, $length, $ok } from "./commons";
import { $lines } from "./strings";
import { TSDate } from "./tsdate";
import { TSDefaults } from "./tsdefaults";
import { TSError } from "./tserrors";
import { TSFusionProcedure, TSFusionTemplate } from "./tsfusion";
import { $iscollection } from "./tsobject";
import { Bytes, TSDictionary } from "./types";
import { $inspect } from "./utils";

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

export class TSFusionTreeNode {
    type:TSFusionNodeType ;
    value?:string|Bytes  ;
    nodes?:TSFusionTreeNode[] ;
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

    public pushVariable(name:string, type:TSFusionNodeType, contextType?:TSFusionContextType):TSFusionTreeNode {
        if (this.type === TSFusionNodeType.Data) { throw new TSError('Impossible to add subnode to a text FusionTreeNode', { text:this.value} ) ; }
        if (!$length(name)) { throw new TSError (`Impossible to add an unamed fusion variable to ${this.label} variable.`)}
        if (type === TSFusionNodeType.Root || type === TSFusionNodeType.Data) {
            throw new TSError(`Impossible to add fusion variable '${name}' as a ${type} variable`, { name:name, type:type } ) ;
        }
        if (!$ok(this.nodes)) { this.nodes = [] ; }
        let node = new TSFusionTreeNode(type, name, this) ;
        if ($ok(contextType)) { node.contextType = contextType! ;}
        node._pathCache = name.split('.') ;
        this.nodes!.push(node) ;
        return node ;
    }

    public fusion(template:TSFusionTemplate, data:any, globalContext:TSDictionary, procedures:TSDictionary<TSFusionProcedure> = {}, errors?:string[]):boolean {

        if (this.type !== TSFusionNodeType.Root) { 
            throw new TSError('Impossible invoque fusion() method on non-root FusionNodeType', { label:this.label, type:this.type } ) ; 
        }
        try {
            
            this._cleanLocalContexts() ;

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
                count: 1
            },
            procedures,
            errors
            ) ;
            return true ;
        }
        catch (e) {
            if ($ok(errors)) {
                errors!.push('Fusion did encounter error:') ;
                $lines($inspect(e)).forEach(l => errors?.push(l)) ;
                errors!.push('STACK:') ;
                $lines((e as Error).stack).forEach(l => errors?.push(l)) ;
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
                        else if (debug) { errors?.push(`!ERROR!: Procedure ${node.value}() does not exist`) ; }
                    }
                    else if (debug) { errors?.push(`!ERROR!: Malformed procedure name ${node.value}() (undefined, empty or with '.' character in it)`) ; }
                }
                else {
                    let target:any[] = [];
                    let dataType = 'unknown target' ;

                    switch (node.contextType) {
                        case TSFusionContextType.Root: 
                            target = [stack.first()] ;
                            dataType = 'root'
                            break ;
                        case TSFusionContextType.Local:
                            target = localStack ;
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
                    v = _valueForKeyPath(target, node._pathCache, dataType, false, errors) ;
                    if (node.contextType === TSFusionContextType.Local && !$ok(v)) {
                        v = _valueForKeyPath(stack, node._pathCache, 'target object', true, errors) ;
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
                            const a = $iscollection(v) ? v.getItems() : ('fusionEnumeration' in v ? v.fusionEnumeration() : [v]) ;
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

function _valueForKeyPath(stack:any[], keyPath:string[] = [], dataType:string, unknownAsError:boolean, errors?:string[]):any 
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

    for ( ; i < kcount && $ok(v) ; i++) {
        const m = keyPath[i] ;
        if (!m.length) { 
            errors?.push(`!ERROR!: key path '${keyPath.join('.')}' contains internal '..'.`) ;
            return undefined ; 
        }
        if (m === 'self') { continue ; } // special keyword for referencing itself
        if ($isobject(v) && !(m in v)) { 
            errors?.push(`${unknownAsError?'!ERROR!':'WARNING'}: unknown method or preperty '${m}' in ${dataType}.`) ;
            return undefined ; 
        }
        let res = v[m] ;
        if ($isfunction(res)) {
            if (res.length > 0) { 
                errors?.push(`!ERROR!: method ${m}() is not an sinple accessor in ${dataType}.`) ;
                return undefined ; 
            }
            try {
                v = res.call(v) ;
            }
            catch (e) {
                errors?.push(`!ERROR!: method ${m}() execution did fail on ${dataType}`) ;
                return undefined ;
            }
        }
        else { v = res ; }    
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
