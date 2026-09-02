// =============================================================================
// Real headless-browser test entry point (Chromium / Firefox / WebKit).
//
// Built by `test/browser-build.mjs` (esbuild) into tdist/test/browser.test.js
// and loaded by `test/index.test.html`. Driven by `test/browser-driver.mjs`
// which launches the engine, waits for `window.__ftsResult` and turns it into a
// process exit code -- see `npm run test:chrome` / `test:firefox` / `test:webkit`.
//
// Group selection is kept identical to `test/jsdom.test.ts`. Everything that
// reaches the real filesystem / a live socket / process.argv is skipped: the fs
// backend groups and the live-TSServer group self-skip on $inbrowser(), and the
// disk-fixture unaries of `phones` / `parser` are guarded the same way in their
// own files. Unlike the jsdom simulation this runs on the engine's own V8/JSC/
// SpiderMonkey, ICU/Intl, Web Crypto and TextEncoder, so it catches real
// cross-engine assumptions the Node-based runs cannot.
// =============================================================================

import { TSTester } from '../src/tstester' ;
import { $inbrowser } from '../src/utils' ;

// --- browser-safe groups (kept in sync with jsdom.test.ts) ------------------
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
import { charsetGroups } from './tscharset.test' ;
import { contractGroups } from './contract.test' ;
import { requestGroups } from './tsrequest.test' ;
import { envGroups } from './env.test' ;
import { serverGroups } from './tsserver.test' ;
import { phoneGroups } from './tsphonenumber.test' ;
import { structureGroups } from './tsparser.test' ;
import { fsGroups } from './fs.test' ;

const tester = new TSTester("Foundation-ts unary tests (headless browser)") ;

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
tester.addGroups(charsetGroups,     "charsets") ;
tester.addGroups(contractGroups,    "contract") ;
tester.addGroups(requestGroups,     "requests") ;
tester.addGroups(envGroups,         "env") ;
tester.addGroups(serverGroups,      "server") ;
tester.addGroups(phoneGroups,       "phones") ;
tester.addGroups(structureGroups,   "parser") ;
tester.addGroups(fsGroups,          "fs") ;

tester.addGroup("headless browser environment sanity", async (group) => {
    group.unary("we are running in a real browser", async (t) => {
        t.expect0($inbrowser()).true() ;
        t.expect1(typeof window).is("object") ;
        t.expect2(typeof document).is("object") ;
        t.expect3(typeof navigator).is("object") ;
        t.expect4(typeof (globalThis as any).crypto?.subtle).is("object") ;
    }) ;
}, "browser") ;

declare global {
    interface Window {
        __ftsResult?: { ok:boolean, failures:number, expectations:number, groups:number, failed:number } ;
        __ftsError?: string ;
    }
}

(async () => {
    try {
        const res = await tester.run({ clearScreen:false }) ;
        window.__ftsResult = {
            ok:           res.failures === 0,
            failures:     res.failures,
            expectations: res.expectations,
            groups:       res.groups,
            failed:       res.failed,
        } ;
    }
    catch (e) {
        window.__ftsError = (e as any)?.stack ?? String(e) ;
        window.__ftsResult = { ok:false, failures:-1, expectations:0, groups:0, failed:-1 } ;
    }
})() ;
