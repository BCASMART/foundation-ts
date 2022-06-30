import { inspect } from "util";
import { $defined, $isarray, $isbool, $isdate, $isemail, $isfunction, $isint, $isnumber, $isobject, $isstring, $isunsigned, $isurl, $isuuid, $length, $ok } from "./commons";
import { $compare, $equal } from "./compare";
import { Ascending, Descending } from "./types";
import { $logterm, $writeterm } from "./utils";

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
        if (this._failed > 0) { $writeterm('\n     ') ; }
        if (this._passed > 0) { $writeterm(`&J&k ${this._passed} OK &0`) ; }
        if (this._failed > 0) { $writeterm(`&R&w ${this._failed} KO &0`) ; }
        $logterm('') ;
        return [this._expected, this._failed] ;
    }

    public expect(v:any,msg?:string):TSExpectAgent {
        this._expected ++ ;
        if (!$length(msg)) { msg = this._expected.toString().padStart(4) ; }
        return new TSExpectAgent(this, v, msg) ;
    }

    // this could be considered as useless but eventually, I find it very usefull and literrate 
    public expect0(v:any):TSExpectAgent { return this.expect(v, 'Line 0') ; }
    public expect1(v:any):TSExpectAgent { return this.expect(v, 'Line 1') ; }
    public expect2(v:any):TSExpectAgent { return this.expect(v, 'Line 2') ; }
    public expect3(v:any):TSExpectAgent { return this.expect(v, 'Line 3') ; }
    public expect4(v:any):TSExpectAgent { return this.expect(v, 'Line 4') ; }
    public expect5(v:any):TSExpectAgent { return this.expect(v, 'Line 5') ; }
    public expect6(v:any):TSExpectAgent { return this.expect(v, 'Line 6') ; }
    public expect7(v:any):TSExpectAgent { return this.expect(v, 'Line 7') ; }
    public expect8(v:any):TSExpectAgent { return this.expect(v, 'Line 8') ; }
    public expect9(v:any):TSExpectAgent { return this.expect(v, 'Line 9') ; }
    public expectA(v:any):TSExpectAgent { return this.expect(v, 'Line A') ; }
    public expectB(v:any):TSExpectAgent { return this.expect(v, 'Line B') ; }
    public expectC(v:any):TSExpectAgent { return this.expect(v, 'Line C') ; }
    public expectD(v:any):TSExpectAgent { return this.expect(v, 'Line D') ; }
    public expectE(v:any):TSExpectAgent { return this.expect(v, 'Line E') ; }
    public expectF(v:any):TSExpectAgent { return this.expect(v, 'Line F') ; }
    public expectG(v:any):TSExpectAgent { return this.expect(v, 'Line G') ; }
    public expectH(v:any):TSExpectAgent { return this.expect(v, 'Line H') ; }
    public expectI(v:any):TSExpectAgent { return this.expect(v, 'Line I') ; }
    public expectJ(v:any):TSExpectAgent { return this.expect(v, 'Line J') ; }
    public expectK(v:any):TSExpectAgent { return this.expect(v, 'Line K') ; }
    public expectL(v:any):TSExpectAgent { return this.expect(v, 'Line L') ; }
    public expectM(v:any):TSExpectAgent { return this.expect(v, 'Line M') ; }
    public expectN(v:any):TSExpectAgent { return this.expect(v, 'Line N') ; }
    public expectO(v:any):TSExpectAgent { return this.expect(v, 'Line O') ; }
    public expectP(v:any):TSExpectAgent { return this.expect(v, 'Line P') ; }
    public expectQ(v:any):TSExpectAgent { return this.expect(v, 'Line Q') ; }
    public expectR(v:any):TSExpectAgent { return this.expect(v, 'Line R') ; }
    public expectS(v:any):TSExpectAgent { return this.expect(v, 'Line S') ; }
    public expectT(v:any):TSExpectAgent { return this.expect(v, 'Line T') ; }
    public expectU(v:any):TSExpectAgent { return this.expect(v, 'Line U') ; }
    public expectV(v:any):TSExpectAgent { return this.expect(v, 'Line V') ; }
    public expectW(v:any):TSExpectAgent { return this.expect(v, 'Line W') ; }
    public expectX(v:any):TSExpectAgent { return this.expect(v, 'Line X') ; }
    public expectY(v:any):TSExpectAgent { return this.expect(v, 'Line Y') ; }
    public expectZ(v:any):TSExpectAgent { return this.expect(v, 'Line Z') ; }

    public fail() { this._failed ++ ;}
    public pass() { this._passed ++ ;}

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


    public toBe(aValue:any)     { if (!$equal(aValue, this._value)) { this._elogfail(aValue) ; } else { this._step?.pass() ; }}
    public notToBe(aValue:any)  { if ($equal(aValue, this._value))  { this._nelogfail(aValue) ; } else { this._step?.pass() ; }}

    public toBeTruthy()         { if (!this._value)                 { this._elogfail(true) ;} else { this._step?.pass() ; }}
    public toBeFalsy()          { if (this._value)                  { this._elogfail(false) ;} else { this._step?.pass() ; }}
    public toBeUndefined()      { if ($defined(this._value))        { this._elogfail(undefined) ; } else { this._step?.pass() ; }}
    public toBeDefined()        { if (!$defined(this._value))       { this._nelogfail(undefined) ; ; } else { this._step?.pass() ; }}
    public toBeNull()           { if (this._value !== null)         { this._elogfail(null) ; } else { this._step?.pass() ; }}
    public toBeNotNull()        { if (this._value === null)         { this._nelogfail(null) ; } else { this._step?.pass() ; }}

    public toBeOK()             { if (!$ok(this._value))            { this._elogfail('<a non null defined value>') ; } else { this._step?.pass() ; }}
    public toBeNotOK()          { if ($ok(this._value))             { this._elogfail('<a null or undefined value>') ; } else { this._step?.pass() ; }}

    public toBeNaN()            { if (!isNaN(this._value))          { this._elogfail(NaN) ; } else { this._step?.pass() ; }}
    public toBeANumber()        { if (!$isnumber(this._value))      { this._elogfail('<a valid number>') ; } else { this._step?.pass() ; }}
    public toBeAnInt()          { if (!$isint(this._value))         { this._elogfail('<an integer>') ; } else { this._step?.pass() ; }}
    public toBeAnUnsigned()     { if (!$isunsigned(this._value))    { this._elogfail('<an unsigned>') ; } else { this._step?.pass() ; }}
    public toBeAString()        { if (!$isstring(this._value))      { this._elogfail('<a string>') ; } else { this._step?.pass() ; }}
    public toBeBool()           { if (!$isbool(this._value))        { this._elogfail('<a boolean>') ; } else { this._step?.pass() ; }}

    public toBeAnEmail()        { if (!$isemail(this._value))       { this._elogfail('<an email>') ; } else { this._step?.pass() ; }}
    public toBeAnUrl()          { if (!$isurl(this._value))         { this._elogfail('<an url>') ; } else { this._step?.pass() ; }}
    public toBeAnUUID()         { if (!$isuuid(this._value))        { this._elogfail('<an UUID>') ; } else { this._step?.pass() ; }}

    public toBeAnObject()       { if (!$isobject(this._value))      { this._elogfail('<an object>') ; } else { this._step?.pass() ; }}
    public toBeArray()          { if (!$isarray(this._value))       { this._elogfail('<an array>') ; } else { this._step?.pass() ; }}
    public toBeADate()          { if (!$isdate(this._value))        { this._elogfail('<a date>') ; } else { this._step?.pass() ; }}
    public toBeAFunction()      { if (!$isfunction(this._value))    { this._elogfail('<a function>') ; } else { this._step?.pass() ; }}

    public gt(aValue:any)       { if ($compare(aValue, this._value) !== Ascending)  { this._compfail(aValue, '>') ; } else { this._step?.pass() ; }}
    public gte(aValue:any)      { if ($compare(aValue, this._value) === Descending) { this._compfail(aValue, '≥') ; } else { this._step?.pass() ; }}
    public lt(aValue:any)       { if ($compare(aValue, this._value) !== Descending) { this._compfail(aValue, '<') ; } else { this._step?.pass() ; }}
    public lte(aValue:any)      { if ($compare(aValue, this._value) === Ascending)  { this._compfail(aValue, '≤') ; } else { this._step?.pass() ; }}

    private _compfail(aValue:any, op:string) {
        const start = this._writeMessage() ;
        $logterm(`&adid expect value:&O&w${inspect(this._value,false,5)}&0`) ;
        $logterm(`${start}&eto be ${op} to value:&E&b${inspect(aValue,false,5)}&0`) ; 
        this._step?.fail() ;
    }

    private _elogfail(aValue:any) {
        const start = this._writeMessage() ;
        $logterm(`&edid expect value:&E&b${inspect(aValue, false, 5)}&0`) ;
        $logterm(`${start}&adid get as value:&O&w${inspect(this._value, false, 5)}&0`) ; 
        this._step?.fail() ;
    }

    private _nelogfail(aValue:any) {
        this._writeMessage() ;
        $logterm(`&adid not expect  :&O&w${inspect(aValue, false, 5)}&0`) ; 
        this._step?.fail() ;
    }

    private _writeMessage():string {
        const l = this._message.length ;
        $writeterm(`\n&y${this._message}&0 `) ;
        return l > 0 ? "".padStart(l+1, " ") : "" ;
    }
}

