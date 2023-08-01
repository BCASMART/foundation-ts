import { $capacityForCount, $defined, $ismethod, $isnumber, $length, $ok, $string } from "./commons";
import { $equal } from "./compare";
import { $uint8ArrayFromDataLike } from "./data";
import { $charset, TSCharset } from "./tscharset";
import { TSData } from "./tsdata";
import { TSDate } from "./tsdate";
import { TSError } from "./tserrors";
import { TSFusionContextType, TSFusionNodeType, TSFusionTreeNode } from "./tsfusionnode";
import { Bytes, NormativeStringEncoding, Nullable, StringEncoding, TSDataLike, TSDictionary, uint, uint8 } from "./types";
import { $inspect, $logterm } from "./utils";

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
    addStandardGlobalFunctions?:Nullable<boolean> ;
}

export interface TSDataTemplateOptions extends TSFusionTemplateOptions {
    encoding?:StringEncoding|TSCharset ;
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

const TSFusionForbiddenEncodings:NormativeStringEncoding[] = ['utf16le', 'base64', 'base64url', 'hex'] ;
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
    
    public static fromData(source:TSDataLike, encoding?:Nullable<StringEncoding|TSCharset>, opts?:TSFusionTemplateOptions):TSDataTemplate|null
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
        const source = $uint8ArrayFromDataLike(src) ; 
 
        // four our simple automatcode to be working properly, 
        // constants must be at least 2 character long
        // and have different first characters
        const constants:Array<TSFusionConstant> = [
            { name:_ascii2data('FUTURE'),    value:TSDate.future(), len:6 },
            { name:_ascii2data('NaN'),       value:NaN,             len:3 },
            { name:_ascii2data('PAST'),      value:TSDate.past(),   len:4 },
            { name:_ascii2data('current'),   value:this,            len:7 },
            { name:_ascii2data('false'),     value:false,           len:4 },
            { name:_ascii2data('null'),      value:null,            len:4 },
            { name:_ascii2data('true'),      value:true,            len:4 },
            { name:_ascii2data('undefined'), value:undefined,       len:9 }
        ] ;

        if (debug) {
            $logterm(`&0\n&Y&k ${this.constructor.name} parsing in debug mode &0`) ;
            $logterm(`&0&x - &w starting mark&x:        '&o${_data2ascii(sm)}&x'&0`)
            $logterm(`&0&x - &w ending mark&x:          '&o${_data2ascii(em)}&x'&0`)
            $logterm(`&0&x - &w separator&x:            '&o${_data2ascii(sepa)}&x'&0`)
            $logterm('&0&x======== &wsource&x: ========&0\n&y'+$inspect(source)+"&0") ;
        }

        this.validateSeparators(sm, em, sepa) ;

        const len = source.length ;
        const smlen = sm.length ;
        const sepalen = sepa.length ;
        const emlen = em.length ;
        
        function upper(c:uint8):uint8 { return (c & 0xdf) as uint8 ; }

        function isVariableSpace(c:uint8) { return c === TAB || c === SPACE ; }
        function isVariableNum(c:uint8) { return c >= ZERO && c <= NINE ; }
        function variableCharacterRole(c:uint8):TSCharRole {
            if (c === DOT) { return TSCharRole.UnsignificantStarterChar ; }
            if ((upper(c) >= A && upper(c) <= Z)) { return TSCharRole.StarterChar ; }
            if (isVariableNum(c) || c === DOT || c === UNDERSCORE) { return TSCharRole.InternalChar ; }
            return TSCharRole.ForbiddenChar ;
        }

        function find_constant(c:uint8):TSFusionConstant|undefined {
            for (let cst of constants) { if (cst.name[0] === c) return cst ; }
            return undefined ;
        }

        function store_variable(m:Map<string, Set<TSFusionContextType>>, cm:Map<TSFusionContextType, Set<string>>, variable:string, context:TSFusionContextType) {
            const path = variable.split('.') ;
            for (let component of path) { 
                if (component.length > 0) {
                    
                    let cset = m.get(component) ;
                    if (!$ok(cset)) {
                        cset = new Set<TSFusionContextType>() ;
                        m.set(component, cset) ;
                    }
                    cset!.add(context) ;

                    let sset = cm.get(context) ;
                    if (!$ok(sset)) {
                        sset = new Set<string>() ;
                        cm.set(context, sset) ;
                    }
                    sset!.add(component) ;

                    break ; 
                }
            }
        }
        function tohex(v:any):string { return $isnumber(v) ? `0x${v.toString(16)}` : `'${v}'` ; }
        function tochar(c:uint8):string { return String.fromCharCode(c) ; }

