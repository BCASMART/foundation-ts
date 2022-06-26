import { $json, $ok } from '../src/commons';
import { TSRange } from '../src/tsrange' 
import { TSRangeSet } from '../src/tsrangeset';
import { TSTest } from '../src/tstester';

export const rangeSetGroups = TSTest.group("Testing TSRangeSet operations", async (group) => {
    const RS = new TSRangeSet([[1,3], [2,6], [10,15]]) ;
    const RS1 = new TSRangeSet([[1,7], [10, 15]]) ;
    const RS2 = new TSRangeSet(new TSRange(1,5)) ;
    RS2.unionWidth(TSRange.fromArray([5,3])!) ;
    RS2.unionWidth([11,14]) ;
    RS2.unionWidth([10,4]) ;

    //printRS('RS2', RS2) ;

    group.unary(`testing TSRangeSet creation & TSRangeSet.unionWidth()`, async (t) => {
        t.expect(RS).toBe(RS1) ;
        t.expect(RS).toBe(RS2) ;
        t.expect(RS1).toBe(RS2) ;
    }) ;


    group.unary(`testing TSRangeSet.intersects() & TSRangeSet.complement()`, async (t) => {
        t.expect(RS.intersects(new TSRangeSet([12,10]))).toBeTruthy() ;
        t.expect(RS.intersects([8,2])).toBeFalsy() ;
        t.expect(RS2.intersects([8,2])).toBeFalsy() ;
        t.expect(RS.intersects(RS.complement())).toBeFalsy() ;
        t.expect(RS2.intersects([25,50])).toBeFalsy() ;
        t.expect(RS.intersects([-1,6])).toBeTruthy() ;
    }) ;

    group.unary('testing TSRangeSet.contains()', async (t) => {
        t.expect(RS.contains([2,2])).toBeTruthy() ;
        t.expect(RS.contains([2,8])).toBeFalsy() ;
        t.expect(RS.contains(new TSRangeSet([[2,2], [11,2]]))).toBeTruthy() ;
    }) ;

    group.unary(`testing TSRangeSet.intersection()`, async (t) => {
        t.expect(RS.intersection([12, 10])).toBe(new TSRangeSet([12, 10]))
        t.expect(RS.intersection([8, 4])).toBe(new TSRangeSet([10, 2]))
        t.expect(RS.intersection([0, 100])).toBe(RS1)
    }) ;

    group.unary('testing TSRangeSet.substraction()', async (t) => {
        t.expect(RS.substraction([8,50])).toBe(new TSRangeSet([1,7])) ;
        t.expect(RS.substraction([7,4])).toBe(new TSRangeSet([[1,6],[11,14]])) ;
    }) ;
}) ;

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