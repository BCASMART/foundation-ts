import { inspect } from "util";

import { $count, $defined, $isarray, $isfunction, $isint, $ismethod, $isproperty, $isstring, $length, $ok, $unsigned } from "./commons";
import { $HTML, $normspaces } from "./strings";
import { FoundationHTMLEncoding } from "./string_tables";
import { Nullable, TSDataLike } from './types';
import { $bytesFromDataLike } from "./data";
import { $unit } from "./number";
import { Stream } from "stream";
import { TSError } from "./tserrors";

export const $noop = () => {} ;

enum TSBrowserOS {
    notInBrowser,
    unknownOS,
    android,
    iOS,
    linux,
    macOS,
    tvOS,
    windows
} ;

export function $browserOS():TSBrowserOS {
    if (!$defined(($browserOS as any).os)) {
        let inb = false ;
        let bs = TSBrowserOS.notInBrowser ;
        try { inb = $defined(window) && ($defined(navigator) || !$isproperty(process, 'stdout') || !$ismethod(process?.stdout, 'write')) ; }
        catch { inb = false ; }
        if (inb) {
            bs = TSBrowserOS.unknownOS ;
            var agent = window.navigator.userAgent.toLowerCase() ;
            if (agent.indexOf('win') >= 0) { bs = TSBrowserOS.windows ; }
            else if (agent.indexOf('android') >= 0) { bs = TSBrowserOS.android ; }
            else if (agent.indexOf('ipad') >= 0 || agent.indexOf('iphone') >= 0) { bs = TSBrowserOS.iOS ; }
            else if (agent.indexOf('appletv') >= 0 ) { bs = TSBrowserOS.tvOS ; }
            else if (agent.indexOf('debian') >= 0 || agent.indexOf('ubuntu') >= 0 || agent.indexOf('centos') >= 0 || 
                     agent.indexOf('fedora') >= 0 || agent.indexOf('red hat') >= 0 || agent.indexOf('suze') >= 0 || 
                     agent.indexOf('linux') >= 0) { bs = TSBrowserOS.linux ; } // we don't test for other linux of other unix
            else if (agent.indexOf('mac')) { bs = TSBrowserOS.macOS ; }
        }
        ($browserOS as any).os = bs ;
    }
    return ($browserOS as any).os ;
}

export function $inbrowser():boolean { return $browserOS() !== TSBrowserOS.notInBrowser ; }

export function $exit(errorCode?:number):never {
    if (!$isint(errorCode)) { errorCode = 0 ; }
    
    if (!$inbrowser() && process && typeof process?.exit === 'function') {
        process.exit(errorCode!) ; // if it does not work, we throw an exception anyway
    }
    TSError.throw(`Premature exit with code ${errorCode}`, errorCode!) ;
}

export function $mark():number {
    if (!$inbrowser() && process && typeof process?.hrtime === 'function') {
        const [seconds, nanoSeconds] = process!.hrtime() ;
        return seconds + nanoSeconds / 1000000000.0 ;
    }
    else if (typeof window?.performance?.now === 'function') {
        return window!.performance!.now() / 1000.0 ;
    }
    else {
        return Date.now() / 1000.0 ;
    }
}

export function $ellapsed(previousMark:number):string { 
    return $unit($mark() - previousMark, {
        unitName:"second",
        unit:"s",
        decimalPlaces:3,
        minimalUnit:-2,
        ignoreZeroDecimals:true,
        ignoreMinimalUnitDecimals:true
    }) ;
}

export async function $sleep(ms:number) { new Promise(res => setTimeout(res, ms)) ; }

export function $timeout(promise:Promise<any>, time:number, exception:any) : Promise<any> {
	let timer:any ;
	return Promise.race([
		promise, 
		new Promise((_,rejection) => timer = setTimeout(rejection, time, exception))
	]).finally(() => clearTimeout(timer)) ;
}

export async function $readStreamBuffer(stream:Nullable<Stream>):Promise<Buffer|null> {
    if (!$ok(stream)) { return null ; }
    return new Promise((resolve, reject) => {
        let chunks:Array<Buffer> = [] ;
        stream!.on("data", (chunk:Buffer) => chunks.push(chunk));
        stream!.on("end", () => resolve(Buffer.concat(chunks)));
        stream!.on("error", _ => reject(null));
    }) ;
}


