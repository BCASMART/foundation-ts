import { $length } from "../src/commons";
import { $createDirectory, $dir, $ext, $filename, $fullWriteString, $isabsolutepath, $isdirectory, $isexecutable, $isfile, $isreadable, $iswritable, $newext, $normalizepath, $path, $readString, $withoutext, $writeString } from "../src/fs";
import { TSTest } from '../src/tstester';
import { $inbrowser } from "../src/utils";

function isWindows():boolean { return !$inbrowser() && process.platform === "win32" ; }
function localSepa():string  { return isWindows() ? '\\' : '/' ; }

const LocalPathSplitRegex = /[\\\/]/ ;
function _lfs(p:string):string { return p.split(LocalPathSplitRegex).join(isWindows()?'\\':'/') ; }

export const fsGroups = TSTest.group("Testing fs functions", async (group) => {
    const A = '/Users/durand/Developer/foundation-ts/files' ;
    const B = $path(A, 'toto', 'tutu.pdf') ;
    const B1 = $path(true, A, 'toto', 'tutu.pdf') ;
    const C = $path(A, '../tutu/titi/tata') ;
    const C1 = $path(true, A, '../tutu/titi/tata') ;
    const D = $path(A, '../../../../../tutu/../tata') ;
    const D1 = $path(true, A, '../../../../../tutu/../tata') ;
    const E = $path(A, '../../../../../../tutu/../tata') ;
    const E1 = $path(true, A, '../../../../../../tutu/../tata') ;
    const F = $path(A, '../../../../../../tutu/../tata/./toto') ;
    const F1 = $path(true, A, '../../../../../../tutu/../tata/./toto') ;
    const AA = A.slice(1) ;
    const G = $path(AA, '../../../../../../tutu/../tata/./toto') ;
    const G1 = $path(true, AA, '../../../../../../tutu/../tata/./toto') ;
    const H = $path(AA, '../../../../../../../tutu/../tata/./toto') ;
    const H1 = $path(true, AA, '../../../../../../../tutu/../tata/./toto') ;

    group.unary('$isabsolutepath(node and internalImplementation) function', async(t) => {
        t.expect1($isabsolutepath(A)).toBeTruthy() ;
        t.expect2($isabsolutepath(AA)).toBeFalsy() ;
        t.expect3($isabsolutepath(A, true)).toBeTruthy() ;
        t.expect4($isabsolutepath(AA, true)).toBeFalsy() ;
    }) ;

    group.unary('$path() function', async (t) => {
        t.expectB(B).toBe(_lfs('/Users/durand/Developer/foundation-ts/files/toto/tutu.pdf')) ;
        t.expectC(C).toBe(_lfs('/Users/durand/Developer/foundation-ts/tutu/titi/tata')) ;
        t.expectD(D).toBe(_lfs('/tata')) ;
        t.expectE(E).toBe(_lfs('/tata')) ;
        t.expectF(F).toBe(_lfs('/tata/toto')) ;
        t.expectG(G).toBe(_lfs('../tata/toto')) ;
        t.expectH(H).toBe(_lfs('../../tata/toto')) ;
    }) ;

    group.unary('$path(internalImplementation) function', async (t) => {
        t.expectB(B1).toBe(_lfs('/Users/durand/Developer/foundation-ts/files/toto/tutu.pdf')) ;
        t.expectC(C1).toBe(_lfs('/Users/durand/Developer/foundation-ts/tutu/titi/tata')) ;
        t.expectD(D1).toBe(_lfs('/tata')) ;
        t.expectE(E1).toBe(_lfs('/tata')) ;
        t.expectF(F1).toBe(_lfs('/tata/toto')) ;
        t.expectG(G1).toBe(_lfs('../tata/toto')) ;
        t.expectH(H1).toBe(_lfs('../../tata/toto')) ;
    }) ;

    group.unary('$normalizepath() function', async (t) => {
        t.expect1($normalizepath('/Users/durand////Developer//foundation-ts/files/../../../../../../tutu/../tata/./toto')).toBe(_lfs('/tata/toto')) ;
        t.expect2($normalizepath('///Users/durand//Developer///foundation-ts/files/../../../../../../tutu/../tata/./toto')).toBe(_lfs('/tata/toto')) ;
        t.expect3($normalizepath('Users/durand//Developer///foundation-ts/files/../../../../../../../tutu/../tata/./toto')).toBe(_lfs('../../tata/toto')) ;
    }) ;

    group.unary('$normalizepath(internalImplementation) function', async (t) => {
        t.expect1($normalizepath('/Users/durand////Developer//foundation-ts/files/../../../../../../tutu/../tata/./toto', true)).toBe(_lfs('/tata/toto')) ;
        t.expect2($normalizepath('///Users/durand//Developer///foundation-ts/files/../../../../../../tutu/../tata/./toto', true)).toBe(_lfs('/tata/toto')) ;
        t.expect3($normalizepath('Users/durand//Developer///foundation-ts/files/../../../../../../../tutu/../tata/./toto', true)).toBe(_lfs('../../tata/toto')) ;
    }) ;

    group.unary('$filename() function', async (t) => {
        t.expect1($filename(A)).toBe('files') ;
        t.expect2($filename('file')).toBe('file') ;
        if (isWindows()) {
            t.expect4($filename('\\file')).toBe('file') ;
            t.expect5($filename('C:\\file')).toBe('file') ;
            t.expect6($filename('\\\\myServer\\file')).toBe('file') ;    
        }
        else {
            t.expect3($filename('/file')).toBe('file') ;
        }
        t.expectA($filename("")).toBe('') ;
        t.expectB($filename(null)).toBe('') ;
        t.expectC($filename(undefined)).toBe('') ;
    }) ;

    group.unary('$filename(internalImplementation) function', async (t) => {
        t.expect1($filename(A, true)).toBe('files') ;
        t.expect2($filename('file', true)).toBe('file') ;
        t.expect3($filename('/file', true)).toBe('file') ;
        t.expect4($filename("", true)).toBe('') ;
        t.expect5($filename(null, true)).toBe('') ;
        t.expect6($filename('\\file', true)).toBe('file') ;
        t.expect7($filename('C:\\file', true)).toBe('file') ;
        t.expect8($filename('\\\\myServer\\file', true)).toBe('file') ;
    }) ;


    group.unary('$ext() function', async (t) => {
        t.expectA($ext(A)).toBe('') ;
        t.expectB($ext(B)).toBe('pdf') ;
        t.expectC($ext('')).toBe('') ;
        t.expectD($ext('.')).toBe('') ;
        t.expectE($ext(undefined)).toBe('') ;
        t.expectF($ext(null)).toBe('') ;
    }) ;
    group.unary('$ext(internalImplementation) function', async (t) => {
        t.expectA($ext(A, true)).toBe('') ;
        t.expectB($ext(B, true)).toBe('pdf') ;
        t.expectC($ext('', true)).toBe('') ;
        t.expectD($ext('.', true)).toBe('') ;
        t.expectE($ext(undefined, true)).toBe('') ;
        t.expectF($ext(null, true)).toBe('') ;
    }) ;


    group.unary('$withoutext() function', async (t) => {
        t.expect1($withoutext('toto.2')).toBe('toto') ;
        t.expect2($withoutext('toto.')).toBe('toto') ;
        t.expect3($withoutext('.')).toBe('') ;
        t.expect4($withoutext(B)).toBe(_lfs('/Users/durand/Developer/foundation-ts/files/toto/tutu')) ;
        t.expect5($withoutext(null)).toBe('') ;
    }) ;

    group.unary('$newext() function', async (t) => {
        t.expect1($newext(B, 'docx')).toBe(_lfs('/Users/durand/Developer/foundation-ts/files/toto/tutu.docx'))
        t.expect2($newext('file', 'toto')).toBe('file.toto') ;
        t.expect3($newext('file.', 'toto')).toBe('file.toto') ;
        t.expect4($newext('', 'toto')).toBe('.toto') ;
        t.expect5($newext('.', 'toto')).toBe('.toto') ;
    }) ;

    group.unary('$dir() function', async (t) => {
        t.expectA($dir(A)).toBe(_lfs('/Users/durand/Developer/foundation-ts')) ;
        t.expectB($dir(B)).toBe(_lfs('/Users/durand/Developer/foundation-ts/files/toto')) ;
        t.expectC($dir('file')).toBe('.') ;
        if (isWindows()) {
            t.expectG($dir('\\file')).toBe('\\') ;
            t.expectH($dir('file\\A')).toBe('file') ;    
            t.expectI($dir('.\\file')).toBe('.') ;
        }
        else {
            t.expectD($dir('/file')).toBe('/') ;
            t.expectE($dir('file/A')).toBe('file') ;
            t.expectF($dir('./file')).toBe('.') ;            
        }
    }) ;
    group.unary('$dir(internalImplementation) function', async (t) => {
        t.expectA($dir(A, true)).toBe('/Users/durand/Developer/foundation-ts') ;
        t.expectB($dir(B, true)).toBe('/Users/durand/Developer/foundation-ts/files/toto') ;
        t.expectC($dir('file', true)).toBe('.') ;
        t.expectD($dir('file/A', true)).toBe('file') ;
        t.expectE($dir('/file', true)).toBe(localSepa()) ;
        t.expectF($dir('./file', true)).toBe('.') ;
        t.expectG($dir('\\file', true)).toBe(localSepa()) ;
        t.expectH($dir('file\\A', true)).toBe('file') ;
    }) ;

    if (!$inbrowser()) {
        group.unary('testing $createdirectory(), $...writeString(), $readstring(), $isreadable()... functions', async (t) => {
            const folder = $path($dir(__dirname), 'output') ;
            t.register("Folder", folder) ;
            t.expect0($createDirectory(folder)).toBeTruthy() ;
            t.expect1($isdirectory(folder)).toBeTruthy() ;
            t.expect2($isfile(folder)).toBeFalsy() ;
            const str = "Sursum" ;
            const file = $path(folder, 'sc.txt') ;
            t.expect3($writeString(file, str)).toBeTruthy() ;
            t.expect4($readString(file)).toBe(str) ;
            const str2 = str + ' Corda' ;
            const [wres2, prec2] = $fullWriteString(file,  str2, { attomically:true, removePrecedentVersion:true }) ;
            t.expect5(wres2).toBeTruthy() ;
            t.expect6(prec2).toBeNull() ;
            t.expect7($readString(file)).toBe(str2) ;
    
            const str3 = str2 + ' 2' ;
            const [wres3, prec3] = $fullWriteString(file,  str3, { attomically:true }) ;
            t.expect8(wres3).toBeTruthy() ;
            t.expect9($length(prec3)).gt(0) ;
            t.expectA($readString(file)).toBe(str3) ;
            t.expectB($readString(prec3)).toBe(str2) ;
            t.expectC($isreadable(file)).toBeTruthy() ;
            t.expectD($iswritable(file)).toBeTruthy() ;
            t.expectE($isexecutable(file)).toBeFalsy() ;
        }) ;    
    }

}, { name:'fs' }) ;
