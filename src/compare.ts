import { $count, $isarray, $ismethod, $isstring, $ok } from "./commons";
import { TSDate } from "./tsdate";
import { Comparison, Same, Ascending, Descending, Nullable, Bytes} from "./types";

export function $numcompare(a:number, b:number):Comparison {
    if (isNaN(a) || isNaN(b)) { return undefined ; }
    return a === b ? Same : (a < b ? Ascending : Descending) ;
}

export function $datecompare(a:Nullable<number|string|Date|TSDate>, b:Nullable<number|string|Date|TSDate>) : Comparison 
{
    if (!$ok(a) || !$ok(b)) { return undefined ; }
	if (a === b) { return Same ; }

    if (a instanceof Date && b instanceof Date) { return $numcompare(a.getTime(), b.getTime()) ; }

    // TODO: do we need to make a direct numcompare on number args ?
    if (!(a instanceof TSDate)) { a = new TSDate(a as string /* correct cast should be number | string */) ;}
    if (!(b instanceof TSDate)) { b = new TSDate(b as string /* correct cast should be number | string  */) ;}
    return a.compare(b) ;
}


export function $bytescompare(a:Nullable<Bytes>, b:Nullable<Bytes>):Comparison {
    if (!$ok(a) || !$ok(b)) { return undefined ; }
	if (a === b) { return Same ; }
    const na = a!.length, nb = b!.length ;
    let i = 0 ;
    while (i < na && i < nb) {
        const c = $numcompare(a![i], b![i]) ;
        if (c !== Same) { return c ; }
        i++ ;
    }
    return na === nb ? Same : (i < na ? Descending : Ascending) ;
}

export function $compare(a:any, b:any):Comparison {

    if (!$ok(a) || !$ok(b)) { return undefined ; }
	if (a === b) { return Same ; }

    if (typeof a === 'number' && typeof b === 'number') { return $numcompare(a, b) ; }
    if ($isstring(a) && $isstring(b)) {
        return a > b ? Descending : (a < b ? Ascending : Same) ;
    }
	if ($isarray(a) && $isarray(b)) {
        const na = a.length, nb = b.length ;
        let i = 0 ;
        while (i < na && i < nb) {
            const c = $compare(a[i], b[i]) ;
            if (c !== Same) { return c ; }
            i++ ;
        }
        return na === nb ? Same : (i < na ? Descending : Ascending) ;
    }
	if ((a instanceof Date || a instanceof TSDate) && (b instanceof Date || b instanceof TSDate)) { return $datecompare(a, b) ; }
	if (a instanceof Buffer && b instanceof Buffer) { return Buffer.compare(a, b) as Comparison ; }
	if (a instanceof Uint8Array && b instanceof Uint8Array) { return $bytescompare(a, b) ; }
	if ((a instanceof ArrayBuffer || ArrayBuffer.isView(a)) && (b instanceof ArrayBuffer || ArrayBuffer.isView(b))) {
        return $bytescompare( new Uint8Array(a as ArrayBufferLike), new Uint8Array(b as ArrayBufferLike)) ;
    }

    return $ismethod(a, 'compare') ? a.compare(b) : undefined ;
}

export function $bytesequal(a:Nullable<Bytes>, b:Nullable<Bytes>):boolean {
	if (a === b) { return true ; }
	if (!$ok(a) || !$ok(b)) return false ;
    const n = a!.length ;
    if (n !== b!.length) return false ;
    for(let i = 0 ; i < n ; i++) { if (a![i] !== b![i]) return false ; }
    return true ;
}

export function $equal(a:any, b:any):boolean {
	if (a === b) { return true ; }
	if (typeof a === 'number' && typeof b === 'number') { return a === b ; } // in order to cover NaN inequality and infinity equality
	if (!$ok(a) || !$ok(b)) return false ;
	if ($isarray(a) && $isarray(b)) {
		const n = a.length ;
		if (n !== b.length) return false ;
		for(let i = 0 ; i < n ; i++) { if (!$equal(a[i], b[i])) return false ; }
		return true ;
	}
	if (a instanceof Date && b instanceof Date) { return a.getTime() === b.getTime() ; }
    if ((a instanceof Date || a instanceof TSDate) && (b instanceof Date || b instanceof TSDate)) { 
        if (a instanceof Date) { a = new TSDate(a) ; }
        if (b instanceof Date) { b = new TSDate(b) ; }
        return a.isEqual(b) ;
    }

    if ($ismethod(a, 'isEqual')) { return a.isEqual(b) ; }
    if ($ismethod(b, 'isEqual')) { return b.isEqual(a) ; }

	if (a instanceof Set && b instanceof Set) { return $setequal(a, b) ; }
	if (a instanceof Map && b instanceof Map) {
		const ak = a.keys() ;
		const bk = b.keys() ;
		const keys = a.size >= b.size ? ak : bk ;
		// we may have different expressed keys with undefined as value...
		// eg: MapA{a:1, b:undefined} equals MapB{a:1} since MapB.get('b') returns undefined 
		for (let k of keys) { if (!$equal(a.get(k), b.get(k))) return false ; }
		return true ;
	}
	if (a instanceof Buffer && b instanceof Buffer) { return Buffer.compare(a, b) === 0 ; }
	if (a instanceof Uint8Array && b instanceof Uint8Array) { return $bytesequal(a, b) ; }
	if ((a instanceof ArrayBuffer || ArrayBuffer.isView(a)) && (b instanceof ArrayBuffer || ArrayBuffer.isView(b))) {
        return $bytesequal(new Uint8Array(a as ArrayBufferLike), new Uint8Array(b as ArrayBufferLike)) ;
	}

	if (Object.getPrototypeOf(a) === Object.prototype && Object.getPrototypeOf(b) === Object.prototype) {
		const ak = Object.getOwnPropertyNames(a) ;
		const bk = Object.getOwnPropertyNames(a) ;
		const keys = ak.length >= bk.length ? ak : bk ;
		// we may have different expressed keys with undefined as value...
		// eg: {a:1, b:undefined} equals {a:1}
		for (let k of keys) { if (!$equal(a[k], b[k])) return false ; }
		return true ;
	}
	return false ; 
}

export function $setequal(sa:Nullable<Set<any>>, sb:Nullable<Set<any>>):boolean {
    if (sa === sb) { return true ; }
    return $ok(sa) && $ok(sb) && sa!.size === sb!.size && [...sa!.keys()].every(e => sb!.has(e)) ;
}

export function $unorderedEqual(sa:Nullable<any[]|Set<any>>, sb:Nullable<any[]|Set<any>>):boolean {
    if (sa === sb) { return true ; }
	if (!$ok(sa) || !$ok(sb)) { return false ; }

    let a:Set<any>|undefined = undefined ;
    let b:Set<any>|undefined = undefined ;
    let na = -1 ;
    let nb = -2 ;

    if ($isarray(sa)) { na = $count(sa as any[]) ; a = new Set<any>(sa as any[]) ; }
    else if (sa instanceof Set) { na = sa.size ; a = sa ; }
    if ($isarray(sb)) { nb = $count(sb as any[]) ; b = new Set(sb as any[]) ; }
    else if (sb instanceof Set) { nb = sb.size ; b = sb ; }
    
    return na === nb && $setequal(a, b) ;
}

// TODO: an epsilon equal or a near equal function
