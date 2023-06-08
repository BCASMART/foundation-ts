import { $isobject, $isstring, $length, $ok, $value, $valueornull } from "./commons";
import { continent, ContinentNames, Countries, country, Currencies, currency, language, Languages, Nullable, StringDictionary, StringEncoding, StringTranslation, TSDictionary } from "./types";
import { $absolute, $isdirectory, $readBuffer } from "./fs";
import os from 'os'
import { TSCountry } from "./tscountry";
import localesList from './locales.json'
import { $env, $inbrowser, $logterm } from "./utils";
import { $ascii, $ftrim } from "./strings";
import { TSError } from "./tserrors";
import { TSCharset } from "./tscharset";

export interface Locales {
    names:StringTranslation;
    language: language,
    months:string[];
    monthsList?:string[];
    shortMonths:string[];
    days:string[];
    daysList?:string[];
    shortDays:string[];
    startingWeekDay:number;
    dateTimeFormat:string;
    dateFormat:string;
    shortDateFormat:string;
    shortDateTimeFormat:string;
    timeFormat:string;
    partialTimeFormat:string;
    ampm:string[];
    continentNames:ContinentNames;
    currencies?:CurrenciesInfo
}
export interface DefaultsConfigurationOptions {
    encoding?:Nullable<StringEncoding|TSCharset> ;
    debug?:Nullable<boolean>
    underscoreMax?:Nullable<number> ;
    variableMax?:Nullable<number> ;
}
export type StringTranslations = { [key in Languages]?:StringDictionary } ;
export type CurrenciesInfo = { [key in Currencies]?: { [key in Languages]?:Partial<CurrencyInfo> }} ;
export interface CurrencyInfo { unit:string ; units:string ; subunit:string ; subunits:string, code?:string, subcode?:string }
export class TSDefaults {
	private static __instance: TSDefaults ;

    /**
     * LOCALES (mostly date/time locales) are set in 8 common EEC languages
     * - english (en)
     * - french (fr),
     * - spanish (es),
     * - german (de),
     * - italian (it)
     * - portuguese (pt)
     * - dutch (nl)
     * - greeck (el)
     * 
     * This default management system is primarely meant to be used with EEC
     * countries. So we have the 27 countries of the EEC here + some other
     * to complete the panel of the european nations and some others like the US.
     */
    private static __locales = localesList as Locales[] ;
    private _defaultLanguage:language ;
    private _defaultCurrency:currency ;
    private _defaultCountry:TSCountry ;
    private _tmpDirectory:string = $inbrowser() ? '' : os.tmpdir() ;

    private _values:TSDictionary = {} ;
    private _localizations:StringTranslations = {} ;
    private _countriesMap:Map<string, country> ;
    private _languagesMap:Map<string, language> ;
    private _currenciesMap:Map<string, currency> ;
    private _managedLocalesMap:Map<string, Locales> ;
    private _managedLanguages:language[] ;

    private constructor() {        
        this._countriesMap = new Map<string,country>() ;
        Object.keys(Countries).forEach(e => this._countriesMap.set(e, e as country)) ;
        this._languagesMap = new Map<string,language>() ;
        Object.keys(Languages).forEach(e => this._languagesMap.set(e, e as language)) ;
        this._currenciesMap = new Map<string,currency>() ;
        Object.keys(Currencies).forEach(e => this._currenciesMap.set(e, e as currency)) ;
        this._managedLanguages = TSDefaults.__locales.map(loc => loc.language) ;

        let managedLocales = new Map<string, Locales>() ;
        TSDefaults.__locales.forEach ( loc => {
            managedLocales.set(loc.language, loc) ;
            this._managedLanguages.forEach(l => managedLocales.set($ascii(loc.names[l]!.toLowerCase()), loc)) ;
        }) ;
        
        this._managedLocalesMap = managedLocales ;
        const cmap = TSCountry.loadCountries(managedLocales, this._managedLanguages) ;
        const c = cmap.get(Countries.FR) ;
        if (!$ok(c)) { 
            throw new TSError(`Did not find country '${Countries.FR}' to be the default`) ;
        }
        this._defaultCountry = c!
        this._defaultCurrency = c!.currency ;
        this._defaultLanguage = c!.locales.language ;
	}
    
