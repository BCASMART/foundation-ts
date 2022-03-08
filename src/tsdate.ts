/**
 * This is a timestamp (commencing at 01/01/2001) oriented date class
 */
import { $components, $isostring2components, $parsedate, $parsedatetime, $componentsarevalid, TSDateComp, TSDateForm, $components2string, $components2timestamp, $components2date } from "./tsdatecomp"
import { $isint, $isnumber, $div, $ok, $isstring, $numcompare } from "./commons";
import { Comparison, Same, uint, UINT32_MAX } from "./types";
import { Class, TSObject } from "./tsobject";
import { UnsignedMask } from "./tsrange";

export const TSMinute	= 60 ;
export const TSHour 	= 3600 ;
export const TSDay 	    = 86400 ;
export const TSWeek 	= 604800 ;

const TSDaysFrom00010101To20010101 = 730485 ;
const TSSecsFrom00010101To20010101 = 63113904000 ;
const TSDaysInMonth = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] ;
const TSDaysInPreviousMonth = [0, 0, 0, 0, 31, 61, 92, 122, 153, 184, 214, 245, 275, 306, 337] ;

export const TSDaysFrom00000229To20010101 = 730792 ;
export const TSSecsFrom19700101To20010101 = 978307200 ; // this one is exported for conversion from EPOCH to TSDate

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
	// TODO: verify the numbers here
	var leaps ;
	month = 0 | month ;
	if (month < 3) { month += 12; year--; }

	leaps = Math.floor(year/4) - Math.floor(year/100) + Math.floor(year/400);

	return Math.floor((day + TSDaysInPreviousMonth[month] + 365 * year + leaps - TSDaysFrom00000229To20010101) * TSDay) + hours * TSHour + minutes * TSMinute + seconds ;
}

export function $dayFromTimestamp(t: number) : number { return Math.floor($daytimestamp(t) / TSDay) ; }
export function $secondFromTimestamp(t: number) : uint { return <uint>((t+TSSecsFrom00010101To20010101) % TSMinute) ; }
export function $minuteFromTimestamp(t: number) : uint { return <uint>$div(Math.floor((t+TSSecsFrom00010101To20010101) %  TSHour),  TSMinute) ; }
export function $hourFromTimestamp(t: number) : uint { return <uint>$div(Math.floor((t+TSSecsFrom00010101To20010101) %  TSDay),  TSHour) ; }
export function $daytimestamp(ts:number) : number { return Math.floor(ts - _timeFromTimestamp(ts)) ; }

export class TSDate implements TSObject<TSDate> {
	public timestamp: number ;
    public static readonly FUTURE = 'future' ;
    public static readonly PAST = 'past' ;

	// =================== constructors ==========================
    constructor(year: number, month: number, day: number);
    constructor(year: number, month: number, day: number, hours: number, minutes: number, seconds: number);
    constructor(interval: number);
    constructor(date: Date);
    constructor(date: TSDate);
    constructor(stringDate: string); // au format ISO-8661
    constructor(nullDate: null);
    constructor();
    constructor() {
        let n = arguments.length;
        if (n >= 3) {
            if (!$dayisvalid(arguments[0], arguments[1], arguments[2])) { throw "Bad TSDate() day arguments" ; }
            if (n !== 3 && n !== 6 ) { throw `Impossible to initialize a new TSDate() with ${n} arguments` ; }
            if (n === 6) {
                if (!$timeisvalid(arguments[3], arguments[4], arguments[5])) { throw "Bad TSDate() time arguments" ; }
                this.timestamp = $timestamp(arguments[0], arguments[1], arguments[2], arguments[3], arguments[4], arguments[5]) ;
            }
            else {
                this.timestamp = $timestamp(arguments[0], arguments[1], arguments[2], 0, 0, 0) ;
            }
        }
        else if (n === 2) { throw "Impossible to initialize a new TSDate() with 2 arguments" ; }
        else { // n === 1 || n === 0
            let t = arguments[0] ; // undefined if n === 0
            if ($isnumber(t)) { 
                this.timestamp = t;
			}
            else if (t instanceof TSDate) {
                this.timestamp = t.timestamp;
			}
			else {
				let comps:TSDateComp|null = null ;

				if ($isstring(t)) {
                    if (t === TSDate.FUTURE) {
                        this.timestamp = UINT32_MAX ;
                        return ;
                    } 
                    else if (t === TSDate.PAST) {
                        comps = { year:<uint>1, month:<uint>1, day:<uint>1, hour:<uint>0, minute:<uint>0, second:<uint>0 } ;
                    }
                    else { 
                        comps = $isostring2components(t) ; 
                    } 
                }
				else if (!$ok(t) || t instanceof Date) { comps = $components(t) ; }

				if (!$ok(comps)) { throw "Bad TSDate constructor parameters" ; }
				this.timestamp = $components2timestamp(<TSDateComp>comps) ;
			}
        }
    }

