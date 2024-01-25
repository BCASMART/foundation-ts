import { Nullable, StringDictionary, TSDataLike, TSDictionary, uint, unichar } from "./types";
import { $count, $defined, $isarray, $isnumber, $isstring, $length, $ok, $string, $toint, $unsigned, $value, $valueornull } from "./commons";
import { DefaultsConfigurationOptions } from "./tsdefaults";
import { $exit, $logheader, $logterm } from "./utils";
import { $ascii, $ftrim, $lines, $normspaces } from "./strings";
import { $charset } from "./tscharset";
import { TSExtendedLeafNode, TSLeafNode, TSObjectNode, TSParser, TSParserActionContext } from "./tsparser";
import { TSError } from "./tserrors";
import { TSURL } from "./tsurl";

export interface $envOptions extends DefaultsConfigurationOptions  {
    merge?:Nullable<StringDictionary> ;     // environment to be merged with interpreted variables.
                                            // if merge is process.env, new values are overwriting process.env
    reference?:Nullable<StringDictionary> ; // reference can be process.env
} ;

/**
 * This method does not accepts multiline comments but accepts substitution paterns like ${aVariableName} in
 * any value NOT surrounded by simple quotes ('').
*/
export function $env(source:Nullable<string|TSDataLike>, opts?:Nullable<$envOptions>):StringDictionary|null {
    return _parsenv('$env', source, null, true, $value(opts, {})) as StringDictionary|null ;
}
export interface $parsedEnvOptions extends DefaultsConfigurationOptions {
    parser:Nullable<TSDictionary<TSLeafNode>>
    merge?:Nullable<TSDictionary> ;
    reference?:Nullable<TSDictionary> ;
    acceptsUnparsed?:Nullable<boolean> ;
}

/* WARNING: dont pass process.env in merge here, 
            because it's not a real Dictionary 
            and all values will turn as strings
            even parsed onces 
*/
export function $parsedenv(source:Nullable<string|TSDataLike>, opts:$parsedEnvOptions):TSDictionary|null {
    const tmp = {...opts} ;
    delete tmp['parser'] ;
    delete tmp['acceptsUnparsed'] ;
    return _parsenv('$parsedenv', source, opts.parser, !!opts.acceptsUnparsed, {...tmp}) ;
}

