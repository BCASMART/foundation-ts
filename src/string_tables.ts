import { NormativeStringEncoding, StringDictionary, StringEncoding } from "./types";

/*
    Since there's no login in String.normalize() function,
    we are obliged to force conversion of all those unichars > 0x7F
    to their ASCII transliteration. All unichars > 0x7F non declared
    in FoundationASCIIConversion dictionary are ignored.    
*/
const _otherWhiteSpaces = "\u1680\u180E\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u200B\u2028\u2029\u202F\u205F\u3000\uFEFF" ;
export const FoundationNewLines = "\u000a\u000b\u000c\u000d" ;
export const FoundationASCIIStrictWhiteSpaces = "\u0009\u0020" ;
export const FoundationBynaryStrictWhiteSpaces = FoundationASCIIStrictWhiteSpaces+"\u0085\u00A0" ;
export const FoundationASCIIWhiteSpaces = FoundationASCIIStrictWhiteSpaces+FoundationNewLines ;
export const FoundationBinaryWhiteSpaces = FoundationBynaryStrictWhiteSpaces+FoundationNewLines ;
export const FoundationStrictWhiteSpaces = FoundationBynaryStrictWhiteSpaces+_otherWhiteSpaces ;
export const FoundationWhiteSpaces = FoundationBinaryWhiteSpaces+_otherWhiteSpaces ;
export const FoundationASCIIConversion:StringDictionary = {

    /* 00A0 */
    '¡': '!',
    '¢': 'c',
    '£': 'GBP',
    '¥': 'JPY',
    '¦': '|',
    '©': '(C)',
    '«': '"',
    '­': '-',
    '®': '(R)',

    /* 00B0 */
    '·': '.',
    '»': '"',
    '¿': '?',

    /* 00C0 */
	'Æ': 'AE',

    /* 00D0 */
    'Ð': 'D',
    '×': 'x',
    'Ø': 'O',
    'Þ': 'TH',
    'ß': 'ss',

    /* 00E0 */
    'æ': 'ae',

    /* 00F0 */
    'ð': 'd',
    '÷': '/',
    'ø': 'o',
    'þ': 'th',

    /* 0110 */
    'Đ': 'D',
    'đ': 'd',

    /* 0120 */
    'Ħ': 'H',
    'ħ': 'h',

    /* 0130 */
    'ı': 'i',

    /* 0140 */
    'Ł': 'L',
    'ł': 'l',
    'Ŋ': 'N',
    'ŋ': 'n',

    /* 0150 */
    'Œ': 'OE',
    'œ': 'oe',
    'Ŧ': 'T',
    'ŧ': 't',

    /* 0180 */
    'ƀ': 'b',
    'Ɓ': 'B',
    'Ƃ': 'B',
    'ƃ': 'b',
    'Ƅ': 'B',
    'ƅ': 'b',
    'Ɔ': 'O',
    'Ƈ': 'C',
    'ƈ': 'c',
    'Ɖ': 'D',
    'Ɗ': 'D',
    'Ƌ': 'D',
    'ƌ': 'd',
    'ƍ': 'd',
    'Ǝ': 'E',
    'Ə': 'E',

    /* 0190 */
    'Ɛ': 'E',
    'Ƒ': 'F',
    'ƒ': 'f',
    'Ɠ': 'G',
    'Ɣ': 'G',
    'ƕ': 'hv',
    'Ɩ': 'I',
    'Ɨ': 'I',
    'Ƙ': 'K',
    'ƙ': 'k',
    'ƚ': 'i',
    'ƛ': 'l',
    'Ɯ': 'M',
    'Ɲ': 'N',
    'ƞ': 'n',
    'Ɵ': 'O',

    /* 01A0 */
    'Ƣ': 'OI',
    'ƣ': 'oi',
    'Ƥ': 'P',
    'ƥ': 'p',
    'Ʀ': 'YR',
    'Ƨ': 'S',
    'ƨ': 's',
    'Ʃ': 'S',
    'ƪ': 's',
    'ƫ': 't',
    'Ƭ': 'T',
    'ƭ': 't',
    'Ʈ': 'T',

    /* 01B0 */
    'Ʋ': 'v',
    'Ƴ': 'Y',
    'ƴ': 'y',
    'Ƶ': 'Z',
    'ƶ': 'z',
    'Ʒ': 'Z',
    'Ƹ': 'Z',
    'ƹ': 'z',
    'ƺ': 'z',
    'ƻ': '2',
    'ƿ': 'w',

    /* 01C0 */
    'ǃ': '!',

    /* 01D0 */
    'ǝ': 'e',

    /* 01E0 */
    'Ǥ': 'G',
    'ǥ': 'g',
    'Ǯ': 'Z',
    'ǯ': 'z',

    /* 01F0 */
    'Ƕ': 'HV',
    'Ƿ': 'W',

    /* 0210 */
    'Ȝ': 'G',
    'ȝ': 'g',

    /* 0220 */
    'Ƞ': 'N',
    'ȡ': 'd',
    'Ȣ': 'OU',
    'ȣ': 'ou',
    'Ȥ': 'Z',
    'ȥ': 'z',

    /* 0230 */
    'ȴ':'l',
    'ȵ': 'n',
    'ȶ': 't',
    'ȷ': 'j',
    'ȸ': 'db',
    'ȹ': 'qp',
    'Ⱥ': 'A',
    'Ȼ': 'C',
    'ȼ': 'c',
    'Ƚ': 'L',
    'Ⱦ': 'T',
    'ȿ': 's',

    /* 0240 */
    'ɀ': 'z',
    'Ƀ': 'B',
    'Ʉ': 'U',
    'Ʌ': 'V',
    'Ɇ': 'E',
    'ɇ': 'e',
    'Ɉ': 'J',
    'ɉ': 'j',
    'Ɋ': 'Q',
    'ɋ': 'q',
    'Ɍ': 'R',
    'ɍ': 'r',
    'Ɏ': 'Y',
    'ɏ': 'y',
    
    /* 0250 */
    'ɐ': 'a',
    'ɑ': 'a',
    'ɒ': 'a',
    'ɓ': 'b',
    'ɔ': 'o',
    'ɕ': 'c',
    'ɖ': 'd',
    'ɘ': 'e',
    'ə': 'e', // could be ae
    'ɚ': 'e',
    'ɛ': 'e',
    'ɜ': 'e',
    'ɝ': 'e',
    'ɞ': 'e',
    'ɟ': 'j',

    /* 0260 */
    'ɠ': 'g',
    'ɡ': 'g',
    'ɢ': 'G',
    'ɣ': 'g',
    'ɥ': 'h',
    'ɦ': 'h',
    'ɧ': 'h',
    'ɨ': 'i',
    'ɩ': 'i',
    'ɪ': 'I',
    'ɫ': 'l',
    'ɬ': 'l',
    'ɭ': 'l',
    'ɮ': 'lz',
    'ɯ': 'm',

    /* 0270 */
    'ɰ': 'm',
    'ɱ': 'm',
    'ɲ': 'n',
    'ɳ': 'n',
    'ɴ': 'N',
    'ɵ': 'o',
    'ɶ': 'OE',
    'ɷ': 'o',
    'ɹ': 'r',
    'ɺ': 'r',
    'ɻ': 'r',
    'ɼ': 'r',
    'ɽ': 'r',
    'ɾ': 'r',
    'ɿ': 'r',

    /* 0280 */
    'ʀ': 'R',
    'ʁ': 'R',
    'ʂ': 's',
    'ʃ': 's',
    'ʄ': 'j',
    'ʅ': 's',
    'ʆ': 's',
    'ʇ': 't',
    'ʈ': 't',
    'ʉ': 'u',
    'ʋ': 'v',
    'ʌ': 'v',
    'ʍ': 'W',
    'ʎ': 'y',
    'ʏ': 'Y',

    /* 0290 */
    'ʐ': 'z',
    'ʑ': 'z',
    'ʒ': 'z',
    'ʓ': 'z',
    'ʗ': 'C',
    'ʙ': 'B',
    'ʚ': 'e',
    'ʛ': 'G',
    'ʜ': 'H',
    'ʝ': 'j',
    'ʞ': 'k',
    'ʟ': 'L',

    /* 02A0 */
    'ʠ': 'q',
    'ʣ': 'dz',
    'ʤ': 'dz',
    'ʥ': 'dz',
    'ʦ': 'ts',
    'ʧ': 'ts',
    'ʨ': 'tc',
    'ʩ': 'fn',
    'ʪ': 'ls',
    'ʫ': 'lz',
    'ʬ': 'ww',
    'ʮ': 'h',
    'ʯ': 'h',

    /* 1D00 */
    'ᴀ': 'A',
    'ᴁ': 'AE',
    'ᴂ': 'ae',
	'ᴃ': 'B',
	'ᴄ': 'C',
	'ᴅ': 'D',
    'ᴆ': 'D',
	'ᴇ': 'E',
    'ᴈ': 'e',
    'ᴉ': 'i',
	'ᴊ': 'J',
	'ᴋ': 'K',
	'ᴌ': 'L',
	'ᴍ': 'M',
	'ᴎ': 'N',
    'ᴏ': 'O',

    /* 1D10 */
	'ᴐ': 'O',
    'ᴑ': 'o',
    'ᴒ': 'o',
    'ᴓ': 'o',
    'ᴔ': 'oe',
    'ᴕ': 'OU',
    'ᴖ': 'o',
    'ᴗ': 'o',
    'ᴘ': 'P',
	'ᴙ': 'R',
	'ᴚ': 'R',
	'ᴛ': 'T',
	'ᴜ': 'U',
    'ᴝ': 'u',
    'ᴞ': 'u',
    'ᴟ': 'm',

    /* 1D20 */
	'ᴠ': 'V',
	'ᴡ': 'W',
	'ᴢ': 'Z',
    'ᴣ': 'Z',

    /* 1D60 */
    'ᵫ': 'ue',
    'ᵬ': 'b',
    'ᵭ': 'd',
    'ᵮ': 'f',
    'ᵯ': 'm',
    
    /* 1D70 */
    'ᵰ': 'n',
    'ᵱ': 'p',
    'ᵲ': 'r',
    'ᵳ': 'r',
    'ᵴ': 's',
    'ᵵ': 't',
    'ᵶ': 'z',
    'ᵷ': 'g',
    'ᵹ': 'g',
    'ᵺ': 'th',
    'ᵻ': 'I',
    'ᵼ': 'i',
    'ᵽ': 'p',
    'ᵾ': 'U',

    /* 1D80 */
    'ᶀ': 'b',
    'ᶁ': 'd',
    'ᶂ': 'f',
    'ᶃ': 'g',
    'ᶄ': 'k',
    'ᶅ': 'l',
    'ᶆ': 'm',
    'ᶇ': 'n',
    'ᶈ': 'p',
    'ᶉ': 'r',
    'ᶊ': 's',
    'ᶋ': 's',
    'ᶌ': 'v',
    'ᶍ': 'x',
    'ᶎ': 'z',
    'ᶏ': 'a',

    /* 1D90*/
    'ᶐ': 'a',
    'ᶑ': 'd',
    'ᶒ': 'e',
    'ᶓ': 'e',
    'ᶔ': 'e',
    'ᶕ': 'e',
    'ᶖ': 'i',
    'ᶗ': 'o',
    'ᶘ': 's',
    'ᶙ': 'u',
    'ᶚ': 'z',


    /* 1E90 */
    'ẜ': 's',
    'ẝ': 's',
    'ẞ': 'SS',
    'ẟ': 'd',

    /* 1EF0 */
    'Ỻ': 'LL',
    'ỻ': 'll',
    'Ỽ': 'V',
    'ỽ': 'v',
    'Ỿ': 'Y',
    'ỿ': 'y',

    /* 2010 */
    '‐': '-',
    '‑': '-',
    '‒': '-',
    '–': '-',
    '—': '-',
    '―': '-',
    '‘': "'",
    '’': "'",
    '‚': "'",
    '‛': "'",
    '“': '"',
    '”': '"',
    '„': '"',
    '‟': '"',

    /* 2020 */
    '•': '.',
    '‧': '.',

    /* 2030 */
    '′': "'",
    '‵': '`',
    '‹': '<',
    '›': '>',
    '‽': '!?',

    /* 2040 */
    '⁂': '***',
    '⁃': '-',
    '⁄': '/',
    '⁅': '[',
    '⁆': ']',
    '⁎': '*',
    '⁏': ';',
        
    /* 2050 */
    '⁑': '**',
    '⁒': '%',
    '⁓': '~',
    '⁕': '*',

    /* 20A0 */
    '₣': 'FRF',
    '€': 'EUR',

    /* 2110 */
    '℗': '(P)',
    '℘': 'P',
    '℞': 'R',
    '℟': 'R',

    /* 2120 */
    '℮': 'e',

    /* 2130 */
    'Ⅎ': 'F',
    '℺': 'Q',
    
    /* 2140 */
    '⅁': 'G',
    '⅂': 'L',
    '⅃': 'L',
    '⅄': 'Y',
    '⅋': '&',
    '⅍': 'A/S',
    'ⅎ': 'F',

    /* 2200 */
    '∂': 'd',

    /* 2210 */
    '−': '-',
    '∕': '/',
    '∖': '\\',
    '∗': '*',
    '∙': '.',

    /* 2230 */
    '∼': '~',

    /* 2260 */
//    '≠': '!=',
    '≤': '<=',
    '≥': '>=',

    /* 2290 */
    '⋜': '=<',
    '⋝': '=>',

    /* 22C0 */
    '⋅': '.',

    /* 22E0 */
    '⋯': '...',

    /* 2310 */
    '⌗': '#',

    /* 2330 */
    '⌸': '=',
    '⌹': '/',
    '⌿': '/',

    /* 2340 */
    '⍀': '\\',
    '⍁': '/',
    '⍂': '\\',
    '⍃': '<',
    '⍄': '>',

    /* 2350 */
    '⍘': "'",

    /* 2360 */
    '⍠': ':',
    '⍪': ',',
    '⍮': ';',
    '⍯': '!=',

    /* 2370 */
    '⍰': '?',
    '⍳': 'i',
    '⍸': 'i',

    /* 24E0 */
    '⓫': '11',
    '⓬': '12',
    '⓭': '13',
    '⓮': '14',
    '⓯': '15',

    /* 24F0 */
    '⓰': '16',
    '⓱': '17',
    '⓲': '18',
    '⓳': '19',
    '⓴': '20',
    '⓵': '1',
    '⓶': '2',
    '⓷': '3',
    '⓸': '4',
    '⓹': '5',
    '⓺': '6',
    '⓻': '7',
    '⓼': '8',
    '⓽': '9',
    '⓾': '10',
    '⓿': '0',
    
    /* 2630 */
    '☹': ':(',
    '☺': ':)',
    '☻': ':)',

    /* 2750 */
    '❓': '?',
    '❔': '?',
    '❕': '!',
    '❗': '!',
    '❘': '|',
    '❙': '|',
    '❚': '|',
    '❛': "'",
    '❜': "'",
    '❝': '"',
    '❞': '"',

    /* 2760 */
    '❨': '(',
    '❩': ')',
    '❪': '(',
    '❫': ')',

    /* 2770 */
    '❲': '[',
    '❳': ']',
    '❴': '{',
    '❵': '}',
    '❶': '1',
    '❷': '2',
    '❸': '3',
    '❹': '4',
    '❺': '5',
    '❻': '6',
    '❼': '7',
    '❽': '8',
    '❾': '9',
    '❿': '10',

    /* 2780 */
    '➀': '1',
    '➁': '2',
    '➂': '3',
    '➃': '4',
    '➄': '5',
    '➅': '6',
    '➆': '7',
    '➇': '8',
    '➈': '9',
    '➉': '10',
    '➊': '1',
    '➋': '2',
    '➌': '3',
    '➍': '4',
    '➎': '5',
    '➏': '6',

    /* 2790 */
    '➐': '7',
    '➑': '8',
    '➒': '9',
    '➓': '10',
    '➕': '+',
    '➖': '-',
    '➗': '/',

    /* 27C0 */
    '⟊': '|',
    '⟋': '/',
    '⟍': '\\',

    /* 27E0 */
    '⟦': '[',
    '⟧': ']',
    '⟬': '[',
    '⟭': ']',
    '⟮': '(',
    '⟯': ')',
    
    /* 2980 */
    '⦃': '{',
    '⦄': '}',
    '⦅': '(',
    '⦆': ')',
    '⦇': '(',
    '⦈': ')',
    '⦋': '[',
    '⦌': ']',
    '⦍': '[',
    '⦎': ']',
    '⦏': '[',

    /* 2990 */
    '⦐': ']',
    '⦗': '[',
    '⦘': ']',

    /* 29F0 */
    '⧵': '\\',
    '⧶': '/',
    '⧷': '\\',
    '⧸': '/',
    '⧹': '\\',

    /* 2A70 */
    '⩽': '<=',
    '⩾': '>=',

    /* 2C60 */
    'Ⱡ': 'L',
    'ⱡ': 'l',
    'Ɫ': 'L',
    'Ᵽ': 'P',
    'Ɽ': 'R',
    'ⱥ': 'a',
    'ⱦ': 't',
    'Ⱨ': 'H',
    'ⱨ': 'h',
    'Ⱪ': 'K',
    'ⱪ': 'k',
    'Ⱬ': 'Z',
    'ⱬ': 'z',
    'Ɑ': 'A',
    'Ɱ': 'M',
    'Ɐ': 'A',

    /* 2C70 */
    'Ɒ': 'A',
    'ⱱ': 'v',
    'Ⱳ': 'W',
    'ⱳ': 'w',
    'ⱴ': 'v',
    'Ⱶ': 'H',
    'ⱶ': 'h',
    'ⱸ': 'e',
    'ⱹ': 'r',
    'ⱺ': 'o',
    'ⱻ': 'E',
    'Ȿ': 'S',
    'Ɀ': 'Z',
    
    /* A720 */
    'Ꜧ': 'H',
    'ꜧ': 'h',
    'Ꜩ': 'TZ',
    'ꜩ': 'tz',
    
    /* A730 */
    'ꜰ': 'F',
    'ꜱ': 'S',
    'Ꜳ': 'AA',
    'ꜳ': 'aa',
    'Ꜵ': 'AO',
    'ꜵ': 'ao',
    'Ꜷ': 'AU',
    'ꜷ': 'au',
    'Ꜹ': 'AV',
    'ꜹ': 'av',
    'Ꜻ': 'AV',
    'ꜻ': 'av',
    'Ꜽ': 'AY',
    'ꜽ': 'ay',
    'Ꜿ': 'C',
    'ꜿ': 'c',

    /* A740 */
    'Ꝁ': 'K',
    'ꝁ': 'k',
    'Ꝃ': 'K',
    'ꝃ': 'k',
    'Ꝅ': 'K',
    'ꝅ': 'k',
    'Ꝇ': 'L',
    'ꝇ': 'l',
    'Ꝉ': 'L',
    'ꝉ': 'l',
    'Ꝋ': 'O',
    'ꝋ': 'o',
    'Ꝍ': 'O',
    'ꝍ': 'o',
    'Ꝏ': 'OO',
    'ꝏ': 'oo',

    /* A750 */
    'Ꝑ': 'P',
    'ꝑ': 'p',
    'Ꝓ': 'P',
    'ꝓ': 'p',
    'Ꝕ': 'P',
    'ꝕ': 'p',
    'Ꝗ': 'Q',
    'ꝗ': 'q',
    'Ꝙ': 'Q',
    'ꝙ': 'q',
    'Ꝛ': 'R',
    'ꝛ': 'r',
    'Ꝟ': 'V',
    'ꝟ': 'v',

    /* A760 */
    'Ꝡ': 'VY',
    'ꝡ': 'vy',
    'Ꝣ': 'Z',
    'ꝣ': 'z',
    'Ꝥ': 'TH',
    'ꝥ': 'th',
    'Ꝧ': 'TH',
    'ꝧ': 'th',
    
    /* A770 */
    'ꝱ': 'd',
    'ꝲ': 'l',
    'ꝳ': 'm',
    'ꝴ': 'n',
    'ꝵ': 'r',
    'ꝶ': 'R',
    'ꝷ': 'f',
    'Ꝺ': 'D',
    'ꝺ': 'd',
    'Ꝼ': 'F',
    'ꝼ': 'f',
    'Ᵹ': 'G',
    'Ꝿ': 'G',
    'ꝿ': 'g',

    /* A780 */
    'Ꞁ': 'L',
    'ꞁ': 'l',
    'Ꞃ': 'R',
    'ꞃ': 'r',
    'Ꞅ': 'S',
    'ꞅ': 's',
    'Ꞇ': 'T',
    'ꞇ': 't',
    'Ɥ': 'H',
    'ꞎ': 'l',

    /* A790 */
    'Ꞑ': 'N',
    'ꞑ': 'n',
    'Ꞓ': 'C',
    'ꞓ': 'c',

    /* A7A0 */
    'Ꞡ': 'G',
    'ꞡ': 'g',
    'Ꞣ': 'K',
    'ꞣ': 'k',
    'Ꞥ': 'N',
    'ꞥ': 'n',
    'Ꞧ': 'R',
    'ꞧ': 'r',
    'Ꞩ': 'S',
    'ꞩ': 's',
    'Ɦ': 'H',
    'Ɪ': 'I',
    'ꞯ': 'Q',

    /* A7B0 */
    'ꞵ': 'b',

    /* A7F0 */
    'ꟺ': 'M',
    'ꟻ': 'F',
    'ꟼ': 'P',
    'ꟽ': 'M',

    /* FE50 */
    '﹘': '-',
    '﹝': '[',
    '﹞': ']',

    /* FF50 */
    '｟': '(', // why not '(('

    /* FF60 */
    '｠': ')',

    /* 1F100 */
    '🄋': '0',
    '🄌': '0',

    /* 1F150 */
    '🅐': 'A',
    '🅑': 'B',
    '🅒': 'C',
    '🅓': 'D',
    '🅔': 'E',
    '🅕': 'F',
    '🅖': 'G',
    '🅗': 'H',
    '🅘': 'I',
    '🅙': 'J',
    '🅚': 'K',
    '🅛': 'L',
    '🅜': 'M',
    '🅝': 'N',
    '🅞': 'O',
    '🅟': 'P',

    /* 1F160 */
    '🅠': 'Q',
    '🅡': 'R',
    '🅢': 'S',
    '🅣': 'T',
    '🅤': 'U',
    '🅥': 'V',
    '🅦': 'W',
    '🅧': 'X',
    '🅨': 'Y',
    '🅩': 'Z',

    /* 1F170 */
    '🅰': 'A',
    '🅱': 'B',
    '🅲': 'C',
    '🅳': 'D',
    '🅴': 'E',
    '🅵': 'F',
    '🅶': 'G',
    '🅷': 'H',
    '🅸': 'I',
    '🅹': 'J',
    '🅺': 'K',
    '🅻': 'L',
    '🅼': 'M',
    '🅽': 'N',
    '🅾': 'O',
    '🅿': 'P',

    /* 1F180 */
    '🆀': 'Q',
    '🆁': 'R',
    '🆂': 'S',
    '🆃': 'T',
    '🆄': 'U',
    '🆅': 'V',
    '🆆': 'W',
    '🆇': 'X',
    '🆈': 'Y',
    '🆉': 'Z',
    '🆎': 'AB',
    '🆏': 'WC',

    /* 1F190 */
    '🆑': 'CL',
    '🆒': 'COOL',
    '🆓': 'FREE',
    '🆔': 'ID',
    '🆕': 'NEW',
    '🆖': 'NG',
    '🆗': 'OK',
    '🆘': 'SOS',
    '🆙': 'UP!',
    '🆚': 'VS',

    /* common emoticons */
    "😠": ">:(",
    "😊": ":\")",
    "💔": "<\\3",
    "😕": ":/",
    "😢": ":,(",
    "😦": ":(",
    "❤️": "<3",
    "👿": "]:(",
    "😇": "0:)",
    "😂": ":,)",
    "😗": ":*",
    "😆": "x)",
    "👨": ":3",
    "😐": ":|",
    "😶": ":-",
    "😮": ":o",
    "😡": ":@",
    "😄": ":D",
    "😃": ":)",
    "😈": "]:)",
    "😭": ":,'(",
    "😛": ":p",
    "😝": "xP",
    "😜": ";p",
    "😎": "8)",
    "😓": ",:(",
    "😅": ",:)",
    "😒": ":$",
    "😉": ";)" 
} ;

