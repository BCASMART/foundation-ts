import { $ok } from "./commons";
import { TSList } from "./tslist";
import { TSBadRange, TSRange } from "./tsrange";
import { Ascending, Descending, Same } from "./types";
export class TSRangeSet extends TSList {
    constructor(v) {
        super();
        if ($ok(v)) {
            if (v instanceof TSRangeSet) {
                v.forEach(r => super.add(r));
                return;
            }
            else if (typeof v === 'number') {
                v = new TSRange(v, 1);
            }
            else if (!(v instanceof TSRange)) {
                if (!v.hasSignificantRange)
                    throw 'new TSRangeSet() : invalid Interval parameter';
                v = v.range;
            }
            if (!v.hasSignificantRange)
                throw 'new TSRangeSet() : invalid TSRange parameter';
            this._addRange(v);
        }
    }
    get length() {
        let n = 0;
        this.forEach(r => n += r.length);
        return n;
    }
    // -------- forbid these super class methods ---------------
    insert(data, before) {
        throw `this<TSRangeSet>.insert(data:${data.toString()}${$ok(before) ? ', beforeANode' : ''}) is not available`;
    }
    add(data) {
        throw `this<TSRangeSet>.add(data:${data.toString()}) is not available`;
    }
    removeNode(node) {
        throw `this<TSRangeSet>.removeNode(${$ok(node) ? 'aNode' : ''}) is not available`;
    }
    // --------- interval protocol conformance -------------
    get hasSignificantRange() { return $ok(super.first); }
    get range() {
        if (this.hasSignificantRange) {
            const loc = super.first.data.location;
            return new TSRange(loc, super.last.data.maxRange - loc);
        }
        return TSBadRange();
    }
    get location() { return this.range.location; }
    get maxRange() { return this.range.maxRange; }
    clone() { return new TSRangeSet(this); }
    // here r must be a valid range
    _addRange(r) {
        let l = this.first;
        while (l !== null) {
            if (l.data.continuousWithRange(r)) {
                l.data = l.data.unionRange(r);
                while (l !== null && l.next !== null && l.data.continuousWithRange(l.next.data)) {
                    l.data = l.data.unionRange(l.next.data);
                    super.removeNode(l.next);
                }
                return;
            }
            else if (r.maxRange < l.data.location) {
                super.insert(r, l);
                return;
            }
            l = l.next;
        }
        super.add(r);
    }
    // here r must be a valid range
    _removeRange(r) {
        if (this.intersects(r)) {
            let l = this.first;
            while (l !== null && r.maxRange >= l.data.location) {
                const inter = r.intersectionRange(l.data);
                if (l.data.isEqual(inter)) {
                    let n = l.next;
                    super.removeNode(l);
                    l = n;
                }
                else {
                    if (!inter.isEmpty) {
                        if (inter.location > l.data.location) {
                            if (inter.maxRange < l.data.maxRange) {
                                const upRange = new TSRange(inter.maxRange, l.data.maxRange - inter.maxRange);
                                if (l.next)
                                    super.insert(upRange, l.next);
                                else
                                    super.add(upRange);
                            }
                            l.data.length = inter.location - l.data.location;
                        }
                        else if (inter.location == l.data.location) {
                            l.data = new TSRange(inter.maxRange, l.data.maxRange - inter.maxRange);
                        }
                    }
                    l = l.next;
                }
            }
        }
    }
    // here r must be a valid range
    _intersectRange(r) {
        if (this.hasSignificantRange) {
            if (this.range.intersects(r)) {
                let l = this.first;
                while (l && !l.data.intersects(r)) {
                    let n = l.next;
                    super.removeNode(l);
                    l = n;
                }
                let inter;
                while (l && (inter = r.intersectionRange(l.data)).length > 0) {
                    l.data = inter;
                    l = l.next;
                }
                while (l) {
                    let n = l.next;
                    super.removeNode(l);
                    l = n;
                }
            }
            else {
                this.clear();
            }
        }
    }
    contains(v) {
        if (!this.hasSignificantRange)
            return false;
        if (typeof v === 'number') {
            return this.contains(new TSRange(v, 1));
        }
        else if (v instanceof TSRange) {
            if (!v.hasSignificantRange)
                throw 'this<TSRangeSet>.contains() : invalid TSRange parameter';
            return $ok(this.search(r => r.contains(v)));
        }
        else if (v instanceof TSRangeSet) {
            if (!v.hasSignificantRange)
                throw 'this<TSRangeSet>.contains() : invalid TSRangeSet parameter';
            return this.range.contains(v.range) && !$ok(v.search(r => !this.contains(r)));
        }
        if (!v.hasSignificantRange)
            throw 'this<TSRangeSet>.contains() : invalid Interval parameter';
        return this.contains(v.range);
    }
    intersects(v) {
        if (!this.hasSignificantRange)
            return false;
        if (typeof v === 'number') {
            return this.intersects(new TSRange(v, 1));
        }
        else if (v instanceof TSRange) {
            if (!v.hasSignificantRange)
                throw 'this<TSRangeSet>.intersects() : invalid TSRange parameter';
            return $ok(this.search(r => r.intersects(v)));
        }
        else if (v instanceof TSRangeSet) {
            if (!v.hasSignificantRange)
                throw 'this<TSRangeSet>.intersects() : invalid TSRangeSet parameter';
            return this.range.intersects(v.range) && !$ok(v.search(r => !this.intersects(r)));
        }
        if (!v.hasSignificantRange)
            throw 'this<TSRangeSet>.intersects() : invalid Interval parameter';
        return this.intersects(v.range);
    }
    unionWidth(v) {
        if (typeof v === 'number') {
            this._addRange(new TSRange(v, 1));
        }
        else if (v instanceof TSRange) {
            if (!v.hasSignificantRange)
                throw 'this<TSRangeSet>.unionWidth() : invalid TSRange parameter';
            this._addRange(v);
        }
        else if (v instanceof TSRangeSet) {
            if (!v.hasSignificantRange)
                throw 'this<TSRangeSet>.unionWidth() : invalid TSRangeSet parameter';
            v.forEach(r => this._addRange(r));
        }
        if (!v.hasSignificantRange)
            throw 'TSRangeSet.unionWidth() : invalid Interval parameter';
        this._addRange(v.range);
    }
    substractFrom(v) {
        if (typeof v === 'number') {
            this._removeRange(new TSRange(v, 1));
        }
        else if (v instanceof TSRange) {
            if (!v.hasSignificantRange)
                throw 'TSRangeSet.substractFrom() : invalid TSRange parameter';
            this._removeRange(v);
        }
        else if (v instanceof TSRangeSet) {
            if (!v.hasSignificantRange)
                throw 'TSRangeSet.substractFrom() : invalid TSRangeSet parameter';
            v.forEach(r => this._removeRange(r));
        }
        if (!v.hasSignificantRange)
            throw 'TSRangeSet.substractFrom() : invalid Interval parameter';
        this._removeRange(v.range);
    }
    intersectWidth(v) {
        if (typeof v === 'number') {
            this._intersectRange(new TSRange(v, 1));
        }
        else if (v instanceof TSRange) {
            if (!v.hasSignificantRange)
                throw 'TSRangeSet.intersectWidth() : invalid TSRange parameter';
            this._intersectRange(v);
        }
        else if (v instanceof TSRangeSet) {
            if (!v.hasSignificantRange)
                throw 'TSRangeSet.intersectWidth() : invalid TSRangeSet parameter';
            v.forEach(r => this._intersectRange(r));
        }
        if (!v.hasSignificantRange)
            throw 'TSRangeSet.intersectWidth() : invalid Interval parameter';
        this._intersectRange(v.range);
    }
    union(v) {
        let ret = new TSRangeSet(this);
        ret.unionWidth(v);
        return ret;
    }
    intersection(v) {
        let ret = new TSRangeSet(this);
        ret.intersectWidth(v);
        return ret;
    }
    substraction(v) {
        let ret = new TSRangeSet(this);
        ret.substractFrom(v);
        return ret;
    }
    complement(v) {
        if (!this.hasSignificantRange) {
            if (!$ok(v))
                throw 'TSRangeSet.complement() : call with no parameter to an empty TSRangeSet';
            return new TSRangeSet(v);
        }
        if (!$ok(v)) {
            v = this.range;
        }
        else if (v instanceof TSRange) {
            if (!v.hasSignificantRange)
                throw 'TSRangeSet.complement() : invalid TSRange parameter';
        }
        else {
            if (!v.hasSignificantRange)
                throw 'TSRangeSet.complement() : invalid Interval parameter';
            v = v.range;
        }
        let ret = new TSRangeSet(v);
        ret.substractFrom(this);
        return ret;
    }
    // ============ TSObject conformance =============== 
    isEqual(other) {
        return this === other || (other instanceof TSRangeSet && super.isEqual(other));
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
}
//# sourceMappingURL=tsrangeset.js.map