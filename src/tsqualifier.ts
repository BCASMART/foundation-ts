import { $isarray, $isstring, $ok } from "./commons";
import { TSRange } from "./tsrange";
import { AnyDictionary, Ascending, Descending, Same } from "./types";
import { $compare, $equal } from "./compare";
import { $iscollection, TSCollection } from "./tsobject";


export type QualifierOperator  =  'AND' | 'OR' | 'NOT' | 'EQ' | 'NEQ' | 'LT' | 'LTE' | 'GT' | 'GTE' | 'LIKE' | 'IN' | 'NIN' | 'OK' | 'KO' ;
export type QualifierOperand   =  any ;
export type QualifierCondition<T>   =  AnyDictionary | TSQualifier<T> ;


export const LAZY_INTERSECTION = false ;

export type TSQualifierCollection<T> = ArrayLike<T> | Set<T> | TSCollection<T>

export type RecursiveKeyPath<T, K extends keyof T> =
  K extends string
  ? T[K] extends Record<string, any>
    ? T[K] extends TSQualifierCollection<infer U>
      ? K | `${K}.${RecursiveKeyPath<Required<U>, keyof Required<U>>}`
      : K | `${K}.${RecursiveKeyPath<Required<T[K]>, keyof Required<T[K]>>}`
    : K
  : never ;