    public managedLanguages() : language[] { return [... this._managedLanguages] ; } // send a copy
    public managedLanguage(s?:Nullable<string>) : language | null {
        if (!$ok(s)) { return this.defaultLanguage ;}
        const v = $ascii($ftrim(s).toLowerCase()) ;
        const locales = this._managedLocalesMap.get(v) ;
        if ($ok(locales)) { return locales!.language ; }
        return null ;
    }

    public continentName(cont:Nullable<continent>, lang?:Nullable<language>) : string | null {
        if (!$ok(cont)) { return null ; }
        const locales = this._managedLocalesMap.get($value(lang, this.defaultLanguage)) ;
        return $valueornull(locales?.continentNames[cont!]) ;
    }

    public country(s:Nullable<string>) : country | null {
        if ($ok(s) && !$isstring(s)) { return null ; }
        const v = $ascii($ftrim(s).toUpperCase()) ;
        const managedCountry = TSCountry.country(v) ;
        if ($ok(managedCountry)) { return managedCountry!.alpha2Code ; }
        return $valueornull(this._countriesMap.get(v)) ;
    }

    public language(s?:Nullable<TSCountry|string>) : language | null {
        if (!$ok(s)) { return this.defaultLanguage ;}
        if (s instanceof TSCountry) { return (s as TSCountry).language ; }
        const v = $ascii($ftrim(s).toLowerCase()) ;
        const locales = this._managedLocalesMap.get(v) ;
        if ($ok(locales)) { return locales!.language ; }
        return $valueornull(this._languagesMap.get(v)) ;
    }

    public currency(s?:Nullable<TSCountry|string>) : currency | null {
        if (!$ok(s)) { return this.defaultCurrency ;}
        if (s instanceof TSCountry) { return (s as TSCountry).currency ; }
        s = $ascii($ftrim(s).toUpperCase()) ;
        const c = TSCountry.country(s) ;
        if ($ok(c)) { return c!.currency ; }
        return $valueornull(this._currenciesMap.get(s)) ;
    }

    public addLocalizations(lang:language, loc:StringDictionary) {
        if (!this._managedLocalesMap.get(lang)) {
            throw new TSError(`Impossible to add localizations to non managed language '${lang}'`, { language:lang, localizations:loc }) ;
        }
        else if (!$isobject(loc)) {
            throw new TSError(`Impossible to add non string-dictionary localization to language '${lang}'`, { language:lang, localizations:loc }) ;
        }
        let actualLocalization = this._localizations[lang] ;
        if (!$ok(actualLocalization)) { this._localizations[lang] = {...loc} ; }
        else { this._localizations[lang] = {...actualLocalization, ...loc} ; }    
    }
    
    public localizations(locale:Nullable<language|country|TSCountry|string>) : StringDictionary {
        if (locale instanceof TSCountry) {
            return this._localizations[locale.language!] || {} ;
        }
        locale = $ftrim(locale) ;
        if (locale.length) {
            const lang = this.language(locale as string) ;
            if ($ok(lang)) { return this._localizations[lang!] || {} ; }

            // here we may have a country
            const c = TSCountry.country(locale) ;
            if ($ok(c)) {
                return this._localizations[c!.language] || {} ;
            }
        }
        return {}
    }

    public locales(locale?:Nullable<language|country|TSCountry|string>):Locales {
        if (locale instanceof TSCountry) { return locale.locales ; }
        locale = $ascii($ftrim(locale)) ;
        if (locale.length) {
            const locales = this._managedLocalesMap.get((locale as string).toLowerCase()) ;
            if ($ok(locales)) { return locales! ; }

            // here we may have a country
            const c = TSCountry.country(locale) ;
            if ($ok(c)) { return c!.locales ; }
        }
        return this._managedLocalesMap.get(this.defaultLanguage)! ;
    }
	
    public get defaultCountry() { return this._defaultCountry ; }
    
