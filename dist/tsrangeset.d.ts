import { TSList, TSListNode } from "./tslist";
import { Interval, TSRange } from "./tsrange";
import { Comparison } from "./types";
export declare class TSRangeSet extends TSList<TSRange> implements Interval {
    constructor(v?: number | TSRange | TSRangeSet | Interval | null | undefined);
    get length(): number;
    insert(data: TSRange, before?: TSListNode<TSRange>): TSListNode<TSRange>;
    add(data: TSRange): TSListNode<TSRange>;
    removeNode(node: TSListNode<TSRange>): void;
    get hasSignificantRange(): boolean;
    get range(): TSRange;
    get location(): number;
    get maxRange(): number;
    clone(): TSRangeSet;
    private _addRange;
    private _removeRange;
    private _intersectRange;
    contains(v: Number | TSRange | Interval | TSRangeSet): boolean;
    intersects(v: Number | TSRange | Interval | TSRangeSet): boolean;
    unionWidth(v: number | TSRange | TSRangeSet | Interval): void;
    substractFrom(v: number | TSRange | TSRangeSet | Interval): void;
    intersectWidth(v: number | TSRange | TSRangeSet | Interval): void;
    union(v: number | TSRange | Interval | TSRangeSet): TSRangeSet;
    intersection(v: number | TSRange | Interval | TSRangeSet): TSRangeSet;
    substraction(v: number | TSRange | Interval | TSRangeSet): TSRangeSet;
    complement(v?: TSRange | Interval): TSRangeSet;
    isEqual(other: any): boolean;
    compare(other: any): Comparison;
}
