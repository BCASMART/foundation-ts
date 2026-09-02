// @ts-nocheck
/* eslint-disable */
// =============================================================================
// Node preload for `npm run test:jsdom`.
//
//   node -r ./test/jsdom-register.cjs ... tdist/test/jsdom.test.js
//
// It installs a jsdom `window` / `document` / `navigator` / `location` as Node
// globals so `$inbrowser()` flips to true and the library runs its browser
// branches -- WITHOUT clobbering the Node built-ins the code legitimately uses
// (Buffer, atob/btoa, Text{En,De}coder, crypto, performance, timers, ...).
//
// We do NOT use `jsdom-global/register` directly because it overwrites the
// global `atob`, and transliteration.ts decodes its tables with `atob()` at
// module load time -- jsdom's stricter `atob` throws on those payloads.
//
// No `#ftsconsole` element is provided on purpose: the tester then falls back to
// console.log, which is what we want on a terminal / CI.
// =============================================================================
const { JSDOM } = require('jsdom');

const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', {
    url: 'https://localhost/',
    pretendToBeVisual: true,
});

const { window } = dom;

// the handful of references the library reaches for by bare name
global.window = window;
global.document = window.document;
global.navigator = window.navigator;
global.location = window.location;
global.history = window.history;
global.self = window;

// copy the rest of the DOM surface (HTMLElement, Event, Node, getComputedStyle,
// MutationObserver, ...) but never shadow an existing Node global.
for (const key of Object.getOwnPropertyNames(window)) {
    if (key in global) { continue; }
    const desc = Object.getOwnPropertyDescriptor(window, key);
    if (!desc) { continue; }
    try { Object.defineProperty(global, key, desc); }
    catch { /* non-configurable / read-only: ignore */ }
}
