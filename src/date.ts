import { Nullable } from "./types";
import { $ok } from "./commons";
import { TSDate } from "./tsdate";

// returns time in seconds between two dates
// WARNING: time between system Date objects takes TZ and DST into account and, as it should, TSDate does not 
export function $timeBetweenDates(a:Nullable<number|string|Date|TSDate>, b:Nullable<number|string|Date|TSDate>) : number
{
    a = $ok(a) ? a : TSDate.past() ;
    b = $ok(b) ? b : TSDate.future() ;

    if (a instanceof Date && b instanceof Date) { return b.timeSinceDate(a) ; }
    
    // TODO: do we need to make a direct difference on number args ?
    if (!(a instanceof TSDate)) { a = new TSDate(a as string /* correct cast should be number | string */) ;}
    if (!(b instanceof TSDate)) { b = new TSDate(b as string /* correct cast should be number | string  */) ;}

    return b.timeSinceDate(a) ;
} 

declare global {
    export interface Date {
        leafInspect:   (this:Date) => string ;
        timeSinceDate: (this:Date, other:Date) => number ;
        toDate:        (this:Date) => Date ;
        toTSDate:      (this: Date) => TSDate|null ;
    }
}
Date.prototype.leafInspect = Date.prototype.toISOString ;

// returns time in seconds between two dates
// WARNING: time between system Date objects takes TZ and DST into account 
Date.prototype.timeSinceDate = function timeSinceDate(this:Date, other:Date):number { return (this.getTime() - other.getTime())/1000 ; }
Date.prototype.toTSDate      = function toTSDate(this:Date):TSDate|null { return TSDate.fromDate(this) ; }
Date.prototype.toDate        = function toDate(this:Date):Date { return this ; }
