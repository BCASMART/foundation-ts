import { $isarray, $issafekey, $isstring, $ok } from "./commons";
import { TSRange } from "./tsrange";
import { TSRangeSet } from "./tsrangeset";
import { TSInterval } from "./tsinterval";
import { Ascending, Descending, Nullable, Same, TSDictionary } from "./types";
import { $compare, $equal } from "./compare";
import { $iscollection, TSCollection } from "./tsobject";
import { TSError } from "./tserrors";
import { $declareMethods } from "./object";


export type QualifierOperator  =  'AND' | 'OR' | 'NOT' | 'EQ' | 'NEQ' | 'LT' | 'LTE' | 'GT' | 'GTE' | 'LIKE' | 'IN' | 'NIN' | 'OK' | 'KO' ;
export type QualifierOperand   =  any ; // NOSONAR: I want to keep this type since its more readable
export type QualifierCondition<T>   =  TSDictionary | TSQualifier<T> ;


/** @deprecated only used by the deprecated INCLUDED() and INTERSECTS() qualifiers */
export const LAZY_INTERSECTION = false ;

/**
 * The intervals accepted by INRANGE(), CONTINUOUS(), OVERLAPS(), CONTAINS() and CONTAINEDIN():
 * a TSRange (or its [location, length] array), a TSInterval (a null bound is infinite) or a
 * TSRangeSet (one condition for each of its ranges). Like TSRange, intervals are half-open [start, end[.
 */
export type QualifierInterval = TSRange | number[] | TSInterval | TSRangeSet ;

export type TSQualifierCollection<T> = ArrayLike<T> | Set<T> | TSCollection<T>


export type RecursiveKeyPath<T, K extends keyof T> =
  K extends string
  ? T[K] extends Record<string, any>
    ? T[K] extends TSQualifierCollection<infer U>
      ? K | `${K}.${RecursiveKeyPath<Required<U>, keyof Required<U>>}`
      : K | `${K}.${RecursiveKeyPath<Required<T[K]>, keyof Required<T[K]>>}`
    : K
  : never ;


/**
 *
 * we use to have a make all keys as KeyPath<T> in order 
 * to check the qualifier keys but it makes a lots of error 
 * in using this class : tsc wrongly fails in recursive checking 
 * 
 * So we keep the type but transform it in order not to get wrong errors.
 */
// export type KeyPath<T> = RecursiveKeyPath<Required<T>, keyof Required<T>> | keyof Required<T> ;
// @ts-ignore
export type KeyPath<T> = string ; // NOSONAR: for now use string to bypass recursive key path checking issues

/*
 * HOW KeyPath<T> COULD BE TYPED
 *
 * Why RecursiveKeyPath<> fails: it builds the union of ALL the key paths of T before checking
 * the given key, and
 *   - nothing stops its recursion: a recursive type (friends:Person[], parent?:Person) gives an
 *     infinite union ("Type instantiation is excessively deep" or endless compilation),
 *   - `T[K] extends Record<string, any>` is true for arrays, Date, TSDate, Map, typed arrays and
 *     even functions, so it goes into `length`, `push()`, `getTime()`... and the template literal
 *     union explodes,
 *   - its distributive form over K, with Required<> evaluated at each level, is the most
 *     expensive form for tsc.
 *
 * A working definition (tested: no tsc slowdown, recursive types accepted, real autocompletion)
 * enumerates the paths with a mapped type, a depth limit and the same rules as _valuesForKeyPath():
 *
 *   import type { TSDate } from "./tsdate" ;
 *   import type { TSData } from "./tsdata" ;
 *
 *   type KeyPathDepths = [never, 0, 1, 2, 3, 4] ;  // key paths have at most 5 levels
 *   type KeyPathMaxDepth = 5 ;
 *
 *   // values we never go into
 *   type KeyPathLeaf = string | number | boolean | bigint | symbol | null | undefined | Function |
 *                      Date | RegExp | TSDate | TSData | ArrayBufferView | ArrayBuffer ;
 *
 *   // like _valuesForKeyPath(), we enumerate the items of arrays, sets and collections
 *   type KeyPathItem<V> = V extends ReadonlyArray<infer U> ? U : V extends Set<infer U> ? U :
 *                         V extends TSCollection<infer U> ? U : V ;
 *
 *   // the keys of the data (methods are not data)
 *   type KeyPathKeys<T> = { [K in keyof T & string]-?: NonNullable<T[K]> extends Function ? never : K }[keyof T & string] ;
 *
 *   export type RecursiveKeyPath<T, D extends number = KeyPathMaxDepth> =
 *       [D] extends [never] ? never :
 *       T extends KeyPathLeaf ? never :
 *       { [K in KeyPathKeys<T>]-?: K | `${K}.${RecursiveKeyPath<KeyPathItem<NonNullable<T[K]>>, KeyPathDepths[D]>}` }[KeyPathKeys<T>] ;
 *
 *   // with an undetermined type (any, unknown or a dictionary) every string is accepted
 *   export type KeyPath<T> = unknown extends T ? string : string extends keyof T ? string :
 *                            RecursiveKeyPath<KeyPathItem<NonNullable<T>>> ;
 *
 * Note that validating only the given key (generic methods with a `P extends string` key parameter)
 * would be cheaper, but TypeScript does not infer P when T is explicitly given, as in
 * TSQualifier.EQ<People>('name', 'x'), so the static methods would not be checked.
 *
 * Consequences if it is used one day:
 *   - it is a typing breaking change: wrong keys, keys deeper than 5 levels and computed keys
 *     typed as string (for a definite T) do not compile anymore (type them as KeyPath<T> or cast them),
 *   - tests using wrong keys on purpose must cast their qualifier to any,
 *   - some type tests with `// @ts-expect-error` (wrong key, method, date component, array length)
 *     and on a recursive type should be added to prevent any compilation time regression.
 */

