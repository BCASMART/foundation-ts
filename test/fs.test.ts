import { $defined, $length, $ok } from '../src/commons';
import { $absolute, $createDirectory, $currentdirectory, $dir, $ext, $extset, $filename, $fullWriteString, $homedirectory, $isabsolute, $isabsolutepath, $isdirectory, $isfile, $isreadable, $iswritable, $loadJSON, $normalizepath, $path, $readString, $writeBuffer, $writeString } from '../src/fs';
import { TSTest, TSTestGroup } from '../src/tstester';
import { Nullable } from '../src/types';
import { $inbrowser, $logterm } from "../src/utils";
import { sep } from 'path';
import { $hash, $hashfile } from '../src/crypto';
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
let posixTestDB:FSTestDB|undefined = undefined ;

/**
 * WARNING: paths functions internalImplementation does not work on Windows,
 * because it conforms to posix. So, don't test internal implementation on Windows
 */

function isWindows():boolean {
    if (!$defined(isWindowsOS)) { isWindowsOS = !$inbrowser() && process && process?.platform === "win32" ; }
    return isWindowsOS! ;
}

function commonTestDatabase():FSTestDB {
    if (!$defined(fsTestDB)) {
        fsTestDB = fsTestDatabase() ;
    }
    return fsTestDB as FSTestDB ;
}

function posixTestDatabase():FSTestDB {
    if (!$defined(posixTestDB)) {
        posixTestDB = fsTestDatabase(true) ;
    }
    return posixTestDB as FSTestDB ;

}

function fsTestDatabase(forcePosix:boolean = false):FSTestDB {
    const fileName = $absolute($path('test', `paths-${isWindows() && !forcePosix ? "windows" : "standard"}.json`)) ;
    const db = $loadJSON(fileName) ;
    if (!$ok(db)) {
        $logterm(`&R  &wUnable to load file JSON test file ${fileName}  &0`) ;
        throw `Unable to load file JSON test file ${fileName}` ;
    }
    return db as FSTestDB ;
}

function _ext(s:Nullable<string>, internal:boolean = false):string 
{
    const e = $ext(s, internal) ; 
    return e.length > 0 ? '.'+e : '' ;
}

export const fsGroups = [
    TSTest.group("standard $path() function", async (group) => {
        commonTestDatabase().joins.forEach(j => {
            group.unary(`stnd "${j.source}"+"${j.complement}"`, async (t) => {
                t.expect($path(j.source, j.complement)).is(j.join) ;
            }, { silent: true }) ;
        }) ;
    }),
    TSTest.group("foundation-ts $path() function", async (group) => {
        posixTestDatabase().joins.forEach(j => {
            group.unary(`stnd "${j.source}"+"${j.complement}"`, async (t) => {
                t.expect($path(true, j.source, j.complement)).is(j.join) ;
            }, { silent: true }) ;
        }) ;
    }),
    TSTest.group("standard other paths functions", async (group) => {
        commonTestDatabase().paths.forEach(def => { 
            group.unary(`stnd path "${def.path}"`, async (t) => {
                t.expectA($isabsolutepath(def.path)).is(def.absolute) ;
                t.expectD($dir(def.path)).is(def.dirname) ;
                t.expectE(_ext(def.path)).is(def.extname) ;
                t.expectF($filename(def.path)).is(def.filename) ;
                t.expectN($normalizepath(def.path)).is(def.normalized) ;
            }, { silent: true }) ;
        }) ;
    }),
    TSTest.group("foundation-ts other paths functions", async (group) => {
        posixTestDatabase().paths.forEach(def => { 
            group.unary(`stnd path "${def.path}"`, async (t) => {
                t.expectA($isabsolutepath(def.path,true)).is(def.absolute) ;
                t.expectD($dir(def.path, true)).is(def.dirname) ;
                t.expectE(_ext(def.path, true)).is(def.extname) ;
                t.expectF($filename(def.path, true)).is(def.filename) ;
                t.expectN($normalizepath(def.path, true)).is(def.normalized) ;
            }, { silent: true }) ;
        }) ;
    })
] ;

constructOptionalFSGroups(fsGroups) ;

