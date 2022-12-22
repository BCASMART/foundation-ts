import { TSData } from '../src/tsdata';
import { TSDate } from '../src/tsdate';
import { TSInterval } from '../src/tsinterval';
import { TSList } from '../src/tslist';
import { TSEmptyRange, TSRange } from '../src/tsrange';
import { TSRangeSet } from '../src/tsrangeset';
import { TSTester } from '../src/tstester'
import { $inbrowser } from '../src/utils';
import { arrayGroups } from './array.test';
import { commonsGroups } from "./commons.test";
import { compareGroups } from './compare.test';
import { fsGroups } from './fs.test';
import { fusionGroups } from './fusion.test';
import { numberGroups } from './number.test';
import { stringGroups } from './strings.test';
import { colorGroups } from './tscolor.test';
import { countriesGroups } from './tscountry.test';
import { dataGroups } from './tsdata.test';
import { dateGroups } from './tsdate.test';
import { dateCompGroups } from './tsdatecomp.test';
import { defaultsGroups } from './tsdefaults.test';
import { errorsGroups } from './tserror.test';
import { geometryGroups } from './tsgeometry.test';
import { intervalGroups } from './tsinterval.test';
import { qualifierGroups } from './tsqualifier.test';
import { rangeGroups } from './tsrange.test';
import { rangeSetGroups } from './tsrangeset.test';
import { requestGroups } from './tsrequest.test';
import { serverGroups } from './tsserver.test';
import { utilsGroups } from './utils.test';

const tester = new TSTester("Foundation-ts unary tests") ;

tester.addGroups(commonsGroups,     "commons") ;
tester.addGroups(stringGroups,      "strings") ;
tester.addGroups(numberGroups,      "numbers") ;
tester.addGroups(arrayGroups,       "arrays") ;
tester.addGroups(compareGroups,     "compare") ;
tester.addGroups(countriesGroups,   "countries") ;
tester.addGroups(dateGroups,        "dates") ;
tester.addGroups(dateCompGroups,    "dates") ;
tester.addGroups(defaultsGroups,    "defaults") ;
tester.addGroups(intervalGroups,    "intervals") ;
tester.addGroups(rangeGroups,       "ranges") ;
tester.addGroups(rangeSetGroups,    "ranges") ;
tester.addGroups(requestGroups,     "requests") ;
tester.addGroups(serverGroups,      "server") ;
tester.addGroups(utilsGroups,       "utils") ;
tester.addGroups(dataGroups,        "data") ;
tester.addGroups(colorGroups,       "colors") ;
tester.addGroups(geometryGroups,    "geometry") ;
tester.addGroups(qualifierGroups,   "qualifiers") ;
tester.addGroups(errorsGroups,      "errors") ;
tester.addGroups(fsGroups,          "fs") ;
tester.addGroups(fusionGroups,      "fusion") ;

let args = process.argv.slice(2);
const dumper = args.length === 1 && args.first() === '-list' ;


tester.addGroup("Testing tester system itself", async (group) => {
    const setA = new Set(tester.names) ;
    const setB = new Set([
        "commons", "strings", "numbers", "arrays", 
        "compare", "countries", "dates", "dates", 
        "defaults", "intervals", "ranges", "ranges", 
        "requests", "server", "utils", "data", 
        "colors", "geometry", "qualifiers", "errors", 
        "fs", "fusion"]) ;
    const date = new TSDate() ;
    
    group.unary("Testing tests list", async (t) => {
        t.expect0(tester.names.length).toBe(20) ;
        t.expect1(setA).toBe(setB) ;
    }) ;
    
    group.unary("Testing toBeEmpty()", async (t) => {
        t.expect0([]).toBeEmpty() ;
        t.expect1(new Set()).toBeEmpty() ;
        t.expect2(new Map()).toBeEmpty() ;
        t.expect3(Buffer.from('')).toBeEmpty() ;
        t.expect4('').toBeEmpty() ;
        t.expect5(new TSData()).toBeEmpty() ;
        t.expect6(new TSList()).toBeEmpty() ;
        t.expect7(TSEmptyRange()).toBeEmpty() ;
        t.expect8(new TSRangeSet()).toBeEmpty() ;
        t.expect9(new TSInterval(date, date)).toBeEmpty() ;
    }) ;

    group.unary("Testing toBeNotEmpty()", async (t) => {
        t.expect0(["eee"]).toBeNotEmpty() ;
        t.expect1(new Set([1])).toBeNotEmpty() ;
        t.expect2(new Map([['key', 1]])).toBeNotEmpty() ;
        t.expect3(Buffer.from('$$$')).toBeNotEmpty() ;
        t.expect5(TSData.fromString('$$')).toBeNotEmpty() ;
        t.expect6(new TSList([1, 2])).toBeNotEmpty() ;
        t.expect7(new TSRange([1,1])).toBeNotEmpty() ;
        t.expect8(new TSRangeSet(1)).toBeNotEmpty() ;
        t.expect9(new TSInterval(date, date.dateByAddingHours(1))).toBeNotEmpty() ;
        t.expectA(new TSInterval(date, null)).toBeNotEmpty() ;
        t.expectB(new TSInterval(null, date)).toBeNotEmpty() ;
    }) ;


    if (args.length > 0 && !dumper) {
        group.focused = true ;
        group.silent = true ;
        for (let a of args) {
            group.unary(`Testing ${a} restrictive test parameter`, async (t) => {
                t.expect(tester.containsName(a)).toBeTruthy() ;
            }, {focus:true}) ;    
        }
    }
}) ;

(async () => {
    const process = $inbrowser() ? undefined : require('process') ;
    await tester.run({focusNames:args, clearScreen:!dumper, listTests:dumper}) ;
    process?.exit() ;
})();