export class TSQualifier<T> {
    public readonly operator:QualifierOperator ;
    private _operands:QualifierOperand[] ;

    protected constructor(operator:QualifierOperator, operands:QualifierOperand[]) {
        this.operator = operator ;
        this._operands = operands ;
    }

    // Tree management qualifiers
	public static OR<T>(conds:QualifierCondition<T>[] = []):TSQualifier<T> 	     { return new this<T>('OR', [...conds]) ; }
	public static AND<T>(conds:QualifierCondition<T>[] = []):TSQualifier<T> 	 { return new this<T>('AND', [...conds]) ; }
	public static NOT<T>(cond:QualifierCondition<T>):TSQualifier<T> 			 { return new this<T>('NOT', [cond]) ; }

    // existence qualifiers
    public static OK<T>(key:KeyPath<T>):TSQualifier<T>                           { return new this<T>('OK',   [_split(key)]) ; }
    public static KO<T>(key:KeyPath<T>):TSQualifier<T>                           { return new this<T>('KO',   [_split(key)]) ; }

    // key-value(s) qualifiers
    public static EQ<T>(key:KeyPath<T>, value:QualifierOperand):TSQualifier<T>   { return new this<T>('EQ',   [_split(key), value]) ; }
    public static NEQ<T>(key:KeyPath<T>, value:QualifierOperand):TSQualifier<T>  { return new this<T>('NEQ',  [_split(key), value]) ; }
    public static LT<T>(key:KeyPath<T>, value:QualifierOperand):TSQualifier<T>   { return new this<T>('LT',   [_split(key), value]) ; }
    public static LTE<T>(key:KeyPath<T>, value:QualifierOperand):TSQualifier<T>  { return new this<T>('LTE',  [_split(key), value]) ; }
    public static GT<T>(key:KeyPath<T>, value:QualifierOperand):TSQualifier<T>   { return new this<T>('GT',   [_split(key), value]) ; }
    public static GTE<T>(key:KeyPath<T>, value:QualifierOperand):TSQualifier<T>  { return new this<T>('GTE',  [_split(key), value]) ; }

    // like 'SQL LIKE' operator
    public static LIKE<T>(key:KeyPath<T>, value:QualifierOperand):TSQualifier<T> { return new this<T>('LIKE', [_split(key), value]) ; }

	public static IN<T>(key:KeyPath<T>, values:QualifierOperand[]):TSQualifier<T> {
        if (values.length === 0) { TSError.throw('TSQualifier.IN(): always returns false with empty values', { key:key, values:values}) ; }
		return values.length === 1 ? this.EQ<T>(key, values[0]) : new this<T>('IN', [_split(key), values])
    }

    public static NIN<T>(key:KeyPath<T>, values:QualifierOperand[]):TSQualifier<T> {
        if (values.length === 0) { TSError.throw('TSQualifier.NIN(): always returns true with empty values', { key:key, values:values}) ; }
		return values.length === 1 ? this.NEQ<T>(key, values[0]) : new this<T>('NIN', [_split(key), values])
    }

    public static INCLUDES<T>(key1:KeyPath<T>, key2:KeyPath<T>, value:QualifierOperand):TSQualifier<T> {
        if (!$ok(value)) { TSError.throw('TSQualifier.INCLUDES(): should have a not null and not undefined comparison value', { key1:key1, key2:key2, value:value}) ; }
        return this.AND<T>([this.LTE<T>(key1, value), this.GT<T>(key2, value)]) ;
    }

	/** @deprecated use INRANGE(key, value1, value2): INCLUDED() uses closed intervals (or open ones if strict), unlike TSRange */
	public static INCLUDED<T>(key:KeyPath<T>, value1:QualifierOperand, value2:QualifierOperand, canUnspecify:boolean=false, strict:boolean=false):TSQualifier<T> {
		// intersectionQualifiers() throws without any bound, so that target is never empty
		const target = this.intersectionQualifiers<T>(value1, value2, key, key, strict, canUnspecify) ;
		return target.length === 1 ? target[0] : this.AND<T>(target) ;
	}

