import { TSCountry } from "../src/tscountry";
import { Continents, Countries, Currencies } from "../src/types";
import { $ok } from "../src/commons";
import { Same } from "../src/types";
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
        t.expect0(C.filter(c => c.currency === Currencies.EUR).length).is(27) ;
        t.expect1(C.filter(c => c.EEC && c.currency === Currencies.EUR).length).is(21) ;
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

    group.unary('code conversion statics', async (t) => {
        t.expect0(TSCountry.alpha2CodeForAlpha3Code('FRA')).is('FR' as any) ;
        t.expect1(TSCountry.alpha2CodeForAlpha3Code('FR')).null() ;          // wrong length
        t.expect2(TSCountry.alpha2CodeForAlpha3Code('XXX')).null() ;         // unknown
        t.expect3(TSCountry.alpha3CodeForAlpha2Code('FR')).is('FRA') ;
        t.expect4(TSCountry.alpha3CodeForAlpha2Code('ZZ')).null() ;
        t.expect5(TSCountry.alpha3CodeForAlpha2Code('FRA')).null() ;         // wrong length
        t.expect6(TSCountry.alpha2CodeForNumericCode(250)).is('FR') ;
        t.expect7(TSCountry.alpha2CodeForNumericCode(0)).null() ;
        t.expect8(TSCountry.alpha2CodeForNumericCode(null)).null() ;
        t.expect9(TSCountry.alpha2Codes().length).is(TSCountry.alpha3Codes().length) ;
        t.expectA(TSCountry.numericCodes().length).gt(40) ;
    }) ;

    group.unary('countriesForDialCode()', async (t) => {
        const fr = TSCountry.country('FR')! ;
        t.expect0(TSCountry.countriesForDialCode(fr.phonePlan.dialCode).map(c => c.alpha2Code)).is(['FR'] as any) ;
        t.expect1(TSCountry.countriesForDialCode(null)).is([]) ;
        t.expect2(TSCountry.countriesForDialCode('000000')).is([]) ;
    }) ;

    group.unary('primitives, JSON, clone, isEqual, compare, leafInspect', async (t) => {
        const fr = TSCountry.country('FR')! ;
        const gb = TSCountry.country('GB')! ;
        t.expect0(fr.valueOf()).is(250) ;
        t.expect1(+fr).is(250) ;
        t.expect2(`${fr}`).is('FR') ;
        t.expect3(String(fr)).is('FR') ;
        t.expect4(fr.toJSON()).is('FR') ;
        t.expect5(fr.toArray()).is(['FR', 'FRA']) ;
        t.expect6(fr.toString()).is('FR') ;
        t.expect7(fr.leafInspect()).is('<France (FR)>') ;
        t.expect8(fr.clone() === fr).true() ;                                // immutable -> identity
        t.expect9(fr.isEqual(fr)).true() ;
        t.expectA(fr.isEqual(gb)).false() ;
        t.expectB(fr.compare(fr)).is(Same) ;
        t.expectC(fr.compare(gb)).lt(Same) ;                                 // 'FR' < 'GB'
        t.expectD(fr.compare(5)).is(undefined) ;
        t.expectE(fr.translatedName('de')).is('Frankreich') ;
        t.expectF(fr.translatedName(null)).null() ;
        t.expectG(fr.translatedName('xx' as any)).null() ;
    }) ;

    group.unary('VAT number validators (all managed countries)', async (t) => {
        const valid:{[k:string]:string} = {
            AT:"ATU12345678", BE:"BE0123456789", BG:"BG123456789", HR:"HR12345678901", CY:"CY12345678A",
            CZ:"CZ12345678", DK:"DK12345678", EE:"EE123456789", FI:"FI12345678", FR:"FRXX123456789",
            DE:"DE123456789", GR:"EL123456789", HU:"HU12345678", IE:"IE1234567AB", IT:"IT12345678901",
            LV:"LV12345678901", LT:"LT123456789", LU:"LU12345678", MT:"MT12345678", NL:"NL123456789B01",
            PL:"PL1234567890", PT:"PT123456789", RO:"RO1234567890", SK:"SK1234567890", SI:"SI123456789",
            ES:"ESX1234567X", SE:"SE123456789012",
        } ;
        let i = 0 ;
        for (const [code, vat] of Object.entries(valid)) {
            const c = TSCountry.country(code) ;
            t.expect(c, `${code}?`).OK() ;
            t.expect($ok(c!.validateVATNumber(vat)), `${code}+`).true() ;    // format accepted
            t.expect(c!.validateVATNumber(code + "0"), `${code}-`).null() ;  // too short / malformed -> null
            i++ ;
        }
        t.expect0(i).is(27) ;
        // a managed country without a VAT validator -> undefined (cannot check)
        t.expect1(TSCountry.country('US')!.validateVATNumber('US1234567')).undef() ;
        t.expect2(TSCountry.country('FR')!.validateVATNumber('FR')).null() ; // < 3 chars
        t.expect3(TSCountry.countryForVATNumber('FRXX123456789')?.alpha2Code).is('FR' as any) ;
        t.expect4(TSCountry.countryForVATNumber('XX')).null() ;
        t.expect5(TSCountry.countryForVATNumber('FR123')).null() ;
        t.expect6(TSCountry.countryForVATNumber(null)).null() ;
    }) ;
}) ;
