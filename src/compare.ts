import { $count, $defined, $isarray, $ismethod, $isstring, $ok, $string } from "./commons";
import { TSDate } from "./tsdate";
import { Comparison, Same, Ascending, Descending, Nullable, Bytes} from "./types";
import { $normspaces, $ascii } from "./strings";
import { TSError } from "./tserrors";

// ================== comparison functions =========================
export function $numcompare(a:number, b:number):Comparison {
    if (_isnan(a) || _isnan(b)) { return undefined ; }
    if (a === b) { return Same ; }
    return a < b ? Ascending : Descending ;
}

export function $numorder(a:number, b:number):NonNullable<Comparison> {
	if (a === b) { return Same ; }
    // we enforce a simple rule here. NaN is condidered as an undefined number
    // and we supose that we have no number here, just like undefined or null
    const na = _isnan(a), nb = _isnan(b) ;
    if (na && nb) { return Same ; }
    if (na) { return Ascending ; }
    if (nb) { return Descending ; }
    return a < b ? Ascending : Descending ;
}

export type DateCompareable = Nullable<number|string|Date|TSDate> ;

export function $datecompare(a:DateCompareable, b:DateCompareable) : Comparison 
{
    if (!$ok(a) || !$ok(b)) { return undefined ; }
	
    if (a === b) { return Same ; }
    if (typeof a === 'number' && typeof b === 'number') { return $numcompare(a, b) ; }
        
    if (a instanceof Date) { return _heterogenDateCompare(a, b!) ; }
    if (b instanceof Date) { return _inverseComparison(_heterogenDateCompare(b,a!)) ; }

    if ($isstring(a)) { a = new TSDate(a) ; }
    if (a instanceof TSDate) { return _heterogenTimestampCompare(a.timestamp, 0, b) ; }

    if ($isstring(b)) { b = new TSDate(b) ; }
    if (b instanceof TSDate) { return _inverseComparison(_heterogenTimestampCompare(b.timestamp, 0, a)) ; }

    return undefined ;
}

export function $arraycompare(a:Nullable<any[]>, b:Nullable<any[]>):Comparison {
    if (!$ok(a) || !$ok(b)) { return undefined ; }
    if (a === b) { return Same ; }
    const na = a!.length, nb = b!.length ;
    let i = 0 ;
    while (i < na && i < nb) {
        const c = $compare(a![i], b![i]) ;
        if (c !== Same) { return c ; }
        i++ ;
    }
    return $numcompare(na, nb) ; // same common part: the shortest is the smallest
}

export function $dateorder(a:DateCompareable, b:DateCompareable):NonNullable<Comparison>
{ return _okorder(a, b, $datecompare) ; }

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
    return $numcompare(na, nb) ; // same common part: the shortest is the smallest
}

export function $bytesorder(a:Nullable<Bytes>, b:Nullable<Bytes>):NonNullable<Comparison>
{ return _okorder(a, b, $bytescompare) ; }


// each entry is a type acceptor and the comparison function used when both values are accepted.
// The order of the entries matters: the first entry accepting both values wins
// (e.g. a Buffer is also an Uint8Array and must be tested before it)
type _TypedComparator = [accepts:(x:any) => boolean, compare:(a:any, b:any) => Comparison] ;

const _typedComparators:_TypedComparator[] = [
    [x => typeof x === 'number',                        $numcompare],
    [x => x instanceof URL,                             (a, b) => _strcompare(a.href, b.href)],
    [$isstring,                                         _strcompare],
    [x => x instanceof Date || x instanceof TSDate,     $datecompare],
    [x => x instanceof Buffer,                          (a, b) => Buffer.compare(a, b) as Comparison],
    [x => x instanceof Uint8Array,                      $bytescompare],
    [x => x instanceof ArrayBuffer || ArrayBuffer.isView(x), 
                                                        (a, b) => $bytescompare(new Uint8Array(a as ArrayBufferLike), new Uint8Array(b as ArrayBufferLike))],
] ;

export function $compare(a:any, b:any):Comparison {
    if (!$ok(a) || !$ok(b)) { return undefined ; }
    if (a === b) { return Same ; }

    for (const [accepts, compare] of _typedComparators) {
        if (accepts(a) && accepts(b)) { return compare(a, b) ; }
    }

    // Array, Set, Map are now conform to TSObject
    return $ismethod(a, 'compare') ? a.compare(b) : undefined ;
}

export function $order(a:any, b:any): NonNullable<Comparison>
{ 
	if (a === b) { return Same ; }
    if (typeof a === 'number' && typeof b === 'number') { return $numorder(a, b) ; }
    return _order(a, b, $compare) ; 
}

export function $visualcompare(a:any, b:any):Comparison {
    if (!$ok(a) || !$ok(b)) { return undefined ; }
	if (a === b) { return Same ; }
	if (a instanceof URL && b instanceof URL) { a = a.href ; b = b.href ; }

    if (!$isstring(a)) { a = $string(a) ; }
    if (!$isstring(b)) { b = $string(b) ; }
	if (a === b) { return Same ; }

    a = $ascii($normspaces(a)).toUpperCase() ;
    b = $ascii($normspaces(b)).toUpperCase() ;
    return _strcompare(a, b) ;
}

export function $visualorder(a:any, b:any):NonNullable<Comparison>
{ return a === b ? Same : _order(a, b, $visualcompare) ; }

// ================== equality functions =========================

export function $bytesequal(a:Nullable<Bytes>, b:Nullable<Bytes>):boolean {
	if (a === b) { return true ; }
	if (!$ok(a) || !$ok(b)) { return false ; }
    const n = a.length ;
    if (n !== b.length) { return false ; }
    for(let i = 0 ; i < n ; i++) { if (a[i] !== b[i]) return false ; }
    return true ;
}