    /**
     * @deprecated use CONTINUOUS() (same conditions as INTERSECTS() without strict) or OVERLAPS()
     * (same conditions as INTERSECTS() with strict), whose names give their TSRange meaning
     */
    public static INTERSECTS<T>(key1:KeyPath<T>, key2:KeyPath<T>, value1:QualifierOperand, value2:QualifierOperand, canUnspecify:boolean=false, strict:boolean=false):TSQualifier<T> {
		let quals = this.intersectionQualifiers<T>(value1, value2, key1, key2, strict, canUnspecify) ;
		return quals.length === 1 ? quals[0] : this.AND(quals) ;
	}

    // key in [start, end[, like TSRange.containsLocation(). A null bound is infinite (no condition on that side),
    // an empty interval matches nothing and a range set matches each of its ranges.
    // Throws for an invalid or inverted interval and for an empty range set (that would always be false).
    // (it used to give EQ(key, location) for a length 1 range, which did not match a non-integer value,
    // and to throw for an empty range)
    public static INRANGE<T>(key:KeyPath<T>, interval:QualifierInterval):TSQualifier<T> ;
    public static INRANGE<T>(key:KeyPath<T>, start:Nullable<QualifierOperand>, end:Nullable<QualifierOperand>):TSQualifier<T> ;
    public static INRANGE<T>(key:KeyPath<T>, a:any, b?:any):TSQualifier<T> {
        return this._boundsQualifier<T>('INRANGE', _qualifierBounds('INRANGE', a, b, arguments.length - 1), ([start, end]) => [
            $ok(start) ? this.GTE<T>(key, start) : null,
            $ok(end)   ? this.LT<T>(key, end) : null
        ]) ;
    }

    // the [startKey, endKey[ interval of the value is continuous with the given interval, like TSRange.continuousWith():
    // they intersect or touch, or one of them is empty and inside the other one, ie. their intersection is not a bad range.
    // Exact, empty intervals included. With canUnspecify, a null start or end value is infinite
    public static CONTINUOUS<T>(startKey:KeyPath<T>, endKey:KeyPath<T>, interval:QualifierInterval, canUnspecify?:boolean):TSQualifier<T> ;
    public static CONTINUOUS<T>(startKey:KeyPath<T>, endKey:KeyPath<T>, start:Nullable<QualifierOperand>, end:Nullable<QualifierOperand>, canUnspecify?:boolean):TSQualifier<T> ;
    public static CONTINUOUS<T>(startKey:KeyPath<T>, endKey:KeyPath<T>, a:any, b?:any, c?:any):TSQualifier<T> {
        const [bounds, canUnspecify] = _qualifierBoundsAndOption('CONTINUOUS', a, b, c) ;
        return this._boundsQualifier<T>('CONTINUOUS', bounds, ([start, end]) => [
            $ok(start) ? this._unspecified<T>(this.GTE<T>(endKey, start), endKey, canUnspecify) : null,
            $ok(end)   ? this._unspecified<T>(this.LTE<T>(startKey, end), startKey, canUnspecify) : null
        ]) ;
    }

    // the [startKey, endKey[ interval of the value intersects the given interval, like TSRange.intersects().
    // WARNING: a value with an empty interval (startKey = endKey) strictly inside the given interval is matched
    // (TSRange.intersects() is false for an empty range): excluding it would need to compare startKey and endKey.
    // With canUnspecify, a null start or end value is infinite
    public static OVERLAPS<T>(startKey:KeyPath<T>, endKey:KeyPath<T>, interval:QualifierInterval, canUnspecify?:boolean):TSQualifier<T> ;
    public static OVERLAPS<T>(startKey:KeyPath<T>, endKey:KeyPath<T>, start:Nullable<QualifierOperand>, end:Nullable<QualifierOperand>, canUnspecify?:boolean):TSQualifier<T> ;
    public static OVERLAPS<T>(startKey:KeyPath<T>, endKey:KeyPath<T>, a:any, b?:any, c?:any):TSQualifier<T> {
        const [bounds, canUnspecify] = _qualifierBoundsAndOption('OVERLAPS', a, b, c) ;
        return this._boundsQualifier<T>('OVERLAPS', bounds, ([start, end]) => _isEmptyBounds(start, end) ? 
            [this._never<T>(startKey, start)] : [ // like TSRange, an empty interval intersects nothing
            $ok(start) ? this._unspecified<T>(this.GT<T>(endKey, start), endKey, canUnspecify) : null,
            $ok(end)   ? this._unspecified<T>(this.LT<T>(startKey, end), startKey, canUnspecify) : null
        ]) ;
    }

