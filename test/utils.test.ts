import { $inbrowser } from "../src/utils";

describe("Utils functions", () => {
    it('verifying $inbrowser()', () => {
        expect($inbrowser()).toBeFalsy() ;
    }) ;
}) ;
