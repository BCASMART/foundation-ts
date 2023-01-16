import { $ok } from "../src/commons";
import { $timeBetweenDates } from '../src/date'
import { 
    TSDate, 
    TSSecsFrom19700101To20010101, 
    TSSecsFrom00010101To20010101,
    TSHour,
    TSMinute,
    $timestamp,
    $dayOfWeekFromTimestamp,
    TSDay,
    $timestampWithoutTime,
    TSMaxTimeStamp,
    TSWeek
} from "../src/tsdate";
import { TSDateForm } from "../src/tsdatecomp";
import { Ascending, Descending, Same } from "../src/types";
import { TSTest } from '../src/tstester';

export const dateGroups = [
    TSTest.group("Testing code $dayOfWeek() function", async (group) => {
        const T = $timestamp(2022,3,28) ;
        for (let i = 0 ; i < 7 ; i++) {
            group.unary(`day of week of ${new TSDate(T+i*TSDay)} should be ${(i+1)%7}`, async(t) => { 
                t.expect($dayOfWeekFromTimestamp(T+TSDay*i), `EDOW ${i}`).toBe((i+1)%7) ; 
            });
        }     
        for (let i = 0 ; i < 7 ; i++) {
            group.unary(`french day of week of ${new TSDate(T+i*TSDay)} should be ${i}`, async (t) => { 
                t.expect($dayOfWeekFromTimestamp(T+TSDay*i,1), `FDOW ${i}`).toBe(i) ; 
            });
        }     
    }),
    TSTest.group("Testing $timestampWithoutTime() function", async (group) => {
        const T = $timestamp(2022,3,28, 16, 45, 12) ;
        const U = T + 0.25 ;
        const t0 = T - (T % TSDay) ;
        const V = $timestamp(1945,5,8, 23, 1, 0) ;
        const v1 = $timestamp(1945,5,8, 0, 0, 0) ;
        const W = V - 0.25 ;
    
        group.unary('verifying $timestampWithoutTime()', async (t) => {
            t.expect($timestampWithoutTime(T), "with positive TS").toBe(t0) ;
            t.expect($timestampWithoutTime(U), "with positive non integer TS").toBe(t0) ;
            t.expect($timestampWithoutTime(V), "with negative TS").toBe(v1) ;
            t.expect($timestampWithoutTime(W), "with non integer negative TS").toBe(v1) ;
        }) ;
    
    }),
    TSTest.group("Testing TSDate creation", async (group) => {
        const ISO  = "1966-04-13T12:05:22" ;
        const ISO2 = "1966-04-13T12:05:22+00:02" ;
        const ISOS = [
            "1966-04-13T12:05:22Z", 
            "1966-04-13T12:05:22+00", "1966-04-13T12:05:22+0000", "1966-04-13T12:05:22+00:00", 
            "19660413T120522", "19660413T120522Z",
            "19660413T120522+00", "19660413T120522+0000", "19660413T120522+00:00"
        ] ;
        const SHORTS = ["20110413", "2011-04-13", "11-04-13"]
        const SHORT = "2011-04-13T00:00:00"
        const A = new TSDate(ISO) ;
        const B = new TSDate(1966, 4, 13, 12, 5, 22) ;
        const D = new Date(1966, 3, 13, 12, 5, 22) ;
        const TD = new TSDate(D) ;
        const ZD = TSDate.fromZulu(D) ;
        const Y = new TSDate() ;  // created without TZ at the local time
        const Z = TSDate.zulu() ; // created at GMT Time
        const mFormat = "%Y/%m/%d-%H:%M" ;
        group.unary(`expect date ${ISO} to be correctly created`, async (t) => {
            t.expect(A.toIsoString()).toBe(ISO);
        });
    
        group.unary(`expect date ${ISO2} NOT BE CREATED because of TZ +2`, async (t) => {
            t.expect(!$ok(TSDate.fromIsoString(ISO2))).toBeTruthy();
        });
    
        group.unary(`expect other ISO formated date for the same moment to be correctly created`, async (t) => {
            for (let d of ISOS) {
                t.expect((new TSDate(d)).toIsoString(), `1:${d}`).toBe(ISO);
                t.expect(TSDate.fromIsoString(d)?.toIsoString(), `2:${d}`).toBe(ISO);
            }
        });
    
        group.unary(`expect other short ISO formated date for the same day to be correctly created`, async (t) => {
            for (let d of SHORTS) {
                const td = new TSDate(d) ;
                t.expect(td.toIsoString(), `1:${d}`).toBe(SHORT);
                t.expect(TSDate.fromIsoString(d)?.toIsoString(), `2:${d}`).toBe(SHORT);
            }
        });
    
        group.unary(`expect same dates created by Y,M,D,H,M,S parameters to be correct`, async (t) => {
            t.expect0(B.toIsoString()).toBe(ISO);
            t.expect1(TD.toIsoString()).toBe(ISO);
        });
    
        group.unary(`expect same date with non integer timestamp to be the same`, async (t) => {
            // because A.timestamp is negative, we substract our fractional part
            const NI = new TSDate(A.timestamp-0.22) ;
            const NM = new TSDate(A.timestamp-0.5) ;
            const NS = new TSDate(A.timestamp-0.78) ;
            t.expect0(A.isEqual(NI)).toBeTruthy();
            t.expect1(A.isEqual(NM)).toBeTruthy();
            t.expect2(A.isEqual(NS)).toBeTruthy();
        });
    
        group.unary(`expect sames dates to be equal`, async (t) => {
            t.expect0(A.isEqual(B)).toBeTruthy();
            t.expect1(B.isEqual(A)).toBeTruthy();
            t.expect2(A.isEqual(TD)).toBeTruthy();
            t.expect3(TD.isEqual(A)).toBeTruthy();
        });
    
        group.unary(`expect zulu created date and date representations to be within a minute`, async (t) => {
            t.expect(TD.toString(mFormat)).toBe(ZD?.toLocaleString(mFormat));
        });
    
        group.unary(`expect new TSDate timestamp of 01/01/2001 to be 0`, async (t) => {
            const REF = new TSDate(2001, 1, 1) ;
            t.expect(REF.timestamp).toBe(0);
        });
        
        group.unary(`expect new TSDate timestamp of 01/01/1970 (EPOCH) to be ${-TSSecsFrom19700101To20010101}`, async (t) => {
            const E = new TSDate(1970, 1, 1) ;
            t.expect(E.timestamp).toBe(-TSSecsFrom19700101To20010101);
        });
    
        group.unary(`expect new TSDate timestamp of 01/01/0001 to be ${-TSSecsFrom00010101To20010101}`, async (t) => {
            const BC = new TSDate(1, 1, 1) ;
            const BC2 = TSDate.past() ;
            t.expect0(BC.timestamp).toBe(-TSSecsFrom00010101To20010101);
            t.expect1(BC.isEqual(BC2)).toBeTruthy();
            t.expect2(BC2.isEqual(BC)).toBeTruthy();
        });
    
        group.unary(`expecting finding max time stamp for future date`, async (t) => {
            t.expect(TSDate.future().timestamp).toBe(TSMaxTimeStamp);
        });
    
        group.unary(`expect current date created Date.now() not to be null`, async (t) => {
            t.expect($ok(Z)).toBeTruthy();
        });
    
        group.unary(`expect new TSDate().toString() and TSDate.zulu().toLocaleString() to be in the same minute interval`, async (t) => {        
            t.expect(Y.toString(mFormat)).toBe(Z.toLocaleString(mFormat));
        });
    }),
    TSTest.group("Testing TSDate manipulation", async (group) => {
        const D = new TSDate(1945, 5, 8, 23, 1, 0) ; // armistice signature
        const ED = new Date(1945,4,8,23,1,0) ;
        const E = new TSDate(ED) ;
        const tf = "%H:%M" ;
        const df = "%Y/%m/%d" ;
        const dtf = `${df}-${tf}` ;
        const full = `${dtf}:%S` ;
    
        group.unary('d.year', async (t) => { t.expect(D.year).toBe(1945) ; });
        group.unary('d.month', async (t) => { t.expect(D.month).toBe(5) ; });
        group.unary('d.day', async (t) => { t.expect(D.day).toBe(8) ; });
        group.unary('d.hour', async (t) => { t.expect(D.hour).toBe(23) ; });
        group.unary('d.minute', async (t) => { t.expect(D.minute).toBe(1) ; });
        group.unary('d.second', async (t) => { t.expect(D.second).toBe(0) ; });
    
        group.unary('d.dateWithoutTime()', async (t) => {
            t.expect(D.dateWithoutTime().toString(full)).toBe('1945/05/08-00:00:00') ;
        });
        group.unary('d.week(offset = 1)', async (t) => { t.expect(D.week(1)).toBe(19) ; });
        group.unary('d.dayOfYear()', async (t) => { t.expect(D.dayOfYear()).toBe(128) ; });
        group.unary('d.dayOfWeek()', async (t) => { t.expect(D.dayOfWeek()).toBe(2) ; });
        group.unary('d.dayOfWeek(offset = 1)', async (t) => { t.expect(D.dayOfWeek(1)).toBe(1) ; });
        group.unary('d.lastDayOfMonth()', async (t) => { t.expect(D.lastDayOfMonth()).toBe(31) ; });
    
        group.unary('d.dateByAdding(1,2,3,4,5,6) / $timeBetweenDates()', async (t) => {
            const R = D.dateByAdding(1,2,3,4,5,6) ;
            t.expect0(R.toString(full)).toBe('1946/07/12-03:06:06') ;
            const T = R.timeSinceDate(D) ;
            t.expect1($timeBetweenDates(D, R)).toBe(T) ;
            t.expect2($timeBetweenDates(R, D)).toBe(-T) ;
            // we don't test full differences on both Date objects because we may have one hour diff due to improbable time saving 
            // t.expect3($timeBetweenDates(R.toDate(), D.toDate())).toBe(-T) ;
            t.expect4($timeBetweenDates(R, D.toDate())).toBe(-T) ;
            t.expect5($timeBetweenDates(R.toDate(), D)).toBe(-T) ;
            // IDEM
            // t.expect6(R.toDate().timeSinceDate(D.toDate())).toBe(T) ;
        });
        group.unary('d.dateByAddingWeeks(3) / $timeBetweenDates()', async (t) => {
            const R = D.dateByAddingWeeks(3) ;
            const T = 3 * TSWeek ;
            t.expect0(R.toString(full)).toBe('1945/05/29-23:01:00') ;
            t.expect1(R.timeSinceDate(D)).toBe(T) ;
            t.expect2($timeBetweenDates(R.toDate(), D.toDate())).toBe(-T) ;
            t.expect3($timeBetweenDates(R, D.toDate())).toBe(-T) ;
            t.expect4($timeBetweenDates(R.toDate(), D)).toBe(-T) ;
            t.expect5(R.toDate().timeSinceDate(D.toDate())).toBe(T) ;
        });
        group.unary('d.dateByAddingTime(31:59:13) / $timeBetweenDates()', async (t) => {
            const T = 31*TSHour+59*TSMinute+13 ;
            const R = D.dateByAddingTime(T) ;
            t.expect0(R.toString(full)).toBe('1945/05/10-07:00:13') ;
            t.expect1(R.timeSinceDate(D)).toBe(T) ;
            t.expect2($timeBetweenDates(R.toDate(), D.toDate())).toBe(-T) ;
            t.expect3($timeBetweenDates(R, D.toDate())).toBe(-T) ;
            t.expect4($timeBetweenDates(R.toDate(), D)).toBe(-T) ;
            t.expect5(R.toDate().timeSinceDate(D.toDate())).toBe(T) ;
        });
        group.unary('d.firstDateOfYear()', async (t) => { 
            t.expect(D.firstDateOfYear().toString(full)).toBe("1945/01/01-00:00:00") ; 
        });
        group.unary('d.lastDateOfYear()', async (t) => { 
            t.expect(D.lastDateOfYear().toString(full)).toBe("1945/12/31-00:00:00") ; 
        });
        group.unary('d.firstDateOfMonth()', async (t) => { 
            t.expect(D.firstDateOfMonth().toString(full)).toBe("1945/05/01-00:00:00") ; 
        });
        group.unary('d.lastDateOfMonth()', async (t) => { 
            t.expect(D.lastDateOfMonth().toString(full)).toBe("1945/05/31-00:00:00") ; 
        });
        group.unary('d.firstDateOfWeek(offset=0)', async (t) => { 
            t.expect(D.firstDateOfWeek().toString(full)).toBe("1945/05/06-00:00:00") ; 
        });
        group.unary('d.firstDateOfWeek(offset=1)', async (t) => { 
            t.expect(D.firstDateOfWeek(1).toString(full)).toBe("1945/05/07-00:00:00") ; 
        });
        group.unary('d.daysSinceDate(startOfYear)', async (t) => { 
            t.expect(D.daysSinceDate(D.firstDateOfYear())).toBe(127) ; 
        });
        group.unary('d.toEpoch()', async (t) => { t.expect(D.toEpoch()).toBe(-777862740) ; }) ;
        group.unary('d.toDate()', async (t) => { t.expect(D.toDate()).toBe(ED) ; }) ;
        group.unary('d.toIsoString()', async (t) => { t.expect(D.toIsoString()).toBe("1945-05-08T23:01:00") ; }) ;
        group.unary('d.toIsoString(ISO8601C)', async (t) => { t.expect(D.toIsoString(TSDateForm.ISO8601C)).toBe("19450508T230100") ; }) ;
        group.unary('d.toIsoString(ISO8601L)', async (t) => { t.expect(D.toIsoString(TSDateForm.ISO8601L)).toBe("001945-05-08T23:01:00") ; }) ;
        
        const C = new TSDate(1966, 4, 13, 12, 5, 22) ;
        group.unary('d.compare(>date)', async (t) => { t.expect(D.compare(C)).toBe(Ascending) ; }) ;
        group.unary('d.compare(=same var)', async (t) => { t.expect(D.compare(D)).toBe(Same) ; }) ;
        group.unary('d.compare(=other date)', async (t) => { t.expect(D.compare(E)).toBe(Same) ; }) ;
        group.unary('d.compare(<date)', async (t) => { t.expect(D.compare(D.firstDateOfYear())).toBe(Descending) ; }) ;
    
        group.unary('d.isEqual(>date)', async (t) => { t.expect(!D.isEqual(C)).toBeTruthy() ; }) ;
        group.unary('d.isEqual(=same var)', async (t) => { t.expect(D.isEqual(D)).toBeTruthy() ; }) ;
        group.unary('d.isEqual(=other date)', async (t) => { t.expect(D.isEqual(E)).toBeTruthy() ; }) ;
        group.unary('d.isEqual(<date)', async (t) => { t.expect(!D.isEqual(D.firstDateOfYear())).toBeTruthy() ; }) ;

        group.unary('ISOString compatibility', async(t) => {
            const RD = new Date(Date.UTC(1945,4,8,23,1,0)) ;
            const ref = RD.toISOString() ;
            t.expect0(D.toISOString()).toBe(ref) ;
            t.expect1(E.toISOString()).toBe(ref) ;
        });
    }),

    TSTest.group("Testing TSDate output format", async (group) => {
        const D1 = new TSDate(1945, 5, 8, 23, 1, 3) ; // nearly 3 seconds after armistice signature
        const f = "%A, %e %B %Y à %Hh%M" ;
        group.unary(`unconditional output format`, async (t) => { 
            t.register('format', f) ; 
            t.expect(D1.toString(f)).toBe("mardi, 8 mai 1945 à 23h01") ; 
        }) ;
    
        const cf = "%A, %e %B %Y%[ à %Hh%M et %T secondes%]" ;
        group.unary('conditional output format', async (t) => {
            t.register('format', cf) ; 
            t.expect0(D1.toString(cf)).toBe("mardi, 8 mai 1945 à 23h01 et 3 secondes") ; 
            t.expect1(D1.dateWithoutTime().toString(cf)).toBe("mardi, 8 mai 1945") ;
        }) ;
    })
] ;
