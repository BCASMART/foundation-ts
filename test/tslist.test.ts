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

    // these methods used to be recursive and overflowed the stack from about 8000 nodes
    group.unary("long lists (100 000 nodes)", async(t) => {
        const n = 100000 ;
        const l = new TSList(Array.from({ length:n }, (_, i) => i)) ;
        t.expect0(l.toArray().length).is(n) ;
        let sum = 0 ; l.forEach(x => { sum += x ; }) ;
        t.expect1(sum).is(n * (n - 1) / 2) ;
        t.expect2(l.search(x => x === n - 1)?.data).is(n - 1) ;
        t.expect3(l.searchNode(node => node.data === -1)).null() ;
        t.expect4(l.toString().length).is(l.toArray().join(',').length + 2) ;
        t.expect5(JSON.stringify(l).length).is(JSON.stringify(l.toArray()).length) ;
        t.expect6(l.getItems().length).is(n) ;
        t.expect7(l.toArray(x => x % 2 ? x : null).length).is(n / 2) ;
        t.expect8(l.clone().isEqual(l)).true() ;
    }) ;

    group.unary("the iterator behaves like the generator it replaces", async(t) => {
        // the former implementation, as a reference
        function *reference<T>(l:TSList<T>) { for (let n = l.first ; n ; n = n!.next) { yield n!.data ; } }
        type Iter = (l:TSList<number>) => Iterator<number> ;
        const ours:Iter = l => l[Symbol.iterator]() ;
        const ref:Iter = l => reference(l) ;
        const iterable = (f:Iter, l:TSList<number>) => ({ [Symbol.iterator]:() => f(l) }) ;
        const scenarios = (f:Iter) => {
            const r:any = {} ;
            const l = new TSList([1, 2, 3, 4]) ;
            r.forOf = [] ; for (const x of iterable(f, l)) { r.forOf.push(x) ; }
            r.spread = [...iterable(f, l)] ;
            const [a, b] = iterable(f, l) ; r.destructuring = [a, b] ;
            r.set = [...new Set(iterable(f, l))] ;
            r.empty = [...iterable(f, new TSList<number>())] ;
            let o:number[] = [], l2 = new TSList([1, 2, 3, 4]) ;
            for (const x of iterable(f, l2)) { o.push(x) ; if (x === 2) { l2.removeNode(l2.search(v => v === 2)!) ; } } r.removeCurrent = o ;
            o = [] ; l2 = new TSList([1, 2, 3, 4]) ;
            for (const x of iterable(f, l2)) { o.push(x) ; if (x === 3) { l2.removeNode(l2.search(v => v === 4)!) ; } } r.removeNext = o ;
            o = [] ; l2 = new TSList([1, 2, 3, 4]) ;
            for (const x of iterable(f, l2)) { o.push(x) ; if (x === 2) { l2.insert(9, l2.search(v => v === 3)!) ; } } r.insertAfterCurrent = o ;
            o = [] ; l2 = new TSList([1, 2, 3]) ;
            for (const x of iterable(f, l2)) { o.push(x) ; if (x === 1) { l2.add(7) ; } } r.addAtEnd = o ;
            const i1 = f(l) ; for (const x of { [Symbol.iterator]:() => i1 }) { if (x === 2) { break ; } } r.nextAfterBreak = i1.next() ;
            const i2 = f(l) ; i2.next() ; r.returnValue = i2.return!(5 as any) ; r.nextAfterReturn = i2.next() ;
            const i3 = f(l) ; i3.next() ; try { i3.throw!(new Error('x')) ; } catch (e:any) { r.throwRethrows = e.message ; } r.nextAfterThrow = i3.next() ;
            const i4 = f(l) ; try { i4.throw!(new Error('y')) ; } catch (e:any) { r.throwBeforeStart = e.message ; } r.nextAfterThrowBeforeStart = i4.next() ;
            const h:any = f(l) ;
            r.helpers = typeof h.map === 'function' ? h.map((x:number) => x * 10).filter((x:number) => x > 10).toArray() : 'none' ;
            const h2:any = f(l) ; r.take = typeof h2.take === 'function' ? h2.take(2).toArray() : 'none' ;
            r.dispose = typeof (f(l) as any)[Symbol.dispose] ;
            r.isIterator = typeof Iterator === 'function' ? f(l) instanceof Iterator : 'no Iterator class' ;
            return r ;
        } ;
        const got = scenarios(ours), expected = scenarios(ref) ;
        t.expect0(Object.keys(got).filter(k => JSON.stringify(got[k]) !== JSON.stringify(expected[k]))).is([]) ;
        t.expect1(got.removeCurrent).is([1, 2]) ;
        t.expect2(got.insertAfterCurrent).is([1, 2, 9, 3, 4]) ;
        t.expect3(got.returnValue).is({ value:5, done:true }) ;
        const l = new TSList([3, 1, 2]) ;
        t.expect4(Array.from(l)).is([3, 1, 2]) ;
        t.expect5([...l.clone()]).is([3, 1, 2]) ;
        const it = l[Symbol.iterator]() ;
        t.expect6(it[Symbol.iterator]()).is(it) ;
    }) ;
}) ;