        if (debug) {
            $logterm(`&0&x - &w source length&x:         &o${len}&0`)
            $logterm(`&0&x - &w starting mark length&x:  &o${smlen}&0`)
            $logterm(`&0&x - &w ending mark length&x:    &o${emlen}&0`)
            $logterm(`&0&x - &w separator length&x:      &o${sepalen}&0`)
        }

        if (!len || !smlen || !sepalen || !emlen || smlen+emlen+sepalen > len) {
            throw new TSError('template string to small', { startingMark:sm, endingMark:em, separator:sepa, source:source}) ;
        }

        FUSION_SPECIAL_CHARS.forEach(c => {
            if (sm.includes(c) || em.includes(c) || sepa.includes(c)) {
                throw new TSError(`starting mark, ending mark and seperator must not containe ${tohex(c)} ('${tochar(c)}') character`, { startingMark:sm, endingMark:em, separator:sepa, character:c}) ;
            }
        }) ;

        if (sm[0] === COMMA) {
            throw new TSError('first character of starting mark cannot be a comma', { startingMark:sm, endingMark:em, separator:sepa}) ;
        }
        if (em[0] === LPAR || em[0] === COMMA) {
            throw new TSError('first character of ending mark cannot be a left parenthesis or a comma', { startingMark:sm, endingMark:em, separator:sepa}) ;
        }
        if (sepa[0] === LPAR || sepa[0] === RPAR || sepa[0] === COMMA) {
            throw new TSError('first character of separator cannot be a parenthesis or a comma', { startingMark:sm, endingMark:em, separator:sepa}) ;
        }
        if (sm[0] === em[0] || sm[0] === sepa[0] || em[0] === sepa[0]) {
            throw new TSError('first character of starting mark, ending mark and seperator must be distinct', { startingMark:sm, endingMark:em, separator:sepa}) ;
        }

        enum State {
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
        let state = State.Text ;
        let tokenPos = 0 ;
        let variable:string = '' ;
        let t:Nullable<TSFusionNodeType> ;
        let parameters:Array<any> = [] ;
        let currentParameter:any = undefined ;
        let currentConstant:TSFusionConstant|undefined = undefined ;
        let stringEnder = QUOTE ;
        let characterRole:TSCharRole ;

        const root = TSFusionTreeNode.root() ;
        let current = root ;
        let last = 0 ;
        let beginText = 0 ;
        let fusionContext = TSFusionContextType.Local ;
        let i = 0 ;
        let comp:number ;
        let unicodeValue = 0 ;

