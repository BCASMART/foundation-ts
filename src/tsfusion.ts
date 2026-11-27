import { $capacityForCount, $defined, $ismethod, $isnumber, $length, $ok, $string } from "./commons";
import { $equal } from "./compare";
import { __uint8ArrayFromDataLike } from "./data";
import { $charset, EncodingOrCharset, TSCharset } from "./tscharset";
import { TSData } from "./tsdata";
import { TSDate } from "./tsdate";
import { TSError } from "./tserrors";
import { TSFusionContextType, TSFusionNodeType, TSFusionTreeNode } from "./tsfusionnode";
import { Bytes, NormativeStringEncoding, Nullable, TSDataLike, TSDictionary, uint, uint8 } from "./types";
import { $inspect, $jsonparse, $logterm } from "./utils";

export type TSFusionProcedure = (data:any, rootData:any, localContext:TSDictionary, globalContext:TSDictionary, system:TSDictionary) => any ;
/* 
    in one of these user functions (procedures) you may change things on :
    - data,
    - rootData,
    - localContext (which can locally overwrite real data properties)
    - globalContext

    If you change any value in system TSDictionary, it will be valid 
    in the scope of your procedure and will be discarded immediatly
    after of the end of the procedure.
*/

/** @internal */
export enum TSCharRole {
    UnsignificantStarterChar = 0,
    StarterChar,
    InternalChar,
    ForbiddenChar
} ;

interface TSFusionTemplateOptions {
    startingMark?:string ;
    endingMark?:string ;
    separator?:string ;
    debugParsing?:boolean ;
    procedures?:TSDictionary<TSFusionProcedure> ;
    globalFunctions?:TSDictionary<Function> ;
    addStandardGlobalFunctions?:boolean | null ;
}

export interface TSDataTemplateOptions extends TSFusionTemplateOptions {
    encoding?:EncodingOrCharset ;
}

const [TAB,  LF,   BS,   FF,   CR,   SPACE, EXCLAMATION_MARK, DOUBLE_QUOTE, SHARP, DOLLAR, QUOTE, LPAR, RPAR, ASTERISK, PLUS, COMMA, MINUS, DOT,  SLASH, ZERO, NINE, COLON, LT,   EQ,   GT,   QUESTION_MARK, AT,   A,    Uu,   Z,    BACKSLASH, UNDERSCORE, bu,   fu,   nu,   ru,   tu,   uu,   PIPE   ] = 
      [0x09, 0x0a, 0x0B, 0x0C, 0x0D, 0x20,  0x21,             0x22,         0x23,  0x24,   0x27,  0x28, 0x29, 0x2A,     0x2B, 0x2C,  0x2D,  0x2E, 0x2F,  0x30, 0x39, 0x3A,  0x3C, 0x3D, 0x3E, 0x3F,          0x40, 0x41, 0x55, 0x5A, 0x5C,      0x5F,       0x62, 0x66, 0x6E, 0x72, 0x74, 0x75, 0x7C   ] as uint8[] ;

const FUSION_SPECIAL_CHARS = [SHARP, QUESTION_MARK, EXCLAMATION_MARK, DOLLAR, AT, UNDERSCORE, ASTERISK, PLUS, DOT] ;

const TSFusionNodeTypes:TSFusionNodeType[] = [] ;
TSFusionNodeTypes[SHARP]            = TSFusionNodeType.Enumeration ;
TSFusionNodeTypes[QUESTION_MARK]    = TSFusionNodeType.Test ;
TSFusionNodeTypes[EXCLAMATION_MARK] = TSFusionNodeType.NegativeTest ;

const TSFusionContextTypes:TSFusionContextType[] = [] ;
TSFusionContextTypes[DOLLAR]        = TSFusionContextType.Global ;
TSFusionContextTypes[PLUS]          = TSFusionContextType.User ;
TSFusionContextTypes[AT]            = TSFusionContextType.Root ;
TSFusionContextTypes[UNDERSCORE]    = TSFusionContextType.System ;
TSFusionContextTypes[ASTERISK]      = TSFusionContextType.Procedure ;
TSFusionContextTypes[DOT]           = TSFusionContextType.Local ;

const customInspectSymbol = Symbol.for('nodejs.util.inspect.custom') ;
const TSFusionForbiddenEncodings:Set<string> = new Set(['utf16le', 'utf16be', 'base64', 'base64url', 'hex']) ;
interface TSFusionConstant {
    name:uint8[] ; 
    value:any ;
    len:number ; 
}
export abstract class TSFusionTemplate {
    source:TSData ;
    startingMark:number[] ;
    separator:number[] ;
    endingMark:number[] ;
    protected _capacity:uint = 0 as uint ;

    
    protected _treeRoot:TSFusionTreeNode ;
    protected _procedures:TSDictionary<TSFusionProcedure> = {} ;
    protected _globalFunctions:Nullable<TSDictionary<Function>> ;
    protected _addStandardGlobalFunctions:boolean ;
    protected _variables = new Map<string, Set<TSFusionContextType>>() ;
    protected _contextsVariables = new Map<TSFusionContextType, Set<string>>() ;
    
    public static readonly DefaultStartingMark = '{{' ;
    public static readonly DefaultSeparator    = ':' ;
    public static readonly DefaultEndingMark   = '}}'

    public abstract pushFusionData(data:Bytes):void ;
    public abstract pushFusionValue(value:NonNullable<any>):void ;
    
    public static fromData(source:TSDataLike, encoding?:Nullable<EncodingOrCharset>, opts?:TSFusionTemplateOptions):TSDataTemplate|null
    { return TSDataTemplate.fromData(source, encoding, opts) ; }

    public static fromHTMLData(source:TSDataLike, opts?:TSFusionTemplateOptions):TSHTMLTemplate|null
    { return TSHTMLTemplate.fromHTMLData(source, opts) ; }
                        
    public static fromString(source:string, opts?:TSFusionTemplateOptions):TSStringTemplate|null
    { return TSStringTemplate.fromString(source, opts) ; }

    protected constructor(src:TSDataLike, opts:TSFusionTemplateOptions = {}, paramCharset:TSCharset = TSCharset.utf8Charset() ) {
        const sm = _ascii2data($length(opts.startingMark) ? opts.startingMark! : TSFusionTemplate.DefaultStartingMark) ;
        const em = _ascii2data($length(opts.endingMark) ? opts.endingMark! : TSFusionTemplate.DefaultEndingMark) ;
        const sepa = _ascii2data($length(opts.separator) ? opts.separator! : TSFusionTemplate.DefaultSeparator) ;
        const debug = !!opts.debugParsing ;
        // a plain array element which is not a byte is reported with the class which is built (eg. new TSDataTemplate())
        const source = __uint8ArrayFromDataLike(`new ${new.target.name}()`, src) ; 
 
        if (debug) {
            $logterm(`&0\n&Y&k ${this.constructor.name} parsing in debug mode &0`) ;
            $logterm(`&0&x - &w starting mark&x:        '&o${_data2ascii(sm)}&x'&0`)
            $logterm(`&0&x - &w ending mark&x:          '&o${_data2ascii(em)}&x'&0`)
            $logterm(`&0&x - &w separator&x:            '&o${_data2ascii(sepa)}&x'&0`)
            $logterm('&0&x======== &wsource&x: ========&0\n&y'+$inspect(source)+"&0") ;
        }

        this.validateSeparators(sm, em, sepa) ;
        _checkFusionMarks(source, sm, em, sepa, debug) ;

        const root = new FusionTemplateParser({
            source:source,
            sm:sm,
            em:em,
            sepa:sepa,
            charset:paramCharset,
            constants:_fusionConstants(this),
            variables:this._variables,
            contextsVariables:this._contextsVariables,
            debug:debug
        }).parse() ;

        this.startingMark = sm ;
        this.endingMark = em ;
        this.separator = sepa ;
        this.source = new TSData(source) ; // we keep a copy of the source
        this._treeRoot = root ;
        this._capacity = $capacityForCount(this.source.length * 1.25) ;
        if ($ok(opts.procedures)) { this._procedures = opts.procedures  ; }
        this._globalFunctions = opts.globalFunctions ;
        this._addStandardGlobalFunctions = !!opts.addStandardGlobalFunctions ;
    }

