import { $ok } from "../src/commons";
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
//    TSMinute
} from "../src/tsdate";
import { Ascending, Descending, Same } from "../src/types";

//const offset = -(new Date()).getTimezoneOffset()*TSMinute ;

describe("Testing TSDate creation", () => {
    const ISO  = "1966-04-13T12:05:22" ;
    const ISO2 = "1966-04-13T12:05:22+00:02" ;
    const ISOS = [
        "1966-04-13T12:05:22Z", 
        "1966-04-13T12:05:22+00", "1966-04-13T12:05:22+0000", "1966-04-13T12:05:22+00:00", 
        "19660413T120522", "19660413T120522Z",
        "19660413T120522+00", "19660413T120522+0000", "19660413T120522+00:00"
    ] ;
    const A = new TSDate(ISO) ;
    const B = new TSDate(1966, 4, 13, 12, 5, 22) ;
    const D = new Date(1966, 3, 13, 12, 5, 22) ;
    const TD = new TSDate(D) ;
    const ZD = TSDate.fromZulu(D) ;
    const Y = new TSDate() ;  // created without TZ at the local time
    const Z = TSDate.zulu() ; // created at GMT Time
    const mFormat = "%Y/%m/%d-%H:%M" ;
    it(`expect date ${ISO} to be correctly created`, () => {
        expect(A.toIsoString()).toBe(ISO);
    });

    it(`expect date ${ISO2} NOT BE CREATED because of TZ +2`, () => {
        expect(!$ok(TSDate.fromIsoString(ISO2))).toBeTruthy();
    });

    it(`expect other ISO formated date for the same moment to be correctly created`, () => {
        for (let d of ISOS) {
            expect((new TSDate(d)).toIsoString()).toBe(ISO);
            expect(TSDate.fromIsoString(d)?.toIsoString()).toBe(ISO);
        }
    });

    it(`expect same dates created by Y,M,D,H,M,S parameters to be correct`, () => {
        expect(B.toIsoString()).toBe(ISO);
        expect(TD.toISOString()).toBe(ISO);
    });

    
    it(`expect same date with non integer timestamp to be the same`, () => {
        // because A.timestamp is negative, we substract our fractional part
        const NI = new TSDate(A.timestamp-0.22) ;
        const NM = new TSDate(A.timestamp-0.5) ;
        const NS = new TSDate(A.timestamp-0.78) ;
        expect(A.isEqual(NI)).toBeTruthy();
        expect(A.isEqual(NM)).toBeTruthy();
        expect(A.isEqual(NS)).toBeTruthy();
    });

    it(`expect sames dates to be equal`, () => {
        expect(A.isEqual(B)).toBeTruthy();
        expect(B.isEqual(A)).toBeTruthy();
        expect(A.isEqual(TD)).toBeTruthy();
        expect(TD.isEqual(A)).toBeTruthy();
    });

    it(`expect zulu created date and date representations to be within a minute`, () => {
        expect(TD.toString(mFormat)).toBe(ZD?.toLocaleString(mFormat));
    });

    it(`expect new TSDate timestamp of 01/01/2001 to be 0`, () => {
        const REF = new TSDate(2001, 1, 1) ;
        expect(REF.timestamp).toBe(0);
    });
    
    it(`expect new TSDate timestamp of 01/01/1970 (EPOCH) to be ${-TSSecsFrom19700101To20010101}`, () => {
        const E = new TSDate(1970, 1, 1) ;
        expect(E.timestamp).toBe(-TSSecsFrom19700101To20010101);
    });

    it(`expect new TSDate timestamp of 01/01/0001 to be ${-TSSecsFrom00010101To20010101}`, () => {
        const BC = new TSDate(1, 1, 1) ;
        const BC2 = TSDate.past() ;
        expect(BC.timestamp).toBe(-TSSecsFrom00010101To20010101);
        expect(BC.isEqual(BC2)).toBeTruthy();
        expect(BC2.isEqual(BC)).toBeTruthy();
    });

    it(`expect current date created Date.now() not to be null`, () => {
        expect($ok(Z)).toBeTruthy();
    });

    it(`expect new TSDate().toString() and TSDate.zulu().toLocaleString() to be in the same minute interval`, () => {        
        expect(Y.toString(mFormat)).toBe(Z.toLocaleString(mFormat));
    });
});

