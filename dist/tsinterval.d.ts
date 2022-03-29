import { Interval, TSRange } from "./tsrange";
import { TSDate } from "./tsdate";
import { Comparison } from "./types";
import { TSCouple } from "./tscouple";
/************************************************
 *  WARNING: range conformance methods and containing
 *  and intersectionning methods do round dates to minutes
 ************************************************/
export declare class TSInterval extends TSCouple<TSDate | null | undefined, TSDate | null | undefined> implements Interval {
    static make(a: TSDate | null | undefined, b: TSDate | null | undefined): TSInterval;
    get start(): TSDate;
    get end(): TSDate;
    clone(): TSInterval;
    get hasSignificantRange(): boolean;
    get isValid(): boolean;
    get isEmpty(): boolean;
    get range(): TSRange;
    daysInterval(): TSInterval;
    hasSameRange(other: TSInterval): boolean;
    containsDate(aDate: TSDate): boolean;
    intersects(other: TSInterval): boolean;
    contains(other: TSInterval): boolean;
    containedIn(other: TSInterval): boolean;
    continuousWith(other: TSInterval): boolean;
    compare(other: any): Comparison;
    isEqual(other: any): boolean;
    toJSON(): {
        start: TSDate | null | undefined;
        end: TSDate | null | undefined;
    };
    toArray(): TSInterval[];
}
