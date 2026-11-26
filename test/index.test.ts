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
import { cacheGroups } from './tscache.test';
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
tester.addGroups(cacheGroups,       "cache") ;
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
        "objects", "couples", "lists", "cache", "charsets", "contract"]) ;
    const date = new TSDate() ;
    
    group.unary("tests list", async (t) => {
        t.expect0(tester.names.length).is(34) ;
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

    group.unary("t.expect(...).toStrictlyBe() / notToStrictlyBe() and their shortcuts", async (t) => {
        const a = { v:1 } ;
        const b = { v:1 } ; // same shape, different object : $equal(a,b) is true, a !== b

        t.expect0(a).strictis(a) ;                 // same reference -> passes
        t.expect1(a).strictnotis(b) ;              // different reference, equal value -> passes
        t.expect2(a).toStrictlyBe(a) ;
        t.expect3(a).notToStrictlyBe(b) ;

        // toBe()/is() only care about value equality, so a and b pass there too :
        // toStrictlyBe() is a strictly narrower check, not a synonym.
        t.expect4(a).is(b) ;
        t.expect5(a).eq(b) ;

        // verify the strict checks actually FAIL when identity doesn't hold (or
        // does, for the "not" variant) — run on a throwaway sub-tester since
        // these are deliberate failures that would otherwise fail this very test.
        const origLog = console.log ;
        const origWrite = process.stdout.write ;
        console.log = (() => {}) as any ;
        (process.stdout as any).write = (() => true) as any ;
        let res:any ;
        try {
            const sub = new TSTester("strict-identity sub-tester") ;
            sub.addGroup("failing group", async (g) => {
                g.unary("failing strict-identity assertions", async (tt) => {
                    tt.expect0(a).strictis(b) ;        // _elogfail
                    tt.expect1(a).strictnotis(a) ;      // _nelogfail
                    tt.expect2(a).toStrictlyBe(b) ;     // _elogfail
                    tt.expect3(a).notToStrictlyBe(a) ;  // _nelogfail
                }) ;
            }, "failing", { silent:false, stopOnFirstFail:false }) ;
            res = await sub.run({ clearScreen:false }) ;
        }
        finally {
            console.log = origLog ;
            (process.stdout as any).write = origWrite ;
        }
        t.expect6(res.failed).is(1) ;
        t.expect7(res.failures).is(4) ;
    }) ;

    group.unary("unary catchFunction / catched / stopped / stop()", async (t) => {
        // stop() interrupts the whole run, so it's exercised on a muted sub-tester
        const origLog = console.log ;
        const origWrite = process.stdout.write ;
        let output = '' ;
        console.log = ((...args:any[]) => { output += args.join(' ') + '\n' ; }) as any ;
        (process.stdout as any).write = ((c:any) => { output += String(c) ; return true ; }) as any ;
        let res:any, failRes:any, defaultRes:any ;
        const checks:any[] = [] ;
        let afterStopRan = false, callbackCalled = false ;
        try {
            const sub = new TSTester("stop sub-tester") ;
            sub.addGroup("stopping group", async (g) => {
                g.unary("catch then stop", async (tt) => {
                    tt.catchFunction = async (ut, e) => {
                        checks.push(ut.catched, (e as Error).message, ut.stopped) ;
                        ut.stop("done exercising catch path") ;
                        checks.push(ut.stopped, ut.stopReason) ;
                        ut.expect0(1).is(1) ;   // expectations after stop() are still evaluated
                    } ;
                    throw new Error("intentional unary failure") ;
                }) ;
                g.unary("after stop in the same group", async () => { afterStopRan = true ; }) ;
            }) ;
            sub.addGroup("group after stop", async (g) => { g.unary("never run", async () => { afterStopRan = true ; }) ; }) ;
            res = await sub.run({ stopItCallback:async () => { callbackCalled = true ; } }) ;

            // stopOnFirstFail failures are now counted in the result
            const sub2 = new TSTester("stopOnFirstFail sub-tester") ;
            sub2.addGroup("failing group", async (g) => {
                g.unary("fails", async (tt) => { tt.expect0(1).is(2) ; }) ;
                g.unary("never run", async () => { afterStopRan = true ; }) ;
            }, null, { stopOnFirstFail:true }) ;
            failRes = await sub2.run() ;

            const sub3 = new TSTester("default reason sub-tester") ;
            sub3.addGroup("plain stop", async (g) => { g.unary("stop", async (tt) => { tt.stop() ; }) ; }) ;
            defaultRes = await sub3.run() ;
        }
        finally {
            console.log = origLog ;
            (process.stdout as any).write = origWrite ;
        }
        output = output.replace(/\x1b\[[0-9;]*m/g, '') ; // NOSONAR: removing terminal codes
        t.expect0(checks).is([true, "intentional unary failure", false, true, "done exercising catch path"]) ;
        t.expect1(afterStopRan).false() ;
        t.expect2(callbackCalled).true() ;
        t.expect3(res.stopped).true() ;
        t.expect4(res.stopReason).is("done exercising catch path") ;
        t.expect5(res.expectations).is(1) ;
        t.expect6(res.groups).is(1) ;
        t.expect7(output.includes("TESTS DID STOP: done exercising catch path")).true() ;
        t.expect8(failRes.stopped).true() ;
        t.expect9(failRes.stopReason).undef() ;
        t.expectA(failRes.failures).is(1) ;
        t.expectB(failRes.failed).is(1) ;
        t.expectC(output.includes("TESTS DID STOP ON FIRST TEST FAILED")).true() ;
        t.expectD(defaultRes.stopReason).is("By user command.") ;
    }) ;

    group.unary("unexpected exceptions are failures and the run goes on", async (t) => {
        const origLog = console.log ;
        const origWrite = process.stdout.write ;
        let output = '' ;
        console.log = ((...args:any[]) => { output += args.join(' ') + '\n' ; }) as any ;
        (process.stdout as any).write = ((c:any) => { output += String(c) ; return true ; }) as any ;
        let res:any, stopRes:any ;
        const ran:string[] = [] ;
        try {
            const sub = new TSTester("exceptions sub-tester") ;
            sub.addGroup("throwing unaries", async (g) => {
                g.unary("throws", async (tt) => { tt.expect0(1).is(1) ; throw new TypeError("unexpected one") ; }) ;
                g.unary("throws a string", async () => { throw "a thrown string" ; }) ; // NOSONAR: a non Error value is tested
                g.unary("catchFunction throws", async (tt) => {
                    tt.catchFunction = async () => { throw new Error("from the catch function") ; } ;
                    throw new Error("first") ;
                }) ;
                g.unary("catchFunction manages", async (tt) => {
                    tt.catchFunction = async (ut) => { ut.expect0(ut.catched).true() ; } ;
                    throw new Error("managed") ;
                }) ;
                g.unary("runs after", async (tt) => { ran.push('after') ; tt.expect0(2).is(2) ; }) ;
            }) ;
            sub.addGroup("throwing group", async (g) => {
                g.unary("declared before", async (tt) => { ran.push('before') ; tt.expect0(3).is(3) ; }) ;
                throw new Error("group function failure") ;
            }) ;
            sub.addGroup("next group", async (g) => { g.unary("runs", async (tt) => { ran.push('next') ; tt.expect0(4).is(4) ; }) ; }) ;
            res = await sub.run() ;

            const sub2 = new TSTester("stopOnFirstFail exceptions sub-tester") ;
            sub2.addGroup("stopping group", async (g) => {
                g.unary("throws", async () => { throw new Error("stop here") ; }) ;
                g.unary("never run", async () => { ran.push('never') ; }) ;
            }, null, { stopOnFirstFail:true }) ;
            stopRes = await sub2.run() ;
        }
        finally {
            console.log = origLog ;
            (process.stdout as any).write = origWrite ;
        }
        output = output.replace(/\x1b\[[0-9;]*m/g, '') ; // NOSONAR: removing terminal codes
        t.expect0(ran).is(['after', 'before', 'next']) ;
        // throws (1 failure), string (1), catchFunction throwing (1), group function (1)
        t.expect1(res.failures).is(4) ;
        t.expect2(res.failed).is(2) ;
        t.expect3(res.passed).is(1) ;
        t.expect4(res.stopped).false() ;
        t.expect5(output.includes('TypeError: unexpected one')).true() ;
        t.expect6(output.includes("'a thrown string'")).true() ;
        t.expect7(output.includes('Error: from the catch function')).true() ;
        t.expect8(output.includes('Error: group function failure')).true() ;
        t.expect9(output.includes('Error: managed')).false() ;
        t.expectA(stopRes.stopped).true() ;
        t.expectB(stopRes.failures).is(1) ;
        t.expectC(ran.includes('never')).false() ;
    }) ;

    group.unary("TSTester failure messages and logAllTests", async (t) => {
        // the sub-run output is captured (and stripped of its terminal codes) instead of being printed
        const origLog = console.log ;
        const origWrite = process.stdout.write ;
        let output = '' ;
        console.log = ((...args:any[]) => { output += args.join(' ') + '\n' ; }) as any ;
        (process.stdout as any).write = ((c:any) => { output += String(c) ; return true ; }) as any ;
        let res:any ;
        try {
            const sub = new TSTester("messages") ;
            sub.addGroup("messages group", async (g) => {
                g.unary("failing type assertions", async (tt) => {
                    tt.expect0('x').isipv4() ;
                    tt.expect1('x').isipv6() ;
                    tt.expect2('x').isip() ;
                    tt.expect3('x').isnumber() ;
                }) ;
                g.unary("toBeUnordered() with logAllTests", async (tt) => {
                    tt.logAllTests = true ;
                    tt.expect(new Set([1, 2]), 'unord').toBeUnordered([2, 1]) ;
                }) ;
            }) ;
            res = await sub.run() ;
        }
        finally {
            console.log = origLog ;
            (process.stdout as any).write = origWrite ;
        }
        // eslint-disable-next-line no-control-regex
        output = output.replace(/\x1b\[[0-9;]*m/g, '') ;
        t.expect0(res.failures).is(4) ;
        t.expect1(res.expectations).is(5) ;
        // the IP addresses checks used to expect "a folder", and all these messages ended with '>>'
        t.expect2(output.includes("'<an IPv4 address>'")).true() ;
        t.expect3(output.includes("'<an IPv6 address>'")).true() ;
        t.expect4(output.includes("'<an IP address>'")).true() ;
        t.expect5(output.includes("'<a valid number>'")).true() ;
        t.expect6(output.includes("folder") || output.includes(">>")).false() ;
        // toBeUnordered() used to bypass the logAllTests logging
        t.expect7(/unord\S* did PASS/.test(output)).true() ;
    }) ;

    // every assertion must fail when it is false: each failing case below must count for exactly one failure
    group.unary("TSExpectAgent assertions fail when they are false", async (t) => {
        const origLog = console.log ;
        const origWrite = process.stdout.write ;
        let output = '' ;
        console.log = ((...args:any[]) => { output += args.join(' ') + '\n' ; }) as any ;
        (process.stdout as any).write = ((c:any) => { output += String(c) ; return true ; }) as any ;
        const failing:((tt:any) => any)[] = [
            tt => tt.expect(0).true(),            tt => tt.expect(1).false(),
            tt => tt.expect(1).undef(),           tt => tt.expect(undefined).def(),
            tt => tt.expect(1).null(),            tt => tt.expect(null).notnull(),
            tt => tt.expect(null).OK(),           tt => tt.expect(1).KO(),
            tt => tt.expect(3).toBeNaN(),         tt => tt.expect('x').isnumber(),
            tt => tt.expect(1.5).isint(),         tt => tt.expect(-1).isuint(),
            tt => tt.expect(1).isstring(),        tt => tt.expect(1).isbool(),
            tt => tt.expect('x').isemail(),       tt => tt.expect('x').isurl(),
            tt => tt.expect('x').isuuid(),        tt => tt.expect(1).isobject(),
            tt => tt.expect(1).isarray(),         tt => tt.expect('x').isdate(),
            tt => tt.expect(1).isiterable(),      tt => tt.expect(1).isfunction(),
            tt => tt.expect('/nonexistent/file').isfile(), tt => tt.expect('/nonexistent/dir').isdir(),
            tt => tt.expect('x').isphone(),       tt => tt.expect(1).isdata(),
            tt => tt.expect([1]).empty(),         tt => tt.expect(5).empty(),          // not a container
            tt => tt.expect([]).filled(),         tt => tt.expect(5).filled(),         tt => tt.expect(null).filled(),
            tt => tt.expect([1, 2]).toBeUnordered([1, 3]), tt => tt.expect(null).toBeUnordered([1]),
            tt => tt.expect(1).toThrow(),         tt => tt.expect(() => 1).toThrow(),  // not a function / does not throw
            tt => tt.expect(() => { throw new Error('a') ; }).toThrow(/b/),           // does not match
            tt => tt.expect(() => { throw 42 ; }).toThrow('43'),                       // a thrown non-error value
            tt => tt.expect(1).notToThrow(),      tt => tt.expect(() => { throw new Error('a') ; }).notToThrow(),
            tt => tt.expect(Promise.resolve(1)).toReject(),                            // async ones
            tt => tt.expect(() => Promise.reject(new Error('a'))).toReject(/b/),
            tt => tt.expect(1).gt(2),             tt => tt.expect(1).gte(2),
            tt => tt.expect(2).lt(1),             tt => tt.expect(2).lte(1),
            tt => tt.expect(1).is(2),             tt => tt.expect(1).isnot(1),
            tt => tt.expect('a').gt(1),                                                 // not comparable
        ] ;
        const passing:((tt:any) => any)[] = [
            tt => tt.expect(null).empty(),        tt => tt.expect(2).gt(1),
            tt => tt.expect(2).gte(2),            tt => tt.expect(1).lt(2),
            tt => tt.expect(1).lte(1),            tt => tt.expect(() => { throw 42 ; }).toThrow('42'),
            tt => tt.expect(() => { throw { message:'custom' } ; }).toThrow(/custom/),
            tt => tt.expect(() => Promise.reject(new Error('a'))).toReject(/a/),
            tt => tt.expect(new Set()).empty(),   tt => tt.expect(new TSList()).empty(),
            tt => tt.expect(TSEmptyRange()).empty(),
        ] ;
        let res:any, silentRes:any, throwingRes:any, rethrown:any = undefined ;
        try {
            const sub = new TSTester("failing assertions") ;
            sub.addGroup("all assertions", async (g) => {
                g.unary("failing ones", async (tt) => { for (const f of failing) { await f(tt) ; } }) ;
                g.unary("passing ones", async (tt) => { for (const f of passing) { await f(tt) ; } }) ;
            }) ;
            res = await sub.run() ;
            // a failing unary of a silent group still logs that it did fail
            const silentSub = new TSTester("silent") ;
            silentSub.addGroup("silent group", async (g) => { g.unary("silent failure", async (tt) => { tt.expect0(1).is(2) ; }) ; }, null, { silent:true }) ;
            silentRes = await silentSub.run() ;
            // an exception without catch function is a failure, it is no longer thrown back by run()
            const throwing = new TSTester("throwing") ;
            throwing.addGroup("throwing group", async (g) => { g.unary("throws", async () => { throw new Error('boom') ; }) ; }) ;
            try { throwingRes = await throwing.run() ; } catch (e) { rethrown = e ; }
        }
        finally {
            console.log = origLog ;
            (process.stdout as any).write = origWrite ;
        }
        // eslint-disable-next-line no-control-regex
        output = output.replace(/\x1b\[[0-9;]*m/g, '') ;
        t.expect0(res.expectations).is(failing.length + passing.length) ;
        t.expect1(res.failures).is(failing.length) ;          // each failing case failed exactly once
        t.expect2(res.failed).is(1) ;
        t.expect3(silentRes.failures).is(1) ;
        t.expect4(output.includes('did execute test  silent failure ')).true() ;
        t.expect5([rethrown, throwingRes?.failures]).is([undefined, 1]) ;
        t.expect6(output.includes('to be > to value')).true() ;
        t.expect7(output.includes("'<not a container>'")).true() ;
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

