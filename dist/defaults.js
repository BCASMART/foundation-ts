import { $ok } from "./commons";
import { $dir, $filename } from "./utils_fs";
export class LocalDefaults {
    constructor() {
        this.defaultLanguage = 'fr';
        this.defaultPath = __dirname;
        for (let sf in LocalDefaults.__subfolders) {
            if ($filename(this.defaultPath) === sf) {
                this.defaultPath = $dir(this.defaultPath);
            }
        }
    }
    translations(lang) {
        if (!$ok(lang) || !$ok(LocalDefaults.__translations[lang])) {
            lang = this.defaultLanguage;
        }
        return LocalDefaults.__translations[lang];
    }
    static setSubfolders(folders) {
        this.__subfolders = folders;
    }
    setDefaultLanguage(l) {
        if ($ok(LocalDefaults.__translations[l])) {
            this.defaultLanguage = l;
        }
        return this.defaultLanguage;
    }
    static defaults() {
        if (!this.__instance) {
            this.__instance = new LocalDefaults();
        }
        return this.__instance;
    }
}
LocalDefaults.__subfolders = ['utils', 'tests', 'dist'];
LocalDefaults.__translations = {
    'de': {
        months: ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
        shortMonths: ["Jan", "Feb", "Mrz", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"],
        days: ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"],
        shortDays: ["Son", "Mon", "Die", "Mit", "Don", "Fre", "Sam"],
        startingWeekDay: 1,
        day: { singular: 'Tag', plural: 'Tagen', short: 'Tag', shorts: 'Tag.' },
        week: { singular: 'Woche', plural: 'Wochen', short: 'Wo.', shorts: 'Wo.' },
        month: { singular: 'Monat', plural: 'Monaten', short: 'Mo.', shorts: 'Mo.' },
        year: { singular: 'Jahr', plural: 'Jahren', short: 'Jahr', shorts: 'Jahr.' }
    },
    'fr': {
        months: ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"],
        shortMonths: ["Jan.", "Fév.", "Mars", "Avr.", "Mai", "Juin", "Juil.", "Août", "Sept.", "Oct.", "Nov.", "Déc."],
        days: ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"],
        shortDays: ["Dim", "Lun", "Mar", "Mer", "Jen", "Ven", "Sam"],
        startingWeekDay: 1,
        day: { singular: 'jour', plural: 'jours', short: 'j.', shorts: 'j.' },
        week: { singular: 'semaine', plural: 'semaines', short: 'sem.', shorts: 'sem.' },
        month: { singular: 'mois', plural: 'mois', short: 'mois', shorts: 'mois' },
        year: { singular: 'année', plural: 'années', short: 'an', shorts: 'ans' }
    },
    'en': {
        months: ["January", "February", "March", "April", "May", "June", "July", "August", "Septembre", "Octobre", "Novembre", "Decembre"],
        shortMonths: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        shortDays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        startingWeekDay: 0,
        day: { singular: 'day', plural: 'days', short: 'd.', shorts: 'd.' },
        week: { singular: 'week', plural: 'weeks', short: 'w.', shorts: 'w.' },
        month: { singular: 'month', plural: 'months', short: 'm.', shorts: 'ms' },
        year: { singular: 'year', plural: 'years', short: 'y.', shorts: 'y.' }
    }
};
//# sourceMappingURL=defaults.js.map