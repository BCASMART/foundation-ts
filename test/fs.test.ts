import { $defined, $isstring, $length, $ok } from '../src/commons';
import { $absolute, $chmod, $commonstats, $copyFile, $createDirectory, $currentdirectory, $dir, $ext, $extset, $filename, $filesize, $fullWriteBuffer, $fullWriteString, $homedirectory, $isabsolute, $isabsolutepath, $isdirectory, $isexecutable, $isexecutablefile, $isfile, $isreadable, $iswritable, $loadJSON, $localRenameFile, $normalizepath, $path, $readBuffer, $readData, $readString, $realMoveFile, $removeFile, $safeFilename, $stats, $temporarypath, $uniquefile, $writeBuffer, $writeString } from '../src/fs';
import { $tmp } from '../src/tsdefaults';
import { TSTest, TSTestGroup } from '../src/tstester';
import { Nullable } from '../src/types';
import { $inbrowser, $logterm } from "../src/utils";
import { sep } from 'path';
import { $hash, $hashfile } from '../src/crypto';
import { TSError } from '../src/tserrors';
// browser build / jsdom : $absolute()/$loadJSON() assert against a browser env,
// so the path test database is inlined instead of read from disk. On a browser
// $isabsolutepath/$normalizepath/$path/$ext/$dir/$filename all take their posix
// "internal" branch, which is exactly what the "standard" fixture describes.
import pathsStandardJSON from './paths-standard.json' ;
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
    if ($inbrowser()) { return pathsStandardJSON as unknown as FSTestDB ; }
    const fileName = $absolute($path('test', `paths-${isWindows() && !forcePosix ? "windows" : "standard"}.json`)) ;
    const db = $loadJSON(fileName) ;
    if (!$ok(db)) {
        $logterm(`&R  &wUnable to load file JSON test file ${fileName}  &0`) ;
        TSError.throw(`Unable to load file JSON test file ${fileName}`) ;
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
                t.expect2($isfile(folder)).false() ;

                const fileb = $path(folder, 'sc0.txt') ;
                const source = Buffer.from([0x30,0x31,0x32,0x33,0x34,0x35,0x36,0x37,0x38,0x39]) ;
                t.expect3($writeBuffer(fileb, source, { attomically:true })).true() ;
                t.expect4($readString(fileb)).is('0123456789') ;

                const str = "Sursum" ;                
                const file = $path(folder, 'sc.txt') ;
                t.expectA($writeString(file, str)).true() ;
                t.expectB($readString(file)).is(str) ;
                const str2 = str + ' Corda' ;
                const [wres2, prec2] = $fullWriteString(file,  str2, { attomically:true, removePrecedentVersion:true }) ;
                t.expectC(wres2).true() ;
                t.expectD(prec2).null() ;
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
            group.unary('$loadJSON() function', async (t) => {
                const folder = $absolute($path('tdist', 'output')) ;
                $createDirectory(folder) ;
                const okFile      = $path(folder, 'loadjson-ok.json') ;
                const txtFile     = $path(folder, 'loadjson-data.txt') ;
                const commentFile = $path(folder, 'loadjson-comments.json') ;
                const brokenFile  = $path(folder, 'loadjson-broken.json') ;
                $writeString(okFile, `{"a":1,"b":[2,3]}`) ;
                $writeString(txtFile, `{"a":1}`) ;
                $writeString(commentFile, `{ /* c */ "a":1 } // trailing`) ;
                $writeString(brokenFile, `{ not json `) ;

                t.expect0($loadJSON(okFile)).is({ a:1, b:[2,3] }) ;
                t.expect1($loadJSON(commentFile)).is({ a:1 }) ;              // comments are stripped
                t.expect2($loadJSON(txtFile)).null() ;                       // wrong extension -> not read, no throw
                t.expect3($loadJSON(txtFile, 'txt')).is({ a:1 }) ;          // ...unless explicitly accepted
                t.expect4($loadJSON(txtFile, ['md', 'txt'])).is({ a:1 }) ;
                t.expect5($loadJSON(null)).null() ;
                t.expect6($loadJSON(undefined)).null() ;
                t.expect7($loadJSON('')).null() ;
                t.expect8($loadJSON(Buffer.from(`{"a":1}`))).null() ;        // non-string source -> null
                t.expect9($loadJSON($path(folder, 'does-not-exist.json'))).null() ;
                t.expectA($loadJSON(brokenFile)).null() ;                    // invalid JSON -> null
            }) ;
            group.unary('$stats() / $commonstats() / $filesize()', async (t) => {
                const folder = $absolute($path('tdist', 'output')) ;
                $createDirectory(folder) ;
                const f = $path(folder, 'stats-probe.txt') ;
                $writeString(f, 'hello world') ;      // 11 bytes
                try {
                    t.expect0($stats(f)?.isFile()).true() ;
                    t.expect1($stats('/no/such/path/xyz')).null() ;
                    t.expect2($stats(null)).null() ;
                    t.expect3($stats('')).null() ;
                    t.expect4($filesize(f)).is(11) ;
                    t.expect5($filesize('/no/such/path')).is(0) ;

                    const cs = $commonstats(f) ;
                    t.expect6(cs.exists).true() ;
                    t.expect7(cs.file).true() ;
                    t.expect8(cs.directory).false() ;
                    t.expect9(Number(cs.size)).is(11) ;
                    t.expectA(cs.readable).true() ;
                    t.expectB(cs.writable).true() ;

                    const dcs = $commonstats(folder) ;
                    t.expectC(dcs.directory).true() ;
                    t.expectD(dcs.file).false() ;

                    const missing = $commonstats('/no/such/path/xyz') ;
                    t.expectE(missing.exists).false() ;
                    t.expectF(Number(missing.size)).is(0) ;
                    t.expectG($commonstats(null).exists).false() ;
                    t.expectH($commonstats('').exists).false() ;
                }
                finally { $removeFile(f) ; }
            }) ;

            group.unary('$chmod() / $isexecutable() / $isexecutablefile()', async (t) => {
                const folder = $absolute($path('tdist', 'output')) ;
                $createDirectory(folder) ;
                const f = $path(folder, 'chmod-probe.sh') ;
                $writeString(f, '#!/bin/sh\necho hi\n') ;
                try {
                    t.expect0($isexecutable(f)).false() ;
                    t.expect1($isexecutablefile(f)).false() ;
                    t.expect2($chmod(f, 0o755)).true() ;
                    t.expect3($isexecutable(f)).true() ;
                    t.expect4($isexecutablefile(f)).true() ;
                    t.expect5($isexecutable(folder)).true() ;      // directories are traversable
                    t.expect6($isexecutablefile(folder)).false() ; // ...but not a "file"
                    t.expect7($chmod(f, 0o1000 as any)).false() ;  // mode > 0o777 -> refused
                    t.expect8($chmod('/no/such/path', 0o644)).false() ;
                    t.expect9($chmod(null, 0o644)).false() ;
                    t.expectA($chmod(f, -1 as any)).false() ;
                }
                finally { $chmod(f, 0o644) ; $removeFile(f) ; }
            }) ;

            group.unary('$temporarypath() / $uniquefile()', async (t) => {
                const tp = $temporarypath('log', 'app') ;
                t.expect0($isstring(tp)).true() ;
                t.expect1(tp.startsWith($tmp())).true() ;
                t.expect2($ext(tp)).is('log') ;
                t.expect3($temporarypath() !== $temporarypath()).true() ;   // unique each call

                const u1 = $uniquefile() ;
                t.expect4($uniquefile() !== u1).true() ;
                t.expect5($ext($uniquefile('report.pdf'))).is('pdf') ;       // keeps source ext
                t.expect6($ext($uniquefile('report.pdf', 'txt'))).is('txt') ; // explicit ext wins
                t.expect7($uniquefile('report.csv').includes('report-')).true() ;
            }) ;

            group.unary('$readBuffer() / $readData()', async (t) => {
                const folder = $absolute($path('tdist', 'output')) ;
                $createDirectory(folder) ;
                const f = $path(folder, 'readdata-probe.bin') ;
                $writeBuffer(f, Buffer.from([1, 2, 3, 4, 5])) ;
                try {
                    const b = $readBuffer(f) ;
                    t.expect0($ok(b)).true() ;
                    t.expect1(b!.length).is(5) ;
                    t.expect2($readBuffer('/no/such/file')).null() ;
                    t.expect3($readBuffer(null)).null() ;

                    const d = $readData(f) ;
                    t.expect4($ok(d)).true() ;
                    t.expect5(d!.length).is(5) ;
                    t.expect6(Array.from(d!.mutableBuffer)).is([1, 2, 3, 4, 5]) ;
                    t.expect7($readData('/no/such/file')).null() ;
                }
                finally { $removeFile(f) ; }
            }) ;

            group.unary('$fullWriteBuffer() — byte range, atomic with precedent, bad target', async (t) => {
                const folder = $absolute($path('tdist', 'output')) ;
                $createDirectory(folder) ;
                const f = $path(folder, 'fwb-probe.bin') ;
                try {
                    // write only bytes [2..5) of the source
                    const [ok0] = $fullWriteBuffer(f, Buffer.from([10, 11, 12, 13, 14, 15]), { byteStart: 2, byteEnd: 5 }) ;
                    t.expect0(ok0).true() ;
                    t.expect1(Array.from($readBuffer(f)!)).is([12, 13, 14]) ;

                    // atomic rewrite keeping the precedent version
                    const [ok1, prec1] = $fullWriteBuffer(f, Buffer.from([99]), { attomically: true }) ;
                    t.expect2(ok1).true() ;
                    t.expect3($length(prec1)).gt(0) ;
                    t.expect4(Array.from($readBuffer(f)!)).is([99]) ;
                    t.expect5(Array.from($readBuffer(prec1!)!)).is([12, 13, 14]) ;
                    $removeFile(prec1!) ;

                    // atomic write of a brand new file (no precedent)
                    const g = $path(folder, 'fwb-new.bin') ;
                    const [ok2, prec2] = $fullWriteBuffer(g, Buffer.from([7]), { attomically: true }) ;
                    t.expect6(ok2).true() ;
                    t.expect7(prec2).null() ;
                    $removeFile(g) ;

                    // target is a directory -> refused
                    const [ok3] = $fullWriteBuffer(folder, Buffer.from([1]), {}) ;
                    t.expect8(ok3).false() ;
                    // bad options
                    const [ok4] = $fullWriteBuffer(f, Buffer.from([1]), { byteStart: -1 }) ;
                    t.expect9(ok4).false() ;
                    t.expectA($fullWriteBuffer(null, Buffer.from([1]), {})[0]).false() ;
                }
                finally { $removeFile(f) ; }
            }) ;

            group.unary('$localRenameFile() / $removeFile() / $realMoveFile() / $copyFile()', async (t) => {
                const folder = $absolute($path('tdist', 'output')) ;
                const sub = $path(folder, 'mv-sub') ;
                $createDirectory(sub) ;
                const a = $path(folder, 'mv-a.txt') ;
                const b = $path(folder, 'mv-b.txt') ;

                $writeString(a, 'A') ;
                t.expect0($localRenameFile(a, b)).true() ;
                t.expect1($isfile(a)).false() ;
                t.expect2($readString(b)).is('A') ;
                t.expect3($localRenameFile(b, b)).false() ;              // same path
                t.expect4($localRenameFile('/no/such', b)).false() ;    // src not a file

                // move b into a directory
                t.expect5($realMoveFile(b, sub)).true() ;
                t.expect6($isfile($path(sub, 'mv-b.txt'))).true() ;
                t.expect7($realMoveFile('/no/such', sub)).false() ;

                // copy
                const c = $path(sub, 'mv-b.txt') ;
                const d = $path(folder, 'mv-copy.txt') ;
                t.expect8($copyFile(c, d)).true() ;
                t.expect9($readString(d)).is('A') ;
                t.expectA($copyFile(c, d)).false() ;                    // exists, no overwrite
                t.expectB($copyFile(c, d, true)).true() ;               // overwrite
                t.expectC($copyFile(c, folder)).true() ;                // into a directory
                t.expectD($isfile($path(folder, 'mv-b.txt'))).true() ;
                t.expectE($copyFile('/no/such', d)).false() ;
                t.expectF($copyFile(c, c)).false() ;                    // same path

                // cleanup
                t.expectG($removeFile(d)).true() ;
                t.expectH($removeFile(d)).false() ;                     // already gone
                t.expectI($removeFile(folder)).false() ;               // not a file
                $removeFile(c) ;
                $removeFile($path(folder, 'mv-b.txt')) ;
            }) ;

            group.unary('$safeFilename() and internal $path/$dir/$filename', async (t) => {
                t.expect0($safeFilename('/a/b/rap port final(2024).pdf')).is('rap port final(2024).pdf') ; // non-posix keeps spaces
                t.expect1($safeFilename(null)).is('') ;
                t.expect2($safeFilename('/a/b/rap port final(2024).pdf', true)).is('rap_port_final_2024_.pdf') ; // posix squeezes to [_A-Za-z0-9.]
                t.expectJ($safeFilename('/a/b/Éléphant.txt')).is('Elephant.txt') ;            // accents folded, case kept

                t.expect3($path(true, '/a/b', '../c', './d', 'e')).is('/a/c/d/e') ;
                t.expect4($path(true, 'a', '..', '..', 'b')).is('../b') ;
                t.expect5($path(true, '/', '..', 'x')).is('/x') ;
                t.expect6($path(true, '', '')).is('') ;
                t.expect7($dir('/a/b/c/', true)).is('/a/b') ;
                t.expect8($dir('///', true)).is('/') ;
                t.expect9($dir('x', true)).is('.') ;
                t.expectA($filename('/a/b/c///', true)).is('c') ;
                t.expectB($filename('///', true)).is('') ;
            }) ;

            group.unary('paths methods on String', async t => {
                t.expect0('toto.pdf'.extension()).is('pdf') ;
                t.expect1('toto.PDF'.ext()).is('PDF') ;
                t.expect2('toto'.hasExtension()).true() ;
                t.expect3('toto.pdf'.hasExtension('pdf')).true() ;
                t.expect4('toto.PDF'.hasExtension('pdf')).true() ;
                t.expect5('volume/tutu/titi/toto.PDF'.filename()).is('toto.PDF') ;
                t.expect6('volume/tutu/titi/toto.PDF'.directory()).is('volume/tutu/titi') ;
                t.expect7('volume/tutu/titi/toto.PDF'.hasExtension('pdf')).true() ;
                t.expect8('/volume/tutu/titi/toto.pdf'.filename()).is('toto.pdf') ;
                t.expect9('/volume/tutu/titi/toto.pdf'.directory()).is('/volume/tutu/titi') ;
                t.expectA('/a/b/c'.addPath('toto.pdf')).is('/a/b/c/toto.pdf')
                t.expectB('/a/b/c'.addPaths('toto.pdf')).is('/a/b/c/toto.pdf')
                t.expectC('/a/b/c'.addPath('d/e','toto.pdf')).is('/a/b/c/d/e/toto.pdf')
                t.expectD('/a/b/c'.addPaths('d/e','f/toto.pdf')).is('/a/b/c/d/e/f/toto.pdf')
            })
        })) ;
    }
}
