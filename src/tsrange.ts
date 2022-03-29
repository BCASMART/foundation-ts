import { $count, $int, $isarray, $isint, $isnumber, $isobject, $isunsigned, $json, $ok, $unsigned } from "./commons";
import { TSDate } from "./tsdate";
import { Ascending, Comparison, Descending, Same, UINT32_MAX } from "./types";
import { Class, TSObject } from "./tsobject";
import { TSRangeSet } from "./tsrangeset";

export interface Interval {
	range:TSRange ;
	hasSignificantRange:boolean ;
}

export class TSRange implements TSObject<TSRange>, Interval {
	private _location:number = 0 ;
	private _length:number = 0 ;

	public constructor(range:TSRange) ;
    public constructor(array:number[]) ;
	public constructor(interval:Interval) ;
	public constructor(loc:number, len:number)  ;
	public constructor(startingDate:TSDate, endingDate:TSDate)
	public constructor() {
		const n = arguments.length ;
		switch (n) {
			case 0:
				throw 'Bad TSRange() constructor: no arguments provided' ;
			case 1:
				if ($isnumber(arguments[0])) {
					throw 'Bad TSRange() constructor: only location is provided' ;
				}
				let v:TSRange|undefined = undefined ;
				if (arguments[0] instanceof TSRange) {
					v = arguments[0] as TSRange ;
				}
                else if ($isarray(arguments[0])) {
                    const a = arguments[0] as number[] ;
                    if (!$israngearray(a)) {
                        throw 'Bad TSRange() constructor: non conforme range array' ;
                    }
                    this._location = a[0] ;
                    this._length = a[1] ;
                    break ;
                }
				else if ($comformsToInterval(arguments[0])) {
					const a = arguments[0] as Interval ;
					if (!a.hasSignificantRange) { 
						this._location = NaN ;
						this._length = 0 ;
						break ;
					}
					v = a.range ;
				}
                if (!$ok(v) || !$isint(v!.location) || !$isunsigned(v!.length) || !$isint(v!.location + v!.length)) {
					throw 'Bad TSRange() constructor: range or interval provided too large' ;
                }
				this._location = v!.location ;
				this._length = v!.length ;
				break ;
			case 2:
				if ((arguments[0] instanceof TSDate) && (arguments[1] instanceof TSDate)) {
					// our TSDate range is always in minutes
					let s = (arguments[0] as TSDate).timestamp ;
					let e = (arguments[1] as TSDate).timestamp ;
                    if ($isint(s) && $isint(e) && e >= s) {
						this._location = s ;
						this._length = e - s ; 
					}
					else {
						throw 'Bad TSRange() constructor: second date is anterior to the first one' ;
					}
				}
                else if (isNaN(arguments[0]) || isNaN(arguments[1])) {
                    this._location = NaN ;
                    this._length = 0 ;
                }
				else if ($isint(arguments[0]) && $isunsigned(arguments[1]) && $isint(arguments[0]+arguments[1])) {
                    this._location = $int(arguments[0]) ;
					this._length = $unsigned(arguments[1]) ;		
				}
				else {
					throw 'Bad TSRange() constructor: should have 2 valid and in range TSDate or numbers' ;
				}
				break ;
			default:
				throw 'Bad TSRange() constructor: more than 2 arguments provided' ;
		}
	}
    
    public static make(loc:number, len:number):TSRange { return new TSRange(loc, len) ; }
    public static fromArray(a:number[]|null|undefined):TSRange | null {
        return $israngearray(a) ? new TSRange(a![0], a![1]) : null ;
    }

    public clone():TSRange { return new TSRange(this) ; }

	public get location():number { return this._location ; }
	public set location(loc:number) {
        if (isNaN(loc)) {
            this._location = NaN ;
            this._length = 0 ;
        }
        else {
            if (!$isint(loc) || !$isint(loc + this._length)) { 
                throw `TSRange set location(${loc}) bad parameter`;
            }
            this._location = $int(loc) ;    
        }
	}
	
	public get length():number { return this._length ; }
	public set length(len:number) {
        if (isNaN(len)) {
            this._location = NaN ;
            this._length = 0 ;
        }
        else {
            if (!$isunsigned(len) || !$isint(len + this._location)) { 
                throw `TSRange set length(${len}) bad parameter`;
            }
            this._length = $unsigned(len) ;    
        }
	}

	public get isValid():boolean { return !isNaN(this._location) ; }
	public get isEmpty():boolean { return this._length === 0 ; }
	public get maxRange():number { return isNaN(this._location) ? NaN : this._location + this._length ; }

	// Interval meta conformance
	public get range():TSRange { return this }
	public get hasSignificantRange():boolean { return this.isValid && !this.isEmpty ; }

	public contains(other:TSRange|number):boolean {
		if (!this.isValid || this.isEmpty) { return false ; }
		if (other instanceof TSRange) {
			return this.containsLocation(other.location) && (other.isEmpty || this.containsLocation(other.location+other.length-1)) ;
		}
		return this.containsLocation(other as number) ;
	}

	public intersects(other:TSRange):boolean {
		return this.isValid && other.isValid && !this.isEmpty && !other.isEmpty && 
		(this.containsLocation(other.location) || other.containsLocation(this.location)) ;
	}

	public containedIn(other:TSRange) { return other.contains(this) ; }

	public unionRange(other:TSRange):TSRange {
		if (!this.isValid || !other.isValid) return TSBadRange() ;
		if (this.isEmpty && other.isEmpty) return TSEmptyRange() ;
		const loc = Math.min(this.location, other.location) ;
		return new TSRange(loc, Math.max(this.maxRange, other.maxRange) - loc) ;
	}

	public intersectionRange(other:TSRange):TSRange {
		if (!this.isValid || !other.isValid) return TSBadRange() ;
		if (this.maxRange < other.location || other.maxRange < this.location) return TSEmptyRange() ;
		const loc = Math.max(this.location, other.location) ;
		return new TSRange(loc, Math.min(this.maxRange, other.maxRange) - loc) ;
	}

	public containsLocation(loc:number) : boolean { 
		if (!$isnumber(loc) || !this.isValid || this.isEmpty) { return false ; }
		return loc >= this._location && loc < this.maxRange ;
	}

	public continuousWith(other:TSRange) : boolean {
		return this.isValid && other.isValid && 
			   (this.intersects(other) || this.maxRange === other.location || other.maxRange === this.location) ;
	}

	// ============ TSObject conformance =============== 
	public get isa():Class<TSRange> { return this.constructor as Class<TSRange> ; }
	public get className():string { return this.constructor.name ; }

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

export function $israngeparams(loc:number, len:number) {
    return $isint(loc) && $isunsigned(len) && $isint(loc + len) ;
}

export function $israngearray(v:number[]|null|undefined):boolean {
    return $count(v) === 2 && $israngeparams(v![0], v![1]) ;
}


export function $comformsToInterval(v:any):boolean {
    return $ok(v) && $isobject(v) && ('range' in (v as object)) && ('hasSignificantRange' in (v as object)) ;
}
export function TSBadRange():TSRange { return new TSRange(NaN, 0) ; }
export function TSEmptyRange():TSRange { return new TSRange(0, 0) ; }
export function TSWidestRange():TSRange { return new TSRange(0, UINT32_MAX) ; }
