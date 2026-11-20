import { Comparison, Nullable, Same } from "./types";
import { $ok } from "./commons";
import { TSDate } from "./tsdate";
import { $components, $components2timestamp, TSDateComp } from "./tsdatecomp";
import { TSObject } from "./tsobject";
import { $datecompare, $numcompare, DateCompareable } from "./compare";
import { $declareAccessor, $declareMethods } from "./object";
import { TSError } from "./tserrors";

// returns time in seconds between two dates
// WARNING: time between system Date objects takes TZ and DST into account and, as it should, TSDate does not 
export function $timeBetweenDates(pa:DateCompareable, pb:DateCompareable) : number
{
    let a = _acceptableDateParameter(pa) ;
    let b = _acceptableDateParameter(pb, true) ;
    
    if (typeof a === 'number' && typeof b === 'number') { return b - a ; }
    if (a instanceof Date && b instanceof Date) { return b.timeSinceDate(a) ; }
    
    if (!(a instanceof TSDate)) { a = new TSDate(a as any) ;}
    if (!(b instanceof TSDate)) { b = new TSDate(b as any) ;}

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

$declareMethods(Date, {
    leafInspect: Date.prototype.toISOString,
}) ;

$declareAccessor(Date, { element:'timestamp', configurable:true, getter:function(this:Date):any { return $components2timestamp($components(this)) ; }})

$declareMethods(Date, {
    isEqual(this:Date, other:any):boolean { 
        if (this === other) { return true ; }
        if (other instanceof Date) { return this.getTime() === other.getTime() ; }
        if (other instanceof TSDate) { return $datecompare(this, other) === Same ; }
        return false ;
    },

    compare(this:Date, other:any):Comparison {
        if (this === other) { return Same ; }
        if (other instanceof Date) { return $numcompare(this.getTime(), other.getTime()) ; }
        if (other instanceof TSDate) { return $datecompare(this, other) ; }
        return undefined ;
    },

    toArray(this:Date):Date[] { return [this] ; },
    timeSinceDate(this:Date, other:Date):number { return (this.getTime() - other.getTime())/1000 ; },
    toComponents(this:Date) { return $components(this) ; },
    toDate(this:Date):Date { return this ; },
    toTSDate(this:Date):TSDate|null { return TSDate.fromDate(this) ; },
}) ;

/***************************************************************************************************************
 * PRIVATE FUNCTIONS
 ***************************************************************************************************************/

function _acceptableDateParameter(a:Nullable<number|string|Date|TSDate>, future:boolean = false):TSDate|Date|number {
    if (!$ok(a)) { return !future ? TSDate.past() : TSDate.future() ; }
    if (a === Number.POSITIVE_INFINITY) { return TSDate.future() ; }
    if (a === Number.NEGATIVE_INFINITY) { return TSDate.past() ; }
    if (a instanceof Date || a instanceof TSDate) { return a ; }
    switch (typeof a) {
        case 'number': 
            if (Number.isNaN(a)) { TSError.throw('$timeBetweenDates() cannot handle NaN as numbers') ; }
            return a ;
        case 'string': 
            return new TSDate(a) ;
        default:
            TSError.throw(`$timeBetweenDates() cannot handle value of type ${typeof a} as date parameter`) ;
    }
}