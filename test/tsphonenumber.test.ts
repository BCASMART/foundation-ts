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
