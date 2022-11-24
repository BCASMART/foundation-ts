import { $isarray, $isstring, $ok } from "./commons";
import { TSRange } from "./tsrange";
import { AnyDictionary, Ascending, Descending, Nullable, Same } from "./types";
import { $compare, $equal } from "./compare";
import { $iscollection, TSCollection } from "./tsobject";
import { TSError } from "./tserrors";


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
        if (values.length === 0) { throw new TSError('TSQualifier.IN(): Allways returns false with empty values', { key:key, values:values}) ; }
		return values.length === 1 ? this.EQ<T>(key, values[0]) : new this<T>('IN', [_split(key), values])
    }

    public static NIN<T>(key:KeyPath<T>, values:QualifierOperand[]):TSQualifier<T> {
        if (values.length === 0) { throw new TSError('TSQualifier.NIN(): Allways returns true with empty values', { key:key, values:values}) ; }
		return values.length === 1 ? this.NEQ<T>(key, values[0]) : new this<T>('NIN', [_split(key), values])
    }

    public static INCLUDES<T>(key1:KeyPath<T>, key2:KeyPath<T>, value:QualifierOperand):TSQualifier<T> {
        if (!$ok(value)) { throw new TSError('TSQualifier.INCLUDING(): should have a not null and not undefined comparison value', { key1:key1, key2:key2, value:value}) ; }
        return this.AND<T>([this.LTE<T>(key1, value), this.GT<T>(key2, value)]) ;
    }

	public static INCLUDED<T>(key:KeyPath<T>, value1:QualifierOperand, value2:QualifierOperand, canUnspecify:boolean=false, strict:boolean=LAZY_INTERSECTION):TSQualifier<T> {
		let target = this.intersectionQualifiers<T>(value1, value2, key, key, strict, canUnspecify) ;
		if (!target.length) { throw new TSError('TSQualifier.INCLUDED(): Bad parameters.', { parameters:Array.from(arguments)}) ; }
		return target.length === 1 ? target[0] : this.AND<T>(target) ;
	}

    public static INTERSECTS<T>(key1:KeyPath<T>, key2:KeyPath<T>, value1:QualifierOperand, value2:QualifierOperand, canUnspecify:boolean=false, strict:boolean=LAZY_INTERSECTION):TSQualifier<T> {
		let quals = this.intersectionQualifiers<T>(value1, value2, key1, key2, strict, canUnspecify) ;
		return quals.length === 1 ? quals[0] : this.AND(quals) ;
	}

    public static INRANGE<T>(key:KeyPath<T>, range:TSRange|number[]):TSQualifier<T> { 
        if (!(range instanceof TSRange)) { range = new TSRange(range) ; }
        if (!range.isValid || range.isEmpty) {
            throw new TSError('TSQualifier.prototype.addRange(): trying to add an empty or invalid range value', { key:key, range:range}) ;
        }
        return range.length === 1 ? this.EQ(key, range.location) : this.AND<T>([this.GTE(key, range.location), this.LT(key, range.maxRange)]) ;
	}

	public static intersectionQualifiers<T>(A:QualifierOperand, B:QualifierOperand, C:KeyPath<T>, D:KeyPath<T>, strict:boolean, canUnspecify:boolean):Array<TSQualifier<T>> {
		let target:TSQualifier<T>[] = [] ;
		if (!$ok(A) && !$ok(B)) {
            throw new TSError('TSQualifier.intersectionQualifiers() must at least have one research millestone', 
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

	public condition(cond: QualifierCondition<T>):TSQualifier<T> {
        this._assertAndOr('condition') ; 
        if (cond instanceof TSQualifier) { return this._add('', cond) ; }
        this._operands.push(cond) ;
        return this ;
    }
    
    public and(conds:QualifierCondition<T>[] = []):TSQualifier<T> {
        this._assertAndOr('and') ; 
        if (this.operator === 'AND') { conds.forEach(c => this.condition(c)) ; return this ; } 
        const qual = (this.constructor as any).AND(conds) ; this._add('', qual) ; return qual ;
    }
    
    public or(conds:QualifierCondition<T>[] = []):TSQualifier<T>  {
        this._assertAndOr('or') ; 
        if (this.operator === 'OR') { conds.forEach(c => this.condition(c)) ; return this ; }
        const qual = (this.constructor as any).OR(conds) ;  this._add('', qual) ; return qual ;
    }

    public not(condition:QualifierCondition<T>):TSQualifier<T>  { 
        this._assertAndOr('not') ; 
        const qual = (this.constructor as any).NOT(condition) ;  
        return this._add('', qual) ;
    }

    public mayIs(cond:boolean, key:KeyPath<T>, value:QualifierOperand):TSQualifier<T>  { this._assertAndOr('mayIs') ; return cond ? this.is(key, value) : this ; }
    public if(cond:boolean):TSQualifier<T> | undefined { this._assertAndOr('if') ; return cond ? this : undefined ;}

    public is(key:KeyPath<T>, value:QualifierOperand):TSQualifier<T>      { return this._add('is',      (this.constructor as any).EQ(key as any, value)) ; }
	public isNot(key:KeyPath<T>, value:QualifierOperand):TSQualifier<T>   { return this._add('isNot',   (this.constructor as any).NEQ(key as any, value)) ; }
    public gt(key:KeyPath<T>, value:QualifierOperand):TSQualifier<T>      { return this._add('gt',      (this.constructor as any).GT(key as any, value)) ; }
    public lt(key:KeyPath<T>, value:QualifierOperand):TSQualifier<T>      { return this._add('lt',      (this.constructor as any).LT(key as any, value)) ; }
    public gte(key:KeyPath<T>, value:QualifierOperand):TSQualifier<T>     { return this._add('gte',     (this.constructor as any).GTE(key as any, value)) ; }
    public lte(key:KeyPath<T>, value:QualifierOperand):TSQualifier<T>     { return this._add('lte',     (this.constructor as any).LTE(key as any, value)) ; }
    public in(key:KeyPath<T>, value:QualifierOperand[]):TSQualifier<T>    { return this._add('in',      (this.constructor as any).IN(key as any, value)) ; }
    public nin(key:KeyPath<T>, value:QualifierOperand[]):TSQualifier<T>   { return this._add('nin',     (this.constructor as any).NIN(key as any, value)) ; }
    public inRange(key:KeyPath<T>, range:TSRange|number[]):TSQualifier<T> { return this._add('inRange', (this.constructor as any).INRANGE(key as any, range)) ; }
    public ok(key:KeyPath<T>):TSQualifier<T>                              { return this._add('ok',      (this.constructor as any).OK(key as any)) ; }
    public ko(key:KeyPath<T>):TSQualifier<T>                              { return this._add('ko',      (this.constructor as any).KO(key as any)) ; }

    public includes(key1:KeyPath<T>, key2:KeyPath<T>, value:any):TSQualifier<T> { 
        return this._add('includes', (this.constructor as any).INCLUDES(key1 as any, key2 as any, value)) ;
    }

    public included(key:KeyPath<T>, value1:any, value2:any, canUnspecify:boolean=false, strict:boolean=LAZY_INTERSECTION):TSQualifier<T> {
        return this._add('included', (this.constructor as any).INCLUDED(key as any, value1, value2, canUnspecify, strict)) ;
    }

    public intersects(key1:KeyPath<T>, key2:KeyPath<T>, value1:any, value2:any, canUnspecify:boolean=false, strict:boolean=LAZY_INTERSECTION):TSQualifier<T> {
        return this._add('intersects', (this.constructor as any).INTERSECTS(key1 as any, key2 as any, value1, value2, canUnspecify, strict)) ;
    }

    public inverse():TSQualifier<T> { return (this.constructor as any).NOT(this) as TSQualifier<T> ; }

    public validateValue(value:T, validateValueForCondition?:(v:T, cond:AnyDictionary) => boolean):boolean {
        let vals ;
        let op ;

        switch (this.operator) {
            case 'AND':
                for (let cond of this._operands) {
                    if (cond instanceof TSQualifier) { if (!cond.validateValue(value)) return false ; }
                    else if ($ok(validateValueForCondition)) { if (!validateValueForCondition!(value, cond)) return false ; }
                    else {
                        throw new TSError('need a validateValueForCondition() callback to interpret a specific AND condition', { value:value, condition:validateValueForCondition }) ;
                    }
                }
                return true ;
            case 'OR': 
                for (let cond of this._operands) {
                    if (cond instanceof TSQualifier) { if (cond.validateValue(value)) return true ; }
                    else if ($ok(validateValueForCondition)) { if (validateValueForCondition!(value, cond)) return true ; }
                    else {
                        throw new TSError('need a validateValueForCondition() callback to interpret a specific OR condition', { value:value, condition:validateValueForCondition }) ;
                    }
                }
                return false ;
            case 'NOT':
                const cond = this._operands[0] ;
                if (cond instanceof TSQualifier) { return !cond.validateValue(value) ; }
                else if ($ok(validateValueForCondition)) { return !validateValueForCondition!(value, cond) ; }
                throw new TSError('need a validateValueForCondition() callback to interpret a specific NOT condition', { value:value, condition:validateValueForCondition }) ;
            case 'OK':
                return _valuesForKeyPath(value, this._operands[0]).length > 0 ;
            case 'KO':
                return _valuesForKeyPath(value, this._operands[0]).length === 0 ;
            case 'EQ':
                vals = _valuesForKeyPath(value, this._operands[0]) ;
                op = this._operands[1] ;
                for (let v of vals) { if ($equal(v, op)) return true ; } ; return false ;
            case 'NEQ':
                vals = _valuesForKeyPath(value, this._operands[0]) ;
                op = this._operands[1] ;
                for (let v of vals) { if (!$equal(v, op)) return true ; } ; return false ;
            case 'LT': 
                vals = _valuesForKeyPath(value, this._operands[0]) ;
                op = this._operands[1] ;
                for (let v of vals) { if ($compare(v, op) === Ascending) return true ; } ; return false ;
            case 'LTE':
                vals = _valuesForKeyPath(value, this._operands[0]) ;
                op = this._operands[1] ;
                for (let v of vals) {
                    const comp = $compare(v, op) ;
                    if (comp === Same || comp === Ascending) return true ;
                }
                return false ;
            case 'GT':
                vals = _valuesForKeyPath(value, this._operands[0]) ;
                op = this._operands[1] ;
                for (let v of vals) { if ($compare(v, op) === Descending) return true ; } ; return false ;
            case 'GTE':
                vals = _valuesForKeyPath(value, this._operands[0]) ;
                op = this._operands[1] ;
                for (let v of vals) {
                    const comp = $compare(v, op) ;
                    if (comp === Same || comp === Descending) return true ;
                }
                return false ;
            case 'LIKE':
                vals = _valuesForKeyPath(value, this._operands[0]) ;
                op = this._operands[1] ;
                for (let v of vals) { if ($sqllike(v, op)) return true ; } ; return false ;
            case 'IN':
                vals = _valuesForKeyPath(value, this._operands[0]) ;
                op = this._operands[1] ;
                for (let v of vals) { for (let e of op) { if ($equal(e,v)) return true ; } } ;
                return false ;
            case 'NIN':
                vals = _valuesForKeyPath(value, this._operands[0]) ;
                op = this._operands[1] ;
                for (let v of vals) { for (let e of op) { if ($equal(e,v)) return false ; } } ;                
                return true ;
        }       
    }

    public filterValues(values:Nullable<Iterable<T>>):Array<T> {
        const ret:Array<T> = []
        if ($ok(values)) { for (let v of values!) { if (this.validateValue(v)) { ret.push(v) ; }}}
        return ret ;
    }

    private _add(method:string,qualifier:TSQualifier<T>):TSQualifier<T> { 
        this._assertAndOr(method.length ? method : '_add') ; 
        if (qualifier.operator === this.operator) {
            this._operands = [...this._operands, ...qualifier._operands] ;
        }
        else { this._operands.push(qualifier) ; } 
        return this ; 
    }

    private _assertAndOr(method:string) {
        if (this.operator !== 'OR' && this.operator !== 'AND') {
            throw new TSError(`TSQualifier.${method}(): trying to add condition on ${this.operator} qualifier`, {
                
            }) ;
        }
    }
}

export function $valuesForKeyPath<T>(v:any, path:KeyPath<T>):Nullable<any[]> { return $ok(v) ? _valuesForKeyPath(v, _split(path)) : v ; }

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


String.prototype.sqlLike = function sqlLike(this:string, like:string) { 
    if (!$ok(like)) { return false ; }
    like = like!.replace(new RegExp("([\\.\\\\\\+\\*\\?\\[\\^\\]\\$\\(\\)\\{\\}\\=\\!\\<\\>\\|\\:\\-])", "g"), "\\$1");
    like = like.replace(/%/g, '.*').replace(/_/g, '.');
    return RegExp('^' + like + '$', 'gi').test(this);
}
Array.prototype.filterWithQualifier = function filterWithQualifier<T>(this: T[], qual:TSQualifier<T>):Array<T> { return qual.filterValues(this) ; }

export function $sqllike(a:any, b:string) {
    if (!$ok(a)) return false ;
    return $isstring(a) ? a.sqlLike(b) : `${a}`.sqlLike(b) ; // if a as no specific toString() method, this will return inconsistent result
}
