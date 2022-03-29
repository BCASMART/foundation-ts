import { $json, $ok } from '../src/commons';
import { TSRange } from '../src/tsrange' 
import { TSRangeSet } from '../src/tsrangeset';

export function printRS(name:string, a:TSRangeSet|null|undefined) {
    console.log("-------------------------------------------------") ;
    if ($ok(a)) {
        console.log(`${name}:[${a!.count}]:\n${$json(a!.toJSON())}`) ;
    }
    else {
        console.log(`${name} rangeset is null or undefined`) ;
    }
    console.log("-------------------------------------------------") ;

}
describe("Testing TSRangeSet operations", () => {
    const RS = new TSRangeSet([[1,3], [2,6], [10,15]]) ;
    const RS1 = new TSRangeSet([[1,7], [10, 15]]) ;
    const RS2 = new TSRangeSet(new TSRange(1,5)) ;
    RS2.unionWidth(TSRange.fromArray([5,3])!) ;
    RS2.unionWidth([11,14]) ;
    RS2.unionWidth([10,4]) ;
    //printRS('RS2', RS2) ;
    it(`testing TSRangeSet creation & TSRangeSet.unionWidth()`, () => {
        expect(RS.isEqual(RS1)).toBeTruthy() ;
        expect(RS.isEqual(RS2)).toBeTruthy() ;
        expect(RS1.isEqual(RS2)).toBeTruthy() ;
    }) ;

    it('TSRangeSet.className', () => { expect(RS.className).toBe("TSRangeSet") ; }) ;

    it(`testing TSRangeSet.intersects() & TSRangeSet.complement()`, () => {
        expect(RS.intersects(new TSRangeSet([12,10]))).toBeTruthy() ;
        expect(RS.intersects([8,2])).toBeFalsy() ;
        expect(RS2.intersects([8,2])).toBeFalsy() ;
        expect(RS.intersects(RS.complement())).toBeFalsy() ;
        expect(RS2.intersects([25,50])).toBeFalsy() ;
        expect(RS.intersects([-1,6])).toBeTruthy() ;
    }) ;

    it('testing TSRangeSet.contains()', () => {
        expect(RS.contains([2,2])).toBeTruthy() ;
        expect(RS.contains([2,8])).toBeFalsy() ;
        expect(RS.contains(new TSRangeSet([[2,2], [11,2]]))).toBeTruthy() ;
    }) ;

    it(`testing TSRangeSet.intersection()`, () => {
        expect(RS.intersection([12, 10]).isEqual(new TSRangeSet([12, 10]))).toBeTruthy()
        expect(RS.intersection([8, 4]).isEqual(new TSRangeSet([10, 2]))).toBeTruthy()
        expect(RS.intersection([0, 100]).isEqual(RS1)).toBeTruthy()
    }) ;

    it('testing TSRangeSet.substraction()', () => {
        expect(RS.substraction([8,50]).isEqual(new TSRangeSet([1,7]))).toBeTruthy() ;
        expect(RS.substraction([7,4]).isEqual(new TSRangeSet([[1,6],[11,14]]))).toBeTruthy() ;
    }) ;

}) ;

