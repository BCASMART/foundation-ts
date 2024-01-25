import { $count, $isarray, $isnumber, $ok } from "./commons";
import { TSError } from "./tserrors";
import { TSList, TSListConstructor } from "./tslist";
import { $comformsToInterval, Interval, TSBadRange, TSRange } from "./tsrange";
import { Ascending, Comparison, Descending, Nullable, Same } from "./types";


type trrs = TSRange|number|Interval|Array<number> ;
type trrsa = Array<trrs> ;
export class TSRangeSet extends TSList<TSRange> implements Interval {

	public constructor(v?:Nullable<TSRangeSet|trrs|trrsa>) {
		super() ;
		if ($ok(v)) {
			if (v instanceof TSRangeSet) {
				v.forEach(r => super.add(r)) ;
				return ;	
			}
            if (!$isarray(v)) {
                if ($isnumber(v)) {
                    v = [new TSRange(v as number, 1)] ;
                }
                else if ((v instanceof TSRange) || $comformsToInterval(v)) {
                    v = [v as trrs] ;
                }
                else { TSError.throw('TSRangeSet.constructor(): invalid parameter', { parameter:v}) ; }
            }
            let u = v as trrsa;

            let tmp:TSRange[] = [] ;
            if ($count(u) === 2 && $isnumber(u[0]) && $isnumber(u[1])) {
                const r = TSRange.fromArray(u as Array<number>) ;
                if ($ok(r)) { u = [r!] ; }
                else { TSError.throw('TSRangeSet.constructor(): invalid range as array parameter', { parameter:v}) ; }
            }

            for (let e of u) {
                let r:Nullable<TSRange> = undefined ;
                if (e instanceof TSRange) { r = e as TSRange ; }
                else if ($isarray(e)) { r = TSRange.fromArray(e as Array<number>) ; }
                else if ($comformsToInterval(e) && (e as Interval).hasSignificantRange) { r = (e as Interval).range ; }
                if (!$ok(r)) {TSError.throw('TSRangeSet.constructor(): invalid array parameter', { parameter:v}) ; ; }
                else if (!r!.hasSignificantRange) { TSError.throw('TSRangeSet.constructor(): invalid range parameter', { parameter:v}) ; ;}
                else { tmp.push(r!) ; }
            }

            for (let r of tmp) { this._addRange(r) ; }
		}
	}

