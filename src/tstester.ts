import { inspect } from "util";
import { $defined, $isarray, $isbool, $isdate, $isemail, $isfunction, $isint, $isnumber, $isobject, $isstring, $isunsigned, $isurl, $isuuid, $keys, $length, $ok } from "./commons";
import { $compare, $equal } from "./compare";
import { AnyDictionary, Ascending, Descending } from "./types";
import { $inspect, $logterm, $writeterm } from "./utils";

export type groupFN = (t:TSTestGroup) => Promise<void> ;
export type unaryFN = (t:TSUnaryTest) => Promise<void> ;
export type testFN = (t:TSTest) => Promise<void> ;



export class TSTester {
    groups:TSTestGroup[] = [] ;
    public desc:string ;

    public constructor(s:string) {
        this.desc = s ;
    }
    public addGroup(grp:TSTestGroup) { this.addGroups([grp]) ; }
    public addGroups(grps:TSTestGroup|TSTestGroup[]) {
        if (grps instanceof TSTestGroup) { grps = [grps] ; }
        for (let g of grps) { this.groups.push(g) ; }
    }
    public log(format:string, ...args:any[]) {
        $logterm(format, args) ;
    }

    public async run() {
        // first phase, we construct all the unary test in an asynchronus function call
        this.log(`&Z&eTSTester will now start &Y&k ${this.desc} &0&e :`) ;
        let expectations = 0 ;
        let expectationsFailed = 0 ;
        for (let g of this.groups) { await g.prepare() ; }
        let passed = 0, failed = 0 ;
        // second phase, we run the tests
        for (let g of this.groups) {
            const [groupExpected, groupFailed] = await g.run() ;
            expectations += groupExpected ;
            expectationsFailed += groupFailed ;
            if (groupFailed === 0) { passed++ } else { failed++ ; }
        }
        this.log(`&y${expectations.toString().padStart(4)}&0&e test${expectations === 1 ? 'was' : 's were'} executed.&0`) ;
        if (passed > 0) { this.log(`&g${passed.toString().padStart(4)}&0&j group${passed === 1 ? ' ' : 's'} of tests did &G&w  PASS  &0`) ; }
        if (failed > 0) { this.log(`&r${failed.toString().padStart(4)}&0&o group${failed === 1 ? ' ' : 's'} of tests did &R&w  FAIL  &0`) ; }
        if (passed > 0 && !failed) {
            this.log('&G&w  ALL TESTS PASSED  &0') ;
        }
        else if (expectationsFailed > 0) {
            this.log(`&R&w${expectationsFailed.toString().padStart(4)} TEST${expectationsFailed>1?'S':''} FAILED  &0`) ;
        }
    }
}

export class TSTest {
    public desc:string ;
    public fn:testFN ;
    protected constructor(s:string, f:testFN) {
        this.desc = s ;
        this.fn = f ;
    }
    public static group(s:string, f:groupFN) {
        return new TSTestGroup(s, f) ;
    }
}

export class TSTestGroup extends TSTest {
    private _unaries:TSUnaryTest[] = [] ; 
    public constructor(s:string, f:groupFN) {
        super(s, f as testFN) ;
    }

    public unary(s:string, f:unaryFN) {
        this._unaries.push(new TSUnaryTest(this, s, f)) ;
    }

    public async prepare():Promise<void> {
        await this.fn(this) ;
    }

    public log(format:string, ...args:any[]) {
        $logterm('  '+format, args) ;
    }

    public async run():Promise<[number, number]> {
        let expectations = 0 ;
        let expectationFailed = 0 ;

        this.log(`&u- Running group tests &U&k ${this.desc} &0`) ;
        for (let u of this._unaries) {
            const [unaryExpected, unaryFailed] = await u.run() ;
            expectationFailed += unaryFailed ;
            expectations += unaryExpected ;
        }
        $logterm(`${expectationFailed==0?'&j':'\n&o'}    ${this.desc} tests ${expectationFailed==0?'&G&w  PASSED  ':'&R&w  FAILED  '}&0\n`) ;
        return [expectations, expectationFailed] ;
    }
}

export class TSUnaryTest extends TSTest {
    public _group:TSTestGroup ;
    private _failed:number = 0 ;
    private _passed:number = 0 ;
    private _expected:number = 0 ;
    private _registrations:AnyDictionary = {} ;

    public constructor(g:TSTestGroup, s:string, f:unaryFN) {
        super(s, f as testFN) ;
        this._group = g ;
    }
    public log(format:string, ...args:any[]) {
        $logterm('    '+format,'', args) ;
    }
    
    public async run():Promise<[number, number]> {
        this._passed = 0 ;
        this._failed = 0 ;
        $writeterm(`&x     ➤ &ltesting &B&w ${this.desc} &0`) ;
        await this.fn(this) ;
        if (this._failed > 0) { 
            $writeterm('\n     ') ; 
            this.printRegistrations() ;
        }
        if (this._passed > 0) { $writeterm(`&J&k ${this._passed} OK &0`) ; }
        if (this._failed > 0) { $writeterm(`&R&w ${this._failed} KO &0`) ; }
        $logterm('') ;
        return [this._expected, this._failed] ;
    }
    
    public register(name:string, value:any) {
        if ($defined(value) && $length(name)) { this._registrations[name] = value ; }
    }
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

    public eq(aValue:any):boolean       { return this.toBe(aValue) ; }
    public neq(aValue:any):boolean      { return this.notToBe(aValue) ; }
    
    public gt(aValue:any):boolean       { return $compare(aValue, this._value) !== Ascending  ? this._compfail(aValue, '>') : this._step?.pass() ; }
    public gte(aValue:any):boolean      { return $compare(aValue, this._value) === Descending ? this._compfail(aValue, '≥') : this._step?.pass() ; }
    public lt(aValue:any):boolean       { return $compare(aValue, this._value) !== Descending ? this._compfail(aValue, '<') : this._step?.pass() ; }
    public lte(aValue:any):boolean      { return $compare(aValue, this._value) === Ascending  ? this._compfail(aValue, '≤') : this._step?.pass() ; }

    private _compfail(aValue:any, op:string):boolean {
        const start = this._writeMessage() ;
        $logterm(`&adid expect value:&O&w${inspect(this._value,false,5)}&0`) ;
        $logterm(`${start}&eto be ${op} to value:&E&b${$inspect(aValue)}&0`) ; 
        return this._step?.fail() ;
    }

    private _elogfail(aValue:any):boolean {
        const start = this._writeMessage() ;
        $logterm(`&edid expect value:&E&b${$inspect(aValue)}&0`) ;
        $logterm(`${start}&adid get as value:&O&w${$inspect(this._value)}&0`) ; 
        return this._step?.fail() ;
    }

    private _nelogfail(aValue:any):boolean {
        this._writeMessage() ;
        $logterm(`&adid not expect  :&O&w${$inspect(aValue)}&0`) ; 
        return this._step?.fail() ;
    }

    private _writeMessage():string {
        const l = this._message.length ;
        $writeterm(`\n&y${this._message}&0 `) ;
        return l > 0 ? "".padStart(l+1, " ") : "" ;
    }
}

