import { TSTester } from '../src/tstester'

let args = process.argv.slice(2) ;

let i = args.indexOf('-stopit') ;
if (i >= 0) {
    TSTester.globalOptions.stopOnFirstFail = true ;
    args.splice(i, 1) ;
}

i = args.indexOf('-silent') ;
if (i >= 0) {
    TSTester.globalOptions.silent = true ;
    args.splice(i, 1) ;
}

import { TSData } from '../src/tsdata';
import { TSDate } from '../src/tsdate';
import { TSInterval } from '../src/tsinterval';
import { TSList } from '../src/tslist';
import { TSEmptyRange, TSRange } from '../src/tsrange';
import { TSRangeSet } from '../src/tsrangeset';
import { $exit, $logterm } from '../src/utils';
import { arrayGroups } from './array.test';
import { commonsGroups } from "./commons.test";
import { compareGroups } from './compare.test';
import { cryptoGroups } from './crypto.test';
import { fsGroups } from './fs.test';
import { fusionGroups } from './fusion.test';
import { numberGroups } from './number.test';
import { stringGroups } from './strings.test';
import { colorGroups } from './tscolor.test';
import { countriesGroups } from './tscountry.test';
import { dataGroups } from './data.test';
import { dateGroups } from './tsdate.test';
import { dateCompGroups } from './tsdatecomp.test';
import { defaultsGroups } from './tsdefaults.test';
import { errorsGroups } from './tserror.test';
import { geometryGroups } from './tsgeometry.test';
import { intervalGroups } from './tsinterval.test';
import { mutableDataGroups } from './tsdata.test';
import { qualifierGroups } from './tsqualifier.test';
import { rangeGroups } from './tsrange.test';
import { rangeSetGroups } from './tsrangeset.test';
import { requestGroups } from './tsrequest.test';
import { serverGroups } from './tsserver.test';
import { utilsGroups } from './utils.test';
import { decoratorGroups } from './decorators.test';
import { phoneGroups } from './tsphonenumber.test';
import { structureGroups } from './tsparser.test';
import { envGroups } from './env.test';
import { mapsetGroups } from './mapset.test';
import { TSURLGroups } from './tsurl.test';
import { objectGroups } from './object.test';
import { coupleGroups } from './tscouple.test';
import { listGroups } from './tslist.test';
import { charsetGroups } from './tscharset.test';
import { contractGroups } from './contract.test';

const dumper = args.length === 1 && args.first() === '-list' ;
const tester = new TSTester("Foundation-ts unary tests") ;

tester.addGroups(commonsGroups,     "commons") ;
tester.addGroups(stringGroups,      "strings") ;
tester.addGroups(numberGroups,      "numbers") ;
tester.addGroups(arrayGroups,       "arrays") ;
tester.addGroups(compareGroups,     "compare") ;
tester.addGroups(countriesGroups,   "countries") ;
tester.addGroups(cryptoGroups,      "crypto") ;
tester.addGroups(dataGroups,        "data") ;
tester.addGroups(dateGroups,        "dates") ;
tester.addGroups(dateCompGroups,    "dates") ;
tester.addGroups(defaultsGroups,    "defaults") ;
tester.addGroups(envGroups,         "env") ;
tester.addGroups(intervalGroups,    "intervals") ;
tester.addGroups(mapsetGroups,      "mapset") ;
tester.addGroups(rangeGroups,       "ranges") ;
tester.addGroups(rangeSetGroups,    "ranges") ;
tester.addGroups(requestGroups,     "requests") ;
tester.addGroups(serverGroups,      "server") ;
tester.addGroups(utilsGroups,       "utils") ;
tester.addGroups(colorGroups,       "colors") ;
tester.addGroups(geometryGroups,    "geometry") ;
tester.addGroups(mutableDataGroups, "data") ;
tester.addGroups(qualifierGroups,   "qualifiers") ;
tester.addGroups(errorsGroups,      "errors") ;
tester.addGroups(fsGroups,          "fs") ;
tester.addGroups(fusionGroups,      "fusion") ;
tester.addGroups(phoneGroups,       "phones") ;
tester.addGroups(structureGroups,   "parser") ;
tester.addGroups(decoratorGroups,   "decorators") ;
tester.addGroups(TSURLGroups,       "url") ;
tester.addGroups(objectGroups,      "objects") ;
tester.addGroups(coupleGroups,      "couples") ;
tester.addGroups(listGroups,        "lists") ;
tester.addGroups(charsetGroups,     "charsets") ;
tester.addGroups(contractGroups,    "contract") ;

