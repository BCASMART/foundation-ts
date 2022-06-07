import { $dir, $ext, $filename, $newext, $path, $withoutext } from "../src/fs";

describe("Testing fs functions", () => {
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

    it('$path() function', () => {
        expect(B).toBe('/Users/durand/Developer/foundation-ts/files/toto/tutu.pdf') ;
        expect(C).toBe('/Users/durand/Developer/foundation-ts/tutu/titi/tata') ;
        expect(D).toBe('/tata') ;
        expect(E).toBe('/tata') ;
        expect(F).toBe('/tata/toto') ;
        expect(G).toBe('../tata/toto') ;
        expect(H).toBe('../../tata/toto') ;
    }) ;
    it('$path(internalImplementation) function', () => {
        expect(B1).toBe('/Users/durand/Developer/foundation-ts/files/toto/tutu.pdf') ;
        expect(C1).toBe('/Users/durand/Developer/foundation-ts/tutu/titi/tata') ;
        expect(D1).toBe('/tata') ;
        expect(E1).toBe('/tata') ;
        expect(F1).toBe('/tata/toto') ;
        expect(G1).toBe('../tata/toto') ;
        expect(H1).toBe('../../tata/toto') ;
    }) ;

    it('$filename() function', () => {
        expect($filename(A)).toBe('files') ;
        expect($filename('file')).toBe('file') ;
        expect($filename('/file')).toBe('file') ;
        expect($filename("")).toBe('') ;
        expect($filename(null)).toBe('') ;
    }) ;

    it('$filename(internalImplementation) function', () => {
        expect($filename(A, true)).toBe('files') ;
        expect($filename('file', true)).toBe('file') ;
        expect($filename('/file', true)).toBe('file') ;
        expect($filename("", true)).toBe('') ;
        expect($filename(null, true)).toBe('') ;
    }) ;


    it('$ext() function', () => {
        expect($ext(A)).toBe('') ;
        expect($ext(B)).toBe('pdf') ;
        expect($ext('')).toBe('') ;
        expect($ext('.')).toBe('') ;
        expect($ext(undefined)).toBe('') ;
        expect($ext(null)).toBe('') ;
    }) ;
    it('$ext(internalImplementation) function', () => {
        expect($ext(A, true)).toBe('') ;
        expect($ext(B, true)).toBe('pdf') ;
        expect($ext('', true)).toBe('') ;
        expect($ext('.', true)).toBe('') ;
        expect($ext(undefined, true)).toBe('') ;
        expect($ext(null, true)).toBe('') ;
    }) ;


    it('$withoutext() function', () => {
        expect($withoutext('toto.2')).toBe('toto') ;
        expect($withoutext('toto.')).toBe('toto') ;
        expect($withoutext('.')).toBe('') ;
        expect($withoutext(B)).toBe('/Users/durand/Developer/foundation-ts/files/toto/tutu') ;
        expect($withoutext(null)).toBe('') ;
    }) ;

    it('$newext() function', () => {
        expect($newext(B, 'docx')).toBe('/Users/durand/Developer/foundation-ts/files/toto/tutu.docx')
        expect($newext('file', 'toto')).toBe('file.toto') ;
        expect($newext('file.', 'toto')).toBe('file.toto') ;
        expect($newext('', 'toto')).toBe('.toto') ;
        expect($newext('.', 'toto')).toBe('.toto') ;
    }) ;

    it('$dir() function', () => {
        expect($dir(A)).toBe('/Users/durand/Developer/foundation-ts') ;
        expect($dir(B)).toBe('/Users/durand/Developer/foundation-ts/files/toto') ;
        expect($dir('file')).toBe('.') ;
        expect($dir('file/A')).toBe('file') ;
        expect($dir('/file')).toBe('/') ;
        expect($dir('./file')).toBe('.') ;
    }) ;
    it('$dir(internalImplementation) function', () => {
        expect($dir(A, true)).toBe('/Users/durand/Developer/foundation-ts') ;
        expect($dir(B, true)).toBe('/Users/durand/Developer/foundation-ts/files/toto') ;
        expect($dir('file, true')).toBe('.') ;
        expect($dir('file/A, true')).toBe('file') ;
        expect($dir('/file, true')).toBe('/') ;
        expect($dir('./file, true')).toBe('.') ;
    }) ;


}) ;
