import { TSCountry } from "../src/tscountry";
import { Countries, Currencies } from "../src/types";

describe("Testing TSCountry class", () => {
    const C = TSCountry.countries() ;

    it('verifying EEC countries', () => {
        expect(C.filter(c => c.EEC).length).toBe(27) ;
    })

    it('verifying countries accepting EURO as currency', () => {
        expect(C.filter(c => c.currency === Currencies.EUR).length).toBe(24) ;
        expect(C.filter(c => c.EEC && c.currency === Currencies.EUR).length).toBe(19) ;
    }) ;

    it('verifying TSCountry.country(x)', () => {
        expect(TSCountry.country(" France")?.name).toBe("France") ;
        expect(TSCountry.country("UK")?.name).toBe("Royaume Uni") ;
        expect(TSCountry.country(Countries.GB)?.name).toBe("Royaume Uni") ;
        expect(TSCountry.country(Countries.UA)?.name).toBe("Ukraine") ;
        expect(TSCountry.country("Russia")).toBeNull() ;
    }) ;

    it('verifying TSCountry accessors', () => {
        const c = TSCountry.country('frankreich') ;
        expect(c?.name).toBe('France') ;
        expect(c?.languageName).toBe('français') ; 
    }) ;

}) ;