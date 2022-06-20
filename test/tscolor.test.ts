import { TSColor, TSColorSpace } from '../src/tscolor';
import { TSTest } from '../src/tstester';

// TOTO

export const colorGroups = TSTest.group("TSColor class ", async (group) => {
    const yellowRGB = TSColor.rgb('Yellow') ;
    const yellowCMYK = TSColor.yellow ;
    const realGray = TSColor.grayscale(0.5) ;
    const rgbGray = TSColor.rgbcomponents(0.5,0.5,0.5) ;
    const [H1,S1,B1] = yellowRGB.hsb() ;
    const [H2,S2,L2] = yellowRGB.hsl() ;
    const [H3,S3,B3] = yellowCMYK.hsb() ;
    const [H4,S4,L4] = yellowCMYK.hsl() ;
    const [H5,S5,B5] = realGray.hsb() ;
    const [H6,S6,B6] = rgbGray.hsb() ;
    
    group.unary("verifying colors creation", async(t) => {
        t.expect(TSColor.rgb('ff0')).toBe(yellowRGB) ;
        t.expect(TSColor.rgb('#ff0')).toBe(yellowRGB) ;
        t.expect(TSColor.rgb('ffff00')).toBe(yellowRGB) ;
        t.expect(TSColor.rgb('#ffff00')).toBe(yellowRGB) ;
        t.expect(TSColor.rgb('#FffF00')).toBe(yellowRGB) ;
        t.expect(TSColor.rgb('#ffff00ff')).toBe(yellowRGB) ;
        t.expect(TSColor.rgb('#FFFF00FF')).toBe(yellowRGB) ;
        t.expect(TSColor.rgb(0xffff00)).toBe(yellowRGB) ;
        t.expect(TSColor.rgb(255,255,0)).toBe(yellowRGB) ;
        t.expect(TSColor.rgb(255,255,0,255)).toBe(yellowRGB) ;
        t.expect(TSColor.rgbcomponents(1,1,0)).toBe(yellowRGB) ;
        t.expect(TSColor.rgbcomponents(1,1,0,1)).toBe(yellowRGB) ;
        t.expect(TSColor.rgb(0xffff00)).toBe(yellowRGB) ;
        t.expect(TSColor.cmyk(0, 0, 1, 0)).toBe(yellowCMYK) ;
        t.expect(yellowRGB.colorSpace).toBe(TSColorSpace.RGB) ;
        t.expect(yellowCMYK.colorSpace).toBe(TSColorSpace.CMYK) ;
        t.expect(realGray.colorSpace).toBe(TSColorSpace.Grayscale) ;
    }) ;

    group.unary("verifying colors similaryty", async(t) => {
        t.expect(yellowRGB.isSimilar(yellowRGB)).toBeTruthy()
        t.expect(yellowCMYK.isSimilar(yellowCMYK)).toBeTruthy()
        t.expect(yellowCMYK.isSimilar(yellowRGB)).toBeTruthy()
        t.expect(yellowRGB.isSimilar(yellowCMYK)).toBeTruthy()
        t.expect(TSColor.rgb('blue').isSimilar(TSColor.blue)).toBeTruthy()
        t.expect(TSColor.blue.isSimilar(TSColor.rgb('blue'))).toBeTruthy()
        t.expect(TSColor.rgb('red').isSimilar(TSColor.red)).toBeTruthy()
        t.expect(TSColor.red.isSimilar(TSColor.rgb('red'))).toBeTruthy()
        t.expect(TSColor.rgb('green').isSimilar(TSColor.green)).toBeTruthy()
        t.expect(TSColor.green.isSimilar(TSColor.rgb('green'))).toBeTruthy()
        t.expect(TSColor.cmyk(0,0,0,0.5).isSimilar(realGray)).toBeTruthy()
        t.expect(realGray.isSimilar(TSColor.rgb(127,127,127))).toBeTruthy()
        t.expect(realGray.isSimilar(rgbGray)).toBeTruthy()
    }) ;

    group.unary("verifying colors names", async(t) => {
        t.expect(TSColor.rgb('red').name).toBe('red') ;
        t.expect(TSColor.red.name).toBe('') ;
        t.expect(TSColor.rgb('White').name).toBe('white') ;
        t.expect(TSColor.rgb('#fff').name).toBe('white') ;
        t.expect(TSColor.rgb('#FFFFFF').name).toBe('white') ;
        t.expect(TSColor.rgb('fff').name).toBe('white') ;
        t.expect(TSColor.rgb('FFFFFF').name).toBe('white') ;
        t.expect(TSColor.rgb('#FFFFFFFF').name).toBe('white') ;
        t.expect(TSColor.rgb('FFFFFFFF').name).toBe('white') ;
        t.expect(TSColor.rgb(0xffffff).name).toBe('white') ;
        t.expect(TSColor.rgb(0xffffffff).name).notToBe('white') ;
        t.expect(TSColor.rgbcomponents(1,1,1).name).toBe('white') ;
        t.expect(TSColor.cyan.name).toBe('') ;
        t.expect(TSColor.rgb('aquamarine').name).toBe('aquamarine') ;
        t.expect(TSColor.rgb("#7fffd4").name).toBe('aquamarine') ;
    }) ;

    group.unary("verifying HSB/HSL components", async(t) => {
        t.expect([H1, S1, B1]).toBe([60,100,100]) ;
        t.expect([H2, S2, L2]).toBe([60,100,50]) ;
        t.expect([H3, S3, B3]).toBe([60,100,100]) ;
        t.expect([H4, S4, L4]).toBe([60,100,50]) ;
        t.expect([H5, S5, B5]).toBe([0,0,50]) ;
        t.expect([H6, S6, B6]).toBe([0,0,50]) ;
        t.expect(realGray.gray).toBe(0.5) ;
        t.expect(rgbGray.gray).toBe(0.5) ;
    }) ;

}) ;
