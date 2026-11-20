import { INT16_MIN, INT16_MAX, INT32_MAX, INT32_MIN, Nullable, UINT32_MAX, UINT16_MAX, INT8_MIN, INT8_MAX, UINT8_MAX, UINT_MAX, TSDictionary, INT_MIN, INT_MAX, TSCountrySet, TSCurrencySet, TSLanguageSet, TSContinentSet, language, continent, currency, country } from "./types";
import { $UUID, $count, $defined, $email, $int, $isarray, $isbool, $isdataobject, $isemail, $isfunction, $isint, $isnumber, $isobject, $isodate, $isphonenumber, $isstring, $isunsigned, $isurl, $isuuid, $keys, $length, $objectcount, $ok, $string, $unsigned, $value, $valueornull, $isipaddress, $isipv4, $isipv6 } from "./commons";
import { $bufferFromHexaString, $decodeBase64, $decodeBase64URL, $encodeBase64, $encodeBase64URL, $encodeHexa } from "./data";
import { $ascii, $ftrim } from "./strings";

import { TSCharset } from "./tscharset";
import { TSColor, TSColorSpace } from "./tscolor";
import { TSCountry } from "./tscountry";
import { TSDate } from "./tsdate";
import { TSDocumentFormat, TSDocumentFormats } from "./tsgeometry";
import { TSPhoneNumber } from "./tsphonenumber";
import { TSURL } from './tsurl';

import { TSError } from "./tserrors";

import { $inspect, $jsonparse } from "./utils";


// WARNING: AS IT IS :
// -------------------------------------------------------------------------------------------------
//  - 'charset' strings are not trimmed before validation 
//      but string case is not relevant in getting the right TSCharset object
//  - 'color' must be a valid color string or a TSColor object. 
//      Valid color string formats are (with H as an hexadecimal digit) :
//        -> "#HHH" and "HHH"
//        -> "#HHHHHH" and "HHHHHH"
//        -> "#HHHHHHHH" and "HHHHHHHH"
//        -> any web color name ("azure", "turquoise", "white", "darkgray", "lightblue", "cyan"...)
//           (see tscolor.ts)
//  - 'continent', 'country', 'currency', 'language' and 'paper'  interpreted string are trimmed 
//      and transformed in the expected case (lower or upper case)
//  - 'country' items can be a country type string (ISO 3166-1 alpha-2) 
//      or a TSCountry object or a known ISO 3166-1 alpha-3 code as a string.
//      Obtained valid values are always of country type (ISO 3166-1 alpha-2 strings)
//  - 'data' is any TSDataLike object or a base64 encoded string. Interpreted result is a TSDataLike
//      objet. Encoded result is an base 64 encoded string. You can alter wich kind of base64 is used
//      by settin the context in TSParserOptions. If your context is url the base64 url encoding schema
//      will be used. In each other case, the standard base64 will be used. 
//  - 'date' represents a TSDate() object. 'jsdate' represents a Date() object
//  - 'email' is validated against a Regex email validation
//  - 'hexa' is any TSDataLike object or an hexadecimal encoded string. Interpreted result 
//      is a TSDataLike object. Encoded result is an hexadecimal encoded string.
//  - 'ipaddress' means an 'ipv4' or an 'ipv6' address
//  - 'jsdate' represents a Date() object, 'date' a TSDate() object
//  - 'native' represents any simple type (ie: string, number, boolean, BigInt or Symbol).
//      Symbol and BigInt values are kept as they are during interpretation.
//      Symbol values are transformed in strings during encoding
//      BigInt values are transformed in numbers during encoding
//  - 'paper' is a document standard format. It includes all 'A' (eg 'a0', 'a1', ... 'a4', ...), 
//      'B', 'C', 'US', 'din', 'envelopes' ... series, plus some specic formats like 'folio' or 'raisin'
//      (see tsgeometry.ts).
//  - 'phone' must be a valid phone number we checked against all common phone plans 
//      in all countries we know of (all TSCountry objects). Interpreted values are 
//      TSPhoneNumber objects. Encoded values are normalized international phone numbers
//  - 'url' must be valid URL: a valid string URL, an URL object or a TSURL object.
//      During interpretation, all values are transformed in TSURL objects.
//      During encoding, all TSURL are converted using their href property 
// -------------------------------------------------------------------------------------------------

// If you want examples of parsers' definition, see the tsparser-test.ts file

export type TSLeafOptionalNode  = 'boolean' | 'charset' | 'color' | 'continent' | 'country' | 'currency' | 
                                  'data' | 'date' | 'email' | 'hexa' | 'int' | 'int8' | 'int16' | 'int32' |
                                  'ipaddress' | 'ipv4' | 'ipv6' | 
                                  'jsdate' | 'language' | 'native' | 'number' | 'paper' | 'path' | 'phone' | 'string' |
                                  'uint8' | 'uint16' | 'uint32' | 'unsigned' | 'uuid' | 'url' ;
export type TSMandatoryLeafNode = 'boolean!' | 'charset!' | 'color!' | 'continent!' | 'country!' | 'currency!' | 
                                  'data!' | 'date!' | 'email!' | 'hexa!' | 'int!' | 'int8!' | 'int16!' | 'int32!' | 
                                  'ipaddress!' | 'ipv4!' | 'ipv6!' | 
                                  'jsdate!' | 'language!' | 'native!' | 'number!' | 'paper!' | 'path!' | 'phone!' | 'string!' |
                                  'uint8!' | 'uint16!' | 'uint32!' | 'unsigned!' | 'uuid!' | 'url!' ;

export type TSParserNodeType    = TSLeafOptionalNode | 'array' | 'object' ;

export type TSNativeValue = Nullable<string|number|boolean> ;

export enum TSParserActionContext {
    url = 'url', 
    json = 'json', 
    vargs = 'vargs',
    env = 'env'
} ;

export type TSParserActionContextType = keyof typeof TSParserActionContext ;
export interface TSParserOptions {
    errors?:Nullable<string[]> ;                    // NOSONAR : field is optional
    context?:Nullable<TSParserActionContextType> ;  // NOSONAR : field is optional
    acceptsUncheckedItems?:Nullable<boolean> ;      // NOSONAR : field is optional
}
export interface TSParserActionOptions extends TSParserOptions {
    options?:Nullable<TSDictionary> ;               // NOSONAR : field is optional
}
export type TSParserAction<T>   = (v:any, opts?:Nullable<TSParserActionOptions>) => T ;
export type TSParserChecker     = TSParserAction<boolean> ;
export type TSParserTransformer = TSParserAction<any> ;
export type TSParserNatifier    = TSParserAction<TSNativeValue> ;

// a user oriented general value's validation and final transformation

