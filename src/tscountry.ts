import { $ascii, $length, $ok, $trim } from './commons';
import { $language, Locales, TSDefaults } from './tsdefaults';
import { TSClone, TSObject } from './tsobject';
import { Comparison, country, currency, language, Languages, Nullable, Same, StringTranslation } from './types';
import countriesList from './countries.json'
import { $compare } from './compare';
/**
 *  WARNING ABOUT countries.json
 *  - Ireland has no localeLanguage : our EULocale is used 
 *    instead en language to match a better date format conformance
 *  - There's no US country there since the managed countries are
 *    maint to be the european ones. It may evolve in time.
 */


export class TSCountry implements TSObject, TSClone<TSCountry> {
    private static __countriesMap:Map<string, TSCountry> ;
    private static __countries:TSCountry[] ;
    private static __EULocale:Locales = {
        language:Languages.en,
        names: { fr: "anglais", en: "english", de: "englisch", it: "inglese", es: "inglés", pt: "inglês", nl:"Engels" },
        months:["January", "February", "March", "April", "May", "June", "July", "August", "Septembre", "Octobre", "Novembre", "Decembre"],
        shortMonths:["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        days:["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        shortDays:["Sun.", "Mon.", "Tue.", "Wed.", "Thu.", "Fri.", "Sat."],
        startingWeekDay:1,
        dateTimeFormat:"%d/%m/%Y %H:%M:%S",
        dateFormat:"%d/%m/%Y",
        shortDateFormat:"%d/%m/%y",
        shortDateTimeFormat:"%d/%m/%y %H:%M:%S",
        timeFormat:"%H:%M:%S",
        partialTimeFormat:"%H:%M",
        ampm: ['AM', 'PM']
    }

    public readonly alpha2Code:country;
    public readonly alpha3Code:string;
    public readonly names:StringTranslation;
    public readonly spokenLanguages:language[];
    public readonly domains:string[];
    public readonly EEC:boolean;
    public readonly dialCode: string;
    public readonly currency: currency;
    public readonly locales:Locales;
    
    private constructor(infos:CountryInfos, locales:Locales) {
        this.alpha2Code = infos.alpha2Code ;
        this.alpha3Code = infos.alpha3Code ;
        this.names = infos.names ;
        this.domains = infos.domains ;
        this.EEC = infos.EEC ;
        this.spokenLanguages = infos.spokenLanguages ;
        this.dialCode = infos.dialCode ;
        this.currency = infos.currency ;
        this.locales = {... locales} ; // we take a copy here
    }

    public static loadCountries(localesMap:Map<string, Locales>, managedLanguages:language[]) {
        if (!$ok(TSCountry.__countriesMap)) {
            TSCountry.__countriesMap = new Map<string, TSCountry>() ;
            TSCountry.__countries = [] ;
            (countriesList as CountryInfos[]).forEach( infos => {
                let loc = $ok(infos.localeLanguage) ? localesMap.get(infos.localeLanguage!) : TSCountry.__EULocale ;
                if (!$ok(loc)) { loc = TSCountry.__EULocale ; }
                const c = new TSCountry(infos, loc!) ;
                c.locales.startingWeekDay = infos.startingWeekDay ;
                TSCountry.__countries.push(c) ;
                TSCountry.__countriesMap.set(c.alpha2Code, c).set(c.alpha3Code, c) ;
                managedLanguages.forEach(l => TSCountry.__countriesMap.set($ascii(c.names[l]!.toUpperCase()), c)) ;
                infos.aliases?.forEach(a => TSCountry.__countriesMap.set($ascii(a.toUpperCase()), c))
            }) ;
        }
    }

    public static country(c:Nullable<country|string>) : TSCountry | null {
        c = $trim(c) ;
        if (c.length) {
            if (!$ok(TSCountry.__countriesMap)) { TSDefaults.defaults() ; /* this initializes everything */ }
            const ret = TSCountry.__countriesMap.get($ascii(c!.toUpperCase())) ;
            if ($ok(ret)) { return ret! ; }
        }
        return null ;
    }

    public static countries(): TSCountry[] {
        if (!$ok(TSCountry.__countriesMap)) { TSDefaults.defaults() ; /* this initializes everything */ }
        return [... TSCountry.__countries] ;
    }

    // WARNING: we return the name in the current language
    public get name():string { return this.names[$language()!]! ; }

    // WARNING: this is not the spoken language, but the language we use
    // as locales for this country. Idem for the language name.
    public get language():language { return this.locales.language ; }
    public get languageName():string { return this.locales.names[$language()!]! ; }

    public clone():TSCountry { return this ; } // no clone on immutable objects

    public translatedName(lang?:Nullable<language>):string | null {
        const ret =  this.names[$ok(lang) ? lang! : $language()!] ;
        return $length(ret) ? ret! : null ;
    }

    public toString():string { return this.alpha2Code ; }
    public toJSON():any { return this.alpha2Code ; }
	public toArray(): string[] { return [this.alpha2Code, this.alpha3Code] ;}
	public isEqual(other:any): boolean { return this === other ; }
    public compare(other:any): Comparison {
        if (this === other) { return Same ;}
        if (other instanceof TSCountry) { return $compare(this.alpha2Code, other.alpha2Code) ; }
        return undefined ;
    }

}

interface CountryInfos {
    names:StringTranslation;
    localeLanguage?:language; // language used for the locale. if not set 
                              // we use a kind of standard "european-english" 
                              // locale
    spokenLanguages:language[];
    currency:currency;
    domains:string[];
    alpha2Code:country;
    alpha3Code:string;
    EEC:boolean;
    dialCode:string;
    startingWeekDay:number;
    aliases?:string[];
    locale?:Locales;          // used locale is calculated just once and stored here
}
