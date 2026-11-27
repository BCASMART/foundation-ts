import { Nullable, StringDictionary, TSDataLike, TSDictionary, uint, unichar } from "./types";
import { $count, $defined, $isarray, $isnumber, $issafekey, $isstring, $length, $ok, $string, $toint, $unsigned, $value, $valueornull } from "./commons";
import { DefaultsConfigurationOptions } from "./tsdefaults";
import { $exit, $logheader, $logterm } from "./utils";
import { $ascii, $ftrim, $lines, $normspaces } from "./strings";
import { $charset } from "./tscharset";
import { TSExtendedLeafNode, TSLeafNode, TSObjectNode, TSParser, TSParserActionContext } from "./tsparser";
import { TSError } from "./tserrors";
import { TSURL } from "./tsurl";

export interface TSEnvOptions extends DefaultsConfigurationOptions  {
    merge?:StringDictionary | null ;     // environment to be merged with interpreted variables.
                                         // if merge is process.env, new values are overwriting process.env
    reference?:StringDictionary | null ; // reference can be process.env
} ;
/** @deprecated use TSEnvOptions */
export type $envOptions = TSEnvOptions ;

/**
 * This method does not accepts multiline comments but accepts substitution paterns like ${aVariableName} in
 * any value NOT surrounded by simple quotes ('').
*/
export function $env(source:Nullable<string|TSDataLike>, opts?:Nullable<TSEnvOptions>):StringDictionary|null {
    return _parsenv('$env', source, null, true, $value(opts, {})) as StringDictionary|null ;
}
export interface TSParsedEnvOptions extends DefaultsConfigurationOptions {
    parser:Nullable<TSDictionary<TSLeafNode>>
    merge?:TSDictionary | null ;
    reference?:TSDictionary | null ;
    acceptsUnparsed?: boolean | null ;
}
/** @deprecated use TSParsedEnvOptions */
export type $parsedEnvOptions = TSParsedEnvOptions ;

/* WARNING: dont pass process.env in merge here, 
            because it's not a real Dictionary 
            and all values will turn as strings
            even parsed onces 
*/
export function $parsedenv(source:Nullable<string|TSDataLike>, opts:TSParsedEnvOptions):TSDictionary|null {
    const tmp = {...opts} ;
    delete tmp['parser'] ;
    delete tmp['acceptsUnparsed'] ;
    return _parsenv('$parsedenv', source, opts.parser, !!opts.acceptsUnparsed, {...tmp}) ;
}

function _parsenv(fn:string, source:Nullable<string|TSDataLike>, parserDefinition:Nullable<TSDictionary<TSLeafNode>>, acceptsUncheckedItems:boolean, opts:TSEnvOptions):TSDictionary|null {
    const parser = $ok(parserDefinition) ? _envParser(fn, parserDefinition!, acceptsUncheckedItems) : undefined ;
    const ret:TSDictionary = $ok(opts?.merge) ? opts!.merge! : {} ;
    const backup = $ok(opts?.merge) ? new EnvMergeBackup(ret) : undefined ;
    const unary:Nullable<TSDictionary> = $ok(parser) ? {} : undefined ;
    const ctx = _envParsingContext(opts) ;
    if (!$ok(source)) { 
        if (ctx.debug) { $logterm("&R&w $env(): called with a null or undefined source  &0") ; }
        return ret ;
    }
    const lines = $lines($isstring(source) ? source : $charset(opts?.encoding).stringFromData(source)) ;
    if (!_interpretEnvLines(lines, ret, unary, backup, ctx)) { return null ; }
    if (!$ok(parser)) { return ret ; }

    const errors:string[]|undefined = ctx.debug ? [] : undefined ;
    const parsedUnary = parser!.interpret(unary, { context:TSParserActionContext.env, errors:errors }) ;
    if ($ok(parsedUnary)) { return {...ret, ...parsedUnary!} ; }
    backup?.restore() ; // restore our previous environment before merging
    return null ; 
}

interface EnvParsingContext {
    reference:TSDictionary ;
    underscoreMax:uint ;
    variableMax:uint ;
    debug:boolean ;
}

