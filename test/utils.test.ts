import { $inbrowser } from "../src/utils";
/*
import { $logterm } from "../src/utils";
$logterm('&o  Orange        &0') ;
$logterm('&O  Orange        &0') ;
$logterm('&p  Pink          &0') ;
$logterm('&P  Pink          &0') ;
$logterm('&a  Apricot       &0') ;
$logterm('&A  Apricot       &0') ;
$logterm('&v  Violet        &0') ;
$logterm('&V  Violet        &0') ;
$logterm('&d  Dark Gray     &0') ;
$logterm('&D  Dark Gray     &0') ;
$logterm('&x  Gray          &0') ;
$logterm('&X  Gray          &0') ;
$logterm('&l  Light Gray    &0') ;
$logterm('&L  Light Gray    &0') ;
$logterm('&e  Egg White     &0') ;
$logterm('&E  Egg White     &0') ;
$logterm('&j  Jungle Green  &0') ;
$logterm('&J  Jungle Green  &0') ;
*/
describe("Utils functions", () => {
    it('verifying $inbrowser()', () => {
        expect($inbrowser()).toBeFalsy() ;
    }) ;
}) ;
