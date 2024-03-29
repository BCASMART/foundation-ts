import { $uuid } from '../src/crypto';
import { $subclassReponsabililty, TSError } from '../src/tserrors';
import { Resp } from '../src/tsrequest';
import { TSTest } from '../src/tstester';
import { TSDictionary } from '../src/types';
//import { $logterm } from '../src/utils';

class A {
    constructor(public identifier:string) {}
    // @ts-ignore
    method(a:any):string {
        return $subclassReponsabililty(this, this.method) ;
    }
}

export const errorsGroups = TSTest.group("Error classes en functions tests", async (group) => {
    group.unary('$subclassReponsabililty() function', async (t) => {
        const identifier = $uuid() ;
        const instance = new A(identifier) ;
        let info:TSDictionary|undefined = undefined ;
        try {
            /*const res =*/ instance.method(12) ;
            //$logterm(`res = ${res}`) ;
        }
        catch(e) {
            if (e instanceof TSError) { info = e.info ; }
        }
        t.expect0(info?.object?.identifier).is(identifier) ;
        t.expect1(info?.method?.name).is('method') ;
    }) ;
    group.unary("TSError constructor", async (t) => {
        let e = new TSError("") ;
        t.expect0(e.message).is(TSError.DefaultMessage) ;
        e = new TSError('   ') ;
        t.expect1(e.message).is(TSError.DefaultMessage) ;
        
        e = new TSError('AAAA') ;
        t.expect2(e.message).is('AAAA') ;
        t.expect3(e.errorCode).toBeNaN() ;
        t.expect4(e.info).undef() ;

        e = new TSError('AAAA', 25) ;
        t.expect5(e.message).is('AAAA') ;
        t.expect6(e.errorCode).is(25) ;
        t.expect7(e.info).undef() ;

        e = new TSError('AAAA', {code: 2}) ;
        t.expect8(e.message).is('AAAA') ;
        t.expect9(e.errorCode).toBeNaN() ;
        t.expectA(e.info?.code).is(2) ;

        e = new TSError('AAAA', {msg: "XXX"}, 23) ;
        t.expectB(e.message).is('AAAA') ;
        t.expectC(e.errorCode).is(23) ;
        t.expectD(e.info?.msg).is("XXX") ;
        try {
            throw e
        }
        catch (ee) {
            const loc = ee as any ;
            t.expectP(loc.message).is('AAAA') ;
            t.expectQ(loc.errorCode).is(23) ;
            t.expectR(loc.info?.msg).is('XXX') ;
        }
        
        try {
            TSError.throw('HTTP 404 error', Resp.NotFound)
        }
        catch (ee) {
            const loc = ee as any ;
            t.expectS(loc.message).is('HTTP 404 error') ;
            t.expectT(loc.status).is(Resp.NotFound) ;
        }
        try {
            TSError.throw('HTTP error')
        }
        catch (ee) {
            const loc = ee as any ;
            t.expectU(loc.message).is('HTTP error') ;
            t.expectV(loc.status).is(Resp.InternalError) ;
        }

    })
}) ;

