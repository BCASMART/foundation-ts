// @ts-nocheck
/* eslint-disable */
// =============================================================================
// Browser shim for Node's `buffer`, used by the `npm run test:chrome` bundle.
//
// Based on the feross `buffer` package, with one Node-compat patch:
// `Buffer#copy` / `Buffer#set`-style calls in foundation-ts pass a plain
// Uint8Array as the target (Node accepts that, feross throws). We wrap such a
// target in a memory-sharing Buffer view so the copy still lands in place.
// =============================================================================
import * as feross from '../../node_modules/buffer/index.js' ;

const { Buffer } = feross ;

const _copy = Buffer.prototype.copy ;
Buffer.prototype.copy = function copy(target, targetStart, start, end) {
    if (target != null && !Buffer.isBuffer(target) && ArrayBuffer.isView(target)) {
        const view = Buffer.from(target.buffer, target.byteOffset, target.byteLength) ;
        return _copy.call(this, view, targetStart, start, end) ;
    }
    return _copy.call(this, target, targetStart, start, end) ;
} ;

export * from '../../node_modules/buffer/index.js' ;
export { Buffer } ;
