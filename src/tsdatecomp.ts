import { $div, $isnumber, $length, $ok, $trim, $unsigned, $fpad2, $fpad4, $fpad3, $isstring, $fpad } from "./commons";
import { $default, $locales, Locales } from "./tsdefaults";
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
    $dayOfWeekFromTimestamp
} from "./tsdate";
import { country, int, language, uint, UINT_MIN } from "./types";
import { TSCountry } from "./tscountry";

export interface TimeComp {
	hour:uint;
	minute:uint;
	second:uint;
}

export interface TSDateComp extends TimeComp {
	year:uint;
	month:uint;
	day:uint;
	dayOfWeek?:uint;
}

export interface TSDurationComp {
    days:uint;
    hours:uint;
    minutes:uint;
    seconds:uint;
}

export enum TSDateForm {
	Standard = 0,
	English,
	Computer,
	ISO8601,
    ISO8601C,
    ISO8601L
}
export type TSIsoDateForm = TSDateForm.ISO8601 | TSDateForm.ISO8601C | TSDateForm.ISO8601L ;

export enum TSDateRep {
    LocalTime = 'lt',
    LocalDate = 'ld',
    LocalDateTime = 'ldt',
    ShortLocalDate = 'sld',
    ShortLocalDateTime = 'sldt'
}

/**
 * If you call timecomponents() with no parameters, it
 * returns the components for the current local time.
 * This function can not have a string as parameter ;
 * in order to create components from string, you need
 * to user functions $parsetime()
 */
 export function $timecomponents(source: number|Date|TSDate|null|undefined=null) : TimeComp {
	if (!$ok(source)) { source = new Date() ;}
	else if (source instanceof TSDate) { source = (<TSDate>source).timestamp ; }

	if ($isnumber(source)) {
		const timestamp = source as number ;
		return {
			hour:$hourFromTimestamp(timestamp),
			minute:$minuteFromTimestamp(timestamp),
			second:$secondFromTimestamp(timestamp),
		} ;
	}
	const d = source as Date ;
	return {
		hour:<uint>d.getHours(), 
		minute:<uint>d.getMinutes(), 
		second:<uint>d.getSeconds(),
	} ;
}

/**
 * If you call components() with no parameters, it
 * returns the components for the current local date.
 * This function can not have a string as parameter ;
 * in order to create components from string, you need
 * to user functions $parsedate(), $parsedatetime() or $isostring2components()
 */