_addWhiteSpaces() ;
export const FoundationFindAllWhitespacesRegex = new RegExp(`[${FoundationWhiteSpaces}]+`, 'g') ;
export const FoundationLeftTrimRegex = new RegExp(`^[${FoundationWhiteSpaces}]+`) ;
export const FoundationRightTrimRegex = new RegExp(`[${FoundationWhiteSpaces}]+$`) ;

export const FoundationNewLinesSplitRegex = new RegExp(`[${FoundationNewLines}]`) ;

export const FoundationWhiteSpacesNumberCodeSet:Set<number> = _whiteSpacesAsNumberSet(FoundationWhiteSpaces) ;
export const FoundationWhiteSpacesStringCodeSet:Set<string> = _whiteSpaceAsStringSet(FoundationWhiteSpaces) ;
export const FoundationStricWhiteSpacesNumberCodeSet:Set<number> = _whiteSpacesAsNumberSet(FoundationStrictWhiteSpaces) ;
export const FoundationStrictWhiteSpacesStringCodeSet:Set<string> = _whiteSpaceAsStringSet(FoundationStrictWhiteSpaces) ;

function _addWhiteSpaces() {
    const len = FoundationWhiteSpaces.length ;
    for (let i = 0 ; i < len ; i++) {
        FoundationASCIIConversion[FoundationWhiteSpaces.charAt(i)] = ' ' ;
    }
}

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