    public get capacity():number { return this._capacity ; }
    public set capacity(n:number) { 
        const c = $capacityForCount(n) ;
        if (c > this._capacity) { this._capacity = c ; } // it used to be added to the current capacity
    }

    get [Symbol.toStringTag](): string { return this.constructor.name ; }
    public toString(): string     { return Object.prototype.toString.call(this) ; }
    public leafInspect(): string  { return Object.prototype.toString.call(this) ; }
    // @ts-ignore
    [customInspectSymbol]() { return this.leafInspect() ; }

    // You may overwrite this method in subclasses. 
    // In that case, you would call super() first
    public validateSeparators(sm:uint8[], em:uint8[], sepa:uint8[]) {
        if ($equal(sm, em) || $equal(sepa, sm) || $equal(sepa, em)) {
            TSError.throw('starting mark, ending mark and separator must be distinct', { startingMark:sm, endingMark:em, separator:sepa}) ;
        }
    }

    public variablesForType(type:TSFusionContextType):string[] { 
        const a = this._contextsVariables.get(type) ; 
        return $ok(a) && a!.size > 0 ? Array.from(a!) : [] ; 
    }

    public isVariableOfType(s:string, type:TSFusionContextType) {
        if (!this.isVariable(s)) { return false }
        const a = this._contextsVariables.get(type) ; 
        return $ok(a) && a!.has(s) ; 
    }

    public get variables():string[] { return Array.from(this._variables.keys()) ; }
    public get userVariables():string[] { return this.variablesForType(TSFusionContextType.User) ; }
    public get globalVariables():string[] { return this.variablesForType(TSFusionContextType.Global) ; }
    public get systemVariables():string[] { return this.variablesForType(TSFusionContextType.System) ; }
    public get localVariables():string[] { return this.variablesForType(TSFusionContextType.Local) ; }
    public get rootVariables():string[] { return this.variablesForType(TSFusionContextType.Root) ; }
    public get procedures():string[] { return this.variablesForType(TSFusionContextType.Procedure) ; }

    public isVariable(s:string):boolean { return $ok(this._variables.get(s)) ; }
    public isUserVariable(s:string):boolean { return this.isVariableOfType(s, TSFusionContextType.User) ; }
    public isGlobalVariable(s:string):boolean { return this.isVariableOfType(s,TSFusionContextType.Global) ; }
    public isSystemVariable(s:string):boolean { return this.isVariableOfType(s,TSFusionContextType.System) ; }
    public isLocalVariable(s:string):boolean { return this.isVariableOfType(s,TSFusionContextType.Local) ; }
    public isRootVariable(s:string):boolean { return this.isVariableOfType(s,TSFusionContextType.Root) ; }
    public isProcedure(s:string):boolean { return this.isVariableOfType(s,TSFusionContextType.Procedure) ; }
    
}

export class TSStringTemplate extends TSFusionTemplate {
    private static readonly __stringCharset:TSCharset = TSCharset.utf8Charset() ;

    private _outputString:string|undefined = undefined ;

    public static fromString(source:string, opts?:TSFusionTemplateOptions):TSStringTemplate|null {
        if (!$length(source)) { return null ; }
        try { return new TSStringTemplate(source, opts) ; }
        catch(e) {
            if (opts?.debugParsing) { $logterm('&0\n&R&w Data Parsing did encounter error &0\n&c'+$inspect(e)+'\n&o'+(e as Error).stack+"&0") ; }
            return null ;
        }
    }

    public constructor(source:string, options?:TSFusionTemplateOptions)
    { super(TSStringTemplate.__stringCharset.dataFromString(source), options, TSStringTemplate.__stringCharset) ; }

    public pushFusionData(data:Bytes):void
    { this._outputString += TSStringTemplate.__stringCharset.stringFromData(data) ; }

    public pushFusionValue(value:NonNullable<any>):void
    { this._outputString += _fusionString(value) ; }

    // the output of a fusion called during another one (eg. by a procedure) does not replace the
    // output of the first one (it used to)
    public fusionWithDataContext(data:any, globalContext:TSDictionary, errors?:string[]):string|null {
        const previousOutput = this._outputString ;
        this._outputString = '' ;
        try {
            return this._treeRoot.fusion(this, data, { 
                globalContext: globalContext, 
                procedures: this._procedures, 
                errors:errors, 
                globalFunctions:this._globalFunctions, 
                addStandardGlobalFunctions:this._addStandardGlobalFunctions
            }) ? this._outputString! : null ;
        }
        finally { this._outputString = previousOutput ; }
    }

    public fusionStringWithDataContext(data:any, globalContext:TSDictionary, errors?:string[]):string|null { return this.fusionWithDataContext(data, globalContext, errors) ; }
}

export abstract class TSGenericDataTemplate extends TSFusionTemplate {
    protected _outputData:TSData|undefined = undefined ;
    
    public pushFusionData(data:Bytes):void
    { this._outputData?.appendBytes(data) ; }

    // the output of a fusion called during another one (eg. by a procedure) does not replace the
    // output of the first one (it used to)
    public fusionWithDataContext(data:any, globalContext:TSDictionary, errors?:string[]):TSData|null {
        const previousOutput = this._outputData ;
        const output = new TSData(this._capacity) ;
        this._outputData = output ;
        try {
            return this._treeRoot.fusion(this, data, { 
                globalContext: globalContext, 
                procedures: this._procedures, 
                errors:errors, 
                globalFunctions:this._globalFunctions,
                addStandardGlobalFunctions:this._addStandardGlobalFunctions
            }) ? output : null ;
        }
        finally { this._outputData = previousOutput ; }
    }
}

/**
 * in HTMLTemplate fusion we don't care in which charset we are
 * since all static text sections are reused as they are and
 * all inserted values are converted to ASCII through html 
 * tag conversion
 */
export class TSHTMLTemplate extends TSGenericDataTemplate {
    private readonly _htmlCharset:TSCharset ;

    public static fromHTMLData(src:TSDataLike, opts?:TSFusionTemplateOptions):TSHTMLTemplate|null {
        const source = __uint8ArrayFromDataLike('TSHTMLTemplate.fromHTMLData()', src) ; 
        if (!$length(source)) { return null ; }  
        try { return new TSHTMLTemplate(source, opts) ; }
        catch(e) {
            if (opts?.debugParsing) { $logterm('&0\n&R&w Data Parsing did encounter error &0\n&c'+$inspect(e)+'\n&o'+(e as Error).stack+"&0") ; }
            return null ;
        }
    }
    
    public constructor(src:TSDataLike, opts?:TSFusionTemplateOptions)
    { 
        const [data, charset] = _parseHTML(__uint8ArrayFromDataLike('new TSHTMLTemplate()', src), opts) ;
        super(data, opts, charset) ;
        this._htmlCharset = charset ;
    }

