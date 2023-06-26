import { INT16_MIN, INT16_MAX, INT32_MAX, INT32_MIN, Nullable, UINT32_MAX, UINT16_MAX, INT8_MIN, INT8_MAX, UINT8_MAX, UINT_MAX, TSDictionary, INT_MIN, INT_MAX, TSCountrySet, TSCurrencySet, TSLanguageSet, TSContinentSet } from "./types";
import { $UUID, $count, $defined, $email, $int, $isarray, $isbool, $isemail, $isfunction, $isint, $isnumber, $isobject, $isodate, $isphonenumber, $isstring, $isunsigned, $isurl, $isuuid, $keys, $objectcount, $ok, $string, $unsigned, $url, $value, $valueornull } from "./commons";
import { $decodeBase64, $encodeBase64 } from "./data";
import { $ascii, $ftrim, $trim } from "./strings";
import { TSColor, TSColorSpace } from "./tscolor";
import { TSData } from "./tsdata";
import { TSDate } from "./tsdate";
import { TSPhoneNumber } from "./tsphonenumber";
import { $inspect } from "./utils";
import { TSCountry } from "./tscountry";
import { TSCharset } from "./tscharset";


/*

    Example of parser definition usage

    const def = {
        _mandatory: true,
        _keysCase: 'lowercase',
        name:   'string!',
        firstName: 'string',
        mail:   'email!',
        mobile: 'phone',
        bgcolor: 'color',
        language: 'language',
        company: {
            _mandatory: true,
            name: 'string!',
            hiringDate: 'date!',
            position: 'string!',
            photo: 'data',
            website: 'url',
            tags: ['string'],
            offices:[{ 
                officeType: {
                    _type:'uint8',
                    _mandatory: true,
                    _enum:{ 'headquarter': 1, 'agency': 2 }
                },
                name: 'string!',
            }, 0, 8]
        }
    } ;

    const parser = TSParser.define(def) ;
    if ($ok(parser)) {
        const value = {
            name:   "Monserat",
            mail:   'h.monserat@orange.fr',
            firstName: "Henry",
            mobile: '+(33 1) 45 24 70 00',
            bgcolor: '#ff0000',
            language: 'FR',
            company:{
                name:"MyCompany",
                hiringDate: "2023-06-15",
                position: "chef de projet",
                tags:["informatique", "services"],
                offices:[{
                    officeType:"agency",
                    name:"Agencde de Paris Nord"
                }]
            }
        }
        
        const result = parser!.interpret(value) ;

    }

    In this example: 
      - result.mobile will be a TSPhoneNumber object
      - result.bgcolor will be a TSColor object
      - result.company.hiringDate will be a TSDate object
      - result.company.office[0].officeType will be a number (a uint8 number)

 */
// WARNING: 'jsdate' represents a Date() object, 'date' a TSDate() object
export type TSLeafOptionalNode  = 'boolean' | 'charset' | 'color' | 'continent' | 'country' | 'currency' | 
                                  'data' | 'date' | 'email' | 'int' | 'int8' | 'int16' | 'int32' | 
                                  'jsdate' | 'language' | 'number' | 'phone' | 'string' |
                                  'uint8' | 'uint16' | 'uint32' | 'unsigned' | 'uuid' | 'url' ;
export type TSMandatoryLeafNode = 'boolean!' | 'charset!' | 'color!' | 'continent!' | 'country!' | 'currency!' | 
                                  'data!' | 'date!' | 'email!' | 'int!' | 'int8!' | 'int16!' | 'int32!' | 
                                  'jsdate!' | 'language!' | 'number!' | 'phone!' | 'string!' |
                                  'uint8!' | 'uint16!' | 'uint32!' | 'unsigned!' | 'uuid!' | 'url!' ;

// a user oriented general value's validation and final transformation
export type TSNativeValue = Nullable<string|number|boolean> ;

