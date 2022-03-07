import { $json, $jsonobj } from "./commons";
import { Comparison, Same } from "./types";

export type Class<V> = { new (): V }


export interface TSObject<T> {
	isa : Class<T> ;
	className: string ;
	toString(): string ;
	toJSON(): any
	toArray(): any[] ;
	isEqual(other:any): boolean ;
    compare(other:any): Comparison ;
}

export class TSRootObject<T> implements TSObject<T> {
	public get isa():Class<T> { return this.constructor as Class<T> ; }
	public get className():string { return this.constructor.name ; }
    public compare(other:any) : Comparison { return this.isEqual(other) ? Same : undefined ; }
	public isEqual(other:any) : boolean { return this === other ; }
	public toString():string { return $json(this) ; }
	public toJSON():any {
		const keys = Object.getOwnPropertyNames(this) ;
        let ret:any = {}
        for (let k of keys) {
            ret[k] = $jsonobj((this as any)[k]) ;
        }
		return ret ;
	}
	public toArray():any[] { return [this] ; }
}


