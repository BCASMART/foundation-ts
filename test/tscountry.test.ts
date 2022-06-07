import { TSCountry } from "../src/tscountry";
import { Countries, Currencies } from "../src/types";
import { TSTest } from '../src/tstester';

export const countriesGroups = TSTest.group("Testing TSCountry class", async (group) => {
    const C = TSCountry.countries() ;

    group.unary('verifying EEC countries', async (t) => {
        t.expect(C.filter(c => c.EEC).length).toBe(27) ;
    })

    group.unary('verifying countries accepting EURO as currency', async (t) => {
        t.expect(C.filter(c => c.currency === Currencies.EUR).length).toBe(24) ;
        t.expect(C.filter(c => c.EEC && c.currency === Currencies.EUR).length).toBe(19) ;
    }) ;

    group.unary('verifying TSCountry.country(x)', async (t) => {
        t.expect(TSCountry.country(" France")?.name).toBe("France") ;
        t.expect(TSCountry.country("UK")?.name).toBe("Royaume Uni") ;
        t.expect(TSCountry.country(Countries.GB)?.name).toBe("Royaume Uni") ;
        t.expect(TSCountry.country(Countries.UA)?.name).toBe("Ukraine") ;
        t.expect(TSCountry.country("Russia")).toBeNull() ;
    }) ;

    group.unary('verifying TSCountry accessors', async (t) => {
        const c = TSCountry.country('frankreich') ;
        t.expect(c?.name).toBe('France') ;
        t.expect(c?.languageName).toBe('français') ; 
    }) ;

}) ;
