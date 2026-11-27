// @ts-nocheck
// =============================================================================
// Headless-browser driver for `npm run test:chrome` / `test:firefox` / `test:webkit`.
//
//   node test/browser-driver.mjs <chromium|firefox|webkit>
//
// Opens `test/index.test.html` (which runs the esbuild bundle from
// `test/browser-build.mjs`) in the given engine through playwright-core, waits
// for `window.__ftsResult` and exits 0 / 1 accordingly. The bundle is engine
// agnostic -- only the launcher changes.
//
// - chromium : uses the *system* Google Chrome by default (channel "chrome"),
//              so no Chromium download is needed. Override with FTS_BROWSER_CHANNEL,
//              set it to "" to use Playwright's bundled Chromium instead.
// - firefox / webkit : use Playwright's bundled builds. Install them once with
//              `npx playwright-core install firefox webkit`.
//
// Env:
//   FTS_BROWSER_CHANNEL   chromium channel        (default: "chrome")
//   FTS_BROWSER_HEADED    "1" to show the window  (default: headless)
//   FTS_BROWSER_TIMEOUT   run timeout in ms       (default: 120000)
//   FTS_BROWSER_LAUNCH_TIMEOUT  browser launch timeout in ms (default: 30000)
//
// The tests output is printed while they run (every second), so the last lines
// show where a stuck run stopped. After the run timeout, the page may still be
// busy (eg. an endless loop): the calls to the page are given a short timeout,
// so that the driver always ends.
// =============================================================================
import * as playwright from 'playwright-core' ;
import { dirname, resolve } from 'node:path' ;
import { fileURLToPath, pathToFileURL } from 'node:url' ;
import { existsSync } from 'node:fs' ;

const here = dirname(fileURLToPath(import.meta.url)) ;
const root = resolve(here, '..') ;

const engineName = (process.argv[2] || process.env.FTS_BROWSER || 'chromium').toLowerCase() ;
const engine     = playwright[engineName] ;
if (!engine || !['chromium', 'firefox', 'webkit'].includes(engineName)) {
    console.error(`\x1b[31munknown engine "${engineName}" -- use chromium | firefox | webkit\x1b[0m`) ;
    process.exit(2) ;
}

const LABEL = { chromium:'Chromium/Chrome', firefox:'Firefox', webkit:'WebKit' }[engineName] ;

const htmlPath   = resolve(here, 'index.test.html') ;
const bundlePath = resolve(root, 'tdist/test/browser.test.js') ;
const headed     = process.env.FTS_BROWSER_HEADED === '1' ;
const timeout    = Number.parseInt(process.env.FTS_BROWSER_TIMEOUT || '120000', 10) ;
const launchTimeout = Number.parseInt(process.env.FTS_BROWSER_LAUNCH_TIMEOUT || '30000', 10) ;

// only chromium honours a channel; "" (explicitly set) means bundled Chromium
const channel = engineName === 'chromium'
    ? (process.env.FTS_BROWSER_CHANNEL ?? 'chrome') || undefined
    : undefined ;

if (!existsSync(bundlePath)) {
    console.error(`\x1b[31mmissing bundle ${bundlePath} -- run \`node test/browser-build.mjs\` first\x1b[0m`) ;
    process.exit(2) ;
}

const step = (s) => { console.error(`\x1b[90m[driver] ${s}\x1b[0m`) ; } ;

let browser ;
step(`launching ${LABEL} (timeout ${launchTimeout}ms)...`) ;
try {
    // on timeout, Playwright kills the browser process it did start
    browser = await engine.launch({ channel, headless:!headed, timeout:launchTimeout }) ;
}
catch (e) {
    const launchTimedOut = /Timeout/i.test(String(e?.message)) ;
    if (launchTimedOut) { console.error(`\x1b[31m${LABEL} was not launched within ${launchTimeout}ms\x1b[0m`) ; }
    console.error(`\x1b[31mcannot launch ${LABEL}: ${e?.message ?? e}\x1b[0m`) ;
    if (engineName === 'chromium') {
        console.error(`install Google Chrome, or set FTS_BROWSER_CHANNEL="" and run \`npx playwright-core install chromium\`.`) ;
    }
    else if (launchTimedOut) {
        // the browser process did start but never answered Playwright (it's not a missing install)
        console.error(`${LABEL} was started but did not answer: kill the remaining ${LABEL} processes of previous runs, then reinstall it with \`npx playwright-core install --force ${engineName}\`.`) ;
        if (process.platform === 'darwin') { 
            console.error(`On macOS, also remove the quarantine attribute: \`xattr -dr com.apple.quarantine ~/Library/Caches/ms-playwright\`.`) ; 
        }
    }
    else {
        console.error(`run \`npx playwright-core install ${engineName}\` first.`) ;
    }
    process.exit(2) ;
}

