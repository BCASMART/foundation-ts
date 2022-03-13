/**
 * This is a timestamp (commencing at 01/01/2001) oriented date class
 */
import { $components, $isostring2components, $parsedate, $parsedatetime, $componentsarevalid, TSDateForm, $components2string, $components2timestamp, $components2date } from "./tsdatecomp";
import { $isint, $isnumber, $div, $ok, $isstring, $numcompare } from "./commons";
import { Same, UINT32_MAX } from "./types";
import { UnsignedMask } from "./tsrange";
export const TSMinute = 60;
export const TSHour = 3600;
export const TSDay = 86400;
export const TSWeek = 604800;
const TSDaysFrom00010101To20010101 = 730485;
const TSSecsFrom00010101To20010101 = 63113904000;
const TSDaysInMonth = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const TSDaysInPreviousMonth = [0, 0, 0, 0, 31, 61, 92, 122, 153, 184, 214, 245, 275, 306, 337];
export const TSDaysFrom00000229To20010101 = 730792;
export const TSSecsFrom19700101To20010101 = 978307200; // this one is exported for conversion from EPOCH to TSDate
export function $isleap(y) {
    return !$isint(y) || y % 4 ? false : (y % 100 ? (y > 7 ? true : false) : (y % 400 || y < 1600 ? false : true));
}
export function $dayisvalid(year, month, day) {
    if (!$isint(day) || !$isint(month) || !$isint(year) || day < 1 || day > 31 || month < 1 || month > 12) {
        return false;
    }
    if (day > TSDaysInMonth[month]) {
        return (month === 2 && day === 29 && $isleap(year)) ? true : false;
    }
    return true;
}
export function $timeisvalid(hour, minute, second) {
    return ($isint(hour) && $isint(minute) && $isnumber(second) && hour >= 0 && hour < 24 && minute >= 0 && minute < 60 && second >= 0 && second < 60);
}
export function $timestamp(year, month, day, hours = 0, minutes = 0, seconds = 0) {
    // TODO: verify the numbers here
    var leaps;
    month = 0 | month;
    if (month < 3) {
        month += 12;
        year--;
    }
    leaps = Math.floor(year / 4) - Math.floor(year / 100) + Math.floor(year / 400);
    return Math.floor((day + TSDaysInPreviousMonth[month] + 365 * year + leaps - TSDaysFrom00000229To20010101) * TSDay) + hours * TSHour + minutes * TSMinute + seconds;
}
export function $dayFromTimestamp(t) { return Math.floor($daytimestamp(t) / TSDay); }
export function $secondFromTimestamp(t) { return ((t + TSSecsFrom00010101To20010101) % TSMinute); }
export function $minuteFromTimestamp(t) { return $div(Math.floor((t + TSSecsFrom00010101To20010101) % TSHour), TSMinute); }
export function $hourFromTimestamp(t) { return $div(Math.floor((t + TSSecsFrom00010101To20010101) % TSDay), TSHour); }
export function $daytimestamp(ts) { return Math.floor(ts - _timeFromTimestamp(ts)); }
export class TSDate {
    constructor() {
        let n = arguments.length;
        if (n >= 3) {
            if (!$dayisvalid(arguments[0], arguments[1], arguments[2])) {
                throw "Bad TSDate() day arguments";
            }
            if (n !== 3 && n !== 6) {
                throw `Impossible to initialize a new TSDate() with ${n} arguments`;
            }
            if (n === 6) {
                if (!$timeisvalid(arguments[3], arguments[4], arguments[5])) {
                    throw "Bad TSDate() time arguments";
                }
                this.timestamp = $timestamp(arguments[0], arguments[1], arguments[2], arguments[3], arguments[4], arguments[5]);
            }
            else {
                this.timestamp = $timestamp(arguments[0], arguments[1], arguments[2], 0, 0, 0);
            }
        }
        else if (n === 2) {
            throw "Impossible to initialize a new TSDate() with 2 arguments";
        }
        else { // n === 1 || n === 0
            let t = arguments[0]; // undefined if n === 0
            if ($isnumber(t)) {
                this.timestamp = t;
            }
            else if (t instanceof TSDate) {
                this.timestamp = t.timestamp;
            }
            else {
                let comps = null;
                if ($isstring(t)) {
                    if (t === TSDate.FUTURE) {
                        this.timestamp = UINT32_MAX;
                        return;
                    }
                    else if (t === TSDate.PAST) {
                        comps = { year: 1, month: 1, day: 1, hour: 0, minute: 0, second: 0 };
                    }
                    else {
                        comps = $isostring2components(t);
                    }
                }
                else if (!$ok(t) || t instanceof Date) {
                    comps = $components(t);
                }
                if (!$ok(comps)) {
                    throw "Bad TSDate constructor parameters";
                }
                this.timestamp = $components2timestamp(comps);
            }
        }
    }
    static past() { return new TSDate(TSDate.PAST); }
    static future() { return new TSDate(TSDate.FUTURE); }
    // usage TSDate.fromComponents(myComponents)
    // if you only want to set a day, that's up to you to put 0 in hour, minute and second fields
    static fromComponents(comp) {
        if (!$componentsarevalid(comp)) {
            return null;
        }
        const c = comp;
        // we use the timestamp constructor because we know that our date is valid
        return new TSDate($timestamp(c.year, c.month, c.day, c.hour, c.minute, c.second));
    }
    // usage TSDate.fromString(aString[, parsing form])
    static fromString(s, form = TSDateForm.Standard) {
        return this.fromComponents($parsedatetime(s, form));
    }
    // usage TSDate.fromDateString(aString[, parsing form]).
    // this function only parse day date string (no time should be included in the string)
    static fromDateString(s, form = TSDateForm.Standard) {
        return this.fromComponents($parsedate(s, form));
    }
    // ================= instance methods ========================
    isLeap() { return $isleap($components(this.timestamp).year); }
    dateWithoutTime() { return new TSDate($daytimestamp(this.timestamp)); }
    year() { return $components(this.timestamp).year; }
    month() { return $components(this.timestamp).month; }
    day() { return $components(this.timestamp).day; }
    hour() { return $hourFromTimestamp(this.timestamp); }
    minute() { return $minuteFromTimestamp(this.timestamp); }
    second() { return $secondFromTimestamp(this.timestamp); }
    week(offset = 0) {
        let c = $components(this.timestamp);
        offset %= 7;
        let ref = _yearReference(c.year, offset);
        if (this.timestamp < ref) {
            ref = _yearReference(c.year - 1, offset);
        }
        let week = Math.floor((this.timestamp - ref) / TSWeek) + 1;
        if (week === 53) {
            ref += 52 * TSWeek;
            c = $components(ref);
            if (c.day >= 29) {
                week = 1;
            }
        }
        return week;
    }
    dayOfYear() {
        return Math.floor((this.timestamp - $timestamp($components(this.timestamp).year, 1, 1)) / TSDay) + 1;
    }
    dayOfWeek(offset = 0) { return _dayOfWeekFromTimestamp(this.timestamp, offset); }
    lastDayOfMonth() { let c = $components(this.timestamp); return _lastDayOfMonth(c.year, c.month); }
    dateByAdding(years, months = 0, days = 0, hours = 0, minutes = 0, seconds = 0) {
        if (!years && !months) {
            return new TSDate(this.timestamp + days * TSDay + hours * TSHour + minutes * TSMinute + seconds);
        }
        let c = $components(this.timestamp);
        _addym(c, years, months);
        return new TSDate(c.year, c.month, c.day, c.hour, c.minute, c.second);
    }
    dateByAddingWeeks(weeks) { return new TSDate(this.timestamp + weeks * TSWeek); }
    dateByAddingTime(time) { return new TSDate(this.timestamp + time); }
    firstDateOfYear() { let c = $components(this.timestamp); return new TSDate(c.year, 1, 1); }
    lastDateOfYear() { let c = $components(this.timestamp); return new TSDate(c.year, 12, 31); }
    firstDateOfMonth() { let c = $components(this.timestamp); return new TSDate(c.year, c.month, 1); }
    lastDateOfMonth() { let c = $components(this.timestamp); return new TSDate(c.year, c.month, _lastDayOfMonth(c.year, c.month)); }
    firstDateOfWeek(offset = 0) {
        const ts = $daytimestamp(this.timestamp);
        const dayOfWeek = _dayOfWeekFromTimestamp(ts, offset);
        return new TSDate(ts - dayOfWeek * TSDay);
    }
    ;
    daysSinceDate(aDate) {
        return $div($daytimestamp(this.timestamp) - $daytimestamp(aDate.timestamp), TSDay);
    }
    toNumber() { return this.timestamp; }
    toComponents() { return $components(this.timestamp); }
    toEpochTimestamp() { return this.timestamp + TSSecsFrom19700101To20010101; }
    toDate() {
        return $components2date($components(this.timestamp));
    }
    toIsoString() { return $components2string($components(this.timestamp), TSDateForm.ISO8601); }
    toRangeLocation() { return (this.timestamp / 60) & UnsignedMask; }
    // ============ TSObject conformance =============== 
    get isa() { return this.constructor; }
    get className() { return this.constructor.name; }
    compare(other) {
        if (this === other) {
            return Same;
        }
        if (other instanceof TSDate) {
            return $numcompare(this.timestamp, other.timestamp);
        }
        return undefined;
    }
    isEqual(other) { return this === other || (other instanceof TSDate && other.timestamp === this.timestamp); }
    toString(form = TSDateForm.Standard) { return $components2string($components(this.timestamp), form); }
    toJSON() { return $components2string($components(this.timestamp), TSDateForm.ISO8601); }
    toArray() { return [this]; }
}
TSDate.FUTURE = 'future';
TSDate.PAST = 'past';
function _timeFromTimestamp(t) { return ((t + TSSecsFrom00010101To20010101) % TSDay); }
function _dayOfWeekFromTimestamp(t, offset = 0) {
    return ($dayFromTimestamp(t) + TSDaysFrom00010101To20010101 + 7 - (offset % 7)) % 7;
}
function _lastDayOfMonth(year, month) {
    return (month === 2 && $isleap(year)) ? 29 : TSDaysInMonth[month];
}
function _yearReference(y, offset = 0) {
    const firstDayOfYear = $timestamp(y, 1, 1);
    let d = _dayOfWeekFromTimestamp(firstDayOfYear, offset);
    d = (d <= 3 ? -d : 7 - d);
    return firstDayOfYear + d * TSDay;
}
function _addym(c, years, months = 0) {
    years += months / 12;
    months = (months < 0 ? -((-months) % 12) : months % 12);
    let newYear = c.year + years;
    let newMonth = c.month + months;
    if (newMonth > 12) {
        newMonth -= 12;
        newYear++;
    }
    else if (newMonth < 1) {
        newMonth += 12;
        newYear--;
    }
    if (newYear < 1) {
        newYear = 1;
        newMonth = 1;
    }
    c.year = newYear;
    c.month = newMonth;
    if (c.day > TSDaysInMonth[newMonth]) {
        c.day = (newMonth == 2 && $isleap(newYear) ? 29 : TSDaysInMonth[newMonth]);
    }
}
//# sourceMappingURL=tsdate.js.map