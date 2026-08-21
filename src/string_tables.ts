import { NormativeStringEncoding, StringEncoding } from "./types";

/*
    Separation in white spaces and new lines are conform to unicode 4 specifications.
    Note the character VT (\u000b) is not condidered as a new line but as a whitespace
*/

export const FoundationASCIINewLines = "\u000a\u000c\u000d" ;
export const FoundationASCIIStrictWhiteSpaces = "\u0009\u000b\u0020" ;
export const FoundationASCIIWhiteSpaces = FoundationASCIIStrictWhiteSpaces+FoundationASCIINewLines ;

export const FoundationBinaryNewLines = FoundationASCIINewLines+"\u0085" ;
export const FoundationBynaryStrictWhiteSpaces = FoundationASCIIStrictWhiteSpaces+"\u00A0" ;
export const FoundationBinaryWhiteSpaces = FoundationBynaryStrictWhiteSpaces+FoundationBinaryNewLines ;

export const FoundationNewLines = FoundationBinaryNewLines+"\u2028\u2029" ;
export const FoundationStrictWhiteSpaces = FoundationBynaryStrictWhiteSpaces + "\u1680\u180E\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u200B\u202F\u205F\u3000\uFEFF" ;
export const FoundationWhiteSpaces = FoundationStrictWhiteSpaces+FoundationNewLines ;

export const FoundationFindAllWhitespacesRegex = new RegExp(`[${FoundationWhiteSpaces}]+`, 'g') ;
export const FoundationFindStrictWhitespacesRegex = new RegExp(`[${FoundationStrictWhiteSpaces}]+`, 'g') ;
export const FoundationLeftTrimRegex = new RegExp(`^[${FoundationWhiteSpaces}]+`) ;
export const FoundationRightTrimRegex = new RegExp(`[${FoundationWhiteSpaces}]+$`) ;

export const FoundationWhiteSpacesNumberCodeSet:Set<number> = _whiteSpacesAsNumberSet(FoundationWhiteSpaces) ;
export const FoundationWhiteSpacesStringCodeSet:Set<string> = _whiteSpaceAsStringSet(FoundationWhiteSpaces) ;
export const FoundationNewLineNumberCodeSet:Set<number> = _whiteSpacesAsNumberSet(FoundationNewLines) ;
export const FoundationNewLineStringCodeSet:Set<string> = _whiteSpaceAsStringSet(FoundationNewLines) ;
export const FoundationStricWhiteSpacesNumberCodeSet:Set<number> = _whiteSpacesAsNumberSet(FoundationStrictWhiteSpaces) ;
export const FoundationStrictWhiteSpacesStringCodeSet:Set<string> = _whiteSpaceAsStringSet(FoundationStrictWhiteSpaces) ;

function _whiteSpacesAsNumberSet(reference:string):Set<number> {
    let ret = new Set<number>() ;
    const len = reference.length ;
    for (let i = 0 ; i < len ; i++) {
        ret.add(reference.charCodeAt(i)) ;
    }
    return ret ;
}

function _whiteSpaceAsStringSet(reference:string):Set<string> {
    let ret = new Set<string>() ;
    const len = reference.length ;
    for (let i = 0 ; i < len ; i++) {
        ret.add(reference.charAt(i)) ;
    }
    return ret ;
}


export const FoundationEncodingsAliases:Array<{ name:NormativeStringEncoding, aliases:StringEncoding[]}> = [
    { name: 'ascii', aliases:['ASCII'] },
    { name: 'latin1', aliases:[
        'bin', 'BIN', 'binary', 'BINARY',
        'LATIN1', 'latin-1', 'LATIN-1', 'latin_1', 'LATIN_1',
        'iso-latin1', 'ISO-LATIN1', 'isolatin1', 'ISOLATIN1', 'ISOLatin1',
        'iso-8859-1', 'ISO-8859-1', '8859-1', 'ISO_8859-1', "ISO8859-1",
        'iso-ir-100',
        '819', 'cp819', 'CP819', 'IBM819',
        'l1',
        'csISOLatin1',
        'ansicpg819', '\\ansicpg819'        
    ]},
    { name: 'utf8', aliases:[ 'UTF8', 'utf-8', 'UTF-8', 'utf_8', 'UTF_8']},
    { name: 'utf16le', aliases:[
        'UTF16', 'utf16', 'utf-16', 'utf_16', 'UTF-16', 'UTF_16',
        'ucs2', 'ucs-2', 'ucs_2', 'UCS2', 'UCS-2', 'UCS_2',
        'unicode', 'UNICODE',
        'utf-16le', 'UTF-16LE', 'utf_16le', 'UTF_16LE', 'UTF16LE'        
    ]},
    { name: 'base64', aliases: ['BASE64'] },
    { name: 'base64url', aliases:[ 'BASE64URL', 'base64-url', 'BASE64-URL', 'base64_url', 'BASE64_URL']},
    { name: 'hex', aliases: [ 'HEX', 'hexa', 'HEXA', 'hexadecimal', 'HEXADECIMAL']}
]

