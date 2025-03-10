/**
 * TSDate is a timestamp (commencing at 01/01/2001) date class
 * meant to manipulate dates without any TZ (even if creation
 * with GMT representation exist and toLocaleString() method
 * offers representation in current TZ).
 * 
 * TSDate instances are immutable which means you cannot change
 * their content after creation
 */
import { $components, $isostring2components, $parsedate, $parsedatetime, $componentsarevalid, TSDateComp, TSDateForm, $components2string, $components2timestamp, $components2date, $components2stringformat, $components2StringWithOffset, $timezoneOffsetWithComponents } from "./tsdatecomp"
import { $isint, $isnumber, $ok, $isstring, IsoDateFormat, $toint, $value, $isdate } from "./commons";
import { $datecompare, $numcompare } from "./compare";
import { Comparison, country, isodate, language, Nullable, Same, uint } from "./types";
import { TSClone, TSLeafInspect, TSObject } from "./tsobject";
import { TSCountry } from "./tscountry";
import { Locales } from "./tsdefaults";
import { $div } from "./number";
import { TSError } from "./tserrors";
import { $trim } from "./strings";

const customInspectSymbol = Symbol.for('nodejs.util.inspect.custom') ;

export class TSDate implements TSObject, TSLeafInspect, TSClone<TSDate> {
	private readonly _timestamp: number ;
    public static readonly FUTURE = 'future' ;
    public static readonly PAST = 'past' ;
    public static readonly ZULU = 'zulu' ;
    public static readonly EPOCH = 'epoch' ;
	// =================== constructors ==========================
    /**
     *  WARNING : TSDate string intializer takes ISO 8601 representation
     *            without any timezone OR the GMT timezone represented
     *            as a final :
     *              - z or Z
     *              - +00 or +0000 or +00:00
     * 
     *           Caution in using GMT time zone as a local time. You cannot
     *           do that in instancing a TSDate with a Date. In that case, 
     *           the local time is used. By exception, if you want to instanciate
     *           a TSDate from a Date and get its GMT representation, you can use
     *           
     *              myNewDate = TSDate.fromZulu(myJavascriptDate) ;
     * 
     *          For the same rease, new TSDate() create a date à the current local
     *          date and time. If you want to do the same at the GMT time zone, you can
     *          use TSDate.zulu()
     */
    constructor(year: number, month: number, day: number);
    constructor(year: number, month: number, day: number, hours: number, minutes: number, seconds: number);
    constructor(interval: number);
    constructor(date: Date);
    constructor(date: TSDate);
    constructor(stringDate: string); // format ISO-8661 wihout any TZ or only GMT (Zulu time)
    constructor(nullDate: null);
    constructor();
    constructor() {
        let n = arguments.length;
        if (n >= 3) {
            if (!$dayisvalid(arguments[0], arguments[1], arguments[2])) { 
                TSError.throw(`TSDate.constructor() : Bad year, month or day argument`, { arguments:Array.from(arguments)}) ; 
            }
            if (n !== 3 && n !== 6 ) { 
                TSError.throw(`TSDate.constructor() : Wrong number (${n}) of argumens`, { arguments:Array.from(arguments)}) ; 
            }
            if (n === 6) {
                if (!$timeisvalid(arguments[3], arguments[4], arguments[5])) { 
                    TSError.throw(`TSDate.constructor() : Bad hours, minutes or day seconds`, { arguments:Array.from(arguments)}) ; 
                }
                this._timestamp = _insetTimeStamp($timestamp(arguments[0], arguments[1], arguments[2], arguments[3], arguments[4], arguments[5])) ;
            }
            else {
                this._timestamp = _insetTimeStamp($timestamp(arguments[0], arguments[1], arguments[2], 0, 0, 0)) ;
            }
        }
        else if (n === 2) { 
            TSError.throw(`TSDate.constructor() : Wrong number (${n}) of argumens`, { arguments:Array.from(arguments)}) ; 
        }
        else { // n === 1 || n === 0
            let t = arguments[0] ; // undefined if n === 0
            if (t === Number.POSITIVE_INFINITY) { this._timestamp = TSMaxTimeStamp ; }
            else if (t === Number.NEGATIVE_INFINITY) { this._timestamp = TSMinTimeStamp ; }
            else if ($isnumber(t)) { 
                this._timestamp = $insettimestamp(t) ; // we trash the seconds here by making ts an integer
			}
            else if (t instanceof TSDate) {
                this._timestamp = t.timestamp;
			}
			else {
				let comps:TSDateComp|null = null ;

				if ($isstring(t)) {
                    if (t === TSDate.ZULU) {
                        this._timestamp = $div(Date.now(),1000) - TSSecsFrom19700101To20010101 ;
                        return ;
                    }
                    else if (t === TSDate.FUTURE) {
                        this._timestamp = TSMaxTimeStamp ;
                        return ;
                    } 
                    else if (t === TSDate.PAST) {
                        this._timestamp = TSMinTimeStamp ;
                        return ;
                    }
                    else if (t === TSDate.EPOCH) {
                        this._timestamp = - TSSecsFrom19700101To20010101 ;
                        return ;
                    }
                    else {
                        comps = $isostring2components(t as string) ; 
                    } 
                }
				else if (!$ok(t) || t instanceof Date) { comps = $components(t) ; }

				if (!$ok(comps)) { 
                    TSError.throw(`Bad TSDate constructor unique argument: ${t}`, { argument:t }) ; 
                }
				this._timestamp = _insetTimeStamp($components2timestamp(<TSDateComp>comps)) ;
			}
        }
    }

