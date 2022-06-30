
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

        group.unary('verifying TSData.compare()', async (t) => {
            t.expect0(N.compare(D)).toBe(Same) ;
            t.expect1(N).lt(D1) ;
            t.expect2(N).lte(D1) ;
            t.expect3(D1).gt(N) ;
            t.expect4(D1).gte(N) ;
            t.expect5(D).gte(N) ;
            t.expect6(D).lte(N) ;
        }) ;

    })
] ;

