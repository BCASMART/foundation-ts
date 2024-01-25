import { $hasproperties, $isarray, $isnumber, $isstring, $ok } from "./commons";
import { $numcompare } from "./compare";
import { TSError } from "./tserrors";
import { TSClone, TSLeafInspect, TSObject } from "./tsobject";
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

const customInspectSymbol = Symbol.for('nodejs.util.inspect.custom') ;

export interface TSFrame extends TSPoint, TSSize {} // the 'interface' version of a TSRect

export class TSRect implements TSFrame, TSObject, TSLeafInspect, TSClone<TSRect> {
    // ignoring affectation warnings because setting is made in this._setInternalValues()
    // @ts-ignore
    public x:number ;
    // @ts-ignore
    public y:number ;
    // @ts-ignore
    public w:number ;
    // @ts-ignore
    public h:number ;

	public constructor() ;
	public constructor(rect:TSRect) ;
	public constructor(frame:TSFrame) ;
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
                    const s = TSDocumentFormats[arguments[0] as TSDocumentFormat] ;
                    this._setInternalValues('bad document format parameter', 0, 0, s?.w, s?.h, $ok(s)) ;
                }
                else if ($isarray(arguments[0])) {
                    const a = arguments[0] as Array<number> ;
                    this._setInternalValues('bad rect definition array parameter', a[0], a[1], a[2], a[3], a.length === 4) ;
                }
                else if ((arguments[0] instanceof TSRect)) {
                    const r = arguments[0] as TSRect ;
                    this._setInternalValues('bad TSRect parameter', r.minX, r.minY, r.width, r.height) ;
                }
                else if ($conformsToFrame(arguments[0])) {
                    const f = arguments[0] as TSFrame ;
                    this._setInternalValues('bad TSFrame parameter', f.x, f.y, f.w, f.h) ;
                }
                else {
                    TSError.throw('TSRect.constructor() : should have a TSRect, a TSFrame or a document format parameter', { arguments:Array.from(arguments)}) ;
                }
                break ;
            }
            case 2:
                if ($comformsToPoint(arguments[0])) {
                    const s = $isstring(arguments[1]) ? TSDocumentFormats[arguments[1] as TSDocumentFormat] : arguments[1] as TSSize ;
                    if ($conformsToSize(s)) {
                        const p = arguments[0] as TSPoint ;
                        this._setInternalValues('bad TSPoint+(TSSize or TSDocumentFormat) 2 parameters', p.x, p.y, s.w, s.h) ;
                    }
                    else {
                        TSError.throw('TSRect.constructor() : 2nd parameeter is not a TSSize', { arguments:Array.from(arguments)}) ;
                    }
                }
                else {
                    TSError.throw('TSRect.constructor() : 1st parameter is not a TSPoint', { arguments:Array.from(arguments)}) ;
                }
                break ;
            case 3:
                if ($isnumber(arguments[0]) && $isnumber(arguments[1]) && ($isstring(arguments[2]) || $conformsToSize(arguments[2]))) {
                    const s = $isstring(arguments[2]) ? TSDocumentFormats[arguments[2] as TSDocumentFormat] : arguments[2] as TSSize ;
                    this._setInternalValues('bad [number, number, size or format] parameters', arguments[0], arguments[1], s.w, s.h) ;
                }
                else if ($comformsToPoint(arguments[0]) && $isnumber(arguments[1]) && $isnumber(arguments[2])) {
                    const p = (arguments[0] as TSPoint) ;
                    this._setInternalValues('bad [point, number, number] parameters', p.x, p.y, arguments[1], arguments[2]) ;
                }
                else {
                    TSError.throw('TSRect.constructor() : bad TSPoint, TSSize or number parameter', { arguments:Array.from(arguments)}) ;
                }
                break ;
            case 4:
                this._setInternalValues('one or more bad number parameter', arguments[0], arguments[1], arguments[2], arguments[3]) ;
                break ;

            default:
                TSError.throw('TSRect.constructor() : too much arguments', { arguments:Array.from(arguments)}) ;
        }
    }

    public get origin():TSPoint { return { x:this.minX, y:this.minY } ; }
    public get size():TSSize    { return { w:this.width, h:this.height } ; }
    public get width():number   { return this.maxX - this.minX ; }
    public get height():number  { return this.maxY - this.minY ; }
    public get frame():TSFrame  { return { x:this.minX, y:this.minY, w:this.width, h:this.height } ; }

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
        return $comformsToPoint(p) ? (p as TSPoint).x >= this.minX && (p as TSPoint).x <= this.maxX && (p as TSPoint).y >= this.minY && (p as TSPoint).y <= this.maxY : false ;
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
    containedInRect = this.containedIn ;

    public intersects(r:Nullable<TSRect|number[]>):boolean {
        if (!$ok(r)) { return false ; }

        try { r = $isarray(r) ? new TSRect(r as number[]) : r as TSRect ; }
        catch { return false ; }

        return this.maxX <= r.minX || r.maxX <= this.minX || this.maxY <= r.minY || r.maxY <= this.minY || this.isEmpty || r.isEmpty ? false : true ;
    }
    intersectsRect = this.intersects ;

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
    intersectionRect = this.intersection ;

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
    unionRect = this.union ;

    public offset(xOffset:number, yOffset:number):TSRect {
        if (!$isnumber(xOffset) || !$isnumber(yOffset)) {
            TSError.throw('TSRect.offset() : invalid offset parameter', { xOffset:xOffset, yOffset:yOffset}) ;
        }
        return new TSRect(this.minX+xOffset, this.minY+yOffset, this.width, this.height) ;
    }
    offsetRect = this.offset ;

    public inset(insetWidth:number, insetHeight:number):TSRect {
        if (!$isnumber(insetWidth) || !$isnumber(insetHeight)) {
            TSError.throw('TSRect.inset() : invalid inset parameter', { insetWidth:insetWidth, insetHeight:insetHeight}) ;
        }
        return new TSRect(this.minX-insetWidth, this.minY-insetHeight, this.width + insetWidth*2, this.height + insetHeight*2) ;
    }
    insetRect = this.inset ;

    public integral():TSRect {
        let rect = new TSRect() ;
        rect.x = Math.floor(this.minX) ;
        rect.y = Math.floor(this.minY) ;

        if (this.isEmpty) { return rect ; }
        rect.w = Math.ceil(this.maxX) - rect.x ;
        rect.h = Math.ceil(this.maxY) - rect.y ;
        
        return rect ;
    }
    integralRect = this.integral ;

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
                TSError.throw('TSRect.divide() : bad edge parameter', { amount:amount, edge:edge}) ;
        }
    }
    divideRect = this.divide ;

    public clone():TSRect
    { return new TSRect(this.minX, this.minY, this.width, this.height) ; }
   
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
    
    public toJSON():TSFrame { return this.frame ; } 
    
    public toString(): string { 
        return `{ x = ${this.minX}, y = ${this.minY}), w:${this.width}, h:${this.height} }` ; 
    }

    // warning : dont use generated array to create new Rect because we did send the oposite points here
    // QUESTION: should we return [x,y,w,h] here ? 
    public toArray(): number[] { return [this.minX, this.minY, this.maxX, this.maxY] ; }

    // ============ TSLeafInspect conformance =============== 
    leafInspect = this.toString ;

    // @ts-ignore
    [customInspectSymbol](depth:number, inspectOptions:any, inspect:any) {
        return this.leafInspect()
    }
    
    // ============ private methods ===============
    _setInternalValues(message:string, x:any, y:any, w:any, h:any, _moreTest:boolean = true) {
        if (!!_moreTest && $isnumber(x) && $isnumber(y) && $isnumber(w) && $isnumber(h) && w >= 0 && h >= 0) {
            this.x = x ; this.y = y ;
            this.w = w ; this.h = h ;    
        }
        else {
            TSError.throw(`TSRect.constructor() : ${message}`, { x:x, y:y, w:w, h:h}) ;
        }

    }
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
        if (opts.invalidSizeRaise) { 
            TSError.throw('TSAssertFormat() : invalid size format', { size:size }) ;
        } 
        return defaultSize ; 
    }

    const min = TSValidSize(opts.minimalSize) ? opts.minimalSize! : TSDocumentFormats.min ;
    if (size!.w < min.w || size!.h < min.h) { 
        if (opts.oversizeRaise) { 
            TSError.throw('TSAssertFormat() : size format too small', { size:size, minimalSize:min }) ;
        } 
        return min ;
    }

    const max = TSValidSize(opts.maximalSize) ? opts.maximalSize! : TSDocumentFormats.max ;
    if (size!.w > max.w || size!.h > max.h) {
        if (opts.oversizeRaise) { 
            TSError.throw('TSAssertFormat() : size format too large', { size:size, maximalSize:max }) ;
        } 
        return max ; 
    }

    return size!
}

export const TSCM = TScm2Pixels(1) ;
export const TSMM = TSmm2Pixels(1) ;
export const TSIN = TSInches2Pixels(1) ;

const LocalPointProperties = ['x', 'y'] ;
export function $comformsToPoint(v:any):boolean
{ return v instanceof TSRect || $hasproperties(v, LocalPointProperties) ; }

const LocalSizeProperties = ['w', 'h'] ;
export function $conformsToSize(v:any):boolean
{ return v instanceof TSRect || $hasproperties(v, LocalSizeProperties) ; }

export function $conformsToFrame(v:any):boolean
{ return $comformsToPoint(v) && $conformsToSize(v) ; }
