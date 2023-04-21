import { endianness } from "os"
import { $isunsigned, $ok } from "./commons";
import { TSData, TSDataOptions } from "./tsdata";
import { TSError } from "./tserrors";
import { Nullable, TSDataLike, TSEndianness } from "./types";

export interface TSDataCursorOptions extends TSDataOptions {
    cursor?:number ;
    endianness?:TSEndianness ;
}

export class TSDataCursor extends TSData
{
    protected _cursor:number = 0 ;
    protected _endianness:TSEndianness ;

    constructor (source?:Nullable<number|TSDataLike>, opts:TSDataCursorOptions={}) {
        super(source, {
            dontCopySourceBuffer:opts.dontCopySourceBuffer,
            fillWithZeros:opts.fillWithZeros,
            allocMethod:opts.allocMethod}
        ) ;
        if ($ok(opts.cursor)) { this.cursor = opts.cursor! ; }
        this._endianness = $ok(opts.endianness) ? opts.endianness ! : endianness() ;
    }

    public get bigEndian():boolean    { return this._endianness === 'BE' ; }
    public get littleEndian():boolean { return this._endianness === 'LE' ; }
    public get endianness():TSEndianness { return this._endianness ; }

    public get cursor() { return this._cursor ; }
    public set cursor(n:number) {
        if (!$isunsigned(n)) { 
            throw new TSError(`TSData.cursor = ${n} is not valid.`, { cursor:this, location:n}) ; 
        }
        if (n > this._len) { this.length = n ; }
        this._cursor = n ;
    }

    public readBigUInt64(offset?:number): bigint        { return this._read(offset, 8, this.bigEndian ? Buffer.prototype.readBigUInt64BE:Buffer.prototype.readBigUInt64LE) ; }
    public readBigInt64(offset?:number): bigint         { return this._read(offset, 8, this.bigEndian ? Buffer.prototype.readBigInt64BE:Buffer.prototype.readBigInt64LE) ; }
    public readUInt16(offset?:number): number           { return this._read(offset, 2, this.bigEndian ? Buffer.prototype.readUInt16BE:Buffer.prototype.readUInt16LE) ; }
    public readUInt32(offset?:number): number           { return this._read(offset, 4, this.bigEndian ? Buffer.prototype.readUInt32BE:Buffer.prototype.readUInt32LE) ; }
    public readInt16(offset?:number): number            { return this._read(offset, 2, this.bigEndian ? Buffer.prototype.readInt16BE:Buffer.prototype.readInt16LE) ; }
    public readInt32(offset?:number): number            { return this._read(offset, 4, this.bigEndian ? Buffer.prototype.readInt32BE:Buffer.prototype.readInt32LE) ; }
    public readFloat(offset?:number): number            { return this._read(offset, 4, this.bigEndian ? Buffer.prototype.readFloatBE:Buffer.prototype.readFloatLE) ; }
    public readDouble(offset?:number): number           { return this._read(offset, 8, this.bigEndian ? Buffer.prototype.readDoubleBE:Buffer.prototype.readDoubleLE) ; }

    public writeBigInt64(value:bigint, offset?:number):TSDataCursor  { return this._write(value, offset, 8, this.bigEndian ? Buffer.prototype.writeBigInt64BE:Buffer.prototype.writeBigInt64LE) ; }
    public writeBigUInt64(value:bigint, offset?:number):TSDataCursor { return this._write(value, offset, 8, this.bigEndian ? Buffer.prototype.writeBigUInt64BE:Buffer.prototype.writeBigUInt64LE) ; }
    public writeUInt16(value: number, offset?: number):TSDataCursor  { return this._write(value, offset, 2, this.bigEndian ? Buffer.prototype.writeUInt16BE:Buffer.prototype.writeUInt16LE) ; }   
    public writeUInt32(value: number, offset?: number):TSDataCursor  { return this._write(value, offset, 4, this.bigEndian ? Buffer.prototype.writeUInt32BE:Buffer.prototype.writeUInt32LE) ; }   
    public writeInt16(value: number, offset?: number):TSDataCursor   { return this._write(value, offset, 2, this.bigEndian ? Buffer.prototype.writeInt16BE:Buffer.prototype.writeInt16LE) ; }
    public writeInt32(value: number, offset?: number):TSDataCursor   { return this._write(value, offset, 4, this.bigEndian ? Buffer.prototype.writeInt32BE:Buffer.prototype.writeInt32LE) ; }
    public writeFloat(value: number, offset?: number):TSDataCursor   { return this._write(value, offset, 4, this.bigEndian ? Buffer.prototype.writeFloatBE:Buffer.prototype.writeFloatLE) ; }
    public writeDouble(value: number, offset?: number):TSDataCursor  { return this._write(value, offset, 8, this.bigEndian ? Buffer.prototype.writeDoubleBE:Buffer.prototype.writeDoubleLE) ; }


    protected _read<T>(offset:number = this._cursor, size:number, bufferReadFn:(offset?:number)=>T):T {
        const v = super._read(offset, size, bufferReadFn) ;
        this._cursor = offset + size ;
        return v ;
    }

    protected _write<T>(value:T, offset:number = this._cursor, size:number, bufferWriteFn:(value:T, offset?:number)=>void):TSDataCursor {
        super._write(value, offset, size, bufferWriteFn) ;
        this._cursor = offset + size ;
        return this ;
    }
}

export interface TSDataCursorConstructor {
    new (source?:Nullable<number|TSDataLike>, opts?:TSDataCursorOptions): TSDataCursor;
}

