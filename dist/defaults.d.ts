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
    defaultLanguage: language;
    private constructor();
    translations(lang?: language | undefined | null): Translations;
    static setSubfolders(folders: string[]): void;
    setDefaultLanguage(l: language): language;
    static defaults(): LocalDefaults;
}
