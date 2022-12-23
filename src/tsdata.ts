import { $capacityForCount, $isarray, $isnumber, $isstring, $isunsigned, $lse, $ok, $tounsigned } from "./commons";
import { $crc32 } from "./crypto";
import { $arrayBufferFromBytes, $dataAspect, $bufferFromArrayBuffer, $uint8ArrayFromBytes, $encodeBase64, $bytesFromBytes } from "./data";
import { $fullWriteBuffer, $readBuffer, $writeBuffer, $writeBufferOptions } from "./fs";
import { $charset, TSCharset } from "./tscharset";
import { TSError } from "./tserrors";
import { TSClone, TSLeafInspect, TSObject } from "./tsobject";
import { Bytes, Comparison, Nullable, Same, StringEncoding, TSDataLike, uint, uint32, uint8, UINT8_MAX } from "./types" ;

/**
 * TSData is a mutable buffer-like class. You cannot directly access the contained bytes in a TSData.
 * If you need to have a direct access to the binary content of a TSData you can do it by using 
 * the internalStorage or mutableBuffer instance vars
 */

 const customInspectSymbol = Symbol.for('nodejs.util.inspect.custom') ;

export interface TSDataOptions {
    dontCopySourceBuffer?:boolean;
    fillWithZeros?:boolean;
    allocMethod?:(n:number) => Buffer;
} ;

export class TSData implements Iterable<number>, TSObject, TSLeafInspect, TSClone<TSData> {
    protected _len:number ;
    protected _buf:Buffer ;
    private _allocFn:(n:number) => Buffer ;

