import { $count, $isarray, $isnumber, $ok } from "./commons";
import { TSError } from "./tserrors";
import { TSList, TSListConstructor, TSListNode } from "./tslist";
import { $comformsToInterval, Interval, TSBadRange, TSRange } from "./tsrange";
import { Ascending, Comparison, Descending, Nullable, Same } from "./types";

export type RangesLike = number|TSRange|Interval|TSRangeSet|number[] ;

type trrs = TSRange|number|Interval|Array<number> ;
type trrsa = Array<trrs> ;
export class TSRangeSet extends TSList<TSRange> implements Interval {

	public constructor(v?:Nullable<TSRangeSet|trrs|trrsa>) {
		super() ;
		if ($ok(v)) {
			if (v instanceof TSRangeSet) {
				// clone the ranges: _removeRange() mutates node data in place, so a
				// set built from another (clone(), union(), substraction(), …) must
				// not share TSRange instances with its source.
				v.forEach(r => super.add(r.clone())) ; // super here is just like this. This is JS at its best OOD.
				return ;
			}
            // all ranges are validated before the first one is added. Then they are sorted
            // and merged in one pass (adding them one by one was quadratic)
            this._appendRanges(_sortedRangesMerge(_rangesFromArray(_rangeSetArgumentsArray(v!)).sort((a, b) => a.location - b.location))) ;
		}
	}

	public override get length():number { 
		let n:number = 0 ;
		this.forEach(r => n += r.length) ;
		return n ;
	}

	// -------- forbid these super class methods ---------------
   
    /*
        // THIS 3 METHOD CANNOT BE OVERWRITTEN. JUST DON'T USE THEM.

	    public insert(data:TSRange, before?:TSListNode<TSRange>):TSListNode<TSRange> ;
	    public add(data:TSRange):TSListNode<TSRange> :
	    public removeNode(node:TSListNode<TSRange>) ;
    */

	// --------- interval protocol conformance -------------
	public get hasSignificantRange():boolean { return $ok(this.first) ; } 
	public get range():TSRange {
		if (this.hasSignificantRange) {
			const loc = this.first!.data.location ;
			return new TSRange(loc, this.last!.data.maxRange - loc) ; // super here is just like this. This is JS at its best OOD. 
		}
		return TSBadRange() ;
	}

    // an empty set has no location: its range is TSBadRange(), so it is not valid (and it is empty),
    // like the intersection of two disjoint ranges given by TSRange.intersectionRange()
    public get isValid():boolean { return this.range.isValid ; }
	public get isEmpty():boolean { return this.range.isEmpty ; }

	public get location():number { return $ok(this.first) ? this.first!.data.location : Number.NaN ; }
	public get maxRange():number { return $ok(this.first) ? this.last!.data.maxRange : Number.NaN ; }

	public clone():TSRangeSet { return new TSRangeSet(this) ; }

	// appends to the set new TSRange instances, already sorted, disjoint and not touching
	private _appendRanges(ranges:TSRange[]):void {
		for (const r of ranges) { super.add(r) ; } // super here is just like this. This is JS at its best OOD.
	}

	// here r must be a valid range
	private _addRange(r:TSRange):void {
		let l = this.first ;
		while(l !== null) {
			if (l.data.continuousWith(r)) {
				l.data = l.data.unionRange(r) ;
				while(l?.next !== null && l.data.continuousWith(l.next.data)) {
					l.data = l.data.unionRange(l.next.data) ;
					super.removeNode(l.next) ; // super here is just like this. This is JS at its best OOD.
				}
				return ;
			}
			else if (r.maxRange < l.data.location) {
				super.insert(r.clone(), l) ; // never stores the caller's range, which _removeRange() may modify
				return ;
			}
			l = l.next ;
		}
		super.add(r.clone()) ; // never stores the caller's range, which _removeRange() may modify
	}

	// here r must be a valid range
	private _removeRange(r:TSRange):void {
		if (!this.intersects(r)) { return ; }
		let l = this.first ;
		while (l !== null && r.maxRange >= l.data.location) {
			const inter = r.intersectionRange(l.data) ;
			if (l.data.isEqual(inter)) {
				const n = l.next ;
				super.removeNode(l) ; // super here is just like this. This is JS at its best OOD.
				l = n ;
			}
			else {
				if (!inter.isEmpty) { this._removeIntersection(l, inter) ; }
				l = l.next ;
			}
		}
	}