describe("Testing code $dayOfWeek() function", () => {
    const T = $timestamp(2022,3,28) ;
    for (let i = 0 ; i < 7 ; i++) {
        it(`day of week of ${new TSDate(T+i*TSDay)} should be ${(i+1)%7}`, () => { expect($dayOfWeekFromTimestamp(T+TSDay*i)).toBe((i+1)%7) ; });
    }     
    for (let i = 0 ; i < 7 ; i++) {
        it(`french day of week of ${new TSDate(T+i*TSDay)} should be ${i}`, () => { expect($dayOfWeekFromTimestamp(T+TSDay*i,1)).toBe(i) ; });
    }     
}) ;

describe("Testing $timestampWithoutTime() function", () => {
    const T = $timestamp(2022,3,28, 16, 45, 12) ;
    const U = T + 0.25 ;
    const t0 = T - (T % TSDay) ;
    const V = $timestamp(1945,5,8, 23, 1, 0) ;
    const v1 = $timestamp(1945,5,8, 0, 0, 0) ;
    const W = V - 0.25 ;

    it('verifying $timestampWithoutTime() with positive TS', () => {
        expect($timestampWithoutTime(T)).toBe(t0) ;
    }) ;

    it('verifying $timestampWithoutTime() with positive non integer TS', () => {
        expect($timestampWithoutTime(U)).toBe(t0) ;
    }) ;

    it('verifying $timestampWithoutTime() with negative TS', () => {
        expect($timestampWithoutTime(V)).toBe(v1) ;
    }) ;

    it('verifying $timestampWithoutTime() with non integer negative TS', () => {
        expect($timestampWithoutTime(W)).toBe(v1) ;
    }) ;
}) ;

