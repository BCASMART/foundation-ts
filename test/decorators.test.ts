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

}

export const decoratorGroups = TSTest.group("Decorators", async (group) => {
    

    group.unary('@TSTrace', async (t) => {
        const logs:string[] = [] ;
        let currentLog = '' ;
        TSTracer.log = (s:string) => { currentLog += s ; logs.push(currentLog) ; currentLog = '' ; }
        TSTracer.write = (s:string) => { currentLog += s ; }

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

        // a traced method that throws must log the error and rethrow it
        let threw = false ;
        try { p1.boom() ; } catch (e) { threw = (e as Error).message === 'kaboom' ; }
        t.expect4(threw).true() ;
        t.expect5(logs.some(l => l.includes('did encounter error'))).true() ;

        TSTracer.log = TSTracer.originalLog ;
        TSTracer.write = TSTracer.originalWrite ;

        // exercise the default sinks (originalLog / originalWrite)
        t.expect6(() => { TSTracer.originalLog('') ; TSTracer.originalWrite('') ; }).doesNotThrow() ;

    }) ;
}) ;
