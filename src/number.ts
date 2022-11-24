import { $isunsigned, $length, $ok, $toint, $tounsigned } from "./commons";
import { $ftrim } from "./strings";
import { FoundationNewLineNumberCodeSet, FoundationStricWhiteSpacesNumberCodeSet, FoundationWhiteSpacesNumberCodeSet } from "./string_tables";
import { int, INT32_MIN, Nullable, uint, UINT32_MAX } from "./types";

export function $div(a: number, b: number) : number { return $icast(a/b) ; }

export function $icast(v:number):number {
    return v >= 0 ? (v! <= UINT32_MAX ? v | 0 : Math.floor(v)) : (v! >= INT32_MIN ? -((-v) | 0) : -Math.floor(-v)) ;
}

export function $round(v:number, decimalPlaces:number = 0):number {
    var p = Math.pow(10, $toint(decimalPlaces));
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
export function $unit(n: Nullable<number>, opts:$unitOptions = {}) {
    const v = $ok(n) ? n! : 0 ;
    const sn = $ftrim(opts.unitName) ;
    const su = $ftrim(opts.unit) ;

    const unitName = sn.length ? sn : (su.length ? su : 'm') ;
    const minU = $ok(opts.minimalUnit) ? Math.min(0, Math.max(-8, opts.minimalUnit!)) : -8 ;
    const maxU = $ok(opts.maximalUnit) ? Math.min(8, Math.max(0, opts.maximalUnit!)) : 8 ;
    let   dm = $isunsigned(opts.decimalPlaces) ? opts.decimalPlaces as number : 2 ;
    if (v === 0) {
        if (dm === 0 || opts.ignoreZeroDecimals || (minU === 0 && opts.ignoreMinimalUnitDecimals)) { return '0 ' + unitName ; }
        return '0.'.padEnd(2+dm, '0') + ' ' + unitName ;
    }
    const unit = su.length ? su : unitName.charAt(0) ;
    const i = Math.max(minU, Math.min(maxU, Math.floor(Math.log(Math.abs(v)) / TSLog1000))) ;
    if (i === minU && opts.ignoreMinimalUnitDecimals) { dm = 0 ;}
    return ((0.0+v) / (0.0+Math.pow(1000, i))).toFixed(dm) + ' ' + TSUnitMultiples[i+8]+(i==0?unitName:unit) ;
}

export function $octets(n: Nullable<number>, decimalPlaces:number = 2) {
    return $unit(n, { 
        decimalPlaces:decimalPlaces, 
        unit:'o', 
        unitName:'octets', 
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
        fpad:               (this:number, pad:number, failedChar?:string) => string ;
        fpad2:              (this:number, failedChar?:string) => string ;
        fpad3:              (this:number, failedChar?:string) => string ;
        fpad4:              (this:number, failedChar?:string) => string ;
        isNewLine:          (this:number) => boolean ;
        isWhiteSpace:       (this:number) => boolean ;
        isStrictWhiteSpace: (this:number) => boolean ;
        meters:             (this:number, decimalPlaces?:number) => string ;
        octets:             (this:number, decimalPlaces?:number) => string ;
        round:              (this:number, decimalPlaces?:number) => number ;
        toHex2:             (this:number, toLowerCase?:boolean) => string ;
        toHex4:             (this:number, toLowerCase?:boolean) => string ;
        toHex8:             (this:number, toLowerCase?:boolean) => string ;
        toInt:              (this:number, defaultValue?:int) => int ;
        toUnsigned:         (this:number, defaultValue?:uint) => uint ;
        unit:               (this:number, opts?:$unitOptions) => string ;
    }
}

Number.prototype.fpad               = function fpad(this:number, pad:number, failedChar?:string) { return $fpad(this, pad, failedChar) ; }
Number.prototype.fpad2              = function fpad(this:number, failedChar?:string) { return $fpad(this, 2, failedChar) ; }
Number.prototype.fpad3              = function fpad(this:number, failedChar?:string) { return $fpad(this, 3, failedChar) ; }
Number.prototype.fpad4              = function fpad(this:number, failedChar?:string) { return $fpad(this, 4, failedChar) ; }
Number.prototype.isNewLine          = function isNewLine(this:number) { return FoundationNewLineNumberCodeSet.has(this) ; }
Number.prototype.isWhiteSpace       = function isWhiteSpace(this:number) { return FoundationWhiteSpacesNumberCodeSet.has(this) ; }
Number.prototype.isStrictWhiteSpace = function isWhiteSpace(this:number) { return FoundationStricWhiteSpacesNumberCodeSet.has(this) ; }
Number.prototype.meters             = function meters(this:number, decimalPlaces?:number) { return $meters(this, decimalPlaces) ; }
Number.prototype.octets             = function octets(this:number, decimalPlaces?:number) { return $octets(this, decimalPlaces) ; }
Number.prototype.round              = function round(this:number, decimalPlaces?:number) { return $round(this, decimalPlaces) ; }
Number.prototype.toHex2             = function toHex2(this:number, toLowerCase:boolean = false) {
    const n = this.toUnsigned() ;
    const r = toLowerCase ? FoundationHexaLowerChars : FoundationHexaChars ;
    return r[(n>>4) & 0xF]+r[n & 0xF] ;
}
Number.prototype.toHex4             = function toHex4(this:number, toLowerCase:boolean = false) {
    const n = this.toUnsigned() ;
    const r = toLowerCase ? FoundationHexaLowerChars : FoundationHexaChars ;
    return r[(n>>12) & 0xF]+r[(n>>8) & 0xF]+r[(n>>4) & 0xF]+r[n & 0xF] ;
}
Number.prototype.toHex8             = function toHex8(this:number, toLowerCase:boolean = false) {
    const n = this.toUnsigned() ;
    const r = toLowerCase ? FoundationHexaLowerChars : FoundationHexaChars ;
    return r[(n>>28) & 0xF]+r[(n>>24) & 0xF]+r[(n>>20) & 0xF]+r[(n >> 16) & 0xF]+r[(n>>12) & 0xF]+r[(n>>8) & 0xF]+r[(n>>4) & 0xF]+r[n & 0xF] ;
}
Number.prototype.toInt              = function toInt(this:number, defaultValue?:int) { return $toint(this, defaultValue) ; }
Number.prototype.toUnsigned         = function toUnsigned(this:number, defaultValue?:uint) { return $tounsigned(this, defaultValue) ; }
Number.prototype.unit               = function unit(this:number, opts?:$unitOptions) { return $unit(this, opts) ; }

