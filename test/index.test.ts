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
tester.addGroups(fsGroups) ;  // directly named 'fs' in definition
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
    group.unary("Testing tests list", async (t) => {
        t.expect0(tester.names.length).toBe(20) ;
        t.expect1(setA).toBe(setB) ;
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

