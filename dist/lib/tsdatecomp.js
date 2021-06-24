"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.$components2string = exports.$components2date = exports.$components2timestamp = exports.$isostring2components = exports.$parsedate = exports.$parsedatetime = exports.$parsetime = exports.$componentshavetime = exports.$componentsarevalid = exports.$components = exports.$timecomponents = exports.TSDateForm = void 0;
var commons_1 = require("./commons");
var tsdate_1 = require("./tsdate");
var types_1 = require("./types");
var TSDateForm;
(function (TSDateForm) {
    TSDateForm[TSDateForm["Standard"] = 0] = "Standard";
    TSDateForm[TSDateForm["English"] = 1] = "English";
    TSDateForm[TSDateForm["Computer"] = 2] = "Computer";
    TSDateForm[TSDateForm["ISO8601"] = 3] = "ISO8601";
})(TSDateForm = exports.TSDateForm || (exports.TSDateForm = {}));
/**
 * If you call timecomponents() with no parameters, it
 * returns the components for the current local time.
 * This function can not have a string as parameter ;
 * in order to create components from string, you need
 * to user functions $parsetime()
 */
function $timecomponents(source) {
    if (source === void 0) {
        source = null;
    }
    if (!commons_1.$ok(source)) {
        source = new Date();
    }
    else if (source instanceof tsdate_1.TSDate) {
        source = source.timestamp;
    }
    if (commons_1.$isnumber(source)) {
        var timestamp = source;
        return {
            hour: tsdate_1.$hourFromTimestamp(timestamp),
            minute: tsdate_1.$minuteFromTimestamp(timestamp),
            second: tsdate_1.$secondFromTimestamp(timestamp),
        };
    }
    var d = source;
    return {
        hour: d.getHours(),
        minute: d.getMinutes(),
        second: d.getSeconds(),
    };
}
exports.$timecomponents = $timecomponents;
/**
 * If you call components() with no parameters, it
 * returns the components for the current local date.
 * This function can not have a string as parameter ;
 * in order to create components from string, you need
 * to user functions $parsedate(), $parsedatetime() or $isostring2components()
 */
