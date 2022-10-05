import { inspect } from "util";
import { $count, $defined, $isarray, $isfunction, $isstring, $length, $ok, $unsigned } from "./commons";
import { $normspaces } from "./strings";
//import { inspect } from "util";
import { FoundationHTMLEncoding } from "./string_tables";

export const $noop = () => {} ;

export function $inbrowser():boolean {
    if (!$defined(($inbrowser as any).flag)) {
        let inb = false ;
        try { inb = $defined(navigator) || !$isfunction(process?.stdout?.write) ; }
        catch { inb = false ; }
        ($inbrowser as any).flag = inb ;
    }
    return ($inbrowser as any).flag ;
}

export function $timeout(promise:Promise<any>, time:number, exception:any) : Promise<any> {
	let timer:any ;
	return Promise.race([
		promise, 
		new Promise((_,rejection) => timer = setTimeout(rejection, time, exception))
	]).finally(() => clearTimeout(timer)) ;
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

// ================================== private functions and classes ==============================

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

let FoundationHTMLEncodingExtended = FoundationHTMLEncoding ;
FoundationHTMLEncodingExtended[10] = "<br/>"
FoundationHTMLEncodingExtended[11] = "<br/>"
FoundationHTMLEncodingExtended[12] = "<br/>"
FoundationHTMLEncodingExtended[13] = "<br/>"

export function _logwriteterm(log:boolean, format:string, args:any[]) {
    format = $length(format) ? $term(format) : '' ;
    if ($inbrowser()) {
        format = format.toHTML(FoundationHTMLEncodingExtended) ;
        for (let a of args) {
            format += a.toString().toHTML(FoundationHTMLEncodingExtended) ;
        }
        var c:any = $isfunction(document?.getElementById) ? document!.getElementById("ftsconsole") : undefined ;
        if ($ok(c)) {
            let content = c.innerHTML ;
            content += format ;
            if (log) { content += '<br/>' ; }
            c.innerHTML = content ;
        }
        else {
            // WARNING: here $writeterm() and $logterm() are the same
            console.log(format) ;
        }
    }
    else {
        if ($count(args)) { format += args.join('') ; }
        if (log) { console.log(format) ; }
        else { process.stdout.write(format) ; }
    }    
}
