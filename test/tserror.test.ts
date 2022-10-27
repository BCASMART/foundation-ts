import { $uuid } from '../src/crypto';
import { $subclassReponsabililty, TSError } from '../src/tserrors';
import { TSTest } from '../src/tstester';
import { AnyDictionary } from '../src/types';
//import { $logterm } from '../src/utils';

class A {
    constructor(public identifier:string) {}
    method(a:any):string {
        return $subclassReponsabililty(this, this.method) ;
    }
}

export const errorsGroups = TSTest.group("Error classes en functions tests", async (group) => {
    group.unary('verifying $subclassReponsabililty(instance, method)', async (t) => {
        const identifier = $uuid() ;
        const instance = new A(identifier) ;
        let info:AnyDictionary|undefined = undefined ;
        try {
            /*const res =*/ instance.method(12) ;
            //$logterm(`res = ${res}`) ;
        }
        catch(e) {
            if (e instanceof TSError) { info = e.info ; }
        }
        t.expect0(info?.object?.identifier).toBe(identifier) ;
        t.expect1(info?.method?.name).toBe('method') ;
    }) ;
}) ;