    public static past()   : TSDate { return new TSDate(TSDate.PAST) ; }
    public static future() : TSDate { return new TSDate(TSDate.FUTURE) ; }
    public static zulu()   : TSDate { return new TSDate(TSDate.ZULU) ; }
    public static epoch()  : TSDate { return new TSDate(TSDate.EPOCH) ; }

    public static isDateSource(value:any):boolean
    { return $isnumber(value) || $isdate(value) || value === TSDate.PAST || value === TSDate.FUTURE || value === Number.POSITIVE_INFINITY || value === Number.NEGATIVE_INFINITY ; }

    // this specific method takes a Date representation 
    // in Zulu timezone.
    public static fromZulu(s:Nullable<Date>) : TSDate | null {
        if (!$ok(s)) { return null ; }
        return this.fromComponents({
            year:<uint>s!.getUTCFullYear(), 
            month:<uint>(s!.getUTCMonth()+1), 
            day:<uint>s!.getUTCDate(), 
            hour:<uint>s!.getUTCHours(), 
            minute:<uint>s!.getUTCMinutes(), 
            second:<uint>s!.getUTCSeconds(),
            dayOfWeek:<uint>s!.getUTCDay()
        }) ;
    }

    public static fromEpoch(t:Nullable<number>) : TSDate | null {
        return $isnumber(t) ? new TSDate(t! - TSSecsFrom19700101To20010101) : null ;
    }

    public static from(date:Nullable<number|string|Date>) : TSDate | null {
        if (!$ok(date)) { return null ; }
        if (date === TSDate.FUTURE || date === TSDate.PAST || date === Number.POSITIVE_INFINITY || date === Number.NEGATIVE_INFINITY) { 
            return new TSDate(date as any) ;
        }
        if ($isnumber(date)) { return this.fromTimeStamp(date as number) ; }
        if (date instanceof Date) { return this.fromDate(date as Date) ; }
        return this.fromIsoString(date as string) ;
    }

    public static fromTimeStamp(t:Nullable<number>) : TSDate | null {
        return $isnumber(t) ? new TSDate(t!) : null ;
    }

