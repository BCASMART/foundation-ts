// @ts-nocheck
/* eslint-disable */
// =============================================================================
// esbuild bundle for `npm run test:chrome`.
//
// Bundles `test/browser.test.ts` (the browser-safe subset of the suite, same
// groups as `test/jsdom.test.ts`) into a single classic script that a real
// headless Chrome can load through `test/index.test.html`.
//
// Node built-ins the library imports (`path`, `os`, `crypto`, `stream`, `util`,
// ...) are replaced by browser polyfills; the ones that only matter server-side
// (`fs`, `http`, `https`, `net`, `tls`, `zlib`) are stubbed empty -- the groups
// that would call them self-skip on $inbrowser(), but the modules still need to
// *load*. `Buffer` / `process` / `global` are injected as globals.
// =============================================================================
import { build } from 'esbuild' ;
import { nodeModulesPolyfillPlugin } from 'esbuild-plugins-node-modules-polyfill' ;
import { dirname, resolve } from 'node:path' ;
import { fileURLToPath } from 'node:url' ;

const here = dirname(fileURLToPath(import.meta.url)) ;
const root = resolve(here, '..') ;

// Redirect `buffer` to the feross `buffer` package: its Buffer#copy accepts a
// plain Uint8Array target, unlike the jspm polyfill which the library relies on.
// (`crypto` needs no such shim any more -- src/crypto.ts only statically imports
// createCipheriv/createDecipheriv/createHash/randomBytes, all provided by the
// jspm polyfill; getRandomValues/randomUUID now go through globalThis.crypto.)
const nodeBuiltinShims = {
    name: 'fts-node-builtin-shims',
    setup(build) {
        const bufferShim = resolve(here, 'shims/node-buffer.mjs') ;
        build.onResolve({ filter: /^(node:)?buffer$/ }, () => ({ path: bufferShim })) ;
    },
} ;

await build({
    entryPoints: [resolve(here, 'browser.test.ts')],
    outfile:     resolve(root, 'tdist/test/browser.test.js'),
    bundle:      true,
    format:      'iife',
    platform:    'browser',
    target:      'es2022',
    keepNames:   true,   // the @TSTrace decorator asserts on runtime class / function .name
    sourcemap:   true,
    logLevel:    'info',
    tsconfig:    resolve(root, 'tsconfig.test.json'),
    define:      { 'global': 'globalThis' },
    plugins: [
        nodeBuiltinShims,
        nodeModulesPolyfillPlugin({
            globals: { Buffer: true, process: true },
            modules: {
                fs:      'empty',
                http:    'empty',
                https:   'empty',
                net:     'empty',
                tls:     'empty',
                zlib:    'empty',
                crypto:  true,
                process: true,
                stream:  true,
                path:    true,
                os:      true,
                util:    true,
                assert:  true,
                events:  true,
            },
        }),
    ],
}) ;
