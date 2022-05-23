import { $ascii, $isobject, $length, $ok, $trim } from "./commons";
import { AnyDictionary, Countries, country, Currencies, currency, language, Languages, StringDictionary, StringTranslation } from "./types";
import { $dir, $filename, $isdirectory } from "./fs";
import os from 'os'
import { TSCountry } from "./tscountry";
import localesList from './locales.json'
import { $inbrowser } from "./utils";

export interface Locales {
    names:StringTranslation;
    language: language,
    months:string[];
    shortMonths:string[];
    days:string[];
    shortDays:string[];
    startingWeekDay:number;
    dateTimeFormat:string;
    dateFormat:string;
    shortDateFormat:string;
    shortDateTimeFormat:string;
    timeFormat:string;
    partialTimeFormat:string;
    ampm:string[];
}

export type StringTranslations = { [key in Languages]?:StringDictionary } ;

export class TSDefaults {
	private static __instance: TSDefaults ;
	private static __subfolders:string[] = ['utils', 'tests', 'dist'] ;
    /**
     * LOCALES (mostly date/time locales) are set in 7 common EEC languages
     * - english (en)
     * - french (fr),
     * - spanish (es),
     * - german (de),
     * - italian (it)
     * - portuguese (pt)
     * - dutch (nl)
     * 
     * This default management system is primarely meant to be used with EEC
     * countries. So we have the 27 countries of the EEC here + some other
     * to complete the panel of the european nations.
     */
    private static __locales = localesList as Locales[] ;

	public defaultPath ;
    public tmpDirectory = $inbrowser() ? '' : os.tmpdir() ;
    public defaultLanguage:language = Languages.fr ;
    public defaultCurrency:currency = Currencies.EUR ;
    private _values:AnyDictionary = {} ;
    private _localizations:StringTranslations = {} ;
    private _countriesMap:Map<string, country> ;
    private _languagesMap:Map<string, language> ;
    private _currenciesMap:Map<string, currency> ;
    private _managedLocalesMap:Map<string, Locales> ;
    private _managedLanguages:language[] ;

    private constructor() {

        this.defaultPath = __dirname ;

        if (!$inbrowser()) {
            for (let sf in TSDefaults.__subfolders) {
                if ($filename(this.defaultPath) === sf) {
                    this.defaultPath = $dir(this.defaultPath) ;
                }
            }    
        }
        
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
        TSCountry.loadCountries(managedLocales, this._managedLanguages) ;
	}
    
    public managedLanguages() : language[] { return [... this._managedLanguages] ; } // send a copy
    public managedLanguage(s?:string|null|undefined) : language | null {
        if (!$ok(s)) { return this.defaultLanguage ;}
        const v = $ascii($trim(s).toLowerCase()) ;
        const locales = this._managedLocalesMap.get(v) ;
        if ($ok(locales)) { return locales!.language ; }
        return null ;
    }

    public country(s:string|null|undefined) : country | null {
        const v = $ascii($trim(s).toUpperCase()) ;
        const managedCountry = TSCountry.country(v) ;
        if ($ok(managedCountry)) { return managedCountry!.alpha2Code ; }
        const ret = this._countriesMap.get(v) ;
        return $ok(ret) ? ret! : null ;
    }

    public language(s?:TSCountry|string|null|undefined) : language | null {
        if (!$ok(s)) { return this.defaultLanguage ;}
        if (s instanceof TSCountry) { return (s as TSCountry).language ; }
        const v = $ascii($trim(s).toLowerCase()) ;
        const locales = this._managedLocalesMap.get(v) ;
        if ($ok(locales)) { return locales!.language ; }
        const ret = this._languagesMap.get(v) ;
        return $ok(ret) ? ret! : null ;
    }

    public currency(s?:TSCountry|string|null|undefined) : currency | null {
        if (!$ok(s)) { return this.defaultCurrency ;}
        if (s instanceof TSCountry) { return (s as TSCountry).currency ; }
        s = $ascii($trim(s).toUpperCase()) ;
        const c = TSCountry.country(s) ;
        if ($ok(c)) { return c!.currency ; }
        const ret = this._currenciesMap.get(s) ;
        return $ok(ret) ? ret! : null ;
    }

    public addLocalizations(lang:language, loc:StringDictionary) {
        if (!this._managedLocalesMap.get(lang)) {
            throw "Impossible to add localizations to a non managed language" ;
        }
        if (!$isobject(loc)) {
            throw "Needed to pass a StringDictionary as localization" ;
        }
        let actualLocalization = this._localizations[lang] ;
        if (!$ok(actualLocalization)) { this._localizations[lang] = {...loc} ; }
        else { this._localizations[lang] = {...actualLocalization, ...loc} ; }    
    }
    
    public localizations(locale:language|country|TSCountry|string|undefined|null) : StringDictionary {
        if (locale instanceof TSCountry) {
            return this._localizations[locale.language!] || {} ;
        }
        locale = $trim(locale) ;
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

    public locales(locale?:language|country|TSCountry|string|undefined|null):Locales {
        if (locale instanceof TSCountry) { return locale.locales ; }
        locale = $ascii($trim(locale)) ;
        if (locale.length) {
            const locales = this._managedLocalesMap.get((locale as string).toLowerCase()) ;
            if ($ok(locales)) { return locales! ; }

            // here we may have a country
            const c = TSCountry.country(locale) ;
            if ($ok(c)) { return c!.locales ; }
        }
        return this._managedLocalesMap.get(this.defaultLanguage)! ;
    }
	
	public static setSubfolders(folders:string[]) {
		this.__subfolders = folders ;
	}

    public setDefaultLanguage(l:language):language {
        if ($ok(this._managedLocalesMap.get(l))) {
            this.defaultLanguage = l ;
        }
        return this.defaultLanguage ;
    }

    public setDefaultCurrency(c:currency):currency {
        if ($ok(this._currenciesMap.get(c))) {
            this.defaultCurrency = c ;
        }
        return this.defaultCurrency ;
    }
    
    public setTmpDirectory(path:string) {
        if (!$inbrowser()) {
            if ($isdirectory(path)) {
                this.tmpDirectory = path ;
            }    
        }
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
    public getValue(key:string):any { return this._values[key] ; }

    public static defaults(): TSDefaults {
		if (!this.__instance) {
			this.__instance = new TSDefaults() ;
		}
		return this.__instance ;
	}
}
export function $localpath() { return TSDefaults.defaults().defaultPath; }
export function $tmp() { return TSDefaults.defaults().tmpDirectory ; }
export function $locales(locale?:language|country|TSCountry|undefined|null):Locales { return TSDefaults.defaults().locales(locale) ; }
export function $country(s:string|null|undefined) : country | null { return TSDefaults.defaults().country(s) ; }
export function $language(s?:TSCountry|string|null|undefined) : language | null { return TSDefaults.defaults().language(s) ; }
export function $currency(s?:TSCountry|string|null|undefined) : currency | null { return TSDefaults.defaults().currency(s) ; }

// to get default language, tou call $language() with no parameters or TSDefaults.defaults().defaultLanguage 

// function to manage your own global defaults.
// warning: all of this defaults are stored in memory
export function $default(key:string):any { return TSDefaults.defaults().getValue(key) ; }
export function $setdefault(key:string, value:any=undefined) { return TSDefaults.defaults().setValue(key, value) ; }
export function $removedefault(key:string) { return TSDefaults.defaults().setValue(key, undefined) ; }
