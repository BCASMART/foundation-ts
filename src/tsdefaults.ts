import { $isobject, $length, $ok } from "./commons";
import { AnyDictionary, language, Languages, StringDictionary, StringTranslation } from "./types";
import { $dir, $filename, $isdirectory } from "./utils_fs";
import os from 'os'
/**
 * if you want to change the subfolders to be tested
 * you should use the static method setSubfolders() before
 * calling any functions using TSDefaults 
 */
 
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
    private constructor() {
		this.defaultPath = __dirname ;
		for (let sf in TSDefaults.__subfolders) {
			if ($filename(this.defaultPath) === sf) {
				this.defaultPath = $dir(this.defaultPath) ;
			}
		}
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

