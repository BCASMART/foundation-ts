import { $isarray, $isobject, $isstring, $ok } from "./commons";
import { TSDate } from "./tsdate";
import { Comparison, Same, Ascending, Descending} from "./types";

export function $numcompare(a:number, b:number):Comparison {
    if (isNaN(a) || isNaN(b)) { return undefined ; }
    if (a === b) { return Same ; }
    return a < b ? Ascending : Descending ;
}

export function $datecompare(
    a:number|string|Date|TSDate|null|undefined, 
    b:number|string|Date|TSDate|null|undefined) : Comparison 
{
    if (!$ok(a) || !$ok(b)) { return undefined ; }
	if (a === b) { return Same ; }

    /* TODO: WE SHOULD BE PERMITED NOT TO CAST a or b in new TSDate() */
    if (!(a instanceof TSDate)) { a = new TSDate(a as unknown as string /* this is wrong  */) ;}
    if (!(b instanceof TSDate)) { b = new TSDate(b as unknown as string /* this is wrong  */) ;}
    return a.compare(b) ;
}

export function $compare(a:any, b:any):Comparison {

    if (!$ok(a) || !$ok(b)) { return undefined ; }
	if (a === b) { return Same ; }

    if (typeof a === 'number' && typeof b === 'number') { return $numcompare(a, b) ; }
    if ($isstring(a) && $isstring(b)) {
        // before, we used Buffer.compare() to make bytes comparison
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
	if ((a instanceof ArrayBuffer || ArrayBuffer.isView(a)) && (b instanceof ArrayBuffer || ArrayBuffer.isView(b))) {
		a = new Uint8Array(a as ArrayBufferLike) ;
		b = new Uint8Array(b as ArrayBufferLike) ;
        const na = a.length, nb = b.length ;
        let i = 0 ;
        while (i < na && i < nb) {

            const c = $numcompare(a[i], b[i]) ;
            if (c !== Same) { return c ; }
            i++ ;
        }
        return na === nb ? Same : (i < na ? Descending : Ascending) ;
    }
    return $isobject(a) && ('compare' in a) ? a.compare(b) : undefined ; 
}

export function $equal(a:any, b:any) {
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
    
    if ($isobject(a) && ('isEqual' in a)) { return a.isEqual(b) ; }	
	if ($isobject(b) && ('isEqual' in b)) { return b.isEqual(a) ; }

	if (a instanceof Set && b instanceof Set) {
		return a.size === b.size && [...a.keys()].every(e => b.has(e)) ;
	}
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
	if ((a instanceof ArrayBuffer || ArrayBuffer.isView(a)) && (b instanceof ArrayBuffer || ArrayBuffer.isView(b))) {
		a = new Uint8Array(a as ArrayBufferLike) ;
		b = new Uint8Array(b as ArrayBufferLike) ;
		const n = a.length ;
		if (n !== b.length) return false ;
		for(let i = 0 ; i < n ; i++) { if (a[i] !== b[i]) return false ; }
		return true ;
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