    // the value is written with the charset of the HTML document, a character which this charset cannot
    // write being given as an HTML character reference (eg. &#8364;). The value of a toHTML() method used
    // to be written in ASCII, so that its non ASCII characters were wrong
    public pushFusionValue(value:NonNullable<any>):void {
        let s = "" ;
        if ($ismethod(value, 'toHTML')) { s = value.toHTML() ; }
        else if ($isnumber(value)) { s = ''+ value ; }
        else { s = _fusionString(value).toHTML() ; }
        if (s.length) { this._outputData?.appendBytes(_htmlBytes(s, this._htmlCharset)) ; }
    }

    public fusionStringWithDataContext(data:any, globalContext:TSDictionary, errors?:string[]):string|null {
        const ret = this.fusionWithDataContext(data, globalContext, errors) ;
        return $ok(ret) ? this._htmlCharset.stringFromData(ret!) : null ;
    }

}

export class TSDataTemplate extends TSGenericDataTemplate {
    protected _charset:TSCharset ;

    // default charset is UTF-8
    public static fromData(src:TSDataLike, encoding?:Nullable<EncodingOrCharset>, opts?:TSFusionTemplateOptions):TSDataTemplate|null {
        const source = __uint8ArrayFromDataLike('TSDataTemplate.fromData()', src) ; 

        if (!$length(source)) { return null ; }
        const charset = $charset(encoding) ;

        if (TSFusionForbiddenEncodings.has(charset.name as NormativeStringEncoding)) { 
            if (opts?.debugParsing) { $logterm(`&0\n&R&w Data Parsing cannot use encoding: '${charset.name}'&0`) ; }
            return null ; 
        }

        try {
            return new TSDataTemplate(source, charset, opts)
        }
        catch(e) {
            if (opts?.debugParsing) { $logterm('&0&R&w Data Parsing did encounter error &0\n&c'+$inspect(e)+'\n&o'+(e as Error).stack+"&0") ; }
            return null ;
        }
    }

    public constructor(source:TSDataLike, charset:TSCharset, opts?:TSFusionTemplateOptions) {
        super(source, opts, charset) ;
        this._charset = charset ;
    }

    public get charset():TSCharset { return this._charset ; }

    // a value with a character which the charset of the template cannot write makes the fusion fail
    // (this character used to be dropped or changed)
    public pushFusionValue(value:NonNullable<any>):void {
        const s = _fusionString(value) ;
        const bytes = this._charset.strictStringToBytes(s) ;
        if (!bytes) {
            const i = this._charset.unencodableIndex(s) ;
            const cp = s.codePointAt(i)! ;
            TSError.throw(`TSDataTemplate: character '${String.fromCodePoint(cp)}' (U+${cp.toString(16).toUpperCase().padStart(4, '0')}) cannot be written in ${this._charset.name}`, {
                value:s, position:i, charset:this._charset.name
            }) ;
        }
        this._outputData?.appendBytes(bytes!) ;
    }

    public fusionStringWithDataContext(data:any, globalContext:TSDictionary, errors?:string[]):string|null {
        const ret = this.fusionWithDataContext(data, globalContext, errors) ;
        return $ok(ret) ? this.charset.stringFromData(ret!) : null ;
    }
    
}

/*
 * This is a very partial HTML parsing since it considers only
 * <fusion> and </fusion> tags, even if they are included inside
 * HTML comentaries or CDATA
 */
const ASCIICharset = TSCharset.asciiCharset() ;

// a Date is given in ISO 8601 in the time zone of the server, with its offset (eg. 2024-05-01T12:20:00+02:00):
// unlike a TSDate, a Date is an instant. Its toString() used to be given (eg. Wed May 01 2024 12:20:00 GMT+0200
// (Central European Summer Time)), in English and depending on the JavaScript engine
function _fusionString(value:any):string {
    return value instanceof Date && !Number.isNaN(value.getTime()) ? _localISOString(value) : $string(value) ;
}

function _localISOString(d:Date):string {
    const y = d.getFullYear() ;
    if (y < 0 || y > 9999) { return d.toISOString() ; } // an extended year, in UTC
    const p2 = (n:number) => String(n).padStart(2, '0') ;
    const offset = -d.getTimezoneOffset() ;
    const a = Math.abs(offset) ;
    const ms = d.getMilliseconds() ;
    return `${String(y).padStart(4, '0')}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}T${p2(d.getHours())}:${p2(d.getMinutes())}:${p2(d.getSeconds())}` +
           (ms ? '.' + String(ms).padStart(3, '0') : '') + `${offset < 0 ? '-' : '+'}${p2(Math.floor(a / 60))}:${p2(a % 60)}` ;
}

// the bytes of an HTML text in the charset of the document: a character which it cannot write is
// given as an HTML character reference
function _htmlBytes(s:string, charset:TSCharset):Bytes {
    const bytes = charset.strictStringToBytes(s) ;
    if (bytes) { return bytes ; }
    let html = '' ;
    for (let i = 0 ; i < s.length ; ) {
        const cp = s.codePointAt(i)! ;
        const n = cp > 0xFFFF ? 2 : 1 ;
        const c = s.slice(i, i + n) ;
        html += charset.canEncode(c) ? c : `&#${cp};` ;
        i += n ;
    }
    return charset.stringToBytes(html) ;
}

function _ascii2data(s:string)
{ return ASCIICharset.bytesFromString(s) ; }

function _data2ascii(d:Nullable<Bytes>, start?:number, end?:number) 
{ return $ok(d) ? ASCIICharset.stringFromBytes(d!, start, end) : '' ; }

function _parseHTML(src:Uint8Array, options?:TSFusionTemplateOptions):[TSData, TSCharset]
{
    const startingMark = $length(options?.startingMark) ? options!.startingMark! : TSFusionTemplate.DefaultStartingMark ;
    const endingMark   = $length(options?.endingMark)   ? options!.endingMark!   : TSFusionTemplate.DefaultEndingMark ;
    const separator    = $length(options?.separator)    ? options!.separator!    : TSFusionTemplate.DefaultSeparator ;
    const debug = !!options?.debugParsing ;
    
    if (debug) {
        $logterm(`&0\n&P&w _parseHTML() is in debug mode &0`) ;
        $logterm(`&0&x - &c starting mark&x:        &p${startingMark}&0`)
        $logterm(`&0&x - &c ending mark&x:          &p${endingMark}&0`)
        $logterm(`&0&x - &c separator&x:            &p${separator}&0`)
    }
    return new HTMLFusionParser(src, _ascii2data(startingMark), _ascii2data(endingMark), _ascii2data(separator), debug).parse() ;
}

// ====================== fusion template parsing ======================

function _fusionUpper(c:number):number { return c & 0xdf ; }
function _isVariableSpace(c:uint8) { return c === TAB || c === SPACE ; }
function _isVariableNum(c:uint8) { return c >= ZERO && c <= NINE ; }
function _variableCharacterRole(c:uint8):TSCharRole {
    if (c === DOT) { return TSCharRole.UnsignificantStarterChar ; }
    if ((_fusionUpper(c) >= A && _fusionUpper(c) <= Z)) { return TSCharRole.StarterChar ; }
    if (_isVariableNum(c) || c === DOT || c === UNDERSCORE) { return TSCharRole.InternalChar ; }
    return TSCharRole.ForbiddenChar ;
}
function _tohex(v:any):string { return $isnumber(v) ? `0x${v.toString(16)}` : `'${v}'` ; }
function _tochar(c:uint8):string { return String.fromCodePoint(c) ; }

