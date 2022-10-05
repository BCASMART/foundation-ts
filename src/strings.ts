import { $email, $isodate, $length, $ok, $toint, $tounsigned, $url, $UUID } from "./commons";
import { FoundationASCIIConversion, FoundationFindAllWhitespacesRegex, FoundationHTMLEncoding, FoundationLeftTrimRegex, FoundationNewLinesSplitRegex, FoundationRightTrimRegex, FoundationStrictWhiteSpacesStringCodeSet, FoundationWhiteSpacesStringCodeSet } from "./string_tables";
import { int, Nullable, uint } from "./types";

// for now $ascii() does not mak any transliterations from
// non-latin languages like Greek
export function $ascii(source: Nullable<string>) : string
{
	const l = $length(source) ;
	if (!l) return '' ;
    let s = (source as string).replace(/≠/g, "") ;
	s = s.normalize("NFD").replace(/[\u0300-\u036f]|\u00a8|\u00b4/g, "").normalize("NFKD") ; // does most of the job
	// finally we will try to convert (or remove) the remaining non ascii characters
	return s.replace(/[^\x00-\x7F]/g, x => FoundationASCIIConversion[x] || '') ;
}

/**
 *   We don't use standard trim because it does not trim all unicode whitespaces! 
 */
// left-trim
export function $ltrim(s:Nullable<string>) : string
{ return $length(s) ? (s as string).replace(FoundationLeftTrimRegex, "") : '' ; }

// right-trim
export function $rtrim(s: Nullable<string>) : string
{ return $length(s) ? (s as string).replace(FoundationRightTrimRegex, "") : '' ; }

// full-trim
export function $ftrim(s: Nullable<string>) : string
{ return $length(s) ? (s as string).replace(FoundationLeftTrimRegex, "").replace(FoundationRightTrimRegex, "") : '' ; }

export { $ftrim as $trim }

export function $lines(s: Nullable<string>) : string[]
{ return $ok(s) ? s!.split(FoundationNewLinesSplitRegex) : [] ; }

export function $normspaces(s: Nullable<string>) : string
{ return $ftrim(s).replace(FoundationFindAllWhitespacesRegex, " ") ; }

export function $firstcap(s: Nullable<string>) : string
{ return _capitalize(s, 1) ; }

export function $capitalize(s: Nullable<string>) : string
{ return _capitalize(s) ; }

export function $HTML(s:Nullable<string>, reference:string[]=FoundationHTMLEncoding) : string 
{
    const len = $length(s) ;
    let ret = "" ;
    for (let i = 0 ; i < len ; i++) {
        const c = s!.charCodeAt(i) ;
        if (c < 0xff) { ret += reference[c] ; }
        else { ret += '&#'+c ; }
    }
    return ret ;
}

declare global {
    export interface String {
        toHTML: (this:string, reference?:string[]) => string ;
        ascii: (this:string) => string ;
        firstCap: (this:string) => string ;
        capitalize: (this:string) => string ;
        normalizeSpaces: (this:string) => string ;
        ftrim: (this:string) => string ;
        ltrim: (this:string) => string ;
        rtrim: (this:string) => string ;
        isDate: (this:string) => boolean ;
        isEmail: (this:string) => boolean ;
        isUrl: (this:string) => boolean ;
        isUUID: (this:string) => boolean ;
        lines: (this:string) => string[] ;
        toInt:  (this:string, defaultValue?:int) => int ;
        toUnsigned:  (this:string, defaultValue?:uint) => uint ;
        isNewLine:   (this:string) => boolean ;
        isWhiteSpace:(this:string) => boolean ;
        isStrictWhiteSpace:(this:string) => boolean ;
    }
}

if (!('isWhiteSpace' in String.prototype)) {
    String.prototype.isWhiteSpace = function isNewLine(this:string) { return FoundationWhiteSpacesStringCodeSet.has(this) ; }
    String.prototype.isStrictWhiteSpace = function isNewLine(this:string) { return FoundationStrictWhiteSpacesStringCodeSet.has(this) ; }
}
if (!('isNewLine' in String.prototype)) {
    String.prototype.isNewLine = function isNewLine(this:string) { return this === '\u000a' || this === '\u000b' || this === '\u000c' || this === '\u000d' ; }
}
if (!('ascii' in String.prototype)) {
    String.prototype.ascii   = function ascii(this:string):string { return $ascii(this) ; }
}
if (!('toHTML' in String.prototype)) {
    String.prototype.toHTML = function toHTML(this:string, reference?:string[]):string { return $HTML(this, reference) ; }
}
if (!('firstCap' in String.prototype)) {
    String.prototype.firstCap = function firstCap(this:string):string { return $firstcap(this) ; }
}
if (!('capitalize' in String.prototype)) {
    String.prototype.capitalize = function capitalize(this:string):string { return $capitalize(this) ; }
}
if (!('normalizeSpaces' in String.prototype)) {
    String.prototype.normalizeSpaces = function normalizeSpaces(this:string):string { return $normspaces(this) ; }
}
if (!('ftrim' in String.prototype)) {
    String.prototype.ftrim = function ftrim(this:string):string { return $ftrim(this) ; }
}
if (!('ltrim' in String.prototype)) {
    String.prototype.ltrim = function ltrim(this:string):string { return $ltrim(this) ; }
}
if (!('rtrim' in String.prototype)) {
    String.prototype.rtrim = function rtrim(this:string):string { return $rtrim(this) ; }
}
if (!('isDate' in String.prototype)) {
    String.prototype.isDate  = function isDate(this:string):boolean { return $ok($isodate(this)) ; }
}
if (!('isEmail' in String.prototype)) {
    String.prototype.isEmail = function isEmail(this:string):boolean { return $ok($email(this)) ; }
}
if (!('isUrl' in String.prototype)) {
    String.prototype.isUrl   = function isUrl(this:string):boolean { return $ok($url(this)) ; }
}
if (!('isUUID' in String.prototype)) {
    String.prototype.isUUID  = function isUUID(this:string):boolean { return $ok($UUID(this)) ; }
}
if (!('lines' in String.prototype)) {
    String.prototype.lines  = function lines(this:string):string[] { return $lines(this) ; }
}
if (!('toInt' in String.prototype)) {
    String.prototype.toInt = function toInt(this:string, defaultValue?:int) { return $toint(this, defaultValue) ; }
}
if (!('toUnsigned' in String.prototype)) {
    String.prototype.toUnsigned = function toUnsigned(this:string, defaultValue?:uint) { return $tounsigned(this, defaultValue) ; }
}

// ================================== private functions ==============================

function _capitalize(s:Nullable<string>, max:number = 0) : string 
{
    const len = $length(s) ;
    let ret = "" ;
    if (!max) { max = len} ;
    let lastCharWasNotLetter = true ;
    let n = 0 ;

    for (let i = 0 ; i < len ; i++) {
        const c = s!.charAt(i) ;
        const isLetter = _charAssimilableAsLetter(c) ;
        if (isLetter && lastCharWasNotLetter && n < max) { ret += c.toUpperCase() ; n++ ; }
        else { ret +=c ; }
        lastCharWasNotLetter = !isLetter ;
    }

    return ret ;
}

function _charAssimilableAsLetter(c:string):boolean
{
    c = $ascii(c) ;
    if (c.length) {
        const v = c.charCodeAt(0) & ~32 ;
        return v >= 65 && v <= 90 ;
    }
    return false ;
}
