import { TSDate, TSDay, TSHour, TSMinute } from "../src/tsdate";
import { $components, $components2StringWithOffset, $components2timestamp, $datetimeDescription, $duration, $duration2String, $durationcomponents, $durationDescription, TSDurationComp } from "../src/tsdatecomp";
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
                let didraise = false ;
                try { $components(obj) ; }
                catch { didraise = true ; }
                if (inverse) { t.expect(didraise, 'ERR'+nr).false() ; }
                else { t.expect(didraise, 'ERR'+nr).true() ; }
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
        }) ;
        group.unary(`Complex iso string milliseconds output"`, async (t) => {
            const p = s.lastIndexOf('.') ;
            t.expect0(s.slice(p)).is('.000Z') ;
            t.expect1(s2.slice(p)).is('.000+00:00') ;
        }) ;
    })
] ;
