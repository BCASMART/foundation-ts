import { $length } from "../src/commons";
import { $createDirectory, $dir, $ext, $filename, $fullWriteString, $isabsolutepath, $isdirectory, $isexecutable, $isfile, $isreadable, $iswritable, $newext, $normalizepath, $path, $readString, $withoutext, $writeString } from "../src/fs";
import { TSTest } from '../src/tstester';
import { $inbrowser } from "../src/utils";



export const fsGroups = TSTest.group("Testing fs functions", async (group) => {
    const isWindows = !$inbrowser() && process.platform === "win32" ;

    const LocalPathSplitRegex = /[\\\/]/ ;
    function _lfs(p:string):string { return p.split(LocalPathSplitRegex).join(isWindows?'\\':'/') ; }
    function _rfs(p:string):string { return p.split(LocalPathSplitRegex).join(isWindows?'/':'\\') ; }
    function _ufs(p:string):string { return p.split(LocalPathSplitRegex).join('/') ; }
    function _wfs(p:string):string { return p.split(LocalPathSplitRegex).join('\\') ; }

    const A = _lfs('/Users/durand/Developer/foundation-ts/files') ;
    const AU = _ufs(A) ;
    const AW = _wfs(A) ;
    const AWDD = 'Z:' + AW ;
    const AWSD = '\\\\MyServer'+ AW ;

    const AA = A.slice(1) ;
    const AAW = AW.slice(1) ;

    const AM1  = '/Users\\durand/Developer/foundation-ts/files' ;
    const AM2  = '\\Users/durand/Developer/foundation-ts/files' ;
    const AM3  = '\\Users/durand/Developer/foundation-ts\\files' ;

    const AM1R = '\\Users/durand\\Developer\\foundation-ts\\files' ;
    const AM2R = '/Users\\durand\\Developer\\foundation-ts\\files' ;
    const AM3R = '/Users\\durand\\Developer\\foundation-ts/files' ;

    const B = $path(A, 'toto', 'tutu.pdf') ;
    const B1 = $path(true, A, 'toto', 'tutu.pdf') ;
    const BX = $path(_rfs(A), 'toto', 'tutu.pdf') ;
    const BX1 = $path(true, _rfs(A), 'toto', 'tutu.pdf') ;

    const C = $path(A, '../tutu/titi/tata') ;
    const C1 = $path(true, A, '../tutu/titi/tata') ;
    const D = $path(A, '../../../../../tutu/../tata') ;
    const D1 = $path(true, A, '../../../../../tutu/../tata') ;
    const E = $path(A, '../../../../../../tutu/../tata') ;
    const E1 = $path(true, A, '../../../../../../tutu/../tata') ;
    const F = $path(A, '../../../../../../tutu/../tata/./toto') ;
    const F1 = $path(true, A, '../../../../../../tutu/../tata/./toto') ;
    const G = $path(AA, '../../../../../../tutu/../tata/./toto') ;
    const G1 = $path(true, AA, '../../../../../../tutu/../tata/./toto') ;
    const H = $path(AA, '../../../../../../../tutu/../tata/./toto') ;
    const H1 = $path(true, AA, '../../../../../../../tutu/../tata/./toto') ;


    group.unary('$isabsolutepath() function', async(t) => {
        t.expect1($isabsolutepath(A)).toBeTruthy() ;
        t.expect2($isabsolutepath(AA)).toBeFalsy() ;
        t.expect3($isabsolutepath(AAW)).toBeFalsy() ;
        
        t.expectA($isabsolutepath(AU)).toBe(!isWindows) ;
        t.expectB($isabsolutepath(AW)).toBe(isWindows) ;
        t.expectC($isabsolutepath(AWDD)).toBe(isWindows) ;
        t.expectD($isabsolutepath(AWSD)).toBe(isWindows) ;    

    }) ;
    group.unary('$isabsolutepath(internalImplementation) function', async(t) => {
        t.expect1($isabsolutepath(A, true)).toBeTruthy() ;
        t.expect2($isabsolutepath(AA, true)).toBeFalsy() ;
        t.expect3($isabsolutepath(AAW, true)).toBeFalsy() ;
        
        t.expectA($isabsolutepath(AU, true)).toBe(!isWindows) ;
        t.expectB($isabsolutepath(AW, true)).toBe(isWindows) ;
        t.expectC($isabsolutepath(AWDD, true)).toBe(isWindows) ;
        t.expectD($isabsolutepath(AWSD, true)).toBe(isWindows) ;        
    }) ;

    group.unary('$path() function', async (t) => {
        t.expect1(B).toBe(_lfs('/Users/durand/Developer/foundation-ts/files/toto/tutu.pdf')) ;
        t.expect2(C).toBe(_lfs('/Users/durand/Developer/foundation-ts/tutu/titi/tata')) ;
        t.expect3(D).toBe(_lfs('/tata')) ;
        t.expect4(E).toBe(_lfs('/tata')) ;
        t.expect5(F).toBe(_lfs('/tata/toto')) ;
        t.expect6(G).toBe(_lfs('../tata/toto')) ;
        t.expect7(H).toBe(_lfs('../../tata/toto')) ;

        t.expectA(BX).toBe(_rfs(A)+_lfs('/toto/tutu.pdf')) ;

    }) ;

    group.unary('$path(internalImplementation) function', async (t) => {
        t.expect1(B1).toBe(_lfs('/Users/durand/Developer/foundation-ts/files/toto/tutu.pdf')) ;
        t.expect2(C1).toBe(_lfs('/Users/durand/Developer/foundation-ts/tutu/titi/tata')) ;
        t.expect3(D1).toBe(_lfs('/tata')) ;
        t.expect4(E1).toBe(_lfs('/tata')) ;
        t.expect5(F1).toBe(_lfs('/tata/toto')) ;
        t.expect6(G1).toBe(_lfs('../tata/toto')) ;
        t.expect7(H1).toBe(_lfs('../../tata/toto')) ;

        t.expectA(BX1).toBe(_rfs(A)+_lfs('/toto/tutu.pdf')) ;
    }) ;

    group.unary('$normalizepath() function', async (t) => {
        t.expect1($normalizepath(_lfs('/Users/durand////Developer//foundation-ts/files/../../../../../../tutu/../tata/./toto'))).toBe(_lfs('/tata/toto')) ;
        t.expect2($normalizepath(_lfs('///Users/durand//Developer///foundation-ts/files/../../../../../../tutu/../tata/./toto'))).toBe(_lfs('/tata/toto')) ;
        t.expect3($normalizepath(_lfs('Users/durand//Developer///foundation-ts/files/../../../../../../../tutu/../tata/./toto'))).toBe(_lfs('../../tata/toto')) ;
    }) ;

    group.unary('$normalizepath(internalImplementation) function', async (t) => {
        t.expect1($normalizepath(_lfs('/Users/durand////Developer//foundation-ts/files/../../../../../../tutu/../tata/./toto'), true)).toBe(_lfs('/tata/toto')) ;
        t.expect2($normalizepath(_lfs('///Users/durand//Developer///foundation-ts/files/../../../../../../tutu/../tata/./toto'), true)).toBe(_lfs('/tata/toto')) ;
        t.expect3($normalizepath(_lfs('Users/durand//Developer///foundation-ts/files/../../../../../../../tutu/../tata/./toto'), true)).toBe(_lfs('../../tata/toto')) ;
    }) ;

    group.unary('$filename() function', async (t) => {
        t.expect1($filename(A)).toBe('files') ;
        t.expect2($filename('file')).toBe('file') ;
        t.expect3($filename(_lfs('/file'))).toBe('file') ;
        t.expect4($filename("")).toBe('') ;
        t.expect5($filename(null)).toBe('') ;
        t.expect6($filename(undefined)).toBe('') ;
        t.expect7($filename(_rfs(A))).toBe(_rfs(A)) ;
        if (isWindows) {
            t.expectA($filename(AM1)).toBe('durand/Developer/foundation-ts/files') ;
            t.expectB($filename(AM2)).toBe('Users/durand/Developer/foundation-ts/files') ;
            t.expectC($filename(AM3)).toBe('files') ;
            t.expectD($filename(AM1R)).toBe('files') ;
            t.expectE($filename(AM2R)).toBe('files') ;
            t.expectF($filename(AM3R)).toBe('foundation-ts/files') ;

            t.expectR($filename('C:\\file')).toBe('file') ;
            t.expectS($filename('\\\\myServer\\file')).toBe('file') ;    
            t.expectT($filename('C:\\toto\\tutu')).toBe('tutu') ;
            t.expectU($filename('C:\\toto')).toBe('toto') ;
            t.expectV($filename('C:\\')).toBe('') ;
            t.expectW($filename('\\\\server\\tutu')).toBe('tutu') ;
            t.expectX($filename('\\\\server\\')).toBe('') ;
        }
        else {
            t.expectA($filename(AM1)).toBe('files') ;
            t.expectB($filename(AM2)).toBe('files') ;
            t.expectC($filename(AM3)).toBe('foundation-ts\\files') ;
            t.expectD($filename(AM1R)).toBe('durand\\Developer\\foundation-ts\\files') ;
            t.expectE($filename(AM2R)).toBe('Users\\durand\\Developer\\foundation-ts\\files') ;
            t.expectF($filename(AM3R)).toBe('files') ;
        }
    }) ;

    group.unary('$filename(internalImplementation) function', async (t) => {
        t.expect1($filename(A, true)).toBe('files') ;
        t.expect2($filename('file', true)).toBe('file') ;
        t.expect3($filename(_lfs('/file'), true)).toBe('file') ;
        t.expect4($filename("", true)).toBe('') ;
        t.expect5($filename(null, true)).toBe('') ;
        t.expect6($filename(undefined, true)).toBe('') ;
        t.expect7($filename(_rfs(A), true)).toBe(_rfs(A)) ;
        if (isWindows) {
            t.expectA($filename(AM1, true)).toBe('durand/Developer/foundation-ts/files') ;
            t.expectB($filename(AM2, true)).toBe('Users/durand/Developer/foundation-ts/files') ;
            t.expectC($filename(AM3, true)).toBe('files') ;
            t.expectD($filename(AM1R, true)).toBe('files') ;
            t.expectE($filename(AM2R, true)).toBe('files') ;
            t.expectF($filename(AM3R, true)).toBe('foundation-ts/files') ;

            t.expectR($filename('C:\\file', true)).toBe('file') ;
            t.expectS($filename('\\\\myServer\\file', true)).toBe('file') ;    
            t.expectT($filename('C:\\toto\\tutu', true)).toBe('tutu') ;
            t.expectU($filename('C:\\toto', true)).toBe('toto') ;
            t.expectV($filename('C:\\', true)).toBe('') ;
            t.expectW($filename('\\\\server\\tutu', true)).toBe('tutu') ;
            t.expectX($filename('\\\\server\\', true)).toBe('') ;
        }
        else {
            t.expectA($filename(AM1, true)).toBe('files') ;
            t.expectB($filename(AM2, true)).toBe('files') ;
            t.expectC($filename(AM3, true)).toBe('foundation-ts\\files') ;
            t.expectD($filename(AM1R, true)).toBe('durand\\Developer\\foundation-ts\\files') ;
            t.expectE($filename(AM2R, true)).toBe('Users\\durand\\Developer\\foundation-ts\\files') ;
            t.expectF($filename(AM3R, true)).toBe('files') ;
        }
    }) ;


    group.unary('$ext() function', async (t) => {
        t.expect1($ext(A)).toBe('') ;
        t.expect2($ext(B)).toBe('pdf') ;
        t.expect3($ext('')).toBe('') ;
        t.expect4($ext('.')).toBe('') ;
        t.expect5($ext(undefined)).toBe('') ;
        t.expect6($ext(null)).toBe('') ;
        t.expect7($ext($path(B, 'machin.doc'))).toBe('doc') ;
    }) ;

    group.unary('$ext(internalImplementation) function', async (t) => {
        t.expect1($ext(A, true)).toBe('') ;
        t.expect2($ext(B, true)).toBe('pdf') ;
        t.expect3($ext('', true)).toBe('') ;
        t.expect4($ext('.', true)).toBe('') ;
        t.expect5($ext(undefined, true)).toBe('') ;
        t.expect6($ext(null, true)).toBe('') ;
        t.expect7($ext($path(true, B, 'machin.doc'), true)).toBe('doc') ;
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
        t.expect1($dir(A)).toBe(_lfs('/Users/durand/Developer/foundation-ts')) ;
        t.expect2($dir(B)).toBe(_lfs('/Users/durand/Developer/foundation-ts/files/toto')) ;
        t.expect3($dir('file')).toBe('.') ;
        t.expect4($dir(_lfs('/file'))).toBe(_lfs('/')) ;
        t.expect5($dir(_lfs('file/A'))).toBe('file') ;
        t.expect6($dir(_lfs('./file'))).toBe('.') ;
        if (isWindows) {
            t.expectA($dir(AM1)).toBe('/Users') ;
            t.expectB($dir(AM2)).toBe('\\') ;
            t.expectC($dir(AM3)).toBe('\\Users/durand/Developer/foundation-ts') ;
            t.expectD($dir(AM1R)).toBe('\\Users/durand\\Developer\\foundation-ts') ;
            t.expectE($dir(AM2R)).toBe('/Users\\durand\\Developer\\foundation-ts') ;
            t.expectF($dir(AM3R)).toBe('/Users\\durand\\Developer') ;

            t.expectT($dir('C:\\toto\\tutu')).toBe('C:\\toto') ;
            t.expectU($dir('C:\\toto')).toBe('C:\\') ;
            t.expectV($dir('C:\\')).toBe('C:\\') ;
            t.expectW($dir('\\\\server\\tutu')).toBe('\\\\server\\') ;
            t.expectX($dir('\\\\server\\')).toBe('\\\\server\\') ;
        }
        else {
            t.expectA($dir(AM1)).toBe('/Users\\durand/Developer/foundation-ts') ;
            t.expectB($dir(AM2)).toBe('\\Users/durand/Developer/foundation-ts') ;
            t.expectC($dir(AM3)).toBe('\\Users/durand/Developer') ;
            t.expectD($dir(AM1R)).toBe('\\Users') ;
            t.expectE($dir(AM2R)).toBe('/') ;
            t.expectF($dir(AM3R)).toBe('/Users\\durand\\Developer\\foundation-ts') ;
        }
    }) ;

    group.unary('$dir(internalImplementation) function', async (t) => {
        t.expect1($dir(A, true)).toBe(_lfs('/Users/durand/Developer/foundation-ts')) ;
        t.expect2($dir(B, true)).toBe(_lfs('/Users/durand/Developer/foundation-ts/files/toto')) ;
        t.expect3($dir('file', true)).toBe('.') ;
        t.expect4($dir(_lfs('/file'), true)).toBe(_lfs('/')) ;
        t.expect5($dir(_lfs('file/A'), true)).toBe('file') ;
        t.expect6($dir(_lfs('./file'), true)).toBe('.') ;
        if (isWindows) {
            t.expectA($dir(AM1, true)).toBe('/Users') ;
            t.expectB($dir(AM2, true)).toBe('\\') ;
            t.expectC($dir(AM3, true)).toBe('\\Users/durand/Developer/foundation-ts') ;
            t.expectD($dir(AM1R, true)).toBe('\\Users/durand\\Developer\\foundation-ts') ;
            t.expectE($dir(AM2R, true)).toBe('/Users\\durand\\Developer\\foundation-ts') ;
            t.expectF($dir(AM3R, true)).toBe('/Users\\durand\\Developer') ;

            t.expectT($dir('C:\\toto\\tutu', true)).toBe('C:\\toto') ;
            t.expectU($dir('C:\\toto', true)).toBe('C:\\') ;
            t.expectV($dir('C:\\', true)).toBe('C:\\') ;
            t.expectW($dir('\\\\server\\tutu', true)).toBe('\\\\server\\') ;
            t.expectX($dir('\\\\server\\', true)).toBe('\\\\server\\') ;
        }
        else {
            t.expectA($dir(AM1, true)).toBe('/Users\\durand/Developer/foundation-ts') ;
            t.expectB($dir(AM2, true)).toBe('\\Users/durand/Developer/foundation-ts') ;
            t.expectC($dir(AM3, true)).toBe('\\Users/durand/Developer') ;
            t.expectD($dir(AM1R, true)).toBe('\\Users') ;
            t.expectE($dir(AM2R, true)).toBe('/') ;
            t.expectF($dir(AM3R, true)).toBe('/Users\\durand\\Developer\\foundation-ts') ;
        }
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
