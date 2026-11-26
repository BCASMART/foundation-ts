import { $isnumber, $length, $ok, $unsigned, $isstring, $isunsigned, $isint, $tounsigned, $value, $count } from "./commons";
import { $default, $locales, $unitDefinition, LocaleInfo, Locales, UnitDefinition } from "./tsdefaults";
import { 
    $dayisvalid, 
    $timeisvalid, 
    $hourFromTimestamp, 
    $minuteFromTimestamp, 
    $secondFromTimestamp, 
    TSDate, 
    TSDay, 
    $timestamp, 
    TSHour, 
    TSMinute, 
    $weekOfYear, 
    $dayOfYear, 
    TSDaysFrom00000229To20010101, 
    $dayOfWeekFromTimestamp,
    TSMaxTimeStamp,
    TSMinTimeStamp
} from "./tsdate";
import { int, Nullable, StringDictionary, uint, UINT_MIN } from "./types";
import { TSCountry } from "./tscountry";
import { $div, $fpad, $fpad2, $fpad3, $fpad4 } from "./number";
import { $ftrim } from "./strings";
import { $logterm } from "./utils";
import { TSError } from "./tserrors";
import "./date"

export interface TSTimeComp {
	hour:uint;
	minute:uint;
	second:uint;
} ;

export interface TSDateComp extends TSTimeComp {
	year:uint;
	month:uint;
	day:uint;
	dayOfWeek?:uint;
} ;

export interface TSDurationComp {
    days:uint;
    hours:uint;
    minutes:uint;
    seconds:uint;
} ;

export enum TSDateForm {
	Standard = 0,
	English,
	Computer,
	ISO8601,
    ISO8601C,
    ISO8601L
} ;

export type TSDurationDescriptionDepth = 
    'days'        | // duration is banking-rounded to the nearest number of days
    'days-cut'    | // duration takes into account only days by ignoring every sub-units
    'hours'       | // duration is banking-rounded to the nearest number of hours
    'hours-cut'   | // duration takes into account only days and hours by ignoring every sub-units
    'minutes'     | // duration is banking-rounded to the nearest number of minutes
    'minutes-cut' | // duration takes into account only days, hours and minutes by ignoring seconds
    'seconds' ;     // default value: every second of the duration is taken into account for description

export type TSDateTimeFormat = 'date' | 'short-date' | 'date-time' | 'short-date-time' | 'date-short-time' | 'short-date-short-time' ;

export type TSIsoDateForm = TSDateForm.ISO8601 | TSDateForm.ISO8601C | TSDateForm.ISO8601L ;

export type TSDatePredefinedFormat = TSDateTimeFormat | 'time' | 'short-time' ;

/**
 * If you call timecomponents() with no parameters, it
 * returns the components for the current local time.
 * This function can not have a string as parameter ;
 * in order to create components from string, you need
 * to user functions $parsetime()
 */
export function $timecomponents(source: Nullable<number|Date|TSDate>) : TSTimeComp {
	if (!$ok(source)) { source = new Date() ;}
	else if (source instanceof TSDate) { source = source.timestamp ; }

	if ($isnumber(source)) {
		return {
			hour:$hourFromTimestamp(source),
			minute:$minuteFromTimestamp(source),
			second:$secondFromTimestamp(source),
		} ;
	}
	return {
		hour:<uint>source.getHours(), 
		minute:<uint>source.getMinutes(), 
		second:<uint>source.getSeconds(),
	} ;
}

/**
 * If you call components() with no parameters, it
 * returns the components for the current local date.
 * This function can not have a string as parameter ;
 * in order to create components from string, you need
 * to user functions $parsedate(), $parsedatetime() or $isostring2components()
 */
export function $components(source: Nullable<number|Date|TSDate>) : TSDateComp {

	if (!$ok(source)) { source = new Date() ;}
	else if (source instanceof TSDate) { source = (<TSDate>source).timestamp ; }

	if (source === Number.NEGATIVE_INFINITY) { source = TSMinTimeStamp ; }
	else if (source === Number.POSITIVE_INFINITY) { source = TSMaxTimeStamp ; }

	if ($isnumber(source)) {
		const timestamp = Math.max(Math.min(source, TSMaxTimeStamp), TSMinTimeStamp)  ;
		let Z =                  Math.floor(timestamp/TSDay) + TSDaysFrom00000229To20010101 ;
		let gg =                 Z - 0.25 ;
		let CENTURY =            Math.floor(gg/36524.25) ;
		let CENTURY_MQUART =     CENTURY - Math.floor(CENTURY/4) ;
		let ALLDAYS =            gg + CENTURY_MQUART ;
		let Y =                  Math.floor(ALLDAYS / 365.25) ;
		let Y365 =               Math.floor(Y * 365.25) ;
		let DAYS_IN_Y =          CENTURY_MQUART + Z - Y365 ;
		let MONTH_IN_Y =         Math.floor((5 * DAYS_IN_Y + 456)/153) ;

		return {
			day:<uint>Math.floor(DAYS_IN_Y - Math.floor((153*MONTH_IN_Y - 457) / 5)),
			hour:$hourFromTimestamp(timestamp),
			minute:$minuteFromTimestamp(timestamp),
			second:$secondFromTimestamp(timestamp),
			dayOfWeek:<uint>((Z + 2) % 7),
			month: <uint>(MONTH_IN_Y > 12 ? MONTH_IN_Y - 12 : MONTH_IN_Y),
			year: <uint>(MONTH_IN_Y > 12 ? Y + 1 : Y)
		} ;
	}

    if (!(source instanceof Date)) {
        TSError.throw(`$components() source is not a valid number, nor a Date nor a TSDate`, { source:source }) ;
    }
	
	return {
		year:<uint>source.getFullYear(), 
		month:<uint>(source.getMonth()+1), 
		day:<uint>source.getDate(), 
		hour:<uint>source.getHours(), 
		minute:<uint>source.getMinutes(), 
		second:<uint>source.getSeconds(),
		dayOfWeek:<uint>source.getDay()
	} ;
}

export function $componentsarevalid(comp:Nullable<TSDateComp>) : boolean {
	if (!$ok(comp)) { return false } ;
	const c = comp as TSDateComp ;
	return $dayisvalid(c.year, c.month, c.day) && $timeisvalid(c.hour, c.minute, c.second) ;
}