    // the [startKey, endKey[ interval of the value contains the given interval, like TSRange.contains(): an empty
    // interval is contained if its location is. A range set is contained if the smallest range containing it is.
    // An infinite bound of the given interval needs canUnspecify (a null start or end value is then infinite)
    public static CONTAINS<T>(startKey:KeyPath<T>, endKey:KeyPath<T>, interval:QualifierInterval, canUnspecify?:boolean):TSQualifier<T> ;
    public static CONTAINS<T>(startKey:KeyPath<T>, endKey:KeyPath<T>, start:Nullable<QualifierOperand>, end:Nullable<QualifierOperand>, canUnspecify?:boolean):TSQualifier<T> ;
    public static CONTAINS<T>(startKey:KeyPath<T>, endKey:KeyPath<T>, a:any, b?:any, c?:any):TSQualifier<T> {
        const [bounds, canUnspecify] = _qualifierBoundsAndOption('CONTAINS', a, b, c, true) ;
        return this._boundsQualifier<T>('CONTAINS', bounds, ([start, end]) => {
            if ((!$ok(start) || !$ok(end)) && !canUnspecify) {
                TSError.throw('TSQualifier.CONTAINS(): an infinite bound needs the canUnspecify option', { startKey:startKey, endKey:endKey, start:start, end:end }) ;
            }
            // the location of an empty interval must be in [startKey, endKey[
            const endCondition = _isEmptyBounds(start, end) ? this.GT<T>(endKey, end) : this.GTE<T>(endKey, end) ;
            return [
                $ok(start) ? this._unspecified<T>(this.LTE<T>(startKey, start), startKey, canUnspecify) : this.EQ<T>(startKey, null),
                $ok(end) ? this._unspecified<T>(endCondition, endKey, canUnspecify) : this.EQ<T>(endKey, null)
            ] ;
        }) ;
    }

    // the [startKey, endKey[ interval of the value is contained in the given interval, like TSRange.containedIn().
    // WARNING: a value with an empty interval located at the (excluded) end of the given interval is matched:
    // excluding it would need to compare startKey and endKey. A null start or end value is infinite, so it is
    // only contained in an infinite side of the given interval
    public static CONTAINEDIN<T>(startKey:KeyPath<T>, endKey:KeyPath<T>, interval:QualifierInterval):TSQualifier<T> ;
    public static CONTAINEDIN<T>(startKey:KeyPath<T>, endKey:KeyPath<T>, start:Nullable<QualifierOperand>, end:Nullable<QualifierOperand>):TSQualifier<T> ;
    public static CONTAINEDIN<T>(startKey:KeyPath<T>, endKey:KeyPath<T>, a:any, b?:any):TSQualifier<T> {
        return this._boundsQualifier<T>('CONTAINEDIN', _qualifierBounds('CONTAINEDIN', a, b, arguments.length - 2), ([start, end]) => _isEmptyBounds(start, end) ?
            [this._never<T>(startKey, start)] : [ // like TSRange, an empty interval contains nothing
            $ok(start) ? this.GTE<T>(startKey, start) : null,
            $ok(end)   ? this.LTE<T>(endKey, end) : null
        ]) ;
    }

    // one qualifier for each [start, end[ bounds (OR), made of the AND of its non null conditions
    // (no condition at all is an always true AND)
    private static _boundsQualifier<T>(fn:string, bounds:QualifierBounds[], conditionsFn:(b:QualifierBounds) => Nullable<TSQualifier<T>>[]):TSQualifier<T> {
        if (!bounds.length) { TSError.throw(`TSQualifier.${fn}(): always returns false with an empty range set`) ; }
        const quals = bounds.map(b => {
            const conds = conditionsFn(b).filter(c => $ok(c)) as TSQualifier<T>[] ;
            return conds.length === 1 ? conds[0] : this.AND<T>(conds) ;
        }) ;
        return quals.length === 1 ? quals[0] : this.OR<T>(quals) ;
    }

    // a qualifier which is never verified (key >= value AND key < value), and which can be translated to a database request
    private static _never<T>(key:KeyPath<T>, value:QualifierOperand):TSQualifier<T> {
        return this.AND<T>([this.GTE<T>(key, value), this.LT<T>(key, value)]) ;
    }

    // with canUnspecify, a null value for key is infinite, so it verifies the condition
    private static _unspecified<T>(cond:TSQualifier<T>, key:KeyPath<T>, canUnspecify:boolean):TSQualifier<T> {
        return canUnspecify ? this.OR<T>([cond, this.EQ<T>(key, null)]) : cond ; // NOSONAR: we don't want to hae two methods
    }