export function $inspect(v:any, level?:number) { return $inbrowser() ? _tsinspect(v, level) : _nodeInspect(v, level) ; }
export function $insp(v:any, level?:number) { return _tsinspect(v, level) ; }

export function $term(s:string, escapeChar:string = '&'):string {
    if ($inbrowser()) { return $termclean(s, escapeChar) ; }
    let fmtlen = $length(s) ;
    let ret = "" ;
    if (fmtlen) {
        let escape = false ;
        if ($length(escapeChar) !== 1 || escapeChar == '\x1b') { escapeChar = '&' ; }
        for (let i = 0 ; i < fmtlen ; i++) {
            const c = s.charAt(i) ;
            if (escape) {
                escape = false ;
                switch (c) {
                    case escapeChar: ret += escapeChar ; break ;

                    case '0': ret += "\x1b[0m"  ; break ;           // reset

                    // styles
                    case '1': ret += "\x1b[1m"  ; break ;           // bright mode (old version)
                    case '!': ret += "\x1b[1m"  ; break ;           // bright mode
                    case '>': ret += "\x1b[2m"  ; break ;           // dimmed (old version)
                    case '?': ret += "\x1b[2m"  ; break ;           // dimmed
                    case '/': ret += "\x1b[3m"  ; break ;           // italic
                    case '_': ret += "\x1b[4m"  ; break ;           // underscore
                    case '%': ret += "\x1b[5m"  ; break ;           // blinked
                    case '<': ret += "\x1b[7m"  ; break ;           // inversed
                    case '-': ret += "\x1b[9m"  ; break ;           // strikethrough

                    // screen + cursor
                    case 'h': ret += "\x1b[0G"; break ;             // put the cursor at the beginning of the current line
                    case 'H': ret += "\x1b[H"; break ;              // put the cursor home
                    case 'z': ret += '\x1b[2K\x1b[0G' ; break ;     // clear current line and put the cursor at the first column
                    case 'Z': ret += '\x1b[2J\x1b[H' ; break ;      // clear the whole terminal and put the cursor home

                    // colors
                    case 'a': ret += "\x1b[38;5;216m" ; break ;     // apricot font
                    case 'A': ret += "\x1b[48;5;216m" ; break ;     // apricot background
                    case 'b': ret += "\x1b[34m" ; break ;           // blue font
                    case 'B': ret += "\x1b[44m" ; break ;           // blue background
                    case 'c': ret += "\x1b[36m" ; break ;           // cyan font
                    case 'C': ret += "\x1b[46m" ; break ;           // cyan background
                    case 'd': ret += "\x1b[38;5;238m" ; break ;     // dark gray font
                    case 'D': ret += "\x1b[48;5;238m" ; break ;     // dark gray background
                    case 'e': ret += "\x1b[38;5;229m" ; break ;     // egg white font
                    case 'E': ret += "\x1b[48;5;229m" ; break ;     // egg white background
                    // fF
                    case 'g': ret += "\x1b[32m" ; break ;           // green font  
                    case 'G': ret += "\x1b[42m" ; break ;           // green background                    
                    // h/H is for the cursor home
                    // iI
                    case 'j': ret += "\x1b[38;5;121m" ; break ;     // jungle green font
                    case 'J': ret += "\x1b[48;5;121m" ; break ;     // jungle green background
                    case 'k': ret += "\x1b[30m" ; break ;           // black font
                    case 'K': ret += "\x1b[40m" ; break ;           // black background
                    case 'l': ret += "\x1b[38;5;252m" ; break ;     // light gray font
                    case 'L': ret += "\x1b[48;5;252m" ; break ;     // light gray background
                    case 'm': ret += "\x1b[35m" ; break ;           // magenta font
                    case 'M': ret += "\x1b[45m" ; break ;           // magenta background
                    case 'o': ret += "\x1b[38;5;208m" ; break ;     // orange font
                    case 'O': ret += "\x1b[48;5;208m" ; break ;     // orange background
                    case 'p': ret += "\x1b[38;5;212m" ; break ;     // pink font
                    case 'P': ret += "\x1b[48;5;212m" ; break ;     // pink background
                    // qQ
                    case 'r': ret += "\x1b[31m" ; break ;           // red font
                    case 'R': ret += "\x1b[41m" ; break ;           // red background
                    // sS
                    // tT
                    case 'u': ret += "\x1b[38;5;117m"  ; break ;    // uranian blue font
                    case 'U': ret += "\x1b[48;5;117m"  ; break ;    // uranian blue background
                    case 'v': ret += "\x1b[38;5;99m"  ; break ;     // violet font
                    case 'V': ret += "\x1b[48;5;99m"  ; break ;     // violet background
                    case 'w': ret += "\x1b[37m" ; break ;           // white font 
                    case 'W': ret += "\x1b[47m" ; break ;           // white background
                    case 'x': ret += "\x1b[38;5;244m" ; break ;     // gray font
                    case 'X': ret += "\x1b[48;5;244m" ; break ;     // gray background
                    case 'y': ret += "\x1b[33m" ; break ;           // yellow font
                    case 'Y': ret += "\x1b[43m" ; break ;           // yellow background
                    // zZ are for clearing the screen

                    default:
                        ret += escapeChar ;
                        ret += c ;
                        break ;
                }
            }
            else if (c === escapeChar) { escape = true ; }
            else { ret += c ; }
        }    
        if (escape) { ret += escapeChar ; }
    }
    return ret ;
}

