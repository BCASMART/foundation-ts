import { $isarray, $isnumber, $isobject, $isstring, $ok } from "./commons";
import { $numcompare } from "./compare";
import { TSClone, TSObject } from "./tsobject";
import { Ascending, Comparison, Descending, Nullable, Same } from "./types";

export interface TSPoint {
    x:number ;
    y:number ;
}

export interface TSSize {
    w:number ;
    h:number ;
}

export enum TSRectEdge {
  TSMinXEdge = 0,
  TSMinYEdge = 1,
  TSMaxXEdge = 2,
  TSMaxYEdge = 3
} ;

export type TSDocumentFormat = 'min' | 'max' |
                              'letter' | 'legal' | 'tabloid' | 
                              'a0' | 'a1' | 'a2' | 'a3' | 'a4' | 'a5' | 'a6' | 
                              'letter-landscape' | 'legal-landscape' | 'tabloid-landscape' | 'a0-landscape' | 
                              'a1-landscape' | 'a2-landscape' | 'a3-landscape' | 'a4-landscape' | 'a5-landscape' | 'a6-landscape' ;

export const  TSDocumentFormats:{[key in TSDocumentFormat]:TSSize} = {
    max:                 { w:TSmm2Pixels(1200),    h:TSmm2Pixels(1200) },
    min:                 { w:TSmm2Pixels(100),     h:TSmm2Pixels(100) },
    letter:              { w:TSInches2Pixels(8.5), h:TSInches2Pixels(11) },
    legal:               { w:TSInches2Pixels(8.5), h:TSInches2Pixels(14) },
    tabloid:             { w:TSInches2Pixels(11),  h:TSInches2Pixels(17) },
    a0:                  { w:TSmm2Pixels(841),     h:TSmm2Pixels(1189) },
    a1:                  { w:TSmm2Pixels(594),     h:TSmm2Pixels(841)  },
    a2:                  { w:TSmm2Pixels(420),     h:TSmm2Pixels(594)  },
    a3:                  { w:TSmm2Pixels(297),     h:TSmm2Pixels(420)  },
    a4:                  { w:TSmm2Pixels(210),     h:TSmm2Pixels(297)  },
    a5:                  { w:TSmm2Pixels(148),     h:TSmm2Pixels(210)  },
    a6:                  { w:TSmm2Pixels(105),     h:TSmm2Pixels(148)  },
    'letter-landscape':  { w:TSInches2Pixels(11),  h:TSInches2Pixels(8.5) },
    'legal-landscape':   { w:TSInches2Pixels(14),  h:TSInches2Pixels(8.5) },
    'tabloid-landscape': { w:TSInches2Pixels(17),  h:TSInches2Pixels(11) },
    'a0-landscape':      { w:TSmm2Pixels(1189),    h:TSmm2Pixels(841) },
    'a1-landscape':      { w:TSmm2Pixels(841),     h:TSmm2Pixels(594)  },
    'a2-landscape':      { w:TSmm2Pixels(594),     h:TSmm2Pixels(420)  },
    'a3-landscape':      { w:TSmm2Pixels(420),     h:TSmm2Pixels(297)  },
    'a4-landscape':      { w:TSmm2Pixels(297),     h:TSmm2Pixels(210)  },
    'a5-landscape':      { w:TSmm2Pixels(210),     h:TSmm2Pixels(148)  },
    'a6-landscape':      { w:TSmm2Pixels(148),     h:TSmm2Pixels(105)  }
} ;

export class TSRect implements TSPoint, TSSize, TSObject, TSClone<TSRect> {
    public x:number ;
    public y:number ;
    public w:number ;
    public h:number ;

