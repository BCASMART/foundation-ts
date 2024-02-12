import { $isnumber, $isunsigned, $length, $ok, $toint, $tounsigned, $value } from "./commons";
import { $ftrim } from "./strings";
import { FoundationNewLineNumberCodeSet, FoundationStricWhiteSpacesNumberCodeSet, FoundationWhiteSpacesNumberCodeSet } from "./string_tables";
import { TSCountry } from "./tscountry";
import { TSDate } from "./tsdate";
import { $components, $durationcomponents, $durationDescription, $durationDescriptionOptions, $durationNumber2StringFormat, TSDateComp, TSDurationComp } from "./tsdatecomp";
import { $unitDefinition, Locales } from "./tsdefaults";
import { country, int, INT32_MIN, language, Nullable, uint, UINT32_MAX } from "./types";

export function $div(a: number, b: number) : number { return $icast(a/b) ; }

export function $icast(v:number):number
{ return v >= 0 ? (v <= UINT32_MAX ? v | 0 : Math.floor(v)) : (v >= INT32_MIN ? -((-v) | 0) : -Math.floor(-v)) ; }

export function $round(v:number, decimalPlaces:number = 0):number {
    const p = Math.pow(10, $toint(decimalPlaces));
    return Math.round((v * p) * (1 + Number.EPSILON)) / p ;
}

export function $fpad2(v: number, failedChar?:string) : string { return $fpad(v,2, failedChar) ; }
export function $fpad3(v: number, failedChar?:string) : string { return $fpad(v,3, failedChar) ; }
export function $fpad4(v: number, failedChar?:string) : string { return $fpad(v,4, failedChar) ; }
export function $fpad(v: number, pad:number, failedChar?:string) : string {
    const isUnsigned = $isunsigned(v) ;
    return (isUnsigned ? v.toString() : '').padStart(pad, isUnsigned ? '0' : $length(failedChar) === 1 ? failedChar! : 'X') ; 
}

export interface $unitOptions {
    unitName?:string ;
    pluralUnitName?:string ;
    unit?:string ;
    minimalUnit?: number ;
    maximalUnit?: number ;
    decimalPlaces?:number ;
    ignoreZeroDecimals?:boolean ;
    ignoreMinimalUnitDecimals?:boolean ;
}

