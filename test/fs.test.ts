import { $length } from "../src/commons";
import { $createDirectory, $dir, $ext, $filename, $fullWriteString, $isabsolutepath, $isdirectory, $isexecutable, $isfile, $isreadable, $iswritable, $newext, $normalizepath, $path, $readString, $withoutext, $writeString } from "../src/fs";
import { TSTest } from '../src/tstester';
import { $inbrowser } from "../src/utils";

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
        t.expectB(B).toBe('/Users/durand/Developer/foundation-ts/files/toto/tutu.pdf') ;
        t.expectC(C).toBe('/Users/durand/Developer/foundation-ts/tutu/titi/tata') ;
        t.expectD(D).toBe('/tata') ;
        t.expectE(E).toBe('/tata') ;
        t.expectF(F).toBe('/tata/toto') ;
        t.expectG(G).toBe('../tata/toto') ;
        t.expectH(H).toBe('../../tata/toto') ;
    }) ;

    group.unary('$path(internalImplementation) function', async (t) => {
        t.expectB(B1).toBe('/Users/durand/Developer/foundation-ts/files/toto/tutu.pdf') ;
        t.expectC(C1).toBe('/Users/durand/Developer/foundation-ts/tutu/titi/tata') ;
        t.expectD(D1).toBe('/tata') ;
        t.expectE(E1).toBe('/tata') ;
        t.expectF(F1).toBe('/tata/toto') ;
        t.expectG(G1).toBe('../tata/toto') ;
        t.expectH(H1).toBe('../../tata/toto') ;
    }) ;

    group.unary('$normalizepath() function', async (t) => {
        t.expect1($normalizepath('/Users/durand////Developer//foundation-ts/files/../../../../../../tutu/../tata/./toto')).toBe('/tata/toto') ;
        t.expect2($normalizepath('///Users/durand//Developer///foundation-ts/files/../../../../../../tutu/../tata/./toto')).toBe('/tata/toto') ;
        t.expect3($normalizepath('Users/durand//Developer///foundation-ts/files/../../../../../../../tutu/../tata/./toto')).toBe('../../tata/toto') ;
    }) ;

    group.unary('$normalizepath(internalImplementation) function', async (t) => {
        t.expect1($normalizepath('/Users/durand////Developer//foundation-ts/files/../../../../../../tutu/../tata/./toto', true)).toBe('/tata/toto') ;
        t.expect2($normalizepath('///Users/durand//Developer///foundation-ts/files/../../../../../../tutu/../tata/./toto', true)).toBe('/tata/toto') ;
        t.expect3($normalizepath('Users/durand//Developer///foundation-ts/files/../../../../../../../tutu/../tata/./toto', true)).toBe('../../tata/toto') ;
    }) ;

    group.unary('$filename() function', async (t) => {
        t.expect1($filename(A)).toBe('files') ;
        t.expect2($filename('file')).toBe('file') ;
        t.expect3($filename('/file')).toBe('file') ;
        t.expect4($filename("")).toBe('') ;
        t.expect5($filename(null)).toBe('') ;
    }) ;

    group.unary('$filename(internalImplementation) function', async (t) => {
        t.expect1($filename(A, true)).toBe('files') ;
        t.expect2($filename('file', true)).toBe('file') ;
        t.expect3($filename('/file', true)).toBe('file') ;
        t.expect4($filename("", true)).toBe('') ;
        t.expect5($filename(null, true)).toBe('') ;
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
        t.expect4($withoutext(B)).toBe('/Users/durand/Developer/foundation-ts/files/toto/tutu') ;
        t.expect5($withoutext(null)).toBe('') ;
    }) ;

    group.unary('$newext() function', async (t) => {
        t.expect1($newext(B, 'docx')).toBe('/Users/durand/Developer/foundation-ts/files/toto/tutu.docx')
        t.expect2($newext('file', 'toto')).toBe('file.toto') ;
        t.expect3($newext('file.', 'toto')).toBe('file.toto') ;
        t.expect4($newext('', 'toto')).toBe('.toto') ;
        t.expect5($newext('.', 'toto')).toBe('.toto') ;
    }) ;

    group.unary('$dir() function', async (t) => {
        t.expectA($dir(A)).toBe('/Users/durand/Developer/foundation-ts') ;
        t.expectB($dir(B)).toBe('/Users/durand/Developer/foundation-ts/files/toto') ;
        t.expectC($dir('file')).toBe('.') ;
        t.expectD($dir('file/A')).toBe('file') ;
        t.expectE($dir('/file')).toBe('/') ;
        t.expectF($dir('./file')).toBe('.') ;
    }) ;
    group.unary('$dir(internalImplementation) function', async (t) => {
        t.expectA($dir(A, true)).toBe('/Users/durand/Developer/foundation-ts') ;
        t.expectB($dir(B, true)).toBe('/Users/durand/Developer/foundation-ts/files/toto') ;
        t.expectC($dir('file', true)).toBe('.') ;
        t.expectD($dir('file/A', true)).toBe('file') ;
        t.expectE($dir('/file', true)).toBe('/') ;
        t.expectF($dir('./file', true)).toBe('.') ;
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
