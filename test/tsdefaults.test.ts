import { $country, $currency, $language, TSDefaults } from "../src/tsdefaults";
import { Countries, Currencies, Languages } from "../src/types";

import { TSTest } from '../src/tstester';

export const defaultsGroups = [
    TSTest.group("Testing countries codes", async (group) => {
        group.unary('verifying $country(x)', async (t) => {
            t.expect($country(" France")).toBe(Countries.FR) ;
            t.expect($country("fra")).toBe(Countries.FR) ;
            t.expect($country("França")).toBe(Countries.FR) ;
            t.expect($country("FRAnCa")).toBe(Countries.FR) ;
            t.expect($country("frankreich")).toBe(Countries.FR) ;
            t.expect($country("Eslováquia")).toBe(Countries.SK) ;
            t.expect($country("eslovaquia")).toBe(Countries.SK) ;
            t.expect($country(" SVK ")).toBe(Countries.SK) ;
            t.expect($country("GB")).toBe(Countries.GB) ;
            t.expect($country("United Kingdom")).toBe(Countries.GB) ;
            t.expect($country("UK")).toBe(Countries.GB) ;
            t.expect($country("Grande Bretagne")).toBe(Countries.GB) ;
            t.expect($country("Großbritannien")).toBe(Countries.GB) ;
            t.expect($country("Grossbritannien")).toBe(Countries.GB) ;
        }) ;
    }),
    TSTest.group("Testing languages", async (group) => {
        const D = TSDefaults.defaults() ;

        group.unary('verifying default language', async (t) => {
            t.expect(D.defaultLanguage).toBe(Languages.fr) ;
            D.setDefaultLanguage(Languages.en) ;
            t.expect($language()).toBe(Languages.en) ;
            D.setDefaultLanguage(Languages.fr) ;
        }) ;
    
        group.unary('verifying $language(x)', async (t) => {
            t.expect($language('FRF')).toBeNull() ;
            t.expect($language(' FR ')).toBe(Languages.fr) ;
            t.expect($language('Français ')).toBe(Languages.fr) ;
            t.expect($language('Francais ')).toBe(Languages.fr) ;
            t.expect($language('französisch')).toBe(Languages.fr) ;
            t.expect($language('franzosisch')).toBe(Languages.fr) ;
        }) ;
    }),
    TSTest.group("Testing currency", async (group) => {
        const D = TSDefaults.defaults() ;

        group.unary('verifying default currency', async (t) => {
            t.expect(D.defaultCurrency).toBe(Currencies.EUR) ;
            D.setDefaultCurrency(Currencies.GBP) ;
            t.expect($currency()).toBe(Currencies.GBP) ;
        }) ;
    
        group.unary('verifying $currency(x)', async (t) => {
            t.expect($currency('FRF')).toBeNull() ;
            t.expect($currency(' EUR ')).toBe(Currencies.EUR) ;
            t.expect($currency('frankreich')).toBe(Currencies.EUR) ;
            t.expect($currency('united kingdom')).toBe(Currencies.GBP) ;
            t.expect($currency('Angleterre')).toBe(Currencies.GBP) ;
            t.expect($currency(' CHF ')).toBe(Currencies.CHF) ;
            t.expect($currency('Suisse')).toBe(Currencies.CHF) ;
            t.expect($currency('Liechtenstein')).toBe(Currencies.CHF) ;
    
            // all countries out of EEC using EURO as currency:
            t.expect($currency('andorre')).toBe(Currencies.EUR) ;
            t.expect($currency('principauté de monaco')).toBe(Currencies.EUR) ;
            t.expect($currency('montenegro')).toBe(Currencies.EUR) ;
            t.expect($currency('kosovo')).toBe(Currencies.EUR) ;
            t.expect($currency('saint siège')).toBe(Currencies.EUR) ;
        }) ;
    })
] ;