export type TSExtendedLeafNode = { 
    _type: TSLeafOptionalNode ; 
    _mandatory?:boolean ; // you can have mandatory 
    _default?:any ;       // or default but not both
    _enum?:TSDictionary<number|string> | Array<string|number> ;
    _exportAsEnum?:boolean ;
    _checker?:TSParserChecker ;
    _transformer?:TSParserTransformer ; 
    _natifier?:TSParserNatifier ;
    _options?:TSDictionary ;
} ;


export type TSLeafNode = TSLeafOptionalNode | TSMandatoryLeafNode | TSExtendedLeafNode ;

export type TSExtendedArrayNode = {
    _itemsType:TSNode ;
    _mandatory?:boolean ; // usefull if we want a non mandatory array but _min and _max defined when the array is defined
    _min?: number ;
    _max?: number ;
    _checker?:TSParserChecker ;
    _transformer?:TSParserTransformer ; 
    _natifier?:TSParserNatifier ;
} ;

export type TSArrayNode = [TSNode, number?, number?] ; // min and max

// QUESTION: add camelcase, snakecase, pascalcase, kebabcase, ... ?
export enum TSCase {
    standard = 'standard',
    lowercase = 'lowercase',
    uppercase = 'uppercase'
}

export type TSObjectNode = { [key: string]: TSNode } | {
    _keysType?:TSLeafOptionalNode ;
    _valueItemsType?:TSNode ; 
    _acceptsUncheckedItems?:boolean ;
    _checker?:TSParserChecker ;
    _transformer?:TSParserTransformer ; 
    _natifier?:TSParserNatifier ;
    _mandatory?:boolean ;
    _keysCase?:Nullable<TSCase> ;                       // NOSONAR : field is optional
    _aliases?:Nullable<Map<string, string>> ;           // NOSONAR : field is optional
    _outputAliases?:Nullable<Map<string, string>> ;     // NOSONAR : field is optional
    _aliasUnsensitive?:boolean ;                        // NOSONAR : field is optional
}

export type TSNode = TSLeafNode | TSObjectNode | TSArrayNode | TSExtendedArrayNode ;

// FIXME: the default value on a node is used as it is without any check (so it seems)
// TODO: activate alias in parser in order to have input fields different from final fields
export abstract class TSParser {
    public readonly errors:string[] = [] ;
    public readonly mandatory:boolean ;
    protected _check:TSParserChecker = (_:any) => true ;
    protected _transform:TSParserTransformer = (v:any) => v ;
    protected _natify?:TSParserNatifier = undefined ;

    public static define(rootNode:TSNode, errors?:Nullable<Array<string>>):TSParser|null {
        return $valueornull(_structureConstruction(rootNode, errors)) ;
    }
    
    public get isValid():boolean { return this.errors.length === 0 ; }
    
    public validate(value:any, opts?:Nullable<TSParserOptions>):boolean { 
        return this._validate(value, '', opts) ; 
    }
    public interpret(value:any, opts?:Nullable<TSParserOptions>):any {
        return this._validate(value, '', opts) ? this.rawInterpret(value, opts) : null ;
    }
    public encode(value:any, opts?:Nullable<TSParserOptions>): any {
        return this._validate(value, '', opts) ? this.rawEncode(value, opts) : null ;
    }

    // if you parse an empty string or string with whitespaces you'll get undefined as result
    public parse(source:Nullable<string>, errors?:Nullable<string[]>): any {
        const opts:TSParserOptions = { errors:errors, context:TSParserActionContext.json }
        source = $ftrim(source) ;
        let value = $jsonparse(source, true) ;
        if (!$defined(value)) { 
            _serror(opts, 'JSON', '.parse(stringSource) did fail') ; 
        }   
        return this.interpret(value, opts) ;
    }
    
    public stringify(value:any, spaces:string | number | undefined = undefined, errors?:Nullable<string[]>): string | null {
        const opts:TSParserOptions = { errors:errors, context:TSParserActionContext.json }
        if (this._validate(value, '', opts)) {
            try { return JSON.stringify(this.rawEncode(value, opts), undefined, spaces) }
            catch { return null ; }
    
        } 
        return null ;
    }

    // WARNING: never use rawInterpret() method directly without using validate() first
    public abstract rawInterpret(_:any, opts?:Nullable<TSParserOptions>):any ;
    public abstract rawEncode(_:any, opts?:Nullable<TSParserOptions>):any ;
    public abstract nodeType():TSParserNodeType ;
    public abstract toJSON(): object ;
    
    public toString(): string { return $inspect(this.toJSON(), 15) ; }
    public includedDefaultValue():any { return undefined ; }

    // returns the parser which will be used for the value of this key, if any
    // (only objects and dictionaries parsers have items parsers)
    public itemParserForKey(_key:string):TSParser|undefined { return undefined ; }

    protected _validate(value:any, path:string, opts?:Nullable<TSParserOptions>):boolean { 
        if (this.mandatory && !$ok(value)) {
            return _serror(opts, path, 'is mandatory') ;
        }
        return true 
    }

    protected constructor(mandatory:boolean, checker:Nullable<(v:any)=>boolean>, transformer:Nullable<(v:any)=>any>, natifier:Nullable<(v:any)=>TSNativeValue>) { 
        this.mandatory = mandatory ; 
        if ($isfunction(checker)) { this._check = checker! ; }
        if ($isfunction(transformer)) { this._transform = transformer! ; }
        if ($isfunction(natifier)) { this._natify = natifier! ; }
    } ;
}

// ========================== PRIVATE CLASSES ==========================================
class TSDictionaryParser extends TSParser {
    private _keysParser:TSLeafParser ;
    private _valuesParser:TSParser ;

    public constructor(node:TSObjectNode, keysParser:TSParser, valuesParser:TSParser) {
        const m = node._mandatory ;
        super(!!m, node._checker as any, node._transformer as any, node._natifier as any) ;

        if (!(keysParser instanceof TSLeafParser) || !keysParser.isKey) {
            this.errors.push('_keysType field is not a valid node key definition') 
            //this.errors.push(`_keysType instance is ${keysParser?.constructor.name}`) 
        }
        if ($ok(keysParser.includedDefaultValue()) || $ok(valuesParser.includedDefaultValue())) {
            this.errors.push(`_keysParser or _valuesParser cannot contain a default value`) ;
        }
        if ($defined(m) && !$isbool(m)) { this.errors.push(`_mandatory field should be a boolean`) ; }
        if ($ok(node._keysCase)) { this.errors.push(`_keysCase field should not be set for a dictionary`) ; }
        
        this._keysParser = keysParser as TSLeafParser ;
        this._valuesParser = valuesParser! ;
    }

    public nodeType():TSParserNodeType { return 'object' ; }
    public override itemParserForKey(_key:string):TSParser|undefined { return this._valuesParser ; }