// four our simple automatcode to be working properly, 
// constants must be at least 2 character long
// and have different first characters
function _fusionConstants(template:TSFusionTemplate):Array<TSFusionConstant> {
    return [
        { name:_ascii2data('FUTURE'),    value:TSDate.future(), len:6 },
        { name:_ascii2data('NaN'),       value:Number.NaN,      len:3 },
        { name:_ascii2data('PAST'),      value:TSDate.past(),   len:4 },
        { name:_ascii2data('current'),   value:template,        len:7 },
        { name:_ascii2data('false'),     value:false,           len:4 },
        { name:_ascii2data('null'),      value:null,            len:4 },
        { name:_ascii2data('true'),      value:true,            len:4 },
        { name:_ascii2data('undefined'), value:undefined,       len:9 }
    ] ;
}

function _checkFusionMarks(source:Uint8Array, sm:uint8[], em:uint8[], sepa:uint8[], debug:boolean) {
    const len = source.length ;
    const smlen = sm.length ;
    const sepalen = sepa.length ;
    const emlen = em.length ;

    if (debug) {
        $logterm(`&0&x - &w source length&x:         &o${len}&0`)
        $logterm(`&0&x - &w starting mark length&x:  &o${smlen}&0`)
        $logterm(`&0&x - &w ending mark length&x:    &o${emlen}&0`)
        $logterm(`&0&x - &w separator length&x:      &o${sepalen}&0`)
    }

    if (!len || !smlen || !sepalen || !emlen || smlen+emlen+sepalen > len) {
        TSError.throw('template string to small', { startingMark:sm, endingMark:em, separator:sepa, source:source}) ;
    }

    FUSION_SPECIAL_CHARS.forEach(c => {
        if (sm.includes(c) || em.includes(c) || sepa.includes(c)) {
            TSError.throw(`starting mark, ending mark and separator must not contain ${_tohex(c)} ('${_tochar(c)}') character`, { startingMark:sm, endingMark:em, separator:sepa, character:c}) ;
        }
    }) ;

    if (sm[0] === COMMA) {
        TSError.throw('first character of starting mark cannot be a comma', { startingMark:sm, endingMark:em, separator:sepa}) ;
    }
    if (em[0] === LPAR || em[0] === COMMA) {
        TSError.throw('first character of ending mark cannot be a left parenthesis or a comma', { startingMark:sm, endingMark:em, separator:sepa}) ;
    }
    if (sepa[0] === LPAR || sepa[0] === RPAR || sepa[0] === COMMA) {
        TSError.throw('first character of separator cannot be a parenthesis or a comma', { startingMark:sm, endingMark:em, separator:sepa}) ;
    }
    if (sm[0] === em[0] || sm[0] === sepa[0] || em[0] === sepa[0]) {
        TSError.throw('first character of starting mark, ending mark and separator must be distinct', { startingMark:sm, endingMark:em, separator:sepa}) ;
    }
}

// stores the first non empty component of the variable path
function _storeVariable(m:Map<string, Set<TSFusionContextType>>, cm:Map<TSFusionContextType, Set<string>>, variable:string, context:TSFusionContextType) {
    const component = variable.split('.').find(comp => comp.length > 0) ;
    if (!$ok(component)) { return ; }

    let cset = m.get(component!) ;
    if (!$ok(cset)) {
        cset = new Set<TSFusionContextType>() ;
        m.set(component!, cset) ;
    }
    cset!.add(context) ;

    let sset = cm.get(context) ;
    if (!$ok(sset)) {
        sset = new Set<string>() ;
        cm.set(context, sset) ;
    }
    sset!.add(component!) ;
}

enum FusionState {
    Text = 'Text',
    OpenVariable = 'open-var',
    PreVariableSpace = 'pre-var-space', 
    StartDecodingVariable = 'start-decoding-var',
    DecodingVariable = 'decoding-var',
    DecodeEndingMark = 'decoding-end-mark',
    PostVariableSpace = 'post-var-space',
    DecodingClosingVariable = 'decoding-closing-var',
    DecodingSeparator = 'decoding-separator',
    DecodingParameters = 'decoding-parameters',
    NumberParameter = 'decoding-number-param',
    ConstantParameter = 'decoding-constant-param',
    StringParameter = 'decoding-string-param',
    StringParamBackslash = 'decoding-string-param-backslash',
    StringParamUnicode = 'decoding-string-param-unicode',
    AfterParameter = 'decoding-after-param',
    EndOfParameters = 'decoding-closing-params'
} ;

interface FusionTemplateParserOptions {
    source:Uint8Array ;
    sm:uint8[] ;
    em:uint8[] ;
    sepa:uint8[] ;
    charset:TSCharset ;
    constants:Array<TSFusionConstant> ;
    variables:Map<string, Set<TSFusionContextType>> ;
    contextsVariables:Map<TSFusionContextType, Set<string>> ;
    debug:boolean ;
}

// the automat parsing a fusion template and building its tree
class FusionTemplateParser {
    private readonly source:Uint8Array ;
    private readonly len:number ;
    private readonly root:TSFusionTreeNode ;
    private current:TSFusionTreeNode ;
    private state = FusionState.Text ;
    private i = 0 ;
    private tokenPos = 0 ;
    private last = 0 ;
    private beginText = 0 ;
    private variable:string = '' ;
    private parameters:Array<any> = [] ;
    private currentParameter:any = undefined ;
    private currentConstant:TSFusionConstant|undefined = undefined ;
    private stringEnder:uint8 = QUOTE ;
    private fusionContext = TSFusionContextType.Local ;
    private unicodeValue = 0 ;
    private highSurrogate = 0 ; // the high surrogate of a \u surrogate pair, waiting for its low surrogate

    public constructor(private readonly opts:FusionTemplateParserOptions) {
        this.source = opts.source ;
        this.len = opts.source.length ;
        this.root = TSFusionTreeNode.root() ;
        this.current = this.root ;
    }

    public parse():TSFusionTreeNode {
        while (this.i < this.len) {
            const c = this.source[this.i] as uint8 ;
            if (this.opts.debug) {
                $logterm(`&0&g${this.i.fpad(8,'_')}&w: &x&o${_tohex(c)}&x (&b'&c${_tochar(c)}&b'&x), state:&o${this.state}&x, current: &p${this.current.label}&x/&y${this.current.type}&0`) ;
            }
            this._parseChar(c) ;
            this.i++ ;
        }
        if (this.opts.debug) {
            $logterm(`&0&g--STOP--&w: &rEOF&x, state:&o${this.state}&x, current: &p${this.current.label}&0`)
        }

        if ($ok(this.current.parent)) {
            TSError.throw(`Malformed template structure. Template is not properly closed.`, {
                source:this.source,
                state:this.state
            }) ;
        }
        else if (this.state === FusionState.Text || this.state === FusionState.OpenVariable || this.state === FusionState.DecodeEndingMark) {
            this._pushPendingText(this.i) ;
        }
        else {
            TSError.throw(`Malformed template structure. Template is not properly closed (automat in wrong state '${this.state}').`, {
                source:this.source,
                state:this.state
            }) ;
        }
        return this.root ;
    }

