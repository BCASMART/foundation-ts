// =============================================================================
// jsdom test entry point.
//
// Run with:  npm run test:jsdom
// which preloads `jsdom-global/register`, so `window` / `document` / `navigator`
// are real globals *inside Node* by the time this module loads. That flips
// $inbrowser() to true and exercises every browser branch of the library
// (HTML console renderer, $inspect fallback, $term stripping, window.performance
// in $mark, ...) WITHOUT launching a real browser.
//
// This is a SIMULATION: the engine, ICU/Intl, Buffer and Node built-ins are
// still Node's. It catches `window`/`document` assumptions and lets the whole
// pure-logic suite run in browser mode ; it is not a substitute for a real
// headless-Chrome run (`npm run test:chrome`).
//
// Group selection is kept identical to `test/browser.test.ts`. Only the parts
// that reach the real filesystem / a live socket / process.argv are left out:
// the fs backend groups and the live-TSServer group self-skip on $inbrowser(),
// and the disk-fixture unaries of `phones` / `parser` are guarded the same way
// in their own files. What stays Node-only: real file I/O, the HTTP(S) server
// and `$args()` reading process.argv.
// =============================================================================

import { TSTester } from '../src/tstester' ;
import { $browserOS, $inbrowser, TSBrowserOS } from '../src/utils' ;

// --- browser-safe groups -----------------------------------------------------
import { commonsGroups } from './commons.test' ;
import { stringGroups } from './strings.test' ;
import { numberGroups } from './number.test' ;
import { arrayGroups } from './array.test' ;
import { compareGroups } from './compare.test' ;
import { countriesGroups } from './tscountry.test' ;
import { cryptoGroups } from './crypto.test' ;
import { dataGroups } from './data.test' ;
import { mutableDataGroups } from './tsdata.test' ;
import { dateGroups } from './tsdate.test' ;
import { dateCompGroups } from './tsdatecomp.test' ;
import { defaultsGroups } from './tsdefaults.test' ;
import { intervalGroups } from './tsinterval.test' ;
import { rangeGroups } from './tsrange.test' ;
import { rangeSetGroups } from './tsrangeset.test' ;
import { mapsetGroups } from './mapset.test' ;
import { utilsGroups } from './utils.test' ;
import { colorGroups } from './tscolor.test' ;
import { geometryGroups } from './tsgeometry.test' ;
import { qualifierGroups } from './tsqualifier.test' ;
import { errorsGroups } from './tserror.test' ;
import { decoratorGroups } from './decorators.test' ;
import { fusionGroups } from './fusion.test' ;
import { TSURLGroups } from './tsurl.test' ;
import { objectGroups } from './object.test' ;
import { coupleGroups } from './tscouple.test' ;
import { listGroups } from './tslist.test' ;
import { cacheGroups } from './tscache.test' ;
import { charsetGroups } from './tscharset.test' ;
import { contractGroups } from './contract.test' ;
import { requestGroups } from './tsrequest.test' ;
import { envGroups } from './env.test' ;
import { serverGroups } from './tsserver.test' ;
import { phoneGroups } from './tsphonenumber.test' ;
import { structureGroups } from './tsparser.test' ;
import { fsGroups } from './fs.test' ;

const tester = new TSTester("Foundation-ts unary tests (jsdom / browser simulation)") ;

tester.addGroups(commonsGroups,     "commons") ;
tester.addGroups(stringGroups,      "strings") ;
tester.addGroups(numberGroups,      "numbers") ;
tester.addGroups(arrayGroups,       "arrays") ;
tester.addGroups(compareGroups,     "compare") ;
tester.addGroups(countriesGroups,   "countries") ;
tester.addGroups(cryptoGroups,      "crypto") ;
tester.addGroups(dataGroups,        "data") ;
tester.addGroups(mutableDataGroups, "data") ;
tester.addGroups(dateGroups,        "dates") ;
tester.addGroups(dateCompGroups,    "dates") ;
tester.addGroups(defaultsGroups,    "defaults") ;
tester.addGroups(intervalGroups,    "intervals") ;
tester.addGroups(rangeGroups,       "ranges") ;
tester.addGroups(rangeSetGroups,    "ranges") ;
tester.addGroups(mapsetGroups,      "mapset") ;
tester.addGroups(utilsGroups,       "utils") ;
tester.addGroups(colorGroups,       "colors") ;
tester.addGroups(geometryGroups,    "geometry") ;
tester.addGroups(qualifierGroups,   "qualifiers") ;
tester.addGroups(errorsGroups,      "errors") ;
tester.addGroups(decoratorGroups,   "decorators") ;
tester.addGroups(fusionGroups,      "fusion") ;
tester.addGroups(TSURLGroups,       "url") ;
tester.addGroups(objectGroups,      "objects") ;
tester.addGroups(coupleGroups,      "couples") ;
tester.addGroups(listGroups,        "lists") ;
tester.addGroups(cacheGroups,       "cache") ;
tester.addGroups(charsetGroups,     "charsets") ;
tester.addGroups(contractGroups,    "contract") ;
tester.addGroups(requestGroups,     "requests") ;
tester.addGroups(envGroups,         "env") ;
tester.addGroups(serverGroups,      "server") ;
tester.addGroups(phoneGroups,       "phones") ;
tester.addGroups(structureGroups,   "parser") ;
tester.addGroups(fsGroups,          "fs") ;

tester.addGroup("jsdom environment sanity", async (group) => {
    group.unary("we are running in browser-simulation mode", async (t) => {
        t.expect0($inbrowser()).true() ;
        t.expect1(typeof window).is("object") ;
        t.expect2(typeof document).is("object") ;
        t.expect3(typeof navigator).is("object") ;
    }) ;

    group.unary("$browserOS() recognizes the operating system from the user agent", async (t) => {
        const agents:[string, TSBrowserOS][] = [
            ['Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15', TSBrowserOS.macOS],
            ['Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36', TSBrowserOS.windows],
            ['Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148', TSBrowserOS.iOS],
            ['Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36', TSBrowserOS.android],
            ['Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0', TSBrowserOS.linux],
            ['Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36', TSBrowserOS.unknownOS], // was macOS
            ['Mozilla/5.0 (X11; FreeBSD amd64; rv:120.0) Gecko/20100101 Firefox/120.0', TSBrowserOS.unknownOS],                                  // was macOS
        ] ;
        const n:any = window.navigator ;
        try {
            for (const [agent, os] of agents) {
                Object.defineProperty(n, 'userAgent', { value:agent, configurable:true }) ;
                ($browserOS as any).os = undefined ; // $browserOS() keeps its result
                t.expect($browserOS(), agent).is(os) ;
            }
        }
        finally {
            delete n.userAgent ;
            ($browserOS as any).os = undefined ;
        }
        t.expect0($inbrowser()).true() ;
    }) ;
}, "jsdom") ;

(async () => {
    const res = await tester.run({ clearScreen:false }) ;
    // the browser branch of $exit() throws instead of exiting, and jsdom keeps the
    // event loop alive (timers), so a plain `process.exitCode` never fires. Exit
    // explicitly -- the tester writes its report synchronously before we get here.
    process.exit(res.failures > 0 ? 1 : 0) ;
})() ;
