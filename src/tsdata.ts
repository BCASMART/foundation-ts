import { $capacityForCount, $isarray, $isnumber, $isstring, $isunsigned, $lse, $ok, $tounsigned } from "./commons";
import { $crc16, $crc32, $hash, $hashOptions, $slowhash, HashMethod } from "./crypto";
import { $arrayBufferFromBytes, $dataAspect, $bufferFromArrayBuffer, $uint8ArrayFromBytes, $encodeBase64, $bufferFromDataLike, $arrayFromBytes, $uint8ArrayFromDataLike, $dataXOR, $encodeBytesToHexa, $encodeBase64URL, $bufferFromHexaString, $decodeBase64, $decodeBase64URL } from "./data";
import { $fullWriteBuffer, $readBuffer, $writeBuffer, $writeBufferOptions } from "./fs";
import { $charset, TSCharset } from "./tscharset";
import { TSError } from "./tserrors";
import { TSClone, TSLeafInspect, TSObject } from "./tsobject";
import { Bytes, Comparison, Nullable, Same, StringEncoding, TSDataLike, TSEndianness, uint, uint16, uint32, uint8, UINT8_MAX } from "./types" ;

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
    private _dataView:DataView|undefined = undefined ;

    // cached mutableBuffer view (see the getter). It is a live view onto `_buf`,
    // so in-place byte changes are reflected for free ; it only becomes stale
    // when the significant length or the backing buffer identity changes, which
    // is exactly what `_mbLen` / `_mbBuf` fingerprint. No mutating method needs
    // to know about this cache.
    private _mbView:Buffer|undefined = undefined ;
    private _mbLen:number = -1 ;
    private _mbBuf:Buffer|undefined = undefined ;

    // ============================ TSDATA creation =============================================
    constructor (source?:Nullable<number|TSDataLike>, opts:TSDataOptions={}) 
    {
        this._allocFn = $ok(opts.allocMethod) ? opts.allocMethod! : (opts.fillWithZeros ? Buffer.alloc : Buffer.allocUnsafe) ;

        if (!$ok(source)) { source = 0 ; }
        
        if (source instanceof TSData) {
            this._len = source._len ;
            this._buf = this._allocFn(source.capacity) ;
            if (this._len > 0)  { source._buf.copy(this._buf, 0, 0, this._len) ; }
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
            const capacity = $capacityForCount(source) 
            this._len = 0 ;
            this._buf = this._allocFn(capacity) ;
        }
        else {
            TSError.throw('TSData.constructor() : Bad parameters', { arguments:Array.from(arguments)}) ;
        }
    }

    public static fromFile(src:Nullable<string>):TSData|null {
        TSError.assertNotInBrowser('TSData.fromFile') ;
        const b = $readBuffer(src) ;
        return $ok(b) ? new TSData(b, { dontCopySourceBuffer:true }) : null ;
    }

    public static fromString(source:Nullable<string>, encoding?:Nullable<StringEncoding|TSCharset>, sourceStart?:Nullable<number>, sourceEnd?:Nullable<number>):TSData {
        const [, start, end,] = $lse(source, sourceStart, sourceEnd) ;
        return start < end ? $charset(encoding, TSCharset.binaryCharset()).dataFromString(source!, start, end) : new TSData() ;
    }

    public static fromHexaString(source:Nullable<string>):TSData|null {
        const buffer = $bufferFromHexaString(source) ;
        return $ok(buffer) ? new TSData(buffer, { dontCopySourceBuffer:true }) : null ;
    }

    public static fromBase64String(source:Nullable<string>):TSData|null {
        const buffer = $ok(source) ? $decodeBase64(source!) : null ;
        return $ok(buffer) ? new TSData(buffer, { dontCopySourceBuffer:true }) : null ;
    }

    public static fromBase64URLString(source:Nullable<string>):TSData|null {
        const buffer = $ok(source) ? $decodeBase64URL(source!) : null ;
        return $ok(buffer) ? new TSData(buffer, { dontCopySourceBuffer:true }) : null ;
    }


    // ============ TSLeafInspect conformance =============== 
    public leafInspect(): string { return '<'+$dataAspect(this.mutableBuffer, { name:this.constructor.name, prefix: '', suffix:'', separator:'', showLength:false, transformFn: (n) => n.toHex2() })+'>' }
    
    // @ts-ignore
    [customInspectSymbol](depth:number, inspectOptions:any, inspect:any) {
        return this.leafInspect()
    }

    // ============================ STANDARD JS ENUMERATION =============================================
    public *[Symbol.iterator]()
    { for (let i = 0 ; i < this._len ; i++) { yield this._buf[i] ; }}

    // ============================ POTENTIALLY MUTABLE OPERATIONS =============================================

    public splice(targetStart:number, deleteCount:number, source?:Nullable<TSDataLike>, sourceStart?:Nullable<number>, sourceEnd?:Nullable<number>, paddingByte?:Nullable<number>):TSData {
        return this._splice(targetStart, deleteCount, source, sourceStart, sourceEnd, paddingByte) ;    
    }
    
    public appendByte(source:uint8):TSData {
        this._willGrow(1) ;
        this._buf[this._len++] = source & 0xff ;
        return this ;
    }

    public appendBytes(source:Nullable<Bytes>, sourceStart?:Nullable<number>, sourceEnd?:Nullable<number>):TSData
    { return $ok(source) ? this._splice(this._len, 0, source, sourceStart, sourceEnd) : this ; }

    public appendData(source:Nullable<TSDataLike>, sourceStart?:Nullable<number>, sourceEnd?:Nullable<number>):TSData
    { return $ok(source) ? this._splice(this._len, 0, source, sourceStart, sourceEnd) : this ; }

    public appendString(source:Nullable<string>, encoding?:Nullable<StringEncoding|TSCharset>, sourceStart?:Nullable<number>, sourceEnd?:Nullable<number>):TSData {
        const [,start,end,] = $lse(source, sourceStart, sourceEnd) ;
        if (start < end) {
            const b = $charset(encoding, TSCharset.binaryCharset()).stringToBytes(source!, start, end) ;
            this.appendBytes(b) ;
        }
        return this ;
    }
    
    public appendASCII(source:Nullable<string>, sourceStart?:Nullable<number>, sourceEnd?:Nullable<number>):TSData {
        const [, start, end, len] = $lse(source, sourceStart, sourceEnd) ;
        if (start < end) {
            this._willGrow(len) ;
            for (let i = start ; i < end ; i++) {
                this._buf[this._len++] = source!.charCodeAt(i) & 0xff ;
            }
        }
        return this ;
    }

    public replaceBytes(source:Nullable<Bytes>, targetStart?:Nullable<number>, sourceStart?:Nullable<number>, sourceEnd?:Nullable<number>):TSData {
        const [, start, end, len] = $lse(source, sourceStart, sourceEnd) ;
        return this._splice($tounsigned(targetStart), len, source, start, end) ;
    }

    public replaceData(source:Nullable<TSDataLike>, targetStart?:Nullable<number>, sourceStart?:Nullable<number>, sourceEnd?:Nullable<number>):TSData {
        const [, start, end, len] = $lse(source, sourceStart, sourceEnd) ;
        return this._splice($tounsigned(targetStart), len, source, start, end) ; // we remove 
    }

    public replaceString(source:Nullable<string>, targetStart?:Nullable<number>, encoding?:Nullable<StringEncoding|TSCharset>, sourceStart?:Nullable<number>, sourceEnd?:Nullable<number>):TSData {
        const datasource = $ok(source) ? $charset(encoding, TSCharset.binaryCharset()).bufferFromString(source!, sourceStart, sourceEnd) : null ;
        const [, start, end, len] = $lse(datasource) ;
        return this._splice($tounsigned(targetStart), len, datasource, start, end) ; 
    }

    public getInt8(byteOffset:number = 0):number { return this._checkedDataView(byteOffset, 1).getInt8(byteOffset) ; }
    public getUint8(byteOffset:number = 0):number { return this._checkedDataView(byteOffset, 1).getUint8(byteOffset) ; }
    public getInt16(byteOffset:number = 0, littleEndian?:boolean):number { return this._checkedDataView(byteOffset, 2).getInt16(byteOffset, littleEndian) ; }
    public getUint16(byteOffset:number = 0, littleEndian?:boolean):number { return this._checkedDataView(byteOffset, 2).getUint16(byteOffset, littleEndian) ; }
    public getInt32(byteOffset:number = 0, littleEndian?:boolean):number { return this._checkedDataView(byteOffset, 4).getInt32(byteOffset, littleEndian) ; }
    public getUint32(byteOffset:number = 0, littleEndian?:boolean):number { return this._checkedDataView(byteOffset, 4).getUint32(byteOffset, littleEndian) ; }
    public getFloat32(byteOffset:number = 0, littleEndian?:boolean):number { return this._checkedDataView(byteOffset, 4).getFloat32(byteOffset, littleEndian) ; }
    public getFloat64(byteOffset:number = 0, littleEndian?:boolean):number { return this._checkedDataView(byteOffset, 8).getFloat64(byteOffset, littleEndian) ; }
    public getBigInt64(byteOffset:number = 0, littleEndian?:boolean):bigint { return this._checkedDataView(byteOffset, 8).getBigInt64(byteOffset, littleEndian) ; }
    public getBigUint64(byteOffset:number = 0, littleEndian?:boolean):bigint { return this._checkedDataView(byteOffset, 8).getBigUint64(byteOffset, littleEndian) ; }

    public setInt8(byteOffset:number, value:number) {
        byteOffset = this._mayGrowAtOffset(byteOffset, 1) ; 
        this._internalDataView.setInt8(byteOffset, value) ; 
    }
    public setUint8(byteOffset:number, value:number) {
        byteOffset = this._mayGrowAtOffset(byteOffset, 1) ; 
        this._internalDataView.setUint8(byteOffset, value) ; 
    }
    public setInt16(byteOffset:number, value:number, littleEndian?:boolean) {
        byteOffset = this._mayGrowAtOffset(byteOffset, 2) ; 
        this._internalDataView.setInt16(byteOffset, value, littleEndian) ; 
    }    
    public setUint16(byteOffset:number, value:number, littleEndian?:boolean)  {
        byteOffset = this._mayGrowAtOffset(byteOffset, 2) ; 
        this._internalDataView.setUint16(byteOffset, value, littleEndian) ; 
    }
    public setInt32(byteOffset:number, value:number, littleEndian?:boolean) {
        byteOffset = this._mayGrowAtOffset(byteOffset, 4) ; 
        this._internalDataView.setInt32(byteOffset, value, littleEndian) ; 
    }
    public setUint32(byteOffset:number, value:number, littleEndian?:boolean) {
        byteOffset = this._mayGrowAtOffset(byteOffset, 4) ; 
        this._internalDataView.setUint32(byteOffset, value, littleEndian) ; 
    }
    public setFloat32(byteOffset:number, value:number, littleEndian?:boolean) {
        byteOffset = this._mayGrowAtOffset(byteOffset, 4) ; 
        this._internalDataView.setFloat32(byteOffset, value, littleEndian) ; 
    }
    public setFloat64(byteOffset:number, value:number, littleEndian?:boolean) {
        byteOffset = this._mayGrowAtOffset(byteOffset, 8) ; 
        this._internalDataView.setFloat64(byteOffset, value, littleEndian) ; 
    }
    public setBigInt64(byteOffset:number, value:bigint, littleEndian?:boolean) {
        byteOffset = this._mayGrowAtOffset(byteOffset, 8) ; 
        this._internalDataView.setBigInt64(byteOffset, value, littleEndian) ; 
    }
    public setBigUint64(byteOffset:number, value:bigint, littleEndian?:boolean) {
        byteOffset = this._mayGrowAtOffset(byteOffset, 8) ; 
        this._internalDataView.setBigUint64(byteOffset, value, littleEndian) ; 
    }


    public removeTraillingNewLines():TSData
    { while (this._len > 0 && this._buf[this._len-1].isNewLine()) { this._len -- ; } ; return this ;}

    public removeTraillingSpaces():TSData 
    { while (this._len > 0 && this._buf[this._len-1].isWhiteSpace()) { this._len -- ; } ; return this ;}

    public removeTraillingStrictSpaces():TSData 
    { while (this._len > 0 && this._buf[this._len-1].isStrictWhiteSpace()) { this._len -- ; } ; return this ;}

    public removeTraillingZeros():TSData
    { while (this._len > 0 && this._buf[this._len-1] === 0) { this._len -- ; } ; return this ;}

    public truncateBy(n:number):TSData {
        if (!$isunsigned(n)) { TSError.throw(`TSDate.truncateBy(${n}) is not valid.`, { data:this, truncateBy:n}) ; }
        this.length = n >= this._len ? 0 : this._len - n ;
        return this ;
    }

    public get mutableBuffer():Buffer {
        if (this._mbView === undefined || this._mbLen !== this._len || this._mbBuf !== this._buf) {
            this._mbView = this._len === this._buf.length ? this._buf : this._buf.subarray(0, this._len) ;
            this._mbLen = this._len ;
            this._mbBuf = this._buf ;
        }
        return this._mbView ;
    }
    public get internalStorage():[Buffer, number] { return [this._buf, this._len] ; } // use that to your own risk
    
    public set length(n:number) {
        if (!$isunsigned(n)) { TSError.throw(`TSDate.length = ${n} is not valid.`, { data:this, length:n}) ; }
        if (n > this._len) { 
            this._willGrow(n-this._len) ; 
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

    public indexOf(value:Nullable<TSDataLike | number | string>, byteOffset?:Nullable<number>, encoding?:Nullable<StringEncoding|TSCharset>): number {
        if (!$ok(value) || !this._len) { return - 1 ; }
        const data = _dataValue(value!, encoding) ; if (!$ok(data)) { return -1 ; }

        return this._index(data!, $tounsigned(byteOffset)) ;
    }
    
    public lastIndexOf(value:Nullable<TSDataLike | number | Uint8Array>, byteOffset?:Nullable<number>, encoding?:Nullable<StringEncoding|TSCharset>): number {
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

    public uint8ArraySlice(sourceStart?:Nullable<number>, sourceEnd?:Nullable<number>):Uint8Array {
        const [, start, end, len] = $lse(this, sourceStart, sourceEnd) ;
        const ret = new Uint8Array(len)
        if (len) { this._buf.copy(ret, 0, start, end) ; }
        return ret ;
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

    public readInt8 = this.getInt8 ;
    public readUInt8 = this.getUint8 ;
    public readInt16LE(offset:number = 0): number      { return this.getInt16(offset, TSEndianness.LE) ; }
    public readInt16BE(offset:number = 0): number      { return this.getInt16(offset, TSEndianness.BE) ; }
    public readUInt16LE(offset:number = 0): number     { return this.getUint16(offset, TSEndianness.LE) ; }
    public readUInt16BE(offset:number = 0): number     { return this.getUint16(offset, TSEndianness.BE) ; }
    public readInt32LE(offset:number = 0): number      { return this.getInt32(offset, TSEndianness.LE) ; }
    public readInt32BE(offset:number = 0): number      { return this.getInt32(offset, TSEndianness.BE) ; }
    public readUInt32LE(offset:number = 0): number     { return this.getUint32(offset, TSEndianness.LE) ; }
    public readUInt32BE(offset:number = 0): number     { return this.getUint32(offset, TSEndianness.BE) ; }
    public readBigInt64LE(offset:number = 0): bigint   { return this.getBigInt64(offset, TSEndianness.LE) ; }
    public readBigInt64BE(offset:number = 0): bigint   { return this.getBigInt64(offset, TSEndianness.BE) ; }
    public readBigUInt64LE(offset:number = 0): bigint  { return this.getBigUint64(offset, TSEndianness.LE) ; }
    public readBigUInt64BE(offset:number = 0): bigint  { return this.getBigUint64(offset, TSEndianness.BE) ; }
    public readFloatLE(offset:number = 0): number      { return this.getFloat32(offset, TSEndianness.LE) ; }
    public readFloatBE(offset:number = 0): number      { return this.getFloat32(offset, TSEndianness.BE) ; }
    public readDoubleLE(offset:number = 0): number     { return this.getFloat64(offset, TSEndianness.LE) ; }
    public readDoubleBE(offset:number = 0): number     { return this.getFloat64(offset, TSEndianness.BE) ; }

    public writeInt8(value: number, offset:number = 0):TSData        { this.setInt8(offset, value) ; return this ; }
    public writeUInt8(value: number, offset:number = 0):TSData       { this.setUint8(offset, value) ; return this ; }
    public writeInt16LE(value: number, offset:number = 0):TSData     { this.setInt16(offset, value, TSEndianness.LE) ; return this ; }
    public writeInt16BE(value: number, offset:number = 0):TSData     { this.setInt16(offset, value, TSEndianness.BE) ; return this ; }
    public writeUInt16LE(value: number, offset:number = 0):TSData    { this.setUint16(offset, value, TSEndianness.LE) ; return this ; } 
    public writeUInt16BE(value: number, offset:number = 0):TSData    { this.setUint16(offset, value, TSEndianness.BE) ; return this ; }   
    public writeInt32LE(value: number, offset:number = 0):TSData     { this.setInt32(offset, value, TSEndianness.LE) ; return this ; }
    public writeInt32BE(value: number, offset:number = 0):TSData     { this.setInt32(offset, value, TSEndianness.BE) ; return this ; }
    public writeUInt32LE(value: number, offset:number = 0):TSData    { this.setUint32(offset, value, TSEndianness.LE) ; return this ; }   
    public writeUInt32BE(value: number, offset:number = 0):TSData    { this.setUint32(offset, value, TSEndianness.BE) ; return this ; }   
    public writeBigInt64LE(value:bigint, offset:number = 0):TSData   { this.setBigInt64(offset, value, TSEndianness.LE) ; return this ; }
    public writeBigInt64BE(value:bigint, offset:number = 0):TSData   { this.setBigInt64(offset, value, TSEndianness.BE) ; return this ; }
    public writeBigUInt64LE(value:bigint, offset:number = 0):TSData  { this.setBigUint64(offset, value, TSEndianness.LE) ; return this ; }
    public writeBigUInt64BE(value:bigint, offset:number = 0):TSData  { this.setBigUint64(offset, value, TSEndianness.BE) ; return this ; }
    public writeFloatLE(value: number, offset:number = 0):TSData     { this.setFloat32(offset, value, TSEndianness.LE) ; return this ; }
    public writeFloatBE(value: number, offset:number = 0):TSData     { this.setFloat32(offset, value, TSEndianness.BE) ; return this ; }
    public writeDoubleLE(value: number, offset:number = 0):TSData    { this.setFloat64(offset, value, TSEndianness.LE) ; return this ; }
    public writeDoubleBE(value: number, offset:number = 0):TSData    { this.setFloat64(offset, value, TSEndianness.BE) ; return this ; }

    public appendInt8(value: number):TSData        { this.setInt8(this._len, value) ; return this ; }
    public appendUInt8(value: number):TSData       { this.setUint8(this._len, value) ; return this ; }
    public appendInt16LE(value: number):TSData     { this.setInt16(this._len, value, TSEndianness.LE) ; return this ; }
    public appendInt16BE(value: number):TSData     { this.setInt16(this._len, value, TSEndianness.BE) ; return this ; }
    public appendUInt16LE(value: number):TSData    { this.setUint16(this._len, value, TSEndianness.LE) ; return this ; } 
    public appendUInt16BE(value: number):TSData    { this.setUint16(this._len, value, TSEndianness.BE) ; return this ; }   
    public appendInt32LE(value: number):TSData     { this.setInt32(this._len, value, TSEndianness.LE) ; return this ; }
    public appendInt32BE(value: number):TSData     { this.setInt32(this._len, value, TSEndianness.BE) ; return this ; }
    public appendUInt32LE(value: number):TSData    { this.setUint32(this._len, value, TSEndianness.LE) ; return this ; }   
    public appendUInt32BE(value: number):TSData    { this.setUint32(this._len, value, TSEndianness.BE) ; return this ; }   
    public appendBigInt64LE(value:bigint):TSData   { this.setBigInt64(this._len, value, TSEndianness.LE) ; return this ; }
    public appendBigInt64BE(value:bigint):TSData   { this.setBigInt64(this._len, value, TSEndianness.BE) ; return this ; }
    public appendBigUInt64LE(value:bigint):TSData  { this.setBigUint64(this._len, value, TSEndianness.LE) ; return this ; }
    public appendBigUInt64BE(value:bigint):TSData  { this.setBigUint64(this._len, value, TSEndianness.BE) ; return this ; }
    public appendFloatLE(value: number):TSData     { this.setFloat32(this._len, value, TSEndianness.LE) ; return this ; }
    public appendFloatBE(value: number):TSData     { this.setFloat32(this._len, value, TSEndianness.BE) ; return this ; }
    public appendDoubleLE(value: number):TSData    { this.setFloat64(this._len, value, TSEndianness.LE) ; return this ; }
    public appendDoubleBE(value: number):TSData    { this.setFloat64(this._len, value, TSEndianness.BE) ; return this ; }

    public base64String():string { return $encodeBase64(this.mutableBuffer) ; }
    public base64URL():string { return $encodeBase64URL(this.mutableBuffer) ; }
    public toBase64 = this.base64String ;
    public toBase64URL = this.base64URL ;

    public crc16():uint16 { return $crc16(this) ; }
    public crc32():uint32 { return $crc32(this) ; }

    public XOR(other:TSDataLike):Buffer { return $dataXOR(this, other) ; }
    
    public hash(method?: Nullable<HashMethod>):string|null { return $hash(this, method) ; }
    public slowhash(options?: $hashOptions):string|Uint8Array { return $slowhash(this, options) ; }

    public [Symbol.toPrimitive](hint: "number" | "string" | "default") {
        return hint === 'number' ? NaN : TSCharset.binaryCharset().stringFromData(this) ;
    }

    // ============ TSObject conformance =============== 
    public toString(encoding?: Nullable<StringEncoding|TSCharset>, sourceStart?:Nullable<number>, sourceEnd?:Nullable<number>): string 
    { return $charset(encoding, TSCharset.binaryCharset())!.stringFromData(this, sourceStart, sourceEnd) ; }
    
    public hexaString(toLowerCase?:boolean):string { return $encodeBytesToHexa(this.mutableBuffer, toLowerCase) ; }
    public toHexa = this.hexaString ;

	public toJSON(): any { return this.mutableBuffer.toJSON() ; }

    public toBytes(sourceStart?:Nullable<number>, sourceEnd?:Nullable<number>): Bytes
    { return this.toBuffer(sourceStart, sourceEnd) ; }
    
    public toArray(sourceStart?:Nullable<number>, sourceEnd?:Nullable<number>): number[] { 
        const [, start, end] = $lse(this, sourceStart, sourceEnd) ;
        return $arrayFromBytes(this._buf, { start:start, end:end, forceCopy:true } ) ; 
    }
    
    public toArrayBuffer(sourceStart?:Nullable<number>, sourceEnd?:Nullable<number>): ArrayBuffer { 
        const [, start, end] = $lse(this, sourceStart, sourceEnd) ;
        return $arrayBufferFromBytes(this._buf, {start:start, end:end, forceCopy:true }) ; 
    }

    public toUint8Array(sourceStart?:Nullable<number>, sourceEnd?:Nullable<number>): Uint8Array { 
        const [, start, end] = $lse(this, sourceStart, sourceEnd) ;
        return $uint8ArrayFromBytes(this._buf, { start:start, end:end, forceCopy:true } ) ; 
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
        else if (other instanceof ArrayBuffer) { return Buffer.compare(this.mutableBuffer, $bufferFromArrayBuffer(other)) ; }
        // QUESTION: should we have a comparaison with uint8[] here.
        return undefined ;
    }

    public compareToData(other:Nullable<TSDataLike>) : Comparison {
        if (this === other) { return Same ; }
        else if (!$ok(other)) { return undefined ; }
        return Buffer.compare(this.mutableBuffer, other instanceof TSData ? other.mutableBuffer : $bufferFromDataLike(other!)) ;
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
        // QUESTION: should we test equality with uint8[] here.
        return false ;
    }

    public isEqualToData(other:Nullable<TSDataLike>) : boolean
    { return this.compareToData(other) === Same ; }

    // ============ private methods =============== 
    private _splice(targetStart:number, deleteCount:number, source?:Nullable<TSDataLike>, sourceStart?:Nullable<number>, sourceEnd?:Nullable<number>, paddingByte?:Nullable<number>):TSData {
        const [, start, end, len] = $lse(source, sourceStart, sourceEnd) ;
        const padding = Math.min($tounsigned(paddingByte), UINT8_MAX) ;
        //console.log('LSE:', start, end, len) ;
        targetStart = $tounsigned(targetStart) ;
        deleteCount = $tounsigned(deleteCount) ;

        if (targetStart + deleteCount >= this._len) {
            // here delete count is unsignificant because if we delete something, 
            // it's all the end of the buffer, so, all we have to do 
            // is to add the content of our source at the insertion point
            //console.log('splice1:', targetStart, len, this._len, targetStart + len - this._len) ;
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

    private _insideCopy(source:TSDataLike, start:number, end:number, targetStart:number) {
        if (start < end) {
            if (source instanceof ArrayBuffer) { $bufferFromArrayBuffer(source).copy(this._buf, targetStart, start, end) ;}
            else if (source instanceof Buffer || source instanceof TSData) { source.copy(this._buf, targetStart, start, end) ; }
            // source[start..end[ must land at _buf[targetStart..] — like the Buffer.copy() above.
            else { for (let i = start ; i < end ; i++) { this._buf[targetStart + i - start] = source[i] & 0xff } ; }
        }
    }

    protected get _internalDataView():DataView {
        if (!$ok(this._dataView)) {
            this._dataView = new DataView(this._buf.buffer, this._buf.byteOffset, this._buf.byteLength) ;
        }
        return this._dataView ;
    }

    // this method checks that a [byteOffset, byteOffset + size[ read stays
    // inside the significant part of the data (ie [0, this._len[) and throws
    // otherwise. It prevents reading uninitialized capacity bytes through
    // the internal DataView (whose own bounds are the buffer capacity).
    protected _checkedDataView(byteOffset:number, size:number):DataView {
        if (!$isunsigned(byteOffset) || byteOffset + size > this._len) {
            TSError.throw(`TSData.get(${byteOffset}) out of bound [0,${this._len}]`, { data:this, offset:byteOffset, size:size }) ;
        }
        return this._internalDataView ;
    }

    // this method prepare a new buffer with padded 0
    // if necessary and set the new length depending on
    // offset + n ;
    protected _mayGrowAtOffset(offset:number, n:number):number {
        offset = Math.max(0, offset) ;
        const endPos = offset + n ;
        if (endPos > this._len) { 
            this._willGrow(endPos-this._len) ; 
            for (let i = this._len ; i < offset ; i++) { this._buf[i] = 0 ; }
            this._len = endPos ;
        }
        return offset ;
    }

    protected _willGrow(n:number) {
        if (n > 0 && this._len + n > this.capacity) {
            const newCapacity = $capacityForCount((this._len + n) as uint) ;
            let newBuffer = this._allocFn(newCapacity) ;
            if (this._len > 0) { this._buf.copy(newBuffer, 0, 0, this._len) ; }
            this._buf = newBuffer ;
            this._dataView = undefined ; // needs to be recalculated
            this._mbView = this._mbBuf = undefined ; // drop the stale view onto the old buffer
        }
    }

}
export interface TSDataConstructor {
    new (source?:Nullable<TSDataLike|number>, opts?:TSDataOptions): TSData;
}

function _dataValue(value:TSDataLike|number|string, encoding?:Nullable<StringEncoding|TSCharset>):Uint8Array|number|null {
    return typeof value === 'number' ?
           ($isunsigned(value) ? value : null) :
           ($isstring(value) ? 
            $charset(encoding, TSCharset.binaryCharset()).uint8ArrayFromString(value) :
            $uint8ArrayFromDataLike(value)
           ) ;
}

function _searchedLength(value: Nullable<TSData | number | Uint8Array>):number {
    if ($isnumber(value)) {
        return $isunsigned(value, UINT8_MAX) ? 1 : -1 ; 
    }
    return $ok(value) ? (<TSData|Uint8Array>value).length : -1 ; 
}


