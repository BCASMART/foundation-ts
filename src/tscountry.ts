import { $count, $length, $ok, $value } from './commons';
import { $continentName, $language, Locales, TSDefaults } from './tsdefaults';
import { TSClone, TSLeafInspect, TSObject } from './tsobject';
import { Comparison, continent, country, currency, language, Languages, Nullable, Same, StringTranslation } from './types';
import countriesList from './countries.json'
import { $compare } from './compare';
import { $ascii, $ftrim } from './strings';
import { PhonePlan, PhonePlanInfo } from './tsphonenumber';

/**
 *  WARNING ABOUT countries.json
 *  - Ireland has no localeLanguage : our EULocale is used 
 *    instead en language to match a better date format conformance
 *  - There's no US country there since the managed countries are
 *    maint to be the european ones. It may evolve in time.
 *  - Vaticano coutry has the same dialing code than Italy even if +379 has 
 *    been associated to Vaticano (i.e: +379 is not in use)
 */


 const customInspectSymbol = Symbol.for('nodejs.util.inspect.custom') ;

export class TSCountry implements TSObject, TSLeafInspect, TSClone<TSCountry> {
    private static __countriesMap:Map<string, TSCountry> ;
    private static __countries:TSCountry[] ;
    private static __dialCodeMap:Map<string, Array<TSCountry>> ;
    private static __EULocale:Locales = {
        language:Languages.en,
        names: { fr: "anglais", en: "english", de: "englisch", it: "inglese", es: "inglés", pt: "inglês", nl:"Engels", el:"αγγλικά" },
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
        ampm: ['AM', 'PM'],
        continentNames:{ 'AF': 'Africa', 'AN': 'Antartica', 'AS': 'Asia', 'EU': 'Europe', 'NA': 'North America', 'OC': 'Oceania', 'SA': 'South America'}
    }
    public readonly continent:continent ;
    public readonly alpha2Code:country;
    public readonly alpha3Code:string;
    public readonly names:StringTranslation;
    public readonly nativeLanguage:language ;
    public readonly spokenLanguages:language[];
    public readonly domains:string[];
    public readonly EEC:boolean;
    public readonly phonePlan:PhonePlan ;
    public readonly currency: currency;
    public readonly locales:Locales;

    private _state?: country ;
    
    private constructor(info:CountryInfo, locales:Locales, nativeLanguage:Nullable<language>) {
        this.continent = info.continent ;
        this.alpha2Code = info.alpha2Code ;
        this.alpha3Code = info.alpha3Code ;
        this.names = info.names ;
        this.domains = info.domains ;
        this.EEC = info.EEC ;
        this.spokenLanguages = info.spokenLanguages ;
        this.phonePlan = { 
            minDigits:10,
            maxDigits:10,
            areaCodes:[],
            ... info.phonePlan
        } ;
        this.currency = info.currency ;
        this.locales = $ok(info.specificLocales) ? {... locales, ...info.specificLocales!} : {... locales} ;
        this.nativeLanguage = $value(nativeLanguage, $count(this.spokenLanguages) > 0 ? this.spokenLanguages[0] : this.locales.language) ;
        this._state = info.state ;
    }


    public static loadCountries(localesMap:Map<string, Locales>, managedLanguages:language[]):Map<string, TSCountry> {
        if (!$ok(TSCountry.__countriesMap)) {
            TSCountry.__countriesMap = new Map<string, TSCountry>() ;
            TSCountry.__dialCodeMap = new Map<string, Array<TSCountry>>() ;
            TSCountry.__countries = [] ;

            (countriesList as CountryInfo[]).forEach( info => {
                let loc = $ok(info.localeLanguage) ? localesMap.get(info.localeLanguage!) : TSCountry.__EULocale ;
                if (!$ok(loc)) { loc = TSCountry.__EULocale ; }
                const c = new TSCountry(info, loc!, info.localeLanguage) ;
                let codes = TSCountry.__dialCodeMap.get(c.phonePlan.dialCode) ;
                if (!$ok(codes)) { 
                    codes = new Array<TSCountry> ;
                    TSCountry.__dialCodeMap.set(c.phonePlan.dialCode, codes) ;
                }
                codes!.push(c) ;
                TSCountry.__countries.push(c) ;
                TSCountry.__countriesMap.set(c.alpha2Code, c).set(c.alpha3Code, c) ;
                managedLanguages.forEach(l => TSCountry.__countriesMap.set($ascii(c.names[l]!.toUpperCase()), c)) ;
                info.aliases?.forEach(a => TSCountry.__countriesMap.set($ascii(a.toUpperCase()), c))
            }) ;            
        }
        return TSCountry.__countriesMap ;
    }
    
    public static countriesForDialCode(dc:Nullable<string>):TSCountry[] {
        const array = $ok(dc) ? TSCountry.__dialCodeMap.get(dc!) : undefined ;
        return $value(array, []) ;
    }

    public static country(c:Nullable<country|string>) : TSCountry | null {
        c = $ftrim(c) ;
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

    public get label():string { return this.names[Languages.en]! ; }
    public get name():string { return this.names[$language()!]! ; }
    public get nativeName():string { return this.names[this.nativeLanguage]! }

    public get continentLabel():string { return $continentName(this.continent, Languages.en)! ; }
    public get continentName():string | null { return $continentName(this.continent) ;}
    public get nativeContinentName():string | null { return $continentName(this.continent, this.nativeLanguage) ; }

    public get language():language { return this.locales.language ; }
    public get languageName():string { return this.locales.names[$language()!]! ; }
    public get nativeLanguageName():string { return this.locales.names[this.nativeLanguage]! ; }

    // sovereign state can be different from the country itself. eg: Greenland's state is Denmark
    public get state():TSCountry { return $value(TSCountry.country(this._state), this) ; }

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
    // ============ TSLeafInspect conformance =============== 
    public leafInspect(): string { return `<${this.label.capitalize()} (${this.alpha2Code})>`; }

    // @ts-ignore
    [customInspectSymbol](depth:number, inspectOptions:any, inspect:any) {
        return this.leafInspect()
    }

}

interface CountryInfo {
    names:StringTranslation;
    localeLanguage?:language; // language used for the locales. if not set 
                              // we use a kind of standard "european-english" 
                              // locales
    spokenLanguages:language[];
    continent:continent;
    currency:currency;
    domains:string[];
    alpha2Code:country;
    alpha3Code:string;
    phonePlan:PhonePlanInfo;
    state?:country;
    EEC:boolean;
    aliases?:string[];
    specificLocales?:Partial<Locales>;          // specific locales
}