    public toJSON():object { return {
        _type: 'dictionary',
        _mandatory:this.mandatory,
        _check: this._check,
        _transform: this._transform,
        _natify: this._natify,
        _keysStruct: this._keysParser.toJSON(),
        _valuesStruct: this._valuesParser.toJSON()
    } ; }

    protected _validate(value:any, path:string, opts?:Nullable<TSParserOptions>):boolean {
        if (!super._validate(value, path, opts)) { return false ; }
        if ($ok(value) && ($isarray(value) || !$isobject(value))) { 
            return _serror(opts, path, 'is not a dictionary') ;
        }
        if (!$ok(value)) { return true ; } // a non mandatory absent value is valid (it used to throw)
        const entries = Object.entries(value) ;
        if (!entries?.length && this.mandatory) { return _serror(opts, path, ` is empty`) ; }
        let doomed = false ;

        const p = path.length ? path : 'dict' ;
        for (let [k, v] of entries) {
            // @ts-ignore
            if (!this._keysParser._validate(k, `${p}.${k}[key]`, opts)) { doomed = true ; } 
            // @ts-ignore
            if (!this._valuesParser._validate(v, `${p}.${k}`, opts)) { doomed = true ; }  
        }
        if (doomed) { return false ; }
        return this._check(value, opts) ? true : _serror(opts, path, 'specific check did fail') ;
    }

    public rawInterpret(value:any, opts?:Nullable<TSParserOptions>):any {
        const ret:any = {}
        if (!$ok(value) && !this.mandatory) { return value ; }
        const entries = Object.entries(value) ;
        for (let [k, v] of entries) {
            const ki = this._keysParser.rawEncode(k, opts) ; 
            const vi = this._valuesParser.rawInterpret(v, opts) ;
            if ($ok(ki) && $ok(vi)) { ret[ki] = vi ; } 
        }
        return this._transform(ret, opts) ;
    }

    public rawEncode(value:any, opts?:Nullable<TSParserOptions>):any {
        if (!$ok(value)) { return value ; } // a non mandatory absent value (it used to throw)
        const ret:any = {}
        const entries = Object.entries(value) ;
        for (let [k, v] of entries) {
            const ki = this._keysParser.rawEncode(k, opts) ; 
            const vi = this._valuesParser.rawEncode(v, opts) ;
            if ($ok(ki) && $ok(vi)) { ret[ki] = vi ; } 
        }
        return this._natify ? this._natify(ret, opts) : ret ;
    }

}

class TSObjectParser extends TSParser {
    private _itemsParsers:TSDictionary<TSParser> ;
    private _count:number ;
    private _keyTransform:(s:string)=>string = (s:string) => s ;
    private _keysCase:TSCase = TSCase.standard ;
    private _acceptsUncheckedItems:boolean ;
    private _defaultValueKeys:string[] = [] ; 
    private _aliases:Map<string, string> ;
    private _outputAliases:Map<string, string> ;
    private _aliasUnsensitive:boolean ;

    public constructor(node:TSObjectNode, itemsParsers:TSDictionary<TSParser>, acceptsUncheckedItems:boolean) {
        const m = node._mandatory ;
        super(!!m, node._checker as any, node._transformer as any, node._natifier as any) ;

        if ($defined(m) && !$isbool(m)) { this.errors.push(`_mandatory field should be a boolean`) ; }

        const l = $value(node._keysCase as Nullable<TSCase>, TSCase.standard) ;
        const kt = InternalCasingMap[l]
        if (!$defined(kt)) { 
            this.errors.push(`_keysCase field should be one of ${Array.from($keys(InternalCasingMap))}`) ; 
        }
        else { 
            this._keyTransform = kt ; 
            this._keysCase = l ;
        }
        this._acceptsUncheckedItems = acceptsUncheckedItems ;
        this._itemsParsers = itemsParsers ;
        this._count = $objectcount(itemsParsers) ;
        this._aliasUnsensitive = !!node._aliasUnsensitive ;
        this._aliases = this._aliasesMap(node._aliases as Map<string,string> | undefined) ;
        this._outputAliases = $ok(node._outputAliases) ? new Map(node._outputAliases as Map<string,string>) : new Map() ;

        const entries = Object.entries(itemsParsers) ;
        for (let [k, p] of entries) {
            if ($ok(p.includedDefaultValue())) { this._defaultValueKeys.push(k) ; }
        }
    }

    public nodeType():TSParserNodeType { return 'object' ; }

    public override itemParserForKey(key:string):TSParser|undefined { return this._itemsParsers[this._resolvedKey(key)] ; }

    // an item key is resolved with the aliases first, then with the keys case
    private _resolvedKey(key:string):string {
        return this._keyTransform($value(this._aliases.get(this._aliasUnsensitive ? key.toLowerCase() : key), key)) ;
    }

    // insensitive aliases are stored in lowercase (and should not be defined twice)
    private _aliasesMap(aliases:Map<string,string>|undefined):Map<string,string> {
        if (!aliases?.size) { return new Map() ; }
        if (!this._aliasUnsensitive) { return new Map(aliases) ; }
        const ret = new Map<string,string>() ;
        for (let [ak, tk] of aliases) {
            ak = ak.toLowerCase() ;
            if (ret.get(ak)) {
                this.errors.push(`_aliases field should not contain insensitive similar alias ${ak} twice.`) ; 
            } 
            ret.set(ak, tk) ; 
        }
        return ret ;
    }

    public toJSON():object {
        const ret:any = {
            _type: 'object',
            _mandatory:this.mandatory,
            _check: this._check,
            _transform: this._transform,
            _natify: this._natify,
            _acceptsUncheckedItems: this._acceptsUncheckedItems
        } ;
        if (this._keysCase !== 'standard') { ret._keysCase = this._keysCase ; }
        if (this._aliases.size > 0) { ret._aliases = this._aliases ; }
        if (this._outputAliases.size > 0) { ret._outputAliases = this._outputAliases ; }

        const structEntries = Object.entries(this._itemsParsers) ;
        for (let [k, struct] of structEntries) {
            ret[k] = struct.toJSON()
        }
        
        return ret ;
    }

    protected _validate(value:any, path:string, opts?:Nullable<TSParserOptions>):boolean {
        if (!super._validate(value, path, opts)) { return false ; }
        if ($ok(value) && ($isarray(value) || !$isobject(value))) { 
            return _serror(opts, path, 'is not an object') ;
        }
        if (!$ok(value)) { return true ; } // a non mandatory absent value is valid (it used to throw) 

        const p = path.length ? path : 'object' ;
        const founds = new Set<string>() ;
        let doomed = false ;
        for (let [key, v] of Object.entries(value)) {
            if (!this._validateItem(this._resolvedKey(key), v, founds, path, p, opts)) { doomed = true ; }
        }
        // look for mandatory fields not present
        if (founds.size < this._count && !this._mandatoryItemsFound(founds, path, opts)) { doomed = true ; }
        if (doomed) { return false ;}
        return this._check(value, opts) ? true : _serror(opts, path, 'specific check did fail') ;
    }