	public static intersectionQualifiers<T>(A:QualifierOperand, B:QualifierOperand, C:KeyPath<T>, D:KeyPath<T>, strict:boolean, canUnspecify:boolean):Array<TSQualifier<T>> {
		let target:TSQualifier<T>[] = [] ;
		if (!$ok(A) && !$ok(B)) {
            TSError.throw('TSQualifier.intersectionQualifiers() must at least have one research milestone', 
            { A:A, B:B, C:C, D:D, strict:strict, canUnspecify:canUnspecify}
            ) ;
        }
		const gt:QualifierOperator = strict ? 'GT' : 'GTE' ;
		const lt:QualifierOperator = strict ? 'LT' : 'LTE' ;

		if (canUnspecify) {
			if ($ok(A)) target.push(this.OR([new this(gt, [_split(D), A]), this.EQ(D, null)])) ;
			if ($ok(B)) target.push(this.OR([new this(lt, [_split(C), B]), this.EQ(C, null)])) ;
		}
		else {
			if ($ok(A)) target.push(new this(gt, [_split(D), A])) ;
			if ($ok(B)) target.push(new this(lt, [_split(C), B])) ;
		}
		return target ;
	}
    
    public get isComposite() { return this.operator === 'AND' || this.operator === 'OR' || this.operator === 'NOT' ; }
    public get isKeyValue()  { return !this.isComposite && this.operator !== 'OK' && this.operator !== 'KO' ; }

    public key(): string | undefined { return this.isComposite ? undefined : this._operands[0].join('.') ; }
    public keyArray(): string[] { return this.isComposite ? [] : this._operands[0] as string[] ; }
    public value(): any { return this.isKeyValue ? this._operands[1] : undefined ; }
    public conditions() : QualifierCondition<T>[] { return this.isComposite ? this._operands : [] ; } 

	public condition(cond: QualifierCondition<T>):this {
        this._assertAndOr('condition') ; 
        if (cond instanceof TSQualifier) { return this._add('', cond) ; }
        this._operands.push(cond) ;
        return this ;
    }
    
    public and(conds:QualifierCondition<T>[] = []):this {
        this._assertAndOr('and') ; 
        if (this.operator === 'AND') { conds.forEach(c => this.condition(c)) ; return this ; } 
        const qual = (this.constructor as any).AND(conds) ; this._add('', qual) ; return qual ;
    }
    
    public or(conds:QualifierCondition<T>[] = []):this  {
        this._assertAndOr('or') ; 
        if (this.operator === 'OR') { conds.forEach(c => this.condition(c)) ; return this ; }
        const qual = (this.constructor as any).OR(conds) ;  this._add('', qual) ; return qual ;
    }

    public not(condition:QualifierCondition<T>):this  { 
        this._assertAndOr('not') ; 
        const qual = (this.constructor as any).NOT(condition) ;  
        return this._add('', qual) ;
    }

    public mayIs(cond:boolean, key:KeyPath<T>, value:QualifierOperand):this  { this._assertAndOr('mayIs') ; return cond ? this.is(key, value) : this ; }
    public if(cond:boolean):this | undefined { this._assertAndOr('if') ; return cond ? this : undefined ;}

    public is(key:KeyPath<T>, value:QualifierOperand):this      { return this._add('is',      (this.constructor as any).EQ(key as any, value)) ; }
	public isNot(key:KeyPath<T>, value:QualifierOperand):this   { return this._add('isNot',   (this.constructor as any).NEQ(key as any, value)) ; }
    public gt(key:KeyPath<T>, value:QualifierOperand):this      { return this._add('gt',      (this.constructor as any).GT(key as any, value)) ; }
    public lt(key:KeyPath<T>, value:QualifierOperand):this      { return this._add('lt',      (this.constructor as any).LT(key as any, value)) ; }
    public gte(key:KeyPath<T>, value:QualifierOperand):this     { return this._add('gte',     (this.constructor as any).GTE(key as any, value)) ; }
    public lte(key:KeyPath<T>, value:QualifierOperand):this     { return this._add('lte',     (this.constructor as any).LTE(key as any, value)) ; }
    public in(key:KeyPath<T>, value:QualifierOperand[]):this    { return this._add('in',      (this.constructor as any).IN(key as any, value)) ; }
    public nin(key:KeyPath<T>, value:QualifierOperand[]):this   { return this._add('nin',     (this.constructor as any).NIN(key as any, value)) ; }
    public inRange(key:KeyPath<T>, interval:QualifierInterval):this ;
    public inRange(key:KeyPath<T>, start:Nullable<QualifierOperand>, end:Nullable<QualifierOperand>):this ;
    public inRange(key:KeyPath<T>, ...args:any[]):this { return this._add('inRange', (this.constructor as any).INRANGE(key as any, ...args)) ; }
    public continuous(startKey:KeyPath<T>, endKey:KeyPath<T>, ...args:any[]):this  { return this._add('continuous', (this.constructor as any).CONTINUOUS(startKey as any, endKey as any, ...args)) ; }
    public overlaps(startKey:KeyPath<T>, endKey:KeyPath<T>, ...args:any[]):this    { return this._add('overlaps', (this.constructor as any).OVERLAPS(startKey as any, endKey as any, ...args)) ; }
    public contains(startKey:KeyPath<T>, endKey:KeyPath<T>, ...args:any[]):this    { return this._add('contains', (this.constructor as any).CONTAINS(startKey as any, endKey as any, ...args)) ; }
    public containedIn(startKey:KeyPath<T>, endKey:KeyPath<T>, ...args:any[]):this { return this._add('containedIn', (this.constructor as any).CONTAINEDIN(startKey as any, endKey as any, ...args)) ; }
    public ok(key:KeyPath<T>):this                              { return this._add('ok',      (this.constructor as any).OK(key as any)) ; }
    public ko(key:KeyPath<T>):this                              { return this._add('ko',      (this.constructor as any).KO(key as any)) ; }

