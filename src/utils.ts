import { $count, $length } from "./commons";
import { inspect } from "util";

export function $timeout(promise:Promise<any>, time:number, exception:any) : Promise<any> {
	let timer:any ;
	return Promise.race([
		promise, 
		new Promise((_,rejection) => timer = setTimeout(rejection, time, exception))
	]).finally(() => clearTimeout(timer)) ;
}

export function $inspect(v:any) { return inspect(v, false, 10) ; }

export function $term(s:string, escapeChar:string = '&'):string {
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

export function $termclean(s:string, escapeChar:string = '&') {
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
    format = $term($length(format) ? format : '') ;
    if ($count(args)) { format += args.join() ; }
    console.log(format)
}

export function $writeterm(format:string, ...args:any[]) {
    format = $term($length(format) ? format : '') ;
    if ($count(args)) { format += args.join() ; }
    if (format.length) { process.stdout.write(format) ; }
}

export function $logheader(s: string, width: number = 0, style: string = '&w', starStyle: string = '&x')
{
    if (!width) { width = s.length; }
    $logterm("\n&0" + starStyle + "".padEnd(width + 4, '*'));
    $logterm(starStyle + '* ' + style + s.padEnd(width + 1, ' ') + '&0' + starStyle + '*');
    $logterm(starStyle + "".padEnd(width + 4, '*') + "&0\n");
}

export function $inbrowser():boolean {
    // Check if the environment is Node.js
    if (typeof process === "object" &&
        typeof require === "function") {
        return false;
    }
    // Check if the environment is a Browser
    if (typeof window === "object") {
        return true;
    }
    return false ;
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