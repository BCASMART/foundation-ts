import { $country, $currency, $language, TSDefaults } from "../src/tsdefaults";
import { Countries, Currencies, Languages } from "../src/types";

import { TSTest } from '../src/tstester';

export const defaultsGroups = [
    TSTest.group("Testing default countries codes", async (group) => {
        group.unary('$country() function', async (t) => {
            t.expect0($country(" France")).is(Countries.FR) ;
            t.expect1($country("fra")).is(Countries.FR) ;
            t.expect2($country("França")).is(Countries.FR) ;
            t.expect3($country("FRAnCa")).is(Countries.FR) ;
            t.expect4($country("frankreich")).is(Countries.FR) ;
            t.expect5($country("Eslováquia")).is(Countries.SK) ;
            t.expect6($country("eslovaquia")).is(Countries.SK) ;
            t.expect7($country(" SVK ")).is(Countries.SK) ;
            t.expect8($country("GB")).is(Countries.GB) ;
            t.expect9($country("United Kingdom")).is(Countries.GB) ;
            t.expectA($country("UK")).is(Countries.GB) ;
            t.expectB($country("Grande Bretagne")).is(Countries.GB) ;
            t.expectC($country("Großbritannien")).is(Countries.GB) ;
            t.expectD($country("Grossbritannien")).is(Countries.GB) ;
        }) ;
    }),
    TSTest.group("Testing default languages", async (group) => {
        const D = TSDefaults.defaults() ;

        group.unary('Default language get/set', async (t) => {
            t.expect0(D.defaultLanguage).is(Languages.fr) ;
            D.setDefaultLanguage(Languages.en) ;
            t.expect1($language()).is(Languages.en) ;
            D.setDefaultLanguage(Languages.fr) ;
        }) ;
    
        group.unary('$language() function', async (t) => {
            t.expect0($language('FRF')).null() ;
            t.expect1($language(' FR ')).is(Languages.fr) ;
            t.expect2($language('Français ')).is(Languages.fr) ;
            t.expect3($language('Francais ')).is(Languages.fr) ;
            t.expect4($language('französisch')).is(Languages.fr) ;
            t.expect5($language('franzosisch')).is(Languages.fr) ;
        }) ;
    }),
    TSTest.group("Testing defaults currency", async (group) => {
        const D = TSDefaults.defaults() ;

        group.unary('Default currency get/set', async (t) => {
            t.expect0(D.defaultCurrency).is(Currencies.EUR) ;
            D.setDefaultCurrency(Currencies.GBP) ;
            t.expect1($currency()).is(Currencies.GBP) ;
        }) ;
    
        group.unary('$currency() function', async (t) => {
            t.expect0($currency('FRF')).null() ;
            t.expect1($currency(' EUR ')).is(Currencies.EUR) ;
            t.expect2($currency('frankreich')).is(Currencies.EUR) ;
            t.expect3($currency('united kingdom')).is(Currencies.GBP) ;
            t.expect4($currency('Angleterre')).is(Currencies.GBP) ;
            t.expect5($currency(' CHF ')).is(Currencies.CHF) ;
            t.expect6($currency('Suisse')).is(Currencies.CHF) ;
            t.expect7($currency('Liechtenstein')).is(Currencies.CHF) ;
    
            // all countries out of EEC using EURO as currency:
            t.expectA($currency('andorre')).is(Currencies.EUR) ;
            t.expectB($currency('principauté de monaco')).is(Currencies.EUR) ;
            t.expectC($currency('montenegro')).is(Currencies.EUR) ;
            t.expectD($currency('kosovo')).is(Currencies.EUR) ;
            t.expectE($currency('saint siège')).is(Currencies.EUR) ;
        }) ;
    })
] ;
