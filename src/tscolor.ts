import { $defined, $isnumber, $isstring, $isunsigned, $ok, $trim, $string, $keys, $isbool } from "./commons";
import { $numcompare } from "./compare";
import { Class, TSObject } from "./tsobject";
import { Comparison, Same, StringDictionary, uint, UINT32_MAX, uint8, UINT8_MAX } from "./types";

export const TSWebColorNames: StringDictionary = {
	aliceblue: "#f0f8ff",
	antiquewhite: "#faebd7",
	aqua: "#00ffff",
	aquamarine: "#7fffd4",
	azure: "#f0ffff",
	beige: "#f5f5dc",
	bisque: "#ffe4c4",
	black: "#000000",
	blanchedalmond: "#ffebcd",
	blue: "#0000ff",
	blueviolet: "#8a2be2",
	brown: "#a52a2a",
	burlywood: "#deb887",
	cadetblue: "#5f9ea0",
	chartreuse: "#7fff00",
	chocolate: "#d2691e",
	coral: "#ff7f50",
	cornflowerblue: "#6495ed",
	cornsilk: "#fff8dc",
	crimson: "#dc143c",
	cyan: "#00ffff",
	darkblue: "#00008b",
	darkcyan: "#008b8b",
	darkgoldenrod: "#b8860b",
	darkgray: "#a9a9a9",
	darkgreen: "#006400",
	darkgrey: "#a9a9a9",
	darkkhaki: "#bdb76b",
	darkmagenta: "#8b008b",
	darkolivegreen: "#556b2f",
	darkorange: "#ff8c00",
	darkorchid: "#9932cc",
	darkred: "#8b0000",
	darksalmon: "#e9967a",
	darkseagreen: "#8fbc8f",
	darkslateblue: "#483d8b",
	darkslategray: "#2f4f4f",
	darkslategrey: "#2f4f4f",
	darkturquoise: "#00ced1",
	darkviolet: "#9400d3",
	deeppink: "#ff1493",
	deepskyblue: "#00bfff",
	dimgray: "#696969",
	dimgrey: "#696969",
	dodgerblue: "#1e90ff",
	firebrick: "#b22222",
	floralwhite: "#fffaf0",
	forestgreen: "#228b22",
	fuchsia: "#ff00ff",
	gainsboro: "#dcdcdc",
	ghostwhite: "#f8f8ff",
	goldenrod: "#daa520",
	gold: "#ffd700",
	gray: "#808080",
	green: "#00ff00",
	greenyellow: "#adff2f",
	grey: "#808080",
	honeydew: "#f0fff0",
	hotpink: "#ff69b4",
	indianred: "#cd5c5c",
	indigo: "#4b0082",
	ivory: "#fffff0",
	khaki: "#f0e68c",
	lavenderblush: "#fff0f5",
	lavender: "#e6e6fa",
	lawngreen: "#7cfc00",
	lemonchiffon: "#fffacd",
	lightblue: "#add8e6",
	lightcoral: "#f08080",
	lightcyan: "#e0ffff",
	lightgoldenrodyellow: "#fafad2",
	lightgray: "#d3d3d3",
	lightgreen: "#90ee90",
	lightgrey: "#d3d3d3",
	lightpink: "#ffb6c1",
	lightsalmon: "#ffa07a",
	lightseagreen: "#20b2aa",
	lightskyblue: "#87cefa",
	lightslategray: "#778899",
	lightslategrey: "#778899",
	lightsteelblue: "#b0c4de",
	lightyellow: "#ffffe0",
	lime: "#00ff00",
	limegreen: "#32cd32",
	linen: "#faf0e6",
	magenta: "#ff00ff",
	maroon: "#800000",
	mediumaquamarine: "#66cdaa",
	mediumblue: "#0000cd",
	mediumorchid: "#ba55d3",
	mediumpurple: "#9370db",
	mediumseagreen: "#3cb371",
	mediumslateblue: "#7b68ee",
	mediumspringgreen: "#00fa9a",
	mediumturquoise: "#48d1cc",
	mediumvioletred: "#c71585",
	midnightblue: "#191970",
	mintcream: "#f5fffa",
	mistyrose: "#ffe4e1",
	moccasin: "#ffe4b5",
	navajowhite: "#ffdead",
	navy: "#000080",
	oldlace: "#fdf5e6",
	olive: "#808000",
	olivedrab: "#6b8e23",
	orange: "#ffa500",
	orangered: "#ff4500",
	orchid: "#da70d6",
	palegoldenrod: "#eee8aa",
	palegreen: "#98fb98",
	paleturquoise: "#afeeee",
	palevioletred: "#db7093",
	papayawhip: "#ffefd5",
	peachpuff: "#ffdab9",
	peru: "#cd853f",
	pink: "#ffc0cb",
	plum: "#dda0dd",
	powderblue: "#b0e0e6",
	purple: "#800080",
	rebeccapurple: "#663399",
	red: "#ff0000",
	rosybrown: "#bc8f8f",
	royalblue: "#4169e1",
	saddlebrown: "#8b4513",
	salmon: "#fa8072",
	sandybrown: "#f4a460",
	seagreen: "#2e8b57",
	seashell: "#fff5ee",
	sienna: "#a0522d",
	silver: "#c0c0c0",
	skyblue: "#87ceeb",
	slateblue: "#6a5acd",
	slategray: "#708090",
	slategrey: "#708090",
	snow: "#fffafa",
	springgreen: "#00ff7f",
	steelblue: "#4682b4",
	tan: "#d2b48c",
	teal: "#008080",
	thistle: "#d8bfd8",
	tomato: "#ff6347",
	turquoise: "#40e0d0",
	violet: "#ee82ee",
	wheat: "#f5deb3",
	white: "#ffffff",
	whitesmoke: "#f5f5f5",
	yellow: "#ffff00",
	yellowgreen: "#9acd32",
};