	public get length():number { 
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
	public get hasSignificantRange():boolean { return $ok(super.first) ; }
	public get range():TSRange {
		if (this.hasSignificantRange) {
			const loc = super.first!.data.location ;
			return new TSRange(loc, super.last!.data.maxRange - loc) ;
		}
		return TSBadRange() ;
	}

    public get isValid():boolean { return this.range.isValid ; }
	public get isEmpty():boolean { return this.range.isEmpty ; }

	public get location():number { return $ok(super.first) ? super.first!.data.location : NaN ; }
	public get maxRange():number { return $ok(super.first) ? super.last!.data.maxRange : NaN ; }

	public clone():TSRangeSet { return new TSRangeSet(this) ; }

	// here r must be a valid range
	private _addRange(r:TSRange):void {
		let l = this.first ;
		while(l !== null) {
			if (l.data.continuousWith(r)) {
				l.data = l.data.unionRange(r) ;
				while(l !== null && l.next !== null && l.data.continuousWith(l.next.data)) {
					l.data = l.data.unionRange(l.next.data) ;
					super.removeNode(l.next) ;
				}
				return ;
			}
			else if (r.maxRange < l.data.location) {
				super.insert(r, l) ;
				return ;
			}
			l = l.next ;
		}
		super.add(r) ;
	}

	// here r must be a valid range
	private _removeRange(r:TSRange):void {
		if (this.intersects(r)) {
			let l = this.first ;
			
			while (l !== null && r.maxRange >= l.data.location) {
				const inter = r.intersectionRange(l.data) ;
				if (l.data.isEqual(inter)) {
					let n = l.next ;
					super.removeNode(l) ;
					l = n ;
				}
				else {
					if (!inter.isEmpty) {
						if (inter.location > l.data.location) {
							if (inter.maxRange < l.data.maxRange) {
								const upRange = new TSRange(inter.maxRange, l.data.maxRange - inter.maxRange) ;
								if (l.next) super.insert(upRange, l.next) ;
								else super.add(upRange) ;
							}
							l.data.length = inter.location - l.data.location ;
						}
						else if (inter.location == l.data.location) {
							l.data = new TSRange(inter.maxRange, l.data.maxRange - inter.maxRange) ;
						}
					}
					l = l.next ;
				}
			}
		}
	}

	// here r must be a valid range
	private _intersectRange(r:TSRange):void {
		if (this.hasSignificantRange) {
			if (this.range.intersects(r)) {
				let l = this.first ;
				while (l && !l.data.intersects(r)) { let n = l.next ; super.removeNode(l) ; l = n ; }
				let inter:TSRange ;
				while (l && (inter = r.intersectionRange(l.data)).length > 0) {
					l.data = inter ;
					l = l.next ;
				}
				while (l) { let n = l.next ; super.removeNode(l) ; l = n ; }
			}
			else {
				this.clear() ;
			}
		}
	}
	public contains(v:Number|TSRange|Interval|TSRangeSet|number[]):boolean {
		if (!this.hasSignificantRange) return false ;
		if (typeof v === 'number') { return this.contains(new TSRange(v, 1)) ; }
        else if ($isarray(v)) {
            const rs = TSRange.fromArray(v as number[]) ;
            if (!$ok(rs) || !rs?.hasSignificantRange) {
                TSError.throw('TSRangeSet.contains(): invalid range array parameter', { parameter:v}) ;
            }
			return $ok(this.search(r => r.contains(rs!))) ;
        }
        else if (v instanceof TSRange) {
			if (!v.hasSignificantRange) {
                TSError.throw('TSRangeSet.contains(): invalid range parameter', { parameter:v}) ;
            }
			return $ok(this.search(r => r.contains(v))) ;
		}
		else if (v instanceof TSRangeSet) {
			if (!v.hasSignificantRange) {
                TSError.throw('TSRangeSet.contains(): invalid range set parameter', { parameter:v}) ;
            }
			return this.range.contains(v.range) && !$ok(v.search(r => !this.contains(r))) ;
		}
		if (!$comformsToInterval(v) || !(v as Interval).hasSignificantRange) {
            TSError.throw('TSRangeSet.contains(): invalid interval parameter', { parameter:v}) ;
        }
		return this.contains((v as Interval).range) ;
	}

	public intersects(v:Number|TSRange|Interval|TSRangeSet|number[]):boolean {
		if (!this.hasSignificantRange) return false ;
		if (typeof v === 'number') { return this.intersects(new TSRange(v, 1)) ; }
        else if ($isarray(v)) {
            const rs = TSRange.fromArray(v as number[]) ;
            if (!$ok(rs) || !rs?.hasSignificantRange) {
                TSError.throw('TSRangeSet.intersects(): invalid range array parameter', { parameter:v}) ;
            }
			return $ok(this.search(r => r.intersects(rs!))) ;
        }
        else if (v instanceof TSRange) {
			if (!v.hasSignificantRange) {
                TSError.throw('TSRangeSet.intersects(): invalid range parameter', { parameter:v}) ;
            }
			return $ok(this.search(r => r.intersects(v as TSRange))) ;
		}
		else if (v instanceof TSRangeSet) {
			if (!v.hasSignificantRange) {
                TSError.throw('TSRangeSet.intersects(): invalid range set parameter', { parameter:v}) ;
            }
			return this.range.intersects(v.range) && !$ok(v.search(r => !this.intersects(r))) ;
		}
		if (!$comformsToInterval(v) || !(v as Interval).hasSignificantRange) {
            TSError.throw('TSRangeSet.intersects(): invalid interval parameter', { parameter:v}) ;
        }
		return this.intersects((v as Interval).range) ;
	}


	public unionWidth(v:number|TSRange|TSRangeSet|Interval|number[]) {
		if (typeof v === 'number') { this._addRange(new TSRange(v, 1)) ; }
        else if ($isarray(v)) {
            const r = TSRange.fromArray(v as number[]) ;
            if (!$ok(r) || !r?.hasSignificantRange) {
                TSError.throw('TSRangeSet.unionWidth(): invalid range array parameter', { parameter:v}) ;
            }
			this._addRange(r!) ;
        }
    	else if (v instanceof TSRange) {
			if (!v.hasSignificantRange) {
                TSError.throw('TSRangeSet.unionWidth(): invalid range parameter', { parameter:v}) ;
            }
			this._addRange(v) ;
		}
		else if (v instanceof TSRangeSet) {
			if (!v.hasSignificantRange) {
                TSError.throw('TSRangeSet.unionWidth(): invalid range set parameter', { parameter:v}) ;
            }
			(v as TSRangeSet).forEach(r => this._addRange(r)) ;
		}
        else {
            if (!$comformsToInterval(v) || !(v as Interval).hasSignificantRange) {
                TSError.throw('TSRangeSet.unionWidth(): invalid interval parameter', { parameter:v}) ;
            }
            this._addRange((v as Interval).range) ;
        }
	}

	public substractFrom(v:number|TSRange|TSRangeSet|Interval|number[]) {
		if (typeof v === 'number') { this._removeRange(new TSRange(v, 1)) ; }
        else if ($isarray(v)) {
            const r = TSRange.fromArray(v as number[]) ;
            if (!$ok(r) || !r?.hasSignificantRange) {
                TSError.throw('TSRangeSet.substractFrom(): invalid range array parameter', { parameter:v}) ;
            }
			this._removeRange(r!) ;
        }
		else if (v instanceof TSRange) {
			if (!v.hasSignificantRange) {
                TSError.throw('TSRangeSet.substractFrom(): invalid range parameter', { parameter:v}) ;
            }
			this._removeRange(v) ;
		}
		else if (v instanceof TSRangeSet) {
			if (!v.hasSignificantRange) {
                TSError.throw('TSRangeSet.substractFrom(): invalid range set parameter', { parameter:v}) ;
            }
			(v as TSRangeSet).forEach(r => this._removeRange(r)) ;
		}
		else {
            if (!$comformsToInterval(v) || !(v as Interval).hasSignificantRange) {
                TSError.throw('TSRangeSet.substractFrom(): invalid interval parameter', { parameter:v}) ;
            }
		    this._removeRange((v as Interval).range) ;
        }
	}

	public intersectWidth(v:number|TSRange|TSRangeSet|Interval|number[]) {
		if (typeof v === 'number') { this._intersectRange(new TSRange(v, 1)) ; }
        else if ($isarray(v)) {
            const r = TSRange.fromArray(v as number[]) ;
            if (!$ok(r) || !r?.hasSignificantRange) {
                TSError.throw('TSRangeSet.intersectWidth(): invalid range array parameter', { parameter:v}) ;
            }
			this._intersectRange(r!) ;
        }
		else if (v instanceof TSRange) {
			if (!v.hasSignificantRange) {
                TSError.throw('TSRangeSet.intersectWidth(): invalid range parameter', { parameter:v}) ;
            }
			this._intersectRange(v) ;
		}
		else if (v instanceof TSRangeSet) {
			if (!v.hasSignificantRange) {
                TSError.throw('TSRangeSet.intersectWidth(): invalid range set parameter', { parameter:v}) ;
            }
			(v as TSRangeSet).forEach(r => this._intersectRange(r)) ;
		}
        else {
            if (!$comformsToInterval(v) ||!(v as Interval).hasSignificantRange) {
                TSError.throw('TSRangeSet.intersectWidth(): invalid interval parameter', { parameter:v}) ;
            }
            this._intersectRange((v as Interval).range) ;
        }
	}
	
	public union(v:number|TSRange|Interval|TSRangeSet|number[]):TSRangeSet {
		let ret = new TSRangeSet(this) ;
		ret.unionWidth(v) ;
		return ret ;
	}

	public intersection(v:number|TSRange|Interval|TSRangeSet|number[]):TSRangeSet {
		let ret = new TSRangeSet(this) ;
		ret.intersectWidth(v) ;
		return ret ;
	}

	public substraction(v:number|TSRange|Interval|TSRangeSet|number[]):TSRangeSet {
		let ret = new TSRangeSet(this) ;
		ret.substractFrom(v) ;
		return ret ;
	}

	public complement(v?:TSRange|Interval|number[]):TSRangeSet {
		if (!this.hasSignificantRange) {
			if (!$ok(v)) {
                TSError.throw('TSRangeSet.complement(): call with no parameter on an empty range set', { parameter:v}) ;
            }
			return new TSRangeSet(v!) ;
		}
		if (!$ok(v)) { v = this.range ; }
        else if ($isarray(v)) {
            const r = TSRange.fromArray(v as number[]) ;
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
    public isEqual(other:any) : boolean { 
		return this === other || (other instanceof TSRangeSet && super.isEqual(other)) ;
	}
    
    public compare(other:any) : Comparison {
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
