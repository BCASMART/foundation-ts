/**
 * if you want to change the subfolders to be tested
 * you should use the static method setSubfolders() before
 * calling any functions using LocalDefaults
 */
export declare class LocalDefaults {
    private static __instance;
    private static __subfolders;
    defaultPath: string;
    private constructor();
    static setSubfolders(folders: string[]): void;
    static defaults(): LocalDefaults;
}