export type TSExtendedLeafNode = { 
    _type: TSLeafOptionalNode, 
    _mandatory?:boolean,
    _enum?:TSDictionary<number|string> | Array<string|number>,
    _checker?:(v:any) => boolean, 
    _transformer?:(v:any) => any, 
    _natifier?:(v:any) => TSNativeValue
} ;

export type TSLeafNode = TSLeafOptionalNode | TSMandatoryLeafNode | TSExtendedLeafNode ;

export type TSExtendedArrayNode = {
    _itemsType:TSNode ;
    _mandatory?:boolean, // usefull if we want a non mandatory array but _min and _max defined when the array is defined
    _min?: number ;
    _max?: number ;
    _checker?:(v:any) => boolean, 
    _transformer?:(v:any) => any 
    _natifier?:(v:any) => TSNativeValue
} ;

export type TSArrayNode = [TSNode, number?, number?] ; // min and max

// QUESTION: add camelcase, snakecase, pascalcase, kebabcase, ... ?
export enum TSCase {
    standard = 'standard',
    lowercase = 'lowercase',
    uppercase = 'uppercase'
}

export type TSObjectNode = { [key: string]: TSNode } | {
    _keysType?:TSLeafOptionalNode,
    _valueItemsType?:TSNode, 
    _checker?:(v:any) => boolean, 
    _transformer?:(v:any) => any 
    _natifier?:(v:any) => TSNativeValue,
    _mandatory?:boolean,
    _keysCase?:Nullable<TSCase>, 
}

export type TSNode = TSLeafNode | TSObjectNode | TSArrayNode | TSExtendedArrayNode ;


export abstract class TSParser {
    public readonly errors:string[] = [] ;
    public readonly mandatory:boolean ;
    protected _check:(v:any)=>boolean = (_:any) => true ;
    protected _transform:(v:any)=>any = (v:any) => v ;
    protected _natify?:(v:any)=>TSNativeValue = undefined ;

    public static define(rootNode:TSNode, errors?:Nullable<Array<string>>):TSParser|null {
        return $valueornull(_structureConstruction(rootNode, errors)) ;
    }
    
    public get isValid():boolean { return this.errors.length === 0 ; }
    
    public validate(value:any, errors?:Nullable<string[]>):boolean { 
        return this._validate(value, '', errors) ; 
    }
    public interpret(value:any, errors?:Nullable<string[]>):any {
        return this._validate(value, '', errors) ? this.rawInterpret(value) : null ;
    }
    public encode(value:any, errors?:Nullable<string[]>): any {
        return this._validate(value, '', errors) ? this.rawEncode(value) : null ;
    }

    public parse(source:Nullable<string>, errors?:Nullable<string[]>): any {
        let value = undefined ;
        const s = $trim(source) ;
        if (s.length) {
            try { value = JSON.parse(s) ; }
            catch { 
                value = undefined ;
                _serror(errors, 'JSON', '.parse(stringSource) did fail') ; 
            }    
        }
        else { _serror(errors, 'stringSource', ' is empty') ; }
        return this.interpret(value, errors) ;
    }
    
    public stringify(value:any, spaces:string | number | undefined = undefined, errors?:Nullable<string[]>): string | null {
        return this._validate(value, '', errors) ? this.rawStringify(value, spaces) : null ;
    }

    // WARNING: never use rawInterpret() method directly without using validate() first
    public abstract rawInterpret(_:any):any ;
    public abstract rawEncode(_:any):any ;

    public rawStringify(value:any, spaces:string | number | undefined = undefined):string| null {
        try { return JSON.stringify(this.rawEncode(value), undefined, spaces) }
        catch { return null ; }
    }

    public abstract toJSON(): object ;
    public toString(): string { return $inspect(this.toJSON(), 15) ; }


    protected _validate(value:any, path:string, errors?:Nullable<string[]>):boolean { 
        if (this.mandatory && !$ok(value)) {
            return _serror(errors, path, 'is mandatory') ;
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
        }

        if ($defined(m) && !$isbool(m)) { this.errors.push(`_mandatory field should be a boolean`) ; }
        if ($ok(node._keysCase)) { this.errors.push(`_keysCase field should not be set for a dictionary`) ; }
        
        this._keysParser = keysParser as TSLeafParser ;
        this._valuesParser = valuesParser! ;
    }