    // a described item is added to founds, even if it is not valid (an invalid mandatory
    // item used to be also reported as missing)
    private _validateItem(k:string, v:any, founds:Set<string>, path:string, itemsPath:string, opts?:Nullable<TSParserOptions>):boolean { // NOSONAR: private method, all parameters are needed
        if (founds.has(k)) { return _serror(opts, path, `.${k} is present several times`) ; }
        const struct = this._itemsParsers[k] ;
        if (!$ok(struct)) { return this._acceptsUncheckedItems || _serror(opts, path, `.${k} is unknown`) ; }
        founds.add(k) ;
        // @ts-ignore
        return struct._validate(v, `${itemsPath}.${k}`, opts) ;
    }

    private _mandatoryItemsFound(founds:Set<string>, path:string, opts?:Nullable<TSParserOptions>):boolean {
        let ret = true ;
        for (let [k, struct] of Object.entries(this._itemsParsers)) {
            if (!founds.has(k) && struct.mandatory) {
                _serror(opts, path, `.${k} is mandatory`) ;
                ret = false ;
            }
        }
        return ret ;
    }

    public rawInterpret(value:any, opts?:Nullable<TSParserOptions>):any {
        if (!$ok(value) && !this.mandatory) { return value ; }
        const ret:any = {}
        for (let [key, v] of Object.entries(value)) {
            const k = this._resolvedKey(key) ;
            const struct = this._itemsParsers[k] ;
            // if this just a non described item, we keep it as it was
            const res = $ok(struct) ? struct.rawInterpret(v, opts) : v ;
            if ($ok(res) || !$ok(struct)) { ret[k] = res ; }
        }
        
        for (let k of this._defaultValueKeys) {
            const kf = this._resolvedKey(k) ;
            if (!$ok(ret[kf])) {
                ret[kf] = this._itemsParsers[k].includedDefaultValue() ;
            }
        }

        return this._transform(ret, opts) ;
    }
    
    public rawEncode(value:any, opts?:Nullable<TSParserOptions>):any {
        if (!$ok(value)) { return value ; } // a non mandatory absent value (it used to throw)
        const ret:any = {}
        for (let [key, v] of Object.entries(value)) {
            const k = this._resolvedKey(key) ;
            const struct = this._itemsParsers[k] ;
            // a non described item (accepted with _acceptsUncheckedItems) is kept as it was, like in rawInterpret()
            // the options are given to the items parsers (the context used to be lost for the object items)
            const res = $ok(struct) ? struct.rawEncode(v, opts) : v ; 
            if ($ok(res)) { ret[$value(this._outputAliases.get(k), k)] = res ; }
        }
        return this._natify ? this._natify(ret, opts) : ret ;
    }
}

class TSArrayParser extends TSParser {
    private _min:number ;
    private _max:number ;
    private _itemsParser:TSParser ;

    public constructor(node:TSExtendedArrayNode, itemParser:TSParser) {
        const m = node._mandatory ;
        let min = 0, max = UINT_MAX ;
        const errors:Array<string> = [] ;
        if ($ok(node._min)) { 
            if (!$isunsigned(node._min)) {
                errors.push(`wrong minimal size definition for array node`) ;
            }
            else { min = $unsigned(node._min) ; }
        }
        if ($ok(node._max)) { 
            if (!$isunsigned(node._max)) {
                errors.push(`wrong maximal size definition for array node`) ;
            }
            else { max = $unsigned(node._max) ; }
        }
        if (min > max) {
            errors.push(`maximal size < minimal size for array node`) ;
        }
        if ($ok(itemParser.includedDefaultValue())) {
            errors.push(`_itemsParser cannot contain a default value`) ;
        }

        super($ok(m) ? !!m : min > 0, node._checker, node._transformer, node._natifier as any) ;

        if ($defined(m) && !$isbool(m)) { this.errors.push(`_mandatory field should be a boolean`) ; }

        this._min = min ;
        this._max = max ;
        this._itemsParser = itemParser ;
        for (let e of errors) { this.errors.push(e) ; }
    }

    public nodeType():TSParserNodeType { return 'array' ; }

    public toJSON():object { return {
        _type: 'array',
        _mandatory:this.mandatory,
        _min: this._min > 0 ? this._min : 'none',
        _max: this._max < UINT_MAX ? this._max : 'none',
        _check: this._check,
        _transform: this._transform,
        _natify: this._natify,
        _itemsStruct: this._itemsParser.toJSON()
    } ; }

    protected _validate(value:any, path:string, opts?:Nullable<TSParserOptions>):boolean {
        if (!super._validate(value, path, opts)) { return false ; }
        if ($ok(value) && !$isarray(value)) { // TODO: accepts other classes than array (like collections) 
            return _serror(opts, path, 'is not an array') ;
        } 
        const n = $count(value) ;
        if (n < this._min) { 
            return _serror(opts, path, `.size is too small (${n} < ${this._min})`) ;
        }
        if (n > this._max) { 
            return _serror(opts, path, `.size is too large (${n} > ${this._max})`) ;
        }
        const p = path.length ? path : 'array' ;
        let doomed = false ;
        for (let i = 0 ; i < n ; i++) { 
            // @ts-ignore
            if (!this._itemsParser._validate(value[i], `${p}[${i}]`, opts)) { doomed = true ; } 
        }
        if (doomed) { return false ; }
        return this._check(value, opts) ? true : _serror(opts, path, 'specific check did fail') ;
    }

    public rawInterpret(value:any, opts?:Nullable<TSParserOptions>):any {
        if (!$ok(value) && !this.mandatory) { return value ; }
        const ret:Array<any> = [] ;
        for (let v of value) { 
            ret.push(this._itemsParser.rawInterpret(v, opts)) ;
        }
        return this._transform(ret, opts) ;
    }

    public rawEncode(value:any, opts?:Nullable<TSParserOptions>):any {
        if (!$ok(value)) { return value ; } // a non mandatory absent value (it used to throw)
        const ret:Array<any> = [] ;
        for (let v of value) { 
            ret.push(this._itemsParser.rawEncode(v, opts)) ;
        }
        return this._natify ? this._natify(ret, opts) : ret ;
    }

}

