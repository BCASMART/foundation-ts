import { $defined, $length, $value } from "./commons";
import { $uint8ArrayFromArrayBuffer } from "./data";
import { TSData } from "./tsdata";
import { TSError } from "./tserrors";
import { Bytes, Nullable, TSDataLike, TSEndianness, uint8 } from "./types";
import { $hexadump, $logterm } from "./utils";

type _TSHashFunction = (hashBlock:number[]) => void ;

interface _TSHashBufferOptions {
    integersCount:number ;
    endianness?:TSEndianness ;
    padding?:Nullable<Bytes> ;
    separator?:Nullable<string> ;
    dataoutput?:Nullable<boolean> ;
}

export class _TSHashBuffer {
    public readonly sourceLength:number ;
    public readonly blocksCount:number ;
    public readonly blockSize:number ;
    public readonly intCount:number ;
    public readonly paddingLength:number ;
    public readonly separator?:Nullable<string> ;
    public readonly dataoutput?:Nullable<boolean> ;
    
    private _endianness:TSEndianness ; 
    private _block:Buffer ;
    private _source?:Bytes ;
    private _padding?:Bytes ;
    private _ret:number[] ;

    constructor(buf:Nullable<TSDataLike>, opts:_TSHashBufferOptions) {

        if (!$defined(opts.padding)) { opts.padding = [0x80 as uint8] ; }

        this.sourceLength = $length(buf) ;
        this.paddingLength = $length(opts.padding) ;
        let blen = this.sourceLength + this.paddingLength ;
        blen = blen + (blen % 4 > 0 ? 4 : 0) ;

        this.intCount = opts.integersCount ;
        this.blockSize = opts.integersCount * 4 ;
        if (this.paddingLength > Math.floor(this.blockSize/8)) {
            throw new TSError('Impossible to create HashBlock with a padding this size', {
                sourceLength:this.sourceLength,
                paddingLength:this.paddingLength,
                blockSize:this.blockSize,            
            }) ;
        }
        this.blocksCount = Math.ceil((blen + 8)/this.blockSize) ;

        this._block = Buffer.alloc(this.blockSize) ;
        this._ret = new Array<number>(this.intCount) ;
        this._endianness = $value(opts.endianness, 'BE') ;

        if (this.sourceLength > 0) { 
            if (buf instanceof TSData) { 
                const [store,] = buf.internalStorage ; 
                this._source = store! ;
            }
            else if (buf instanceof ArrayBuffer) {
                this._source = $uint8ArrayFromArrayBuffer(buf) ;
            }
            else { this._source = buf! }
        }
        if (this.paddingLength > 0) { this._padding = opts.padding! ; }
    }

    private _getBlock(blockIndex:number, debug:boolean):number[] {
        if (blockIndex >= this.blocksCount) {
            throw '_TSHashBuffer._getBlock index overflow' ; 
        }
        let i = blockIndex * this.blockSize, j = 0 ;
        const endBlock = i + this.blockSize ;
        const end = Math.min(endBlock, this.sourceLength) ;
        if (debug) { $logterm(`&0\n&xi = &y${i}&x, end = &y${end}&x, endBlock = &y${endBlock}&0`) ; }

        for (; i < end ; i++) { this._block[j++] = this._source![i] ; }

        if (i < endBlock) {
            if (i <= end) { for (let p = 0 ; p < this.paddingLength ; p++) { this._block[j++] = (this._padding!)[p] ; }}
            while (j < this.blockSize) { this._block[j++] = 0x00 ;}
            if (blockIndex + 1 === this.blocksCount) {
                const bits = this.sourceLength * 8 ;
                const lowBits = (bits & 0xffffffff) >>> 0
                const highBits = (((bits - lowBits) / 0x100000000) & 0xffffffff) >>> 0 ;
                if (this._endianness === 'BE') {
                    if (highBits) { this._block.writeUInt32BE(highBits, this.blockSize - 8) ; }
                    if (lowBits)  { this._block.writeUInt32BE(lowBits,  this.blockSize - 4) ; }    
                }
                else {
                    if (lowBits) { this._block.writeUInt32LE(lowBits, this.blockSize - 8) ; }
                    if (highBits)  { this._block.writeUInt32LE(highBits,  this.blockSize - 4) ; }    
                }
            }
        }
        if (this._endianness === 'BE') {
            for (let n = 0, offset = 0; n < this.intCount ; n++, offset += 4) { this._ret[n] = this._block.readUInt32BE(offset) ; }
        }
        else {
            for (let n = 0, offset = 0; n < this.intCount ; n++, offset += 4) { this._ret[n] = this._block.readUInt32LE(offset) ; }
        }
        if (debug) {
            $logterm(`&0&cblock[${blockIndex}]:&0`) ;
            $hexadump(this._block) ;
        }
        return this._ret ;
    }

    public hash(fn:_TSHashFunction, printBlocks?:Nullable<boolean>) {
        const debug = !!printBlocks
        for (let i = 0 ; i < this.blocksCount; i++) { 
            fn(this._getBlock(i, debug)) ; 
        }
    }

    public output(h:number[]):Buffer|string {
        const len = h.length ;
        const buf = Buffer.allocUnsafe(len * 4) ;
        if (this._endianness === 'BE') {
            for (let i = 0, offset = 0 ; i < len ; i++, offset += 4 ) { buf.writeUInt32BE(h[i], offset) ; }
        }
        else {
            for (let i = 0, offset = 0 ; i < len ; i++, offset += 4 ) { buf.writeUInt32LE(h[i], offset) ; }
        }
        return !this.dataoutput ? buf.toString('hex') : buf ;
    }
} 