    public toJSON():object { return {
        _type: 'dictionary',
        _mandatory:this.mandatory,
        _check: this._check,
        _transform: this._transform,
        _natify: this._natify,
        _keysStruct: this._keysParser.toJSON(),
        _valuesStruct: this._valuesParser.toJSON()
    } ; }

    protected _validate(value:any, path:string, errors?:Nullable<string[]>):boolean {
        if (!super._validate(value, path, errors)) { return false ; }
        if ($ok(value) && ($isarray(value) || !$isobject(value))) { 
            return _serror(errors, path, 'is not a dictionary') ;
        }
        const entries = Object.entries(value) ;
        let founds = 0 ;
        
        const p = path.length ? path : 'dict' ;
        for (let [k, v] of entries) {
            // @ts-ignore
            if (!this._keysParser._validate(k, `${p}.${k}[key]`, errors)) return false ; 
            // @ts-ignore
            if (!this._valuesParser._validate(v, `${p}.${k}`, errors)) return false ; 
            founds ++ ;
        }
        if (founds === 0 && this.mandatory) { 
            return _serror(errors, path, ` is empty`) ;
        }
        return this._check(value) ? true : _serror(errors, path, 'specific check did fail') ;
    }

    public rawInterpret(value:any):any {
        const ret:any = {}
        const entries = Object.entries(value) ;
        for (let [k, v] of entries) {
            const ki = this._keysParser.rawEncode(k) ; 
            const vi = this._valuesParser.rawInterpret(v) ;
            if ($ok(ki) && $ok(vi)) { ret[ki] = vi ; } 
        }
        return this._transform(ret) ;
    }

    public rawEncode(value:any):any {
        const ret:any = {}
        const entries = Object.entries(value) ;
        for (let [k, v] of entries) {
            const ki = this._keysParser.rawEncode(k) ; 
            const vi = this._valuesParser.rawEncode(v) ;
            if ($ok(ki) && $ok(vi)) { ret[ki] = vi ; } 
        }
        return this._natify ? this._natify(ret) : ret ;
    }

}

class TSObjectParser extends TSParser {
    private _itemsParsers:TSDictionary<TSParser> ;
    private _count:number ;
    private _keyTransform:(s:string)=>string = (s:string) => s ;
    private _keysCase:TSCase = TSCase.standard ;

    public constructor(node:TSObjectNode, itemsParsers:TSDictionary<TSParser>) {
        const m = node._mandatory ;
        super(!!m, node._checker as any, node._transformer as any, node._natifier as any) ;

        if ($defined(m) && !$isbool(m)) { this.errors.push(`_mandatory field should be a boolean`) ; }

        const l = $value(node._keysCase as Nullable<TSCase>, TSCase.standard) ;
        const kt = InternalCasingMap[l]
        if (!$defined(kt)) { 
            this.errors.push(`_keysCase field should one of ${Array.from($keys(InternalCasingMap))}`) ; 
        }
        else { 
            this._keyTransform = kt ; 
            this._keysCase = l ;
        }

        this._itemsParsers = itemsParsers ;
        this._count = $objectcount(itemsParsers) ;
    }

    public toJSON():object {
        const ret:any = {
            _type: 'object',
            _mandatory:this.mandatory,
            _check: this._check,
            _transform: this._transform,
            _natify: this._natify
        } ;
        if (this._keysCase !== 'standard') { ret._keysCase = this._keysCase ; }

        const structEntries = Object.entries(this._itemsParsers) ;
        for (let [k, struct] of structEntries) {
            ret[k] = struct.toJSON()
        }
        
        return ret ;
    }

