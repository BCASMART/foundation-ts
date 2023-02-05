import { $defined, $isnumber, $isstring, $isunsigned, $ok, $string, $keys, $length, $tounsigned } from "./commons";
import { $equal, $numcompare } from "./compare";
import { $round } from "./number";
import { $ftrim } from "./strings";
import { TSError } from "./tserrors";
import { TSClone, TSLeafInspect, TSObject } from "./tsobject";
import { Comparison, Nullable, Same, StringDictionary, uint, UINT32_MAX, uint8, UINT8_MAX, UINT8_MIN } from "./types";




/**
 * TSColor are immutable objects. RGB Colors may be cached, 
 * CMYK and Grayscale colors are not. It's a one class implementation
 * of three colorspace. It's agains all OOD rules but it's efficient
 * in that case because of the proximity between CMYK and Grayscale
 * and the usage of primitives methods like rgb() or grayComponent() or
 * cmykComponents()
 */
export interface TSColorToStringOptions {
    removeAlpha?:Nullable<boolean> ;
    uppercase?:Nullable<boolean>;
    shortestCSS?:Nullable<boolean> ;
    rgbaCSSLike?:Nullable<boolean> ;
    colorSpace?:Nullable<TSColorSpace> ;
}

/**
 *  Those are the 3 colorspace we can use.
 *  If you need HSL or HSB values for a color,
 *  use the hsb() or hsl() instance methods to
 *  get the values you need. 
 */
export enum TSColorSpace {
    RGB         = 'RGB',
    CMYK        = 'CMYK',
    Grayscale   = 'GRAYSCALE'
}

export enum TSToGrayScaleMode {
    Brightess,
    Luminosity,
    Luminance
}

const customInspectSymbol = Symbol.for('nodejs.util.inspect.custom') ;

// TODO: assert a better conversion between [0 .. 255] to [0 .. 1.0] components
//       and same thing for opacity
export class TSColor implements TSObject, TSLeafInspect, TSClone<TSColor> {
    public readonly colorSpace:TSColorSpace ;
    private _channels:number[] ;
	private _alpha: number;
    private _name?: string ;

    private static __colorsCache:Map<string,TSColor>|undefined  ;
    private static readonly __colorCacheMaxSize = 16384 ;

    // THOSE ARE PRIMARY Grayscale or CMYK COLORS
    // TO GET RGB Colors use TSColor.rgb(). 
    // EG: To get a named color called green, use: TSColor.rgb('green')
    public static readonly black    = TSColor.grayscale(0) ;
    public static readonly white    = TSColor.grayscale(1) ;
	public static readonly cyan     = TSColor.cmyk(1,0,0,0) ;
	public static readonly magenta  = TSColor.cmyk(0,1,0,0) ;
	public static readonly yellow   = TSColor.cmyk(0,0,1,0) ;
    public static readonly red      = TSColor.cmyk(0,1,1,0) ;
	public static readonly green    = TSColor.cmyk(1,0,1,0) ;
	public static readonly blue     = TSColor.cmyk(1,1,0,0) ;
	
	public static rgb(stringColor: string):TSColor;
	public static rgb(colorDefinition: number):TSColor;
	public static rgb(R: number, G: number, B: number, A?: number):TSColor;
    public static rgb():TSColor {
        if (arguments.length === 1) {
            if ($isstring(arguments[0])) {
                const s = $ftrim(arguments[0]).toLowerCase() ;
                let color = TSColor._cachedRGBColor(s) ;
                if ($defined(color)) { return color! ;}
                const [channels, alpha] = TSColor._parseHexColorString(s) ;
                if ($ok(channels)) {
                    color = new TSColor(TSColorSpace.RGB, channels!, alpha) ;
                    TSColor._cacheRGBColor(color) ;
                    return color ;
                }
            }
            else if ($isunsigned(arguments[0], UINT32_MAX)) {
                const v = arguments[0] as number;
                // by calling the static methods, the color will be cached.
                return TSColor.rgb((v >> 16) & 0xff, (v >> 8) & 0xff, v & 0xff, 0xff - ((v >> 24) & 0xff)) ;
            }
            return TSColor.rgb(0,0,0) ; // bad single parameter => we return a black color               
        }
        else if (arguments.length === 3 || arguments.length === 4) {
            const R = arguments[0] ;
            const G = arguments[1] ;
            const B = arguments[2] ;
            const A = arguments.length === 4 ? arguments[3] : 0xFF ;
            if ($isunsigned(R, 0xff) && $isunsigned(G, 0xff) && $isunsigned(B, 0xff) && $isunsigned(A, 0xff)) {
                const s = _colorToStandardCSS(R,G,B,A) ;
                let color = TSColor._cachedRGBColor(s) ;
                if ($defined(color)) { return color! ;}
                color = new TSColor(TSColorSpace.RGB, [R,G,B], A) ;
                TSColor._cacheRGBColor(color) ;
                return color ;
            }
            return TSColor.rgb(0,0,0) ; // bad 3/4 parameters => we return a black color               
        }
        // only throws on arguments wrong count
        throw new TSError('TSColor.rgb() : Bad parameters', { arguments:Array.from(arguments)}) ;
    }

