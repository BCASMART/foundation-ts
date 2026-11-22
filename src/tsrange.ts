import { $count, $hasproperties, $isarray, $isint, $isnumber, $isunsigned, $json, $ok, $toint, $tounsigned } from "./commons";
import { TSDate } from "./tsdate";
import { Ascending, Comparison, Descending, Nullable, Same } from "./types";
import { TSClone, TSLeafInspect, TSObject } from "./tsobject";
import { TSRangeSet } from "./tsrangeset";
import { TSError } from "./tserrors";

export interface Interval {
	range:TSRange ;
	hasSignificantRange:boolean ;
    isValid:boolean ;
    isEmpty:boolean ;
}

const customInspectSymbol = Symbol.for('nodejs.util.inspect.custom') ;

export function TSBadRange():TSRange { return new TSRange(Number.NaN, 0) ; }
export function TSEmptyRange():TSRange { return new TSRange(0, 0) ; }

export class TSRange implements TSObject, TSLeafInspect, TSClone<TSRange>, Interval {
	private _location:number = 0 ;
	private _length:number = 0 ;

	public constructor(range:TSRange) ;
    public constructor(array:number[]) ;
	public constructor(interval:Interval) ;
	public constructor(loc:number, len:number)  ;
	public constructor(startingDate:TSDate, endingDate:TSDate)
	public constructor() {
		const n = arguments.length ;
		if (n === 0) { TSError.throw('TSRange.constructor(): no arguments provided') ; }
		switch (n) {
			case 1:
				this._initWithOneArgument(arguments[0], Array.from(arguments)) ;
				break ;
			case 2:
				this._initWithTwoArguments(arguments[0], arguments[1], Array.from(arguments)) ;
				break ;
			default:
                TSError.throw('TSRange.constructor(): more than two arguments were provided', { arguments:Array.from(arguments)}) ;
		}
	}

    // a TSRange, a [location, length] array or an Interval
    private _initWithOneArgument(arg:any, args:any[]) {
        if ($isnumber(arg)) {
            TSError.throw('TSRange.constructor(): only location is provided', { arguments:args }) ;
        }
        let v:TSRange|undefined = undefined ;
        if (arg instanceof TSRange) {
            v = arg as TSRange ;
        }
        else if ($isarray(arg)) {
            if (!$israngearray(arg)) {
                TSError.throw('TSRange.constructor(): bad provided range array', { arguments:args }) ;
            }
            this._location = arg[0] ;
            this._length = arg[1] ;
            return ;
        }
        else if ($comformsToInterval(arg)) {
            const a = arg as Interval ;
            if (!a.hasSignificantRange) {
                this._location = Number.NaN ;
                this._length = 0 ;
                return ;
            }
            v = a.range ;
        }
        if (!$ok(v) || !$isint(v!.location) || !$isunsigned(v!.length) || !$isint(v!.location + v!.length)) {
            TSError.throw('TSRange.constructor(): range or interval provided is too large', { arguments:args }) ;
        }
        this._location = v!.location ;
        this._length = v!.length ;
    }

    // 2 dates or a location and a length
    private _initWithTwoArguments(a0:any, a1:any, args:any[]) {
        if ((a0 instanceof TSDate) && (a1 instanceof TSDate)) {
            // our TSDate range is always in minutes
            const s = a0.timestamp ;
            const e = a1.timestamp ;
            if (!$isint(s) || !$isint(e) || e < s) {
                TSError.throw('TSRange.constructor(): second provided date is anterior to the first one', { arguments:args }) ;
            }
            this._location = s ;
            this._length = e - s ;
        }
        else if (Number.isNaN(Number(a0)) || Number.isNaN(Number(a1))) {
            this._location = Number.NaN ;
            this._length = 0 ;
        }
        else if ($isint(a0) && $isunsigned(a1) && $isint(a0+a1)) {
            this._location = $toint(a0) ;
            this._length = $tounsigned(a1) ;
        }
        else {
            TSError.throw('TSRange.constructor(): Bad parameters', { arguments:args }) ;
        }
    }

    public static make(loc:number, len:number):TSRange { return new TSRange(loc, len) ; }
    public static fromArray(a:Nullable<number[]>):TSRange | null {
        return $israngearray(a) ? new TSRange(a![0], a![1]) : null ;
    }

    public clone():TSRange { return new TSRange(this) ; }

	public get location():number { return this._location ; }
	public set location(loc:number) {
        if (Number.isNaN(loc)) {
            this._location = Number.NaN ;
            this._length = 0 ;
        }
        else {
            if (!$isint(loc) || !$isint(loc + this._length)) { 
                TSError.throw(`TSRange.location = ${loc} with bad parameter`, { range:this, location:loc }) ;
            }
            this._location = $toint(loc) ;    
        }
	}
	
