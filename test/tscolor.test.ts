import { TSColor } from '../src/tscolor';
import { TSTest } from '../src/tstester';

export const colorGroups = TSTest.group("TSColor class ", async (group) => {

    group.unary("verifying colors creation", async(t) => {
        t.expect(TSColor.color('ff0')).toBe(TSColor.yellow) ;
        t.expect(TSColor.color('#ff0')).toBe(TSColor.yellow) ;
        t.expect(TSColor.color('ffff00')).toBe(TSColor.yellow) ;
        t.expect(TSColor.color('#ffff00')).toBe(TSColor.yellow) ;
        t.expect(TSColor.color('#FffF00')).toBe(TSColor.yellow) ;
        t.expect(TSColor.color('#ffff00ff')).toBe(TSColor.yellow) ;
        t.expect(TSColor.color('#FFFF00FF')).toBe(TSColor.yellow) ;
        t.expect(TSColor.color('Yellow')).toBe(TSColor.yellow) ;
        t.expect(TSColor.color(0xffff00)).toBe(TSColor.yellow) ;
        t.expect(TSColor.color(255,255,0)).toBe(TSColor.yellow) ;
        t.expect(TSColor.color(255,255,0,255)).toBe(TSColor.yellow) ;
    }) ;

    group.unary("verifying colors names", async(t) => {
        t.expect(TSColor.red.name).toBe('red') ;
        t.expect(TSColor.color('White').name).toBe('white') ;
        t.expect(TSColor.color('#fff').name).toBe('white') ;
        t.expect(TSColor.color('#FFFFFF').name).toBe('white') ;
        t.expect(TSColor.color('fff').name).toBe('white') ;
        t.expect(TSColor.color('FFFFFF').name).toBe('white') ;
        t.expect(TSColor.color('#FFFFFFFF').name).toBe('white') ;
        t.expect(TSColor.color('FFFFFFFF').name).toBe('white') ;
        t.expect(TSColor.cyan.name).toBe('cyan') ;
        t.expect(TSColor.color('aquamarine').name).toBe('aquamarine') ;
        t.expect(TSColor.color("#7fffd4").name).toBe('aquamarine') ;
        t.expect(new TSColor('aquamarine').name).toBe('aquamarine') ;
        t.expect(new TSColor('#7fffd4').name).toBe('aquamarine') ;

    }) ;

}) ;
