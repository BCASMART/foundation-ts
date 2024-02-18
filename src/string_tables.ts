import { NormativeStringEncoding, StringDictionary, StringEncoding } from "./types";

/*
    Since there's no login in String.normalize() function,
    we are obliged to force conversion of all those unichars > 0x7F
    to their ASCII transliteration. All unichars > 0x7F non declared
    in FoundationASCIIConversion dictionary are ignored.   
    
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

export const FoundationASCIIConversion:StringDictionary = {

    /* 00A0 */
    '¡': '!',
    '¢': 'c',
    '£': 'GBP',
    '¥': 'JPY',
    '¦': '|',
    '©': '(C)',
    '«': '"',
    // 0x00ad was removed from here because it's removed earlier as a 'nothing' space
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
    
    /* 0380 - ELOT Transliteration */
    'Ά': 'A',
    'Έ': 'E',
    'Ή': 'H',
    'Ί': 'I',
    'Ό': 'O',
    'Ύ': 'Y',
    'Ώ': 'O',

    /* 0390 - ELOT Transliteration */
    'ΐ': 'i',
    'Α': 'A',
    'Β': 'V',
    'Γ': 'G',
    'Δ': 'D',
    'Ε': 'E',
    'Ζ': 'Z',
    'Η': 'I',
    'Θ': 'TH',
    'Ι': 'I',
    'Κ': 'K',
    'Λ': 'L',
    'Μ': 'M',
    'Ν': 'N',
    'Ξ': 'X',
    'Ο': 'O',

    /* 03A0 - ELOT Transliteration */
    'Π': 'P',
    'Ρ': 'R',
    'Σ': 'S',
    'Τ': 'T',
    'Υ': 'Y',
    'Φ': 'F',
    'Χ': 'CH',
    'Ψ': 'PS',
    'Ω': 'O',
    'Ϊ': 'I',
    'Ϋ': 'Y',
    'ά': 'a',
    'έ': 'e',
    'ή': 'i',
    'ί': 'i',

    /* 03B0 - ELOT Transliteration */
    'ΰ': 'y',
    'α': 'a',
    'β': 'v',
    'γ': 'g',
    'δ': 'd',
    'ε': 'e',
    'ζ': 'z',
    'η': 'i',
    'θ': 'th',
    'ι': 'i',
    'κ': 'k',
    'λ': 'l',
    'μ': 'm',
    'ν': 'n',
    'ξ': 'x',
    'ο': 'o',

    /* 03C0 - ELOT Transliteration */
    'π': 'p',
    'ρ': 'r',
    'ς': 's',
    'σ': 's',
    'τ': 't',
    'υ': 'y',
    'φ': 'f',
    'χ': 'ch',
    'ψ': 'ps',
    'ω': 'o',
    'ϊ': 'i',
    'ϋ': 'y',
    'ό': 'o',
    'ύ': 'y',
    'ώ': 'o',

    /* 03D0 - ELOT Transliteration */
    'ϐ': 'v',
    'ϑ': 'th',
    'ϒ': 'Y',
    'ϓ': 'Y',
    'ϔ': 'Y',
    'ϕ': 'f',

    /* 03F0 - ELOT Transliteration */
    'ϱ': 'r',
    'ϲ': 's',
    'ϴ': 'TH',
    'ϵ': 'e',
    '϶': 'e',
    'Ϲ': 'S',
    'ϼ': 'r',
    'Ͻ': 'S',
    'Ͼ': 'S',
    'Ͽ': 'S',
    
    /* 0660 */
    '٠': '0',
    '١': '1',
    '٢': '2',
    '٣': '3',
    '٤': '4',
    '٥': '5',
    '٦': '6',
    '٧': '7',
    '٨': '8',
    '٩': '9',
    '٪': '%',
    
    /* 06F0 */
    '۰': '0',
    '۱': '1',
    '۲': '2',
    '۳': '3',
    '۴': '4',
    '۵': '5',
    '۶': '6',
    '۷': '7',
    '۸': '8',
    '۹': '9',

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

    /* 1F00 - ELOT Transliteration */
    'ἀ': 'a',
    'ἁ': 'a',
    'ἂ': 'a',
    'ἃ': 'a',
    'ἄ': 'a',
    'ἅ': 'a',
    'ἆ': 'a',
    'ἇ': 'a',
    'Ἀ': 'A',
    'Ἁ': 'A',
    'Ἂ': 'A',
    'Ἃ': 'A',
    'Ἄ': 'A',
    'Ἅ': 'A',
    'Ἆ': 'A',
    'Ἇ': 'A',

    /* 1F10 - ELOT Transliteration */
    'ἐ': 'e',
    'ἑ': 'e',
    'ἒ': 'e',
    'ἓ': 'e',
    'ἔ': 'e',
    'ἕ': 'e',
    'Ἐ': 'E',
    'Ἑ': 'E',
    'Ἒ': 'E',
    'Ἓ': 'E',
    'Ἔ': 'E',
    'Ἕ': 'E',

    /* 1F20 - ELOT Transliteration */
    'ἠ': 'i',
    'ἡ': 'i',
    'ἢ': 'i',
    'ἣ': 'i',
    'ἤ': 'i',
    'ἥ': 'i',
    'ἦ': 'i',
    'ἧ': 'i',
    'Ἠ': 'I',
    'Ἡ': 'I',
    'Ἢ': 'I',
    'Ἣ': 'I',
    'Ἤ': 'I',
    'Ἥ': 'I',
    'Ἦ': 'I',
    'Ἧ': 'I',

    /* 1F30 - ELOT Transliteration */
    'ἰ': 'i',
    'ἱ': 'i',
    'ἲ': 'i',
    'ἳ': 'i',
    'ἴ': 'i',
    'ἵ': 'i',
    'ἶ': 'i',
    'ἷ': 'i',
    'Ἰ': 'I',
    'Ἱ': 'I',
    'Ἲ': 'I',
    'Ἳ': 'I',
    'Ἴ': 'I',
    'Ἵ': 'I',
    'Ἶ': 'I',
    'Ἷ': 'I',

    /* 1F40 - ELOT Transliteration */
    'ὀ': 'o',
    'ὁ': 'o',
    'ὂ': 'o',
    'ὃ': 'o',
    'ὄ': 'o',
    'ὅ': 'o',
    'Ὀ': 'O',
    'Ὁ': 'O',
    'Ὂ': 'O',
    'Ὃ': 'O',
    'Ὄ': 'O',
    'Ὅ': 'O',

    /* 1F50 - ELOT Transliteration */
    'ὐ': 'y',
    'ὑ': 'y',
    'ὒ': 'y',
    'ὓ': 'y',
    'ὔ': 'y',
    'ὕ': 'y',
    'ὖ': 'y',
    'ὗ': 'y',
    'Ὑ': 'Y',
    'Ὓ': 'Y',
    'Ὕ': 'Y',
    'Ὗ': 'Y',

    /* 1F60 - ELOT Transliteration */
    'ὠ': 'o',
    'ὡ': 'o',
    'ὢ': 'o',
    'ὣ': 'o',
    'ὤ': 'o',
    'ὥ': 'o',
    'ὦ': 'o',
    'ὧ': 'o',
    'Ὠ': 'O',
    'Ὡ': 'O',
    'Ὢ': 'O',
    'Ὣ': 'O',
    'Ὤ': 'O',
    'Ὥ': 'O',
    'Ὦ': 'O',
    'Ὧ': 'O',

    /* 1F70 - ELOT Transliteration */
    'ὰ': 'a',
    'ά': 'a',
    'ὲ': 'e',
    'έ': 'e',
    'ὴ': 'i',
    'ή': 'i',
    'ὶ': 'i',
    'ί': 'i',
    'ὸ': 'o',
    'ό': 'o',
    'ὺ': 'y',
    'ύ': 'y',
    'ὼ': 'o',
    'ώ': 'o',

    /* 1F80 - ELOT Transliteration */
    'ᾀ': 'a',
    'ᾁ': 'a',
    'ᾂ': 'a',
    'ᾃ': 'a',
    'ᾄ': 'a',
    'ᾅ': 'a',
    'ᾆ': 'a',
    'ᾇ': 'a',
    'ᾈ': 'A',
    'ᾉ': 'A',
    'ᾊ': 'A',
    'ᾋ': 'A',
    'ᾌ': 'A',
    'ᾍ': 'A',
    'ᾎ': 'A',
    'ᾏ': 'A',

    /* 1F90 - ELOT Transliteration */
    'ᾐ': 'i',
    'ᾑ': 'i',
    'ᾒ': 'i',
    'ᾓ': 'i',
    'ᾔ': 'i',
    'ᾕ': 'i',
    'ᾖ': 'i',
    'ᾗ': 'i',
    'ᾘ': 'I',
    'ᾙ': 'I',
    'ᾚ': 'I',
    'ᾛ': 'I',
    'ᾜ': 'I',
    'ᾝ': 'I',
    'ᾞ': 'I',
    'ᾟ': 'I',

    /* 1FA0 - ELOT Transliteration */
    'ᾠ': 'o',
    'ᾡ': 'o',
    'ᾢ': 'o',
    'ᾣ': 'o',
    'ᾤ': 'o',
    'ᾥ': 'o',
    'ᾦ': 'o',
    'ᾧ': 'o',
    'ᾨ': 'O',
    'ᾩ': 'O',
    'ᾪ': 'O',
    'ᾫ': 'O',
    'ᾬ': 'O',
    'ᾭ': 'O',
    'ᾮ': 'O',
    'ᾯ': 'O',
    
    /* 1FB0 - ELOT Transliteration */
    'ᾰ': 'a',
    'ᾱ': 'a',
    'ᾲ': 'a',
    'ᾳ': 'a',
    'ᾴ': 'a',
    'ᾶ': 'a',
    'ᾷ': 'a',
    'Ᾰ': 'A',
    'Ᾱ': 'A',
    'Ὰ': 'A',
    'Ά': 'A',
    'ᾼ': 'A',

    /* 1FC0 - ELOT Transliteration */
    'ῂ': 'i',
    'ῃ': 'i',
    'ῄ': 'i',
    'ῆ': 'i',
    'ῇ': 'i',
    'Ὲ': 'E',
    'Έ': 'E',
    'Ὴ': 'I',
    'Ή': 'I',
    'ῌ': 'I',

    /* 1FD0 - ELOT Transliteration */
    'ῐ': 'i',
    'ῑ': 'i',
    'ῒ': 'i',
    'ΐ': 'i',
    'ῖ': 'i',
    'ῗ': 'i',
    'Ῐ': 'I',
    'Ῑ': 'I',
    'Ὶ': 'I',
    'Ί': 'I',

    /* 1FE0 - ELOT Transliteration */
    'ῠ': 'y',
    'ῡ': 'y',
    'ῢ': 'y',
    'ΰ': 'y',
    'ῤ': 'r',
    'ῥ': 'r',
    'ῦ': 'y',
    'ῧ': 'y',
    'Ῠ': 'Y',
    'Ῡ': 'Y',
    'Ὺ': 'Y',
    'Ύ': 'Y',
    'Ῥ': 'R',

    /* 1FE0 - ELOT Transliteration */
    'ῲ': 'o',
    'ῳ': 'o',
    'ῴ': 'o',
    'ῶ': 'o',
    'ῷ': 'o',
    'Ὸ': 'O',
    'Ό': 'O',
    'Ὼ': 'O',
    'Ώ': 'O',
    'ῼ': 'O',
    
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

    /* 2370 - LIOT transliteration */
    '⍰': '?',
    '⍳': 'i',
    '⍴': 'r',
    '⍵': 'o',
    '⍶': 'a',
    '⍸': 'i',
    '⍹': 'o',
    '⍺': 'a',

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
    'ⱷ': 'f',
    'ⱸ': 'e',
    'ⱹ': 'r',
    'ⱺ': 'o',
    'ⱻ': 'E',
    'ⱼ': 'j',
    'Ȿ': 'S',
    'Ɀ': 'Z',
    
    /* 30F0 */
    '・': '.',
    'ー': '-',

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
    '｠': ')', // same remark

    /* 1D6A0 - ELOT transliteration */
    '𝚤': 'i',
    '𝚥': 'j',
    '𝚨': 'A',
    '𝚩': 'V',
    '𝚪': 'G',
    '𝚫': 'D',
    '𝚬': 'E',
    '𝚭': 'Z',
    '𝚮': 'I',
    '𝚯': 'TH',

    /* 1D6B0 - ELOT transliteration */
    '𝚰': 'I',
    '𝚱': 'K',
    '𝚲': 'L',
    '𝚳': 'M',
    '𝚴': 'N',
    '𝚵': 'X',
    '𝚶': 'O',
    '𝚷': 'P',
    '𝚸': 'R',
    '𝚹': 'TH',
    '𝚺': 'S',
    '𝚻': 'T',
    '𝚼': 'Y',
    '𝚽': 'F',
    '𝚾': 'CH',
    '𝚿': 'PS',

    /* 1D6C0 - ELOT transliteration */
    '𝛀': 'O',
    '𝛂': 'a',
    '𝛃': 'v',
    '𝛄': 'g',
    '𝛅': 'd',
    '𝛆': 'e',
    '𝛇': 'z',
    '𝛈': 'i',
    '𝛉': 'th',
    '𝛊': 'i',
    '𝛋': 'k',
    '𝛌': 'l',
    '𝛍': 'm',
    '𝛎': 'n',
    '𝛏': 'x',

    /* 1D6D0 - ELOT transliteration */
    '𝛐': 'o',
    '𝛑': 'p',
    '𝛒': 'r',
    '𝛓': 's',
    '𝛔': 's',
    '𝛕': 't',
    '𝛖': 'y',
    '𝛗': 'f',
    '𝛘': 'ch',
    '𝛙': 'ps',
    '𝛚': 'o',
    '𝛜': 'e',
    '𝛝': 'th',
    '𝛟': 'f',


    /* 1D6E0 - ELOT transliteration */
    '𝛠': 'r',
    '𝛢': 'A',
    '𝛣': 'V',
    '𝛤': 'G',
    '𝛥': 'D',
    '𝛦': 'E',
    '𝛧': 'Z',
    '𝛨': 'I',
    '𝛩': 'TH',
    '𝛪': 'I',
    '𝛫': 'K',
    '𝛬': 'L',
    '𝛭': 'M',
    '𝛮': 'N',
    '𝛯': 'X',

    /* 1D6F0 - ELOT transliteration */
    '𝛰': 'O',
    '𝛱': 'P',
    '𝛲': 'R',
    '𝛳': 'TH',
    '𝛴': 'S',
    '𝛵': 'T',
    '𝛶': 'Y',
    '𝛷': 'F',
    '𝛸': 'CH',
    '𝛹': 'PS',
    '𝛺': 'O',
    '𝛼': 'a',
    '𝛽': 'v',
    '𝛾': 'g',
    '𝛿': 'd',

    /* 1D700 - ELOT transliteration */
    '𝜀': 'e',
    '𝜁': 'z',
    '𝜂': 'i',
    '𝜃': 'th',
    '𝜄': 'i',
    '𝜅': 'k',
    '𝜆': 'l',
    '𝜇': 'm',
    '𝜈': 'n',
    '𝜉': 'x',
    '𝜊': 'o',
    '𝜋': 'p',
    '𝜌': 'r',
    '𝜍': 's',
    '𝜎': 's',
    '𝜏': 't',

    /* 1D710 - ELOT transliteration */
    '𝜐': 'y',
    '𝜑': 'f',
    '𝜒': 'ch',
    '𝜓': 'ps',
    '𝜔': 'o',
    '𝜖': 'e',
    '𝜗': 'th',
    '𝜙': 'f',
    '𝜚': 'r',
    '𝜜': 'A',
    '𝜝': 'V',
    '𝜞': 'G',
    '𝜟': 'D',

    /* 1D720 - ELOT transliteration */
    '𝜠': 'E',
    '𝜡': 'Z',
    '𝜢': 'I',
    '𝜣': 'TH',
    '𝜤': 'I',
    '𝜥': 'K',
    '𝜦': 'L',
    '𝜧': 'M',
    '𝜨': 'N',
    '𝜩': 'X',
    '𝜪': 'O',
    '𝜫': 'P',
    '𝜬': 'R',
    '𝜭': 'TH',
    '𝜮': 'S',
    '𝜯': 'T',

    /* 1D730 - ELOT transliteration */
    '𝜰': 'Y',
    '𝜱': 'F',
    '𝜲': 'CH',
    '𝜳': 'PS',
    '𝜴': 'O',
    '𝜶': 'a',
    '𝜷': 'v',
    '𝜸': 'g',
    '𝜹': 'd',
    '𝜺': 'e',
    '𝜻': 'z',
    '𝜼': 'i',
    '𝜽': 'th',
    '𝜾': 'i',
    '𝜿': 'k',

    /* 1D740 - ELOT transliteration */
    '𝝀': 'l',
    '𝝁': 'm',
    '𝝂': 'n',
    '𝝃': 'x',
    '𝝄': 'o',
    '𝝅': 'p',
    '𝝆': 'r',
    '𝝇': 's',
    '𝝈': 's',
    '𝝉': 't',
    '𝝊': 'y',
    '𝝋': 'f',
    '𝝌': 'ch',
    '𝝍': 'ps',
    '𝝎': 'o',

    /* 1D750 - ELOT transliteration */
    '𝝐': 'e',
    '𝝑': 'th',
    '𝝓': 'f',
    '𝝔': 'r',
    '𝝖': 'A',
    '𝝗': 'V',
    '𝝘': 'G',
    '𝝙': 'D',
    '𝝚': 'E',
    '𝝛': 'Z',
    '𝝜': 'I',
    '𝝝': 'TH',
    '𝝞': 'I',
    '𝝟': 'K',

    /* 1D760 - ELOT transliteration */
    '𝝠': 'L',
    '𝝡': 'M',
    '𝝢': 'N',
    '𝝣': 'X',
    '𝝤': 'O',
    '𝝥': 'P',
    '𝝦': 'R',
    '𝝧': 'TH',
    '𝝨': 'S',
    '𝝩': 'T',
    '𝝪': 'Y',
    '𝝫': 'F',
    '𝝬': 'CH',
    '𝝭': 'PS',
    '𝝮': 'O',

    /* 1D770 - ELOT transliteration */
    '𝝰': 'a',
    '𝝱': 'v',
    '𝝲': 'g',
    '𝝳': 'd',
    '𝝴': 'e',
    '𝝵': 'z',
    '𝝶': 'i',
    '𝝷': 'th',
    '𝝸': 'i',
    '𝝹': 'k',
    '𝝺': 'l',
    '𝝻': 'm',
    '𝝼': 'n',
    '𝝽': 'x',
    '𝝾': 'o',
    '𝝿': 'p',

    /* 1D780 - ELOT transliteration */
    '𝞀': 'r',
    '𝞁': 's',
    '𝞂': 's',
    '𝞃': 't',
    '𝞄': 'y',
    '𝞅': 'f',
    '𝞆': 'ch',
    '𝞇': 'ps',
    '𝞈': 'o',
    '𝞊': 'e',
    '𝞋': 'th',
    '𝞍': 'f',
    '𝞎': 'r',

    /* 1D790 - ELOT transliteration */
    '𝞐': 'A',
    '𝞑': 'V',
    '𝞒': 'G',
    '𝞓': 'D',
    '𝞔': 'E',
    '𝞕': 'Z',
    '𝞖': 'I',
    '𝞗': 'TH',
    '𝞘': 'I',
    '𝞙': 'K',
    '𝞚': 'L',
    '𝞛': 'M',
    '𝞜': 'N',
    '𝞝': 'X',
    '𝞞': 'O',
    '𝞟': 'P',

    /* 1D7A0 - ELOT transliteration */
    '𝞠': 'R',
    '𝞡': 'TH',
    '𝞢': 'S',
    '𝞣': 'T',
    '𝞤': 'Y',
    '𝞥': 'F',
    '𝞦': 'CH',
    '𝞧': 'PS',
    '𝞨': 'O',
    '𝞪': 'a',
    '𝞫': 'v',
    '𝞬': 'g',
    '𝞭': 'd',
    '𝞮': 'e',
    '𝞯': 'z',

    /* 1D7B0 - ELOT transliteration */
    '𝞰': 'i',
    '𝞱': 'th',
    '𝞲': 'i',
    '𝞳': 'k',
    '𝞴': 'l',
    '𝞵': 'm',
    '𝞶': 'n',
    '𝞷': 'x',
    '𝞸': 'o',
    '𝞹': 'p',
    '𝞺': 'r',
    '𝞻': 's',
    '𝞼': 's',
    '𝞽': 't',
    '𝞾': 'y',
    '𝞿': 'f',

    /* 1D7C0 - ELOT transliteration */
    '𝟀': 'ch',
    '𝟁': 'ps',
    '𝟂': 'o',
    '𝟄': 'e',
    '𝟅': 'th',
    '𝟇': 'f',
    '𝟈': 'r',

    /* 1F100 */
    '🄋': '0',
    '🄌': '0',

    /* 1F140 */
    '🅏': 'WC',

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
export const FoundationFindStrictWhitespacesRegex = new RegExp(`[${FoundationStrictWhiteSpaces}]+`, 'g') ;
export const FoundationLeftTrimRegex = new RegExp(`^[${FoundationWhiteSpaces}]+`) ;
export const FoundationRightTrimRegex = new RegExp(`[${FoundationWhiteSpaces}]+$`) ;

export const FoundationWhiteSpacesNumberCodeSet:Set<number> = _whiteSpacesAsNumberSet(FoundationWhiteSpaces) ;
export const FoundationWhiteSpacesStringCodeSet:Set<string> = _whiteSpaceAsStringSet(FoundationWhiteSpaces) ;
export const FoundationNewLineNumberCodeSet:Set<number> = _whiteSpacesAsNumberSet(FoundationNewLines) ;
export const FoundationNewLineStringCodeSet:Set<string> = _whiteSpaceAsStringSet(FoundationNewLines) ;
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

 