	// usage TSDate.fromComponents(myComponents)
	// if you only want to set a day, that's up to you to put 0 in hour, minute and second fields
	public static fromComponents(comp:TSDateComp|undefined|null) : TSDate | null {
		if (!$componentsarevalid(comp)) { return null ; }
		const c = comp as TSDateComp ;
		
		// we use the timestamp constructor because we know that our date is valid
		return new TSDate($timestamp(c.year, c.month, c.day, c.hour, c.minute, c.second)) ;
	}

	// usage TSDate.fromString(aString[, parsing form])
	public static fromString(s:string|null|undefined, form:TSDateForm=TSDateForm.Standard) : TSDate | null {
		return this.fromComponents($parsedatetime(s, form)) ;
	} 

	// usage TSDate.fromDateString(aString[, parsing form]).
	// this function only parse day date string (no time should be included in the string)
	public static fromDateString(s:string|null|undefined, form:TSDateForm=TSDateForm.Standard) : TSDate | null {
		return this.fromComponents($parsedate(s, form)) ;
	} 


	// ================= instance methods ========================

    public isLeap() : boolean { return $isleap($components(this.timestamp).year); }

	public dateWithoutTime() { return new TSDate($daytimestamp(this.timestamp)) ; }

    public year() : number { return $components(this.timestamp).year ; }
    public month() : number { return $components(this.timestamp).month ; }
    public day() : number { return $components(this.timestamp).day; }
    public hour() : number { return $hourFromTimestamp(this.timestamp) ; }
    public minute() : number { return $minuteFromTimestamp(this.timestamp) ; }
    public second() : number { return $secondFromTimestamp(this.timestamp) ; }

    public week(offset:number = 0) : number {
        let c = $components(this.timestamp);
        offset %= 7;

		let ref = _yearReference(c.year, offset) ;
        if (this.timestamp < ref) {
            ref = _yearReference(c.year - 1, offset);
        }
		let week = Math.floor((this.timestamp - ref) / TSWeek) + 1 ;
		if (week === 53) {
			ref += 52 * TSWeek ;
			c = $components(ref) ;
			if (c.day >= 29) { week = 1 ; }
		}
		return week ;
	}

	public dayOfYear() : number {
        return Math.floor((this.timestamp - $timestamp($components(this.timestamp).year, 1, 1))/TSDay)+1 ;
    }
    public dayOfWeek(offset:number=0) : number { return _dayOfWeekFromTimestamp(this.timestamp, offset) ; }
    public lastDayOfMonth() : number { let c = $components(this.timestamp) ; return _lastDayOfMonth(c.year, c.month); }

	public dateByAdding(years:number, months:number=0, days:number=0, hours:number=0, minutes:number=0, seconds:number=0) : TSDate {
		if (!years && !months) { return new TSDate(this.timestamp+days*TSDay+hours*TSHour+minutes*TSMinute+seconds) }
		let c = $components(this.timestamp) ;
		_addym(c, years, months) ;
		return new TSDate(c.year, c.month, c.day, c.hour, c.minute, c.second) ;
	}
	public dateByAddingWeeks(weeks:number) : TSDate { return new TSDate(this.timestamp+weeks*TSWeek) ; }
	public dateByAddingTime(time:number) : TSDate { return new TSDate(this.timestamp+time) ; }