const TSUnitMultiples = ['y', 'z', 'a', 'f', 'p', 'n', 'µ', 'm', '', 'k', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y'] ;
const TSLog1000 = Math.log(1000) ;

// default unit is m (for meters)
export function $unit(n: Nullable<number>, opts?:Nullable<$unitOptions>) {
    const v = $ok(n) ? n! : 0 ;
    const sn = $ftrim(opts?.unitName) ;
    const su = $ftrim(opts?.unit) ;
    const sp = $ftrim(opts?.pluralUnitName) ;

    const unitName = sn.length ? sn : (su.length ? su : 'm') ;
    const pluralUnitName = sp.length ? sp : unitName ;
    const minU = $ok(opts?.minimalUnit) ? Math.min(0, Math.max(-8, opts!.minimalUnit!)) : -8 ;
    const maxU = $ok(opts?.maximalUnit) ? Math.min(8, Math.max(0, opts!.maximalUnit!)) : 8 ;
    let   dm = $isunsigned(opts?.decimalPlaces) ? opts!.decimalPlaces as number : 2 ;
    if (v === 0) {
        if (dm === 0 || !!opts?.ignoreZeroDecimals || (minU === 0 && !!opts?.ignoreMinimalUnitDecimals)) { return '0 ' + pluralUnitName ; }
        return '0.'.padEnd(2+dm, '0') + ' ' + pluralUnitName ;
    }
    const unit = su.length ? su : unitName.charAt(0) ;
    const i = Math.max(minU, Math.min(maxU, Math.floor(Math.log(Math.abs(v)) / TSLog1000))) ;
    if (i === minU && !!opts?.ignoreMinimalUnitDecimals) { dm = 0 ;}
    return ((0.0+v) / (0.0+Math.pow(1000, i))).toFixed(dm) + ' ' + TSUnitMultiples[i+8]+(i==0?(v===1?unitName:pluralUnitName):unit) ;
}

export function $bytes(n: Nullable<number>, decimalPlaces:number = 2, locale?:Nullable<language|country|TSCountry|Locales>) {
    const unit = $value($unitDefinition('byte', locale), { singular:'byte', plural:'bytes', unit:'B'}) ;
    if (unit.unit.length === 0) { unit.unit = 'B' ; }
    return $unit(n, { 
        decimalPlaces:decimalPlaces, 
        unit:unit.unit, 
        unitName:unit.singular,
        pluralUnitName:unit.plural, 
        minimalUnit:0, 
        ignoreZeroDecimals:true,
        ignoreMinimalUnitDecimals:true
    }) ;
}

/**
 @deprecated use $bytes() instead
*/
export function $octets(n: Nullable<number>, decimalPlaces:number = 2) {
    return $unit(n, { 
        decimalPlaces:decimalPlaces, 
        unit:'o', 
        unitName:'octet',
        pluralUnitName:'octets', 
        minimalUnit:0, 
        ignoreZeroDecimals:true,
        ignoreMinimalUnitDecimals:true
    }) ;
}

export function $meters(n: Nullable<number>, decimalPlaces:number = 2) {
    return $unit(n, { decimalPlaces:decimalPlaces})
}

const FoundationHexaChars = '0123456789ABCDEF' ;
const FoundationHexaLowerChars = '0123456789abcdef' ;

declare global {
    export interface Number {
        bytes:              (this:number, decimalPlaces?:number, locale?:Nullable<language|country|TSCountry|Locales>) => string ;
        dateComponents:     (this:number) => TSDateComp ;
        durationComponents: (this:number) => TSDurationComp ;
        fpad:               (this:number, pad:number, failedChar?:string) => string ;
        fpad2:              (this:number, failedChar?:string) => string ;
        fpad3:              (this:number, failedChar?:string) => string ;
        fpad4:              (this:number, failedChar?:string) => string ;
        hexaValue:          (this:number) => number ; // returns -1 is the number representing an unicode character is not an hexadecimal one
        icast:              (this:number) => number ;
        isNewLine:          (this:number) => boolean ;
        isWhiteSpace:       (this:number) => boolean ;
        isStrictWhiteSpace: (this:number) => boolean ;
        meters:             (this:number, decimalPlaces?:number) => string ;

/**
     @deprecated use bytes() instead
*/
        octets:             (this:number, decimalPlaces?:number) => string ;
        round:              (this:number, decimalPlaces?:number) => number ;
        singular:           (this:number) => boolean ;
        toDate:             (this:number) => Date|null ;
        toDurationString:   (this:number, format?:Nullable<string>) => string ;
        toDurationDescription: (this:number, opts?:Nullable<$durationDescriptionOptions>) => string ;
        toHex1:             (this:number, toLowerCase?:Nullable<boolean>) => string ;
        toHex2:             (this:number, toLowerCase?:Nullable<boolean>) => string ;
        toHex4:             (this:number, toLowerCase?:Nullable<boolean>) => string ;
        toHex8:             (this:number, toLowerCase?:Nullable<boolean>) => string ;
        toInt:              (this:number, defaultValue?:int) => int ;
        toTSDate:           (this:number) => TSDate|null ;
        toUnsigned:         (this:number, defaultValue?:uint) => uint ;
        unit:               (this:number, opts?:Nullable<$unitOptions>) => string ;
    }
}

Number.prototype.bytes              = function bytes(this:number, decimalPlaces?:number, locale?:Nullable<language|country|TSCountry|Locales>):string { 
    return $bytes(this, decimalPlaces, locale) ; 
}
Number.prototype.dateComponents     = function dateComp(this:number) { return $components(this) ; }
Number.prototype.durationComponents = function durationComp(this:number) { return $durationcomponents(this) ; }
Number.prototype.fpad               = function fpad(this:number, pad:number, failedChar?:string) { return $fpad(this, pad, failedChar) ; }
Number.prototype.fpad2              = function fpad(this:number, failedChar?:string) { return $fpad(this, 2, failedChar) ; }
Number.prototype.fpad3              = function fpad(this:number, failedChar?:string) { return $fpad(this, 3, failedChar) ; }
Number.prototype.fpad4              = function fpad(this:number, failedChar?:string) { return $fpad(this, 4, failedChar) ; }
Number.prototype.hexaValue          = function hexaValue(this:number):number {
    if (this >= 48 && this < 58)  { return this - 48 ; }
    if (this >= 65 && this < 71)  { return this - 55 ; }
    if (this >= 97 && this < 103) { return this - 87 ; }
    return -1 ;
}
Number.prototype.icast              = function iCast(this:number):number { return $icast(this) ; }
Number.prototype.isNewLine          = function isNewLine(this:number):boolean { return FoundationNewLineNumberCodeSet.has(this) ; }
Number.prototype.isWhiteSpace       = function isWhiteSpace(this:number):boolean { return FoundationWhiteSpacesNumberCodeSet.has(this) ; }
Number.prototype.isStrictWhiteSpace = function isWhiteSpace(this:number):boolean { return FoundationStricWhiteSpacesNumberCodeSet.has(this) ; }
Number.prototype.meters             = function meters(this:number, decimalPlaces?:number):string { return $meters(this, decimalPlaces) ; }
Number.prototype.octets             = function octets(this:number, decimalPlaces?:number):string { return $octets(this, decimalPlaces) ; }
Number.prototype.round              = function round(this:number, decimalPlaces?:number):number { return $round(this, decimalPlaces) ; }
Number.prototype.singular           = function singular(this:number):boolean { return this === 1 ; }
Number.prototype.toDate             = function toDate(this:number):Date|null { return $isnumber(this) ? new Date(this) : null ; }
Number.prototype.toDurationString   = function durationString(this:number, format?:Nullable<string>) { return $durationNumber2StringFormat(this, format) ; }
Number.prototype.toDurationDescription = function durationDesc(this:number, opts?:Nullable<$durationDescriptionOptions>) { return $durationDescription(this, opts) ; }
Number.prototype.toHex1             = function toHex1(this:number, toLowerCase?:Nullable<boolean>):string {
    const r = !!toLowerCase ? FoundationHexaLowerChars : FoundationHexaChars ;
    return r[this.toUnsigned() & 0x0F]
}
Number.prototype.toHex2             = function toHex2(this:number, toLowerCase?:Nullable<boolean>):string {
    const n = this.toUnsigned() ;
    const r = !!toLowerCase ? FoundationHexaLowerChars : FoundationHexaChars ;
    return r[(n>>4) & 0xF]+r[n & 0xF] ;
}
Number.prototype.toHex4             = function toHex4(this:number, toLowerCase?:Nullable<boolean>):string {
    const n = this.toUnsigned() ;
    const r = !!toLowerCase ? FoundationHexaLowerChars : FoundationHexaChars ;
    return r[(n>>12) & 0xF]+r[(n>>8) & 0xF]+r[(n>>4) & 0xF]+r[n & 0xF] ;
}
Number.prototype.toHex8             = function toHex8(this:number, toLowerCase?:Nullable<boolean>):string {
    const n = this.toUnsigned() ;
    const r = !!toLowerCase ? FoundationHexaLowerChars : FoundationHexaChars ;
    return r[(n>>28) & 0xF]+r[(n>>24) & 0xF]+r[(n>>20) & 0xF]+r[(n >> 16) & 0xF]+r[(n>>12) & 0xF]+r[(n>>8) & 0xF]+r[(n>>4) & 0xF]+r[n & 0xF] ;
}
Number.prototype.toInt              = function toInt(this:number, defaultValue?:int):int { return $toint(this, defaultValue) ; }
Number.prototype.toTSDate           = function toTSDate(this:number):TSDate|null { return TSDate.fromTimeStamp(this) ; }
Number.prototype.toUnsigned         = function toUnsigned(this:number, defaultValue?:uint):uint { return $tounsigned(this, defaultValue) ; }
Number.prototype.unit               = function unit(this:number, opts?:Nullable<$unitOptions>):string { return $unit(this, opts) ; }

