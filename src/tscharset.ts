
import { $count, $encoding, $isproperty, $length, $lse, $ok, $toint, $value } from './commons';
import { $arrayFromBytes, $bufferFromBytes, $bytesFromDataLike, $uint8ArrayFromBytes } from './data';
import { FoundationEncodingsAliases } from './string_tables';
import TSCharsetDefinitions from './tscharsets.json' ;
import { TSData } from './tsdata';
import { TSError } from './tserrors';
import { Bytes, Nullable, StringEncoding, TSDataLike, UINT16_MAX, uint8 } from './types';
import { $inbrowser } from './utils';

export function $charset(value:Nullable<StringEncoding|TSCharset|TSDataLike>, defaultCharset:TSCharset=TSCharset.utf8Charset()):TSCharset
{
    if (value instanceof TSCharset) { return value ; }
    if (typeof value === 'string') { return TSCharset.encoding(value as StringEncoding) ; }
    if (!$ok(value)) { return defaultCharset ; }
    const found = TSCharset.charsetFromDataLike(value!) ;
    return $ok(found) ? found! : defaultCharset 
}

enum TSCachedCharset {
    ASCII = 0,
    Latin1,
    UTF8,
    UTF16,
    ANSI,
    MAC,
    UTF16BE
} ;

const customInspectSymbol = Symbol.for('nodejs.util.inspect.custom') ;

export abstract class TSCharset {
    private static __charsetsMap:Map<string, TSCharset>| undefined = undefined ;
    private static __cachedCharsets:TSCharset[] = [] ;

    
    public static asciiCharset()      { return TSCharset._cachedCharset(TSCachedCharset.ASCII,  'ascii') }
    public static latin1Charset()     { return TSCharset._cachedCharset(TSCachedCharset.Latin1, 'latin1') ; }
    public static binaryCharset()     { return TSCharset.latin1Charset() ; }
    public static utf8Charset()       { return TSCharset._cachedCharset(TSCachedCharset.UTF8,   'utf8') ; }
    // like in Node and in the WHATWG encoding standard, 'utf16', 'utf-16', 'unicode', 'ucs2'... are UTF-16 little endian
    public static unicodeCharset()    { return TSCharset._cachedCharset(TSCachedCharset.UTF16,  'utf16le') ; }
    public static utf16BECharset()    { return TSCharset._cachedCharset(TSCachedCharset.UTF16BE, 'utf16be') ; }
    public static ansiCharset()       { return TSCharset._cachedCharset(TSCachedCharset.ANSI,   'ansi') ; }
    public static macCharset()        { return TSCharset._cachedCharset(TSCachedCharset.MAC,    'mac') ; }

    public static charsetFromDataLike(rawData:TSDataLike):TSCharset|null {
        return $charsetFromBytes($bytesFromDataLike(rawData)) ;
    }

    // detects the charset of the data (defaultCharset if it cannot be detected) and decodes them.
    // Like TextDecoder or a .NET StreamReader, a byte order mark is removed when it gave the charset
    // (the stringFromData() methods keep it, like Buffer.toString(): '\uFEFF' in the returned string)
    public static stringFromDetectedData(rawData:TSDataLike, defaultCharset:TSCharset = TSCharset.utf8Charset()):[string, TSCharset] {
        const bytes = $bytesFromDataLike(rawData) ;
        const detected = $charsetFromBytes(bytes) ;
        if (!$ok(detected)) { return [defaultCharset.stringFromBytes(bytes), defaultCharset] ; }
        return [detected!.stringFromBytes(bytes, _bomLength(bytes, detected!)), detected!] ;
    }

    public static isUTF8Charset(rawData:TSDataLike):boolean {
        const bytes = $bytesFromDataLike(rawData) ;
        const len = $count(bytes) ;
        if (!len || (len > 2 && bytes[0] === 0xFF && bytes[1] === 0xFE)) { return false ; }
        return _isUTF8Charset(bytes, len) ; // ASCII is considered as a subset of UTF8
    }

    public readonly name:string ;
    public readonly aliases:string[] ;

    protected constructor(name:string, aliases?:string[]) {
        if (!$length(name)) { TSError.throw('TSCharset.constructor(): trying to instanciate unamed RTF charset', { aliases:aliases }) ; }
        this.name = name ;
        this.aliases = $ok(aliases) ? [... aliases!] : [] ;
    }
    