export function $componentshavetime(c:TSDateComp) : boolean {
	return c.hour > 0 || c.minute > 0 || c. second > 0
}

// These regular expressions are applied on trimmed strings (String.trim() removes the
// same characters as \s). All their quantifiers are bounded or applied on disjoint
// character sets, so there's no catastrophic backtracking.
// Since both optional groups have the same pattern, there cannot be seconds without minutes
const TIME_PARSE_REGEX = /^(?<hours>\d{1,6})(?:\s*[:.]\s*(?<minutes>\d{1,2}))?(?:\s*[:.]\s*(?<seconds>\d{1,2}))?$/ ;

export function $parsetime(s:Nullable<string>) : TSTimeComp|null {
	if (!$length(s)) { return null ; }
	// hours may be a packed number
	const g = TIME_PARSE_REGEX.exec(s!.trim())?.groups ;
	if (!$ok(g)) { return null ; }
	const c:TSTimeComp = { hour:UINT_MIN, minute:UINT_MIN, second:UINT_MIN } ;

	if (!_fillTime(c, g!.hours, g!.minutes, g!.seconds)) { return null ; }
	return $timeisvalid(c.hour, c.minute, c.second) ? c : null ;
}

/**
 * These 2 functions parse a date or a date time.
 * Dependending on which date-form you choose to parse the given string, you may ommit
 * the month or the year, the system will autocomplete the components itself ; you
 * also may enter the year with 2 or 4 digits and the system will try to interpret
 * all 2 digits years as years from the previous or the current century. The limit
 * for that is : all date that seems to be more than 20 years in the future will
 * be considered as a previous century year. Note that if you date is not complete
 * you won't be able to enter a time.
 * 
 * If you want to create a TSDate from a parsed string, you don't need this 
 * function. Simply call :
 * 
 *   myDate = TSDate.fromString(myStringToParse [, dateForm]) ; // this does not throw but return can be null
 * 
 * ==WARNING== dayOfWeek is not initialized after parsing.
 */
const DATE_PARSE_REGEX = /^(?<n1>\d{1,8})(?:[-/.](?<n2>\d{1,2})(?:[-/.](?<n3>\d{1,4}))?)?$/ ;
const SPACE_REGEX = /\s/ ;
// a complete date, a '-' and a time, as written by $components2string() (eg. 15/03/2020-14:30:05)
const DATE_DASH_TIME_REGEX = /^(\d{1,8}[-/.]\d{1,2}[-/.]\d{1,4})-(\d.*)$/ ;

export function $parsedatetime(s:Nullable<string>, form:TSDateForm=TSDateForm.Standard) : TSDateComp|null {
	return _parsedt(s, true, form) ;
}

export function $parsedate(s:Nullable<string>, form:TSDateForm=TSDateForm.Standard) : TSDateComp|null {
	return _parsedt(s, false, form, { noTime:true }) ;
}

/**
 * This function parse an ISO8601 OR ISO3339 date string. In both case, you may
 * enter the year with 2 to 6 digits and the system will try to interpret
 * all 2 digits years as years from the previous or the current century. The limit
 * for that is : all date that seems to be more than 20 years in the future will
 * be considered as a previous century year. We also admit to have only day dates
 * (e.g no time specified) which is normally impossible with ISO3339. On the contrary, 
 * we force the use of the T or t separator between day & time which is not the case is 3339.
 * Finany and it is VERY IMPORTANT: since TSDate and TSDateComp deal with
 * local dates (dates with no time zone at all), the time zone information 
 * MUST NOT BE PRESENT AT THE END OF THE PARSED STRING. 
 * 
 * In order to create a TSDate from a string you don't need this function. You simply use :
 * 
 *  date = new TSDate(anISODateString) ; // this throw an error if the parsed string is wrong
 * 
 * But, as we know,  a lot of programmers use GMT dates as local dates and you also may get
 * string dates comming from an API and expressed in GMT. For that reason, we acccept that the
 * indication of the GMT time zone (but no other one) can be present at the end of the string to
 * parse. This indication may come with the Z letter of something like +00 or +0000 or +00:00.
 * 
 * This facility to consider GMT dates as "no time zone date" is offered at the entire responsability
 * of the user programmer.
 *  
 * ==WARNING== dayOfWeek is not initialized after parsing.
 */
export interface Iso8601ParseOptions {
	noTime?:boolean ;
}
const ISO_DATE_REGEX          = /^(?<year>\d{2,6})-(?<month>\d{1,2})-(?<day>\d{1,2})$/ ;
const ISO_TIME_REGEX          = /^(?<hour>\d{1,2})(?::(?<minute>\d{1,2})(?::(?<second>\d{1,2})(?:\.000)?)?)?$/ ;
const COMPACT_ISO_DATE_REGEX  = /^(?<year>\d{4})(?<month>\d{2})(?<day>\d{2})$/ ;
const COMPACT_ISO_TIME_REGEX  = /^(?<hour>\d{2})(?:(?<minute>\d{2})(?:(?<second>\d{2})(?:\.000)?)?)?$/ ;
const ISO_TIME_SEPARATOR_REGEX = /[Tt]/ ;
const GMT_ZONE_REGEX          = /(?:[Zz]|\+00(?::?00)?)$/ ; // only accepted after a time

export function $isostring2components(source:Nullable<string>, opts:Iso8601ParseOptions={}) : TSDateComp|null {
    const s = $ftrim(source) ;
	if (!s.length) { return null ; }

    const g = _isoGroups(s, !!opts.noTime) ;
    if (!$ok(g)) { return null ; }
	// absent time groups give UINT_MIN
	const c:TSDateComp = {
		year:_yearFrom(g!.year),
		month:$unsigned(g!.month),
		day:$unsigned(g!.day),
		hour:$unsigned(g!.hour),
		minute:$unsigned(g!.minute),
		second:$unsigned(g!.second)
	}
	return $componentsarevalid(c) ? c : null ;
}

