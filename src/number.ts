import { $isnumber, $isunsigned, $length, $ok, $toint, $tounsigned, $value } from "./commons";
import { $ftrim } from "./strings";
import { FoundationNewLineNumberCodeSet, FoundationStricWhiteSpacesNumberCodeSet, FoundationWhiteSpacesNumberCodeSet } from "./string_tables";
import { TSCountry } from "./tscountry";
import { TSDate } from "./tsdate";
import { $components, $durationcomponents, $durationDescription, $durationDescriptionOptions, $durationNumber2StringFormat, TSDateComp, TSDurationComp } from "./tsdatecomp";
import { $unitDefinition, Locales } from "./tsdefaults";
import { country, int, INT32_MAX, language, Nullable, uint } from "./types";
import { $declareMethods } from "./object";

export function $div(a: number, b: number) : number { return $icast(a/b) ; }

// truncate toward zero ; the `| 0` fast path is only valid inside the signed
// int32 range, otherwise it would overflow (eg. 3_000_000_000 | 0 === -1294967296)
export function $icast(v:number):number
{
    if (v >= 0) { return v <= INT32_MAX ? v | 0 : Math.floor(v) ; }
    return v >= -INT32_MAX ? -((-v) | 0) : -Math.floor(-v) ;
}

export function $round(v:number, decimalPlaces:number = 0):number {
    const p = Math.pow(10, $toint(decimalPlaces));
    return Math.round((v * p) * (1 + Number.EPSILON)) / p ;
}

export function $fpad2(v: number, failedChar?:string) : string { return $fpad(v,2, failedChar) ; }
export function $fpad3(v: number, failedChar?:string) : string { return $fpad(v,3, failedChar) ; }
export function $fpad4(v: number, failedChar?:string) : string { return $fpad(v,4, failedChar) ; }
export function $fpad(v: number, pad:number, failedChar?:string) : string {
    if ($isunsigned(v)) { return v.toString().padStart(pad, '0') ; }
    return ''.padStart(pad, $length(failedChar) === 1 ? failedChar! : 'X') ;
}

export interface $unitOptions { // NOSONAR: name accepted for matchnig the function
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

