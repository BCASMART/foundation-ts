import { language } from "./types";
/**
 * if you want to change the subfolders to be tested
 * you should use the static method setSubfolders() before
 * calling any functions using LocalDefaults
 */
export interface Translation {
    singular: string;
    plural: string;
    short: string;
    shorts: string;
}
export interface Translations {
    months: string[];
    shortMonths: string[];
    days: string[];
    shortDays: string[];
    startingWeekDay: number;
    day: Translation;
    week: Translation;
    month: Translation;
    year: Translation;
}
export declare type TranslationsDictionary = {
    [key in string]: Translations;
};
export declare class LocalDefaults {
    private static __instance;
    private static __subfolders;
    private static __translations;
    defaultPath: string;
    tmpDirectory: string;
    defaultLanguage: language;
    private _values;
    private constructor();
    translations(lang?: language | undefined | null): Translations;
    static setSubfolders(folders: string[]): void;
    setDefaultLanguage(l: language): language;
    setTmpDirectory(path: string): void;
    setValue(key: string, value: any): void;
    getValue(key: string): any;
    static defaults(): LocalDefaults;
}
export declare function $default(key: string): any;
export declare function $setdefault(key: string, value?: any): void;
export declare function $removedefault(key: string): void;
