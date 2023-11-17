import { TSCountry } from "../src/tscountry";
import { Continents, Countries, Currencies } from "../src/types";
import { TSTest } from '../src/tstester';

export const countriesGroups = TSTest.group("Testing TSCountry class", async (group) => {
    const C = TSCountry.countries() ;

    group.unary('EEC countries', async (t) => {
        t.expect(C.filter(c => c.EEC).length).is(27) ;
    })

    group.unary("Continents' countries", async (t) => {
        const NA_countries = 4 ; // for now USA, Canada, Greenland and Mexico
        const SA_countries = 1 ; // for now BRAZIL
        t.expect0(C.filter(c => c.continent === Continents.EU).length).is(C.length-NA_countries-SA_countries) ;
        t.expect1(C.filter(c => c.continent === Continents.NA).length).is(NA_countries) ;
        t.expect2(C.filter(c => c.continent === Continents.SA).length).is(SA_countries) ;
    })

    group.unary('Countries accepting EURO as currency', async (t) => {
        t.expect0(C.filter(c => c.currency === Currencies.EUR).length).is(26) ;
        t.expect1(C.filter(c => c.EEC && c.currency === Currencies.EUR).length).is(20) ;
        t.expect2(TSCountry.country("croatia")?.currency).is(Currencies.EUR) ;
    }) ;

    group.unary('TSCountry.country() method', async (t) => {
        t.expect0(TSCountry.country(" France")?.name).is("France") ;
        t.expect1(TSCountry.country("UK")?.name).is("Royaume Uni") ;
        t.expect2(TSCountry.country(Countries.GB)?.name).is("Royaume Uni") ;
        t.expect3(TSCountry.country(Countries.UA)?.name).is("Ukraine") ;
        t.expect4(TSCountry.country("Russia")).null() ;
        t.expect5(TSCountry.country("Ελλάδα")?.name).is("Grèce") ;
        t.expect6(TSCountry.country("grêce")?.name).is("Grèce") ;
        t.expect7(TSCountry.country("Βοσνία")?.name).is("Bosnie-Herzégovine") ;
        t.expect8(TSCountry.country("USA")?.name).is("États-Unis d'Amérique") ;
        t.expect9(TSCountry.country("messico")?.name).is("Mexique") ;
    }) ;

    group.unary('TSCountry accessors', async (t) => {
        const fr = TSCountry.country('frankreich') ;
        const uk = TSCountry.country("UK") ;
        const gr = TSCountry.country("Ελλάδα") ;
        const us = TSCountry.country("USA") ;
        t.expect0(fr?.label).is('France') ;
        t.expect1(fr?.languageName).is('français') ; 
        t.expect2(gr?.label).is("Greece") ;
        t.expect3(gr?.continent).is('EU') ;
        t.expect4(gr?.continentName).is('Europe') ;
        t.expect5(gr?.continentLabel).is('Europe') ;
        t.expect6(gr?.nativeContinentName).is('Ευρώπη') ;
        t.expect7(gr?.nativeLanguageName).is("ελληνικά") ;
        t.expect8(gr?.nativeName).is("Ελλάδα") ;
        t.expect9(uk?.nativeName).is("United Kingdom") ;
        t.expectA(uk?.nativeLanguageName).is("english") ;
        t.expectB(us?.continent).is(Continents.NA) ;
        t.expectC(us?.continentName).is('Amérique du Nord') ;
        t.expectD(us?.continentLabel).is('North America') ;
        t.expectE(TSCountry.country(Countries.MX)?.continent).is(Continents.NA) ;
        t.expectF(TSCountry.country("greenland")?.state.label).is("Denmark") ;
    }) ;

    /*group.unary('TSCountry dump dialcodes', async (_) => {
        const dialCodes = C.map((c) => c.phonePlan.dialCode).sort() ;
        group.description("==========================================");
        group.description(dialCodes.join('\n')) ;
        group.description("==========================================");
    }) ;*/
}) ;