step(`opening a page...`) ;
const page = await browser.newPage() ;
const pageErrors = [] ;

page.on('pageerror', err => { pageErrors.push(err.stack ?? String(err)) ; }) ;
page.on('console',   msg => { if (msg.type() === 'error') { pageErrors.push(`console.error: ${msg.text()}`) ; } }) ;

// a page call which gives up after ms milliseconds (the page may be stuck)
const withTimeout = (promise, ms, fallback) => Promise.race([
    promise.catch(() => fallback),
    new Promise(res => setTimeout(() => res(fallback), ms).unref()),
]) ;

// prints the new part of the tests console. Returns false if the page did not answer.
let printed = 0 ;
let answered = true ;
const printConsole = async (ms) => {
    const text = await withTimeout(page.evaluate(() => {
        const c = document.getElementById('ftsconsole') ;
        return c ? c.innerText : '' ;
    }), ms, null) ;
    if (text === null) { return false ; }
    if (text.length > printed) { process.stdout.write(text.slice(printed)) ; printed = text.length ; }
    return true ;
} ;

let result ;
let streaming = true ;
let lastAnswer = Date.now() ;
let lastWarning = 0 ;
const streamer = (async () => {
    while (streaming) {
        await new Promise(res => setTimeout(res, 1000)) ;
        if (!streaming) { break ; }
        if (await printConsole(1000)) { lastAnswer = Date.now() ; continue ; }
        const silence = Math.round((Date.now() - lastAnswer) / 1000) ;
        if (silence >= 5 && silence - lastWarning >= 10) {
            lastWarning = silence ;
            step(`the page does not answer since ${silence}s (busy or stuck)`) ;
        }
    }
})() ;

try {
    step(`loading the test page...`) ;
    await page.goto(pathToFileURL(htmlPath).href, { timeout:60000 }) ;
    step(`running the tests (timeout ${timeout}ms)...`) ;
    result = await page.waitForFunction(() => window.__ftsResult, null, { timeout, polling:250 })
                       .then(h => h.jsonValue()) ;
}
catch (e) {
    console.error(`\x1b[31mrun did not complete within ${timeout}ms: ${e?.message ?? e}\x1b[0m`) ;
}
streaming = false ;
await streamer ;
answered = await printConsole(10000) ;

const pageError = await withTimeout(page.evaluate(() => window.__ftsError), 5000, undefined) ;

await withTimeout(browser.close(), 10000, undefined) ;

if (!result && !answered) {
    console.error(`\x1b[31mthe ${LABEL} page does not answer: it is probably stuck in an endless loop (see the last lines above)\x1b[0m`) ;
}

if (pageError) { console.error(`\x1b[31mbrowser exception:\x1b[0m\n${pageError}`) ; }
for (const e of pageErrors) { console.error(`\x1b[31m${e}\x1b[0m`) ; }

if (!result) {
    console.error(`\x1b[41m\x1b[37m  NO RESULT FROM ${LABEL.toUpperCase()}  \x1b[0m`) ;
    process.exit(1) ;
}

console.log(
    `\n\x1b[36mheadless ${LABEL}: ${result.expectations} expectations, ` +
    `${result.groups} groups, ${result.failed} failed group(s), ${result.failures} failed expectation(s)\x1b[0m`
) ;

if (result.ok) { console.log(`\x1b[42m\x1b[37m  ALL ${LABEL.toUpperCase()} TESTS PASSED  \x1b[0m`) ; process.exit(0) ; }
console.error(`\x1b[41m\x1b[37m  ${LABEL.toUpperCase()} TESTS FAILED  \x1b[0m`) ;
process.exit(1) ;
