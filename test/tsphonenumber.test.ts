import { $defined, $isophone, $isphonenumber, $ok, $phonenumber, $value } from "../src/commons";
import { $absolute, $loadJSON, $path } from "../src/fs";
import { TSCountry } from "../src/tscountry";
import { TSError } from "../src/tserrors";
import { $phoneFromString, PhoneValidity, TSPhoneNumber } from "../src/tsphonenumber";
import { TSTest, TSUnaryTest } from "../src/tstester";
import { $inbrowser, $insp, $logterm } from "../src/utils";


export const phoneGroups = TSTest.group("TSPhoneNumber class ", async (group) => {
    group.unary("$phoneFromString() function with same number variations", async(t) => {
        const N = '0145247000' ;
        const D = '33' ;
        function _phone(t:TSUnaryTest, s:string) {
            const [n, c, v, m, step] = $phoneFromString(s) ;
            if (v !== PhoneValidity.OK) {
                t.register(`Phone ${s}`, `step:${step}, result:'${n}'. validity:${v}, country:${$value(c?.alpha2Code, 'none')}, mobile:${m}`)
                return null ;
            }
            return new TSPhoneNumber(n!,c!,m) ;
        }
        t.expect0(_phone(t, '+ 3-3.0-1—4—5.247000')?.number).is(N) ;
        t.expect1(_phone(t, '+33 01 45 24 7000')?.dialCode).is(D) ;
        t.expect2(_phone(t, '+33 01 45 24 7000')?.number).is(N) ;
        t.expect3(_phone(t, '+33 1 45 24 7000')?.dialCode).is(D) ;
        t.expect4(_phone(t, '+33 1 45 24 7000')?.number).is(N) ;
        t.expect5(_phone(t, '+(33) 1 45 24 7000')?.dialCode).is(D) ;
        t.expect6(_phone(t, '+(33) 1 45 24 7000')?.number).is(N) ;
        t.expect7(_phone(t, '+(33 1) 45 24 7000')?.dialCode).is(D) ;
        t.expect8(_phone(t, '+(33 1) 45 24 7000')?.number).is(N) ;
        t.expect9(_phone(t, '(+33) 1 45 24 7000')?.dialCode).is(D) ;
        t.expectA(_phone(t, '(+33) 1 45 24 7000')?.number).is(N) ;
        t.expectB(_phone(t, '(+33) 01 45 24 7000')?.dialCode).is(D) ;
        t.expectC(_phone(t, '(+33) 01 45 24 7000')?.number).is(N) ;
        t.expectD(_phone(t, '01 45 24 70 00')?.dialCode).is(D) ;
        t.expectE(_phone(t, '01 45 24 70 00')?.number).is(N) ;
        t.expectF(_phone(t, '1 45 24 70 00')?.dialCode).undef() ;
        t.expectG(_phone(t, '1 45 24 70 00')?.number).undef() ;
        t.expectH(_phone(t, '+330145247000')?.number).is(N) ;
        t.expectI(_phone(t, '⓪①⓸5︎⃣24➐⁰₀0')?.number).is(N) ; // contient deux xaracteres invisibles
        t.expectJ(_phone(t, '(145)-247-000')).null() ;
        t.expectK(_phone(t, '+33 (145)-247-000')?.number).is(N) ;
        t.expectL(_phone(t, '0033-01.45.24.7000')?.number).is(N) ;
        t.expectM(_phone(t, '00(33)01.45.24.7000')?.number).is(N) ;
        t.expectN(_phone(t, '(00 33)01.45.24.7000')?.number).is(N) ;
        t.expectO(_phone(t, '+( 3 3 ) 1 45 24 7000')?.dialCode).is(D) ;
        t.expectN(_phone(t, '+(1)408.212.4598')?.standardNumber).is("+1 4082124598") ;
        t.expectP(_phone(t, '+(1)418.212.4598')?.standardNumber).is("+1 4182124598") ;
        t.expectQ(_phone(t, '+(1)408.212.4598')?.compactNumber).is("+14082124598") ;
        t.expectR(_phone(t, '+(1)418.212.4598')?.compactNumber).is("+14182124598") ;
        t.expectS(_phone(t, '+( 3 3 ) 1 45 24 7000')?.standardNumber).is("+33 145247000") ;
        t.expectT(_phone(t, '+( 3 3 ) 1 45 24 7000')?.compactNumber).is("+33145247000") ;
        t.expectU(_phone(t, '(+358)40 123 4567')?.standardNumber).is('+358 401234567') ;
        t.expectX(_phone(t, '(+358)123456')?.standardNumber).KO() ;
        t.expectY(_phone(t, '(+358)012345678901')?.standardNumber).KO() ;
        t.expectZ(_phone(t, '(+358)0401234567')?.alpha2Code).is('FI') ;
    }) ;
    group.unary("TSPhoneNumber.toString(format)", async(t) => {
        const p = $phonenumber('+( 3 3 ) 1 45 24 7000') ;
        const p1 = $phonenumber('+14082124598') ;
        const pb = $phonenumber('(+358)401234567') ;

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
        t.expectT(pb?.toString('+(%d) %t%1 %2 %2 %2%0 %r', 'fr')).is("+(358) 04 01 23 45 67") ;
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

    // the fixture is loaded from disk through $loadJSON()/$absolute(), which
    // assert against a browser environment: skip it under jsdom / headless Chrome.
    if (!$inbrowser()) { group.unary('Phone recognition from JSON test base', async t => {
        const phonedb = _loadPhoneTestBase() ;
        t.expect0(phonedb).toBeNotEmpty() ;
        const acceptableCountries = new Set(TSCountry.alpha2Codes() as string[]) ;

        for (let i = 0; i < phonedb.length; i++) {
            const n = 0 ;
            const entry = phonedb[i] ;
            const p = $phonenumber(entry.phone) ;
            const alpha = entry.country.toUpperCase() ;
            if (!$defined(entry.isLandLine) && !$defined(entry.isMobile)) {
                t.expect(p, _m(i, n)).KO() ;
                continue ;
            }
            if (!acceptableCountries.has(alpha)) {
                t.expect(p, _m(i, n+1)).KO() ;
                continue ;
            }
            if (t.expect(p, _m(i, n+2)).OK()) {
                let cont = t.expect(p!.compactNumber, _m(i, n+3)).is(entry.phone) ;
                cont &&= t.expect(p!.country.alpha2Code, _m(i, n+4)).is(alpha) ;

                if (!!entry.isLandLine && !!entry.isMobile) {
                    cont &&= t.expect(p!.isUndeterminedNumber, _m(i, n+5)).true() ;
                }
                else {
                    if (!!entry.isLandLine) {
                        cont &&= t.expect(p!.isLandLineNumber, _m(i, n+5)).true() ;
                    }
                    if (!!entry.isMobile) {
                        cont &&= t.expect(p!.isMobileNumber, _m(i, n+6)).true() ;
                    }
                }
                if (cont) { continue ; }
            }
            const [pn, c, v,, step] = $phoneFromString(entry.phone) ;
            t.register(`Wrong phone entry ${i}:${entry.phone} of ${entry.country}`, `step:${step}, result:'${pn}'. validity:${v}, country:${$value(c?.alpha2Code, 'none')}, mobile:${p?.isMobileNumber}=>\n${$insp(entry)}`)

        }
    }) ; }
}) ;


interface PhoneTestEntry {
    phone:string ;
    local:string ;
    country:string ;
    isLandLine?:boolean ;
    isMobile?:boolean ;
}
function _m(i:number, n:number):string { return `${i}/${n}` ; }

function _loadPhoneTestBase():PhoneTestEntry[] {
    const fileName = $absolute($path('test', 'phonetestbase.json')) ;
    const db = $loadJSON(fileName) ;
    if (!$ok(db)) {
        $logterm(`&R  &wUnable to load file JSON test file ${fileName}  &0`) ;
        TSError.throw(`Unable to load file JSON test file ${fileName}`) ;
    }
    return db as PhoneTestEntry[] ;
}
