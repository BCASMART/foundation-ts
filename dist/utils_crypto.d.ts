/// <reference types="node" />
import { uuid } from './types';
export declare function $uuid(namespace?: string, data?: string): uuid;
export declare enum HashMethod {
    SHA256 = "SHA256",
    SHA384 = "SHA384",
    SHA512 = "SHA512"
}
export declare function $encrypt(source: string, key: string): string | null;
export declare function $decrypt(source: string, key: string): string | null;
export declare function $hash(buf: Buffer, method?: HashMethod): string;
export declare function $hashfile(filePath: string | null | undefined, method?: HashMethod): Promise<string | null>;
interface PasswordOptions {
    hasLowercase?: boolean;
    hasUppercase?: boolean;
    hasNumeric?: boolean;
    hasSpecials?: boolean;
}
export declare function $random(max: number): number;
export declare function $password(len: number, opts?: PasswordOptions): string | null;
export {};