// a date, a 'T' or 't' and a time followed by an optional GMT time zone, in the extended
// (2024-12-31T12:00:00) or the compact (20241231T120000) form
function _isoGroups(s:string, noTime:boolean):Nullable<StringDictionary> {
	const t = s.search(ISO_TIME_SEPARATOR_REGEX) ;
	if (t < 0) { return ISO_DATE_REGEX.exec(s)?.groups ?? COMPACT_ISO_DATE_REGEX.exec(s)?.groups ; }
	if (noTime) { return null ; }
	const date = s.slice(0, t) ;
	const time = s.slice(t + 1).replace(GMT_ZONE_REGEX, '') ;
	return _dateTimeGroups(date, time, ISO_DATE_REGEX, ISO_TIME_REGEX) ?? _dateTimeGroups(date, time, COMPACT_ISO_DATE_REGEX, COMPACT_ISO_TIME_REGEX) ;
}

function _dateTimeGroups(date:string, time:string, dateRegex:RegExp, timeRegex:RegExp):Nullable<StringDictionary> {
	const d = dateRegex.exec(date)?.groups ;
	if (!$ok(d)) { return null ; }
	const t = timeRegex.exec(time)?.groups ;
	return $ok(t) ? { ...d, ...t } : null ;
}

export function $components2timestamp(c:TSDateComp) : number {
	return $timestamp(c.year, c.month, c.day, c.hour, c.minute, c.second) ;
}

export function $components2date(c:TSDateComp, milliseconds:number = 0, utcDate:boolean = false) : Date {
	return utcDate ? // NOSONAR: I want to have only one method here
            new Date(Date.UTC(c.year, c.month - 1, c.day, c.hour, c.minute, c.second, milliseconds)) : 
            new Date(c.year, c.month - 1, c.day, c.hour, c.minute, c.second, milliseconds);
}

export function $timezoneOffsetWithComponents(tzString:string, c:TSDateComp) {
    try { 
        const tc = $components(new Date((new Date(Date.UTC(c.year, c.month - 1, c.day, c.hour, c.minute, c.second, 0))).toLocaleString("en-US", {timeZone: tzString}))) ;
        return ($timestamp(tc.year, tc.month, tc.day, tc.hour, tc.minute, tc.second) - $timestamp(c.year, c.month, c.day, c.hour, c.minute, c.second)) / TSMinute ;
    }
    catch { return 0 ; }
}

export function $components2string(c:TSDateComp, form:TSDateForm=TSDateForm.Standard) : string {
	switch(form) {
		case TSDateForm.ISO8601: 
			return `${$fpad4(c.year)}-${$fpad2(c.month)}-${$fpad2(c.day)}T${$fpad2(c.hour)}:${$fpad2(c.minute)}:${$fpad2(c.second)}` ;
        case TSDateForm.ISO8601C:
			return `${$fpad4(c.year)}${$fpad2(c.month)}${$fpad2(c.day)}T${$fpad2(c.hour)}${$fpad2(c.minute)}${$fpad2(c.second)}` ;
        case TSDateForm.ISO8601L:
			return `${$fpad(c.year,6)}-${$fpad2(c.month)}-${$fpad2(c.day)}T${$fpad2(c.hour)}:${$fpad2(c.minute)}:${$fpad2(c.second)}` ;
		case TSDateForm.Standard:
			return $componentshavetime(c) ? `${$fpad2(c.day)}/${$fpad2(c.month)}/${$fpad4(c.year)}-${$fpad2(c.hour)}:${$fpad2(c.minute)}:${$fpad2(c.second)}`
						                  : `${$fpad2(c.day)}/${$fpad2(c.month)}/${$fpad4(c.year)}` ;
		case TSDateForm.English:
			return $componentshavetime(c) ? `${$fpad2(c.month)}/${$fpad2(c.day)}/${$fpad4(c.year)}-${$fpad2(c.hour)}:${$fpad2(c.minute)}:${$fpad2(c.second)}`
						                  : `${$fpad2(c.month)}/${$fpad2(c.day)}/${$fpad4(c.year)}` ;
		case TSDateForm.Computer:
			return $componentshavetime(c) ? `${$fpad4(c.year)}/${$fpad2(c.month)}/${$fpad2(c.day)}-${$fpad2(c.hour)}:${$fpad2(c.minute)}:${$fpad2(c.second)}`
						                  : `${$fpad4(c.year)}/${$fpad2(c.month)}/${$fpad2(c.day)}` ;
	}
}

export interface TSStringWithOffsetOptions {
    form?:TSIsoDateForm ;
    minutesOffset?:int ;
    milliseconds?:uint ;
    forceZ?:boolean ;
} ;
/** @deprecated use TSStringWithOffsetOptions */
export type $c2StrWOffsetOpts = TSStringWithOffsetOptions ;

export function $components2StringWithOffset(c:TSDateComp, opts:TSStringWithOffsetOptions = {}) {

    if (!$ok(opts.form)) { opts.form = TSDateForm.ISO8601 ; }
    if (!$ok(opts.minutesOffset)) { opts.minutesOffset = 0 as int ; }
    _checkStringWithOffsetOptions(opts) ;

    const m = opts.minutesOffset! as int ;
    const a = Math.abs(m) ;
    let s = $components2string(c, opts.form!) ;
    
    if ($ok(opts.milliseconds)) {
        s += '.'+$fpad3(opts.milliseconds) ;
    }

    // in short form, we use Z, +HH and +HHMM offsets
    if (opts.form === TSDateForm.ISO8601C) { return s + _compactOffset(m) ; }
    if (!a && opts.forceZ) { return s+'Z' ; }

    // other forms commes with +HH:MM offsets, even for hour's round offsets
    return `${s}${m<0?'-':'+'}${$fpad2($div(a, 60) as int)}:${$fpad2((a % 60) as int)}` ;
}

function _checkStringWithOffsetOptions(opts:TSStringWithOffsetOptions) {
    if (!$isint(opts.minutesOffset)) { 
        TSError.throw('$components2StringWithOffset() : output time zone offset must be an integer', { timeZoneOffset:opts.minutesOffset}) ;
    }
    if (Math.abs(opts.minutesOffset!) % 15 !== 0) { 
        TSError.throw('$components2StringWithOffset() : output time zone offset must be multiple of 15', { timeZoneOffset:opts.minutesOffset}) ;
    }
    if ($ok(opts.milliseconds) && !$isunsigned(opts.milliseconds, 999)) { 
        TSError.throw('$components2StringWithOffset() : milliseconds offset should be in 0...999 range', {millisecondsOffset:opts.milliseconds}) ;
    }    
}