	public constructor() ;
	public constructor(rect:TSRect) ;
    public constructor(format:TSDocumentFormat) ;
    public constructor(arrayRect:number[]) ;
    public constructor(x:number, y:number, w:number, h:number) ;
	public constructor(origin:TSPoint, w:number, h:number) ;
    public constructor(x:number, y:number, size:TSSize|TSDocumentFormat) ;
	public constructor(origin:TSPoint, size:TSSize|TSDocumentFormat) ;
	public constructor() {
		const n = arguments.length ;
        switch (n) {
			case 0:
                this.x = this.y = this.w = this.h = 0 ;
                break ;
            case 1:{
                if ($isstring(arguments[0])) {
                    const size = TSDocumentFormats[arguments[0] as TSDocumentFormat] ;
                    if ($ok(size)) {
                        this.x = this.y = 0 ;
                        this.w = size!.w ; this.h = size!.h ;
                    }
                    else {
                        throw 'Bad TSRect() constructor: bad document format' ;
                    }
                }
                else if ($isarray(arguments[0])) {
                    const a = arguments[0] as Array<number> ;
                    if (a.length === 4 && $isnumber(a[0]) && $isnumber(a[1]) && $isnumber(a[2]) && $isnumber(a[3]) && a[2] >= 0 && a[3] >= 0) {
                        this.x = a[0] ; this.y = a[1] ;
                        this.w = a[2] ; this.h = a[3] ;
                    }
                    else {
                        throw 'Bad TSRect() constructor: bad rect definition array' ;
                    }
                }
                else if ((arguments[0] instanceof TSRect)) {
                    const r = arguments[0] as TSRect ;
                    const x = r.minX ; const y = r.minY ;
                    const w = r.width ; const h = r.height ;
                    if ($isnumber(x) && $isnumber(y) && $isnumber(w) && $isnumber(h) && w >= 0 && h >= 0) {
                        this.x = x ; this.y = y ;
                        this.w = w ; this.h = h ;    
                    }
                    else {
                        throw 'Bad TSRect() constructor: bad TSRect parameter' ;
                    }
                }
                else {
					throw 'Bad TSRect() constructor: should have a TSRect or a document format parameter' ;
                }
                break ;
            }
            case 2:
                if ($isobject(arguments[0]) && ('x' in arguments[0]) && ('y' in arguments[0])) {
                    const size = $isstring(arguments[1]) ? TSDocumentFormats[arguments[1] as TSDocumentFormat] : arguments[1] as TSSize ;
                    if ($isobject(size) && ('w' in size) && ('h' in size) && $isnumber(size.w) && $isnumber(size.h) && size.w >= 0 && size.h >= 0) {
                        this.x = (arguments[0] as TSPoint).x ;
                        this.y = (arguments[0] as TSPoint).y ;
                        this.w = (size as TSSize).w ;
                        this.h = (size as TSSize).h ;
                    }
                    else {
                        throw 'Bad TSRect() constructor: bad TSSize parameter' ;
                    }
                }
                else {
					throw 'Bad TSRect() constructor: bad TSPoint as origin parameter' ;
                }
                break ;
            case 3:
                if ($isnumber(arguments[0]) && $isnumber(arguments[1]) && 
                    (($isobject(arguments[2]) && ('w' in arguments[2]) && ('h' in arguments[2])) || $isstring(arguments[2]))) {
                    const size = $isstring(arguments[2]) ? TSDocumentFormats[arguments[2] as TSDocumentFormat] : arguments[2] as TSSize ;
                    if ($ok(size) && $isnumber(size.w) && $isnumber(size.h) && size.w >= 0 && size.h >= 0) {
                        this.x = arguments[0] as number ;
                        this.y = arguments[1] as number ;
                        this.w = (size as TSSize).w ;
                        this.h = (size as TSSize).h ;
                    }
                    else {
                        throw 'Bad TSRect() constructor: bad TSSize parameter' ;
                    }
                }
                else if ($isobject(arguments[0]) && ('x' in arguments[0]) && ('y' in arguments[0]) && 
                         $isnumber(arguments[1]) && $isnumber(arguments[2]) && arguments[1] >= 0 && arguments[2] >= 0) {
                    const origin = (arguments[0] as TSPoint) ;
                    if ($isnumber(origin.x) && $isnumber(origin.y)) {
                        this.x = origin.x ;
                        this.y = origin.y ;
                        this.w = arguments[1] as number ;
                        this.h = arguments[2] as number ;        
                    }
                    else {
                        throw 'Bad TSRect() constructor: bad TSPoint origin parameter' ;
                    }
                }
                else {
					throw 'Bad TSRect() constructor: bad TSPoint, TSSize or number parameter' ;
                }
                break ;
            case 4:
                if (!$isnumber(arguments[0]) || !$isnumber(arguments[1]) || 
                    !$isnumber(arguments[2]) || !$isnumber(arguments[3]) || 
                    arguments[2] < 0 || arguments[3] < 0) {
					throw 'Bad TSRect() constructor: bad number parameter' ;
                }
                this.x = arguments[0] as number ;
                this.y = arguments[1] as number ;
                this.w = arguments[2] as number ;
                this.h = arguments[3] as number ;
                break ;

            default:
                throw 'Bad TSRect() constructor : too much arguments' ;
        }
    }