export type KeyPath<T> = RecursiveKeyPath<Required<T>, keyof Required<T>> | keyof Required<T> ;


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

    // exsitence qualifiers
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
        if (values.length === 0) { throw 'TSQualifier.IN(): Allways false condition with empty values' ; }
		return values.length === 1 ? this.EQ<T>(key, values[0]) : new this<T>('IN', [_split(key), values])
    }

    public static NIN<T>(key:KeyPath<T>, values:QualifierOperand[]):TSQualifier<T> {
        if (values.length === 0) { throw 'TSQualifier.NIN(): Allways true condition with empty values' ; }
		return values.length === 1 ? this.NEQ<T>(key, values[0]) : new this<T>('NIN', [_split(key), values])
    }

    public static INCLUDES<T>(key1:KeyPath<T>, key2:KeyPath<T>, value:QualifierOperand):TSQualifier<T> {
        if (!$ok(value)) throw 'TSQualifier.INCLUDING(): should have a not null and not undefined comparison value' ;
        return this.AND<T>([this.LTE<T>(key1, value), this.GT<T>(key2, value)]) ;
    }

	public static INCLUDED<T>(key:KeyPath<T>, value1:QualifierOperand, value2:QualifierOperand, canUnspecify:boolean=false, strict:boolean=LAZY_INTERSECTION):TSQualifier<T> {
		let target = this.intersectionQualifiers<T>(value1, value2, key, key, strict, canUnspecify) ;
		if (!target.length) throw 'TSQualifier.INCLUDED(): Bad values.' ;
		return target.length === 1 ? target[0] : this.AND<T>(target) ;
	}

    public static INTERSECTS<T>(key1:KeyPath<T>, key2:KeyPath<T>, value1:QualifierOperand, value2:QualifierOperand, canUnspecify:boolean=false, strict:boolean=LAZY_INTERSECTION):TSQualifier<T> {
		let quals = this.intersectionQualifiers<T>(value1, value2, key1, key2, strict, canUnspecify) ;
		return quals.length === 1 ? quals[0] : this.AND(quals) ;
	}

    public static INRANGE<T>(key:KeyPath<T>, value:TSRange):TSQualifier<T> { 
		let qual = this.AND<T>() ;
		qual.addRange(key, value) ;
		if (!qual._operands.length) throw 'TSQualifier.INRANGE(): Bad TSRange value' ;
		return qual._operands.length === 1 ? qual._operands[0] : qual ;
	}

	public static intersectionQualifiers<T>(A:QualifierOperand, B:QualifierOperand, C:KeyPath<T>, D:KeyPath<T>, strict:boolean, canUnspecify:boolean):Array<TSQualifier<T>> {
		let target:TSQualifier<T>[] = [] ;
		if (!$ok(A) && !$ok(B)) throw 'TSQualifier._addintersectionQuals() must at least have a research millestone' ;
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

	public add(cond: QualifierCondition<T>) {
        if (this.operator !== 'OR' && this.operator !== 'AND') {
            throw 'TSQualifier.prototype.add(): trying to add condition on wrong qualifier' ;
        }
        if (cond instanceof TSQualifier && (cond as TSQualifier<T>).operator === this.operator) {
			this._operands = [...this._operands, ...(cond as TSQualifier<T>)._operands] ;
        }
        else {
            this._operands.push(cond) ;
        }
    }

    public addValue(key:KeyPath<T>, value:QualifierOperand) {
        const qualifier = (this.constructor as any).EQ(key, value) ;
        this.add(qualifier) ;
    }
	public addNotValue(key:KeyPath<T>, value:QualifierOperand) {
        const qualifier = (this.constructor as any).NEQ(key, value) ;
        this.add(qualifier) ;
    }

    public addRange(key:KeyPath<T>, range:TSRange) {
        if (!range.isValid || range.isEmpty) {
            throw 'TSQualifier.prototype.addRange(): trying to add an empty or invalid range value' ;
        }
        if (this.operator === 'AND') {
            if (range.length === 1) { this.addValue(key, range.location) ; }
            else {
                this.add((this.constructor as any).GTE(key, range.location)) ;
                this.add((this.constructor as any).LT(key, range.maxRange)) ;
            }
        }
        else {
            const qualifier = (this.constructor as any).INRANGE(key, range) ;
            this.add(qualifier) ;
        }
    }

	public addInclusion(key:KeyPath<T>, value1:QualifierOperand, value2:QualifierOperand, canUnspecify:boolean=false, strict:boolean=LAZY_INTERSECTION) {
        this.addIntersection(key, key, value1, value2, canUnspecify, strict) ;
	}

	public addIntersection(key1:KeyPath<T>, key2:KeyPath<T>, value1:QualifierOperand, value2:QualifierOperand, canUnspecify:boolean=false, strict:boolean=LAZY_INTERSECTION) {
		let quals = (this.constructor as any)._intersectionQuals(value1, value2, key1, key2, strict, canUnspecify) as TSQualifier<T>[] ;
		if (quals.length === 1) { this.add(quals[0]) ; }
		else if (this.operator === 'AND') { quals.forEach(q => this.add(q)) ; }
		else { this.add((this.constructor as any).AND(quals)) ; }
	}

    public inverse():TSQualifier<T> { return (this.constructor as any).NOT(this) as TSQualifier<T> ; }

    public validateValue(v:T, validateValueForCondition?:(v:T, cond:AnyDictionary) => boolean):boolean {
        let vals ;
        let op ;

        switch (this.operator) {
            case 'AND':
                for (let cond of this._operands) {
                    if (cond instanceof TSQualifier) { if (!cond.validateValue(v)) return false ; }
                    else if ($ok(validateValueForCondition)) { if (!validateValueForCondition!(v, cond)) return false ; }
                    else {
                        throw 'need a validateValueForCondition() callback to interpret a specific AND condition'
                    }
                }
                return true ;
            case 'OR': 
                for (let cond of this._operands) {
                    if (cond instanceof TSQualifier) { if (cond.validateValue(v)) return true ; }
                    else if ($ok(validateValueForCondition)) { if (validateValueForCondition!(v, cond)) return true ; }
                    else {
                        throw 'need a validateValueForCondition() callback to interpret a specific OR condition'
                    }
                }
                return false ;
            case 'NOT':
                const cond = this._operands[0] ;
                if (cond instanceof TSQualifier) { return !cond.validateValue(v) ; }
                else if ($ok(validateValueForCondition)) { return !validateValueForCondition!(v, cond) ; }
                throw 'need a validateValueForCondition() callback to interpret a specific NOT condition'
            case 'OK':
                return _valuesForKeyPath(v, this._operands[0]).length > 0 ;
            case 'KO':
                return _valuesForKeyPath(v, this._operands[0]).length === 0 ;
            case 'EQ':
                vals = _valuesForKeyPath(v, this._operands[0]) ;
                op = this._operands[1] ;
                for (let v of vals) { if ($equal(v, op)) return true ; } ; return false ;
            case 'NEQ':
                vals = _valuesForKeyPath(v, this._operands[0]) ;
                op = this._operands[1] ;
                for (let v of vals) { if (!$equal(v, op)) return true ; } ; return false ;
            case 'LT': 
                vals = _valuesForKeyPath(v, this._operands[0]) ;
                op = this._operands[1] ;
                for (let v of vals) { if ($compare(v, op) === Ascending) return true ; } ; return false ;
            case 'LTE':
                vals = _valuesForKeyPath(v, this._operands[0]) ;
                op = this._operands[1] ;
                for (let v of vals) {
                    const comp = $compare(v, op) ;
                    if (comp === Same || comp === Ascending) return true ;
                }
                return false ;
            case 'GT':
                vals = _valuesForKeyPath(v, this._operands[0]) ;
                op = this._operands[1] ;
                for (let v of vals) { if ($compare(v, op) === Descending) return true ; } ; return false ;
            case 'GTE':
                vals = _valuesForKeyPath(v, this._operands[0]) ;
                op = this._operands[1] ;
                for (let v of vals) {
                    const comp = $compare(v, op) ;
                    if (comp === Same || comp === Descending) return true ;
                }
                return false ;
            case 'LIKE':
                vals = _valuesForKeyPath(v, this._operands[0]) ;
                op = this._operands[1] ;
                for (let v of vals) { if ($sqllike(v, op)) return true ; } ; return false ;
            case 'IN':
                vals = _valuesForKeyPath(v, this._operands[0]) ;
                op = this._operands[1] ;
                for (let v of vals) { for (let e of op) { if ($equal(e,v)) return true ; } } ;
                return false ;
            case 'NIN':
                vals = _valuesForKeyPath(v, this._operands[0]) ;
                op = this._operands[1] ;
                for (let v of vals) { for (let e of op) { if ($equal(e,v)) return false ; } } ;                
                return true ;
        }       
    }

    public filterValues(values:Iterable<T>|null|undefined):Array<T> {
        const ret:Array<T> = []
        if ($ok(values)) { for (let v of values!) { if (this.validateValue(v)) { ret.push(v) ; }}}
        return ret ;
    }
}