	public firstDateOfYear()  : TSDate  { let c = $components(this.timestamp) ; return new TSDate(c.year,1, 1); }
    public lastDateOfYear()   : TSDate   { let c = $components(this.timestamp) ; return new TSDate(c.year,12, 31); }
    public firstDateOfMonth() : TSDate { let c = $components(this.timestamp) ; return new TSDate(c.year, c.month, 1); }
    public lastDateOfMonth()  : TSDate  { let c = $components(this.timestamp) ; return new TSDate(c.year, c.month, _lastDayOfMonth(c.year, c.month)); }

	public firstDateOfWeek(offset:number=0) : TSDate { 
		const ts = $daytimestamp(this.timestamp) ;
		const dayOfWeek = _dayOfWeekFromTimestamp(ts, offset) ;
		return new TSDate(ts-dayOfWeek*TSDay) ;
	} ;

	public daysSinceDate(aDate:TSDate) : number {
		return $div($daytimestamp(this.timestamp) - $daytimestamp(aDate.timestamp), TSDay) ;
	}

	public toNumber() : number { return this.timestamp ; }
    public toComponents() : TSDateComp { return $components(this.timestamp) ; }
	public toEpochTimestamp() : number { return this.timestamp + TSSecsFrom19700101To20010101 ; }
    public toDate() : Date {
        return $components2date($components(this.timestamp)) ;
    }
	public toIsoString() : string { return $components2string($components(this.timestamp), TSDateForm.ISO8601) ; }
    public toRangeLocation() : number { return (this.timestamp / 60) & UnsignedMask ; }

	// ============ TSObject conformance =============== 
	public get isa():Class<TSDate> { return this.constructor as Class<TSDate> ; }
	public get className():string { return this.constructor.name ; }
    public compare(other:any) : Comparison {
        if (this === other) { return Same ; }
        if (other instanceof TSDate) { return $numcompare(this.timestamp, other.timestamp) ; }
        return undefined ;
    }
    public isEqual(other:any) : boolean { return this === other || (other instanceof TSDate && other.timestamp === this.timestamp) ; }
	public toString(form:TSDateForm=TSDateForm.Standard) : string { return $components2string($components(this.timestamp), form) ; }
	public toJSON() : string { return $components2string($components(this.timestamp), TSDateForm.ISO8601) ; }
	public toArray():TSDate[] { return [this] ; }
}

function _timeFromTimestamp(t: number) { return ((t+TSSecsFrom00010101To20010101) % TSDay) ; }
function _dayOfWeekFromTimestamp(t: number, offset: number = 0) {
	return ($dayFromTimestamp(t)+TSDaysFrom00010101To20010101 + 7 - (offset % 7)) % 7;
}
function _lastDayOfMonth(year:number, month:number) : number { 
	return (month === 2 && $isleap(year)) ? 29 : TSDaysInMonth[month]; 
}
function _yearReference(y:number, offset:number=0) : number {
	const firstDayOfYear = $timestamp(y, 1, 1) ;
	let d = _dayOfWeekFromTimestamp(firstDayOfYear, offset) ;
	d = (d <= 3 ? -d : 7-d ) ; 
	return firstDayOfYear + d * TSDay ;
}

function _addym(c:TSDateComp, years:number, months:number=0) {
    years += months / 12 ;
    months = (months < 0 ? -((-months) % 12) : months % 12) ;
    let newYear = c.year + years ;
    let newMonth = c.month + months ;

	if (newMonth > 12) { newMonth -= 12 ; newYear++ ; }
    else if (newMonth < 1) { newMonth += 12 ; newYear -- ; }
    if (newYear < 1) { newYear = 1 ; newMonth = 1 ; }
    c.year = <uint>newYear ;
    c.month = <uint>newMonth ;
    if (c.day > TSDaysInMonth[newMonth]) {
        c.day = <uint>(newMonth == 2 && $isleap(newYear) ? 29 : TSDaysInMonth[newMonth]) ;
    }
} 