    protected _validate(value:any, path:string, errors?:Nullable<string[]>):boolean {
        if (!super._validate(value, path, errors)) { return false ; }
        if ($ok(value) && ($isarray(value) || !$isobject(value))) { 
            return _serror(errors, path, 'is not an object') ;
        } 

        const p = path.length ? path : 'object' ;
        const entries = Object.entries(value) ;
        const founds = new Set<string>() ;

        for (let [key, v] of entries) {
            const k = this._keyTransform(key) ;
            if (founds.has(k)) {
                return _serror(errors, path, `.${k} is present several times`) ;
            }
            const struct = this._itemsParsers[k] ;
            if (!$ok(struct)) {
                return _serror(errors, path, `.${k} is unknown`) ;
            }
            // @ts-ignore
            if (!struct._validate(v, `${p}.${k}`, errors)) return false ; 
            founds.add(k) ;
        }
        if (founds.size < this._count) {
            // look for mandatory fields not present
            const structEntries = Object.entries(this._itemsParsers) ;
            for (let [k, struct] of structEntries) {
                if (!founds.has(k) && struct.mandatory) {
                    return _serror(errors, path, `.${k} is mandatory`) ;
                }
            }
        }
        return this._check(value) ? true : _serror(errors, path, 'specific check did fail') ;
    }

    public rawInterpret(value:any):any {
        const ret:any = {}
        const entries = Object.entries(value) ;
        for (let [key, v] of entries) {
            const k = this._keyTransform(key) ;
            const struct = this._itemsParsers[k] ;
            const res = struct.rawInterpret(v) ; 
            if ($ok(res)) { ret[k] = res ; }
        }
        return this._transform(ret) ;
    }
    
    public rawEncode(value:any):any {
        const ret:any = {}
        const entries = Object.entries(value) ;
        for (let [key, v] of entries) {
            const k = this._keyTransform(key) ;
            const struct = this._itemsParsers[k] ;
            const res = struct.rawEncode(v) ; 
            if ($ok(res)) { ret[k] = res ; }
        }
        return this._natify ? this._natify(ret) : ret ;
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
        super($ok(m) ? !!m : min > 0, node._checker, node._transformer, node._natifier as any) ;

        if ($defined(m) && !$isbool(m)) { this.errors.push(`_mandatory field should be a boolean`) ; }

        this._min = min ;
        this._max = max ;
        this._itemsParser = itemParser ;
        for (let e of errors) { this.errors.push(e) ; }
    }

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

    protected _validate(value:any, path:string, errors?:Nullable<string[]>):boolean {
        if (!super._validate(value, path, errors)) { return false ; }
        if ($ok(value) && !$isarray(value)) { // TODO: accepts other classes than array (like collections) 
            return _serror(errors, path, 'is not an array') ;
        } 
        const n = $count(value) ;
        if (n < this._min) { 
            return _serror(errors, path, `.size is too small (${n} < ${this._min})`) ;
        }
        if (n > this._max) { 
            return _serror(errors, path, `.size is too large (${n} > ${this._max})`) ;
        }
        const p = path.length ? path : 'array' ;
        for (let i = 0 ; i < n ; i++) { 
            // @ts-ignore
            if (!this._itemsParser._validate(value[i], `${p}[${i}]`, errors)) return false ; 
        }
        return this._check(value) ? true : _serror(errors, path, 'specific check did fail') ;
    }

    public rawInterpret(value:any):any {
        const ret:Array<any> = [] ;
        for (let v of value) { 
            ret.push(this._itemsParser.rawInterpret(v)) ;
        }
        return this._transform(ret) ;
    }

    public rawEncode(value:any):any {
        const ret:Array<any> = [] ;
        for (let v of value) { 
            ret.push(this._itemsParser.rawEncode(v)) ;
        }
        return this._natify ? this._natify(ret) : ret ;
    }

}

class TSLeafParser extends TSParser {
    private _manager:TSLeafNodeManager ;
    private _type:TSLeafOptionalNode ;
    private _conversion:TSDictionary<number|string>|undefined ;
    private _enumeration:Set<string|number>|undefined ;
    
