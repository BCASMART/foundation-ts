import { $length } from '../src/commons';
import { $randomBytes } from '../src/crypto';
import { $decodeBase64, $encodeBase64, $encodeBase64URL, __pureEncodeBase64, __pureDecodeBase64, $arrayBufferFromBlob, $arrayBufferFromBytes, $arrayFromBytes, $arrayFromDataLike, $arrayBufferFromDataLike, $arrayBufferFromHexaString, $blobFromDataLike, $bufferFromArrayBuffer, $bufferFromBytes, $bytesFromDataLike, $uint8ArrayFromBytes, $uint8ArrayFromBlob, $blobFromBytes, $bufferFromBlob, $decodeBase64URL, $decodeHexa, $dataXOR, $encodeHexa, $uint32ArrayFromDataLike, $uint32ArrayFromUint8Array, $encodeBytesToHexa, $bufferFromHexaString, $uint8ArrayFromHexaString } from '../src/data';
import { TSData } from '../src/tsdata';
import { $charsetFromBytes, TSCharset } from '../src/tscharset';
import { TSTest } from '../src/tstester';
import { TSEndianness } from '../src/types';

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
        
        group.unary("$uint8ArrayFromHexaString() function", async t => {
            for (let l = 1 ; l < 100 ; l++) {
                const rb = $randomBytes(l) ;
                const su = $encodeBytesToHexa(rb, false) ;
                const sl = $encodeBytesToHexa(rb, true) ;
                const sbu = $uint8ArrayFromHexaString(su, false) ;
                const sbl = $uint8ArrayFromHexaString(sl, false) ;
                const fbu = $uint8ArrayFromHexaString(su, true) ;
                const fbl = $uint8ArrayFromHexaString(sl, true) ;
                t.expect(sbu, `AH${l.fpad2()}-0`).is(rb) ;
                t.expect(sbl, `AH${l.fpad2()}-1`).is(rb) ;
                t.expect(fbu, `AH${l.fpad2()}-2`).is(rb) ;
                t.expect(fbl, `AH${l.fpad2()}-3`).is(rb) ;
            }
        }) ;
        group.unary("$bufferFromHexaString() function", async t => {
            for (let l = 1 ; l < 100 ; l++) {
                const rb = $randomBytes(l) ;
                const su = $encodeBytesToHexa(rb, false) ;
                const sl = $encodeBytesToHexa(rb, true) ;
                const sbu = Buffer.from(su, 'hex') ;
                const sbl = Buffer.from(sl, 'hex') ;
                const fbu = $bufferFromHexaString(su) ;
                const fbl = $bufferFromHexaString(sl) ;
                t.expect(sbu, `BH${l.fpad2()}-0`).is(rb) ;
                t.expect(sbl, `BH${l.fpad2()}-1`).is(rb) ;
                t.expect(fbu, `BH${l.fpad2()}-2`).is(rb) ;
                t.expect(fbl, `BH${l.fpad2()}-3`).is(rb) ;
            }
        }) ;

        group.unary("$uint32ArrayFromUint8Array() function", async(t) => {
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
                const A = $uint32ArrayFromUint8Array(bufs[i], TSEndianness.BE, true) ;
                const B =  $uint32ArrayFromUint8Array(pbufs[i], TSEndianness.BE, true) ;
                t.expect(A, `EBQ${i}`).is(B) ;
                t.expect(A, `RBQ${i}`).is(refb[i]) ;

                const C = $uint32ArrayFromUint8Array(bufs[i], TSEndianness.BE, false) ;
                const D = $uint32ArrayFromUint8Array(bufs[i]) ;
                t.expect(C, `BBQ${i}`).is(refb0[i]) ;
                t.expect(C, `CBQ${i}`).is(D) ;

                const X = $uint32ArrayFromUint8Array(bufs[i], TSEndianness.LE, true) ;
                const Y =  $uint32ArrayFromUint8Array(pbufs[i], TSEndianness.LE, true) ;
                t.expect(X, `ELQ${i}`).is(Y) ;
                t.expect(X, `RLQ${i}`).is(refl[i]) ;

                const Z = $uint32ArrayFromUint8Array(bufs[i], TSEndianness.LE, false) ;
                t.expect(Z, `BLQ${i}`).is(refl0[i]) ;
            }
        }) ;

        group.unary("hexa string parsing edge cases", async(t) => {
            t.expect0($bufferFromHexaString("DEADBEEF")).is(Buffer.from([0xDE, 0xAD, 0xBE, 0xEF])) ;
            t.expect1($bufferFromHexaString("deadbeef")).is(Buffer.from([0xDE, 0xAD, 0xBE, 0xEF])) ;
            t.expect2($bufferFromHexaString("")).is(Buffer.alloc(0)) ;    // empty string -> empty buffer
            t.expect3($bufferFromHexaString(undefined)).undef() ;
            t.expect4($bufferFromHexaString(null)).null() ;
            t.expect5($bufferFromHexaString("abc")).null() ;             // odd length
            t.expect6($bufferFromHexaString("xyzw")).null() ;           // non-hex chars
            t.expect7($bufferFromHexaString("0xDEAD")).null() ;         // no 0x prefix accepted
            t.expect8($bufferFromHexaString("DE AD")).null() ;          // no whitespace accepted
            t.expect9($uint8ArrayFromHexaString("nothex")).null() ;
            t.expectA($arrayBufferFromHexaString("41424344")).is($arrayBufferFromBytes(Buffer.from("ABCD"))) ;
            t.expectB($arrayBufferFromHexaString("zz")).null() ;
            // $encodeHexa round-trips, case controlled by the flag
            t.expectC($encodeHexa(Buffer.from([0x0A, 0xFF, 0x10]))).is("0AFF10") ;
            t.expectD($encodeHexa(Buffer.from([0x0A, 0xFF, 0x10]), true)).is("0aff10") ;
            t.expectE($decodeHexa($encodeHexa(Buffer.from("round-trip me")))).is(Buffer.from("round-trip me")) ;
            t.expectF(() => $decodeHexa("nothex")).toThrow() ;
        }) ;

        group.unary("$dataXOR() function", async(t) => {
            const a = Buffer.from([0xFF, 0x0F, 0xAA, 0x55]) ;
            const key = Buffer.from([0x0F, 0xF0, 0xAA, 0x55]) ;
            t.expect0($dataXOR(a, key)).is(Buffer.from([0xF0, 0xFF, 0x00, 0x00])) ;
            // XOR is its own inverse
            t.expect1($dataXOR($dataXOR(a, key), key)).is(a) ;
            // mismatched lengths: result length is max(), the longer tail passes through unchanged
            t.expect2($dataXOR(Buffer.from([0xFF, 0xAA, 0x0F]), Buffer.from([0x0F]))).is(Buffer.from([0xF0, 0xAA, 0x0F])) ;
            t.expect3($dataXOR(Buffer.from([0x0F]), Buffer.from([0xFF, 0xAA, 0x0F]))).is(Buffer.from([0xF0, 0xAA, 0x0F])) ;
            t.expect4($dataXOR(Buffer.alloc(0), Buffer.alloc(0)).length).is(0) ;
            t.expect5($dataXOR(new Uint8Array([1, 2]), Buffer.from([3, 4]))).is(Buffer.from([2, 6])) ;
        }) ;

        group.unary("charset detection ($charsetFromBytes / TSCharset.isUTF8Charset / charsetFromDataLike)", async(t) => {
            const utf8   = TSCharset.utf8Charset() ;
            const asciiBytes = Buffer.from("plain ascii text") ;
            const utf8Bytes  = utf8.uint8ArrayFromString("café €uro — déjà") ;
            const latin1Bytes = Buffer.from([0x41, 0xE9, 0xE8, 0xEA]) ;      // "Aéèê" in latin1, invalid UTF-8
            const utf16leBytes = Buffer.from([0xFF, 0xFE, 0x41, 0x00, 0x42, 0x00]) ; // BOM + "AB"

            t.expect0($charsetFromBytes([])).null() ;
            t.expect1($charsetFromBytes(asciiBytes)).is(TSCharset.asciiCharset()) ;
            t.expect2($charsetFromBytes(utf8Bytes)).is(utf8) ;
            t.expect3($charsetFromBytes(latin1Bytes)).is(TSCharset.latin1Charset()) ;
            t.expect4($charsetFromBytes(utf16leBytes)).is(TSCharset.unicodeCharset()) ;

            t.expect5(TSCharset.isUTF8Charset(asciiBytes)).true() ;          // ASCII is a subset of UTF-8
            t.expect6(TSCharset.isUTF8Charset(utf8Bytes)).true() ;
            t.expect7(TSCharset.isUTF8Charset(latin1Bytes)).false() ;
            t.expect8(TSCharset.isUTF8Charset(Buffer.from([]))).false() ;
            t.expect9(TSCharset.isUTF8Charset(utf16leBytes)).false() ;       // UTF-16 LE BOM

            t.expectA(TSCharset.charsetFromDataLike(utf8Bytes)).is(utf8) ;
            t.expectB(TSCharset.charsetFromDataLike(utf16leBytes)).is(TSCharset.unicodeCharset()) ;
        }) ;
    }),
    TSTest.group("data.ts — DataLike conversions & prototype extensions", async (group) => {
        group.unary("$arrayFromDataLike / $arrayBufferFromDataLike / $uint32ArrayFromDataLike", async (t) => {
            t.expect0($arrayFromDataLike(new Uint8Array([1, 2, 3]).buffer)).is([1, 2, 3]) ;
            t.expect1($arrayFromDataLike(new TSData(Buffer.from([4, 5, 6])))).is([4, 5, 6]) ;
            const sliced = $arrayBufferFromDataLike($arrayBufferFromBytes(Buffer.from([9, 8, 7])), { start:1 }) ;
            t.expect2(Buffer.from(sliced).toString('hex')).is('0807') ;
            t.expect3($uint32ArrayFromDataLike(new Uint8Array([1, 0, 0, 0]), true)).is([1]) ;
        }) ;

        group.unary("$blobFromDataLike / $uint8ArrayFromBlob", async (t) => {
            t.expect0($blobFromDataLike(new Uint8Array([1, 2, 3])).size).is(3) ;
            t.expect1($blobFromDataLike(TSData.fromString('ab')).size).is(2) ;
            t.expect2($blobFromDataLike(new ArrayBuffer(4)).size).is(4) ;
            const back = await $uint8ArrayFromBlob($blobFromBytes(new Uint8Array([5, 6, 7]))) ;
            t.expect3(Buffer.from(back!).toString('hex')).is('050607') ;
        }) ;

        group.unary("$bufferFromBytes generic-array copy path", async (t) => {
            t.expect0(Buffer.from($bufferFromBytes([10, 20, 30, 40, 50] as any, { start:1, end:4 })).toString('hex')).is('141e28') ;
        }) ;

        group.unary("$arrayBufferFromDataLike(TSData) / $blobFromBytes(number[]) / $uint8ArrayFromBlob fallback", async (t) => {
            // $arrayBufferFromDataLike with a TSData source (mutableBuffer branch)
            const ab = $arrayBufferFromDataLike(new TSData(Buffer.from([1, 2, 3, 4]))) ;
            t.expect0(Buffer.from(ab).toString('hex')).is('01020304') ;

            // $blobFromBytes with a plain number[] (goes through _uint8ArrayFromArray)
            const blob = $blobFromBytes([10, 20, 30] as any) ;
            t.expect1(blob.size).is(3) ;
            t.expect2(Buffer.from(await blob.arrayBuffer()).toString('hex')).is('0a141e') ;

            // $uint8ArrayFromBlob on a Blob-like object without a bytes() method -> $bufferFromBlob path
            const fakeBlob = { arrayBuffer:async () => new Uint8Array([7, 8, 9]).buffer } as any as Blob ;
            const u8 = await $uint8ArrayFromBlob(fakeBlob) ;
            t.expect3(Buffer.from(u8!).toString('hex')).is('070809') ;
        }) ;

        group.unary("base64 — pure-JS path (used when no native codec)", async (t) => {
            // __pureEncodeBase64 / __pureDecodeBase64 are what runs in the browser
            // (the 'buffer' polyfill has no native base64) — exercise them directly
            for (let l = 0 ; l < 40 ; l++) {
                const bytes = new Uint8Array(l) ;
                for (let i = 0 ; i < l ; i++) { bytes[i] = (i * 37 + 11) & 0xff ; }

                const std = __pureEncodeBase64(bytes, false) ;
                const url = __pureEncodeBase64(bytes, true) ;
                // oracle : standard base64 from Buffer, base64url derived by hand so
                // this holds under the browser 'buffer' polyfill (no 'base64url')
                const oracleStd = Buffer.from(bytes).toString('base64') ;
                const oracleUrl = oracleStd.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') ;
                t.expect(std, `std-${l}`).is(oracleStd) ;
                t.expect(url, `url-${l}`).is(oracleUrl) ;
                t.expect(Array.from(__pureDecodeBase64(std)), `dec-std-${l}`).is(Array.from(bytes)) ;
                t.expect(Array.from(__pureDecodeBase64(url)), `dec-url-${l}`).is(Array.from(bytes)) ;
            }
            // the decoder skips whitespace, stray padding and code points > 0xFF
            t.expect0(Array.from(__pureDecodeBase64("QU JD  =="))).is([65, 66, 67]) ;
            t.expect1(__pureDecodeBase64('').length).is(0) ;
            t.expect2(__pureDecodeBase64('QU' + String.fromCharCode(0x2028) + 'JD').length).is(3) ;
            t.expect3(__pureDecodeBase64('Q').length).is(0) ;                     // 6 bits -> no full byte

            t.expect4($encodeBytesToHexa([] as any)).is('') ;                    // empty non-Buffer -> ''
            t.expect5($encodeBytesToHexa([0xa, 0xbc] as any)).is('0ABC') ;       // plain number[] -> table path
        }) ;

        group.unary("$uint8ArrayFromHexaString — system Uint8Array.fromHex wiring", async (t) => {
            const had = 'fromHex' in Uint8Array ;
            const saved = (Uint8Array as any).fromHex ;
            try {
                (Uint8Array as any).fromHex = (s:string) => new Uint8Array(Buffer.from(s, 'hex')) ;
                t.expect0(Buffer.from($uint8ArrayFromHexaString('41424344')!).toString()).is('ABCD') ;

                (Uint8Array as any).fromHex = () => { throw new Error('boom') ; } ;
                t.expect1($uint8ArrayFromHexaString('41424344')).null() ;   // system function throws -> null
            }
            finally {
                if (had) { (Uint8Array as any).fromHex = saved ; }
                else { delete (Uint8Array as any).fromHex ; }
            }
        }) ;

        group.unary("data.ts — remaining conversion branches", async (t) => {
            // $bufferFromArrayBuffer with a real ArrayBuffer (not a view) and with a view
            t.expect0($bufferFromArrayBuffer(new Uint8Array([1, 2, 3, 4]).buffer as ArrayBuffer).toString('hex')).is('01020304') ;
            t.expectF($bufferFromArrayBuffer(new Uint8Array([9, 8, 7]) as any).toString('hex')).is('090807') ;

            // leafInspect on a genuine Uint8Array
            t.expectG(typeof new Uint8Array([1, 2, 3]).leafInspect()).is('string') ;

            // a lone base64 char carries only 6 bits -> not enough for a byte
            t.expectH($decodeBase64('Q').length).is(0) ;

            // $uint8ArrayFromBytes partial-range subarray branch
            t.expect1(Buffer.from($uint8ArrayFromBytes(new Uint8Array([1, 2, 3, 4]), { start:1, end:3 })).toString('hex')).is('0203') ;

            // $arrayFromBytes on a non-Uint8Array: whole vs sliced
            t.expect2($arrayFromBytes([9, 8, 7] as any)).is([9, 8, 7]) ;
            t.expect3($arrayFromBytes([9, 8, 7] as any, { start:1 })).is([8, 7]) ;

            // $bytesFromDataLike forceCopy branch
            t.expect4(Buffer.from($bytesFromDataLike(new Uint8Array([5, 6]), { forceCopy:true })).toString('hex')).is('0506') ;

            // $arrayBufferFromDataLike: direct passthrough vs forced copy
            const ab = new Uint8Array([1, 2, 3]).buffer as ArrayBuffer ;
            t.expect5($arrayBufferFromDataLike(ab) === ab).true() ;
            t.expect6($arrayBufferFromDataLike(ab, { forceCopy:true }) === ab).false() ;

            // $arrayBufferFromBlob / $bufferFromBlob / $uint8ArrayFromBlob error & null paths
            t.expect7(await $arrayBufferFromBlob(null as any)).null() ;
            t.expect8(await $arrayBufferFromBlob({ arrayBuffer:async () => { throw new Error('x') ; } } as any)).null() ;
            t.expect9(await $bufferFromBlob(null as any)).null() ;
            t.expectA(await $uint8ArrayFromBlob({ bytes:async () => { throw new Error('x') ; } } as any)).null() ;

            // base64 decode with 1- and 2-char trailing groups
            t.expectB(Buffer.from($decodeBase64('QQ')).toString()).is('A') ;      // 1 significant byte
            t.expectC(Buffer.from($decodeBase64('QUI')).toString()).is('AB') ;     // 2 significant bytes
            t.expectD($encodeBase64('A')).is('QQ==') ;
            t.expectI($encodeBase64URL('>> ~~')).is('Pj4gfn4') ;                  // no '+/' , no '=' padding

            // Buffer.leafInspect (constructor.name !== 'Uint8Array')
            t.expectE(typeof Buffer.from([1, 2, 3]).leafInspect()).is('string') ;
        }) ;

        group.unary("$encodeHexa / $decodeHexa branches", async (t) => {
            t.expect0($encodeHexa(new TSData(Buffer.from([0xab, 0xcd])))).is('ABCD') ;
            t.expect1($encodeHexa(new Uint8Array([0xab, 0xcd]).buffer as ArrayBuffer)).is('ABCD') ;
            t.expect2(() => $decodeHexa('nothexa!!')).throws() ;
            t.expect3((new Uint8Array([1, 2]).buffer as ArrayBuffer).base64String()).is('AQI=') ;
        }) ;

        group.unary("String / Uint8Array / ArrayBuffer base64URL & hexa & XOR", async (t) => {
            t.expect0('>> ~~'.base64URL()).is('Pj4gfn4') ;
            t.expect1(Buffer.from('-vv8_Q'.decodeBase64URL()).toString('hex')).is('fafbfcfd') ;
            const u8 = new Uint8Array([250, 251, 252, 253]) ;
            t.expect2(u8.base64URL()).is('-vv8_Q') ;
            t.expect3(u8.hexaString()).is('FAFBFCFD') ;
            t.expect4(u8.hexaString(true)).is('fafbfcfd') ;
            t.expect5((u8.buffer as ArrayBuffer).base64URL()).is('-vv8_Q') ;
            t.expect6((u8.buffer as ArrayBuffer).hexaString()).is('FAFBFCFD') ;
            t.expect7(Buffer.from(new Uint8Array([0xff, 0x0f]).XOR(new Uint8Array([0x0f, 0xff])) as Uint8Array).toString('hex')).is('f0f0') ;
            t.expect8(Buffer.from((new Uint8Array([0xaa, 0xbb]).buffer as ArrayBuffer).XOR(new Uint8Array([0xff, 0xff])) as Uint8Array).toString('hex')).is('5544') ;
        }) ;
    })
] ;
