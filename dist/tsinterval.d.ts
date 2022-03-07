import { Interval, TSRange } from "./tsrange";
import { TSDate } from "./tsdate";
import { Comparison } from "./types";
import { TSCouple } from "./tscouple";
/************************************************
 *  WARNING: range conformance methods and containing
 *  and intersectionning methods do round dates to minutes
 ************************************************/
export declare class TSInterval extends TSCouple<TSDate | null | undefined, TSDate | null | undefined> implements Interval {
    get start(): TSDate;
    get end(): TSDate;
    get hasSignificantRange(): boolean;
    get hasEmptyRange(): boolean;
    get range(): TSRange;
    daysInterval(): TSInterval;
    hasSameRange(other: TSInterval): boolean;
    containsDate(aDate: TSDate): boolean;
    intersectsInterval(other: TSInterval): boolean;
    containsInterval(other: TSInterval): boolean;
    containedInInterval(other: TSInterval): boolean;
    compare(other: any): Comparison;
    isEqual(other: any): boolean;
    toJSON(): {
        start: TSDate | null | undefined;
        end: TSDate | null | undefined;
    };
    toArray(): TSInterval[];
}
