import { $dir, $ext, $filename, $newext, $path, $withoutext } from "../src/fs";

describe("Testing fs functions", () => {
    const A = '/Users/durand/Developer/foundation-ts/files' ;
    const B = $path(A, 'toto', 'tutu.pdf') ;

    it('$path() function', () => {
        expect(B).toBe('/Users/durand/Developer/foundation-ts/files/toto/tutu.pdf') ;
    }) ;

    it('$filename() function', () => {
        expect($filename(A)).toBe('files') ;
        expect($filename('file')).toBe('file') ;
        expect($filename('/file')).toBe('file') ;
        expect($filename(null)).toBe('') ;
    }) ;

    it('$ext() function', () => {
        expect($ext(A)).toBe('') ;
        expect($ext(B)).toBe('pdf') ;
        expect($ext('')).toBe('') ;
        expect($ext('.')).toBe('') ;
        expect($ext(undefined)).toBe('') ;
        expect($ext(null)).toBe('') ;
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

}) ;
