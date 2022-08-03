import { $capacityForCount, $count, $isfunction, $isnumber, $isunsigned, $length, $ok, $unsigned } from "./commons";
import { $readBuffer, $writeBuffer } from "./fs";
import { TSClone, TSObject } from "./tsobject";
import { Comparison, Same, uint, uint8, UINT8_MAX } from "./types" ;
import { $inbrowser } from "./utils";

/**
 * TSData is a mutable buffer class.
 */

export interface TSDataOptions {
    dontCopySourceBuffer?:boolean;
    fillWithZeros?:boolean;
    allocMethod?:(n:number) => Buffer;
} ;

export class TSData implements Iterable<number>, TSObject, TSClone<TSData> {
    protected _len:number ;
    protected _buf:Buffer ;
    private _allocFn:(n:number) => Buffer ;

    constructor (source?:TSData|Buffer|ArrayBuffer|Uint8Array|number|null|undefined, opts:TSDataOptions={}) 
    {
        this._allocFn = $ok(opts.allocMethod) ? opts.allocMethod! : (opts.fillWithZeros ? Buffer.alloc : Buffer.allocUnsafe) ;

        if (!$ok(source)) { source = 0 ; }
        
        if (source instanceof TSData) {
            this._len = (source as TSData)._len ;
            this._buf = this._allocFn((source as TSData).capacity) ;
            if (this._len > 0)  { (source as TSData)._copyTo(this._buf) ; }
        }
        else if (source instanceof Buffer) {
            // no copy here
            this._len = source.length ;
            if (opts.dontCopySourceBuffer) { this._buf = source as Buffer ; }
            else {
                this._buf = this._allocFn($capacityForCount(this._len as uint)) ;
                (source as Buffer).copy(this._buf) ;
            }
        }
        else if (source instanceof ArrayBuffer || source instanceof Uint8Array) {
            this._buf = $bufferFromArrayBuffer(source) ;
            this._len = this._buf.length ;
        }
        else if ($isunsigned(source)) {
            const capacity = $capacityForCount(source as uint) 
            this._len = 0 ;
            this._buf = this._allocFn(capacity) ;
        }
        else {
            throw 'Bad TSData constructor() number parameter' ;
        }
    }

    public static fromFile(src:string|undefined|null):TSData|null {
        if ($inbrowser()) { throw 'TSData.fromFile(): unavailable static method in browser' ; }
        const b = $readBuffer(src) ;
        return $ok(b) ? new TSData(b, { dontCopySourceBuffer:true }) : null ;
    }

    public [Symbol.iterator]() {
        let pos = 0 ;
        return { next: () => { 
            return pos < this._len ? { done:false, value:this._buf[pos++] } : { done:true, value:NaN}; 
        }} ;
    }

    public clone():TSData { return new TSData(this, { allocMethod:this._allocFn }) ; }

    public appendData(source:TSData|Buffer|null|undefined, start:number=0, end?:number) {
        let len = $length(source)! ;
        if (start < 0) { start = 0 ; }
        end = $ok(end) && end! < len ? end! : len ;

        if (start < end) {
            this._willGrow(end - start) ;
            const b = source instanceof TSData ? (source as TSData)._buf : source as Buffer ;
            b.copy(this._buf, this._len, start, end) ;
            this._len += end - start ;
        }
    }

    public setData(source:TSData|Buffer|null|undefined, targetStart:number = 0, sourceStart:number=0, sourceEnd?:number) {
        let len = $length(source) ;
        sourceEnd = $ok(sourceEnd) ? Math.min(sourceEnd!, len) : len ;
        len = sourceEnd - sourceStart ;
        if (len > 0) {
            if (targetStart + len > this._len) { this._willGrow(targetStart + len - this._len) ; }
            for (let i = this._len ; i < targetStart ; i++) { this._buf[i] = 0 ; } // fill intermediate part with zeros
            source!.copy(this._buf, targetStart, sourceStart, sourceEnd) ; 
            this._len = targetStart+len ;
        }
        else { this._len = 0 ; }
    }