        while (i < len) {
            const c = source[i] as uint8 ;
            if (debug) {
                $logterm(`&0&g${i.fpad(8,'_')}&w: &x&o${tohex(c)}&x (&b'&c${tochar(c)}&b'&x), state:&o${state}&x, current: &p${current.label}&x/&y${current.type}&0`) ;
            }
            switch (state) {
                case State.Text:
                    if (c === sm[0] || c === em[0]) {
                        last = i ;
                        tokenPos = 0 ;
                        state = c === sm[0] ? State.OpenVariable : State.DecodeEndingMark ;
                        i -- ;
                    }
                    break ;

                case State.OpenVariable:
                    comp = sm[tokenPos++] ;
                    if (c !== comp) {
                        tokenPos = 0 ; 
                        state = State.Text ;  
                        // we don't change beginText here
                        i = last ; // unstack n-1 characters
                    }
                    else if (tokenPos === smlen) {
                        tokenPos = 0 ; 
                        state = State.PreVariableSpace ;
                        if (beginText >= 0 && beginText < last) { current.pushData(source.slice(beginText, last)) ; }
                        beginText = -1 ; // means we have nothing to add as a text node
                        fusionContext = TSFusionContextType.Local ;
                    }
                    break ;

                case State.PreVariableSpace:
                    if (isVariableSpace(c)) { break ; }
                    
                    const ct = TSFusionContextTypes[c] ;
                    if ($ok(ct)) {
                        fusionContext = ct!
                        tokenPos = i + 1 ;
                        state = State.StartDecodingVariable ;
                    }
                    else {
                        characterRole = variableCharacterRole(c) ;
                        if (characterRole === TSCharRole.UnsignificantStarterChar || characterRole === TSCharRole.StarterChar) {
                            tokenPos = i ;
                            state = characterRole === TSCharRole.UnsignificantStarterChar ? State.StartDecodingVariable : State.DecodingVariable ;
                        }
                        else {
                            throw new TSError(`Malformed var : found forbidden initial variable character ${tohex(c)} ('${tochar(c)}') at position ${i}'.`, {
                                source:source,
                                character:c,
                                position:i,
                                state:state
                            }) ;
                        }
                    }
                    break ;

                case State.StartDecodingVariable:
                    characterRole = variableCharacterRole(c) ;
                    if (characterRole !== TSCharRole.UnsignificantStarterChar) {
                        if (characterRole === TSCharRole.StarterChar) { 
                            state = State.DecodingVariable ;
                        }
                        else {
                            throw new TSError(`Malformed var : found forbidden character ${tohex(c)} ('${tochar(c)}') at position ${i}.`, {
                                source:source,
                                character:c,
                                position:i,
                                state:state                                    
                            }) ;
                        }
                    }
                    break ;

                case State.DecodingVariable:
                    t = TSFusionNodeTypes[c] ;
                    if ($ok(t) || isVariableSpace(c)) {
                        variable = _data2ascii(source.slice(tokenPos,i)) ;
                        current = current.pushVariable(variable, $ok(t) ? t! : TSFusionNodeType.Variable, fusionContext) ;
                        store_variable(this._variables, this._contextsVariables, variable, fusionContext) ;
                        state = State.PostVariableSpace ;
                        fusionContext = TSFusionContextType.Local ;
                        tokenPos = 0 ;
                    }
                    else if (c === LPAR) {
                        variable = _data2ascii(source.slice(tokenPos,i)) ;
                        state = State.DecodingParameters ;
                        parameters = [] ;
                        currentParameter = undefined ;
                        tokenPos = 0 ;
                    }
                    else if (c === em[0]) {
                        // here we cannot have the beginning of a separator because we are not in the kind of variable accepting a separator
                        variable = _data2ascii(source.slice(tokenPos,i)) ;
                        current = current.pushVariable(variable,  TSFusionNodeType.Variable, fusionContext) ;
                        store_variable(this._variables, this._contextsVariables, variable, fusionContext) ;
                        state = State.DecodingClosingVariable ; 
                        fusionContext = TSFusionContextType.Local ;
                        i -- ;
                        tokenPos = 0 ;
                    }
                    else if (variableCharacterRole(c) === TSCharRole.ForbiddenChar) {
                        throw new TSError(`Malformed var : found forbidden character ${tohex(c)} ('${tochar(c)}') at position ${i}.`, {
                            source:source,
                            character:c,
                            position:i,
                            state:state                                    
                        }) ;
                    }
                    break ;
                case State.DecodingParameters:
                    if (c === RPAR) {
                        state = State.EndOfParameters ;
                    }
                    else if (c === COMMA) {
                        parameters.push(currentParameter) ;
                        currentParameter = undefined ;
                    }
                    else if (c === QUOTE || c === DOUBLE_QUOTE || c === PIPE) {
                        // PIPE DELIMITER IS USED FOR DESCRIBING JSON OBJECTS
                        // AS PARAMETERS
                        stringEnder = c ;
                        currentParameter = new TSData() ;
                        state = State.StringParameter ;
                    }
                    else if (isVariableNum(c) || c === MINUS || c === PLUS || c === DOT) {
                        tokenPos = i ;
                        state = State.NumberParameter ;
                    }
                    else {
                        currentConstant = find_constant(c) ;
                        if ($defined(currentConstant)) {
                            tokenPos = 1 ;
                            state = State.ConstantParameter ;
                        }
                        else if (!isVariableSpace(c)) {
                            throw new TSError(`Malformed var : found forbidden character ${tohex(c)} ('${tochar(c)}') at position ${i}.`, {
                                source:source,
                                character:c,
                                position:i,
                                neededChars:[TAB, SPACE],
                                state:state                                    
                            }) ;
                        }
                    }
                    break ;
                case State.AfterParameter:
                    if (c === RPAR) {
                        parameters.push(currentParameter) ;
                        state = State.EndOfParameters ;
                    }
                    else if (c === COMMA) {
                        parameters.push(currentParameter) ;
                        currentParameter = undefined ;
                        state = State.DecodingParameters ;
                    }
                    else if (!isVariableSpace(c)) {
                        throw new TSError(`Malformed var : found forbidden character ${tohex(c)} ('${tochar(c)}') at position ${i}.`, {
                            source:source,
                            character:c,
                            position:i,
                            neededChars:[TAB, SPACE],
                            state:state                                    
                        }) ;
                    }
                    break ;
                case State.ConstantParameter:
                    if (c === currentConstant!.name[tokenPos]) {
                        tokenPos++ ;
                        if (tokenPos === currentConstant!.len) {
                            currentParameter = currentConstant!.value ;
                            state = State.AfterParameter ;
                        }
                    }
                    else {
                        // ERROR: wrong constant character
                        throw new TSError(`Malformed var : found forbidden character ${tohex(c)} ('${tochar(c)}') at position ${i} (wrong parameter constant).`, {
                            source:source,
                            character:c,
                            position:i,
                            neededChars:[currentConstant!.name[tokenPos]],
                            state:state                                    
                        }) ;
                    }
                    break ;
                case State.NumberParameter:
                    if (isVariableSpace(c) || c === RPAR || c === COMMA) {
                        const num = Number(paramCharset?.stringFromData(source.slice(tokenPos, i))) ;
                        currentParameter = $isnumber(num) ? num : 0 ;
                        // QUESTION: shouldn't we throw if we have not a number here
                        state = State.AfterParameter ;
                        i-- ;
                    }
                    else if (!isVariableNum(c) && c !== DOT) {
                        throw new TSError(`Malformed var : found forbidden character ${tohex(c)} ('${tochar(c)}') at position ${i} (parameter is not numeric).`, {
                            source:source,
                            character:c,
                            position:i,
                            neededChars:[ZERO, ZERO+1, ZERO+2, ZERO+3, ZERO+4, ZERO+5, ZERO+6, ZERO+7, ZERO+8, NINE],
                            state:state                                    
                        }) ;
                    }
                    break ;
                case State.StringParameter:
                    if (c === stringEnder) {
                        currentParameter = currentParameter.toString(paramCharset) ;
                        if (stringEnder === PIPE) {
                            try { currentParameter =  JSON.parse(<string>currentParameter) ; }
                            catch (e) {
                                throw new TSError(`Malformed JSON structure terminating at position ${i}. Impossible to parse. See 'parsingError' in complement infos.`, { 
                                    source:source,
                                    position:i,
                                    state:state,
                                    parsingError:e                                 
                                }) ;
                            }
                        }
                        state = State.AfterParameter ;
                    }
                    else if (c === BACKSLASH) {
                        state = State.StringParamBackslash ;
                    }
                    else {
                        currentParameter.appendByte(c) ;
                    }
                    break ;
                case State.StringParamBackslash:
                    state = State.StringParameter ;
                    switch (c) {
                        case bu: currentParameter.appendByte(BS)  ; break ;
                        case fu: currentParameter.appendByte(FF)  ; break ;
                        case nu: currentParameter.appendByte(LF)  ; break ;
                        case ru: currentParameter.appendByte(CR)  ; break ;
                        case tu: currentParameter.appendByte(TAB) ; break ;
                        case Uu: case uu:
                            tokenPos = 0 ;
                            unicodeValue = 0 ;
                            state = State.StringParamUnicode ;
                            break ;
                        default:
                            if (c >= SPACE && c <= 0x7F) { 
                                // we are a visible ASCII character
                                currentParameter.appendByte(c) ; 
                            } else {
                                const neededChars:uint8[] = [] ;
                                for (let nc = 32 ; nc < 128 ; nc++) { neededChars.push(nc as uint8) ; }
                                
                                throw new TSError(`Malformed template structure : found forbidden character ${tohex(c)} ('${tochar(c)}') at position ${i} (Need to have an ASCII character after backslash in string parameter interpretation).`, { 
                                    source:source,
                                    character:c,
                                    position:i,
                                    neededChars:neededChars,
                                    state:state                                    
                                }) ;
                            }
                    }
                    break ;
                case State.StringParamUnicode:
                    const hexa = c.hexaValue() ;
                    if (hexa >= 0) {
                        unicodeValue = (unicodeValue << 4) | hexa ;
                        tokenPos++ ;
                        if (tokenPos === 4) {
                            const bytes = paramCharset.bytesFromString(String.fromCharCode(unicodeValue)) ;
                            currentParameter.appendBytes(bytes) ;
                            state = State.StringParameter ;
                        }
                    }
                    else {
                        throw new TSError(`Malformed template structure : found forbidden character ${tohex(c)} ('${tochar(c)}') at position ${i} (Need hexa character in string parameter unicode \\u sequence).`, { 
                            source:source,
                            character:c,
                            position:i,
                            state:state                                    
                        }) ;
                    }
                    break ;
                case State.EndOfParameters:
                    t = TSFusionNodeTypes[c] ;
                    if ($ok(t) || isVariableSpace(c)) {
                        current = current.pushVariable(variable, $ok(t) ? t! : TSFusionNodeType.Variable, fusionContext, parameters) ;
                        store_variable(this._variables, this._contextsVariables, variable, fusionContext) ;
                        state = State.PostVariableSpace ;
                        fusionContext = TSFusionContextType.Local ;
                        tokenPos = 0 ;
                    }
                    else if (c === em[0]) {
                        // here we cannot have the beginning of a separator because we are not in the kind of variable accepting a separator
                        current = current.pushVariable(variable,  TSFusionNodeType.Variable, fusionContext, parameters) ;
                        store_variable(this._variables, this._contextsVariables, variable, fusionContext) ;
                        state = State.DecodingClosingVariable ; 
                        fusionContext = TSFusionContextType.Local ;
                        i -- ;
                        tokenPos = 0 ;
                    }
                    else {
                        // we should have a fusion node type or a space here
                        throw new TSError(`Malformed var : found forbidden character ${tohex(c)} ('${tochar(c)}') at position ${i}.`, {
                            source:source,
                            character:c,
                            position:i,
                            state:state                                    
                        }) ;
                    }
                    break ;
                case State.PostVariableSpace:
                    if (c === em[0]) {
                        if (current.isContainerVariable) {
                            throw new TSError(`Malformed template structure : found forbidden character ${tohex(c)} ('${tochar(c)}') at position ${i} (Need to have a separator for a container variable).`, { 
                                source:source,
                                character:c,
                                position:i,
                                neededChars:[sm[0]],
                                state:state                                    
                            }) ;
                        } 
                        state = State.DecodingClosingVariable ;
                        i -- ;
                        tokenPos = 0 ;
                        break ; 
                    }
                    else if (c === sepa[0]) { 
                        if (!current.isContainerVariable) {
                            throw new TSError(`Malformed template structure : found forbidden character ${tohex(c)} ('${tochar(c)}') at position ${i} (Separator forbidden for non container variable).`, { 
                                source:source,
                                character:c,
                                position:i,
                                neededChars:[em[0]],
                                state:state                                    
                            }) ;
                        } 
                        state = State.DecodingSeparator ; 
                        i -- ;
                        tokenPos = 0 ;
                        break ;
                    }
                    else if (!isVariableSpace(c)) {
                        throw new TSError(`Malformed template structure : found forbidden character ${tohex(c)} ('${tochar(c)}') at position ${i} (needed separator or ending mark start').`, { 
                            source:source,
                            character:c,
                            position:i,
                            neededChars:[sepa[0], em[0]],
                            state:state                                    
                        }) ;
                    } 
                    break ;

                case State.DecodingSeparator:
                    comp = sepa[tokenPos++] ;
                    if (c !== comp) {
                        throw new TSError(`Malformed template structure on variable separator. Unatended character  ${tohex(c)} ('${tochar(c)}') at position ${i} while decoding separator.`, {
                            source:source,
                            character:c,
                            position:i,
                            neededChars:[comp],                                    
                            state:state
                        }) ;
                    }
                    else if (tokenPos === sepalen) {
                        beginText = i + 1 ;
                        state = State.Text ;
                        // we have nothing to do here. 
                        // Our current node is our variable 
                    }
                    break ;

                case State.DecodingClosingVariable:
                    comp = em[tokenPos++] ;
                    if (c !== comp) {
                        throw new TSError(`Malformed template structure on closing variable. Unatended character  ${tohex(c)} ('${tochar(c)}') at position ${i} while decoding ending mark.`, {
                            source:source,
                            character:c,
                            position:i,
                            neededChars:[comp],
                            state:state
                        }) ;
                    }
                    else if (tokenPos === emlen) {
                        // we just close here. We do not have any text to add here
                        current = current.parent! ; // a variable has always a parent
                        state = State.Text ;
                        beginText = i + 1 ;
                    }
                    break ;
                
                case State.DecodeEndingMark:
                    comp = em[tokenPos++] ;
                    if (c !== comp) {
                        tokenPos = 0 ; 
                        state = State.Text ;  
                        // we don't change beginText here
                        i = last ; // unstack n-1 characters
                    }
                    else if (tokenPos === emlen) {
                        const parent = current.parent ;
                        if ($ok(parent)) {
                            if (beginText >= 0 && beginText < last) { current.pushData(source.slice(beginText, last)) ; }
                            current = parent!
                            state = State.Text ;
                            beginText = i + 1 ;
                        }
                        else {
                            throw new TSError(`Malformed template structure. We have found a supernumerary ending mark at position ${i}.`, {
                                source:source,
                                position:i - emlen + 1 ,
                                endingMark:em,
                                state:state
                            }) ;    
                        }
                    }
                    break ;
            }
            i++ ;
        }
        if (debug) {
            $logterm(`&0&g--STOP--&w: &rEOF&x, state:&o${state}&x, current: &p${current.label}&0`)
        }

