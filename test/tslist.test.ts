import { $equal } from "../src/compare";
import { TSList } from "../src/tslist";
import { TSTest } from "../src/tstester";
import { Ascending, Descending, Same } from "../src/types";

export const listGroups = TSTest.group("TSList doubly-linked list", async (group) => {

    group.unary("construction from an iterable, add() and traversal", async(t) => {
        const l = new TSList<number>([1, 2, 3]) ;
        t.expect0(l.length).is(3) ;
        t.expect1(l.count).is(3) ;
        t.expect2(l.first!.data).is(1) ;
        t.expect3(l.last!.data).is(3) ;
        t.expect4([...l]).is([1, 2, 3]) ;
        t.expect5(l.toArray()).is([1, 2, 3]) ;
        const seen:number[] = [] ;
        l.forEach(v => seen.push(v)) ;
        t.expect6(seen).is([1, 2, 3]) ;
        // prev/next wiring
        t.expect7(l.first!.next!.data).is(2) ;
        t.expect8(l.last!.prev!.data).is(2) ;
        t.expect9(l.first!.prev).null() ;
        t.expectA(l.last!.next).null() ;
    }) ;

    group.unary("empty list", async(t) => {
        const l = new TSList<number>() ;
        t.expect0(l.length).is(0) ;
        t.expect1(l.first).null() ;
        t.expect2(l.last).null() ;
        t.expect3([...l]).is([]) ;
        t.expect4(l.toArray()).is([]) ;
        let called = false ;
        l.forEach(() => { called = true ; }) ;
        t.expect5(called).false() ;
        t.expect6(l.search(() => true)).null() ;
    }) ;

    group.unary("insert() at head, before a node, and into an empty list", async(t) => {
        const l = new TSList<number>() ;
        l.insert(10) ;                       // into empty
        t.expect0([...l]).is([10]) ;
        l.insert(5) ;                        // no 'before' => at head
        t.expect1([...l]).is([5, 10]) ;
        const tenNode = l.search(v => v === 10)! ;
        l.insert(7, tenNode) ;               // before the node holding 10
        t.expect2([...l]).is([5, 7, 10]) ;
        t.expect3(l.length).is(3) ;
        l.insert(1, l.first!) ;              // before the current head
        t.expect4([...l]).is([1, 5, 7, 10]) ;
        // wiring is consistent both ways
        t.expect5(l.toArray()).is([1, 5, 7, 10]) ;
    }) ;

    group.unary("insert() error paths", async(t) => {
        const empty = new TSList<number>() ;
        t.expect0(() => empty.insert(1, { data:1, next:null, prev:null } as any)).toThrow() ;
        const l = new TSList<number>([1, 2]) ;
        const foreign = new TSList<number>([9]).first! ;
        t.expect1(() => l.insert(3, foreign)).toThrow() ;       // 'before' not in this list
        t.expect2([...l]).is([1, 2]) ;                          // unchanged
    }) ;

    group.unary("removeNode() from head, tail and middle", async(t) => {
        const l = new TSList<number>([1, 2, 3, 4]) ;
        l.removeNode(l.first!) ;
        t.expect0([...l]).is([2, 3, 4]) ;
        t.expect1(l.first!.data).is(2) ;
        t.expect2(l.first!.prev).null() ;
        l.removeNode(l.last!) ;
        t.expect3([...l]).is([2, 3]) ;
        t.expect4(l.last!.data).is(3) ;
        t.expect5(l.last!.next).null() ;
        const mid = l.search(v => v === 2)! ;
        l.removeNode(l.last!) ;               // -> [2]
        l.removeNode(mid) ;                   // -> []
        t.expect6(l.length).is(0) ;
        t.expect7(l.first).null() ;
        t.expect8(l.last).null() ;

        const single = new TSList<number>([42]) ;
        single.removeNode(single.first!) ;
        t.expect9(single.length).is(0) ;
        t.expectA(single.first).null() ;
        t.expectB(single.last).null() ;
    }) ;

    group.unary("clear()", async(t) => {
        const l = new TSList<number>([1, 2, 3]) ;
        l.clear() ;
        t.expect0(l.length).is(0) ;
        t.expect1(l.first).null() ;
        t.expect2(l.last).null() ;
        t.expect3([...l]).is([]) ;
        l.add(7) ;                           // usable again after clear
        t.expect4([...l]).is([7]) ;
        // clear() on an empty / single-element list must not throw
        t.expect5(() => new TSList<number>().clear()).notToThrow() ;
        t.expect6(() => new TSList<number>([1]).clear()).notToThrow() ;
    }) ;

    group.unary("clone() is an independent copy", async(t) => {
        const l = new TSList<number>([1, 2, 3]) ;
        const c = l.clone() ;
        t.expect0(c).is(l) ;
        t.expect1(c === l).false() ;
        c.add(4) ;
        t.expect2([...l]).is([1, 2, 3]) ;
        t.expect3([...c]).is([1, 2, 3, 4]) ;
        l.removeNode(l.first!) ;
        t.expect4([...c]).is([1, 2, 3, 4]) ;
    }) ;

    group.unary("search() / searchNode()", async(t) => {
        const l = new TSList<number>([10, 20, 30]) ;
        t.expect0(l.search(v => v === 20)!.data).is(20) ;
        t.expect1(l.search(v => v === 99)).null() ;
        t.expect2(l.searchNode(n => n.data === 30)!.data).is(30) ;
        t.expect3(l.searchNode(n => n === l.last)).is(l.last) ;
    }) ;

    group.unary("isEqual() and $equal()", async(t) => {
        const l = new TSList<number>([1, 2, 3]) ;
        t.expect0(l.isEqual(l)).true() ;
        t.expect1(l.isEqual(new TSList<number>([1, 2, 3]))).true() ;
        t.expect2(l.isEqual(new TSList<number>([1, 2]))).false() ;       // length differs
        t.expect3(l.isEqual(new TSList<number>([1, 2, 4]))).false() ;    // content differs
        t.expect4(l.isEqual([1, 2, 3])).false() ;                       // a plain array is not a TSList
        t.expect5($equal(l, new TSList<number>([1, 2, 3]))).true() ;
        t.expect6($equal(l, new TSList<number>([3, 2, 1]))).false() ;
    }) ;

    group.unary("compare()", async(t) => {
        const l = new TSList<number>([1, 2, 3]) ;
        t.expect0(l.compare(l)).is(Same) ;
        t.expect1(l.compare(new TSList<number>([1, 2, 3]))).is(Same) ;
        t.expect2(l.compare(new TSList<number>([1, 2, 4]))).is(Ascending) ;
        t.expect3(l.compare(new TSList<number>([1, 2, 2]))).is(Descending) ;
        t.expect4(l.compare(new TSList<number>([1, 2]))).is(Descending) ;      // this is longer -> after the prefix
        t.expect5(l.compare(new TSList<number>([1, 2, 3, 4]))).is(Ascending) ; // this is a shorter prefix -> before
        t.expect6(l.compare("nope" as any)).undef() ;
        t.expect7(l.compare(null)).undef() ;
    }) ;

    group.unary("toArray() with a mapping/filter callback, toJSON(), getItems()", async(t) => {
        const l = new TSList<number>([1, 2, 3, 4]) ;
        t.expect0(l.toArray(v => v % 2 === 0 ? v * 10 : null)).is([20, 40]) ;   // null results are filtered out
        t.expect1(l.toJSON()).is([1, 2, 3, 4]) ;
        t.expect2(l.getItems()).is([1, 2, 3, 4]) ;
        t.expect3(l.fusionEnumeration()).is([1, 2, 3, 4]) ;
    }) ;

    group.unary("toString()", async(t) => {
        const l = new TSList<number>([1, 2, 3]) ;
        t.expect0(l.toString({ prefix:'(', separator:',', suffix:')' })).is('(1,2,3)') ;
        t.expect1(l.toString({ prefix:'[', separator:'', suffix:']' })).is('[123]') ;   // empty separator -> no join
        t.expect2(l.toString({ printer:d => `#${d}`, separator:'-', suffix:'|' })).is('#1-#2-#3|') ;
        t.expect3(new TSList<number>().toString({ prefix:'(', suffix:')' })).is('()') ;
        t.expect4(new TSList<number>([7]).toString({ prefix:'(', separator:',', suffix:')' })).is('(7)') ;
        t.expect5(l.toString({ separator:', ' })).is('1, 2, 3') ;   // no prefix/suffix
        // default options
        t.expect6(l.toString()).is('(1,2,3)') ;
    }) ;
}) ;