    private static __managers:{ [key in TSLeafOptionalNode]?:TSLeafNodeManager } = {
        'boolean' :  { valid:_isBoolean, str2v:(s:string) => !!_booleanConvertor(s)},
        'charset' :  { valid:_isCharset, str2v:(s:string) => TSCharset.charset(s), v2nat:(v:any) => v.name},
        'color':     { valid:_iscolor, str2v:(s:string) => TSColor.fromString(s), v2nat:_color2str},
        'continent': { valid:_isContinent, str2v:(s:string) => s, enum:_isContinent, iskey:true},
        'country':   { valid:_isCountry, trans:_countryTrans, str2v:(s:string) => s, v2nat:(v:any) => v.alpha2Code, enum:(v:any) => TSCountrySet.has(v), iskey:true},
        'currency':  { valid:_isCurrency, str2v:(s:string) => s, enum:_isCurrency, iskey:true},
        'data' :     { valid:_isData, str2v:$decodeBase64, v2nat:$encodeBase64},
        'date' :     { valid:_isTsDate, str2v:(s:string) => TSDate.fromIsoString(s), v2nat:(v:any) => v.toIsoString()},
        'email':     { valid:$isemail, str2v:$email, iskey:true },
        'int':       { valid:_isInt, str2v:$int, enum:$isint, iskey:true },
        'int8':      { valid:(v:any) => _isInt(v, INT8_MIN,  INT8_MAX),  str2v:$int, enum:(v) => $isint(v, INT8_MIN, INT8_MAX), iskey:true },
        'int16':     { valid:(v:any) => _isInt(v, INT16_MIN, INT16_MAX), str2v:$int, enum:(v) => $isint(v, INT16_MIN, INT16_MAX), iskey:true },
        'int32':     { valid:(v:any) => _isInt(v, INT32_MIN, INT32_MAX), str2v:$int, enum:(v) => $isint(v, INT32_MIN, INT32_MAX), iskey:true },
        'jsdate':    { valid:_isJsDate, str2v:(s:string) => new Date(s), v2nat:(v:any) => v.toISOString},
        'language':  { valid:_isLanguage, str2v:(s:string) => s, enum:_isLanguage, iskey:true},
        'phone':     { valid:$isphonenumber, str2v:(s:string) => TSPhoneNumber.fromString(s), v2nat:(v:TSPhoneNumber) => v.standardNumber, iskey:true },
        'number' :   { valid:_isNumber, str2v:(s:string) => Number(s), enum:$isnumber},
        'string':    { valid:$isstring, str2v: (s:string) => s, enum:(v) => $isstring(v) && (v as string).length > 0},
        'uint8':     { valid:(v:any) => _isInt(v, 0, UINT8_MAX),  str2v:$unsigned,  enum:(v) => $isunsigned(v, UINT8_MAX), iskey:true },
        'uint16':    { valid:(v:any) => _isInt(v, 0, UINT16_MAX), str2v:$unsigned, enum:(v) => $isunsigned(v, UINT16_MAX), iskey:true },
        'uint32':    { valid:(v:any) => _isInt(v, 0, UINT32_MAX), str2v:$unsigned, enum:(v) => $isunsigned(v, UINT32_MAX), iskey:true },
        'unsigned':  { valid:(v:any) => _isInt(v, 0), str2v:$unsigned, enum:$isunsigned, iskey:true },
        'url':       { valid:$isurl, str2v:$url, iskey:true },
        'uuid':      { valid:$isuuid, str2v:$UUID, iskey:true },
    }
    private static __dummyManager:TSLeafNodeManager = { valid:(_:any)=>false, str2v:(_:string) => undefined} ;