export function isLeafParserType(s:Nullable<string>) {
    return $length(s) ? TSLeafParser.isLeafParserType(s!) : false ;
}
class TSLeafParser extends TSParser {
    private _manager:TSLeafNodeManager ;
    private _type:TSLeafOptionalNode ;
    private _conversion:TSDictionary<number|string>|undefined ;
    private _reverse:Map<string|number, string>|undefined ;
    private _enumeration:Set<string|number>|undefined ;
    private _options:TSDictionary|undefined ;
    private _defaultValue:any = undefined ;
    private _exportAsEnum:boolean = false ;

    public static __managers:{ [key in TSLeafOptionalNode]?:TSLeafNodeManager } = {
        'boolean' :  { valid:_isBoolean, trans:$bool, str2v:$bool}, // QUESTION?: should we use v2nat here
        'charset' :  { valid:_isCharset, str2v:(s:string) => TSCharset.charset(s), v2nat:(v:any) => v.name},
        'color':     { valid:_iscolor, str2v:(s:string) => TSColor.fromString(s), v2nat:_color2str},
        'continent': { valid:_isContinent, str2v:(s:string) => $ftrim(s).toUpperCase(), enum:_isContinent, iskey:true},
        'country':   { valid:_isCountry, trans:_countryTrans, str2v:(s:string) => $ftrim(s).toUpperCase(), v2nat:(v:any) => v.alpha2Code, enum:(v:any) => TSCountrySet.has(v), iskey:true},
        'currency':  { valid:_isCurrency, str2v:(s:string) => $ftrim(s).toUpperCase(), enum:_isCurrency, iskey:true},
        'data' :     { valid:_isData, str2v:_decodeb64, v2nat:_encodeb64},
        'date' :     { valid:_isTsDate, str2v:(s:string) => TSDate.fromIsoString(s), v2nat:(v:any) => v.toIsoString()},
        'email':     { valid:(v:any) => $isemail(v), str2v:(s:string) => $email(s), iskey:true },
        'hexa':      { valid:_isHexaData, str2v:_decodeHexa, v2nat:(v:any) => $encodeHexa(v)},
        'ipaddress': { valid:$isipaddress, str2v:(s:string) => $ftrim(s), enum:$isipaddress, iskey:true},
        'ipv4':      { valid:$isipv4, str2v:(s:string) => $ftrim(s), enum:$isipv4, iskey:true},
        'ipv6':      { valid:$isipv6, str2v:(s:string) => $ftrim(s), enum:$isipv6, iskey:true},
        'int':       { valid:(v:any) => _isInt(v, INT_MIN,   INT_MAX),   str2v:_int, enum:(v) => _isInt(v, INT_MIN, INT_MAX), iskey:true },
        'int8':      { valid:(v:any) => _isInt(v, INT8_MIN,  INT8_MAX),  str2v:_int, enum:(v) => _isInt(v, INT8_MIN, INT8_MAX), iskey:true },
        'int16':     { valid:(v:any) => _isInt(v, INT16_MIN, INT16_MAX), str2v:_int, enum:(v) => _isInt(v, INT16_MIN, INT16_MAX), iskey:true },
        'int32':     { valid:(v:any) => _isInt(v, INT32_MIN, INT32_MAX), str2v:_int, enum:(v) => _isInt(v, INT32_MIN, INT32_MAX), iskey:true },
        'jsdate':    { valid:_isJsDate, str2v:(s:string) => new Date(s), v2nat:(v:any) => v.toISOString()},
        'language':  { valid:_isLanguage, str2v:(s:string) => $ftrim(s).toLowerCase(), enum:_isLanguage, iskey:true},
        'native' :   { valid:_isNativeValue, str2v:(s:string) => s, v2nat:_nativeValue2nat},
        'number' :   { valid:_isNumber, str2v:(s:string) => Number(s), enum:(v) => $isnumber(v)},
        'paper':     { valid:_isDocumentFormat, str2v:(s:string) => $ftrim(s).toLowerCase(), enum:_isDocumentFormat, iskey:true},
        'path':      { valid:_isPath, str2v:(s:string) => s, enum:_isPath, iskey:true },
        'phone':     { valid:(v:any) => $isphonenumber(v), str2v:(s:string) => TSPhoneNumber.fromString(s), v2nat:(v:TSPhoneNumber) => v.standardNumber, iskey:true },
        'string':    { valid:(v:any) => typeof v === 'string', str2v: (s:string) => s, enum:(v) => typeof v === 'string' && v.length > 0, iskey:true},
        'uint8':     { valid:(v:any) => _isInt(v, 0, UINT8_MAX),  str2v:_uint, enum:(v) => _isInt(v, 0, UINT8_MAX), iskey:true },
        'uint16':    { valid:(v:any) => _isInt(v, 0, UINT16_MAX), str2v:_uint, enum:(v) => _isInt(v, 0, UINT16_MAX), iskey:true },
        'uint32':    { valid:(v:any) => _isInt(v, 0, UINT32_MAX), str2v:_uint, enum:(v) => _isInt(v, 0, UINT32_MAX), iskey:true },
        'unsigned':  { valid:(v:any) => _isInt(v, 0), str2v:_uint, enum:(v) => _isInt(v, 0), iskey:true },
        'url':       { valid:_isURL, trans:_valueToTSURL, str2v:_stringToUrl, v2nat:(v:any) => v.href, enum:_isStringURL, iskey:true },
        'uuid':      { valid:(v:any) => $isuuid(v), str2v:(s:string) => $UUID(s), enum:(v:any) => $isuuid(v), iskey:true },
    }

    public static isLeafParserType(s:string):boolean { return $ok(TSLeafParser.__managers[s as TSLeafOptionalNode])}

    private static __dummyManager:TSLeafNodeManager = { valid:(_:any)=>false, str2v:(_:string) => undefined} ;

    public constructor(node:TSExtendedLeafNode) {
        const manager =  $isstring(node._type) ? TSLeafParser.__managers[node._type] : undefined ;
        const transformer = node._transformer ?? manager?.trans ?? undefined ;
        const natifier = node._natifier ?? manager?.v2nat ?? undefined ;
        const mandatory = !!node._mandatory ;

        super(mandatory, node._checker, transformer, natifier) ;

        if (!$ok(manager)) { 
            this.errors.push(`Invalid parser type '${node._type}'`) ;
            this._manager = TSLeafParser.__dummyManager ;
        }
        else { this._manager = manager! ;}

        const enumeration = node._enum ;
        if ($isarray(enumeration)) { this._setArrayEnumeration(enumeration as Array<string|number>, node, manager) ; }
        else if ($isobject(enumeration)) { this._setDictionaryEnumeration(enumeration as TSDictionary<string|number>, node, manager) ; }
        else if ($ok(enumeration)) {
            this.errors.push(`Bad enumeration definition for type '${node._type}'`) ;
        }
        if ($ok(node._options)) { this._options = node._options ;}
        if ($ok(node._default)) { this._setDefaultValue(node, mandatory, manager) ; }
        
        this._type = node._type ;
    }