    public static rgbcomponents(r:number, g:number, b:number, opacity?:number) {
        opacity = $ok(opacity) ? opacity! : 1 ;
        if ($isnumber(r) && $isnumber(g) && $isnumber(b) && $isnumber(opacity)) {
            r = _component(r) ;
            g = _component(g) ;
            b = _component(b) ;
            opacity = _component(opacity) ;
            return TSColor.rgb((r*255) | 0, (g*255) | 0, (b*255) | 0, (opacity*255) | 0) ;
        }
        throw new TSError('TSColor.rgbcomponents() : Bad parameters', { arguments:Array.from(arguments)}) ;
    }
    
    public static cmyk(C:number,M:number,Y:number,K:number, opacity?:number) {
        opacity = $ok(opacity) ? opacity! : 1 ;
        if ($isnumber(C) && $isnumber(M) && $isnumber(Y) && $isnumber(K) && $isnumber(opacity)) {
            C = _component(C) ;
            M = _component(M) ;
            Y = _component(Y) ;
            K = _component(K) ;
            opacity = _component(opacity) ;
            return new TSColor(TSColorSpace.CMYK, [C,M,Y,K], opacity) ;
        }
        throw new TSError('TSColor.cmyk() : Bad parameters', { arguments:Array.from(arguments)}) ;
    }

    public static grayscale(whiteIntensity:number, opacity?:number) {
        opacity = $ok(opacity) ? opacity! : 1 ;
        if ($isnumber(whiteIntensity) && $isnumber(opacity)) {
            whiteIntensity = _component(whiteIntensity) ;
            return new TSColor(TSColorSpace.Grayscale, [0,0,0,1-whiteIntensity], opacity) ;
        }
        throw new TSError('TSColor.grayscale() : Bad parameters', { arguments:Array.from(arguments)}) ;
    }

    /*
        TSColor constructor is now private.
        Use rgb() grayscale() and cmyk() static methods
        to create new colors.
    */
    private constructor(colorSpace:TSColorSpace, channels:number[], alpha:number, name?:string) {
        this.colorSpace = colorSpace ;
        this._channels = channels ;
        this._alpha = alpha ;
        if ($length(name)) { this._name = name! }
    } 

    // ================== primitive methods =======================
    public rgb():[uint8, uint8, uint8]  {
        if (this.colorSpace === TSColorSpace.RGB) {
            return [(this._channels[0] & 0xFF) as uint8, (this._channels[1] & 0xFF) as uint8, (this._channels[2] & 0xFF) as uint8] ;
        }
        const [C,M,Y,K] = this.cmykComponents() ;
        const light = 255.0 * (1 - K) ;
        function _rc(x:number):uint8 { return ((light*(1-x)) & 0xFF) as uint8 ; }

        return [_rc(C), _rc(M), _rc(Y)] ;
    } 

    public rgbComponents():[number, number, number]  {
        if (this.colorSpace === TSColorSpace.RGB) {
            const [R,G,B] = this.rgb() ; 
            return [R/255, G/255, B/255] ;
        }
        const [C,M,Y,K] = this.cmykComponents() ;
        return [(1-K)*(1-C), (1-K)*(1-M), (1-K)*(1-Y)] ;
    }