// Z, +HH or +HHMM offsets
function _compactOffset(m:int):string {
    const a = Math.abs(m) ;
    if (!a) { return 'Z' ;}
    const hoursOffset = `${m < 0 ? '-' : '+'}${$fpad2($div(a, 60) as int)}` ;
    return a % 60 === 0 ? hoursOffset : hoursOffset + $fpad2((a % 60) as int) ;
}

/**
 *      date format documentation :
 * 
 *      %Y  year padded to 4 digits 
 *      %y  year paddeed to 2 digits (centuries are ommited)
 *      %z  non padded year
 * 
 *      %m  month padded to 2 digits
 *      %n  not padded month
 *      %b  short month name
 *      %B  month name
 * 
 *      %d  day padded to 2 digits
 *      %e  not padded day
 *      %E  not padded simple ordinal day
 * 
 *      %f  day of week (0 = sunday, 1 = monday, ..., 6 = Saturday)
 *      %F  day of week calculated with the current local starting day (0 = monday in France)
 *      %a  short day of week name
 *      %A  day of week name
 * 
 *      %q  day of year padded to 3 digits
 *      %r  not padded day of year
 * 
 *      %H  24 hour representation padded to 2 digits
 *      %I  12 hour representation padded to 2 digits
 *      %J  not padded 24 hour representation of hours
 *      %K  not padded 12 hour representation of hours
 *      %M  minutes padded to 2 digits
 *      %N  not padded minutes 
 *      %P  AM/PM
 *      %S  seconds padded to 2 digits     
 *      %T  not padded seconds
 * 
 *      %p  standard partial time format for the given language (time without seconds)
 *      %t  standard time format for the given language
 *
 *      %v  week of year padded to 2 digits
 *      %w  not padded week of year
 * 
 *      %x  standard short date format for the given language
 *      %X  standard date format for the given language
 *            
 *      %%  % caracter
 *      %[  enters a format zone which will be disabled if the passed date has no time
 *          (meaning enabled if hour > 0 || minute > 0 || second > 0)
 *      %]  exit previous format zone without time
 */
export function $components2stringformat(comp:TSDateComp, format:Nullable<string>='', locale?:LocaleInfo) : string | null {
    if (!$componentsarevalid(comp)) { return null ; }
    const trs = !$ok(locale) || $isstring(locale) || (locale instanceof TSCountry) ? $locales(locale as any) : locale as Locales ;
    const ctx:DateDirectiveContext = { comp:comp, ts:$components2timestamp(comp), trs:trs, locale:locale } ;
    const fmt = _dateFormat(format, trs) ;
    const fmtlen = fmt.length ;
    const st:DateFormatState = { ret:'', skipIncludedIfNoTime:false } ;
    let escape = false ;
    
    for (let i = 0 ; i < fmtlen ; i++) {
        const c = fmt.charAt(i) ;
        if (escape) {
            escape = false ;
            if (st.skipIncludedIfNoTime) { st.skipIncludedIfNoTime = c !== ']' ; }
            else if (!_appendDateDirective(st, c, ctx)) { return null ; }
        }
        else if (c === '%') { escape = true ; }
        else if (!st.skipIncludedIfNoTime) { st.ret += c ; } 
    }
    if (escape && !st.skipIncludedIfNoTime) { st.ret += '%' ; }
    return st.ret ;
}

interface DateFormatState {
    ret:string ;
    skipIncludedIfNoTime:boolean ;
}

function _dateFormat(format:Nullable<string>, trs:Locales):string {
    if (!$length(format)) { return trs.dateTimeFormat ; }
    switch (format as TSDatePredefinedFormat) {
        case 'date':                    return trs.dateFormat ;
        case 'short-date':              return trs.shortDateFormat ;
        case 'date-time':               return trs.dateTimeFormat ;
        case 'short-date-time':         return trs.shortDateTimeFormat ;
        case 'date-short-time':         return trs.datePartialTimeFormat ;
        case 'short-date-short-time':   return trs.shortDatePartialTimeFormat ;
        case 'time':                    return trs.timeFormat ;
        case 'short-time':              return trs.partialTimeFormat ;
        default:                        return format! ; 
    }
}

interface DateDirectiveContext {
    comp:TSDateComp ;
    ts:number ;             // the timestamp of comp
    trs:Locales ;
    locale?:LocaleInfo ;    // NOSONAR: optional. the locale used for sub-formats
}

// returns false if the date cannot be formatted
function _appendDateDirective(st:DateFormatState, c:string, ctx:DateDirectiveContext):boolean {
    if (c === '[') { 
        st.skipIncludedIfNoTime = ctx.comp.hour == 0 && ctx.comp.minute == 0 && ctx.comp.second == 0 ; 
        return true ;
    }
    const handler = _dateDirectiveHandlers[c] ;
    const s = $ok(handler) ? handler(ctx) : '%' + c ;
    if (!$ok(s)) { return false ; }
    st.ret += s! ;
    return true ;
}

function _hour12(h:number):number { return h > 12 ? h - 12 : h ; }