export function $equal(a:any, b:any):boolean {
	if (a === b) { return true ; }
	if (typeof a === 'number' && typeof b === 'number') { return a === b ; } // in order to cover NaN inequality and infinity equality
	if (!$ok(a) || !$ok(b)) { return false ; }

    if (a instanceof URL && b instanceof URL) { return a.href === b.href ; }

    // Set, Map and Array are now conform to TSObject
    if ($ismethod(a, 'isEqual')) { return a.isEqual(b) ; }
    if ($ismethod(b, 'isEqual')) { return b.isEqual(a) ; }

	if (a instanceof Buffer && b instanceof Buffer) { return Buffer.compare(a, b) === 0 ; }
	if (a instanceof Uint8Array && b instanceof Uint8Array) { return $bytesequal(a, b) ; }
	if ((a instanceof ArrayBuffer || ArrayBuffer.isView(a)) && (b instanceof ArrayBuffer || ArrayBuffer.isView(b))) {
        return $bytesequal(new Uint8Array(a as ArrayBufferLike), new Uint8Array(b as ArrayBufferLike)) ;
	}
    return $objectsequal(a, b) ;
}

export function $objectsequal(a:Nullable<object>, b:Nullable<object>) {
	if (a === b) { return true ; }
	if (!$ok(a) || !$ok(b)) return false ;

	if (Object.getPrototypeOf(a) === Object.prototype && Object.getPrototypeOf(b) === Object.prototype) {
		const ak = Object.getOwnPropertyNames(a) ;
		const bk = Object.getOwnPropertyNames(b) ;
		const keys = ak.length >= bk.length ? ak : bk ;
		// we may have different expressed keys with undefined as value...
		// eg: {a:1, b:undefined} equals {a:1}
		for (let k of keys) { if (!$equal((a as any)[k], (b as any)[k])) return false ; }
		return true ;
    }
    return false ;
}

export function $arrayequal(a:Nullable<any[]>, b:Nullable<any[]>):boolean {
    if (a === b) { return true ; }
    if (!$ok(a) || !$ok(b)) { return false ; }
    const n = a!.length ;
    if (n !== b!.length) return false ;
    for(let i = 0 ; i < n ; i++) { if (!$equal(a![i], b![i])) return false ; }
    return true ;
}

export function $mapequal(a:Nullable<Map<any,any>>, b:Nullable<Map<any,any>>): boolean {
    if (a === b) { return true ; }
    if (!$ok(a) || !$ok(b)) { return false ; }
    const ak = a!.keys() ;
    const bk = b!.keys() ;
    // we may have different expressed keys with undefined as value...
    // eg: MapA{a:1, b:undefined} equals MapB{a:1} since MapB.get('b') returns undefined 
    const keys = a!.size >= b!.size ? ak : bk ;
    for (let k of keys) { if (!$equal(a!.get(k), b!.get(k))) return false ; }
    return true ;
}   

export function $setequal(sa:Nullable<Set<any>>, sb:Nullable<Set<any>>):boolean {
    if (sa === sb) { return true ; }
    return $ok(sa) && $ok(sb) && sa!.size === sb!.size && sa!.toArray().every(e => sb!.has(e)) ;
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

export function $visualequal(a:any, b:any):boolean {
    if (a === b) { return true ; }
    if (!$ok(a) || !$ok(b)) { return false ; }
    if (!$isstring(a)) { a = $string(a) ; }
    if (!$isstring(b)) { b = $string(b) ; }
    if (a === b) { return true ; }
	return $ascii($normspaces(a)).toUpperCase() === $ascii($normspaces(b)).toUpperCase() ;
}

// Why not implementing an epsilon equal or a near equal function

// ================= private functions
function _order(a:any, b:any, comparisonFn:(a:any,b:any)=>Comparison):NonNullable<Comparison> {
    if (!$ok(a)) { return $ok(b) ? Ascending : Same ; }
    else if (!$ok(b)) { return $ok(a) ? Descending : Same ; }
    else {
        const comp = comparisonFn(a,b) ;
        if (!$defined(comp)) {
            TSError.throw("Impossible to order elements A and B", { A:a, B:b }) ;
        }
        return comp! ;
    }
}

function _heterogenDateCompare(a:Date, b:Date|TSDate|string|number):Comparison {
    if (b instanceof Date) { return $numcompare(a.getTime(), b.getTime()) }
    return _heterogenTimestampCompare(a.timestamp, a.getMilliseconds(), b) ;
}

function _heterogenTimestampCompare(ats:number, mts:number, b:TSDate|string|number):Comparison {
    let ts = Number.NaN ;
    let ms = 0 ;
    if (b instanceof TSDate) { ts = b.timestamp ; }
    else if (typeof b === 'number') { ts = Math.trunc(b) ; ms = b - ts ; }
    else { ts = (new TSDate(b)).timestamp ; }

    const c = $numcompare(ats, ts) ;
    return c === Same ? $numcompare(mts, ms) : c ;
}


function _inverseComparison(c:Comparison):Comparison {
    if (c === Ascending) { return Descending ; }
    return c === Descending ? Ascending : c ;
}


function _isnan(x:any):boolean { return typeof x !== 'number' || Number.isNaN(x) ; }

function _strcompare(a:string, b:string):Comparison {
    if (a === b) { return Same ; }
    return a < b ? Ascending : Descending ;
}

// null or undefined values are ordered first, two missing values are the Same
function _okorder<T>(a:Nullable<T>, b:Nullable<T>, compare:(a:T, b:T) => Comparison):NonNullable<Comparison> {
    if ($ok(a) && $ok(b)) { return compare(a, b)! ; }
    if ($ok(a)) { return Descending ; }
    return $ok(b) ? Ascending : Same ;
}
