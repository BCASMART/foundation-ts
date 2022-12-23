import { $count, $defined, $isarray, $isbool, $isdate, $isemail, $isfunction, $isint, $isnumber, $isobject, $isstring, $isunsigned, $isurl, $isuuid, $keys, $length, $ok } from "./commons";
import { $compare, $equal, $unorderedEqual } from "./compare";
import { TSData } from "./tsdata";
import { TSRange } from "./tsrange";
import { TSRangeSet } from "./tsrangeset";
import { TSInterval } from './tsinterval'
import { AnyDictionary, Ascending, Descending, Nullable } from "./types";
import { $inspect, $logterm, $term, $writeterm, $mark, $ellapsed } from "./utils";
import { TSList } from "./tslist";

export type groupFN = (t:TSTestGroup) => Promise<void> ;
export type unaryFN = (t:TSUnaryTest) => Promise<void> ;
export type testFN = (t:TSGenericTest) => Promise<void> ;

const noopTest:testFN = async (_:TSGenericTest):Promise<void> => {}
const PADN = 5 ;

export interface TSTesterOptions {
    focusNames?:string[] ;
    clearScreen?:boolean ;
    listTests?:boolean ;
}

export class TSTester {
    groups:TSTestGroup[] = [] ;
    public _names:Set<string> ;
    public desc:string ;

    public constructor(s:string) {
        this._names = new Set<string>() ;
        this.desc = s ;
    }
    
    public addGroup(s:string, f:groupFN, name?:Nullable<string>, opts?:TSGenericTestOptions)
    { this.addGroups([TSTest.group(s,f,opts)], name) ; }

    public addGroups(grps:TSTestGroup|TSTestGroup[], name?:Nullable<string>) {
        const hasName = $length(name) > 0 ;
        if (hasName) { this._names.add(name!) ; }
        if (grps instanceof TSTestGroup) { grps = [grps] ; }
        for (let g of grps) { 
            this.groups.push(g) ; 
            if (hasName) { g.name = name! ; }
            else if ($length(g.name) > 0) { this._names.add(g.name!) ; }
        }
    }
    public log(format:string, ...args:any[]) {
        $logterm(format, args) ;
    }

    public get names():string[] { return Array.from(this._names) ; }
    public containsName(s:Nullable<string>) { return $length(s) ? this._names.has(s!) : false ; }

    public async dumpGroupsList(clearScreen:boolean = false) {
        const n = $count(this.groups) ;
        if (n > 0) {
            this.log(`${clearScreen?'&Z':''}&eTSTester will now list &Y&k ${this.desc} &0&e :`) ;
            let i = 1 ;
            for (let g of this.groups) {
                await g.prepare() ; 
                $writeterm(`&e${i.fpad4()} `) ; 
                g.dumpGroupInfo() ;
                $logterm('') ;
                i++ ;
            }
        }
        else {
            this.log(`&aTSTester has no test groups defined for &O&w ${this.desc} &0&e !`) ;
        }
    }