function _parsenv(fn:string, source:Nullable<string|TSDataLike>, parserDefinition:Nullable<TSDictionary<TSLeafNode>>, acceptsUncheckedItems:boolean, opts:$envOptions):TSDictionary|null {
    const debug = !!opts?.debug ;
    const parse = $ok(parserDefinition) ;
    const parserStructure:TSObjectNode = { _mandatory: true, _acceptsUncheckedItems:acceptsUncheckedItems } ;
    let parser:Nullable<TSParser> = undefined ;

    if (parse) {
        const entries = Object.entries(parserDefinition!) ;
        const nameSet = new Set<string>() ;
        let n = 0 ;
        for (let [name, d] of entries) {
            name = $ftrim(name) ;
            if (name.length === 0) { TSError.throw(`${fn}(): found empty name definition`, parserDefinition!) ; }
            if (_normarg(name) !== name || name.length < 2) { TSError.throw(`${fn}(): found bad name for env var '${name}'`, parserDefinition) ; }
            if (nameSet.has(name)) { TSError.throw(`${fn}(): found duplicate name definition '${name}'`, parserDefinition!) ; }
            let localParser:Nullable<TSParser> = undefined ;
            if ($isstring(d) || $ok((d as any)._type)) {
                localParser = TSParser.define(d) ;
            }
            if (!$ok(localParser)) { TSError.throw(`${fn}(): bad parser definition for env var '${name}'`, parserDefinition!) ; }
            (parserStructure as any)[name] = d ; 
            n++ ;
        }
        if (n === 0) { TSError.throw(`${fn}(): no definition found in environment parser`, parserDefinition) ; }
        parser = TSParser.define(parserStructure) ;
        if (!$ok(parser)) { TSError.throw(`${fn}(): impossible to define environment parser structure`, parserDefinition) ; }
    }
    const merge = $ok(opts?.merge) ;
    const ret:TSDictionary = merge ? opts!.merge! : {} ;
    const previous:Array<{k:string, p:any}> = [] ;
    const toBeDeleted:string[] = [] ;
    const ref:TSDictionary = $ok(opts?.reference) ? opts!.reference! : {} ;
    const unary:TSDictionary = {} ;
    const variableMax = Math.min(Math.max(1, $unsigned(opts?.variableMax, 64 as uint)), 256) as uint ;
    const underscoreMax = Math.min(Math.max(1, $unsigned(opts?.underscoreMax, 2 as uint)), 8, variableMax) as uint ;
    if (!$ok(source)) { 
        if (debug) { $logterm("&R&w $env(): called with a null or undefined source  &0") ; }
        return ret ;
    }
    const lines = $lines($isstring(source) ? source as string : $charset(opts?.encoding).stringFromData(source as TSDataLike)) ;
    for (let i = 0, n = lines.length ; i < n ; i++) {
        const [key, value] = _interpretEnvLine(ret, lines[i].rtrim(), i + 1, ref, underscoreMax, variableMax, debug) ;
        if (key === 'void') { continue ; }
        if (!key.length) { return null ; }
        if (merge) {
            if ($defined(ret[key])) { previous.push({k:key!, p: ret[key]}); }
            else { toBeDeleted.push(key) ; }    
        }
        ret[key] = value ;
        if (parse) { unary[key] = value ; }
    }
    if (parse) {
        const errors:string[]|undefined = debug ? [] : undefined ;
        const parsedUnary = parser!.interpret(unary, { context:TSParserActionContext.env, errors:errors }) ;
        if (!$ok(parsedUnary)) {
            if (merge) { 
                // restore our previous environment before merging
                toBeDeleted.forEach(k => delete opts!.merge![k]) ;
                previous.forEach(def => opts!.merge![def.k] = def.p) ;
            }
            return null ; 
        }
        return {...ret, ...parsedUnary!}
    }
    return ret ;
}

export type TSArgumentDictionary = TSDictionary<TSArgument|TSLeafNode> ;

// TODO: add description in this argument to generate a usage array with $args()
export interface TSArgument {
    struct:TSLeafNode ;
    noDoubleDash?:boolean ;
    defaultValue?:any ;
    short?:string ;
    negative?:string ;
    negativeShort?:string ;
}

