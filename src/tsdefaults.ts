import { $isobject, $length, $ok, $trim } from "./commons";
import { AnyDictionary, Countries, country, language, Languages, StringDictionary, StringTranslation } from "./types";
import { $dir, $filename, $isdirectory } from "./fs";
import os from 'os'

export interface Locales {
    language:StringTranslation;
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

export type LocalesDictionary  = { [key in Languages]?:Locales }
export type StringTranslations = { [key in Languages]?:StringDictionary } ;
export class TSDefaults {
	private static __instance: TSDefaults ;
	private static __subfolders:string[] = ['utils', 'tests', 'dist'] ;

    /**
     * LOCALES (mostly date/time locales) are set in 6 common world's languages
     * - english (en)
     * - french (fr),
     * - spanish (es),
     * - german (de),
     * - italian (it)
     * - portuguese (pt)
     */
    private static __locales:LocalesDictionary = {
        en: {
            months:["January", "February", "March", "April", "May", "June", "July", "August", "Septembre", "Octobre", "Novembre", "Decembre"],
            shortMonths:["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
            days:["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
            shortDays:["Sun.", "Mon.", "Tue.", "Wed.", "Thu.", "Fri.", "Sat."],
            startingWeekDay:0,
            dateTimeFormat:"%m/%d/%Y %H:%M:%S",
            dateFormat:"%m/%d/%Y",
            shortDateFormat:"%m/%d/%y",
            shortDateTimeFormat:"%m/%d/%y %H:%M:%S",
            timeFormat:"%H:%M:%S",
            partialTimeFormat:"%H:%M",
            language: { fr: "anglais", en: "english", de: "englisch", it: "inglese", es: "inglés", pt: "inglês" },
            ampm: ['AM', 'PM']
        },
        fr: {
            months:["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"],
            shortMonths:["jan.", "fév.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."],
            days:["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"],
            shortDays:["Di", "Lu", "Ma", "Me", "Je", "Ve", "Sa"],
            startingWeekDay:1,
            dateTimeFormat:"%d/%m/%Y %H:%M:%S",
            dateFormat:"%d/%m/%Y",
            shortDateFormat:"%d/%m/%y",
            shortDateTimeFormat:"%d/%m/%y %H:%M:%S",
            timeFormat:"%H:%M:%S",
            partialTimeFormat:"%H:%M",
            language: { fr: "français", en: "french", de: "französisch", it: "francese", es: "francés", pt: "francês" },
            ampm: ['AM', 'PM']
        },
        es: {
            shortDays:["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"],
            days:["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"],
            shortMonths:["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"],
            months:["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"],
            shortDateFormat:"%d/%m/%y",
            dateFormat: "%d/%m/%Y",
            timeFormat:"%H:%M:%S",
            partialTimeFormat:"%H:%M",
            dateTimeFormat:"%d/%m/%Y %H:%M:%S",
            shortDateTimeFormat:"%d/%m/%y %H:%M:%S",
            startingWeekDay:1,
            language: { fr: "espagnol", en: "spanish", de: "spanisch", it: "spagnolo", es: "español", pt: "espanhol" },
            ampm: ['AM', 'PM']
        },
        de: {
            months:["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
            shortMonths:["Jan", "Feb", "Mrz", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"],
            days:["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"],
            shortDays:["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"],
            startingWeekDay:1,
            dateTimeFormat:"%%e.%m.%Y %H:%M:%S",
            dateFormat:"%e.%m.%Y",
            shortDateFormat:"%e.%m.%y",
            shortDateTimeFormat:"%%e.%m.%y %H:%M:%S",
            timeFormat:"%H:%M:%S",
            partialTimeFormat:"%H:%M",
            language: { fr: "allemand", en: "german", de: "deutsch", it: "tedesco", es: "alemán", pt: "alemão" },
            ampm: ['AM', 'PM']
        },
        it:{
            shortDays:["dom.", "lun.", "mar.", "mer.", "gio.", "ven.", "sab."],
            days:["domenica", "lunedi", "martedì", "mercoledì", "giovedi", "venerdì", "sabato"],
            shortMonths:["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"],
            months:["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"],
            shortDateFormat:"%d/%m/%y",
            dateFormat: "%d/%m/%Y",
            timeFormat:"%H:%M:%S",
            partialTimeFormat:"%H:%M",
            dateTimeFormat:"%d/%m/%Y %H:%M:%S",
            shortDateTimeFormat:"%d/%m/%y %H:%M:%S",
            startingWeekDay:1,
            language: { fr: "italien", en: "italian", de: "italienisch", it: "italiano", es: "italiano", pt: "italiano"},
            ampm: ['AM', 'PM']
        },
        pt: {
            shortDays:["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"],
            days:["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"],
            shortMonths:["Jan", "Fev",  "Mar", "Abr", "Mai", "Jun", "Jul", "Agos", "Set", "Out", "Nov", "Dez"],
            months:["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"],
            shortDateFormat:"%d-%m-%y",
            dateFormat: "%d-%m-%Y",
            timeFormat:"%H:%M:%S",
            partialTimeFormat:"%H:%M",
            dateTimeFormat:"%d-%m-%Y %H:%M:%S",
            shortDateTimeFormat:"%d-%m-%y %H:%M:%S",
            startingWeekDay:0,
            language: { fr: "portuguais", en: "portuguese", de: "portugiesisch", it: "portoghese", es: "portugués", pt: "portugueses" },
            ampm: ['AM', 'PM']
        },    
    } ;
	public defaultPath ;
    public tmpDirectory = os.tmpdir() ;
    public defaultLanguage:language = Languages.fr ;
    private _values:AnyDictionary = {} ;
    private _localizations:StringTranslations = {} ;
    private _countriesMap:Map<string, country> ;
    private _languagesMap:Map<string, language> ;

    private constructor() {
		this.defaultPath = __dirname ;
		for (let sf in TSDefaults.__subfolders) {
			if ($filename(this.defaultPath) === sf) {
				this.defaultPath = $dir(this.defaultPath) ;
			}
		}
        this._countriesMap = new Map<string,country>() ;
        Object.keys(Countries).forEach(e => this._countriesMap.set(e, e as country)) ;
        this._languagesMap = new Map<string,language>() ;
        Object.keys(Languages).forEach(e => this._languagesMap.set(e, e as language)) ;
	}

    public country(s:string|null|undefined) : country | null {
        const v = $trim(s) ; if (v.length !== 2) { return null ; }
        const ret = this._countriesMap.get(v.toUpperCase()) ;
        return $ok(ret) ? ret! : null ;
    }

    public language(s?:string|null|undefined) : language | null {
        if (!$ok(s)) { return this.defaultLanguage ;}
        const v = $trim(s) ; if (v.length !== 2) { return null ; }
        const ret = this._languagesMap.get(v.toLowerCase()) ;
        return $ok(ret) ? ret! : null ;
    }

    public addLocalizations(lang:language, loc:StringDictionary) {
        if ($isobject(loc)) {
            let actualLocalization = this._localizations[lang] ;
            if (!$ok(actualLocalization)) { this._localizations[lang] = actualLocalization ; }
            else {
                this._localizations[lang] = {...actualLocalization, ...loc} ;
            }    
        }
    }
    
    public localizations(lang?:language|undefined|null) : StringDictionary {
        let ret = this._localizations[lang||this.defaultLanguage] ;
        return ret || {}
    }

    public locales(lang?:language|undefined|null):Locales {
        if (!$ok(lang) || !$ok(TSDefaults.__locales[lang!])) { 
            lang = this.defaultLanguage ;
        }
        return TSDefaults.__locales[lang!]! ;
    }
	
	public static setSubfolders(folders:string[]) {
		this.__subfolders = folders ;
	}

    public setDefaultLanguage(l:language):language {
        if ($ok(TSDefaults.__locales[l])) {
            this.defaultLanguage = l ;
        }
        return this.defaultLanguage ;
    }
    
    public setTmpDirectory(path:string) {
        if ($isdirectory(path)) {
            this.tmpDirectory = path ;
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
export function $locales(lang?:language|undefined|null):Locales { return TSDefaults.defaults().locales(lang) ; }
export function $country(s:string|null|undefined) : country | null { return TSDefaults.defaults().country(s) ; }
export function $language(s?:string|null|undefined) : language | null { return TSDefaults.defaults().language(s) ; }
// to get default language, tou call $language() with no parameters or TSDefaults.defaults().defaultLanguage 

// function to manage your own global defaults.
// warning: all of this defaults are stored in memory
export function $default(key:string):any { return TSDefaults.defaults().getValue(key) ; }
export function $setdefault(key:string, value:any=undefined) { return TSDefaults.defaults().setValue(key, value) ; }
export function $removedefault(key:string) { return TSDefaults.defaults().setValue(key, undefined) ; }
