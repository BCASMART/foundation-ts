import { $map } from "./array";
import { $count, $isfunction, $ok } from "./commons";
import { Nullable } from "./types";
import { $ellapsed, $inspect, $logterm, $mark, $writeterm } from "./utils";

export type TSTraceOutput = (s:string) => void ;

export interface TSTraceOptions {
    log?:TSTraceOutput | null ;   // outputs a line (default: TSTracer.defaultLog)
    write?:TSTraceOutput | null ; // outputs a string without line feed (default: TSTracer.defaultWrite)
    label?:string | null ;        // the name of the traced method in the traces (default: Class.method)
}

/**
 * A @TSTrace decorator. It can be used as a legacy decorator (with the `experimentalDecorators`
 * TypeScript option) or as a standard (TypeScript 5) method decorator.
 */
export interface TSTraceDecorator {
    (target:any, name:string|symbol, descriptor:PropertyDescriptor):PropertyDescriptor ;
    <F extends Function>(method:F, context:ClassMethodDecoratorContext):F ;
}

let __traceIndex = 0 ;
let __defaultLog:TSTraceOutput ;      // initialized just after TSTracer
let __defaultWrite:TSTraceOutput ;

export class TSTracer {
    public static readonly originalLog:TSTraceOutput = (s:string) => $logterm(s) ;
    public static readonly originalWrite:TSTraceOutput = (s:string) => $writeterm(s) ;

    // the number of the next trace
    public static get index():number { return __traceIndex ; }
    public static resetIndex() { __traceIndex = 0 ; }

    // the outputs used by the traced methods without specific log or write options
    public static get defaultLog():TSTraceOutput { return __defaultLog ; }
    public static get defaultWrite():TSTraceOutput { return __defaultWrite ; }

    // an absent, null or undefined output restores the original one
    public static setDefaults(opts:Nullable<Omit<TSTraceOptions, 'label'>>) {
        __defaultLog = opts?.log ?? TSTracer.originalLog ;
        __defaultWrite = opts?.write ?? TSTracer.originalWrite ;
    }
    public static resetDefaults() { TSTracer.setDefaults(null) ; }
}
TSTracer.resetDefaults() ;

/**
 * Traces the calls of a method, its parameters, its result (or its error) and its execution time.
 * The result of an asynchronous method (a thenable) is traced when it's settled.
 *
 *      @TSTrace                                    // default outputs
 *      @TSTrace({ log:myLogger, label:'find' })    // specific outputs or name
 */
export function TSTrace(target:any, name:string|symbol, descriptor:PropertyDescriptor):PropertyDescriptor ;
export function TSTrace<F extends Function>(method:F, context:ClassMethodDecoratorContext):F ;
export function TSTrace(opts?:Nullable<TSTraceOptions>):TSTraceDecorator ;
export function TSTrace(...args:any[]):any {
    return _isDecoratorCall(args) ? _decorate(args, {}) : (...dargs:any[]) => _decorate(dargs, args[0] ?? {}) ;
}

// ====================== private functions ======================

// legacy decorator: (target, name, descriptor). standard decorator: (method, context)
function _isDecoratorCall(args:any[]):boolean {
    return (args.length === 3 && typeof args[2] === 'object') || (args.length === 2 && _isStandardContext(args[1])) ;
}

function _isStandardContext(context:any):boolean { return typeof context === 'object' && $ok(context) && typeof context.kind === 'string' ; }

function _decorate(args:any[], opts:TSTraceOptions):any {
    if (_isStandardContext(args[1])) {
        // standard decorator: we only know the class of the receiver
        const [method, context] = args as [Function, ClassMethodDecoratorContext] ;
        const methodName = String(context.name) ;
        return $isfunction(method) ? _tracedMethod(method, opts, receiver => `${_className(receiver)}.${methodName}`) : method ;
    }
    // legacy decorator: target is the prototype of the class (or the class itself for a static method)
    const [target, name, descriptor] = args as [any, string|symbol, PropertyDescriptor] ;
    if ($isfunction(descriptor?.value)) {
        const label = `${_className(target)}.${String(name)}` ;
        descriptor.value = _tracedMethod(descriptor.value, opts, () => label) ;
    }
    return descriptor ;
}

function _className(o:any):string { return typeof o === 'function' ? o.name : o?.constructor?.name ; }

function _tracedMethod(method:Function, opts:TSTraceOptions, defaultLabel:(receiver:any) => string):Function {
    return function(this:any, ...args:any[]) {
        const log = opts.log ?? __defaultLog ;
        const write = opts.write ?? __defaultWrite ;
        const index = __traceIndex++ ;
        const label = opts.label ?? defaultLabel(this) ;
        const t = $mark() ;
        log('&0') ;
        log(`&l---- trace &y${index} &l----`) ;
        write(`&o${_traceLabel(label)}&w(&c${$count(args)?$map(args, (a) => $inspect(a)).join('&w, &c'):''}&w) `) ;
        let res:any ;
        try { res = method.apply(this, args) ; }
        catch (e) {
            log(`&R&w did encounter error ${e} &0`) ;
            throw e ;
        }
        if (!_isThenable(res)) {
            log(`= &j${$inspect(res)}&0`) ;
            log(`&l---- executed in &o${$ellapsed(t)}&l ----&0`) ;
            return res ;
        }
        // other traces may happen before our result is settled, so we end our line now
        log('= &jpromise&0') ;
        return res.then((v:any) => {
            log(`&l---- trace &y${index}&l resolved = &j${$inspect(v)}&l in &o${$ellapsed(t)}&l ----&0`) ;
            return v ;
        }, (e:any) => {
            log(`&R&w trace ${index} did encounter error ${e} &0`) ;
            throw e ;
        }) ;
    }
}

// the class name is in orange and the method name in pink
function _traceLabel(label:string):string {
    const i = label.lastIndexOf('.') ;
    return i < 0 ? `&p${label}` : `${label.slice(0, i)}&w.&p${label.slice(i + 1)}` ;
}

function _isThenable(v:any):boolean { return $ok(v) && $isfunction(v.then) ; }
