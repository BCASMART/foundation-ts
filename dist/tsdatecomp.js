import { $div, $isnumber, $length, $ok, $trim, $unsigned, $fpad2, $fpad4, $locales, $fpad3 } from "./commons";
import { $dayisvalid, $timeisvalid, $hourFromTimestamp, $minuteFromTimestamp, $secondFromTimestamp, TSDate, TSDay, $timestamp, TSHour, TSMinute, $weekOfYear, $dayOfYear, TSDaysFrom00000229To20010101, $dayOfWeekFromTimestamp } from "./tsdate";
import { UINT_MIN } from "./types";
export var TSDateForm;
(function (TSDateForm) {
    TSDateForm[TSDateForm["Standard"] = 0] = "Standard";
    TSDateForm[TSDateForm["English"] = 1] = "English";
    TSDateForm[TSDateForm["Computer"] = 2] = "Computer";
    TSDateForm[TSDateForm["ISO8601"] = 3] = "ISO8601";
    TSDateForm[TSDateForm["ISO8601C"] = 4] = "ISO8601C";
})(TSDateForm || (TSDateForm = {}));
export var TSDateRep;
(function (TSDateRep) {
    TSDateRep["LocalTime"] = "lt";
    TSDateRep["LocalDate"] = "ld";
    TSDateRep["LocalDateTime"] = "ldt";
    TSDateRep["ShortLocalDate"] = "sld";
    TSDateRep["ShortLocalDateTime"] = "sldt";
})(TSDateRep || (TSDateRep = {}));
/**
 * If you call timecomponents() with no parameters, it
 * returns the components for the current local time.
 * This function can not have a string as parameter ;
 * in order to create components from string, you need
 * to user functions $parsetime()
 */
export function $timecomponents(source = null) {
    if (!$ok(source)) {
        source = new Date();
    }
    else if (source instanceof TSDate) {
        source = source.timestamp;
    }
    if ($isnumber(source)) {
        const timestamp = source;
        return {
            hour: $hourFromTimestamp(timestamp),
            minute: $minuteFromTimestamp(timestamp),
            second: $secondFromTimestamp(timestamp),
        };
    }
    const d = source;
    return {
        hour: d.getHours(),
        minute: d.getMinutes(),
        second: d.getSeconds(),
    };
}
/**
 * If you call components() with no parameters, it
 * returns the components for the current local date.
 * This function can not have a string as parameter ;
 * in order to create components from string, you need
 * to user functions $parsedate(), $parsedatetime() or $isostring2components()
 */