        if ($ok(current.parent)) {
            throw new TSError(`Malformed template structure. Template is not properly closed.`, {
                source:source,
                state:state
            }) ;
        }
        else if (state === State.Text || state === State.OpenVariable || state === State.DecodeEndingMark) {
            if (beginText >= 0 && beginText < i) { current.pushData(source.slice(beginText, i)) ; }
        }
        else {
            throw new TSError(`Malformed template structure. Template is not properly closed (automat in wrong state '${state}').`, {
                source:source,
                state:state
            }) ;
        }
        this.startingMark = sm ;
        this.endingMark = em ;
        this.separator = sepa ;
        this.source = new TSData(source) ; // we keep a copy of the source
        this._treeRoot = root ;
        this._capacity = $capacityForCount(this.source.length * 1.25) ;
        if ($ok(opts.procedures)) { this._procedures = opts.procedures!  ; }
        this._globalFunctions = opts.globalFunctions ;
        this._addStandardGlobalFunctions = !!opts.addStandardGlobalFunctions ;
    }

    public get capacity():number { return this._capacity ; }
    public set capacity(n:number) { 
        const c = $capacityForCount(n) ;
        if (c > this._capacity) { this._capacity = (this._capacity + $capacityForCount(n)) as uint ; }
    }

    // You may overwrite this method in subclasses. 
    // In that case, you would call super() first
    public validateSeparators(sm:uint8[], em:uint8[], sepa:uint8[]) {
        if ($equal(sm, em) || $equal(sepa, sm) || $equal(sepa, em)) {
            throw new TSError('starting mark, ending mark and seperator must be distinct', { startingMark:sm, endingMark:em, separator:sepa}) ;
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
    private static __stringCharset:TSCharset = TSCharset.utf8Charset() ;

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
    { this._outputString += $string(value) ; }

    public fusionWithDataContext(data:any, globalContext:TSDictionary, errors?:string[]):string|null {
        this._outputString = '' ;
        return this._treeRoot.fusion(this, data, { 
            globalContext: globalContext, 
            procedures: this._procedures, 
            errors:errors, 
            globalFunctions:this._globalFunctions, 
            addStandardGlobalFunctions:this._addStandardGlobalFunctions
        }) ? this._outputString! : null ;
    }

    fusionStringWithDataContext = this.fusionWithDataContext ;
}

export abstract class TSGenericDataTemplate extends TSFusionTemplate {
    protected _outputData:TSData|undefined = undefined ;
    
    public pushFusionData(data:Bytes):void
    { this._outputData?.appendBytes(data) ; }

    public fusionWithDataContext(data:any, globalContext:TSDictionary, errors?:string[]):TSData|null {
        this._outputData = new TSData(this._capacity) ;
        return this._treeRoot.fusion(this, data, { 
            globalContext: globalContext, 
            procedures: this._procedures, 
            errors:errors, 
            globalFunctions:this._globalFunctions,
            addStandardGlobalFunctions:this._addStandardGlobalFunctions
        }) ? this._outputData! : null ;
    }
}

/**
 * in HTMLTemplate fusion we don't care in which charset we are
 * since all static text sections are reused as they are and
 * all inserted values are converted to ASCII through html 
 * tag conversion
 */
export class TSHTMLTemplate extends TSGenericDataTemplate {
    private _htmlCharset:TSCharset ;

    public static fromHTMLData(src:TSDataLike, opts?:TSFusionTemplateOptions):TSHTMLTemplate|null {
        const source = $uint8ArrayFromDataLike(src) ; 
        if (!$length(source)) { return null ; }  
        try { return new TSHTMLTemplate(source, opts) ; }
        catch(e) {
            if (opts?.debugParsing) { $logterm('&0\n&R&w Data Parsing did encounter error &0\n&c'+$inspect(e)+'\n&o'+(e as Error).stack+"&0") ; }
            return null ;
        }
    }
    
    public constructor(src:TSDataLike, opts?:TSFusionTemplateOptions)
    { 
        const [data, charset] = _parseHTML($uint8ArrayFromDataLike(src), opts) ;
        super(data, opts, charset) ;
        this._htmlCharset = charset ;
    }

    public pushFusionValue(value:NonNullable<any>):void {
        let s = "" ;
        if ($ismethod(value, 'toHTML')) { s = value.toHTML() ; }
        else if ($isnumber(value)) { s = ''+ value ; }
        else { s = $string(value).toHTML() ; }
        if (s.length) { this._outputData?.appendBytes(_ascii2data(s!)) ; }
    }

    public fusionStringWithDataContext(data:any, globalContext:TSDictionary, errors?:string[]):string|null {
        const ret = this.fusionWithDataContext(data, globalContext, errors) ;
        return $ok(ret) ? this._htmlCharset.stringFromData(ret!) : null ;
    }

}

export class TSDataTemplate extends TSGenericDataTemplate {
    protected _charset:TSCharset ;

    // default charset is UTF-8
    public static fromData(src:TSDataLike, encoding?:Nullable<StringEncoding|TSCharset>, opts?:TSFusionTemplateOptions):TSDataTemplate|null {
        const source = $uint8ArrayFromDataLike(src) ; 

        if (!$length(source)) { return null ; }
        const charset = $charset(encoding) ;

        if (TSFusionForbiddenEncodings.includes(charset.name as NormativeStringEncoding)) { 
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

    public pushFusionValue(value:NonNullable<any>):void {
        this._outputData?.appendString($string(value), this._charset) ;
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

function _ascii2data(s:string)
{ return ASCIICharset.bytesFromString(s) ; }

function _data2ascii(d:Nullable<Bytes>, start?:number, end?:number) 
{ return $ok(d) ? ASCIICharset.stringFromBytes(d!, start, end) : '' ; }

function _parseHTML(src:Uint8Array, options?:TSFusionTemplateOptions):[TSData, TSCharset]
{
    const startingMark = $length(options?.startingMark) ? options!.startingMark! : TSFusionTemplate.DefaultStartingMark ;
    const endingMark   = $length(options?.endingMark)   ? options!.endingMark!   : TSFusionTemplate.DefaultEndingMark ;
    const separator    = $length(options?.separator)    ? options!.separator!    : TSFusionTemplate.DefaultSeparator ;
    const debug = options?.debugParsing ;
    const standardCharset = TSCharset.utf8Charset() ;
    let   currentCharset = standardCharset ;
    
    if (debug) {
        $logterm(`&0\n&P&w _parseHTML() is in debug mode &0`) ;
        $logterm(`&0&x - &c starting mark&x:        &p${startingMark}&0`)
        $logterm(`&0&x - &c ending mark&x:          &p${endingMark}&0`)
        $logterm(`&0&x - &c separator&x:            &p${separator}&0`)
    }

    const sm = _ascii2data(startingMark!) ;
    const em = _ascii2data(endingMark!) ;
    const sp = _ascii2data(separator!) ;

    enum State {
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

    enum Element {
        Unknown          = '',
        Fusion           = 'FUSION',
        EndFusion        = '/FUSION',
        Meta             = 'META'
    }

    const assign:{[key in Element]?:string[]} = {
        'FUSION':['TYPE', 'PATH', 'CONTEXT'],
        'META':['CHARSET'],
        '/FUSION':[]
    } ;
    

    const types:TSDictionary<uint8[]> = {
        'IF':           [QUESTION_MARK],
        'TEST':         [QUESTION_MARK],
        'QUESTION':     [QUESTION_MARK],
        '?':            [QUESTION_MARK],
        'IFNOT':        [EXCLAMATION_MARK],
        'NOT':          [EXCLAMATION_MARK],
        '!TEST':        [QUESTION_MARK],
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

    const contexts:TSDictionary<uint8[]> = {
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

    const len = src.length ;
    let target = new TSData(len) ;
    let state = State.Text ;
    let i = 0 ;
    let last = 0 ;
    let lastQuote = 0 ;
    let insideLast = 0 ;
    let tag = '';
    let element:Element = Element.Unknown ;
    let values:TSDictionary<Uint8Array> = {}
    let isCloser = false ;

    function upper(c:number):number { return c & 0xdf ; }
    function isNameStarterChar(c:number):boolean { c = upper(c) ; return c >= A && c <= Z ; }
    function isNameChar(c:number):boolean { return c === DOT || c === COLON || c === UNDERSCORE || c === MINUS || (c >= ZERO && c <= NINE) || isNameStarterChar(c)}
    
    function isWhiteSpace(c:number):boolean { return c === TAB || c === SPACE || c === LF || c === CR ; }
    function isQuote(c:number):boolean { return c === QUOTE || c === DOUBLE_QUOTE ; }
    function name(start:number, end:number):string { return _data2ascii(src, start, end).toUpperCase() ; }

    function registerValue(start:number, end:number) {
        if (assign[element]?.includes(tag)) {
            values[tag] = src.slice(start, end) ;
        }
        tag = '' ;
    }

    function reset() {
        state = State.Text ; 
        element = Element.Unknown ; 
        tag = '' ;
        last = 0 ; 
        values = {} ;
        isCloser = false ;
    }

    function back() { 
        target.appendByte(LT) ;
        i = last ; 
        reset() ;
    }

    function endElement() {
        switch (element) {
            case Element.Fusion:
                const p = values['PATH'] ;
                if (!$length(p)) { back() ; return ; }
                const c = contexts[_data2ascii(values['CONTEXT']).toUpperCase()] ;
                const t = types[_data2ascii(values['TYPE']).toUpperCase()] ;
                target.appendBytes(sm) ; // {{
                target.appendBytes(c) ;  // '' or '@' or '$' or '/' or '*' or '+'
                target.appendBytes(p) ;  // var itself
                if (t.length) {
                    target.appendBytes(t) ; // '?' or '!' or '#' ;
                    target.appendBytes(sp) ;
                }
                else {
                    target.appendBytes(em) ; // WARNING: if we have a </fusion> after that, our marks will be false
                }
                reset() ;
                return ;
            case Element.Meta:
                const cset = values['CHARSET'] ;
                if ($length(cset)) {
                    const newCharset = TSCharset.charset(_data2ascii(cset)) ;
                    if ($ok(newCharset) && newCharset !== standardCharset) {
                        currentCharset = newCharset! ;
                    }     
                }
                target.appendBytes(src, last, i) ;
                target.appendByte(GT) ;
                break ;
            case Element.EndFusion:
                target.appendBytes(em) ;
                reset() ;
                return ;
            default: 
                target.appendBytes(src, last, i) ;
                target.appendByte(GT) ;
                break ;
        }
        reset() ;
    }

    while (i < len) {
        const c = src[i] ;
        if (debug) {
            $logterm(`&0&j${i.fpad(8,'_')}&w: &x0x&p${c.toString(16)}&x (&b'&c${String.fromCharCode(c)}&b'&x), state:&p${state}&x, last:&y${last}&0`) ;
        }
        switch (state) {
            case State.Text:
                if (c === LT) { state = State.Start ; last = i ; }
                else { target.appendByte(c as uint8) ; }
                break ;
            case State.Start:
                if (c === SLASH) { state = State.CloserElement ; isCloser = true ; }
                else if (isNameStarterChar(c)) { state = State.Element ; }
                else { back() ; }
                break ;
            case State.CloserElement:
                if (isNameStarterChar(c)) { state = State.Element ; }
                else { back() ; }
                break ;
            case State.Element:
                if (c === GT || isWhiteSpace(c)) {
                    const elementName = name(last+1, i).toUpperCase() ;
                    if (!$ok(assign[elementName as Element])) { back() ; }
                    else {
                        element = elementName as Element ;
                        if (c === GT) { endElement() ; }
                        else { state = State.Inside ; }
                    }
                }
                else if (!isNameChar(c)) { back() ; } // we don'c consider working with <element/> tag here
                break ;                    
            case State.Inside:
                if (c === GT) { endElement() ; }
                else if (isCloser && !isWhiteSpace(c)) { back() ; }
                else if (c === SLASH) { state = State.Slash ; }
                else if (isNameStarterChar(c)) {
                    insideLast = i ;
                    state = State.Tag ;
                }
                else if (!isWhiteSpace(c)) { back() ; }
                break ;
            case State.Tag:
                if (c === EQ || isWhiteSpace(c)) { 
                    tag = name(insideLast, i) ;
                    state = c === EQ ? State.AfterEqual : State.AfterTag ; 
                }
                else if (!isNameChar(c)) { back() ; }
                break ;
            case State.AfterTag:
                if (c === EQ) { state = State.AfterEqual ; }
                else if (!isWhiteSpace(c)) { back() ; }
                // we don't support analysis of single values like hidden...
                break ;
            case State.AfterEqual:
                if (isQuote(c)) { insideLast = i + 1 ; lastQuote = c ; state = State.Quote ; }
                else if (isNameStarterChar(c)) { insideLast = i ;  state = State.Value ; }
                else if (!isWhiteSpace(c)) { back() ; }
                break ;
            case State.Value:
                if (c === GT || c === SLASH || isWhiteSpace(c)) {
                    registerValue(insideLast, i) ;
                    if (c === GT) { endElement() ;}
                    else if (c === SLASH) { state = State.Slash ; }
                    else { state = State.Inside ; }
                }
                else if (!isNameChar(c)) { back() ; }
                break ;
            case State.Quote:
                if (c === lastQuote) {
                    registerValue(insideLast, i) ;
                    state = State.AfterQuote ;
                }
                break ;
            case State.AfterQuote:
                if (isWhiteSpace(c)) { state = State.Inside ; }
                else if (c === SLASH) { state = State.Slash ; }
                else if (c === GT) { endElement() ; }
                else { back() ; }
                break ;
            case State.Slash:
                if (c === GT) { endElement() ; }
                else if (!isWhiteSpace(c)) { back() ; }
                break ;
        }

        i++ ;
        if (debug) {
            $logterm(`&0&o${i.fpad(8,'_')}&w: ----------, state:&p${state}&x, last:&y${last}&0`) ;
        }

    }

    if (state !== State.Text) {
        target.appendByte(LT) ;
        target.appendBytes(src, last, i) ;
        target.appendByte(GT) ;
    }

    if (debug) {
        $logterm(`&0&j--STOP--&w: &rEOF&x, state:&p${state}&x, last:&p${last}&0`) ;
    }

    return [target, currentCharset] ;
}