    public async run(opts:TSTesterOptions = {}) {

        if (opts.listTests) {
            await this.dumpGroupsList(opts.clearScreen) ;
            return ;
        }
        const start = $mark() ;
        this.log(`${opts.clearScreen?'&Z':''}&eTSTester will now start &Y&k ${this.desc} &0&e :`) ;
        let expectations = 0 ;
        let expectationsFailed = 0 ;
        let focusNames = $count(opts.focusNames) ? opts.focusNames!.filter(fn => this.containsName(fn)) : [] ;
        
        for (let g of this.groups) { 
            if ($length(g.name) && focusNames.includes(g.name!)) { g.focused = true ; }
            await g.prepare() ; 
        }

        let groups = this.groups.filter(g => g.focused) ;
        const n = $count(groups) ;
        if (n > 0) {
            this.log(`&0&O&rTest will be restricted to ${n} groups out of ${this.groups.length}&0`) ;
        }
        else { groups = this.groups ; }

        let passed = 0, failed = 0, silent = 0 ;
        // second phase, we run the tests
        for (let g of groups) {
            const [groupExpected, groupFailed] = await g.run() ;
            expectations += groupExpected ;
            expectationsFailed += groupFailed ;
            if (groupFailed === 0) { if (g.silent) { silent ++ ; } else { passed++ ; } } else { failed++ ; }
        }
        this.log(`&y${expectations.toString().padStart(PADN)}&0&e test${expectations === 1 ? 'was' : 's were'} executed in &y${$ellapsed(start)}&0`) ;
        if (passed > 0) { this.log(`&g${passed.toString().padStart(PADN)}&0&j group${passed === 1 ? ' ' : 's'} of tests did &G&w  PASS  &0`) ; }
        if (silent > 0) { this.log(`&g${silent.toString().padStart(PADN)}&0&j&? group${passed === 1 ? ' ' : 's'} of tests did &J&?&w  PASS IN SILENT MODE  &0`) ; }
        if (failed > 0) { this.log(`&r${failed.toString().padStart(PADN)}&0&o group${failed === 1 ? ' ' : 's'} of tests did &R&w  FAIL  &0`) ; }
        if ((passed > 0 || silent > 0) && !failed) {
            this.log('&G&w  ALL TESTS PASSED  &0') ;
        }
        else if (expectationsFailed > 0) {
            this.log(`&R&w${expectationsFailed.toString().padStart(PADN)} TEST${expectationsFailed>1?'S':''} FAILED  &0`) ;
        }
    }
}

export interface TSGenericTestOptions {
    focus?:boolean ;
    focusGroup?:boolean ;
    silent?:boolean ;
    name?:string ;
}

export class TSGenericTest {
    public desc:string ;
    public fn:testFN ;
    public name:string|undefined = undefined ;
    public focused:boolean = false ;
    public silent:boolean = false ;

    protected constructor(s:string, f:testFN, opts?:TSGenericTestOptions) {
        this.desc = s ;
        this.fn = f ;
        if (opts?.focus) { this.focused = true ; }
        if (opts?.silent) { this.silent = true ; }
        if ($length(opts?.name) > 0) { this.name = opts!.name! ; }
    }

    public async run():Promise<[number, number]> { return [0,0] ; }
    public log(format:string, ...args:any[]) { $logterm(format, args) ; }

}
export class TSTest extends TSGenericTest {
    public static group(s:string, f:groupFN, opts?:TSGenericTestOptions) {
        return new TSTestGroup(s, f, opts) ;
    }
}

export class TSTestGroup extends TSGenericTest {
    private _unaries:TSGenericTest[] = [] ; 
    public constructor(s:string, f:groupFN, opts?:TSGenericTestOptions) {
        super(s, f as testFN, opts) ;
        if (opts?.focusGroup) { this.focused = true ; }
    }

    public unary(s:string, f:unaryFN, opts:TSGenericTestOptions = {})
    {
        if (this.silent) { opts.silent = true ; } 
        this._unaries.push(new TSUnaryTest(this, s, f, opts)) ; 
    }
    
    public description(str:string)
    { if ($length(str) && !this.silent) { this._unaries.push(new TSTestDescriptor(str)) ; }}

    public async prepare():Promise<void>
    { await this.fn(this) ; }

    public log(format:string, ...args:any[])
    { super.log('  '+format, args) ; }

    public dumpGroupInfo() {
        const n = this._unaries.length ;
        if (n > 0) {
            const silent = this.silent ? 'silent ' : '' ;
            const focused = this.focused ? 'focused ' : '' ;
            const name = $length(this.name) ? `&J&w ${this.name!} &0` : '&U&k <Unamed> &0' ;
            let tests = n === 1 ? `1 test` : `${n} tests` ;
            $writeterm(`&u${silent}${focused}group ${this.desc} ${name}&B&w ${tests} &0`) ;
        }
    }

