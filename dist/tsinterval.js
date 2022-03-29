import { $isint, $jsonobj, $ok } from "./commons";
import { TSBadRange, TSRange } from "./tsrange";
import { TSDate } from "./tsdate";
import { Ascending, Descending, Same } from "./types";
import { TSCouple } from "./tscouple";
/************************************************
 *  WARNING: range conformance methods and containing
 *  and intersectionning methods do round dates to minutes
 ************************************************/
export class TSInterval extends TSCouple {
    static make(a, b) { return new TSInterval(a, b); }
    get start() { return $ok(this.first) ? this.first : new TSDate(TSDate.PAST); }
    get end() { return $ok(this.second) ? this.second : new TSDate(TSDate.FUTURE); }
    clone() { return new TSInterval(this.first, this.second); }
    get hasSignificantRange() {
        if ($ok(this.first) && $ok(this.second)) {
            const s = this.start.timestamp;
            const e = this.end.timestamp;
            return $isint(s) && $isint(e) && s < e;
        }
        return false;
    }
    get isValid() { return $ok(this.first); }
    get isEmpty() { return $ok(this.first) && $ok(this.second) && this.start.timestamp === this.end.timestamp; }
    get range() { return this.hasSignificantRange ? new TSRange(this.start, this.end) : TSBadRange(); }
    daysInterval() {
        if ($ok(this.first)) {
            if ($ok(this.second)) {
                let s = this.start.dateWithoutTime();
                if (this.isEmpty) {
                    return new TSInterval(s, s);
                }
                let e = this.end.dateWithoutTime();
                if (s.isEqual(e)) {
                    e = e.dateByAdding(0, 0, 1);
                }
                return new TSInterval(s, e);
            }
            return new TSInterval(this.start.dateWithoutTime(), null);
        }
        return $ok(this.second) ? new TSInterval(null, this.end.dateWithoutTime()) : new TSInterval(null, null);
    }
    hasSameRange(other) {
        return this.hasSignificantRange && other.hasSignificantRange && this.range.isEqual(other.range);
        // infinite intervals never have the same range
    }
    containsDate(aDate) {
        if (this.isEmpty) {
            return false;
        } // this is not an interval
        let loc = aDate.timestamp;
        if (this.hasSignificantRange) {
            return this.range.containsLocation(loc);
        }
        else if ($ok(this.first)) {
            return this.start.timestamp >= loc;
        }
        else if ($ok(this.second)) {
            return loc < this.end.timestamp;
        }
        return true; // a both way infinite interval always contains any date
    }
    intersects(other) {
        if (this.isEmpty || other.isEmpty) {
            return false;
        } // none of these objects is an interval
        else if (this.hasSignificantRange) {
            if (other.hasSignificantRange) {
                return this.range.intersects(other.range);
            }
            else if ($ok(other.first)) {
                return other.start.timestamp < this.end.timestamp;
            }
            else if ($ok(other.second)) {
                return other.end.timestamp > this.start.timestamp;
            }
            return true; // intersection with a both way infinite interval is always true
        }
        else if (other.hasSignificantRange) {
            return other.intersects(this);
        }
        else if ($ok(this.first)) {
            return $ok(other.second) ? other.end.timestamp > this.start.timestamp : true;
        }
        else if ($ok(this.second)) {
            return $ok(other.first) ? this.end.timestamp > other.start.timestamp : true;
        }
        return true; // intersection with a both way infinite interval is always true
    }
    contains(other) {
        if (this.isEmpty || other.isEmpty) {
            return false;
        } // none of these objects is an interval
        else if (this.hasSignificantRange) {
            return other.hasSignificantRange && this.range.contains(other.range);
        }
        else if ($ok(this.first)) {
            return $ok(other.first) && this.start.timestamp <= other.start.timestamp;
        }
        else if ($ok(this.second)) {
            return $ok(other.second) && other.end.timestamp <= this.end.timestamp;
        }
        return true; // a both ways infinite interval always contains any intervals
    }
    containedIn(other) { return other.contains(this); }
    continuousWith(other) {
        return (this.intersects(other) ||
            ($ok(this.end) && $ok(other.start) && this.end.isEqual(other.start)) ||
            ($ok(this.start) && $ok(other.end) && this.start.isEqual(other.end)));
    }
    compare(other) {
        if (this.isEqual(other)) {
            return Same;
        }
        if (other instanceof TSInterval) {
            if (this.hasSignificantRange) {
                if ($ok(other.first) && this.end.timestamp <= other.start.timestamp) {
                    return Ascending;
                }
                if ($ok(other.second) && other.end.timestamp <= this.start.timestamp) {
                    return Descending;
                }
            }
            else if (other.hasSignificantRange) {
                if ($ok(this.first) && other.end.timestamp <= this.start.timestamp) {
                    return Descending;
                }
                if ($ok(this.second) && this.end.timestamp <= other.start.timestamp) {
                    return Ascending;
                }
            }
            else if ($ok(this.first) && $ok(other.second) &&
                other.end.timestamp <= this.start.timestamp) {
                return Descending;
            }
            else if ($ok(this.second) && $ok(other.first) &&
                this.end.timestamp <= other.start.timestamp) {
                return Ascending;
            }
        }
        return undefined;
    }
    // ============ TSObject conformance =============== 
    isEqual(other) {
        if (this === other) {
            return true;
        }
        return (other instanceof TSInterval) &&
            (($ok(this.first) && this.first.isEqual(other.first)) || (!$ok(this.first) && !$ok(other.first))) &&
            (($ok(this.second) && this.second.isEqual(other.second)) || (!$ok(this.second) && !$ok(other.second)));
    }
    toJSON() { return { start: $jsonobj(this.first), end: $jsonobj(this.second) }; }
    toArray() { return [this]; } // should we not return one or two dates here ?
}
//# sourceMappingURL=tsinterval.js.map