interface _StringColorRegex {
    rx: RegExp ;
    short:boolean ;
}

const WebColorsHexParsers:Array<_StringColorRegex|null> = [
    null, null, null,
	{
		rx: /^([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])$/,
		short: true
	},
	{
		rx: /^#([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])$/,
		short: true
	},
    null,
    {
		rx: /^([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/,
		short: false
    },
	{
		rx: /^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/,
		short: false
	},
	{
		rx: /^([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/,
		short: false
	},
	{
		rx: /^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/,
		short: false
	}
] ;

export function $lighter(c: number): uint8 {
	c = Math.max(0, Math.min(c, 255)) / 255.0;
	return <uint8>Math.round(((2.0 * c * c) / 3.0 + c / 2.0 + 0.25) * 255);
}
export function $darker(c: number): uint8 {
	c = Math.max(0, Math.min(c, 255)) / 255.0;
	return <uint8>Math.round(((-c * c) / 3 + (5.0 * c) / 6.0) * 255);
}

export function $lightest(c: number): uint8 {
	return $lighter($lighter(c));
}
export function $darkest(c: number): uint8 {
	return $darker($darker(c));
}
/**
 * TSColor are immutable objects which are cached (if you use TSColor.color())
 * better 
 */
export class TSColor implements TSObject<TSColor> {
	public readonly red: uint8;
	public readonly green: uint8;
	public readonly blue: uint8;
	public readonly alpha: uint8;
    private _name?: string ;

    private static __colorsCache:Map<string,TSColor>|undefined  ;
    private static readonly __colorCacheMaxSize = 16384 ;

    public static readonly red      = TSColor.color('red') ;
	public static readonly green    = TSColor.color('green') ;
	public static readonly yellow   = TSColor.color('yellow') ;
	public static readonly blue     = TSColor.color('blue') ;
	public static readonly cyan     = TSColor.color('cyan') ;
	public static readonly magenta  = TSColor.color('magenta') ;
	public static readonly white    = TSColor.color('white') ;
	public static readonly black    = TSColor.color('black') ;
	
    public static darkWriteColor    = TSColor.black ;
	public static lightWriteColor   = TSColor.white ;


	static color():TSColor;
	static color(stringColor: string):TSColor;
	static color(colorDefinition: number):TSColor;
	static color(r: number, g: number, b: number, a?: number):TSColor;
    static color():TSColor {
        if (arguments.length === 1 && $isstring(arguments[0])) {
            const s = $trim(arguments[0]).toLowerCase() ;
            
            let color = TSColor._cachedColor(s) ;
            if ($defined(color)) { return color! ;}
            
            color = new TSColor(arguments[0], true) ; // this may throw

            if (TSColor.__colorsCache!.size < TSColor.__colorCacheMaxSize) {
                TSColor.__colorsCache!.set(s, color) ;
            }
            
            return color ; 
        }
        else if (arguments.length === 1 || arguments.length === 3 || arguments.length === 4) {
            return new (Function.prototype.bind.apply(TSColor, [null, ...arguments])); // this may throw
        }
        return TSColor.black ;
    }

	constructor(stringColor: string);
	constructor(stringColor: string, dontCheckCache?:boolean);
	constructor(colorDefinition: number);
	constructor(r: number, g: number, b: number, a?: number);
	constructor() {
		let n = arguments.length;
		if (n === 3 || n === 4) {
			this.red = _parseColorComponent(arguments[0]);
			this.green = _parseColorComponent(arguments[1]);
			this.blue = _parseColorComponent(arguments[2]);
			this.alpha = n === 4 ? _parseColorComponent(arguments[3]) : UINT8_MAX;
			return;
		}
        else if (n === 1 || (n === 2 && $isstring(arguments[0]) && $isbool(arguments[1]))) {
            if ($isstring(arguments[0])) {
                let s = arguments[0] as string ;
                
                if (!arguments[1]) {
                    s = $trim(arguments[0]).toLowerCase() ;
                    let color = TSColor._cachedColor(s) ;
                    if ($defined(color)) { 
                        this.red = this.green = this.blue = this.alpha = 0 as uint8 ; // JUST TO AVOID ERRORS FROM TS!
                        return color! ; 
                    }
                }

                if (s.length < 10) {
                    let parser = WebColorsHexParsers[s.length];
                    if ($ok(parser)) {
                        const m = s.match(parser!.rx) ;
                        if ($ok(m)) {
                            this.red = <uint8>parseInt(m![1], 16);
                            this.green = <uint8>parseInt(m![2], 16);
                            this.blue = <uint8>parseInt(m![3], 16);
        					if (parser!.short) {
                                this.red = <uint8>((this.red << 4) | this.red);
                                this.green = <uint8>((this.green << 4) | this.green);
                                this.blue = <uint8>((this.blue << 4) | this.blue);
                            }
                            this.alpha = m!.length === 5 ? <uint8>parseInt(m![4], 16) : UINT8_MAX ;
                            if (!arguments[1]) {
                                TSColor._cacheColor(this) ;
                            }

                            return ;
                        }
                    }

                }
			} 
            else if ($isnumber(arguments[0])) {
				let v = arguments[0] as number;
				if ($isunsigned(v) && v <= UINT32_MAX) {
					this.alpha = <uint8>(UINT8_MAX - ((v >> 24) & UINT8_MAX));
					this.red = <uint8>((v >> 16) & UINT8_MAX);
					this.green = <uint8>((v >> 8) & UINT8_MAX);
					this.blue = <uint8>(v & UINT8_MAX);
					return;
				}
			}
		}
		throw "Bad color constructor parameters";
	}
    
    public get name():string { return $string(this._name) ; }
	public clone():TSColor { return this ; } // no clone on immutable objects
    
	public luminance(): number {
		return (0.3 * this.red + 0.59 * this.green + 0.11 * this.blue) / 255.0;
	}
	public isPale(): boolean {
		return this.luminance() > 0.6;
	}

    public alphaColor(alpha:uint8):TSColor { return new TSColor(this.red, this.green, this.blue, alpha) ; }

    public lighterColor(): TSColor {
		return new TSColor(
			$lighter(this.red),
			$lighter(this.green),
			$lighter(this.blue),
			this.alpha
		);
	}
	public darkerColor(): TSColor {
		return new TSColor(
			$darker(this.red),
			$darker(this.green),
			$darker(this.blue),
			this.alpha
		);
	}

	public lightestColor(): TSColor {
		return new TSColor(
			$lightest(this.red),
			$lightest(this.green),
			$lightest(this.blue),
			this.alpha
		);
	}
	public darkestColor(): TSColor {
		return new TSColor(
			$darkest(this.red),
			$darkest(this.green),
			$darkest(this.blue),
			this.alpha
		);
	}

	public matchingColor(): TSColor {
		return this.isPale() ? this.darkestColor() : this.lightestColor();
	}
	public writingColor(): TSColor {
		return this.isPale() ? TSColor.darkWriteColor : TSColor.lightWriteColor;
	}

	public toNumber(): number {
		return (
			((0xff - this.alpha) << 24) |
			(this.red << 16) |
			(this.green << 8) |
			this.blue
		);
	}
	public toUnsigned(): uint {
		return <uint>this.toNumber();
	}
	
	// ============ TSObject conformance =============== 
	public get isa(): Class<TSColor> { return this.constructor as Class<TSColor>; }
	public get className(): string { return this.constructor.name; }
	public isEqual(other: any): boolean {
		return this === other || (
			other instanceof TSColor &&
			other.red === this.red &&
			other.green === this.green &&
			other.blue === this.blue &&
			other.alpha === this.alpha
		);
	}
    
    public compare(other:any): Comparison {
        return this === other ? 
            Same : 
            (other instanceof TSColor ? $numcompare(this.luminance(), other.luminance()) : undefined) ;
    }

    public shortestCSSString() {
        if ((this.red >> 4 & 0x0f) === (this.red & 0x0f) && 
            (this.green >> 4 & 0x0f) === (this.green & 0x0f) &&
            (this.blue >> 4 & 0x0f) === (this.blue & 0x0f)) {
                return `#${(this.red & 0x0f).toString(16)}${(this.green & 0x0f).toString(16)}${(this.blue & 0x0f).toString(16)}` ;
        }
        return this.toString(true) ;
    }

	public toString(removeAlpha: boolean = false): string {
		return this.alpha === 255 || removeAlpha
			? `#${_toHex(this.red)}${_toHex(this.green)}${_toHex(this.blue)}`
			: `rgba(${this.red},${this.green},${this.blue},${this.alpha / 255.0})`;
	}

	public toJSON(): string {
		return this.alpha === 255
			? `#${_toHex(this.red)}${_toHex(this.green)}${_toHex(this.blue)}`
			: `#${_toHex(this.red)}${_toHex(this.green)}${_toHex(this.blue)}${_toHex(
				this.alpha
			)}`;
	}

	public toArray(): uint8[] { return [this.red, this.green, this.blue, this.alpha]; }

    // =============== private methods =========================
    private static _cacheColor(c:TSColor) {
        if (c.name.length) { TSColor.__colorsCache?.set(c.name, c) ; }
        const s = c.toString().toLowerCase() ;
        TSColor.__colorsCache?.set(s, c) ;
        TSColor.__colorsCache?.set(s.slice(1), c) ;
        if (c.alpha === 0xff) {
            TSColor.__colorsCache?.set(s+'ff', c) ;
            TSColor.__colorsCache?.set(s.slice(1)+'ff', c) ;
            const short = c.shortestCSSString() ;
            if (short !== s) { 
                TSColor.__colorsCache?.set(short, c) ; 
                TSColor.__colorsCache?.set(short.slice(1), c) ;
            }    
        }
    }

    private static _cachedColor(c:string):TSColor|undefined {
        if (!$defined(TSColor.__colorsCache)) { 
            TSColor.__colorsCache = new Map<string,TSColor>() ;
            for (let name of $keys(TSWebColorNames)) {
                const v = TSWebColorNames[name] ;
                const c = new TSColor(v) ;
                c._name = name as string ;
                TSColor._cacheColor(c) ;
            } ;
        }
        return TSColor.__colorsCache!.get(c) ;
    }

}

function _toHex(v: number): string {
	const s = v.toString(16);
	return v >= 16 ? s : "0" + s;
}

function _parseColorComponent(v: any): uint8 {
	if (!$isunsigned(v) || <number>v > 255) {
		throw new Error("invalid color component value");
	}
	return <uint8>v;
}
