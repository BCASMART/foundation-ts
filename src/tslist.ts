import { $defined, $jsonobj, $length, $ok, $string } from "./commons";
import { $compare, $equal} from "./compare"
import { TSError } from "./tserrors";
import { TSFusionEnumeration } from "./tsfusionnode";
import { TSClone, TSCollection, TSObject } from "./tsobject";
import { Ascending, Comparison, Descending, Nullable, Same } from "./types";


export class TSListNode<T> implements TSObject {
	public next: TSListNode<T> | null = null;
	public prev: TSListNode<T> | null = null;

	constructor(public data: T) {}

	// ============ TSObject conformance =============== 
	public isEqual(other:any) : boolean { 
		return this === other || (other instanceof TSListNode && $equal(other.data, this.data)) ;
	}
    public compare(other:any) : Comparison {
        if (this === other) { return Same ; } 
        return (other instanceof TSListNode) ? $compare(this.data, other.data) : undefined ;
    }
	public toJSON():any { return $jsonobj(this.data) ; }
	public toString():string { return $string(this.data) ; }
	public toArray():any[] { return [this] ; }
}

export interface TSListToStringOptions<T> {
	prefix?:string,
	separator?:string,
	suffix?:string,
	printer?:(data:T) => Nullable<string>
}

export class TSList<T> implements TSObject, TSCollection<T>, TSFusionEnumeration, TSClone<TSList<T>>, Iterable<T> {
	private _f: TSListNode<T> | null = null ;
	private _l: TSListNode<T> | null = null ;
	private _n: number = 0 ;

	get length():number { return this._n ; }
	get count():number { return this._n ; }
	get first():TSListNode<T> | null { return this._f ;}
	get last():TSListNode<T> | null { return this._l ;}

    public constructor(list?:Iterable<T>) {
        if ($defined(list)) {
            for (let object of list!) { this.add(object) ; }
        }
    }

	public insert(data:T, before?:TSListNode<T>):TSListNode<T> {
		const node = new TSListNode(data) ;
		if (!this._f) {
			if ($ok(before)) { 
                throw new TSError('TSList.insert(): Try to insert data before a suposely existing node in an empty list', { data:data, before:before }) ;
            }
			this._f = this._l = node ;
			this._n = 1 ;
		}
		else if (!$ok(before) || before === this._f) {
			this._f.prev = node ;
			node.next = this._f ;
			this._f = node ;
			node.prev = null ;
			this._n ++ ;
		}
		else if (!$ok(this.searchNode((node: TSListNode<T>) => node === before))) {
            throw new TSError('TSList.insert(): Try to insert data before a non existing node', { data:data, before:before }) ;
        }
        else {
			const prev = before!.prev! ;
			prev.next = node ;
			node.prev = prev ;
			node.next = before! ;
			before!.prev = node ;
			this._n ++ ;
		}
		return node ;
	}

	public add(data:T):TSListNode<T> {
		if (!this._f) return this.insert(data) ;
		const node = new TSListNode(data) ;
		this._l!.next = node ;
		node.prev = this._l ;
		this._l = node ;
		this._n ++ ;
		return node ;
	}

	/* warning, we dont verify the node appartenance here */
	public removeNode(node:TSListNode<T>) {
		if (node === this._f) {
			this._f = node.next ;
			if (this._f) this._f.prev = null ;
			else this._l = null ;
		}
		else if (node === this._l) {
			this._l = node.prev ;
			if (this._l) this._l.next = null ;
			else this._f = null ; // should never occur
		}
		else {
			const previous = node.prev! ;
			const succ = node.next! ;
			previous.next = succ ;
			succ.prev = previous ;
		}
		this._n -- ;
		node.next = node.prev = null ; // remove useless pointers
	}

	public clear() {
		let l = this._f ;
		if (l != null) {
			while (l.next !== null) {
				l.prev = null ;
				l = l.next ;
				l.prev!.next = null ;
			}
			this._f = this._l = null ;
			this._n = 0 ;
		}
	}

