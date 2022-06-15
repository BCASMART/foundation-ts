import { $isnumber, $isobject } from "./commons";

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

export class TSRect implements TSPoint, TSSize {
    public x:number ;
    public y:number ;
    public w:number ;
    public h:number ;

	public constructor(rect:TSRect) ;
    public constructor(x:number, y:number, w:number, h:number) ;
	public constructor(origin:TSPoint, w:number, h:number) ;
	public constructor(origin:TSPoint, size:TSSize) ;
	public constructor() {
		const n = arguments.length ;
        switch (n) {
			case 0:
				throw 'Bad TSRect() constructor: no arguments provided' ;
            case 1:{
                if (!(arguments[0] instanceof TSRect)) {
                    const r = arguments[0] as TSRect ;
                    this.x = r.x ;
                    this.y = r.y ;
                    this.w = r.w ;
                    this.h = r.h ;
                    break ;
                }
                else {
					throw 'Bad TSRect() constructor: should have a TSRect single argument' ;
                }
            }
            case 2:
                if (!$isobject(arguments[0]) || !('x' in arguments[0]) || !('y' in arguments[0]) || 
                    !$isobject(arguments[1]) || !('x' in arguments[1]) || !('y' in arguments[1])) {
					throw 'Bad TSRect() constructor: bad TSOrigin or TSSize parameter' ;
                }
                this.x = (arguments[0] as TSPoint).x ;
                this.y = (arguments[0] as TSPoint).y ;
                this.w = (arguments[1] as TSSize).w ;
                this.h = (arguments[2] as TSSize).h ;
                break ;
            case 3:
                if (!$isobject(arguments[0]) || !('x' in arguments[0]) || !('y' in arguments[0]) || 
                    !$isnumber(arguments[1]) || !$isnumber(arguments[2])) {
					throw 'Bad TSRect() constructor: bad TSOrigin or number parameter' ;
                }
                this.x = (arguments[0] as TSPoint).x ;
                this.y = (arguments[0] as TSPoint).y ;
                this.w = arguments[1] as number ;
                this.h = arguments[2] as number ;
                break ;
            case 4:
                if (!$isnumber(arguments[0]) || !$isnumber(arguments[1]) || 
                    !$isnumber(arguments[2]) || !$isnumber(arguments[3])) {
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

}

export function TSmm2Pixels(mm:number) { return mm * 45 / 16 ; }
export function TScm2Pixels(cm:number) { return cm * 225 / 8 ; }

export function TSPixels2cm(pixels:number) { return pixels * 8 / 225 ; }
export function TSPixels2mm(pixels:number) { return pixels * 16 / 45 ; }

export function TSInches2Pixels(inches:number) { return inches * 72 ; }
export function TSPixels2Inches(pixels:number) { return pixels / 72 ; }