export function $components(source = null) {
    if (!$ok(source)) {
        source = new Date();
    }
    else if (source instanceof TSDate) {
        source = source.timestamp;
    }
    if ($isnumber(source)) {
        const timestamp = source;
        let Z = Math.floor(timestamp / TSDay) + TSDaysFrom00000229To20010101;
        let gg = Z - 0.25;
        let CENTURY = Math.floor(gg / 36524.25);
        let CENTURY_MQUART = CENTURY - Math.floor(CENTURY / 4);
        let ALLDAYS = gg + CENTURY_MQUART;
        let Y = Math.floor(ALLDAYS / 365.25);
        let Y365 = Math.floor(Y * 365.25);
        let DAYS_IN_Y = CENTURY_MQUART + Z - Y365;
        let MONTH_IN_Y = Math.floor((5 * DAYS_IN_Y + 456) / 153);
        return {
            day: Math.floor(DAYS_IN_Y - Math.floor((153 * MONTH_IN_Y - 457) / 5)),
            hour: $hourFromTimestamp(timestamp),
            minute: $minuteFromTimestamp(timestamp),
            second: $secondFromTimestamp(timestamp),
            dayOfWeek: ((Z + 2) % 7),
            month: (MONTH_IN_Y > 12 ? MONTH_IN_Y - 12 : MONTH_IN_Y),
            year: (MONTH_IN_Y > 12 ? Y + 1 : Y)
        };
    }
    const d = source;
    return {
        year: d.getFullYear(),
        month: (d.getMonth() + 1),
        day: d.getDate(),
        hour: d.getHours(),
        minute: d.getMinutes(),
        second: d.getSeconds(),
        dayOfWeek: d.getDay()
    };
}
export function $componentsarevalid(comp) {
    if (!$ok(comp)) {
        return false;
    }
    ;
    const c = comp;
    return $dayisvalid(c.year, c.month, c.day) && $timeisvalid(c.hour, c.minute, c.second);
}
export function $componentshavetime(c) {
    return c.hour > 0 || c.minute > 0 || c.second > 0;
}
export function $parsetime(s) {
    if (!$length(s)) {
        return null;
    }
    const m = s.match(/^\s*(\d{1,6})(\s*[:.]\s*(\d{1,2})(\s*[:.]\s*(\d{1,2}))?)?\s*$/);
    if (!$ok(m)) {
        return null;
    }
    const res = m;
    const c = { hour: UINT_MIN, minute: UINT_MIN, second: UINT_MIN };
    _parseTime(c, res, 0, res.length);
    return $timeisvalid(c.hour, c.minute, c.second) ? c : null;
}
/**
 * These 2 functions parse a date or a date time.
 * Dependending on which date-form you choose to parse the given string, you may ommit
 * the month or the year, the system will autocomplete the components itself ; you
 * also may enter the year with 2 or 4 digits and the system will try to interpret
 * all 2 digits years as years from the previous or the current century. The limit
 * for that is : all date that seems to be more than 20 years in the future will
 * be considered as a previous century year. Note that if you date is not complete
 * you won't be able to enter a time.
 *
 * If you want to create a TSDate from a parsed string, you don't need this
 * function. Simply call :
 *
 *   myDate = TSDate.fromString(myStringToParse [, dateForm]) ; // this does not throw but return can be null
 *
 * ==WARNING== dayOfWeek is not initialized after parsing.
 */
