import { $isint, $jsonobj, $ok } from "./commons";
import { Interval, TSBadRange, TSRange } from "./tsrange" ;
import { TSDate } from "./tsdate";
import { Ascending, Comparison, Descending, Nullable, Same } from "./types";
import { TSCouple, TSCoupleConstructor } from "./tscouple";
import { TSError } from "./tserrors";

/************************************************
 *  Like TSRange, intervals are half-open: [start, end[ 
 *  (the start is included, the end is excluded) and a
 *  null bound means infinite: [start, +inf[, ]-inf, end[
 *  To include an end date, add one second to it.
 *
 *  WARNING: range conformance methods and containing 
 *  and intersectionning methods compare the dates with
 *  their timestamps, so at the second
 ************************************************/
export class TSInterval extends TSCouple<Nullable<TSDate>, Nullable<TSDate>> implements Interval
{
    // like TSRange, an interval with an end date anterior to its start date cannot be created
    public constructor(first:Nullable<TSDate>, second:Nullable<TSDate>) {
        super(first, second) ;
        if (!this.isValid) {
            TSError.throw('TSInterval.constructor(): second provided date is anterior to the first one', { first:first, second:second }) ;
        }
    }

    public static make(a:Nullable<TSDate>, b:Nullable<TSDate>):TSInterval { return new TSInterval(a, b) ; }

    get start():TSDate { return $ok(this.first) ? this.first! : new TSDate(TSDate.PAST) ; }
	get end():TSDate { return $ok(this.second) ? this.second! : new TSDate(TSDate.FUTURE) ; }

	public override clone():TSInterval { return new TSInterval(this.first, this.second) ; }

    get hasSignificantRange():boolean {
		if ($ok(this.first) && $ok(this.second)) {
            const s = this.start.timestamp ;
            const e = this.end.timestamp ;
            return $isint(s) && $isint(e) && s < e ;
        }
        return false ;
	}
    
    // an interval is valid if it is not inverted ([start, end[ with start <= end), whatever its infinite bounds are
    // (it used to be invalid without a start date). first and second can be changed, so it is checked here too
    // an invalid interval contains nothing, intersects nothing and is continuous with nothing
    public get isValid():boolean {
        return !$ok(this.first) || !$ok(this.second) || this.first!.timestamp <= this.second!.timestamp ;
    }
	public get isEmpty():boolean { return $ok(this.first) && $ok(this.second) && this.start.timestamp === this.end.timestamp ; }

	get range():TSRange { return this.hasSignificantRange ? new TSRange(this.start, this.end) : TSBadRange() ; }

    public daysInterval():TSInterval {
        if ($ok(this.first)) {
            if ($ok(this.second)) {
                let s = this.start.dateWithoutTime() ;
                if (this.isEmpty) { return new TSInterval(s, s) ; }
                let e = this.end.dateWithoutTime() ;
                if (s.isEqual(e)) { e = e.dateByAdding(0,0,1) ; }
                return new TSInterval(s, e) ;                
            }
            return new TSInterval(this.start.dateWithoutTime(), null) ;
        }
        return $ok(this.second) ? new TSInterval(null, this.end.dateWithoutTime()) : new TSInterval(null, null) ; 

    }

    public hasSameRange(other:TSInterval):boolean {
        return this.hasSignificantRange && other.hasSignificantRange && this.range.isEqual(other.range) ;
        // infinite intervals never have the same range
    }
	
    public containsDate(aDate:TSDate):boolean {
        if (!this.isValid || this.isEmpty) { return false ; } // an empty interval contains nothing, like an empty TSRange

        let loc = aDate.timestamp ;

        if (this.hasSignificantRange) { return this.range.containsLocation(loc) ; }
        else if ($ok(this.first)) { return loc >= this.start.timestamp ; }
        else if ($ok(this.second)) { return loc < this.end.timestamp ; }
        
        return true ; // a both way infinite interval always contains any date
    }

    public intersects(other:TSInterval):boolean {
        if (!this.isValid || !other.isValid || this.isEmpty || other.isEmpty) { return false ; } // like TSRange
        else if (this.hasSignificantRange) {
            if (other.hasSignificantRange) { return this.range.intersects(other.range) ; }
            else if ($ok(other.first)) { return other.start.timestamp < this.end.timestamp  ; }
            else if ($ok(other.second)) { return other.end.timestamp > this.start.timestamp ; }
            return true ; // intersection with a both way infinite interval is always true
        }
        else if (other.hasSignificantRange) {
            return other.intersects(this) ;
        }
        else if ($ok(this.first)) {
            return $ok(other.second) ? other.end.timestamp > this.start.timestamp : true ;
        }
        else if ($ok(this.second)) {
            return $ok(other.first) ? this.end.timestamp > other.start.timestamp : true ;
        }
        return true ; // intersection with a both way infinite interval is always true
    }
    
    public contains(other:TSInterval):boolean {
        if (!this.isValid || !other.isValid || this.isEmpty) { return false ; } // an empty interval contains nothing
        // like TSRange, an empty interval is contained if its date is (it used to be never contained)
        if (other.isEmpty) { return this.containsDate(other.start) ; }
        if (this.hasSignificantRange) {
            return other.hasSignificantRange && this.range.contains(other.range) ;
        }
        else if ($ok(this.first)) {
            return $ok(other.first) && this.start.timestamp <= other.start.timestamp ;
        }
        else if ($ok(this.second)) {
            return $ok(other.second) && other.end.timestamp <= this.end.timestamp ;
        }
        return true ; // a both ways infinite interval always contains any intervals
    }

