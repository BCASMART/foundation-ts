import { $ascii, $asciifs, $camelCase, $capitalize, $firstcap, $ftrim, $HTML, $left, $lines, $ltrim, $normspaces, $right, $rtrim, $snakeCase, $strictascii, $trim } from "../src/strings";
import { FoundationNewLines, FoundationWhiteSpaces } from "../src/string_tables";
import { TSTest } from "../src/tstester";
import { $transliterate } from "../src/transliteration";

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

            // count edge cases: 0 / negative / fractional all fall back to 1
            t.expectD($left("hello", 0)).is("h") ;
            t.expectE($left("hello", -3)).is("h") ;
            t.expectF($left("hello", 1.9)).is("h") ;
            t.expectG($right("hello", 0)).is("o") ;
            t.expectH($right("hello", -3)).is("o") ;
            t.expectI($left("hello", 5)).is("hello") ;      // n === length
            t.expectJ($right("hello", 5)).is("hello") ;
            // nullish / empty source
            t.expectK($left(null)).is("") ;
            t.expectL($left(undefined, 3)).is("") ;
            t.expectM($right("")).is("") ;
            t.expectN($left("", 3)).is("") ;
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

            // replacer option
            t.expect5($normspaces("a  b\tc", { replacer:"_" })).is("a_b_c") ;
            t.expect6($normspaces("  a  b  ", { replacer:"" })).is("ab") ;
            // strict option: only strict whitespaces (space/tab...) are collapsed, not newlines
            t.expect7($normspaces("a \n b", { strict:true })).is("a \n b") ;
            t.expect8($normspaces("a \n b")).is("a b") ;                    // non-strict collapses the newline too
            t.expect9($normspaces("a  b", { replacer:"-" })).is("a-b") ;  // NBSP is a whitespace
        }) ;

        group.unary("$asciifs() function", async(t) => {
            t.expect0($asciifs(null)).is("") ;
            t.expect1($asciifs("  ")).is("") ;
            t.expect2($asciifs("Rapport été 2024.pdf")).is("Rapport ete 2024.pdf") ;
            // forbidden filename characters are replaced by '_'
            t.expect3($asciifs('a<b>c:d"e/f\\g*h?i|j')).is("a_b_c_d_e_f_g_h_i_j") ;
            // control chars are stripped
            t.expect4($asciifs("ab")).is("ab") ;
            // posix mode keeps only [A-Za-z0-9._-]
            t.expect5($asciifs("café (final) v2.pdf", true)).is("cafe__final__v2.pdf") ;
            t.expect6($asciifs("normal-name_v2.txt", true)).is("normal-name_v2.txt") ;
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
            t.expectF('\t'.isNewLine()).false() ;
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

            // capitalization relies on the original code point being a Unicode letter,
            // not on the shape of its transliteration
            t.expect8($capitalize("ålborg über ЯНДЕКС")).is("Ålborg Über ЯНДЕКС") ;         // non-ASCII letters get capitalized, already-uppercase script is kept
            t.expect9($capitalize("école")).is("École") ;
            t.expectA($capitalize("east 东京tokyo and 北京beijing")).is("East 东京tokyo And 北京beijing") ; // CJK glued to latin stays a single word
            t.expectB($capitalize("عربى test")).is("عربى Test") ;                            // caseless script = a word, latin word still capitalized
            t.expectC($firstcap("über alles")).is("Über alles") ;
            t.expectD($firstcap("éléonore aime rené")).is("Éléonore aime rené") ;
            t.expectE("über".firstCap()).is("Über") ;
            t.expectF("éa ét".capitalize()).is("Éa Ét") ;
        }) ;

        group.unary("$capitalize()/$firstcap() Unicode code-point handling", async(t) => {
            // NFD input: base letter + combining mark must stay aligned (mark is \p{M} => a letter continuation)
            const nfd = "école" ;                       // "école" fully decomposed
            t.expect0($capitalize(nfd)).is("École") ;
            t.expect1($firstcap(nfd)).is("École") ;
            // astral (surrogate-pair) non-letters must be stepped over without desync
            t.expect2($capitalize("👍 hello 👨‍👩‍👧")).is("👍 Hello 👨‍👩‍👧") ;
            t.expect3($firstcap("😀abc def")).is("😀Abc def") ;
            t.expect4($capitalize("🚀")).is("🚀") ;             // lone emoji: no length drift / trailing garbage
            // astral LETTERS (Deseret) are \p{L} and get upper-cased across the surrogate pair
            t.expect5($capitalize("\u{10428}b \u{10429}c")).is("\u{10400}b \u{10401}c") ;
            // digits / connector punctuation are not letters => the next letter starts a new word
            t.expect6($capitalize("3d _x y2z")).is("3D _X Y2Z") ;
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
                  .is('ijABGDEZEThIKLMNXOPRThSTYPhChPsOabgdezethiklmnxoprsstyphchpsoethphrABGDEZEThIKLMNXOPRThSTYPhChPsOabgd') ;
            t.expect1('𝜀𝜁𝜂𝜃𝜄𝜅𝜆𝜇𝜈𝜉𝜊𝜋𝜌𝜍𝜎𝜏𝜐𝜑𝜒𝜓𝜔𝜖𝜗𝜙𝜚𝜜𝜝𝜞𝜟𝜠𝜡𝜢𝜣𝜤𝜥𝜦𝜧𝜨𝜩𝜪𝜫𝜬𝜭𝜮𝜯𝜰𝜱𝜲𝜳𝜴𝜶𝜷𝜸𝜹𝜺𝜻𝜼𝜽𝜾𝜿𝝀𝝁𝝂𝝃𝝄𝝅𝝆𝝇𝝈𝝉𝝊𝝋𝝌𝝍𝝎𝝐𝝑𝝓𝝔𝝖𝝗𝝘𝝙𝝚𝝛𝝜𝝝𝝞𝝟'.ascii())
                  .is('ezethiklmnxoprsstyphchpsoethphrABGDEZEThIKLMNXOPRThSTYPhChPsOabgdezethiklmnxoprsstyphchpsoethphrABGDEZEThIK') ;
            t.expect2('𝝠𝝡𝝢𝝣𝝤𝝥𝝦𝝧𝝨𝝩𝝪𝝫𝝬𝝭𝝮𝝰𝝱𝝲𝝳𝝴𝝵𝝶𝝷𝝸𝝹𝝺𝝻𝝼𝝽𝝾𝝿𝞀𝞁𝞂𝞃𝞄𝞅𝞆𝞇𝞈𝞊𝞋𝞍𝞎𝞐𝞑𝞒𝞓𝞔𝞕𝞖𝞗𝞘𝞙𝞚𝞛𝞜𝞝𝞞𝞟𝞠𝞡𝞢𝞣𝞤𝞥𝞦𝞧𝞨𝞪𝞫𝞬𝞭𝞮𝞯𝞰𝞱𝞲𝞳𝞴𝞵𝞶𝞷𝞸𝞹𝞺𝞻𝞼𝞽𝞾𝞿𝟀𝟁𝟂𝟄𝟅𝟇𝟈'.ascii())
                  .is('LMNXOPRThSTYPhChPsOabgdezethiklmnxoprsstyphchpsoethphrABGDEZEThIKLMNXOPRThSTYPhChPsOabgdezethiklmnxoprsstyphchpsoethphr') ;

            // those specific character after 0xffff are now dropped
            t.expectX('🆑🆒🆓🆔🆕🆖🆗🆘🆙🆚'.ascii()).is('CLCOOLFREEIDNEWNGOKSOSUP!VS') ;
            t.expectY('😠😊💔😕😢😦❤️👿😇😂😗😆👨😐😶😮😡😄😃😈😭😛😝😜😎😓😅😒😉'.ascii()).is(":angry::blush::broken_heart::confused::cry::frowning::heart::imp::innocent::joy::kissing::laughing::man::neutral_face::no_mouth::open_mouth::rage::smile::smiley::smiling_imp::sob::stuck_out_tongue::stuck_out_tongue_closed_eyes::stuck_out_tongue_winking_eye::sunglasses::sweat::sweat_smile::unamused::wink:")
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

        group.unary("String prototype conversions", async(t) => {
            t.expect0('héllo wörld'.strictAscii()).is('hello world') ;
            t.expect1(''.strictAscii()).null() ;
            t.expect2('a b/c'.asciifs(false)).isstring() ;
            t.expect3('2021-06-01'.isDate()).true() ;
            t.expect4('nope'.isDate()).false() ;
            t.expect5('2021-06-01'.toDate() instanceof Date).true() ;
            t.expect6('nope'.toDate()).null() ;
            t.expect7('42abc'.toInt()).is(42) ;
            t.expect8('2021-06-01T10:00:00'.toTSDate()?.toIsoString()).is('2021-06-01T10:00:00') ;
            t.expect9('+33612345678'.toPhoneNumber()?.standardNumber.length).gt(0) ;
            t.expectA('notaphone'.toPhoneNumber()).null() ;
            // a Unicode line separator (U+2028) exercises isOtherLineSeparator in $lines()
            t.expectB('a b'.lines()).is(['a', 'b']) ;
            t.expectC('a b'.lines(true)).is(['a b']) ;   // ASCII-only separators -> not split
        }) ;

        group.unary("$camelCase(), $snakeCase() && $HTML() functions", async(t) => {
            // identifier oriented: spaces are stripped, '-' and '_' mark word boundaries, non-ASCII is transliterated
            t.expect0($camelCase("foo-bar_baz")).is("fooBarBaz") ;
            t.expect1($camelCase("Été-préféré")).is("EtePrefere") ;
            t.expect2($camelCase(null)).is("") ;
            t.expect3($camelCase("")).is("") ;
            t.expect4("foo_bar".camelCase()).is("fooBar") ;
            t.expect5($snakeCase("fooBar-baz")).is("foobar_baz") ;
            t.expect6($snakeCase("Été préféré")).is("eteprefere") ;
            t.expect7($snakeCase(null)).is("") ;
            t.expect8("a-b-c".snakeCase()).is("a_b_c") ;

            t.expectA($HTML(null)).is("") ;
            t.expectB($HTML("")).is("") ;
            t.expectC($HTML(`<a href="x">R&D</a>`)).is("&lt;a href=&quot;x&quot;&gt;R&amp;D&lt;/a&gt;") ;
            t.expectD($HTML("plain text")).is("plain text") ;
            t.expectE("<b>".toHTML()).is("&lt;b&gt;") ;
        }) ;
    }),
    TSTest.group("$ascii() and such group", async (group) => {
        const S1 = "Texte accentué avec ça et c'est shön";
        const S2 = "Texte accentue avec ca et c'est shon";
        group.unary("$transliterate() function", async t => {
            t.expect0($transliterate("", false)).is("") ;
            t.expect1($transliterate("", true)).is("") ;
            t.expect2($transliterate(S1, false)).is(S2) ;
            t.expect3($transliterate(S1, true)).is(S2) ;
        }) ;
        group.unary("$ascii() function ", async t => {
            t.expect1($ascii(S1)).is(S2) ;
            t.expect2($ascii(S1)).is(S2.ascii()) ;
            t.expect3($ascii("les aïeux épuisæs")).is("les aieux epuisaes") ;
            t.expect4($ascii("ǄǶǼǦ")).is("DZHVAEG") ;
            t.expect5($ascii("azertyuiop^$AZERTYUIOP¨*æê®†Úºîœπô€Æ‚ÅÊ™ŸªïŒ∏Ô¥")).is("azertyuiop^$AZERTYUIOP..*aee(R)+UoioepoEURAE'AETMYaiOEPOJPY") ;
            t.expect6($ascii("qsdfghjklmù`QSDFGHJKLM%£‡Ò∂ƒﬁÌÏÈ¬µÙ@Ω∑∆·ﬂÎÍË|Ó‰#")).is("qsdfghjklmu`QSDFGHJKLM%GBP++OdffiIIE-mU@OS^.flIIE|O%0#") ;
            t.expect7($ascii("âêîôûäëïöüÂÊÎÔÛÄËÏÖÜàèìòùÀÈÌÒÙñÑãÃõÕÁÉÍÓÚáéíóú")).is("aeiouaeiouAEIOUAEIOUaeiouAEIOUnNaAoOAEIOUaeiou") ;
            t.expect8($ascii("ΆΏΰαζθφωώϐϑϒϓϔϕΣψῼ")).is("AOyazthfoovthYYYfSpsO") ;
            t.expect9($ascii("いまは自分には、幸福も不幸もありません。ただ、一さいは過ぎて行きます。")).is("imahaZiFenniha,XingFumoBuXingmoarimasen.tada,YisaihaGuogiteXingkimasu.") ;
            t.expectA($ascii("eine Milliarde sieben­hundert­neun­und­sechzig Millionen fünf­hundert­sieben­und­zwanzig­tausend­ein­hundert­elf")).is("eine Milliarde sieben-hundert-neun-und-sechzig Millionen funf-hundert-sieben-und-zwanzig-tausend-ein-hundert-elf") ;
            t.expectB($ascii("¯ĸƱƼƽɗɤɸʊʰʱʲʳʴʵʶʷʸ˘˙˚˛˜˝ˠˡˢˣͺ;Ϳͻͼͽ")).is("-qU55dgfuhhjrrrRwy(.o,~\"glsxi?Jsss") ;
            t.expectC($ascii("はつじょうホルモン")).is("hatsujiyouhorumon") ;
            t.expectD($ascii("１１０３７")).is("11037") ;
            t.expectE($ascii("ⅩⅩⅩⅨ")).is("XXXIX") ;
            t.expectF($ascii("<wxcvbn,;:=>WXCVBN?./+≤‹≈©◊ß~∞…÷≠≥›⁄¢√ı¿•\\\\±")).is("<wxcvbn,;:=>WXCVBN?./+<=<~(C)*ss~inf.../=>=>/csqrti?*\\\\+/-") ;
            t.expectG($ascii("@&é\"'(§è!çà)-#1234567890°_•ë“‘{¶«¡Çø}—´„”’[å»ÛÁØ]–")).is("@&e\"'(#e!ca)-#1234567890o_*e\"'{\n\"!Co}-'\"\"'[a\"UAO]-") ;
            t.expectH($ascii("𐘀𐘁𐘂𐘃𐘄𐘅𐘆𐘇𐘈𐘉𐘊𐘋𐘌𐘏𐘘𐘩𐘷𐙇𐙬𐙷𐚊𐚖𐚮𐚺𐜮")).is("")
            t.expectH($ascii("0྽1࿍2໾3࿬4࿿5Ⴭ6𑁼78")).is("012345AE678") ;
            t.expectX($ascii(null)).is("") ;
            t.expectY($ascii(undefined)).is("") ;
            t.expectZ($ascii("")).is("") ;

        }) ;
        group.unary("$strictascii() function", async t => {
            t.expect0($strictascii(null)).null() ;
            t.expect1($strictascii(undefined)).null() ;
            t.expect2($strictascii("")).is("") ;
            t.expect3($strictascii("0྽1࿍2໾3࿬4࿿5Ⴭ6𑁼78")).null() ;
            t.expect4($strictascii("𐘀𐘁𐘂𐘃𐘄𐘅𐘆𐘇𐘈𐘉𐘊𐘋𐘌𐘏𐘘𐘩𐘷𐙇𐙬𐙷𐚊𐚖𐚮𐚺𐜮")).null() ;
            t.expect5($strictascii("はつじょうホル𐘊モン")).null() ;
            t.expect6($strictascii("<wxcvbn,;:=>WXCVBN?./+≤‹≈©◊ß~∞…÷≠≥›⁄¢√ı¿•\\𐜮\\±")).null() ;
        }) ;

    })
] ;