    let unitName = sn ;
    if (unitName.length === 0) { unitName = su.length ? su : 'm' ; }
    const pluralUnitName = sp.length ? sp : unitName ;
    const minU = $ok(opts?.minimalUnit) ? Math.min(0, Math.max(-8, opts!.minimalUnit!)) : -8 ;
    const maxU = $ok(opts?.maximalUnit) ? Math.min(8, Math.max(0, opts!.maximalUnit!)) : 8 ;
    let   dm = $isunsigned(opts?.decimalPlaces) ? opts.decimalPlaces : 2 ;
    if (v === 0) {
        if (dm === 0 || !!opts?.ignoreZeroDecimals || (minU === 0 && !!opts?.ignoreMinimalUnitDecimals)) { return '0 ' + pluralUnitName ; }
        return '0.'.padEnd(2+dm, '0') + ' ' + pluralUnitName ;
    }
    const unit = su.length ? su : unitName.charAt(0) ;
    const i = Math.max(minU, Math.min(maxU, Math.floor(Math.log(Math.abs(v)) / TSLog1000))) ;
    if (i === minU && !!opts?.ignoreMinimalUnitDecimals) { dm = 0 ;}
    let suffix = unit ;
    if (i === 0) { suffix = v === 1 ? unitName : pluralUnitName ; }
    return ((0.0+v) / (0.0+Math.pow(1000, i))).toFixed(dm) + ' ' + TSUnitMultiples[i+8] + suffix ;
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

// byte -> 2 hex chars, precomputed once for both cases
const FoundationHexaBytesUpper:string[] = new Array(256) ;
const FoundationHexaBytesLower:string[] = new Array(256) ;
for (let i = 0 ; i < 256 ; i++) {
    FoundationHexaBytesUpper[i] = FoundationHexaChars[i >> 4]      + FoundationHexaChars[i & 0xF] ;
    FoundationHexaBytesLower[i] = FoundationHexaLowerChars[i >> 4] + FoundationHexaLowerChars[i & 0xF] ;
}

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

$declareMethods(Number, {
    bytes(this:number, decimalPlaces?:number, locale?:Nullable<language|country|TSCountry|Locales>):string { 
        return $bytes(this, decimalPlaces, locale) ; 
    },
    dateComponents(this:number) { return $components(this) ; },
    durationComponents(this:number) { return $durationcomponents(this) ; },
    fpad(this:number, pad:number, failedChar?:string) { return $fpad(this, pad, failedChar) ; },
    fpad2(this:number, failedChar?:string) { return $fpad(this, 2, failedChar) ; },
    fpad3(this:number, failedChar?:string) { return $fpad(this, 3, failedChar) ; },
    fpad4(this:number, failedChar?:string) { return $fpad(this, 4, failedChar) ; },
    hexaValue(this:number):number {
        if (this >= 48 && this < 58)  { return this - 48 ; }
        if (this >= 65 && this < 71)  { return this - 55 ; }
        if (this >= 97 && this < 103) { return this - 87 ; }
        return -1 ;
    },
    icast(this:number):number { return $icast(this) ; },
    isNewLine(this:number):boolean { return FoundationNewLineNumberCodeSet.has(this) ; },
    isWhiteSpace(this:number):boolean { return FoundationWhiteSpacesNumberCodeSet.has(this) ; },
    isStrictWhiteSpace(this:number):boolean { return FoundationStricWhiteSpacesNumberCodeSet.has(this) ; },
    meters(this:number, decimalPlaces?:number):string { return $meters(this, decimalPlaces) ; },
    octets(this:number, decimalPlaces?:number):string { return $octets(this, decimalPlaces) ; },
    round(this:number, decimalPlaces?:number):number { return $round(this, decimalPlaces) ; },
    singular(this:number):boolean { return this === 1 ; },
    toDate(this:number):Date|null { return $isnumber(this) ? new Date(this) : null ; },
    toDurationString(this:number, format?:Nullable<string>) { return $durationNumber2StringFormat(this, format) ; },
    toDurationDescription(this:number, opts?:Nullable<$durationDescriptionOptions>) { return $durationDescription(this, opts) ; },
// toHexN() : the receiver is coerced to uint32 with `>>> 0` (fast, and gives the
// two's-complement representation for negatives) instead of the full $tounsigned() check
    toHex1(this:number, toLowerCase?:Nullable<boolean>):string {
        return (!!toLowerCase ? FoundationHexaLowerChars : FoundationHexaChars)[(this >>> 0) & 0x0F] ;
    },
    toHex2(this:number, toLowerCase?:Nullable<boolean>):string {
        return (!!toLowerCase ? FoundationHexaBytesLower : FoundationHexaBytesUpper)[(this >>> 0) & 0xFF] ;
    },
    toHex4(this:number, toLowerCase?:Nullable<boolean>):string {
        const n = this >>> 0 ;
        const t = !!toLowerCase ? FoundationHexaBytesLower : FoundationHexaBytesUpper ;
        return t[(n >>> 8) & 0xFF] + t[n & 0xFF] ;
    },
    toHex8(this:number, toLowerCase?:Nullable<boolean>):string {
        const n = this >>> 0 ;
        const t = !!toLowerCase ? FoundationHexaBytesLower : FoundationHexaBytesUpper ;
        return t[(n >>> 24) & 0xFF] + t[(n >>> 16) & 0xFF] + t[(n >>> 8) & 0xFF] + t[n & 0xFF] ;
    },
    toInt(this:number, defaultValue?:int):int { return $toint(this, defaultValue) ; },
    toTSDate(this:number):TSDate|null { return TSDate.fromTimeStamp(this) ; },
    toUnsigned(this:number, defaultValue?:uint):uint { return $tounsigned(this, defaultValue) ; },
    unit(this:number, opts?:Nullable<$unitOptions>):string { return $unit(this, opts) ; },
}) ;