    public appendByte(source:uint8) {
        this._willGrow(1) ;
        this._buf[this._len++] = source ;
    }

    public appendBytes(source:uint8[]|Uint8Array|null|undefined, start:number=0, end?:number) {
        let len = $count(source)! ;
        if (start < 0) { start = 0 ; }
        end = $ok(end) && end! < len ? end! : len ;

        if (start < end) {
            this._willGrow(end - start) ;
            for (let i = start ; i < end ; i++) {
                this._buf[this._len++] = source![i] ;
            }
        }
    }

    public appendAsciiString(source:string|null|undefined) {
        this.appendBytes($bytesFromAsciiString(source)) ;
    }

    public replaceBytes(source:uint8[]|Uint8Array|null|undefined, targetStart:number=0, sourceStart:number=0, sourceEnd?:number) {
        let len = $count(source)! ;
        sourceEnd = $ok(sourceEnd) ? Math.min(sourceEnd!, len) : len ;
        len = sourceEnd - sourceStart ;
        if (len > 0) {
            if (targetStart + len > this._len) { this._willGrow(targetStart + len - this._len) ; }
            for (let i = this._len ; i < targetStart ; i++) { this._buf[i] = 0 ; }  // fill intermediate part with zeros
            for (let i = 0 ; i < len ; i++) { this._buf[targetStart+i] = source![sourceStart+i] ; }
            if (targetStart + len > this._len) { this._len = targetStart + len ; }
        }
    }
    public replaceAsciiString(source:string|null|undefined, targetStart?:number) {
        this.replaceBytes($bytesFromAsciiString(source), targetStart) ;
    }

    public get capacity():number { return this._buf.length ; }
    
    public get length():number   { return this._len ; }
    public set length(n:number) {
        if (!$isunsigned(n)) { throw `TSDate.length = ${n} is not valid.` ; }
        if (n > this._len) { 
            this._willGrow(this._len - n) ; 
            if (this._allocFn !== Buffer.alloc) { while (this._len < n) { this._buf[this._len++] = 0 ; }}
        }
        else { this._len = n ; }
    }

    public get byteLength():number { return this._len ; }

    public get mutableBuffer():Buffer { return this._len === this.capacity ? this._buf : this._buf.slice(0, this._len) ; }
    public get buffer():Buffer {
        const ret = Buffer.allocUnsafe(this._len) ;
        this._copyTo(ret) ;
        return ret ;
    }
    public get internalStorage():[Buffer, number] { return [this._buf, this._len] ; } // use that to your own risk

    public entries(): IterableIterator<[number, number]> { return this.mutableBuffer.entries() ; }
    public keys():    IterableIterator<number>           { return this.mutableBuffer.keys() ; }
    public values():  IterableIterator<number>           { return this.mutableBuffer.values() ; }

    public includes(value:Buffer|TSData|number|null|undefined, byteOffset:number = 0) {
        const slen = _searchedLength(value) ; 
        if (slen <= 0 || !$isunsigned(byteOffset) || byteOffset + slen > this._len) { return false ; }
        if (value instanceof TSData) { value = value.mutableBuffer ; }
        return this._buf.includes(value!, byteOffset) ;
    }

    // warning : byteOffset should be >= 0
    public indexOf(value: TSData | number | Uint8Array | null | undefined, byteOffset: number = 0): number {
        const slen = _searchedLength(value) ; 
        if (slen <= 0 || !$isunsigned(byteOffset) || byteOffset + slen > this._len) { return -1 ; }
        if (value instanceof TSData) { value = value.mutableBuffer ; }
        return this._buf.indexOf(value!, byteOffset) ;
    }