    private _parseChar(c:uint8) {
        switch (this.state) {
            case FusionState.Text:                     this._text(c) ; break ;
            case FusionState.OpenVariable:             this._openVariable(c) ; break ;
            case FusionState.PreVariableSpace:         this._preVariableSpace(c) ; break ;
            case FusionState.StartDecodingVariable:    this._startDecodingVariable(c) ; break ;
            case FusionState.DecodingVariable:         this._decodingVariable(c) ; break ;
            case FusionState.DecodingParameters:       this._decodingParameters(c) ; break ;
            case FusionState.AfterParameter:           this._afterParameter(c) ; break ;
            case FusionState.ConstantParameter:        this._constantParameter(c) ; break ;
            case FusionState.NumberParameter:          this._numberParameter(c) ; break ;
            case FusionState.StringParameter:          this._stringParameter(c) ; break ;
            case FusionState.StringParamBackslash:     this._stringParamBackslash(c) ; break ;
            case FusionState.StringParamUnicode:       this._stringParamUnicode(c) ; break ;
            case FusionState.EndOfParameters:          this._endOfParameters(c) ; break ;
            case FusionState.PostVariableSpace:        this._postVariableSpace(c) ; break ;
            case FusionState.DecodingSeparator:        this._decodingSeparator(c) ; break ;
            case FusionState.DecodingClosingVariable:  this._decodingClosingVariable(c) ; break ;
            case FusionState.DecodeEndingMark:         this._decodeEndingMark(c) ; break ;
        }
    }

    // ---------- tools
    private _pushPendingText(end:number) {
        if (this.beginText >= 0 && this.beginText < end) { this.current.pushData(this.source.slice(this.beginText, end)) ; }
    }

    private _pushVariable(type:TSFusionNodeType, parameters?:any[]) {
        this.current = this.current.pushVariable(this.variable, type, this.fusionContext, parameters) ;
        _storeVariable(this.opts.variables, this.opts.contextsVariables, this.variable, this.fusionContext) ;
        this.fusionContext = TSFusionContextType.Local ;
        this.tokenPos = 0 ;
    }

    private _findConstant(c:uint8):TSFusionConstant|undefined {
        return this.opts.constants.find(cst => cst.name[0] === c) ;
    }

    private _forbiddenCharacter(c:uint8, message:string, neededChars?:uint8[]):never {
        const info:TSDictionary = {
            source:this.source,
            character:c,
            position:this.i
        } ;
        if ($ok(neededChars)) { info.neededChars = neededChars ; }
        info.state = this.state ;
        TSError.throw(message, info) ;
    }

    private _forbiddenVariableCharacter(c:uint8, neededChars?:uint8[]):never {
        return this._forbiddenCharacter(c, `Malformed var : found forbidden character ${_tohex(c)} ('${_tochar(c)}') at position ${this.i}.`, neededChars) ;
    }

    // ---------- automat states
    private _text(c:uint8) {
        const { sm, em } = this.opts ;
        if (c === sm[0] || c === em[0]) {
            this.last = this.i ;
            this.tokenPos = 0 ;
            this.state = c === sm[0] ? FusionState.OpenVariable : FusionState.DecodeEndingMark ;
            this.i -- ;
        }
    }

    private _openVariable(c:uint8) {
        const comp = this.opts.sm[this.tokenPos++] ;
        if (c !== comp) {
            this.tokenPos = 0 ; 
            this.state = FusionState.Text ;  
            // we don't change beginText here
            this.i = this.last ; // unstack n-1 characters
        }
        else if (this.tokenPos === this.opts.sm.length) {
            this.tokenPos = 0 ; 
            this.state = FusionState.PreVariableSpace ;
            this._pushPendingText(this.last) ;
            this.beginText = -1 ; // means we have nothing to add as a text node
            this.fusionContext = TSFusionContextType.Local ;
        }
    }

    private _preVariableSpace(c:uint8) {
        if (_isVariableSpace(c)) { return ; }
        const ct = TSFusionContextTypes[c] ;
        if ($ok(ct)) {
            this.fusionContext = ct
            this.tokenPos = this.i + 1 ;
            this.state = FusionState.StartDecodingVariable ;
            return ;
        }
        const characterRole = _variableCharacterRole(c) ;
        if (characterRole === TSCharRole.UnsignificantStarterChar || characterRole === TSCharRole.StarterChar) {
            this.tokenPos = this.i ;
            this.state = characterRole === TSCharRole.UnsignificantStarterChar ? FusionState.StartDecodingVariable : FusionState.DecodingVariable ;
        }
        else {
            this._forbiddenCharacter(c, `Malformed var : found forbidden initial variable character ${_tohex(c)} ('${_tochar(c)}') at position ${this.i}'.`) ;
        }
    }

    private _startDecodingVariable(c:uint8) {
        const characterRole = _variableCharacterRole(c) ;
        if (characterRole === TSCharRole.UnsignificantStarterChar) { return ; }
        if (characterRole === TSCharRole.StarterChar) { this.state = FusionState.DecodingVariable ; }
        else { this._forbiddenVariableCharacter(c) ; }
    }

    private _decodingVariable(c:uint8) {
        const t = TSFusionNodeTypes[c] ;
        if ($ok(t) || _isVariableSpace(c)) {
            this.variable = _data2ascii(this.source.slice(this.tokenPos, this.i)) ;
            this._pushVariable($ok(t) ? t : TSFusionNodeType.Variable) ;
            this.state = FusionState.PostVariableSpace ;
        }
        else if (c === LPAR) {
            this.variable = _data2ascii(this.source.slice(this.tokenPos, this.i)) ;
            this.state = FusionState.DecodingParameters ;
            this.parameters = [] ;
            this.currentParameter = undefined ;
            this.tokenPos = 0 ;
        }
        else if (c === this.opts.em[0]) {
            // here we cannot have the beginning of a separator because we are not in the kind of variable accepting a separator
            this.variable = _data2ascii(this.source.slice(this.tokenPos, this.i)) ;
            this._pushVariable(TSFusionNodeType.Variable) ;
            this.state = FusionState.DecodingClosingVariable ; 
            this.i -- ;
        }
        else if (_variableCharacterRole(c) === TSCharRole.ForbiddenChar) {
            this._forbiddenVariableCharacter(c) ;
        }
    }

    private _decodingParameters(c:uint8) {
        if (c === RPAR) {
            this.state = FusionState.EndOfParameters ;
        }
        else if (c === COMMA) {
            this.parameters.push(this.currentParameter) ;
            this.currentParameter = undefined ;
        }
        else if (c === QUOTE || c === DOUBLE_QUOTE || c === PIPE) {
            // PIPE DELIMITER IS USED FOR DESCRIBING JSON OBJECTS
            // AS PARAMETERS
            this.stringEnder = c ;
            this.currentParameter = new TSData() ;
            this.state = FusionState.StringParameter ;
        }
        else if (_isVariableNum(c) || c === MINUS || c === PLUS || c === DOT) {
            this.tokenPos = this.i ;
            this.state = FusionState.NumberParameter ;
        }
        else {
            this.currentConstant = this._findConstant(c) ;
            if ($defined(this.currentConstant)) {
                this.tokenPos = 1 ;
                this.state = FusionState.ConstantParameter ;
            }
            else if (!_isVariableSpace(c)) { this._forbiddenVariableCharacter(c, [TAB, SPACE]) ; }
        }
    }

    private _afterParameter(c:uint8) {
        if (c === RPAR) {
            this.parameters.push(this.currentParameter) ;
            this.state = FusionState.EndOfParameters ;
        }
        else if (c === COMMA) {
            this.parameters.push(this.currentParameter) ;
            this.currentParameter = undefined ;
            this.state = FusionState.DecodingParameters ;
        }
        else if (!_isVariableSpace(c)) { this._forbiddenVariableCharacter(c, [TAB, SPACE]) ; }
    }