	public get length():number { return this._length ; }
	public set length(len:number) {
        if (Number.isNaN(len)) {
            this._location = Number.NaN ;
            this._length = 0 ;
        }
        else {
            if (!$isunsigned(len) || !$isint(len + this._location)) { 
                TSError.throw(`TSRange.length = ${len} with bad parameter`, { range:this, length:len }) ;
            }
            this._length = $tounsigned(len) ;    
        }
	}

	public get isValid():boolean { return !Number.isNaN(this._location) ; }
	public get isEmpty():boolean { return this._length === 0 ; }
	public get maxRange():number { return Number.isNaN(this._location) ? Number.NaN : this._location + this._length ; }

	// Interval meta conformance
	public get range():this { return this }
	public get hasSignificantRange():boolean { return this.isValid && !this.isEmpty ; }

	public contains(other:TSRange|number):boolean {
		if (!this.isValid || this.isEmpty) { return false ; }
		if (other instanceof TSRange) {
			return this.containsLocation(other.location) && (other.isEmpty || this.containsLocation(other.location+other.length-1)) ;
		}
		return this.containsLocation(other) ;
	}

	public intersects(other:TSRange):boolean {
		return this.isValid && other.isValid && !this.isEmpty && !other.isEmpty && 
		(this.containsLocation(other.location) || other.containsLocation(this.location)) ;
	}

	public containedIn(other:TSRange) { return other.contains(this) ; }

	public unionRange(other:TSRange):TSRange {
		if (!this.isValid || !other.isValid) { return TSBadRange() ; }
		// empty ranges take part with their location, even when both are empty (it used to give [0, 0[)
		const loc = Math.min(this.location, other.location) ;
		return new TSRange(loc, Math.max(this.maxRange, other.maxRange) - loc) ;
	}

	public intersectionRange(other:TSRange):TSRange {
		if (!this.isValid || !other.isValid) { return TSBadRange() ; }
		// disjoint ranges have no intersection location: a bad range (it used to be the empty range [0,0[).
		// Touching ranges give an empty range at their common location ([0,5[ ∩ [5,10[ = [5,5[)
		if (this.maxRange < other.location || other.maxRange < this.location) { return TSBadRange() ; }
		const loc = Math.max(this.location, other.location) ;
		return new TSRange(loc, Math.min(this.maxRange, other.maxRange) - loc) ;
	}

	public containsLocation(loc:number) : boolean { 
		if (!$isnumber(loc) || !this.isValid || this.isEmpty) { return false ; }
		return loc >= this._location && loc < this.maxRange ;
	}

	// the ranges intersect or touch, or one of them is an empty range (a location) inside the other one:
	// their intersection is not a bad range and their union has no gap
	// (an empty range strictly inside the other one used to be not continuous with it)
	public continuousWith(other:TSRange) : boolean {
		return this.isValid && other.isValid && !(this.maxRange < other.location || other.maxRange < this.location) ;
	}

    // ============ TSLeafInspect conformance =============== 
    public leafInspect(): string { return `[${this.location}, ${this.length}]` ; }

    // @ts-ignore
    [customInspectSymbol](depth:number, inspectOptions:any, inspect:any) {
        return this.leafInspect()
    }
    
	// ============ TSObject conformance =============== 

	public isEqual(other:any) : boolean { 
		return this === other || (other instanceof TSRange && ((!this.isValid && !other.isValid) || other.location === this._location) && other.length === this._length) ;
    }
    public compare(other:any) : Comparison {
        if (this.isEqual(other)) { return Same ; }
        if ((other instanceof TSRange || other instanceof TSRangeSet) && this.hasSignificantRange && other.hasSignificantRange) {
            if (this.location >= other.maxRange) { return Descending ; }
            if (other.location >= this.maxRange) { return Ascending ;}
        }
        return undefined ;
    }
	public toJSON():{location:number, length:number} { return {location:this._location, length:this._length} ; }
	public toString():string { return $json(this) ; }
	public toArray():any[] { return [this] ; }
}

export function $israngeparams(loc:number, len:number)
{ return $isint(loc) && $isunsigned(len) && $isint(loc + len) ; }

export function $israngearray(v:Nullable<number[]>):boolean
{ return $count(v) === 2 && $israngeparams(v![0], v![1]) ; }

const LocalIntervalProperties = ['range', 'hasSignificantRange', 'isValid', 'isEmpty'] ;
export function $comformsToInterval(v:any):boolean
{ return $hasproperties(v, LocalIntervalProperties) ; }

  