    // a type without enumeration support gives errors (manager.enum used to be called anyway, which did throw)
    private _setArrayEnumeration(enumeration:Array<string|number>, node:TSExtendedLeafNode, manager:TSLeafNodeManager|undefined) {
        if (!$ok(manager?.enum)) { this.errors.push(`Parser type '${node._type}' does not support enumeration`) ; }
        if (!enumeration.length) { this.errors.push(`Empty enumeration definition array for type '${node._type}'`) ; }
        for (let e of enumeration) { 
            if (!manager?.enum?.(e)) { 
                this.errors.push(`Enumeration value '${e}' is invalid for type '${node._type}'`) ;
            }
        }
        this._enumeration = new Set(enumeration) ;
    }

    private _setDictionaryEnumeration(enumeration:TSDictionary<string|number>, node:TSExtendedLeafNode, manager:TSLeafNodeManager|undefined) {
        if (!$ok(manager?.enum)) { this.errors.push(`Parser type '${node._type}' does not support enumeration`) ; }
        this._enumeration = new Set<string|number>() ;
        this._reverse = new Map() ;
        for (let [key, item] of Object.entries(enumeration)) {
            if (!key.length || !IsFielOrEnumdRegex.test(key)) { this.errors.push(`Wrong enumeration key '${key}' for type '${node._type}'`) ; }
            if (manager?.enum?.(item)) {
                this._enumeration.add(item) ;
                this._reverse.set(item, key) ;
            }
            else {
                this.errors.push(`Enumeration value '${item}' for key '${key}' is invalid for type '${node._type}'`) ;
            }
        }
        if (!this._enumeration.size) { this.errors.push(`Empty enumeration definition dictionary for type '${node._type}'`) ; }
        this._conversion = enumeration ;
        this._exportAsEnum = !!node._exportAsEnum ;
    }

    private _setDefaultValue(node:TSExtendedLeafNode, mandatory:boolean, manager:TSLeafNodeManager|undefined) {
        if (mandatory) {
            this.errors.push(`Parser type '${node._type}' cannot be mandatory and have a default value at the same time`) ;
        }
        else if (!manager?.valid(node._default)) {
            this.errors.push(`Parser type '${node._type}' cannot have ${node._default} as default value`) ;
        }
        else {
            this._defaultValue = node._default ;
        }
    }

    public get isKey() { return !!this._manager.iskey ; }

    public nodeType():TSParserNodeType { return this._type ; }
    public includedDefaultValue():any { return this._defaultValue ; }

    public toJSON():object { return {
        _type: this._type,
        _mandatory:this.mandatory,
        _enumeration: $ok(this._enumeration) ? Array.from(this._enumeration!) : 'none',
        _conversion:  $value(this._conversion as any, 'none'),
        _check: this._check,
        _transform: this._transform,
        _natify: this._natify,
        _defaultValue: this._defaultValue
    } ; }

    private _localOptions(opts:Nullable<TSParserOptions>):TSParserActionOptions|undefined {
        let localOptions:TSParserActionOptions|undefined = undefined ;
        if ($ok(opts)) { localOptions = $ok(this._options) ? {...opts!, options:this._options! } : opts! }
        else if ($ok(this._options)) { localOptions = { options:this._options! }}
        return localOptions ;
    }

    protected _validate(value:any, path:string, opts?:Nullable<TSParserOptions>):boolean {
        if (!$ok(value)) { value = this._defaultValue ; }
        if (!super._validate(value, path, opts)) { return false ; }
        if (this._conversion && $isstring(value)) { 
            const tag = value ;
            value = this._conversion![tag] ; 
            if (!$ok(value)) {
                return _serror(opts, path, `has not a valid enum tag ${tag}`) ;
            }
        }
        let lopts = this._localOptions(opts) ;
        if ($ok(value) && !this._manager.valid(value, lopts)) {
            return _serror(opts, path, `is not a valid ${this._type}`) ;
        }
        if (this._enumeration) {
            if (!this._enumeration.has(this._convertIfString(value, lopts))) {
                const s = $isstring(value) ? "'"+value+"'" : value ;
                return _serror(opts, path, `has not a valid enum value ${s}`) ;
            }
        }
        return this._check(value, opts) ? true : _serror(opts, path, 'specific check did fail') ;
    }

    private _convertIfString(value:any, opts?:Nullable<TSParserActionOptions>):any
    { return this._transform($isstring(value) ? this._manager.str2v(value, opts) : value, opts) ; }
    
    public rawInterpret(value:any, opts?:Nullable<TSParserOptions>):any {
        if (!$ok(value)) { value = this._defaultValue ; }
        if (!$ok(value) && !this.mandatory) { return value ; }

        if (this._conversion && $isstring(value)) {
            value = this._conversion![value] ; 
        } 
        const r = this._convertIfString(value, this._localOptions(opts)) ;
        return r ;
    }

    public rawEncode(value:any, opts?:Nullable<TSParserOptions>):any {
        if (this._conversion && $isstring(value)) {
            value = $value(this._conversion![value], value) ; 
        }
        if (this._exportAsEnum && $ok(this._reverse)) {
            value = $value(this._reverse!.get(value), value) ;
        }

        if (!$ok(value)) { return value ; }

        switch (typeof value) {
            case 'bigint':   return Number(value) ;
            case 'boolean':  return value ;
            case 'number':   return value ;
            case 'object':   return this._natify ? this._natify(value, this._localOptions(opts)) : $string(value) ;
            case 'string':   return value ;
            case 'symbol':   return $string(value) ;
            default:         return null ;
        }
    }
}
// ========================== EXPORTED FUNCTIONS ==============================================================
export function $bool(v:any, opts?:Nullable<TSParserActionOptions>):boolean {
    switch (typeof v) {
        case 'bigint':   { v = Number(v) ; return !Number.isNaN(v) && v !== 0 ; }
        case 'boolean':  return v ;
        case 'number':   return !Number.isNaN(v) && v !== 0 ;
        case 'string':   return !!_stringToBoolean(v, opts) ;
        case 'symbol':   return !!_stringToBoolean($string(v), opts) ;
        default:         return false ;
    }
}

export { $bool as $isLE }

export function $validateParsedValue(v:NonNullable<any>, type:TSLeafOptionalNode, opts?:Nullable<TSParserActionOptions>):boolean
{ return $ok(v) && !!TSLeafParser.__managers[type]?.valid(v, opts) ; }

// ========================== PRIVATE CONSTANTS, TYPES AND FUNCTIONS ==========================================

