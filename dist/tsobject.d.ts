import { Comparison } from "./types";
export declare type Class<V> = {
    new (): V;
};
export interface TSObject<T> {
    isa: Class<T>;
    className: string;
    toString(): string;
    toJSON(): any;
    toArray(): any[];
    isEqual(other: any): boolean;
    compare(other: any): Comparison;
}
export declare class TSRootObject<T> implements TSObject<T> {
    get isa(): Class<T>;
    get className(): string;
    compare(other: any): Comparison;
    isEqual(other: any): boolean;
    toString(): string;
    toJSON(): any;
    toArray(): any[];
}