    public static fromDate(d:Nullable<Date>) : TSDate | null {
        return $ok(d) ? new TSDate(d!) : null ;
    }
    
    // usage TSDate.fromComponents(myComponents)
	// if you only want to set a day, that's up to you to put 0 in hour, minute and second fields
	public static fromComponents(comp:Nullable<TSDateComp>) : TSDate | null {
		if (!$componentsarevalid(comp)) { return null ; }
		const c = comp as TSDateComp ;
		
		// we use the timestamp constructor because we know that our date is valid
		return new TSDate($timestamp(c.year, c.month, c.day, c.hour, c.minute, c.second)) ;
	}

    public static fromIsoString(s:Nullable<string>) : TSDate | null {
        if (!$ok(s)) { return null ; }
        return this.fromComponents($parsedatetime(s, TSDateForm.ISO8601)) ;
    }

	// usage TSDate.fromString(aString[, parsing form])
	public static fromString(s:Nullable<string>, form:TSDateForm=TSDateForm.Standard) : TSDate | null {
		return this.fromComponents($parsedatetime(s, form)) ;
	} 

	// usage TSDate.fromDateString(aString[, parsing form]).
	// this function only parse day date string (no time should be included in the string)
	public static fromDateString(s:Nullable<string>, form:TSDateForm=TSDateForm.Standard) : TSDate | null {
		return this.fromComponents($parsedate(s, form)) ;
	} 


	// ================= instance methods ========================
	public clone():TSDate { return this ; } // no clone on immutable objects
    public toTSDate = this.clone ;

    public get timestamp():number { return this._timestamp ; }
    public valueOf():number { return this._timestamp ; }

    public [Symbol.toPrimitive](hint: "number" | "string" | "default") {
        if (hint === "number" || hint === "default") {
          return this._timestamp ;
        }
        if (hint === "string") {
          return this.toIsoString() ;
        }
        return null;
    }

    public isLeap() : boolean { return $isleap($components(this._timestamp).year); }
    public isFuture() : boolean { return this._timestamp >= TSMaxTimeStamp ; }
    public isPast() : boolean { return this._timestamp <= TSMinTimeStamp ; }
    public isFinite() : boolean { return !this.isPast() && !this.isFuture() ; }

	public dateWithoutTime() { return new TSDate($timestampWithoutTime(this._timestamp)) ; }
    public timeSinceDate(d:TSDate) : number { return this._timestamp - d.timestamp ; }

    public get year() : number   { return $components(this._timestamp).year ; }
    public get month() : number  { return $components(this._timestamp).month ; }
    public get day() : number    { return $components(this._timestamp).day; }
    public get hour() : number   { return $hourFromTimestamp(this._timestamp) ; }
    public get minute() : number { return $minuteFromTimestamp(this._timestamp) ; }
    public get second() : number { return $secondFromTimestamp(this._timestamp) ; }

    public week(offset:number = 0) : number { return $weekOfYear(this._timestamp, offset) ; }
	public dayOfYear() : number { return $dayOfYear(this._timestamp) ; }
    public dayOfWeek(offset:number=0) : number { return $dayOfWeekFromTimestamp(this._timestamp, offset) ; }
    public lastDayOfMonth() : number { let c = $components(this._timestamp) ; return _lastDayOfMonth(c.year, c.month); }