    public includes(key1:KeyPath<T>, key2:KeyPath<T>, value:any):this { 
        return this._add('includes', (this.constructor as any).INCLUDES(key1 as any, key2 as any, value)) ;
    }

    /** @deprecated use inRange(key, value1, value2) */
    public included(key:KeyPath<T>, value1:any, value2:any, canUnspecify:boolean=false, strict:boolean=false):this {
        return this._add('included', (this.constructor as any).INCLUDED(key as any, value1, value2, canUnspecify, strict)) ;
    }

    /** @deprecated use continuous() or overlaps() */
    public intersects(key1:KeyPath<T>, key2:KeyPath<T>, value1:any, value2:any, canUnspecify:boolean=false, strict:boolean=false):this {
        return this._add('intersects', (this.constructor as any).INTERSECTS(key1 as any, key2 as any, value1, value2, canUnspecify, strict)) ;
    }

    public inverse():this { return (this.constructor as any).NOT(this) as this ; }

    public validateValue(value:T, validateValueForCondition?:(v:T, cond:TSDictionary) => boolean):boolean {
        return this._validate(value, validateValueForCondition, undefined) ;
    }

    public filterValues(values:Nullable<Iterable<T>>):Array<T> {
        if (!$ok(values)) { return [] ; }
        // a subclass validateValue() is always called
        if (this.validateValue !== TSQualifier.prototype.validateValue) { return _filter(values!, v => this.validateValue(v)) ; }
        // otherwise the IN and NIN values are put in Sets which are only kept during this call
        const matchers:TSInMatchers = new Map() ;
        return _filter(values!, v => this._validate(v, undefined, matchers)) ;
    }

    // matchers is only given by filterValues(): validateValue() always tests the IN and NIN values one by one
    private _validate(value:T, validateValueForCondition:((v:T, cond:TSDictionary) => boolean)|undefined, matchers:TSInMatchers|undefined):boolean {
        switch (this.operator) {
            case 'AND':
                return this._operands.every(cond => this._validateCondition('AND', value, cond, validateValueForCondition, matchers)) ;
            case 'OR': 
                return this._operands.some(cond => this._validateCondition('OR', value, cond, validateValueForCondition, matchers)) ;
            case 'NOT':
                return !this._validateCondition('NOT', value, this._operands[0], validateValueForCondition, matchers) ;
            case 'OK':
                return _valuesForKeyPath(value, this._operands[0]).length > 0 ;
            case 'KO':
                return _valuesForKeyPath(value, this._operands[0]).length === 0 ;
            // like SQL IS NULL and IS NOT NULL, EQ(key, null) matches an absent or null value and NEQ(key, null)
            // a present one (EQ(key, null) used to match nothing, so canUnspecify options had no effect)
            case 'EQ':   return $ok(this._operands[1]) ? this._someValueMatches(value, (v, op) => $equal(v, op)) : !_hasValue(value, this._operands[0]) ;
            case 'NEQ':  return $ok(this._operands[1]) ? this._someValueMatches(value, (v, op) => !$equal(v, op)) : _hasValue(value, this._operands[0]) ;
            case 'LT':   return this._someValueMatches(value, (v, op) => $compare(v, op) === Ascending) ;
            case 'LTE':  return this._someValueMatches(value, (v, op) => { const comp = $compare(v, op) ; return comp === Same || comp === Ascending ; }) ;
            case 'GT':   return this._someValueMatches(value, (v, op) => $compare(v, op) === Descending) ;
            case 'GTE':  return this._someValueMatches(value, (v, op) => { const comp = $compare(v, op) ; return comp === Same || comp === Descending ; }) ;
            // same result as $sqllike(v, op), but the regular expression is built once per qualifier
            case 'LIKE': return this._someValueMatches(value, (v, op) => $ok(v) && $ok(op) && _likeRegExp(this, op as string).test($isstring(v) ? v : `${v}`)) ;
            case 'IN':   return this._someValueMatches(value, (v, op) => this._containsEqualValue(op, v, matchers)) ;
            case 'NIN':  return !this._someValueMatches(value, (v, op) => this._containsEqualValue(op, v, matchers)) ;
        }       
    }

