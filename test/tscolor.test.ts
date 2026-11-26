import { $round } from '../src/number';
import { TSColor, TSColorSpace, TSToGrayScaleMode } from '../src/tscolor';
import { TSTest } from '../src/tstester';
import { $inspect } from '../src/utils';
import { Ascending, Descending, Same, uint8 } from '../src/types';

// TOTO

export const colorGroups = [

TSTest.group("TSColor class ", async (group) => {
    const yellowRGB = TSColor.rgb('Yellow') ;
    const yellowCMYK = TSColor.yellow() ;
    const realGray = TSColor.grayscale(0.5) ;
    const rgbGray = TSColor.rgbcomponents(0.5,0.5,0.5) ;
    const cmykGray = TSColor.cmyk(0,0,0,0.5) ;

    const [H1,S1,B1] = yellowRGB.hsb() ;
    const [H2,S2,L2] = yellowRGB.hsl() ;
    const [H3,S3,B3] = yellowCMYK.hsb() ;
    const [H4,S4,L4] = yellowCMYK.hsl() ;
    const [H5,S5,B5] = realGray.hsb() ;
    const [H6,S6,B6] = rgbGray.hsb() ;
    
    group.unary("TSColors creation", async(t) => {
        t.expect0(TSColor.rgb('ff0')).is(yellowRGB) ;
        t.expect1(TSColor.rgb('#ff0')).is(yellowRGB) ;
        t.expect2(TSColor.rgb('ffff00')).is(yellowRGB) ;
        t.expect3(TSColor.rgb('#ffff00')).is(yellowRGB) ;
        t.expect4(TSColor.rgb('#FffF00')).is(yellowRGB) ;
        t.expect5(TSColor.rgb('#ffff00ff')).is(yellowRGB) ;
        t.expect6(TSColor.rgb('#FFFF00FF')).is(yellowRGB) ;
        t.expect7(TSColor.rgb(0xffff00)).is(yellowRGB) ;
        t.expect8(TSColor.rgb(255,255,0)).is(yellowRGB) ;
        t.expect9(TSColor.rgb(255,255,0,255)).is(yellowRGB) ;
        t.expectA(TSColor.rgbcomponents(1,1,0)).is(yellowRGB) ;
        t.expectB(TSColor.rgbcomponents(1,1,0,1)).is(yellowRGB) ;
        t.expectC(TSColor.rgb(0xffff00)).is(yellowRGB) ;
        t.expectD(TSColor.cmyk(0, 0, 1, 0)).is(yellowCMYK) ;
        t.expectE(yellowRGB.colorSpace).is(TSColorSpace.RGB) ;
        t.expectF(yellowCMYK.colorSpace).is(TSColorSpace.CMYK) ;
        t.expectG(realGray.colorSpace).is(TSColorSpace.Grayscale) ;
        t.expectH(TSColor.rgb("cyan").toString()).is("#00ffff") ;
        t.expectI(TSColor.rgb("darkgrey").toString()).is("#a9a9a9") ;
        t.expectJ(TSColor.rgb("darkslategray").toString()).is("#2f4f4f") ;
        t.expectK(TSColor.rgb("dimgrey").toString()).is("#696969") ;
        t.expectL(TSColor.rgb("grey").toString()).is("#808080") ;
    }) ;

    group.unary("TSColors similaryty", async(t) => {
        t.expect0(yellowRGB.isSimilar(yellowRGB)).true() ;
        t.expect1(yellowCMYK.isSimilar(yellowCMYK)).true() ;
        t.expect2(yellowCMYK.isSimilar(yellowRGB)).true() ;
        t.expect3(yellowRGB.isSimilar(yellowCMYK)).true() ;
        t.expect4(TSColor.rgb('blue').isSimilar(TSColor.blue())).true() ;
        t.expect5(TSColor.blue().isSimilar(TSColor.rgb('blue'))).true() ;
        t.expect6(TSColor.rgb('red').isSimilar(TSColor.red())).true() ;
        t.expect7(TSColor.red().isSimilar(TSColor.rgb('red'))).true() ;
        t.expect8(TSColor.rgb('green').isSimilar(TSColor.green())).true() ;
        t.expect9(TSColor.green().isSimilar(TSColor.rgb('green'))).true() ;
        t.expectA(TSColor.cmyk(0,0,0,0.5).isSimilar(realGray)).true() ;
        t.expectB(realGray.isSimilar(TSColor.rgb(128,128,128))).true() ; // 0.5 * 255 = 127.5 is rounded to 128
        t.expectC(realGray.isSimilar(rgbGray)).true() ;
    }) ;

    group.unary("TSColors conversion equality", async(t) => {
        t.expect0(yellowCMYK.toRGB()).is(yellowRGB) ;
        t.expect1(yellowRGB.toCMYK()).is(yellowCMYK) ;
        t.expect2(realGray.toCMYK()).is(cmykGray) ;
        t.expect3(realGray.toRGB()).is(rgbGray) ;
        t.expect4(cmykGray.toGrayscale()).is(realGray) ;
        t.expect5(rgbGray.toGrayscale().isSimilar(realGray)).true() ; // the gray of rgb(128,128,128) is 128/255, not 0.5
    }) ;

    group.unary("TSColors names", async(t) => {
        t.expect0(TSColor.rgb('red').name).is('red') ;
        t.expect1(TSColor.red().name).is('') ;
        t.expect2(TSColor.rgb('White').name).is('white') ;
        t.expect3(TSColor.rgb('#fff').name).is('white') ;
        t.expect4(TSColor.rgb('#FFFFFF').name).is('white') ;
        t.expect5(TSColor.rgb('fff').name).is('white') ;
        t.expect6(TSColor.rgb('FFFFFF').name).is('white') ;
        t.expect7(TSColor.rgb('#FFFFFFFF').name).is('white') ;
        t.expect8(TSColor.rgb('FFFFFFFF').name).is('white') ;
        t.expect9(TSColor.rgb(0xffffff).name).is('white') ;
        t.expectA(TSColor.rgb(0xffffffff).name).isnot('white') ;
        t.expectB(TSColor.rgbcomponents(1,1,1).name).is('white') ;
        t.expectC(TSColor.cyan().name).is('') ;
        t.expectD(TSColor.rgb('aquamarine').name).is('aquamarine') ;
        t.expectE(TSColor.rgb("#7fffd4").name).is('aquamarine') ;
    }) ;

    group.unary("TSColor HSB/HSL components", async(t) => {
        t.expect0([H1, S1, B1]).is([60,100,100]) ;
        t.expect1([H2, S2, L2]).is([60,100,50]) ;
        t.expect2([H3, S3, B3]).is([60,100,100]) ;
        t.expect3([H4, S4, L4]).is([60,100,50]) ;
        t.expect4([H5, S5, B5]).is([0,0,50]) ;
        t.expect5([H6, S6, B6]).is([0,0,50]) ;
        t.expect6(realGray.gray).is(0.5) ;
        t.expect7(rgbGray.gray).is(128/255) ; // no more rounding to a percentage
    }) ;
    group.unary("TSColor.toAlpha() and TSColor.toOpacity()", async(t) => {
        const yaRGB1 = yellowRGB.toAlpha(128 as uint8) ; // 0.5 * 255 = 127.5 is rounded to 128
        const yaRGB2 = yellowRGB.toOpacity(0.5) ;

        t.expect0(yaRGB2).is(yaRGB1) ;
    }) ;

    group.unary('TSColor luminosity and luminance', async(t) => {
        const decimals = 2 ;
        const luminance = $round(0.15 + 0.295 + 0.055, decimals) ;
        const luminosity = $round(0.105 + 0.36 + 0.035, decimals) ;

        t.expect0(realGray.isPale).false() ;
        t.expect1(rgbGray.isPale).false() ;
        t.expect2(cmykGray.isPale).false() ;
        t.expect3(realGray.luminance.round(decimals)).is(luminance) ;
        t.expect4(rgbGray.luminance.round(decimals)).is(luminance) ;
        t.expect5(cmykGray.luminance.round(decimals)).is(luminance) ;
        t.expect6(realGray.luminosity.round(decimals)).is(luminosity) ;
        t.expect7(rgbGray.luminosity.round(decimals)).is(luminosity) ;
        t.expect8(cmykGray.luminosity.round(decimals)).is(luminosity) ;
    }) ;

    group.unary('TSColor toString()', async(t) => {
        t.expect0(yellowRGB.toString()).is('#ffff00') ;
        t.expect1(yellowRGB.toString({ uppercase:true})).is('#FFFF00') ;
        t.expect2(yellowCMYK.toString({ uppercase:true, colorSpace:TSColorSpace.RGB})).is('#FFFF00') ;
        t.expect3(yellowCMYK.toString({ uppercase:true, colorSpace:TSColorSpace.RGB, shortestCSS:true})).is('#FF0') ;
        t.expect4(yellowCMYK.toString()).is('cmyk(0,0,1,0)') ;
        t.expect5(yellowRGB.toString({ rgbaCSSLike:true })).is('#ffff00ff') ;
        t.expect6(yellowRGB.toOpacity(0.5).toString({ rgbaCSSLike:true })).is('#ffff0080') ; // like CSS: 50% gives 80
    }) ;

    group.unary('TSColor $inspect()', async(t) => {
        t.expect0($inspect(yellowRGB)).is('<RGB 255 255 0/255>') ;
        t.expect1($inspect(TSColor.cmyk(0.1, 0.2, 0.3, 0.4))).is('<CMYK 0.1 0.2 0.3 0.4/1>') ; // there was a comma after M
        t.expect2($inspect(TSColor.grayscale(0.75, 0.5))).is('<GRAY 0.75/0.5>') ;
    }) ;
}),

TSTest.group("TSColor — named colours, channels, numeric & JSON forms", async (group) => {
    const red  = TSColor.rgb(255, 0, 0) ;
    const navy = TSColor.rgb(0, 0, 128) ;
    const gray = TSColor.grayscale(0.5) ;
    const cyan = TSColor.cyan() ;

    group.unary('static named colours', async (t) => {
        t.expect0(TSColor.black().rgb()).is([0, 0, 0]) ;
        t.expect1(TSColor.white().rgb()).is([255, 255, 255]) ;
        t.expect2(TSColor.magenta().rgb()).is([255, 0, 255]) ;
        t.expect3(TSColor.red().rgb()).is([255, 0, 0]) ;
        t.expect4(TSColor.green().rgb()).is([0, 255, 0]) ;
        t.expect5(TSColor.blue().rgb()).is([0, 0, 255]) ;
        t.expect6(TSColor.cyan().rgb()).is([0, 255, 255]) ;
        t.expect7(TSColor.yellow().rgb()).is([255, 255, 0]) ;
    }) ;

    group.unary('channel getters', async (t) => {
        t.expect0([red.red, red.green, red.blue]).is([255, 0, 0]) ;
        t.expect1([red.alpha, red.transparency]).is([255, 0]) ;
        t.expect2(red.toAlpha(128 as uint8).transparency).is(127) ;
        t.expect3([cyan.cyan, cyan.magenta, cyan.yellow, cyan.black]).is([1, 0, 0, 0]) ;
        t.expect4(gray.gray).is(0.5) ;
        t.expect5(red.opacity).is(1) ;
        t.expect6(gray.opacity).is(1) ;
    }) ;

    group.unary('valueOf / toUnsigned / toNumber', async (t) => {
        t.expect0(red.valueOf()).is(0xff0000) ;
        t.expect1(navy.valueOf()).is(0x000080) ;
        t.expect2(red.toUnsigned()).is(0xff0000) ;
        t.expect3(red.toNumber()).is(0xff0000) ;
        t.expect4(+red).is(0xff0000) ;                       // valueOf via unary plus
    }) ;

    group.unary('toJSON / toArray per colour space', async (t) => {
        t.expect0(red.toJSON()).is('#ff0000') ;
        t.expect1(red.toArray()).is([255, 0, 0, 255]) ;
        t.expect2(gray.toJSON()).is({ grayscale:0.5, opacity:1 }) ;
        t.expect3(cyan.toJSON()).is({ cyan:1, magenta:0, yellow:0, black:0, opacity:1 }) ;
    }) ;

    group.unary('compare / clone', async (t) => {
        t.expect0(red.compare(TSColor.rgb(255, 0, 0))).is(Same) ;
        t.expect1(navy.compare(red)).is(Ascending) ;         // 0x80 < 0xff0000
        t.expect2(red.compare(navy)).is(Descending) ;
        t.expect3(red.compare('x')).is(undefined) ;
        t.expect4(red.clone() === red).true() ;              // immutable -> identity
    }) ;

    group.unary('lighterColor / darkerColor / matchingColor', async (t) => {
        // grayscale: lighter is brighter, darker is dimmer
        t.expect0(gray.lighterColor().gray > 0.5).true() ;
        t.expect1(gray.darkerColor().gray < 0.5).true() ;
        t.expect2(gray.lightestColor().gray >= gray.lighterColor().gray).true() ;
        t.expect3(gray.darkestColor().gray <= gray.darkerColor().gray).true() ;
        // CMYK path
        t.expect4(cyan.lighterColor().luminance > cyan.luminance).true() ;
        t.expect5(cyan.darkerColor().luminance < cyan.luminance).true() ;
        // matchingColor: pale -> darkest, dark -> lightest
        t.expect6(TSColor.white().isPale).true() ;
        t.expect7(TSColor.white().matchingColor().luminance < TSColor.white().luminance).true() ;
        t.expect8(navy.isPale).false() ;
        t.expect9(navy.matchingColor().luminance > navy.luminance).true() ;
    }) ;
}),

TSTest.group("TSColor — CMYK / grayscale spaces, factories guards & toString forms", async (group) => {
    group.unary('factory guards & fallbacks', async (t) => {
        t.expect0(TSColor.fromString('notacolor')).null() ;
        t.expect1(TSColor.rgb({} as any).toString()).is('#000000') ;             // bad single param -> black
        t.expect2(() => TSColor.rgbcomponents('x' as any, 0, 0)).throws(/Bad parameters/) ;
        t.expect3(() => TSColor.cmyk('x' as any, 0, 0, 0)).throws(/Bad parameters/) ;
        t.expect4(() => TSColor.grayscale('x' as any)).throws(/Bad parameters/) ;
    }) ;

    group.unary('CMYK color space', async (t) => {
        const c = TSColor.cmyk(0.1, 0.2, 0.3, 0.4) ;
        t.expect0(c.colorSpace).is(TSColorSpace.CMYK) ;
        t.expect1($round(c.cyan, 2)).is(0.1) ;
        t.expect2($round(c.black, 2)).is(0.4) ;
        t.expect3(c.opacity).is(1) ;
        t.expect4(c.toString()).is('cmyk(0.1,0.2,0.3,0.4)') ;
        t.expect5(TSColor.cmyk(0.1, 0.2, 0.3, 0.4, 0.5).toString()).is('cmyka(0.1,0.2,0.3,0.4,0.5)') ;
    }) ;

    group.unary('grayscale color space', async (t) => {
        const g = TSColor.grayscale(0.5) ;
        t.expect0(g.colorSpace).is(TSColorSpace.Grayscale) ;
        t.expect1($round(g.gray, 2)).is(0.5) ;
        t.expect2(g.toString()).is('gray(0.5)') ;
        t.expect3(TSColor.grayscale(0.5, 0.5).toString()).is('gray(0.5, 0.5)') ;
        t.expect4(g.toGrayscale()).is(g) ;                                       // already grayscale -> identity
    }) ;

    group.unary('rgba() string form & darker/darkest chain', async (t) => {
        t.expect0(TSColor.rgb(10, 20, 30, 128).toString().startsWith('rgba(10,20,30,0.50')).true() ;
        const grey = TSColor.rgb(100, 100, 100) ;
        t.expect1(grey.darkerColor().toString()).is('#464646') ;
        t.expect2(grey.darkestColor().toString()).is('#343434') ; // 51.93 is rounded to 52 (0x34)
    }) ;

    group.unary('CMYK/Grayscale colors are cached : identity, discrimination, quantization', async (t) => {
        // same arguments -> same object instance (dedup via the packed-integer
        // cache key). NOTE: t.expect(...).is() checks value equality (isEqual()),
        // not identity, so these use plain === comparisons instead.
        t.expect0(TSColor.cmyk(0.2, 0.4, 0.6, 0.1)).strictis(TSColor.cmyk(0.2, 0.4, 0.6, 0.1)) ;
        t.expect1(TSColor.grayscale(0.5)).strictis(TSColor.grayscale(0.5)) ;

        // static factories always pass the same literals -> singletons
        t.expect2(TSColor.red()).strictis(TSColor.red()) ;
        t.expect3(TSColor.black()).strictis(TSColor.black()) ;
        t.expect4(TSColor.white()).strictis(TSColor.white()) ;
        t.expect5(TSColor.cyan()).strictis(TSColor.cyan()) ;

        // different C/M/Y/K or opacity -> different (uncached) instances
        const base = TSColor.cmyk(0.2, 0.4, 0.6, 0.1) ;
        t.expect6(base).strictnotis(TSColor.cmyk(0.2, 0.4, 0.6, 0.2)) ;
        t.expect7(base).strictnotis(TSColor.cmyk(0.2, 0.4, 0.6, 0.1, 0.5)) ;

        // Grayscale is stored internally as CMYK with C=M=Y=0, so a Grayscale
        // color and a CMYK color with the exact same channel numbers must stay
        // two distinct objects : colorSpace is part of their identity (it drives
        // compare()/isEqual()'s fast path and toString()'s output format).
        const gray = TSColor.grayscale(0.7) ;          // K = 1-0.7
        const cmykEquivalent = TSColor.cmyk(0, 0, 0, 0.3) ;
        t.expect8(gray).strictnotis(cmykEquivalent) ;
        t.expect9(gray.colorSpace).is(TSColorSpace.Grayscale) ;
        t.expectA(cmykEquivalent.colorSpace).is(TSColorSpace.CMYK) ;

        // 10-bit quantization merges float-jitter near-duplicates (1-0.7 !== 0.3
        // at full double precision) into the same cached instance, on purpose.
        t.expectB(TSColor.cmyk(0, 0, 0, 1 - 0.7)).strictis(TSColor.cmyk(0, 0, 0, 0.3)) ;

        // caching never breaks value equality, regardless of object identity
        t.expectC(base.isEqual(TSColor.cmyk(0.2, 0.4, 0.6, 0.1))).true() ;
        t.expectD(gray.isEqual(cmykEquivalent)).false() ;
    }) ;

    group.unary('logColorCache() does not throw', async (t) => {
        t.expect0(() => TSColor.logColorCache()).doesNotThrow() ;
    
    group.unary('exact conversions between [0..255] bytes and [0..1] components', async (t) => {
        let rgbComponentsErrors = 0, opacityErrors = 0, grayErrors = 0, cmykErrors = 0 ;
        for (let k = 0 ; k < 256 ; k++) {
            if (TSColor.rgbcomponents(k/255, k/255, k/255).red !== k) { rgbComponentsErrors++ ; }
            if (TSColor.rgb(255, 255, 255, k).toOpacity(k/255).alpha !== k) { opacityErrors++ ; }
            if (TSColor.rgb(k, k, k).toGrayscale().toRGB().red !== k) { grayErrors++ ; }
        }
        for (let r = 0 ; r < 256 ; r += 15) {
            for (let g = 0 ; g < 256 ; g += 15) {
                for (let b = 0 ; b < 256 ; b += 15) {
                    const color = TSColor.rgb(r, g, b, (r + b) % 256) ;
                    const back = color.toCMYK().toRGB() ;
                    if (back.red !== r || back.green !== g || back.blue !== b || back.alpha !== color.alpha) { cmykErrors++ ; }
                }
            }
        }
        t.expect0(rgbComponentsErrors).is(0) ;
        t.expect1(opacityErrors).is(0) ;
        t.expect2(grayErrors).is(0) ;
        t.expect3(cmykErrors).is(0) ;   // there were 47% of wrong conversions
        t.expect4(TSColor.rgbcomponents(0.5, 0.5, 0.5).red).is(128) ;
        t.expect5(TSColor.cmyk(0.2, 0.4, 0.6, 0.1, 0.5).toRGB().opacity).is(128/255) ;
    }) ;

    group.unary('opacity is kept and normalized in all color spaces', async (t) => {
        t.expect0(TSColor.rgb(10, 20, 30, 128).toGrayscale().alpha).is(128) ;   // was lost (opaque)
        t.expect1(TSColor.grayscale(0.5, 2).opacity).is(1) ;                    // was 2
        t.expect2(TSColor.grayscale(0.5, -1).opacity).is(0) ;
        const c1 = TSColor.cmyk(0.1, 0.2, 0.3, 0.4, 0.5) ;
        t.expect3(c1.isSimilar(c1.toRGB().toCMYK())).true() ;
        t.expect4(c1.toArray()).is([0.1, 0.2, 0.3, 0.4, 0.5]) ;
        t.expect5(TSColor.rgb(1, 2, 3, 4).toArray()).is([1, 2, 3, 4]) ;
        t.expect6(TSColor.rgb(1, 2, 3, 4).toJSON()).is({ red:1, green:2, blue:3, alpha:4 }) ;
    }) ;

    group.unary('the CMYK cache never changes the asked components', async (t) => {
        t.expect0(TSColor.cmyk(0.1, 0, 0, 0).cyan).is(0.1) ;
        t.expect1(TSColor.cmyk(0.1001, 0, 0, 0).cyan).is(0.1001) ;              // used to be 0.1 (the cached color)
        t.expect2(TSColor.cmyk(0, 0, 0, 1 - 0.7)).strictis(TSColor.cmyk(0, 0, 0, 0.3)) ; // computation jitters are merged
    }) ;

    group.unary('toOpacity() of CMYK and grayscale colors', async (t) => {
        const c = TSColor.cmyk(0.1, 0.2, 0.3, 0.4, 0.5) ;
        t.expect0(c.toOpacity(0.5)).is(c) ;                        // the same opacity gives the same color
        const c2 = c.toOpacity(0.25) ;
        t.expect1(c2.colorSpace).is(TSColorSpace.CMYK) ;           // a new opacity keeps the color space...
        t.expect2(c2.opacity).is(0.25) ;
        t.expect3(c2.cmykComponents()).is([0.1, 0.2, 0.3, 0.4]) ;  // ...and the components
        const g = TSColor.grayscale(0.3, 0.8) ;
        t.expect4(g.toOpacity(0.8)).is(g) ;
        const g2 = g.toOpacity(0.2) ;
        t.expect5(g2.colorSpace).is(TSColorSpace.Grayscale) ;
        t.expect6(g2.opacity).is(0.2) ;
        t.expect7($round(g2.gray, 6)).is(0.3) ;
        t.expect8(g.toAlpha(51 as uint8).opacity).is(0.2) ;                 // toAlpha() of a non RGB color uses toOpacity()
    }) ;

    group.unary('toGrayscale() modes', async (t) => {
        const c = TSColor.rgb(100, 150, 200, 102) ;
        const brightness = c.toGrayscale() ;
        t.expect0(brightness.colorSpace).is(TSColorSpace.Grayscale) ;
        t.expect1(brightness.gray).is(200/255) ;                   // the greatest component
        t.expect2(c.toGrayscale(TSToGrayScaleMode.Brightess).gray).is(brightness.gray) ;
        t.expect3(c.toGrayscale(TSToGrayScaleMode.Luminosity).gray).is(c.luminosity) ;
        t.expect4(c.toGrayscale(TSToGrayScaleMode.Luminance).gray).is(c.luminance) ;
        t.expect5(c.toGrayscale(TSToGrayScaleMode.Luminosity).opacity).is(0.4) ;   // the opacity is kept
        t.expect6($round(c.luminosity, 4)).is($round((0.21*100 + 0.72*150 + 0.07*200)/255, 4)) ;
        t.expect7(brightness.toGrayscale(TSToGrayScaleMode.Luminance)).is(brightness) ; // already a grayscale color
    }) ;

    group.unary('bad channels give black, hue of green and blue colors, short hex strings', async (t) => {
        const black = TSColor.rgb(0, 0, 0) ;
        t.expect0(TSColor.rgb(256, 0, 0)).is(black) ;
        t.expect1(TSColor.rgb(-1, 0, 0)).is(black) ;
        t.expect2(TSColor.rgb(1.5, 2, 3)).is(black) ;
        t.expect3(TSColor.rgb(1, 2, 3, 300)).is(black) ;
        // the hue when the greatest component is the green or the blue one
        t.expect4(TSColor.rgb(10, 200, 30).hsl()).is([126, 63, 41]) ;
        t.expect5(TSColor.rgb(10, 200, 30).hsb()).is([126, 95, 78]) ;
        t.expect6(TSColor.rgb(10, 30, 200).hsl()).is([234, 63, 41]) ;
        t.expect7(TSColor.rgb(10, 30, 200).hsb()).is([234, 95, 78]) ;
        // a short hex string which is not a cached color is parsed
        const s = TSColor.fromString('#a1c') ;
        t.expect8(s?.rgb()).is([0xaa, 0x11, 0xcc]) ;
        t.expect9(s?.toString()).is('#aa11cc') ;
        t.expectA(TSColor.fromString('B2D')?.rgb()).is([0xbb, 0x22, 0xdd]) ;
        // #rgba (CSS Color 4) is #rrggbbaa, it was not recognized
        const a = TSColor.fromString('#a1c8') ;
        t.expectB(a?.rgb()).is([0xaa, 0x11, 0xcc]) ;
        t.expectC(a?.alpha).is(0x88) ;
        t.expectD(TSColor.fromString('#A1C8')).is(TSColor.fromString('#aa11cc88')) ;
        t.expectE(TSColor.fromString('a1c8')).null() ;  // without '#', 4 digits are not a color
        t.expectF(TSColor.fromString('#a1cg')).null() ;
    }) ;

    group.unary('rgb() / toAlpha() errors and isSimilar() alpha', async (t) => {
        const C = TSColor as any ;
        t.expect0(() => C.rgb()).toThrow('TSColor.rgb() : Bad parameters') ;
        t.expect1(() => C.rgb(1, 2)).toThrow('TSColor.rgb() : Bad parameters') ;
        t.expect2(() => C.rgb(1, 2, 3, 4, 5)).toThrow('TSColor.rgb() : Bad parameters') ;
        const red = TSColor.rgb(255, 0, 0) ;
        t.expect3(() => red.toAlpha(256 as uint8)).toThrow('TSColor.toAlpha() : Bad alpha parameter 256') ;
        t.expect4(() => red.toAlpha(-1 as uint8)).toThrow('TSColor.toAlpha() : Bad alpha parameter -1') ;
        t.expect5(red.isSimilar(red.toAlpha(128 as uint8))).false() ;     // same RGB bytes, other alpha
        t.expect6(red.isSimilar('red' as any)).false() ;                  // not a color
        t.expect7(red.isSimilar(TSColor.rgb('#FF0000'))).true() ;
    }) ;
}) ;
}),

TSTest.group("TSColor — fromString() of empty strings", async (group) => {
    group.unary('empty or whitespace only strings give no color', async (t) => {
        t.expect0(TSColor.fromString('')).null() ;
        t.expect1(TSColor.fromString('   ')).null() ;
        t.expect2(TSColor.fromString(' \t\n ')).null() ;
        t.expect3(TSColor.fromString(null)).null() ;
        t.expect4(TSColor.fromString(undefined)).null() ;
    }) ;
}),

] ;
