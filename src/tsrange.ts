import { $isnumber, $json } from "./commons";
import { TSDate } from "./tsdate";
import { Ascending, Comparison, Descending, Same, UINT32_MAX } from "./types";
import { Class, TSObject } from "./tsobject";
import { TSRangeSet } from "./tsrangeset";

export const TSNotFound = 0xffffffff ;
export const UnsignedMask = 0xffffffff ;

export interface Interval {
	range:TSRange ;
	hasSignificantRange:boolean ;
}

export class TSRange implements TSObject<TSRange>, Interval {
	private _location:number = 0 ;
	private _length:number = 0 ;

	public constructor(range:TSRange) ;
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
				let v:TSRange ;
				if (arguments[0] instanceof TSRange) {
					v = arguments[0] as TSRange ;
				}
				else {
					const a = arguments[0] as Interval ;
					if (!a.hasSignificantRange) { 
						this._location = TSNotFound ;
						this._length = 0 ;
						break ;
					}
					v = a.range ;
				}
				this._location = v.location ;
				this._length = v.length ;
				break ;
			case 2:
				if (arguments[0] instanceof TSDate && arguments[1] instanceof TSDate) {
					// our TSDate range is always in minutes
					let s = (arguments[0] as TSDate).toRangeLocation() ;
					let e = (arguments[1] as TSDate).toRangeLocation() ;
					if (e >= s) {
						this.location = s ;
						this.length = e - s ; 
					}
					else {
						throw 'Bad TSRange() constructor: second date is anterior to the first one' ;
					}
				}
				else if ($isnumber(arguments[0]) && $isnumber(arguments[1])) {
					this.location = arguments[0] & UnsignedMask ;
					this.length = arguments[1] & UnsignedMask ;		
				}
				else {
					throw 'Bad TSRange() constructor: should have 2 TSDate or 2 numbers' ;
				}
				break ;
			default:
				throw 'Bad TSRange() constructor: more than 2 arguments provided' ;
		}
	}


	public get location():number { return this._location ; }
	public set location(loc:number) {
		if (loc < 0  || loc + this._length > UINT32_MAX) { 
			throw `TSRange set location(${loc}) bad parameter`;
		}
		this._location = loc & UnsignedMask ;
	}
	
	public get length():number { return this._length ; }
	public set length(len:number) {
		if (len < 0  || len + this._location > UINT32_MAX) { 
			throw `TSRange set length(${len}) bad parameter`;
		}
		this._length = len & UnsignedMask ;
	}

	public get isValid():boolean { return this._location !== TSNotFound ; }
	public get isEmpty():boolean { return this._length === 0 ; }
	public get maxRange():number { return this._location + this._length ; }

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
		if (!this.isValid || this.isEmpty) { return false ; }
		loc &= UnsignedMask ; 
		return loc >= this._location && loc < this.maxRange ;
	}

	public continuousWithRange(other:TSRange) : boolean {
		return this.isValid && other.isValid && 
			   (this.intersects(other) || this.maxRange === other.location || other.maxRange === this.location) ;
	}

	// ============ TSObject conformance =============== 
	public get isa():Class<TSRange> { return this.constructor as Class<TSRange> ; }
	public get className():string { return this.constructor.name ; }

	public isEqual(other:any) : boolean { 
		return this === other || (other instanceof TSRange && other.location === this._location && other.length === this._length) ;
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

export function TSBadRange():TSRange { return new TSRange(TSNotFound, 0) ; }
export function TSEmptyRange():TSRange { return new TSRange(0, 0) ; }
export function TSWidestRange():TSRange { return new TSRange(0, UINT32_MAX) ; }