export interface TSArgsOptions {
    errors?:Nullable<string[]> ;
    arguments?:Nullable<URL|TSURL|string[]> ;
    processName?:Nullable<string> ;
    exitError?:Nullable<number> ;
}
// if an url is specfied, we take the arguments from it
// if there's nothin we try from the process itself
export function $args(definition:TSArgumentDictionary, opts?:Nullable<TSArgsOptions>):[TSDictionary|null, string[]] {
    const entries = Object.entries(definition) ;
    let url:Nullable<TSURL> = undefined ;
    const ref:Map<string, TSArgumentParser> = new Map() ;
    let isURL = opts?.arguments instanceof URL || opts?.arguments instanceof TSURL ;
    if (isURL) { 
        url = opts?.arguments instanceof TSURL ? opts!.arguments! : TSURL.from(opts!.arguments as URL) ; 
    }

    const vargs:any = process && process !== null && typeof process !== 'undefined' ? process?.argv : undefined ;
    const isvargs = !isURL && $isarray(vargs) ;
    const passedargs = $isarray(opts?.arguments) ;

    const prefix = isURL ? '':'-' ;
    const parserStructure:TSObjectNode = { _mandatory: true } ;
    const nameSet = new Set<string>() ;
    const defaults = new Array<{name:string, value:any}>() ;
    
    let n = 0 ;
    for (let [name, d] of entries) {
        name = $ftrim(name) ;
        if (name.length === 0) { TSError.throw('$arg(): found empty name definition', definition) ; }
        if (_normarg(name) !== name || name.length < 2) { TSError.throw(`$arg(): found bad name for argument '${name}'`, definition) ; }
        let twice = nameSet.has(name) ;
        if (!twice) {
            let parser:Nullable<TSParser> = undefined ;
            if (typeof d === 'string') {
                twice = ref.has(prefix+name) || (prefix.length > 0 && ref.has(prefix+prefix+name)) ;
                if (!twice) {
                    parser = TSParser.define(d) ;
                    if ($ok(parser)) { 
                        nameSet.add(name) ;
                        (parserStructure as any)[name] = d ;
                        const def:TSArgumentParser = { name:name, positive:d === 'boolean' || d === 'boolean!' ? true : undefined }
                        ref.set(prefix+name, def) ; 
                        if (prefix.length) { ref.set(prefix+prefix+name, def) ; } 
                        n++ ;
                    }
                }
            }
            else {
                const ds = $ok((d as any)._type) ? { struct:d as TSExtendedLeafNode } : d as TSArgument ;
                const short = $string(ds.short) ;
                const isBoolean = $isstring(ds.struct) ? 
                                  ds.struct === 'boolean' || ds.struct === 'boolean!' : 
                                  (ds.struct as TSExtendedLeafNode)._type === 'boolean' ;
                const nname = isBoolean ? $string(ds.negative) : '' ;
                const nshort = isBoolean ? $string(ds.negativeShort) : '' ;
                const doubledash = !ds.noDoubleDash && prefix.length > 0 ;
                if (nname.length === 1 || (nname.length > 1 && (_normarg(nname) !== nname || nname === name))) {
                    TSError.throw(`$args(): bad definition for negative name version of argument '${name}'`, { name:name, structure:d })
                }
                if (short.length > 1 || (short.length === 1 && (_normarg(short) !== short || short === nshort))) {
                    TSError.throw(`$args(): bad definition for short version of argument '${name}'`, { name:name, definition:d })
                }
                if (nshort.length > 1 || (nshort.length === 1 && (_normarg(nshort) !== nshort || short === nshort))) {
                    TSError.throw(`$args(): bad definition for negative short version of argument '${name}'`, { name:name, structure:d })
                }

                twice = ref.has(prefix+name) || 
                        (doubledash && ref.has(prefix+prefix+name)) || 
                        (short.length === 1 && ref.has(prefix+short)) || 
                        (nname.length > 1 && ref.has(prefix+nname)) || 
                        (doubledash && nname.length > 1 && ref.has(prefix+prefix+nname)) || 
                        (nshort.length === 1 && ref.has(prefix+nshort)) ;
                if (!twice) {
                    parser = TSParser.define(ds.struct) ;
                    if ($ok(parser)) {
                        if (isBoolean && parser?.mandatory && nname.length === 0 && nshort.length === 0) {
                            TSError.throw(`$args(): argument '${name}' cannot be mandatory and have no negative version`, { name:name, structure:d })
                        }

                        const def:TSArgumentParser = { name:name, positive:isBoolean ? true : undefined } ;
                        (parserStructure as any)[name] = ds.struct ;
                        nameSet.add(name) ;
                        if ($ok(ds.defaultValue)) { defaults.push({name:name, value:ds.defaultValue!}) ; }
                        ref.set(prefix+name, def) ; 
                        if (doubledash) { ref.set(prefix+prefix+name, def) ; }
                        if (prefix.length >= 0 && short.length === 1) { ref.set(prefix+short, def) ; }
                        if (nname.length > 1 || nshort.length === 1) {
                            const ndef:TSArgumentParser = { name:name, positive:isBoolean ? false : undefined } ;
                            if (nname.length > 1 ) { 
                                ref.set(prefix+nname, ndef) ;
                                if (doubledash) { ref.set(prefix+prefix+nname, ndef) ; }
                            }
                            if (prefix.length > 0 && nshort.length === 1) { ref.set(prefix+nshort, ndef) ; }
                        }
                        n++ ;
                    }
                }
            }
            if (!$ok(parser)) { TSError.throw(`bad structure definition for argument '${name}'`, { name:name, structure:d }) ; }
        }
        if (twice) { TSError.throw(`$args(): argument '${name}' is declared twice`, definition) ; }
    }
    if (n === 0) { TSError.throw("$args(): no arguments defined", definition) ; }

    const parser = TSParser.define(parserStructure) ;
    let dict:TSDictionary|null = null ;
    let args:string[] = [] ;

    if (!$ok(parser)) { TSError.throw("$args(): unable to generate parser", { structure:parserStructure, errors:opts?.errors}) }
    if (isURL) {
        // we parse an url query
        dict = parser!.interpret(_dictionaryFromURLQuery(url!, ref, opts?.errors), { errors:opts?.errors, context:'url' }) ;
    }
    if (isvargs || passedargs) {
        // we parse a process args array
        [dict, args] = _argumentsFromVarArgs(passedargs ? opts?.arguments as string[] : process?.argv?.slice(2), ref, opts?.errors) ;
        if ($ok(dict)) {
            const interpretErrors:string[] = [] ; 
            dict = $valueornull(parser!.interpret(dict, { errors:interpretErrors, context:TSParserActionContext.vargs })) as TSDictionary | null ; 

            if (!$ok(dict) && $ok(opts?.errors)) {
                interpretErrors.forEach(e => {
                    const m = e.match(/^object\.(\S+)\s+(.+)$/) ;
                    if ($ok(m)) { opts?.errors?.push(`Argument '-${m![1]}' ${m![2]}`) ; }
                }) ;
            }
        }
    }
    if ($isnumber(opts?.exitError) && opts?.exitError !== 0) {
        $argCheck($toint(opts?.exitError), opts?.errors, opts?.processName) ;
    }
    if ($ok(dict)) {
        defaults.forEach(c => { if (!$ok(dict![c.name])) { dict![c.name] = c.value ; }})
    }
    return [dict, args] ;
}