	public dateByAdding(years:number, months:number=0, days:number=0, hours:number=0, minutes:number=0, seconds:number=0) : TSDate {
        if (!$isint(years) || !$isint(months) || !$isint(days) || !$isint(hours) || !$isint(minutes) || !$isint(seconds)) { 
            TSError.throw(`TSDate.dateByAdding() has at lease one non integer argument`, { years:years, months:months, days:days, hours:hours, minutes:minutes, seconds:seconds}) ; 
        }
        let ts = this._timestamp+days*TSDay+hours*TSHour+minutes*TSMinute+seconds ;

        if (!years && !months) { return new TSDate(ts) ; }
		let comp = $components(ts) ;

        const yearsInMonths = $div(Math.abs(months), 12) ;
        years += months > 0 ? yearsInMonths : -yearsInMonths ;
        months += yearsInMonths * (months > 0 ? -12 : 12) ;

        years += comp.year ;
        months += comp.month ;

        if (months > 12) { years ++ ; months -= 12 ; }
        if (months < 1)  { years -- ; months += 12 ; }
        if (years < 1)   { return TSDate.past() ; }
        
        if (comp.day > TSDaysInMonth[months]) {
            comp.day = <uint>(months == 2 && $isleap(years) ? 29 : TSDaysInMonth[months]) ;
        }
    
		return new TSDate($timestamp(years, months, comp.day, comp.hour, comp.minute, comp.second)) ;
	}
    public dateByAddingYears(years:number) : TSDate { return this.dateByAdding(years) ; }
    public dateByAddingMonths(months:number) : TSDate { return this.dateByAdding(0, months) ; }
	public dateByAddingWeeks(weeks:number) : TSDate { return new TSDate(this._timestamp+weeks*TSWeek) ; }
	public dateByAddingDays(days:number) : TSDate { return new TSDate(this._timestamp+days*TSDay) ; }
	public dateByAddingHours(hours:number) : TSDate { return new TSDate(this._timestamp+hours*TSHour) ; }
	public dateByAddingMinutes(mn:number) : TSDate { return new TSDate(this._timestamp+mn*TSMinute) ; }
    public dateByAddingSeconds(seconds:number) : TSDate { return new TSDate(this._timestamp+seconds) ; } // same of dateByAddingTime() but some people asked for it
    public dateByAddingTime(time:number) : TSDate { return new TSDate(this._timestamp+time) ; }

	public firstDateOfYear()  : TSDate  { let c = $components(this._timestamp) ; return new TSDate(c.year,1, 1); }
    public lastDateOfYear()   : TSDate   { let c = $components(this._timestamp) ; return new TSDate(c.year,12, 31); }
    public firstDateOfMonth() : TSDate { let c = $components(this._timestamp) ; return new TSDate(c.year, c.month, 1); }
    public lastDateOfMonth()  : TSDate  { let c = $components(this._timestamp) ; return new TSDate(c.year, c.month, _lastDayOfMonth(c.year, c.month)); }

	public firstDateOfWeek(offset:number=0) : TSDate { 
		const ts = $timestampWithoutTime(this._timestamp) ;
		const dayOfWeek = $dayOfWeekFromTimestamp(ts, offset) ;
		return new TSDate(ts-dayOfWeek*TSDay) ;
	} ;

	public daysSinceDate(aDate:TSDate) : number {
		return $div($timestampWithoutTime(this._timestamp) - $timestampWithoutTime(aDate._timestamp), TSDay) ;
	}

	public toNumber() : number { return this._timestamp ; }
    public toEpoch() : number { return this._timestamp + TSSecsFrom19700101To20010101 ; }
    public toComponents() : TSDateComp { return $components(this._timestamp) ; }

    /**
     @deprecated use toEpoch() instead
    */
    toEpochTimestamp = this.toEpoch ;

    public toDate() : Date { return $components2date($components(this._timestamp)) ; }
    public toUTCDate() : Date { return $components2date($components(this._timestamp), undefined, true) ; }

	public toIsoString(format:IsoDateFormat=TSDateForm.ISO8601) : isodate { 
        return <isodate>$components2string($components(this._timestamp), format) ; 
    }
	
    public toISOString() : string {
        return $components2StringWithOffset($components(this._timestamp), { forceZ:true, milliseconds:0 as uint }) ; 
    }
    
    // ============ TSObject conformance =============== 
    public compare(other:any) : Comparison {
        if (this === other) { return Same ; }
        if (other instanceof TSDate) { return $numcompare(this._timestamp, other.timestamp) ; }
        if (other instanceof Date) { return $datecompare(this, other) ; }
        return undefined ;
    }
    
