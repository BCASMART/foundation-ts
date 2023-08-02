import { $ascii, $capitalize, $firstcap, $ftrim, $left, $lines, $ltrim, $normspaces, $right, $rtrim, $trim } from "../src/strings";
import { FoundationNewLines, FoundationWhiteSpaces } from "../src/string_tables";
import { TSTest } from "../src/tstester";

export const stringGroups = TSTest.group("Commons strings functions", async (group) => {
    const S1 = "Texte accentué avec ça et c'est shön";
    const S2 = "Texte accentue avec ca et c'est shon";

    group.unary("$ascii() function", async(t) => {
        t.expect1($ascii(S1)).toBe(S2) ;
        t.expect2($ascii(S1)).toBe(S2.ascii()) ;
        t.expect3($ascii('@&é"\'(§è!çà)-#1234567890°_•ë“‘{¶«¡Çø}—´„”’[å»ÛÁØ]–')).toBe('@&e"\'(e!ca)-#1234567890_.e"\'{"!Co}-""\'[a"UAO]-');
        t.expect4($ascii('azertyuiop^$AZERTYUIOP¨*æê®†Úºîœπô€Æ‚ÅÊ™ŸªïŒ∏Ô¥')).toBe('azertyuiop^$AZERTYUIOP*aee(R)UoioepoEURAE\'AETMYaiOEOJPY');
        t.expect5($ascii('qsdfghjklmù`QSDFGHJKLM%£‡Ò∂ƒﬁÌÏÈ¬µÙ@Ω∑∆·ﬂÎÍË|Ó‰#')).toBe('qsdfghjklmu`QSDFGHJKLM%GBPOdffiIIEmU@O.flIIE|O#');
        t.expect6($ascii('<wxcvbn,;:=>WXCVBN?./+≤‹≈©◊ß~∞…÷≠≥›⁄¢√ı¿•\\±')).toBe('<wxcvbn,;:=>WXCVBN?./+<=<(C)ss~.../>=>/ci?.\\') ;
        t.expect7($ascii('âêîôûäëïöüÂÊÎÔÛÄËÏÖÜàèìòùÀÈÌÒÙñÑãÃõÕÁÉÍÓÚáéíóú')).toBe('aeiouaeiouAEIOUAEIOUaeiouAEIOUnNaAoOAEIOUaeiou') ;
        t.expect8('âêîôûäëïöüÂÊÎÔÛÄËÏÖÜàèìòùÀÈÌÒÙñÑãÃõÕÁÉÍÓÚáéíóú'.ascii()).toBe('aeiouaeiouAEIOUAEIOUaeiouAEIOUnNaAoOAEIOUaeiou') ;
        t.expect9('ΆΏΰαζθφωώϐϑϒϓϔϕΣψῼ𝞅𝞍𝞊𝞋𝚯𝚹𝞁𝞂𝜚ϴϽϾϱϋὗὛὟῆῊῌᾇ'.ascii()).toBe('AOyazthfoovthYYYfSpsOffethTHTHssrTHSSryyYYiIIa') ;
    }) ;
    group.unary("$left() and $right() functions", async(t) => {
        t.expect1($left(S1)).toBe('T') ;
        t.expect2(S1.left()).toBe('T') ;
        t.expect3($right(S1)).toBe('n') ;
        t.expect4(S1.right()).toBe('n') ;
        t.expect5($left(S1, 16)).toBe('Texte accentué a') ;
        t.expect6(S1.left(16)).toBe('Texte accentué a') ;
        t.expect7($right(S1, 16)).toBe("ça et c'est shön") ;
        t.expect8(S1.right(16)).toBe("ça et c'est shön") ;
        t.expect9($left(S1, 160)).toBe(S1) ;
        t.expectA(S1.left(160)).toBe(S1) ;
        t.expectB($right(S1, 160)).toBe(S1) ;
        t.expectC(S1.right(160)).toBe(S1) ;
    }) ;
    group.unary("$trim(), $rtrim(), $ltrim() functions", async(t) => {
        const w = "TEST ME, I'M A CENTRAL\u0009PHRASE" ;
        const a = FoundationWhiteSpaces+w+FoundationWhiteSpaces ;
        t.expect0($rtrim(a)).toBe(FoundationWhiteSpaces+w) ;
        t.expect1($ltrim(a)).toBe(w+FoundationWhiteSpaces) ;
        t.expect2($trim(a)).toBe(w) ;
        t.expect3($rtrim(FoundationWhiteSpaces)).toBe("") ;
        t.expect4($ltrim(FoundationWhiteSpaces)).toBe("") ;
        t.expect5(FoundationWhiteSpaces.ftrim()).toBe("") ;
        t.expect6($rtrim("")).toBe("") ;
        t.expect7($ltrim("")).toBe("") ;
        t.expect8($trim("")).toBe("") ;
        t.expect9($rtrim(undefined)).toBe("") ;
        t.expectA($ltrim(undefined)).toBe("") ;
        t.expectB($trim(undefined)).toBe("") ;
        t.expectC($rtrim(null)).toBe("") ;
        t.expectD($ltrim(null)).toBe("") ;
        t.expectE($trim(null)).toBe("") ;
        t.expectF($ftrim(a)).toBe(w) ;
        t.expectG(a.ftrim()).toBe(w) ;
        t.expectH(a.rtrim()).toBe(FoundationWhiteSpaces+w) ;
        t.expectI(a.ltrim()).toBe(w+FoundationWhiteSpaces) ;
    }) ;

    group.unary("$normspaces() function", async(t) => {
        const str = FoundationWhiteSpaces+"I'm "+FoundationWhiteSpaces+"a super"+FoundationWhiteSpaces+" function"+FoundationWhiteSpaces ;
        t.expect0($normspaces(str)).toBe("I'm a super function") ;
        t.expect1($normspaces("")).toBe("") ;
        t.expect2($normspaces(null)).toBe("") ;
        t.expect3($normspaces(undefined)).toBe("") ;
        t.expect4(str.normalizeSpaces()).toBe("I'm a super function") ;
    }) ;

    group.unary("string.isWhiteSpace() method", async(t) => {
        const n = FoundationWhiteSpaces.length ;
        for (let i = 0 ; i < n ; i++) {
            t.expect(FoundationWhiteSpaces.charAt(i).isWhiteSpace(),'Sws'+i).toBeTruthy() ;
            t.expect(FoundationWhiteSpaces.charCodeAt(i).isWhiteSpace(),'Nws'+i).toBeTruthy() ;
        }
        const c = 64 ;
        t.expect0(c.isWhiteSpace()).toBeFalsy() ;
        t.expect1(NaN.isWhiteSpace()).toBeFalsy() ;
        t.expect2(Infinity.isWhiteSpace()).toBeFalsy() ;
        t.expect3((-Infinity).isWhiteSpace()).toBeFalsy() ;
        t.expectA('a'.isWhiteSpace()).toBeFalsy() ;
        t.expectB(' a'.isWhiteSpace()).toBeFalsy() ;
        t.expectC('  '.isWhiteSpace()).toBeFalsy() ;
        t.expectD(FoundationWhiteSpaces.isWhiteSpace()).toBeFalsy() ;
        t.expectE(' '.isStrictWhiteSpace()).toBeTruthy() ;
        t.expectF('\n'.isStrictWhiteSpace()).toBeFalsy() ;
    }) ;

    group.unary("string.isNewLine() method", async(t) => {
        const NLS = FoundationNewLines ;
        const n = NLS.length ;
        for (let i = 0 ; i < n ; i++) {
            t.expect(NLS.charAt(i).isWhiteSpace(),'Sws'+i).toBeTruthy() ;
            t.expect(NLS.charCodeAt(i).isWhiteSpace(),'Nws'+i).toBeTruthy() ;
            t.expect(NLS.charAt(i).isNewLine(),'Snl'+i).toBeTruthy() ;
            t.expect(NLS.charCodeAt(i).isNewLine(),'Nnl'+i).toBeTruthy() ;
        }
        const c = 64 ;
        t.expect0(c.isNewLine()).toBeFalsy() ;
        t.expect1(NaN.isNewLine()).toBeFalsy() ;
        t.expect2(Infinity.isNewLine()).toBeFalsy() ;
        t.expect3((-Infinity).isNewLine()).toBeFalsy() ;
        t.expectA('a'.isNewLine()).toBeFalsy() ;
        t.expectB('\na'.isNewLine()).toBeFalsy() ;
        t.expectC('\n\t'.isNewLine()).toBeFalsy() ;
        t.expectD(NLS.isNewLine()).toBeFalsy() ;
        t.expectE(' '.isNewLine()).toBeFalsy() ;
        t.expectE('\t'.isNewLine()).toBeFalsy() ;
    }) ;

    group.unary("$firstcap() && $capitalize() functions", async(t) => {
        const str = " , jean-françois is my !!friend. yes!" ;
        t.expect0($firstcap(str)).toBe(" , Jean-françois is my !!friend. yes!") ;
        t.expect1($capitalize(str)).toBe(" , Jean-François Is My !!Friend. Yes!") ;
        t.expect2($firstcap(null)).toBe("") ;
        t.expect3($firstcap(undefined)).toBe("") ;
        t.expect4($capitalize(null)).toBe("") ;
        t.expect5($capitalize(undefined)).toBe("") ;
        t.expect6(str.firstCap()).toBe(" , Jean-françois is my !!friend. yes!") ;
        t.expect7(str.capitalize()).toBe(" , Jean-François Is My !!Friend. Yes!") ;
    }) ;

    group.unary("$lines() function", async(t) => {
        const str = `  Testing \n\tsplit ${FoundationNewLines}function` ;
        const fnla:string[] = [] ;
        for (let i = 0 ; i < FoundationNewLines.length - 1 ; i++) { fnla.push("") ; }
        const res = ["  Testing ", "\tsplit ", ...fnla, "function"] ;

        t.expect0($lines(str)).toBe(res) ;
        t.expect1(str.lines()).toBe(res) ;
        t.expect2(FoundationNewLines.lines()).toBe(["", ...fnla, ""]) ;
        t.expect3("".lines()).toBe([""]) ;
        t.expect4($lines(undefined)).toBe([]) ;
        t.expect5($lines(null)).toBe([]) ;
        t.expect6($lines('A\u000d\u000d\u000aB\u000a\u000d')).toBe(["A", "", "B", "", ""]) ;
        t.expect7($lines('A\u000d\u000a\u000d\u000d\u000aB\u000a\u000d')).toBe(      ["A", "", "", "B", "", ""]) ;
        t.expect8($lines('A\u000d\u000a\u000d\u000d\u000aB\u000a\u000d\u000a')).toBe(["A", "", "", "B", "", ""]) ;
        t.expect9($lines('A\u000d\u000a\u000d\u000d\u000aB\u000a\u000d\u000a\u000d')).toBe(["A", "", "", "B", "", "", ""]) ;
        t.expectA($lines('A\u000d\u000a\u000d\u000d\u000aB\u000a\u000d\u000a\u000d\u2028')).toBe(["A", "", "", "B", "", "", "", ""]) ;
        t.expectB($lines('A\u000d\u000a\u000d\u000d\u000aB\u000a\u000d\u000a\u000d\u2028C')).toBe(["A", "", "", "B", "", "", "", "C"]) ;
        t.expectC($lines('\u000d\u000a\u000d\u000d\u000aB\u000a\u000d\u000a\u000d\u2028C')).toBe(["", "", "", "B", "", "", "", "C"]) ;
        t.expectD($lines('\u000d\u000a\u000d\u000d\u000aB\u000a\u000d\u000a\u000d\u2028C\u000a')).toBe(["", "", "", "B", "", "", "", "C", ""]) ;
        t.expectE($lines('\u000d\u000a\u000d\u000d\u000aB\u000a\u000d\u000a\u000d\u2028C\u0085')).toBe(["", "", "", "B", "", "", "", "C", ""]) ;
        t.expectF($lines('\u000d\u000a\u000d\u000d\u000aB\u000a\u000d\u000a\u000d\u2028C\u000d')).toBe(      ["", "", "", "B", "", "", "", "C", ""]) ;
        t.expectG($lines('\u000d\u000a\u000d\u000d\u000aB\u000a\u000d\u000a\u000d\u2028C\u000d\u000a')).toBe(["", "", "", "B", "", "", "", "C", ""]) ;
    }) ;

    group.unary("Other methods on strings", async(t) => {
        t.expect0("1".singular()).true() ;
        t.expect1("\r".isNewLine()).true() ;
        t.expect2("1".isNewLine()).false() ;
        t.expect3("\r".isWhiteSpace()).true() ;
        t.expect4("\r".isStrictWhiteSpace()).false() ;
        t.expect5(" ".isWhiteSpace()).true() ;
        t.expect6(" ".isStrictWhiteSpace()).true() ;
        t.expect7("1".isWhiteSpace()).false() ;
        t.expect8("1".isStrictWhiteSpace()).false() ;
        t.expect9("0.9".singular()).false() ;
        t.expectA("1.0".singular()).true() ;
        t.expectB('This is a "new world"'.doubleEscape('"')).is('This is a ""new world""') ;
        t.expectC('\n&Y&b  REGISTERED ITEMS  &0'.doubleEscape('&')).is('\n&&Y&&b  REGISTERED ITEMS  &&0') ;
    }) ;

}) ;