export function $termclean(s:string, escapeChar:string = '&'):string {
    let len = $length(s) ;
    let ret = "" ;
    if (len) {
        enum State { Standard, EscapeChar, EscapeEscape} ;
        let state = State.Standard ;
        let i = 0 ;
        let escapeSequenceStart = 0 ;
        if ($length(escapeChar) !== 1 || escapeChar == '\x1b') { escapeChar = '&' ; }
        while (i < len) {
            const c = s.charAt(i) ;
            switch (state) {
                case State.Standard:
                    if (c === escapeChar) { state = State.EscapeChar ; }
                    else if (c === '\x1b') { state = State.EscapeEscape ; escapeSequenceStart = i ;}
                    else { ret += c ; }
                    break ;
                case State.EscapeEscape:
                    if ('mGHJK'.includes(c)) { state = State.Standard ;}
                    else if (!"[0123456789;".includes(c)) { 
                        state = State.Standard ;
                        ret += '\x1b' ; 
                        i = escapeSequenceStart ; 
                    }
                    break ;
                case State.EscapeChar:
                    if (c === escapeChar) { ret += escapeChar ; }
                    else if (!"01>/_%<-?!aAbBcCdDeEgGhHjJkKlLmMoOpPrRuUvVwWxXyYzZ".includes(c)) { 
                        ret += escapeChar ;
                        i-- ; 
                    }
                    state = State.Standard ;
            }
            i++ ;
        }
    }
    return ret ;
}

export function $logterm(format:string, ...args:any[]) {
    return _logwriteterm(true, format, args)
}

export function $writeterm(format:string, ...args:any[]) {
    return _logwriteterm(false, format, args)
}

export function $hexadump(source:Nullable<TSDataLike>) {
    let data = $ok(source) ? $bytesFromDataLike(source!) : [] ;
    let sourceLen = data.length ;
    let len = sourceLen % 16 > 0 ? sourceLen + 16 - sourceLen % 16 : sourceLen ;
    $logterm("&0&x         00 01 02 03 04 05 06 07 08 09 0A 0B 0C 0D 0E 0F chars&0") ;
    $logterm("&0&x---------------------------------------------------------------------------&0") ;

    function _H(x:number):string { return (x < sourceLen ? data[x] : 0).toHex2() ; }
    function _B(x:number):string { return x < sourceLen ? (data[x] === 38 ? String.fromCharCode(0xff08) : (data[x] >= 32 && data[x] < 128 ? String.fromCharCode(data[x]) : '&B⋅&G')):'' ; }
    
    for (let p = 0 ; p < len ; p += 16) {
        $logterm(`&0&j${p.toHex8()} ${_H(p)} ${_H(p+1)} ${_H(p+2)} ${_H(p+3)} ${_H(p+4)} ${_H(p+5)} ${_H(p+6)} ${_H(p+7)} ${_H(p+8)} ${_H(p+9)} ${_H(p+10)} ${_H(p+11)} ${_H(p+12)} ${_H(p+13)} ${_H(p+14)} ${_H(p+15)} &w&G&w ${_B(p)}${_B(p+1)}${_B(p+2)}${_B(p+3)}${_B(p+4)}${_B(p+5)}${_B(p+6)}${_B(p+7)}${_B(p+8)}${_B(p+9)}${_B(p+10)}${_B(p+11)}${_B(p+12)}${_B(p+13)}${_B(p+14)}${_B(p+15)} &0`) ;
    }
    
    $logterm("&0&x---------------------------------------------------------------------------&0") ;
}

