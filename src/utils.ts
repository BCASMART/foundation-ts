import { $count, $length, $ok } from "./commons";
import { exit } from "process";

export function $timeout(promise:Promise<any>, time:number, exception:any) : Promise<any> {
	let timer:any ;
	return Promise.race([
		promise, 
		new Promise((_,rejection) => timer = setTimeout(rejection, time, exception))
	]).finally(() => clearTimeout(timer)) ;
}

export function $term(s:string, escapeChar:string = '&'):string {
    let fmtlen = $length(s) ;
    let escape = false ;
    let ret = "" ;
    if (fmtlen) {
        if ($length(escapeChar) !== 1) { escapeChar = '&' ; }
        for (let i = 0 ; i < fmtlen ; i++) {
            const c = s.charAt(i) ;
            if (escape) {
                escape = false ;
                switch (c) {
                    case escapeChar: ret += escapeChar ; break ;

                    case '0': ret += "\x1b[0m"  ; break ; // reset

                    // styles
                    case '1': ret += "\x1b[1m"  ; break ; // bright mode
                    case '>': ret += "\x1b[2m"  ; break ; // dimmed
                    case 'i': ret += "\x1b[3m"  ; break ; // italic
                    case 'u': ret += "\x1b[4m"  ; break ; // underscore
                    case '_': ret += "\x1b[5m"  ; break ; // blinked
                    case '<': ret += "\x1b[7m"  ; break ; // inversed
                    case '-': ret += "\x1b[9m"  ; break ; // strikethrough

                    // standard colors
                    case 'r': ret += "\x1b[31m" ; break ; // red font
                    case 'R': ret += "\x1b[41m" ; break ; // red background
                    case 'g': ret += "\x1b[32m" ; break ; // green font  
                    case 'G': ret += "\x1b[42m" ; break ; // green background
                    case 'b': ret += "\x1b[34m" ; break ; // blue font
                    case 'B': ret += "\x1b[44m" ; break ; // blue background
                    case 'y': ret += "\x1b[33m" ; break ; // yellow font
                    case 'Y': ret += "\x1b[43m" ; break ; // yellow background
                    case 'm': ret += "\x1b[35m" ; break ; // magenta font
                    case 'M': ret += "\x1b[45m" ; break ; // magenta background
                    case 'c': ret += "\x1b[36m" ; break ; // cyan font
                    case 'C': ret += "\x1b[46m" ; break ; // cyan background
                    case 'k': ret += "\x1b[30m" ; break ; // black font
                    case 'K': ret += "\x1b[40m" ; break ; // black background
                    case 'w': ret += "\x1b[37m" ; break ; // white font 
                    case 'W': ret += "\x1b[47m" ; break ; // white background

                    // non-standard colors
                    case 'o': ret += "\x1b[38;5;208m" ; break ; // orange font
                    case 'O': ret += "\x1b[48;5;208m" ; break ; // orange background
                    case 'p': ret += "\x1b[38;5;212m" ; break ; // pink font
                    case 'P': ret += "\x1b[48;5;212m" ; break ; // pink background
                    case 'a': ret += "\x1b[38;5;216m" ; break ; // apricot font
                    case 'A': ret += "\x1b[48;5;216m" ; break ; // apricot background
                    case 'v': ret += "\x1b[38;5;99m"  ; break ; // violet font
                    case 'V': ret += "\x1b[48;5;99m"  ; break ; // violet background
                    case 'd': ret += "\x1b[38;5;238m" ; break ; // dark gray font
                    case 'D': ret += "\x1b[48;5;238m" ; break ; // dark gray background
                    case 'x': ret += "\x1b[38;5;244m" ; break ; // gray font
                    case 'X': ret += "\x1b[48;5;244m" ; break ; // gray background
                    case 'l': ret += "\x1b[38;5;252m" ; break ; // light gray font
                    case 'L': ret += "\x1b[48;5;252m" ; break ; // light gray background
                    case 'e': ret += "\x1b[38;5;229m" ; break ; // egg white font
                    case 'E': ret += "\x1b[48;5;229m" ; break ; // egg white background
                    case 'j': ret += "\x1b[38;5;121m"  ; break ; // jungle green font
                    case 'J': ret += "\x1b[48;5;121m"  ; break ; // jungle green background

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

export function $logterm(format:string, escapeChar:string = '', ...args:any[]) {
    if ($length(format)) {
        format = $term(format, escapeChar) ;
        if ($count(args)) { format += args.join() ; }
        console.log(format)
    }
}

export function $logheader(s: string, width: number = 0, style: string = '&w', starStyle: string = '&x')
{
    if (!width) { width = s.length; }
    $logterm("\n&0" + starStyle + "".padEnd(width + 4, '*'));
    $logterm(starStyle + '* ' + style + s.padEnd(width + 1, ' ') + '&0' + starStyle + '*');
    $logterm(starStyle + "".padEnd(width + 4, '*') + "&0\n");
}

export function $fatalerror(test: boolean, s: string = 'FATAL ERROR', exitCode: number | null | undefined = -1, style: string = '&R&w')
{
    if (test) {
        if ($ok(exitCode)) {
            $logterm(style + ' ' + s + ` &0&o —— EXITING with code &O&k ${exitCode} &0\n`);
            exit(exitCode!);
        }
        else {
            $logterm(style + ' ' + s + ` &0&o —— will throw`);
            throw s;
        }
    }
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