    public constructor(node:TSExtendedLeafNode) {
        const manager =  $isstring(node._type) ? TSLeafParser.__managers[node._type] : undefined ;
        const transformer = $ok(node._transformer) ? node._transformer : ($ok(manager?.trans) ? manager!.trans! : undefined) ;
        const natifier = $ok(node._natifier) ? node._natifier : ($ok(manager?.v2nat) ? manager!.v2nat! : undefined) ;
        
        super(!!node._mandatory, node._checker, transformer, natifier) ;

        if (!$ok(manager)) { 
            this.errors.push(`Invalid parser type '${node._type}'`) ;
            this._manager = TSLeafParser.__dummyManager ;
        }
        else { this._manager = manager! ;}

        const enumeration = node._enum ;
        if ($isarray(enumeration)) { 
            if (!$ok(manager!.enum)) { this.errors.push(`Parser type '${node._type}' does not support enumeration`) ; }
            if (!enumeration!.length) { this.errors.push(`Empty enumeration definition array for type '${node._type}'`) ; }
            for (let e of enumeration as Array<string|number>) { 
                if (!manager!.enum!(e)) { 
                    this.errors.push(`Enumeration value '${e}' is invalid for type '${node._type}'`) ;
                }
            }
            this._enumeration = new Set(enumeration as Array<string|number>) ;
        }
        else if ($isobject(enumeration)) {
            if (!$ok(manager!.enum)) { this.errors.push(`Parser type '${node._type}' does not support enumeration`) ; }
            const entries = Object.entries(enumeration as TSDictionary<string|number>) ;
            
            this._enumeration = new Set<string|number>() ;
            for (let [key, item] of entries) {
                if (!key.length || !key.match(IsFielOrEnumdRegex)) { this.errors.push(`Wrong enumeration key '${key}' for type '${node._type}'`) ; }
                if (manager!.enum!(item)) {
                    this._enumeration.add(item) ;
                }
                else {
                    this.errors.push(`Enumeration value '${item}' for key '${key}' is invalid for type '${node._type}'`) ;
                }
            }
            if (!this._enumeration.size) { this.errors.push(`Empty enumeration definition dictionary for type '${node._type}'`) ; }
            this._conversion = enumeration as TSDictionary<string|number> ;
        }
        else if ($ok(enumeration)) {
            this.errors.push(`Bad enumeration definition for type '${node._type}'`) ;
        }

        this._type = node._type ;
    }

    public get isKey() { return !!this._manager.iskey ; }

    public toJSON():object { return {
        _type: this._type,
        _mandatory:this.mandatory,
        _enumeration: $ok(this._enumeration) ? Array.from(this._enumeration!) : 'none',
        _conversion:  $value(this._conversion as any, 'none'),
        _check: this._check,
        _transform: this._transform,
        _natify: this._natify
    } ; }

    protected _validate(value:any, path:string, errors?:Nullable<string[]>):boolean {
        if (!super._validate(value, path, errors)) { return false ; }
        if (this._conversion && $isstring(value)) { 
            const tag = value as string ;
            value = this._conversion![tag] ; 
            if (!$ok(value)) {
                return _serror(errors, path, `has not a valid enum tag ${tag}`) ;
            }
        }
        if ($ok(value) && !this._manager.valid(value)) {
            return _serror(errors, path, `is not a valid ${this._type}`) ;
        }
        if (this._enumeration) {
            if (!this._enumeration.has(this._convertIfString(value))) {
                const s = $isstring(value) ? "'"+value+"'" : value ;
                return _serror(errors, path, `has not a valid enum value ${s}`) ;
            }
        }
        return this._check(value) ? true : _serror(errors, path, 'specific check did fail') ;
    }

    protected _convertIfString(value:any):any
    { return this._transform($isstring(value) ? this._manager.str2v(value as string) : value) ; }
    
    public rawInterpret(value:any):any {
        if (this._conversion && $isstring(value)) {
            value = this._conversion![value] ; 
        } 
        return this._convertIfString(value) ;
    }

    public rawEncode(value:any):any {
        if (this._conversion && $isstring(value)) {
            value = this._conversion![value] ; 
        } 

        if (!$ok(value)) { return value ; }

        switch (typeof value) {
            case 'bigint':   return Number(value) ;
            case 'boolean':  return value ;
            case 'number':   return value ;
            case 'object':   return this._natify ? this._natify(value) : $string(value) ;
            case 'string':   return value ;
            case 'symbol':   return $string(value) ;
            default:         return null ;
        }
    }

}
// ========================== PRIVATE CONSTANTS, TYPES AND FUNCTIONS ==========================================