    private _constantParameter(c:uint8) {
        const constant = this.currentConstant! ;
        if (c !== constant.name[this.tokenPos]) {
            // ERROR: wrong constant character
            this._forbiddenCharacter(c, `Malformed var : found forbidden character ${_tohex(c)} ('${_tochar(c)}') at position ${this.i} (wrong parameter constant).`, [constant.name[this.tokenPos]]) ;
        }
        this.tokenPos++ ;
        if (this.tokenPos === constant.len) {
            this.currentParameter = constant.value ;
            this.state = FusionState.AfterParameter ;
        }
    }

    private _numberParameter(c:uint8) {
        if (_isVariableSpace(c) || c === RPAR || c === COMMA) {
            const text = this.opts.charset?.stringFromData(this.source.slice(this.tokenPos, this.i)) ;
            const num = Number(text) ;
            // a malformed number (eg. 1.2.3, - or .) is an error (it used to give 0)
            if (!$isnumber(num)) {
                TSError.throw(`Malformed template structure : malformed number parameter '${text}' ending at position ${this.i}.`, {
                    source:this.source, position:this.i, state:this.state
                }) ;
            }
            this.currentParameter = num ;
            this.state = FusionState.AfterParameter ;
            this.i-- ;
        }
        else if (!_isVariableNum(c) && c !== DOT) {
            this._forbiddenCharacter(c, `Malformed var : found forbidden character ${_tohex(c)} ('${_tochar(c)}') at position ${this.i} (parameter is not numeric).`, 
                                     [ZERO, ZERO+1, ZERO+2, ZERO+3, ZERO+4, ZERO+5, ZERO+6, ZERO+7, ZERO+8, NINE] as uint8[]) ;
        }
    }

    private _stringParameter(c:uint8) {
        if (this.highSurrogate && c !== BACKSLASH) { this._loneSurrogate() ; } // a high surrogate must be followed by a \u low surrogate
        if (c === this.stringEnder) {
            this.currentParameter = this.currentParameter.toString(this.opts.charset) ;
            if (this.stringEnder === PIPE) {
                this.currentParameter = $jsonparse(this.currentParameter) ;
                if (!$defined(this.currentParameter)) {
                    TSError.throw(`Malformed JSON structure terminating at position ${this.i}. Impossible to parse. See 'parsingError' in complement infos.`, { 
                        source:this.source,
                        position:this.i,
                        state:this.state
                    }) ;
                }
            }
            this.state = FusionState.AfterParameter ;
        }
        else if (c === BACKSLASH) { this.state = FusionState.StringParamBackslash ; }
        else { this.currentParameter.appendByte(c) ; }
    }

    private _stringParamBackslash(c:uint8) {
        this.state = FusionState.StringParameter ;
        switch (c) {
            case bu: this.currentParameter.appendByte(BS)  ; break ;
            case fu: this.currentParameter.appendByte(FF)  ; break ;
            case nu: this.currentParameter.appendByte(LF)  ; break ;
            case ru: this.currentParameter.appendByte(CR)  ; break ;
            case tu: this.currentParameter.appendByte(TAB) ; break ;
            case Uu: case uu:
                this.tokenPos = 0 ;
                this.unicodeValue = 0 ;
                this.state = FusionState.StringParamUnicode ;
                break ;
            default:
                this._backslashedASCIICharacter(c) ;
                break ;
        }
    }

    private _backslashedASCIICharacter(c:uint8) {
        if (c >= SPACE && c <= 0x7F) { 
            // we are a visible ASCII character
            this.currentParameter.appendByte(c) ; 
            return ;
        }
        const neededChars:uint8[] = [] ;
        for (let nc = 32 ; nc < 128 ; nc++) { neededChars.push(nc as uint8) ; }
        TSError.throw(`Malformed template structure : found forbidden character ${_tohex(c)} ('${_tochar(c)}') at position ${this.i} (Need to have an ASCII character after backslash in string parameter interpretation).`, { 
            source:this.source,
            character:c,
            position:this.i,
            neededChars:neededChars,
            state:this.state                                    
        }) ;
    }

    private _loneSurrogate():never {
        TSError.throw(String.raw`Malformed template structure : lone surrogate in a \u sequence ending at position ${this.i}.`, {
            source:this.source, position:this.i, state:this.state
        }) ;
    }

    private _stringParamUnicode(c:uint8) {
        const hexa = c.hexaValue() ;
        if (hexa < 0) {
            TSError.throw(String.raw`Malformed template structure : found forbidden character ${_tohex(c)} ('${_tochar(c)}') at position ${this.i} (Need hexa character in string parameter unicode \u sequence).`, { 
                source:this.source,
                character:c,
                position:this.i,
                state:this.state                                    
            }) ;
        }
        this.unicodeValue = (this.unicodeValue << 4) | hexa ;
        this.tokenPos++ ;
        if (this.tokenPos === 4) {
            this.state = FusionState.StringParameter ;
            const u = this.unicodeValue ;
            if (u >= 0xD800 && u <= 0xDBFF && this.highSurrogate === 0) { this.highSurrogate = u ; return ; } // waiting for the low surrogate
            let s:string ;
            if (this.highSurrogate) {
                // a surrogate pair (eg. \uD83D\uDE00) is one character (each half used to be converted alone)
                if (u < 0xDC00 || u > 0xDFFF) { this._loneSurrogate() ; }
                // the code point of the pair, built from its two halves (String.fromCodePoint() is preferred)
                s = String.fromCodePoint(0x10000 + ((this.highSurrogate - 0xD800) << 10) + (u - 0xDC00)) ;
                this.highSurrogate = 0 ;
            }
            else if (u >= 0xDC00 && u <= 0xDFFF) { return this._loneSurrogate() ; }
            else { s = String.fromCodePoint(u) ; }
            const bytes = this.opts.charset.strictStringToBytes(s) ;
            if (!bytes) {
                TSError.throw(`Malformed template structure : unicode character U+${s.codePointAt(0)!.toString(16).toUpperCase()} ending at position ${this.i} cannot be written in ${this.opts.charset.name}.`, {
                    source:this.source, position:this.i, state:this.state
                }) ;
            }
            this.currentParameter.appendBytes(bytes!) ;
        }
    }

    private _endOfParameters(c:uint8) {
        const t = TSFusionNodeTypes[c] ;
        if ($ok(t) || _isVariableSpace(c)) {
            this._pushVariable($ok(t) ? t : TSFusionNodeType.Variable, this.parameters) ;
            this.state = FusionState.PostVariableSpace ;
        }
        else if (c === this.opts.em[0]) {
            // here we cannot have the beginning of a separator because we are not in the kind of variable accepting a separator
            this._pushVariable(TSFusionNodeType.Variable, this.parameters) ;
            this.state = FusionState.DecodingClosingVariable ; 
            this.i -- ;
        }
        else {
            // we should have a fusion node type or a space here
            this._forbiddenVariableCharacter(c) ;
        }
    }

    private _postVariableSpace(c:uint8) {
        const { sm, em, sepa } = this.opts ;
        if (c === em[0]) {
            if (this.current.isContainerVariable) {
                this._forbiddenCharacter(c, `Malformed template structure : found forbidden character ${_tohex(c)} ('${_tochar(c)}') at position ${this.i} (Need to have a separator for a container variable).`, [sm[0]]) ;
            } 
            this.state = FusionState.DecodingClosingVariable ;
            this.i -- ;
            this.tokenPos = 0 ;
        }
        else if (c === sepa[0]) { 
            if (!this.current.isContainerVariable) {
                this._forbiddenCharacter(c, `Malformed template structure : found forbidden character ${_tohex(c)} ('${_tochar(c)}') at position ${this.i} (Separator forbidden for non container variable).`, [em[0]]) ;
            } 
            this.state = FusionState.DecodingSeparator ; 
            this.i -- ;
            this.tokenPos = 0 ;
        }
        else if (!_isVariableSpace(c)) {
            this._forbiddenCharacter(c, `Malformed template structure : found forbidden character ${_tohex(c)} ('${_tochar(c)}') at position ${this.i} (needed separator or ending mark start').`, [sepa[0], em[0]]) ;
        } 
    }

