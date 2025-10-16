import { $length } from '../src/commons';
import { $decodeBase64, $encodeBase64, $arrayBufferFromBytes, $arrayFromBytes, $bufferFromArrayBuffer, $bufferFromBytes, $uint8ArrayFromBytes, $uint32ArrayFromBuffer, $blobFromBytes, $bufferFromBlob, $decodeBase64URL } from '../src/data';
import { TSCharset } from '../src/tscharset';
import { TSTest } from '../src/tstester';

export const dataGroups = [
    TSTest.group("Testing simple level data manipulations functions", async (group) => {
        const a = new ArrayBuffer(4);
        const view = new Uint8Array(a);
        view[0] = 65; view[1] = 66; view[2] = 67; view[3] = 68;
        const c = Buffer.from("ABCD") ;
        const b64 = 'JVBERi0xLjQKJcKlwrEKCgoKMSAwIG9iagogIDw8IC9UeXBlIC9DYXRhbG9nCiAgICAgL1BhZ2VzIDIgMCBSCiAgPj4KZW5kb2JqCgoyIDAgb2JqCiAgPDwgL1R5cGUgL1BhZ2VzCiAgICAgL0tpZHMgWzMgMCBSXQogICAgIC9Db3VudCAxCiAgICAgL01lZGlhQm94IFswIDAgMzAwIDE0NF0KICA+PgplbmRvYmoKCjMgMCBvYmoKICA8PCAgL1R5cGUgL1BhZ2UKICAgICAgL1BhcmVudCAyIDAgUgogICAgICAvUmVzb3VyY2VzCiAgICAgICA8PCAvRm9udAogICAgICAgICAgIDw8IC9GMQogICAgICAgICAgICAgICA8PCAvVHlwZSAvRm9udAogICAgICAgICAgICAgICAgICAvU3VidHlwZSAvVHlwZTEKICAgICAgICAgICAgICAgICAgL0Jhc2VGb250IC9UaW1lcy1Sb21hbgogICAgICAgICAgICAgICA+PgogICAgICAgICAgID4+CiAgICAgICA+PgogICAgICAvQ29udGVudHMgNCAwIFIKICA+PgplbmRvYmoKCjQgMCBvYmoKICA8PCAvTGVuZ3RoIDU1ID4+CnN0cmVhbQogIEJUCiAgICAvRjEgMTggVGYKICAgIDAgMCBUZAogICAgKEhlbGxvIFdvcmxkKSBUagogIEVUCmVuZHN0cmVhbQplbmRvYmoKCnhyZWYKMCA1CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAxOCAwMDAwMCBuIAowMDAwMDAwMDc3IDAwMDAwIG4gCjAwMDAwMDAxNzggMDAwMDAgbiAKMDAwMDAwMDQ1NyAwMDAwMCBuIAp0cmFpbGVyCiAgPDwgIC9Sb290IDEgMCBSCiAgICAgIC9TaXplIDUKICA+PgpzdGFydHhyZWYKNTY1CiUlRU9GCg==' ;        
        const u8array = $decodeBase64(b64) ;

        group.unary('x.isGenuineUint8Array() method', async(t) => {
            t.expect0(view.isGenuineUint8Array()).true() ;
            t.expect1(c.isGenuineUint8Array()).false() ;
        }) ;
        group.unary('$bufferFromArrayBuffer() and $arrayBufferFromBytes() functions', async(t) => {
            const b = $bufferFromArrayBuffer(a) ;
            const d = $arrayBufferFromBytes(c) ;
            t.expect0(b).is(c) ;
            t.expect1(d).is(a) ;
        }) ;

        group.unary('$bufferFromBytes(), $uint8ArrayFromBytes(), $arrayFromBytes() functions', async(t) => {
            const buf = $bufferFromBytes(view) ;
            const u8a = $uint8ArrayFromBytes(view, { forceCopy:true }) ;
            const bytes = $arrayFromBytes(view) ;

            t.expect0(buf).is(a) ;
            t.expect1(u8a).is(a) ;
            t.expect2($arrayFromBytes(buf)).is(bytes) ;
            t.expect3($arrayFromBytes(u8a)).is(bytes) ;
            t.expect4(buf.isGenuineUint8Array()).false() ;
            t.expect5(u8a.isGenuineUint8Array()).true() ;
        }) ;

        group.unary("$decodeBase64() and $encodeBase64() functions", async(t) => {
            const utf8String = "âêîôûäëïöüÂÊÎÔÛÄËÏÖÜàèìòùÀÈÌÒÙñÑãÃõÕÁÉÍÓÚáéíóú" ;
            const utf8Str64 = "w6LDqsOuw7TDu8Okw6vDr8O2w7zDgsOKw47DlMObw4TDi8OPw5bDnMOgw6jDrMOyw7nDgMOIw4zDksOZw7HDkcOjw4PDtcOVw4HDicONw5PDmsOhw6nDrcOzw7o=" ;
            const utf8Str64URL = "w6LDqsOuw7TDu8Okw6vDr8O2w7zDgsOKw47DlMObw4TDi8OPw5bDnMOgw6jDrMOyw7nDgMOIw4zDksOZw7HDkcOjw4PDtcOVw4HDicONw5PDmsOhw6nDrcOzw7o" ;
            const uft8Array = TSCharset.utf8Charset().uint8ArrayFromString(utf8String) ;
            t.expect0(u8array).is(Buffer.from(b64, 'base64')) ;
            const b64_2 = $encodeBase64(u8array) ;
            t.expect1(b64_2).is(b64) ;
    
            const str = 'This is a string' ;
            const str64 = $encodeBase64(str) ;
            t.expect2(str64).is(Buffer.from(str, 'binary').toString('base64')) ;
            t.expect3(b64_2.decodeBase64()).is(u8array) ;
            t.expect4(b64_2.decodeBase64().base64String()).is(b64_2) ;
            t.expect5(u8array.base64String().decodeBase64()).is(u8array) ;

            let utf64 = utf8String.base64String() ;
            t.expect6(utf64).isnot(utf8Str64) ;
            utf64 = utf8String.base64String(TSCharset.utf8Charset()) ;
            t.expect7(utf64).is(utf8Str64) ;
            t.expect8($decodeBase64(utf64)).is(uft8Array) ;

            utf64 = utf8String.base64URL() ;
            t.expect9(utf64).isnot(utf8Str64URL) ;
            utf64 = utf8String.base64URL(TSCharset.utf8Charset()) ;
            t.expectA(utf64).is(utf8Str64URL) ;
            const durl64 = $decodeBase64URL(utf64) ;
            t.expectB(TSCharset.utf8Charset().stringFromData(durl64)).is(utf8String) ;
            t.expectC(durl64).is(uft8Array) ;

        }) ;

        group.unary('blob conversion functions', async t => {
            const blob = $blobFromBytes(u8array) ;
            const buf = await $bufferFromBlob(blob) ;
            if (t.expect0(buf).OK()) {
                t.expect1($length(buf)).is($length(blob)) ;
                const b64_2 = $encodeBase64(buf!) ;
                t.expect2(b64_2).is(b64) ; 
            }
        }) ;

        group.unary("$uint32ArrayFromBuffer() function", async(t) => {
            const bytes = [64,65,66,67,31,38,39,37] ;
            const base = Buffer.from(bytes) ;
            const full = Buffer.from([...bytes, 1, 2, 3, 4])
            const bufs  = [base, Buffer.from([...bytes, 1]),          Buffer.from([...bytes, 1, 2]),       Buffer.from([...bytes, 1, 2, 3]),    full] ;
            const pbufs = [base, Buffer.from([...bytes, 1, 0, 0, 0]), Buffer.from([...bytes, 1, 2, 0, 0]), Buffer.from([...bytes, 1, 2, 3, 0]), full] ;
            
            const nb    = [base.readUint32BE(0), base.readUint32BE(4)] ; 
            const refb0 = [nb, nb, nb, nb, [...nb, 0x01020304]] ;
            const refb  = [nb, [...nb, 0x01000000], [...nb, 0x01020000], [...nb, 0x01020300], [...nb, 0x01020304]] ;
            const nl    = [base.readUint32LE(0), base.readUint32LE(4)] ; 
            const refl0 = [nl, nl, nl, nl, [...nl, 0x04030201]] ;
            const refl  = [nl, [...nl, 0x00000001], [...nl, 0x00000201], [...nl, 0x00030201], [...nl, 0x04030201]] ;

            for (let i = 0 ; i < 5 ; i++) {
                const A = $uint32ArrayFromBuffer(bufs[i], 'BE', true) ;
                const B =  $uint32ArrayFromBuffer(pbufs[i], 'BE', true) ;
                t.expect(A, `EBQ${i}`).is(B) ;
                t.expect(A, `RBQ${i}`).is(refb[i]) ;

                const C = $uint32ArrayFromBuffer(bufs[i], 'BE', false) ;
                const D = $uint32ArrayFromBuffer(bufs[i]) ;
                t.expect(C, `BBQ${i}`).is(refb0[i]) ;
                t.expect(C, `CBQ${i}`).is(D) ;

                const X = $uint32ArrayFromBuffer(bufs[i], 'LE', true) ;
                const Y =  $uint32ArrayFromBuffer(pbufs[i], 'LE', true) ;
                t.expect(X, `ELQ${i}`).is(Y) ;
                t.expect(X, `RLQ${i}`).is(refl[i]) ;

                const Z = $uint32ArrayFromBuffer(bufs[i], 'LE', false) ;
                t.expect(Z, `BLQ${i}`).is(refl0[i]) ;
            }
        }) ;
    })
] ;