export function $parsedatetime(s, form = TSDateForm.Standard) {
    return _parsedt(s, /^\s*(\d{1,8})([/\-.](\d{1,2})([/\-.](\d{1,4})(\s+(\d{1,6})(\s*[:.]\s*(\d{1,2})(\s*[:.]\s*(\d{1,2}))?)?)?)?)?\s*$/, form);
}
export function $parsedate(s, form = TSDateForm.Standard) {
    return _parsedt(s, /^\s*(\d{1,8})([/\-.](\d{1,2})([/\-.](\d{1,4}))?)?\s*$/, form, { noTime: true });
}
const NO_TIME_ISO_REGEX = /^([0-9]{2,4})\-([0-9]{1,2})\-([0-9]{1,2})$/;
const TIME_ISO_REGEX = /^([0-9]{2,4})\-([0-9]{1,2})\-([0-9]{1,2})([Tt]([0-9]{1,2})(:([0-9]{1,2})(:([0-9]{1,2}))?)?([zZ]|\+00(:?00)?)?)?$/;
//const TIME_ISO_REGEX    = /^([0-9]{2,4})\-([0-9]{1,2})\-([0-9]{1,2})([Tt]([0-9]{1,2})(:([0-9]{1,2})(:([0-9]{1,2}))?)?)?$/ ;
const COMPACT_NO_TIME_ISO_REGEX = /^([0-9]{4})([0-9]{2})([0-9]{2})$/;
const COMPACT_TIME_ISO_REGEX = /^([0-9]{4})([0-9]{2})([0-9]{2})([Tt]([0-9]{2})(([0-9]{2})(([0-9]{2}))?)?([zZ]|\+00(:?00)?)?)?$/;
//const COMPACT_TIME_ISO_REGEX    = /^([0-9]{4})([0-9]{2})([0-9]{2})([Tt]([0-9]{2})(([0-9]{2})(([0-9]{2}))?)?)?$/ ;
export function $isostring2components(source, opts = {}) {
    const s = $trim(source);
    if (!s.length) {
        return null;
    }
    let m = undefined;
    if (opts.noTime) {
        m = s.match(NO_TIME_ISO_REGEX);
        if (!$ok(m)) {
            m = s.match(COMPACT_NO_TIME_ISO_REGEX);
        }
    }
    else {
        if (!$ok(m)) {
            m = s.match(TIME_ISO_REGEX);
        }
        if (!$ok(m)) {
            m = s.match(COMPACT_TIME_ISO_REGEX);
        }
    }
    if (!$ok(m)) {
        return null;
    }
    const res = m;
    const l = res.length;
    const c = {
        year: _yearFrom(res[1]),
        month: $unsigned(res[2]),
        day: $unsigned(res[3]),
        hour: l > 5 ? $unsigned(res[5]) : UINT_MIN,
        minute: l > 7 ? $unsigned(res[7]) : UINT_MIN,
        second: l > 9 ? $unsigned(res[9]) : UINT_MIN
    };
    return $componentsarevalid(c) ? c : null;
}
export function $components2timestamp(c) {
    return $timestamp(c.year, c.month, c.day, c.hour, c.minute, c.second);
}
export function $components2date(c) {
    return new Date(c.year, c.month - 1, c.day, c.hour, c.minute, c.second, 0);
}
export function $components2string(c, form = TSDateForm.Standard) {
    const timed = $componentshavetime(c);
    switch (form) {
        case TSDateForm.ISO8601:
            return `${$fpad4(c.year)}-${$fpad2(c.month)}-${$fpad2(c.day)}T${$fpad2(c.hour)}:${$fpad2(c.minute)}:${$fpad2(c.second)}`;
        case TSDateForm.ISO8601C:
            return `${$fpad4(c.year)}${$fpad2(c.month)}${$fpad2(c.day)}T${$fpad2(c.hour)}${$fpad2(c.minute)}${$fpad2(c.second)}`;
        case TSDateForm.Standard:
            return timed ? `${$fpad2(c.day)}/${$fpad2(c.month)}/${$fpad4(c.year)}-${$fpad2(c.hour)}:${$fpad2(c.minute)}:${$fpad2(c.second)}`
                : `${$fpad2(c.day)}/${$fpad2(c.month)}/${$fpad4(c.year)}`;
        case TSDateForm.English:
            return timed ? `${$fpad2(c.month)}/${$fpad2(c.day)}/${$fpad4(c.year)}-${$fpad2(c.hour)}:${$fpad2(c.minute)}:${$fpad2(c.second)}`
                : `${$fpad2(c.month)}/${$fpad2(c.day)}/${$fpad4(c.year)}`;
        case TSDateForm.Computer:
            return timed ? `${$fpad4(c.year)}/${$fpad2(c.month)}/${$fpad4(c.day)}-${$fpad2(c.hour)}:${$fpad2(c.minute)}:${$fpad2(c.second)}`
                : `${$fpad4(c.year)}/${$fpad2(c.month)}/${$fpad4(c.day)}`;
    }
}
/**
 *      Format documentation :
 *
 *      %Y  year padded to 4 digits
 *      %y  year paddeed to 2 digits (centuries are ommited)
 *      %z  non padded year
 *
 *      %m  month padded to 2 digits
 *      %n  not padded month
 *      %b  short month name
 *      %B  month name
 *
 *      %d  day padded to 2 digits
 *      %e  not padded day
 *
 *      %f  day of week (0 = sunday, 1 = monday, ..., 6 = Saturday)
 *      %F  day of week calculated with the current local starting day (0 = monday in France)
 *      %a  short day of week name
 *      %A  day of week name
 *
 *      %q  day of year padded to 3 digits
 *      %r  not padded day of year
 *
 *      %H  24 hour representation padded to 2 digits
 *      %I  12 hour representation padded to 2 digits
 *      %J  not padded 24 hour representation of hours
 *      %K  not padded 12 hour representation of hours
 *      %M  minutes padded to 2 digits
 *      %N  not padded minutes
 *      %P  AM/PM
 *      %S  seconds padded to 2 digits
 *      %T  not padded seconds
 *
 *      %p  standard partial time format for the given language (time without seconds)
 *      %t  standard time format for the given language
 *
 *      %v  week of year padded to 2 digits
 *      %w  not padded week of year
 *
 *      %x  standard short date format for the given language
 *      %X  standard date format for the given language
 *
 *      %%  % caracter
 *      %[  enters a format zone which will be disabled if the passed date has no time
 *      %]  exit previous format zone without time
 */
