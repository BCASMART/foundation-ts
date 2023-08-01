import { $email, $isdate, $isodate, $length, $ok, $toint, $tounsigned, $unsigned, $url, $UUID, $value } from "./commons";
import { FoundationASCIIConversion, FoundationFindAllWhitespacesRegex, FoundationFindStrictWhitespacesRegex, FoundationHTMLEncoding, FoundationHTMLStructureEncoding, FoundationLeftTrimRegex, FoundationNewLineStringCodeSet, FoundationRightTrimRegex, FoundationStrictWhiteSpacesStringCodeSet, FoundationWhiteSpacesStringCodeSet } from "./string_tables";
import { TSCountry } from "./tscountry";
import { TSDate } from "./tsdate";
import { TSPhoneNumber } from "./tsphonenumber";
import { int, Nullable, uint } from "./types";

// for now $ascii() does not mak any transliterations from
// non-latin languages like Greek
export function $ascii(source: Nullable<string>): string {
    const l = $length(source);
    if (!l) return '';
    let s = (source as string).replace(/≠/g, "");
    s = s.normalize("NFD").replace(/[\u0300-\u036f]|\u00a8|\u00b4/g, "").normalize("NFKD"); // does most of the job
    // finally we will try to convert (or remove) the remaining non ascii characters
    return s.replace(/[^\x00-\x7F]/g, x => FoundationASCIIConversion[x] || '');
}

/**
 *   We don't use standard trim because it does not trim all unicode whitespaces! 
 */
// left-trim
export function $ltrim(s: Nullable<string>): string { return $length(s) ? (s as string).replace(FoundationLeftTrimRegex, "") : ''; }

// right-trim
export function $rtrim(s: Nullable<string>): string { return $length(s) ? (s as string).replace(FoundationRightTrimRegex, "") : ''; }

// full-trim
export function $ftrim(s: Nullable<string>): string { return $length(s) ? (s as string).replace(FoundationLeftTrimRegex, "").replace(FoundationRightTrimRegex, "") : ''; }

export { $ftrim as $trim }

export function $left(source: Nullable<string>, leftPart?:Nullable<number>): string {
    const l = $length(source) ;
    let n = $unsigned(leftPart) ; if (!n) (n = 1 as uint)
    return l > 0 ? (n >= l ? source! : source!.slice(0, n)) : '' ;
}

export function $right(source: Nullable<string>, rightPart?:Nullable<number>): string {
    const l = $length(source) ;
    let n = $unsigned(rightPart) ; if (!n) (n = 1 as uint)
    return l > 0 ? (n >= l ? source! : source!.slice(l-n, l)) : '' ;
}

/*
 * this function now tries to interpret LF (\n), other unicode line and paragraph separator and CR+LF as lines separators
 * it uses 'The Unicode Standard, Version 4.0, issued by the Unicode - Chapter 5.8 NewLine Guidelines' to assert lines separation policy
 * 
 * In this chapter, simple text lines separator could be CR, LF, CRLF, FF, NEL, LS or PS. The VT character (0x000B) is considered to
 * be used only in Microsoft Word and is not considered here as a line separator
 * 
 * If useOnlyASCIISeparators is set, only CR, LF and CRLF are used as line separators
 * 
 */
export function $lines(s: Nullable<string>, useOnlyASCIISeparators: boolean = false): string[] {
    const len = $length(s)
    const ret: string[] = [] ;
    if (len > 0) {
        enum LCState { CR, NewLine, Other } ;
        const [CR, LF, FF, NEL, LS, PS] = [0x000D, 0x000A, 0x000C, 0x0085, 0x02028, 0x02029] ;
        const isOtherLineSeparator = useOnlyASCIISeparators ? (_:number) => false : (c:number) => c === LS || c === PS || c === NEL || c === FF ;

        let lcstate:LCState = LCState.Other ;
        let lastPosition = 0, pos = 0 ;

        while (pos < len) {
            const c = s!.charCodeAt(pos) ;
            if (lcstate === LCState.CR) {
                ret.push(s!.slice(lastPosition, pos - 1)) ;
                if (c === LF) { lastPosition = pos + 1 ; lcstate = LCState.NewLine ; }
                else if (isOtherLineSeparator(c)) { ret.push('') ; lastPosition = pos + 1 ; lcstate = LCState.NewLine ; }
                else { lcstate = LCState.Other ; lastPosition = pos-- ; } // we rewind the last char as if the precedent one was not CR
            }
            else if (c === CR) { lcstate = LCState.CR ; }
            else if (c === LF || isOtherLineSeparator(c)) {
                ret.push(s!.slice(lastPosition, pos));
                lastPosition = pos + 1 ;
                lcstate = LCState.NewLine ;
            }
            else { lcstate = LCState.Other ; }
            pos++ ;
        }
        switch (lcstate) {
            case LCState.CR:
                ret.push(s!.slice(lastPosition, pos - 1));
                ret.push('');
                break ;
            case LCState.NewLine:
                ret.push('') ;
                break ;
            case LCState.Other:
                if (lastPosition < pos) { ret.push(s!.slice(lastPosition, pos)) ; }
                break ;
        }
    }
    else if ($ok(s)) { ret.push('') ; }
    return ret ;
}
export interface $normspacesOpions {
    replacer?:string,
    strict?:boolean
}