export function $argCheck(exitStatus:number, errors:Nullable<string[]|TSArgsOptions>, processName?:Nullable<string>) {
    const err = $isarray(errors) ? errors as string[] : ($ok(errors) ? (errors as TSArgsOptions).errors : undefined) ;
    const n = $count(err) ;
    if (n > 0) {
        $logheader(`${$length(processName)?processName:'process'} did encounter ${n > 1 ? 'errors' : 'an error'}`, undefined, '&r', '&o') ;
        $logterm(`&y${err!.join('.\n')}.&0\n`) ;
        if (exitStatus !== 0) { $exit(exitStatus) ; }
    }
}

// ====================== private types, interfaces and constants ======================
interface TSArgumentParser {
    name:string ;
    positive?:boolean ; 
}

// ====================== private functions ============================================
function _dictionaryFromURLQuery(url:TSURL, ref:Map<string, TSArgumentParser>, errors:Nullable<string[]>):TSDictionary|null {
    let doomed = false ;
    const dict:TSDictionary = {} ;

    for (const [key, value] of url.searchParams) {
        if (key.length > 0 && $ok(value)) {
            const def = ref.get(key) ;
            if (!$ok(def)) { errors?.push(`Unknown argument '${key}'.`) ; doomed = true ; }
            if ($ok(def?.positive)) {
                dict[def!.name] = def?.positive ? value :_inversedValue(value) ; 
            }
            else {
                const v = dict[def!.name] ;
                if (!$ok(v)) { dict[def!.name] = value ; }
                else if ($isarray(v)) { v.push(value) ; }
                else { dict[def!.name] = [v, value] ; }
            }
        }
    }

    return doomed ? null : dict ;
}

