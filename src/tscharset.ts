
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
    MAC
} ;

const customInspectSymbol = Symbol.for('nodejs.util.inspect.custom') ;

export abstract class TSCharset {
    private static __charsetsMap:Map<string, TSCharset>| undefined = undefined ;
    private static __cachedCharsets:TSCharset[] = [] ;

    
    public static asciiCharset()      { return TSCharset._cachedCharset(TSCachedCharset.ASCII,  'ascii') }
    public static latin1Charset()     { return TSCharset._cachedCharset(TSCachedCharset.Latin1, 'latin1') ; }
    public static binaryCharset()     { return TSCharset.latin1Charset() ; }
    public static utf8Charset()       { return TSCharset._cachedCharset(TSCachedCharset.UTF8,   'utf8') ; }
    public static unicodeCharset()    { return TSCharset._cachedCharset(TSCachedCharset.UTF16,  'utf16le') ; }
    public static ansiCharset()       { return TSCharset._cachedCharset(TSCachedCharset.ANSI,   'ansi') ; }
    public static macCharset()        { return TSCharset._cachedCharset(TSCachedCharset.MAC,    'mac') ; }

    public static charsetFromDataLike(rawData:TSDataLike):TSCharset|null {
        return $charsetFromBytes($bytesFromDataLike(rawData)) ;
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

    public static encoding(enc:StringEncoding) { return this.charset($encoding(enc))! ; }

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
                    TSError.throw(`TSCharset.charset() : system loaded charset '${c}' is missing.`, { name:name }) ;
                }
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
    private static UnicodeBufferSize = 256 ;
    private _toUnicodeTable:string[] ;
    private _fromUnicodeTable:Uint8Array ;
    private _fromUnicodeMap:Map<number,uint8> ;
    
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
                this._toUnicodeTable[i] = String.fromCharCode(uc) ;
            }
        }
    }

    public stringToBytes(source:string, sourceStart?:Nullable<number>, sourceEnd?:Nullable<number>):Bytes
    {
        const [, start, end,] = $lse(source, sourceStart, sourceEnd) ;
        const n = TSLoadedCharset.UnicodeBufferSize ;
        const ret:uint8[] = [] ;
        for (let i = start ; i < end ; i++) {
            const uc = source.charCodeAt(i) ;
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

    // UTF-16 (little endian) BOM
    if (len > 2 && bytes[0] === 0xFF && bytes[1] === 0xFE) { return TSCharset.unicodeCharset() ; }
    let i = 0 ;
    for ( ; i < len ; i++) {
        if (bytes[i] > 0x7f) { break }
    }
    if (i === len) { return TSCharset.asciiCharset() ; }
    if (_isUTF8Charset(bytes, len)) { return TSCharset.utf8Charset() ; }
    const latin1 = TSCharset.latin1Charset() ;
    const mac    = TSCharset.macCharset() ;
    const ansi   = TSCharset.ansiCharset() ;
    let macWeight = 0 ;
    let ansiiWeight = 0 ;

    const charsets = new Set<TSCharset>([latin1, mac, ansi]) ;
    for (i = 0 ; i < len && charsets.size > 0 ; i++) {
        const c = bytes[i] ;
        if (c === 0) { continue ; } // 0 always accepted as potential string terminator
        if (c === 0x7f) { charsets.delete(mac) ; }
        else if (c >= 0x80) { 
            if (c <= 0x9f) {
                charsets.delete(latin1) ; 
                if (c === 0x81 || c === 0x8d || c === 0x8f || c === 0x90 || c === 0x9d) { charsets.delete(ansi) ; }
            }
            ansiiWeight += __ANSIWeights[c - 0x80] ;
            macWeight += __MacWeights[c - 0x80] ;

        }
        else if (c < 0x20 && c !== 0x09 && c !== 0x0a && c !== 0x0d) { charsets.delete(mac) ; }
    }
    switch (charsets.size) {
        case 0: return null ;
        case 1: return charsets.values().next().value!
        default:
            if (charsets.has(mac)) {
                if (macWeight > ansiiWeight) { return mac ; }
                if (macWeight === ansiiWeight) { return null ; }
            }
            return charsets.has(latin1) ? latin1 : ansi ;
    }
}

function _isUTF8Charset(bytes: Bytes, len: number): boolean {
    let i = 0;

    while (i < len) {
        const b0 = bytes[i];

        // ASCII (should normally no longer occur here since we know the data is not 100% ASCII, 
        // but a single ASCII byte in the middle of a valid UTF-8 string remains... valid)

        if (b0 <= 0x7F) { i += 1; continue; }

        let extraBytes: number;
        let minCodePoint: number;           // detect "overlong" sequences
        let codePoint: number;

        if ((b0 & 0xE0) === 0xC0) {        // 110xxxxx -> 2 bytes
            extraBytes = 1;
            minCodePoint = 0x80;
            codePoint = b0 & 0x1F;
        }
        else if ((b0 & 0xF0) === 0xE0) {   // 1110xxxx -> 3 bytes
            extraBytes = 2;
            minCodePoint = 0x800;
            codePoint = b0 & 0x0F;
        }
        else if ((b0 & 0xF8) === 0xF0) {   // 11110xxx -> 4 bytes
            extraBytes = 3;
            minCodePoint = 0x10000;
            codePoint = b0 & 0x07;
        }
        else {
            return false; // 10xxxxxx alone or 11111xxx : invalid in UTF-8
        }

        if (i + extraBytes >= len) { return false; } // truncated sequence

        for (let j = 1; j <= extraBytes; j++) {
            const b = bytes[i + j];
            if ((b & 0xC0) !== 0x80) { return false; } // not a 10xxxxxx continuation byte 
            codePoint = (codePoint << 6) | (b & 0x3F);
        }

        if (codePoint < minCodePoint) { return false; }         // "overlong" sequence
        if (codePoint > 0x10FFFF) { return false; }             // out of Unicode range
        if (codePoint >= 0xD800 && codePoint <= 0xDFFF) { return false; } // invalid UTF-8 surrogate 

        i += extraBytes + 1;
    }

    return true;
}
