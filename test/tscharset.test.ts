import "../src/mapset" ;
import { $charset, $charsetFromBytes, TSCharset } from "../src/tscharset";
import { TSData } from "../src/tsdata";
import { TSTest } from "../src/tstester";

export const charsetGroups = TSTest.group("TSCharset & $charset()", async (group) => {
    group.unary("undecodableIndex() of decodable bytes, inspection", async(t) => {
        const ascii = TSCharset.charset('ascii')! ;
        t.expect0(ascii.undecodableIndex(Buffer.from('abc'))).is(-1) ;            // every byte is decodable
        t.expect1(ascii.undecodableIndex(Buffer.from([0x61, 0xC3]))).is(1) ;
        const w = TSCharset.charset('windows-1252')! ;                          // a loaded charset
        t.expect2(w.undecodableIndex(Buffer.from('abc'))).is(-1) ;
        t.expect3(w.undecodableIndex(Buffer.from([0x61, 0x81]))).is(1) ;         // 0x81 is not defined in windows-1252
        t.expect4(w.toString()).is('[TSCharset: Windows-1252]') ;
        t.expect5(w.leafInspect()).is('[TSCharset: Windows-1252]') ;
    }) ;


    const utf8    = TSCharset.utf8Charset() ;
    const ascii   = TSCharset.asciiCharset() ;
    const latin1  = TSCharset.latin1Charset() ;
    const utf16le = TSCharset.unicodeCharset() ;
    const ansi    = TSCharset.ansiCharset() ;
    const mac     = TSCharset.macCharset() ;

    group.unary("cached charsets are stable singletons", async(t) => {
        t.expect0(TSCharset.utf8Charset()).is(utf8) ;
        t.expect1(TSCharset.utf8Charset() === utf8).true() ;
        t.expect2(latin1).is(TSCharset.binaryCharset()) ;       // binary is an alias of latin1
        t.expect3(utf8.name).is("utf8") ;
        t.expect4(latin1.name).is("latin1") ;
        t.expect5(utf16le.name).is("utf16le") ;
        t.expect6(ascii.name).is("ascii") ;
    }) ;

    group.unary("TSCharset.charset() / encoding() name & alias resolution", async(t) => {
        t.expect0(TSCharset.charset("utf8")).is(utf8) ;
        t.expect1(TSCharset.charset("UTF-8")).is(utf8) ;         // case-insensitive alias
        t.expect2(TSCharset.charset("UTF_8")).is(utf8) ;
        t.expect3(TSCharset.charset("iso-8859-1")).is(latin1) ;
        t.expect4(TSCharset.charset("does-not-exist")).undef() ;
        t.expect5(TSCharset.encoding("utf-8" as any)).is(utf8) ;
        t.expect6(TSCharset.encoding("ucs2" as any)).is(utf16le) ;
        t.expect7(TSCharset.allCharsetNames().includes("utf8")).true() ;
        t.expect8(TSCharset.allCharsetNames().length).gt(10) ;
        t.expect9(TSCharset.systemCharset().name.length).gt(0) ;
    }) ;

    group.unary("$charset() resolver", async(t) => {
        t.expect0($charset(utf8)).is(utf8) ;                     // pass-through
        t.expect1($charset("latin-1")).is(latin1) ;             // string encoding
        t.expect2($charset(null)).is(utf8) ;                    // default is utf8
        t.expect3($charset(undefined)).is(utf8) ;
        t.expect4($charset(null, latin1)).is(latin1) ;          // explicit default
        // from data: an ASCII buffer resolves to ascii, invalid-utf8 high bytes to latin1
        t.expect5($charset(Buffer.from("plain ascii"))).is(ascii) ;
        t.expect6($charset(utf8.bufferFromString("café €uro"))).is(utf8) ;
    }) ;

    group.unary("round-trips: utf8 & utf16le are lossless for arbitrary text", async(t) => {
        const samples = ["", "Hello, World!", "café — déjà ЯНДЕКС 北京", "emoji 👍🚀", "1\t2\n3"] ;
        for (let i = 0 ; i < samples.length ; i++) {
            const s = samples[i] ;
            t.expect(utf8.stringFromBytes(utf8.bytesFromString(s)), `utf8-${i}`).is(s) ;
            t.expect(utf8.stringFromData(utf8.dataFromString(s)), `utf8d-${i}`).is(s) ;
            t.expect(utf16le.stringFromBytes(utf16le.stringToBytes(s)), `u16-${i}`).is(s) ;
        }
        // utf16le really encodes 2 bytes / BMP code unit, little endian
        t.expect0(Buffer.from(utf16le.stringToBytes("AB"))).is(Buffer.from([0x41, 0x00, 0x42, 0x00])) ;
    }) ;

    group.unary("round-trips: ascii & latin1 within their range", async(t) => {
        const asciiText  = "Pure ASCII: 0-9 A-Z a-z !?." ;
        const latin1Text = "Latin-1: café à noël ÿ ± µ" ;
        t.expect0(ascii.stringFromBytes(ascii.stringToBytes(asciiText))).is(asciiText) ;
        t.expect1(latin1.stringFromBytes(latin1.stringToBytes(latin1Text))).is(latin1Text) ;
        // latin1 keeps one byte per char
        t.expect2(latin1.stringToBytes(latin1Text).length).is(latin1Text.length) ;
        // ascii masks the high bit (é 0xE9 -> 0x69 'i')
        t.expect3(ascii.stringFromBytes(ascii.stringToBytes("é"))).is("i") ;
    }) ;

    group.unary("TSLoadedCharset (Windows-1252 / MacRoman): round-trip + drop of unmapped chars", async(t) => {
        t.expect0(ansi.name).is("Windows-1252") ;
        t.expect1(mac.name).is("APPLE_ROMAN") ;
        const s = "Éàçùî « Œuvre »" ;
        t.expect2(ansi.stringFromBytes(ansi.stringToBytes(s))).is(s) ;
        t.expect3(mac.stringFromBytes(mac.stringToBytes(s))).is(s) ;
        // characters absent from the charset are silently dropped
        t.expect4(ansi.stringFromBytes(ansi.stringToBytes("A北京B"))).is("AB") ;
        t.expect5(mac.stringFromBytes(mac.stringToBytes("A😀B"))).is("AB") ;
    }) ;

    group.unary("sourceStart / sourceEnd slicing", async(t) => {
        t.expect0(utf8.stringFromBytes(Buffer.from("ABCDEF"), 1, 4)).is("BCD") ;
        t.expect1(utf8.bytesFromString("ABCDEF", 2, 5)).is([0x43, 0x44, 0x45]) ;
        t.expect2(latin1.stringFromBytes(Buffer.from("ABCDEF"), 0, 0)).is("") ;
        t.expect3(utf8.stringFromData(TSData.fromString("ABCDEF"), 3)).is("DEF") ;
    }) ;

    group.unary("conversion output types", async(t) => {
        t.expect0(utf8.bufferFromString("A") instanceof Buffer).true() ;
        t.expect1(utf8.uint8ArrayFromString("A") instanceof Uint8Array).true() ;
        t.expect2(Array.isArray(utf8.bytesFromString("A"))).true() ;
        t.expect3(utf8.dataFromString("A") instanceof TSData).true() ;
    }) ;

    group.unary("$charsetFromBytes() edge cases", async(t) => {
        t.expect0($charsetFromBytes([])).null() ;
        t.expect1($charsetFromBytes(Buffer.from("only ascii here"))).is(ascii) ;
        // UTF-16 LE BOM
        t.expect2($charsetFromBytes(Buffer.from([0xFF, 0xFE, 0x41, 0x00]))).is(utf16le) ;
        // isolated high bytes that are not valid UTF-8 -> not utf8
        t.expect3(TSCharset.isUTF8Charset(Buffer.from([0x41, 0xE9, 0xE8]))).false() ;
        t.expect4(TSCharset.isUTF8Charset(utf8.bufferFromString("déjà vu"))).true() ;
        t.expect5(TSCharset.isUTF8Charset(Buffer.from(""))).false() ;
    }) ;

    group.unary("$charsetFromBytes() single byte charsets detection", async(t) => {
        const latin1 = TSCharset.latin1Charset(), mac = TSCharset.macCharset(), ansi = TSCharset.ansiCharset() ;
        // 0x7F eliminates MacRoman, 0x81 eliminates latin1 and ANSI : no candidate
        t.expect0($charsetFromBytes(Buffer.from([0x7F, 0x81]))).null() ;
        // 0xA1 has no weight for both MacRoman and ANSI: latin1, like when MacRoman is eliminated (it used to be null)
        t.expect1($charsetFromBytes(Buffer.from([0xA1]))).is(latin1) ;
        // 0x80...0x9F bytes eliminate latin1, some of them ANSI too
        t.expect2($charsetFromBytes(Buffer.from([0x81]))).is(mac) ;
        t.expect3($charsetFromBytes(Buffer.from([0x7F, 0x80]))).is(ansi) ;
        t.expect4($charsetFromBytes(Buffer.from([0x85]))).is(mac) ;
        // MacRoman eliminated, latin1 still possible
        t.expect5($charsetFromBytes(Buffer.from([0x7F, 0x41, 0xA1]))).is(latin1) ;
        t.expect6($charsetFromBytes(Buffer.from([0x01, 0xA1]))).is(latin1) ;
        // ANSI weight greater than the MacRoman one
        t.expect7($charsetFromBytes(Buffer.from([0xC3]))).is(latin1) ;
        // equal weights: no more null
        t.expect8($charsetFromBytes(Buffer.from([0xA9, 0xB0]))).is(latin1) ;         // © and °: no weight
        t.expect9($charsetFromBytes(Buffer.from([0x87]))).is(ansi) ;                 // latin1 eliminated, no weight
        t.expectA($charsetFromBytes(Buffer.from([0x8E, 0xE9]))).is(ansi) ;          // 2 against 2, latin1 eliminated
        t.expectB($charsetFromBytes(Buffer.from([0x8E, 0x8E]))).is(mac) ;           // MacRoman 'é' twice: more evidence
        // and $charset() no longer decodes them as UTF-8
        t.expectC($charset(Buffer.from([0xA1]))).is(latin1) ;
        t.expectD(TSCharset.charsetFromDataLike(Buffer.from([0xA9]))!.stringFromBytes(Buffer.from([0xA9]))).is('©') ;
    }) ;

    group.unary("UTF-16 big endian charset", async(t) => {
        const be = TSCharset.utf16BECharset() ;
        t.expect0(be.name).is('utf16be') ;
        t.expect1(['utf16be', 'UTF16BE', 'utf-16be', 'UTF-16BE', 'utf_16be', 'UTF_16BE'].every(n => TSCharset.charset(n) === be)).true() ;
        t.expect2(TSCharset.encoding('UTF-16BE')).is(be) ;            // used to give UTF-8
        t.expect3($charset('utf-16be')).is(be) ;
        t.expect4([...be.bytesFromString('Aé€')]).is([0x00, 0x41, 0x00, 0xE9, 0x20, 0xAC]) ;
        t.expect5(be.stringFromBytes(Buffer.from([0x00, 0x41, 0x00, 0xE9, 0x20, 0xAC]))).is('Aé€') ;
        t.expect6(be.stringFromBytes(Buffer.from([0xD8, 0x3D, 0xDE, 0x00]))).is('😀') ;   // a surrogate pair
        t.expect7(be.stringFromBytes(Buffer.from([0x00, 0x41, 0x00]))).is('A') ;          // a last odd byte is ignored
        t.expect8(be.stringFromBytes(Buffer.from([0x00, 0x41, 0x00, 0x42, 0x00, 0x43]), 2, 4)).is('B') ;
        t.expect9([...be.bytesFromString('ABC', 1, 2)]).is([0x00, 0x42]) ;
        t.expectA(be.stringFromData(be.dataFromString('Hello é'))).is('Hello é') ;
        t.expectB(be.stringFromBytes(Buffer.from([]))).is('') ;
        t.expectC([...be.bytesFromString('')]).is([]) ;
        // little endian is still the default UTF-16
        t.expectD(TSCharset.encoding('UTF-16')).is(TSCharset.unicodeCharset()) ;
        t.expectE([...TSCharset.unicodeCharset().bytesFromString('A')]).is([0x41, 0x00]) ;
    }) ;

    group.unary("TSCharset.stringFromDetectedData() removes the byte order mark which gave the charset", async(t) => {
        const D = (a:number[]) => Buffer.from(a) ;
        t.expect0(TSCharset.stringFromDetectedData(D([0xEF, 0xBB, 0xBF, 0x41, 0xC3, 0xA9]))).is(['Aé', TSCharset.utf8Charset()]) ;
        t.expect1(TSCharset.stringFromDetectedData(D([0xFF, 0xFE, 0x41, 0x00, 0xE9, 0x00]))).is(['Aé', TSCharset.unicodeCharset()]) ;
        t.expect2(TSCharset.stringFromDetectedData(D([0xFE, 0xFF, 0x00, 0x41, 0x00, 0xE9]))).is(['Aé', TSCharset.utf16BECharset()]) ;
        t.expect3(TSCharset.stringFromDetectedData(D([0x41, 0xC3, 0xA9]))).is(['Aé', TSCharset.utf8Charset()]) ;   // no BOM
        t.expect4(TSCharset.stringFromDetectedData(D([0x41, 0xE9]))).is(['Aé', TSCharset.latin1Charset()]) ;
        t.expect5(TSCharset.stringFromDetectedData(D([0x41]))).is(['A', TSCharset.asciiCharset()]) ;
        t.expect6(TSCharset.stringFromDetectedData(D([0xFF, 0xFE]))).is(['', TSCharset.unicodeCharset()]) ;        // the BOM alone
        // a BOM which did not give the charset is kept, like the stringFromData() methods always do
        t.expect7(TSCharset.utf8Charset().stringFromData(D([0xEF, 0xBB, 0xBF, 0x41]))).is('\uFEFFA') ;
        t.expect8(TSCharset.stringFromDetectedData(new Uint8Array(0))).is(['', TSCharset.utf8Charset()]) ;         // default charset
        t.expect9(TSCharset.stringFromDetectedData(D([0x7F, 0x81]), TSCharset.ansiCharset())[1]).is(TSCharset.ansiCharset()) ;
    }) ;

    group.unary("$charsetFromBytes() UTF-16 byte order marks", async(t) => {
        t.expect0($charsetFromBytes(Buffer.from([0xFF, 0xFE]))).is(TSCharset.unicodeCharset()) ;          // the BOM alone (used to be ignored)
        t.expect1($charsetFromBytes(Buffer.from([0xFF, 0xFE, 0x41, 0x00]))).is(TSCharset.unicodeCharset()) ;
        t.expect2($charsetFromBytes(Buffer.from([0xFE, 0xFF]))).is(TSCharset.utf16BECharset()) ;           // big endian
        t.expect3($charsetFromBytes(Buffer.from([0xFE, 0xFF, 0x00, 0x41]))).is(TSCharset.utf16BECharset()) ; // used to be a single byte charset
        t.expect4($charsetFromBytes(Buffer.from([0xFE]))).is(TSCharset.latin1Charset()) ;                  // one byte only: not a BOM
    }) ;

    group.unary("invalid UTF-8 lead bytes", async(t) => {
        t.expect0(TSCharset.isUTF8Charset(Buffer.from([0x80, 0x41]))).false() ;     // a lonely continuation byte
        t.expect1(TSCharset.isUTF8Charset(Buffer.from([0xF8, 0x88, 0x80, 0x80, 0x80]))).false() ; // 5 bytes form
        t.expect2(TSCharset.isUTF8Charset(Buffer.from([0xFF, 0x41]))).false() ;
        t.expect3($charsetFromBytes(Buffer.from([0xF8, 0x41]))).is(TSCharset.latin1Charset()) ;
        t.expect4($charsetFromBytes(Buffer.from([0x80, 0x41]))).is(TSCharset.macCharset()) ;
    }) ;

    group.unary("strict encoding (string -> bytes): canEncode(), unencodableIndex(), strictStringToBytes()", async(t) => {
        const C = (n:string) => TSCharset.charset(n)! ;
        const enc = (n:string, s:string) => { const b = C(n).strictStringToBytes(s) ; return [C(n).canEncode(s), C(n).unencodableIndex(s), b ? Array.from(b) : null] ; } ;
        t.expect0(enc('latin1', 'é')).is([true, -1, [0xE9]]) ;
        t.expect1(enc('latin1', 'a€')).is([false, 1, null]) ;
        t.expect2(enc('ascii', 'abé')).is([false, 2, null]) ;
        t.expect3(enc('ansi', '€')).is([true, -1, [0x80]]) ;
        t.expect4(enc('ansi', 'x😀y')).is([false, 1, null]) ;
        t.expect5(enc('mac', 'é')).is([true, -1, [0x8E]]) ;
        t.expect6(enc('utf8', '😀')).is([true, -1, [0xF0, 0x9F, 0x98, 0x80]]) ;
        t.expect7(enc('utf8', 'a\uD83D')).is([false, 1, null]) ;      // a lone surrogate
        t.expect8(enc('utf16le', '\uDE00b')).is([false, 0, null]) ;
        t.expect9(enc('utf16be', 'ok')).is([true, -1, [0, 0x6F, 0, 0x6B]]) ;
        t.expectA(enc('hex', '0aff')).is([true, -1, [0x0A, 0xFF]]) ;
        t.expectB(enc('hex', '0af')).is([false, 2, null]) ;            // an odd number of digits
        t.expectC(enc('hex', '0x')).is([false, 1, null]) ;
        t.expectD(enc('base64', 'QUJD\nREVG')).is([true, -1, [0x41, 0x42, 0x43, 0x44, 0x45, 0x46]]) ; // spaces are ignored, like Buffer does
        t.expectE(enc('base64', 'QUI=')).is([true, -1, [0x41, 0x42]]) ;
        t.expectF(enc('base64', 'QU=B')).is([false, 3, null]) ;        // nothing but '=' after the padding
        t.expectG(enc('base64', 'Q')).is([false, 0, null]) ;           // a single character cannot give a byte
        t.expectH(enc('base64url', 'QU+/')).is([false, 2, null]) ;
        t.expectI(enc('base64url', 'QU-_')).is([true, -1, [0x41, 0x4F, 0xBF]]) ;
        t.expectJ(C('latin1').canEncode('a€b', 0, 1)).true() ;         // the range is used
        t.expectK(C('latin1').unencodableIndex('a€b€', 2)).is(3) ;
        // a loaded charset drops a missing character: between U+0000 and U+00FF, it used to give a 0 byte
        t.expectL(Array.from(ansi.stringToBytes('a\u0081b'))).is([0x61, 0x62]) ;
        t.expectM(Array.from(C('mac').stringToBytes('¤'))).is([]) ;
        t.expectN(Array.from(ansi.stringToBytes('\u0000'))).is([0]) ; // U+0000 is in the charset
        // the lenient conversion of the other charsets is unchanged
        t.expectO(Array.from(latin1.stringToBytes('€'))).is([0xAC]) ;
    }) ;

    group.unary("strict decoding (bytes -> string): canDecode(), undecodableIndex(), strictStringFromBytes()", async(t) => {
        const C = (n:string) => TSCharset.charset(n)! ;
        const dec = (n:string, b:number[]) => { const u = Uint8Array.from(b) ; return [C(n).canDecode(u), C(n).undecodableIndex(u), C(n).strictStringFromBytes(u)] ; } ;
        t.expect0(dec('ascii', [0x41, 0xE9])).is([false, 1, null]) ;
        t.expect1(dec('latin1', [0xE9, 0x80])).is([true, -1, '\u00E9\u0080']) ;  // all the bytes are latin1 characters
        t.expect2(dec('ansi', [0x80, 0x81])).is([false, 1, null]) ;               // 0x81 is not a Windows-1252 character
        t.expect3(dec('utf8', [0xC3, 0xA9])).is([true, -1, 'é']) ;
        t.expect4(dec('utf8', [0x61, 0xC3])).is([false, 1, null]) ;               // a truncated sequence
        t.expect5(dec('utf8', [0xED, 0xA0, 0x80])).is([false, 0, null]) ;         // an encoded surrogate
        t.expect6(dec('utf8', [0xE0, 0x80, 0x80])).is([false, 0, null]) ;         // an overlong form
        t.expect7(dec('utf8', [0xF0, 0x9F, 0x98, 0x80])).is([true, -1, '😀']) ;
        t.expect8(dec('utf16le', [0x61, 0x00, 0x3D])).is([false, 2, null]) ;      // an odd last byte
        t.expect9(dec('utf16le', [0x3D, 0xD8, 0x61, 0x00])).is([false, 0, null]) ; // a lone high surrogate
        t.expectA(dec('utf16be', [0xD8, 0x3D, 0xDE, 0x00])).is([true, -1, '😀']) ;
        t.expectB(dec('utf16be', [0xDE, 0x00])).is([false, 0, null]) ;
        t.expectC(dec('hex', [1, 2])).is([true, -1, '0102']) ;
        t.expectD(utf8.strictStringFromData(Buffer.from([0x61, 0xFF]))).null() ;
        t.expectE(utf8.strictStringFromData(new TSData(Buffer.from('été', 'utf8')))).is('été') ;
        t.expectF(utf8.canDecode(Uint8Array.from([0x61, 0xFF, 0x62]), 2)).true() ; // the range is used
        // the lenient conversions are unchanged
        t.expectG(ascii.stringFromBytes(Uint8Array.from([0x41, 0xE9]))).is('Ai') ;
        t.expectH(utf16le.stringFromBytes(Uint8Array.from([0x61, 0x00, 0x3D]))).is('a') ;
    }) ;
}) ;
