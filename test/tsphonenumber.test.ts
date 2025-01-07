import { $isophone, $isphonenumber, $phonenumber } from "../src/commons";
import { TSCountry } from "../src/tscountry";
import { TSTest } from "../src/tstester";


export const phoneGroups = TSTest.group("TSPhoneNumber class ", async (group) => {
    group.unary("$phonenumber() function with same number variations", async(t) => {
        const N = '0145247000' ;
        const D = '33' ;
        t.expect0($phonenumber('+ 3-3.0-1—4—5.247000')?.number).is(N) ;
        t.expect1($phonenumber('+33 01 45 24 7000')?.dialCode).is(D) ;
        t.expect2($phonenumber('+33 01 45 24 7000')?.number).is(N) ;
        t.expect3($phonenumber('+33 1 45 24 7000')?.dialCode).is(D) ;
        t.expect4($phonenumber('+33 1 45 24 7000')?.number).is(N) ;
        t.expect5($phonenumber('+(33) 1 45 24 7000')?.dialCode).is(D) ;
        t.expect6($phonenumber('+(33) 1 45 24 7000')?.number).is(N) ;
        t.expect7($phonenumber('+(33 1) 45 24 7000')?.dialCode).is(D) ;
        t.expect8($phonenumber('+(33 1) 45 24 7000')?.number).is(N) ;
        t.expect9($phonenumber('(+33) 1 45 24 7000')?.dialCode).is(D) ;
        t.expectA($phonenumber('(+33) 1 45 24 7000')?.number).is(N) ;
        t.expectB($phonenumber('(+33) 01 45 24 7000')?.dialCode).is(D) ;
        t.expectC($phonenumber('(+33) 01 45 24 7000')?.number).is(N) ;
        t.expectD($phonenumber('01 45 24 70 00')?.dialCode).is(D) ;
        t.expectE($phonenumber('01 45 24 70 00')?.number).is(N) ;
        t.expectF($phonenumber('1 45 24 70 00')?.dialCode).undef() ;
        t.expectG($phonenumber('1 45 24 70 00')?.number).undef() ;
        t.expectH($phonenumber('+330145247000')?.number).is(N) ;
        t.expectI($phonenumber('⓪①⓸5︎⃣24➐⁰₀0')?.number).is(N) ;
        t.expectJ($phonenumber('(145)-247-000')).null() ;
        t.expectK($phonenumber('+33 (145)-247-000')?.number).is(N) ;
        t.expectL($phonenumber('0033-01.45.24.7000')?.number).is(N) ;
        t.expectM($phonenumber('00(33)01.45.24.7000')?.number).is(N) ;
        t.expectN($phonenumber('(00 33)01.45.24.7000')?.number).is(N) ;
        t.expectO($phonenumber('+( 3 3 ) 1 45 24 7000')?.dialCode).is(D) ;
        t.expectN($phonenumber('+(1)408.212.4598')?.standardNumber).is("+1 4082124598") ;
        t.expectP($phonenumber('+(1)418.212.4598')?.standardNumber).is("+1 4182124598") ;
        t.expectQ($phonenumber('+(1)408.212.4598')?.compactNumber).is("+14082124598") ;
        t.expectR($phonenumber('+(1)418.212.4598')?.compactNumber).is("+14182124598") ;
        t.expectS($phonenumber('+( 3 3 ) 1 45 24 7000')?.standardNumber).is("+33 145247000") ;
        t.expectT($phonenumber('+( 3 3 ) 1 45 24 7000')?.compactNumber).is("+33145247000") ;
        t.expectU($phonenumber('(+358)1234567')?.standardNumber).is('+358 1234567') ;
        t.expectV($phonenumber('(+358)01234567')?.standardNumber).is('+358 1234567') ;
        t.expectW($phonenumber('(+358)01234567890')?.standardNumber).is('+358 1234567890') ;
        t.expectX($phonenumber('(+358)123456')?.standardNumber).KO() ;
        t.expectY($phonenumber('(+358)012345678901')?.standardNumber).KO() ;
        t.expectZ($phonenumber('(+358)01234567890')?.alpha2Code).is('FI') ;
    }) ;
    group.unary("TSPhoneNumber.toString(format)", async(t) => {
        const p = $phonenumber('+( 3 3 ) 1 45 24 7000') ;
        const p1 = $phonenumber('+14082124598') ;
        const pa = $phonenumber('(+358)01234567890') ;
        const pb = $phonenumber('(+358)1234567') ;

        t.expect0(p?.toString()).is("+33 145247000") ;
        t.expect1(p?.toString(undefined)).is("+33 145247000") ;
        t.expect2(p?.toString(null)).is("+(33) 1 45 24 70 00") ;
        t.expect3(p?.toString('+(%d) %t%1 %2 %2 %2 %2')).is("+(33) 01 45 24 70 00") ;
        t.expect4(p?.toString('+(%d %1)%r')).is("+(33 1)45247000") ;
        t.expect5(p?.toString('(+%d) %t%n')).is("(+33) 0145247000") ;
        t.expect6(p?.toString('(+%d) %N')).is("(+33) 0145247000") ;
        t.expect7(p?.toString('+(%d %1)%r')).is("+(33 1)45247000") ;
        t.expect8(p?.toString('+(%d %1)%r [%x]')).is("+(33 1)45247000 [FR]") ;
        t.expectA(p?.toString('+(%d %1)%r [%X]')).is("+(33 1)45247000 [FRA]") ;
        t.expectB(p?.toString('+(%d %1)%r [%c]')).is("+(33 1)45247000 [France]") ;
        t.expectC(p?.toString('+(%d %1)%r [%C]')).is("+(33 1)45247000 [France]") ;
        t.expectD(p?.toString('+(%d %1)%r [%C]', 'de')).is("+(33 1)45247000 [Frankreich]") ;
        t.expectK(p1?.toString('+(%d)%3.%3.%r [%x]')).is("+(1)408.212.4598 [US]") ;
        t.expectL(p1?.toString('+(%d)%3.%3.%r [%X]')).is("+(1)408.212.4598 [USA]") ;
        t.expectM(p1?.toString('+(%d)%3.%3.%r [%c]')).is("+(1)408.212.4598 [United States of America]") ;
        t.expectN(p1?.toString('+(%d)%3.%3.%r [%C]')).is("+(1)408.212.4598 [États-Unis d'Amérique]") ;
        t.expectO(p1?.toString('+(%d)%3.%3.%r [%C]', 'default')).is("+(1)408.212.4598 [États-Unis d'Amérique]") ;
        t.expectP(p1?.toString('+(%d)%3.%3.%r [%C]', 'native')).is("+(1)408.212.4598 [United States of America]") ;
        t.expectQ(p1?.toString('+(%d)%3.%3.%r [%C]', 'de')).is("+(1)408.212.4598 [Vereinigte Staaten von Amerika]") ;
        t.expectR(p1?.toString('+(%d)%3.%3.%r [%C]', 'fr')).is("+(1)408.212.4598 [États-Unis d'Amérique]") ;
        t.expectS(p1?.toString('+(%d)%3.%3.%r%0 [%C]', 'fr')).is("+(1)408.212.4598") ;
        t.expectT(pa?.toString('+(%d) %t%1 %2 %2 %2%0 %r', 'fr')).is("+(358) 01 23 45 67 890") ;
        t.expectU(pb?.toString('+(%d) %t%1 %2 %2 %2%0 %r', 'fr')).is("+(358) 01 23 45 67") ;
    }) ;

    group.unary("$phonenumber() function country recognition", async(t) => {
        t.expect0($phonenumber('+3906 69812345')?.country.alpha2Code).is('VA') ;
        t.expect1($phonenumber('+3906 69512345')?.country.alpha2Code).is('IT') ;
        t.expect2($phonenumber('+(1)408.212.4598')?.country.alpha2Code).is('US') ;
        t.expect3($phonenumber('+(1)418.212.4598')?.country.alpha2Code).is('CA') ;
        t.expect4($phonenumber('+442079476330')?.country.alpha2Code).is('GB') ;
    }) ;
    group.unary("$isphonenumber() function", async(t) => {
        t.expect0($isphonenumber(null)).false() ;
        t.expect1($isphonenumber(undefined)).false() ;
        t.expect2($isphonenumber('')).false() ;
        t.expect3($isphonenumber('+33 01 45 24 7000')).true() ;
        t.expect4($isphonenumber(' +(33) 01 45 24 7000')).true() ;
        t.expect5($isphonenumber(' +(33 1) 45 24 70 00')).true() ;
        t.expect6($isphonenumber(' (+33) 01 45 24 70 00')).true() ;
        t.expect7($isphonenumber(' +33 1 45 24 70 00')).true() ;
        t.expect8($isphonenumber(' +33145 2470 00')).true() ;
        t.expect9($isphonenumber(' +33145 2470 0')).false() ;
        t.expectA($isphonenumber('02079476330')).false() ;
        t.expectB($isphonenumber('02079476330', TSCountry.country('GB'))).true() ;
    }) ;

    group.unary('$isophone() function', async (t) => {
        const N = '+33 145247000' ;
        t.expect0($isophone('+ 3-3.0-1—4—5.247000')).is(N) ;
        t.expect1($isophone('⓪①⓸5︎⃣24➐⁰₀0')).is(N) ;
        t.expect2($isophone('(00 33)01.45.24.7000')).is(N) ;
    }) ;
}) ;