    public isEqual(other:any) : boolean {
        if (this === other) { return true ; }
        if (other instanceof TSDate) { return this._timestamp === other.timestamp ; }
        if (other instanceof Date) { return $datecompare(other, this) === Same ; }
        return false ;
    }
	
    public toString(format?:Nullable<TSDateForm|string>, locale?:Nullable<language|country|TSCountry|Locales>) : string {
        if (!$ok(format) && !$ok(locale)) { return this.toIsoString() ;}
        return this._toString(false, format, locale) ;
    }

    public toLocaleString(format?:Nullable<TSDateForm|string>,locale?:Nullable<language|country|TSCountry|Locales>) : string {
        return this._toString(true, format, locale) ;
    }

    public toTimezoneString(timezone:string, format?:Nullable<TSDateForm|string>, locale?:Nullable<language|country|TSCountry|Locales>):string {
        return this._toString(timezone, format, locale) ;
    }

    public toJSON(): string { return this.toIsoString() ; }
	public toArray():TSDate[] { return [this] ; }

    // ============ TSLeafInspect conformance =============== 
    public leafInspect(): string { return this.toISOString() ; }
    
    // @ts-ignore
    [customInspectSymbol](depth:number, inspectOptions:any, inspect:any) {
        return this.leafInspect()
    }
    
	// ============ Private methods =============== 
    private _toString(localTimeOrTZ:boolean|string, format?:Nullable<TSDateForm|string>, locale?:Nullable<language|country|TSCountry|Locales>) : string {
        let offset = 0 ; 
        if (typeof localTimeOrTZ == 'string') {
            offset = $timezoneOffsetWithComponents($trim(localTimeOrTZ), $components(this._timestamp)) * TSMinute ;
        }
        else { 
            // here we use the local time zone offset
            offset = !localTimeOrTZ ? 0 : -(this.toDate()).getTimezoneOffset() * TSMinute ; 
        }

        if ($isstring(format)) {
            return $value($components2stringformat($components(this._timestamp+offset), format as string, locale), '') ;
        }
        if (!$ok(format)) { format = TSDateForm.Standard ; }
        return $components2string($components(this._timestamp + offset), format as TSDateForm) ; 
    }
}

/***************************************************************************************************************
 * PUBLIC FUNCTIONS AND CONSTANTS
 ***************************************************************************************************************/

export const TSMinute	= 60 ;
export const TSHour 	= 3600 ;
export const TSDay 	    = 86400 ;
export const TSWeek 	= 604800 ;

export const TSDaysFrom00000229To20010101 = 730792 ;
export const TSDaysFrom00010101To20010101 = 730485 ;

export const TSSecsFrom00010101To20010101 = 63113904000 ;
export const TSSecsFrom19700101To20010101 = 978307200 ;     // this one is exported for conversion from EPOCH to TSDate
export const TSMaxTimeStamp               = 8639031196799 ; // corresponds to the end of the year of 100 000 000 days 
                                                            // from EPOCH in the future (date is 31/12/275760 23:59:59)
export const TSMinTimeStamp               = -TSSecsFrom00010101To20010101 ; // first available date is 01/01/0001

export function $isleap(y: number) : boolean 
{ 
	return !$isint(y) || y % 4 ? false : ( y % 100 ? (y > 7 ? true : false) : (y % 400 || y < 1600 ? false : true)) ; 
}

export function $dayisvalid(year: number, month: number, day: number) : boolean {
	if (!$isint(day) || !$isint(month) || !$isint(year) || day < 1 || day > 31 || month < 1 || month > 12) { return false ; }
	if (day > TSDaysInMonth[month]) { return (month === 2 && day === 29 && $isleap(year)) ? true : false ; }
	return true ;
}

