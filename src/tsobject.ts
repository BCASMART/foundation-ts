import { URL } from "url";

import { Comparison, Same, Ascending, Descending } from "./types";
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

// ===== makes URL conforms to TSObject ===================================
declare module "url" {
    export interface URL extends TSObject {
        isEqual: (this:URL, other:any) => boolean ;    
        compare: (this:URL, other:any) => Comparison ;
        toArray: (this:URL) => any[] ;
    }
}

URL.prototype.isEqual = function isEqual(this:URL, other:any):boolean {
    return this === other || (other instanceof URL && this.href === other.href)
}

URL.prototype.compare = function compare(this:URL, other:any):Comparison {
    if (other === this) { return Same ; }
    if (!(other instanceof URL)) { return undefined ; }
    return this.href < other.href ? Ascending : ( this.href > other.href ? Descending : Same ) ;
}

URL.prototype.toArray = function toArray(this:URL):any[] { return [this] ; }

