// @ts-nocheck
// =============================================================================
// Browser shim for Node's `buffer`, used by the `npm run test:chrome` bundle.
//
// The feross `buffer` package, exactly as the users of the library get it in their
// browser bundles (webpack, vite...): it is not patched, so that the tests see its
// differences with Node (eg. copy() and indexOf() refuse an Uint8Array which is not
// a Buffer, toString() does not know base64url) and the library must manage them.
// =============================================================================
import * as feross from '../../node_modules/buffer/index.js' ;

const { Buffer } = feross ;

export * from '../../node_modules/buffer/index.js' ;
export { Buffer } ;
