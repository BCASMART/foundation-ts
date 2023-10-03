import { $json, $jsonobj } from "./commons";
import { $equal, $compare } from "./compare";
import { TSClone, TSObject } from "./tsobject";
import { Comparison, Same } from "./types";

/**
 * OK, right, JS Tupples are more flexible than a TSCouple
 * object but, you known, it's still impossible to check
 * if a variable is a tupple or not... so TSCouple is a class
 * and instanceof works.
 */

export class TSCouple<T,U> implements TSObject, TSClone<TSCouple<T,U>> {
	constructor(public first:T, public second:U) {}
    public clone():TSCouple<T,U> { return new TSCouple(this.first, this.second) ; }

	// ============ TSObject conformance =============== 
	public isEqual(other:any) : boolean { 
		return this === other || (other instanceof TSCouple && $equal(other.first, this.first) && $equal(other.second, this.second)) ;
	}
    public compare(other:any) : Comparison {
        if (this.isEqual(other)) { return Same ; }
        else if (other instanceof TSCouple) {
            const c = $compare(this.first, other.first) ;
            return c === Same ? $compare(this.second, other.second) : c ;
        }
        return undefined ;
    }
	public toString():string { return $json(this) ; }
	public toJSON():any { return {first:$jsonobj(this.first), second:$jsonobj(this.second)} ; }
	public toArray():any[] { return [this.first, this.second] ; }
    
}

export interface TSCoupleConstructor<T,U> {
    new (first:T, second:U): TSCouple<T,U>;
}
