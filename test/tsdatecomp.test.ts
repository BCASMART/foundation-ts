import { TSDate } from "../src/tsdate";
import { $components2StringWithOffset, $duration, $duration2String, $durationcomponents, TSDurationComp } from "../src/tsdatecomp";
import { uint } from "../src/types";
import { TSTest } from '../src/tstester';

export const dateCompGroups = [
    TSTest.group("Testing duration functions", async (group) => {

        const Z:TSDurationComp = $durationcomponents(0) ;
        const A:TSDurationComp = { days:3 as uint, hours:2 as uint, minutes:25 as uint, seconds: 10 as uint} ;
    
    
        group.unary('verifying $durationcomponents()', async (t) => {
            t.expect0(Z).toBeDefined() ;
            t.expect1(Z.days).toBe(0) ;
            t.expect2(Z.hours).toBe(0) ;
            t.expect3(Z.minutes).toBe(0) ;
            t.expect4(Z.seconds).toBe(0) ;
    
            const n = $duration(A) ;
            const N = $durationcomponents(n) ;
            t.expectA(N).toBeDefined() ;
            t.expectB(N.days).toBe(3) ;
            t.expectC(N.hours).toBe(2) ;
            t.expectD(N.minutes).toBe(25) ;
            t.expectE(N.seconds).toBe(10) ;
        }) ;
    
        const B:TSDurationComp = { days:0 as uint, hours:2 as uint, minutes:25 as uint, seconds: 10 as uint} ;
        const C:TSDurationComp = { days:3 as uint, hours:2 as uint, minutes:25 as uint, seconds: 0 as uint} ;
        const D:TSDurationComp = { days:0 as uint, hours:2 as uint, minutes:25 as uint, seconds: 0 as uint} ;
        const E:TSDurationComp = { days:0 as uint, hours:2 as uint, minutes:0 as uint, seconds: 0 as uint} ;
        const F:TSDurationComp = { days:3 as uint, hours:0 as uint, minutes:0 as uint, seconds: 0 as uint} ;
        const G:TSDurationComp = { days:0 as uint, hours:0 as uint, minutes:25 as uint, seconds: 0 as uint} ;
        const H:TSDurationComp = { days:0 as uint, hours:0 as uint, minutes:0 as uint, seconds: 10 as uint} ;
    
        group.unary('verifying standard format', async (t) => {
            t.expect0($duration2String(A)).toBe("3-02:25:10") ;
            t.expect1($duration2String(B)).toBe("02:25:10") ;
            t.expect2($duration2String(D)).toBe("02:25") ;
            t.expect3($duration2String(E)).toBe("02:00") ;
            t.expect4($duration2String(F)).toBe("3-00:00") ;
            t.expect5($duration2String(G)).toBe("00:25") ;
            t.expect6($duration2String(H)).toBe("00:00:10") ;
            t.expect7($duration2String(Z)).toBe("00:00") ;
        }) ;
    
        const F1 = "%(%d jours%[, %]%)%[%≤%h heures%≥%<%≤%{,%b et%} %≥%m minutes%{ et %s secondes%}%>%]" ;
    
        group.unary(`Verifying complex format "${F1}"`, async (t) => {
        
            t.expect0($duration2String(A, F1)).toBe("3 jours, 2 heures, 25 minutes et 10 secondes") ;
            t.expect1($duration2String(B, F1)).toBe("2 heures, 25 minutes et 10 secondes") ;
            t.expect2($duration2String(C, F1)).toBe("3 jours, 2 heures et 25 minutes") ;
            t.expect3($duration2String(D, F1)).toBe("2 heures et 25 minutes") ;
            t.expect4($duration2String(E, F1)).toBe("2 heures") ;
            t.expect5($duration2String(F, F1)).toBe("3 jours") ;
            t.expect6($duration2String(G, F1)).toBe("25 minutes") ; 
            t.expect7($duration2String(H, F1)).toBe("0 minutes et 10 secondes") ;
            t.expect8($duration2String(Z, F1)).toBe("") ; 
        }) ;
    }),
    TSTest.group("Testing complex iso string output function", async (group) => {
        const C = TSDate.zulu().toComponents() ;
        const s = $components2StringWithOffset(C, {
            milliseconds:0 as uint,
            forceZ:true
        }) ;
        const s2 = $components2StringWithOffset(C, {
            milliseconds:0 as uint,
        }) ;
    
        group.unary(`Verifying milliseconds output"`, async (t) => {
            const p = s.lastIndexOf('.') ;
            t.expect0(s.slice(p)).toBe('.000Z') ;
            t.expect1(s2.slice(p)).toBe('.000+00:00') ;
        }) ;
    })
] ;
