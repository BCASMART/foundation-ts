// @ts-nocheck
/* eslint-disable */
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
const timeout    = parseInt(process.env.FTS_BROWSER_TIMEOUT || '120000', 10) ;

// only chromium honours a channel; "" (explicitly set) means bundled Chromium
const channel = engineName === 'chromium'
    ? (process.env.FTS_BROWSER_CHANNEL ?? 'chrome') || undefined
    : undefined ;

if (!existsSync(bundlePath)) {
    console.error(`\x1b[31mmissing bundle ${bundlePath} -- run \`node test/browser-build.mjs\` first\x1b[0m`) ;
    process.exit(2) ;
}

let browser ;
try {
    browser = await engine.launch({ channel, headless:!headed }) ;
}
catch (e) {
    console.error(`\x1b[31mcannot launch ${LABEL}: ${e?.message ?? e}\x1b[0m`) ;
    if (engineName === 'chromium') {
        console.error(`install Google Chrome, or set FTS_BROWSER_CHANNEL="" and run \`npx playwright-core install chromium\`.`) ;
    }
    else {
        console.error(`run \`npx playwright-core install ${engineName}\` first.`) ;
    }
    process.exit(2) ;
}

const page = await browser.newPage() ;
const pageErrors = [] ;

page.on('pageerror', err => { pageErrors.push(err.stack ?? String(err)) ; }) ;
page.on('console',   msg => { if (msg.type() === 'error') { pageErrors.push(`console.error: ${msg.text()}`) ; } }) ;

let result ;
try {
    await page.goto(pathToFileURL(htmlPath).href) ;
    result = await page.waitForFunction(() => window.__ftsResult, null, { timeout, polling:250 })
                       .then(h => h.jsonValue()) ;
}
catch (e) {
    console.error(`\x1b[31mrun did not complete within ${timeout}ms: ${e?.message ?? e}\x1b[0m`) ;
}

const consoleText = await page.evaluate(() => {
    const c = document.getElementById('ftsconsole') ;
    return c ? c.innerText : '' ;
}).catch(() => '') ;

const pageError = await page.evaluate(() => window.__ftsError).catch(() => undefined) ;

await browser.close() ;

if (consoleText.trim().length) { console.log(consoleText) ; }
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