export function $components(source: number|Date|TSDate|null|undefined=null) : TSDateComp {

	if (!$ok(source)) { source = new Date() ;}
	else if (source instanceof TSDate) { source = (<TSDate>source).timestamp ; }

	if ($isnumber(source)) {
		const timestamp = source as number ;
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

	const d = source as Date ;
	return {
		year:<uint>d.getFullYear(), 
		month:<uint>(d.getMonth()+1), 
		day:<uint>d.getDate(), 
		hour:<uint>d.getHours(), 
		minute:<uint>d.getMinutes(), 
		second:<uint>d.getSeconds(),
		dayOfWeek:<uint>d.getDay()
	} ;
}

export function $componentsarevalid(comp:TSDateComp|null|undefined) : boolean {
	if (!$ok(comp)) { return false } ;
	const c = comp as TSDateComp ;
	return $dayisvalid(c.year, c.month, c.day) && $timeisvalid(c.hour, c.minute, c.second) ;
}

export function $componentshavetime(c:TSDateComp) : boolean {
	return c.hour > 0 || c.minute > 0 || c. second > 0
}

export function $parsetime(s:string|null|undefined) : TimeComp|null {
	if (!$length(s)) { return null ; }
	const m = (<string>s).match(/^\s*(\d{1,6})(\s*[:.]\s*(\d{1,2})(\s*[:.]\s*(\d{1,2}))?)?\s*$/) ;
	if (!$ok(m)) { return null ; }
	const res = m as RegExpMatchArray ;
	const c:TimeComp = { hour:UINT_MIN, minute:UINT_MIN, second:UINT_MIN }

	_parseTime(c, res, 0, res.length) ;
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
export function $parsedatetime(s:string|null|undefined, form:TSDateForm=TSDateForm.Standard) : TSDateComp|null {
	return _parsedt(s, /^\s*(\d{1,8})([/\-.](\d{1,2})([/\-.](\d{1,4})(\s+(\d{1,6})(\s*[:.]\s*(\d{1,2})(\s*[:.]\s*(\d{1,2}))?)?)?)?)?\s*$/, form) ;
}

export function $parsedate(s:string|null|undefined, form:TSDateForm=TSDateForm.Standard) : TSDateComp|null {
	return _parsedt(s, /^\s*(\d{1,8})([/\-.](\d{1,2})([/\-.](\d{1,4}))?)?\s*$/, form, { noTime:true }) ;
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
const NO_TIME_ISO_REGEX = /^([0-9]{2,6})\-([0-9]{1,2})\-([0-9]{1,2})$/ ;
const TIME_ISO_REGEX     = /^([0-9]{2,6})\-([0-9]{1,2})\-([0-9]{1,2})([Tt]([0-9]{1,2})(:([0-9]{1,2})(:([0-9]{1,2}))?)?([zZ]|\+00(:?00)?)?)?$/ ;

const COMPACT_NO_TIME_ISO_REGEX = /^([0-9]{4})([0-9]{2})([0-9]{2})$/
const COMPACT_TIME_ISO_REGEX     = /^([0-9]{4})([0-9]{2})([0-9]{2})([Tt]([0-9]{2})(([0-9]{2})(([0-9]{2}))?)?([zZ]|\+00(:?00)?)?)?$/ ;

export function $isostring2components(source:string|null|undefined, opts:Iso8601ParseOptions={}) : TSDateComp|null {
    const s = $trim(source) ;
	if (!s.length) { return null ; }

    let m:RegExpMatchArray|null|undefined = undefined ;

    if (opts.noTime) {
        m = s.match(NO_TIME_ISO_REGEX) ; 
        if (!$ok(m)) { m = s.match(COMPACT_NO_TIME_ISO_REGEX) ; }
    }
    else {
        m = s.match(TIME_ISO_REGEX) ;
        if (!$ok(m)) { m = s.match(COMPACT_TIME_ISO_REGEX) ; }
    }
    if (!$ok(m)) { return null ; }

	const res = m as RegExpMatchArray ;
	const l = res.length ;
	const c:TSDateComp = {
		year:_yearFrom(res[1]),
		month:$unsigned(res[2]),
		day:$unsigned(res[3]),
		hour:l>5?$unsigned(res[5]):UINT_MIN,
		minute:l>7?$unsigned(res[7]):UINT_MIN,
		second:l>9?$unsigned(res[9]):UINT_MIN
	}
	return $componentsarevalid(c) ? c : null ;
}

export function $components2timestamp(c:TSDateComp) : number {
	return $timestamp(c.year, c.month, c.day, c.hour, c.minute, c.second) ;
}

export function $components2date(c:TSDateComp) : Date {
	return new Date(c.year, c.month - 1, c.day, c.hour, c.minute, c.second, 0);
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
			return $componentshavetime(c) ? `${$fpad4(c.year)}/${$fpad2(c.month)}/${$fpad4(c.day)}-${$fpad2(c.hour)}:${$fpad2(c.minute)}:${$fpad2(c.second)}`
						                  : `${$fpad4(c.year)}/${$fpad2(c.month)}/${$fpad4(c.day)}` ;
	}
}

export function $components2StringWithOffset(c:TSDateComp, form:TSIsoDateForm = TSDateForm.ISO8601, mins:int = 0 as int) {
    const a = Math.abs(mins) ;
    if (a % 15 !== 0) { throw '$components2isodateString(): Bad output time zone offset infos'}
    const s = $components2string(c, form) ;
    if (form === TSDateForm.ISO8601C) {
        // in short form, we use Z, +HH and +HHMM offsets
        if (!a) { return s+'Z' ;}
        return a % 60 === 0 ? `${s}${a<0?'-':'+'}${$fpad2($div(a, 60) as int)}` :
                              `${s}${a<0?'-':'+'}${$fpad2($div(a, 60) as int)}${$fpad2((a % 60) as int)}`
    }
    // other forms commes with +HH:MM offsets, even for hour's round offsets
    return `${s}${a<0?'-':'+'}${$fpad2($div(a, 60) as int)}:${$fpad2((a % 60) as int)}` ;
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
export function $components2stringformat(comp:TSDateComp, format:string|TSDateRep|undefined|null='', locale?:language|country|TSCountry|Locales|null|undefined) : string | null {
    if (!$componentsarevalid(comp)) { return null ; }
    const ts = $components2timestamp(comp) ;
    const trs = !$ok(locale) || $isstring(locale) || (locale instanceof TSCountry) ? $locales(locale as any) : locale as Locales ;
    let fmtlen = $length(format) ;
    let ret = "" ;
    let escape = false ;
    let skipIncludedIfNoTime = false ;

    if (!fmtlen) { 
        format = trs.dateTimeFormat ;
    }
    else {
        switch (format) {
            case TSDateRep.LocalDate:
                format = trs.dateFormat ;
                break ;
            case TSDateRep.ShortLocalDate:
                format = trs.shortDateFormat ;
                break ;
            case TSDateRep.LocalDateTime:
                format = trs.dateTimeFormat ;
                break ;
            case TSDateRep.ShortLocalDateTime:
                format = trs.shortDateTimeFormat ;
                break ;
            case TSDateRep.LocalTime:
                format = trs.timeFormat ;
                break ;
            default:
                break ; 
        }
    }
    fmtlen = format!.length ;
    
    for (let i = 0 ; i < fmtlen ; i++) {
        const c = format!.charAt(i) ;
        if (escape) {
            escape = false ;
            if (skipIncludedIfNoTime) {
                if (c === ']') { skipIncludedIfNoTime = false ; }
            }
            else {
                switch (c) {
                    case '%': ret += '%' ; break ;
                    case 'a':
                        ret += trs.shortDays[$dayOfWeekFromTimestamp(ts)] ;
                        break ;
                    case 'A':
                        ret += trs.days[$dayOfWeekFromTimestamp(ts)] ;
                        break ;
                    case 'b': ret += trs.shortMonths[comp.month-1] ; break ;
                    case 'B': ret += trs.months[comp.month-1] ; break ;
                    case 'd': ret += $fpad2(comp.day) ; break ;
                    case 'e': ret += comp.day ; break ;
                    case 'f':
                        ret += $dayOfWeekFromTimestamp(ts) ;
                        break ;
                    case 'F':
                        ret += $dayOfWeekFromTimestamp(ts, trs.startingWeekDay) ;
                        break ;
                    case 'H': ret += $fpad2(comp.hour) ; break ;
                    case 'J': 
                        ret += $fpad2((comp.hour > 12 ? comp.hour - 12 : comp.hour) as uint) ; 
                        break ;
                    case 'I': ret += comp.hour ; break ;
                    case 'K': ret += comp.hour > 12 ? comp.hour - 12 : comp.hour ; break ;
                    case 'm': ret += $fpad2(comp.month) ; break ;
                    case 'M': ret += $fpad2(comp.minute) ; break ;
                    case 'N': ret += comp.minute ; break ;
                    case 'n': ret += comp.month ; break ;
                    case 'p': {
                        const s = $components2stringformat(comp, trs.partialTimeFormat, locale) ;
                        if (!$ok(s)) { return null ; }
                        ret += s! ;
                        break ;
                    }
                    case 'P': ret += trs.ampm[comp.hour <= 12 ? 0 : 1] ; break ;
                    case 'q': 
                        ret += $fpad3($unsigned($dayOfYear(ts))) ;
                        break ;
                    case 'r': 
                        ret += $dayOfYear(ts) ;
                        break ;
                    case 'S': ret += $fpad2(comp.second) ; break ;
                    case 'T': ret += comp.second ; break ;
                    case 't': {
                        const s = $components2stringformat(comp, trs.timeFormat, locale) ;
                        if (!$ok(s)) { return null ; }
                        ret += s! ;
                        break ;
                    }
                    case 'v':
                        ret += $fpad2($unsigned($weekOfYear(ts, trs.startingWeekDay))) ;
                        break ;
                    case 'w':
                        ret += $weekOfYear(ts, trs.startingWeekDay) ;
                        break ;
                    case 'x': {
                        const s = $components2stringformat(comp, trs.shortDateFormat, locale) ;
                        if (!$ok(s)) { return null ; }
                        ret += s! ;
                        break ;
                    }
                    case 'X': {
                        const s = $components2stringformat(comp, trs.dateFormat, locale) ;
                        if (!$ok(s)) { return null ; }
                        ret += s! ;
                        break ;
                    }
                    case 'y': ret += $fpad2((comp.year % 100) as uint) ; break ;
                    case 'Y': ret += $fpad4(comp.year) ; break ;
                    case 'z': ret += comp.year ; break ;
                    case '[': 
                        skipIncludedIfNoTime = comp.hour == 0 && comp.minute == 0 && comp.second == 0 ; 
                        break ;
                    case ']':
                        skipIncludedIfNoTime = false ;
                        break ;
                    default: 
                        ret += '%' ;
                        ret += c ; 
                        break ;
                }
            }
        }
        else if (c === '%') { escape = true ; }
        else {
            escape = false ; 
            if (!skipIncludedIfNoTime) { ret += c ; } 
        }
    }
    if (escape && !skipIncludedIfNoTime) { ret += '%' ; }
    return ret ;
}


export function $durationcomponents(duration: number|null|undefined) : TSDurationComp {
    let time:number = $unsigned(duration, 0 as uint) ;
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

export function $duration2String(comps:TSDurationComp, format?:string|null|undefined):string {
    // we reexport in number before constructing the string in order
    // to normalize the number of days, hours, minutes and seconds
    return $durationNumber2StringFormat($duration(comps), format) ;
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
export function $durationNumber2StringFormat(duration: number|null|undefined, format?:string|null|undefined) : string {
    
    enum State {
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
    interface Stack {
        state:State,
        elsePart:boolean
    }

    const comp = $durationcomponents(duration) ;

    if (!$length(format)) { format = "%(%d-%)%H:%M%{:%S%}" ; }
    let fmtlen = format!.length ;
    let state = State.Standard ;
    let ret = "" ;
    let elsePart = false ;
    const subhour = comp.minutes > 0 || comp.seconds > 0 ;
    const subday = comp.hours > 0 || subhour ;
    let stack:Stack[] = [] ;
    const debug = $default("debugDurationStateAutomat") ;

    if (debug) {
        console.log(`Format:      "${format}"`) ;
        console.log(`comp.days:    ${comp.days}`) ;
        console.log(`comp.hours:   ${comp.hours}`) ;
        console.log(`comp.minutes: ${comp.minutes}`) ;
        console.log(`comp.seconds: ${comp.seconds}`) ;
        console.log(`subhour:      ${subhour}`) ;
        console.log(`subday:       ${subday}`) ;
    }

    function _pop():[State, boolean] { const p = stack.pop() ; return [p!.state, p!.elsePart] ; }
    function _push(newState:State):[State, boolean] { stack.push({state:state, elsePart:elsePart}); return [newState, false] ; }
    function _default(c:string) { ret += '%' ; if (c !== '%') { ret += c ; }}

    function _d() { ret += comp.days ; }
    function _D() { ret += $fpad2(comp.days) ; }
    function _E() { ret += $fpad3(comp.days) ; }
    function _h() { ret += comp.hours ; }
    function _H() { ret += $fpad2(comp.hours) ; }
    function _i() { ret += (comp.days*24 + comp.hours) ; }
    function _I() { ret += $fpad2((comp.days*24 + comp.hours) as uint) ; }
    function _J() { ret += $fpad3((comp.days*24 + comp.hours) as uint) ; }
    function _m() { ret += comp.minutes ; }
    function _M() { ret += $fpad2(comp.minutes) ; }
    function _s() { ret += comp.seconds ;}
    function _S() { ret += $fpad2(comp.seconds) ; }

    
    for (let i = 0 ; i < fmtlen ; i++) {
        const c = format!.charAt(i) ;
        if (debug) console.log(`stack.count = ${stack.length}, state = ${state}, elsePart = ${elsePart}, char[${i}] = '${c}'`) ;
        switch (state) {
            case State.Standard:
                elsePart = false ;
                if (c === '%') { state = State.StandardEscape ; }
                else { ret += c ; }
                break ;
            case State.StandardEscape:
                state = State.Standard ;
                switch (c) {
                    case '%': ret += '%' ; break ;
                    case '(': [state, elsePart] = _push(State.DaysPart) ; break ;
                    case '{': [state, elsePart] = _push(State.SecondsPart) ; break ;
                    case '[': [state, elsePart] = _push(State.SubdaysPart) ; break ;
                    case '≤': [state, elsePart] = _push(State.HoursPart) ; break ;
                    case '<': [state, elsePart] = _push(State.SubhoursPart) ; break ;
                    case 'D': _D() ; break ; case 'd': _d() ; break ; case 'E': _E() ; break ;
                    case 'H': _H() ; break ; case 'h': _h() ; break ; case 'I': _I() ; break ; case 'i': _i() ; break ; case 'J': _J() ; break ;
                    case 'M': _M() ; break ; case 'm': _m() ; break ;
                    case 'S': _S() ; break ; case 's': _s() ; break ;
                    default: ret += '%', ret += c ; break ;
                }
                break ;
            case State.DaysPart:
                if (c === '%') { state = State.DaysPartEscape ; }
                else if ((comp.days > 0 && !elsePart) || (!comp.days && elsePart)) { ret += c ; }
                break ;
            case State.DaysPartEscape:
                if (c === ')') { [state, elsePart] = _pop() ; }
                else {
                    state = state = State.DaysPart ;
                    if (c === 'p') { elsePart = !elsePart ; }                    
                    else if (comp.days > 0 && !elsePart) {
                        switch (c) {
                            case '%': ret += '%' ; break ;
                            case 'D': _D() ; break ; case 'd': _d() ; break ; case 'E': _E() ; break ;
                            case '[': [state, elsePart] = _push(State.SubdaysPart) ; break ;
                            case '{': [state, elsePart] = _push(State.SecondsPart) ; break ;
                            case '<': [state, elsePart] = _push(State.SubhoursPart) ; break ;
                            case '≤': [state, elsePart] = _push(State.HoursPart) ; break ;
                            default: ret += '%', ret += c ; break ;
                        }
                    }
                    else if (elsePart && !comp.days) { _default(c) ; }
                }
                break ;
            case State.HoursPart:
                if (c === '%') { state = State.HoursPartEscape ; }
                else if ((comp.hours > 0 && !elsePart) || (!comp.hours && elsePart)) { ret += c ; }
                break ;
            case State.HoursPartEscape:
                if (c === '≥') { [state, elsePart] = _pop() ; }
                else {
                    state = State.HoursPart ;
                    if (c === 'q') { elsePart = !elsePart ; }                    
                    else if (comp.hours > 0 && !elsePart) {
                        switch (c) {
                            case '%': ret += '%' ; break ;
                            case 'H': _H() ; break ; case 'h': _h() ; break ; case 'I': _I() ; break ; case 'i': _i() ; break ; case 'J': _J() ; break ;
                            case '(': [state, elsePart] = _push(State.DaysPart) ; break ;
                            case '{': [state, elsePart] = _push(State.SecondsPart) ; break ;
                            case '[': [state, elsePart] = _push(State.SubdaysPart) ; break ;
                            case '<': [state, elsePart] = _push(State.SubhoursPart) ; break ;
                            default: ret += '%', ret += c ; break ;
                        }
                    }
                    else if (elsePart && !comp.hours) { _default(c) ; }
                }
                break ;
            case State.SecondsPart:
                if (c === '%') { state = State.SecondsPartEscape ; }
                else if ((comp.seconds > 0 && !elsePart) || (!comp.seconds && elsePart)) { ret += c ; }
                break ;
            case State.SecondsPartEscape:
                if (c === '}') { [state, elsePart] = _pop() ; }
                else {
                    state = State.SecondsPart ;
                    if (c === 'b') { elsePart = !elsePart ; }                    
                    else if (comp.seconds > 0 && !elsePart) {
                        switch (c) {
                            case '%': ret += '%' ; break ;
                            case 'S': _S() ; break ; case 's': _s() ; break ;
                            case '[': [state, elsePart] = _push(State.SubdaysPart) ; break ;
                            case '(': [state, elsePart] = _push(State.DaysPart) ; break ;
                            case '<': [state, elsePart] = _push(State.SubhoursPart) ; break ;
                            case '≤': [state, elsePart] = _push(State.HoursPart) ; break ;
                            default: ret += '%', ret += c ; break ;    
                        }
                    }
                    else if (elsePart && !comp.seconds) { _default(c) ; }
                }
                break ;
            case State.SubdaysPart:
                if (c === '%') { state = State.SubdaysPartEscape ; }
                else if ((subday && !elsePart) || (!subday && elsePart)) { ret += c ; }
                break ;
            case State.SubdaysPartEscape:
                if (c === ']') { [state, elsePart] = _pop() ; }
                else {
                    state = State.SubdaysPart ;
                    if (c === '!') { elsePart = !elsePart ; }
                    else if (subday && !elsePart) {
                        switch (c) {
                            case '%': ret += '%' ; break ;
                            case 'H': _H() ; break ; case 'h': _h() ; break ; case 'I': _I() ; break ; case 'i': _i() ; break ; case 'J': _J() ; break ;
                            case 'M': _M() ; break ; case 'm': _m() ; break ;
                            case 'S': _S() ; break ; case 's': _s() ; break ;
                            case '(': [state, elsePart] = _push(State.DaysPart) ; break ;
                            case '{': [state, elsePart] = _push(State.SecondsPart) ; break ;
                            case '<': [state, elsePart] = _push(State.SubhoursPart) ; break ;
                            case '≤': [state, elsePart] = _push(State.HoursPart) ; break ;
                            default: ret += '%', ret += c ; break ;    
                        }
                    }   
                    else if (!subday && elsePart) { _default(c) ; }
                }
                break ;
            case State.SubhoursPart:
                if (c === '%') { state = State.SubhoursPartEscape ; }
                else if ((subhour && !elsePart) || (!subhour && elsePart)) { ret += c ; }
                break ;
            case State.SubhoursPartEscape:
                if (c === '>') { [state, elsePart] = _pop() ; }
                else {
                    state = State.SubhoursPart ;
                    if (c === 'c') { elsePart = !elsePart ; }
                    else if (subhour && !elsePart) {
                        switch (c) {
                            case '%': ret += '%' ; break ;
                            case 'M': _M() ; break ; case 'm': _m() ; break ;
                            case 'S': _S() ; break ; case 's': _s() ; break ;
                            case '(': [state, elsePart] = _push(State.DaysPart) ; break ;
                            case '{': [state, elsePart] = _push(State.SecondsPart) ; break ;
                            case '[': [state, elsePart] = _push(State.SubdaysPart) ; break ;
                            case '≤': [state, elsePart] = _push(State.HoursPart) ; break ;
                            default: ret += '%', ret += c ; break ;    
                        }
                    }   
                    else if (!subhour && elsePart) { _default(c) ; }
                }
                break ;                
        }
        if (debug) { console.log(`state after:${state}, composed string = "${ret}"`) ; }
    }

    switch (state) {
        case State.Standard: 
        case State.DaysPart:
        case State.SecondsPart:
        case State.SubdaysPart:
        case State.SubhoursPart:
        case State.HoursPart:
            break ;
        case State.StandardEscape: 
            ret += '%' ; 
            break ;
        case State.DaysPartEscape:
            if ((comp.days > 0 && !elsePart) || (!comp.days && elsePart)) { ret += '%' ; } 
            break ;
        case State.HoursPartEscape:
            if ((comp.hours > 0 && !elsePart) || (!comp.hours && elsePart)) { ret += '%' ; } 
            break ;
        case State.SecondsPartEscape:
            if ((comp.seconds > 0 && !elsePart) || (!comp.days && elsePart)) { ret += '%' ; } 
            break ;
        case State.SubdaysPartEscape:
            if ((subday && !elsePart) || (!subday && elsePart)) { ret += '%' ; } 
            break ;
        case State.SubhoursPartEscape:
            if ((subhour && !elsePart) || (!subhour && elsePart)) { ret += '%' ; }
            break ; 
    }

    if (debug) { console.log(`$durationNumber2StringFormat() returned string = "${ret}"`) ; }

    return ret ;
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

function _parsedt(s:string|null|undefined, regexp:RegExp, form:TSDateForm=TSDateForm.Standard, opts:Iso8601ParseOptions={}) : TSDateComp|null {
	if (form === TSDateForm.ISO8601 || form === TSDateForm.ISO8601C || form === TSDateForm.ISO8601L) { return $isostring2components(s, opts) ; }
	if (!$length(s)) { return null ; }
	const m = (<string>s).match(regexp) ;
	if (!$ok(m)) { return null ; }
	const res = m as RegExpMatchArray ;
	const l = res.length ;
	const c:TSDateComp = { year:UINT_MIN, month:UINT_MIN, day:UINT_MIN, hour:UINT_MIN, minute:UINT_MIN, second:UINT_MIN }

	switch (form) {
		case TSDateForm.Standard:
			const ds = $unsigned(res[1]) ;
			if (l === 2) {
				if (ds >= 1010001) { c.year = <uint>(ds % 10000) ; c.month = <uint>$div(ds % 1000000, 10000) ; c.day = <uint>$div(ds, 1000000) ; }
				else if ( ds >= 10101) { c.year = _adjustYear(ds % 100) ; c.month = <uint>$div(ds % 10000, 100) ; c.day = <uint>$div(ds, 10000) ;  }
				else if ( ds >= 101) { c.month = <uint>(ds % 100) ; c.day = <uint>$div(ds, 100) ; _completeWithToday(c) ; }
				else { c.day = ds ; _completeWithToday(c) ; }
			}
			else {
				c.day = ds ;
				c.month = $unsigned(res[3]) ;
				if (l >= 6) { 
					c.year = _yearFrom(res[5]) ; 
					if (l > 6) { _parseTime(c, res, 5, l-5) }
				}
				else { _completeWithToday(c) ; }
			}
			break ;
		case TSDateForm.English:
			const me = $unsigned(res[1]) ;
			if (l === 2) {
				if (me >= 1010001) { c.year = <uint>(me % 10000) ; c.day = <uint>$div(me % 1000000, 10000) ; c.month = <uint>$div(me, 1000000) ; }
				else if ( me >= 10101) { c.year = _adjustYear(me % 100) ; c.day = <uint>$div(me % 10000, 100) ; c.month = <uint>$div(me,  10000) ; }
				else if ( me >= 101) { c.day = <uint>(me % 100) ; c.month = <uint>$div(me, 100) ; }
			}
			else {
				c.month = me ;
				c.day = $unsigned(res[3]) ;
				if (l >= 6) { 
					c.year = _yearFrom(res[5]) ; 
					if (l > 6) { _parseTime(c, res, 5, l-5) }
				}
				else { _completeWithToday(c) ; }
			}
			break ;
		case TSDateForm.Computer:
			const yc = $unsigned(res[1]) ;
			if (l === 2) {
				if (res[1].length !== 8) { return null ; } // in computer form we need all the digits
				c.year = <uint>$div(yc,10000) ;
				c.month = <uint>($div(yc, 100) % 100) ;
				c.day = <uint>$div(yc, 100) ;
			}
			else if (l >= 6) {
				c.year = yc ;
				c.month = $unsigned(res[3]) ;
				c.day = $unsigned(res[5]) ;
				if (l > 6) { _parseTime(c, res, 5, l-5) }
			}
			else {
				return null ;
			}
			break ;
		default:
			return null ;
	}
	return $componentsarevalid(c) ? c : null ;
}

function _parseTime(c:TimeComp, m:RegExpMatchArray, start:number, len:number)
{
	let v = $unsigned(m[start+1]) ;
	if (len === 2) {
		// we have a single number representing the full time
		// like H or HH or HMM or HHMM or HMMSS or HHMMSS
		switch(m[start+1].length) {
			case 1:
			case 2:
				c.hour = v ; 
				break ;
			case 3:
			case 4:
				c.hour = <uint>$div(v, 100) ;
				c.minute = <uint>(v%100) ;
				break ;
			case 5:
			case 6:
				c.hour = <uint>$div(v, 10000) ;
				c.minute = <uint>($div(v,100) % 100) ;
				c.second = <uint>(v%100) ;
				break ;
		}
	}
	else {
		c.hour = v ;
		c.minute = $unsigned(m[start+2]) ;
		if (len > 4) {
			c.second = $unsigned(m[start+4]) ;
		}
	}
}