interface TSLeafNodeManager {
    valid:(v:any, opts?:Nullable<TSParserActionOptions>) => boolean ;
    str2v:(s:string, opts?:Nullable<TSParserActionOptions>) => any ;
    v2nat?:(v:any, opts?:Nullable<TSParserActionOptions>) => TSNativeValue ;
    trans?:(v:any, opts?:Nullable<TSParserActionOptions>) => any ;
    enum?:(v:any, opts?:Nullable<TSParserActionOptions>) => boolean ;
    iskey?:boolean ;
}

function _isNativeValue(v:any):boolean {
    switch (typeof v) {
        case 'bigint': v = Number(v) ;  return !Number.isNaN(v) && Number.isFinite(v) ;
        case 'number': return !Number.isNaN(v) && Number.isFinite(v) ;
        case 'boolean': case 'string': case 'symbol': return true ;
        default: return false ;
    }
}

function _nativeValue2nat(v:any):TSNativeValue {
    switch (typeof v) {
        case 'bigint': return Number(v) ;
        case 'number': case 'boolean': case 'string': return v ;
        case 'symbol': return $string(v) ;
        case 'undefined': return undefined ;
        default: return null ;
    }
}

function _isCharset(v:any):boolean          { return v instanceof TSCharset || ($isstring(v) && $ok(TSCharset.charset(v))) ; }
function _isContinent(v:any):boolean        { return $isstring(v) && TSContinentSet.has($ftrim(v).toUpperCase() as continent) ; }
function _isCurrency(v:any):boolean         { return $isstring(v) && TSCurrencySet.has($ftrim(v).toUpperCase() as currency) ; }
function _isDocumentFormat(v:any):boolean   { return $isstring(v) && $ok(TSDocumentFormats[$ftrim(v).toLowerCase() as TSDocumentFormat]) ; }
//function _isIPAddress(v:any):boolean        { return $isipaddress(v) ; }
//function _isIPV4(v:any):boolean             { return $isipv4(v) ; }
//function _isIPV6(v:any):boolean             { return $isipv6(v) ; }
function _isLanguage(v:any):boolean         { return $isstring(v) && TSLanguageSet.has($ftrim(v).toLowerCase() as language) ; }
function _isNumber(v:any):boolean           { return $isnumber(v) || ($isstring(v) && $isnumber(Number(v))); }

function _isCountry(v:any):boolean { 
    if (v instanceof TSCountry) { return true ; } 
    if ($isnumber(v) && v >=1 && $ok(TSCountry.alpha2CodeForNumericCode(v))) { return true ; }
    if ($isstring(v)) {
        const s = $ftrim(v).toUpperCase() ;
        return (s.length === 2 && TSCountrySet.has(s as country)) || (s.length === 3 && $ok(TSCountry.alpha2CodeForAlpha3Code(s)))
    }
    return false ;
}

function _countryTrans(v:any):any { 
    if (v instanceof TSCountry) { return v.alpha2Code ; } 
    if ($isnumber(v)) { return TSCountry.alpha2CodeForNumericCode(v) ; }
    return v.length === 3 ? TSCountry.alpha2CodeForAlpha3Code(v) : v ;
}

// [true strings, false strings]
const __jsonBooleanStrings:[Set<string>, Set<string>] = [new Set(['true']), new Set(['false'])] ;
const __booleanStrings:[Set<string>, Set<string>] = [new Set(['true', '1', 'y', 'yes']), new Set(['false', '0', 'n', 'no'])] ;

function _stringToBoolean(s:string, opts?:Nullable<TSParserActionOptions>):boolean | null {
    s = $ascii($ftrim(s)).toLowerCase() ;
    const [trueStrings, falseStrings] = opts?.context === TSParserActionContext.json ? __jsonBooleanStrings : __booleanStrings ;
    if (trueStrings.has(s)) { return true ; }
    return falseStrings.has(s) ? false : null ;
}

function _isBoolean(v:any, opts?:Nullable<TSParserActionOptions>):boolean   
{ return $isbool(v) || v === 0 || v === 1 || ($isstring(v) && $ok(_stringToBoolean(v, opts))) ;}

function _isPath(v:any, opts?:Nullable<TSParserActionOptions>):boolean
{ 
    if (typeof v === 'string' && $ftrim(v).length > 0) {
        if (v.toLowerCase().startsWith('file:')) { return false ; }
        const absolute = v.startsWith('/') ;
        return (!opts?.options?.absolute || absolute) && $isurl('file://localhost'+(absolute?v:'/'+v)) ;
    }
    return false ;
}

function _isURL(v:any, opts?:Nullable<TSParserActionOptions>):boolean
{ return $isurl(v, { refusesParameters:opts?.context === TSParserActionContext.url || !!opts?.options?.refusesParameters, acceptedProtocols:opts?.options?.acceptedProtocols }) ; }

function _isStringURL(v:any, opts?:Nullable<TSParserActionOptions>):boolean
{ return typeof v === 'string' && _isURL(v, opts) ; }

function _stringToUrl(s:string, opts?:Nullable<TSParserActionOptions>):TSURL|null
{ return TSURL.url(s, { refusesParameters:opts?.context === TSParserActionContext.url || !!opts?.options?.refusesParameters , acceptedProtocols:opts?.options?.acceptedProtocols })}

function _valueToTSURL(v:any, opts?:Nullable<TSParserActionOptions>):TSURL {
    if (v instanceof TSURL) { return v ; }
    if (!(v instanceof URL)) { TSError.throw('Impossible to convert any object to TSURL')} ;
    const ret = TSURL.from(v, { refusesParameters:opts?.context === TSParserActionContext.url || !!opts?.options?.refusesParameters , acceptedProtocols:opts?.options?.acceptedProtocols }) ;
    if (!$ok(ret)) { TSError.throw('Impossible to convert URL to TSURL')} ;
    return ret! ;
}

const _b64regex =    /^[A-Za-z0-9\+\/]+[\=]*$/ ;
const _b64URLregex = /^[A-Za-z0-9\-\_]+[\=]*$/ ;
function _isData(v:any, opts?:Nullable<TSParserActionOptions>):boolean      
{ return $isdataobject(v) || ($isstring(v) && (opts?.context === TSParserActionContext.url ? _b64URLregex : _b64regex).test(v)) ; }

function _encodeb64(v:any, opts?:Nullable<TSParserActionOptions>)
{ return opts?.context === TSParserActionContext.url  ? $encodeBase64URL(v) : $encodeBase64(v) ; }

function _decodeb64(s:string, opts?:Nullable<TSParserActionOptions>)
{ return opts?.context === TSParserActionContext.url ? $decodeBase64URL(s) : $decodeBase64(s) ; }