    // warning: setDefaultCountry DOES NOT CHANGE the default language NOR the default currency
    public setDefaultCountry(c:TSCountry):TSCountry {
        if ($ok(c)) { this._defaultCountry = c ; }
        return this._defaultCountry ;
    }
    
    public get defaultLanguage() { return this._defaultLanguage ; }
    public setDefaultLanguage(l:language):language {
        if ($ok(this._managedLocalesMap.get(l))) {
            this._defaultLanguage = l ;
        }
        return this._defaultLanguage ;
    }

    public get defaultCurrency() { return this._defaultCurrency ; }
    public setDefaultCurrency(c:currency):currency {
        if ($ok(this._currenciesMap.get(c))) {
            this._defaultCurrency = c ;
        }
        return this._defaultCurrency ;
    }
    
    public get tmpDirectory() {
        TSError.assertNotInBrowser('TSDefaults.setTmpDirectory') ;
        return this._tmpDirectory ;
    }
    public setTmpDirectory(path:string) {
        TSError.assertNotInBrowser('TSDefaults.setTmpDirectory') ;
        if (!$isdirectory(path)) {
            throw new TSError('TSDefaults.setTmpDirectory(): bad path parameter', { path: path }) ;
        }    
        this._tmpDirectory = path ;
    }

    // these 3 methods permits using software to store global values on unique Defaults instance
    public setValue(key:string, value:any) {
        if ($length(key)) {
            if ($ok(value)) {
                this._values[key] = value ;
            }
            else if ($ok(this._values[key])) {
                delete this._values[key] ;
            }
        }
    }

    public getValue(key:string):any { 
        const v = this._values[key] ;
        if ($ok(v)) { return v }
        return !$inbrowser() && $isobject(process) && $isobject(process.env) ? process.env[key] : undefined ; 
    }

    public configure(path?:Nullable<string>, opts?:Nullable<DefaultsConfigurationOptions>) {
        TSError.assertNotInBrowser('TSDefaults.configure') ;
        if (!$isobject(process) || !$isobject(process!.env)) {
            throw new TSError('TSDefaults.configure(): process.env is not defined', { path:path, options:opts}) ;
        }
        const debug = !!opts?.debug ;
        path = $absolute($length(path) > 0 ? path! : '.env') ;
    
        const buffer = $readBuffer(path) ;
        if (!$ok(buffer)) { 
            if (debug) { $logterm(`&R&w TSDefaults.configure(): impossible to read environment file '${path}'  &0`) ; }
        }
        else if (!$ok($env(buffer, { merge:process.env as StringDictionary, ...opts }))) {
            if (debug) { $logterm(`&R&w TSDefaults.configure(): impossible to interpret environment file '${path}'  &0`) ; }
        }
    }

    public static defaults(): TSDefaults {
		if (!this.__instance) {
			this.__instance = new TSDefaults() ;
		}
		return this.__instance ;
	}

}

export function $tmp():string { return TSDefaults.defaults().tmpDirectory ; }
export function $locales(locale?:Nullable<language|country|TSCountry>):Locales { return TSDefaults.defaults().locales(locale) ; }
export function $country(s:Nullable<string>):country | null { return TSDefaults.defaults().country(s) ; }
export function $language(s?:Nullable<TSCountry|string>):language | null { return TSDefaults.defaults().language(s) ; }
export function $continentName(cont:Nullable<continent>, lang?:Nullable<language>): string | null { return TSDefaults.defaults().continentName(cont, lang) ; }
export function $currency(s?:Nullable<TSCountry|string>):currency | null { return TSDefaults.defaults().currency(s) ; }
export function $config(path?:Nullable<string>, opts?:Nullable<DefaultsConfigurationOptions>) { TSDefaults.defaults().configure(path, opts) ; }

// to get default language, tou call $language() with no parameters or TSDefaults.defaults().defaultLanguage 

// function to manage your own global defaults.
// warning: all of this defaults are stored in memory
export function $default(key:string):any { return TSDefaults.defaults().getValue(key) ; }
export function $setdefault(key:string, value:any=undefined) { TSDefaults.defaults().setValue(key, value) ; }
export function $removedefault(key:string) { TSDefaults.defaults().setValue(key, undefined) ; }
