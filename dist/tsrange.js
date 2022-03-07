import { $isnumber, $json } from "./commons";
import { TSDate } from "./tsdate";
import { Ascending, Descending, Same, UINT32_MAX } from "./types";
import { TSRangeSet } from "./tsrangeset";
export const TSNotFound = 0xffffffff;
export const UnsignedMask = 0xffffffff;
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
                let v;
                if (arguments[0] instanceof TSRange) {
                    v = arguments[0];
                }
                else {
                    const a = arguments[0];
                    if (!a.hasSignificantRange) {
                        this._location = TSNotFound;
                        this._length = 0;
                        break;
                    }
                    v = a.range;
                }
                this._location = v.location;
                this._length = v.length;
                break;
            case 2:
                if (arguments[0] instanceof TSDate && arguments[1] instanceof TSDate) {
                    // our TSDate range is always in minutes
                    let s = arguments[0].toRangeLocation();
                    let e = arguments[1].toRangeLocation();
                    if (e >= s) {
                        this.location = s;
                        this.length = e - s;
                    }
                    else {
                        throw 'Bad TSRange() constructor: second date is anterior to the first one';
                    }
                }
                else if ($isnumber(arguments[0]) && $isnumber(arguments[1])) {
                    this.location = arguments[0] & UnsignedMask;
                    this.length = arguments[1] & UnsignedMask;
                }
                else {
                    throw 'Bad TSRange() constructor: should have 2 TSDate or 2 numbers';
                }
                break;
            default:
                throw 'Bad TSRange() constructor: more than 2 arguments provided';
        }
    }
    get location() { return this._location; }
    set location(loc) {
        if (loc < 0 || loc + this._length > UINT32_MAX) {
            throw `TSRange set location(${loc}) bad parameter`;
        }
        this._location = loc & UnsignedMask;
    }
    get length() { return this._length; }
    set length(len) {
        if (len < 0 || len + this._location > UINT32_MAX) {
            throw `TSRange set length(${len}) bad parameter`;
        }
        this._length = len & UnsignedMask;
    }
    get isValid() { return this._location !== TSNotFound; }
    get isEmpty() { return this._length === 0; }
    get maxRange() { return this._location + this._length; }
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
        if (!this.isValid || this.isEmpty) {
            return false;
        }
        loc &= UnsignedMask;
        return loc >= this._location && loc < this.maxRange;
    }
    continuousWithRange(other) {
        return this.isValid && other.isValid &&
            (this.intersects(other) || this.maxRange === other.location || other.maxRange === this.location);
    }
    // ============ TSObject conformance =============== 
    get isa() { return this.constructor; }
    get className() { return this.constructor.name; }
    isEqual(other) {
        return this === other || (other instanceof TSRange && other.location === this._location && other.length === this._length);
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
export function TSBadRange() { return new TSRange(TSNotFound, 0); }
export function TSEmptyRange() { return new TSRange(0, 0); }
export function TSWidestRange() { return new TSRange(0, UINT32_MAX); }
//# sourceMappingURL=tsrange.js.map