    // ============================ TSDATA creation =============================================
    constructor (source?:Nullable<number|TSDataLike>, opts:TSDataOptions={}) 
    {
        this._allocFn = $ok(opts.allocMethod) ? opts.allocMethod! : (opts.fillWithZeros ? Buffer.alloc : Buffer.allocUnsafe) ;

        if (!$ok(source)) { source = 0 ; }
        
        if (source instanceof TSData) {
            this._len = (source as TSData)._len ;
            this._buf = this._allocFn((source as TSData).capacity) ;
            if (this._len > 0)  { (source as TSData)._buf.copy(this._buf, 0, 0, this._len) ; }
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
        else if (source instanceof ArrayBuffer) {
            this._buf = $bufferFromArrayBuffer(source) ;
            this._len = this._buf.length ;
        }
        else if ($isarray(source) || source instanceof Uint8Array) {
            const slen = (source as Bytes).length ;
            this._len = 0 ;
            this._buf = this._allocFn($capacityForCount(slen)) ;
            this.appendBytes(source as Bytes, 0, slen)
        }
        else if ($isnumber(source)) {
            const capacity = $capacityForCount(source as number) 
            this._len = 0 ;
            this._buf = this._allocFn(capacity) ;
        }
        else {
            throw new TSError('TSData.constructor() : Bad parameters', { arguments:Array.from(arguments)}) ;
        }
    }

    public static fromFile(src:Nullable<string>):TSData|null {
        TSError.assertNotInBrowser('TSData.fromFile') ;
        const b = $readBuffer(src) ;
        return $ok(b) ? new TSData(b, { dontCopySourceBuffer:true }) : null ;
    }

    public static fromString(source:Nullable<string>, encoding?:Nullable<StringEncoding|TSCharset>, sourceStart?:Nullable<number>, sourceEnd?:Nullable<number>):TSData|null {
        const [, start, end,] = $lse(source, sourceStart, sourceEnd) ;
        return start < end ? $charset(encoding, TSCharset.binaryCharset()).dataFromString(source!, start, end) : new TSData() ;
    }

    // ============ TSLeafInspect conformance =============== 
    public leafInspect(): string { return '<'+$dataAspect(this.mutableBuffer, { name:this.constructor.name, prefix: '', suffix:'', separator:'', showLength:false, transformFn: (n) => n.toHex2() })+'>' }
    
    // @ts-ignore
    [customInspectSymbol](depth:number, inspectOptions:any, inspect:any) {
        return this.leafInspect()
    }

    // ============================ STANDARD JS ENUMERATION =============================================
    public [Symbol.iterator]() {
        let pos = 0 ;
        return { next: () => { 
            return pos < this._len ? { done:false, value:this._buf[pos++] } : { done:true, value:NaN}; 
        }} ;
    }

    // ============================ POTENTIALLY MUTABLE OPERATIONS =============================================

    public splice(targetStart:number, deleteCount:number, source?:Nullable<TSDataLike>, sourceStart?:Nullable<number>, sourceEnd?:Nullable<number>, paddingByte?:Nullable<number>):TSData {
        const datasource = source instanceof ArrayBuffer ? $bufferFromArrayBuffer(source as ArrayBuffer) : source ;
        return this._splice(targetStart, deleteCount, datasource, sourceStart, sourceEnd, paddingByte) ;    
    }
    
    public appendByte(source:uint8):TSData {
        this._willGrow(1) ;
        this._buf[this._len++] = source & 0xff ;
        return this ;
    }

    public appendBytes(source:Nullable<Bytes>, sourceStart?:Nullable<number>, sourceEnd?:Nullable<number>):TSData
    { return $ok(source) ? this._splice(this._len, 0, source, sourceStart, sourceEnd) : this ; }

    public appendData(source:Nullable<TSDataLike>, sourceStart?:Nullable<number>, sourceEnd?:Nullable<number>):TSData
    { 
        if ($ok(source)) {
            const datasource = source instanceof ArrayBuffer ? $bufferFromArrayBuffer(source as ArrayBuffer) : source ;
            return this._splice(this._len, 0, datasource, sourceStart, sourceEnd) ; 
        }
        return this ;
    }

    public appendString(source:Nullable<string>, encoding?:Nullable<StringEncoding|TSCharset>, sourceStart?:Nullable<number>, sourceEnd?:Nullable<number>):TSData {
        const [,start,end,] = $lse(source, sourceStart, sourceEnd) ;
        if (start < end) {
            const b = $charset(encoding, TSCharset.binaryCharset()).stringToBytes(source!, start, end) ;
            this.appendBytes(b) ;
        }
        return this ;
    }

    public replaceBytes(source:Nullable<Bytes>, targetStart?:Nullable<number>, sourceStart?:Nullable<number>, sourceEnd?:Nullable<number>):TSData {
        const [, start, end, len] = $lse(source, sourceStart, sourceEnd) ;
        return this._splice($tounsigned(targetStart), len, source, start, end) ;
    }

    public replaceData(source:Nullable<TSDataLike>, targetStart?:Nullable<number>, sourceStart?:Nullable<number>, sourceEnd?:Nullable<number>):TSData {
        const datasource = source instanceof ArrayBuffer ? $bufferFromArrayBuffer(source as ArrayBuffer) : source ;
        const [, start, end, len] = $lse(datasource, sourceStart, sourceEnd) ;
        return this._splice($tounsigned(targetStart), len, datasource, start, end) ; // we remove 
    }

    public replaceString(source:Nullable<string>, targetStart?:Nullable<number>, encoding?:Nullable<StringEncoding|TSCharset>, sourceStart?:Nullable<number>, sourceEnd?:Nullable<number>):TSData {
        const datasource = $ok(source) ? $charset(encoding, TSCharset.binaryCharset()).bufferFromString(source!, sourceStart, sourceEnd) : null ;
        const [, start, end, len] = $lse(datasource) ;
        return this._splice($tounsigned(targetStart), len, datasource, start, end) ; 
    }

    public writeBigInt64BE(value:bigint, offset?:number):TSData    { return this._write(value, offset, 8, Buffer.prototype.writeBigInt64BE) ; }
    public writeBigInt64LE(value:bigint, offset?:number):TSData    { return this._write(value, offset, 8, Buffer.prototype.writeBigInt64LE) ; }
    public writeBigUInt64BE(value:bigint, offset?:number):TSData   { return this._write(value, offset, 8, Buffer.prototype.writeBigUInt64BE) ; }
    public writeBigUInt64LE(value:bigint, offset?:number):TSData   { return this._write(value, offset, 8, Buffer.prototype.writeBigUInt64LE) ; }
    public writeUInt8(value: number, offset?: number):TSData       { return this._write(value, offset, 1, Buffer.prototype.writeUInt8) ; }
    public writeUInt16LE(value: number, offset?: number):TSData    { return this._write(value, offset, 2, Buffer.prototype.writeUInt16LE) ; } 
    public writeUInt16BE(value: number, offset?: number):TSData    { return this._write(value, offset, 2, Buffer.prototype.writeUInt16BE) ; }   
    public writeUInt32LE(value: number, offset?: number):TSData    { return this._write(value, offset, 4, Buffer.prototype.writeUInt32LE) ; }   
    public writeUInt32BE(value: number, offset?: number):TSData    { return this._write(value, offset, 4, Buffer.prototype.writeUInt32BE) ; }   
    public writeInt8(value: number, offset?: number):TSData        { return this._write(value, offset, 1, Buffer.prototype.writeInt8) ; }
    public writeInt16LE(value: number, offset?: number):TSData     { return this._write(value, offset, 2, Buffer.prototype.writeInt16LE) ; }
    public writeInt16BE(value: number, offset?: number):TSData     { return this._write(value, offset, 2, Buffer.prototype.writeInt16BE) ; }
    public writeInt32LE(value: number, offset?: number):TSData     { return this._write(value, offset, 4, Buffer.prototype.writeInt32LE) ; }
    public writeInt32BE(value: number, offset?: number):TSData     { return this._write(value, offset, 4, Buffer.prototype.writeInt32BE) ; }
    public writeFloatLE(value: number, offset?: number):TSData     { return this._write(value, offset, 4, Buffer.prototype.writeFloatLE) ; }
    public writeFloatBE(value: number, offset?: number):TSData     { return this._write(value, offset, 4, Buffer.prototype.writeFloatBE) ; }
    public writeDoubleLE(value: number, offset?: number):TSData    { return this._write(value, offset, 8, Buffer.prototype.writeDoubleLE) ; }
    public writeDoubleBE(value: number, offset?: number):TSData    { return this._write(value, offset, 8, Buffer.prototype.writeDoubleBE) ; }

    public removeTraillingNewLines():TSData
    { while (this._len > 0 && this._buf[this._len-1].isNewLine()) { this._len -- ; } ; return this ;}

    public removeTraillingSpaces():TSData 
    { while (this._len > 0 && this._buf[this._len-1].isWhiteSpace()) { this._len -- ; } ; return this ;}

    public removeTraillingStrictSpaces():TSData 
    { while (this._len > 0 && this._buf[this._len-1].isStrictWhiteSpace()) { this._len -- ; } ; return this ;}

    public removeTraillingZeros():TSData
    { while (this._len > 0 && this._buf[this._len-1] === 0) { this._len -- ; } ; return this ;}

    public truncateBy(n:number):TSData {
        if (!$isunsigned(n)) { throw new TSError(`TSDate.truncateBy(${n}) is not valid.`, { data:this, truncateBy:n}) ; }
        this.length = n >= this._len ? 0 : this._len - n ;
        return this ;
    }

    public get mutableBuffer():Buffer { return this._len === this.capacity ? this._buf : this._buf.subarray(0, this._len) ; }
    public get internalStorage():[Buffer, number] { return [this._buf, this._len] ; } // use that to your own risk

    public set length(n:number) {
        if (!$isunsigned(n)) { throw new TSError(`TSDate.length = ${n} is not valid.`, { data:this, length:n}) ; }
        if (n > this._len) { 
            this._willGrow(this._len - n) ; 
            if (this._allocFn !== Buffer.alloc) { while (this._len < n) { this._buf[this._len++] = 0 ; }}
        }
        else { this._len = n ; }
    }

    // ============================ IMMUTABLE OPERATIONS =============================================

    public get capacity():number { return this._buf.length ; }    
    public get length():number   { return this._len ; }
    public get byteLength():number { return this._len ; }

    public clone():TSData { return new TSData(this, { allocMethod:this._allocFn }) ; }

    public get buffer():Buffer {
        const ret = Buffer.allocUnsafe(this._len) ;
        if (this._len) { this._buf.copy(ret, 0, 0, this._len) ; }
        return ret ;
    }

    public entries(): IterableIterator<[number, number]> { return this.mutableBuffer.entries() ; }
    public keys():    IterableIterator<number>           { return this.mutableBuffer.keys() ; }
    public values():  IterableIterator<number>           { return this.mutableBuffer.values() ; }

    public includes(value:Nullable<TSDataLike | number | string>, encoding?:Nullable<StringEncoding|TSCharset>): boolean
    {
        if (!$ok(value) || !this._len) { return false ; }
        const data = _dataValue(value!, encoding) ; if (!$ok(data)) { return false ; }
        return this._index(data!, 0 as uint) !== -1 ; 
    }

    public startsWith(value:Nullable<TSData | number | string>, encoding?:Nullable<StringEncoding|TSCharset>):boolean 
    { 
        if (!$ok(value) || !this._len) { return false ; }
        const data = _dataValue(value!, encoding) ; if (!$ok(data)) { return false ; }
        return this._index(data!, 0 as uint) === 0 ;
    }

    public endsWith(value:Nullable<TSDataLike | number | string>, encoding?:Nullable<StringEncoding|TSCharset>):boolean {
        if (!$ok(value) || !this._len) { return false ; }
        const data = _dataValue(value!, encoding) ;    if (!$ok(data)) { return false ; }
        const slen = _searchedLength(data) ; if (slen <= 0) { return false ; }
        const i = this._len - slen ;         if (i < 0) { return false ; } 
        return this._index(data!, i as uint) === i ;
    }

    public indexOf(value:Nullable<TSDataLike | number>, byteOffset?:Nullable<number>, encoding?:Nullable<StringEncoding|TSCharset>): number {
        if (!$ok(value) || !this._len) { return - 1 ; }
        const data = _dataValue(value!, encoding) ; if (!$ok(data)) { return -1 ; }

        return this._index(data!, $tounsigned(byteOffset)) ;
    }

    
    public lastIndexOf(value:Nullable<TSData | number | Uint8Array>, byteOffset?:Nullable<number>, encoding?:Nullable<StringEncoding|TSCharset>): number {
        if (!$ok(value) || !this._len) { return - 1 ; }
        const data = _dataValue(value!, encoding) ; if (!$ok(data)) { return -1 ; }

        return this._rindex(data!, $tounsigned(byteOffset, (this._len - 1) as uint)) ;
    }

    // with slice, you get a new TSData which holds a copy of the sliced data
    // TSData does not implements subarray() because of its mutable nature...
    public slice(sourceStart?:Nullable<number>, sourceEnd?:Nullable<number>):TSData {
        const [, start, end, len] = $lse(this, sourceStart, sourceEnd) ;
        if (len) {
            const ret = new TSData(len, {allocMethod:this._allocFn}) ;
            ret._len = len ;
            if (len > 0) { this._buf.copy(ret._buf, 0, start, end) ; }
            return ret ;
        }
        return new TSData(0) ;
    }
    
    public copy(targetBuffer: Buffer|Uint8Array|TSData, targetStart?:Nullable<number>, sourceStart?:Nullable<number>, sourceEnd?:Nullable<number>): number {
        const [, start, end, len] = $lse(this, sourceStart, sourceEnd) ;
        if (len) {
            targetStart = $tounsigned(targetStart) ;
            if (targetBuffer instanceof Uint8Array || targetBuffer instanceof Buffer) {
                return this._buf.copy(targetBuffer, targetStart, start, end) ;
            }
            targetBuffer.replaceBytes(this._buf, targetStart, start, end) ;
            return len ;
        }
        return 0 ;
    }
    
    public writeToFile(path:string, opts?:$writeBufferOptions):boolean { 
        TSError.assertNotInBrowser('TSData.writeToFile') ;
        return $writeBuffer(path, this, opts) ; 
    }

    // second part of the return tupple may contains the path of the precedent version of the data
    public fullWriteToFile(path:string, opts:$writeBufferOptions):[boolean, string|null] { 
        TSError.assertNotInBrowser('TSData.fullWriteToFile') ;
        return $fullWriteBuffer(path, this, opts) ; 
    }

    public equals(otherBuffer: Uint8Array): boolean { return this.isEqual(otherBuffer) ; }

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

    public toBase64():string { return $encodeBase64(this.mutableBuffer) ; }
    public crc32():uint32 { return $crc32(this) ; }
    
    // ============ TSObject conformance =============== 
    public toString(encoding?: Nullable<StringEncoding|TSCharset>, sourceStart?:Nullable<number>, sourceEnd?:Nullable<number>): string {
        return $charset(encoding, TSCharset.binaryCharset())!.stringFromData(this, sourceStart, sourceEnd) ;
    }

	public toJSON(): any { return this.mutableBuffer.toJSON() ; }

    public toBytes(sourceStart?:Nullable<number>, sourceEnd?:Nullable<number>): uint8[] { 
        return this.toArray(sourceStart, sourceEnd) as uint[] ; 
    }
    
    public toArray(sourceStart?:Nullable<number>, sourceEnd?:Nullable<number>): number[] { 
        const [, start, end] = $lse(this, sourceStart, sourceEnd) ;
        return $bytesFromBytes(this._buf, start, end) ; 
    }
    
    public toArrayBuffer(sourceStart?:Nullable<number>, sourceEnd?:Nullable<number>): ArrayBuffer { 
        const [, start, end] = $lse(this, sourceStart, sourceEnd) ;
        return $arrayBufferFromBytes(this._buf, start, end) ; 
    }

    public toUint8Array(sourceStart?:Nullable<number>, sourceEnd?:Nullable<number>): Uint8Array { 
        const [, start, end] = $lse(this, sourceStart, sourceEnd) ;
        return $uint8ArrayFromBytes(this._buf, start, end) ; 
    }

    public toBuffer(sourceStart?:Nullable<number>, sourceEnd?:Nullable<number>): Buffer {
        const [, start, end, len] = $lse(this, sourceStart, sourceEnd) ;
        const ret = Buffer.allocUnsafe(len) ;
        if (len > 0) { this._buf.copy(ret, 0, start, end) ; }
        return ret ;
    }

    public compare(other:any) : Comparison {
        if (this === other) { return Same ; }
        else if (other instanceof TSData) { return Buffer.compare(this.mutableBuffer, other.mutableBuffer) as Comparison ; }
        else if (other instanceof Uint8Array) { return Buffer.compare(this.mutableBuffer, other) as Comparison ; }
        else if (other instanceof ArrayBuffer) { return this.compare($bufferFromArrayBuffer(other)) ; }
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
        else if (other instanceof ArrayBuffer) {
            return this.isEqual($bufferFromArrayBuffer(other)) ;
        }
        return false ;
    }

    // ============ private methods =============== 
    private _splice(targetStart:number, deleteCount:number, source?:Nullable<Bytes|TSData>, sourceStart?:Nullable<number>, sourceEnd?:Nullable<number>, paddingByte?:Nullable<number>):TSData {
        const [, start, end, len] = $lse(source, sourceStart, sourceEnd) ;
        const padding = Math.min($tounsigned(paddingByte), UINT8_MAX) ;

        targetStart = $tounsigned(targetStart) ;
        deleteCount = $tounsigned(deleteCount) ;

        if (targetStart + deleteCount >= this._len) {
            // here delete count is unsignificant because if we delete something, 
            // it's all the end of the buffer, so, all we have to do 
            // is to add the content of our source at the insertion point
            if (targetStart + len > this._len) { this._willGrow(targetStart + len - this._len) ; }
            for (let i = this._len ; i < targetStart ; i++) { this._buf[i] = padding ; } // fill intermediate part with padding character (0 if unspecified)
            this._insideCopy(source!, start, end, targetStart) ; 
            this._len = targetStart + len ;
        }
        else if (deleteCount >= len) {
            // here we replace a part of our data by another one and we may have to delete 
            // a part of our data after the copy 
            this._insideCopy(source!, start, end, targetStart) ;
            if (deleteCount > len) {
                let dstart = targetStart + len ;
                for (let i = targetStart + deleteCount ; i < this._len ; i++) { this._buf[dstart++] = this._buf[i] ; }
                this._len -= deleteCount - len ; 
            }
        }
        else {
            // here deleteCount < len, so we will have to insert data
            const glen = len - deleteCount ; // always > 0 
            this._willGrow(glen) ;
            this._insideCopy(source!, start, start+deleteCount, targetStart) ;

            const tend = targetStart + len ;
            for (let i = this._len + glen - 1 ; i >= tend ; i--) { this._buf[i] = this._buf[i-glen] ; }
            this._insideCopy(source!, start+deleteCount, end, targetStart+deleteCount) ;
            this._len += glen ;
        }
        return this ;
    }
    

    private _index(value:number | Uint8Array, byteOffset:uint):number {
        if (!this._len) { return - 1 ;}
        const slen = _searchedLength(value) ;
        if (slen <= 0 || byteOffset + slen > this._len) { return -1 ; }
        return this.mutableBuffer.indexOf(value!, byteOffset) ;
    }

    private _rindex(value:number | Uint8Array, byteOffset:uint):number {
        if (!this._len) { return - 1 ;}
        const slen = _searchedLength(value) ;
        if (byteOffset >= this._len) { byteOffset = (this._len - 1) as uint ;}
        if (slen <= 0 || byteOffset - slen + 1 < 0) { return -1 ; }
        return this.mutableBuffer.lastIndexOf(value!, byteOffset) ;
    }

    private _insideCopy(source:Bytes|TSData, start:number, end:number, targetStart:number) {
        if (start < end) {
            if (source instanceof Buffer || source instanceof TSData) { source.copy(this._buf, targetStart, start, end) ; }
            else { for (let i = start ; i < end ; i++) { this._buf[targetStart+i] = source[i] & 0xff } ; }
        }
    }

    protected _willGrow(n:number) {
        if (n > 0 && this._len + n > this.capacity) {
            const newCapacity = $capacityForCount((this._len + n) as uint) ;
            let newBuffer = this._allocFn(newCapacity) ;
            if (this._len > 0) { this._buf.copy(newBuffer, 0, 0, this._len) ; }
            this._buf = newBuffer ;
        }
    }

    protected _read<T>(offset:number = 0, size:number, bufferReadFn:(offset?:number)=>T):T {
        if (!$isunsigned(offset) || offset+size > this._len) { 
            throw new TSError(`TSData._read(${offset}) out of bound [0,${this._len}]`, { data:this, offset:offset, size:size, readFunction:bufferReadFn}) ; 
        }
        return bufferReadFn.call(this._buf, offset) ;        
    }

    protected _write<T>(value:T, offset:number = 0, size:number, bufferWriteFn:(value:T, offset?:number)=>void):TSData {
        if (!$isunsigned(offset)) { 
            throw new TSError(`TSData._write(${value}, ${offset}) out of bound [0,${this._len}]`, { data:this, offset:offset, size:size, readFunction:bufferWriteFn}) ;
        }
        if (offset + size > this._len) { this._willGrow(offset + size - this._len) ; }
        for (let i = this._len ; i < offset ; i++) { this._buf[i] = 0 ; }  // fill intermediate part with zeros
        bufferWriteFn.call(this._buf, value, offset) ;
        return this ;
    }

}
export interface TSDataConstructor {
    new (source?:Nullable<TSDataLike|number>, opts?:TSDataOptions): TSData;
}

function _dataValue(value:TSDataLike|number|string, encoding?:Nullable<StringEncoding|TSCharset>):Uint8Array|number|null {
    if (value instanceof Buffer || value instanceof Uint8Array) { return value ; }
    if ($isstring(value)) { return $charset(encoding, TSCharset.binaryCharset()).uint8ArrayFromString(value as string) ; }
    if (value instanceof ArrayBuffer) { return $bufferFromArrayBuffer(value as ArrayBuffer) ; }
    if (value instanceof TSData) { return value.mutableBuffer ; }
    if ($isunsigned(value, 0xff)) { return value as number ; }
    if ($isarray(value)) { return $uint8ArrayFromBytes(value as uint8[]) ; }
    return null ;
}

function _searchedLength(value: Nullable<TSData | number | Uint8Array>):number {
    if ($isnumber(value)) {
        return $isunsigned(value, UINT8_MAX) ? 1 : -1 ; 
    }
    return $ok(value) ? (<TSData|Uint8Array>value).length : -1 ; 
}