	// removes inter (a non empty part of l.data but not all of it) from node l
	private _removeIntersection(l:TSListNode<TSRange>, inter:TSRange):void {
		if (inter.location > l.data.location) {
			if (inter.maxRange < l.data.maxRange) {
				const upRange = new TSRange(inter.maxRange, l.data.maxRange - inter.maxRange) ;
				if (l.next) { super.insert(upRange, l.next) ; } // super here is just like this. This is JS at its best OOD.
				else { super.add(upRange) ; } // super here is just like this. This is JS at its best OOD.
			}
			l.data.length = inter.location - l.data.location ;
		}
		else if (inter.location === l.data.location) {
			l.data = new TSRange(inter.maxRange, l.data.maxRange - inter.maxRange) ;
		}
	}

	// here r must be a valid range
	private _intersectRange(r:TSRange):void {
		if (this.hasSignificantRange) {
			if (this.range.intersects(r)) {
				let l = this.first ;
				while (l && !l.data.intersects(r)) { let n = l.next ; super.removeNode(l) ; l = n ; } // super here is just like this. This is JS at its best OOD.
				let inter:TSRange ;
				while (l && (inter = r.intersectionRange(l.data)).length > 0) { // NOSONAR: intentional loop with assignment inside condition
					l.data = inter ;
					l = l.next ;
				}
				while (l) { let n = l.next ; super.removeNode(l) ; l = n ; } // super here is just like this. This is JS at its best OOD.
			}
			else {
				this.clear() ;
			}
		}
	}

	// intersects the set with the union of the ranges of s (s may be this)
	private _intersectRangeSet(s:TSRangeSet):void {
		const inters = _sortedRangesIntersection([...this], [...s]) ;
		this.clear() ;
		// the intersections are new TSRange instances, already sorted, disjoint and not touching
		inters.forEach(r => super.add(r)) ; // super here is just like this. This is JS at its best OOD.
	}

	// Like TSRange: a number is a location, an empty range is a location (a point) and an invalid
	// range or an empty set has no location. Only an argument of a wrong type throws.
	public containsLocation(loc:number):boolean {
		return $isnumber(loc) && $ok(this.search(r => r.containsLocation(loc))) ;
	}

	public contains(v:RangesLike):boolean {
		const op = _operand(v, 'contains') ;
		if (!this.hasSignificantRange) { return false ; }
		if (typeof op === 'number') { return this.containsLocation(op) ; }
		if (op instanceof TSRangeSet) {
			return op.hasSignificantRange && this.range.contains(op.range) && _sortedRangesContain([...this], [...op]) ;
		}
		if (!op.isValid) { return false ; }
		if (op.isEmpty) { return this.containsLocation(op.location) ; } // an empty range is contained if its location is
		return $ok(this.search(r => r.contains(op))) ;
	}

	public intersects(v:RangesLike):boolean {
		const op = _operand(v, 'intersects') ;
		if (!this.hasSignificantRange) { return false ; }
		if (typeof op === 'number') { return this.containsLocation(op) ; }
		if (op instanceof TSRangeSet) {
			return op.hasSignificantRange && this.range.intersects(op.range) && $ok(op.search(r => this.intersects(r))) ;
		}
		return op.hasSignificantRange && $ok(this.search(r => r.intersects(op))) ; // an empty or invalid range intersects nothing
	}

	public containedIn(v:TSRange|TSRangeSet|Interval|number[]):boolean {
		const op = _operand(v, 'containedIn') ;
		if (!this.hasSignificantRange || typeof op === 'number') { return false ; }
		return op instanceof TSRangeSet ? op.contains(this) : op.contains(this.range) ;
	}

	// true if one of the ranges of the set intersects or touches the given range(s), so that their union
	// joins them (like TSRange.continuousWith(), an empty range is a location, continuous with a range containing it)
	public continuousWith(v:TSRange|TSRangeSet|Interval|number[]):boolean {
		const op = _operand(v, 'continuousWith') ;
		if (!this.hasSignificantRange || typeof op === 'number') { return false ; }
		if (op instanceof TSRangeSet) { return $ok(op.search(o => this.continuousWith(o))) ; }
		return op.isValid && $ok(this.search(r => r.continuousWith(op))) ;
	}

	// an empty or invalid range, or an empty set, adds nothing (it used to throw)
	public unionWidth(v:RangesLike) {
		for (const r of _operandRanges(_operand(v, 'unionWidth'))) { this._addRange(r) ; }
	}

	// an empty or invalid range, or an empty set, removes nothing (it used to throw)
	public substractFrom(v:RangesLike) {
		for (const r of _operandRanges(_operand(v, 'substractFrom'))) { this._removeRange(r) ; }
	}

	// an empty or invalid range, or an empty set, has no common part with the set, which becomes empty (it used to throw)
	public intersectWidth(v:RangesLike) {
		const op = _operand(v, 'intersectWidth') ;
		if (op instanceof TSRangeSet) { this._intersectRangeSet(op) ; return ; }
		const ranges = _operandRanges(op) ;
		if (ranges.length) { this._intersectRange(ranges[0]) ; }
		else { this.clear() ; }
	}
	
