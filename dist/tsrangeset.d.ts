import { TSList } from "./tslist";
import { Interval, TSRange } from "./tsrange";
import { Comparison } from "./types";
declare type trrs = TSRange | number | Interval | Array<number>;
declare type trrsa = Array<trrs>;
export declare class TSRangeSet extends TSList<TSRange> implements Interval {
    constructor(v?: TSRangeSet | trrs | trrsa | null | undefined);
    get length(): number;
    get hasSignificantRange(): boolean;
    get range(): TSRange;
    get location(): number;
    get maxRange(): number;
    clone(): TSRangeSet;
    private _addRange;
    private _removeRange;
    private _intersectRange;
    contains(v: Number | TSRange | Interval | TSRangeSet | number[]): boolean;
    intersects(v: Number | TSRange | Interval | TSRangeSet | number[]): boolean;
    unionWidth(v: number | TSRange | TSRangeSet | Interval | number[]): void;
    substractFrom(v: number | TSRange | TSRangeSet | Interval | number[]): void;
    intersectWidth(v: number | TSRange | TSRangeSet | Interval | number[]): void;
    union(v: number | TSRange | Interval | TSRangeSet | number[]): TSRangeSet;
    intersection(v: number | TSRange | Interval | TSRangeSet | number[]): TSRangeSet;
    substraction(v: number | TSRange | Interval | TSRangeSet | number[]): TSRangeSet;
    complement(v?: TSRange | Interval | number[]): TSRangeSet;
    isEqual(other: any): boolean;
    compare(other: any): Comparison;
}
export {};