function _inversedValue(v:string|number|boolean):string|boolean {
    if (typeof v === 'boolean') { return !v }
    if (v === 0 || v === '0') { return true ; }
    if (v === 1 || v === '1') { return false ; }
    v = $string(v) ;
    const s = $ftrim(v).toLowerCase() ;
    if (s === '1' || s === 'true' || s === 'yes' || s === 'y') { return false ; }
    if (s === '0' || s === 'false' || s === 'no' || s === 'n') { return true ; }
    return v as string ;
}

function _argumentsFromVarArgs(args:Nullable<string[]>, ref:Map<string, TSArgumentParser>, errors:Nullable<string[]>):[TSDictionary|null, string[]] {
    const finalArgs:string[] = [] ;
    let doomed = false ;

    // first we verify that all arguments are known
    // and we explode args like -cvf in -c -v -f
    args?.forEach(a => {
        if (a.startsWith('-')) {
            const len = a.length ; 
            if (len === 1) { errors?.push('Solitary dash (-) was found as an argument.') ; doomed = true ; }
            else if (a.startsWith('--')) {
                if (len === 2 ){ errors?.push('Solitary double dash (--) was found as an argument.') ; doomed = true ; }
                else if (!ref.has(a)) { errors?.push(`Unknown argument '${a}'.`) ; doomed = true ;} 
                else { finalArgs.push(a) ; }
            }
            else if (!ref.has(a)) {
                let fn = 1 ;
                for ( let i = 1 ; i < len ; i++) {
                    if (!ref.has('-'+a[i])) { errors?.push(`Unknown argument '-${a[i]}'.`) ; doomed = true ; continue ; }
                    finalArgs.push('-'+a[i]) ;
                    fn ++ ;
                }
                if (fn < len && len > 2) {
                    errors?.push(`Unknown argument '${a}'.`) ; doomed = true ;
                }
            }
            else { finalArgs.push(a) ; }
        }
        else { finalArgs.push(a) ; }
    })
    const remains:string[] = [] ;
    if (doomed) { return [null, remains] ; }
    
    let lastArg:string = '' ;
    let lastDef:TSArgumentParser|undefined = undefined ;
    const dict:TSDictionary = {} ;
    doomed = false ;
    finalArgs.forEach( a => {
        if (lastArg.length) {
            if (a.startsWith('-')) { errors?.push(`Found no value for argument '${lastArg}'.`) ; doomed = true ; }
            else {
                const v = dict[lastDef!.name] ;
                if (!$ok(v)) { dict[lastDef!.name] = a ; }
                else if ($isarray(v)) { v.push(a) ; }
                else { dict[lastDef!.name] = [v, a] ; }
            }
            lastArg = '' ; lastDef = undefined ;
        }
        else if (a.startsWith('-')) {
            const def = ref.get(a)! ; // we know we have it
            if ($ok(def.positive)) { dict[def.name] = def.positive! ; }
            else { lastArg = a ; lastDef = def ; }
        }
        else { remains.push(a) ; }
    }) ;
    if (lastArg.length) { errors?.push(`Found no value for argument '${lastArg}'.`) ; doomed = true ; }

    return [doomed ? null:dict, remains] ;
}

function _normarg(s:Nullable<string>):string { return $ascii($normspaces(s, {strict:true, replacer:''})) ; }