interface TSLeafNodeManager {
    valid:(v:any) => boolean ;
    str2v:(s:string) => any ;
    v2nat?:(v:any) => TSNativeValue ;
    trans?:(v:any) => any ;
    enum?:(v:any) => boolean ;
    iskey?:boolean ;
}
function _isCharset(v:any):boolean   { return v instanceof TSCharset || ($isstring(v) && $ok(TSCharset.charset(v))) ; }
function _isNumber(v:any):boolean    { return $isnumber(v) || ($isstring(v) && $isnumber(Number(v as string))); }
function _isData(v:any):boolean      { return v instanceof TSData || v instanceof Uint8Array || v instanceof ArrayBuffer || $isstring(v) ;}
function _isBoolean(v:any):boolean   { return $isbool(v) || ($isstring(v) && $ok(_booleanConvertor(v as string))) ;}
function _isContinent(v:any):boolean { return TSContinentSet.has(v) ; }
function _isCurrency(v:any):boolean  { return TSCurrencySet.has(v) ; }
function _isLanguage(v:any):boolean  { return TSLanguageSet.has(v) ; }
function _isCountry(v:any):boolean   { return v instanceof TSCountry || TSCountrySet.has(v) ; }
function _countryTrans(v:any):any    { return v instanceof TSCountry ? v.alpha2Code : v ; }

function _isInt(v:any, min:number = INT_MIN, max:number = INT_MAX):boolean
{ return $isint(v, min, max) || ($isstring(v) && $isint(Number(v as string), min, max)) }

function _isJsDate(v:any):boolean 
{ return v instanceof Date || ($isstring(v) && v !== '0' && $isnumber(Date.parse(v as string))) ; }

function _isTsDate(v:any):boolean
{ return v instanceof TSDate || ($isstring(v) && $ok($isodate(v as string)))}

function _iscolor(o:any) : boolean
{ return o instanceof TSColor || ($isstring(o)) && $ok(TSColor.fromString(o)) ; }

function _booleanConvertor(s:string):boolean | null {
    s = $ascii($ftrim(s)).toLowerCase() ;
    return s === 'true' ? true : ( s === 'false' ? false : null) ;
}
function _color2str(v:any):string { return v.toString({ colorSpace:TSColorSpace.RGB, removeAlpha:false, rgbaCSSLike:true, shortestCSS:false, uppercase:false}) ; }

function _serror(errors:Nullable<string[]>, path:string, error:string):false {
    errors?.push(`${path.length>0?path:'value'}${error.startsWith('.')?'':' '}${error}${error.endsWith('')?'':'.'}`) ;
    return false ;
}

// this is the function wich convert you data model definition
// into a tree of structures
const IsFielOrEnumdRegex = /^[a-zA-Z][a-zA-Z0-9_-]*$/g
const InternalFieldsSet = new Set(['_mandatory', '_keysCase', '_checker', '_transformer', '_natifier']) ;
const InternalCasingMap:{[key in TSCase]:(s:string)=>string} = {
    'standard':(s:string)=> s,
    'lowercase':(s:string)=> s.toLowerCase(),
    'uppercase':(s:string)=> s.toUpperCase()
} ;

