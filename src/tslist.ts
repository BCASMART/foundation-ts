import { $defined, $jsonobj, $length, $ok, $string } from "./commons";
import { $compare, $equal} from "./compare"
import { TSError } from "./tserrors";
import { TSFusionEnumeration } from "./tsfusionnode";
import { TSClone, TSCollection, TSObject } from "./tsobject";
import { Ascending, Comparison, Descending, Nullable, Same } from "./types";


// The list iterator inherits the global Iterator class where it exists (Node 22+, Chrome 122+, Firefox 131+,
// Safari 18.4+), so that the iterator helpers (map(), filter(), take(), toArray()...) are available as with a
// generator. Elsewhere, it inherits Object: there, generators have no iterator helpers either.
const TSListIteratorBase = (typeof Iterator === 'function' ? Iterator : Object) as unknown as new () => object ;

// Iterates the data of a list from its first node. It replaces a generator, being 1.5 to 3 times faster
// (except on very short lists with Safari). Like the generator, it reads the next node only when next() is
// called (so the list may be modified during the iteration with the same results), and return() and throw()
// close it.
class TSListIterator<T> extends TSListIteratorBase {
    private _node:TSListNode<T> | null = null ;
    private _started = false ;
    private _done = false ;

    public constructor(private readonly _first:TSListNode<T> | null) { super() ; }

    public next():IteratorResult<T, void> {
        if (this._done) { return { value:undefined, done:true } ; }
        this._node = this._started ? (this._node?.next ?? null) : this._first ;
        this._started = true ;
        if (!this._node) { return this._close(undefined) ; }
        return { value:this._node.data, done:false } ;
    }

    public return(value?:any):IteratorResult<T, any> { return this._close(value) ; }

    public throw(e?:any):IteratorResult<T, void> { this._close(undefined) ; throw e ; }

    public [Symbol.iterator]():this { return this ; }

    private _close(value:any):IteratorResult<T, any> {
        this._done = true ;
        this._node = null ;
        return { value:value, done:true } ;
    }
}

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
	public toArray():any[] { return [this.data] ; }
}

export interface TSListToStringOptions<T> {
	prefix?:string,
	separator?:string,
	suffix?:string,
	printer?:(data:T) => Nullable<string>
}

export class TSList<T> implements TSObject, TSCollection<T>, TSFusionEnumeration, TSClone<TSList<T>>, Iterable<T> {
    private static readonly __defaultTSListToStringOptions = { prefix:'(', separator:',', suffix:')'} ;
	private _f: TSListNode<T> | null = null ;
	private _l: TSListNode<T> | null = null ;
	private _n: number = 0 ;

	get length():number { return this._n ; }
	get count():number { return this._n ; }
	get first():TSListNode<T> | null { return this._f ;}
	get last():TSListNode<T> | null { return this._l ;}

    public constructor(list?:Iterable<T>) {
        if ($defined(list)) {
            for (let object of list) { this.add(object) ; }
        }
    }

	public insert(data:T, before?:TSListNode<T>):TSListNode<T> {
		const node = new TSListNode(data) ;
		if (!this._f) {
			if ($ok(before)) { 
                TSError.throw('TSList.insert(): Try to insert data before a suposely existing node in an empty list', { data:data, before:before }) ;
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
            TSError.throw('TSList.insert(): Try to insert data before a non existing node', { data:data, before:before }) ;
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

	// the list methods use loops: they used to be recursive, so that long lists (about 8000 nodes) overflowed the stack
	public forEach(callback: (data: T) => void) {
		for (let node = this._f ; node ; node = node.next) { callback(node.data) ; }
	}

    // returns a TSListIterator, which behaves like the generator used before (and is still declared as one)
    public [Symbol.iterator]():Generator<T, void, unknown>
    { return new TSListIterator<T>(this._f) as unknown as Generator<T, void, unknown> ; }

	public searchNode(callback: (node: TSListNode<T>) => boolean): TSListNode<T> | null {
		for (let node = this._f ; node ; node = node.next) { if (callback(node)) { return node ; } }
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
        if (a !== null) { return Descending ; }
        return b === null ? Same : Ascending ;
    }
	public toString(opts:TSListToStringOptions<T> = TSList.__defaultTSListToStringOptions):string {
		let s = $ok(opts.prefix) ? opts.prefix : '' ;
		if (!$ok(opts.printer)) opts.printer = d => (d as any).toString() ;

		const sepa = $length(opts.separator) > 0 ? opts.separator : undefined ;
		for (let node = this._f ; node ; node = node.next) {
			const element = opts.printer!(node.data) ;
			if ($ok(element)) { s = s + element ; }
			if (node.next !== null && sepa) { s = s + sepa ; }
		}
		if ($length(opts.suffix)) { s = s + opts.suffix ; }
		return s ;
	}

	public toJSON():any[] { return this.toArray(e => $jsonobj(e)) ; }

	public toArray(map?:(data:T) => Nullable<any>):T[] {
		let array:T[] = [] ;
		for (let node = this._f ; node ; node = node.next) {
			if (map) {
				const v = map(node.data) ;
				if ($ok(v)) { array.push(v) ; }
			}
			else { array.push(node.data) ; }
		}
		return array ;
	}

    // ============ TSFusionEnumeration conformance =============== 
    public fusionEnumeration(): any[] { return this.toArray() ; }

    // ============ TSCollection conformance =============== 
    public getItems():T[] { return this.toArray() ; }

}

export type TSListConstructor<T> = new (data: T) => TSList<T>;