    private _containsEqualValue(values:Iterable<any>, v:any, matchers:TSInMatchers|undefined):boolean {
        // only arrays and sets are sure to give the same values each time they are iterated
        if (!matchers || !($isarray(values) || values instanceof Set)) { return _containsEqualValue(values, v) ; }
        let matcher = matchers.get(this) ;
        if (!matcher) { matcher = _equalValueMatcher(values) ; matchers.set(this, matcher) ; }
        return matcher(v) ;
    }

    private _add(method:string,qualifier:TSQualifier<T>):this { 
        this._assertAndOr(method.length ? method : '_add') ; 
        if (qualifier.operator === this.operator) {
            this._operands = [...this._operands, ...qualifier._operands] ;
        }
        else { this._operands.push(qualifier) ; } 
        return this ; 
    }

    // validates a condition of a composite (AND, OR, NOT) qualifier
    private _validateCondition(operator:string, value:T, cond:QualifierCondition<T>, validateValueForCondition:((v:T, cond:TSDictionary) => boolean)|undefined, matchers:TSInMatchers|undefined):boolean {
        if (cond instanceof TSQualifier) {
            // a subclass validateValue() is always called
            return matchers && cond.validateValue === TSQualifier.prototype.validateValue ? cond._validate(value, validateValueForCondition, matchers) : cond.validateValue(value, validateValueForCondition) ;
        }
        if ($ok(validateValueForCondition)) { return validateValueForCondition!(value, cond) ; }
        TSError.throw(`need a validateValueForCondition() callback to interpret a specific ${operator} condition`, { value:value, condition:cond }) ;
    }

    // returns true if one of the values found for our key path verifies test() with our value operand
    private _someValueMatches(value:T, test:(v:any, op:QualifierOperand) => boolean):boolean {
        const vals = _valuesForKeyPath(value, this._operands[0]) ;
        const op = this._operands[1] ;
        for (let v of vals) { if (test(v, op)) { return true ; } }
        return false ;
    }

    private _assertAndOr(method:string) {
        if (this.operator !== 'OR' && this.operator !== 'AND') {
            TSError.throw(`TSQualifier.${method}(): trying to add condition on ${this.operator} qualifier`, {
                
            }) ;
        }
    }
}

export function $valuesForKeyPath<T>(v:any, path:KeyPath<T>):Nullable<any[]> { return $ok(v) ? _valuesForKeyPath(v, _split(path)) : v ; }

function _split<T>(key:KeyPath<T>):string[] { return (key as string).split('.') ;}

function _isEmptyBounds(start:any, end:any):boolean { return $ok(start) && $ok(end) && $compare(start, end) === Same ; }

function _hasValue(value:any, keyPath:string[]):boolean { return _valuesForKeyPath(value, keyPath).length > 0 ; }

// [start, end[ bounds, a null bound being infinite
type QualifierBounds = [any, any] ;

// the bounds of an interval argument or of start and end arguments (n is the number of interval arguments)
function _qualifierBounds(fn:string, a:any, b:any, n:number, hullOfSets:boolean = false):QualifierBounds[] {
    if (n >= 2) { return [_startEndBounds(fn, a, b)] ; }
    if (a instanceof TSRangeSet) {
        if (!a.hasSignificantRange) { return [] ; }
        return hullOfSets ? [[a.location, a.maxRange]] : [...a].map(r => [r.location, r.maxRange]) ;
    }
    return [_intervalBounds(fn, a)] ;
}

function _startEndBounds(fn:string, start:any, end:any):QualifierBounds {
    if ($ok(start) && $ok(end) && $compare(start, end) === Descending) {
        TSError.throw(`TSQualifier.${fn}(): the end of the interval is anterior to its start`, { start:start, end:end }) ;
    }
    return [start, end] ;
}

// the bounds of a TSInterval, a TSRange or a [location, length] array
function _intervalBounds(fn:string, a:any):QualifierBounds {
    if (a instanceof TSInterval) {
        if (!a.isValid) { TSError.throw(`TSQualifier.${fn}(): invalid interval`, { interval:a }) ; }
        return [a.first, a.second] ;
    }
    let range:Nullable<TSRange> = null ;
    if (a instanceof TSRange) { range = a ; }
    else if ($isarray(a)) { range = TSRange.fromArray(a) ; }
    if (!$ok(range) || !range!.isValid) { TSError.throw(`TSQualifier.${fn}(): invalid range`, { range:a }) ; }
    return [range!.location, range!.maxRange] ;
}

