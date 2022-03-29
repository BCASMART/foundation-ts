/// <reference types="node" />
import { TSDate } from "./tsdate";
import { Locales } from "./tsdefaults";
import { int, uint, language, email, url, uuid, Comparison, isodate, country, Address } from "./types";
export declare function $ok(o: any | undefined | null): boolean;
export declare function $isstring(o: any | null | undefined): boolean;
export declare function $isnumber(o: any | null | undefined): boolean;
export declare function $isint(o: any | null | undefined): boolean;
export declare function $isunsigned(o: any | null | undefined): boolean;
export declare function $isbool(o: any | null | undefined): boolean;
export declare function $isobject(o: any | null | undefined): boolean;
export declare function $isarray(o: any | null | undefined): boolean;
export declare function $intornull(n: string | number | null | undefined): int | null;
export declare function $int(n: string | number | null | undefined, defaultValue?: int): int;
export declare function $regexvalidatedstring<T>(regex: RegExp, s: string | null | undefined): T | null;
export declare function $email(s: string | null | undefined): email | null;
export declare function $url(s: string | null | undefined): url | null;
export declare function $uuid(s: string | null | undefined): uuid | null;
export declare function $isodate(s: Date | TSDate | string | null | undefined): isodate | null;
export declare function $country(s: string | null | undefined): country | null;
export declare function $language(s: string | null | undefined): language | null;
export declare function $address(a: Address | null | undefined): Address | null;
export declare function $unsignedornull(n: string | number | null | undefined): uint | null;
export declare function $unsigned(n: string | number | null | undefined, defaultValue?: uint): uint;
export declare function $div(a: number, b: number): number;
export declare function $string(v: any): string;
export declare function $strings(e: string[] | string | undefined | null): string[];
export declare function $trim(s: string | undefined | null): string;
export declare function $fpad2(v: uint): string;
export declare function $fpad3(v: uint): string;
export declare function $fpad4(v: uint): string;
export declare function $ascii(source: string | undefined | null): string;
export declare function $numcompare(a: number, b: number): Comparison;
export declare function $datecompare(a: number | string | Date | TSDate | null | undefined, b: number | string | Date | TSDate | null | undefined): Comparison;
export declare function $compare(a: any, b: any): Comparison;
export declare function $equal(a: any, b: any): any;
export declare function $count(a: any[] | undefined | null): number;
export declare function $length(s: string | Buffer | undefined | null): number;
export declare function $lengthin(s: string | Buffer | undefined | null, min?: number, max?: number): boolean;
export declare function $arraybuffer(buf: Buffer): ArrayBuffer;
export declare function $map<T, R>(a: Array<T> | undefined | null, callBack: (e: T) => R | null | undefined): Array<R>;
export declare function $jsonobj(v: any): any;
export declare function $json(v: any, replacer?: (number | string)[] | null, space?: string | number): string;
export declare function $timeout(promise: Promise<any>, time: number, exception: any): Promise<any>;
export declare function $exit(reason?: string, status?: number, name?: string): void;
export declare function $default(key: string): any;
export declare function $setdefault(key: string, value?: any): void;
export declare function $removedefault(key: string): void;
export declare function $locales(lang?: language | undefined | null): Locales;