function _envParsingContext(opts:TSEnvOptions):EnvParsingContext {
    const variableMax = Math.min(Math.max(1, $unsigned(opts?.variableMax, 64 as uint)), 256) as uint ;
    return {
        reference:$ok(opts?.reference) ? opts!.reference! : {},
        underscoreMax:Math.min(Math.max(1, $unsigned(opts?.underscoreMax, 2 as uint)), 8, variableMax) as uint,
        variableMax:variableMax,
        debug:!!opts?.debug
    } ;
}

// keeps track of the modifications made to a merged environment in order to restore it
class EnvMergeBackup {
    private readonly previous:Array<{k:string, p:any}> = [] ;
    private readonly toBeDeleted:string[] = [] ;
    public constructor(private readonly env:TSDictionary) {}

    public save(key:string) {
        if ($defined(this.env[key])) { this.previous.push({k:key, p: this.env[key]}); }
        else { this.toBeDeleted.push(key) ; }    
    }

    public restore() {
        this.toBeDeleted.forEach(k => delete this.env[k]) ;
        this.previous.forEach(def => this.env[def.k] = def.p) ;
    }
}

// returns false if one line is not valid
function _interpretEnvLines(lines:string[], ret:TSDictionary, unary:Nullable<TSDictionary>, backup:Nullable<EnvMergeBackup>, ctx:EnvParsingContext):boolean {
    for (let i = 0, n = lines.length ; i < n ; i++) {
        const [key, value] = _interpretEnvLine(ret, lines[i].rtrim(), i + 1, ctx) ;
        if (key === 'void') { continue ; }
        if (!key.length) { return false ; }
        if (!$issafekey(key)) { continue ; } // '__proto__', 'constructor' and 'prototype' are ignored
        backup?.save(key) ;
        ret[key] = value ;
        if ($ok(unary)) { unary![key] = value ; }
    }
    return true ;
}

function _envParser(fn:string, parserDefinition:TSDictionary<TSLeafNode>, acceptsUncheckedItems:boolean):TSParser {
    const parserStructure:TSObjectNode = { _mandatory: true, _acceptsUncheckedItems:acceptsUncheckedItems } ;
    const nameSet = new Set<string>() ;
    let n = 0 ;
    for (let [name, d] of Object.entries(parserDefinition)) {
        name = $ftrim(name) ;
        if (name.length === 0) { TSError.throw(`${fn}(): found empty name definition`, parserDefinition) ; }
        if (_normarg(name) !== name || name.length < 2) { TSError.throw(`${fn}(): found bad name for env var '${name}'`, parserDefinition) ; }
        if (nameSet.has(name)) { TSError.throw(`${fn}(): found duplicate name definition '${name}'`, parserDefinition) ; }
        nameSet.add(name) ;
        const localParser = $isstring(d) || $ok((d as any)._type) ? TSParser.define(d) : undefined ;
        // an unknown type gives an invalid parser, not a null one
        if (!localParser?.isValid) { TSError.throw(`${fn}(): bad parser definition for env var '${name}'`, parserDefinition) ; }
        (parserStructure as any)[name] = d ; 
        n++ ;
    }
    if (n === 0) { TSError.throw(`${fn}(): no definition found in environment parser`, parserDefinition) ; }
    const parser = TSParser.define(parserStructure) ;
    if (!$ok(parser)) { TSError.throw(`${fn}(): impossible to define environment parser structure`, parserDefinition) ; }
    return parser! ;
}

export type TSArgumentDictionary = TSDictionary<TSArgument|TSLeafNode> ;

export interface TSArgument {
    struct:TSLeafNode ;
    noDoubleDash?:boolean ;
    defaultValue?:any ;
    short?:string ;
    negative?:string ;
    negativeShort?:string ;
}

