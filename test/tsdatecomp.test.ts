import { TSDate } from "../src/tsdate";
import { $components2StringWithOffset, $duration, $duration2String, $durationcomponents, TSDurationComp } from "../src/tsdatecomp";
import { uint } from "../src/types";

describe("Testing duration functions", () => {

    const Z:TSDurationComp = $durationcomponents(0) ;
    const A:TSDurationComp = { days:3 as uint, hours:2 as uint, minutes:25 as uint, seconds: 10 as uint} ;


    it('verifying $durationcomponents()', () => {
        expect(Z).toBeDefined() ;
        expect(Z.days).toBe(0) ;
        expect(Z.hours).toBe(0) ;
        expect(Z.minutes).toBe(0) ;
        expect(Z.seconds).toBe(0) ;

        const n = $duration(A) ;
        const N = $durationcomponents(n) ;
        expect(N).toBeDefined() ;
        expect(N.days).toBe(3) ;
        expect(N.hours).toBe(2) ;
        expect(N.minutes).toBe(25) ;
        expect(N.seconds).toBe(10) ;
    }) ;

    const B:TSDurationComp = { days:0 as uint, hours:2 as uint, minutes:25 as uint, seconds: 10 as uint} ;
    const C:TSDurationComp = { days:3 as uint, hours:2 as uint, minutes:25 as uint, seconds: 0 as uint} ;
    const D:TSDurationComp = { days:0 as uint, hours:2 as uint, minutes:25 as uint, seconds: 0 as uint} ;
    const E:TSDurationComp = { days:0 as uint, hours:2 as uint, minutes:0 as uint, seconds: 0 as uint} ;
    const F:TSDurationComp = { days:3 as uint, hours:0 as uint, minutes:0 as uint, seconds: 0 as uint} ;
    const G:TSDurationComp = { days:0 as uint, hours:0 as uint, minutes:25 as uint, seconds: 0 as uint} ;
    const H:TSDurationComp = { days:0 as uint, hours:0 as uint, minutes:0 as uint, seconds: 10 as uint} ;

    it('verifying standard format', () => {
        expect($duration2String(A)).toBe("3-02:25:10") ;
        expect($duration2String(B)).toBe("02:25:10") ;
        expect($duration2String(D)).toBe("02:25") ;
        expect($duration2String(E)).toBe("02:00") ;
        expect($duration2String(F)).toBe("3-00:00") ;
        expect($duration2String(G)).toBe("00:25") ;
        expect($duration2String(H)).toBe("00:00:10") ;
        expect($duration2String(Z)).toBe("00:00") ;
    }) ;

    const F1 = "%(%d jours%[, %]%)%[%≤%h heures%≥%<%≤%{,%b et%} %≥%m minutes%{ et %s secondes%}%>%]" ;

    it(`Verifying complex format "${F1}"`, () => {
    
        expect($duration2String(A, F1)).toBe("3 jours, 2 heures, 25 minutes et 10 secondes") ;
        expect($duration2String(B, F1)).toBe("2 heures, 25 minutes et 10 secondes") ;
        expect($duration2String(C, F1)).toBe("3 jours, 2 heures et 25 minutes") ;
        expect($duration2String(D, F1)).toBe("2 heures et 25 minutes") ;
        expect($duration2String(E, F1)).toBe("2 heures") ;
        expect($duration2String(F, F1)).toBe("3 jours") ;
        expect($duration2String(G, F1)).toBe("25 minutes") ; 
        expect($duration2String(H, F1)).toBe("0 minutes et 10 secondes") ;
        expect($duration2String(Z, F1)).toBe("") ; 
    }) ;

}) ;

describe("Testing comple iso string output function", () => {
    const C = TSDate.zulu().toComponents() ;
    const s = $components2StringWithOffset(C, {
        milliseconds:0 as uint,
        forceZ:true
    }) ;
    const s2 = $components2StringWithOffset(C, {
        milliseconds:0 as uint,
    }) ;

    it(`Verifying milliseconds output"`, () => {
        const p = s.lastIndexOf('.') ;
        expect(s.slice(p)).toBe('.000Z') ;
        expect(s2.slice(p)).toBe('.000+00:00') ;
    }) ;

}) ;