// the date format directives (see $components2stringformat() documentation).
// A handler returns null only if a sub-format cannot be formatted
const _dateDirectiveHandlers:{[key:string]:(x:DateDirectiveContext) => string|null} = {
    '%': ()  => '%',
    'a': (x) => `${x.trs.shortDays[$dayOfWeekFromTimestamp(x.ts)]}`,
    'A': (x) => `${x.trs.days[$dayOfWeekFromTimestamp(x.ts)]}`,
    'b': (x) => `${x.trs.shortMonths[x.comp.month-1]}`,
    'B': (x) => `${x.trs.months[x.comp.month-1]}`,
    'd': (x) => $fpad2(x.comp.day),
    'e': (x) => `${x.comp.day}`,
    'E': (x) => `${x.comp.day < $count(x.trs.ordinals) ? x.trs.ordinals![x.comp.day] : x.comp.day}`,
    'f': (x) => `${$dayOfWeekFromTimestamp(x.ts)}`,
    'F': (x) => `${$dayOfWeekFromTimestamp(x.ts, x.trs.startingWeekDay)}`,
    'H': (x) => $fpad2(x.comp.hour),
    'J': (x) => $fpad2(_hour12(x.comp.hour) as uint),
    'I': (x) => `${x.comp.hour}`,
    'K': (x) => `${_hour12(x.comp.hour)}`,
    'm': (x) => $fpad2(x.comp.month),
    'M': (x) => $fpad2(x.comp.minute),
    'N': (x) => `${x.comp.minute}`,
    'n': (x) => `${x.comp.month}`,
    'p': (x) => $components2stringformat(x.comp, x.trs.partialTimeFormat, x.locale),
    'P': (x) => `${x.trs.ampm[x.comp.hour <= 12 ? 0 : 1]}`,
    'q': (x) => $fpad3($dayOfYear(x.ts)),
    'r': (x) => `${$dayOfYear(x.ts)}`,
    'S': (x) => $fpad2(x.comp.second),
    'T': (x) => `${x.comp.second}`,
    't': (x) => $components2stringformat(x.comp, x.trs.timeFormat, x.locale),
    'v': (x) => $fpad2($weekOfYear(x.ts, x.trs.startingWeekDay)),
    'w': (x) => `${$weekOfYear(x.ts, x.trs.startingWeekDay)}`,
    'x': (x) => $components2stringformat(x.comp, x.trs.shortDateFormat, x.locale),
    'X': (x) => $components2stringformat(x.comp, x.trs.dateFormat, x.locale),
    'y': (x) => $fpad2((x.comp.year % 100) as uint),
    'Y': (x) => $fpad4(x.comp.year),
    'z': (x) => `${x.comp.year}`,
    ']': ()  => '', // closing a zone we're not skipping
} ;

export function $datetimeDescription(
    date:TSDateComp|Date|TSDate|number, 
    predefinedFormat:TSDateTimeFormat, 
    locale:LocaleInfo=undefined,
    timezoneOffset?:Nullable<number>):string|null
{
    let ts:number ;
    if (date instanceof Date || date instanceof TSDate) { ts = date.timestamp ; }
    else { ts = typeof date === 'number' ? date : $components2timestamp(date as TSDateComp) ; }
    ts += $value(timezoneOffset, 0) ;
    
    return $components2stringformat($components(ts), predefinedFormat, locale) ;
}

export function $durationcomponents(duration: Nullable<number>) : TSDurationComp {
    if ($ok(duration) && duration < 0) { 
        TSError.throw('$durationcomponents() : duration must be positive or 0', { duration:duration}) ;
    }
    let time:number = $tounsigned(duration) ; // we trash subseconds duration digits
    let d:number, h:number, m:number ;

    d = $div(time,TSDay) ;
    time -= d*TSDay ;
    h = $div(time, TSHour) ;
    time -= h*TSHour ;
    m = $div(time, TSMinute) ;

    return { 
        days:d as uint, 
        hours:h as uint, 
        minutes:m as uint, 
        seconds:(time-m*TSMinute) as uint 
    }
}


export function $duration(comps:TSDurationComp):number {
    return comps.days*TSDay+comps.hours*TSHour+comps.minutes*TSMinute+comps.seconds ;
}

export function $duration2String(comps:TSDurationComp, format?:Nullable<string>):string {
    // we reexport in number before constructing the string in order
    // to normalize the number of days, hours, minutes and seconds
    return $durationNumber2StringFormat($duration(comps), format) ;
}



export interface TSDurationDescriptionOptions {
    depth?:Nullable<TSDurationDescriptionDepth> ; // NOSONAR: optional
    locale?:LocaleInfo ;  // NOSONAR: optional
    noDays?:Nullable<boolean> ;  // NOSONAR: optional
}
/** @deprecated use TSDurationDescriptionOptions */
export type $durationDescriptionOptions = TSDurationDescriptionOptions ;

// hoisted to module scope for the same reason as the directive handlers above :
// avoids redefining a closure over `a`/`locale` on every $durationDescription() call.
function _durationRepString(key:string, value:number, defaultDefinition:UnitDefinition, locale:LocaleInfo):string {
    const def = $value($unitDefinition(key, locale), defaultDefinition) ;
    return `${value} ${value===1?def?.singular:def.plural}` ;
}

export function $durationDescription(comps:TSDurationComp|number, opts?:Nullable<TSDurationDescriptionOptions>) {
    // we reexport in number before constructing the string in order
    // to normalize the number of days, hours, minutes and seconds
    let duration = typeof comps === 'number' ? comps : $duration(comps) ;
    let c = $isunsigned(duration) ? $durationcomponents(duration) : null ;
    if (!$ok(c)) { return '' ; }

    _roundDurationComponents(c!, duration, opts?.depth) ;
    const a:string[] = [] ;
    const locale = opts?.locale ;
    if (!!opts?.noDays && c!.days > 0) {
        c!.hours = (c!.hours + 24 * c!.days) as uint ;
        c!.days = UINT_MIN ;
    }
    if (c!.days > 0)    { a.push(_durationRepString('day',    c!.days,    { singular:'day', plural:'days', unit:'' }, locale)) ; }
    if (c!.hours > 0)   { a.push(_durationRepString('hour',   c!.hours,   { singular:'hour', plural:'hours', unit:'' }, locale)) ; }
    if (c!.minutes > 0) { a.push(_durationRepString('minute', c!.minutes, { singular:'minute', plural:'minutes', unit:'' }, locale)) ; }
    if (c!.seconds > 0) { a.push(_durationRepString('second', c!.seconds, { singular:'second', plural:'seconds', unit:'' }, locale)) ; }

    return a.join(' ') ;
}

function _roundDurationComponents(c:TSDurationComp, duration:number, depth:Nullable<TSDurationDescriptionDepth>) {
    switch (depth) {
        case 'days':
            if ((duration % TSDay) >= TSDay/2) { c.days ++ ; } 
            c.hours = UINT_MIN ; c.minutes = UINT_MIN ; c.seconds = UINT_MIN ;
            break ;
        case 'days-cut':
            c.hours = UINT_MIN ; c.minutes = UINT_MIN ; c.seconds = UINT_MIN ;
            break ;
        case 'hours':
            if ((duration % TSHour) >= TSHour/2) { c.hours++ ; _carryDurationHours(c) ; }
            c.minutes = UINT_MIN ; c.seconds = UINT_MIN ;
            break ;
        case 'hours-cut':
            c.minutes = UINT_MIN ; c.seconds = UINT_MIN ;
            break ;
        case 'minutes':
            if (c.seconds >= 30) { _roundUpDurationMinutes(c) ; }
            c.seconds = UINT_MIN ;
            break ;
        case 'minutes-cut':
            c.seconds = UINT_MIN ;
            break ;
        default:
            // full depth = seconds
            break ;
    }
}