    public get origin():TSPoint { return { x:this.minX, y:this.minY } ; }
    public get size():TSSize    { return { w:this.width, h:this.height } ; }
    public get width():number   { return this.maxX - this.minX ; }
    public get height():number  { return this.maxY - this.minY ; }

    public get minX():number    { return this.x ; }
    public get minY():number    { return this.y ; }
    public get maxX():number    { return this.x + this.w ; }
    public get maxY():number    { return this.y + this.h ; }

    public get midX():number    { return this.x + this.w/2 ; }
    public get midY():number    { return this.y + this.h/2 ; }

    public get isEmpty():boolean  { return this.w > 0 && this.h > 0 ? false : true ; }

    public contains(p:Nullable<TSPoint|TSRect|number[]>):boolean {
        if (p instanceof TSRect) {
            const r = p as TSRect ;
            return !r.isEmpty && this.minX <= r.minX && this.minY <= r.minY && this.maxX >= r.maxX && this.maxY >= r.maxY ;
        }
        if ($isarray(p)) {
            const a = p as number[] ;
            if ((a.length === 2 || a.length === 4) && $isnumber(a[0]) && $isnumber(a[1]) && (a.length === 2 || ($isnumber(a[2]) && $isnumber(a[3]) && a[2] >= 0 && a[3]>=0))) {
                return a.length === 2 ? this.contains({x:a[0], y:a[1]}) : this.contains(new TSRect(a[0], a[1], a[2], a[3]))
            }
            return false ;
        }
        return $isobject(p) && ('x' in p!) && ('y' in p!) ? p!.x >= this.minX && p!.x <= this.maxX && p!.y >= this.minY && p!.y <= this.maxY : false ;
    }

    public containsPoint(p:Nullable<TSPoint|number[]>):boolean {
        if ($isarray(p) && (p as number[]).length !== 2) { return false ; }
        return this.contains(p) ;
    }

    public containsRect(p:Nullable<TSRect|number[]>):boolean {
        if ($isarray(p) && (p as number[]).length !== 4) { return false ; }
        return this.contains(p) ;
    }

    public containedIn(r:Nullable<TSRect|number[]>):boolean {
        if (!$ok(r)) { return false ; }
        try { r = $isarray(r) ? new TSRect(r as number[]) : r as TSRect ; }
        catch { return false ; }

        return r.contains(this) ;
    }
    public containedInRect(r:Nullable<TSRect|number[]>):boolean { return this.containedIn(r) ; }

    public intersects(r:Nullable<TSRect|number[]>):boolean {
        if (!$ok(r)) { return false ; }

        try { r = $isarray(r) ? new TSRect(r as number[]) : r as TSRect ; }
        catch { return false ; }

        return this.maxX <= r.minX || r.maxX <= this.minX || this.maxY <= r.minY || r.maxY <= this.minY || this.isEmpty || r.isEmpty ? false : true ;
    }
    public intersectsRect(r:Nullable<TSRect|number[]>):boolean { return this.intersects(r) ; }

    public intersection(r:Nullable<TSRect|number[]>):TSRect {
        let rect = new TSRect() ;
        if (!$ok(r)) { return rect ; }
        try { r = $isarray(r) ? new TSRect(r as number[]) : r as TSRect ; }
        catch { return rect ; }

        if (this.maxX <= r.minX || r.maxX <= this.minX || this.maxY <= r.minY || r.maxY <= this.minY) {
            return rect ;
        }

        rect.x = Math.max(this.minX, r.minX) ;
        rect.y = Math.max(this.minY, r.minY) ;
        rect.w = Math.min(this.maxX, r.maxX) - rect.x ;
        rect.h = Math.min(this.maxY, r.maxY) - rect.y ;

        return rect ;
    }
    public intersectionRect(r:Nullable<TSRect|number[]>):TSRect { return this.intersection(r) ; }

    public union(r:Nullable<TSRect|number[]>):TSRect {
        if (!$ok(r))      { return this.clone() ; }
        r = $isarray(r) ? new TSRect(r as number[]) : r as TSRect ;

