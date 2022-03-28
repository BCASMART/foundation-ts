import { language, Languages, StringTranslation } from "./types";
/**
 * if you want to change the subfolders to be tested
 * you should use the static method setSubfolders() before
 * calling any functions using TSDefaults
 */
export interface Locales {
    language: StringTranslation;
    months: string[];
    shortMonths: string[];
    days: string[];
    shortDays: string[];
    startingWeekDay: number;
    dateTimeFormat: string;
    dateFormat: string;
    shortDateFormat: string;
    shortDateTimeFormat: string;
    timeFormat: string;
    partialTimeFormat: string;
    ampm: string[];
}
export declare type LocalesDictionary = {
    [key in Languages]?: Locales;
};
export declare class TSDefaults {
    private static __instance;
    private static __subfolders;
    /**
     * LOCALES (mostly date/time locales) are set in 5 common world's languages
     * - english (en)
     * - french (fr),
     * - spanish (es),
     * - german (de),
     * - italian (it)
     */
    private static __locales;
    defaultPath: string;
    tmpDirectory: string;
    defaultLanguage: language;
    private _values;
    private constructor();
    locales(lang?: language | undefined | null): Locales;
    static setSubfolders(folders: string[]): void;
    setDefaultLanguage(l: language): language;
    setTmpDirectory(path: string): void;
    setValue(key: string, value: any): void;
    getValue(key: string): any;
    static defaults(): TSDefaults;
}