    public cmykComponents():[number, number, number, number] {        
        if (this.colorSpace !== TSColorSpace.RGB) { 
            return [this._channels[0], this._channels[1], this._channels[2], this._channels[3]] ;
        }
        const [r,g,b] = this.rgbComponents() ;
        let C = 1 - r ;
        let M = 1 - g ;
        let Y = 1 - b ;
        let K = 1 ;
        if ( C < K ) { K = C ; }
        if ( M < K ) { K = M ; }
        if ( Y < K ) { K = Y ; }

        return K >= 1 ? [0, 0 ,0 ,1] : [(C - K) / (1 - K), (M - K) / (1 - K), (Y - K) / (1 - K), K]
    }

    public grayComponent(): number {
        if (this.colorSpace === TSColorSpace.RGB) {
            const [,,L] = this.hsb() ;
            return L / 100 ;
        }
        let [C,M,Y,K] = this.cmykComponents() ; 
        if (K >= 1) { K = 1 ; }
        else if (C !== 0 || M !== 0 || Y !== 0) {
            const [,,L] = this.hsb() ;
            return L / 100 ;
        }
        return 1-K ; 
    }

    // ================== accessors ===============================
    public get name():string { return $string(this._name) ; }
	public clone():TSColor { return this ; } // no clone on immutable objects

    // RGB color space
    public get red():uint8   { const [R,,] = this.rgb() ; return R as uint8 ;}
    public get green():uint8 { const [,G,] = this.rgb() ; return G as uint8 ;}
    public get blue():uint8  { const [,,B] = this.rgb() ; return B as uint8 ;}
    public get alpha():uint8 { return (this.colorSpace === TSColorSpace.RGB ? this._alpha : $tounsigned(_component(this._alpha) * 255)) as uint8 ;}
    public get transparency():uint8 { return 255 - this.alpha as uint8 ; }

    // CYMK color space
    public get cyan():number    { const [C,,,] = this.cmykComponents() ; return C ; }
    public get magenta():number { const [,M,,] = this.cmykComponents() ; return M ; }
    public get yellow():number  { const [,,Y,] = this.cmykComponents() ; return Y ; }
    public get black():number   { const [,,,K] = this.cmykComponents() ; return K ; }
    public get opacity():number { return this.colorSpace !== TSColorSpace.RGB ? this._alpha : _component(this._alpha / 255) ; }

    // GRAY color space
    public get gray():number    { return this.grayComponent() ; }

    // other accessors
    public get luminosity():number {
        // formula from https://www.johndcook.com/blog/2009/08/24/algorithms-convert-color-grayscale/
        const [r,g,b] = this.rgbComponents() ;
		return 0.21 * r + 0.72 * g + 0.07 * b ;
    }

    public get luminance(): number {
        const [r,g,b] = this.rgbComponents() ;
		return 0.3 * r + 0.59 * g + 0.11 * b ;
    }

    public get isPale(): boolean { return this.luminance > 0.6; }

    // ================== other methods ===========================

    public hsl():[number, number, number] {
        const [r,g,b] = this.rgbComponents() ;
        const l = Math.max(r, g, b);
        const s = l - Math.min(r, g, b);
        const h = s ? (l === r ? (g - b) / s : (l === g ? 2 + (b - r) / s : 4 + (r - g) / s)) : 0 ;
        return [
            $round(60 * (h < 0 ? h + 6 : h)),
            $round(100 * (s ? (l <= 0.5 ? s / (2 * l - s) : s / (2 - (2 * l - s))) : 0)),
            $round((100 * (2 * l - s)) / 2),
        ];
    }

    public hsb():[number, number, number] { 
        const [r,g,b] = this.rgbComponents() ;
        if (r === g && g === b) {
            return [0, 0, $round(r*100)]
        }
        const v = Math.max(r, g, b) ;
        const n = v - Math.min(r, g, b) ;
        const h = n === 0 ? 0 : n && v === r ? (g - b) / n : v === g ? 2 + (b - r) / n : 4 + (r - g) / n;
        return [
            $round(60 * (h < 0 ? h + 6 : h)), 
            $round(v && (n / v) * 100), 
            $round(v * 100)
        ] ;     
    }