export function $logheader(s: string, width: number = 0, style: string = '&w', starStyle: string = '&x')
{
    if (!width) { width = s.length; }
    $logterm("\n&0" + starStyle + "".padEnd(width + 4, '*'));
    $logterm(starStyle + '* ' + style + s.padEnd(width + 1, ' ') + '&0' + starStyle + '*');
    $logterm(starStyle + "".padEnd(width + 4, '*') + "&0\n");
}


export interface TSCall {
    getFunction(): (...args: any[]) => any | undefined;
	getFunctionName(): string | null;
	getMethodName(): string | undefined;
	getFileName(): string | null;
	getLineNumber(): number | null;
	getColumnNumber(): number | null;
	getEvalOrigin(): string | undefined;
	getTypeName(): string | null;
	getThis(): unknown | undefined;
}

export function $stack():TSCall[] {
    const previousPrepareStackTrace = Error.prepareStackTrace;
	Error.prepareStackTrace = (_, stack) => stack;
	const stack = new Error().stack ;
	Error.prepareStackTrace = previousPrepareStackTrace;
	return stack as unknown as TSCall[];
}

// ================================== private functions, interfaces and classes ==============================

 
function _nodeInspect(v:any, level:number=10) { return inspect(v, false, level) ; }
interface _tsInspectEntry {
    key:any ;
    value:any ;
}
class _tsInspectNode {
    protected static __prefixString:string = "                                                                                                                                      " ;
    id?:number ;
    type?:string ;
    value:any ;
    level:number ;
    left:string = '{' ;
    right:string = '}' ;
    sepa:string = ': ' ;
    lineWidth:number = 70 ;

    constructor(level:number) {
        this.level = level ;
    }

    toString():string {
        const prefix = _tsInspectNode.__prefixString.slice(0, 2*this.level) ;
        let s = $defined(this.id) ? `<ref *${this.id}> `: '' ;
        if ($length(this.type)) { s += this.type!+' ' ; }

        s += this.left ;
        let continued = false ;
        for (let e of (this.value as _tsInspectEntry[])) {
            if (continued) { s += ',' ; }
            s+= `\n${prefix}  ${e.key}${this.sepa}`+ ($isstring(e.value) ? e.value : (e.value as any).toString()) ;
            continued = true ;
        }
        s += '\n' + prefix + this.right ;
        const s2 = $normspaces(s) ;
        return s2.length < this.lineWidth ? s2 : s ;
    }
}

class _tsArrayNode extends _tsInspectNode {
    constructor(level:number) {
        super(level) ;
        this.right = ']' ;
        this.left = '[' ;
    }

    toString():string {
        const plen = 2*this.level ;
        const prefix = _tsInspectNode.__prefixString.slice(0, plen) ;
        let s = $defined(this.id) ? `<ref *${this.id}> `: '' ;
        if ($length(this.type)) { s += this.type!+' ' ; }
        s += this.left ;
        let continued = false ;
        for (let o of this.value) {
            if (continued) { s += ',' ; }
            s+= '\n'+prefix+'  ' + ($isstring(o) ? o : o.toString()) ;
            continued = true ;
        }
        s += '\n' + prefix + this.right ;
        const s2 = $normspaces(s) ;
        return s2.length < this.lineWidth ? s2 : s ;
    }
}

class _tsSetNode extends _tsArrayNode {
    constructor(level:number) {
        super(level) ;
        this.right = '}' ;
        this.left = '{' ;
    }
}