        if (this.isEmpty) { return r.clone() ; } // r may be empty here. We clone it anyway.
        if (r.isEmpty)    { return this.clone() ; }

        let rect = new TSRect() ;

        rect.x = Math.min(this.minX, r.minX) ;
        rect.y = Math.min(this.minY, r.minY) ;
        rect.w = Math.max(this.maxX, r.maxX) - rect.x ;
        rect.h = Math.max(this.maxY, r.maxY) - rect.y ;

        return rect ;
    }
    public unionRect(r:Nullable<TSRect|number[]>):TSRect { return this.union(r) ; }

    public offset(dx:number, dy:number):TSRect {
        if (!$isnumber(dx) || !$isnumber(dy)) { throw 'Invalid offser' ; }
        return new TSRect(this.minX+dx, this.minY+dy, this.width, this.height) ;
    }
    public offsetRect(dx:number, dy:number):TSRect { return this.offset(dx, dy) ; }

    public inset(dw:number, dh:number):TSRect {
        if (!$isnumber(dw) || !$isnumber(dh)) { throw 'Invalid inset' ; }
        return new TSRect(this.minX-dw, this.minY-dh, this.width + dw*2, this.height + dh*2) ;
    }
    public insetRect(dw:number, dh:number):TSRect { return this.inset(dw, dh) ; }

    public integral():TSRect {
        let rect = new TSRect() ;
        rect.x = Math.floor(this.minX) ;
        rect.y = Math.floor(this.minY) ;

        if (this.isEmpty) { return rect ; }
        rect.w = Math.ceil(this.maxX) - rect.x ;
        rect.h = Math.ceil(this.maxY) - rect.y ;
        
        return rect ;
    }
    public integralRect():TSRect { return this.integral() ; }

    /**
     * 
     * @param amount the part of widh or height we keep for the slice
     * @param edge on which edge do we decide to divide our rect
     * @returns a tupple with first the slice we want and second the remainding part of the rect
     */
    public divide(amount:number, edge:TSRectEdge):[TSRect,TSRect] {
        const x = this.minX ;
        const y = this.minY ;
        const w = this.width ;
        const h = this.height ;

        if (amount === Number.POSITIVE_INFINITY) { amount = Math.max(w,h) ; }
        if (!$isnumber(amount) || amount < 0) { amount = 0 ; }

        switch (edge) {
            case TSRectEdge.TSMinXEdge:
                return amount > w ? 
                       [new TSRect(x,y,w,h), new TSRect(this.maxX, y, 0, h)] :
                       [new TSRect(x, y, amount, h), new TSRect(x+amount, y, w-amount, h)] ; 
            case TSRectEdge.TSMinYEdge:
                return amount > h ?
                       [new TSRect(x,y,w,h), new TSRect(x, this.maxY, w, 0)] :
                       [new TSRect(x, y, w, amount), new TSRect(x, y+amount, w, h-amount)] ;
            case TSRectEdge.TSMaxXEdge:
                return amount > w ?
                       [new TSRect(x,y,w,h), new TSRect(x, y, 0, h)] :
                       [new TSRect(this.maxX-amount, y, amount, h), new TSRect(x, y, w-amount, h)] ;
            case TSRectEdge.TSMaxYEdge:
                return amount > h ?
                       [new TSRect(x,y,w,h), new TSRect(x, y, w, 0)] :
                       [new TSRect(x, this.maxY-amount, w, amount), new TSRect(x, y, w, h - amount)] ;
            default:
                // we should never be here, but ...
                throw 'TSRect.divide() : bad edge parameter' ;
        }
    }
    public divideRect(amount:number, edge:TSRectEdge):[TSRect,TSRect] { return this.divide(amount, edge) ; }

    public clone():TSRect {
        return new TSRect(this.minX, this.minY, this.width, this.height) ; 
    }
   
    // this method returns 5 points
    public closedPolygon(updatesYCoordinatesfirst:boolean = false):TSPoint[] {
        const x1 = this.minX, y1 = this.minY, x2 = this.maxX, y2 = this.maxY ;
        return updatesYCoordinatesfirst ?
            [{x:x1,y:y1}, {x:x1, y:y2}, {x:x2, y:y2}, {x:x2, y:y1}, {x:x1, y:y1}] :
            [{x:x1,y:y1}, {x:x2, y:y1}, {x:x2, y:y2}, {x:x1, y:y2}, {x:x1, y:y1}] ;
    }
    // ============ TSObject conformance =============== 