    public static systemCharset():TSCharset {
        return $value(TSCharset.charset(_systemEncoding()), TSCharset.utf8Charset()) ;
    }

    // the charsets which are not Buffer encodings (UTF-16 big endian) are found by their names
    public static encoding(enc:StringEncoding) { return $value(this.charset(enc), this.charset($encoding(enc))!) ; }

    public static charset(name:string):TSCharset|undefined {
        const map = TSCharset._charsetMap() ;
        return map.get(name.toLowerCase()) ;
    }
    
    private static _charsetMap():Map<string, TSCharset> {
        if (!$ok(TSCharset.__charsetsMap)) {
            TSCharset.__charsetsMap = new Map<string, TSCharset>() ;
            
            // ----------- charsets loaded from JSON -----------
            (TSCharsetDefinitions as CharsetDefinition[]).forEach(def => {
                let charset = new TSLoadedCharset(def) ;
                TSCharset.__charsetsMap!.set(def.name.toLowerCase(), charset) ;
                charset.aliases.forEach(a => { 
                    TSCharset.__charsetsMap!.set(a.toLowerCase(), charset)
                }) ;
            }) ;

            ['ANSI', 'MacRoman'].forEach(c => { 
                if (!$ok(TSCharset.__charsetsMap!.get(c.toLowerCase()))) {
                    TSError.throw(`TSCharset: charset '${c}' is missing from the loaded charset definitions.`, { name:c }) ;                }
            }) ;

            
            // ----------- system charsets -----------
            FoundationEncodingsAliases.forEach(def => {
                let set = new Set<string> ;
                const name = def.name.toLowerCase() ;
                set.add(name) ;
                def.aliases.forEach(a => set.add(a.toLowerCase())) ;
                set.delete(name) ;
                const aliases = Array.from(set) ;
                let charset = new TSSystemCharset(name, aliases) ;
                TSCharset.__charsetsMap!.set(name, charset) ;
                aliases.forEach(a => TSCharset.__charsetsMap!.set(a, charset))
            }) ;

            // ----------- UTF-16 big endian (not a Buffer encoding) -----------
            const be = new TSUTF16BECharset() ;
            [be.name, ...be.aliases].forEach(a => TSCharset.__charsetsMap!.set(a, be)) ;
        }
        return TSCharset.__charsetsMap! ;
    }

    public static allCharsetNames():string[] {
        const map = TSCharset._charsetMap() ;
        return map.keysArray() ;
    }

    private static _cachedCharset(code:TSCachedCharset, name:string):TSCharset {
        if (!$ok(TSCharset.__cachedCharsets[code])) { TSCharset.__cachedCharsets[code] = TSCharset.charset(name) ! }
        return TSCharset.__cachedCharsets[code] ;
    }


    public toString(): string     { return `[TSCharset: ${this.name}]` ; }
    public leafInspect(): string  { return this.toString() ; }

    // @ts-ignore
    [customInspectSymbol]() { return this.leafInspect() ; }
    
    public abstract stringFromBytes(source:Bytes, sourceStart?:Nullable<number>, sourceEnd?:Nullable<number>):string ;
    public abstract stringToBytes(source:string, sourceStart?:Nullable<number>, sourceEnd?:Nullable<number>):Bytes ;

    public stringFromData(source:TSDataLike, sourceStart?:Nullable<number>, sourceEnd?:Nullable<number>):string {
        return this.stringFromBytes($bytesFromDataLike(source), sourceStart, sourceEnd)
    }
    public bufferFromString(source:string, sourceStart?:Nullable<number>, sourceEnd?:Nullable<number>):Buffer {
        return $bufferFromBytes(this.stringToBytes(source, sourceStart, sourceEnd)) ;
    }

    public uint8ArrayFromString(source:string, sourceStart?:Nullable<number>, sourceEnd?:Nullable<number>):Uint8Array {
        return $uint8ArrayFromBytes(this.stringToBytes(source, sourceStart, sourceEnd)) ;
    }

    public bytesFromString(source:string, sourceStart?:Nullable<number>, sourceEnd?:Nullable<number>):uint8[] {
        return $arrayFromBytes(this.stringToBytes(source, sourceStart, sourceEnd)) ;
    }