    public containedIn(other:TSInterval):boolean { return other.contains(this) ; }

    // like TSRange.continuousWith(): the intervals intersect or touch, or one of them is an empty interval
    // (a date) inside the other one, ie. their intersection exists
    // (an empty interval strictly inside the other one used to be not continuous with it)
    public continuousWith(other:TSInterval) : boolean {
		return this.intersectionInterval(other) !== null ;
	}

    // smallest interval containing both intervals, even if they are disjoint (like TSRange.unionRange()).
    // A bound is infinite (null) if one of the two bounds is infinite, else it's the earliest start
    // and the latest end. Empty intervals take part with their date ([b,b] U [c,d[ = [b,d[ for b < c).
    // Difference with TSRange.unionRange(): returns null (instead of a bad range) if one of the intervals
    // is not valid. Like TSRange, the union of two empty intervals keeps their dates (an empty interval
    // at that date if they are equal, [b,c[ if they are not).
    // A new TSInterval is returned, made with the (immutable) TSDate instances of this and other.
    public unionInterval(other:TSInterval):TSInterval|null {
        if (!this.isValid || !other.isValid) { return null ; }
        return new TSInterval(TSInterval._unionBound(this.first, other.first, false), TSInterval._unionBound(this.second, other.second, true)) ;
    }

    // intersection of both intervals: the latest start and the earliest end, a bound being infinite (null)
    // only if both bounds are infinite. Like TSRange.intersectionRange(), the result is an EMPTY interval
    // when the intervals only touch ([a,b[ ∩ [b,c[ = [b,b]) or when one of them is an empty interval whose
    // date is in the other one or at its excluded end ([b,b] ∩ [a,b[ = [b,b]).
    // Returns null when TSRange.intersectionRange() returns a bad range: if one of the intervals is not
    // valid or if they are disjoint.
    // A new TSInterval is returned, made with the (immutable) TSDate instances of this and other.
    public intersectionInterval(other:TSInterval):TSInterval|null {
        if (!this.isValid || !other.isValid) { return null ; }
        const start = TSInterval._intersectionBound(this.first, other.first, true) ;
        const end = TSInterval._intersectionBound(this.second, other.second, false) ;
        if ($ok(start) && $ok(end) && end!.timestamp < start!.timestamp) { return null ; } // disjoint intervals
        return new TSInterval(start, end) ;
    }

    // union bound: infinite (null) if one of the bounds is infinite, else the latest (or the earliest) one
    private static _unionBound(a:Nullable<TSDate>, b:Nullable<TSDate>, latest:boolean):TSDate|null {
        return $ok(a) && $ok(b) ? TSInterval._extremeDate(a!, b!, latest) : null ;
    }

    // intersection bound: infinite (null) only if both bounds are infinite, else the latest (or the earliest) finite one
    private static _intersectionBound(a:Nullable<TSDate>, b:Nullable<TSDate>, latest:boolean):TSDate|null {
        if (!$ok(a)) { return $ok(b) ? b! : null ; }
        return $ok(b) ? TSInterval._extremeDate(a!, b!, latest) : a! ;
    }

    private static _extremeDate(a:TSDate, b:TSDate, latest:boolean):TSDate {
        const bIsExtreme = latest ? b.timestamp > a.timestamp : b.timestamp < a.timestamp ;
        return bIsExtreme ? b : a ;
    }

    public override compare(other:any) : Comparison {
        if (this.isEqual(other)) { return Same ; }
        return other instanceof TSInterval ? this._compareInterval(other) : undefined ;
    }

    private _compareInterval(other:TSInterval) : Comparison {
        if (this.hasSignificantRange) {
            if ($ok(other.first) && this.end.timestamp <= other.start.timestamp) { return Ascending ; }
            if ($ok(other.second) && other.end.timestamp <= this.start.timestamp) { return Descending ; }
            return undefined ;
        }
        if (other.hasSignificantRange) {
            if ($ok(this.first) && other.end.timestamp <= this.start.timestamp) { return Descending ; }
            if ($ok(this.second) && this.end.timestamp <= other.start.timestamp) { return Ascending ; }
            return undefined ;
        }
        return this._compareInsignificantInterval(other) ;
    }

    // neither this interval nor other have a significant range
    private _compareInsignificantInterval(other:TSInterval) : Comparison {
        if ($ok(this.first) && $ok(other.second) && other.end.timestamp <= this.start.timestamp) { return Descending ; }
        if ($ok(this.second) && $ok(other.first) && this.end.timestamp <= other.start.timestamp) { return Ascending ; }
        return undefined ;
    }

	// ============ TSObject conformance =============== 
	public override isEqual(other:any) : boolean
	{
        if (this === other) { return true ; }
        return (other instanceof TSInterval) && 
               (($ok(this.first) && this.first!.isEqual(other.first)) || (!$ok(this.first) && !$ok(other.first))) &&
               (($ok(this.second) && this.second!.isEqual(other.second)) || (!$ok(this.second) && !$ok(other.second))) ;
    }
	public override toJSON():{start:Nullable<TSDate>, end:Nullable<TSDate>} { return {start:$jsonobj(this.first), end:$jsonobj(this.second)} ; }
	public override toArray():TSInterval[] { return [this] ; } // should we not return one or two dates here ?
}

export interface TSIntervalConstructor extends TSCoupleConstructor<Nullable<TSDate>, Nullable<TSDate>>
{
    new (first:Nullable<TSDate>, second:Nullable<TSDate>): TSInterval ;
}

