import { $div, $isnumber, $length, $ok, $unsigned } from "./commons";
import { $dayisvalid, $timeisvalid, $dayFromTimestamp, $hourFromTimestamp, $minuteFromTimestamp, $secondFromTimestamp, TSDaysFrom00000229To20010101, TSDate, TSDay, $timestamp, TSHour, TSMinute } from "./tsdate";
import { UINT_MIN } from "./types";
export var TSDateForm;
(function (TSDateForm) {
    TSDateForm[TSDateForm["Standard"] = 0] = "Standard";
    TSDateForm[TSDateForm["English"] = 1] = "English";
    TSDateForm[TSDateForm["Computer"] = 2] = "Computer";
    TSDateForm[TSDateForm["ISO8601"] = 3] = "ISO8601";
})(TSDateForm || (TSDateForm = {}));
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
        let Z = $dayFromTimestamp(timestamp) + TSDaysFrom00000229To20010101;
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
export function $isostring2components(source, opts = {}) {
    if (!$length(source)) {
        return null;
    }
    const s = source;
    const m = opts.noTime ?
        s.match(/^\s*([0-9]{4})\-([0-1][0-9])\-([0-3][0-9])\s*$/)
        :
            (opts.acceptsGMT ?
                s.match(/^\s*([0-9]{4})\-([0-1][0-9])\-([0-3][0-9])([Tt]([0-1][0-9])(:([0-5][0-9])(:([0-5][0-9]))?)?([zZ]|\+00(:?00)?)?)?\s*$/) :
                s.match(/^\s*([0-9]{2, 4})\-([0-1][0-9])\-([0-3][0-9])([Tt]([0-1][0-9])(:([0-5][0-9])(:([0-5][0-9]))?)?)?\s*$/));
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
            return `${_fpad4(c.year)}-${_fpad2(c.month)}-${_fpad2(c.day)}T${_fpad2(c.hour)}:${_fpad2(c.minute)}:${_fpad2(c.second)}`;
        case TSDateForm.Standard:
            return timed ? `${_fpad2(c.day)}/${_fpad2(c.month)}/${_fpad4(c.year)}-${_fpad2(c.hour)}:${_fpad2(c.minute)}:${_fpad2(c.second)}`
                : `${_fpad2(c.day)}/${_fpad2(c.month)}/${_fpad4(c.year)}`;
        case TSDateForm.English:
            return timed ? `${_fpad2(c.month)}/${_fpad2(c.day)}/${_fpad4(c.year)}-${_fpad2(c.hour)}:${_fpad2(c.minute)}:${_fpad2(c.second)}`
                : `${_fpad2(c.month)}/${_fpad2(c.day)}/${_fpad4(c.year)}`;
        case TSDateForm.Computer:
            return timed ? `${_fpad4(c.year)}/${_fpad2(c.month)}/${_fpad4(c.day)}-${_fpad2(c.hour)}:${_fpad2(c.minute)}:${_fpad2(c.second)}`
                : `${_fpad4(c.year)}/${_fpad2(c.month)}/${_fpad4(c.day)}`;
    }
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
                `${_fpad2(c.days)}-${_fpad2(c.hours)}:${_fpad2(c.minutes)}:${_fpad2(c.seconds)}` :
                `${_fpad2(c.days)}-${_fpad2(c.hours)}:${_fpad2(c.minutes)}`;
        }
        return c.seconds ?
            `${_fpad2(c.hours)}:${_fpad2(c.minutes)}:${_fpad2(c.seconds)}` :
            `${_fpad2(c.hours)}:${_fpad2(c.minutes)}`;
    }
    return '00:00';
}
//////////////////// private functions
// since IE does not support padStart() ...
function _fpad2(v) { return v >= 10 ? ('' + v) : ('0' + v); }
function _fpad4(v) { return v >= 1000 ? ('' + v) : (v >= 100 ? ('0' + v) : (v >= 10 ? ('00' + v) : ('000' + v))); }
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
    if (form === TSDateForm.ISO8601) {
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