    // @ts-ignore
    public dataFromString(source:string, sourceStart?:Nullable<number>, sourceEnd?:Nullable<number>):TSData {
        return new TSData(this.bufferFromString(source), { dontCopySourceBuffer:true }) ;
    }
}

class TSLoadedCharset extends TSCharset {
    private static readonly UnicodeBufferSize = 256 ;
    private readonly _toUnicodeTable:string[] ;
    private readonly _fromUnicodeTable:Uint8Array ;
    private readonly _fromUnicodeMap:Map<number,uint8> ;
    
    public constructor(def:CharsetDefinition) {
        const n = TSLoadedCharset.UnicodeBufferSize ;
        super(def.name, def.aliases) ;
        if ($count(def.charset) !== 256) { 
            TSError.throw(`TSLoadedCharset.constructor(): charset ${def.name} has an invalid charset count (must be 256)`, { definition:def }) ; 
        }

        this._toUnicodeTable = [] ;
        this._fromUnicodeTable = new Uint8Array(n) ; 
        this._fromUnicodeMap = new Map<number,uint8>() ;
        
        for (let i = 0 ; i < 256 ; i++) {
            const uc = $toint(def.charset[i]) ;
            if (uc < -1 || uc > UINT16_MAX) { 
                TSError.throw(`TSLoadedCharset.constructor(): charset '${def.name}': Bad unicode 16 character ar charset[${i}]`, { definition:def }) ; 
            }
            if (uc >= 0) {
                if (uc < n) { this._fromUnicodeTable[uc] = i ; } 
                else { this._fromUnicodeMap.set(uc, i as uint8) ;} 
                this._toUnicodeTable[i] = String.fromCodePoint(uc) ;
            }
        }
    }

    public stringToBytes(source:string, sourceStart?:Nullable<number>, sourceEnd?:Nullable<number>):Bytes
    {
        const [, start, end,] = $lse(source, sourceStart, sourceEnd) ;
        const n = TSLoadedCharset.UnicodeBufferSize ;
        const ret:uint8[] = [] ;
        for (let i = start ; i < end ; i++) {
            const uc = source.codePointAt(i)! ;
            const c = uc < n ? this._fromUnicodeTable[uc] as uint8 : this._fromUnicodeMap.get(uc) ;
            if ($ok(c)) { ret.push(c) ; }
        }
        return ret ;
    }

    public stringFromBytes(source:Bytes, sourceStart?:Nullable<number>, sourceEnd?:Nullable<number>):string
    {
        const [, start, end,] = $lse(source, sourceStart, sourceEnd) ;
        let target = ''

        if (start < end) {
            for (let i = start ; i < end ; i++) {
                const s = this._toUnicodeTable[source[i]] ;
                if (s) { target += s ; }
            }
        }

        return target ;
    }

}

// UTF-16 big endian: the bytes are swapped around the UTF-16 little endian Buffer encoding.
// A last odd byte is ignored, like Buffer.toString('utf16le') does
class TSUTF16BECharset extends TSCharset {
    public constructor() { super('utf16be', ['utf-16be', 'utf_16be']) ; }

    public stringToBytes(source:string, sourceStart?:Nullable<number>, sourceEnd?:Nullable<number>):Bytes {
        const [len, start, end,] = $lse(source, sourceStart, sourceEnd) ;
        if (start >= end) { return [] ; }
        return Buffer.from(start === 0 && end === len ? source : source.slice(start, end), 'utf16le').swap16() ;
    }

    public stringFromBytes(source:Bytes, sourceStart?:Nullable<number>, sourceEnd?:Nullable<number>):string {
        const [, start, end,] = $lse(source, sourceStart, sourceEnd) ;
        const n = (end - start) & ~1 ; // an even number of bytes
        if (n <= 0) { return '' ; }
        const swapped = Buffer.alloc(n) ;
        for (let i = 0 ; i < n ; i += 2) { swapped[i] = source[start + i + 1] ; swapped[i + 1] = source[start + i] ; }
        return swapped.toString('utf16le') ;
    }
}

export class TSSystemCharset extends TSCharset {
    public stringToBytes(source:string, sourceStart?:Nullable<number>, sourceEnd?:Nullable<number>):Bytes
    {
        const [len, start, end,] = $lse(source, sourceStart, sourceEnd) ;
        if (start < end) {
            const s = start === 0 && end === len ? source : source.slice(start, end) ;
            return Buffer.from(s, $encoding(this.name as StringEncoding)) ; 
        }
        return [] ;
    }