function _interpretEnvLine(env:TSDictionary, line:string, index:number, reference:TSDictionary, underscoreMax:uint, variableMax:uint, debug:boolean):[string, string] {
    const len = line.length ;

    let p = 0 ;
    
    while (p < len && isspace(line.charCodeAt(p))) { p ++ ; } // space at start of line
    if (p === len || line.charAt(p) === '#') { return ['void', ''] ; } // empty line or line with only commentaries

    if (line.slice(p, p+6) === "export") {
        p += 6 ; 
        let ws = 0 ;
        while (p < len && isspace(line.charCodeAt(p))) { p ++ ; ws++ } // space after export
        
        if (p === len || line.charAt(p) === '#') {
            if (debug) { $logterm(`&R&w $env(): line #${index} only contains 'export' keyword  &0`) ; }
            return ['', ''] ;
        }        
        else if (!ws) {
            if (debug) { $logterm(`&R&w $env(): line #${index} 'export' keyword must be followed at least one space character  &0`) ; }
            return ['', ''] ;
        }
    }
    
    const [DOUBLE_QUOTE, DOLLAR, QUOTE, ZERO, NINE, EQ,   A,    Z,    BACKSLASH, UNDERSCORE, b,    f,    n,    r,    t,    u,    LCB,  RCB ] =
          [0x22,         0x24,   0x27,  0x30, 0x39, 0x3D, 0x41, 0x5A, 0x5C,      0x5F,       0x62, 0x66, 0x6E, 0x72, 0x74, 0x75, 0x7B, 0x7D] as unichar[] ;

    function upper(c:number):unichar { return (c & 0x00df) as unichar ; }
    function isletter(c:number) { c = upper(c) ; return c >= A && c <= Z ; }
    function isvarchar(c:number) { return c === UNDERSCORE || isletter(c) || (c >= ZERO && c <= NINE) ; }
    function isspace(c:number) { return c.isStrictWhiteSpace() ; }
    function badchar(l:string, pos:number, tag:string = ''):['', ''] {
        const c = l.charCodeAt(pos) ;
        if (debug) { $logterm(`&R&w $env(): found wrong character '${String.fromCharCode(c)}' (\\U${c.toHex4()}) at position ${pos+1} and line #${index}${tag.length?' ['+tag+']':''}  &0`) ; }
        return ['', ''] ;
    }

    function underscoreOverload(pos:number, tag:string = ''):['', ''] {
        if (debug) { $logterm(`&R&w $env(): found more than ${underscoreMax} '_' character in variable or substitution at position ${pos+1} and line #${index}${tag.length?' ['+tag+']':''}  &0`) ; }
        return ['', ''] ;
    }
    function variableOverload(pos:number, tag:string = ''):['', ''] {
        if (debug) { $logterm(`&R&w $env(): found variable or subsitution variable longer than than ${variableMax} at position ${pos+1} and line #${index}${tag.length?' ['+tag+']':''}  &0`) ; }
        return ['', ''] ;
    }
    function incompleteLine(tag:string=''):['', ''] {
        if (debug) { $logterm(`&R&w $env(): line #${index} is incomplete${tag.length?' ['+tag+']':''}  &0\n&o"&y${line}&o"&0`) ; }
        return ['', ''] ;
    }

    let vl = 0 ;
    const keyStart = p ;
    while (p < len && line.charCodeAt(p) === UNDERSCORE) { 
        vl++ ; if (vl > underscoreMax) { return underscoreOverload(p, "var") ; }
        p++ ;
    }
    if (p === len) { return incompleteLine("underscore var only") ; }
    
    if (!isletter(line.charCodeAt(p))) { return badchar(line, p, "var start") ; } 
    vl++ ; if (vl > variableMax) { return variableOverload(p, "var #1") ; }
    p ++ ; if (p === len) { return incompleteLine("NO = sign #1") ; }
    
    while (p < len && isvarchar(line.charCodeAt(p))) { 
        //$logterm(`s[${p}]='${line.charAt(p)}'`)
        vl++ ; if (vl > variableMax) { return variableOverload(p, "var #2") ; }
        p ++ ; 
    }
    const afterKey = p ;

    while (p < len && isspace(line.charCodeAt(p))) { p ++ ; } // space before =
    if (p === len) { return incompleteLine("NO = sign #2") ; }

    if (line.charCodeAt(p) !== EQ) { return badchar(line, p, "NO =")}
    p++ ;
    while (p < len && isspace(line.charCodeAt(p))) { p ++ ; } // space after eq
    if (p === len) { return [line.slice(keyStart, afterKey), ''] ; }

    const c0 = line.charCodeAt(p) ;
    let last:unichar|undefined = undefined ;

    if (c0 === DOUBLE_QUOTE || c0 === QUOTE) { 
        last = c0 as unichar ; 
        p ++ ; if (p === len) { return incompleteLine("value never started") ; }
    }
    let p0 = p ;
    let v = '' ;
    enum State {
        Text = "TEXT",
        Substitution = "SUBS",
        SubstitutionLetter = "SUBL",
        SubstitutionVar = "SUBV",
        Backslash = "BACK",
        Unicode = "HEXA",
        Stop = "STOP"
    } ;
    let state = State.Text ;
    let uc = 0 ;
    let us = 0 ;
    //$logterm('----------') ;
    while (p < len && state !== State.Stop) {
        const c = line.charCodeAt(p) ;
        //$logterm(`<state ${state} char ${c.toHex4()} ('${String.fromCharCode(c)}')>`) ;
        switch (state) {
            case State.Text:
                if ($ok(last) && c === last) { v += line.slice(p0, p) ; state = State.Stop ; }
                else if (c === BACKSLASH) { v += line.slice(p0, p) ; state = State.Backslash ; }
                else if (c === DOLLAR && last !== QUOTE) { v += line.slice(p0, p) ; state = State.Substitution ; }
                break ;
            case State.Backslash:
                state = State.Text ;
                p0 = p + 1 ;
                switch (c) {
                    case b:            v += '\b' ; break ;
                    case f:            v += '\f' ; break ;
                    case n:            v += '\n' ; break ;
                    case r:            v += '\r' ; break ;
                    case t:            v += '\t' ; break ;
                    case u:            uc = 0 ; us = 0 ; state = State.Unicode ; break ;
                    default:           v += String.fromCharCode(c) ;
                }
                break ;
            case State.Unicode:
                const hexa = c.hexaValue() ;
                if (hexa < 0) { return badchar(line, p, `\\u[${us}]`) ; }
                uc = (uc << 4) | hexa ;
                us ++ ;
                if (us === 4) {
                    v += String.fromCharCode(uc) ;
                    state = State.Text ;
                    p0 = p + 1 ;
                }
                break ;
            case State.Substitution:
                if (c !== LCB) { return badchar(line, p, '{') ; }
                p0 = p + 1 ;
                vl = 0 ;
                state = State.SubstitutionLetter ;
                break ;
            case State.SubstitutionLetter:
                if (isletter(c)) { 
                    state = State.SubstitutionVar ; 
                    vl++ ; if (vl > variableMax) { return variableOverload(p, "substitution #1") ;}
                }
                else if (c !== UNDERSCORE) { return badchar(line, p, "substitution '_'") ; }
                vl++ ; if (vl > underscoreMax) { return underscoreOverload(p, "substitution") ; }
                break ;
            case State.SubstitutionVar:
                if (c === RCB) {
                    const variable = line.slice(p0, p) ;
                    //$logterm(`&ysubstitution variable='&p${variable}&y'&0`)
                    let variableValue:any = env[variable] ;
                    if (!$ok(variableValue)) { variableValue = reference[variable] ; }
                    variableValue = $string(variableValue) ;
                    //$logterm(`&ysubstitution value='&p${variableValue}&y'&0`)
                    if ($length(variableValue) > 0) { v += variableValue! ; }
                    state = State.Text ;
                    p0 = p + 1 ;
                }
                else if (!isvarchar(c)) { return badchar(line, p, '}') ; }
                vl++ ; if (vl > variableMax) { return variableOverload(p, "substitution #2") ; }
                break ;
        }
        p++ ; 
    }
    if (state === State.Text) {
        if ($ok(last)) { return incompleteLine(`NO string value end (${last})`) ; } // when decoding '' or "" values, we need to be in stop state at the end
        v += line.slice(p0, p) ; 
    }
    else if (state !== State.Stop) { return incompleteLine(`BAD state ${state}`) ; }
    
    if (p < len) {
        let pe = p ;
        while (pe < len && isspace(line.charCodeAt(pe))) { pe ++ ; }
        if (pe < len && line.charAt(pe) !== '#') { return badchar(line, pe, '#') ; }
    }

    return [line.slice(keyStart, afterKey), v] ;
}
