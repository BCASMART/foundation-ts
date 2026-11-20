import { $count, $length, $ok, $value, $valueornull } from './commons';
import { $fpad3 } from './number';
import { $continentName, $language, Locales, TSDefaults } from './tsdefaults';
import { TSClone, TSLeafInspect, TSObject } from './tsobject';
import { Comparison, continent, Countries, country, currency, language, Languages, Nullable, Same, StringTranslation } from './types';
import countriesList from './countries.json'
import { $compare } from './compare';
import { $ascii, $ftrim } from './strings';
import { PhonePlan, PhonePlanInfo } from './tsphonenumber';
import { TSError } from './tserrors';

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
    private static __countriesAlpha2Map:Map<country, string> ;
    private static __countriesAlpha3Map:Map<string, country> ;
    private static __countriesNumericMap:Map<number, country> ;
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
        dateFormat:"%d/%m/%Y",
        dateTimeFormat:"%d/%m/%Y %H:%M:%S",
        datePartialTimeFormat:"%d/%m/%Y %H:%M",
        shortDateFormat:"%d/%m/%y",
        shortDateTimeFormat:"%d/%m/%y %H:%M:%S",
        shortDatePartialTimeFormat:"%d/%m/%y %H:%M",
        timeFormat:"%H:%M:%S",
        partialTimeFormat:"%H:%M",
        ampm: ['AM', 'PM'],
        continentNames:{ 'AF': 'Africa', 'AN': 'Antartica', 'AS': 'Asia', 'EU': 'Europe', 'NA': 'North America', 'OC': 'Oceania', 'SA': 'South America'},
        unitNames: { 
            byte:['Byte', 'Bytes', 'B'],
            second:['second', 'seconds', 's'], 
            minute:['minute', 'minutes', 'm'], 
            hour:['hour', 'hours', 'h'], 
            day:['day', 'days', 'd'], 
            month:['month', 'months'], 
            year:['year', 'years']
        }
    }
    public readonly continent:continent ;
    public readonly alpha2Code:country;
    public readonly alpha3Code:string;
    public readonly numericCode:number;
    public readonly names:StringTranslation;
    public readonly nativeLanguage:language ;
    public readonly spokenLanguages:language[];
    public readonly domains:string[];
    public readonly EEC:boolean;
    public readonly phonePlan:PhonePlan ;
    public readonly currency: currency;
    public readonly locales:Locales;
    
    private _vatValidator?:VATNumberValidator ;

    private _state?: country ;
    
    private constructor(info:CountryInfo, locales:Locales, nativeLanguage:Nullable<language>) {
        this.continent = info.continent ;
        this.alpha2Code = info.alpha2Code ;
        this.alpha3Code = info.alpha3Code ;
        this.numericCode = info.numericCode ;
        this.names = info.names ;
        this.domains = info.domains ;
        this.EEC = info.EEC ;
        this.spokenLanguages = info.spokenLanguages ;
        this.phonePlan = {
            dialCode:  info.phonePlan.dialCode,
            trunkCode: info.phonePlan.trunkCode,
            minDigits: info.phonePlan.minDigits,
            maxDigits: info.phonePlan.maxDigits,
            areaCodes: $value(info.phonePlan.areaCodes, []),
            dummies:   $value(info.phonePlan.dummies, []),
            format:    $value(info.phonePlan.format, "+(%d) %n"),
        } ;
        if ($ok(info.phonePlan.mobileRegex)) { this.phonePlan.mobileRegex = new RegExp(info.phonePlan.mobileRegex) ; }
        if ($ok(info.phonePlan.fixedLineRegex)) { this.phonePlan.fixedLineRegex = new RegExp(info.phonePlan.fixedLineRegex) ; }
        if ($ok(info.phonePlan.regex)) { this.phonePlan.regex = new RegExp(info.phonePlan.regex) ; }
        if (!$ok(this.phonePlan.mobileRegex) && !$ok(this.phonePlan.fixedLineRegex) && !$ok(this.phonePlan.regex)) { 
            TSError.throw(`"TSCountry.constructor: country ${this.alpha2Code} has no valid phone plan regex defined`) ;
        }
        this.currency = info.currency ;
        this.locales = $ok(info.specificLocales) ? {... locales, ...info.specificLocales!} : {... locales} ;
        this.nativeLanguage = $value(nativeLanguage, $count(this.spokenLanguages) > 0 ? this.spokenLanguages[0] : this.locales.language) ;
        this._state = info.state ;
        this._vatValidator = TSCountry.CountriesVATInfo[info.alpha2Code] ;
    }


    public static loadCountries(localesMap:Map<string, Locales>, managedLanguages:language[]):Map<string, TSCountry> {
        if (!$ok(TSCountry.__countriesMap)) {
            TSCountry.__countriesMap = new Map<string, TSCountry>() ;
            TSCountry.__countriesAlpha2Map = new Map<country, string>() ;
            TSCountry.__countriesAlpha3Map = new Map<string, country>() ;
            TSCountry.__countriesNumericMap = new Map<number, country>() ;
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
                TSCountry.__countriesAlpha3Map.set(c.alpha3Code, c.alpha2Code) ;
                TSCountry.__countriesAlpha2Map.set(c.alpha2Code, c.alpha3Code) ;
                if (c.numericCode >= 1) {
                    TSCountry.__countriesMap.set($fpad3(c.numericCode), c) ;
                    TSCountry.__countriesNumericMap.set(c.numericCode, c.alpha2Code) ;
                }

                managedLanguages.forEach(l => TSCountry.__countriesMap.set($ascii(c.names[l]!.toUpperCase()), c)) ;
                info.aliases?.forEach(a => TSCountry.__countriesMap.set($ascii(a.toUpperCase()), c))
            }) ;            
        }
        return TSCountry.__countriesMap ;
    }
    
    // the countries are loaded by TSDefaults: all the static accessors need them
    // (only country() and countries() used to load them, the other ones did throw before)
    private static _loaded():void
    { if (!$ok(TSCountry.__countriesMap)) { TSDefaults.defaults() ; /* this initializes everything */ } }

    public static countriesForDialCode(dc:Nullable<string>):TSCountry[] {
        TSCountry._loaded() ;
        const array = $ok(dc) ? TSCountry.__dialCodeMap.get(dc!) : undefined ;
        return $value(array, []) ;
    }

    public static country(c:Nullable<country|string|number>) : TSCountry | null {
        if (typeof c === 'number') { c = $fpad3(c) ; }
        c = $ftrim(c) ;
        if (c.length) {
            TSCountry._loaded() ;
            const ret = TSCountry.__countriesMap.get($ascii(c!.toUpperCase())) ;
            if ($ok(ret)) { return ret ; }
        }
        return null ;
    }
    
    public static alpha2CodeForAlpha3Code(c:Nullable<string>):country|null
    { TSCountry._loaded() ; return $length(c) === 3 ? $valueornull(TSCountry.__countriesAlpha3Map.get(c!)) : null ; }

    public static alpha3CodeForAlpha2Code(c:Nullable<country|string>):string|null
    { TSCountry._loaded() ; return $length(c) === 2 ? $valueornull(TSCountry.__countriesAlpha2Map.get(c as country)) : null ; }

    public static alpha2CodeForNumericCode(c:Nullable<number>):string|null
    { TSCountry._loaded() ; return $ok(c) && c! >= 1 ? $valueornull(TSCountry.__countriesNumericMap.get(c!)) : null ; }

    // This does not return all elements listed in Country enum. 
    // Only the managed countries as TSCountry
    public static alpha2Codes():country[] 
    { TSCountry._loaded() ; return Array.from(TSCountry.__countriesAlpha2Map.keys()) ; }

    // All alpha3 codes of known TSCountry objects
    public static alpha3Codes():string[] 
    { TSCountry._loaded() ; return Array.from(TSCountry.__countriesAlpha3Map.keys()) ; }

    public static numericCodes():number[] 
    { TSCountry._loaded() ; return Array.from(TSCountry.__countriesNumericMap.keys()) ; }

    public static countryForVATNumber(vatNumber:Nullable<string>): TSCountry | null {
        vatNumber = $ftrim(vatNumber).toUpperCase() ;
        if (vatNumber.length >= 3) {
            const vatCountry = TSCountry.country(vatNumber.slice(0,2)) ;
            if ($ok(vatCountry) && vatCountry.validateVATNumber(vatNumber) !== null) { return vatCountry ; }
        } 
        return null ;
    }

    public static countries(): TSCountry[] {
        TSCountry._loaded() ;
        return [... TSCountry.__countries] ;
    }

    public valueOf():number { return this.numericCode ; }

    public [Symbol.toPrimitive](hint: "number" | "string" | "default") {
        return hint === 'number' ? this.numericCode : this.alpha2Code ;
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

    public clone():this { return this ; } // no clone on immutable objects

    public translatedName(lang?:Nullable<language>):string | null {
        if (!$length(lang)) { return null ; }
        const ret =  this.names[lang!] ;
        return $length(ret) ? ret! : null ;
    }
    
    /**
     * This method returns:
     * - null if it's not a valid VAT number
     * - undefined if it has not be possible to check the VAT number
     * – a valid string which is the correct VAT number correctly formated
     */
    public validateVATNumber(vatNumber:Nullable<string>):Nullable<string> {
        vatNumber = $ftrim(vatNumber).toUpperCase() ;
        if (vatNumber.length < 3) { return null ; }
        return $ok(this._vatValidator) ? this._vatValidator!(vatNumber) : undefined ;
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
    // ============ Static VAT constants =============== 
    private static CountriesVATInfo:{ [key in Countries]?:VATNumberValidator } = {
        AT:(s:string) => { 
            const m = /^AT\s*U\s*(\d{8})$/.exec(s) ;
            return $count(m) === 2 ? `ATU${m![1]}` : null ;
        },
        BE:(s:string) => { 
            const m = /^BE\s*(0)?(\d{9})$/.exec(s) ;
            return $count(m) === 3 ? `BE0${m![2]}` : null ;
        },
        BG:(s:string) => {
            const m = /^BG\s*(\d{9,10})$/.exec(s) ;
            return $count(m) === 2 ? `BG${m![1]}` : null ;
        },
        HR:(s:string) => {
            const m = /^HR\s*(\d{11})$/.exec(s) ;
            return $count(m) === 2 ? `HR${m![1]}` : null ;
        },
        CY:(s:string) => {
            const m =/^CY\s*(\d{8})\s*([A-Z])$/.exec(s) ; 
            return $count(m) === 3 ? `CY${m![1]}${m![2]}` : null ;
        },
        CZ:(s:string) => {
            const m = /^CZ\s*(\d{8,10})$/.exec(s) ;
            return $count(m) === 2 ? `CZ${m![1]}` : null ;
        },
        DK:(s:string) => {
            const m = /^DK\s*(\d{8})$/.exec(s) ; 
            return $count(m) === 2 ? `DK${m![1]}` : null ;
        },
        EE:(s:string) => {
            const m = /^EE\s*(\d{9})$/.exec(s) ; 
            return $count(m) === 2 ? `EE${m![1]}` : null ;
        },
        FI:(s:string) => {
            const m = /^FI\s*(\d{8})$/.exec(s) ; 
            return $count(m) === 2 ? `FI${m![1]}` : null ;
        },
        FR:(s:string) => {
            const m = /^FR\s*([0-9A-Z]{2})\s*(\d{9})$/.exec(s) ;
            return $count(m) === 3 ? `FR${m![1]}${m![2]}` : null ;
        },
        DE:(s:string) => {
            const m = /^DE\s*(\d{9})$/.exec(s) ; 
            return $count(m) === 2 ? `DE${m![1]}` : null ;
        },
        GR:(s:string) => {
            const m = /^(EL|GR)\s*(\d{9})$/.exec(s) ; 
            return $count(m) === 3 ? `EL${m![2]}` : null ;
        },
        HU:(s:string) => {
            const m = /^HU\s*(\d{8})$/.exec(s) ; 
            return $count(m) === 2 ? `HU${m![1]}` : null ;
        },
        IE:(s:string) => {
            const m = /^IE\s*(\d{7})\s*([A-Z]{2})$/.exec(s) ; 
            return $count(m) === 3 ? `IE${m![1]}${m![2]}` : null ;
        },
        IT:(s:string) => {
            const m = /^IT\s*(\d{11})$/.exec(s) ;
            return $count(m) === 2 ? `IT${m![1]}` : null ;
        },
        LV:(s:string) => {
            const m = /^LV\s*(\d{11})$/.exec(s) ;
            return $count(m) === 2 ? `LV${m![1]}` : null ;
        },
        LT:(s:string) => {
            const m = /^LT\s*(\d{9}|\d{12})$/.exec(s) ; 
            return $count(m) === 2 ? `LT${m![1]}` : null ;
        },
        LU:(s:string) => {
            const m = /^LU\s*(\d{8})$/.exec(s) ; 
            return $count(m) === 2 ? `LU${m![1]}` : null ;
        },
        MT:(s:string) => {
            const m = /^MT\s*(\d{8})$/.exec(s) ; 
            return $count(m) === 2 ? `MT${m![1]}` : null ;
        },
        NL:(s:string) => {
            const m = /^NL\s*(\d{9})\s*B\s*(\d{2})$/.exec(s) ; 
            return $count(m) === 3 ? `NL${m![1]}B${m![2]}` : null ;
        },
        PL:(s:string) => {
            const m = /^PL\s*(\d{10})$/.exec(s) ; 
            return $count(m) === 2 ? `PL${m![1]}` : null ;
        },
        PT:(s:string) => {
            const m = /^PT\s*(\d{3})\s*(\d{3})\s*(\d{3})$/.exec(s) ; 
            return $count(m) === 4 ? `PT${m![1]}${m![2]}${m![3]}` : null ;
        },
        RO:(s:string) => {
            const m = /^RO\s*(\d{10})$/.exec(s) ; 
            return $count(m) === 2 ? `RO${m![1]}` : null ;
        },
        SK:(s:string) => {
            const m = /^SK\s*(\d{10})$/.exec(s) ; 
            return $count(m) === 2 ? `SK${m![1]}` : null ;
        },
        SI:(s:string) => {
            const m = /^SI\s*(\d{9})$/.exec(s) ; 
            return $count(m) === 2 ? `SI${m![1]}` : null ;
        },
        ES:(s:string) => {
            const m = /^ES\s*([0-9A-Z])\s*(\d{7})\s*([0-9A-Z])$/.exec(s) ; 
            return $count(m) === 4 ? `ES${m![1]}${m![2]}${m![3]}` : null ;
        },
        SE:(s:string) => {
            const m = /^SE\s*(\d{12})$/.exec(s) ; 
            return $count(m) === 2 ? `SE${m![1]}` : null ;
        }
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
    numericCode:number;
    phonePlan:PhonePlanInfo;
    state?:country;
    EEC:boolean;
    aliases?:string[];
    specificLocales?:Partial<Locales>;          // specific locales
    note?:string;                               // optional note about the country
}

type VATNumberValidator = (s:string) => string|null ;