    public async run():Promise<[number, number]> {
        let expectations = 0 ;
        let expectationFailed = 0 ;
        const start = $mark() ;

        if (!this.silent) { this.log(`&u- Running group tests &U&k ${this.desc} &0`) ; }
        let unaries = this._unaries.filter(u => u.focused) ;
        if (unaries.length === 0) { unaries = this._unaries ; }

        for (let u of unaries) {
            const [unaryExpected, unaryFailed] = await u.run() ;
            expectationFailed += unaryFailed ;
            expectations += unaryExpected ;
        }
        if (this.silent && expectationFailed > 0) {
            this.log(`&u- Did run group tests &U&k ${this.desc} &0`) ;
        }
        if (!this.silent || expectationFailed > 0) { $logterm(`${expectationFailed==0?'&j':'\n&o'}    ${this.desc} tests ${expectationFailed==0?'&G&w  PASSED  ':'&R&w  FAILED  '}&0&y in ${$ellapsed(start)}\n`) ; }
        return [expectations, expectationFailed] ;
    }
}

export class TSTestDescriptor extends TSGenericTest {
    public constructor(s:string) { super($term(s), noopTest) ; }
    public log(format:string, ...args:any[]) { super.log('    '+format, args) ; }
    public async run():Promise<[number, number]> {
        $logterm(`&x     ➤ logging &y${this.desc} &0`) ;
        return [0,0] ; 
    }

}
export class TSUnaryTest extends TSGenericTest {
    public _group:TSTestGroup ;
    private _failed:number = 0 ;
    private _passed:number = 0 ;
    private _expected:number = 0 ;
    private _registrations:AnyDictionary = {} ;

    public constructor(g:TSTestGroup, s:string, f:unaryFN, opts?:TSGenericTestOptions) {
        super(s, f as testFN, opts) ;
        this._group = g ;
        if (opts?.focusGroup) { g.focused = true ; }
    }

    public log(format:string, ...args:any[]) { super.log('    '+format, args) ; }

    public async run():Promise<[number, number]> {
        this._passed = 0 ;
        this._failed = 0 ;
        if (!this.silent) { $writeterm(`&x     ➤ &ltesting &B&w ${this.desc} &0`) ; }
        await this.fn(this) ;
        if (!this.silent) {
            if (this._failed > 0) { 
                $writeterm('\n     ') ; 
                this.printRegistrations() ;
            }
            if (this._passed > 0) { $writeterm(`&J&k ${this._passed} OK &0`) ; }
            if (this._failed > 0) { $writeterm(`&R&w ${this._failed} KO &0`) ; }
            $logterm('') ;    
        }
        else if (this._failed > 0) {
            $logterm(`&x     ➤ &ldid execute test &B&w ${this.desc} &0&R&w ${this._failed} KO &0`) ;
        }
        return [this._expected, this._failed] ;
    }
    
    public register(name:string, value:any)
    { if ($defined(value) && $length(name)) { this._registrations[name] = value ; }}

    public printRegistrations() {
        const keys = $keys(this._registrations)
        const n = keys.length ;
        if (n === 1) {
            $logterm(`\n&Y&b  REGISTERED ITEM &r&!${keys[0]}  &0&c\n${$inspect(this._registrations[keys[0]])}&0\n`) ;
        }
        else if (n > 1) {
            $logterm('\n&Y&b  REGISTERED ITEMS  &0') ;
            keys.forEach(k => { $logterm(`&x  + &o&_&/&!${k}&0&x: &c${$inspect(this._registrations[k])}&0`) ; }) ;
            $logterm('') ;
        }
    }

    public expect(v:any,msg?:string):TSExpectAgent {
        this._expected ++ ;
        if (!$length(msg)) { msg = this._expected.toString().padStart(4) ; }
        return new TSExpectAgent(this, v, msg) ;
    }

