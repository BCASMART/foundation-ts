
import { $arrayBufferFromBuffer, $bufferFromArrayBuffer } from '../src/data';
import { FoundationBinaryWhiteSpaces, FoundationBynaryStrictWhiteSpaces, FoundationNewLines } from '../src/string_tables';
import { TSData } from '../src/tsdata';
import { TSTest } from '../src/tstester';
import { Same, uint8 } from '../src/types';

export const dataGroups = [
    TSTest.group("Testing TSData", async (group) => {
        const b = '0123456789' ;
        const sup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz' ;
        const SUP = Buffer.from(sup) ;
        const B = Buffer.from(b) ;
        const B1 = Buffer.from(b+sup) ;
        const D = new TSData(B) ;
        const D1 = new TSData(D) ;
        const F = new TSData(2) ;

        F.appendAsciiString(b) ;
        F.appendAsciiString(sup) ;
        F.replaceAsciiString('@', F.length+1) ;

        D1.appendData(SUP) ;
        const E = D1.clone() ;
        const C = D1.clone() ;
        const N = D1.clone() ;
        const Z = D1.clone() ;

        E.setData(Buffer.from('@'), E.length+1) ;
        C.appendByte(0 as uint8) ;
        C.appendByte(0x40 as uint8) ;
        N.length = 10 ;
        Z.length = 0 ;

        group.unary('verifying buffer creation, setData(), appendByte() and setting length', async (t) => {
            t.expect0(D.toString()).toBe(B.toString()) ;
            t.expect1(D).toBe(B) ;
            t.expect2(D1).toBe(B1) ;
            t.expect3(E).toBe(C) ;
            t.expect4(F).toBe(C) ;
            t.expect5(N).toBe(D) ;
            t.expect6(Z).toBe(Buffer.from('')) ;
        }) ;

        group.unary('verifying TSData.slice()', async (t) => {
            t.expect0(D1.slice(0,10)).toBe(D) ;
            t.expect1(D1.slice(10)).toBe(SUP) ;
            t.expect2(D1.slice(100,100)).toBe(Buffer.from('')) ;
            t.expect3(D1.slice(10,100)).toBe(SUP) ;
        }) ;

        group.unary('verifying TSData.indexof() and .lastIndexOf()', async(t) => {
            const partial = D.clone() ;
            const D8 =  TSData.fromBinaryString('01234567') ;
            const P0 = Buffer.from('67') ;
            const P1 = Buffer.from('678') ;
            const P2 = Buffer.from('89') ;
            const P3 = Buffer.from('34') ;
            const base = TSData.fromBinaryString('1234512345') ;
            base.length = 8 ;
            partial.length = 8 ;
            t.expect0(partial).toBe(D8) ;
            t.expect1(D8.indexOf(P0)).toBe(6) ;
            t.expect2(D8.indexOf(P1)).toBe(-1) ;
            t.expect3(partial.indexOf(P0)).toBe(6) ;
            t.expect4(partial.indexOf(P1)).toBe(-1) ;
            t.expect5(D8.lastIndexOf(P0)).toBe(6) ;
            t.expect6(D8.lastIndexOf(P1)).toBe(-1) ;
            t.expect7(partial.lastIndexOf(P0)).toBe(6) ;
            t.expect8(partial.lastIndexOf(P1)).toBe(-1) ;
            t.expect9(D8.indexOf(P2)).toBe(-1) ;
            t.expectA(partial.indexOf(P2)).toBe(-1) ;
            t.expectB(D8.lastIndexOf(P2)).toBe(-1) ;
            t.expectC(partial.lastIndexOf(P2)).toBe(-1) ;
            t.expectD(D8.indexOf(D8)).toBe(0) ;
            t.expectE(partial.indexOf(D8)).toBe(0) ;
            t.expectF(D8.indexOf(partial)).toBe(0) ;
            t.expectG(D8.lastIndexOf(D8)).toBe(0) ;
            t.expectH(partial.lastIndexOf(D8)).toBe(0) ;
            t.expectI(D8.lastIndexOf(partial)).toBe(0) ;
            t.expectJ(D8.lastIndexOf(P3)).toBe(3) ;
            t.expectK(partial.lastIndexOf(P3)).toBe(3) ;
            t.expectL(D.lastIndexOf(P3)).toBe(3) ;
            t.expectM(B.lastIndexOf(P3)).toBe(3) ;
            t.expectN(B.lastIndexOf(P0)).toBe(6) ;
            t.expectO(base.indexOf(P3)).toBe(2) ;
            t.expectP(base.indexOf(P3,2)).toBe(2) ;
            t.expectQ(base.indexOf(P3,3)).toBe(-1) ;
            t.expectR(base.lastIndexOf(P3)).toBe(2) ;
        }) ;

        group.unary('verifying TSData.compare()', async (t) => {
            t.expect0(N.compare(D)).toBe(Same) ;
            t.expect1(N).lt(D1) ;
            t.expect2(N).lte(D1) ;
            t.expect3(D1).gt(N) ;
            t.expect4(D1).gte(N) ;
            t.expect5(D).gte(N) ;
            t.expect6(D).lte(N) ;
        }) ;
        group.unary('verifying TSData.traillingFunctions()...', async (t) => {
            const WS = new TSData(Buffer.from(b+FoundationBinaryWhiteSpaces, "binary")) ;
            const WSS = TSData.fromBinaryString(b+FoundationBynaryStrictWhiteSpaces) ;
            const NL0 = new TSData(Buffer.from(b+FoundationNewLines)) ;
            const NL1 = TSData.fromBinaryString(b+FoundationNewLines) ;
            const NL2 = NL0.clone() ;
            const Z = new TSData(Buffer.from(b+"\u0000\u0000\u0000\u0000\u0000")) ;
            
            t.expectA(NL0).toBe(NL1) ;

            WS.removeTraillingSpaces() ;
            NL1.removeTraillingNewLines() ;
            WSS.removeTraillingStrictSpaces() ;
            NL2.removeTraillingStrictSpaces() ; // should remove nothing
            Z.removeTraillingZeros() ;

            t.expect0(WS).toBe(D) ;
            t.expect1(NL1).toBe(D) ;
            t.expect2(WSS).toBe(D) ;
            t.expect3(NL2).toBe(NL0) ;
            t.expect4(Z).toBe(D) ;
            t.expect5(Z).toBe(B) ;

            NL2.removeTraillingSpaces() ;
            t.expect6(NL2).toBe(B) ;
        }) ;

    }),
    TSTest.group("Testing data manipulations functions", async (group) => {
        group.unary('Testing $bufferFromArrayBuffer() and $arrayBufferFromBuffer()', async(t) => {
            const a:Uint8Array = new Uint8Array([65,66,67,68]) ;
            const b = $bufferFromArrayBuffer(a) ;
            const c = Buffer.from("ABCD") ;
            const d = $arrayBufferFromBuffer(c) ;
            t.expect0(b).toBe(c) ;
            t.expect1(d).toBe(a) ;
            const ta = new TSData(a) ;
            const tb = new TSData(b) ;
            const tc = new TSData(c) ;
            const td = new TSData(d) ;
            t.expect2(ta).toBe(tb) ;
            t.expect3(ta).toBe(tc) ;
            t.expect4(ta).toBe(td) ;
        }) ;
    })
] ;

