import { TSColor, TSColorSpace } from '../src/tscolor';
import { TSTest } from '../src/tstester';
import { uint8 } from '../src/types';

// TOTO

export const colorGroups = TSTest.group("TSColor class ", async (group) => {
    const yellowRGB = TSColor.rgb('Yellow') ;
    const yellowCMYK = TSColor.yellow ;
    const realGray = TSColor.grayscale(0.5) ;
    const rgbGray = TSColor.rgbcomponents(0.5,0.5,0.5) ;
    const cmykGray = TSColor.cmyk(0,0,0,0.5) ;

    const [H1,S1,B1] = yellowRGB.hsb() ;
    const [H2,S2,L2] = yellowRGB.hsl() ;
    const [H3,S3,B3] = yellowCMYK.hsb() ;
    const [H4,S4,L4] = yellowCMYK.hsl() ;
    const [H5,S5,B5] = realGray.hsb() ;
    const [H6,S6,B6] = rgbGray.hsb() ;
    
    group.unary("verifying colors creation", async(t) => {
        t.expect0(TSColor.rgb('ff0')).toBe(yellowRGB) ;
        t.expect1(TSColor.rgb('#ff0')).toBe(yellowRGB) ;
        t.expect2(TSColor.rgb('ffff00')).toBe(yellowRGB) ;
        t.expect3(TSColor.rgb('#ffff00')).toBe(yellowRGB) ;
        t.expect4(TSColor.rgb('#FffF00')).toBe(yellowRGB) ;
        t.expect5(TSColor.rgb('#ffff00ff')).toBe(yellowRGB) ;
        t.expect6(TSColor.rgb('#FFFF00FF')).toBe(yellowRGB) ;
        t.expect7(TSColor.rgb(0xffff00)).toBe(yellowRGB) ;
        t.expect8(TSColor.rgb(255,255,0)).toBe(yellowRGB) ;
        t.expect9(TSColor.rgb(255,255,0,255)).toBe(yellowRGB) ;
        t.expectA(TSColor.rgbcomponents(1,1,0)).toBe(yellowRGB) ;
        t.expectB(TSColor.rgbcomponents(1,1,0,1)).toBe(yellowRGB) ;
        t.expectC(TSColor.rgb(0xffff00)).toBe(yellowRGB) ;
        t.expectD(TSColor.cmyk(0, 0, 1, 0)).toBe(yellowCMYK) ;
        t.expectE(yellowRGB.colorSpace).toBe(TSColorSpace.RGB) ;
        t.expectF(yellowCMYK.colorSpace).toBe(TSColorSpace.CMYK) ;
        t.expectG(realGray.colorSpace).toBe(TSColorSpace.Grayscale) ;
    }) ;

    group.unary("verifying colors similaryty", async(t) => {
        t.expect0(yellowRGB.isSimilar(yellowRGB)).toBeTruthy() ;
        t.expect1(yellowCMYK.isSimilar(yellowCMYK)).toBeTruthy() ;
        t.expect2(yellowCMYK.isSimilar(yellowRGB)).toBeTruthy() ;
        t.expect3(yellowRGB.isSimilar(yellowCMYK)).toBeTruthy() ;
        t.expect4(TSColor.rgb('blue').isSimilar(TSColor.blue)).toBeTruthy() ;
        t.expect5(TSColor.blue.isSimilar(TSColor.rgb('blue'))).toBeTruthy() ;
        t.expect6(TSColor.rgb('red').isSimilar(TSColor.red)).toBeTruthy() ;
        t.expect7(TSColor.red.isSimilar(TSColor.rgb('red'))).toBeTruthy() ;
        t.expect8(TSColor.rgb('green').isSimilar(TSColor.green)).toBeTruthy() ;
        t.expect9(TSColor.green.isSimilar(TSColor.rgb('green'))).toBeTruthy() ;
        t.expectA(TSColor.cmyk(0,0,0,0.5).isSimilar(realGray)).toBeTruthy() ;
        t.expectB(realGray.isSimilar(TSColor.rgb(127,127,127))).toBeTruthy() ;
        t.expectC(realGray.isSimilar(rgbGray)).toBeTruthy() ;
    }) ;

    group.unary("verifying colors conversion equality", async(t) => {
        t.expect0(yellowCMYK.toRGB()).toBe(yellowRGB) ;
        t.expect1(yellowRGB.toCMYK()).toBe(yellowCMYK) ;
        t.expect2(realGray.toCMYK()).toBe(cmykGray) ;
        t.expect3(realGray.toRGB()).toBe(rgbGray) ;
        t.expect4(cmykGray.toGrayscale()).toBe(realGray) ;
        t.expect5(rgbGray.toGrayscale()).toBe(realGray) ;
    }) ;

    group.unary("verifying colors names", async(t) => {
        t.expect0(TSColor.rgb('red').name).toBe('red') ;
        t.expect1(TSColor.red.name).toBe('') ;
        t.expect2(TSColor.rgb('White').name).toBe('white') ;
        t.expect3(TSColor.rgb('#fff').name).toBe('white') ;
        t.expect4(TSColor.rgb('#FFFFFF').name).toBe('white') ;
        t.expect5(TSColor.rgb('fff').name).toBe('white') ;
        t.expect6(TSColor.rgb('FFFFFF').name).toBe('white') ;
        t.expect7(TSColor.rgb('#FFFFFFFF').name).toBe('white') ;
        t.expect8(TSColor.rgb('FFFFFFFF').name).toBe('white') ;
        t.expect9(TSColor.rgb(0xffffff).name).toBe('white') ;
        t.expectA(TSColor.rgb(0xffffffff).name).notToBe('white') ;
        t.expectB(TSColor.rgbcomponents(1,1,1).name).toBe('white') ;
        t.expectC(TSColor.cyan.name).toBe('') ;
        t.expectD(TSColor.rgb('aquamarine').name).toBe('aquamarine') ;
        t.expectE(TSColor.rgb("#7fffd4").name).toBe('aquamarine') ;
    }) ;

    group.unary("verifying HSB/HSL components", async(t) => {
        t.expect0([H1, S1, B1]).toBe([60,100,100]) ;
        t.expect1([H2, S2, L2]).toBe([60,100,50]) ;
        t.expect2([H3, S3, B3]).toBe([60,100,100]) ;
        t.expect3([H4, S4, L4]).toBe([60,100,50]) ;
        t.expect4([H5, S5, B5]).toBe([0,0,50]) ;
        t.expect5([H6, S6, B6]).toBe([0,0,50]) ;
        t.expect6(realGray.gray).toBe(0.5) ;
        t.expect7(rgbGray.gray).toBe(0.5) ;
    }) ;
    group.unary("verifying toAlpha(...) and toOpacity(...) methods", async(t) => {
        const yaRGB1 = yellowRGB.toAlpha(127 as uint8) ;
        const yaRGB2 = yellowRGB.toOpacity(0.5) ;

        t.expect0(yaRGB2).toBe(yaRGB1) ;
    }) ;

}) ;
