import { $count, $isarray, $isnumber, $ok } from "./commons";
import { TSList } from "./tslist";
import { $comformsToInterval, TSBadRange, TSRange } from "./tsrange";
import { Ascending, Descending, Same } from "./types";
export class TSRangeSet extends TSList {
    constructor(v) {
        super();
        if ($ok(v)) {
            if (v instanceof TSRangeSet) {
                v.forEach(r => super.add(r));
                return;
            }
            if (!$isarray(v)) {
                if ($isnumber(v)) {
                    v = [new TSRange(v, 1)];
                }
                else if ((v instanceof TSRange) || $comformsToInterval(v)) {
                    v = [v];
                }
                else {
                    throw 'new TSRangeSet(): invalid parameter';
                }
            }
            let u = v;
            let tmp = [];
            if ($count(u) === 2 && $isnumber(u[0]) && $isnumber(u[1])) {
                const r = TSRange.fromArray(u);
                if ($ok(r)) {
                    u = [r];
                }
                else {
                    throw 'new TSRangeSet(): invalid range as array parameter';
                }
            }
            for (let e of u) {
                let r = undefined;
                if (e instanceof TSRange) {
                    r = e;
                }
                else if ($isarray(e)) {
                    r = TSRange.fromArray(e);
                }
                else if ($comformsToInterval(e) && e.hasSignificantRange) {
                    r = e.range;
                }
                if (!$ok(r)) {
                    throw 'new TSRangeSet(): invalid array parameter';
                }
                else if (!r.hasSignificantRange) {
                    throw 'new TSRangeSet() : invalid TSRange parameter';
                }
                else {
                    tmp.push(r);
                }
            }
            for (let r of tmp) {
                this._addRange(r);
            }
        }
    }
    get length() {
        let n = 0;
        this.forEach(r => n += r.length);
        return n;
    }
    // -------- forbid these super class methods ---------------
    /*
        // THIS 3 METHOD CANNOT BE OVERWRITTEN. JUST DON'T USE THEM.


    public insert(data:TSRange, before?:TSListNode<TSRange>):TSListNode<TSRange> {
        throw `this<TSRangeSet>.insert(data:${data.toString()}${$ok(before)?', beforeANode':''}) is not available` ;
    }
    public add(data:TSRange):TSListNode<TSRange> {
        throw `this<TSRangeSet>.add(data:${data.toString()}) is not available` ;
    }
    public removeNode(node:TSListNode<TSRange>)
    {
        throw `this<TSRangeSet>.removeNode(${$ok(node)?'aNode':''}) is not available` ;
    }
    */
    // --------- interval protocol conformance -------------
    get hasSignificantRange() { return $ok(super.first); }
    get range() {
        if (this.hasSignificantRange) {
            const loc = super.first.data.location;
            return new TSRange(loc, super.last.data.maxRange - loc);
        }
        return TSBadRange();
    }
    get location() { return $ok(super.first) ? super.first.data.location : NaN; }
    get maxRange() { return $ok(super.first) ? super.last.data.maxRange : NaN; }
    clone() { return new TSRangeSet(this); }
    // here r must be a valid range
    _addRange(r) {
        let l = this.first;
        while (l !== null) {
            if (l.data.continuousWith(r)) {
                l.data = l.data.unionRange(r);
                while (l !== null && l.next !== null && l.data.continuousWith(l.next.data)) {
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
        else if ($isarray(v)) {
            const rs = TSRange.fromArray(v);
            if (!$ok(rs) || !(rs === null || rs === void 0 ? void 0 : rs.hasSignificantRange)) {
                throw 'this<TSRangeSet>.contains() : invalid range array parameter';
            }
            return $ok(this.search(r => r.contains(rs)));
        }
        else if (v instanceof TSRange) {
            if (!v.hasSignificantRange) {
                throw 'this<TSRangeSet>.contains() : invalid TSRange parameter';
            }
            return $ok(this.search(r => r.contains(v)));
        }
        else if (v instanceof TSRangeSet) {
            if (!v.hasSignificantRange) {
                throw 'this<TSRangeSet>.contains() : invalid TSRangeSet parameter';
            }
            return this.range.contains(v.range) && !$ok(v.search(r => !this.contains(r)));
        }
        if (!$comformsToInterval(v) || !v.hasSignificantRange) {
            throw 'this<TSRangeSet>.contains() : invalid Interval parameter';
        }
        return this.contains(v.range);
    }
    intersects(v) {
        if (!this.hasSignificantRange)
            return false;
        if (typeof v === 'number') {
            return this.intersects(new TSRange(v, 1));
        }
        else if ($isarray(v)) {
            const rs = TSRange.fromArray(v);
            if (!$ok(rs) || !(rs === null || rs === void 0 ? void 0 : rs.hasSignificantRange)) {
                throw 'this<TSRangeSet>.intersects() : invalid range array parameter';
            }
            return $ok(this.search(r => r.intersects(rs)));
        }
        else if (v instanceof TSRange) {
            if (!v.hasSignificantRange) {
                throw 'this<TSRangeSet>.intersects() : invalid TSRange parameter';
            }
            return $ok(this.search(r => r.intersects(v)));
        }
        else if (v instanceof TSRangeSet) {
            if (!v.hasSignificantRange) {
                throw 'this<TSRangeSet>.intersects() : invalid TSRangeSet parameter';
            }
            return this.range.intersects(v.range) && !$ok(v.search(r => !this.intersects(r)));
        }
        if (!$comformsToInterval(v) || !v.hasSignificantRange) {
            throw 'this<TSRangeSet>.intersects() : invalid Interval parameter';
        }
        return this.intersects(v.range);
    }
    unionWidth(v) {
        if (typeof v === 'number') {
            this._addRange(new TSRange(v, 1));
        }
        else if ($isarray(v)) {
            const r = TSRange.fromArray(v);
            if (!$ok(r) || !(r === null || r === void 0 ? void 0 : r.hasSignificantRange)) {
                throw 'this<TSRangeSet>.unionWidth() : invalid range array parameter';
            }
            this._addRange(r);
        }
        else if (v instanceof TSRange) {
            if (!v.hasSignificantRange) {
                throw 'this<TSRangeSet>.unionWidth() : invalid TSRange parameter';
            }
            this._addRange(v);
        }
        else if (v instanceof TSRangeSet) {
            if (!v.hasSignificantRange) {
                throw 'this<TSRangeSet>.unionWidth() : invalid TSRangeSet parameter';
            }
            v.forEach(r => this._addRange(r));
        }
        else {
            if (!$comformsToInterval(v) || !v.hasSignificantRange) {
                throw 'this<TSRangeSet>.unionWidth() : invalid Interval parameter';
            }
            this._addRange(v.range);
        }
    }
    substractFrom(v) {
        if (typeof v === 'number') {
            this._removeRange(new TSRange(v, 1));
        }
        else if ($isarray(v)) {
            const r = TSRange.fromArray(v);
            if (!$ok(r) || !(r === null || r === void 0 ? void 0 : r.hasSignificantRange)) {
                throw 'this<TSRangeSet>.substractFrom() : invalid range array parameter';
            }
            this._removeRange(r);
        }
        else if (v instanceof TSRange) {
            if (!v.hasSignificantRange) {
                throw 'this<TSRangeSet>.substractFrom() : invalid TSRange parameter';
            }
            this._removeRange(v);
        }
        else if (v instanceof TSRangeSet) {
            if (!v.hasSignificantRange) {
                throw 'this<TSRangeSet>.substractFrom() : invalid TSRangeSet parameter';
            }
            v.forEach(r => this._removeRange(r));
        }
        else {
            if (!$comformsToInterval(v) || !v.hasSignificantRange) {
                throw 'this<TSRangeSet>.substractFrom() : invalid Interval parameter';
            }
            this._removeRange(v.range);
        }
    }
    intersectWidth(v) {
        if (typeof v === 'number') {
            this._intersectRange(new TSRange(v, 1));
        }
        else if ($isarray(v)) {
            const r = TSRange.fromArray(v);
            if (!$ok(r) || !(r === null || r === void 0 ? void 0 : r.hasSignificantRange)) {
                throw 'this<TSRangeSet>.intersectWidth() : invalid range array parameter';
            }
            this._intersectRange(r);
        }
        else if (v instanceof TSRange) {
            if (!v.hasSignificantRange) {
                throw 'this<TSRangeSet>.intersectWidth() : invalid TSRange parameter';
            }
            this._intersectRange(v);
        }
        else if (v instanceof TSRangeSet) {
            if (!v.hasSignificantRange) {
                throw 'this<TSRangeSet>.intersectWidth() : invalid TSRangeSet parameter';
            }
            v.forEach(r => this._intersectRange(r));
        }
        else {
            if (!$comformsToInterval(v) || !v.hasSignificantRange) {
                throw 'this<TSRangeSet>.intersectWidth() : invalid Interval parameter';
            }
            this._intersectRange(v.range);
        }
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
            if (!$ok(v)) {
                throw 'this<TSRangeSet>.complement() : call with no parameter to an empty TSRangeSet';
            }
            return new TSRangeSet(v);
        }
        if (!$ok(v)) {
            v = this.range;
        }
        else if ($isarray(v)) {
            const r = TSRange.fromArray(v);
            if (!$ok(r) || !(r === null || r === void 0 ? void 0 : r.hasSignificantRange)) {
                throw 'this<TSRangeSet>.complement() : invalid range array parameter';
            }
            v = r;
        }
        else if (v instanceof TSRange) {
            if (!v.hasSignificantRange) {
                throw 'this<TSRangeSet>.complement() : invalid TSRange parameter';
            }
        }
        else {
            if (!$comformsToInterval(v) || !v.hasSignificantRange) {
                throw 'this<TSRangeSet>.complement() : invalid Interval parameter';
            }
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