import { $uuid } from '../src/crypto';
import { $subclassReponsabililty, TSError } from '../src/tserrors';
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
        t.expect0(info?.object?.identifier).toBe(identifier) ;
        t.expect1(info?.method?.name).toBe('method') ;
    }) ;
}) ;

