import { inspect } from "util";
import { $address, $defined, $email, $isarray, $isint, $isnumber, $isobject, $isodate, $isstring, $isunsigned, $ok, $url, $UUID } from "./commons";
import { $equal } from "./compare";
import { $logterm } from "./utils";

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
        $logterm(format, '', args) ;
    }

    public async run() {
        // first phase, we construct all the unary test in an asynchronus function call
        this.log(`&eTSTester will now run &Y&k${this.desc}&0:`)
        for (let g of this.groups) { await g.prepare() ; }
        let passed = 0, failed = 0 ;
        // second phase, we run the tests
        for (let g of this.groups) {
            const groupok = await g.run() ;
            if (groupok) { passed++ } else { failed++ ; }
        }
        if (passed > 0) { this.log(`&g${passed}&0&j group${passed === 1 ? '' : 's'} of tests did &G&w  PASS  &0`) ; }
        if (failed > 0) { this.log(`&r${failed}&0&o group${failed === 1 ? '' : 's'} of tests did &R&w  FAIL  &0`) ; }
        if (passed > 0 && !failed) {
            this.log('&G&w  ALL TESTS PASSED  &0') ;
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

    public async prepare() {
        await this.fn(this) ;
    }

    public log(format:string, ...args:any[]) {
        $logterm('  '+format,'', args) ;
    }

    public async run():Promise<boolean> {
        let failed = 0 ;

        this.log(`&u- Running group tests &U&k ${this.desc} &0`) ;
        for (let u of this._unaries) {
            const unaryok = await u.run() ;
            if (!unaryok) { failed++ ; }
        }
        this.log(`  ${failed==0?'&j':'&o'}... group test ${this.desc} ${failed==0?'&G&w  PASSED  ':'&R&w  FAILED  '}&0`) ;
        return failed === 0 ;
    }
}

export class TSUnaryTest extends TSTest {
    public _group:TSTestGroup ;
    private _failed:number = 0 ;
    private _passed:number = 0 ;

    public constructor(g:TSTestGroup, s:string, f:unaryFN) {
        super(s, f as testFN) ;
        this._group = g ;
    }
    public log(format:string, ...args:any[]) {
        $logterm('    '+format,'', args) ;
    }

    public async run():Promise<boolean> {
        this._passed = 0 ;
        this._failed = 0 ;
        this.log(`&x... &lrunning tests &B&w ${this.desc} &0`) ;
        await this.fn(this) ;
        if (this._passed > 0) { this.log(`    &g${this._passed}&0 passed`) ; }
        if (this._failed > 0) { this.log(`    &r${this._failed}&0 failed`) ; }
        
        return this._failed === 0 ;
    }

    public expect(v:any):TSExpectAgent {
        return new TSExpectAgent(this, v) ;
    }

    public fail() { this._failed ++ ;}
    public pass() { this._passed ++ ;}

}

export class TSExpectAgent {
    private _value:any ;
    private _step:TSUnaryTest ;
    public constructor(step:TSUnaryTest, value:any) {
        this._step = step ;
        this._value = value ;
    }
    
    private _elogfail(aValue:any) {
        $logterm(`&edid expect value:&E&b${inspect(aValue)}&0`) ;
        $logterm(`&adid get as value:&O&w${inspect(this._value)}&0\n`) ; 
        this._step?.fail() ;
    }

    private _nelogfail(aValue:any) {
        $logterm(`&adid not expect  :&O&w${inspect(aValue)}&0\n`) ; 
        this._step?.fail() ;
    }


    public toBe(aValue:any)     { if (!$equal(aValue, this._value)) { this._elogfail(aValue) ; } else { this._step?.pass() ; }}
    public notToBe(aValue:any)  { if ($equal(aValue, this._value))  { this._nelogfail(aValue) ; } else { this._step?.pass() ; }}

    public toBeTruthy()         { if (!this._value)                 { this._elogfail(true) ;} else { this._step?.pass() ; }}
    public toBeFalsy()          { if (this._value)                  { this._elogfail(false) ;} else { this._step?.pass() ; }}
    public toBeUndefined()      { if ($defined(this._value))        { this._nelogfail(undefined) ; } else { this._step?.pass() ; }}
    public toBeDefined()        { if (!$defined(this._value))       { this._elogfail(undefined) ; ; } else { this._step?.pass() ; }}
    public toBeNull()           { if (this._value !== null)         { this._elogfail(null) ; } else { this._step?.pass() ; }}
    public toBeNotNull()        { if (this._value === null)         { this._nelogfail(null) ; } else { this._step?.pass() ; }}

    public toBeOK()             { if (!$ok(this._value))            { this._elogfail('<a non null defined value>') ; } else { this._step?.pass() ; }}
    public toBeNotOK()          { if ($ok(this._value))             { this._elogfail('<a null or undefined value>') ; } else { this._step?.pass() ; }}

    public toBeNaN()            { if (!isNaN(this._value))          { this._elogfail(NaN) ; } else { this._step?.pass() ; }}
    public toBeNumber()         { if (!$isnumber(this._value))      { this._elogfail('<a valid number>') ; } else { this._step?.pass() ; }}
    public toBeInt()            { if (!$isint(this._value))         { this._elogfail('<an integer>') ; } else { this._step?.pass() ; }}
    public toBeUnsigned()       { if (!$isunsigned(this._value))    { this._elogfail('<an unsigned>') ; } else { this._step?.pass() ; }}
    public toBeString()         { if (!$isstring(this._value))      { this._elogfail('<a string>') ; } else { this._step?.pass() ; }}

    public toBeEmail()          { if (!$ok($email(this._value)))    { this._elogfail('<an email>') ; } else { this._step?.pass() ; }}
    public toBeUrl()            { if (!$ok($url(this._value)))      { this._elogfail('<an url>') ; } else { this._step?.pass() ; }}
    public toBeUUID()           { if (!$ok($UUID(this._value)))     { this._elogfail('<an UUID>') ; } else { this._step?.pass() ; }}

    public toBeObject()         { if (!$isobject(this._value))      { this._elogfail('<an object>') ; } else { this._step?.pass() ; }}
    public toBeArray()          { if (!$isarray(this._value))       { this._elogfail('<an array>') ; } else { this._step?.pass() ; }}
    public toBeDate()           { if (!$ok($isodate(this._value)))  { this._elogfail('<a date>') ; } else { this._step?.pass() ; }}
    public toBeAddress()        { if (!$ok($address(this._value)))  { this._elogfail('<an address>') ; } else { this._step?.pass() ; }}
}