// the bounds and the canUnspecify option of an interval and option, or start, end and option arguments
function _qualifierBoundsAndOption(fn:string, a:any, b:any, c:any, hullOfSets:boolean = false):[QualifierBounds[], boolean] {
    const isInterval = a instanceof TSRange || a instanceof TSInterval || a instanceof TSRangeSet || $isarray(a) ;
    return isInterval ? [_qualifierBounds(fn, a, undefined, 1, hullOfSets), !!b] : [_qualifierBounds(fn, a, b, 2), !!c] ;
}

// the regular expression of each LIKE qualifier, built at its first use (a WeakMap does not retain the qualifiers)
const __likeRegExps = new WeakMap<TSQualifier<any>, RegExp>() ;
function _likeRegExp(qualifier:TSQualifier<any>, like:string):RegExp {
    let re = __likeRegExps.get(qualifier) ;
    if (!re) { re = _sqlLikeRegExp(like) ; __likeRegExps.set(qualifier, re) ; }
    return re ;
}

// regex special characters are escaped, then % matches any string and _ any character.
// Since the regular expression has no g or y flag, test() keeps no state and can be reused
function _sqlLikeRegExp(like:string):RegExp {
    const pattern = like.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`).replaceAll('%', '.*').replaceAll('_', '.') ;
    return new RegExp(`^${pattern}$`, 'i') ;
}

function _containsEqualValue(values:Iterable<any>, v:any):boolean {
    for (let e of values) { if ($equal(e,v)) { return true ; } }
    return false ;
}

function _filter<T>(values:Iterable<T>, test:(v:T) => boolean):T[] {
    const ret:T[] = [] ;
    for (let v of values) { if (test(v)) { ret.push(v) ; } }
    return ret ;
}

type TSInMatchers = Map<TSQualifier<any>, (v:any) => boolean> ;

// same result as _containsEqualValue(values, v). $equal() is === on two primitive values (NaN apart,
// which equals nothing), so these are found in a Set. The other values are still compared with $equal()
// (to v if v is a primitive value, since an object isEqual() method may accept it, and to all the values
// if v is an object), always as $equal(e, v)
function _equalValueMatcher(values:Iterable<any>):(v:any) => boolean {
    const primitives = new Set<any>() ;
    const primitivesList:any[] = [] ;
    const others:any[] = [] ;
    for (let e of values) {
        if (_isprimitive(e)) { primitives.add(e) ; primitivesList.push(e) ; }
        else { others.push(e) ; }
    }
    return (v:any) => {
        if (_isprimitive(v) && primitives.has(v)) { return true ; }
        if (others.some(e => $equal(e, v))) { return true ; }
        return !_isprimitive(v) && primitivesList.some(e => $equal(e, v)) ;
    } ;
}

function _isprimitive(v:any):boolean {
    const t = typeof v ;
    return t === 'string' || t === 'boolean' || t === 'bigint' || (t === 'number' && !Number.isNaN(v)) ;
}

function _valuesForKeyPath(v:any, keyPath:string[]):any[] {
    if (!$ok(v)) { return [] ; }
    let values:any[] = [v] ;
    for (let key of keyPath) {
        values = _valuesForKey(values, key) ;
        if (values.length === 0) { return [] }
    }
    return values ;
}

function _valuesForKey(values:any[], key:string):any[] {
    const newValues:any[] = [] ;
    if (!$issafekey(key)) { return newValues ; } // '__proto__', 'constructor' and 'prototype' are never read (see $issafekey())
    for (let v of values) { _pushKeyPathValue(newValues, v[key]) ; }
    return newValues ;
}

// collections, arrays and sets are flattened
function _pushKeyPathValue(values:any[], v:any) {
    if (!$ok(v)) { return ; }
    if ($iscollection(v)) { v = v.getItems() ; }
    if ($isarray(v) || (v instanceof Set)) {
        for (let o of v) { values.push(o) ; }
    }
    else { values.push(v) ; }
}

declare global {
    export interface String {
        sqlLike: (this:string, like:string) => boolean ;
    }
    export interface Array<T> {
        filterWithQualifier: <T>(qual:TSQualifier<T>) => Array<T> ;
    }
}


$declareMethods(String, {
    sqlLike(this:string, like:string) { 
        if (!$ok(like)) { return false ; }
        return _sqlLikeRegExp(like).test(this) ;
    },
}) ;

/**
 * since some modules like pdfjs require to use for ... in on Array.prototype
 * we declare our new methods as non enumerable ones with $declareMethods()
 */
$declareMethods(Array, {
    filterWithQualifier<T>(this: T[], qual:TSQualifier<T>):Array<T> { return qual.filterValues(this) ; },
}) ;


export function $sqllike(a:any, b:string) {
    if (!$ok(a)) return false ;
    return $isstring(a) ? a.sqlLike(b) : `${a}`.sqlLike(b) ; // if a as no specific toString() method, this will return inconsistent result
}