function _carryDurationHours(c:TSDurationComp) { if (c.hours === 24) { c.days ++ ; c.hours = UINT_MIN ; } }

function _roundUpDurationMinutes(c:TSDurationComp) {
    c.minutes++ ;
    if (c.minutes === 60) { c.hours ++ ; c.minutes = UINT_MIN ; }
    _carryDurationHours(c) ;
}


/**
 *      duration Format documentation :
 *
 *      %%  % character
 * 
 *      %d  non formated days duration
 *      %D  2-digits formated days duration
 *      %E  3-digits formated days duration
 *      %(  introducing conditional part of format valid only if days > 0
 *          only %%, %), %p, %[ %{, %<, %≤, %d, %D and %E can be used in this 
 *          conditional format part. All other escape schemas are copied as it 
 *          in the final string
 *      %)  terminating conditional part of format valid only if days > 0
 *      %p  else of the conditional part of parenthesis conditional part. In that else
 *          part only text and %%, %p, %) sequences are allowed
 * 
 *      %h  non formated hours (< 24h) duration
 *      %H  2-digits formated hours (< 24h) duration
 *      %i  non formated hours (including days) duration
 *      %I  2 digit formated hours (including days) duration
 *      %J  3 digit formated hours (including days) duration
 * 
 *      %m  non formated minutes duration
 *      %M  2-digits formated minutes duration
 * 
 *      %s  non formated seconds duration
 *      %S  2-digits formated seconds duration
 *      %{  introducing conditional part of format valid only if seconds > 0
 *          only %%, %}, %b, %(, %[, %<, %≤, %s, %S can be used in this conditional 
 *          format part. All other escape schemas are copied as it in the final string
 *      %}  terminating conditional part of format valid only if seconds > 0
 *      %b  else of the conditional part of curly bracket conditional part. In that else
 *          part only text and %%, %b, %} sequences are allowed
 *
 *      %[  introducing conditional part of format valid only if we have a duration 
 *          where we have seconds, minutes or hours defined. In this conditional part
 *          only %], %%, %!, %(, %{, %<, %≤, %h, %H, %i, %I, %J, %m, %M, %s, %S can 
 *          be used. All other escape sequences are copied as it in the final string
 *      %]  ending precedent conditional part
 *      %!  else of the conditional part of bracket conditional part. In that else
 *          part only text and %%, %!, %] sequences are allowed
 *
 *      %≤  introducing conditional part of format valid only if hours > 0. Only %≥, %%, %q, %<,
 *          %(, %[, %{, %h, %H, %i, %I, %J escape sequence can be used here. All other escape
 *          sequences are copied as it in the final string
 *      %≥  ending precedent conditional part
 *      %q  else of the precedent conditional part. In that else part, only text and %%, %q,
 *          and %≥ sequences are allowed
 * 
 *      %<  introducing conditional part of format valid only if minutes > 0 or seconds > 0
 *          only %%, %c, %>, %(, %[, %{, %≤, %m, %M, %s, %S can be used in this conditional 
 *          format part. All other escape schemas are copied as it in the final string
 *      %>  terminating conditional part of format valid only if minutes > 0 or seconds > 0
 *      %c  else of the conditional part of comparison bracket conditional part. In that else
 *          part only text and %%, %c, %> sequences are allowed
 * 
 *      You can use $setdefault('debugDurationStateAutomat', true) ; before calling the present
 *      function in order to debug the format automat if you think you don't obtain what you should
 */

// Directive handlers for $durationNumber2StringFormat() : hoisted to module
// scope, allocated once, and shared by every call instead of being redefined
// as ~15 fresh closures per call (the previous _d/_D/_E/.../_pop/_push/_default
// functions each closed over that call's comp/ret/stack/state/elsePart). Each
// handler here only reads the (per-call) duration components it's given, so
// the table never needs to change ; the state machine itself is described
// by the DurationFormatState, _durationFormatParts and _durationFormatOpeners
// tables below.
const _durationDirectiveHandlers:{[key:string]:(comp:TSDurationComp) => string} = {
    'd': (c) => `${c.days}`,
    'D': (c) => $fpad2(c.days),
    'E': (c) => $fpad3(c.days),
    'h': (c) => `${c.hours}`,
    'H': (c) => $fpad2(c.hours),
    'i': (c) => `${c.days*24 + c.hours}`,
    'I': (c) => $fpad2((c.days*24 + c.hours) as uint),
    'J': (c) => $fpad3((c.days*24 + c.hours) as uint),
    'm': (c) => `${c.minutes}`,
    'M': (c) => $fpad2(c.minutes),
    's': (c) => `${c.seconds}`,
    'S': (c) => $fpad2(c.seconds),
} ;

function _durationFormatDefault(c:string):string { return c === '%' ? '%' : `%${c}` ; }

// the automat states of $durationNumber2StringFormat(). Each conditional part state
// is an even number immediately followed by its escape state.
enum DurationFormatState {
    Standard = 0,
    StandardEscape,
    DaysPart,
    DaysPartEscape,
    HoursPart,
    HoursPartEscape,
    SecondsPart,
    SecondsPartEscape,
    SubdaysPart,
    SubdaysPartEscape,
    SubhoursPart,
    SubhoursPartEscape,
} ;

interface DurationFormatPart {
    opener:string ;     // the char (after %) opening the part
    closing:string ;    // the char (after %) closing the part
    elseChar:string ;   // the char (after %) switching to the else part
    directives:string ; // the directives allowed in the part
}

const _durationFormatParts:{[state:number]:DurationFormatPart} = {
    [DurationFormatState.DaysPart]:     { opener:'(', closing:')', elseChar:'p', directives:'DdE' },
    [DurationFormatState.HoursPart]:    { opener:'≤', closing:'≥', elseChar:'q', directives:'HhIiJ' },
    [DurationFormatState.SecondsPart]:  { opener:'{', closing:'}', elseChar:'b', directives:'Ss' },
    [DurationFormatState.SubdaysPart]:  { opener:'[', closing:']', elseChar:'!', directives:'HhIiJMmSs' },
    [DurationFormatState.SubhoursPart]: { opener:'<', closing:'>', elseChar:'c', directives:'MmSs' },
} ;