describe("Testing TSDate manipulation", () => {
    const D = new TSDate(1945, 5, 8, 23, 1, 0) ; // armistice signature
    const ED = new Date(1945,4,8,23,1,0) ;
    const E = new TSDate(ED) ;
    const tf = "%H:%M" ;
    const df = "%Y/%m/%d" ;
    const dtf = `${df}-${tf}` ;
    const full = `${dtf}:%S` ;

    it('d.year', () => { expect(D.year).toBe(1945) ; });
    it('d.month', () => { expect(D.month).toBe(5) ; });
    it('d.day', () => { expect(D.day).toBe(8) ; });
    it('d.hour', () => { expect(D.hour).toBe(23) ; });
    it('d.minute', () => { expect(D.minute).toBe(1) ; });
    it('d.second', () => { expect(D.second).toBe(0) ; });

    it('d.dateWithoutTime()', () => {
        expect(D.dateWithoutTime().toString(full)).toBe('1945/05/08-00:00:00') ;
    });
    it('d.week(offset = 1)', () => { expect(D.week(1)).toBe(19) ; });
    it('d.dayOfYear()', () => { expect(D.dayOfYear()).toBe(128) ; });
    it('d.dayOfWeek()', () => { expect(D.dayOfWeek()).toBe(2) ; });
    it('d.dayOfWeek(offset = 1)', () => { expect(D.dayOfWeek(1)).toBe(1) ; });
    it('d.lastDayOfMonth()', () => { expect(D.lastDayOfMonth()).toBe(31) ; });

    it('d.dateByAdding(1,2,3,4,5,6)', () => {
        expect(D.dateByAdding(1,2,3,4,5,6).toString(full)).toBe('1946/07/12-03:06:06') ;
    });
    it('d.dateByAddingWeeks(3)', () => {
        expect(D.dateByAddingWeeks(3).toString(full)).toBe('1945/05/29-23:01:00') ;
    });
    it('d.dateByAddingTime(31:59:13)', () => {
        expect(D.dateByAddingTime(31*TSHour+59*TSMinute+13).toString(full)).toBe('1945/05/10-07:00:13') ;
    });
    it('d.firstDateOfYear()', () => { 
        expect(D.firstDateOfYear().toString(full)).toBe("1945/01/01-00:00:00") ; 
    });
    it('d.lastDateOfYear()', () => { 
        expect(D.lastDateOfYear().toString(full)).toBe("1945/12/31-00:00:00") ; 
    });
    it('d.firstDateOfMonth()', () => { 
        expect(D.firstDateOfMonth().toString(full)).toBe("1945/05/01-00:00:00") ; 
    });
    it('d.lastDateOfMonth()', () => { 
        expect(D.lastDateOfMonth().toString(full)).toBe("1945/05/31-00:00:00") ; 
    });
    it('d.firstDateOfWeek(offset=0)', () => { 
        expect(D.firstDateOfWeek().toString(full)).toBe("1945/05/06-00:00:00") ; 
    });
    it('d.firstDateOfWeek(offset=1)', () => { 
        expect(D.firstDateOfWeek(1).toString(full)).toBe("1945/05/07-00:00:00") ; 
    });
    it('d.daysSinceDate(startOfYear)', () => { 
        expect(D.daysSinceDate(D.firstDateOfYear())).toBe(127) ; 
    });
    it('d.toEpoch()', () => { expect(D.toEpoch()).toBe(-777862740) ; }) ;
    it('d.toDate()', () => { expect(D.toDate()).toStrictEqual(ED) ; }) ;
    it('d.toIsoString()', () => { expect(D.toIsoString()).toBe("1945-05-08T23:01:00") ; }) ;
    it('d.toIsoString(true)', () => { expect(D.toIsoString(true)).toBe("19450508T230100") ; }) ;

    it('d.className', () => { expect(D.className).toBe("TSDate") ; }) ;

    const C = new TSDate(1966, 4, 13, 12, 5, 22) ;
    it('d.compare(>date)', () => { expect(D.compare(C)).toBe(Ascending) ; }) ;
    it('d.compare(=same var)', () => { expect(D.compare(D)).toBe(Same) ; }) ;
    it('d.compare(=other date)', () => { expect(D.compare(E)).toBe(Same) ; }) ;
    it('d.compare(<date)', () => { expect(D.compare(D.firstDateOfYear())).toBe(Descending) ; }) ;

    it('d.isEqual(>date)', () => { expect(!D.isEqual(C)).toBeTruthy() ; }) ;
    it('d.isEqual(=same var)', () => { expect(D.isEqual(D)).toBeTruthy() ; }) ;
    it('d.isEqual(=other date)', () => { expect(D.isEqual(E)).toBeTruthy() ; }) ;
    it('d.isEqual(<date)', () => { expect(!D.isEqual(D.firstDateOfYear())).toBeTruthy() ; }) ;
}) ;

describe("Testing TSDate output format", () => {
    const D1 = new TSDate(1945, 5, 8, 23, 1, 3) ; // nearly 3 seconds after armistice signature
    const f = "%A, %e %B %Y à %Hh%M" ;
    it(`d.toString(${f})`, () => { expect(D1.toString(f)).toBe("mardi, 8 mai 1945 à 23h01") ; }) ;

    const cf = "%A, %e %B %Y%[ à %Hh%M et %T secondes%]" ;
    it(`d.toString(${cf})`, () => { expect(D1.toString(cf)).toBe("mardi, 8 mai 1945 à 23h01 et 3 secondes") ; }) ;
    it(`d.toString(${cf})`, () => { expect(D1.dateWithoutTime().toString(cf)).toBe("mardi, 8 mai 1945") ; }) ;
}) ;