    public toAlpha(newAlpha:uint8):TSColor {
        if (!$isunsigned(newAlpha, 0xFF)) {
            throw new TSError(`TSColor.toAlpha() : Bad alpha parameter ${newAlpha}`, { newAlpha:newAlpha }) ;
        }
        if (this.colorSpace !== TSColorSpace.RGB) { return this.toOpacity(newAlpha / 255.0) ; }
        if (newAlpha === this._alpha) { return this ; } 
        const [R,G,B] = this.rgb() ;
        return TSColor.rgb(R,G,B, newAlpha) ;
    }

    public toOpacity(newOpacity:number):TSColor {
        newOpacity = _component(newOpacity) ;
        if (this.colorSpace === TSColorSpace.RGB) { return this.toAlpha(((newOpacity * 255.0) | 0) as uint8) ; }
        if (newOpacity === this._alpha) { return this ; } 
        const [C,M,Y,K] = this.cmykComponents() ; 
        return this.colorSpace === TSColorSpace.Grayscale ? TSColor.grayscale(1-K, newOpacity) : TSColor.cmyk(C,M,Y,K, newOpacity) ;
    }

    public toRGB():TSColor       { 
        if (this.colorSpace === TSColorSpace.RGB) { return this ; }
        const [R,G,B] = this.rgb() ;
        return TSColor.rgb(R,G,B, this.alpha) ; 
    }

    public toCMYK():TSColor      {
        if (this.colorSpace === TSColorSpace.CMYK) { return this ; }
        const [C,M,Y,K] = this.cmykComponents() ;
        return TSColor.cmyk(C,M,Y,K,this.opacity) ;
    }

    // usesLuminosity = true if you want another more precise RGB or CMYK to grayscale conversion 
    public toGrayscale(mode:TSToGrayScaleMode=TSToGrayScaleMode.Brightess):TSColor {
        if (this.colorSpace === TSColorSpace.Grayscale) { return this ; }
        return TSColor.grayscale(mode === TSToGrayScaleMode.Brightess ? 
                                 this.grayComponent() : 
                                 (mode === TSToGrayScaleMode.Luminosity ? this.luminosity : this.luminance)) ;
    }

    public lighterColor(): TSColor { return this._modifiedColorsColor(1, _cmykLighter, _rgbLighter) ; }
    public darkerColor(): TSColor { return this._modifiedColorsColor(1, _cmykDarker, _rgbDarker) ; }

    public lightestColor(): TSColor { return this._modifiedColorsColor(2, _cmykLighter, _rgbLighter) ; }
    public darkestColor(): TSColor { return this._modifiedColorsColor(2, _cmykDarker, _rgbDarker) ; }

	public matchingColor(): TSColor { return this.isPale ? this.darkestColor() : this.lightestColor(); }

	public toNumber(): number {
        const [R,G,B] = this.rgb() ;
		return ((0xff - this.alpha) << 24) | (R << 16) | (G << 8) | B
	}
	public toUnsigned(): uint { return <uint>this.toNumber(); }

    public isSimilar(other:TSColor):boolean {
        if (this === other) { return true ; }
        if (other instanceof TSColor) {
            if (this.colorSpace === other.colorSpace) { return this._alpha === other.alpha && $equal(this._channels, other._channels) ; }
            if (this.alpha === other.alpha) {
                const [R1, G1, B1] = this.rgb() ;
                const [R2, G2, B2] = other.rgb() ;
                return R1 === R2 && G1 === G2 && B1 === B2 ;    
            } 
        }
        return false ;
    }
    // ============ TSLeafInspect conformance =============== 
    public leafInspect(): string {
        switch (this.colorSpace) {
            case TSColorSpace.RGB:
                const [R,G,B] = this.rgb() ;
                return `<RGB ${R} ${G} ${B}/${this._alpha}>`
            case TSColorSpace.CMYK:
                const [C,M,Y,K] = this.cmykComponents() ;
                return `<CMYK ${C} ${M}, ${Y} ${K}/${this.opacity}>`
            case TSColorSpace.Grayscale:
                const [,,,KS] = this.cmykComponents() ;
                return `<GRAY ${1-KS}/${this.opacity}>` ;
        }
    }

    // @ts-ignore
    [customInspectSymbol](depth:number, inspectOptions:any, inspect:any) {
        return this.leafInspect()
    }