const _durationFormatOpeners:{[c:string]:DurationFormatState} = {
    '(': DurationFormatState.DaysPart,
    '≤': DurationFormatState.HoursPart,
    '{': DurationFormatState.SecondsPart,
    '[': DurationFormatState.SubdaysPart,
    '<': DurationFormatState.SubhoursPart,
} ;

interface DurationFormatAutomat {
    comp:TSDurationComp ;
    visibility:{[state:number]:boolean} ;   // is the (non else) part of each conditional part visible
    state:DurationFormatState ;
    elsePart:boolean ;
    stack:{state:DurationFormatState, elsePart:boolean}[] ;
    ret:string ;
}

export function $durationNumber2StringFormat(duration: Nullable<number>, format?:Nullable<string>) : string {
    const comp = $durationcomponents(duration) ;

    if (!$length(format)) { format = "%(%d-%)%H:%M%{:%S%}" ; }
    const fmt = format! ;
    const fmtlen = fmt.length ;
    const subhour = comp.minutes > 0 || comp.seconds > 0 ;
    const subday = comp.hours > 0 || subhour ;
    const a:DurationFormatAutomat = {
        comp:comp,
        visibility: {
            [DurationFormatState.DaysPart]:     comp.days > 0,
            [DurationFormatState.HoursPart]:    comp.hours > 0,
            [DurationFormatState.SecondsPart]:  comp.seconds > 0,
            [DurationFormatState.SubdaysPart]:  subday,
            [DurationFormatState.SubhoursPart]: subhour,
        },
        state:DurationFormatState.Standard,
        elsePart:false,
        stack:[],
        ret:''
    } ;
    const debug = $default("debugDurationStateAutomat") ;

    if (debug) {
        $logterm(`Format:      "${format}"`) ;
        $logterm(`comp.days:    ${comp.days}`) ;
        $logterm(`comp.hours:   ${comp.hours}`) ;
        $logterm(`comp.minutes: ${comp.minutes}`) ;
        $logterm(`comp.seconds: ${comp.seconds}`) ;
        $logterm(`subhour:      ${subhour}`) ;
        $logterm(`subday:       ${subday}`) ;
    }

    for (let i = 0 ; i < fmtlen ; i++) {
        const c = fmt.charAt(i) ;
        if (debug) $logterm(`stack.count = ${a.stack.length}, state = ${a.state}, elsePart = ${a.elsePart}, char[${i}] = '${c}'`) ;
        _durationFormatStep(a, c) ;
        if (debug) { $logterm(`state after:${a.state}, composed string = "${a.ret}"`) ; }
    }

    a.ret += _durationFormatTrailingPercent(a) ;

    if (debug) { $logterm(`$durationNumber2StringFormat() returned string = "${a.ret}"`) ; }

    return a.ret ;
}

function _durationFormatStep(a:DurationFormatAutomat, c:string) {
    switch (a.state) {
        case DurationFormatState.Standard:
            a.elsePart = false ;
            if (c === '%') { a.state = DurationFormatState.StandardEscape ; }
            else { a.ret += c ; }
            break ;
        case DurationFormatState.StandardEscape:
            a.state = DurationFormatState.Standard ;
            _durationFormatEscape(a, c, 'DdEHhIiJMmSs', '') ;
            break ;
        default:
            if (a.state % 2 === 0) { _durationFormatPartChar(a, c) ; }
            else { _durationFormatPartEscape(a, c) ; }
            break ;
    }
}

// interprets the escaped char c in the standard part or in a visible conditional part
function _durationFormatEscape(a:DurationFormatAutomat, c:string, directives:string, ownOpener:string) {
    const openedState = _durationFormatOpeners[c] ;
    if (c === '%') { a.ret += '%' ; }
    else if (directives.includes(c)) { a.ret += _durationDirectiveHandlers[c](a.comp) ; }
    else if ($ok(openedState) && c !== ownOpener) {
        a.stack.push({ state:a.state, elsePart:a.elsePart }) ;
        a.state = openedState ;
        a.elsePart = false ;
    }
    else { a.ret += '%' + c ; }
}

// non escaped char in a conditional part
function _durationFormatPartChar(a:DurationFormatAutomat, c:string) {
    if (c === '%') { a.state = (a.state + 1) as DurationFormatState ; }
    else if (a.visibility[a.state] !== a.elsePart) { a.ret += c ; }
}

// escaped char in a conditional part
function _durationFormatPartEscape(a:DurationFormatAutomat, c:string) {
    const partState = (a.state - 1) as DurationFormatState ;
    const part = _durationFormatParts[partState] ;
    if (c === part.closing) {
        const p = a.stack.pop()! ;
        a.state = p.state ;
        a.elsePart = p.elsePart ;
        return ;
    }
    a.state = partState ;
    const visible = a.visibility[partState] ;
    if (c === part.elseChar) { a.elsePart = !a.elsePart ; }
    else if (visible && !a.elsePart) { _durationFormatEscape(a, c, part.directives, part.opener) ; }
    else if (a.elsePart && !visible) { a.ret += _durationFormatDefault(c) ; }
}

// the format ended on a non interpreted %
function _durationFormatTrailingPercent(a:DurationFormatAutomat):string {
    if (a.state === DurationFormatState.StandardEscape) { return '%' ; }
    if (a.state % 2 === 0) { return '' ; }
    const partState = (a.state - 1) as DurationFormatState ;
    return a.visibility[partState] !== a.elsePart ? '%' : '' ;
}

//////////////////// private functions

function _yearFrom(ys:string) {
	const y = $unsigned(ys) ;
	return ys.length > 2 ? y : _adjustYear(y) ; 
}

/**
 * This function adjust the year entered with only 2 digits
 * follling the following rule :
 *  - each date which seems to be more than 20 years in the future is considered as a previous century date
 *  - each date which seems to be less than 20 years in the future is considered as a current century date
 */
