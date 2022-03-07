import { Class, TSObject } from "./tsobject";
import { Comparison } from "./types";
/**
 * OK, right, JS Tupples are more flexible than a TSCouple
 * object but, you known, it's still impossible to check
 * if a variable is a tupple or not... so TSCouple is a class
 * and instanceof works.
 */
export declare class TSCouple<T, U> implements TSObject<TSCouple<T, U>> {
    first: T;
    second: U;
    constructor(first: T, second: U);
    get isa(): Class<TSCouple<T, U>>;
    get className(): string;
    isEqual(other: any): boolean;
    compare(other: any): Comparison;
    toString(): string;
    toJSON(): any;
    toArray(): any[];
}