    // this could be considered as useless but eventually, I find it very usefull and literrate 
    public expect0(v:any):TSExpectAgent { return this.expect(v, 'expct0') ; }
    public expect1(v:any):TSExpectAgent { return this.expect(v, 'expct1') ; }
    public expect2(v:any):TSExpectAgent { return this.expect(v, 'expct2') ; }
    public expect3(v:any):TSExpectAgent { return this.expect(v, 'expct3') ; }
    public expect4(v:any):TSExpectAgent { return this.expect(v, 'expct4') ; }
    public expect5(v:any):TSExpectAgent { return this.expect(v, 'expct5') ; }
    public expect6(v:any):TSExpectAgent { return this.expect(v, 'expct6') ; }
    public expect7(v:any):TSExpectAgent { return this.expect(v, 'expct7') ; }
    public expect8(v:any):TSExpectAgent { return this.expect(v, 'expct8') ; }
    public expect9(v:any):TSExpectAgent { return this.expect(v, 'expct9') ; }
    public expectA(v:any):TSExpectAgent { return this.expect(v, 'expctA') ; }
    public expectB(v:any):TSExpectAgent { return this.expect(v, 'expctB') ; }
    public expectC(v:any):TSExpectAgent { return this.expect(v, 'expctC') ; }
    public expectD(v:any):TSExpectAgent { return this.expect(v, 'expctD') ; }
    public expectE(v:any):TSExpectAgent { return this.expect(v, 'expctE') ; }
    public expectF(v:any):TSExpectAgent { return this.expect(v, 'expctF') ; }
    public expectG(v:any):TSExpectAgent { return this.expect(v, 'expctG') ; }
    public expectH(v:any):TSExpectAgent { return this.expect(v, 'expctH') ; }
    public expectI(v:any):TSExpectAgent { return this.expect(v, 'expctI') ; }
    public expectJ(v:any):TSExpectAgent { return this.expect(v, 'expctJ') ; }
    public expectK(v:any):TSExpectAgent { return this.expect(v, 'expctK') ; }
    public expectL(v:any):TSExpectAgent { return this.expect(v, 'expctL') ; }
    public expectM(v:any):TSExpectAgent { return this.expect(v, 'expctM') ; }
    public expectN(v:any):TSExpectAgent { return this.expect(v, 'expctN') ; }
    public expectO(v:any):TSExpectAgent { return this.expect(v, 'expctO') ; }
    public expectP(v:any):TSExpectAgent { return this.expect(v, 'expctP') ; }
    public expectQ(v:any):TSExpectAgent { return this.expect(v, 'expctQ') ; }
    public expectR(v:any):TSExpectAgent { return this.expect(v, 'expctR') ; }
    public expectS(v:any):TSExpectAgent { return this.expect(v, 'expctS') ; }
    public expectT(v:any):TSExpectAgent { return this.expect(v, 'expctT') ; }
    public expectU(v:any):TSExpectAgent { return this.expect(v, 'expctU') ; }
    public expectV(v:any):TSExpectAgent { return this.expect(v, 'expctV') ; }
    public expectW(v:any):TSExpectAgent { return this.expect(v, 'expctW') ; }
    public expectX(v:any):TSExpectAgent { return this.expect(v, 'expctX') ; }
    public expectY(v:any):TSExpectAgent { return this.expect(v, 'expctY') ; }
    public expectZ(v:any):TSExpectAgent { return this.expect(v, 'expctZ') ; }

    public fail():boolean { this._failed ++ ; return false ; }
    public pass():boolean { this._passed ++ ; return true ; }

}

export class TSExpectAgent {
    private _value:any ;
    private _step:TSUnaryTest ;
    private _message:string ;
    public constructor(step:TSUnaryTest, value:any, msg:string='') {
        this._step = step ;
        this._value = value ;
        this._message = msg ;
    }