    private _decodingSeparator(c:uint8) {
        const comp = this.opts.sepa[this.tokenPos++] ;
        if (c !== comp) {
            this._forbiddenCharacter(c, `Malformed template structure on variable separator. Unatended character  ${_tohex(c)} ('${_tochar(c)}') at position ${this.i} while decoding separator.`, [comp]) ;
        }
        if (this.tokenPos === this.opts.sepa.length) {
            this.beginText = this.i + 1 ;
            this.state = FusionState.Text ;
            // we have nothing to do here. 
            // Our current node is our variable 
        }
    }

    private _decodingClosingVariable(c:uint8) {
        const comp = this.opts.em[this.tokenPos++] ;
        if (c !== comp) {
            this._forbiddenCharacter(c, `Malformed template structure on closing variable. Unatended character  ${_tohex(c)} ('${_tochar(c)}') at position ${this.i} while decoding ending mark.`, [comp]) ;
        }
        if (this.tokenPos === this.opts.em.length) {
            // we just close here. We do not have any text to add here
            this.current = this.current.parent! ; // a variable has always a parent
            this.state = FusionState.Text ;
            this.beginText = this.i + 1 ;
        }
    }

    private _decodeEndingMark(c:uint8) {
        const em = this.opts.em ;
        const comp = em[this.tokenPos++] ;
        if (c !== comp) {
            this.tokenPos = 0 ; 
            this.state = FusionState.Text ;  
            // we don't change beginText here
            this.i = this.last ; // unstack n-1 characters
            return ;
        }
        if (this.tokenPos !== em.length) { return ; }

        const parent = this.current.parent ;
        if (!$ok(parent)) {
            TSError.throw(`Malformed template structure. We have found a supernumerary ending mark at position ${this.i}.`, {
                source:this.source,
                position:this.i - em.length + 1 ,
                endingMark:em,
                state:this.state
            }) ;    
        }
        this._pushPendingText(this.last) ;
        this.current = parent! ;
        this.state = FusionState.Text ;
        this.beginText = this.i + 1 ;
    }
}

// ====================== HTML fusion template parsing ======================

enum FusionHTMLState {
    Text            = 'text',
    Start           = 'start',
    CloserElement   = 'closer-element',
    Element         = 'element',
    Inside          = 'inside',
    Tag             = 'tag',
    AfterTag        = 'after-tag',
    AfterEqual      = 'after-equal',
    Quote           = 'quote',
    AfterQuote      = 'after-quote',
    Value           = 'value',
    Slash           = 'slash'
} ;

enum FusionHTMLElement {
    Unknown          = '',
    Fusion           = 'FUSION',
    EndFusion        = '/FUSION',
    Meta             = 'META'
}

const _HTMLAssign:{[key in FusionHTMLElement]?:string[]} = {
    'FUSION':['TYPE', 'PATH', 'CONTEXT'],
    'META':['CHARSET'],
    '/FUSION':[]
} ;

const _HTMLFusionTypes:TSDictionary<uint8[]> = {
    'IF':           [QUESTION_MARK],
    'TEST':         [QUESTION_MARK],
    'QUESTION':     [QUESTION_MARK],
    '?':            [QUESTION_MARK],
    'IFNOT':        [EXCLAMATION_MARK],
    'NOT':          [EXCLAMATION_MARK],
    '!TEST':        [EXCLAMATION_MARK],
    '!':            [EXCLAMATION_MARK],
    'ENUM':         [SHARP],
    'ENUMERATION':  [SHARP],
    'LIST':         [SHARP],
    'ARRAY':        [SHARP],
    '#':            [SHARP],
    'VALUE':        [],
    'PATH':         [],
    'VAR':          [],
    'VARIABLE':     [],
    '':             []
} ;

const _HTMLFusionContexts:TSDictionary<uint8[]> = {
    'GLOBAL':       [DOLLAR],
    '$':            [DOLLAR],
    'DICT':         [DOLLAR],
    'DICTIONARY':   [DOLLAR],
    'ROOT':         [AT],
    'INITIAL':      [AT],
    'TEMPLATE':     [AT],
    '@':            [AT],
    'SYS':          [UNDERSCORE],
    'SYSTEM':       [UNDERSCORE],
    '_':            [UNDERSCORE],
    'PROC':         [ASTERISK],
    'PROCEDURE':    [ASTERISK],
    'FN':           [ASTERISK],
    'FUNC':         [ASTERISK],
    'FUNCTION':     [ASTERISK],
    'CALL':         [ASTERISK],
    '*':            [ASTERISK],
    'USER':         [PLUS],
    'USER-DEFINED': [PLUS],
    'PARAM':        [PLUS],
    'PARAMETER':    [PLUS],
    '+':            [PLUS],
    'CURRENT':      [DOT],
    'LOCAL':        [DOT],
    '.':            [DOT],
    '':             [DOT]
} ;

function _isHTMLNameStarterChar(c:number):boolean { c = _fusionUpper(c) ; return c >= A && c <= Z ; }
function _isHTMLNameChar(c:number):boolean { return c === DOT || c === COLON || c === UNDERSCORE || c === MINUS || (c >= ZERO && c <= NINE) || _isHTMLNameStarterChar(c)}
function _isHTMLWhiteSpace(c:number):boolean { return c === TAB || c === SPACE || c === LF || c === CR ; }
function _isHTMLQuote(c:number):boolean { return c === QUOTE || c === DOUBLE_QUOTE ; }

// the automat transforming <fusion> and </fusion> tags in fusion marks
class HTMLFusionParser {
    private readonly len:number ;
    private readonly target:TSData ;
    private readonly standardCharset = TSCharset.utf8Charset() ;
    private currentCharset:TSCharset ;
    private state = FusionHTMLState.Text ;
    private i = 0 ;
    private last = 0 ;
    private lastQuote = 0 ;
    private insideLast = 0 ;
    private tag = '' ;
    private element:FusionHTMLElement = FusionHTMLElement.Unknown ;
    private values:TSDictionary<Uint8Array> = {} ;
    private isCloser = false ;

    public constructor(private readonly src:Uint8Array, private readonly sm:uint8[], private readonly em:uint8[], private readonly sp:uint8[], private readonly debug:boolean) {
        this.len = src.length ;
        this.target = new TSData(this.len) ;
        this.currentCharset = this.standardCharset ;
    }

    public parse():[TSData, TSCharset] {
        while (this.i < this.len) {
            const c = this.src[this.i] ;
            if (this.debug) {
                $logterm(`&0&j${this.i.fpad(8,'_')}&w: &x0x&p${c.toString(16)}&x (&b'&c${String.fromCodePoint(c)}&b'&x), state:&p${this.state}&x, last:&y${this.last}&0`) ;
            }
            this._parseChar(c) ;
            this.i++ ;
            if (this.debug) {
                $logterm(`&0&o${this.i.fpad(8,'_')}&w: ----------, state:&p${this.state}&x, last:&y${this.last}&0`) ;
            }
        }

        // an unterminated element is kept as it is written (src[last] is its '<')
        if (this.state !== FusionHTMLState.Text) { this.target.appendBytes(this.src, this.last, this.i) ; }

        if (this.debug) {
            $logterm(`&0&j--STOP--&w: &rEOF&x, state:&p${this.state}&x, last:&p${this.last}&0`) ;
        }

        return [this.target, this.currentCharset] ;
    }