	public union(v:RangesLike):TSRangeSet {
		const op = _operand(v, 'unionWidth') ; // same checks and errors as unionWidth()
		if (op instanceof TSRangeSet) {
			// linear merge of the two sorted lists (adding the ranges one by one was quadratic)
			const ret = new TSRangeSet() ;
			ret._appendRanges(_sortedRangesUnion([...this], [...op])) ;
			return ret ;
		}
		let ret = new TSRangeSet(this) ;
		ret.unionWidth(op) ;
		return ret ;
	}

	public intersection(v:RangesLike):TSRangeSet {
		let ret = new TSRangeSet(this) ;
		ret.intersectWidth(v) ;
		return ret ;
	}

	public substraction(v:RangesLike):TSRangeSet {
		const op = _operand(v, 'substractFrom') ; // same checks and errors as substractFrom()
		if (op instanceof TSRangeSet) {
			// linear sweep of the two sorted lists (removing the ranges one by one was quadratic)
			const ret = new TSRangeSet() ;
			ret._appendRanges(_sortedRangesDifference([...this], [...op])) ;
			return ret ;
		}
		let ret = new TSRangeSet(this) ;
		ret.substractFrom(op) ;
		return ret ;
	}

	public complement(v?:TSRange|Interval|number[]):TSRangeSet {
		if (!this.hasSignificantRange) {
			if (!$ok(v)) {
                TSError.throw('TSRangeSet.complement(): call with no parameter on an empty range set', { parameter:v}) ;
            }
			return new TSRangeSet(v) ;
		}
		if (!$ok(v)) { v = this.range ; }
        else if ($isarray(v)) {
            const r = TSRange.fromArray(v) ;
            if (!$ok(r) || !r?.hasSignificantRange) {
                TSError.throw('TSRangeSet.complement(): invalid range array parameter', { parameter:v}) ;
            }
			v = r! ;
        }
		else if (v instanceof TSRange) {
			if (!v.hasSignificantRange) {
                TSError.throw('TSRangeSet.complement(): invalid range parameter', { parameter:v}) ;
            }
		}
		else {
			if (!$comformsToInterval(v) || !(v as Interval).hasSignificantRange) {
                TSError.throw('TSRangeSet.complement(): invalid interval parameter', { parameter:v}) ;
            }
			v = (v as Interval).range ;
		}
		let ret = new TSRangeSet(v) ;
		ret.substractFrom(this) ;
		return ret ;
	}

	// ============ TSObject conformance =============== 
    public override isEqual(other:any) : boolean { 
		return this === other || (other instanceof TSRangeSet && super.isEqual(other)) ;
	}
    
    public override compare(other:any) : Comparison {
        if (this.isEqual(other)) { return Same ; }
        if ((other instanceof TSRange || other instanceof TSRangeSet) && this.hasSignificantRange && other.hasSignificantRange) {
            if (this.location >= other.maxRange) { return Descending ; }
            if (other.location >= this.maxRange) { return Ascending ;}
        }
        return undefined ;
    }
}

export interface TSRangeSetConstructor extends TSListConstructor<TSRange>
{
    new (v?:Nullable<TSRangeSet|trrs|trrsa>): TSRangeSet ;
}

// normalizes the TSRangeSet constructor parameter to an array (v is not a TSRangeSet)
function _rangeSetArgumentsArray(v:trrs|trrsa):trrsa {
    if ($isarray(v)) { return v as trrsa ; }
    if ($isnumber(v)) { return [new TSRange(v as number, 1)] ; }
    if ((v instanceof TSRange) || $comformsToInterval(v)) { return [v as trrs] ; }
    TSError.throw('TSRangeSet.constructor(): invalid parameter', { parameter:v}) ;
}

// v is the normalized constructor parameter, used in error messages
function _rangesFromArray(v:trrsa):TSRange[] {
    let u = v ;
    if ($count(u) === 2 && $isnumber(u[0]) && $isnumber(u[1])) {
        const r = TSRange.fromArray(u as Array<number>) ;
        if (!$ok(r)) { TSError.throw('TSRangeSet.constructor(): invalid range as array parameter', { parameter:v}) ; }
        u = [r!] ;
    }
    return u.map(e => _rangeFromElement(e, v)) ;
}

