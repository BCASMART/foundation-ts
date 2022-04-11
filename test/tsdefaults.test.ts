import { $country, $currency, $language, TSDefaults } from "../src/tsdefaults";
import { Countries, Currencies, Languages } from "../src/types";

describe("Testing countries codes", () => {
    it('verifying $country(x)', () => {
        expect($country(" France")).toBe(Countries.FR) ;
        expect($country("fra")).toBe(Countries.FR) ;
        expect($country("França")).toBe(Countries.FR) ;
        expect($country("FRAnCa")).toBe(Countries.FR) ;
        expect($country("frankreich")).toBe(Countries.FR) ;
        expect($country("Eslováquia")).toBe(Countries.SK) ;
        expect($country("eslovaquia")).toBe(Countries.SK) ;
        expect($country(" SVK ")).toBe(Countries.SK) ;
        expect($country("GB")).toBe(Countries.GB) ;
        expect($country("United Kingdom")).toBe(Countries.GB) ;
        expect($country("UK")).toBe(Countries.GB) ;
        expect($country("Grande Bretagne")).toBe(Countries.GB) ;
        expect($country("Großbritannien")).toBe(Countries.GB) ;
        expect($country("Grossbritannien")).toBe(Countries.GB) ;
    }) ;
}) ;

describe("Testing languages", () => {
    const D = TSDefaults.defaults() ;

    it('verifying default language', () => {
        expect(D.defaultLanguage).toBe(Languages.fr) ;
        D.setDefaultLanguage(Languages.en) ;
        expect($language()).toBe(Languages.en) ;
        D.setDefaultLanguage(Languages.fr) ;
    }) ;

    it('verifying $language(x)', () => {
        expect($language('FRF')).toBeNull() ;
        expect($language(' FR ')).toBe(Languages.fr) ;
        expect($language('Français ')).toBe(Languages.fr) ;
        expect($language('Francais ')).toBe(Languages.fr) ;
        expect($language('französisch')).toBe(Languages.fr) ;
        expect($language('franzosisch')).toBe(Languages.fr) ;
    }) ;

}) ;

describe("Testing currency", () => {
    const D = TSDefaults.defaults() ;

    it('verifying default currency', () => {
        expect(D.defaultCurrency).toBe(Currencies.EUR) ;
        D.setDefaultCurrency(Currencies.GBP) ;
        expect($currency()).toBe(Currencies.GBP) ;
    }) ;

    it('verifying $currency(x)', () => {
        expect($currency('FRF')).toBeNull() ;
        expect($currency(' EUR ')).toBe(Currencies.EUR) ;
        expect($currency('frankreich')).toBe(Currencies.EUR) ;
        expect($currency('united kingdom')).toBe(Currencies.GBP) ;
        expect($currency('Angleterre')).toBe(Currencies.GBP) ;
        expect($currency(' CHF ')).toBe(Currencies.CHF) ;
        expect($currency('Suisse')).toBe(Currencies.CHF) ;
        expect($currency('Liechtenstein')).toBe(Currencies.CHF) ;

        // all countries out of EEC using EURO as currency:
        expect($currency('andorre')).toBe(Currencies.EUR) ;
        expect($currency('principauté de monaco')).toBe(Currencies.EUR) ;
        expect($currency('montenegro')).toBe(Currencies.EUR) ;
        expect($currency('kosovo')).toBe(Currencies.EUR) ;
        expect($currency('saint siège')).toBe(Currencies.EUR) ;
    }) ;

}) ;
