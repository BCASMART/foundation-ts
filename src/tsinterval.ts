import { $jsonobj, $ok } from "./commons";
import { Interval, TSBadRange, TSRange } from "./tsrange" ;
import { TSDate } from "./tsdate";
import { Ascending, Comparison, Descending, Same } from "./types";
import { TSCouple } from "./tscouple";

/************************************************
 *  WARNING: range conformance methods and containing 
 *  and intersectionning methods do round dates to minutes
 ************************************************/
export class TSInterval extends TSCouple<TSDate | null | undefined, TSDate | null | undefined> implements Interval
{
	get start():TSDate { return $ok(this.first) ? this.first! : new TSDate(TSDate.PAST) ; }
	get end():TSDate { return $ok(this.second) ? this.second! : new TSDate(TSDate.FUTURE) ; }

	get hasSignificantRange():boolean {
		return $ok(this.first) && $ok(this.second) && this.start.toRangeLocation() < this.end.toRangeLocation() ;
	}
    get hasEmptyRange():boolean { 
        return $ok(this.first) && $ok(this.second) && this.start.toRangeLocation() === this.end.toRangeLocation()  ;
    }
	get range():TSRange { return this.hasSignificantRange ? new TSRange(this.start, this.end) : TSBadRange() ; }

    public daysInterval():TSInterval {
        if ($ok(this.first)) {
            if ($ok(this.second)) {
                let s = this.start.dateWithoutTime() ;
                let e = this.end.dateWithoutTime() ;
                if (this.hasEmptyRange) { return new TSInterval(e, e) ; }
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
        let loc = aDate.toRangeLocation() ;
        if (this.hasEmptyRange) { return false ; } // this is not an interval
        else if (this.hasSignificantRange) { return this.range.containsLocation(loc) ; }
        else if ($ok(this.first)) { return this.start.toRangeLocation() >= loc ; }
        else if ($ok(this.second)) { return loc < this.end.toRangeLocation() ; }
        return true ; // a both way infinite interval always contains any date
    }

    public intersectsInterval(other:TSInterval):boolean {
        if (this.hasEmptyRange || other.hasEmptyRange) { return false ; } // none of these objects is an interval
        else if (this.hasSignificantRange) {
            if (other.hasSignificantRange) { return this.range.intersects(other.range) ; }
            else if ($ok(other.first)) { return other.start.toRangeLocation() < this.end.toRangeLocation()  ; }
            else if ($ok(other.second)) { return other.end.toRangeLocation() > this.start.toRangeLocation() ; }
            return true ; // intersection with a both way infinite interval is always true
        }
        else if (other.hasSignificantRange) {
            return other.intersectsInterval(this) ;
        }
        else if ($ok(this.first)) {
            return $ok(other.second) ? other.end.toRangeLocation() > this.start.toRangeLocation() : true ;
        }
        else if ($ok(this.second)) {
            return $ok(other.first) ? this.end.toRangeLocation() > other.start.toRangeLocation() : true ;
        }
        return true ; // intersection with a both way infinite interval is always true
    }
    
    public containsInterval(other:TSInterval):boolean {
        if (this.hasEmptyRange || other.hasEmptyRange) { return false ; } // none of these objects is an interval
        else if (this.hasSignificantRange) {
            return other.hasSignificantRange && this.range.contains(other.range) ;
        }
        else if ($ok(this.first)) {
            return $ok(other.first) && this.start.toRangeLocation() <= other.start.toRangeLocation() ;
        }
        else if ($ok(this.second)) {
            return $ok(other.second) && other.end.toRangeLocation() <= this.end.toRangeLocation() ;
        }
        return true ; // a both ways infinite interval always contains any intervals
    }

    public containedInInterval(other:TSInterval):boolean { return other.containsInterval(this) ; }

    public compare(other:any) : Comparison {
        if (this.isEqual(other)) { return Same ; }
        if (other instanceof TSInterval) {
            if (this.hasSignificantRange) {
                if ($ok(other.first) && this.end.toRangeLocation() <= other.start.toRangeLocation()) { return Ascending ; }
                if ($ok(other.second) && other.end.toRangeLocation() <= this.start.toRangeLocation()) { return Descending ; }
            }
            else if (other.hasSignificantRange) {
                if ($ok(this.first) && other.end.toRangeLocation() <= this.start.toRangeLocation()) { return Descending ; }
                if ($ok(this.second) && this.end.toRangeLocation() <= other.start.toRangeLocation()) { return Ascending ; }
            }
            else if ($ok(this.first) && $ok(other.second) && 
                     other.end.toRangeLocation() <= this.start.toRangeLocation()) { return Descending ; }
            else if ($ok(this.second) && $ok(other.first) && 
                     this.end.toRangeLocation() <= other.start.toRangeLocation()) { return Ascending ; }
        }
        return undefined ;
    }

	// ============ TSObject conformance =============== 
	public isEqual(other:any) : boolean
	{ return this === other || (other instanceof TSInterval && other.first === this.first && other.end === this.end) ; }
	public toJSON():{start:TSDate|null|undefined, end:TSDate|null|undefined} { return {start:$jsonobj(this.first), end:$jsonobj(this.second)} ; }
	public toArray():TSInterval[] { return [this] ; } // should we not return one or two dates here ?
}
