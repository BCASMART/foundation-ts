import { Comparison, Nullable, Same } from "./types";
import { $ok } from "./commons";
import { TSDate } from "./tsdate";
import { $components, $components2timestamp, TSDateComp } from "./tsdatecomp";
import { TSObject } from "./tsobject";
import { $datecompare, $numcompare } from "./compare";
import { $declareAccessor } from "./object";
import { TSError } from "./tserrors";

// returns time in seconds between two dates
// WARNING: time between system Date objects takes TZ and DST into account and, as it should, TSDate does not 
export function $timeBetweenDates(pa:Nullable<number|string|Date|TSDate>, pb:Nullable<number|string|Date|TSDate>) : number
{
    let a = _acceptableDateParameter(pa) ;
    let b = _acceptableDateParameter(pb, true) ;
    
    if (typeof a === 'number' && typeof b === 'number') { return b - a ; }
    if (a instanceof Date && b instanceof Date) { return b.timeSinceDate(a) ; }
    
    if (!(a instanceof TSDate)) { a = new TSDate(a as number) ;}
    if (!(b instanceof TSDate)) { b = new TSDate(b as number) ;}

    return b.timeSinceDate(a) ;
} 

declare global {
    export interface Date extends TSObject {
        leafInspect:   (this:Date) => string ;

        // ============ TSDate compatibility =============== 
        timestamp:      number ;
        toComponents:  (this:Date) => TSDateComp ;
        toDate:        (this:Date) => Date ;
        toTSDate:      (this:Date) => TSDate|null ;

        // returns time in seconds between two dates
        // WARNING: time between system Date objects takes TZ and DST into account 
        timeSinceDate: (this:Date, other:Date) => number ;

        // ============ TSObject conformance signature modification =============== 
        toArray:       (this:Date) => Date[] ;
    }
}

Date.prototype.leafInspect = Date.prototype.toISOString ;

$declareAccessor(Date, { element:'timestamp', getter:function(this:Date):any { return $components2timestamp($components(this)) ; }})

Date.prototype.isEqual       = function isEqual(this:Date, other:any):boolean { 
    if (this === other) { return true ; }
    if (other instanceof Date) { return this.getTime() === other.getTime() ; }
    if (other instanceof TSDate) { return $datecompare(this, other) === Same ; }
    return false ;
}

Date.prototype.compare       = function compare(this:Date, other:any):Comparison {
    if (this === other) { return Same ; }
    if (other instanceof Date) { return $numcompare(this.getTime(), other.getTime()) ; }
    if (other instanceof TSDate) { return $datecompare(this, other) ; }
    return undefined ;
}

Date.prototype.toArray       = function toArray(this:Date):Date[] { return [this] ; }
Date.prototype.timeSinceDate = function timeSinceDate(this:Date, other:Date):number { return (this.getTime() - other.getTime())/1000 ; }
Date.prototype.toComponents  = function toComponents(this:Date) { return $components(this) ; }
Date.prototype.toDate        = function toDate(this:Date):Date { return this ; }
Date.prototype.toTSDate      = function toTSDate(this:Date):TSDate|null { return TSDate.fromDate(this) ; }

/***************************************************************************************************************
 * PRIVATE FUNCTIONS
 ***************************************************************************************************************/

function _acceptableDateParameter(a:Nullable<number|string|Date|TSDate>, future:boolean = false):TSDate|Date|number {
    if (!$ok(a)) { return !future ? TSDate.past() : TSDate.future() ; }
    if (a === Number.POSITIVE_INFINITY) { return TSDate.future() ; }
    if (a === Number.NEGATIVE_INFINITY) { return TSDate.past() ; }
    if (a instanceof Date || a instanceof TSDate) { return a ; }

    const t = typeof a ;
    if (t === 'string') { return new TSDate(a as string) ; }
    if (t === 'number') { 
        if (isNaN(a as number)) { TSError.throw('$timeBetweenDates() cannot handle NaN as numbers') ; }
        return a as number ;
    }

    TSError.throw(`$timeBetweenDates() cannot handle value of type ${t}`) ;
}