    private _stringFromBuffer(source:Buffer, sourceStart?:Nullable<number>, sourceEnd?:Nullable<number>):string {
        const [, start, end,] = $lse(source, sourceStart, sourceEnd) ;
        if (start < end) {
            return source.toString($encoding(this.name as StringEncoding), start, end) ;
        }
        return '' ;
    }
    
    public stringFromBytes(source:Bytes, sourceStart?:Nullable<number>, sourceEnd?:Nullable<number>):string {
        return this._stringFromBuffer($bufferFromBytes(source), sourceStart, sourceEnd) ;
    }

    public override stringFromData(src:TSDataLike, sourceStart?:Nullable<number>, sourceEnd?:Nullable<number>):string {
        if (src instanceof Buffer) { return this._stringFromBuffer(src, sourceStart, sourceEnd) ; }
        else if (src instanceof TSData) { return this._stringFromBuffer(src.mutableBuffer, sourceStart, sourceEnd) ; }
        else { return this._stringFromBuffer($bufferFromBytes(src as Bytes), sourceStart, sourceEnd) ; }
    }
}

interface CharsetDefinition  {
    name:string,
    aliases?:string[],
    charset:number[]
} ;

function _systemEncoding():string {
    if ($inbrowser()) { return document.characterSet ; }
    const p = $isproperty(process, 'platform') ? process?.platform : 'linux' ;
    switch (p) {
        case 'darwin': return 'MacRoman' ;
        case 'win32': case 'cygwin': return 'ANSI' ;
        default: return 'latin1'
    }
}

const __ANSIWeights = [
//         0  1  2  3  4  5  6  7  8  9  A  B  C  D  E  F
/* 0x80 */ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0,
/* 0x90 */ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0,
/* 0xA0 */ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
/* 0xB0 */ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
/* 0xC0 */ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
/* 0xD0 */ 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1,
/* 0xE0 */ 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 1, 1, 1, 1, 1, 1,
/* 0xF0 */ 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1
] ;
const __MacWeights = [
//         0  1  2  3  4  5  6  7  8  9  A  B  C  D  E  F
/* 0x80 */ 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 2, 2,
/* 0x90 */ 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1,
/* 0xA0 */ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1,
/* 0xB0 */ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1,
/* 0xC0 */ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1,
/* 0xD0 */ 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 1, 1,
/* 0xE0 */ 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
/* 0xF0 */ 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
] ;

export function $charsetFromBytes(bytes:Bytes):TSCharset|null {
    const len = $count(bytes) ;
    if (!len) { return null ; }

    // UTF-16 (little endian) BOM, even alone (2 bytes used to be ignored)
    if (len >= 2 && bytes[0] === 0xFF && bytes[1] === 0xFE) { return TSCharset.unicodeCharset() ; }
    // UTF-16 big endian BOM (it used to be detected as a single byte charset: 'þÿ...')
    if (len >= 2 && bytes[0] === 0xFE && bytes[1] === 0xFF) { return TSCharset.utf16BECharset() ; }
    if (_isASCII(bytes, len)) { return TSCharset.asciiCharset() ; }
    if (_isUTF8Charset(bytes, len)) { return TSCharset.utf8Charset() ; }
    return _singleByteCharset(bytes, len) ;
}

// the length of the byte order mark which gave the charset of the data, or 0
function _bomLength(bytes:Bytes, charset:TSCharset):number {
    const len = $count(bytes) ;
    if (charset === TSCharset.utf8Charset()) { return len >= 3 && bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF ? 3 : 0 ; }
    if (charset === TSCharset.unicodeCharset()) { return len >= 2 && bytes[0] === 0xFF && bytes[1] === 0xFE ? 2 : 0 ; }
    if (charset === TSCharset.utf16BECharset()) { return len >= 2 && bytes[0] === 0xFE && bytes[1] === 0xFF ? 2 : 0 ; }
    return 0 ;
}

function _isASCII(bytes:Bytes, len:number):boolean {
    for (let i = 0 ; i < len ; i++) {
        if (bytes[i] > 0x7f) { return false ; }
    }
    return true ;
}

interface SingleByteCharsets { latin1:TSCharset, mac:TSCharset, ansi:TSCharset } 
interface SingleByteWeights { mac:number, ansi:number }

