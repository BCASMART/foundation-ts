import { $fpad, $meters, $octets, $unit } from "../src/number";
import { TSTest } from "../src/tstester";
import { UINT32_MAX, UINT_MAX } from "../src/types";

export const numberGroups = TSTest.group("Commons number functions", async (group) => {
    group.unary("verifying $fpad() functions", async(t) => {
        const n = 12 ;
        t.expect0($fpad(1,5)).toBe('00001') ;
        t.expect1($fpad(0,5)).toBe('00000') ;
        t.expect2($fpad(9999,5)).toBe('09999') ;
        t.expect3($fpad(99999,5)).toBe('99999') ;
        t.expect4($fpad(99999999,5)).toBe('99999999') ;
        t.expect5($fpad(-1,5)).toBe('XXXXX') ;
        t.expect6($fpad(-99999,5)).toBe('XXXXX') ;
        t.expect7($fpad(1.3,5)).toBe('XXXXX') ;
        t.expect8($fpad(-1.3,5)).toBe('XXXXX') ;
        t.expect9($fpad(NaN,5)).toBe('XXXXX') ;
        t.expectA($fpad(Infinity,5)).toBe('XXXXX') ;
        t.expectB($fpad(-Infinity,5)).toBe('XXXXX') ;
        t.expectC($fpad(UINT32_MAX,5)).toBe(UINT32_MAX.toString()) ;
        t.expectD($fpad(UINT_MAX,5)).toBe(UINT_MAX.toString()) ;
        t.expectE($fpad(Number.MAX_SAFE_INTEGER,5)).toBe('XXXXX') ;
        t.expectF($fpad(Number.MAX_SAFE_INTEGER,6, "*")).toBe("******") ;
        t.expectG(Number.MAX_SAFE_INTEGER.fpad(6, "*")).toBe("******") ;
        t.expectH(n.fpad2()).toBe("12") ;
        t.expectI(n.fpad3()).toBe("012") ;
        t.expectJ(n.fpad4()).toBe("0012") ;
        t.expectK(n.fpad(6)).toBe("000012") ;
        t.expectL(Number.MAX_SAFE_INTEGER.fpad2('-')).toBe("--") ;
        t.expectM(UINT32_MAX.fpad2('-')).toBe(UINT32_MAX.toString()) ;
    }) ;

    group.unary("Testing $octets(v)", async(t) => {
        const s = 1324756810 ;
        t.expect0($octets(1324)).toBe("1.32 ko") ;
        t.expect1($octets(132475)).toBe("132.47 ko") ;
        t.expect2($octets(132475.1)).toBe("132.48 ko") ;
        t.expect3($octets(1324756)).toBe("1.32 Mo") ;
        t.expect4($octets(13247568)).toBe("13.25 Mo") ;
        t.expect5($octets(132475681)).toBe("132.48 Mo") ;
        t.expect6($octets(1324756810, 3)).toBe("1.325 Go") ;
        t.expect7(s.octets(3)).toBe("1.325 Go") ;
        t.expect8($octets(12)).toBe("12 octets") ;
        t.expect9($octets(0)).toBe("0 octets") ;
    }) ;

    group.unary("Testing $meters(v)", async(t) => {
        const v = 0.13 ;
        t.expect0($meters(0.13)).toBe("130.00 mm") ;
        t.expect1($meters(0.13, 0)).toBe("130 mm") ;
        t.expect2(v.meters(0)).toBe("130 mm") ;
        t.expect3($meters(0.132)).toBe("132.00 mm") ;
        t.expect4($meters(0.1324)).toBe("132.40 mm") ;
        t.expect5($meters(0.13247)).toBe("132.47 mm") ;
        t.expect6($meters(0.132479)).toBe("132.48 mm") ;
        t.expect7($meters(0.132479, 0)).toBe("132 mm") ;
        t.expect8($meters(0)).toBe("0.00 m") ;
        t.expect9($meters(0, 1)).toBe("0.0 m") ;
    }) ;

    group.unary("Testing $unit(v)", async(t) => {
        const volume = 0.0023 ;
        t.expect0($unit(volume, { unit:'l' })).toBe("2.30 ml") ;
        t.expect1(volume.unit({ unit:'l' })).toBe("2.30 ml") ;
        t.expect2($unit(323.256, { unit:'l', unitName:'liters' })).toBe("323.26 liters") ;
        t.expect3($unit(3231.256, { unit:'l' })).toBe("3.23 kl") ;
        t.expect4($unit(3231.256, { unit:'l', maximalUnit:0 })).toBe("3231.26 l") ;
        t.expect5(volume.unit({ unit:'l', minimalUnit:0, decimals:3 })).toBe("0.002 l") ;
        t.expect6(volume.unit({ unit:'l', minimalUnit:0 })).toBe("0.00 l") ;
        t.expect7($unit(volume/10, { unit:'l' })).toBe("230.00 µl") ;
        t.expect8($unit(volume/10, { unit:'l', minimalUnit:-1 })).toBe("0.23 ml") ;
        t.expect9($unit(volume/100, { unit:'l', minimalUnit:-1 })).toBe("0.02 ml") ;
        t.expectA($unit(323.256, { unitName:'liters' })).toBe("323.26 liters") ;
        t.expectB($unit(volume/100, { unitName:'liters', minimalUnit:-1 })).toBe("0.02 ml") ;
        t.expectC($unit(volume,{ unit:'l', minimalUnit:0, ignoreZeroDecimals:true })).toBe("0.00 l") ;
        t.expectD($unit(volume,{ unit:'l', minimalUnit:0, ignoreMinimalUnitDecimals:true })).toBe("0 l") ;
        t.expectE($unit(0,{ unit:'l', minimalUnit:0, ignoreZeroDecimals:true })).toBe("0 l") ;
        t.expectF($unit(0,{ unit:'l', minimalUnit:0, ignoreMinimalUnitDecimals:true })).toBe("0 l") ;
    }) ;

}) ;
