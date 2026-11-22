import { inspect } from "util";  // NOSONAR: no 'node:' prefix for webpack 5
import { Stream } from "stream"; // NOSONAR: no 'node:' prefix for webpack 5

import { $count, $defined, $isarray, $isfunction, $isint, $ismethod, $isproperty, $isstring, $length, $ok, $unsigned } from "./commons";
import { $HTML, $normspaces } from "./strings";
import { FoundationHTMLEncoding } from "./string_tables";
import { Nullable, TSDataLike } from './types';
import { $bytesFromDataLike } from "./data";
import { $unit } from "./number";
import { TSError } from "./tserrors";
import { TSCharset } from "./tscharset";

export const $noop = () => {} ;

export enum TSBrowserOS {
    notInBrowser,
    unknownOS,
    android,
    iOS,
    linux,
    macOS,
    tvOS,
    windows
} ;

export function $browserOS(): TSBrowserOS {
    if (!$defined(($browserOS as any).os)) {
        let inb = false;
        let bs = TSBrowserOS.notInBrowser;
        try { inb = $defined(window) && ($defined(navigator) || !$isproperty(process, 'stdout') || !$ismethod(process?.stdout, 'write')); }
        catch { inb = false; }
        if (inb) {
            bs = TSBrowserOS.unknownOS;
            const agent = window.navigator.userAgent.toLowerCase();
            if (agent.includes('win')) { bs = TSBrowserOS.windows; }
            else if (agent.includes('android')) { bs = TSBrowserOS.android; }
            else if (agent.includes('ipad') || agent.includes('iphone')) { bs = TSBrowserOS.iOS; }
            else if (agent.includes('appletv')) { bs = TSBrowserOS.tvOS; }
            else if (agent.includes('debian') || agent.includes('ubuntu') || agent.includes('centos') ||
                agent.includes('fedora') || agent.includes('red hat') || agent.includes('suze') ||
                agent.includes('linux')) { bs = TSBrowserOS.linux; } // we don't test for other linux of other unix
            else if (agent.indexOf('mac')) { bs = TSBrowserOS.macOS; }
        }
        ($browserOS as any).os = bs;
    }
    return ($browserOS as any).os;
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

export async function $sleep(ms:number) { 
    const promise = new Promise(res => setTimeout(res, ms)) ; 
    await promise ;
}

export function $timeout(promise:Promise<any>, time:number, exception:any) : Promise<any> {
	let timer:any ;
	return Promise.race([
		promise, 
		new Promise((_,rejection) => timer = setTimeout(rejection, time, exception))
	]).finally(() => clearTimeout(timer)) ;
}

export async function $readStreamBuffer(stream:Nullable<Stream>):Promise<Buffer|null> {
    if (!$ok(stream)) { return null ; }
    return new Promise(resolve => {
        const chunks:Array<Buffer> = [] ;
        stream!.on('data', (chunk:Buffer) => chunks.push(chunk)) ;
        stream!.on('end', () => resolve(Buffer.concat(chunks))) ;
        stream!.on('error', () => resolve(null)) ;   // eg. a client aborting its request
        stream!.on('close', () => resolve(null)) ;   // closed without 'end' (no effect if already resolved)
    }) ;
}

export function $inspect(v:any, level?:number) { return $inbrowser() ? _tsinspect(v, level) : _nodeInspect(v, level) ; }
export function $insp(v:any, level?:number) { return _tsinspect(v, level) ; }

// escape-letter -> ANSI sequence, indexed by char code (built once). See $term().
const FoundationTermAnsiSequences: (string | undefined)[] = (() => {
    const m: { [key: string]: string } = {
        '0': "\x1b[0m",                                              // reset
        // styles
        '1': "\x1b[1m", '!': "\x1b[1m",                              // bright mode (old + new)
        '>': "\x1b[2m", '?': "\x1b[2m",                              // dimmed (old + new)
        '/': "\x1b[3m",                                              // italic
        '_': "\x1b[4m",                                              // underscore
        '%': "\x1b[5m",                                              // blinked
        '<': "\x1b[7m",                                              // inversed
        '-': "\x1b[9m",                                              // strikethrough
        // screen + cursor
        'h': "\x1b[0G", 'H': "\x1b[H",                               // cursor to line start / home
        'z': "\x1b[2K\x1b[0G", 'Z': "\x1b[2J\x1b[H",                 // clear line / clear screen
        // colors
        'a': "\x1b[38;5;216m", 'A': "\x1b[48;5;216m",                // apricot
        'b': "\x1b[34m", 'B': "\x1b[44m",                            // blue
        'c': "\x1b[36m", 'C': "\x1b[46m",                            // cyan
        'd': "\x1b[38;5;238m", 'D': "\x1b[48;5;238m",                // dark gray
        'e': "\x1b[38;5;229m", 'E': "\x1b[48;5;229m",                // egg white
        'g': "\x1b[32m", 'G': "\x1b[42m",                            // green
        'j': "\x1b[38;5;121m", 'J': "\x1b[48;5;121m",                // jungle green
        'k': "\x1b[30m", 'K': "\x1b[40m",                            // black
        'l': "\x1b[38;5;252m", 'L': "\x1b[48;5;252m",                // light gray
        'm': "\x1b[35m", 'M': "\x1b[45m",                            // magenta
        'o': "\x1b[38;5;208m", 'O': "\x1b[48;5;208m",                // orange
        'p': "\x1b[38;5;212m", 'P': "\x1b[48;5;212m",                // pink
        'r': "\x1b[31m", 'R': "\x1b[41m",                            // red
        'u': "\x1b[38;5;117m", 'U': "\x1b[48;5;117m",                // uranian blue
        'v': "\x1b[38;5;99m", 'V': "\x1b[48;5;99m",                  // violet
        'w': "\x1b[37m", 'W': "\x1b[47m",                            // white
        'x': "\x1b[38;5;244m", 'X': "\x1b[48;5;244m",                // gray
        'y': "\x1b[33m", 'Y': "\x1b[43m",                            // yellow
    } ;
    const a: (string | undefined)[] = new Array(128) ;
    for (const k in m) { a[k.codePointAt(0)!] = m[k] ; }
    return a ;
})() ;

export function $term(s: string, escapeChar: string = '&'): string {
    if ($inbrowser()) { return $termclean(s, escapeChar); }
    const fmtlen = $length(s);
    if (!fmtlen) { return ""; }
    if ($length(escapeChar) !== 1 || escapeChar === '\x1b') { escapeChar = '&'; }
    if (!s.includes(escapeChar)) { return s; }    // nothing to interpret: hand back the source

    let ret = "" ;
    let start = 0 ;                                  // start of the pending literal run
    let i = s.indexOf(escapeChar) ;
    while (i >= 0) {
        ret += s.slice(start, i) ;
        if (i + 1 >= fmtlen) { return ret + escapeChar ; } // trailing lone escape char
        ret += _termSequence(s, i + 1, escapeChar) ;
        start = i + 2 ;
        i = s.indexOf(escapeChar, start) ;
    }
    return ret + s.slice(start) ;
}

// ANSI sequence for the character following the escape char at position i in s
function _termSequence(s: string, i: number, escapeChar: string): string {
    if (s[i] === escapeChar) { return escapeChar ; }                   // doubled -> single
    const next = s.codePointAt(i)! ;
    return (next < 128 ? FoundationTermAnsiSequences[next] : undefined) ?? escapeChar + s[i] ; // unknown -> kept verbatim
}

export function $termclean(s: string, escapeChar: string = '&'): string {
    const len = $length(s);
    if (!len) { return ""; }
    if ($length(escapeChar) !== 1 || escapeChar === '\x1b') { escapeChar = '&'; }
    if (!s.includes(escapeChar) && !s.includes('\x1b')) { return s; }    // no markup to strip

    let ret = "";
    let i = 0;
    while (i < len) {
        const c = s.charAt(i);
        let text = c ;
        let next = i + 1 ;
        if (c === escapeChar) { [text, next] = _cleanTermSequence(s, i, escapeChar) ; }
        else if (c === '\x1b') { [text, next] = _cleanAnsiSequence(s, i) ; }
        ret += text ;
        i = next ;
    }
    return ret;
}

const __termSequenceCodes = "01>/_%<-?!aAbBcCdDeEgGhHjJkKlLmMoOpPrRuUvVwWxXyYzZ" ;

// removes the terminal sequence starting with the escape char at position i in s.
// Returns the text to keep and the position where to continue.
function _cleanTermSequence(s: string, i: number, escapeChar: string): [string, number] {
    const j = i + 1 ;
    if (j >= s.length) { return ['', j] ; }                                // a final lone escape char is removed
    const c = s.charAt(j) ;
    if (c === escapeChar) { return [escapeChar, j + 1] ; }                  // doubled -> single
    if (__termSequenceCodes.includes(c)) { return ['', j + 1] ; }           // known sequence -> removed
    return [escapeChar, j] ;                                               // unknown -> escape char kept, next char analyzed again
}

// removes the ANSI escape sequence starting at position i in s.
// Returns the text to keep and the position where to continue.
function _cleanAnsiSequence(s: string, i: number): [string, number] {
    for (let j = i + 1 ; j < s.length ; j++) {
        const c = s.charAt(j) ;
        if ('mGHJK'.includes(c)) { return ['', j + 1] ; }                    // end of the sequence
        if (!"[0123456789;".includes(c)) { return ['\x1b', i + 1] ; }       // not a sequence -> ESC kept, what follows analyzed again
    }
    return ['', s.length] ;                                                // an unterminated sequence is removed
}

export function $logterm(format: string, ...args: any[]) {
    return _logwriteterm(true, format, args)
}

export function $writeterm(format: string, ...args: any[]) {
    return _logwriteterm(false, format, args)
}
/**
 * 
 * @param source    A string or a DataLike containing UTF-8 encoded JSON data
 * @param strip     Do we try to strip the JSON string from comments ?
 * @param reviver   Same param as JSON.parse() reviver
 * @returns undefined if there is no JSON or if we cannot parse it, otherwise the parsed value
 */
export function $jsonparse(source: Nullable<string | TSDataLike>, strip?: Nullable<boolean>, reviver?: (this: any, key: string, value: any) => any): any {
    if (!$length(source)) { return undefined; }
    if (!$isstring(source)) { source = TSCharset.utf8Charset().stringFromData(source!); }
    if (strip) { source = $jsonstrip(source); }
    try { return JSON.parse(source, reviver) ; }
    catch { return undefined ; }
}

export function $jsonstrip(source: Nullable<string>): string {
    const len = $length(source);
    if (!len) { return ''; }

    const s = source!;
    const parts: string[] = [];
    let segmentStart = 0;
    let i = 0;
    while (i < len) {
        const c = s.codePointAt(i)!;
        if (c === 34 /* " */) { i = _jsonStringEnd(s, i + 1) ; continue ; }
        const commentEnd = c === 47 /* / */ ? _jsonCommentEnd(s, i) : -1 ;
        if (commentEnd < 0) { i++ ; continue ; }
        parts.push(s.slice(segmentStart, i)) ;
        i = commentEnd ;
        segmentStart = i ;
    }
    parts.push(s.slice(segmentStart, len)) ;
    return parts.join('') ;
}

// position following the end of the JSON string whose content starts at position i in s
function _jsonStringEnd(s: string, i: number): number {
    while (i < s.length) {
        const c = s.codePointAt(i)! ;
        if (c === 92 /* \ */) { i += 2 ; continue ; }   // escaped character
        i++ ;
        if (c === 34 /* " */) { break ; }
    }
    return i ;
}

// end of the comment starting with the '/' at position i in s, or -1 if there is no comment there.
// A line comment ends before its line feed, a non closed multi-line comment ends at the end of s
function _jsonCommentEnd(s: string, i: number): number {
    const len = s.length ;
    const next = s.charAt(i + 1) ;
    let j = i + 2 ;
    if (next === '/') {
        while (j < len && s[j] !== '\n' && s[j] !== '\r') { j++ ; }
        return j ;
    }
    if (next === '*') {
        while (j < len && !(s[j] === '*' && s[j + 1] === '/')) { j++ ; }
        return Math.min(j + 2, len) ;
    }
    return -1 ;
}
    
// representation of each byte value in the chars column of $hexadump(): ASCII characters
// for bytes 32 to 127, a gray dot for the others, and '&' (which starts the terminal color
// sequences of $logterm()) is shown as the fullwidth character U+FF08
const __hexadumpChars:string[] = Array.from({ length:256 }, (_, c) => {
    if (c === 0x26) { return String.fromCodePoint(0xff08) ; }
    return c >= 32 && c < 128 ? String.fromCodePoint(c) : '&B⋅&G' ;
}) ;

export function $hexadump(source: Nullable<TSDataLike>) {
    let data = $ok(source) ? $bytesFromDataLike(source!) : [];
    let sourceLen = data.length;
    let len = sourceLen % 16 > 0 ? sourceLen + 16 - sourceLen % 16 : sourceLen;
    $logterm("&0&x         00 01 02 03 04 05 06 07 08 09 0A 0B 0C 0D 0E 0F chars&0");
    $logterm("&0&x---------------------------------------------------------------------------&0");

    function _H(x: number): string { return (x < sourceLen ? data[x] : 0).toHex2(); }
    function _B(x: number): string { return x < sourceLen ? __hexadumpChars[data[x]] : '' ; }

    for (let p = 0; p < len; p += 16) {
        $logterm(`&0&j${p.toHex8()} ${_H(p)} ${_H(p + 1)} ${_H(p + 2)} ${_H(p + 3)} ${_H(p + 4)} ${_H(p + 5)} ${_H(p + 6)} ${_H(p + 7)} ${_H(p + 8)} ${_H(p + 9)} ${_H(p + 10)} ${_H(p + 11)} ${_H(p + 12)} ${_H(p + 13)} ${_H(p + 14)} ${_H(p + 15)} &w&G&w ${_B(p)}${_B(p + 1)}${_B(p + 2)}${_B(p + 3)}${_B(p + 4)}${_B(p + 5)}${_B(p + 6)}${_B(p + 7)}${_B(p + 8)}${_B(p + 9)}${_B(p + 10)}${_B(p + 11)}${_B(p + 12)}${_B(p + 13)}${_B(p + 14)}${_B(p + 15)} &0`);
    }

    $logterm("&0&x---------------------------------------------------------------------------&0");
}

export function $logheader(s: string, width: number = 0, style: string = '&w', starStyle: string = '&x') {
    if (!width) { width = s.length; }
    $logterm("\n&0" + starStyle + "".padEnd(width + 4, '*'));
    $logterm(starStyle + '* ' + style + s.padEnd(width + 1, ' ') + '&0' + starStyle + '*');
    $logterm(starStyle + "".padEnd(width + 4, '*') + "&0\n");
}


export interface TSCall {
    getFunction(): (...args: any[]) => any ;
    getFunctionName(): string | null;
    getMethodName(): string | undefined;
    getFileName(): string | null;
    getLineNumber(): number | null;
    getColumnNumber(): number | null;
    getEvalOrigin(): string | undefined;
    getTypeName(): string | null;
    getThis(): unknown ;
}

export function $stack(): TSCall[] {
    const previousPrepareStackTrace = Error.prepareStackTrace;
    Error.prepareStackTrace = (_, stack) => stack;
    const stack = new Error().stack;
    Error.prepareStackTrace = previousPrepareStackTrace;
    return stack as unknown as TSCall[];
}

// ================================== private functions, interfaces and classes ==============================


function _nodeInspect(v: any, level: number = 10) { return inspect(v, false, level); }
interface InspectEntry {
    key: any;
    value: any;
}
class InspectNode {
    protected static __prefixString: string = "                                                                                                                                      ";
    id?: number;
    type?: string;
    value: any;
    level: number;
    left: string = '{';
    right: string = '}';
    sepa: string = ': ';
    lineWidth: number = 70;

    constructor(level: number) {
        this.level = level;
    }

    toString(): string {
        const prefix = InspectNode.__prefixString.slice(0, 2 * this.level);
        let s = $defined(this.id) ? `<ref *${this.id}> ` : '';
        if ($length(this.type)) { s += this.type! + ' '; }

        s += this.left;
        let continued = false;
        for (let e of (this.value as InspectEntry[])) {
            if (continued) { s += ','; }
            s += `\n${prefix}  ${e.key}${this.sepa}` + ($isstring(e.value) ? e.value : (e.value as any).toString());
            continued = true;
        }
        s += '\n' + prefix + this.right;
        const s2 = $normspaces(s);
        return s2.length < this.lineWidth ? s2 : s;
    }
}

class InspectArrayNode extends InspectNode {
    constructor(level: number) {
        super(level);
        this.right = ']';
        this.left = '[';
    }

    toString(): string {
        const plen = 2 * this.level;
        const prefix = InspectNode.__prefixString.slice(0, plen);
        let s = $defined(this.id) ? `<ref *${this.id}> ` : '';
        if ($length(this.type)) { s += this.type! + ' '; }
        s += this.left;
        let continued = false;
        for (let o of this.value) {
            if (continued) { s += ','; }
            s += '\n' + prefix + '  ' + ($isstring(o) ? o : o.toString());
            continued = true;
        }
        s += '\n' + prefix + this.right;
        const s2 = $normspaces(s);
        return s2.length < this.lineWidth ? s2 : s;
    }
}

class InspectSetNode extends InspectArrayNode {
    constructor(level: number) {
        super(level);
        this.right = '}';
        this.left = '{';
    }
}

interface InspectContext {
    nextId: number;
    max: number;
    map: Map<any, InspectNode>;
    requestedLevel: number;         // max depth requested by the caller, for native inspect()
}

function _tsinspect(v: any, level: number = 10): string {
    const context: InspectContext = {
        nextId: 1,
        max: Math.min($unsigned(level), 63) + 1,
        map: new Map<any, InspectNode>(),
        requestedLevel: level,
    };
    return _recursiveInspect(v, context, 0).toString();
}

// level is the current recursion depth (not the max depth requested to _tsinspect())
function _recursiveInspect(v: any, context: InspectContext, level: number): any {
    switch (typeof v) {
        case 'string': return "'" + JSON.stringify(v).slice(1, - 1) + "'";
        case 'undefined': return 'undefined';
        case 'symbol':
        case 'boolean':
        case 'bigint':
        case 'number': return String(v);    // String() because `${v}` throws on a symbol
        case 'function': return `[Function: ${(v as Function).name}]`;
        case 'object': return _inspectObject(v, context, level) ;
    }
}

function _inspectObject(v: any, context: InspectContext, level: number): any {
    if (v === null) { return 'null'; }
    if ($isfunction(v.leafInspect)) { return v.leafInspect(); }
    // No leafInspect : a native Error (or a third-party one) has no
    // opinion of its own. Node already knows how to render it — on
    // Node, delegate to the very inspect() _nodeInspect() uses, so
    // $insp() matches $inspect() byte-for-byte without us
    // reimplementing Node's Error formatter. In a browser there is
    // no native formatter to match ($inspect() is _tsinspect() there
    // too), so fall back to the stack (or name: message if the
    // stack was never captured — see TSError's stack-skip optimisation).
    if (v instanceof Error) {
        return $inbrowser() ? (v.stack ?? `${v.name}: ${v.message}`) : inspect(v, false, context.requestedLevel);
    }
    const circularReference = context.map.get(v);
    if ($defined(circularReference)) {
        if (!$defined(circularReference.id)) { circularReference.id = context.nextId++ ; }
        return `[Circular *${circularReference.id!}]` ;
    }
    const isSet = v instanceof Set;
    return isSet || $isarray(v) ? _inspectList(v, isSet, context, level) : _inspectDictionary(v, context, level) ;
}

function _inspectList(v: any, isSet: boolean, context: InspectContext, level: number): any {
    if (level === context.max) { return isSet ? '[Set]' : '[Array]'; }
    let node: InspectNode ;
    if (isSet) {
        v = Array.from(v);
        node = new InspectSetNode(level);
        node.type = `Set(${v.length})`;
    }
    else { node = new InspectArrayNode(level); }
    context.map.set(v, node) ;
    node.value = (v as any[]).map(e => _recursiveInspect(e, context, level + 1));
    context.map.delete(v);
    return node;
}

function _inspectDictionary(v: any, context: InspectContext, level: number): any {
    if (level === context.max) { return '[Object]'; }
    const node = new InspectNode(level);
    const isMap = v instanceof Map;
    if (isMap) {
        node.sepa = ' => ';
        node.type = `Map(${v.size})` ;
    }
    else if (v.constructor.name !== 'Object') { node.type = v.constructor.name ; }
    context.map.set(v, node) ;
    const entries = $isfunction(v.entries) ? v.entries() : Object.entries(v);
    const allEntries: any[] = [] ;
    for (const [k, o] of entries) {
        const value = _recursiveInspect(o, context, level + 1);
        allEntries.push({ key: (isMap ? `'${k}'` : k), value: value });
    }
    node.value = allEntries;
    context.map.delete(v);
    return node;
}

const FoundationHTMLEncodingExtended = [...FoundationHTMLEncoding];
FoundationHTMLEncodingExtended[10] = "<br/>"
FoundationHTMLEncodingExtended[11] = "<br/>"
FoundationHTMLEncodingExtended[12] = "<br/>"
FoundationHTMLEncodingExtended[13] = "<br/>"

function _logwriteterm(log: boolean, format: string, args: any[]) {
    format = $length(format) ? $term(format) : '';
    if (!$inbrowser()) {
        if ($count(args)) { format += args.join(''); }
        if (log) { console.log(format); }
        else { process.stdout.write(format); }
        return ;
    }
    const c: any = $isfunction(document?.getElementById) ? document!.getElementById("ftsconsole") : undefined;
    if ($ok(c)) { _writeHTMLConsole(c, log, format, args) ; }
    else {
        // WARNING: here $writeterm() and $logterm() are the same
        if ($count(args)) { format += args.join(''); }
        console.log(format);
    }
}

// appends the format and its arguments to the HTML console element c
// insertAdjacentHTML() only parses the new content: rewriting the whole innerHTML
// on each call was quadratic and made long outputs (like the tests ones) very slow
function _writeHTMLConsole(c: any, log: boolean, format: string, args: any[]) {
    let content = $HTML(format, FoundationHTMLEncodingExtended);
    for (const a of args) { content += $HTML(a.toString(), FoundationHTMLEncodingExtended); }
    if (log) { content += '<br/>'; }
    if ($isfunction(c.insertAdjacentHTML)) { c.insertAdjacentHTML('beforeend', content) ; }
    else { c.innerHTML = c.innerHTML + content ; }
}