function _structureConstruction(node:TSNode, errors:Nullable<string[]>):TSParser|null {
    if ($isstring(node)) {
        let mandatory = (node as TSMandatoryLeafNode).endsWith('!') ;
        if (mandatory) { node = (node as string).left((node as string).length-1) as TSLeafOptionalNode ; }
        return new TSLeafParser({ _type:node as TSLeafOptionalNode, _mandatory:mandatory}) ;
    }
    else if ($isarray(node)) {
        const a = (node as Array<any>) ;
        if (a.length === 0 || a.length > 3) {
            errors?.push('wrong empty array node definition') ;
            return null ;
        }

        let min:number|undefined = undefined, max:number|undefined = undefined ;
        if (a.length > 1 && $ok(a[1])) { 
            if (!$isunsigned(a[1])) {
                errors?.push(`wrong minimal size definition for array node`) ;
            }
            else { min = $unsigned(a[1]) ; }
        }
        if (a.length > 2 && $ok(a[2])) { 
            if (!$isunsigned(a[2])) {
                errors?.push(`wrong maximal size definition for array node`) ;
            }
            else { max = $unsigned(a[2]) ; }
        }
        const itemsType = (a as TSArrayNode)[0] ;
        const itemsParser = _structureConstruction(itemsType, errors) ;
        if (!itemsParser?.isValid) { 
            if ($count(itemsParser?.errors)) { errors?.push(...itemsParser!.errors) ; }
            return null ; 
        }
        return new TSArrayParser({ _itemsType:itemsType!, _min: min, _max: max }, itemsParser) ;
    }
    else if ($isobject(node)) {
        if ($ok((node as TSExtendedLeafNode)._type)) {
            // this is a leaf node
            return new TSLeafParser(node as TSExtendedLeafNode) ;
        }
        else if ($ok((node as TSObjectNode)._keysType) || $ok((node as TSObjectNode)._valueItemsType)) {
            // this is a dictionary    
            if (!$ok((node as TSObjectNode)._keysType)) { errors?.push('_keysType field is not set for dictionary node definition') ; }
            const keysParser = _structureConstruction((node as TSObjectNode)._keysType!, errors) ;
            if (!keysParser?.isValid) { 
                if ($count(keysParser?.errors)) { errors?.push(...keysParser!.errors) ; }
                return null ; 
            }    
            if (!$ok((node as TSObjectNode)._valueItemsType)) {errors?.push('_valueItemsType field is not set for a dictionary node definition') ; }
            const itemsParser = _structureConstruction((node as TSObjectNode)._valueItemsType!, errors) ;
            if (!itemsParser?.isValid) { 
                if ($count(itemsParser?.errors)) { errors?.push(...itemsParser!.errors) ; }
                return null ; 
            }    
            return new TSDictionaryParser(node as TSObjectNode, keysParser!, itemsParser!) ;
        }
        else if ($ok((node as TSExtendedArrayNode)._itemsType)) {
            // this is an array
            const itemsParser = _structureConstruction((node as TSExtendedArrayNode)._itemsType, errors) ;
            if (!itemsParser?.isValid) { 
                if ($count(itemsParser?.errors)) { errors?.push(...itemsParser!.errors) ; }
                return null ; 
            }
            return new TSArrayParser(node as TSExtendedArrayNode, itemsParser) ;
        }
        else {
            // this a structured object
            const itemsParsers:TSDictionary<TSParser> = {} ;
            const entries = Object.entries(node as TSObjectNode) ;
            const keyscase = $value(
                InternalCasingMap[$value((node as TSObjectNode)._keysCase as Nullable<TSCase>, TSCase.standard)],
                (s:string) => s
            ) ;
            let found = 0 ;
            for (let [key, subnode] of entries) {
                if (!InternalFieldsSet.has(key)) {
                    if (!key.match(IsFielOrEnumdRegex)) {
                        errors?.push(`wrong key '${key}' for object node definition`) ;
                    }
                    else {
                        const itemParser = _structureConstruction((subnode as TSNode), errors) ;
                        if (!itemParser?.isValid) { 
                            if ($count(itemParser?.errors)) { errors?.push(...itemParser!.errors) ; }
                            return null ; 
                        }    
                        itemsParsers[keyscase(key)] = itemParser! ;
                        found++ ;
                    }
                }
            }
            if (!found) {
                errors?.push('empty object node definition') ;
                return null ;
            }
            return new TSObjectParser(node as TSObjectNode, itemsParsers) ;
        }
    }
    return null ;
}