	public forEach(callback: (data: T) => void) {
		if (this._f) {
			const traverseMe = (node:TSListNode<T>) => {
				callback(node.data) ;
				if (node.next) traverseMe(node.next) ;
			} ;
			traverseMe(this._f) ;
		}	
	}

    public [Symbol.iterator]() {
        let currentNode = this._f ;
        return { next: () => { 
            if (currentNode) { 
                const ret = { done:false, value:currentNode!.data } ;
                currentNode = currentNode!.next ;
                return ret ;
            }
            return { done:true, value:undefined as any } ;
        }} ;
    }

	public searchNode(callback: (node: TSListNode<T>) => boolean): TSListNode<T> | null {
		if (this._f) {
			const findMe = (node: TSListNode<T>): TSListNode<T> | null => {
				if (callback(node)) { return node ; }
				return node.next ? findMe(node.next) : null ;
			} ;
			return findMe(this._f) ;
		}
		return null ;
	}

    public search(callback: (data: T) => boolean): TSListNode<T> | null {
        return this.searchNode((node: TSListNode<T>) => callback(node.data)) ;
	}

	// ============ TSClone conformance =============== 
    public clone():TSList<T> { 
        let copy = new TSList<T>() ;
        let node = this._f ;
        while (node) { copy.add(node.data) ;  node = node.next ;}
        return copy ;
    }

    // ============ TSObject conformance =============== 
    public isEqual(other:any) : boolean { 
		if (this === other) { return true ; }
		if (!(other instanceof TSList) || this._n !== other.count) { return false ; }
		let a = this._f ;
		let b = (other as TSList<T>).first ;
		while (a !== null && b !== null) {
			if (!a.isEqual(b)) { return false ; }
			a = a.next ;
			b = b.next ;
		}
		return a === null && b === null ;
	}

    public compare(other:any) : Comparison {
		if (this === other) { return Same ; }
		if (!(other instanceof TSList)) { return undefined ; }
		let a = this._f ;
		let b = (other as TSList<T>).first ;
		while (a !== null && b !== null) {
            const c =  a.compare(b) ;
            if (c !== Same) { return c ; }
            a = a.next ;
            b = b.next ;
        }
        return a === null ? ( b === null ? Same : Ascending) : Descending ;
    }

	public toString(opts:TSListToStringOptions<T> = { prefix:'(', separator:',', suffix:')'}):string {
		let s = $ok(opts.prefix) ? opts.prefix as string : '' ;
		if (!$ok(opts.printer)) opts.printer = d => (d as any).toString() ;

		if (this._f) {
			const hasSepa = $length(opts.separator) > 0 ;
			const printMe = (node:TSListNode<T>) => {
				const element = opts.printer!(node.data) ;
				if ($ok(element)) { s = s + element ; }
				if (node.next !== null) {
					if (hasSepa) { s = s + opts.suffix ; }
					printMe(node.next) ;
				}
			} ;
			printMe(this._f) ;
		}
		if ($length(opts.suffix)) s = s + opts.suffix ;
		return s ;
	}

	public toJSON():any[] { return this.toArray(e => $jsonobj(e)) ; }

	public toArray(map?:(data:T) => Nullable<any>):T[] {
		let array:T[] = [] ;
		if (this._f) {
			const addMe = (node:TSListNode<T>) => {
				if (map) {
					const v = map(node.data) ;
					if ($ok(v)) array.push(v) ;
				}
				else array.push(node.data) ;
				if (node.next) addMe(node.next) ;
			} ;
			addMe(this._f) ;
		}
		return array ;
	}

    // ============ TSFusionEnumeration conformance =============== 
    public fusionEnumeration(): any[] { return this.toArray() ; }

    // ============ TSCollection conformance =============== 
    public getItems():T[] { return this.toArray() ; }

}

export interface TSListConstructor<T> {
    new (data: T): TSList<T>;
}