export const FoundationStringEncodings:{ [k in StringEncoding]: NormativeStringEncoding } = {
    'ascii':        'ascii',
    'ASCII':        'ascii',
    'bin':          'latin1',
    'BIN':          'latin1',
    'binary':       'latin1', 
    'BINARY':       'latin1', 
    'latin1':       'latin1', 
    'LATIN1':       'latin1', 
    'iso-latin1':   'latin1',
    'ISO-LATIN1':   'latin1',
    'isolatin1':    'latin1',
    'ISOLATIN1':    'latin1',
    'utf8':         'utf8', 
    'utf-8':        'utf8', 
    'UTF8':         'utf8', 
    'UTF-8':        'utf8', 
    'utf16':        'utf16le', 
    'utf-16':       'utf16le', 
    'UTF16':        'utf16le', 
    'UTF-16':       'utf16le', 
    "ucs2":         'utf16le',
    "ucs-2":        'utf16le', 
    'UCS2':         'utf16le', 
    'UCS-2':        'utf16le',
    'utf16le':      'utf16le',
    'unicode':      'utf16le',
    'UNICODE':      'utf16le',
    'utf-16le':     'utf16le', 
    'UTF-16LE':     'utf16le', 
    'UTF16LE' :     'utf16le',
    'base64':       'base64',
    'BASE64':       'base64',
    'base64url':    'base64url',
    'BASE64URL':    'base64url',
    'hex':          'hex',
    'HEX':          'hex', 
    'hexa':         'hex', 
    'HEXA':         'hex'
} ;