// the argument of contains(), intersects()... as a location, a range (possibly empty or invalid) or
// a range set. Throws only for an argument of a wrong type
function _operand(v:any, fn:string):number|TSRange|TSRangeSet {
    if (typeof v === 'number' || v instanceof TSRange || v instanceof TSRangeSet) { return v ; }
    if ($isarray(v)) {
        const r = TSRange.fromArray(v) ;
        if (!$ok(r)) { TSError.throw(`TSRangeSet.${fn}(): invalid range array parameter`, { parameter:v}) ; }
        return r! ;
    }
    if (!$comformsToInterval(v)) { TSError.throw(`TSRangeSet.${fn}(): invalid parameter`, { parameter:v}) ; }
    return (v as Interval).range ;
}

// the non empty ranges of an operand (a number is the [n, n+1[ range)
function _operandRanges(op:number|TSRange|TSRangeSet):TSRange[] {
    if (typeof op === 'number') { return [new TSRange(op, 1)] ; }
    if (op instanceof TSRangeSet) { return [...op] ; }
    return op.hasSignificantRange ? [op] : [] ;
}

// ranges is a list of valid non empty ranges sorted by location. Returns new TSRange instances
// (never the given ones) where the intersecting or touching ranges are merged
function _sortedRangesMerge(ranges:TSRange[]):TSRange[] {
    const ret:TSRange[] = [] ;
    for (const r of ranges) {
        const n = ret.length ;
        if (n > 0 && r.location <= ret[n-1].maxRange) {
            const last = ret[n-1] ;
            if (r.maxRange > last.maxRange) { ret[n-1] = new TSRange(last.location, r.maxRange - last.location) ; }
        }
        else { ret.push(r.clone()) ; }
    }
    return ret ;
}

// a and b are sorted lists of disjoint and not touching ranges. Returns their union as new TSRange instances
function _sortedRangesUnion(a:TSRange[], b:TSRange[]):TSRange[] {
    const all:TSRange[] = [] ;
    let i = 0, j = 0 ;
    while (i < a.length || j < b.length) {
        if (j >= b.length || (i < a.length && a[i].location <= b[j].location)) { all.push(a[i++]) ; }
        else { all.push(b[j++]) ; }
    }
    return _sortedRangesMerge(all) ;
}

// a and b are sorted lists of disjoint and not touching ranges. Returns the parts of the ranges of a
// which are in no range of b, as new TSRange instances
function _sortedRangesDifference(a:TSRange[], b:TSRange[]):TSRange[] {
    const ret:TSRange[] = [] ;
    let j = 0 ;
    for (const r of a) {
        let current = r.location ;
        const end = r.maxRange ;
        while (j < b.length && b[j].maxRange <= current) { j++ ; }  // the ranges of b before r
        let k = j ;
        while (k < b.length && b[k].location < end) {
            if (b[k].location > current) { ret.push(new TSRange(current, b[k].location - current)) ; }
            current = Math.max(current, b[k].maxRange) ;
            if (current >= end) { break ; } // b[k] may also cut the next ranges of a
            k++ ;
        }
        if (current < end) { ret.push(new TSRange(current, end - current)) ; }
        j = k ;
    }
    return ret ;
}

// a and b are sorted lists of disjoint and not touching ranges. Returns true if each range of b is
// contained in a range of a
function _sortedRangesContain(a:TSRange[], b:TSRange[]):boolean {
    let i = 0 ;
    for (const r of b) {
        while (i < a.length && a[i].maxRange < r.maxRange) { i++ ; } // the first range of a which may contain r
        if (i >= a.length || a[i].location > r.location) { return false ; }
    }
    return true ;
}

// a and b are sorted lists of disjoint and not touching ranges.
// returns the sorted list of the non empty intersections of a range of a with a range of b
function _sortedRangesIntersection(a:TSRange[], b:TSRange[]):TSRange[] {
    const ret:TSRange[] = [] ;
    let i = 0, j = 0 ;
    while (i < a.length && j < b.length) {
        const inter = a[i].intersectionRange(b[j]) ;
        if (inter.length > 0) { ret.push(inter) ; }
        // the range ending first cannot intersect any further range of the other list
        if (a[i].maxRange < b[j].maxRange) { i++ ; } else { j++ ; }
    }
    return ret ;
}

function _rangeFromElement(e:trrs, v:trrsa):TSRange {
    let r:Nullable<TSRange> = undefined ;
    if (e instanceof TSRange) { r = e as TSRange ; }
    else if ($isarray(e)) { r = TSRange.fromArray(e as Array<number>) ; }
    else if ($comformsToInterval(e) && (e as Interval).hasSignificantRange) { r = (e as Interval).range ; }
    if (!$ok(r)) { TSError.throw('TSRangeSet.constructor(): invalid array parameter', { parameter:v}) ; }
    if (!r!.hasSignificantRange) { TSError.throw('TSRangeSet.constructor(): invalid range parameter', { parameter:v}) ; }
    return r! ;
}
