/**
 * This is a timestamp (commencing at 01/01/2001) oriented date class
 */
import { TSDateComp, TSDateForm } from "./tsdatecomp";
import { Comparison, isodate, uint } from "./types";
import { Class, TSObject } from "./tsobject";
export declare const TSMinute = 60;
export declare const TSHour = 3600;
export declare const TSDay = 86400;
export declare const TSWeek = 604800;
export declare const TSDaysFrom00000229To20010101 = 730792;
export declare const TSSecsFrom19700101To20010101 = 978307200;
export declare function $isleap(y: number): boolean;
export declare function $dayisvalid(year: number, month: number, day: number): boolean;
export declare function $timeisvalid(hour: number, minute: number, second: number): boolean;
export declare function $timestamp(year: number, month: number, day: number, hours?: number, minutes?: number, seconds?: number): number;
export declare function $dayFromTimestamp(t: number): number;
export declare function $secondFromTimestamp(t: number): uint;
export declare function $minuteFromTimestamp(t: number): uint;
export declare function $hourFromTimestamp(t: number): uint;
export declare function $daytimestamp(ts: number): number;
export declare class TSDate implements TSObject<TSDate> {
    timestamp: number;
    static readonly FUTURE = "future";
    static readonly PAST = "past";
    constructor(year: number, month: number, day: number);
    constructor(year: number, month: number, day: number, hours: number, minutes: number, seconds: number);
    constructor(interval: number);
    constructor(date: Date);
    constructor(date: TSDate);
    constructor(stringDate: string);
    constructor(nullDate: null);
    constructor();
    static past(): TSDate;
    static future(): TSDate;
    static fromComponents(comp: TSDateComp | undefined | null): TSDate | null;
    static fromIsoString(s: string | null | undefined): TSDate | null;
    static fromString(s: string | null | undefined, form?: TSDateForm): TSDate | null;
    static fromDateString(s: string | null | undefined, form?: TSDateForm): TSDate | null;
    isLeap(): boolean;
    dateWithoutTime(): TSDate;
    year(): number;
    month(): number;
    day(): number;
    hour(): number;
    minute(): number;
    second(): number;
    week(offset?: number): number;
    dayOfYear(): number;
    dayOfWeek(offset?: number): number;
    lastDayOfMonth(): number;
    dateByAdding(years: number, months?: number, days?: number, hours?: number, minutes?: number, seconds?: number): TSDate;
    dateByAddingWeeks(weeks: number): TSDate;
    dateByAddingTime(time: number): TSDate;
    firstDateOfYear(): TSDate;
    lastDateOfYear(): TSDate;
    firstDateOfMonth(): TSDate;
    lastDateOfMonth(): TSDate;
    firstDateOfWeek(offset?: number): TSDate;
    daysSinceDate(aDate: TSDate): number;
    toNumber(): number;
    toComponents(): TSDateComp;
    toEpochTimestamp(): number;
    toDate(): Date;
    toIsoString(): isodate;
    toRangeLocation(): number;
    get isa(): Class<TSDate>;
    get className(): string;
    compare(other: any): Comparison;
    isEqual(other: any): boolean;
    toString(form?: TSDateForm): string;
    toJSON(): string;
    toArray(): TSDate[];
}
