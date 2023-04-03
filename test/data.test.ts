import { $decodeBase64, $encodeBase64, $arrayBufferFromBytes, $arrayFromBytes, $bufferFromArrayBuffer, $bufferFromBytes, $uint8ArrayFromBytes } from '../src/data';
import { TSTest } from '../src/tstester';

export const dataGroups = [
    TSTest.group("Testing simple level data manipulations functions", async (group) => {
        const a:Uint8Array = new Uint8Array([65,66,67,68]) ;
        const c = Buffer.from("ABCD") ;
        group.unary('testing isGenuineUint8Array() method', async(t) => {
            t.expect0(a.isGenuineUint8Array()).true() ;
            t.expect1(c.isGenuineUint8Array()).false() ;
        }) ;
        group.unary('$bufferFromArrayBuffer() and $arrayBufferFromBytes() functions', async(t) => {
            const b = $bufferFromArrayBuffer(a) ;
            const d = $arrayBufferFromBytes(c) ;
            t.expect0(b).toBe(c) ;
            t.expect1(d).toBe(a) ;
        }) ;

        group.unary('$bufferFromBytes(), $uint8ArrayFromBytes(), $arrayFromBytes() functions', async(t) => {
            const buf = $bufferFromBytes(a) ;
            const u8a = $uint8ArrayFromBytes(a, { forceCopy:true }) ;
            const bytes = $arrayFromBytes(a) ;

            t.expect0(buf).toBe(a) ;
            t.expect1(u8a).toBe(a) ;
            t.expect2($arrayFromBytes(buf)).toBe(bytes) ;
            t.expect3($arrayFromBytes(u8a)).toBe(bytes) ;
            t.expect4(buf.isGenuineUint8Array()).false() ;
            t.expect5(u8a.isGenuineUint8Array()).true() ;
        }) ;

        group.unary("$decodeBase64() and $encodeBase64() functions", async(t) => {
            const b64 = 'JVBERi0xLjQKJcKlwrEKCgoKMSAwIG9iagogIDw8IC9UeXBlIC9DYXRhbG9nCiAgICAgL1BhZ2VzIDIgMCBSCiAgPj4KZW5kb2JqCgoyIDAgb2JqCiAgPDwgL1R5cGUgL1BhZ2VzCiAgICAgL0tpZHMgWzMgMCBSXQogICAgIC9Db3VudCAxCiAgICAgL01lZGlhQm94IFswIDAgMzAwIDE0NF0KICA+PgplbmRvYmoKCjMgMCBvYmoKICA8PCAgL1R5cGUgL1BhZ2UKICAgICAgL1BhcmVudCAyIDAgUgogICAgICAvUmVzb3VyY2VzCiAgICAgICA8PCAvRm9udAogICAgICAgICAgIDw8IC9GMQogICAgICAgICAgICAgICA8PCAvVHlwZSAvRm9udAogICAgICAgICAgICAgICAgICAvU3VidHlwZSAvVHlwZTEKICAgICAgICAgICAgICAgICAgL0Jhc2VGb250IC9UaW1lcy1Sb21hbgogICAgICAgICAgICAgICA+PgogICAgICAgICAgID4+CiAgICAgICA+PgogICAgICAvQ29udGVudHMgNCAwIFIKICA+PgplbmRvYmoKCjQgMCBvYmoKICA8PCAvTGVuZ3RoIDU1ID4+CnN0cmVhbQogIEJUCiAgICAvRjEgMTggVGYKICAgIDAgMCBUZAogICAgKEhlbGxvIFdvcmxkKSBUagogIEVUCmVuZHN0cmVhbQplbmRvYmoKCnhyZWYKMCA1CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAxOCAwMDAwMCBuIAowMDAwMDAwMDc3IDAwMDAwIG4gCjAwMDAwMDAxNzggMDAwMDAgbiAKMDAwMDAwMDQ1NyAwMDAwMCBuIAp0cmFpbGVyCiAgPDwgIC9Sb290IDEgMCBSCiAgICAgIC9TaXplIDUKICA+PgpzdGFydHhyZWYKNTY1CiUlRU9GCg==' ;
            const array = $decodeBase64(b64) ;
            t.expect0(array).is(Buffer.from(b64, 'base64')) ;
            const b64_2 = $encodeBase64(array) ;
            t.expect1(b64_2).is(b64) ;
    
            const str = 'This is a string' ;
            const str64 = $encodeBase64(str) ;
            t.expect2(str64).is(Buffer.from(str, 'binary').toString('base64')) ;
        }) ;

    })
] ;
