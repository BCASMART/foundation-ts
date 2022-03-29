import { TSDate } from "./tsdate";
import { Comparison } from "./types";
import { Class, TSObject } from "./tsobject";
export interface Interval {
    range: TSRange;
    hasSignificantRange: boolean;
}
export declare class TSRange implements TSObject<TSRange>, Interval {
    private _location;
    private _length;
    constructor(range: TSRange);
    constructor(array: number[]);
    constructor(interval: Interval);
    constructor(loc: number, len: number);
    constructor(startingDate: TSDate, endingDate: TSDate);
    static make(loc: number, len: number): TSRange;
    static fromArray(a: number[] | null | undefined): TSRange | null;
    clone(): TSRange;
    get location(): number;
    set location(loc: number);
    get length(): number;
    set length(len: number);
    get isValid(): boolean;
    get isEmpty(): boolean;
    get maxRange(): number;
    get range(): TSRange;
    get hasSignificantRange(): boolean;
    contains(other: TSRange | number): boolean;
    intersects(other: TSRange): boolean;
    containedIn(other: TSRange): boolean;
    unionRange(other: TSRange): TSRange;
    intersectionRange(other: TSRange): TSRange;
    containsLocation(loc: number): boolean;
    continuousWith(other: TSRange): boolean;
    get isa(): Class<TSRange>;
    get className(): string;
    isEqual(other: any): boolean;
    compare(other: any): Comparison;
    toJSON(): {
        location: number;
        length: number;
    };
    toString(): string;
    toArray(): any[];
}
export declare function $israngeparams(loc: number, len: number): boolean;
export declare function $israngearray(v: number[] | null | undefined): boolean;
export declare function $comformsToInterval(v: any): boolean;
export declare function TSBadRange(): TSRange;
export declare function TSEmptyRange(): TSRange;
export declare function TSWidestRange(): TSRange;
