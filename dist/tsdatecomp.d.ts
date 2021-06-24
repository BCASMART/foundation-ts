import { TSDate } from "./tsdate";
import { uint } from "./types";
export interface TimeComp {
    hour: uint;
    minute: uint;
    second: uint;
}
export interface TSDateComp extends TimeComp {
    year: uint;
    month: uint;
    day: uint;
    dayOfWeek?: uint;
}
export declare enum TSDateForm {
    Standard = 0,
    English = 1,
    Computer = 2,
    ISO8601 = 3
}
/**
 * If you call timecomponents() with no parameters, it
 * returns the components for the current local time.
 * This function can not have a string as parameter ;
 * in order to create components from string, you need
 * to user functions $parsetime()
 */
export declare function $timecomponents(source?: number | Date | TSDate | null | undefined): TimeComp;
/**
 * If you call components() with no parameters, it
 * returns the components for the current local date.
 * This function can not have a string as parameter ;
 * in order to create components from string, you need
 * to user functions $parsedate(), $parsedatetime() or $isostring2components()
 */
export declare function $components(source?: number | Date | TSDate | null | undefined): TSDateComp;
export declare function $componentsarevalid(comp: TSDateComp | null | undefined): boolean;
export declare function $componentshavetime(c: TSDateComp): boolean;
export declare function $parsetime(s: string | null | undefined): TimeComp | null;
/**
 * These 2 functions parse a date or a date time.
 * Dependending on which date-form you choose to parse the given string, you may ommit
 * the month or the year, the system will autocomplete the components itself ; you
 * also may enter the year with 2 or 4 digits and the system will try to interpret
 * all 2 digits years as years from the previous or the current century. The limit
 * for that is : all date that seems to be more than 20 years in the future will
 * be considered as a previous century year. Note that if you date is not complete
 * you won't be able to enter a time.
 *
 * If you want to create a TSDate from a parsed string, you don't need this
 * function. Simply call :
 *
 *   myDate = TSDate.fromString(myStringToParse [, dateForm]) ; // this does not throw but return can be null
 *
 * ==WARNING== dayOfWeek is not initialized after parsing.
 */
export declare function $parsedatetime(s: string | null | undefined, form?: TSDateForm): TSDateComp | null;
export declare function $parsedate(s: string | null | undefined, form?: TSDateForm): TSDateComp | null;
/**
 * This function parse an ISO8601 OR ISO3339 date string. In both case, you may
 * enter the year with 2 or 4 digits and the system will try to interpret
 * all 2 digits years as years from the previous or the current century. The limit
 * for that is : all date that seems to be more than 20 years in the future will
 * be considered as a previous century year. We also admin to have only day
 * dates which is normally impossible with ISO3339. On the contrary, we force the
 * use of the T or t separator between day & time which is not the case is 3339.
 * Finany and it is VERY IMPORTANT: since TSDate and TSDateComp deal with
 * local dates (dates with no time zone at all), the time zone information
 * MUST NOT BE PRESENT AT THE END OF THE PARSED STRING. In order to create a TSDate
 * from a string you don't need this function. You simply use :
 *
 *  date = new TSDate(anISODateString) ; // this throw an error if the parsed string is wrong
 *
 * But, as we know,  a lot of programmers use GMT dates has local dates (which
 * is wrong by the way), if you set the parameter acceptsGMT to true, you may have
 * 'z' or 'Z' or '+00' or '+0000' or '+00:00' at the end of your string (indicating
 * that it is a GMT string). You may notice that the current usage in this
 * kit never use it as such. If you want to create TSDates with GMT string dates
 * you need to use :
 *
 * 	date = TSDate.fromComponents(isostring2components(myGMTDateString, true)) ;
 *
 * ==WARNING== dayOfWeek is not initialized after parsing.
 */
export interface Iso8601ParseOptions {
    acceptsGMT?: boolean;
    noTime?: boolean;
}
export declare function $isostring2components(source: string | null | undefined, opts?: Iso8601ParseOptions): TSDateComp | null;
export declare function $components2timestamp(c: TSDateComp): number;
export declare function $components2date(c: TSDateComp): Date;
export declare function $components2string(c: TSDateComp, form?: TSDateForm): string;
