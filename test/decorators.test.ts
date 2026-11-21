import { TSTest } from "../src/tstester";
import { TSTrace, TSTracer } from "../src/decorators"

class P {
    constructor(public firstName:string, public lastName:string) {}

    // @ts-ignore
    @TSTrace
    // @ts-ignore
    public completeName():string { return `${this.firstName.capitalize()} ${this.lastName.toLocaleUpperCase()}` ; }

    // @ts-ignore
    @TSTrace
    // @ts-ignore
    public computation(n:number) { for (let i = 0 ; i < n ; i++) {} }

    // @ts-ignore
    @TSTrace
    // @ts-ignore
    public square(n:number) { return n*n ; }

    // @ts-ignore
    @TSTrace
    // @ts-ignore
    public boom():void { throw new Error('kaboom') ; }

    // @ts-ignore
    @TSTrace()
    // @ts-ignore
    public static create(firstName:string):P { return new P(firstName, 'X') ; }

    // @ts-ignore
    @TSTrace
    // @ts-ignore
    public async later(n:number):Promise<number> { await new Promise(r => setTimeout(r, 5)) ; return n + 1 ; }

    // @ts-ignore
    @TSTrace
    // @ts-ignore
    public async laterBoom():Promise<number> { await new Promise(r => setTimeout(r, 5)) ; throw new Error('async kaboom') ; }
}

const ownLogs:string[] = [] ;
class Q {
    // @ts-ignore
    @TSTrace({ log:(s:string) => ownLogs.push(s), write:(s:string) => ownLogs.push(s), label:'Q.renamed' })
    // @ts-ignore
    public double(n:number) { return 2*n ; }
}

// collects the traces of the default outputs as lines
function _captureDefaultOutputs():string[] {
    const logs:string[] = [] ;
    let currentLog = '' ;
    TSTracer.setDefaults({
        log:(s:string) => { currentLog += s ; logs.push(currentLog) ; currentLog = '' ; },
        write:(s:string) => { currentLog += s ; }
    }) ;
    return logs ;
}

export const decoratorGroups = TSTest.group("Decorators", async (group) => {

    group.unary('@TSTrace', async (t) => {
        TSTracer.resetIndex() ;
        const logs = _captureDefaultOutputs() ;

        const p1 = new P('jean-philippe', 'Durand') ;
        const name = p1.completeName() ;
        p1.computation(100000) ;
        const s = p1.square(12) ;
        t.expect1(name).is('Jean-Philippe DURAND') ;
        t.expect2(s).is(144) ;
        const lines = logs.map(l => {
            return l.includes('---- executed') ? '---- done ----' : l ;
        }) ;

        t.expect3(lines).is([
            '&0',
            '&l---- trace &y0 &l----',
            "&oP&w.&pcompleteName&w(&c&w) = &j'Jean-Philippe DURAND'&0",
            '---- done ----',
            '&0',
            '&l---- trace &y1 &l----',
            '&oP&w.&pcomputation&w(&c100000&w) = &jundefined&0',
            '---- done ----',
            '&0',
            '&l---- trace &y2 &l----',
            '&oP&w.&psquare&w(&c12&w) = &j144&0',
            '---- done ----',
        ]) ;
        t.expect4(TSTracer.index).is(3) ;

        // a traced method that throws must log the error and rethrow it
        let threw = false ;
        try { p1.boom() ; } catch (e) { threw = (e as Error).message === 'kaboom' ; }
        t.expect5(threw).true() ;
        t.expect6(logs.some(l => l.includes('did encounter error'))).true() ;

        TSTracer.resetDefaults() ;
        t.expect7(TSTracer.defaultLog).is(TSTracer.originalLog) ;
        t.expect8(TSTracer.defaultWrite).is(TSTracer.originalWrite) ;

        // exercise the default sinks (originalLog / originalWrite)
        t.expect9(() => { TSTracer.originalLog('') ; TSTracer.originalWrite('') ; }).doesNotThrow() ;
    }) ;

    group.unary('@TSTrace on static methods', async (t) => {
        TSTracer.resetIndex() ;
        const logs = _captureDefaultOutputs() ;
        const p = P.create('ann') ;
        TSTracer.resetDefaults() ;
        t.expect0(p.firstName).is('ann') ;
        t.expect1(logs[2]).is("&oP&w.&pcreate&w(&c'ann'&w) = &jP { firstName: 'ann', lastName: 'X' }&0") ; // was "Function.create"
    }) ;

    group.unary('@TSTrace on asynchronous methods', async (t) => {
        TSTracer.resetIndex() ;
        const logs = _captureDefaultOutputs() ;
        const p = new P('a', 'b') ;
        const v = await p.later(1) ;
        let error = '' ;
        try { await p.laterBoom() ; } catch (e) { error = (e as Error).message ; }
        TSTracer.resetDefaults() ;
        t.expect0(v).is(2) ;
        t.expect1(error).is('async kaboom') ;
        t.expect2(logs[2]).is('&oP&w.&plater&w(&c1&w) = &jpromise&0') ;
        t.expect3(logs[3].startsWith('&l---- trace &y0&l resolved = &j2&l in &o')).true() ;  // the real result, when settled
        t.expect4(logs[6]).is('&oP&w.&platerBoom&w(&c&w) = &jpromise&0') ;
        t.expect5(logs[7]).is('&R&w trace 1 did encounter error Error: async kaboom &0') ; // the rejection is traced
    }) ;

    group.unary('@TSTrace() with options', async (t) => {
        TSTracer.resetIndex() ;
        const defaultLogs = _captureDefaultOutputs() ;
        const v = new Q().double(4) ;
        TSTracer.resetDefaults() ;
        t.expect0(v).is(8) ;
        t.expect1(defaultLogs).is([]) ;  // the specific outputs are used
        t.expect2(ownLogs.slice(0, 4)).is(['&0', '&l---- trace &y0 &l----', '&oQ&w.&prenamed&w(&c4&w) ', '= &j8&0']) ;
    }) ;

    group.unary('@TSTrace as a standard decorator', async (t) => {
        TSTracer.resetIndex() ;
        const logs:string[] = [] ;
        const context = { kind:'method', name:'triple', static:false, private:false } as any ;
        const triple = TSTrace({ log:(s:string) => logs.push(s), write:(s:string) => logs.push(s) })(function(this:any, n:number) { return 3*n ; }, context) ;
        class R { public triple = triple ; }
        t.expect0(new R().triple(2)).is(6) ;
        t.expect1(logs[2]).is('&oR&w.&ptriple&w(&c2&w) ') ;
        const plain = TSTrace(function(n:number) { return n ; }, context) ;
        t.expect2($isfunctionLike(plain)).true() ;
    }) ;
}) ;

function $isfunctionLike(f:any):boolean { return typeof f === 'function' ; }
