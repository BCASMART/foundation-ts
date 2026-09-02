import "../src/mapset" ;
import { $charset, $charsetFromBytes, TSCharset } from "../src/tscharset";
import { TSData } from "../src/tsdata";
import { TSTest } from "../src/tstester";

export const charsetGroups = TSTest.group("TSCharset & $charset()", async (group) => {

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
}) ;