function constructOptionalFSGroups(groups:TSTestGroup[]) {
    if (!$inbrowser()) {
        groups.push(TSTest.group("Other backend FS functions", async (group) => {
            const curdir = $currentdirectory() ;
            const homedir = $homedirectory() ;

            group.unary('$isabsolute() and $absolute() functions', async (t) => {
                t.register('curdir', curdir) ;
                t.register('homedir', homedir) ;
                t.expect0($isabsolute(curdir)).OK() ;
                t.expect1($isabsolute(homedir)).OK() ;
                t.expect2($absolute('~')).is(homedir) ;
                t.expect3($absolute('')).is(curdir) ;
                t.expect4($absolute('.')).is(curdir) ;
                t.expect5($absolute(`${sep}toto`)).is(`${sep}toto`) ;
                t.expect6($absolute(`.${sep}toto`)).is($path(curdir, 'toto')) ;
                t.expect7($absolute(`~${sep}`)).is(homedir) ;
                t.expect8($absolute(`~${sep}toto`)).is($path(homedir, 'toto')) ;
                t.expect9($absolute(`${sep}`)).is(`${sep}`) ;
                t.expectA($isabsolute('')).false() ;
                t.expectB($isabsolute('.')).false() ;
                t.expectC($isabsolute('~')).false() ;
                t.expectD($isabsolute(`${sep}`)).true() ;
                t.expectE($isabsolute(`${sep}toto`)).true() ;
                t.expectF($absolute('toto')).is($path(curdir, 'toto')) ;
                t.expectG($absolute('./toto')).is($path(curdir, 'toto')) ;
                t.expectH($absolute('~/')).is(homedir) ;
                t.expectI($absolute('~/toto')).is($path(homedir, 'toto')) ;
                t.expectJ($absolute(`toto${sep}tata${sep}tutu`)).is($path(curdir, 'toto', 'tata', 'tutu')) ;
                t.expectK($absolute(`toto${sep}tata/tutu`)).is($path(curdir, 'toto', 'tata', 'tutu')) ;
                t.expectL($absolute('toto/tata/tutu')).is($path(curdir, 'toto', 'tata', 'tutu')) ;
                t.expectM($absolute('toto/tata/tutu/')).is($path(curdir, 'toto', 'tata', 'tutu')+sep) ;
            }) ;
            group.unary('$createdirectory(), $...writeString(), $readstring(), $isreadable()... functions', async (t) => {
                const folder = $absolute($path('tdist', 'output')) ;
                t.register("Folder", folder) ;
                t.expect0($createDirectory(folder)).true() ;
                t.expect1($isdirectory(folder)).true() ;
                t.expect2($isfile(folder)).toBeFalsy() ;

                const fileb = $path(folder, 'sc0.txt') ;
                const source = Buffer.from([0x30,0x31,0x32,0x33,0x34,0x35,0x36,0x37,0x38,0x39]) ;
                t.expect3($writeBuffer(fileb, source, { attomically:true })).true() ;
                t.expect4($readString(fileb)).toBe('0123456789') ;

                const str = "Sursum" ;                
                const file = $path(folder, 'sc.txt') ;
                t.expectA($writeString(file, str)).true() ;
                t.expectB($readString(file)).is(str) ;
                const str2 = str + ' Corda' ;
                const [wres2, prec2] = $fullWriteString(file,  str2, { attomically:true, removePrecedentVersion:true }) ;
                t.expectC(wres2).true() ;
                t.expectD(prec2).toBeNull() ;
                t.expectE($readString(file)).is(str2) ;
        
                const str3 = str2 + ' 2' ;
                const [wres3, prec3] = $fullWriteString(file,  str3, { attomically:true }) ;
                const memhash = $hash(str3) ;
                const hash = await $hashfile(file) ;
                t.expectF(wres3).true() ;
                t.expectG($length(prec3)).gt(0) ;
                t.expectH($readString(file)).is(str3) ;
                t.expectI($readString(prec3)).is(str2) ;
                t.expectJ($isreadable(file)).true() ;
                t.expectK($iswritable(file)).true() ;
                t.expectL(hash).is(memhash) ;
            }) ;    

            group.unary('$extset() function', async (t) => {
                const ns = new Set<string>() ;
                const jns = new Set<string>(['json']) ;
                const exts = new Set(['jsonb', 'json', 'geojs']) ; 
                t.expect0($extset(null)).is(ns) ;
                t.expect1($extset(undefined)).is(ns) ;
                t.expect2($extset('')).is(ns) ;
                t.expect3($extset([])).is(ns) ;
                t.expect4($extset([''])).is(ns) ;
                t.expect5($extset('json')).is(jns) ;
                t.expect6($extset('.json')).is(jns) ;
                t.expect7($extset('.JSON')).is(jns) ;
                t.expect8($extset(['json'])).is(jns) ;
                t.expect9($extset('JSon')).is(jns) ;
                t.expectA($extset(['JSON'])).is(jns) ;
                t.expectB($extset(['JSON', '.jSon'])).is(jns) ;
                t.expectC($extset(['   ','JSON', '.jSon', ''])).is(jns) ;
                t.expectD($extset(['json', 'jsonB', 'GEOJs', ''])).is(exts) ;
                t.expectE($extset(['.JSON', 'json', 'jsonB', 'GEOJs', '.geojs'])).is(exts) ;
            }) ;    
        })) ;
    }
}
