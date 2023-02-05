
import { $count, $encoding, $isproperty, $isstring, $length, $lse, $ok, $toint, $value } from './commons';
import { $arrayFromBytes, $bufferFromBytes, $bytesFromDataLike, $uint8ArrayFromBytes } from './data';
import { FoundationEncodingsAliases } from './string_tables';
import TSCharsetDefinitions from './tscharsets.json' ;
import { TSData } from './tsdata';
import { TSError } from './tserrors';
import { Bytes, Nullable, StringEncoding, TSDataLike, UINT16_MAX, uint8 } from './types';
import { $inbrowser } from './utils';

export function $charset(value:Nullable<StringEncoding|TSCharset>, defaultCharset:TSCharset=TSCharset.utf8Charset()):TSCharset
{ return $isstring(value) ? TSCharset.encoding(value as StringEncoding) : $value(value as Nullable<TSCharset>, defaultCharset) ; }

enum TSCachedCharset {
    ASCII = 0,
    Latin1,
    UTF8,
    UTF16,
    ANSI,
    MAC
} ;

export abstract class TSCharset {
    private static __charsetsMap:Map<string, TSCharset>| undefined = undefined ;
    private static __cachedCharsets:TSCharset[] = [] ;

    
    public static asciiCharset()      { return TSCharset._cachedCharset(TSCachedCharset.ASCII,  'ascii') }
    public static latin1Charset()     { return TSCharset._cachedCharset(TSCachedCharset.Latin1, 'latin1') ; }
    public static binaryCharset()     { return TSCharset.latin1Charset() ; }
    public static utf8Charset()       { return TSCharset._cachedCharset(TSCachedCharset.UTF8,   'utf8') ; }
    public static unicodeCharset()    { return TSCharset._cachedCharset(TSCachedCharset.UTF16,  'utf16le') ; }
    public static ansiCharset()       { return TSCharset._cachedCharset(TSCachedCharset.UTF16,  'ansi') ; }
    public static macCharset()        { return TSCharset._cachedCharset(TSCachedCharset.UTF16,  'mac') ; }

    public readonly name:string ;
    public readonly aliases:string[] ;

    protected constructor(name:string, aliases?:string[]) {
        if (!$length(name)) { throw new TSError('TSCharset.constructor(): trying to instanciate unamed RTF charset', { aliases:aliases }) ; }
        this.name = name ;
        this.aliases = $ok(aliases) ? [... aliases!] : [] ;
    }
    
    public static systemCharset():TSCharset {
        return $value(TSCharset.charset(_systemEncoding()), TSCharset.utf8Charset()) ;
    }

    public static encoding(enc:StringEncoding) { return this.charset($encoding(enc))! ; }

    public static charset(name:string):TSCharset|undefined {
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
                    throw new TSError(`TSCharset.charset() : system loaded charset '${c}' is missing.`, { name:name }) ;
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

        return TSCharset.__charsetsMap!.get(name.toLowerCase()) ;
    }
    
    private static _cachedCharset(code:TSCachedCharset, name:string):TSCharset {
        if (!$ok(TSCharset.__cachedCharsets[code])) { TSCharset.__cachedCharsets[code] = TSCharset.charset(name) ! }
        return TSCharset.__cachedCharsets[code] ;
    }

    // TODO: a static method to detect the charset from a raw buffer...
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
            throw new TSError (`TSLoadedCharset.constructor(): charset ${def.name} has an invalid charset count (must be 256)`, { definition:def }) ; 
        }

        this._toUnicodeTable = [] ;
        this._fromUnicodeTable = new Uint8Array(n) ; 
        this._fromUnicodeMap = new Map<number,uint8>() ;
        
        for (let i = 0 ; i < 256 ; i++) {
            const uc = $toint(def.charset[i]) ;
            if (uc < -1 || uc > UINT16_MAX) { 
                throw new TSError(`TSLoadedCharset.constructor(): charset '${def.name}': Bad unicode 16 character ar charset[${i}]`, { definition:def }) ; 
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
            if ($ok(c)) { ret.push(c!) ; }
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

    public stringFromData(src:TSDataLike, sourceStart?:Nullable<number>, sourceEnd?:Nullable<number>):string {
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