export function $normspaces(s: Nullable<string>, opts:$normspacesOpions = {}): string { 
    return $ftrim(s).replace(
        opts.strict ? FoundationFindStrictWhitespacesRegex : FoundationFindAllWhitespacesRegex, 
        $value(opts.replacer, " ")
    ); 
}

export function $firstcap(s: Nullable<string>): string { return _capitalize(s, 1); }
export function $capitalize(s: Nullable<string>): string { return _capitalize(s); }
export function $camelCase(s: Nullable<string>): string { return _camelCase(s) ; } // WARNING: we assume we have an ASCII identifier here, so we transform it in ASCII
export function $snakeCase(s: Nullable<string>): string { return _snakeCase(s) ; } // WARNING: we assume we have an ASCII identifier here, so we transform it in ASCII

export function $HTML(s: Nullable<string>, reference: string[] = FoundationHTMLEncoding): string {
    const len = $length(s);
    let ret = "";
    for (let i = 0; i < len; i++) {
        const c = s!.charCodeAt(i);
        if (c <= 0xff) { ret += reference[c]; }
        else { ret += '&#' + c; }
    }
    return ret;
}

export class HTMLContent extends String {
}


declare global {
    export interface String {
        ascii:              (this: string) => string;
        camelCase:          (this: string) => string;
        capitalize:         (this: string) => string;
        doubleEscape:       (this: string, char:string) => string ;
        firstCap:           (this: string) => string;
        ftrim:              (this: string) => string;
        left:               (this: string, leftPart?:Nullable<number>) => string;
        isDate:             (this: string) => boolean;
        isEmail:            (this: string) => boolean;
        isNewLine:          (this: string) => boolean;
        isStrictWhiteSpace: (this: string) => boolean;
        isUrl:              (this: string) => boolean;
        isUUID:             (this: string) => boolean;
        isWhiteSpace:       (this: string) => boolean;
        lines:              (this: string, useOnlyASCIISeparators?:boolean) => string[];
        ltrim:              (this: string) => string;
        normalizeSpaces:    (this: string, opts?: $normspacesOpions) => string;
        right:              (this: string, rightPart?:Nullable<number>) => string;
        rtrim:              (this: string) => string;
        singular:           (this: string) => boolean ;
        snakeCase:          (this: string) => string;
        toDate:             (this: string) => Date|null ;
        toHTML:             (this: string) => string;
        toHTMLContent:      (this: string) => HTMLContent ;
        toInt:              (this: string, defaultValue?: int) => int;
        toPhoneNumber:      (this: string, defaultCountry?:Nullable<TSCountry>) => TSPhoneNumber|null;
        toTSDate:           (this: string) => TSDate|null ;
        toUnsigned:         (this: string, defaultValue?: uint) => uint;
    }
    export interface HTMLContent {
        toHTML:             (this: any) => string;
    }

}
String.prototype.ascii              = function ascii(this: string): string { return $ascii(this); } ;
String.prototype.camelCase          = function camelCase(this: string): string { return _camelCase(this) ; }
String.prototype.capitalize         = function capitalize(this: string): string { return $capitalize(this); } ;
String.prototype.doubleEscape       = function doubleEscape(this:string, c:string) { return _doubleEscape(this, c) ; }
String.prototype.firstCap           = function firstCap(this: string): string { return $firstcap(this); } ;
String.prototype.ftrim              = function ftrim(this: string): string { return $ftrim(this); } ;
String.prototype.isDate             = function isDate(this: string): boolean { return $ok($isodate(this)); } ;
String.prototype.isEmail            = function isEmail(this: string): boolean { return $ok($email(this)); } ;
String.prototype.isNewLine          = function isNewLine(this: string): boolean { return FoundationNewLineStringCodeSet.has(this) }
String.prototype.isStrictWhiteSpace = function isStrictWhiteSpace(this: string): boolean { return FoundationStrictWhiteSpacesStringCodeSet.has(this); }
String.prototype.isUrl              = function isUrl(this: string): boolean { return $ok($url(this)); }
String.prototype.isUUID             = function isUUID(this: string): boolean { return $ok($UUID(this)); }
String.prototype.isWhiteSpace       = function isWhiteSpace(this: string): boolean { return FoundationWhiteSpacesStringCodeSet.has(this); }
String.prototype.left               = function left(this: string, leftPart?:Nullable<number>): string { return $left(this, leftPart) ; }
String.prototype.lines              = function lines(this: string, useOnlyASCIISeparators?:boolean): string[] { return $lines(this, useOnlyASCIISeparators); }
String.prototype.ltrim              = function ltrim(this: string): string { return $ltrim(this); }
String.prototype.normalizeSpaces    = function normalizeSpaces(this: string, opts?: $normspacesOpions): string { return $normspaces(this, opts); }
String.prototype.right              = function right(this: string, rightPart?:Nullable<number>): string { return $right(this, rightPart) ; }
String.prototype.rtrim              = function rtrim(this: string): string { return $rtrim(this); }
String.prototype.singular           = function singular(this:string) { return this.toUnsigned() === 1 ; }
String.prototype.snakeCase          = function snakeCase(this: string): string { return _snakeCase(this) ; }
String.prototype.toDate             = function toDate(this:string):Date|null { return $isdate(this) ? new Date(this) : null ; }
String.prototype.toHTML             = function toHTML(this: any): string { return $HTML(this); }
String.prototype.toHTMLContent      = function toHTMLContent(this:string): HTMLContent { return new HTMLContent(this) ; }
String.prototype.toInt              = function toInt(this: string, defaultValue?: int): int { return $toint(this, defaultValue); }
String.prototype.toTSDate           = function toTSDate(this:string):TSDate|null { return TSDate.fromIsoString(this) ; }
String.prototype.toPhoneNumber      = function toPhoneNumber(this:string, defaultCountry?:Nullable<TSCountry>):TSPhoneNumber|null { return TSPhoneNumber.fromString(this, defaultCountry) ; }
String.prototype.toUnsigned         = function toUnsigned(this: string, defaultValue?: uint): uint { return $tounsigned(this, defaultValue); }