export interface TSArgsOptions {
    errors?:string[] | null ;
    arguments?:URL|TSURL|string[] | null ;
    processName?:string | null ;
    exitError?:number | null ;
}
// if an url is specfied, we take the arguments from it
// if there's nothin we try from the process itself
export function $args(definition:TSArgumentDictionary, opts?:Nullable<TSArgsOptions>):[TSDictionary|null, string[]] {
    const isURL = opts?.arguments instanceof URL || opts?.arguments instanceof TSURL ;
    const url:Nullable<TSURL> = isURL ? _argumentsURL(opts!.arguments as URL|TSURL) : undefined ;

    const vargs:any = process && process !== null && typeof process !== 'undefined' ? process?.argv : undefined ;
    const isvargs = !isURL && $isarray(vargs) ;
    const passedargs = $isarray(opts?.arguments) ;

    const ctx:ArgsDefinitionContext = {
        definition:definition,
        prefix:isURL ? '':'-',
        ref:new Map(),
        nameSet:new Set<string>(),
        parserStructure:{ _mandatory: true },
        defaults:[]
    } ;
    
    let n = 0 ;
    for (let [name, d] of Object.entries(definition)) { 
        _defineArgument(ctx, name, d) ; // throws if the argument cannot be defined
        n++ ;
    }
    if (n === 0) { TSError.throw("$args(): no arguments defined", definition) ; }

    const parser = TSParser.define(ctx.parserStructure) ;
    let dict:TSDictionary|null = null ;
    let args:string[] = [] ;

    if (!$ok(parser)) { TSError.throw("$args(): unable to generate parser", { structure:ctx.parserStructure, errors:opts?.errors}) }
    if (isURL) {
        // we parse an url query
        dict = parser!.interpret(_dictionaryFromURLQuery(url!, ctx.ref, opts?.errors), { errors:opts?.errors, context:'url' }) ;
    }
    if (isvargs || passedargs) {
        // we parse a process args array
        [dict, args] = _interpretVarArgs(parser!, passedargs ? opts?.arguments as string[] : process?.argv?.slice(2), ctx.ref, opts?.errors) ;
    }
    if ($isnumber(opts?.exitError) && opts.exitError !== 0) {
        $argCheck($toint(opts.exitError), opts.errors, opts.processName) ;
    }
    if ($ok(dict)) {
        ctx.defaults.forEach(c => { if (!$ok(dict![c.name])) { dict![c.name] = c.value ; }})
    }
    return [dict, args] ;
}

