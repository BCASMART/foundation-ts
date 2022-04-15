import { $isnumber, $logterm, $ok } from "./commons";
import { $equal } from "./compare";

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
        this.log(`Running tests &Y&k${this.desc}&0:`)
        for (let g of this.groups) { await g.prepare() ; }
        let passed = 0, failed = 0 ;
        // second phase, we run the tests
        for (let g of this.groups) {
            const groupok = await g.run() ;
            if (groupok) { passed++ } else { failed++ ; }
        }
        if (passed > 0) { this.log(`&g${passed}&0 group${passed === 1 ? '' : 's'} of tests did &G&w  PASS  &0`) ; }
        if (failed > 0) { this.log(`&r${failed}&0 group${failed === 1 ? '' : 's'} of tests did &R&w  FAIL  &0`) ; }
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

        this.log(`- Running group tests &C&k ${this.desc} &0`) ;
        for (let u of this._unaries) {
            const unaryok = await u.run() ;
            if (!unaryok) { failed++ ; }
        }
        this.log(`  ... group test ${this.desc} did ${failed==0?'&G&w  PASS  ':'&R&w  FAILED  '}&0`) ;
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
        this.log(`... running tests &B&w ${this.desc} &0`) ;
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
    public toBe(aValue:any)     { if (!$equal(aValue, this._value)) { this._step?.fail() ;}}
    public notToBe(aValue:any)  { if ($equal(aValue, this._value)) { this._step?.fail() ;}}
    public toBeTruthy()         { if (!this._value) { this._step?.fail() ; }}
    public toBeFalsy()          { if (this._value) { this._step?.fail() ; }}
    public toBeUndefined()      { if (this._value !== undefined) { this._step?.fail() ; }}
    public toBeDefined()        { if (this._value === undefined) { this._step?.fail() ; }}
    public toBeNull()           { if (this._value !== null) { this._step?.fail() ; }}
    public toBeNotNull()        { if (this._value === null) { this._step?.fail() ; }}
    public toBeOK()             { if (!$ok(this._value)) { this._step?.fail() ; }}
    public toBeNotOK()          { if ($ok(this._value)) { this._step?.fail() ; }}
    public toBeNaN()            { if (!isNaN(this._value)) { this._step?.fail() ; }}
    public toBeNumber()         { if (!$isnumber(this._value)) { this._step?.fail() ; }}
}

