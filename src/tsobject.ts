import { $isfunction, $isobject } from "./commons";
import { Comparison } from "./types";


export type TSConstructor<T = unknown> = new (...args: any[]) => T;

export interface TSObject {
	toString(): string ;
	toJSON(): any
	toArray(): any[] ;
	isEqual(other:any): boolean ;
    compare(other:any): Comparison ;
}

export interface TSCollection<T> {
    getItems: () => T[]
}

export function $iscollection(o:any) {
    return $isobject(o) && $isfunction(o.getItems) ; 
}

export interface TSClone<T> {
    clone(): T ;
}