function _decodeHexa(s:string):Buffer { return $bufferFromHexaString(s)! ; } // here we are sure that the string is a valid hexa string, so we can use the ! operator   

function _isHexaData(v:any):boolean  
{ return $isdataobject(v) || ($isstring(v) && $ok($bufferFromHexaString(v))) ;}

function _int(v:any)  { return $int(v) ; }
function _uint(v:any) { return $unsigned(v) ; }
function _isInt(v:any, min:number = INT_MIN, max:number = INT_MAX):boolean
{ return $isint(v, min, max) || ($isstring(v) && $isint(Number(v), min, max)) }

function _isJsDate(v:any):boolean 
{ return v instanceof Date || ($isstring(v) && v !== '0' && $isnumber(Date.parse(v))) ; }

function _isTsDate(v:any):boolean
{ return v instanceof TSDate || ($isstring(v) && $ok($isodate(v)))}

function _iscolor(o:any) : boolean
{ return o instanceof TSColor || ($isstring(o)) && $ok(TSColor.fromString(o)) ; }


function _color2str(v:any):string { return v.toString({ colorSpace:TSColorSpace.RGB, removeAlpha:false, rgbaCSSLike:true, shortestCSS:false, uppercase:false}) ; }

function _serror(opts:Nullable<TSParserOptions>, path:string, error:string):false {
    opts?.errors?.push(`${path.length>0?path:'value'}${error.startsWith('.')?'':' '}${error}${error.endsWith('')?'':'.'}`) ;
    return false ;
}

// this is the function wich convert you data model definition
// into a tree of structures
// no 'g' flag: with it, test() would keep its lastIndex from one key to the next one
const IsFielOrEnumdRegex = /^[a-zA-Z][a-zA-Z0-9_-]*$/
const InternalFieldsSet = new Set(['_mandatory', '_default', '_keysCase', '_checker', '_transformer', '_natifier', '_acceptsUncheckedItems', '_aliases', '_outputAliases', '_aliasUnsensitive']) ;
const InternalCasingMap:{[key in TSCase]:(s:string)=>string} = {
    'standard':(s:string)=> s,
    'lowercase':(s:string)=> s.toLowerCase(),
    'uppercase':(s:string)=> s.toUpperCase()
} ;

function _structureConstruction(node:TSNode, errors:Nullable<string[]>):TSParser|null {
    if ($isstring(node)) {
        let mandatory = (node as TSMandatoryLeafNode).endsWith('!') ;
        if (mandatory) { node = node.left(node.length-1) as TSLeafOptionalNode ; }
        return new TSLeafParser({ _type:node as TSLeafOptionalNode, _mandatory:mandatory}) ;
    }
    if ($isarray(node)) { return _arrayConstruction(node as Array<any>, errors) ; }
    if (!$isobject(node)) { return null ; }

    const n = node as TSObjectNode ;
    // this is a leaf node
    if ($ok((node as TSExtendedLeafNode)._type)) { return new TSLeafParser(node as TSExtendedLeafNode) ; }
    if ($ok(n._keysType) || $ok(n._valueItemsType)) { return _dictionaryConstruction(n, errors) ; }
    if ($ok((node as TSExtendedArrayNode)._itemsType)) {
        // this is an array
        const itemsParser = _validSubParser((node as TSExtendedArrayNode)._itemsType, errors) ;
        return $ok(itemsParser) ? new TSArrayParser(node as TSExtendedArrayNode, itemsParser) : null ;
    }
    return _objectConstruction(n, errors) ;
}

// returns the parser of a sub node, or null (with the parser errors) if it is not valid
function _validSubParser(node:TSNode, errors:Nullable<string[]>):TSParser|null {
    const parser = _structureConstruction(node, errors) ;
    if (!parser?.isValid) { 
        if ($count(parser?.errors)) { errors?.push(...parser!.errors) ; }
        return null ; 
    }
    return parser ;
}

// [itemsType, min?, max?]
function _arrayConstruction(a:Array<any>, errors:Nullable<string[]>):TSParser|null {
    if (a.length === 0 || a.length > 3) {
        errors?.push('wrong empty array node definition') ;
        return null ;
    }
    const min = _arraySize(a, 1, 'minimal', errors) ;
    const max = _arraySize(a, 2, 'maximal', errors) ;
    const itemsType = (a as TSArrayNode)[0] ;
    const itemsParser = _validSubParser(itemsType, errors) ;
    return $ok(itemsParser) ? new TSArrayParser({ _itemsType:itemsType!, _min: min, _max: max }, itemsParser) : null ;
}

function _arraySize(a:Array<any>, index:number, kind:string, errors:Nullable<string[]>):number|undefined {
    if (a.length <= index || !$ok(a[index])) { return undefined ; }
    if (!$isunsigned(a[index])) {
        errors?.push(`wrong ${kind} size definition for array node`) ;
        return undefined ;
    }
    return $unsigned(a[index]) ;
}

function _dictionaryConstruction(node:TSObjectNode, errors:Nullable<string[]>):TSParser|null {
    if ($ok(node._acceptsUncheckedItems)) {errors?.push('_acceptsUncheckedItems field cannot be set for a dictionary node definition') ; }
    if (!$ok(node._keysType)) { errors?.push('_keysType field is not set for dictionary node definition') ; }
    const keysParser = _validSubParser(node._keysType!, errors) ;
    if (!$ok(keysParser)) { return null ; }
    if (!$ok(node._valueItemsType)) {errors?.push('_valueItemsType field is not set for a dictionary node definition') ; }
    const itemsParser = _validSubParser(node._valueItemsType!, errors) ;
    return $ok(itemsParser) ? new TSDictionaryParser(node, keysParser, itemsParser) : null ;
}

// a structured object: its items are all the fields which are not internal fields
function _objectConstruction(node:TSObjectNode, errors:Nullable<string[]>):TSParser|null {
    const itemsParsers:TSDictionary<TSParser> = {} ;
    const keyscase = $value(
        InternalCasingMap[$value(node._keysCase as Nullable<TSCase>, TSCase.standard)],
        (s:string) => s
    ) ;
    let found = 0 ;
    for (let [key, subnode] of Object.entries(node)) {
        if (InternalFieldsSet.has(key)) { continue ; }
        if (!IsFielOrEnumdRegex.test(key)) {
            errors?.push(`wrong key '${key}' for object node definition`) ;
            continue ;
        }
        const itemParser = _validSubParser(subnode as TSNode, errors) ;
        if (!$ok(itemParser)) { return null ; }
        itemsParsers[keyscase(key)] = itemParser ;
        found++ ;
    }
    if (!found) {
        errors?.push('empty object node definition') ;
        return null ;
    }
    return new TSObjectParser(node, itemsParsers, !!node._acceptsUncheckedItems) ;
}