tester.addGroup("Testing tester system itself", async (group) => {
    const setA = new Set(tester.names) ;
    const setB = new Set([
        "commons", "strings", "numbers", "arrays",
        "compare", "countries", "crypto", "dates", "decorators",
        "defaults", "env", "intervals", "ranges", "ranges",
        "requests", "server", "utils", "data", "url",
        "colors", "geometry", "qualifiers", "errors", "mapset",
        "fs", "fusion", "phones", "parser", "internals",
        "objects", "couples", "lists", "charsets", "contract"]) ;
    const date = new TSDate() ;
    
    group.unary("tests list", async (t) => {
        t.expect0(tester.names.length).is(33) ;
        t.expect1(setA).is(setB) ;
    }) ;
    
    group.unary("t.expect(...).empty()", async (t) => {
        t.expect0([]).empty() ;
        t.expect1(new Set()).empty() ;
        t.expect2(new Map()).empty() ;
        t.expect3(Buffer.from('')).empty() ;
        t.expect4('').empty() ;
        t.expect5(new TSData()).empty() ;
        t.expect6(new TSList()).empty() ;
        t.expect7(TSEmptyRange()).empty() ;
        t.expect8(new TSRangeSet()).empty() ;
        t.expect9(new TSInterval(date, date)).empty() ;
        t.expectA([]).empty() ;
    }) ;

    group.unary("t.expect(...).filled()", async (t) => {
        t.expect0(["eee"]).filled() ;
        t.expect1(new Set([1])).filled() ;
        t.expect2(new Map([['key', 1]])).filled() ;
        t.expect3(Buffer.from('$$$')).filled() ;
        t.expect5(TSData.fromString('$$')).filled() ;
        t.expect6(new TSList([1, 2])).filled() ;
        t.expect7(new TSRange([1,1])).filled() ;
        t.expect8(new TSRangeSet(1)).filled() ;
        t.expect9(new TSInterval(date, date.dateByAddingHours(1))).filled() ;
        t.expectA(new TSInterval(date, null)).filled() ;
        t.expectB(new TSInterval(null, date)).filled() ;
        t.expectC(["eee"]).filled() ;
    }) ;

    group.unary("t.expect(...).throws() / doesNotThrow() / rejects()", async (t) => {
        const boom = () => { throw new Error("kaboom 42") ; } ;
        t.expect0(boom).throws() ;
        t.expect1(boom).throws(/kaboom \d+/) ;
        t.expect2(boom).throws("kaboom") ;
        t.expect3(boom).throws((e:any) => e instanceof Error) ;
        t.expect4(() => 1 + 1).doesNotThrow() ;
        t.expect5(() => { throw "a bare string" ; }).throws("bare string") ;
        await t.expect6(async () => { throw new Error("async boom") ; }).rejects(/async boom/) ;
        await t.expect7(Promise.reject(new Error("rejected promise"))).rejects("rejected") ;
    }) ;

    group.unary("t.expect(...) type-predicate assertions", async (t) => {
        t.expect0("x").notnull() ;
        t.expect1(3.14).isnumber() ;
        t.expect2(42).isint() ;
        t.expect3(7).isuint() ;
        t.expect4(true).isbool() ;
        t.expect5("a@b.com").isemail() ;
        t.expect6("http://example.com").isurl() ;
        t.expect7("123e4567-e89b-12d3-a456-426614174000").isuuid() ;
        t.expect8({ a:1 }).isobject() ;
        t.expect9(new TSDate()).isdate() ;
        t.expectA([1, 2]).isiterable() ;
        t.expectB(() => 1).isfunction() ;
        t.expectC(__filename).isfile() ;
        t.expectD(__dirname).isdir() ;
        t.expectE("192.168.0.1").isipv4() ;
        t.expectF("::1").isipv6() ;
        t.expectG("10.0.0.1").isip() ;
        t.expectH("+33 1 45 24 70 00").isphone() ;
        t.expectI(TSData.fromString("payload")).isdata() ;
    }) ;

    group.unary("unary catchFunction / catched / stopped / stop()", async (t) => {
        t.catchFunction = async (tt, e) => {
            tt.expect0(tt.catched).true() ;
            tt.expect1((e as Error).message).is("intentional unary failure") ;
            tt.expect2(tt.stopped).false() ;
            tt.stop("done exercising catch path") ;
            tt.expect3(tt.stopped).true() ;
            tt.stop() ;
        } ;
        throw new Error("intentional unary failure") ;
    }) ;

    group.unary("TSTester runner internals (fresh sub-tester)", async (t) => {
        // Exercise the runner + failure-reporting code paths (_compfail / _elogfail /
        // _nelogfail / _writeMessage / printRegistrations / fail / dumpGroupInfo /
        // TSTester.run / dumpGroupsList / containsName) on a throwaway tester.
        // The sub-run deliberately fails assertions, which would print to the
        // terminal, so stdout/console are muted for its duration.
        const origLog = console.log ;
        const origWrite = process.stdout.write ;
        console.log = (() => {}) as any ;
        (process.stdout as any).write = (() => true) as any ;

        let res:any, listed:any ;
        let namedContains:boolean[] = [] ;
        let namedNames:string[] = [] ;
        try {
            const sub = new TSTester("sub-tester") ;
            sub.addGroup("failing group", async (g) => {
                g.unary("failing assertions", async (tt) => {
                    tt.register("some-context", { hint:"printed on failure" }) ;
                    tt.expect0(1).is(2) ;              // _compfail
                    tt.expect1("x").toBeNull() ;       // _elogfail
                    tt.expect2(5).notToBe(5) ;         // _nelogfail
                }) ;
                g.unary("passing assertions with logAllTests", async (tt) => {
                    tt.logAllTests = true ;
                    tt.expect0(1).is(1) ;             // _logpass logging branch + _writeMessage
                }) ;
            }, "failing", { silent:false, stopOnFirstFail:false }) ;

            res = await sub.run({ clearScreen:false }) ;
            listed = await sub.run({ listTests:true }) ;

            const named = new TSTester("named tester") ;
            named.addGroups([TSTester.group("g1", async (g) => { g.unary("noop", async () => {}) ; })], "my-name") ;
            namedContains = [named.containsName("my-name"), named.containsName("absent"), named.containsName(null)] ;
            namedNames = named.names ;
            await named.dumpGroupsList(false) ;
            await new TSTester("no groups").dumpGroupsList(false) ;
        }
        finally {
            console.log = origLog ;
            (process.stdout as any).write = origWrite ;
        }

        t.expect0(res.failed).is(1) ;
        t.expect1(res.failures).is(3) ;
        t.expect2(res.groups).is(1) ;
        t.expect3(listed.groups).is(0) ;
        t.expect4(namedContains).is([true, false, false]) ;
        t.expect5(namedNames).is(["my-name"]) ;
    }) ;

    if (args.length > 0 && !dumper) {
        group.focused = true ;
        group.silent = true ;
        for (let a of args) {
            group.unary(`Testing ${a} restrictive test parameter`, async (t) => {
                t.expect(tester.containsName(a)).true() ;
            }, {focus:true}) ;    
        }
    }
}, "internals") ;

(async () => {
    const res = await tester.run({
        focusNames:args,
        clearScreen:!dumper,
        listTests:dumper,
        stopItCallback:async (t) => {
            if (!TSTester.globalOptions.silent) { $logterm(`&0&o** ${t.desc} STOPPED **&0`) ; }
        }
    }) ;
    $exit(res.failures > 0 ? 1 : 0) ;
})();