// latin1, mac or ansi: the bytes eliminate some charsets, and the weights decide between mac and ansi
function _singleByteCharset(bytes:Bytes, len:number):TSCharset|null {
    const cs:SingleByteCharsets = { latin1:TSCharset.latin1Charset(), mac:TSCharset.macCharset(), ansi:TSCharset.ansiCharset() } ;
    const weights:SingleByteWeights = { mac:0, ansi:0 } ;
    const charsets = new Set<TSCharset>([cs.latin1, cs.mac, cs.ansi]) ;
    for (let i = 0 ; i < len && charsets.size > 0 ; i++) { _eliminateCharsets(bytes[i], charsets, cs, weights) ; }
    switch (charsets.size) {
        case 0: return null ;
        case 1: return charsets.values().next().value!
        default:
            // MacRoman needs more evidence than ANSI. Otherwise, latin1 (or ANSI if latin1 was eliminated) is
            // chosen, like when MacRoman was eliminated (equal weights used to give null, so that $charset()
            // decoded these non UTF-8 data as UTF-8)
            if (charsets.has(cs.mac) && weights.mac > weights.ansi) { return cs.mac ; }
            return charsets.has(cs.latin1) ? cs.latin1 : cs.ansi ;
    }
}

function _eliminateCharsets(c:number, charsets:Set<TSCharset>, cs:SingleByteCharsets, weights:SingleByteWeights) {
    if (c === 0) { return ; } // 0 always accepted as potential string terminator
    if (c === 0x7f) { charsets.delete(cs.mac) ; }
    else if (c >= 0x80) { 
        if (c <= 0x9f) {
            charsets.delete(cs.latin1) ; 
            if (c === 0x81 || c === 0x8d || c === 0x8f || c === 0x90 || c === 0x9d) { charsets.delete(cs.ansi) ; }
        }
        weights.ansi += __ANSIWeights[c - 0x80] ;
        weights.mac += __MacWeights[c - 0x80] ;
    }
    else if (c < 0x20 && c !== 0x09 && c !== 0x0a && c !== 0x0d) { charsets.delete(cs.mac) ; }
}

function _isUTF8Charset(bytes: Bytes, len: number): boolean {
    let i = 0;
    while (i < len) {
        // ASCII (should normally no longer occur here since we know the data is not 100% ASCII, 
        // but a single ASCII byte in the middle of a valid UTF-8 string remains... valid)
        const sequenceLength = bytes[i] <= 0x7F ? 1 : _utf8SequenceLength(bytes, i, len) ;
        if (!sequenceLength) { return false ; }
        i += sequenceLength ;
    }
    return true;
}

// [extra bytes, minimal code point (to detect "overlong" sequences), code point bits mask] of a leading byte
function _utf8Lead(b0:number):[number, number, number]|null {
    if ((b0 & 0xE0) === 0xC0) { return [1, 0x80, 0x1F] ; }     // 110xxxxx -> 2 bytes
    if ((b0 & 0xF0) === 0xE0) { return [2, 0x800, 0x0F] ; }    // 1110xxxx -> 3 bytes
    if ((b0 & 0xF8) === 0xF0) { return [3, 0x10000, 0x07] ; }  // 11110xxx -> 4 bytes
    return null ;                                               // 10xxxxxx alone or 11111xxx : invalid in UTF-8
}

// returns the length of the valid non-ASCII UTF-8 sequence at index i, or 0
function _utf8SequenceLength(bytes:Bytes, i:number, len:number):number {
    const lead = _utf8Lead(bytes[i]) ;
    if (!lead) { return 0 ; }
    const [extraBytes, minCodePoint, mask] = lead ;
    if (i + extraBytes >= len) { return 0 ; } // truncated sequence

    let codePoint = bytes[i] & mask ;
    for (let j = 1; j <= extraBytes; j++) {
        const b = bytes[i + j];
        if ((b & 0xC0) !== 0x80) { return 0 ; } // not a 10xxxxxx continuation byte 
        codePoint = (codePoint << 6) | (b & 0x3F);
    }
    if (codePoint < minCodePoint) { return 0 ; }                       // "overlong" sequence
    if (codePoint > 0x10FFFF) { return 0 ; }                           // out of Unicode range
    if (codePoint >= 0xD800 && codePoint <= 0xDFFF) { return 0 ; }    // invalid UTF-8 surrogate 
    return extraBytes + 1 ;
}
