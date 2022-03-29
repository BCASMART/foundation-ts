import { $count, $int, $isarray, $isint, $isnumber, $isobject, $isunsigned, $json, $ok, $unsigned } from "./commons";
import { TSDate } from "./tsdate";
import { Ascending, Descending, Same, UINT32_MAX } from "./types";
import { TSRangeSet } from "./tsrangeset";
export class TSRange {
    constructor() {
        this._location = 0;
        this._length = 0;
        const n = arguments.length;
        switch (n) {
            case 0:
                throw 'Bad TSRange() constructor: no arguments provided';
            case 1:
                if ($isnumber(arguments[0])) {
                    throw 'Bad TSRange() constructor: only location is provided';
                }
                let v = undefined;
                if (arguments[0] instanceof TSRange) {
                    v = arguments[0];
                }
                else if ($isarray(arguments[0])) {
                    const a = arguments[0];
                    if (!$israngearray(a)) {
                        throw 'Bad TSRange() constructor: non conforme range array';
                    }
                    this._location = a[0];
                    this._length = a[1];
                    break;
                }
                else if ($comformsToInterval(arguments[0])) {
                    const a = arguments[0];
                    if (!a.hasSignificantRange) {
                        this._location = NaN;
                        this._length = 0;
                        break;
                    }
                    v = a.range;
                }
                if (!$ok(v) || !$isint(v.location) || !$isunsigned(v.length) || !$isint(v.location + v.length)) {
                    throw 'Bad TSRange() constructor: range or interval provided too large';
                }
                this._location = v.location;
                this._length = v.length;
                break;
            case 2:
                if ((arguments[0] instanceof TSDate) && (arguments[1] instanceof TSDate)) {
                    // our TSDate range is always in minutes
                    let s = arguments[0].timestamp;
                    let e = arguments[1].timestamp;
                    if ($isint(s) && $isint(e) && e >= s) {
                        this._location = s;
                        this._length = e - s;
                    }
                    else {
                        throw 'Bad TSRange() constructor: second date is anterior to the first one';
                    }
                }
                else if (isNaN(arguments[0]) || isNaN(arguments[1])) {
                    this._location = NaN;
                    this._length = 0;
                }
                else if ($isint(arguments[0]) && $isunsigned(arguments[1]) && $isint(arguments[0] + arguments[1])) {
                    this._location = $int(arguments[0]);
                    this._length = $unsigned(arguments[1]);
                }
                else {
                    throw 'Bad TSRange() constructor: should have 2 valid and in range TSDate or numbers';
                }
                break;
            default:
                throw 'Bad TSRange() constructor: more than 2 arguments provided';
        }
    }
    static make(loc, len) { return new TSRange(loc, len); }
    static fromArray(a) {
        return $israngearray(a) ? new TSRange(a[0], a[1]) : null;
    }
    clone() { return new TSRange(this); }
    get location() { return this._location; }
    set location(loc) {
        if (isNaN(loc)) {
            this._location = NaN;
            this._length = 0;
        }
        else {
            if (!$isint(loc) || !$isint(loc + this._length)) {
                throw `TSRange set location(${loc}) bad parameter`;
            }
            this._location = $int(loc);
        }
    }
    get length() { return this._length; }
    set length(len) {
        if (isNaN(len)) {
            this._location = NaN;
            this._length = 0;
        }
        else {
            if (!$isunsigned(len) || !$isint(len + this._location)) {
                throw `TSRange set length(${len}) bad parameter`;
            }
            this._length = $unsigned(len);
        }
    }
    get isValid() { return !isNaN(this._location); }
    get isEmpty() { return this._length === 0; }
    get maxRange() { return isNaN(this._location) ? NaN : this._location + this._length; }
    // Interval meta conformance
    get range() { return this; }
    get hasSignificantRange() { return this.isValid && !this.isEmpty; }
    contains(other) {
        if (!this.isValid || this.isEmpty) {
            return false;
        }
        if (other instanceof TSRange) {
            return this.containsLocation(other.location) && (other.isEmpty || this.containsLocation(other.location + other.length - 1));
        }
        return this.containsLocation(other);
    }
    intersects(other) {
        return this.isValid && other.isValid && !this.isEmpty && !other.isEmpty &&
            (this.containsLocation(other.location) || other.containsLocation(this.location));
    }
    containedIn(other) { return other.contains(this); }
    unionRange(other) {
        if (!this.isValid || !other.isValid)
            return TSBadRange();
        if (this.isEmpty && other.isEmpty)
            return TSEmptyRange();
        const loc = Math.min(this.location, other.location);
        return new TSRange(loc, Math.max(this.maxRange, other.maxRange) - loc);
    }
    intersectionRange(other) {
        if (!this.isValid || !other.isValid)
            return TSBadRange();
        if (this.maxRange < other.location || other.maxRange < this.location)
            return TSEmptyRange();
        const loc = Math.max(this.location, other.location);
        return new TSRange(loc, Math.min(this.maxRange, other.maxRange) - loc);
    }
    containsLocation(loc) {
        if (!$isnumber(loc) || !this.isValid || this.isEmpty) {
            return false;
        }
        return loc >= this._location && loc < this.maxRange;
    }
    continuousWith(other) {
        return this.isValid && other.isValid &&
            (this.intersects(other) || this.maxRange === other.location || other.maxRange === this.location);
    }
    // ============ TSObject conformance =============== 
    get isa() { return this.constructor; }
    get className() { return this.constructor.name; }
    isEqual(other) {
        return this === other || (other instanceof TSRange && ((!this.isValid && !other.isValid) || other.location === this._location) && other.length === this._length);
    }
    compare(other) {
        if (this.isEqual(other)) {
            return Same;
        }
        if ((other instanceof TSRange || other instanceof TSRangeSet) && this.hasSignificantRange && other.hasSignificantRange) {
            if (this.location >= other.maxRange) {
                return Descending;
            }
            if (other.location >= this.maxRange) {
                return Ascending;
            }
        }
        return undefined;
    }
    toJSON() { return { location: this._location, length: this._length }; }
    toString() { return $json(this); }
    toArray() { return [this]; }
}
export function $israngeparams(loc, len) {
    return $isint(loc) && $isunsigned(len) && $isint(loc + len);
}
export function $israngearray(v) {
    return $count(v) === 2 && $israngeparams(v[0], v[1]);
}
export function $comformsToInterval(v) {
    return $ok(v) && $isobject(v) && ('range' in v) && ('hasSignificantRange' in v);
}
export function TSBadRange() { return new TSRange(NaN, 0); }
export function TSEmptyRange() { return new TSRange(0, 0); }
export function TSWidestRange() { return new TSRange(0, UINT32_MAX); }
//# sourceMappingURL=tsrange.js.map