function $components(source) {
    if (source === void 0) {
        source = null;
    }
    if (!commons_1.$ok(source)) {
        source = new Date();
    }
    else if (source instanceof tsdate_1.TSDate) {
        source = source.timestamp;
    }
    if (commons_1.$isnumber(source)) {
        var timestamp = source;
        var Z = tsdate_1.$dayFromTimestamp(timestamp) + tsdate_1.TSDaysFrom00000229To20010101;
        var gg = Z - 0.25;
        var CENTURY = Math.floor(gg / 36524.25);
        var CENTURY_MQUART = CENTURY - Math.floor(CENTURY / 4);
        var ALLDAYS = gg + CENTURY_MQUART;
        var Y = Math.floor(ALLDAYS / 365.25);
        var Y365 = Math.floor(Y * 365.25);
        var DAYS_IN_Y = CENTURY_MQUART + Z - Y365;
        var MONTH_IN_Y = Math.floor((5 * DAYS_IN_Y + 456) / 153);
        return {
            day: Math.floor(DAYS_IN_Y - Math.floor((153 * MONTH_IN_Y - 457) / 5)),
            hour: tsdate_1.$hourFromTimestamp(timestamp),
            minute: tsdate_1.$minuteFromTimestamp(timestamp),
            second: tsdate_1.$secondFromTimestamp(timestamp),
            dayOfWeek: ((Z + 2) % 7),
            month: (MONTH_IN_Y > 12 ? MONTH_IN_Y - 12 : MONTH_IN_Y),
            year: (MONTH_IN_Y > 12 ? Y + 1 : Y)
        };
    }
    var d = source;
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
exports.$components = $components;
function $componentsarevalid(comp) {
    if (!commons_1.$ok(comp)) {
        return false;
    }
    ;
    var c = comp;
    return tsdate_1.$dayisvalid(c.year, c.month, c.day) && tsdate_1.$timeisvalid(c.hour, c.minute, c.second);
}
exports.$componentsarevalid = $componentsarevalid;
function $componentshavetime(c) {
    return c.hour > 0 || c.minute > 0 || c.second > 0;
}
exports.$componentshavetime = $componentshavetime;
function $parsetime(s) {
    if (!commons_1.$length(s)) {
        return null;
    }
    var m = s.match(/^\s*(\d{1,6})(\s*[:.]\s*(\d{1,2})(\s*[:.]\s*(\d{1,2}))?)?\s*$/);
    if (!commons_1.$ok(m)) {
        return null;
    }
    var res = m;
    var c = { hour: types_1.UINT_MIN, minute: types_1.UINT_MIN, second: types_1.UINT_MIN };
    _parseTime(c, res, 0, res.length);
    return tsdate_1.$timeisvalid(c.hour, c.minute, c.second) ? c : null;
}
exports.$parsetime = $parsetime;
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
function $parsedatetime(s, form) {
    if (form === void 0) {
        form = TSDateForm.Standard;
    }
    return _parsedt(s, /^\s*(\d{1,8})([/\-.](\d{1,2})([/\-.](\d{1,4})(\s+(\d{1,6})(\s*[:.]\s*(\d{1,2})(\s*[:.]\s*(\d{1,2}))?)?)?)?)?\s*$/, form);
}
exports.$parsedatetime = $parsedatetime;
function $parsedate(s, form) {
    if (form === void 0) {
        form = TSDateForm.Standard;
    }
    return _parsedt(s, /^\s*(\d{1,8})([/\-.](\d{1,2})([/\-.](\d{1,4}))?)?\s*$/, form, { noTime: true });
}
exports.$parsedate = $parsedate;
function $isostring2components(source, opts) {
    if (opts === void 0) {
        opts = {};
    }
    if (!commons_1.$length(source)) {
        return null;
    }
    var s = source;
    var m = opts.noTime ?
        s.match(/^\s*([0-9]{4})\-([0-1][0-9])\-([0-3][0-9])\s*$/)
        :
            (opts.acceptsGMT ?
                s.match(/^\s*([0-9]{4})\-([0-1][0-9])\-([0-3][0-9])([Tt]([0-1][0-9])(:([0-5][0-9])(:([0-5][0-9]))?)?([zZ]|\+00(:?00)?)?)?\s*$/) :
                s.match(/^\s*([0-9]{2, 4})\-([0-1][0-9])\-([0-3][0-9])([Tt]([0-1][0-9])(:([0-5][0-9])(:([0-5][0-9]))?)?)?\s*$/));
    if (!commons_1.$ok(m)) {
        return null;
    }
    var res = m;
    var l = res.length;
    var c = {
        year: _yearFrom(res[1]),
        month: commons_1.$unsigned(res[2]),
        day: commons_1.$unsigned(res[3]),
        hour: l > 5 ? commons_1.$unsigned(res[5]) : types_1.UINT_MIN,
        minute: l > 7 ? commons_1.$unsigned(res[7]) : types_1.UINT_MIN,
        second: l > 9 ? commons_1.$unsigned(res[9]) : types_1.UINT_MIN
    };
    return $componentsarevalid(c) ? c : null;
}
exports.$isostring2components = $isostring2components;
function $components2timestamp(c) {
    return tsdate_1.$timestamp(c.year, c.month, c.day, c.hour, c.minute, c.second);
}
exports.$components2timestamp = $components2timestamp;
function $components2date(c) {
    return new Date(c.year, c.month - 1, c.day, c.hour, c.minute, c.second, 0);
}
exports.$components2date = $components2date;
function $components2string(c, form) {
    if (form === void 0) {
        form = TSDateForm.Standard;
    }
    var timed = $componentshavetime(c);
    switch (form) {
        case TSDateForm.ISO8601:
            return _fpad4(c.year) + "-" + _fpad2(c.month) + "-" + _fpad2(c.day) + "T" + _fpad2(c.hour) + ":" + _fpad2(c.minute) + ":" + _fpad2(c.second);
        case TSDateForm.Standard:
            return timed ? _fpad2(c.day) + "/" + _fpad2(c.month) + "/" + _fpad4(c.year) + "-" + _fpad2(c.hour) + ":" + _fpad2(c.minute) + ":" + _fpad2(c.second)
                : _fpad2(c.day) + "/" + _fpad2(c.month) + "/" + _fpad4(c.year);
        case TSDateForm.English:
            return timed ? _fpad2(c.month) + "/" + _fpad2(c.day) + "/" + _fpad4(c.year) + "-" + _fpad2(c.hour) + ":" + _fpad2(c.minute) + ":" + _fpad2(c.second)
                : _fpad2(c.month) + "/" + _fpad2(c.day) + "/" + _fpad4(c.year);
        case TSDateForm.Computer:
            return timed ? _fpad4(c.year) + "/" + _fpad2(c.month) + "/" + _fpad4(c.day) + "-" + _fpad2(c.hour) + ":" + _fpad2(c.minute) + ":" + _fpad2(c.second)
                : _fpad4(c.year) + "/" + _fpad2(c.month) + "/" + _fpad4(c.day);
    }
}
exports.$components2string = $components2string;
//////////////////// private functions
// since IE does not support padStart() ...
function _fpad2(v) { return v >= 10 ? ('' + v) : ('0' + v); }
function _fpad4(v) { return v >= 1000 ? ('' + v) : (v >= 100 ? ('0' + v) : (v >= 10 ? ('00' + v) : ('000' + v))); }
function _yearFrom(ys) {
    var y = commons_1.$unsigned(ys);
    return ys.length > 2 ? y : _adjustYear(y);
}
/**
 * This function adjust the year entered with only 2 digits
 * follling the following rule :
 *  - each date which seems to be more than 20 years in the future is considered as a previous century date
 *  - each date which seems to be less than 20 years in the future is considered as a current century date
 */
function _adjustYear(y) {
    var currentYear = new Date().getFullYear();
    var century = commons_1.$div(currentYear, 100);
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
            var d = new Date();
            c.month = (d.getMonth() + 1);
            c.year = d.getFullYear();
        }
    }
}
function _parsedt(s, regexp, form, opts) {
    if (form === void 0) {
        form = TSDateForm.Standard;
    }
    if (opts === void 0) {
        opts = {};
    }
    if (form === TSDateForm.ISO8601) {
        return $isostring2components(s, opts);
    }
    if (!commons_1.$length(s)) {
        return null;
    }
    var m = s.match(regexp);
    if (!commons_1.$ok(m)) {
        return null;
    }
    var res = m;
    var l = res.length;
    var c = { year: types_1.UINT_MIN, month: types_1.UINT_MIN, day: types_1.UINT_MIN, hour: types_1.UINT_MIN, minute: types_1.UINT_MIN, second: types_1.UINT_MIN };
    switch (form) {
        case TSDateForm.Standard:
            var ds = commons_1.$unsigned(res[1]);
            if (l === 2) {
                if (ds >= 1010001) {
                    c.year = (ds % 10000);
                    c.month = commons_1.$div(ds % 1000000, 10000);
                    c.day = commons_1.$div(ds, 1000000);
                }
                else if (ds >= 10101) {
                    c.year = _adjustYear(ds % 100);
                    c.month = commons_1.$div(ds % 10000, 100);
                    c.day = commons_1.$div(ds, 10000);
                }
                else if (ds >= 101) {
                    c.month = (ds % 100);
                    c.day = commons_1.$div(ds, 100);
                    _completeWithToday(c);
                }
                else {
                    c.day = ds;
                    _completeWithToday(c);
                }
            }
            else {
                c.day = ds;
                c.month = commons_1.$unsigned(res[3]);
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
            var me = commons_1.$unsigned(res[1]);
            if (l === 2) {
                if (me >= 1010001) {
                    c.year = (me % 10000);
                    c.day = commons_1.$div(me % 1000000, 10000);
                    c.month = commons_1.$div(me, 1000000);
                }
                else if (me >= 10101) {
                    c.year = _adjustYear(me % 100);
                    c.day = commons_1.$div(me % 10000, 100);
                    c.month = commons_1.$div(me, 10000);
                }
                else if (me >= 101) {
                    c.day = (me % 100);
                    c.month = commons_1.$div(me, 100);
                }
            }
            else {
                c.month = me;
                c.day = commons_1.$unsigned(res[3]);
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
            var yc = commons_1.$unsigned(res[1]);
            if (l === 2) {
                if (res[1].length !== 8) {
                    return null;
                } // in computer form we need all the digits
                c.year = commons_1.$div(yc, 10000);
                c.month = (commons_1.$div(yc, 100) % 100);
                c.day = commons_1.$div(yc, 100);
            }
            else if (l >= 6) {
                c.year = yc;
                c.month = commons_1.$unsigned(res[3]);
                c.day = commons_1.$unsigned(res[5]);
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
    var v = commons_1.$unsigned(m[start + 1]);
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
                c.hour = commons_1.$div(v, 100);
                c.minute = (v % 100);
                break;
            case 5:
            case 6:
                c.hour = commons_1.$div(v, 10000);
                c.minute = (commons_1.$div(v, 100) % 100);
                c.second = (v % 100);
                break;
        }
    }
    else {
        c.hour = v;
        c.minute = commons_1.$unsigned(m[start + 2]);
        if (len > 4) {
            c.second = commons_1.$unsigned(m[start + 4]);
        }
    }
}
//# sourceMappingURL=tsdatecomp.js.map