    // warning : byteOffset should be >= 0
    public lastIndexOf(value: TSData | number | Uint8Array | null | undefined, byteOffset: number = 0): number {
        const slen = _searchedLength(value) ; 
        if (slen <= 0 || !$isunsigned(byteOffset) || byteOffset + slen > this._len) { return -1 ; }
        if (value instanceof TSData) { value = value.mutableBuffer ; }
        return this._buf.lastIndexOf(value!, byteOffset) ;
    }

    // with slice, you get a new TSData which holds a copy of the sliced data
    public slice(begin: number = 0, end: number = this._len): TSData {
        if (begin < 0) { begin = 0 ; }
        if (end > this._len) { end = this._len ; }
        if (begin >= end) { return new TSData(0) ; }

        const finalLen = end - begin ;
        const ret = new TSData(finalLen, {allocMethod:this._allocFn}) ;
        
        this._buf.copy(ret._buf, 0, begin, end) ;
        ret._len = finalLen ;

        return ret ;
    }
    
    public copy(targetBuffer: Uint8Array|TSData, targetStart: number = 0, sourceStart: number = 0, sourceEnd: number = this._len): number {
        if (sourceEnd > this._len) { sourceEnd = this._len ; }
        if (sourceStart < sourceEnd) {
            if (targetBuffer instanceof Uint8Array) {
                return this._buf.copy(targetBuffer, targetStart, sourceStart, sourceEnd) ;
            }
            targetBuffer.replaceBytes(this._buf, targetStart, sourceStart, sourceEnd) ;
            return sourceEnd - sourceStart ;
        }
        return 0 ;
    } 
    
    public writeToFile(path:string) { 
        if ($inbrowser()) { throw 'TSData.writeToFile(): unavailable method in browser' ; }
        return $writeBuffer(path, this) ; 
    }

    public equals(otherBuffer: Uint8Array): boolean { return this.isEqual(otherBuffer) ; }

    public toArrayBuffer():ArrayBuffer { return $arrayBufferFromBuffer(this._buf, 0, this._len) ; }

    // ============ TSObject conformance =============== 

    public toString(encoding:((b:Buffer, start:number, end:number) => string)|BufferEncoding = 'binary', start:number = 0, end:number = this._len): string {
        start = Math.max(0, start) ;
        end   = Math.min(end, this._len) ;
        
        if (start >= end) { return '' ; }
        return $isfunction(encoding) ? 
            (encoding as ((b:Buffer, start:number, end:number) => string))(this._buf, start, end) : 
            this._buf.toString(encoding as BufferEncoding, start, end) ;
    }

	public toJSON(): any { return this.mutableBuffer.toJSON() ; }
	public toArray(): number[] {
        let ret = [] ;
        for (let i = 0 ; i < this._len ; i++) { ret[i] = this._buf[i] ; }
        return ret ;
    }

    public compare(other:any) : Comparison {
        if (this === other) { return Same ; }
        if (other instanceof TSData) { return Buffer.compare(this.mutableBuffer, other.mutableBuffer) as Comparison ; }
        if (other instanceof Uint8Array) { return Buffer.compare(this.mutableBuffer, other) as Comparison ; }
        return undefined ;
    }

    public isEqual(other:any) : boolean {
        if (this === other) { return true ; }
        if (other instanceof TSData) { 
            if (other._len !== this._len) { return false ; } 
            return Buffer.compare(this.mutableBuffer, other.mutableBuffer) === 0 ;
        }
        else if (other instanceof Uint8Array || other instanceof Buffer) {
            if (other.length !== this._len) { return false ; } 
            return Buffer.compare(this.mutableBuffer, other) === 0 ;
        }
        return false ;
    }