	// ============ TSObject conformance =============== 
	public isEqual(other: any): boolean {
        return this === other || (
            other instanceof TSColor && 
            this.colorSpace === other.colorSpace && 
            this._alpha === other._alpha &&
            $equal(this._channels, other._channels)
        )
	}

    public compare(other:any): Comparison {
        return this === other ? Same : 
            (other instanceof TSColor ? $numcompare(this.luminance, other.luminance) : undefined) ;
    }

	public toString(opts: TSColorToStringOptions = {}): string {
        const colorSpace = $ok(opts.colorSpace) ? opts.colorSpace! : this.colorSpace ;
        let opacity ;

        if (colorSpace === TSColorSpace.RGB) {
            const [R,G,B] = this.rgb() ;
            const alpha = this.alpha ;

            if ((this.alpha === 255 && !opts.rgbaCSSLike)  || !!opts.removeAlpha) {
                if (!!opts.shortestCSS && _isShortRGB(R,G,B)) {
                    return _colorToShortCSS(R, G, B, opts.uppercase) ;
                }
                return _colorToStandardCSS(R, G, B, undefined, opts.uppercase) ;
            }
            if (!!opts.rgbaCSSLike) {
                return _colorToStandardCSS(R, G, B, alpha, opts.uppercase)
            }
            return `rgba(${R},${G},${B},${this.opacity})` ;
        }
        opacity = this.opacity ;
        const [C,M,Y,K] = this.cmykComponents() ;
        if (colorSpace === TSColorSpace.Grayscale) {
            return opacity === 1 || !!opts.removeAlpha ? `gray(${1-K})` : `gray(${1-K}, ${opacity})`
        }
        return opacity === 1 || !!opts.removeAlpha ? `cmyk(${C},${M},${Y},${K})` : `cmyka(${C},${M},${Y},${K},${opacity})`
    }

	public toJSON(): any {
        switch (this.colorSpace) {
            case TSColorSpace.CMYK:
                const [C,M,Y,K] = this.cmykComponents() ;
                return {cyan: C, magenta: M, yellow: Y, black:K, opacity:this._alpha}
            case TSColorSpace.Grayscale:
                const [,,,KS] = this.cmykComponents() ;
                return {grayscale: 1-KS, opacity:this._alpha}
            case TSColorSpace.RGB:
                const [R,G,B] = this.rgb() ;
                return this.alpha === 255 ? _colorToStandardCSS(R,G,B) : { red:R, green:G, blue:B, alpha:this._alpha } ;
         }        
	}

	public toArray(): number[] { return [...this._channels, this._alpha]; }

    // =============== private methods =========================
    private _modifiedColorsColor(times:number, cmykFunction:(x:number)=>number, rgbFunction:(x:number)=>uint8): TSColor {
        if (this.colorSpace === TSColorSpace.RGB) {
            let [R,G,B] = this.rgb() ;
            for (let i = 0 ; i < times ;i++) { 
                R = rgbFunction(R) ; G = rgbFunction(G), B = rgbFunction(B) ;
            }
            return TSColor.rgb(R, G, B, this._alpha) ;
        }
        let [C,M,Y,K] = this.cmykComponents() ;
        for (let i = 0 ; i < times ;i++) { 
            C = cmykFunction(C) ; M = cmykFunction(M) ;
            Y = cmykFunction(Y) ; K = cmykFunction(K) ;
        }
        return this.colorSpace === TSColorSpace.Grayscale ? 
            TSColor.grayscale(1-K, this._alpha) :
            TSColor.cmyk(C, M, Y, K, this._alpha) ;
	}


