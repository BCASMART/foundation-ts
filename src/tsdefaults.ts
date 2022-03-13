import { $length, $ok } from "./commons";
import { AnyDictionary, language } from "./types";
import { $dir, $filename, $isdirectory } from "./utils_fs";
import os from 'os'
/**
 * if you want to change the subfolders to be tested
 * you should use the static method setSubfolders() before
 * calling any functions using TSDefaults 
 */
export interface Translation {
    singular:string;
    plural:string;
    short:string;
    shorts:string;
}
export interface Translations {
    months:string[];
    shortMonths:string[];
    days:string[];
    shortDays:string[];
    startingWeekDay:number;
    day:Translation;
    week:Translation;
    month:Translation;
    year:Translation;
}
export type TranslationsDictionary = { [key in string]:Translations }

export class TSDefaults {
	private static __instance: TSDefaults ;
	private static __subfolders:string[] = ['utils', 'tests', 'dist'] ;
    private static __translations:TranslationsDictionary = {
        'de': {
            months:["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
            shortMonths:["Jan", "Feb", "Mrz", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"],
            days:["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"],
            shortDays:["Son", "Mon", "Die", "Mit", "Don", "Fre", "Sam"],
            startingWeekDay:1,
            day:{singular:'Tag', plural:'Tagen', short:'Tag', shorts:'Tag.'},
            week:{singular:'Woche', plural:'Wochen', short:'Wo.', shorts:'Wo.'},
            month:{singular:'Monat', plural:'Monaten', short:'Mo.', shorts:'Mo.'},
            year:{singular:'Jahr', plural:'Jahren', short:'Jahr', shorts:'Jahr.'}    
        },
        'fr': {
            months:["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"],
            shortMonths:["Jan.", "Fév.", "Mars", "Avr.", "Mai", "Juin", "Juil.", "Août", "Sept.", "Oct.", "Nov.", "Déc."],
            days:["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"],
            shortDays:["Dim", "Lun", "Mar", "Mer", "Jen", "Ven", "Sam"],
            startingWeekDay:1,
            day:{singular:'jour', plural:'jours', short:'j.', shorts:'j.'},
            week:{singular:'semaine', plural:'semaines', short:'sem.', shorts:'sem.'},
            month:{singular:'mois', plural:'mois', short:'mois', shorts:'mois'},
            year:{singular:'année', plural:'années', short:'an', shorts:'ans'}
        },
        'en': {
            months:["January", "February", "March", "April", "May", "June", "July", "August", "Septembre", "Octobre", "Novembre", "Decembre"],
            shortMonths:["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
            days:["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
            shortDays:["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
            startingWeekDay:0,
            day:{singular:'day', plural:'days', short:'d.', shorts:'d.'},
            week:{singular:'week', plural:'weeks', short:'w.', shorts:'w.'},
            month:{singular:'month', plural:'months', short:'m.', shorts:'ms'},
            year:{singular:'year', plural:'years', short:'y.', shorts:'y.'}
        }
    } ;
	public defaultPath ;
    public tmpDirectory = os.tmpdir() ;
    public defaultLanguage:language = 'fr' ;
    private _values:AnyDictionary = {} ;

    private constructor() {
		this.defaultPath = __dirname ;
		for (let sf in TSDefaults.__subfolders) {
			if ($filename(this.defaultPath) === sf) {
				this.defaultPath = $dir(this.defaultPath) ;
			}
		}
	}

    public translations(lang?:language|undefined|null):Translations {
        if (!$ok(lang) || !$ok(TSDefaults.__translations[lang!])) { 
            lang = this.defaultLanguage ;
        }
        return TSDefaults.__translations[lang!] ;
    }
	
	public static setSubfolders(folders:string[]) {
		this.__subfolders = folders ;
	}

    public setDefaultLanguage(l:language):language {
        if ($ok(TSDefaults.__translations[l])) {
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

export function $default(key:string):any { return TSDefaults.defaults().getValue(key) ; }
export function $setdefault(key:string, value:any=undefined) { return TSDefaults.defaults().setValue(key, value) ; }
export function $removedefault(key:string) { return TSDefaults.defaults().setValue(key, undefined) ; }