    public readBigUInt64BE(offset?:number): bigint  { return this._read(offset, 8, Buffer.prototype.readBigUInt64BE) ; }
    public readBigUInt64LE(offset?:number): bigint  { return this._read(offset, 8, Buffer.prototype.readBigUInt64LE) ; }
    public readBigInt64BE(offset?:number): bigint   { return this._read(offset, 8, Buffer.prototype.readBigInt64BE) ; }
    public readBigInt64LE(offset?:number): bigint   { return this._read(offset, 8, Buffer.prototype.readBigInt64LE) ; }
    public readUInt8(offset?:number): number        { return this._read(offset, 1, Buffer.prototype.readUInt8) ; }
    public readUInt16LE(offset?:number): number     { return this._read(offset, 2, Buffer.prototype.readUInt16LE) ; }
    public readUInt16BE(offset?:number): number     { return this._read(offset, 2, Buffer.prototype.readUInt16BE) ; }
    public readUInt32LE(offset?:number): number     { return this._read(offset, 4, Buffer.prototype.readUInt32LE) ; }
    public readUInt32BE(offset?:number): number     { return this._read(offset, 4, Buffer.prototype.readUInt32BE) ; }
    public readInt8(offset?:number): number         { return this._read(offset, 1, Buffer.prototype.readInt8) ; }
    public readInt16LE(offset?:number): number      { return this._read(offset, 2, Buffer.prototype.readInt16LE) ; }
    public readInt16BE(offset?:number): number      { return this._read(offset, 2, Buffer.prototype.readInt16BE) ; }
    public readInt32LE(offset?:number): number      { return this._read(offset, 4, Buffer.prototype.readInt32LE) ; }
    public readInt32BE(offset?:number): number      { return this._read(offset, 4, Buffer.prototype.readInt32BE) ; }
    public readFloatLE(offset?:number): number      { return this._read(offset, 4, Buffer.prototype.readFloatLE) ; }
    public readFloatBE(offset?:number): number      { return this._read(offset, 4, Buffer.prototype.readFloatBE) ; }
    public readDoubleLE(offset?:number): number     { return this._read(offset, 8, Buffer.prototype.readDoubleLE) ; }
    public readDoubleBE(offset?:number): number     { return this._read(offset, 8, Buffer.prototype.readDoubleBE) ; }

    public writeBigInt64BE(value:bigint, offset?:number)    { this._write(value, offset, 8, Buffer.prototype.writeBigInt64BE) ; }
    public writeBigInt64LE(value:bigint, offset?:number)    { this._write(value, offset, 8, Buffer.prototype.writeBigInt64LE) ; }
    public writeBigUInt64BE(value:bigint, offset?:number)   { this._write(value, offset, 8, Buffer.prototype.writeBigUInt64BE) ; }
    public writeBigUInt64LE(value:bigint, offset?:number)   { this._write(value, offset, 8, Buffer.prototype.writeBigUInt64LE) ; }
    public writeUInt8(value: number, offset?: number)       { this._write(value, offset, 1, Buffer.prototype.writeUInt8) ; }
    public writeUInt16LE(value: number, offset?: number)    { this._write(value, offset, 2, Buffer.prototype.writeUInt16LE) ; } 
    public writeUInt16BE(value: number, offset?: number)    { this._write(value, offset, 2, Buffer.prototype.writeUInt16BE) ; }   
    public writeUInt32LE(value: number, offset?: number)    { this._write(value, offset, 4, Buffer.prototype.writeUInt32LE) ; }   
    public writeUInt32BE(value: number, offset?: number)    { this._write(value, offset, 4, Buffer.prototype.writeUInt32BE) ; }   
    public writeInt8(value: number, offset?: number)        { this._write(value, offset, 1, Buffer.prototype.writeInt8) ; }
    public writeInt16LE(value: number, offset?: number)     { this._write(value, offset, 2, Buffer.prototype.writeInt16LE) ; }
    public writeInt16BE(value: number, offset?: number)     { this._write(value, offset, 2, Buffer.prototype.writeInt16BE) ; }
    public writeInt32LE(value: number, offset?: number)     { this._write(value, offset, 4, Buffer.prototype.writeInt32LE) ; }
    public writeInt32BE(value: number, offset?: number)     { this._write(value, offset, 4, Buffer.prototype.writeInt32BE) ; }
    public writeFloatLE(value: number, offset?: number)     { this._write(value, offset, 4, Buffer.prototype.writeFloatLE) ; }
    public writeFloatBE(value: number, offset?: number)     { this._write(value, offset, 4, Buffer.prototype.writeFloatBE) ; }
    public writeDoubleLE(value: number, offset?: number)    { this._write(value, offset, 8, Buffer.prototype.writeDoubleLE) ; }
    public writeDoubleBE(value: number, offset?: number)    { this._write(value, offset, 8, Buffer.prototype.writeDoubleBE) ; }


