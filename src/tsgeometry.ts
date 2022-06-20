import { $isnumber, $isobject, $isstring, $ok } from "./commons";
import { Class, TSObject } from "./tsobject";
import { Ascending, Comparison, Descending, Same } from "./types";

export interface TSPoint {
    x:number ;
    y:number ;
}

export interface TSSize {
    w:number ;
    h:number ;
}

export type TSDocumentFormat    = 'letter' | 'legal' | 'tabloid' | 'a0' | 'a1' | 'a2' | 'a3' | 'a4' | 'a5' | 'a6' ;

export const  TSDocumentFormats:{[key in TSDocumentFormat]:TSSize} = {
    letter: { w:TSInches2Pixels(8.5),  h:TSInches2Pixels(11) },
    legal:  { w:TSInches2Pixels(8.5),  h:TSInches2Pixels(14) },
    tabloid:{ w:TSInches2Pixels(11),   h:TSInches2Pixels(17) },
    a0:     { w:TSmm2Pixels(841),      h:TSmm2Pixels(1189) },
    a1:     { w:TSmm2Pixels(594),      h:TSmm2Pixels(841)  },
    a2:     { w:TSmm2Pixels(420),      h:TSmm2Pixels(594)  },
    a3:     { w:TSmm2Pixels(297),      h:TSmm2Pixels(420)  },
    a4:     { w:TSmm2Pixels(210),      h:TSmm2Pixels(294)  },
    a5:     { w:TSmm2Pixels(148),      h:TSmm2Pixels(210)  },
    a6:     { w:TSmm2Pixels(105),      h:TSmm2Pixels(148)  }
} ;

export class TSRect implements TSPoint, TSSize, TSObject<TSRect> {
    public x:number ;
    public y:number ;
    public w:number ;
    public h:number ;

	public constructor() ;
	public constructor(rect:TSRect) ;
    public constructor(format:TSDocumentFormat) ;
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
                        this.w = size!.w ;
                        this.h = size!.h ;
                    }
                    else {
                        throw 'Bad TSRect() constructor: bad document format' ;
                    }
                }
                else if ((arguments[0] instanceof TSRect)) {
                    const r = arguments[0] as TSRect ;
                    if (r.w >= 0 && r.h >= 0) {
                        this.x = r.x ;
                        this.y = r.y ;
                        this.w = r.w ;
                        this.h = r.h ;    
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
                    if ($ok(size) && ('w' in size) && ('h' in size) && size.w >= 0 && size.h >= 0) {
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
                    if ($ok(size) && size.w >= 0 && size.h >= 0) {
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
                    this.x = (arguments[0] as TSPoint).x ;
                    this.y = (arguments[0] as TSPoint).y ;
                    this.w = arguments[1] as number ;
                    this.h = arguments[2] as number ;    
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

    public get origin():TSPoint { return { x:this.x, y:this.y } ; }
    public get size():TSSize    { return { w:this.w, h:this.h } ; }

    public get minX():number    { return this.x ; }
    public get minY():number    { return this.y ; }
    public get maxX():number    { return this.x + this.w ; }
    public get maxY():number    { return this.y + this.h ; }
    public get midX():number    { return this.x + this.w/2 ; }
    public get midY():number    { return this.y + this.h/2 ; }

    public get isEmpty():boolean  { return this.w > 0 && this.h > 0 ? false : true ; }

    public contains(p:TSPoint|TSRect|null|undefined):boolean {
        if (p instanceof TSRect) {
            const r = p as TSRect ;
            return !r.isEmpty && this.minX <= r.minX && this.minY <= r.minY && this.maxX >= r.maxX && this.maxY >= r.maxY ;
        }
        return $ok(p) ? p!.x >= this.minX && p!.x <= this.maxX && p!.y >= this.minY && p!.y <= this.maxY : false ;
    }
    
    public containedIn(r:TSRect|null|undefined):boolean {
        return $ok(r) ? r!.contains(this) : false ;
    }

    public intersects(r:TSRect):boolean {
        return this.maxX <= r.minX || r.maxX <= this.minX || this.maxY <= r.minY || r.maxY <= this.minY || this.isEmpty || r.isEmpty ? false : true ;
    }

    public intersection(r:TSRect):TSRect {
        let rect = new TSRect() ;

        if (this.maxX <= r.minX || r.maxX <= this.minX || this.maxY <= r.minY || r.maxY <= this.minY) {
            return rect ;
        }

        rect.x = this.minX <= r.minX ? r.x : this.x ;
        rect.y = this.minY <= r.minY ? r.y : this.y ;
        rect.w = (this.maxX >= r.maxX ? r.maxX : this.maxX) - rect.x ;
        rect.h = (this.maxY >= r.maxY ? r.maxY : this.maxY) - rect.y ;

        return rect ;
    }

    public union(r:TSRect):TSRect {
        if (this.isEmpty) { return r.isEmpty ? new TSRect() : r.clone() ; }
        if (r.isEmpty) { return this.clone() ; }

        const originX = Math.min(this.minX, r.minX) ;
        const originY = Math.min(this.minY, r.minY) ;

        return new TSRect(originX, originY, Math.max(this.maxX, r.maxX) - originX, Math.max(this.maxY, r.maxY) - originY) ;
    }

    public insetRect(deltaW:number, deltaH:number):TSRect {
        return new TSRect(this.minX-deltaW, this.minY-deltaW, this.w + deltaW*2, this.h + deltaH*2) ;
    }

    public clone():TSRect { return new TSRect(this.x, this.y, this.w, this.h) ; }

    // ============ TSObject conformance =============== 
	public get isa(): Class<TSRect> { return this.constructor as Class<TSRect>; }
	public get className(): string { return this.constructor.name; }

    public isEqual(other:any) : boolean 
    { return this === other || (other instanceof TSRect && other.minX === this.minX && other.maxX === this.maxX && other.minY === this.minY && other.maxY === this.maxY) ; }

    public compare(other:any):Comparison {
        if (other === this) { return Same ; }
        if (!(other instanceof TSRect)) { return undefined ; }

        const area = this.w * this.h ;
        const otherArea = other.w * other.h ;

        if (area === otherArea) {
            if (this.x === other.x) { return this.y < other.y ? Ascending : (this.y > other.y ? Descending : Same) ; }
            if (this.y === other.y) { return this.x < other.x ? Ascending : Descending ; }
            if (this.x < other.y && this.y < other.y) { return Ascending ; }
            if (this.x > other.y && this.y > other.y) { return Descending ; }
            return undefined ; // same area but positions are all over the place
        }
        return area < otherArea ? Ascending : Descending ;
    }

    public toJSON():object { return {x:this.x, y:this.y, w:this.w, h:this.h} ; }
    public toString(): string { return `((${this.x}, ${this.y})-(${this.w}, ${this.h}))` ; }
    public toArray(): number[] { return [this.minX, this.minY, this.maxX, this.maxY] ; }
}

export function TSmm2Pixels(mm:number) { return mm * 45 / 16 ; }
export function TScm2Pixels(cm:number) { return cm * 225 / 8 ; }

export function TSPixels2cm(pixels:number) { return pixels * 8 / 225 ; }
export function TSPixels2mm(pixels:number) { return pixels * 16 / 45 ; }

export function TSInches2Pixels(inches:number) { return inches * 72 ; }
export function TSPixels2Inches(pixels:number) { return pixels / 72 ; }
