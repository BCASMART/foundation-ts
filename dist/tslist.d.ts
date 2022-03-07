import { Class, TSObject, TSRootObject } from "./tsobject";
import { Comparison } from "./types";
export declare class TSListNode<T> implements TSObject<TSListNode<T>> {
    data: T;
    next: TSListNode<T> | null;
    prev: TSListNode<T> | null;
    constructor(data: T);
    get isa(): Class<TSListNode<T>>;
    get className(): string;
    isEqual(other: any): boolean;
    compare(other: any): Comparison;
    toJSON(): any;
    toString(): string;
    toArray(): any[];
}
export interface TSListToStringOptions<T> {
    prefix?: string;
    separator?: string;
    suffix?: string;
    printer?: (data: T) => string | null | undefined;
}
export declare class TSList<T> extends TSRootObject<TSList<T>> {
    private _f;
    private _l;
    private _n;
    get length(): number;
    get count(): number;
    get first(): TSListNode<T> | null;
    get last(): TSListNode<T> | null;
    insert(data: T, before?: TSListNode<T>): TSListNode<T>;
    add(data: T): TSListNode<T>;
    removeNode(node: TSListNode<T>): void;
    clear(): void;
    forEach(callback: (data: T) => void): void;
    search(callback: (data: T) => boolean): TSListNode<T> | null;
    isEqual(other: any): boolean;
    compare(other: any): Comparison;
    toString(opts?: TSListToStringOptions<T>): string;
    toJSON(): any[];
    toArray(map?: (data: T) => any | null | undefined): T[];
}
