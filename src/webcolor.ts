import { $isnumber, $isstring, $isunsigned, $ok } from "./commons";
import { AnyDictionary, StringDictionary, uint, UINT32_MAX, uint8, UINT8_MAX } from "./types";

export const WebColorNames: StringDictionary = {
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
  green: "#008000",
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

const WebColorsHexParsers:AnyDictionary = {
    4: {
        rx: /^#([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])$/,
        short: true
    },
    7: {
        rx: /^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/,
        short: false
    },
    9: {
        rx: /^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/,
        short: false
    }
}

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

export class WebColor {
  public red: uint8;
  public green: uint8;
  public blue: uint8;
  public alpha: uint8;

  static readonly red = new WebColor(0xff, 0, 0);
  static readonly green = new WebColor(0, 0xff, 0);
  static readonly yellow = new WebColor(0xff, 0xff, 0);
  static readonly blue = new WebColor(0, 0, 0xff);
  static readonly cyan = new WebColor(0, 0xff, 0xff);
  static readonly magenta = new WebColor(0xff, 0, 0xff);
  static readonly white = new WebColor(0xff, 0xff, 0xff);
  static readonly black = new WebColor(0, 0, 0);
  static darkWriteColor = WebColor.black;
  static lightWriteColor = WebColor.white;

  constructor(stringColor: string);
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
    } else if (n === 1) {
      if ($isstring(arguments[0])) {
        let s = arguments[0] as string;
        s = s.replace(/ /g, ""); // TODO: do we need to accept '-' as a spacer here ?
        s = WebColorNames[s.toLowerCase()] || s;
        let parser = WebColorsHexParsers[s.length];
        let m = parser?.match(parser.rx);
        if ($ok(m)) {
          this.red = <uint8>parseInt(m[1], 16);
          this.green = <uint8>parseInt(m[2], 16);
          this.blue = <uint8>parseInt(m[3], 16);
          if (parser?.short) {
            this.red = <uint8>((this.red << 4) | this.red);
            this.green = <uint8>((this.green << 4) | this.green);
            this.blue = <uint8>((this.blue << 4) | this.blue);
          }
          this.alpha = m.length === 5 ? <uint8>parseInt(m[4], 16) : UINT8_MAX;
          return;
        }
      } else if ($isnumber(arguments[0])) {
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

  public isEqual(other: any): boolean {
    return (
      other instanceof WebColor &&
      other.red === this.red &&
      other.green === this.green &&
      other.blue === this.blue &&
      other.alpha === this.alpha
    );
  }

  public luminance(): number {
    return (0.3 * this.red + 0.59 * this.green + 0.11 * this.blue) / 255.0;
  }
  public isPale(): boolean {
    return this.luminance() > 0.6;
  }

  public lighterColor(): WebColor {
    return new WebColor(
      $lighter(this.red),
      $lighter(this.green),
      $lighter(this.blue),
      this.alpha
    );
  }
  public darkerColor(): WebColor {
    return new WebColor(
      $darker(this.red),
      $darker(this.green),
      $darker(this.blue),
      this.alpha
    );
  }

  public lightestColor(): WebColor {
    return new WebColor(
      $lightest(this.red),
      $lightest(this.green),
      $lightest(this.blue),
      this.alpha
    );
  }
  public darkestColor(): WebColor {
    return new WebColor(
      $darkest(this.red),
      $darkest(this.green),
      $darkest(this.blue),
      this.alpha
    );
  }

  public matchingColor(): WebColor {
    return this.isPale() ? this.darkestColor() : this.lightestColor();
  }
  public writingColor(): WebColor {
    return this.isPale() ? WebColor.darkWriteColor : WebColor.lightWriteColor;
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
