import { $map } from "./array";
import { $count, $isfunction } from "./commons";
import { $ellapsed, $inspect, $logterm, $mark, $writeterm } from "./utils";

export class TSTracer {
    public static index:number = 0 ;
    public static readonly originalLog = (s:string) => $logterm(s) ;
    public static readonly originalWrite = (s:string) => $writeterm(s) ;
    public static log:(s:string) => void = TSTracer.originalLog ; 
    public static write:(s:string) => void = TSTracer.originalWrite ;
}

export function TSTrace(target:any, name:string, descriptor:PropertyDescriptor)
{
    const property = descriptor.value ;

    if ($isfunction(property)) {        
        descriptor.value = function(...args:any[]) {
            const t = $mark() ;
            TSTracer.log('&0') ;
            TSTracer.log(`&l---- trace &y${TSTracer.index++} &l----`) ;
            TSTracer.write(`&o${target.constructor.name}&w.&p${name}&w(&c${$count(args)?$map(args, (a) => $inspect(a)).join('&w, &c'):''}&w) `) ;
            try {
                const res = property.apply(this, args) ;
                TSTracer.log(`= &j${$inspect(res)}&0`) ;
                TSTracer.log(`&l---- executed in &o${$ellapsed(t)}&l ----&0`) ;
                return res ;
            }
            catch (e) {
                TSTracer.log(`&R&w did encounter error ${e} &0`) ;
                throw e ;
            }
        }
    }
    return descriptor ;
}