    // ============ private methods =============== 
    protected _willGrow(n:number) {
        if (n && this._len + n > this.capacity) {
            const newCapacity = $capacityForCount((this._len + n) as uint) ;
            let newBuffer = this._allocFn(newCapacity) ;
            this._copyTo(newBuffer) ;
            this._buf = newBuffer ;
        }
    }

    protected _copyTo(target:Buffer) {
        if (this._len > 0) { this._buf.copy(target, 0, 0, this._len) ; }
    }

    protected _read<T>(offset:number = 0, size:number, bufferReadFn:(offset?:number)=>T):T {
        if (!$isunsigned(offset) || offset+size > this._len) { throw `TSData._read(${offset}) out of bound [0,${this._len}]` ; }
        return bufferReadFn.call(this._buf, offset) ;        
    }

    protected _write<T>(value:T, offset:number = 0, size:number, bufferWriteFn:(value:T, offset?:number)=>void) {
        if (!$isunsigned(offset)) { throw `TSData._write(${value}, ${offset}) out of bound [0,${this._len}]` ; }
        if (offset + size > this._len) { this._willGrow(offset + size - this._len) ; }
        for (let i = this._len ; i < offset ; i++) { this._buf[i] = 0 ; }  // fill intermediate part with zeros
        bufferWriteFn.call(this._buf, value, offset) ;
    }

}
export interface TSDataConstructor {
    new (source?:TSData|Buffer|number|null|undefined, opts?:TSDataOptions): TSData;
}

function _searchedLength(value: TSData | number | Uint8Array | null | undefined):number {
    if ($isnumber(value)) {
        return $isunsigned(value, UINT8_MAX) ? 1 : -1 ; 
    }
    return $ok(value) ? (<TSData|Uint8Array>value).length : -1 ; 
}

const _blobToBase64 = (blob:Blob) => new Promise<string|null>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onload = () => resolve(reader.result as (string|null));
    reader.onerror = error => reject(error);
});

export async function $blobToUrlData(source:Blob):Promise<string|null>
{ return await _blobToBase64(source) }

export function $bytesFromAsciiString(source:string|null|undefined, start:number = 0, end:number = $length(source)):uint8[] {
    let bytes:uint8[] = [] ;        
    end = Math.min($length(source), $unsigned(end)) ;
    start = Math.min(end, $unsigned(start)) ;

    for (let i = start, j = 0 ; i < end ; i++, j++ ) {
        const c = source!.charCodeAt(i) ;
        if (c < 128) { bytes[j] = c as uint8 ; }
    }
    return bytes ;
}

export function $bufferFromArrayBuffer(a:ArrayBuffer) : Buffer {
    return ArrayBuffer.isView(a) ? Buffer.from(a!.buffer, a!.byteOffset, a!.byteLength) : Buffer.from(a) ;
}

export function $arrayBufferFromBuffer(source:Buffer, start:number = 0, end:number = source.length) : ArrayBuffer {
    end = Math.min(source.length, $unsigned(end)) ;
    start = Math.min(end, $unsigned(start)) ;

    const ret = new ArrayBuffer(end - start) ;
    const view = new Uint8Array(ret) ;
    for (let i = start, j = 0 ; i < end; i++, j++) { view[j] = source[i]; }

    return ret ;
}