interface _tsInspectContext {
    nextId:number ;
    max:number ;
    map:Map<any,_tsInspectNode> ;
}

function _tsinspect(v:any, level:number = 10):string {

    let inspectContext:_tsInspectContext = {
        nextId:1,
        max: Math.min($unsigned(level),63)+1,
        map: new Map<any,_tsInspectNode>(),
    } ;

    function _recursiveInspect(v:any, context:_tsInspectContext, level:number):any {
        const t = typeof v ;

        switch (t) {
            case 'string': { 
                const js = JSON.stringify(v) ;
                return "'"+js.slice(1, js.length-1)+"'" ;
            }
            case 'undefined': return 'undefined' ;
            case 'symbol':
            case 'boolean':
            case 'bigint':
            case 'number':  return `${v}` ;
            case 'function': return `[Function: ${(v as Function).name}]`;
            case 'object': {
                if (v === null) { return 'null' ; }
                else if ($isfunction(v.leafInspect)) {
                    return v.leafInspect() ;
                }
                let circularReference = context.map.get(v) ;
                if ($defined(circularReference)) {
                    if (!$defined(circularReference!.id)) {
                        circularReference!.id = context.nextId ;
                        context.nextId = context.nextId + 1 ;
                    }
                    return `[Circular *${circularReference!.id!}]`
                }
                
                // here we have to construct a circular reference
                const isSet = v instanceof Set ;
                if (isSet || $isarray(v)) {
                    if (level === context.max) { return isSet ? '[Set]' : '[Array]' ; }
                    if (isSet) { 
                        v = Array.from(v) ;
                        circularReference = new _tsSetNode(level) ; 
                        circularReference.type = `Set(${v.length})` ;
                    }
                    else {
                        circularReference = new _tsArrayNode(level) ;

                    }
                    context.map.set(v, circularReference)
                    circularReference.value = (v as any[]).map(e => _recursiveInspect(e, context, level+1)) ;
                }
                else {
                    if (level === context.max) { return '[Object]' ; }
                    circularReference = new _tsInspectNode(level) ;
                    const isMap = v instanceof Map ;
                    if (isMap) {
                        circularReference.sepa = ' => ' ;
                        circularReference.type = `Map(${v.size})`
                    }
                    else {
                        const n = v.constructor.name ;
                        if (n !== 'Object') { circularReference.type = n ; }
                    }
                    context.map.set(v, circularReference)
                    const entries = $isfunction(v.entries) ? v.entries() : Object.entries(v) ;
                    let allEntries:any[] = []
                    for (let [k, o] of entries) {
                        let value = _recursiveInspect(o, context, level+1) ;
                        allEntries.push( {key:(isMap ? `'${k}'` : k), value:value} ) ;
                    }
                    circularReference.value = allEntries ;
                }
                context.map.delete(v) ;
                return circularReference ;
            }
        }
    }

    return _recursiveInspect(v, inspectContext, 0).toString() ;
}

const FoundationHTMLEncodingExtended = FoundationHTMLEncoding ;
FoundationHTMLEncodingExtended[10] = "<br/>"
FoundationHTMLEncodingExtended[11] = "<br/>"
FoundationHTMLEncodingExtended[12] = "<br/>"
FoundationHTMLEncodingExtended[13] = "<br/>"

function _logwriteterm(log:boolean, format:string, args:any[]) {
    format = $length(format) ? $term(format) : '' ;
    if ($inbrowser()) {
        const c:any = $isfunction(document?.getElementById) ? document!.getElementById("ftsconsole") : undefined ;
        if ($ok(c)) {
            format = $HTML(format, FoundationHTMLEncodingExtended) ;
            for (let a of args) {
                format += $HTML(a.toString(), FoundationHTMLEncodingExtended) ;
            }
            let content = c.innerHTML ;
            content += format ;
            if (log) { content += '<br/>' ; }
            c.innerHTML = content ;
        }
        else {
            // WARNING: here $writeterm() and $logterm() are the same
            if ($count(args)) { format += args.join('') ; }
            console.log(format) ;
        }
    }
    else {
        if ($count(args)) { format += args.join('') ; }
        if (log) { console.log(format) ; }
        else { process.stdout.write(format) ; }
    }    
}
