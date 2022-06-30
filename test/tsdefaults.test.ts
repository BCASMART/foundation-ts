import { $country, $currency, $language, TSDefaults } from "../src/tsdefaults";
import { Countries, Currencies, Languages } from "../src/types";

import { TSTest } from '../src/tstester';

export const defaultsGroups = [
    TSTest.group("Testing default countries codes", async (group) => {
        group.unary('verifying $country(x)', async (t) => {
            t.expect0($country(" France")).toBe(Countries.FR) ;
            t.expect1($country("fra")).toBe(Countries.FR) ;
            t.expect2($country("França")).toBe(Countries.FR) ;
            t.expect3($country("FRAnCa")).toBe(Countries.FR) ;
            t.expect4($country("frankreich")).toBe(Countries.FR) ;
            t.expect5($country("Eslováquia")).toBe(Countries.SK) ;
            t.expect6($country("eslovaquia")).toBe(Countries.SK) ;
            t.expect7($country(" SVK ")).toBe(Countries.SK) ;
            t.expect8($country("GB")).toBe(Countries.GB) ;
            t.expect9($country("United Kingdom")).toBe(Countries.GB) ;
            t.expectA($country("UK")).toBe(Countries.GB) ;
            t.expectB($country("Grande Bretagne")).toBe(Countries.GB) ;
            t.expectC($country("Großbritannien")).toBe(Countries.GB) ;
            t.expectD($country("Grossbritannien")).toBe(Countries.GB) ;
        }) ;
    }),
    TSTest.group("Testing default languages", async (group) => {
        const D = TSDefaults.defaults() ;

        group.unary('verifying default language', async (t) => {
            t.expect0(D.defaultLanguage).toBe(Languages.fr) ;
            D.setDefaultLanguage(Languages.en) ;
            t.expect1($language()).toBe(Languages.en) ;
            D.setDefaultLanguage(Languages.fr) ;
        }) ;
    
        group.unary('verifying $language(x)', async (t) => {
            t.expect0($language('FRF')).toBeNull() ;
            t.expect1($language(' FR ')).toBe(Languages.fr) ;
            t.expect2($language('Français ')).toBe(Languages.fr) ;
            t.expect3($language('Francais ')).toBe(Languages.fr) ;
            t.expect4($language('französisch')).toBe(Languages.fr) ;
            t.expect5($language('franzosisch')).toBe(Languages.fr) ;
        }) ;
    }),
    TSTest.group("Testing defaults currency", async (group) => {
        const D = TSDefaults.defaults() ;

        group.unary('verifying default currency', async (t) => {
            t.expect0(D.defaultCurrency).toBe(Currencies.EUR) ;
            D.setDefaultCurrency(Currencies.GBP) ;
            t.expect1($currency()).toBe(Currencies.GBP) ;
        }) ;
    
        group.unary('verifying $currency(x)', async (t) => {
            t.expect0($currency('FRF')).toBeNull() ;
            t.expect1($currency(' EUR ')).toBe(Currencies.EUR) ;
            t.expect2($currency('frankreich')).toBe(Currencies.EUR) ;
            t.expect3($currency('united kingdom')).toBe(Currencies.GBP) ;
            t.expect4($currency('Angleterre')).toBe(Currencies.GBP) ;
            t.expect5($currency(' CHF ')).toBe(Currencies.CHF) ;
            t.expect6($currency('Suisse')).toBe(Currencies.CHF) ;
            t.expect7($currency('Liechtenstein')).toBe(Currencies.CHF) ;
    
            // all countries out of EEC using EURO as currency:
            t.expectA($currency('andorre')).toBe(Currencies.EUR) ;
            t.expectB($currency('principauté de monaco')).toBe(Currencies.EUR) ;
            t.expectC($currency('montenegro')).toBe(Currencies.EUR) ;
            t.expectD($currency('kosovo')).toBe(Currencies.EUR) ;
            t.expectE($currency('saint siège')).toBe(Currencies.EUR) ;
        }) ;
    })
] ;