export function $valuesForKeyPath<T>(v:any, path:KeyPath<T>) { return $ok(v) ? _valuesForKeyPath(v, _split(path)) : v ; }

function _split<T>(key:KeyPath<T>):string[] { return (key as string).split('.') ;}

function _valuesForKeyPath(v:any, keyPath:string[]):any[] {
    let values:any[] = [] ;
    if ($ok(v)) { 
        values = [v] ;
        for (let key of keyPath) {
            let newValues = [] ;
            for (let v of values) {
                v = v[key] ;
                if ($ok(v)) {
                    if ($iscollection(v)) { v = v.getItems() ; }
                    if ($isarray(v) || (v instanceof Set)) {
                        for (let o of v) { newValues.push(o) ; }
                    }
                    else { newValues.push(v) ; }
                }
            }
            if (newValues.length === 0) { return [] }
            values = newValues ;
        }
    }
    return values ;
}

declare global {
    export interface String {
        sqlLike: (this:string, like:string) => boolean ;
    }
    export interface Array<T> {
        filterWithQualifier: <T>(qual:TSQualifier<T>) => Array<T> ;
    }
}

if (!('sqlLike' in String.prototype)) {
    // we mimic SQL Like operator here
    String.prototype.sqlLike = function sqlLike(this:string, like:string) { 
        if (!$ok(like)) { return false ; }
        like = like!.replace(new RegExp("([\\.\\\\\\+\\*\\?\\[\\^\\]\\$\\(\\)\\{\\}\\=\\!\\<\\>\\|\\:\\-])", "g"), "\\$1");
        like = like.replace(/%/g, '.*').replace(/_/g, '.');
        return RegExp('^' + like + '$', 'gi').test(this);
    }
}

export function $sqllike(a:any, b:string) {
    if (!$ok(a)) return false ;
    return $isstring(a) ? a.sqlLike(b) : `${a}`.sqlLike(b) ; // if a as no specific toString() method, this will return inconsistent result
}

if (!('filterWithQualifier' in Array.prototype)) {
    Array.prototype.filterWithQualifier = function filterWithQualifier<T>(this: T[], qual:TSQualifier<T>):Array<T> { return qual.filterValues(this) ; }
}