HTMLContent.prototype.toHTML = function toHTML(this: any): string { return $HTML(''+this, FoundationHTMLStructureEncoding); }

// ================================== private functions ==============================
function _doubleEscape(source:string, doubbler:string):string {
    let ret = '' ;
    for (let c of source) { ret += (c === doubbler) ? c+c : c ; }
    return ret ;
}

function _snakeCase(source: Nullable<string>): string {
    const s = $ascii($normspaces(source, { strict:true, replacer:''})) ;
    const len = s.length;
    let ret = '' ;
    let lastCharWasDash = false;

    for (let i = 0; i < len; i++) {
        const c = s.charAt(i) ;
        if (c === '_' || c === '-') { lastCharWasDash = true ; continue ; }
        else if (lastCharWasDash) { ret += '_' ; }
        ret += c.toLowerCase() ;
        lastCharWasDash = false ;
    }
    // we remove trailing dashes

    return ret ;
}

function _camelCase(source: Nullable<string>): string {
    const s = $ascii($normspaces(source, { strict:true, replacer:''})) ;
    const len = s.length;
    let ret = '' ;
    let lastCharWasDash = false;

    for (let i = 0; i < len; i++) {
        const c = s.charAt(i) ;
        if (c === '_' || c === '-') { lastCharWasDash = true ; continue ; }
        else if (lastCharWasDash && c >= 'a' && c <= 'z') { ret += c.toUpperCase() ; }
        else { ret += c ; }
        lastCharWasDash = false ;
    }    
    // we remove trailing dashes

    return ret ;
}

function _capitalize(s: Nullable<string>, max: number = 0): string {
    const len = $length(s);
    let ret = "";
    if (!max) { max = len };
    let lastCharWasNotLetter = true;
    let n = 0;

    for (let i = 0; i < len; i++) {
        const c = s!.charAt(i);
        const isLetter = _charAssimilableAsLetter(c);
        if (isLetter && lastCharWasNotLetter && n < max) { ret += c.toUpperCase(); n++; }
        else { ret += c; }
        lastCharWasNotLetter = !isLetter;
    }

    return ret;
}

function _charAssimilableAsLetter(c: string): boolean {
    c = $ascii(c);
    if (c.length) {
        const v = c.charCodeAt(0) & ~32;
        return v >= 65 && v <= 90;
    }
    return false;
}