    public toBe(aValue:any):boolean     { return !$equal(aValue, this._value) ? this._elogfail(aValue) : this._step?.pass() ; }
    public notToBe(aValue:any):boolean  { return $equal(aValue, this._value)  ? this._nelogfail(aValue) : this._step?.pass() ; }
    public toBeTruthy():boolean         { return !this._value           ? this._elogfail(true)       : this._step?.pass() ; }
    public toBeFalsy():boolean          { return !!this._value          ? this._elogfail(false)      : this._step?.pass() ; }
    public toBeUndefined():boolean      { return $defined(this._value)  ? this._elogfail(undefined)  : this._step?.pass() ; }
    public toBeDefined():boolean        { return !$defined(this._value) ? this._nelogfail(undefined) : this._step?.pass() ; }
    public toBeNull():boolean           { return this._value !== null   ? this._elogfail(null)       : this._step?.pass() ; }
    public toBeNotNull():boolean        { return this._value === null   ? this._nelogfail(null)      : this._step?.pass() ; }

    public toBeOK():boolean             { return !$ok(this._value)          ? this._elogfail('<a non null defined value>')  : this._step?.pass() ; }
    public toBeNotOK():boolean          { return $ok(this._value)           ? this._elogfail('<a null or undefined value>') : this._step?.pass() ; }

    public toBeNaN():boolean            { return !isNaN(this._value)        ? this._elogfail(NaN)                : this._step?.pass() ; }
    public toBeANumber():boolean        { return !$isnumber(this._value)    ? this._elogfail('<a valid number>') : this._step?.pass() ; }
    public toBeAnInt():boolean          { return !$isint(this._value)       ? this._elogfail('<an integer>')     : this._step?.pass() ; }
    public toBeAnUnsigned():boolean     { return !$isunsigned(this._value)  ? this._elogfail('<an unsigned>')    : this._step?.pass() ; }
    public toBeAString():boolean        { return !$isstring(this._value)    ? this._elogfail('<a string>')       : this._step?.pass() ; }
    public toBeBool():boolean           { return !$isbool(this._value)      ? this._elogfail('<a boolean>')      : this._step?.pass() ; }

    public toBeAnEmail():boolean        { return !$isemail(this._value)     ? this._elogfail('<an email>')       : this._step?.pass() ; }
    public toBeAnUrl():boolean          { return !$isurl(this._value)       ? this._elogfail('<an url>')         : this._step?.pass() ; }
    public toBeAnUUID():boolean         { return !$isuuid(this._value)      ? this._elogfail('<an UUID>')        : this._step?.pass() ; }

    public toBeAnObject():boolean       { return !$isobject(this._value)    ? this._elogfail('<an object>')      : this._step?.pass() ; }
    public toBeArray():boolean          { return !$isarray(this._value)     ? this._elogfail('<an array>')       : this._step?.pass() ; }
    public toBeADate():boolean          { return !$isdate(this._value)      ? this._elogfail('<a date>')         : this._step?.pass() ; }
    public toBeAFunction():boolean      { return !$isfunction(this._value)  ? this._elogfail('<a function>')     : this._step?.pass() ; }

    public toBeEmpty():boolean {
        if (this._value instanceof Set) { return this._value.size > 0       ? this._elogfail('<an empty Set>')   : this._step?.pass() ; }
        if (this._value instanceof Map) { return this._value.size > 0       ? this._elogfail('<an empty Map>')   : this._step?.pass() ; }
        if ($isarray(this._value))      { return $count(this._value) > 0    ? this._elogfail('<an empty Array>') : this._step?.pass() ; }
        if ($isstring(this._value))     { return $length(this._value) > 0   ? this._elogfail('<an empty String>'): this._step?.pass() ; }
        if (this._value instanceof Uint8Array || this._value instanceof TSData) {
            return $length(this._value) > 0 ? this._elogfail('<an empty buffer>'): this._step?.pass() ;
        }
        if (this._value instanceof TSList) { return this._value.count > 0     ? this._elogfail('<an empty List>')   : this._step?.pass() ; }
        if (this._value instanceof TSRange || this._value instanceof TSRangeSet || this._value instanceof TSInterval) {
            return !this._value.isEmpty ? this._elogfail('<an empty interval>'): this._step?.pass() ;
        }
        return $ok(this._value) ? this._elogfail('<not a container>') : this._step?.pass() ;
    }

