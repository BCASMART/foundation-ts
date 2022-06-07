import { $dir, $ext, $filename, $newext, $path, $withoutext } from "../src/fs";
import { TSTest } from '../src/tstester';

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

    group.unary('$path() function', async (t) => {
        t.expect(B).toBe('/Users/durand/Developer/foundation-ts/files/toto/tutu.pdf') ;
        t.expect(C).toBe('/Users/durand/Developer/foundation-ts/tutu/titi/tata') ;
        t.expect(D).toBe('/tata') ;
        t.expect(E).toBe('/tata') ;
        t.expect(F).toBe('/tata/toto') ;
        t.expect(G).toBe('../tata/toto') ;
        t.expect(H).toBe('../../tata/toto') ;
    }) ;
    group.unary('$path(internalImplementation) function', async (t) => {
        t.expect(B1).toBe('/Users/durand/Developer/foundation-ts/files/toto/tutu.pdf') ;
        t.expect(C1).toBe('/Users/durand/Developer/foundation-ts/tutu/titi/tata') ;
        t.expect(D1).toBe('/tata') ;
        t.expect(E1).toBe('/tata') ;
        t.expect(F1).toBe('/tata/toto') ;
        t.expect(G1).toBe('../tata/toto') ;
        t.expect(H1).toBe('../../tata/toto') ;
    }) ;

    group.unary('$filename() function', async (t) => {
        t.expect($filename(A)).toBe('files') ;
        t.expect($filename('file')).toBe('file') ;
        t.expect($filename('/file')).toBe('file') ;
        t.expect($filename("")).toBe('') ;
        t.expect($filename(null)).toBe('') ;
    }) ;

    group.unary('$filename(internalImplementation) function', async (t) => {
        t.expect($filename(A, true)).toBe('files') ;
        t.expect($filename('file', true)).toBe('file') ;
        t.expect($filename('/file', true)).toBe('file') ;
        t.expect($filename("", true)).toBe('') ;
        t.expect($filename(null, true)).toBe('') ;
    }) ;


    group.unary('$ext() function', async (t) => {
        t.expect($ext(A)).toBe('') ;
        t.expect($ext(B)).toBe('pdf') ;
        t.expect($ext('')).toBe('') ;
        t.expect($ext('.')).toBe('') ;
        t.expect($ext(undefined)).toBe('') ;
        t.expect($ext(null)).toBe('') ;
    }) ;
    group.unary('$ext(internalImplementation) function', async (t) => {
        t.expect($ext(A, true)).toBe('') ;
        t.expect($ext(B, true)).toBe('pdf') ;
        t.expect($ext('', true)).toBe('') ;
        t.expect($ext('.', true)).toBe('') ;
        t.expect($ext(undefined, true)).toBe('') ;
        t.expect($ext(null, true)).toBe('') ;
    }) ;


    group.unary('$withoutext() function', async (t) => {
        t.expect($withoutext('toto.2')).toBe('toto') ;
        t.expect($withoutext('toto.')).toBe('toto') ;
        t.expect($withoutext('.')).toBe('') ;
        t.expect($withoutext(B)).toBe('/Users/durand/Developer/foundation-ts/files/toto/tutu') ;
        t.expect($withoutext(null)).toBe('') ;
    }) ;

    group.unary('$newext() function', async (t) => {
        t.expect($newext(B, 'docx')).toBe('/Users/durand/Developer/foundation-ts/files/toto/tutu.docx')
        t.expect($newext('file', 'toto')).toBe('file.toto') ;
        t.expect($newext('file.', 'toto')).toBe('file.toto') ;
        t.expect($newext('', 'toto')).toBe('.toto') ;
        t.expect($newext('.', 'toto')).toBe('.toto') ;
    }) ;

    group.unary('$dir() function', async (t) => {
        t.expect($dir(A)).toBe('/Users/durand/Developer/foundation-ts') ;
        t.expect($dir(B)).toBe('/Users/durand/Developer/foundation-ts/files/toto') ;
        t.expect($dir('file')).toBe('.') ;
        t.expect($dir('file/A')).toBe('file') ;
        t.expect($dir('/file')).toBe('/') ;
        t.expect($dir('./file')).toBe('.') ;
    }) ;
    group.unary('$dir(internalImplementation) function', async (t) => {
        t.expect($dir(A, true)).toBe('/Users/durand/Developer/foundation-ts') ;
        t.expect($dir(B, true)).toBe('/Users/durand/Developer/foundation-ts/files/toto') ;
        t.expect($dir('file', true)).toBe('.') ;
        t.expect($dir('file/A', true)).toBe('file') ;
        t.expect($dir('/file', true)).toBe('/') ;
        t.expect($dir('./file', true)).toBe('.') ;
    }) ;
}) ;