function _foundationStringEncodings(definitions:Array<{ name:NormativeStringEncoding, aliases:StringEncoding[]}> ):Map<StringEncoding, NormativeStringEncoding> {
    let ret = new Map<StringEncoding, NormativeStringEncoding> ;
    definitions.forEach( d => {
        ret.set(d.name, d.name) ;
        d.aliases.forEach(a => { ret.set(a, d.name) ; })
    }) ;
    return ret ;
}

export const FoundationStringEncodingsMap = _foundationStringEncodings(FoundationEncodingsAliases) ;


export const FoundationHTMLEncoding:string[] = [
    /* 00 */	"", "", "", "", "", "", "", "",
    /* 08 */	"", "\u0009", "\u000a", "\u000b", "\u000c", "\u000d", "\u000e", "\u000f",
    /* 10 */	"", "", "", "", "", "", "", "",
    /* 18 */	"", "", "", "", "", "", "", "",
    /* 20 */	" ", "!", "&quot;", "#", "$", "%", "&amp;", "'",
    /* 28 */	"(", ")", "*", "+", ",", "-", ".", "/",
    /* 30 */	"0", "1", "2", "3", "4", "5", "6", "7",
    /* 38 */	"8", "9", ":", ";", "&lt;", "=", "&gt;", "?",
    /* 40 */	"@", "A", "B", "C", "D", "E", "F", "G",
    /* 48 */	"H", "I", "J", "K", "L", "M", "N", "O",
    /* 50 */	"P", "Q", "R", "S", "T", "U", "V", "W",
    /* 58 */	"X", "Y", "Z", "[", "\\", "]", "^", "_",
    /* 60 */	"`", "a", "b", "c", "d", "e", "f", "g",
    /* 68 */	"h", "i", "j", "k", "l", "m", "n", "o",
    /* 70 */	"p", "q", "r", "s", "t", "u", "v", "w",
    /* 78 */	"x", "y", "z", "{", "|", "}", "~", "",
    /* 80 */	"", "", "", "", "", "", "", "",
    /* 88 */	"", "", "", "", "", "", "", "",
    /* 90 */	"", "", "", "", "", "", "", "",
    /* 98 */	"", "", "", "", "", "", "", "",
    /* A0 */	"&nbsp;", "&iexcl;", "&cent;", "&pound;", "&curren;", "&yen;", "&brvbar;", "&sect;",
    /* A8 */	"&uml;", "&copy;", "&ordf;", "&laquo;", "&not;", "&shy;", "&reg;", "&macr;",
    /* B0 */	"&deg;", "&plusmn;", "&sup2;", "&sup3;", "&acute;", "&micro;", "&para;", "&middot;",
    /* B8 */	"&cedil;", "&sup1;", "&ordm;", "&raquo;", "&frac14;", "&frac12;", "&frac34;", "&iquest;",
    /* C0 */	"&Agrave;", "&Aacute;", "&Acirc;", "&Atilde;", "&Auml;", "&Aring;", "&AElig;", "&Ccedil;",
    /* C8 */ 	"&Egrave;", "&Eacute;", "&Ecirc;", "&Euml;", "&Igrave;", "&Iacute;", "&Icirc;", "&Iuml;",
    /* D0 */ 	"&ETH;", "&Ntilde;", "&Ograve;", "&Oacute;", "&Ocirc;", "&Otilde;", "&Ouml;", "&times;",
    /* D8 */ 	"&Oslash;", "&Ugrave;", "&Uacute;", "&Ucirc;", "&Uuml;", "&Yacute;", "&THORN;", "&szlig;",
    /* E0 */	"&agrave;", "&aacute;", "&acirc;", "&atilde;", "&auml;", "&aring;", "&aelig;", "&ccedil;",
    /* E8 */ 	"&egrave;", "&eacute;", "&ecirc;", "&euml;", "&igrave;", "&iacute;", "&icirc;", "&iuml;",
    /* F0 */ 	"&eth;", "&ntilde;", "&ograve;", "&oacute;", "&ocirc;", "&otilde;", "&ouml;", "&divide;",
    /* F8 */ 	"&oslash;", "&ugrave;", "&uacute;", "&ucirc;", "&uuml;", "&yacute;", "&thorn;", "&yuml;"
 ] ;

 export const FoundationHTMLStructureEncoding = [...FoundationHTMLEncoding] ;
 FoundationHTMLStructureEncoding[0x22] = '"' ;
 FoundationHTMLStructureEncoding[0x26] = '&' ;
 FoundationHTMLStructureEncoding[0x3c] = '<' ;
 FoundationHTMLStructureEncoding[0x3e] = '>' ;

 