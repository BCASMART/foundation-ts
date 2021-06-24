"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TSDate = exports.$daytimestamp = exports.$hourFromTimestamp = exports.$minuteFromTimestamp = exports.$secondFromTimestamp = exports.$dayFromTimestamp = exports.$timestamp = exports.$timeisvalid = exports.$dayisvalid = exports.$isleap = exports.TSSecsFrom19700101To20010101 = exports.TSDaysFrom00000229To20010101 = void 0;
/**
 * This is a timestamp (commencing at 01/01/2001) oriented date class
 */
var tsdatecomp_1 = require("./tsdatecomp");
var commons_1 = require("./commons");
var TSMinute = 60;
var TSHour = 3600;
var TSDay = 86400;
var TSWeek = 604800;
var TSDaysFrom00010101To20010101 = 730485;
var TSSecsFrom00010101To20010101 = 63113904000;
var TSDaysInMonth = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
var TSDaysInPreviousMonth = [0, 0, 0, 0, 31, 61, 92, 122, 153, 184, 214, 245, 275, 306, 337];
exports.TSDaysFrom00000229To20010101 = 730792;
exports.TSSecsFrom19700101To20010101 = 978307200; // this one is exported for conversion from EPOCH to TSDate
function $isleap(y) {
    return !commons_1.$isint(y) || y % 4 ? false : (y % 100 ? (y > 7 ? true : false) : (y % 400 || y < 1600 ? false : true));
}
exports.$isleap = $isleap;
function $dayisvalid(year, month, day) {
    if (!commons_1.$isint(day) || !commons_1.$isint(month) || !commons_1.$isint(year) || day < 1 || day > 31 || month < 1 || month > 12) {
        return false;
    }
    if (day > TSDaysInMonth[month]) {
        return (month === 2 && day === 29 && $isleap(year)) ? true : false;
    }
    return true;
}
exports.$dayisvalid = $dayisvalid;
function $timeisvalid(hour, minute, second) {
    return (commons_1.$isint(hour) && commons_1.$isint(minute) && commons_1.$isnumber(second) && hour >= 0 && hour < 24 && minute >= 0 && minute < 60 && second >= 0 && second < 60);
}
exports.$timeisvalid = $timeisvalid;
function $timestamp(year, month, day, hours, minutes, seconds) {
    if (hours === void 0) {
        hours = 0;
    }
    if (minutes === void 0) {
        minutes = 0;
    }
    if (seconds === void 0) {
        seconds = 0;
    }
    // TODO: verify the numbers here
    var leaps;
    month = 0 | month;
    if (month < 3) {
        month += 12;
        year--;
    }
    leaps = Math.floor(year / 4) - Math.floor(year / 100) + Math.floor(year / 400);
    return Math.floor((day + TSDaysInPreviousMonth[month] + 365 * year + leaps - exports.TSDaysFrom00000229To20010101) * TSDay) + hours * TSHour + minutes * TSMinute + seconds;
}
exports.$timestamp = $timestamp;
function $dayFromTimestamp(t) { return Math.floor($daytimestamp(t) / TSDay); }
exports.$dayFromTimestamp = $dayFromTimestamp;
function $secondFromTimestamp(t) { return ((t + TSSecsFrom00010101To20010101) % TSMinute); }
exports.$secondFromTimestamp = $secondFromTimestamp;
function $minuteFromTimestamp(t) { return commons_1.$div(Math.floor((t + TSSecsFrom00010101To20010101) % TSHour), TSMinute); }
exports.$minuteFromTimestamp = $minuteFromTimestamp;
function $hourFromTimestamp(t) { return commons_1.$div(Math.floor((t + TSSecsFrom00010101To20010101) % TSDay), TSHour); }
exports.$hourFromTimestamp = $hourFromTimestamp;
function $daytimestamp(ts) { return Math.floor(ts - _timeFromTimestamp(ts)); }
exports.$daytimestamp = $daytimestamp;
var TSDate = /** @class */ (function () {
    function TSDate() {
        var n = arguments.length;
        if (n >= 3) {
            if (!$dayisvalid(arguments[0], arguments[1], arguments[2])) {
                throw "Bad TSDate() day arguments";
            }
            if (n !== 3 && n !== 6) {
                throw "Impossible to initialize a new TSDate() with " + n + " arguments";
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
            var t = arguments[0]; // undefined if n === 0
            if (commons_1.$isnumber(t)) {
                this.timestamp = t;
            }
            else if (t instanceof TSDate) {
                this.timestamp = t.timestamp;
            }
            else {
                var comps = null;
                if (commons_1.$isstring(t)) {
                    comps = tsdatecomp_1.$isostring2components(t);
                }
                else if (!commons_1.$ok(t) || t instanceof Date) {
                    comps = tsdatecomp_1.$components(t);
                }
                if (!commons_1.$ok(comps)) {
                    throw "Bad TSDate constructor parameters";
                }
                this.timestamp = tsdatecomp_1.$components2timestamp(comps);
            }
        }
    }
    // usage TSDate.fromComponents(myComponents)
    // if you only want to set a day, that's up to you to put 0 in hour, minute and second fields
    TSDate.fromComponents = function (comp) {
        if (!tsdatecomp_1.$componentsarevalid(comp)) {
            return null;
        }
        var c = comp;
        // we use the timestamp constructor because we know that our date is valid
        return new TSDate($timestamp(c.year, c.month, c.day, c.hour, c.minute, c.second));
    };
    // usage TSDate.fromString(aString[, parsing form])
    TSDate.fromString = function (s, form) {
        if (form === void 0) {
            form = tsdatecomp_1.TSDateForm.Standard;
        }
        return this.fromComponents(tsdatecomp_1.$parsedatetime(s, form));
    };
    // usage TSDate.fromDateString(aString[, parsing form]).
    // this function only parse day date string (no time should be included in the string)
    TSDate.fromDateString = function (s, form) {
        if (form === void 0) {
            form = tsdatecomp_1.TSDateForm.Standard;
        }
        return this.fromComponents(tsdatecomp_1.$parsedate(s, form));
    };
    // ================= instance methods ========================
    TSDate.prototype.isEqual = function (other) { return other instanceof TSDate && other.timestamp === this.timestamp; };
    TSDate.prototype.isLeap = function () { return $isleap(tsdatecomp_1.$components(this.timestamp).year); };
    TSDate.prototype.dateWithoutTime = function () { return new TSDate($daytimestamp(this.timestamp)); };
    TSDate.prototype.year = function () { return tsdatecomp_1.$components(this.timestamp).year; };
    TSDate.prototype.month = function () { return tsdatecomp_1.$components(this.timestamp).month; };
    TSDate.prototype.day = function () { return tsdatecomp_1.$components(this.timestamp).day; };
    TSDate.prototype.hour = function () { return $hourFromTimestamp(this.timestamp); };
    TSDate.prototype.minute = function () { return $minuteFromTimestamp(this.timestamp); };
    TSDate.prototype.second = function () { return $secondFromTimestamp(this.timestamp); };
    TSDate.prototype.week = function (offset) {
        if (offset === void 0) {
            offset = 0;
        }
        var c = tsdatecomp_1.$components(this.timestamp);
        offset %= 7;
        var ref = _yearReference(c.year, offset);
        if (this.timestamp < ref) {
            ref = _yearReference(c.year - 1, offset);
        }
        var week = Math.floor((this.timestamp - ref) / TSWeek) + 1;
        if (week === 53) {
            ref += 52 * TSWeek;
            c = tsdatecomp_1.$components(ref);
            if (c.day >= 29) {
                week = 1;
            }
        }
        return week;
    };
    TSDate.prototype.dayOfYear = function () {
        return Math.floor((this.timestamp - $timestamp(tsdatecomp_1.$components(this.timestamp).year, 1, 1)) / TSDay) + 1;
    };
    TSDate.prototype.dayOfWeek = function (offset) {
        if (offset === void 0) {
            offset = 0;
        }
        return _dayOfWeekFromTimestamp(this.timestamp, offset);
    };
    TSDate.prototype.lastDayOfMonth = function () { var c = tsdatecomp_1.$components(this.timestamp); return _lastDayOfMonth(c.year, c.month); };
    TSDate.prototype.dateByAdding = function (years, months, days, hours, minutes, seconds) {
        if (months === void 0) {
            months = 0;
        }
        if (days === void 0) {
            days = 0;
        }
        if (hours === void 0) {
            hours = 0;
        }
        if (minutes === void 0) {
            minutes = 0;
        }
        if (seconds === void 0) {
            seconds = 0;
        }
        if (!years && !months) {
            return new TSDate(this.timestamp + days * TSDay + hours * TSHour + minutes * TSMinute + seconds);
        }
        var c = tsdatecomp_1.$components(this.timestamp);
        _addym(c, years, months);
        return new TSDate(c.year, c.month, c.day, c.hour, c.minute, c.second);
    };
    TSDate.prototype.dateByAddingWeeks = function (weeks) { return new TSDate(this.timestamp + weeks * TSWeek); };
    TSDate.prototype.dateByAddingTime = function (time) { return new TSDate(this.timestamp + time); };
    TSDate.prototype.firstDateOfYear = function () { var c = tsdatecomp_1.$components(this.timestamp); return new TSDate(c.year, 1, 1); };
    TSDate.prototype.lastDateOfYear = function () { var c = tsdatecomp_1.$components(this.timestamp); return new TSDate(c.year, 12, 31); };
    TSDate.prototype.firstDateOfMonth = function () { var c = tsdatecomp_1.$components(this.timestamp); return new TSDate(c.year, c.month, 1); };
    TSDate.prototype.lastDateOfMonth = function () { var c = tsdatecomp_1.$components(this.timestamp); return new TSDate(c.year, c.month, _lastDayOfMonth(c.year, c.month)); };
    TSDate.prototype.firstDateOfWeek = function (offset) {
        if (offset === void 0) {
            offset = 0;
        }
        var ts = $daytimestamp(this.timestamp);
        var dayOfWeek = _dayOfWeekFromTimestamp(ts, offset);
        return new TSDate(ts - dayOfWeek * TSDay);
    };
    ;
    TSDate.prototype.daysSinceDate = function (aDate) {
        return commons_1.$div($daytimestamp(this.timestamp) - $daytimestamp(aDate.timestamp), TSDay);
    };
    TSDate.prototype.toNumber = function () { return this.timestamp; };
    TSDate.prototype.toComponents = function () { return tsdatecomp_1.$components(this.timestamp); };
    TSDate.prototype.toEpochTimestamp = function () { return this.timestamp + exports.TSSecsFrom19700101To20010101; };
    TSDate.prototype.toDate = function () {
        return tsdatecomp_1.$components2date(tsdatecomp_1.$components(this.timestamp));
    };
    TSDate.prototype.toIsoString = function () { return tsdatecomp_1.$components2string(tsdatecomp_1.$components(this.timestamp), tsdatecomp_1.TSDateForm.ISO8601); };
    TSDate.prototype.toString = function (form) {
        if (form === void 0) {
            form = tsdatecomp_1.TSDateForm.Standard;
        }
        return tsdatecomp_1.$components2string(tsdatecomp_1.$components(this.timestamp), form);
    };
    TSDate.prototype.toJSON = function () { return tsdatecomp_1.$components2string(tsdatecomp_1.$components(this.timestamp), tsdatecomp_1.TSDateForm.ISO8601); };
    return TSDate;
}());
exports.TSDate = TSDate;
function _timeFromTimestamp(t) { return ((t + TSSecsFrom00010101To20010101) % TSDay); }
function _dayOfWeekFromTimestamp(t, offset) {
    if (offset === void 0) {
        offset = 0;
    }
    return ($dayFromTimestamp(t) + TSDaysFrom00010101To20010101 + 7 - (offset % 7)) % 7;
}
function _lastDayOfMonth(year, month) {
    return (month === 2 && $isleap(year)) ? 29 : TSDaysInMonth[month];
}
function _yearReference(y, offset) {
    if (offset === void 0) {
        offset = 0;
    }
    var firstDayOfYear = $timestamp(y, 1, 1);
    var d = _dayOfWeekFromTimestamp(firstDayOfYear, offset);
    d = (d <= 3 ? -d : 7 - d);
    return firstDayOfYear + d * TSDay;
}
function _addym(c, years, months) {
    if (months === void 0) {
        months = 0;
    }
    years += months / 12;
    months = (months < 0 ? -((-months) % 12) : months % 12);
    var newYear = c.year + years;
    var newMonth = c.month + months;
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