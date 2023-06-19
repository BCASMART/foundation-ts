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
import { $inbrowser, $logterm } from '../src/utils';
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
import { structureGroups } from './tsstructure.test';

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
tester.addGroups(intervalGroups,    "intervals") ;
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
tester.addGroups(structureGroups,   "struct") ;
tester.addGroups(decoratorGroups,   "decorators") ;

tester.addGroup("Testing tester system itself", async (group) => {
    const setA = new Set(tester.names) ;
    const setB = new Set([
        "commons", "strings", "numbers", "arrays", 
        "compare", "countries", "crypto", "dates", "decorators",
        "defaults", "intervals", "ranges", "ranges", 
        "requests", "server", "utils", "data", 
        "colors", "geometry", "qualifiers", "errors", 
        "fs", "fusion", "phones", "struct", "internals"]) ;
    const date = new TSDate() ;
    
    group.unary("tests list", async (t) => {
        t.expect0(tester.names.length).is(25) ;
        t.expect1(setA).is(setB) ;
    }) ;
    
    group.unary("t.expect(...).toBeEmpty()", async (t) => {
        t.expect0([]).empty() ;
        t.expect1(new Set()).empty() ;
        t.expect2(new Map()).empty() ;
        t.expect3(Buffer.from('')).empty() ;
        t.expect4('').toBeEmpty() ;
        t.expect5(new TSData()).empty() ;
        t.expect6(new TSList()).empty() ;
        t.expect7(TSEmptyRange()).empty() ;
        t.expect8(new TSRangeSet()).empty() ;
        t.expect9(new TSInterval(date, date)).empty() ;
        t.expectA([]).toBeEmpty() ;
    }) ;

    group.unary("t.expect(...).toBeNotEmpty()", async (t) => {
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
        t.expectC(["eee"]).toBeNotEmpty() ;
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
    const process = $inbrowser() ? undefined : require('process') ;
    await tester.run({
        focusNames:args, 
        clearScreen:!dumper, 
        listTests:dumper, 
        stopItCallback:async (t) => { 
            if (!TSTester.globalOptions.silent) { $logterm(`&0&o** ${t.desc} STOPPED **&0`) ; } 
        }
    }) ;
    process?.exit() ;
})();

