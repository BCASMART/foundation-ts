import { $ascii, $capitalize, $firstcap, $ftrim, $left, $lines, $ltrim, $normspaces, $right, $rtrim, $trim } from "../src/strings";
import { FoundationNewLines, FoundationWhiteSpaces } from "../src/string_tables";
import { TSTest } from "../src/tstester";

export const stringGroups = [
    TSTest.group("Commons strings functions", async (group) => {
        const S1 = "Texte accentué avec ça et c'est shön";

        group.unary("$left() and $right() functions", async(t) => {
            t.expect1($left(S1)).is('T') ;
            t.expect2(S1.left()).is('T') ;
            t.expect3($right(S1)).is('n') ;
            t.expect4(S1.right()).is('n') ;
            t.expect5($left(S1, 16)).is('Texte accentué a') ;
            t.expect6(S1.left(16)).is('Texte accentué a') ;
            t.expect7($right(S1, 16)).is("ça et c'est shön") ;
            t.expect8(S1.right(16)).is("ça et c'est shön") ;
            t.expect9($left(S1, 160)).is(S1) ;
            t.expectA(S1.left(160)).is(S1) ;
            t.expectB($right(S1, 160)).is(S1) ;
            t.expectC(S1.right(160)).is(S1) ;
        }) ;
        group.unary("$trim(), $rtrim(), $ltrim() functions", async(t) => {
            const w = "TEST ME, I'M A CENTRAL\u0009PHRASE" ;
            const a = FoundationWhiteSpaces+w+FoundationWhiteSpaces ;
            t.expect0($rtrim(a)).is(FoundationWhiteSpaces+w) ;
            t.expect1($ltrim(a)).is(w+FoundationWhiteSpaces) ;
            t.expect2($trim(a)).is(w) ;
            t.expect3($rtrim(FoundationWhiteSpaces)).is("") ;
            t.expect4($ltrim(FoundationWhiteSpaces)).is("") ;
            t.expect5(FoundationWhiteSpaces.ftrim()).is("") ;
            t.expect6($rtrim("")).is("") ;
            t.expect7($ltrim("")).is("") ;
            t.expect8($trim("")).is("") ;
            t.expect9($rtrim(undefined)).is("") ;
            t.expectA($ltrim(undefined)).is("") ;
            t.expectB($trim(undefined)).is("") ;
            t.expectC($rtrim(null)).is("") ;
            t.expectD($ltrim(null)).is("") ;
            t.expectE($trim(null)).is("") ;
            t.expectF($ftrim(a)).is(w) ;
            t.expectG(a.ftrim()).is(w) ;
            t.expectH(a.rtrim()).is(FoundationWhiteSpaces+w) ;
            t.expectI(a.ltrim()).is(w+FoundationWhiteSpaces) ;
        }) ;
    
        group.unary("$normspaces() function", async(t) => {
            const str = FoundationWhiteSpaces+"I'm "+FoundationWhiteSpaces+"a super"+FoundationWhiteSpaces+" function"+FoundationWhiteSpaces ;
            t.expect0($normspaces(str)).is("I'm a super function") ;
            t.expect1($normspaces("")).is("") ;
            t.expect2($normspaces(null)).is("") ;
            t.expect3($normspaces(undefined)).is("") ;
            t.expect4(str.normalizeSpaces()).is("I'm a super function") ;
        }) ;
    
        group.unary("string.isWhiteSpace() method", async(t) => {
            const n = FoundationWhiteSpaces.length ;
            for (let i = 0 ; i < n ; i++) {
                t.expect(FoundationWhiteSpaces.charAt(i).isWhiteSpace(),'Sws'+i).true() ;
                t.expect(FoundationWhiteSpaces.charCodeAt(i).isWhiteSpace(),'Nws'+i).true() ;
            }
            const c = 64 ;
            t.expect0(c.isWhiteSpace()).false() ;
            t.expect1(NaN.isWhiteSpace()).false() ;
            t.expect2(Infinity.isWhiteSpace()).false() ;
            t.expect3((-Infinity).isWhiteSpace()).false() ;
            t.expectA('a'.isWhiteSpace()).false() ;
            t.expectB(' a'.isWhiteSpace()).false() ;
            t.expectC('  '.isWhiteSpace()).false() ;
            t.expectD(FoundationWhiteSpaces.isWhiteSpace()).false() ;
            t.expectE(' '.isStrictWhiteSpace()).true() ;
            t.expectF('\n'.isStrictWhiteSpace()).false() ;
        }) ;
    
        group.unary("string.isNewLine() method", async(t) => {
            const NLS = FoundationNewLines ;
            const n = NLS.length ;
            for (let i = 0 ; i < n ; i++) {
                t.expect(NLS.charAt(i).isWhiteSpace(),'Sws'+i).true() ;
                t.expect(NLS.charCodeAt(i).isWhiteSpace(),'Nws'+i).true() ;
                t.expect(NLS.charAt(i).isNewLine(),'Snl'+i).true() ;
                t.expect(NLS.charCodeAt(i).isNewLine(),'Nnl'+i).true() ;
            }
            const c = 64 ;
            t.expect0(c.isNewLine()).false() ;
            t.expect1(NaN.isNewLine()).false() ;
            t.expect2(Infinity.isNewLine()).false() ;
            t.expect3((-Infinity).isNewLine()).false() ;
            t.expectA('a'.isNewLine()).false() ;
            t.expectB('\na'.isNewLine()).false() ;
            t.expectC('\n\t'.isNewLine()).false() ;
            t.expectD(NLS.isNewLine()).false() ;
            t.expectE(' '.isNewLine()).false() ;
            t.expectE('\t'.isNewLine()).false() ;
        }) ;
    
        group.unary("$firstcap() && $capitalize() functions", async(t) => {
            const str = " , jean-françois is my !!friend. yes!" ;
            t.expect0($firstcap(str)).is(" , Jean-françois is my !!friend. yes!") ;
            t.expect1($capitalize(str)).is(" , Jean-François Is My !!Friend. Yes!") ;
            t.expect2($firstcap(null)).is("") ;
            t.expect3($firstcap(undefined)).is("") ;
            t.expect4($capitalize(null)).is("") ;
            t.expect5($capitalize(undefined)).is("") ;
            t.expect6(str.firstCap()).is(" , Jean-françois is my !!friend. yes!") ;
            t.expect7(str.capitalize()).is(" , Jean-François Is My !!Friend. Yes!") ;
        }) ;
    
        group.unary("$lines() function", async(t) => {
            const str = `  Testing \n\tsplit ${FoundationNewLines}function` ;
            const fnla:string[] = [] ;
            for (let i = 0 ; i < FoundationNewLines.length - 1 ; i++) { fnla.push("") ; }
            const res = ["  Testing ", "\tsplit ", ...fnla, "function"] ;
    
            t.expect0($lines(str)).is(res) ;
            t.expect1(str.lines()).is(res) ;
            t.expect2(FoundationNewLines.lines()).is(["", ...fnla, ""]) ;
            t.expect3("".lines()).is([""]) ;
            t.expect4($lines(undefined)).is([]) ;
            t.expect5($lines(null)).is([]) ;
            t.expect6($lines('A\u000d\u000d\u000aB\u000a\u000d')).is(["A", "", "B", "", ""]) ;
            t.expect7($lines('A\u000d\u000a\u000d\u000d\u000aB\u000a\u000d')).is(      ["A", "", "", "B", "", ""]) ;
            t.expect8($lines('A\u000d\u000a\u000d\u000d\u000aB\u000a\u000d\u000a')).is(["A", "", "", "B", "", ""]) ;
            t.expect9($lines('A\u000d\u000a\u000d\u000d\u000aB\u000a\u000d\u000a\u000d')).is(["A", "", "", "B", "", "", ""]) ;
            t.expectA($lines('A\u000d\u000a\u000d\u000d\u000aB\u000a\u000d\u000a\u000d\u2028')).is(["A", "", "", "B", "", "", "", ""]) ;
            t.expectB($lines('A\u000d\u000a\u000d\u000d\u000aB\u000a\u000d\u000a\u000d\u2028C')).is(["A", "", "", "B", "", "", "", "C"]) ;
            t.expectC($lines('\u000d\u000a\u000d\u000d\u000aB\u000a\u000d\u000a\u000d\u2028C')).is(["", "", "", "B", "", "", "", "C"]) ;
            t.expectD($lines('\u000d\u000a\u000d\u000d\u000aB\u000a\u000d\u000a\u000d\u2028C\u000a')).is(["", "", "", "B", "", "", "", "C", ""]) ;
            t.expectE($lines('\u000d\u000a\u000d\u000d\u000aB\u000a\u000d\u000a\u000d\u2028C\u0085')).is(["", "", "", "B", "", "", "", "C", ""]) ;
            t.expectF($lines('\u000d\u000a\u000d\u000d\u000aB\u000a\u000d\u000a\u000d\u2028C\u000d')).is(      ["", "", "", "B", "", "", "", "C", ""]) ;
            t.expectG($lines('\u000d\u000a\u000d\u000d\u000aB\u000a\u000d\u000a\u000d\u2028C\u000d\u000a')).is(["", "", "", "B", "", "", "", "C", ""]) ;
        }) ;
        group.unary("utf32to ascii with .ascii() method", async(t) => {
            t.expect0('𝚤𝚥𝚨𝚩𝚪𝚫𝚬𝚭𝚮𝚯𝚰𝚱𝚲𝚳𝚴𝚵𝚶𝚷𝚸𝚹𝚺𝚻𝚼𝚽𝚾𝚿𝛀𝛂𝛃𝛄𝛅𝛆𝛇𝛈𝛉𝛊𝛋𝛌𝛍𝛎𝛏𝛐𝛑𝛒𝛓𝛔𝛕𝛖𝛗𝛘𝛙𝛚𝛜𝛝𝛟𝛠𝛢𝛣𝛤𝛥𝛦𝛧𝛨𝛩𝛪𝛫𝛬𝛭𝛮𝛯𝛰𝛱𝛲𝛳𝛴𝛵𝛶𝛷𝛸𝛹𝛺𝛼𝛽𝛾𝛿'.ascii())
                  .is('ijAVGDEZITHIKLMNXOPRTHSTYFCHPSOavgdezithiklmnxoprsstyfchpsoethfrAVGDEZITHIKLMNXOPRTHSTYFCHPSOavgd') ;
            t.expect1('𝜀𝜁𝜂𝜃𝜄𝜅𝜆𝜇𝜈𝜉𝜊𝜋𝜌𝜍𝜎𝜏𝜐𝜑𝜒𝜓𝜔𝜖𝜗𝜙𝜚𝜜𝜝𝜞𝜟𝜠𝜡𝜢𝜣𝜤𝜥𝜦𝜧𝜨𝜩𝜪𝜫𝜬𝜭𝜮𝜯𝜰𝜱𝜲𝜳𝜴𝜶𝜷𝜸𝜹𝜺𝜻𝜼𝜽𝜾𝜿𝝀𝝁𝝂𝝃𝝄𝝅𝝆𝝇𝝈𝝉𝝊𝝋𝝌𝝍𝝎𝝐𝝑𝝓𝝔𝝖𝝗𝝘𝝙𝝚𝝛𝝜𝝝𝝞𝝟'.ascii())
                  .is('ezithiklmnxoprsstyfchpsoethfrAVGDEZITHIKLMNXOPRTHSTYFCHPSOavgdezithiklmnxoprsstyfchpsoethfrAVGDEZITHIK') ;
            t.expect2('𝝠𝝡𝝢𝝣𝝤𝝥𝝦𝝧𝝨𝝩𝝪𝝫𝝬𝝭𝝮𝝰𝝱𝝲𝝳𝝴𝝵𝝶𝝷𝝸𝝹𝝺𝝻𝝼𝝽𝝾𝝿𝞀𝞁𝞂𝞃𝞄𝞅𝞆𝞇𝞈𝞊𝞋𝞍𝞎𝞐𝞑𝞒𝞓𝞔𝞕𝞖𝞗𝞘𝞙𝞚𝞛𝞜𝞝𝞞𝞟𝞠𝞡𝞢𝞣𝞤𝞥𝞦𝞧𝞨𝞪𝞫𝞬𝞭𝞮𝞯𝞰𝞱𝞲𝞳𝞴𝞵𝞶𝞷𝞸𝞹𝞺𝞻𝞼𝞽𝞾𝞿𝟀𝟁𝟂𝟄𝟅𝟇𝟈'.ascii())
                  .is('LMNXOPRTHSTYFCHPSOavgdezithiklmnxoprsstyfchpsoethfrAVGDEZITHIKLMNXOPRTHSTYFCHPSOavgdezithiklmnxoprsstyfchpsoethfr') ;

            // those specific character after 0xffff are now dropped
            t.expectX('🆑🆒🆓🆔🆕🆖🆗🆘🆙🆚'.ascii()).is('') ;
            t.expectY('😠😊💔😕😢😦❤️👿😇😂😗😆👨😐😶😮😡😄😃😈😭😛😝😜😎😓😅😒😉'.ascii()).is("")
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
    }),
    TSTest.group("$ascii() and such group", async (group) => {
        const S1 = "Texte accentué avec ça et c'est shön";
        const S2 = "Texte accentue avec ca et c'est shon";
        group.unary("$ascii() function", async(t) => {
            for(let i=0;i<1;i++) { // change counter here if you want to test the performance
            t.expect1($ascii(S1)).is(S2) ;
            t.expect2($ascii(S1)).is(S2.ascii()) ;
            t.expect3($ascii('@&é"\'(§è!çà)-#1234567890°_•ë“‘{¶«¡Çø}—´„”’[å»ÛÁØ]–')).is('@&e"\'(e!ca)-#1234567890_.e"\'{"!Co}-""\'[a"UAO]-');
            t.expect4($ascii('azertyuiop^$AZERTYUIOP¨*æê®†Úºîœπô€Æ‚ÅÊ™ŸªïŒ∏Ô¥')).is('azertyuiop^$AZERTYUIOP*aee(R)UoioepoEURAE\'AETMYaiOEOJPY');
            t.expect5($ascii('qsdfghjklmù`QSDFGHJKLM%£‡Ò∂ƒﬁÌÏÈ¬µÙ@Ω∑∆·ﬂÎÍË|Ó‰#')).is('qsdfghjklmu`QSDFGHJKLM%GBPOdffiIIEmU@O.flIIE|O#');
            t.expect6($ascii('<wxcvbn,;:=>WXCVBN?./+≤‹≈©◊ß~∞…÷≠≥›⁄¢√ı¿•\\±')).is('<wxcvbn,;:=>WXCVBN?./+<=<(C)ss~.../>=>/ci?.\\') ;
            t.expect7($ascii('âêîôûäëïöüÂÊÎÔÛÄËÏÖÜàèìòùÀÈÌÒÙñÑãÃõÕÁÉÍÓÚáéíóú')).is('aeiouaeiouAEIOUAEIOUaeiouAEIOUnNaAoOAEIOUaeiou') ;
            t.expect8('âêîôûäëïöüÂÊÎÔÛÄËÏÖÜàèìòùÀÈÌÒÙñÑãÃõÕÁÉÍÓÚáéíóú'.ascii()).is('aeiouaeiouAEIOUAEIOUaeiouAEIOUnNaAoOAEIOUaeiou') ;
            t.expect9('ΆΏΰαζθφωώϐϑϒϓϔϕΣψῼ'.ascii()).is('AOyazthfoovthYYYfSpsO') ;
            t.expectA('eine Milliarde sieben­hundert­neun­und­sechzig Millionen fünf­hundert­sieben­und­zwanzig­tausend­ein­hundert­elf'.ascii())
                .is('eine Milliarde siebenhundertneunundsechzig Millionen funfhundertsiebenundzwanzigtausendeinhundertelf') ;
            t.expectB('¯ĸƱƼƽɗɤɸʊʰʱʲʳʴʵʶʷʸ˘˙˚˛˜˝ˠˡˢˣͺ;Ϳͻͼͽ'.ascii())
                .is('qUQqdgfu?Jsss') ;
            t.expectC('ᶛᶜᶝᶞᶟᶠᶡᶢᶣᶤᶥᶦ'.ascii()).is("") ;
            t.expectD('ᶧᶨᶩᶪᶫᶬᶭᶮᶯᶰᶱᶲᶳᶴ'.ascii()).is("") ;
            t.expectE('ᶵᶶᶷᶸᶹᶺᶻᶼᶽᶾᶿ'.ascii()).is("") ;
            t.expectF('᾽᾿῀῍῎῏ι῝῞῟῾'.ascii()).is("") ;
            t.expectG('‗\u{2028}\u{2029}‾℞≁≮≯≰≱⍯゛゜・ー㈀㈁㈂㈃㈄㈅㈆㈇㈈㈉㈊㈋㈌㈍㈎㈏㈐㈟㈠㈡㈢㈣㈤㈥㈦㈧㈨㈩㈪㈫㈬㈭㈮㈯㈰㈱㈲㈳㈴㈵㈶㈷㈸㈹㈺㈻㈼㈽㈾㈿㉀㉁㉂㉃'.ascii()).is("") ;
            t.expectH('\u{3250}㌀㌃㌇㌈㌊㌍㌑㌒㌓㌖㌛㌜㌞㌠㌤㌫㌬㌭㌳㌶㌻㌼㍁㍂㍊㍍㍎㍓㍔'.ascii()).is("") ;
            t.expectI('\u{AB5C}\u{AB5E}\u{AB69}\u{FC5E}\u{FC5F}\u{FC60}\u{FC61}\u{FC62}\u{FC63}'.ascii()).is("") ;
            t.expectJ('ﷻﷺ﹉﹊﹋﹌ﹰ'.ascii()).is("") ;
            t.expectK('﹍﹎﹏﹐﹒ﹲﹴﹶﹺﹼﹾ'.ascii()).is(",.") ;
            t.expectL('₠₣€₨₧℩Ↄↄ≪≫⋆⋜⋝⍷、㉈㉉㉊㉋㉌㉍㉎㉏'.ascii())
                .is('EURFRFEURRsPtsiCc<<>>*<=>=e,1020304050607080')
            t.expectM('ϱϋὗὛὟῆῊῌᾇϴϽϾ'.ascii()).is('ryyYYiIIaTHSS') ;

            t.expectN('ϝϞϟϷϸϺϻ\u{180E}\u{1680}'.ascii())
                .is('fKkSHshSs') ;
            t.expectO('ͱͰ΄ϘϙϚϛϜ'.ascii())
                .is('hHKkSTstF') ;
            
            t.expectP('ᴦᴧᴨᴩᴪᴬᴭᴮᴯᴰᴱᴲᴳᴴᴵᴶᴷᴸᴹᴺᴻᴼᴽᴾᴿᵀᵁᵂᵃᵄᵅᵆᵇᵈᵉᵊᵋᵌᵍᵎᵏᵐᵑᵒᵓᵔᵕᵖᵗᵘᵙᵚᵛᵜᵝᵞᵟᵠᵡᵢᵣᵤᵥᵦᵧᵨᵩᵪᵫᵬᵭᵮᵯᵿ'.ascii())
                .is('GLPRPSuebdfmu') ;

            }
        })
    })
] ;