export function $timeisvalid(hour: number, minute: number, second: number) : boolean {
	return ($isint(hour) && $isint(minute) && $isnumber(second) && hour >= 0 && hour < 24 && minute >= 0 && minute < 60 && second >= 0 && second < 60) ;
}

export function $timestamp(year: number, month: number, day: number, hours:number = 0, minutes:number=0, seconds:number=0) : number {

    if (!$dayisvalid(year, month, day)) { 
        TSError.throw(`$timestamp(${year}, ${month}, ${day}): wrong day definition arguments`, { arguments:Array.from(arguments) }) ;
     }
    if (!$timeisvalid(hours, minutes, seconds)) { 
        TSError.throw(`$timestamp(${year}, ${month}, ${day}, ${hours}, ${minutes}, ${seconds}): wrong time arguments`, { arguments:Array.from(arguments) }) ;
    }

	if (month < 3) { month += 12; year--; }

	let leaps = Math.floor(year/4) - Math.floor(year/100) + Math.floor(year/400);

	return Math.floor((day + TSDaysInPreviousMonth[month] + 365 * year + leaps - TSDaysFrom00000229To20010101) * TSDay) + hours * TSHour + minutes * TSMinute + seconds ;
}

export function $secondFromTimestamp(ts: number) : uint { return <uint>(($toint(ts) + TSSecsFrom00010101To20010101) % TSMinute) ; }
export function $minuteFromTimestamp(ts: number) : uint { return <uint>$div(($toint(ts) + TSSecsFrom00010101To20010101) % TSHour,  TSMinute) ; }
export function $hourFromTimestamp(ts: number) : uint { return <uint>$div(($toint(ts) + TSSecsFrom00010101To20010101) %  TSDay,  TSHour) ; }
export function $timestampWithoutTime(ts:number) : number {
    ts = $toint(ts) ; 
    const overhead = (ts+TSSecsFrom00010101To20010101) % TSDay ; 
    return ts - overhead ;
}

export function $dayOfYear(ts:number) : number {
    let c = $components(ts);
    return Math.floor((ts - $timestamp(c.year, 1, 1))/TSDay)+1 ;
}

export function $dayOfWeekFromTimestamp(ts: number, offset: number = 0) {
	return (Math.floor(ts/TSDay)+TSDaysFrom00010101To20010101 + 8 - offset) % 7;
}

export function $weekOfYear(ts:number, offset:number = 0) : number {
    let c = $components(ts);
    offset %= 7;

    let ref = _yearReference(c.year, offset) ;
    if (ts < ref) {
        ref = _yearReference(c.year - 1, offset);
    }
    let week = Math.floor((ts - ref) / TSWeek) + 1 ;
    if (week === 53) {
        ref += 52 * TSWeek ;
        c = $components(ref) ;
        if (c.day >= 29) { week = 1 ; }
    }
    return week ;
}

export function $insettimestamp(ts:number) { return _insetTimeStamp($toint(ts)) ; }

/***************************************************************************************************************
 * PRIVATE FUNCTIONS AND CONSTANTS
 ***************************************************************************************************************/

 const TSDaysInMonth = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] ;
 const TSDaysInPreviousMonth = [0, 0, 0, 0, 31, 61, 92, 122, 153, 184, 214, 245, 275, 306, 337] ;

 function _insetTimeStamp(ts:number)
{ return Math.min(Math.max(TSMinTimeStamp, ts), TSMaxTimeStamp) ; }

function _lastDayOfMonth(year:number, month:number) : number { 
	return (month === 2 && $isleap(year)) ? 29 : TSDaysInMonth[month]; 
}
function _yearReference(y:number, offset:number=0) : number {
	const firstDayOfYear = $timestamp(y, 1, 1) ;
	let d = $dayOfWeekFromTimestamp(firstDayOfYear, offset) ;
	d = (d <= 3 ? -d : 7-d ) ; 
	return firstDayOfYear + d * TSDay ;
}