    public isEqual(other:any) : boolean 
    { return this === other || (other instanceof TSRect && other.minX === this.minX && other.maxX === this.maxX && other.minY === this.minY && other.maxY === this.maxY) ; }

    public compare(other:any):Comparison {
        if (other === this) { return Same ; }
        if (!(other instanceof TSRect)) { return undefined ; }

        const area = this.width * this.height ;
        const otherArea = other.width * other.height ;

        if (area === otherArea) {
            const aX = this.minX ; const aY = this.minY ;
            const bX = other.minX ; const bY = other.minY ;
            if (aX === bX) { return aY < bY ? Ascending : (aY > bY ? Descending : Same) ; }
            if (aY === other.y) { return aX < bX ? Ascending : Descending ; }
            if (aX < bX && aY < bY) { return Ascending ; }
            if (aX > bX && aY > bY) { return Descending ; }
            return undefined ; // same area but origins are not comparable
        }
        return area < otherArea ? Ascending : Descending ;
    }

    public toJSON():object { 
        return { x:this.minX, y:this.minY, w:this.width, h:this.height } ; 
    }
    public toString(): string { 
        return `{x = ${this.minX}, y = ${this.minY}), w:${this.width}, h:${this.height}}` ; 
    }

    // warning : dont use generated array to create new Rect because we did send the oposite points here
    // QUESTION: should we return [x,y,w,h] here ? 
    public toArray(): number[] { return [this.minX, this.minY, this.maxX, this.maxY] ; }
}


export function TSmm2Pixels(mm:number):number { return mm * 45 / 16 ; }
export function TScm2Pixels(cm:number):number { return cm * 225 / 8 ; }

export function TSPixels2cm(pixels:number):number { return pixels * 8 / 225 ; }
export function TSPixels2mm(pixels:number):number { return pixels * 16 / 45 ; }

export function TSInches2Pixels(inches:number):number { return inches * 72 ; }
export function TSPixels2Inches(pixels:number):number { return pixels / 72 ; }

export function TSEqualPoints(A:TSPoint, B:TSPoint):boolean { return A.x === B.x && A.y === B.y ; }

export function TSEqualSizes(A:TSSize, B:TSSize):boolean { return A.w === B.w && A.h === B.h ; }
export function TSArea(A:TSSize):number { return A.w * A.h ; }
export function TSValidSize(A:Nullable<TSSize>):boolean { return $ok(A) && A!.w >=0 && A!.h >= 0 ; }
export function TSCompareSizes(A:TSSize, B:TSSize):Comparison { return $numcompare(TSArea(A), TSArea(B)) ; }

export interface TSAssertFormatOptions {
    defaultSize?:TSSize,
    minimalSize?:TSSize,
    maximalSize?:TSSize,
    invalidSizeRaise?:boolean,
    undersizeRaise?:boolean,
    oversizeRaise?:boolean
} ;

export function TSAssertFormat(format:Nullable<TSDocumentFormat|TSSize>, opts:TSAssertFormatOptions={}):TSSize 
{
    const size:Nullable<TSSize> = $isstring(format) ? TSDocumentFormats[format as TSDocumentFormat] : format as Nullable<TSSize> ;
    
    const defaultSize = TSValidSize(opts.defaultSize) ? opts.defaultSize! : TSDocumentFormats.a4 ;
    if (!TSValidSize(size)) { 
        if (opts.invalidSizeRaise) { throw 'TSAssertFormat(): invalid format.' ;} 
        return defaultSize ; 
    }

    const min = TSValidSize(opts.minimalSize) ? opts.minimalSize! : TSDocumentFormats.min ;
    if (size!.w < min.w || size!.h < min.h) { 
        if (opts.oversizeRaise) { throw 'TSAssertFormat(): format too small.' ;} 
        return min ;
    }

    const max = TSValidSize(opts.maximalSize) ? opts.maximalSize! : TSDocumentFormats.max ;
    if (size!.w > max.w || size!.h > max.h) {
        if (opts.oversizeRaise) { throw 'TSAssertFormat(): format too large.' ;} 
        return max ; 
    }

    return size!
}

export const TSCM = TScm2Pixels(1) ;
export const TSMM = TSmm2Pixels(1) ;
export const TSIN = TSInches2Pixels(1) ;