    private _parseChar(c:number) {
        switch (this.state) {
            case FusionHTMLState.Text:           this._text(c) ; break ;
            case FusionHTMLState.Start:          this._start(c) ; break ;
            case FusionHTMLState.CloserElement:  this._closerElement(c) ; break ;
            case FusionHTMLState.Element:        this._element(c) ; break ;
            case FusionHTMLState.Inside:         this._inside(c) ; break ;
            case FusionHTMLState.Tag:            this._tag(c) ; break ;
            case FusionHTMLState.AfterTag:       this._afterTag(c) ; break ;
            case FusionHTMLState.AfterEqual:     this._afterEqual(c) ; break ;
            case FusionHTMLState.Value:          this._value(c) ; break ;
            case FusionHTMLState.Quote:          this._quote(c) ; break ;
            case FusionHTMLState.AfterQuote:     this._afterQuote(c) ; break ;
            case FusionHTMLState.Slash:          this._slash(c) ; break ;
        }
    }

    // ---------- tools
    private _name(start:number, end:number):string { return _data2ascii(this.src, start, end).toUpperCase() ; }

    private _registerValue(start:number, end:number) {
        if (_HTMLAssign[this.element]?.includes(this.tag)) {
            this.values[this.tag] = this.src.slice(start, end) ;
        }
        this.tag = '' ;
    }

    private _reset() {
        this.state = FusionHTMLState.Text ; 
        this.element = FusionHTMLElement.Unknown ; 
        this.tag = '' ;
        this.last = 0 ; 
        this.values = {} ;
        this.isCloser = false ;
    }

    // not a tag we manage: we output the '<' and restart parsing just after it
    private _back() { 
        this.target.appendByte(LT) ;
        this.i = this.last ; 
        this._reset() ;
    }

    private _endElement() {
        switch (this.element) {
            case FusionHTMLElement.Fusion:
                this._endFusionElement() ;
                return ;
            case FusionHTMLElement.Meta:
                this._updateCharset() ;
                this._copyElement() ;
                break ;
            case FusionHTMLElement.EndFusion:
                this.target.appendBytes(this.em) ;
                break ;
            default: 
                this._copyElement() ;
                break ;
        }
        this._reset() ;
    }

    private _copyElement() {
        this.target.appendBytes(this.src, this.last, this.i) ;
        this.target.appendByte(GT) ;
    }

    private _endFusionElement() {
        const p = this.values['PATH'] ;
        if (!$length(p)) { this._back() ; return ; }
        const c = _HTMLFusionContexts[_data2ascii(this.values['CONTEXT']).toUpperCase()] ;
        const t = _HTMLFusionTypes[_data2ascii(this.values['TYPE']).toUpperCase()] ;
        this.target.appendBytes(this.sm) ; // {{
        this.target.appendBytes(c) ;  // '' or '@' or '$' or '/' or '*' or '+'
        this.target.appendBytes(p) ;  // var itself
        if (t.length) {
            this.target.appendBytes(t) ; // '?' or '!' or '#' ;
            this.target.appendBytes(this.sp) ;
        }
        else {
            this.target.appendBytes(this.em) ; // WARNING: if we have a </fusion> after that, our marks will be false
        }
        this._reset() ;
    }

    private _updateCharset() {
        const cset = this.values['CHARSET'] ;
        if (!$length(cset)) { return ; }
        const newCharset = TSCharset.charset(_data2ascii(cset)) ;
        if ($ok(newCharset) && newCharset !== this.standardCharset) {
            this.currentCharset = newCharset! ;
        }     
    }

    // ---------- automat states
    private _text(c:number) {
        if (c === LT) { this.state = FusionHTMLState.Start ; this.last = this.i ; }
        else { this.target.appendByte(c as uint8) ; }
    }

    private _start(c:number) {
        if (c === SLASH) { this.state = FusionHTMLState.CloserElement ; this.isCloser = true ; }
        else if (_isHTMLNameStarterChar(c)) { this.state = FusionHTMLState.Element ; }
        else { this._back() ; }
    }

    private _closerElement(c:number) {
        if (_isHTMLNameStarterChar(c)) { this.state = FusionHTMLState.Element ; }
        else { this._back() ; }
    }

    private _element(c:number) {
        if (c === GT || _isHTMLWhiteSpace(c)) {
            const elementName = this._name(this.last+1, this.i).toUpperCase() ;
            if (!$ok(_HTMLAssign[elementName as FusionHTMLElement])) { this._back() ; }
            else {
                this.element = elementName as FusionHTMLElement ;
                if (c === GT) { this._endElement() ; }
                else { this.state = FusionHTMLState.Inside ; }
            }
        }
        else if (!_isHTMLNameChar(c)) { this._back() ; } // we don'c consider working with <element/> tag here
    }

    private _inside(c:number) {
        if (c === GT) { this._endElement() ; }
        else if (this.isCloser && !_isHTMLWhiteSpace(c)) { this._back() ; }
        else if (c === SLASH) { this.state = FusionHTMLState.Slash ; }
        else if (_isHTMLNameStarterChar(c)) {
            this.insideLast = this.i ;
            this.state = FusionHTMLState.Tag ;
        }
        else if (!_isHTMLWhiteSpace(c)) { this._back() ; }
    }

    private _tag(c:number) {
        if (c === EQ || _isHTMLWhiteSpace(c)) { 
            this.tag = this._name(this.insideLast, this.i) ;
            this.state = c === EQ ? FusionHTMLState.AfterEqual : FusionHTMLState.AfterTag ; 
        }
        else if (!_isHTMLNameChar(c)) { this._back() ; }
    }

    private _afterTag(c:number) {
        if (c === EQ) { this.state = FusionHTMLState.AfterEqual ; }
        else if (!_isHTMLWhiteSpace(c)) { this._back() ; }
        // we don't support analysis of single values like hidden...
    }

    private _afterEqual(c:number) {
        if (_isHTMLQuote(c)) { this.insideLast = this.i + 1 ; this.lastQuote = c ; this.state = FusionHTMLState.Quote ; }
        else if (_isHTMLNameStarterChar(c)) { this.insideLast = this.i ;  this.state = FusionHTMLState.Value ; }
        else if (!_isHTMLWhiteSpace(c)) { this._back() ; }
    }

    private _value(c:number) {
        if (c === GT || c === SLASH || _isHTMLWhiteSpace(c)) {
            this._registerValue(this.insideLast, this.i) ;
            if (c === GT) { this._endElement() ;}
            else if (c === SLASH) { this.state = FusionHTMLState.Slash ; }
            else { this.state = FusionHTMLState.Inside ; }
        }
        else if (!_isHTMLNameChar(c)) { this._back() ; }
    }

    private _quote(c:number) {
        if (c === this.lastQuote) {
            this._registerValue(this.insideLast, this.i) ;
            this.state = FusionHTMLState.AfterQuote ;
        }
    }

    private _afterQuote(c:number) {
        if (_isHTMLWhiteSpace(c)) { this.state = FusionHTMLState.Inside ; }
        else if (c === SLASH) { this.state = FusionHTMLState.Slash ; }
        else if (c === GT) { this._endElement() ; }
        else { this._back() ; }
    }

    private _slash(c:number) {
        if (c === GT) { this._endElement() ; }
        else if (!_isHTMLWhiteSpace(c)) { this._back() ; }
    }
}