    public toBeNotEmpty():boolean {
        if (this._value instanceof Set) { return this._value.size === 0     ? this._elogfail('<a significant Set>')   : this._step?.pass() ; }
        if (this._value instanceof Map) { return this._value.size === 0     ? this._elogfail('<a significant Map>')   : this._step?.pass() ; }
        if ($isarray(this._value))      { return $count(this._value) === 0  ? this._elogfail('<a significant Array>') : this._step?.pass() ; }
        if ($isstring(this._value))     { return $length(this._value) === 0 ? this._elogfail('<a significant String>'): this._step?.pass() ; }
        if (this._value instanceof Uint8Array || this._value instanceof TSData) {
            return $length(this._value) === 0 ? this._elogfail('<a significant buffer>'): this._step?.pass() ;
        }
        if (this._value instanceof TSList) { return this._value.count === 0     ? this._elogfail('<a significant List>')   : this._step?.pass() ; }
        if (this._value instanceof TSRange || this._value instanceof TSRangeSet || this._value instanceof TSInterval) {
            return this._value.isEmpty ? this._elogfail('<a significant interval>'): this._step?.pass() ;
        }
        return this._elogfail($ok(this._value) ? '<not a container>' : 'null or undefined value') ;
    }

    public toBeUnordered(aValue:Set<any>|Array<any>)
    { return !$ok(this._value) || !$ok(aValue) || !$unorderedEqual(this._value, aValue) ? this._elogfail(aValue) : this._step.pass() ; }

    public eq(aValue:any):boolean       { return this.toBe(aValue) ; }
    public neq(aValue:any):boolean      { return this.notToBe(aValue) ; }

    public gt(aValue:any):boolean       { return $compare(aValue, this._value) !== Ascending  ? this._compfail(aValue, '>') : this._step?.pass() ; }
    public gte(aValue:any):boolean      { return $compare(aValue, this._value) === Descending ? this._compfail(aValue, '≥') : this._step?.pass() ; }
    public lt(aValue:any):boolean       { return $compare(aValue, this._value) !== Descending ? this._compfail(aValue, '<') : this._step?.pass() ; }
    public lte(aValue:any):boolean      { return $compare(aValue, this._value) === Ascending  ? this._compfail(aValue, '≤') : this._step?.pass() ; }

    // simpler methods
    public is = this.toBe ;
    public isnot = this.notToBe ;
    public OK = this.toBeOK ;
    public KO = this.toBeNotOK ;
    public def = this.toBeDefined ;
    public undef = this.toBeUndefined ;
    public notnull = this.toBeNotNull ;
    public null = this.toBeNull ;
    public empty = this.toBeEmpty ;
    public filled = this.toBeNotEmpty ;
    public true = this.toBeTruthy ;
    public false = this.toBeFalsy ;

    private _compfail(aValue:any, op:string):boolean {
        if (!this._step.silent) {
            const start = this._writeMessage() ;
            $logterm(`&adid expect value:&O&w${$inspect(this._value).replace(/&/g, '&&')}&0`) ;
            $logterm(`${start}&eto be ${op} to value:&E&b${$inspect(aValue)}&0`) ;
        } 
        return this._step?.fail() ;
    }

    private _elogfail(aValue:any):boolean {
        if (!this._step.silent) {
            const start = this._writeMessage() ;
            $logterm(`&edid expect value:&E&b${$inspect(aValue).replace(/&/g, '&&')}&0`) ;
            $logterm(`${start}&adid get as value:&O&w${$inspect(this._value).replace(/&/g, '&&')}&0`) ; 
        }
        return this._step?.fail() ;
    }

    private _nelogfail(aValue:any):boolean {
        if (!this._step.silent) {
            this._writeMessage() ;
            $logterm(`&adid not expect  :&O&w${$inspect(aValue).replace(/&/g, '&&')}&0`) ; 
        }
        return this._step?.fail() ;
    }

    private _writeMessage():string {
        const l = this._message.length ;
        $writeterm(`\n&y${this._message}&0 `) ;
        return l > 0 ? "".padStart(l+1, " ") : "" ;
    }
}

