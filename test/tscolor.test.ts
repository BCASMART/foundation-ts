import { $round } from '../src/number';
import { TSColor, TSColorSpace } from '../src/tscolor';
import { TSTest } from '../src/tstester';
import { uint8 } from '../src/types';

// TOTO

export const colorGroups = TSTest.group("TSColor class ", async (group) => {
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
        t.expectB(realGray.isSimilar(TSColor.rgb(127,127,127))).true() ;
        t.expectC(realGray.isSimilar(rgbGray)).true() ;
    }) ;

    group.unary("TSColors conversion equality", async(t) => {
        t.expect0(yellowCMYK.toRGB()).is(yellowRGB) ;
        t.expect1(yellowRGB.toCMYK()).is(yellowCMYK) ;
        t.expect2(realGray.toCMYK()).is(cmykGray) ;
        t.expect3(realGray.toRGB()).is(rgbGray) ;
        t.expect4(cmykGray.toGrayscale()).is(realGray) ;
        t.expect5(rgbGray.toGrayscale()).is(realGray) ;
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
        t.expect7(rgbGray.gray).is(0.5) ;
    }) ;
    group.unary("TSColor.toAlpha() and TSColor.toOpacity()", async(t) => {
        const yaRGB1 = yellowRGB.toAlpha(127 as uint8) ;
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
        t.expect6(yellowRGB.toOpacity(0.5).toString({ rgbaCSSLike:true })).is('#ffff007f') ;
    }) ;
}) ;
