import { $config, $continentName, $country, $currency, $default, $language, $locales, $removedefault, $setdefault, $tmp, $unitDefinition, TSDefaults } from "../src/tsdefaults";
import { Countries, Currencies, Languages } from "../src/types";
import { $inbrowser } from "../src/utils";
import { TSCountry } from "../src/tscountry";
import { $path, $writeString, $removeFile } from "../src/fs";

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
    }),
    TSTest.group("Testing units", async (group) => {
        group.unary('$unitDefinition() function', async (t) => {
            t.expect0($unitDefinition('byte')?.unit).toBe('o') ;
            t.expect1($unitDefinition('byte', 'en')?.unit).toBe('B') ;
            t.expect2($unitDefinition('byte', 'el')?.singular).toBe('byte') ;
            t.expect3($unitDefinition('byte', 'de')?.plural).toBe('Bytes') ;
            t.expect4($unitDefinition('hour')?.unit).toBe('h') ;
            t.expect5($unitDefinition('minute')?.unit).toBe('mn') ;
            t.expect6($unitDefinition('hour', 'GB')?.unit).toBe('h') ;
            t.expect7($unitDefinition('minute', 'GB')?.unit).toBe('m') ;
            t.expect8($unitDefinition('hour', 'el')?.unit).toBe('ώ') ;
            t.expect9($unitDefinition('minute', 'el')?.unit).toBe('λ') ;
            t.expectA($unitDefinition('hour', 'GR')?.plural).toBe('ώρες') ;
            t.expectB($unitDefinition('minute', $country('grece'))?.singular).toBe('λεπτό') ;
            t.expectC($unitDefinition('unknown')?.singular).KO() ;
            t.expectD($unitDefinition('unknown')).undef() ;              // missing key -> undefined
            t.expectE($unitDefinition('year')?.unit).is('') ;           // [singular, plural] with no unit
            t.expectF($unitDefinition('byte', $locales('el'))?.unit).is('B') ; // Locales object arg
        }) ;
    }),

    TSTest.group("TSDefaults — managed languages / continents / localizations", async (group) => {
        const D = TSDefaults.defaults() ;

        group.unary('managedLanguages() / managedLanguage() / continentName()', async (t) => {
            t.expect0(D.managedLanguages().length).is(8) ;
            t.expect1(D.managedLanguages() === D.managedLanguages()).false() ;   // returns a copy
            t.expect2(D.managedLanguage(null)).is(D.defaultLanguage) ;
            t.expect3(D.managedLanguage('Français')).is(Languages.fr) ;
            t.expect4(D.managedLanguage('klingon')).null() ;
            t.expect5(D.continentName('EU')).is('Europe') ;
            t.expect6(D.continentName('EU', Languages.de)).is('Europa') ;
            t.expect7(D.continentName(null)).null() ;
            t.expect8($continentName('AS', Languages.fr)).is('Asie') ;
        }) ;

        group.unary('addLocalizations() / localizations()', async (t) => {
            D.addLocalizations(Languages.fr, { hello:'bonjour' }) ;
            D.addLocalizations(Languages.fr, { bye:'au revoir' }) ;          // merges
            t.expect0(D.localizations('fr').hello).is('bonjour') ;
            t.expect1(D.localizations('fr').bye).is('au revoir') ;
            t.expect2(D.localizations(TSCountry.country('FR')!).hello).is('bonjour') ;
            t.expect3(D.localizations('france').hello).is('bonjour') ;       // resolved via country
            t.expect4(D.localizations('klingon')).is({}) ;
            t.expect5(D.localizations(null)).is({}) ;
            t.expect6(() => D.addLocalizations('klingon' as any, {})).throws(/non managed language/) ;
            t.expect7(() => D.addLocalizations(Languages.fr, 42 as any)).throws(/non string-dictionary/) ;
        }) ;

        group.unary('setDefaultCountry() / setDefaultLanguage() / setDefaultCurrency()', async (t) => {
            const fr = D.defaultCountry ;
            const gb = TSCountry.country('GB')! ;
            t.expect0(D.setDefaultCountry(gb)).is(gb) ;
            t.expect1(D.defaultCountry).is(gb) ;
            t.expect2(D.setDefaultCountry(null as any)).is(gb) ;             // null ignored
            D.setDefaultCountry(fr) ;                                       // restore
            t.expect3(D.setDefaultLanguage('klingon' as any)).is(D.defaultLanguage) ; // unknown ignored
            t.expect4(D.setDefaultCurrency('ZZZ' as any)).is(D.defaultCurrency) ;
        }) ;
    }),

    TSTest.group("TSDefaults — in-memory values", async (group) => {
        group.unary('setValue / getValue / $default / $setdefault / $removedefault', async (t) => {
            const D = TSDefaults.defaults() ;
            $setdefault('fts.test.key', { a:1 }) ;
            t.expect0($default('fts.test.key')).is({ a:1 }) ;
            t.expect1(D.getValue('fts.test.key')).is({ a:1 }) ;
            $setdefault('fts.test.key', undefined) ;                        // deletes
            t.expect2($default('fts.test.key')).undef() ;
            D.setValue('fts.test.key2', 'v') ;
            t.expect3($default('fts.test.key2')).is('v') ;
            $removedefault('fts.test.key2') ;
            t.expect4($default('fts.test.key2')).undef() ;
            D.setValue('', 'ignored') ;                                     // empty key ignored
            if (!$inbrowser()) {
                // falls through to process.env when not set in memory
                t.expect5($default('PATH')).isstring() ;
            }
        }) ;
    }),
] ;

if (!$inbrowser()) {
    defaultsGroups.push(TSTest.group("TSDefaults — tmp directory & configure() (node only)", async (group) => {
        const D = TSDefaults.defaults() ;

        group.unary('tmpDirectory / setTmpDirectory()', async (t) => {
            const original = D.tmpDirectory ;
            t.expect0($tmp().length).gt(0) ;
            t.expect1(() => D.setTmpDirectory('/definitely/not/a/dir/xyz')).throws() ;
            D.setTmpDirectory(original) ;
            t.expect2(D.tmpDirectory).is(original) ;
        }) ;

        group.unary('configure() reads an env file and merges into process.env', async (t) => {
            const f = $path($tmp(), `fts-defaults-test-${Date.now()}.env`) ;
            $writeString(f, 'FTS_DEFAULTS_TEST_VAR=hello-world\n') ;
            try {
                $config(f) ;
                t.expect0(process.env.FTS_DEFAULTS_TEST_VAR).is('hello-world') ;
                $config('/no/such/file/.env', { debug:false }) ;           // missing file -> silent
                t.expect1(true).true() ;
            }
            finally {
                $removeFile(f) ;
                delete process.env.FTS_DEFAULTS_TEST_VAR ;
            }
        }) ;
    })) ;
}
