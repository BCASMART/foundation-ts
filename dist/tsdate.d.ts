/**
 * TSDate is a timestamp (commencing at 01/01/2001) date class
 * meant to manipulate dates without any TZ (even if creation
 * with GMT representation exist and toLocaleString() method
 * offers representation in current TZ).
 *
 * TSDate instances are immutable which means you cannot change
 * their content after creation
 */
import { TSDateComp, TSDateForm } from "./tsdatecomp";
import { Comparison, isodate, Languages, uint } from "./types";
import { Class, TSObject } from "./tsobject";
export declare class TSDate implements TSObject<TSDate> {
    private _timestamp;
    static readonly FUTURE = "future";
    static readonly PAST = "past";
    /**
     *  WARNING : TSDate string intializer takes ISO 8601 representation
     *            without any timezone OR the GMT timezone represented
     *            as a final :
     *              - z or Z
     *              - +00 or +0000 or +00:00
     */
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
    static zulu(): TSDate;
    static fromZulu(s: Date | null | undefined): TSDate | null;
    static fromEpoch(timestamp: number | null | undefined): TSDate | null;
    static from(date: number | string | Date | null | undefined): TSDate | null;
    static fromTimeStamp(d: number | null | undefined): TSDate | null;
    static fromDate(d: Date | null | undefined): TSDate | null;
    static fromComponents(comp: TSDateComp | undefined | null): TSDate | null;
    static fromIsoString(s: string | null | undefined): TSDate | null;
    static fromString(s: string | null | undefined, form?: TSDateForm): TSDate | null;
    static fromDateString(s: string | null | undefined, form?: TSDateForm): TSDate | null;
    get timestamp(): number;
    isLeap(): boolean;
    dateWithoutTime(): TSDate;
    get year(): number;
    get month(): number;
    get day(): number;
    get hour(): number;
    get minute(): number;
    get second(): number;
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
    toEpoch(): number;
    toComponents(): TSDateComp;
    toEpochTimestamp(): number;
    toDate(): Date;
    toIsoString(compact?: boolean): isodate;
    toISOString(): string;
    toRangeLocation(): number;
    get isa(): Class<TSDate>;
    get className(): string;
    compare(other: any): Comparison;
    isEqual(other: any): boolean;
    toString(format?: TSDateForm | string | undefined | null, lang?: Languages): string;
    toLocaleString(format?: TSDateForm | string | undefined | null, lang?: Languages): string;
    toJSON(): string;
    toArray(): TSDate[];
    private _toString;
}
/***************************************************************************************************************
 * PUBLIC FUNCTIONS AND CONSTANTS
 ***************************************************************************************************************/
export declare const TSMinute = 60;
export declare const TSHour = 3600;
export declare const TSDay = 86400;
export declare const TSWeek = 604800;
export declare const TSDaysFrom00000229To20010101 = 730792;
export declare const TSDaysFrom00010101To20010101 = 730485;
export declare const TSSecsFrom00010101To20010101 = 63113904000;
export declare const TSSecsFrom19700101To20010101 = 978307200;
export declare function $isleap(y: number): boolean;
export declare function $dayisvalid(year: number, month: number, day: number): boolean;
export declare function $timeisvalid(hour: number, minute: number, second: number): boolean;
export declare function $timestamp(year: number, month: number, day: number, hours?: number, minutes?: number, seconds?: number): number;
export declare function $secondFromTimestamp(t: number): uint;
export declare function $minuteFromTimestamp(t: number): uint;
export declare function $hourFromTimestamp(t: number): uint;
export declare function $timestampWithoutTime(ts: number): number;
export declare function $dayOfYear(ts: number): number;
export declare function $dayOfWeekFromTimestamp(t: number, offset?: number): number;
export declare function $weekOfYear(ts: number, offset?: number): number;
