import { TSDate, TSDay, TSHour, TSMinute } from "../src/tsdate";
import { $components, $components2StringWithOffset, $components2stringformat, $components2timestamp, $componentshavetime, $datetimeDescription, $duration, $duration2String, $durationcomponents, $durationDescription, $durationNumber2StringFormat, $parsedate, $parsedatetime, $parsetime, $timecomponents, $timezoneOffsetWithComponents, TSDateForm, TSDurationComp } from "../src/tsdatecomp";
import { uint } from "../src/types";
import { TSTest } from '../src/tstester';
import { $timeBetweenDates } from "../src/date";
import { TSColor } from "../src/tscolor";

export const dateCompGroups = [
    TSTest.group("Testing duration functions", async (group) => {

        const Z:TSDurationComp = $durationcomponents(0) ;
        const A:TSDurationComp = { days:3 as uint, hours:2 as uint, minutes:25 as uint, seconds: 10 as uint} ;
        
        group.unary('$components() function', async (t) => {
            const D = new TSDate(1945, 5, 8, 23, 1, 0) ; // armistice signature
            const comp = D.toComponents() ;
            const time = D.timestamp ;
            const past = TSDate.past().toComponents() ;
            const future = TSDate.future().toComponents() ;
            t.expect0($components(D)).is(comp) ;
            t.expect1($components(D.toDate())).is(comp) ;
            t.expect2(D.toDate().toComponents()).is(comp) ;
            t.expect3($components(time)).is(comp) ;
            t.expect4($components2timestamp(comp)).is(time) ;
            t.expect5($components(Number.NEGATIVE_INFINITY)).is(past) ;
            t.expect6($components(Number.MIN_SAFE_INTEGER)).is(past) ;
            t.expect7($components(Number.MAX_SAFE_INTEGER)).is(future) ;
            t.expect8($components(Number.MAX_VALUE)).is(future) ;
            t.expect9($components(Number.POSITIVE_INFINITY)).is(future) ;

            function _rt(nr:number, obj:any, inverse:boolean = false) {
                const e = t.expect(() => $components(obj), 'ERR'+nr) ;
                if (inverse) { e.notToThrow() ; } else { e.toThrow() ; }
            }
            _rt(0, {}) ;
            _rt(1, 'tryme') ;
            _rt(2, true) ;
            _rt(3, Symbol('localSymbol')) ;
            _rt(4, BigInt(0)) ;
            _rt(5, TSColor.rgb('red')) ;
            _rt(6, undefined, true) ;
            _rt(7, null, true)
            _rt(8, NaN) ;
        }) ;

        group.unary('$durationcomponents() function', async (t) => {
            t.expect0(Z).def() ;
            t.expect1(Z.days).is(0) ;
            t.expect2(Z.hours).is(0) ;
            t.expect3(Z.minutes).is(0) ;
            t.expect4(Z.seconds).is(0) ;
    
            const n = $duration(A) ;
            const N = $durationcomponents(n) ;
            t.expectA(N).def() ;
            t.expectB(N.days).is(3) ;
            t.expectC(N.hours).is(2) ;
            t.expectD(N.minutes).is(25) ;
            t.expectE(N.seconds).is(10) ;
        }) ;

        TSTest.group("$durationDescription() function", async (group) => {
            const D = new TSDate(1945, 5, 8, 23, 1, 0) ; // armistice signature
            const T = 5*TSDay+31*TSHour+59*TSMinute+1 ;
            const R = D.dateByAddingTime(T) ;
            group.unary('asserting base data is correct', async (t) => {
                t.expect1($timeBetweenDates(D, R)).is(T) ;
                t.expect2($timeBetweenDates(R, D)).is(-T) ;
            }) ;
            group.unary('asserting common errors', async(t) => {
                t.expect1($durationDescription(-T)).toBe('') ;
                t.expect2($durationDescription(0)).toBe('') ;
                t.expect3($durationDescription(NaN)).toBe('') ;
                t.expect4($durationDescription(1.56)).toBe('') ;
                t.expect5($durationDescription(Number.POSITIVE_INFINITY)).toBe('') ;
                t.expect6($durationDescription(Number.NEGATIVE_INFINITY)).toBe('') ;
            }) ;
            group.unary('asserting representation is correct', async(t) => {
                t.expect0($durationDescription(T)).toBe('6 jours 7 heures 59 minutes 1 seconde') ;
                t.expect1(T.toDurationDescription()).toBe('6 jours 7 heures 59 minutes 1 seconde') ;
                t.expect2($durationDescription(T, { depth:'days' })).toBe('6 jours') ;
                t.expect2($durationDescription(T, { depth:'hours' })).toBe('6 jours 8 heures') ;
                t.expect3($durationDescription(T, { depth:'minutes' })).toBe('6 jours 7 heures 59 minutes') ;
                t.expect4($durationDescription(T+29, { depth:'minutes' })).toBe('6 jours 8 heures') ;
                t.expect5($durationDescription(T+89, { depth:'minutes' })).toBe('6 jours 8 heures 1 minute') ;
                t.expect6($durationDescription(T, { depth:'hours-cut' })).toBe('6 jours 7 heures') ;
                t.expect7($durationDescription(T, { depth:'hours', noDays:true })).toBe('152 heures') ;
                t.expect8($durationDescription(T, { depth:'hours-cut', noDays:true })).toBe('151 heures') ;
                t.expect9($durationDescription(T, { noDays:true } )).toBe('151 heures 59 minutes 1 seconde') ;
    
                t.expectA(T.toDurationDescription({ locale:"en" })).toBe('6 days 7 hours 59 minutes 1 second') ;
                t.expectB(T.toDurationDescription({ depth:'days', locale:"en" })).toBe('6 days') ;
                t.expectC(T.toDurationDescription({ depth:'hours', locale:"en" })).toBe('6 days 8 hours') ;
                t.expectD(T.toDurationDescription({ depth:'minutes', locale:"en" })).toBe('6 days 7 hours 59 minutes') ;
                
                t.expectZ(T.toDurationDescription({ locale:"el" })).toBe('6 ημέρες 7 ώρες 59 λεπτά 1 δευτερόλεπτο') ;
            }) ;
        }) ;
    
        const B:TSDurationComp = { days:0 as uint, hours:2 as uint, minutes:25 as uint, seconds: 10 as uint} ;
        const C:TSDurationComp = { days:3 as uint, hours:2 as uint, minutes:25 as uint, seconds: 0 as uint} ;
        const D:TSDurationComp = { days:0 as uint, hours:2 as uint, minutes:25 as uint, seconds: 0 as uint} ;
        const E:TSDurationComp = { days:0 as uint, hours:2 as uint, minutes:0 as uint, seconds: 0 as uint} ;
        const F:TSDurationComp = { days:3 as uint, hours:0 as uint, minutes:0 as uint, seconds: 0 as uint} ;
        const G:TSDurationComp = { days:0 as uint, hours:0 as uint, minutes:25 as uint, seconds: 0 as uint} ;
        const H:TSDurationComp = { days:0 as uint, hours:0 as uint, minutes:0 as uint, seconds: 10 as uint} ;
    
        group.unary('Duration standard format', async (t) => {
            t.expect0($duration2String(A)).is("3-02:25:10") ;
            t.expect1($duration2String(B)).is("02:25:10") ;
            t.expect2($duration2String(D)).is("02:25") ;
            t.expect3($duration2String(E)).is("02:00") ;
            t.expect4($duration2String(F)).is("3-00:00") ;
            t.expect5($duration2String(G)).is("00:25") ;
            t.expect6($duration2String(H)).is("00:00:10") ;
            t.expect7($duration2String(Z)).is("00:00") ;
            t.expectA($duration(A).toDurationString()).is("3-02:25:10") ;
            t.expectB($duration(B).toDurationString()).is("02:25:10") ;
            t.expectC($duration(D).toDurationString()).is("02:25") ;
            t.expectD($duration(E).toDurationString()).is("02:00") ;
            t.expectE($duration(F).toDurationString()).is("3-00:00") ;
            t.expectF($duration(G).toDurationString()).is("00:25") ;
            t.expectG($duration(H).toDurationString()).is("00:00:10") ;
            t.expectH($duration(Z).toDurationString()).is("00:00") ;
        }) ;
    
        const F1 = "%(%d jours%[, %]%)%[%≤%h heures%≥%<%≤%{,%b et%} %≥%m minutes%{ et %s secondes%}%>%]" ;
    
        group.unary('Duration complex format', async (t) => {
        
            t.register('format', F1) ;
            t.expect0($duration2String(A, F1)).is("3 jours, 2 heures, 25 minutes et 10 secondes") ;
            t.expect1($duration2String(B, F1)).is("2 heures, 25 minutes et 10 secondes") ;
            t.expect2($duration2String(C, F1)).is("3 jours, 2 heures et 25 minutes") ;
            t.expect3($duration2String(D, F1)).is("2 heures et 25 minutes") ;
            t.expect4($duration2String(E, F1)).is("2 heures") ;
            t.expect5($duration2String(F, F1)).is("3 jours") ;
            t.expect6($duration2String(G, F1)).is("25 minutes") ; 
            t.expect7($duration2String(H, F1)).is("0 minutes et 10 secondes") ;
            t.expect8($duration2String(Z, F1)).is("") ; 
            t.expectA($duration(A).toDurationString(F1)).is("3 jours, 2 heures, 25 minutes et 10 secondes") ;
            t.expectB($duration(B).toDurationString(F1)).is("2 heures, 25 minutes et 10 secondes") ;
            t.expectC($duration(C).toDurationString(F1)).is("3 jours, 2 heures et 25 minutes") ;
            t.expectD($duration(D).toDurationString(F1)).is("2 heures et 25 minutes") ;
            t.expectE($duration(E).toDurationString(F1)).is("2 heures") ;
            t.expectF($duration(F).toDurationString(F1)).is("3 jours") ;
            t.expectG($duration(G).toDurationString(F1)).is("25 minutes") ; 
            t.expectH($duration(H).toDurationString(F1)).is("0 minutes et 10 secondes") ;
            t.expectI($duration(Z).toDurationString(F1)).is("") ; 
        }) ;
    }),


    TSTest.group("Predefined date-time output", async (group) => {
        const DT = new TSDate(1945, 5, 8, 23, 1, 35) ;
        const DJ = new Date(1945, 4, 8, 23, 1, 35) ;
        const C = TSDate.zulu().toComponents() ;
        const s = $components2StringWithOffset(C, {
            milliseconds:0 as uint,
            forceZ:true
        }) ;
        const s2 = $components2StringWithOffset(C, {
            milliseconds:0 as uint,
        }) ;
        group.unary('$datetimeDescription() function', async t => {
            t.expect0($datetimeDescription(DT, 'date', 'fr')).is('08/05/1945') ;
            t.expect1($datetimeDescription(DT, 'short-date', 'fr')).is('08/05/45') ;
            t.expect2($datetimeDescription(DT, 'date-time', 'fr')).is('08/05/1945 23:01:35') ;
            t.expect3($datetimeDescription(DT, 'short-date-time', 'fr')).is('08/05/45 23:01:35') ;
            t.expect4($datetimeDescription(DT, 'date-short-time', 'fr')).is('08/05/1945 23:01') ;
            t.expect5($datetimeDescription(DT, 'short-date-short-time', 'fr')).is('08/05/45 23:01') ;
            
            t.expectA($datetimeDescription(DJ, 'date', 'fr')).is('08/05/1945') ;
            t.expectB($datetimeDescription(DJ, 'short-date', 'fr')).is('08/05/45') ;
            t.expectC($datetimeDescription(DJ, 'date-time', 'fr')).is('08/05/1945 23:01:35') ;
            t.expectD($datetimeDescription(DJ, 'short-date-time', 'fr')).is('08/05/45 23:01:35') ;
            t.expectE($datetimeDescription(DJ, 'date-short-time', 'fr')).is('08/05/1945 23:01') ;
            t.expectF($datetimeDescription(DJ, 'short-date-short-time', 'fr')).is('08/05/45 23:01') ;

            t.expectG($datetimeDescription(DT, 'date', 'fr', TSHour+30)).is('09/05/1945') ;
            t.expectH($datetimeDescription(DT, 'date-time', 'fr', TSHour+30)).is('09/05/1945 00:02:05') ;
            t.expectI($datetimeDescription(DJ, 'date', 'fr', TSHour+30)).is('09/05/1945') ;
            t.expectJ($datetimeDescription(DJ, 'date-time', 'fr', TSHour+30)).is('09/05/1945 00:02:05') ;

        }) ;
        group.unary(`Complex iso string milliseconds output"`, async (t) => {
            const p = s.lastIndexOf('.') ;
            t.expect0(s.slice(p)).is('.000Z') ;
            t.expect1(s2.slice(p)).is('.000+00:00') ;
        }) ;
        group.unary('$timezoneOffsetWithComponents() function', async t => {
            const TZD = new TSDate(2024, 7, 8, 23, 1, 35) ;
            t.expect0($timezoneOffsetWithComponents('Europe/Paris', TZD.toComponents())).is(120) ;
        }) ;
    }),

    TSTest.group("tsdatecomp — time components & parsing", async (group) => {
        const d = new TSDate(1945, 5, 8, 23, 1, 35) ;

        group.unary('$timecomponents() / $componentshavetime()', async (t) => {
            t.expect0($timecomponents(d.timestamp)).is({ hour:23, minute:1, second:35 }) ;
            t.expect1($timecomponents(new Date(2020, 0, 1, 3, 4, 5))).is({ hour:3, minute:4, second:5 }) ;
            t.expect2($timecomponents(d)).is({ hour:23, minute:1, second:35 }) ;
            const now = $timecomponents(null) ;                                  // current time
            t.expect3(now.hour >= 0 && now.hour <= 23).true() ;
            t.expect4($componentshavetime($components(d))).true() ;
            t.expect5($componentshavetime($components(new TSDate(2020, 1, 1)))).false() ;
        }) ;

        group.unary('$parsetime() — colon / dot forms', async (t) => {
            t.expect0($parsetime("14:30:05")).is({ hour:14, minute:30, second:5 }) ;
            t.expect1($parsetime("14:30")).is({ hour:14, minute:30, second:0 }) ;
            t.expect2($parsetime("14.30.05")).is({ hour:14, minute:30, second:5 }) ;   // dot separator
            t.expect3($parsetime("9:7")).is({ hour:9, minute:7, second:0 }) ;
            t.expect4($parsetime("  8 : 5 : 3 ")).is({ hour:8, minute:5, second:3 }) ; // whitespace tolerated
            t.expect5($parsetime("07")).is({ hour:7, minute:0, second:0 }) ;
        }) ;

        group.unary('$parsetime() — packed number forms', async (t) => {
            t.expect0($parsetime("7")).is({ hour:7, minute:0, second:0 }) ;
            t.expect1($parsetime("900")).is({ hour:9, minute:0, second:0 }) ;          // HMM
            t.expect2($parsetime("1430")).is({ hour:14, minute:30, second:0 }) ;       // HHMM
            t.expect3($parsetime("0930")).is({ hour:9, minute:30, second:0 }) ;
            t.expect4($parsetime("143005")).is({ hour:14, minute:30, second:5 }) ;     // HHMMSS
            t.expect5($parsetime("235959")).is({ hour:23, minute:59, second:59 }) ;
        }) ;

        group.unary('$parsetime() — rejects out-of-range / malformed', async (t) => {
            t.expect0($parsetime(null)).null() ;
            t.expect1($parsetime("")).null() ;
            t.expect2($parsetime("nonsense")).null() ;
            t.expect3($parsetime("24:00")).null() ;
            t.expect4($parsetime("14:60")).null() ;
            t.expect5($parsetime("14:30:60")).null() ;
            t.expect6($parsetime("1260")).null() ;          // 12:60 packed
            t.expect7($parsetime("99:99:99")).null() ;
            t.expect8($parsetime("1:2:3:4")).null() ;       // too many parts
            t.expect9($parsetime("12:5:")).null() ;         // trailing separator
            t.expectA($parsetime("-1:00")).null() ;
        }) ;

        group.unary('$parsedate()', async (t) => {
            t.expect0($parsedate("2020-03-15", TSDateForm.ISO8601)).is({ year:2020, month:3, day:15, hour:0, minute:0, second:0 }) ;
            t.expect1($parsedate("garbage")).null() ;
            t.expect2($parsedate(null)).null() ;
            t.expect3($parsedate("15/03/2020")).is({ year:2020, month:3, day:15, hour:0, minute:0, second:0 }) ;
            t.expect4($parsedate("2020.03.15", TSDateForm.Computer)).is({ year:2020, month:3, day:15, hour:0, minute:0, second:0 }) ;
        }) ;

        group.unary('$parsedatetime() Standard — date + time forms', async (t) => {
            const D = { year:2020, month:3, day:15 } ;
            t.expect0($parsedatetime("15/03/2020 14:30:05")).is({ ...D, hour:14, minute:30, second:5 }) ;
            t.expect1($parsedatetime("15/03/2020 14:30")).is({ ...D, hour:14, minute:30, second:0 }) ;
            t.expect2($parsedatetime("15/03/2020 14")).is({ ...D, hour:14, minute:0, second:0 }) ;
            t.expect3($parsedatetime("15/03/2020 143005")).is({ ...D, hour:14, minute:30, second:5 }) ; // packed time
            t.expect4($parsedatetime("15/03/2020")).is({ ...D, hour:0, minute:0, second:0 }) ;
            t.expect5($parsedatetime("15-03-2020 9.7.3")).is({ ...D, hour:9, minute:7, second:3 }) ;    // '-' & '.' separators
            t.expect6($parsedatetime("15.03.20")).is({ ...D, hour:0, minute:0, second:0 }) ;           // 2-digit year
        }) ;

        group.unary('$parsedatetime() English & Computer forms', async (t) => {
            const D = { year:2020, month:3, day:15 } ;
            t.expect0($parsedatetime("03/15/2020 14:30:05", TSDateForm.English)).is({ ...D, hour:14, minute:30, second:5 }) ;
            t.expect1($parsedatetime("03-15-2020", TSDateForm.English)).is({ ...D, hour:0, minute:0, second:0 }) ;
            t.expect2($parsedatetime("2020/03/15 14:30:05", TSDateForm.Computer)).is({ ...D, hour:14, minute:30, second:5 }) ;
            t.expect3($parsedatetime("2020/03", TSDateForm.Computer)).null() ;     // Computer needs full date
        }) ;

        group.unary('$parsedatetime() packed all-in-one number', async (t) => {
            const D = { year:2020, month:3, day:15, hour:0, minute:0, second:0 } ;
            t.expect0($parsedatetime("15032020")).is(D) ;                          // DDMMYYYY
            t.expect1($parsedatetime("150320")).is(D) ;                            // DDMMYY
            t.expect2($parsedatetime("03152020", TSDateForm.English)).is(D) ;      // MMDDYYYY
            t.expect3($parsedatetime("20200315", TSDateForm.Computer)).is(D) ;     // YYYYMMDD
        }) ;

        group.unary('$parsedatetime() completes missing month / year with today', async (t) => {
            const now = new Date() ;
            const y = now.getFullYear(), mo = now.getMonth() + 1 ;
            t.expect0($parsedatetime("15/03")).is({ year:y, month:3, day:15, hour:0, minute:0, second:0 }) ;
            t.expect1($parsedatetime("15")).is({ year:y, month:mo, day:15, hour:0, minute:0, second:0 }) ;
        }) ;

        group.unary('$parsedatetime() rejects invalid dates / times', async (t) => {
            t.expect0($parsedatetime("garbage")).null() ;
            t.expect1($parsedatetime(null)).null() ;
            t.expect2($parsedatetime("32/03/2020")).null() ;
            t.expect3($parsedatetime("15/13/2020")).null() ;
            t.expect4($parsedatetime("15/03/2020 25:00")).null() ;
            t.expect5($parsedatetime("15/03/2020 12:70")).null() ;
        }) ;

        group.unary('TSDate.fromString() with a non-ISO form + time', async (t) => {
            t.expect0(TSDate.fromString("15/03/2020 14:30:05")?.toIsoString()).is("2020-03-15T14:30:05") ;
            t.expect1(TSDate.fromString("03/15/2020 14:30:05", TSDateForm.English)?.toIsoString()).is("2020-03-15T14:30:05") ;
            t.expect2(TSDate.fromString("2020/03/15 14:30:05", TSDateForm.Computer)?.toIsoString()).is("2020-03-15T14:30:05") ;
            t.expect3(TSDate.fromString("15/03/2020")?.toIsoString()).is("2020-03-15T00:00:00") ;
        }) ;
    }),

    TSTest.group("tsdatecomp — $components2stringformat directives", async (group) => {
        const c = $components(new TSDate(1945, 5, 8, 23, 1, 35)) ;
        const F = (fmt:string, loc?:any) => $components2stringformat(c, fmt, loc) ;

        group.unary('individual directives', async (t) => {
            t.expect0(F("%Y")).is("1945") ;
            t.expect1(F("%y")).is("45") ;
            t.expect2(F("%m")).is("05") ;
            t.expect3(F("%d")).is("08") ;
            t.expect4(F("%e", "fr")).is("8") ;
            t.expect5(F("%H:%M:%S")).is("23:01:35") ;
            t.expect6(F("%p")).is("23:01") ;
            t.expect7(F("%A", "fr")).is("mardi") ;
            t.expect8(F("%a", "en")).is("Tue.") ;
            t.expect9(F("%B", "fr")).is("mai") ;
            t.expectA(F("%b", "de")).is("Mai") ;
            t.expectB(F("100%% done")).is("100% done") ;
            t.expectC(F("%Z")).is("%Z") ;                                        // unknown directive passes through
        }) ;

        group.unary('remaining individual directives', async (t) => {
            t.expect0(F("%z")).is("1945") ;
            t.expect1(F("%n")).is("5") ;
            t.expect2(F("%E")).is("8e") ;
            t.expect3(F("%E", "en")).is("8th") ;
            t.expect4(F("%f")).is("2") ;                     // Tuesday, 0 = Sunday
            t.expect5(F("%F", "fr")).is("1") ;               // Tuesday, 0 = Monday in France
            t.expect6(F("%J")).is("11") ;                    // 24h -> padded 12h
            t.expect7(F("%K")).is("11") ;
            t.expect8(F("%I")).is("23") ;
            t.expect9(F("%N")).is("1") ;
            t.expectA(F("%T")).is("35") ;
            t.expectB(F("%P")).is("PM") ;
            t.expectC(F("%q")).is("128") ;
            t.expectD(F("%r")).is("128") ;
            t.expectE(F("%v", "fr")).is("19") ;
            t.expectF(F("%w", "fr")).is("19") ;
            t.expectG(F("%x", "fr")).is("08/05/45") ;
            t.expectH(F("%X", "fr")).is("08/05/1945") ;
            t.expectI(F("%t", "fr")).is("23:01:35") ;
            const morning = $components2stringformat($components(new TSDate(2001, 1, 3, 9, 5, 7)), "%J %K %P") ;
            t.expectJ(morning).is("09 9 AM") ;               // morning branch of %J / %K / %P
        }) ;

        group.unary('predefined formats & invalid components', async (t) => {
            t.expect0(F("date-time", "fr")).is("08/05/1945 23:01:35") ;
            t.expect1(F("short-time", "fr")).is("23:01") ;
            t.expect2(F("time", "fr")).is("23:01:35") ;
            t.expect3($components2stringformat({ year:0, month:99, day:1, hour:0, minute:0, second:0 } as any, "%Y")).null() ;
        }) ;
    }),

    TSTest.group("tsdatecomp — $durationDescription & $durationNumber2StringFormat", async (group) => {
        group.unary('$durationDescription() depths & options', async (t) => {
            t.expect0($durationDescription({ days:3, hours:13, minutes:0, seconds:0 } as any, { depth:'days' })).is("4 jours") ;
            t.expect1($durationDescription({ days:3, hours:5, minutes:0, seconds:0 } as any, { depth:'days' })).is("3 jours") ;
            t.expect2($durationDescription({ days:1, hours:2, minutes:40, seconds:0 } as any, { depth:'hours' })).is("1 jour 3 heures") ;
            t.expect3($durationDescription({ days:0, hours:1, minutes:5, seconds:40 } as any, { depth:'minutes' })).is("1 heure 6 minutes") ;
            t.expect4($durationDescription({ days:0, hours:0, minutes:0, seconds:7 } as any, { depth:'seconds' })).is("7 secondes") ;
            t.expect5($durationDescription({ days:2, hours:3, minutes:0, seconds:0 } as any, { noDays:true })).is("51 heures") ;
            t.expect6($durationDescription({ days:1, hours:2, minutes:0, seconds:0 } as any, { locale:'en' })).is("1 day 2 hours") ;
            t.expect7($durationDescription({ days:0, hours:0, minutes:0, seconds:0 } as any)).is("") ;
            t.expect8($durationDescription(3725)).is("1 heure 2 minutes 5 secondes") ;
        }) ;

        group.unary('$durationNumber2StringFormat() & $duration2String() with format', async (t) => {
            t.expect0($durationNumber2StringFormat(93784)).is("1-02:03:04") ;
            t.expect1($durationNumber2StringFormat(null)).is("00:00") ;
            t.expect2(() => $durationNumber2StringFormat(-5)).throws(/positive or 0/) ;
            t.expect3($durationNumber2StringFormat(93784, "%(%d days %)%H:%M:%S")).is("1 days 02:03:04") ;
            t.expect4($durationNumber2StringFormat(3600, "%(%d days %)%H:%M:%S")).is("01:00:00") ;
            t.expect5($duration2String({ days:0, hours:1, minutes:2, seconds:3 } as any, "%H h %M m")).is("01 h 02 m") ;
        }) ;

        group.unary('$durationNumber2StringFormat() day/hour directives & else-parts', async (t) => {
            const dur = 2 * 86400 + 3 * 3600 + 4 * 60 + 5 ;   // 2d 3h 4m 5s
            t.expect0($durationNumber2StringFormat(dur, "%D days")).is("02 days") ;              // %D 2-digit days
            t.expect1($durationNumber2StringFormat(dur, "%E days")).is("002 days") ;             // %E 3-digit days
            t.expect2($durationNumber2StringFormat(dur, "%i h")).is("51 h") ;                    // %i hours incl. days
            t.expect3($durationNumber2StringFormat(dur, "%I h")).is("51 h") ;                    // %I 2-digit
            t.expect4($durationNumber2StringFormat(dur, "%J h")).is("051 h") ;                   // %J 3-digit
            t.expect5($durationNumber2StringFormat(3600, "%(%d%p<%x>%)")).is("<%x>") ;           // _default(c) in else part
            t.expect6($durationNumber2StringFormat(3600, "%(%d%p100%%%)")).is("100%") ;          // _default('%') in else part
            t.expect7($durationNumber2StringFormat(30, "%(%dd%pno days%)")).is("no days") ;      // plain text else part
        }) ;
    }),
] ;