export function $components2stringformat(comp, format = '', lang) {
    if (!$componentsarevalid(comp)) {
        return null;
    }
    const ts = $components2timestamp(comp);
    const trs = $locales(lang);
    let fmtlen = $length(format);
    let ret = "";
    let escape = false;
    let skipIncludedIfNoTime = false;
    if (!fmtlen) {
        format = trs.dateTimeFormat;
        fmtlen = format.length;
    }
    else if (format == TSDateRep.LocalDate) {
        format = trs.dateFormat;
        fmtlen = format.length;
    }
    else if (format == TSDateRep.ShortLocalDate) {
        format = trs.shortDateFormat;
        fmtlen = format.length;
    }
    else if (format == TSDateRep.LocalDateTime) {
        format = trs.dateTimeFormat;
        fmtlen = format.length;
    }
    else if (format == TSDateRep.ShortLocalDateTime) {
        format = trs.shortDateTimeFormat;
        fmtlen = format.length;
    }
    else if (format == TSDateRep.LocalTime) {
        format = trs.timeFormat;
        fmtlen = format.length;
    }
    for (let i = 0; i < fmtlen; i++) {
        const c = format.charAt(i);
        if (escape) {
            escape = false;
            if (skipIncludedIfNoTime) {
                if (c === ']') {
                    skipIncludedIfNoTime = false;
                }
            }
            else {
                switch (c) {
                    case '%':
                        ret += '%';
                        break;
                    case 'a':
                        ret += trs.shortDays[$dayOfWeekFromTimestamp(ts)];
                        break;
                    case 'A':
                        ret += trs.days[$dayOfWeekFromTimestamp(ts)];
                        break;
                    case 'b':
                        ret += trs.shortMonths[comp.month - 1];
                        break;
                    case 'B':
                        ret += trs.months[comp.month - 1];
                        break;
                    case 'd':
                        ret += $fpad2(comp.day);
                        break;
                    case 'e':
                        ret += comp.day;
                        break;
                    case 'f':
                        ret += $dayOfWeekFromTimestamp(ts);
                        break;
                    case 'F':
                        ret += $dayOfWeekFromTimestamp(ts, trs.startingWeekDay);
                        break;
                    case 'H':
                        ret += $fpad2(comp.hour);
                        break;
                    case 'J':
                        ret += $fpad2((comp.hour > 12 ? comp.hour - 12 : comp.hour));
                        break;
                    case 'I':
                        ret += comp.hour;
                        break;
                    case 'K':
                        ret += comp.hour > 12 ? comp.hour - 12 : comp.hour;
                        break;
                    case 'm':
                        ret += $fpad2(comp.month);
                        break;
                    case 'M':
                        ret += $fpad2(comp.minute);
                        break;
                    case 'N':
                        ret += comp.minute;
                        break;
                    case 'n':
                        ret += comp.month;
                        break;
                    case 'p': {
                        const s = $components2stringformat(comp, trs.partialTimeFormat, lang);
                        if (!$ok(s)) {
                            return null;
                        }
                        ret += s;
                        break;
                    }
                    case 'P':
                        ret += trs.ampm[comp.hour <= 12 ? 0 : 1];
                        break;
                    case 'q':
                        ret += $fpad3($unsigned($dayOfYear(ts)));
                        break;
                    case 'r':
                        ret += $dayOfYear(ts);
                        break;
                    case 'S':
                        ret += $fpad2(comp.second);
                        break;
                    case 'T':
                        ret += comp.second;
                        break;
                    case 't': {
                        const s = $components2stringformat(comp, trs.timeFormat, lang);
                        if (!$ok(s)) {
                            return null;
                        }
                        ret += s;
                        break;
                    }
                    case 'v':
                        ret += $fpad2($unsigned($weekOfYear(ts, trs.startingWeekDay)));
                        break;
                    case 'w':
                        ret += $weekOfYear(ts, trs.startingWeekDay);
                        break;
                    case 'x': {
                        const s = $components2stringformat(comp, trs.shortDateFormat, lang);
                        if (!$ok(s)) {
                            return null;
                        }
                        ret += s;
                        break;
                    }
                    case 'X': {
                        const s = $components2stringformat(comp, trs.dateFormat, lang);
                        if (!$ok(s)) {
                            return null;
                        }
                        ret += s;
                        break;
                    }
                    case 'y':
                        ret += $fpad2((comp.year % 100));
                        break;
                    case 'Y':
                        ret += $fpad4(comp.year);
                        break;
                    case 'z':
                        ret += comp.year;
                        break;
                    case '[':
                        skipIncludedIfNoTime = comp.hour == 0 && comp.minute == 0 && comp.second == 0 ? true : false;
                        break;
                    case ']':
                        skipIncludedIfNoTime = false;
                        break;
                    default:
                        ret += '%';
                        ret += c;
                        break;
                }
            }
        }
        else if (c === '%') {
            escape = true;
        }
        else {
            escape = false;
            if (!skipIncludedIfNoTime) {
                ret += c;
            }
        }
    }
    if (escape && !skipIncludedIfNoTime) {
        ret += '%';
    }
    return ret;
}
export function $durationcomponents(duration) {
    let time = $unsigned(duration, 0);
    let d, h, m;
    d = $div(time, TSDay);
    time -= d * TSDay;
    h = $div(time, TSHour);
    time -= h * TSHour;
    m = $div(time, TSMinute);
    return {
        days: d,
        hours: h,
        minutes: m,
        seconds: (time - m * TSMinute)
    };
}
export function $duration(comps) {
    return comps.days * TSDay + comps.hours * TSHour + comps.minutes * TSMinute + comps.seconds;
}
export function duration2String(comps) {
    // we reexport in number before constructing the string in order
    // to normalize the number of days, hours, minutes and seconds
    return durationNumber2String($duration(comps));
}
export function durationNumber2String(duration) {
    const c = $durationcomponents(duration);
    if (c.days || c.hours || c.minutes || c.seconds) {
        if (c.days) {
            return c.seconds ?
                `${$fpad2(c.days)}-${$fpad2(c.hours)}:${$fpad2(c.minutes)}:${$fpad2(c.seconds)}` :
                `${$fpad2(c.days)}-${$fpad2(c.hours)}:${$fpad2(c.minutes)}`;
        }
        return c.seconds ?
            `${$fpad2(c.hours)}:${$fpad2(c.minutes)}:${$fpad2(c.seconds)}` :
            `${$fpad2(c.hours)}:${$fpad2(c.minutes)}`;
    }
    return '00:00';
}
//////////////////// private functions
function _yearFrom(ys) {
    const y = $unsigned(ys);
    return ys.length > 2 ? y : _adjustYear(y);
}
/**
 * This function adjust the year entered with only 2 digits
 * follling the following rule :
 *  - each date which seems to be more than 20 years in the future is considered as a previous century date
 *  - each date which seems to be less than 20 years in the future is considered as a current century date
 */