export function $argCheck(exitStatus:number, errors:Nullable<string[]|TSArgsOptions>, processName?:Nullable<string>) {
    const err = _argErrors(errors) ;
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
interface ArgsDefinitionContext {
    definition:TSArgumentDictionary ;
    prefix:string ;                         // '-' for process arguments, '' for url queries
    ref:Map<string, TSArgumentParser> ;     // all the accepted keys (with their prefix)
    nameSet:Set<string> ;
    parserStructure:TSObjectNode ;
    defaults:Array<{name:string, value:any}> ;
}

interface ArgumentNames {
    short:string ;          // short version of the argument
    nname:string ;          // negative version of the argument
    nshort:string ;         // short negative version of the argument
    doubledash:boolean ;    // argument has a double dash version
}

function _argumentsURL(a:URL|TSURL):Nullable<TSURL> { return a instanceof TSURL ? a : TSURL.from(a) ; }

// throws if the argument cannot be defined
function _defineArgument(ctx:ArgsDefinitionContext, name:string, d:TSArgument|TSLeafNode) {
    name = $ftrim(name) ;
    if (name.length === 0) { TSError.throw('$arg(): found empty name definition', ctx.definition) ; }
    if (_normarg(name) !== name || name.length < 2) { TSError.throw(`$arg(): found bad name for argument '${name}'`, ctx.definition) ; }
    if (ctx.nameSet.has(name)) { TSError.throw(`$args(): argument '${name}' is declared twice`, ctx.definition) ; }
    // NOTE: if one of the argument's keys is already used, we get a bad structure definition error
    const defined = typeof d === 'string' ? _defineSimpleArgument(ctx, name, d) : _defineStructuredArgument(ctx, name, d) ;
    if (!defined) { TSError.throw(`bad structure definition for argument '${name}'`, { name:name, structure:d }) ; }
}

// returns false if the argument cannot be defined
function _defineSimpleArgument(ctx:ArgsDefinitionContext, name:string, d:TSLeafNode):boolean {
    const prefix = ctx.prefix ;
    if (ctx.ref.has(prefix+name) || (prefix.length > 0 && ctx.ref.has(prefix+prefix+name))) { return false ; }
    if (!TSParser.define(d)?.isValid) { return false ; }
    ctx.nameSet.add(name) ;
    (ctx.parserStructure as any)[name] = d ;
    const def:TSArgumentParser = { name:name, positive:d === 'boolean' || d === 'boolean!' ? true : undefined }
    ctx.ref.set(prefix+name, def) ; 
    if (prefix.length) { ctx.ref.set(prefix+prefix+name, def) ; } 
    return true ;
}

// returns false if the argument cannot be defined
function _defineStructuredArgument(ctx:ArgsDefinitionContext, name:string, d:TSArgument|TSLeafNode):boolean {
    const ds = $ok((d as any)._type) ? { struct:d as TSExtendedLeafNode } as TSArgument : d as TSArgument ;
    const short = $string(ds.short) ;
    const isBoolean = $isstring(ds.struct) ? 
                      ds.struct === 'boolean' || ds.struct === 'boolean!' : 
                      (ds.struct as TSExtendedLeafNode)._type === 'boolean' ;
    const names:ArgumentNames = {
        short:short,
        nname:isBoolean ? $string(ds.negative) : '',
        nshort:isBoolean ? $string(ds.negativeShort) : '',
        doubledash:!ds.noDoubleDash && ctx.prefix.length > 0
    } ;
    _checkArgumentNames(name, d, names) ;

    const positiveKeys = _positiveArgumentKeys(ctx.prefix, name, names) ;
    if ([...positiveKeys, ..._negativeArgumentKeys(ctx.prefix, names, true)].some(k => ctx.ref.has(k))) { return false ; }

    const parser = TSParser.define(ds.struct) ;
    if (!parser?.isValid) { return false ; }
    if (isBoolean && parser?.mandatory && names.nname.length === 0 && names.nshort.length === 0) {
        TSError.throw(`$args(): argument '${name}' cannot be mandatory and have no negative version`, { name:name, structure:d })
    }

    (ctx.parserStructure as any)[name] = ds.struct ;
    ctx.nameSet.add(name) ;
    if ($ok(ds.defaultValue)) { ctx.defaults.push({name:name, value:ds.defaultValue}) ; }
    const def:TSArgumentParser = { name:name, positive:isBoolean ? true : undefined } ;
    positiveKeys.forEach(k => ctx.ref.set(k, def)) ;
    const ndef:TSArgumentParser = { name:name, positive:isBoolean ? false : undefined } ;
    _negativeArgumentKeys(ctx.prefix, names, ctx.prefix.length > 0).forEach(k => ctx.ref.set(k, ndef)) ;
    return true ;
}

function _checkArgumentNames(name:string, d:TSArgument|TSLeafNode, names:ArgumentNames) {
    const { short, nname, nshort } = names ;
    if (nname.length === 1 || (nname.length > 1 && (_normarg(nname) !== nname || nname === name))) {
        TSError.throw(`$args(): bad definition for negative name version of argument '${name}'`, { name:name, structure:d })
    }
    if (short.length > 1 || (short.length === 1 && (_normarg(short) !== short || short === nshort))) {
        TSError.throw(`$args(): bad definition for short version of argument '${name}'`, { name:name, definition:d })
    }
    if (nshort.length > 1 || (nshort.length === 1 && (_normarg(nshort) !== nshort || short === nshort))) {
        TSError.throw(`$args(): bad definition for negative short version of argument '${name}'`, { name:name, structure:d })
    }
}

function _positiveArgumentKeys(prefix:string, name:string, names:ArgumentNames):string[] {
    const keys = [prefix+name] ;
    if (names.doubledash) { keys.push(prefix+prefix+name) ; }
    if (names.short.length === 1) { keys.push(prefix+names.short) ; }
    return keys ;
}

function _negativeArgumentKeys(prefix:string, names:ArgumentNames, withShortVersion:boolean):string[] {
    const keys:string[] = [] ;
    if (names.nname.length > 1) {
        keys.push(prefix+names.nname) ;
        if (names.doubledash) { keys.push(prefix+prefix+names.nname) ; }
    }
    if (withShortVersion && names.nshort.length === 1) { keys.push(prefix+names.nshort) ; }
    return keys ;
}

function _interpretVarArgs(parser:TSParser, args:Nullable<string[]>, ref:Map<string, TSArgumentParser>, errors:Nullable<string[]>):[TSDictionary|null, string[]] {
    let [dict, remains] = _argumentsFromVarArgs(args, ref, errors) ;
    if (!$ok(dict)) { return [dict, remains] ; }

    const interpretErrors:string[] = [] ; 
    dict = $valueornull(parser.interpret(dict, { errors:interpretErrors, context:TSParserActionContext.vargs })) as TSDictionary | null ; 
    if (!$ok(dict) && $ok(errors)) {
        interpretErrors.forEach(e => {
            // the root value is named value in the parser error messages (the errors detected by the root
            // object, like a missing mandatory argument, used to be named value and were lost here)
            const m = /^value\.(\S+)\s+(\S.*)$/.exec(e) ; // \s+ and \S are disjoint: no backtracking
            errors?.push($ok(m) ? `Argument '-${m![1]}' ${m![2]}` : e) ;
        }) ;
    }
    return [dict, remains] ;
}

// adds a value to an argument which can be repeated
function _addArgumentValue(dict:TSDictionary, name:string, value:any) {
    const v = dict[name] ;
    if (!$ok(v)) { dict[name] = value ; }
    else if ($isarray(v)) { v.push(value) ; }
    else { dict[name] = [v, value] ; }
}

function _dictionaryFromURLQuery(url:TSURL, ref:Map<string, TSArgumentParser>, errors:Nullable<string[]>):TSDictionary|null {
    let doomed = false ;
    const dict:TSDictionary = {} ;

    for (const [key, value] of url.searchParams) {
        if (key.length === 0 || !$ok(value)) { continue ; }
        const def = ref.get(key) ;
        if (!$ok(def)) { errors?.push(`Unknown argument '${key}'.`) ; doomed = true ; }
        else if ($ok(def!.positive)) { dict[def!.name] = def!.positive ? value :_inversedValue(value) ; }
        else { _addArgumentValue(dict, def!.name, value) ; }
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
    args?.forEach(a => { if (!_explodeArgument(a, ref, finalArgs, errors)) { doomed = true ; } }) ;
    const remains:string[] = [] ;
    if (doomed) { return [null, remains] ; }
    
    let lastArg:string = '' ;
    let lastDef:TSArgumentParser|undefined = undefined ;
    const dict:TSDictionary = {} ;
    finalArgs.forEach( a => {
        if (lastArg.length) {
            if (a.startsWith('-')) { errors?.push(`Found no value for argument '${lastArg}'.`) ; doomed = true ; }
            else { _addArgumentValue(dict, lastDef!.name, a) ; }
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

// pushes the argument (exploded if needed) in finalArgs. Returns false if the argument is not valid
function _explodeArgument(a:string, ref:Map<string, TSArgumentParser>, finalArgs:string[], errors:Nullable<string[]>):boolean {
    if (!a.startsWith('-')) { finalArgs.push(a) ; return true ; }
    const len = a.length ; 
    if (len === 1) { errors?.push('Solitary dash (-) was found as an argument.') ; return false ; }
    if (a.startsWith('--')) {
        if (len === 2 ){ errors?.push('Solitary double dash (--) was found as an argument.') ; return false ; }
        if (!ref.has(a)) { errors?.push(`Unknown argument '${a}'.`) ; return false ; } 
        finalArgs.push(a) ;
        return true ;
    }
    if (ref.has(a)) { finalArgs.push(a) ; return true ; }
    return _explodeShortArguments(a, ref, finalArgs, errors) ;
}

// explodes args like -cvf in -c -v -f
function _explodeShortArguments(a:string, ref:Map<string, TSArgumentParser>, finalArgs:string[], errors:Nullable<string[]>):boolean {
    const len = a.length ; 
    let valid = true ;
    let fn = 1 ;
    for ( let i = 1 ; i < len ; i++) {
        if (!ref.has('-'+a[i])) { errors?.push(`Unknown argument '-${a[i]}'.`) ; valid = false ; continue ; }
        finalArgs.push('-'+a[i]) ;
        fn ++ ;
    }
    if (fn < len && len > 2) {
        errors?.push(`Unknown argument '${a}'.`) ; valid = false ;
    }
    return valid ;
}

function _normarg(s:Nullable<string>):string { return $ascii($normspaces(s, {strict:true, replacer:''})) ; }

function _interpretEnvLine(env:TSDictionary, line:string, index:number, ctx:EnvParsingContext):[string, string] {
    return new EnvLineParser(env, line, index, ctx).parse() ;
}

const _ENV_DOUBLE_QUOTE = 0x22 as unichar ;
const _ENV_DOLLAR       = 0x24 as unichar ;
const _ENV_QUOTE        = 0x27 as unichar ;
const _ENV_ZERO         = 0x30 as unichar ;
const _ENV_NINE         = 0x39 as unichar ;
const _ENV_EQ           = 0x3D as unichar ;
const _ENV_A            = 0x41 as unichar ;
const _ENV_Z            = 0x5A as unichar ;
const _ENV_BACKSLASH    = 0x5C as unichar ;
const _ENV_UNDERSCORE   = 0x5F as unichar ;
const _ENV_LOWER_U      = 0x75 as unichar ;
const _ENV_LCB          = 0x7B as unichar ;
const _ENV_RCB          = 0x7D as unichar ;

// backslashed characters in values (\u is treated apart, all other characters stand for themselves)
const _envEscapedChars:{[c:number]:string} = { 0x62:'\b', 0x66:'\f', 0x6E:'\n', 0x72:'\r', 0x74:'\t' } ;

enum EnvValueState {
    Text = "TEXT",
    Substitution = "SUBS",
    SubstitutionLetter = "SUBL",
    SubstitutionVar = "SUBV",
    Backslash = "BACK",
    Unicode = "HEXA",
    Stop = "STOP"
} ;

function _envUpper(c:number):unichar { return (c & 0x00df) as unichar ; }
function _envIsLetter(c:number) { c = _envUpper(c) ; return c >= _ENV_A && c <= _ENV_Z ; }
function _envIsVarChar(c:number) { return c === _ENV_UNDERSCORE || _envIsLetter(c) || (c >= _ENV_ZERO && c <= _ENV_NINE) ; }
function _envIsSpace(c:number) { return c.isStrictWhiteSpace() ; }

// parses one line of a .env file. All the parsing methods return false on error
class EnvLineParser {
    private readonly len:number ;
    private p = 0 ;                                 // current position in line
    private vl = 0 ;                                // current variable length
    private last:unichar|undefined = undefined ;    // the quote surrounding the value if any
    private state = EnvValueState.Text ;           // value automat state
    private p0 = 0 ;                                // start of the current text part of the value
    private v = '' ;                                // the value
    private uc = 0 ;                                // \u unicode char
    private us = 0 ;                                // \u unicode char digits

    public constructor(
        private readonly env:TSDictionary,
        private readonly line:string,
        private readonly index:number,
        private readonly ctx:EnvParsingContext
    ) { this.len = line.length ; }

    // returns ['void', ''] for empty or commentary lines and ['', ''] on error
    public parse():[string, string] {
        this._skipSpaces() ; // space at start of line
        if (this._atEndOrComment()) { return ['void', ''] ; } // empty line or line with only commentaries
        if (!this._parseExport()) { return ['', ''] ; }
        const keyStart = this.p ;
        if (!this._parseKey()) { return ['', ''] ; }
        const afterKey = this.p ;
        if (!this._parseEqualSign()) { return ['', ''] ; }
        if (this.p === this.len) { return [this.line.slice(keyStart, afterKey), ''] ; }
        if (!this._parseValue() || !this._parseLineEnd()) { return ['', ''] ; }
        return [this.line.slice(keyStart, afterKey), this.v] ;
    }

    private _code(pos:number):number { return this.line.charCodeAt(pos) ; } // NOSONAR: the parser moves one UTF-16 code unit at a time (a code point would duplicate the low surrogate of an escaped astral character)

    // returns the number of skipped spaces
    private _skipSpaces():number {
        const start = this.p ;
        while (this.p < this.len && _envIsSpace(this._code(this.p))) { this.p ++ ; }
        return this.p - start ;
    }

    private _atEndOrComment():boolean { return this.p === this.len || this.line.charAt(this.p) === '#' ; }

    private _parseExport():boolean {
        if (this.line.slice(this.p, this.p+6) !== "export") { return true ; }
        this.p += 6 ; 
        const ws = this._skipSpaces() ; // space after export
        if (this._atEndOrComment()) {
            if (this.ctx.debug) { $logterm(`&R&w $env(): line #${this.index} only contains 'export' keyword  &0`) ; }
            return false ;
        }
        if (!ws) {
            if (this.ctx.debug) { $logterm(`&R&w $env(): line #${this.index} 'export' keyword must be followed at least one space character  &0`) ; }
            return false ;
        }
        return true ;
    }

    private _parseKey():boolean {
        while (this.p < this.len && this._code(this.p) === _ENV_UNDERSCORE) {
            this.vl++ ; if (this.vl > this.ctx.underscoreMax) { return this._underscoreOverload(this.p, "var") ; }
            this.p++ ;
        }
        if (this.p === this.len) { return this._incompleteLine("underscore var only") ; }
        
        if (!_envIsLetter(this._code(this.p))) { return this._badchar(this.p, "var start") ; }
        this.vl++ ; if (this.vl > this.ctx.variableMax) { return this._variableOverload(this.p, "var #1") ; }
        this.p ++ ; if (this.p === this.len) { return this._incompleteLine("NO = sign #1") ; }
        
        while (this.p < this.len && _envIsVarChar(this._code(this.p))) {
            this.vl++ ; if (this.vl > this.ctx.variableMax) { return this._variableOverload(this.p, "var #2") ; }
            this.p ++ ; 
        }
        return true ;
    }

    private _parseEqualSign():boolean {
        this._skipSpaces() ; // space before =
        if (this.p === this.len) { return this._incompleteLine("NO = sign #2") ; }
        if (this._code(this.p) !== _ENV_EQ) { return this._badchar(this.p, "NO =") ; }
        this.p++ ;
        this._skipSpaces() ; // space after =
        return true ;
    }

    private _parseValue():boolean {
        const c0 = this._code(this.p) ;
        if (c0 === _ENV_DOUBLE_QUOTE || c0 === _ENV_QUOTE) { 
            this.last = c0 as unichar ; 
            this.p ++ ; if (this.p === this.len) { return this._incompleteLine("value never started") ; }
        }
        this.p0 = this.p ;
        while (this.p < this.len && this.state !== EnvValueState.Stop) {
            if (!this._parseValueChar(this._code(this.p))) { return false ; }
            this.p++ ; 
        }
        if (this.state === EnvValueState.Text) {
            if ($ok(this.last)) { return this._incompleteLine(`NO string value end (${this.last})`) ; } // when decoding '' or "" values, we need to be in stop state at the end
            this.v += this.line.slice(this.p0, this.p) ; 
            return true ;
        }
        return this.state === EnvValueState.Stop || this._incompleteLine(`BAD state ${this.state}`) ;
    }

    // after the value, we only accept spaces and commentaries
    private _parseLineEnd():boolean {
        this._skipSpaces() ;
        if (this.p < this.len && this.line.charAt(this.p) !== '#') { return this._badchar(this.p, '#') ; }
        return true ;
    }

    private _parseValueChar(c:number):boolean {
        switch (this.state) {
            case EnvValueState.Text:               return this._textChar(c) ;
            case EnvValueState.Backslash:          return this._backslashedChar(c) ;
            case EnvValueState.Unicode:            return this._unicodeChar(c) ;
            case EnvValueState.Substitution:       return this._substitutionStartChar(c) ;
            case EnvValueState.SubstitutionLetter: return this._substitutionLetterChar(c) ;
            case EnvValueState.SubstitutionVar:    return this._substitutionVarChar(c) ;
            default:                                return true ;
        }
    }

    private _textChar(c:number):boolean {
        if ($ok(this.last) && c === this.last) { this._endTextPart(EnvValueState.Stop) ; }
        else if (c === _ENV_BACKSLASH) { this._endTextPart(EnvValueState.Backslash) ; }
        else if (c === _ENV_DOLLAR && this.last !== _ENV_QUOTE) { this._endTextPart(EnvValueState.Substitution) ; }
        return true ;
    }

    private _endTextPart(newState:EnvValueState) {
        this.v += this.line.slice(this.p0, this.p) ;
        this.state = newState ;
    }

    private _backslashedChar(c:number):boolean {
        this.state = EnvValueState.Text ;
        this.p0 = this.p + 1 ;
        if (c === _ENV_LOWER_U) { this.uc = 0 ; this.us = 0 ; this.state = EnvValueState.Unicode ; }
        else { this.v += _envEscapedChars[c] ?? String.fromCodePoint(c) ; }
        return true ;
    }

    private _unicodeChar(c:number):boolean {
        const hexa = c.hexaValue() ;
        if (hexa < 0) { return this._badchar(this.p, String.raw`\u[${this.us}]`) ; }
        this.uc = (this.uc << 4) | hexa ;
        this.us ++ ;
        if (this.us === 4) {
            this.v += String.fromCodePoint(this.uc) ;
            this.state = EnvValueState.Text ;
            this.p0 = this.p + 1 ;
        }
        return true ;
    }

    private _substitutionStartChar(c:number):boolean {
        if (c !== _ENV_LCB) { return this._badchar(this.p, '{') ; }
        this.p0 = this.p + 1 ;
        this.vl = 0 ;
        this.state = EnvValueState.SubstitutionLetter ;
        return true ;
    }

    private _substitutionLetterChar(c:number):boolean {
        if (_envIsLetter(c)) { 
            this.state = EnvValueState.SubstitutionVar ; 
            this.vl++ ; if (this.vl > this.ctx.variableMax) { return this._variableOverload(this.p, "substitution #1") ;}
        }
        else if (c !== _ENV_UNDERSCORE) { return this._badchar(this.p, "substitution '_'") ; }
        this.vl++ ; if (this.vl > this.ctx.underscoreMax) { return this._underscoreOverload(this.p, "substitution") ; }
        return true ;
    }

    private _substitutionVarChar(c:number):boolean {
        if (c === _ENV_RCB) { this._substitute() ; }
        else if (!_envIsVarChar(c)) { return this._badchar(this.p, '}') ; }
        this.vl++ ; if (this.vl > this.ctx.variableMax) { return this._variableOverload(this.p, "substitution #2") ; }
        return true ;
    }

    private _substitute() {
        const variable = this.line.slice(this.p0, this.p) ;
        let variableValue:any = this.env[variable] ;
        if (!$ok(variableValue)) { variableValue = this.ctx.reference[variable] ; }
        variableValue = $string(variableValue) ;
        if ($length(variableValue) > 0) { this.v += variableValue! ; }
        this.state = EnvValueState.Text ;
        this.p0 = this.p + 1 ;
    }

    // ---------- errors (all these methods return false)
    private _tag(tag:string):string { return tag.length?' ['+tag+']':'' ; }

    private _badchar(pos:number, tag:string = ''):false {
        const c = this._code(pos) ;
        if (this.ctx.debug) { $logterm(String.raw`&R&w $env(): found wrong character '${String.fromCodePoint(c)}' (\U${c.toHex4()}) at position ${pos+1} and line #${this.index}${this._tag(tag)}  &0`) ; }
        return false ;
    }

    private _underscoreOverload(pos:number, tag:string = ''):false {
        if (this.ctx.debug) { $logterm(`&R&w $env(): found more than ${this.ctx.underscoreMax} '_' character in variable or substitution at position ${pos+1} and line #${this.index}${this._tag(tag)}  &0`) ; }
        return false ;
    }

    private _variableOverload(pos:number, tag:string = ''):false {
        if (this.ctx.debug) { $logterm(`&R&w $env(): found variable or subsitution variable longer than than ${this.ctx.variableMax} at position ${pos+1} and line #${this.index}${this._tag(tag)}  &0`) ; }
        return false ;
    }

    private _incompleteLine(tag:string=''):false {
        if (this.ctx.debug) { $logterm(`&R&w $env(): line #${this.index} is incomplete${this._tag(tag)}  &0\n&o"&y${this.line}&o"&0`) ; }
        return false ;
    }
}

function _argErrors(errors:Nullable<string[]|TSArgsOptions>):Nullable<string[]> {
    if ($isarray(errors)) { return errors as string[] ; }
    return $ok(errors) ? (errors as TSArgsOptions).errors : undefined ;
}
