
import { $random, $randomBytes } from '../src/crypto';
import { $arrayBufferFromBytes, $bufferFromArrayBuffer } from '../src/data';
import { $removeFile, $temporarypath } from '../src/fs';
import { FoundationBinaryNewLines, FoundationBinaryWhiteSpaces, FoundationBynaryStrictWhiteSpaces } from '../src/string_tables';
import { TSData } from '../src/tsdata';
import { TSTest } from '../src/tstester';
import { Ascending, Same, TSEndianness, uint8 } from '../src/types';
import { $hexadump, $inbrowser } from '../src/utils';

export const mutableDataGroups = [
    TSTest.group("Testing TSData", async (group) => {
        const b = '0123456789' ;
        const sup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz' ;
        const SUP = Buffer.from(sup) ;
        const B = Buffer.from(b) ;
        const B1 = Buffer.from(b+sup) ;
        const D = new TSData(B) ;
        const D1 = new TSData(D) ;
        const F = new TSData(2) ;

        F.appendString(b, 'ascii').appendString(sup, 'ascii') ;
        F.replaceString('@', F.length+1) ;

        D1.appendData(SUP) ;
        const E = D1.clone() ;
        const C = D1.clone() ;
        const N = D1.clone() ;
        const Z = D1.clone() ;

        E.replaceData(Buffer.from('@'), E.length+1) ;
        C.appendByte(0 as uint8) ;
        C.appendByte(0x40 as uint8) ;
        N.length = 10 ;
        Z.length = 0 ;

        group.unary('buffer creation, setData(), appendByte() and setting length', async (t) => {
            t.expect0(D.toString()).is(B.toString()) ;
            t.expect1(D).is(B) ;
            t.expect2(D1).is(B1) ;
            t.expect3(E).is(C) ;
            t.expect4(F).is(C) ;
            t.expect5(N).is(D) ;
            t.expect6(Z).is(Buffer.from('')) ;
        }) ;

        group.unary('TSData.slice()', async (t) => {
            t.expect0(D1.slice(0,10)).is(D) ;
            t.expect1(D1.slice(10)).is(SUP) ;
            t.expect2(D1.slice(100,100)).is(Buffer.from('')) ;
            t.expect3(D1.slice(10,100)).is(SUP) ;
        }) ;

        group.unary('TSData.indexof() and TSData.lastIndexOf()', async(t) => {
            const partial = D.clone() ;
            const D8 =  TSData.fromString('01234567') ;
            if (t.expectY(D8).OK()) {
                const P0 = Buffer.from('67') ;
                const P1 = Buffer.from('678') ;
                const P2 = Buffer.from('89') ;
                const P3 = Buffer.from('34') ;

                partial.length = 8 ;
                t.expect0(partial).is(D8) ;
                t.expect1(D8!.indexOf(P0)).is(6) ;
                t.expect2(D8!.indexOf(P1)).is(-1) ;
                t.expect3(partial.indexOf(P0)).is(6) ;
                t.expect4(partial.indexOf(P1)).is(-1) ;
                t.expect5(D8!.lastIndexOf(P0)).is(6) ;
                t.expect6(D8!.lastIndexOf(P1)).is(-1) ;
                t.expect7(partial.lastIndexOf(P0)).is(6) ;
                t.expect8(partial.lastIndexOf(P1)).is(-1) ;
                t.expect9(D8!.indexOf(P2)).is(-1) ;
                t.expectA(partial.indexOf(P2)).is(-1) ;
                t.expectB(D8!.lastIndexOf(P2)).is(-1) ;
                t.expectC(partial.lastIndexOf(P2)).is(-1) ;
                t.expectD(D8!.indexOf(D8)).is(0) ;
                t.expectE(partial.indexOf(D8)).is(0) ;
                t.expectF(D8!.indexOf(partial)).is(0) ;
                t.expectG(D8!.lastIndexOf(D8)).is(0) ;
                t.expectH(partial.lastIndexOf(D8)).is(0) ;
                t.expectI(D8!.lastIndexOf(partial)).is(0) ;
                t.expectJ(D8!.lastIndexOf(P3)).is(3) ;
                t.expectK(partial.lastIndexOf(P3)).is(3) ;
                t.expectL(D.lastIndexOf(P3)).is(3) ;
                t.expectM(B.lastIndexOf(P3)).is(3) ;
                t.expectN(B.lastIndexOf(P0)).is(6) ;

                const base = TSData.fromString('1234512345') ;
                if (t.expectZ(base).OK()) {
                    base!.length = 8 ;
                    t.expectO(base!.indexOf(P3)).is(2) ;
                    t.expectP(base!.indexOf(P3,2)).is(2) ;
                    t.expectQ(base!.indexOf(P3,3)).is(-1) ;
                    t.expectR(base!.lastIndexOf(P3)).is(2) ;    
                }            
            }
        }) ;

        group.unary('TSData.compare()', async (t) => {
            t.expect0(N.compare(D)).is(Same) ;
            t.expect1(N).lt(D1) ;
            t.expect2(N).lte(D1) ;
            t.expect3(D1).gt(N) ;
            t.expect4(D1).gte(N) ;
            t.expect5(D).gte(N) ;
            t.expect6(D).lte(N) ;
        }) ;

        group.unary('TSData.traillingFunctions()...', async (t) => {
            const WSS = TSData.fromString(b+FoundationBynaryStrictWhiteSpaces) ;
            const NL1 = TSData.fromString(b+FoundationBinaryNewLines) ;

            if (t.expect0(WSS).OK() && t.expect1(NL1).OK()) {
                const WS = new TSData(Buffer.from(b+FoundationBinaryWhiteSpaces, "binary")) ;
                const NL0 = new TSData(Buffer.from(b+FoundationBinaryNewLines, "binary")) ;
                const NL2 = NL0.clone() ;
                const Z = new TSData(Buffer.from(b+"\u0000\u0000\u0000\u0000\u0000", "binary")) ;
                
                t.expectA(NL0).is(NL1) ;
                WS.removeTraillingSpaces() ;
                NL1!.removeTraillingNewLines() ;
                WSS!.removeTraillingStrictSpaces() ;
                NL2.removeTraillingStrictSpaces() ; // should remove nothing
                Z.removeTraillingZeros() ;

                t.expectB(WS).is(D) ;
                t.expectC(NL1).is(D) ;
                t.expectD(WSS).is(D) ;
                t.expectE(NL2).is(NL0) ;
                t.expectF(Z).is(D) ;
                t.expectG(Z).is(B) ;
    
                NL2.removeTraillingSpaces() ;
                t.expectH(NL2).is(B) ;
            }
        }) ;

        group.unary('TSData.splice()', async (t) => {
            const s = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' ;
            const data = TSData.fromString('ABCDEFGHIJKLMNOPQRSTUVWXYZ') ;
            const source = TSData.fromString('0123456789')
            if (t.expect0(data?.length).is(26)) {
                let d = data!.clone() ;
                t.expect1(d.splice(26, 100, source, 1, 10).toString()).is(s+'123456789') ;
                
                d = data!.clone() ;
                t.expect2(d.splice(28, 100, source, 3, 50)).is(TSData.fromString(s+'\u0000\u00003456789')) ;
                
                d = data!.clone() ;
                t.expect3(d.splice(16, 100, source, 3, 50).toString()).is('ABCDEFGHIJKLMNOP3456789') ;

                d = data!.clone() ;
                t.expect4(d.splice(16, 10, source, 3, 50).toString()).is('ABCDEFGHIJKLMNOP3456789') ;

                d = data!.clone() ;
                t.expect5(d.splice(16, 8, source, 3, 50).toString()).is('ABCDEFGHIJKLMNOP3456789YZ') ;

                d = data!.clone() ;
                t.expect6(d.splice(16, 8, source, 0, 10).toString()).is('ABCDEFGHIJKLMNOP0123456789YZ') ;

                d = data!.clone() ;
                t.expect7(d.splice(16, 8, source, 0, 4).toString()).is('ABCDEFGHIJKLMNOP0123YZ') ;

                d = data!.clone() ;
                t.expect8(d.splice(16, 8, source, 0, 8).toString()).is('ABCDEFGHIJKLMNOP01234567YZ') ;

                d = data!.clone() ;
                t.expect9(d.splice(0, 2, source).toString()).is('0123456789CDEFGHIJKLMNOPQRSTUVWXYZ') ;

                d = data!.clone() ;
                t.expectA(d.splice(15, 2).toString()).is('ABCDEFGHIJKLMNORSTUVWXYZ') ;

                d = data!.clone() ;
                t.expectB(d.splice(15, 2, null,3, 100).toString()).is('ABCDEFGHIJKLMNORSTUVWXYZ') ;

                d = data!.clone() ;
                t.expectC(d.splice(15, 0, source).toString()).is('ABCDEFGHIJKLMNO0123456789PQRSTUVWXYZ') ;

                d = data!.clone() ;
                t.expectD(d.splice(15, 0, source, 4).toString()).is('ABCDEFGHIJKLMNO456789PQRSTUVWXYZ') ;

                d = data!.clone() ;
                t.expectE(d.splice(28, 100, source, 3, 50, 9)).is(TSData.fromString(s+'\t\t3456789')) ;
            }
        }) ;

        // regression: _insideCopy() with a plain number[] / bare Uint8Array source
        // (not a Buffer/TSData) used to offset the write by `sourceStart`
        group.unary('splice() / appendBytes() / replaceBytes() with a non-Buffer byte source', async (t) => {
            // bare Uint8Array, replace-and-grow (deleteCount < len, sourceStart 0)
            t.expect0(TSData.fromString('ABCDEF').splice(1, 2, new Uint8Array([0x78, 0x79, 0x7a])).toString()).is('AxyzDEF') ;
            // bare Uint8Array with sourceStart > 0
            const d = new TSData() ;
            d.appendBytes(new Uint8Array([1, 2, 3, 4, 5]), 2, 5) ;
            t.expect1(Array.from(d.mutableBuffer)).is([3, 4, 5]) ;
            // plain number[] with sourceStart > 0
            const e = new TSData() ;
            e.appendBytes([9, 8, 7, 6, 5] as any, 1, 4) ;
            t.expect2(Array.from(e.mutableBuffer)).is([8, 7, 6]) ;
            // replaceBytes with a bare Uint8Array slice
            const f = TSData.fromString('ABCDEFGH') ;
            f.replaceBytes(new Uint8Array([9, 8, 7, 6]), 2, 1, 3) ;
            t.expect3(Array.from(f.mutableBuffer)).is([65, 66, 8, 7, 69, 70, 71, 72]) ;
            // Buffer source stays correct (uses Buffer.copy path)
            const g = new TSData() ;
            g.appendBytes(Buffer.from([1, 2, 3, 4, 5]), 2, 5) ;
            t.expect4(Array.from(g.mutableBuffer)).is([3, 4, 5]) ;
        }) ;
    }),

    TSTest.group("Testing data writing and reading", async (group) => {
        const N = 50 ;
        group.unary('BE appending and reading', async(t) => {
            const dataList:Uint8Array[] = []
            const data:TSData = new TSData() ;
            let total = 0 ;
            //console.log('------------------------------') ;
            for (let i = 0 ; i < N ; i++) {
                const length = $random(1022)+2 ;
                //console.log(i,':', length) ;
                const source = $randomBytes(length) ;
                //console.log('+') ;
                dataList[i] = source ;
                data.appendUInt32BE(length) ;
                total += 4 ;
                if (!t.expect(data.length, 'ulen'+i).is(total)) { 
                    $hexadump(source) ;
                    $hexadump(data) ;
                    break ; 
                }
                //console.log('++') ;
                data.appendData(source) ;
                total += length ;
                //console.log('+++', total) ;
                if (!t.expect(data.length, 'tlen'+i).is(total)) { break ; }
            }
        }) ;
        group.unary('uint8ArraySliice() method', async(t) => {
            t.expect0(TSData.fromHexaString("00112233445566")!.uint8ArraySlice(1,4)).is(Uint8Array.from([0x11,0x22,0x33])) ;
        }) ;
        group.unary('setUint8() and getUint8() methods', async(t) => {
            const data = new TSData() ;
            data.setUint8(0, 0xAA); data.setUint8(5, 0xBB);
            t.expect0(data).is(TSData.fromHexaString("AA00000000BB")) ;
            t.expect1(data.getUint8(0)).is(0xAA) ;
            t.expect2(data.getUint8(5)).is(0xBB) ;
            t.expect3(data.getUint8(1)).is(0x00) ;
        }) ;
        group.unary('data.length = n', async(t) => {
            const data = new TSData() ;
            data.length = 10 ;
            t.expect0(data.length).is(10) ;
            t.expect1(data).is(TSData.fromHexaString("00000000000000000000")) ;
            data.length = 5 ;
            t.expect2(data.length).is(5) ;
            t.expect3(data).is(TSData.fromHexaString("0000000000")) ;
        }) ;
        group.unary('check TSData boundaries using number reading methods', async(t) => {
            const data = new TSData() ;
            data.appendByte(0x41 as uint8) ;
            t.expect0(() => data.readUInt8(10)).toThrow(/out of bound/) ;   // [0,1]
            t.expect1(() => data.getUint32(20)).toThrow(/out of bound/) ;
            t.expect2(data.readUInt8()).is(65) ;
            t.expect3(data.getInt8(0)).is(65) ;
            t.expect4(() => data.readUInt32BE()).toThrow(/out of bound/) ;  // needs 4 bytes, only 1
            data.length = 10 ;
            t.expect5(data.readUInt32LE()).is(65) ;
        }) ;
        group.unary('typed 16/32/64-bit and float accessors round-trip', async(t) => {
            const d = new TSData() ;
            d.appendInt16BE(-1234) ;
            d.appendUInt16LE(0xBEEF) ;
            d.appendInt32BE(-70000) ;
            d.appendUInt32LE(0xDEADBEEF) ;
            d.appendFloatBE(0.5) ;
            d.appendDoubleLE(3.5) ;
            d.appendBigInt64BE(-1n) ;
            d.appendBigUInt64LE(0x0102030405060708n) ;
            t.expect0(d.length).is(2 + 2 + 4 + 4 + 4 + 8 + 8 + 8) ;

            let o = 0 ;
            t.expect1(d.getInt16(o)).is(-1234) ;                     o += 2 ;
            t.expect2(d.getUint16(o, true)).is(0xBEEF) ;             o += 2 ;
            t.expect3(d.getInt32(o)).is(-70000) ;                    o += 4 ;
            t.expect4(d.getUint32(o, true)).is(0xDEADBEEF) ;         o += 4 ;
            t.expect5(d.getFloat32(o)).is(0.5) ;                     o += 4 ;
            t.expect6(d.getFloat64(o, true)).is(3.5) ;               o += 8 ;
            t.expect7(d.getBigInt64(o)).is(-1n) ;                    o += 8 ;
            t.expect8(d.getBigUint64(o, true)).is(0x0102030405060708n) ;

            // the read*LE/BE wrappers must agree with the get* methods
            t.expect9(d.readInt16BE(0)).is(d.getInt16(0, false)) ;
            t.expectA(d.readUInt32LE(6)).is(d.getUint32(6, true)) ;
        }) ;
        group.unary('set*() grows the data and zero-fills the gap', async(t) => {
            const d = new TSData() ;
            d.setUint32(4, 0x11223344) ;      // the [0,4[ gap must be zero-filled
            t.expect0(d.length).is(8) ;
            t.expect1(d).is(TSData.fromHexaString("0000000011223344")) ;
            d.setUint8(0, 0xFF) ;             // must not disturb the rest of the buffer
            t.expect2(d).is(TSData.fromHexaString("FF00000011223344")) ;
        }) ;
        group.unary('_mayGrowAtOffset() zero-fills the gap at buf[i], not buf[0]', async(t) => {
            const a = new TSData() ;
            a.setInt8(3, 0x7F) ;             // [0,3[ must become 0x00, byte 3 = 0x7F
            t.expect0(a.length).is(4) ;
            t.expect1(a).is(TSData.fromHexaString("0000007F")) ;

            const b = new TSData() ;
            b.appendByte(0x11 as uint8) ;
            b.setUint16(5, 0xAABB, false) ;  // keep byte 0, zero-fill [1,5[
            t.expect2(b).is(TSData.fromHexaString("1100000000AABB")) ;

            const c = TSData.fromString("0123456789ABCDEFGHIJ") ; // len 20
            c.length = 5 ;                    // "01234"
            c.length = 15 ;                   // fix: _willGrow(n-_len), gap must be zeroed (not stale "56789...")
            t.expect3(c).is(TSData.fromHexaString("303132333400000000000000000000")) ;
        }) ;
        group.unary('typed read accessors reject out-of-bound / invalid offsets', async(t) => {
            const d = TSData.fromString("ABCD")! ;   // len 4
            // exact fits succeed
            t.expect0(d.getUint32(0)).is(0x41424344) ;
            t.expect1(d.getInt16(2)).is(0x4344) ;
            // reads running past this.length throw -- including the 8-byte accessors
            t.expect2(() => d.getUint32(1)).toThrow() ;      // 1+4 > 4
            t.expect3(() => d.getInt16(3)).toThrow() ;       // 3+2 > 4
            t.expect4(() => d.getFloat64(0)).toThrow() ;     // needs 8
            t.expect5(() => d.getBigInt64(0)).toThrow() ;
            t.expect6(() => d.getBigUint64(0)).toThrow() ;
            t.expect7(() => d.getInt8(4)).toThrow() ;        // offset == length
            // invalid offsets are rejected, not silently coerced
            t.expect8(() => d.getUint8(-1)).toThrow() ;
            t.expect9(() => d.getUint8(1.5)).toThrow() ;
            t.expectA(() => d.getUint8(NaN)).toThrow() ;
        }) ;
        group.unary('uint8ArraySlice() returns an independent, right-sized copy', async(t) => {
            const d = TSData.fromHexaString("00112233")! ;
            const empty = d.uint8ArraySlice(2, 2) ;
            t.expect0(empty instanceof Uint8Array).true() ;
            t.expect1(empty.length).is(0) ;
            const mid = d.uint8ArraySlice(1, 3) ;
            t.expect2(mid).is(Uint8Array.from([0x11, 0x22])) ;   // fix: was returning an empty array
            mid[0] = 0xFF ;                                      // must not write back into d
            t.expect3(d).is(TSData.fromHexaString("00112233")) ;
            t.expect4(d.uint8ArraySlice().length).is(4) ;        // no args => whole significant range
        }) ;
        group.unary('TSData.fromBase64String() / fromBase64URLString()', async(t) => {
            const src = TSData.fromString("Hello, World! foundation-ts") ;
            t.expect0(TSData.fromBase64String(src.base64String())).is(src) ;
            t.expect1(TSData.fromBase64URLString(src.base64URL())).is(src) ;
            t.expect2(TSData.fromBase64String(null)).null() ;
            t.expect3(TSData.fromBase64URLString(undefined)).null() ;
            t.expect4(TSData.fromHexaString("nothexa")).null() ;
        }) ;
        group.unary('BE appending and reading', async(t) => {
            const dataList:Uint8Array[] = []
            const data:TSData = new TSData() ;
            let total = 0 ;
            for (let i = 0 ; i < N ; i++) {
                const length = $random(1024) ;
                const source = $randomBytes(length) ;
                dataList[i] = source ;
                data.appendUInt32BE(source.length) ;
                total += 4 ;
                data.appendData(source) ;
                total += source.length ;
            }
            if (t.expect0(data.length).is(total)) {
                let pos = 0 ;
                for (let i = 0 ; i < N ; i++) {
                    const len = data.readUInt32BE(pos) ; pos += 4 ;
                    const original = dataList[i] ;   
                    if (!t.expect(len,'bel'+i).is(original.length)) { break ; }
                    const buf = data.uint8ArraySlice(pos, pos+len) ;
                    if (!t.expect(buf,'beb'+i).is(dataList[i])) { break ; }
                    pos += len ;
                }
            }
        }) ;
        group.unary('LE appending and reading', async(t) => {
            const dataList:Uint8Array[] = []
            const data:TSData = new TSData() ;
            let total = 0 ;
            for (let i = 0 ; i < N ; i++) {
                const length = $random(1024) ;
                const source = $randomBytes(length) ;
                dataList[i] = source ;
                data.appendUInt32LE(source.length) ;
                total += 4 ;
                data.appendData(source) ;
                total += source.length ;
            }
            if (t.expect0(data.length).is(total)) {
                let pos = 0 ;
                for (let i = 0 ; i < N ; i++) {
                    const len = data.readUInt32LE(pos) ; pos += 4 ;
                    const original = dataList[i] ;   
                    if (!t.expect(len,'lel'+i).is(original.length)) { break ; }
                    const buf = data.uint8ArraySlice(pos, pos+len) ;
                    if (!t.expect(buf,'leb'+i).is(dataList[i])) { break ; }
                    pos += len ;
                }
            }
        }) ;
    }), 
    TSTest.group("Testing data manipulations functions", async (group) => {
        group.unary('$bufferFromArrayBuffer() and $arrayBufferFromBytes() functions', async(t) => {
            const a = new ArrayBuffer(4);
            const view = new Uint8Array(a);
            view[0] = 65; view[1] = 66; view[2] = 67; view[3] = 68;
            const b = $bufferFromArrayBuffer(a) ;
            const c = Buffer.from("ABCD") ;
            const d = $arrayBufferFromBytes(c) ;
            t.expect0(b).is(c) ;
            t.expect1(d).is(a) ;
            const ta = new TSData(a) ;
            const tb = new TSData(b) ;
            const tc = new TSData(c) ;
            const td = new TSData(d) ;
            t.expect2(ta).is(tb) ;
            t.expect3(ta).is(tc) ;
            t.expect4(ta).is(td) ;
        }) ;
    }),

    TSTest.group("TSData — read/write helpers, iterators, search", async (group) => {

        group.unary('Buffer-style read*/write* round-trips (LE & BE)', async (t) => {
            const d = new TSData(64) ;
            d.writeInt8(-5, 0) ;        t.expect0(d.readInt8(0)).is(-5) ;
            d.writeUInt8(250, 1) ;      t.expect1(d.readUInt8(1)).is(250) ;
            d.writeInt16LE(-1000, 2) ;  t.expect2(d.readInt16LE(2)).is(-1000) ;
            d.writeInt16BE(-1000, 4) ;  t.expect3(d.readInt16BE(4)).is(-1000) ;
            d.writeUInt16LE(60000, 6) ; t.expect4(d.readUInt16LE(6)).is(60000) ;
            d.writeUInt16BE(60000, 8) ; t.expect5(d.readUInt16BE(8)).is(60000) ;
            d.writeInt32LE(-70000, 10) ;  t.expect6(d.readInt32LE(10)).is(-70000) ;
            d.writeInt32BE(-70000, 14) ;  t.expect7(d.readInt32BE(14)).is(-70000) ;
            d.writeUInt32LE(4000000000, 18) ; t.expect8(d.readUInt32LE(18)).is(4000000000) ;
            d.writeUInt32BE(4000000000, 22) ; t.expect9(d.readUInt32BE(22)).is(4000000000) ;
            d.writeBigInt64LE(-5n, 26) ;   t.expectA(d.readBigInt64LE(26)).is(-5n) ;
            d.writeBigInt64BE(-5n, 34) ;   t.expectB(d.readBigInt64BE(34)).is(-5n) ;
            d.writeBigUInt64LE(9n, 42) ;   t.expectC(d.readBigUInt64LE(42)).is(9n) ;
            d.writeBigUInt64BE(9n, 50) ;   t.expectD(d.readBigUInt64BE(50)).is(9n) ;
            d.writeFloatLE(1.5, 0) ;       t.expectE(d.readFloatLE(0)).is(1.5) ;
            d.writeFloatBE(1.5, 4) ;       t.expectF(d.readFloatBE(4)).is(1.5) ;
            d.writeDoubleLE(3.25, 8) ;     t.expectG(d.readDoubleLE(8)).is(3.25) ;
            d.writeDoubleBE(3.25, 16) ;    t.expectH(d.readDoubleBE(16)).is(3.25) ;
            t.expectI(d.writeInt8(1) === d).true() ;   // chainable
        }) ;

        group.unary('entries() / keys() / values() / buffer / equals()', async (t) => {
            const d = TSData.fromString('AB') ;   // [65, 66]
            t.expect0(Array.from(d.keys())).is([0, 1]) ;
            t.expect1(Array.from(d.values())).is([65, 66]) ;
            t.expect2(Array.from(d.entries())).is([[0, 65], [1, 66]]) ;
            t.expect3(Buffer.isBuffer(d.buffer)).true() ;
            t.expect4(d.equals(new Uint8Array([65, 66]))).true() ;
            t.expect5(d.equals(new Uint8Array([65, 67]))).false() ;
        }) ;

        group.unary('includes() / startsWith() / endsWith()', async (t) => {
            const d = TSData.fromString('hello world') ;
            t.expect0(d.includes('lo w')).true() ;
            t.expect1(d.includes('xyz')).false() ;
            t.expect2(d.includes(111)).true() ;                 // byte 'o'
            t.expect3(d.startsWith('hello')).true() ;
            t.expect4(d.startsWith('world')).false() ;
            t.expect5(d.endsWith('world')).true() ;
            t.expect6(d.endsWith('hello')).false() ;
            t.expect7(d.startsWith(104)).true() ;               // byte 'h'
            t.expect8(d.includes(null)).false() ;
        }) ;

        group.unary('replaceBytes() / truncateBy()', async (t) => {
            const d = TSData.fromString('ABCDEFGH') ;
            d.replaceBytes(new Uint8Array([0x78, 0x79]), 2) ;   // overwrite "xy" at offset 2
            t.expect0(d.toString()).is('ABxyEFGH') ;
            const g = TSData.fromString('ABCD') ;
            g.replaceBytes(new Uint8Array([1, 2, 3, 4, 5, 6]), 2) ; // grows the data
            t.expect1(Array.from(g.mutableBuffer)).is([65, 66, 1, 2, 3, 4, 5, 6]) ;
            const e = TSData.fromString('123456789') ;
            e.truncateBy(4) ;
            t.expect2(e.toString()).is('12345') ;
            e.truncateBy(100) ;                                 // clamps
            t.expect3(e.length).is(0) ;
        }) ;

        group.unary('chainable append* number writers', async (t) => {
            const d = new TSData() ;
            d.appendInt8(-1)
             .appendUInt8(255)
             .appendInt16LE(-2)
             .appendUInt16BE(513)
             .appendInt32LE(7)
             .appendBigInt64LE(5n)
             .appendBigUInt64BE(9n)
             .appendFloatLE(1.5)
             .appendDoubleBE(2.5) ;
            t.expect0(d.length).is(1 + 1 + 2 + 2 + 4 + 8 + 8 + 4 + 8) ;
            t.expect1(d.getInt8(0)).is(-1) ;
            t.expect2(d.getUint16(4, TSEndianness.BE)).is(513) ;
            t.expect3(Number(d.getBigInt64(10, TSEndianness.LE))).is(5) ;
            t.expect4(d.getFloat64(30, TSEndianness.BE)).is(2.5) ;
        }) ;

        group.unary('crc / hash / XOR instance helpers and to* exporters', async (t) => {
            const h = TSData.fromString('123456789') ;
            t.expect0(h.crc16()).is(0xBB3D) ;
            t.expect1(h.crc32()).is(0xCBF43926) ;
            t.expect2(h.hash()).is('15e2b0d3c33891ebb0f1ef609ec419420c20e320ce94c65fbc8c3312448eb225') ;
            t.expect3(h.slowhash({ dataOutput:true }) instanceof Uint8Array).true() ;
            t.expect4(TSData.fromString('AB').XOR(new Uint8Array([1, 1])).toString('hex')).is('4043') ;
            t.expect5(TSData.fromString('AB').toJSON()).is({ type:'Buffer', data:[65, 66] }) ;
            t.expect6(Array.from(TSData.fromString('ABC').toBytes())).is([65, 66, 67]) ;
            t.expect7(TSData.fromString('ABC').toArray(1)).is([66, 67]) ;
            t.expect8(TSData.fromString('ABC').toArrayBuffer().byteLength).is(3) ;
            t.expect9(TSData.fromString('ABC').toUint8Array().length).is(3) ;
            t.expectA(TSData.fromString('ABC').toBuffer().toString()).is('ABC') ;
            t.expectB(TSData.fromString('ABC').compareToData(Buffer.from('ABC'))).is(Same) ;
            t.expectC(TSData.fromString('ABC').compareToData(Buffer.from('ABD'))).is(Ascending) ;
            t.expectD(TSData.fromString('ABC').compareToData(null)).undef() ;
            t.expectE(TSData.fromString('ABC').isEqualToData(Buffer.from('ABC'))).true() ;
            t.expectF(TSData.fromString('ABC').isEqualToData(null)).false() ;
        }) ;

        group.unary('mutableBuffer is cached but stays consistent through every mutation', async (t) => {
            const d = new TSData(64) ;
            d.appendBytes(new Uint8Array([1, 2, 3, 4])) ;

            const a = d.mutableBuffer ;
            const b = d.mutableBuffer ;
            t.expect0(a === b).true() ;                          // cached : same object when nothing changed
            t.expect1(Array.from(a)).is([1, 2, 3, 4]) ;

            // in-place byte change : the cached view is live, no new object needed
            d.setUint8(0, 9) ;
            t.expect2(d.mutableBuffer === a).true() ;
            t.expect3(Array.from(d.mutableBuffer)).is([9, 2, 3, 4]) ;

            // append without reallocation : length changed -> fresh view, right bytes
            d.appendBytes(new Uint8Array([5, 6])) ;
            const c = d.mutableBuffer ;
            t.expect4(c === a).false() ;
            t.expect5(Array.from(c)).is([9, 2, 3, 4, 5, 6]) ;

            // shrink via removeTraillingZeros / truncateBy
            d.appendByte(0 as any) ;
            d.removeTraillingZeros() ;
            t.expect6(Array.from(d.mutableBuffer)).is([9, 2, 3, 4, 5, 6]) ;
            d.truncateBy(2) ;
            t.expect7(Array.from(d.mutableBuffer)).is([9, 2, 3, 4]) ;

            // force a reallocation (grow past capacity) : view must follow the new buffer
            const big = new Uint8Array(4096) ; for (let i = 0 ; i < 4096 ; i++) { big[i] = i & 0xff ; }
            d.appendBytes(big) ;
            t.expect8(d.mutableBuffer.length).is(4 + 4096) ;
            t.expect9(d.mutableBuffer[4100 - 1]).is((4096 - 1) & 0xff) ;

            // splice (insert + grow) then length setter
            const e = TSData.fromString('ABCDEF') ;
            const v0 = e.mutableBuffer ;
            e.splice(3, 0, new Uint8Array([0x78, 0x79, 0x7a])) ; // insert "xyz" -> "ABCxyzDEF"
            t.expectA(e.mutableBuffer === v0).false() ;
            t.expectB(e.toString()).is('ABCxyzDEF') ;
            e.length = 4 ;
            t.expectC(Array.from(e.mutableBuffer)).is([65, 66, 67, 0x78]) ;
        }) ;

        if (!$inbrowser()) {
            group.unary('fromFile() / writeToFile() / fullWriteToFile() (node only)', async (t) => {
                const p = $temporarypath('.bin') ;
                const d = TSData.fromString('persisted payload') ;
                t.expect0(d.writeToFile(p)).true() ;
                t.expect1(TSData.fromFile(p)?.toString()).is('persisted payload') ;
                const [ok] = TSData.fromString('again').fullWriteToFile(p, {}) ;
                t.expect2(ok).true() ;
                t.expect4(TSData.fromFile(p)?.toString()).is('again') ;
                t.expect5(TSData.fromFile('/no/such/file/at/all')).null() ;
                $removeFile(p) ;
            }) ;
        }
    })
] ;