    private static readonly __TSWebColorNames: StringDictionary = {
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
    
    private static readonly __WebColorsHexParsers:Array<_StringColorRegex|null> = [
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

    private static _cacheRGBColor(c:TSColor) {
        if ($defined(TSColor.__colorsCache) && c.colorSpace === TSColorSpace.RGB && TSColor.__colorsCache!.size + 7 < TSColor.__colorCacheMaxSize) {
            const [R, G, B] = c.rgb() ;
            const s = _colorToStandardCSS(R,G,B, c.alpha) ;
            if (!TSColor.__colorsCache!.has(s) && (!c.name.length || !TSColor.__colorsCache!.has(c.name))) {
                if (c.name.length) { TSColor.__colorsCache!.set(c.name, c) ; }
                TSColor.__colorsCache!.set(s, c) ;
                TSColor.__colorsCache!.set(s.slice(1), c) ;
                if (c.alpha === 0xff) {
                    TSColor.__colorsCache!.set(s.slice(0,7), c) ;
                    TSColor.__colorsCache!.set(s.slice(1,7), c) ;
                    if (_isShortRGB(R,G,B)) {
                        const short = _colorToShortCSS(R,G,B) ;
                        TSColor.__colorsCache!.set(short, c) ; 
                        TSColor.__colorsCache!.set(short.slice(1), c) ;
                    }
                }
            }
        }
    }

    private static _cachedRGBColor(c:string):TSColor|undefined {
        if (!$defined(TSColor.__colorsCache)) { 
            TSColor.__colorsCache = new Map<string,TSColor>() ;
            for (let name of $keys(TSColor.__TSWebColorNames)) {
                const [channels, alpha] = TSColor._parseHexColorString(TSColor.__TSWebColorNames[name]) ;
                if ($ok(channels)) {
                    const c = new TSColor(TSColorSpace.RGB, channels!, alpha, name as string) ;
                    TSColor._cacheRGBColor(c) ;
                }
            } ;
        }
        return TSColor.__colorsCache!.get(c) ;
    }


    private static _parseHexColorString(s:string):[uint8[]|null, uint8] {
        const len = $length(s) ;
        if (len < 10) {
            let parser = TSColor.__WebColorsHexParsers[len];
            if ($ok(parser)) {
                const m = s.match(parser!.rx) ;
                if ($ok(m)) {
                    let channels:uint8[] = [] ;
                    for (let i = 0 ; i < 3 ; i++) { 
                        const v = parseInt(m![i+1], 16) ;
                        if (!$isunsigned(v,0xFF)) { return [null, UINT8_MIN] ; }
                        channels[i] = <uint8>v ; 
                    }
                    if (parser!.short) {
                        channels = channels.map(v => ((v<<4) | v) as uint8)
                    }
                    let alpha = m!.length === 5 ? <uint8>parseInt(m![4], 16) : UINT8_MAX ;
                    return [channels, alpha] ;
                }
            }
        }
        return [null, UINT8_MIN] ;
    }
}


function _isShortRGB(R:uint8, G:uint8, B:uint8) {
    return (R >> 4 & 0x0f) === (R & 0x0f) && 
           (G >> 4 & 0x0f) === (G & 0x0f) &&
           (B >> 4 & 0x0f) === (B & 0x0f) ;
}

function _colorToShortCSS(R:uint8, G:uint8, B:uint8, uppercase?:Nullable<boolean>):string {
    const lc = !uppercase ;
    return `#${R.toHex1(lc)}${G.toHex1(lc)}${B.toHex1(lc)}` ;
}
export interface TSColorConstructor {
    new (colorSpace:TSColorSpace, channels:number[], alpha:number, name?:string): TSColor;
}

function _colorToStandardCSS(R:uint8, G:uint8, B:uint8, A?:Nullable<uint8>, uppercase?:Nullable<boolean>):string {
    const lc = !uppercase ;
    return $ok(A) ? `#${R.toHex2(lc)}${G.toHex2(lc)}${B.toHex2(lc)}${A!.toHex2(lc)}`
                  : `#${R.toHex2(lc)}${G.toHex2(lc)}${B.toHex2(lc)}`
}

interface _StringColorRegex {
    rx: RegExp ;
    short:boolean ;
}
function _component(x:number):number { return isNaN(x) ? 0 : Math.min(1, Math.max(0, x)) ; }

function _cmykLighter(X:number):number { X = _component(X) ; return -(X*X)/3.0+5.0*(X)/6.0 ; }
function _cmykDarker(X:number):number  { X = _component(X) ; return 2*(X*X)/3.0+X/2.0+0.25 ; }

function _rgbLighter(X:number):uint8   { return ((_cmykDarker(X/255.0) * 255) | 0) as uint8}
function _rgbDarker(X:number):uint8   { return ((_cmykLighter(X/255.0) * 255) | 0) as uint8}