function _adjustYear(y) {
    const currentYear = new Date().getFullYear();
    const century = $div(currentYear, 100);
    return (y > currentYear % 100 + 20 ? y + (century - 1) * 100 : y + century * 100);
}
function _completeWithToday(c) {
    if (c.day) {
        if (c.month) {
            if (!c.year) {
                c.year = (new Date().getFullYear());
            }
        }
        else if (!c.year) {
            const d = new Date();
            c.month = (d.getMonth() + 1);
            c.year = d.getFullYear();
        }
    }
}
function _parsedt(s, regexp, form = TSDateForm.Standard, opts = {}) {
    if (form === TSDateForm.ISO8601 || form === TSDateForm.ISO8601C) {
        return $isostring2components(s, opts);
    }
    if (!$length(s)) {
        return null;
    }
    const m = s.match(regexp);
    if (!$ok(m)) {
        return null;
    }
    const res = m;
    const l = res.length;
    const c = { year: UINT_MIN, month: UINT_MIN, day: UINT_MIN, hour: UINT_MIN, minute: UINT_MIN, second: UINT_MIN };
    switch (form) {
        case TSDateForm.Standard:
            const ds = $unsigned(res[1]);
            if (l === 2) {
                if (ds >= 1010001) {
                    c.year = (ds % 10000);
                    c.month = $div(ds % 1000000, 10000);
                    c.day = $div(ds, 1000000);
                }
                else if (ds >= 10101) {
                    c.year = _adjustYear(ds % 100);
                    c.month = $div(ds % 10000, 100);
                    c.day = $div(ds, 10000);
                }
                else if (ds >= 101) {
                    c.month = (ds % 100);
                    c.day = $div(ds, 100);
                    _completeWithToday(c);
                }
                else {
                    c.day = ds;
                    _completeWithToday(c);
                }
            }
            else {
                c.day = ds;
                c.month = $unsigned(res[3]);
                if (l >= 6) {
                    c.year = _yearFrom(res[5]);
                    if (l > 6) {
                        _parseTime(c, res, 5, l - 5);
                    }
                }
                else {
                    _completeWithToday(c);
                }
            }
            break;
        case TSDateForm.English:
            const me = $unsigned(res[1]);
            if (l === 2) {
                if (me >= 1010001) {
                    c.year = (me % 10000);
                    c.day = $div(me % 1000000, 10000);
                    c.month = $div(me, 1000000);
                }
                else if (me >= 10101) {
                    c.year = _adjustYear(me % 100);
                    c.day = $div(me % 10000, 100);
                    c.month = $div(me, 10000);
                }
                else if (me >= 101) {
                    c.day = (me % 100);
                    c.month = $div(me, 100);
                }
            }
            else {
                c.month = me;
                c.day = $unsigned(res[3]);
                if (l >= 6) {
                    c.year = _yearFrom(res[5]);
                    if (l > 6) {
                        _parseTime(c, res, 5, l - 5);
                    }
                }
                else {
                    _completeWithToday(c);
                }
            }
            break;
        case TSDateForm.Computer:
            const yc = $unsigned(res[1]);
            if (l === 2) {
                if (res[1].length !== 8) {
                    return null;
                } // in computer form we need all the digits
                c.year = $div(yc, 10000);
                c.month = ($div(yc, 100) % 100);
                c.day = $div(yc, 100);
            }
            else if (l >= 6) {
                c.year = yc;
                c.month = $unsigned(res[3]);
                c.day = $unsigned(res[5]);
                if (l > 6) {
                    _parseTime(c, res, 5, l - 5);
                }
            }
            else {
                return null;
            }
            break;
        default:
            return null;
    }
    return $componentsarevalid(c) ? c : null;
}
function _parseTime(c, m, start, len) {
    let v = $unsigned(m[start + 1]);
    if (len === 2) {
        // we have a single number representing the full time
        // like H or HH or HMM or HHMM or HMMSS or HHMMSS
        switch (m[start + 1].length) {
            case 1:
            case 2:
                c.hour = v;
                break;
            case 3:
            case 4:
                c.hour = $div(v, 100);
                c.minute = (v % 100);
                break;
            case 5:
            case 6:
                c.hour = $div(v, 10000);
                c.minute = ($div(v, 100) % 100);
                c.second = (v % 100);
                break;
        }
    }
    else {
        c.hour = v;
        c.minute = $unsigned(m[start + 2]);
        if (len > 4) {
            c.second = $unsigned(m[start + 4]);
        }
    }
}
//# sourceMappingURL=tsdatecomp.js.map