import { $uuid } from '../src/crypto';
import { $subclassReponsabililty, TSError, TSUniqueError } from '../src/tserrors';
import { Resp } from '../src/tsrequest';
import { TSTest } from '../src/tstester';
import { TSDictionary } from '../src/types';
import { $inbrowser } from '../src/utils';
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
        t.expect(() => instance.method(12)).toThrow((e:any) => {
            const info:TSDictionary|undefined = e instanceof TSError ? e.info : undefined ;
            t.expect0(info?.object?.identifier).is(identifier) ;
            t.expect1(info?.method?.name).is('method') ;
            return true ;
        }) ;
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

        // the thrown error keeps its properties across throw / catch
        t.expect(() => { throw e ; }).toThrow((ee:any) => {
            t.expectP(ee.message).is('AAAA') ;
            t.expectQ(ee.errorCode).is(23) ;
            t.expectR(ee.info?.msg).is('XXX') ;
            return true ;
        }) ;

        t.expect(() => TSError.throw('HTTP 404 error', Resp.NotFound)).toThrow((ee:any) => {
            t.expectS(ee.message).is('HTTP 404 error') ;
            t.expectT(ee.status).is(Resp.NotFound) ;
            return true ;
        }) ;

        t.expect(() => TSError.throw('HTTP error')).toThrow((ee:any) => {
            t.expectU(ee.message).is('HTTP error') ;
            t.expectV(ee.status).is(Resp.InternalError) ;
            return true ;
        }) ;
    }) ;

    group.unary("TSError constructor — remaining shapes", async (t) => {
        t.expect0(new (TSError as any)().message).is(TSError.DefaultMessage) ; // no args
        const e = new TSError('boom', 25, { a:1 }) ;                          // errorCode then info
        t.expect1(e.errorCode).is(25) ;
        t.expect2(e.info?.a).is(1) ;
        t.expect3(new TSError('x', null, null).info).undef() ;                // both null
        t.expect4(new (TSError as any)('x', 7, 9).errorCode).is(9) ;          // last number wins
    }) ;

    group.unary("TSError.throw() with no argument", async (t) => {
        t.expect(() => (TSError.throw as any)()).toThrow(/did throw/) ;
    }) ;

    group.unary("TSError errorCode / status setters", async (t) => {
        const e = new TSError('x') ;
        e.errorCode = 3.5 as any ;   t.expect0(e.errorCode).toBeNaN() ;       // non-int ignored
        e.errorCode = null ;         t.expect1(e.errorCode).toBeNaN() ;
        e.errorCode = 12 ;           t.expect2(e.errorCode).is(12) ;
        e.status = Resp.NotFound ;   t.expect3(e.errorCode).is(Resp.NotFound as unknown as number) ;
        t.expect4(e.status).is(Resp.NotFound) ;
        e.status = 123456 as any ;   t.expect5(e.errorCode).is(Resp.NotFound as unknown as number) ; // unknown status ignored
        t.expect6(e.entries().length).gt(0) ;
    }) ;

    group.unary("TSError.assertIntParam / assertUnsignedParam / assertNotInBrowser", async (t) => {
        t.expect0(() => TSError.assertIntParam(3, 'fn', 'p')).doesNotThrow() ;
        t.expect1(() => TSError.assertIntParam(null, 'fn', 'p')).doesNotThrow() ;   // null accepted
        t.expect2(() => TSError.assertIntParam(3.5, 'fn', 'p')).throws(/must be an integer/) ;
        t.expect3(() => TSError.assertUnsignedParam(0, 'fn', 'p')).doesNotThrow() ;
        t.expect4(() => TSError.assertUnsignedParam(-1, 'fn', 'p')).throws(/must be an unsigned/) ;
        if ($inbrowser()) { t.expect5(() => TSError.assertNotInBrowser('fn')).throws(/in browser/) ; }
        else              { t.expect5(() => TSError.assertNotInBrowser('fn')).doesNotThrow() ; }
        t.expect6(() => TSError.assert(false)).throws(/assert\(\) did fail/) ;
        t.expect7(() => TSError.assert(false, 'custom msg', 42)).throws('custom msg') ;
    }) ;

    group.unary("TSUniqueError singletons", async (t) => {
        t.expect0(TSUniqueError.genericError()).is(TSUniqueError.genericError()) ; // same instance
        t.expect1(TSUniqueError.timeoutError()).is(TSUniqueError.timeoutError()) ;
        t.expect2(TSUniqueError.genericError() === TSUniqueError.timeoutError()).false() ;
        t.expect3(TSUniqueError.genericError().name).is('GenericSingletonError') ;
        t.expect4(TSUniqueError.timeoutError().leafInspect()).is('TimeoutSingletonError') ;
        t.expect5(TSUniqueError.genericError() instanceof Error).true() ;
    }) ;

    group.unary("$subclassReponsabililty() on a static method", async (t) => {
        class C { static build():any { return $subclassReponsabililty(C, C.build) ; } }
        t.expect(() => C.build()).toThrow((e:any) => {
            t.expect0(e instanceof TSError).true() ;
            t.expect1(e.info?.isStatic).true() ;
            t.expect2(e.message.includes('static method')).true() ;
            t.expect3(e.message.includes('.build()')).true() ;
            return true ;
        }) ;
    }) ;
}) ;

