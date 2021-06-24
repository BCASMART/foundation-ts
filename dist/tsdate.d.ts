/**
 * This is a timestamp (commencing at 01/01/2001) oriented date class
 */
import { TSDateComp, TSDateForm } from "./tsdatecomp";
import { uint } from "./types";
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
export declare class TSDate {
    timestamp: number;
    constructor(year: number, month: number, day: number);
    constructor(year: number, month: number, day: number, hours: number, minutes: number, seconds: number);
    constructor(interval: number);
    constructor(date: Date);
    constructor(date: TSDate);
    constructor(stringDate: string);
    constructor(nullDate: null);
    constructor();
    static fromComponents(comp: TSDateComp | undefined | null): TSDate | null;
    static fromString(s: string | null | undefined, form?: TSDateForm): TSDate | null;
    static fromDateString(s: string | null | undefined, form?: TSDateForm): TSDate | null;
    isEqual(other: any): boolean;
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
    toIsoString(): string;
    toString(form?: TSDateForm): string;
    toJSON(): string;
}
