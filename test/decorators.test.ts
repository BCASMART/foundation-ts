import { TSTest } from "../src/tstester";
import { TSTrace, TSTracer } from "../src/decorators"

class P {
    constructor(public firstName:string, public lastName:string) {}

    @TSTrace
    // @ts-ignore
    public completeName():string { return `${this.firstName.capitalize()} ${this.lastName.toLocaleUpperCase()}` ; }

    @TSTrace
    // @ts-ignore
    public computation(n:number) { for (let i = 0 ; i < n ; i++) {} }

    @TSTrace
    // @ts-ignore
    public square(n:number) { return n*n ; }

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

        TSTracer.log = TSTracer.originalLog ;
        TSTracer.write = TSTracer.originalWrite ;

    }) ;
}) ;
