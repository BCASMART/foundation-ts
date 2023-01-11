import { Comparison } from "./types";
import { $ismethod } from "./commons";


export type TSConstructor<T = unknown> = new (...args: any[]) => T;

export interface TSObject {
	toString(): string ;
	toJSON(): any ;
	toArray(): any[] ;
	isEqual(other:any): boolean ;
    compare(other:any): Comparison ;
}

export interface TSCollection<T> {
    getItems: () => T[] ;
}

export function $iscollection(o:any) { return $ismethod(o, 'getItems') ; }

export interface TSClone<T> {
    clone(): T ;
}

export interface TSLeafInspect {
    leafInspect():string ;
}