function _adjustYear(y:number):uint {
	const currentYear = new Date().getFullYear() ;
	const century = $div(currentYear, 100) ;
	return <uint>(y > currentYear % 100 + 20 ? y + (century-1)*100 : y + century * 100) ;
}

function _completeWithToday(c:TSDateComp) {
	if (c.day) {
		if (c.month) {
			if (!c.year) {
				c.year = <uint>(new Date().getFullYear()) ;
			}
		}
		else if (!c.year) {
			const d = new Date() ;
			c.month = <uint>(d.getMonth()+1) ;
			c.year = <uint>d.getFullYear() ;
		}
	}
}

// fills c.hour/minute/second from three regex capture groups. When the minutes
// group is absent the hours group is read as a single packed number:
// H | HH | HMM | HHMM | HMMSS | HHMMSS. A no-op when the hours group is absent.
function _fillTime(c:TSTimeComp, hoursGroup:Nullable<string>, minutesGroup:Nullable<string>, secondsGroup:Nullable<string>):boolean {
	if (!$length(hoursGroup)) { return true ; }
	if (!$length(minutesGroup)) {
		const v = $unsigned(hoursGroup) ;
		switch (hoursGroup!.length) {
			case 1: case 2: c.hour = <uint>v ; break ;
			case 3: case 4: c.hour = <uint>$div(v, 100) ; c.minute = <uint>(v % 100) ; break ;
			case 5: case 6:
				c.hour = <uint>$div(v, 10000) ;
				c.minute = <uint>($div(v, 100) % 100) ;
				c.second = <uint>(v % 100) ;
				break ;
			default: return false ;
		}
	}
	else {
		c.hour = $unsigned(hoursGroup) ;
		c.minute = $unsigned(minutesGroup) ;
		if ($length(secondsGroup)) { c.second = $unsigned(secondsGroup) ; }
	}
	return true ;
}

function _parsedt(s:Nullable<string>, withTime:boolean, form:TSDateForm=TSDateForm.Standard, opts:Iso8601ParseOptions={}) : TSDateComp|null {
	if (form === TSDateForm.ISO8601 || form === TSDateForm.ISO8601C || form === TSDateForm.ISO8601L) { return $isostring2components(s, opts) ; }
	if (!$length(s)) { return null ; }
	const g = _standardDateGroups(s!.trim(), withTime) ;
	if (!$ok(g)) { return null ; }
	const c:TSDateComp = { year:UINT_MIN, month:UINT_MIN, day:UINT_MIN, hour:UINT_MIN, minute:UINT_MIN, second:UINT_MIN }
	let done:boolean ;

	switch (form) {
		case TSDateForm.Standard:
		case TSDateForm.English:
			done = _fillStandardDate(c, g!, form === TSDateForm.English) ;
			break ;
		case TSDateForm.Computer:
			done = _fillComputerDate(c, g!) ;
			break ;
		default:
			return null ;
	}
	return done && $componentsarevalid(c) ? c : null ;
}

// groups: n1, n2 and n3 are the 3 numbers of the date, hours/minutes/seconds the
//         time (absent for $parsedate). A missing n2 means the source was a single
//         packed number with no separator.

// a date without any space, then, if accepted and if the date has 3 numbers, spaces or a '-' and a time
function _standardDateGroups(s:string, withTime:boolean):Nullable<StringDictionary> {
	const i = s.search(SPACE_REGEX) ;
	if (i < 0) {
		const m = withTime ? DATE_DASH_TIME_REGEX.exec(s) : null ;
		return $ok(m) ? _dateTimeGroups(m![1], m![2], DATE_PARSE_REGEX, TIME_PARSE_REGEX) : DATE_PARSE_REGEX.exec(s)?.groups ;
	}
	if (!withTime) { return null ; }
	const g = _dateTimeGroups(s.slice(0, i), s.slice(i).trim(), DATE_PARSE_REGEX, TIME_PARSE_REGEX) ;
	return $length(g?.n3) ? g : null ; // a time needs a complete date
}

function _fillStandardDate(c:TSDateComp, g:StringDictionary, english:boolean):boolean {
	const n1 = $unsigned(g.n1) ;
	if (!$length(g.n2)) {
		_fillPackedDayMonth(c, n1, english) ;
		if (!c.year) { _completeWithToday(c) ; }
		return true ;
	}
	if (english) { c.month = <uint>n1 ; c.day = $unsigned(g.n2) ; }
	else         { c.day = <uint>n1 ; c.month = $unsigned(g.n2) ; }
	if (!$length(g.n3)) { 
		_completeWithToday(c) ;
		return true ;
	}
	c.year = _yearFrom(g.n3) ;
	return _fillTime(c, g.hours, g.minutes, g.seconds) ;
}

// one packed number, no separator: DDMMYYYY / DDMMYY / DDMM / DD
// (day & month positions are swapped for the English form)
function _fillPackedDayMonth(c:TSDateComp, n1:number, english:boolean) {
	let lo:number, hi:number ;   // lo -> month (Standard) / day (English) ; hi -> the other
	if (n1 >= 1010001)    { c.year = <uint>(n1 % 10000) ;     lo = $div(n1 % 1000000, 10000) ; hi = $div(n1, 1000000) ; }
	else if (n1 >= 10101) { c.year = _adjustYear(n1 % 100) ;  lo = $div(n1 % 10000, 100) ;     hi = $div(n1, 10000) ; }
	else if (n1 >= 101)   { lo = n1 % 100 ; hi = $div(n1, 100) ; }
	else                  { lo = 0 ; hi = n1 ; }   // just a day
	c.month = <uint>(english ? hi : lo) ;
	c.day   = <uint>(english ? lo : hi) ;
}

function _fillComputerDate(c:TSDateComp, g:StringDictionary):boolean {
	const yc = $unsigned(g.n1) ;
	if (!$length(g.n2)) {
		if (g.n1.length !== 8) { return false ; } // in computer form we need all the digits
		c.year  = <uint>$div(yc, 10000) ;
		c.month = <uint>($div(yc, 100) % 100) ;
		c.day   = <uint>(yc % 100) ;
		return true ;
	}
	if (!$length(g.n3)) { return false ; }
	c.year  = <uint>yc ;
	c.month = $unsigned(g.n2) ;
	c.day   = $unsigned(g.n3) ;
	return _fillTime(c, g.hours, g.minutes, g.seconds) ;
}
