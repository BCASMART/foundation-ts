// Shared boundary / edge-case fixtures for reuse across test files.
// See TestProposals.md P3 #4.

import { INT32_MAX, INT32_MIN, UINT32_MAX } from "../src/types";

// Integer boundaries (as plain numbers) that repeatedly break naive `| 0` / `>>> 0`
// style code. Each is paired with ±1 neighbours.
export const IntegerBoundaries:number[] = [
    0, 1, -1,
    INT32_MAX, INT32_MAX + 1, INT32_MAX - 1,
    INT32_MIN, INT32_MIN - 1, INT32_MIN + 1,
    UINT32_MAX, UINT32_MAX + 1, UINT32_MAX - 1,
    0x1_0000_0000, 0x1_0000_0001,
    Number.MAX_SAFE_INTEGER, -Number.MAX_SAFE_INTEGER,
] ;

// Non-finite / non-integer numeric values.
export const NonFiniteNumbers:number[] = [
    NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, 1.5, -1.5, -0,
] ;

// Values that are "foreign" to almost every foundation-ts class: any TSObject
// asked to compare()/isEqual() against one of these must answer undefined / false,
// never throw.
export const ForeignValues:any[] = [
    null, undefined, 0, 1, NaN, "", "a string", true, false,
    {}, { nope: 1 }, [], [1, 2, 3], () => 0, Symbol("s"), 10n,
] ;

// String edge cases: empty, whitespace-only, lone surrogate, NFC/NFD pair,
// astral code point, control characters.
export const StringEdges = {
    empty: "",
    blank: "   \t \n ",
    loneHighSurrogate: "\uD83D",
    loneLowSurrogate: "\uDE00",
    nfc: "é",              // é  (precomposed)
    nfd: "é",             // é  (decomposed)
    astral: "\u{1F600}",        // 😀
    controls: "ab",
} ;

// Empty / one / two element collections.
export const CollectionShapes = {
    emptyArray: [] as any[],
    oneArray: [1],
    twoArray: [1, 2],
    emptySet: new Set<any>(),
    emptyMap: new Map<any, any>(),
} ;
