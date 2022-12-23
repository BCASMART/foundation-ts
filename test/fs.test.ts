import { join } from 'path';
import { $defined, $length, $ok } from '../src/commons';
import { $createDirectory, $dir, $ext, $filename, $fullWriteString, $isabsolutepath, $isdirectory, $isfile, $isreadable, $iswritable, $loadJSON, $normalizepath, $path, $readString, $writeString } from '../src/fs';
import { TSTest, TSTestGroup } from '../src/tstester';
import { Nullable } from '../src/types';
import { $inbrowser, $logterm } from "../src/utils";

interface FSTestPath {
    path: string ;
    absolute: boolean ;
    normalized: string ;
    dirname: string ;
    filename: string ;
    extname: string ;
}

interface FSTestJoin {
    source: string ;
    complement: string ;
    join: string ;
}
interface FSTestDB {
    paths: FSTestPath[] ;
    joins: FSTestJoin[] ;
}
let isWindowsOS:boolean|undefined = undefined ;
let fsTestDB:FSTestDB|undefined = undefined ;

function isWindows():boolean {
    if (!$defined(isWindowsOS)) { isWindowsOS = !$inbrowser() && process?.platform === "win32" ; }
    return isWindowsOS! ;
}

function fsTestDatabase():FSTestDB {
    if (!$defined(fsTestDB)) {
        const fileName = join(__dirname, isWindows() ? 'paths-windows.json' : 'paths-standard.json') ;
        fsTestDB = $loadJSON(fileName) ;
        if (!$ok(fsTestDB)) {
            $logterm(`&R  &wUnable to load file JSON test file ${fileName}  &0`) ;
            throw `Unable to load file JSON test file ${fileName}` ;
        }
    }
    return fsTestDB as FSTestDB ;
}

function _ext(s:Nullable<string>, internal:boolean = false):string 
{
    const e = $ext(s, internal) ; 
    return e.length > 0 ? '.'+e : '' ;
}

export const fsGroups = [
    TSTest.group("Testing standard simple paths functions", async (group) => {
        fsTestDatabase().paths.forEach(def => { 
            group.unary(`stnd path "${def.path}"`, async (t) => {
                t.expectA($isabsolutepath(def.path)).is(def.absolute) ;
                t.expectD($dir(def.path)).is(def.dirname) ;
                t.expectE(_ext(def.path)).is(def.extname) ;
                t.expectF($filename(def.path)).is(def.filename) ;
                t.expectN($normalizepath(def.path)).is(def.normalized) ;
            }) ;
        }) ;
    }),
    TSTest.group("Testing $path(standard) function", async (group) => {
        fsTestDatabase().joins.forEach(j => {
            group.unary(`stnd "${j.source}"+"${j.complement}"`, async (t) => {
                t.expect($path(j.source, j.complement)).is(j.join) ;
            }) ;
        }) ;
    })
] ;

constructOptionalFSGroups(fsGroups) ;

function constructOptionalFSGroups(groups:TSTestGroup[]) {
    if (!isWindows()) {
        groups.push(TSTest.group("Testing foundation-ts simple paths functions", async (group) => {
            fsTestDatabase().paths.forEach(def => { 
                group.unary(`fnts "${def.path}"`, async (t) => {
                    t.expectA($isabsolutepath(def.path, true)).is(def.absolute) ;
                    t.expectD($dir(def.path, true)).is(def.dirname) ;
                    t.expectE(_ext(def.path, true)).is(def.extname) ;
                    t.expectF($filename(def.path, true)).is(def.filename) ;
                    t.expectN($normalizepath(def.path)).is(def.normalized) ;
                }) ;
            }) ;
        })) ;
        groups.push(TSTest.group("Testing $path(foundation-ts) function", async (group) => {
            fsTestDatabase().joins.forEach(j => {
                group.unary(`fdts "${j.source}"+"${j.complement}"`, async (t) => {
                    t.expect($path(true, j.source, j.complement)).is(j.join) ;
                }) ;
            }) ;
        })) ;
    }
    if (!$inbrowser()) {
        groups.push(TSTest.group("Other backend FS functions", async (group) => {
            group.unary('testing $createdirectory(), $...writeString(), $readstring(), $isreadable()... functions', async (t) => {
                const folder = $path($dir(__dirname), 'output') ;
                t.register("Folder", folder) ;
                t.expect0($createDirectory(folder)).true() ;
                t.expect1($isdirectory(folder)).true() ;
                t.expect2($isfile(folder)).toBeFalsy() ;
                const str = "Sursum" ;
                const file = $path(folder, 'sc.txt') ;
                t.expect3($writeString(file, str)).true() ;
                t.expect4($readString(file)).is(str) ;
                const str2 = str + ' Corda' ;
                const [wres2, prec2] = $fullWriteString(file,  str2, { attomically:true, removePrecedentVersion:true }) ;
                t.expect5(wres2).true() ;
                t.expect6(prec2).toBeNull() ;
                t.expect7($readString(file)).is(str2) ;
        
                const str3 = str2 + ' 2' ;
                const [wres3, prec3] = $fullWriteString(file,  str3, { attomically:true }) ;
                t.expect8(wres3).true() ;
                t.expect9($length(prec3)).gt(0) ;
                t.expectA($readString(file)).is(str3) ;
                t.expectB($readString(prec3)).is(str2) ;
                t.expectC($isreadable(file)).true() ;
                t.expectD($iswritable(file)).true() ;
            }) ;    
    
        })) ;
    }
}
