/**
 * 	All File System operations are maint to be in this file
 *  This means that no import of 'fs' module shouls apear elsewere
 *
 *  We also tries to use sync functions in order not to publish async functions
 *  for those basic stiff. It could be changed at any moment
 *  by using fs.promises...
 */
/// <reference types="node" />
export declare function $isfile(src: string | null | undefined): boolean;
export declare function $isdirectory(src: string | null | undefined): boolean;
export declare function $createDirectory(p: string | null | undefined): boolean;
export declare function $filesize(src: string | null | undefined): number;
export declare function $uniquefile(src: string | null | undefined): string;
export declare function $path(...paths: string[]): string;
export declare function $ext(s: string): string;
export declare function $withoutext(s: string): string;
export declare function $dir(s: string): string;
export declare function $filename(s: string): string;
export declare function $loadJSON(src: string | null | undefined): any | null;
export declare function $defaultpath(): string;
export declare function $readString(src: string | null | undefined, encoding?: BufferEncoding): string | null;
export declare function $writeString(src: string | null | undefined, str: string, encoding?: BufferEncoding): boolean;
export declare function $readBuffer(src: string | null | undefined): Buffer | null;
export declare function $writeBuffer(src: string | null | undefined, buf: Buffer): boolean;
export declare function $removeFile(src: string | null | undefined): boolean;
export declare function $realMoveFile(src: string | null | undefined, dest: string | null | undefined): boolean;
export declare function $copyFile(src: string | null | undefined, dest: string | null | undefined, overwrite?: boolean): boolean;
