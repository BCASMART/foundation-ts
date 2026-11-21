import { Address } from "../src/types";
import { TSTest } from '../src/tstester';
import { $sqllike, $valuesForKeyPath, TSQualifier } from "../src/tsqualifier";
import { TSDate } from "../src/tsdate";
import { TSRange } from "../src/tsrange";
import { TSRangeSet } from "../src/tsrangeset";
import { TSInterval } from "../src/tsinterval";
import { Nullable, TSDictionary } from "../src/types";
import { $ok } from "../src/commons";

interface People {
    firstName:string ;
    lastName:string ;
    homes?:Home[] ;
    office?:Office ;
    age?:number ;
    selection?:string ;
    description?:string ;
}

interface Home {
    address?:Address,
    phone?:string
}

interface Office {
    address:Address,
    phone?:string
}

const peoples:People[] = [
    {   // 0
        firstName:'Patrick',
        lastName:'Martin',
        homes: [{ address:{
            city:'Paris',
            country:'FR'
        }}],
        office:{ address:{ street:'12 rue Saintplon', zipCode:'75015', city:'Paris', country:'FR'}}
    },
    {   // 1
        firstName:'Ange',
        lastName:'Soleil',
        homes: [{address:{
            city:'Paris',
            country:'FR'
        }}],
        age:37
    },
    {   // 2
        firstName:'Jean',
        lastName:'Durand',
        homes: [{ address:{
            city:'Paris',
            country:'FR'
        }}],
        age:23
    },
    {   // 3
        firstName:'Alice',
        lastName:'de France',
        homes:[{address:{
            city:'Clermont-Ferrand',
            country:'FR'
        }}],
        age:34
    },
    {   // 4
        firstName:'Pierre',
        lastName:'Delahaye',
        homes:[{}],
        age:38,
        description:" Le petit chemin, qui est plein de violettes."
    },
    {   // 5
        firstName:'Georges',
        lastName:'Durand',
        age:47
    },
    {   // 6
        firstName:'Jean',
        lastName:'Valjean',
        age:15,
        selection:'red team',
        description:"Chemin vers la victoire"
    },
    {   // 7
        firstName:'Luna',
        lastName:'Soleil',
        age:9,
        homes:[
            { address:{ city:'Lyon', country:'FR' }},
            { address:{ city:'Paris', country:'FR' }}
        ]
    },
    {   // 8
        firstName:'Henri',
        lastName:'Du Mans',
        description:"Autrefois j'avais un CHENIN."
    }
] ;    

export const qualifierGroups = [
    TSTest.group("Testing $valuesForKeyPath()", async (group) => {
        group.unary('On single possible value', async(t) => {
            t.expect($valuesForKeyPath<People>(peoples[0], 'office.address.zipCode')).is(['75015']) ;
        }) ;
        group.unary('On multiple possible values', async(t) => {
            t.expect($valuesForKeyPath<People>(peoples[7], 'homes.address.city')).is(['Lyon', 'Paris']) ;
        }) ;
    }),
    TSTest.group("Filtering with TSQualifier()", async (group) => {

        group.unary("OR filter()", async(t) => {
            const qualifier = TSQualifier.OR<People>()
                .is('lastName', 'Durand')
                .gte('age', 38)
                .is('homes.address.city', 'Clermont-Ferrand') ;
            
            t.register('qualifier', qualifier) ;

            t.expect0(qualifier.isComposite).true() ;
            t.expect1(qualifier.isKeyValue).false() ;
            t.expect2(qualifier.keyArray()).is([]) ;
            t.expect3(qualifier.key()).toBeUndefined() ;
            t.expect4(qualifier.value()).toBeUndefined() ;
            t.expect5(qualifier.conditions().length).is(3) ;
            

            t.expectA(peoples.filterWithQualifier(qualifier)).is([
                peoples[2],
                peoples[3],
                peoples[4],
                peoples[5]
            ]) ;
        }) ;

        group.unary("AND filter()", async(t) => {
            const qualifier = TSQualifier.AND<People>(
                [TSQualifier.EQ<People>('homes.address.city', 'Paris'), TSQualifier.GT('age', 35)]
            ) ;
            t.register('qualifier', qualifier) ;

            t.expect0(qualifier.isComposite).true() ;
            t.expect1(qualifier.isKeyValue).false() ;
            t.expect2(qualifier.keyArray()).is([]) ;
            t.expect3(qualifier.key()).toBeUndefined() ;
            t.expect4(qualifier.value()).toBeUndefined() ;
            t.expect5(qualifier.conditions().length).is(2) ;


            t.expectA(peoples.filterWithQualifier(qualifier)).is([peoples[1]]) ;
        }) ;

        group.unary("Single existence filter OK()", async(t) => {
            const qualifier = TSQualifier.OK<People>('selection') ;
            t.register('qualifier', qualifier) ;

            t.expect0(qualifier.isComposite).false() ;
            t.expect1(qualifier.isKeyValue).false() ;
            t.expect2(qualifier.keyArray()).is(['selection']) ;
            t.expect3(qualifier.key()).is('selection') ;
            t.expect4(qualifier.value()).toBeUndefined() ;
            t.expect5(qualifier.conditions()).is([]) ;


            t.expectA(TSQualifier.OK<People>('selection').filterValues(peoples)).is([peoples[6]]) ;

        }) ;

        group.unary("Single equalifty filter EQ()", async(t) => {
            const qualifier = TSQualifier.EQ<People>('homes.address.city', 'Lyon') ; 
            t.register('qualifier', qualifier) ;

            t.expect0(qualifier.isComposite).false() ;
            t.expect1(qualifier.isKeyValue).true() ;
            t.expect2(qualifier.keyArray()).is(['homes', 'address', 'city']) ;
            t.expect3(qualifier.key()).is('homes.address.city') ;
            t.expect4(qualifier.value()).is('Lyon') ;
            t.expect5(qualifier.conditions()).is([]) ;


            t.expectA(qualifier.filterValues(peoples)).is([peoples[7]]) ;
        }) ;

        group.unary("Single equalifty filter LIKE()", async(t) => {
            const qualifier = TSQualifier.LIKE<People>('description', '%che_in%') ;

            t.register('qualifier', qualifier) ;

            t.expect0(qualifier.isComposite).false() ;
            t.expect1(qualifier.isKeyValue).true() ;
            t.expect2(qualifier.keyArray()).is(['description']) ;
            t.expect3(qualifier.key()).is('description') ;
            t.expect4(qualifier.value()).is('%che_in%') ;
            t.expect5(qualifier.conditions()).is([]) ;

    
            t.expectA(qualifier.filterValues(peoples)).is([
                peoples[4],
                peoples[6],
                peoples[8]                                    
            ]) ;
        }) ;

        group.unary("AND+OR+INRANGE filter test", async(t) => {
            const qualifier = TSQualifier.AND<People>() ;

            qualifier.inRange("age", [15, 10])
                     .and() // does not change anything, we already are in a AND() qualifier
                     .or().or().or() // 1, 2 or 3 or() give the same result. We already are in a OR() qualifier with the first one
                        .is("office.address.city", "Paris")
                        .is("homes.address.city", "Paris")
                        .ok("selection")
            
            t.register('qualifier', qualifier) ;

            t.expect0(qualifier.isComposite).true() ;
            t.expect1(qualifier.isKeyValue).false() ;
            t.expect2(qualifier.keyArray()).is([]) ;
            t.expect3(qualifier.key()).toBeUndefined() ;
            t.expect4(qualifier.value()).toBeUndefined() ;
            t.expect5(qualifier.conditions().length).is(3) ; // 2 for the inRange(), 1 for the or()
            t.expect6(qualifier.conditions()[2]?.conditions()?.length).is(3) ;


            t.expectA(qualifier.filterValues(peoples)).is([peoples[2], peoples[6]]) ;

        }) ;

    }),

    TSTest.group("TSQualifier — comparison operators", async (group) => {
        const idx = (q:TSQualifier<People>) => q.filterValues(peoples).map(p => peoples.indexOf(p)) ;

        group.unary('EQ / NEQ / KO', async (t) => {
            t.expect0(idx(TSQualifier.EQ<People>('lastName', 'Durand'))).is([2, 5]) ;
            t.expect1(idx(TSQualifier.NEQ<People>('lastName', 'Durand')).length).is(peoples.length - 2) ;
            t.expect2(idx(TSQualifier.KO<People>('age'))).is([0, 8]) ;               // #0 and #8 have no age
            t.expect3(TSQualifier.KO<People>('age').isKeyValue).false() ;
        }) ;

        group.unary('LT / LTE / GT / GTE', async (t) => {
            t.expect0(idx(TSQualifier.LT<People>('age', 15))).is([7]) ;             // age 9
            t.expect1(idx(TSQualifier.LTE<People>('age', 15))).is([6, 7]) ;
            t.expect2(idx(TSQualifier.GT<People>('age', 38))).is([5]) ;             // age 47
            t.expect3(idx(TSQualifier.GTE<People>('age', 38))).is([4, 5]) ;
        }) ;

        group.unary('IN / NIN — normal, single-value collapse, empty throw', async (t) => {
            t.expect0(idx(TSQualifier.IN<People>('age', [23, 47]))).is([2, 5]) ;
            t.expect1(TSQualifier.IN<People>('age', [23]).operator).is('EQ') ;      // 1 value -> EQ
            t.expect2(TSQualifier.NIN<People>('age', [9]).operator).is('NEQ') ;
            t.expect3(idx(TSQualifier.NIN<People>('age', [9, 15, 23])).includes(2)).false() ;
            t.expect4(() => TSQualifier.IN<People>('age', [])).throws(/empty values/) ;
            t.expect5(() => TSQualifier.NIN<People>('age', [])).throws(/empty values/) ;
        }) ;

        group.unary('NOT / inverse()', async (t) => {
            const durand = TSQualifier.EQ<People>('lastName', 'Durand') ;
            t.expect0(idx(TSQualifier.NOT<People>(durand)).includes(2)).false() ;
            t.expect1(TSQualifier.NOT<People>(durand).isComposite).true() ;
            t.expect2(idx(durand.inverse()).length).is(peoples.length - 2) ;
            t.expect3(durand.inverse().operator).is('NOT') ;
        }) ;

        group.unary('INRANGE with a length-1 range and with an empty range', async (t) => {
            // a length 1 range used to give EQ(key, location), which did not match a non-integer value
            t.expect0(TSQualifier.INRANGE<People>('age', [23, 1]).operator).is('AND') ;
            t.expect1(idx(TSQualifier.INRANGE<People>('age', [23, 1]))).is([2]) ;
            t.expect2(TSQualifier.INRANGE<any>('x', [23, 1]).validateValue({ x:23.5 })).true() ;
            // an empty range used to throw: it now matches nothing, like TSRange.containsLocation()
            t.expect3(idx(TSQualifier.INRANGE<People>('age', [23, 0]))).is([]) ;
            t.expect4(() => TSQualifier.INRANGE<People>('age', [0, -1])).throws(/invalid range/) ;
        }) ;
    }),

    TSTest.group("TSQualifier — INCLUDES / INCLUDED / INTERSECTS / builder guards", async (group) => {
        interface Slot { a:number, b:number, start?:number, end?:number }
        const slots:Slot[] = [
            { a:0, b:10, start:0,  end:10 },
            { a:5, b:15, start:5,  end:15 },
            { a:20, b:30, start:20, end:30 },
            { a:0, b:100 },
        ] ;
        const sidx = (q:TSQualifier<Slot>) => q.filterValues(slots).map(s => slots.indexOf(s)) ;

        group.unary('INCLUDES(key1,key2,value)', async (t) => {
            // a <= 7 && b > 7
            t.expect0(sidx(TSQualifier.INCLUDES<Slot>('a', 'b', 7))).is([0, 1, 3]) ;
            t.expect1(() => TSQualifier.INCLUDES<Slot>('a', 'b', null)).throws() ;
        }) ;

        group.unary('INCLUDED(key,v1,v2) and INTERSECTS(k1,k2,v1,v2)', async (t) => {
            t.expect0(TSQualifier.INCLUDED<Slot>('a', 5, 25).operator).is('AND') ;
            t.expect1(sidx(TSQualifier.INTERSECTS<Slot>('start', 'end', 6, 25)).includes(2)).true() ; // [20,30] overlaps [6,25]
            t.expect2(() => TSQualifier.INCLUDED<Slot>('a', null, null)).throws() ;
            t.expect(('abc' as any).sqlLike(null), 'like1').false() ;
            t.expect($sqllike(null, 'a%'), 'like2').false() ;
            t.expect($sqllike(123, '1_3'), 'like3').true() ;           // a non string value is compared with its string form
            t.expect($sqllike('a.c', 'a_c'), 'like4').true() ;
            t.expect($sqllike('abc', 'a.c'), 'like5').false() ;        // a regex special character is a plain character
            // canUnspecify path
            const q = TSQualifier.INTERSECTS<Slot>('start', 'end', 6, 25, true) ;
            t.expect3(q.operator).is('AND') ;
            t.expect4(sidx(q).includes(3)).true() ;    // missing start and end are infinite (EQ(key,null) used to match nothing)
            t.expect5(sidx(q).includes(0)).true() ;
            // the condition which cannot be interpreted is given in the error (it used to be the absent callback)
            t.expect6(() => TSQualifier.AND<Slot>([{ a:1 }]).validateValue(slots[0])).throws((e:any) => e.info?.condition?.a === 1) ;
        }) ;

        group.unary('builder methods throw on non-AND/OR qualifiers', async (t) => {
            const eq = TSQualifier.EQ<People>('lastName', 'x') ;
            t.expect0(() => (eq as any).is('a', 1)).throws(/on EQ qualifier/) ;
            t.expect1(() => (eq as any).and()).throws() ;
            t.expect2(() => (eq as any).condition({})).throws() ;
            t.expect3(() => TSQualifier.NOT<People>(eq).is('a', 1)).throws(/on NOT qualifier/) ;
        }) ;

        group.unary('instance includes() / included() / intersects()', async (t) => {
            t.expect0(TSQualifier.AND<Slot>().includes('a', 'b', 7).conditions().length).is(2) ; // AND flattened
            t.expect1(TSQualifier.AND<Slot>().included('a', 5, 25).conditions().length).gt(0) ;
            t.expect2(TSQualifier.AND<Slot>().intersects('start', 'end', 6, 25).conditions().length).gt(0) ;
            t.expect3(sidx(TSQualifier.AND<Slot>().includes('a', 'b', 7))).is([0, 1, 3]) ;
        }) ;

        group.unary('if() / mayIs()', async (t) => {
            const and = TSQualifier.AND<People>() ;
            t.expect0(and.if(false)).undef() ;
            t.expect1(and.if(true)).is(and) ;
            and.mayIs(false, 'lastName', 'x') ;
            t.expect2(and.conditions().length).is(0) ;
            and.mayIs(true, 'lastName', 'Durand') ;
            t.expect3(and.conditions().length).is(1) ;
        }) ;

        group.unary('instance comparison / set / not / ko builders', async (t) => {
            const q = TSQualifier.AND<People>() ;
            q.isNot('lastName', 'x') ;
            q.gt('age' as any, 10) ;
            q.lt('age' as any, 90) ;
            q.lte('age' as any, 89) ;
            q.in('lastName', ['a', 'b']) ;
            q.nin('lastName', ['c']) ;
            q.ko('firstName') ;
            t.expect0(q.conditions().length).gt(6) ;

            const notq = TSQualifier.AND<People>().not({ lastName:'y' } as any) ;
            t.expect1(notq.conditions().length).gt(0) ;
        }) ;

        group.unary('validateValue() with a per-condition callback (raw dict conditions)', async (t) => {
            const q = TSQualifier.AND<People>([{ minAge:20 } as any]) ;
            const cb = (p:People, cond:any) => (p.age ?? 0) >= cond.minAge ;
            t.expect0(q.validateValue(peoples[5], cb)).true() ;    // age 47
            t.expect1(q.validateValue(peoples[7], cb)).false() ;   // age 9
            t.expect2(() => q.validateValue(peoples[5])).throws(/callback/) ;  // no callback -> throw
            const orq = TSQualifier.OR<People>([{ minAge:40 } as any]) ;
            t.expect3(orq.validateValue(peoples[5], cb)).true() ;
            const notq = TSQualifier.NOT<People>({ minAge:40 } as any) ;
            t.expect4(notq.validateValue(peoples[7], cb)).true() ;
        }) ;

        group.unary('validateValue() gives the callback to nested composite qualifiers', async (t) => {
            const cb = (p:People, cond:any) => (p.age ?? 0) >= cond.minAge ;
            const V = (q:TSQualifier<People>, p:People) => { try { return q.validateValue(p, cb) ; } catch (e) { return (e as Error).message ; } } ;
            const q = TSQualifier.AND<People>([TSQualifier.OR<People>([{ minAge:40 } as any])]) ;
            t.expect0(V(q, peoples[5])).true() ;    // age 47
            t.expect1(V(q, peoples[7])).false() ;   // age 9
            const notq = TSQualifier.NOT<People>(TSQualifier.AND<People>([{ minAge:40 } as any])) ;
            t.expect2(V(notq, peoples[7])).true() ;
        }) ;
    }),

    TSTest.group("TSQualifier — null values, INRANGE / CONTINUOUS / OVERLAPS / CONTAINS / CONTAINEDIN", async (group) => {
        group.unary('EQ(key, null) and NEQ(key, null) are IS NULL and IS NOT NULL', async (t) => {
            const isNull = TSQualifier.EQ<any>('a', null), notNull = TSQualifier.NEQ<any>('a', null) ;
            t.expect0(isNull.validateValue({ a:null })).true() ;      // used to be false
            t.expect1(isNull.validateValue({})).true() ;              // absent
            t.expect2(isNull.validateValue({ a:0 })).false() ;
            t.expect3(isNull.validateValue({ a:[] })).true() ;        // no value
            t.expect4(notNull.validateValue({ a:0 })).true() ;
            t.expect5(notNull.validateValue({ a:null })).false() ;
            t.expect6(notNull.validateValue({})).false() ;
            t.expect7(TSQualifier.EQ<any>('a.b', undefined).validateValue({ a:{ c:1 } })).true() ;
            t.expect8(TSQualifier.EQ<any>('a', 0).validateValue({ a:null })).false() ;
            // the qualifier structure (used to build database requests) does not change
            t.expect9(isNull.operator).is('EQ') ;
            t.expectA(isNull.value()).null() ;
        }) ;

        group.unary('INRANGE() forms', async (t) => {
            const V = (q:TSQualifier<any>, x:any) => q.validateValue({ x:x }) ;
            const D = (n:number) => TSDate.fromEpoch(n)! ;
            t.expect0(V(TSQualifier.INRANGE('x', 2, 5), 2)).true() ;
            t.expect1(V(TSQualifier.INRANGE('x', 2, 5), 5)).false() ;           // half-open
            t.expect2(V(TSQualifier.INRANGE('x', null, 5), -100)).true() ;      // infinite start
            t.expect3(V(TSQualifier.INRANGE('x', 2, null), 1e9)).true() ;       // infinite end
            t.expect4(V(TSQualifier.INRANGE('x', null, null), 'anything')).true() ;
            t.expect5(TSQualifier.INRANGE('x', 2, null).operator).is('GTE') ;
            t.expect6(() => TSQualifier.INRANGE('x', 5, 2)).throws(/anterior/) ;
            const set = new TSRangeSet([[0, 2], [10, 2]]) ;
            t.expect7(TSQualifier.INRANGE('x', set).operator).is('OR') ;
            t.expect8([0, 1, 2, 9, 10, 11, 12].map(x => V(TSQualifier.INRANGE('x', set), x))).is([true, true, false, false, true, true, false]) ;
            t.expect9(() => TSQualifier.INRANGE('x', new TSRangeSet())).throws(/always returns false/) ;
            const interval = new TSInterval(D(100), null) ;
            t.expectA(V(TSQualifier.INRANGE('x', interval), D(100))).true() ;
            t.expectB(V(TSQualifier.INRANGE('x', interval), D(99))).false() ;
            t.expectC(V(TSQualifier.INRANGE('x', new TSInterval(null, null)), D(1))).true() ;
            t.expectD(() => TSQualifier.INRANGE('x', 'nope' as any)).throws(/invalid range/) ;
            const inverted = new TSInterval(D(1), D(2)) ; inverted.first = D(3) ;
            t.expectE(() => TSQualifier.INRANGE('x', inverted)).throws(/invalid interval/) ;
            // instance method
            const q = TSQualifier.AND<any>().inRange('x', 2, 5).inRange('y', [0, 1]) ;
            t.expectF(q.validateValue({ x:3, y:0 })).true() ;
            t.expectG(q.validateValue({ x:3, y:1 })).false() ;
        }) ;

        // every pair of ranges (empty ones included) of 0..12: the qualifiers on { s, e } objects
        // must give the same results as the TSRange methods
        group.unary('same results as TSRange (all pairs of ranges)', async (t) => {
            const ranges:TSRange[] = [] ;
            for (let a = 0 ; a <= 12 ; a++) { for (let l = 0 ; l <= 6 ; l += 2) { ranges.push(new TSRange(a, l)) ; }}
            const counts:TSDictionary<number> = {} ;
            const failure = (name:string) => { counts[name] = (counts[name] ?? 0) + 1 ; } ;
            for (const o of ranges) {
                const obj = { s:o.location, e:o.maxRange } ;
                const strictlyIn = (e:TSRange, r:TSRange) => e.isEmpty && e.location > r.location && e.location < r.maxRange ;
                const strictlyInside = (w:TSRange) => strictlyIn(o, w) ;
                for (const w of ranges) {
                    if (TSQualifier.CONTINUOUS<any>('s', 'e', w).validateValue(obj) !== o.continuousWith(w)) { failure('CONTINUOUS') ; }   // exact
                    // documented exception: an empty object strictly inside the interval
                    if (TSQualifier.OVERLAPS<any>('s', 'e', w).validateValue(obj) !== (o.intersects(w) || strictlyInside(w))) { failure('OVERLAPS') ; }
                    if (TSQualifier.CONTAINS<any>('s', 'e', w).validateValue(obj) !== o.contains(w)) { failure('CONTAINS') ; }
                    // documented exception: an empty object located at the excluded end of the interval
                    const atEnd = o.isEmpty && o.location === w.maxRange && !w.isEmpty ;
                    if (TSQualifier.CONTAINEDIN<any>('s', 'e', w).validateValue(obj) !== (o.containedIn(w) || atEnd)) { failure('CONTAINEDIN') ; }
                    for (let x = -1 ; x <= 20 ; x++) {
                        if (TSQualifier.INRANGE<any>('x', w).validateValue({ x:x }) !== w.containsLocation(x)) { failure('INRANGE') ; }
                    }
                }
            }
            t.expect0(counts).is({}) ;
        }) ;

        // with canUnspecify, a null start or end value is infinite: same results as TSInterval
        group.unary('canUnspecify gives the same results as TSInterval with infinite bounds', async (t) => {
            const D = (n:number) => TSDate.fromEpoch(n)! ;
            const bounds:[Nullable<number>, Nullable<number>][] = [] ;
            const values = [null, 0, 3, 6, 9] ;
            for (const a of values) { for (const b of values) { if (!$ok(a) || !$ok(b) || a! <= b!) { bounds.push([a, b]) ; }}}
            const I = ([a, b]:[Nullable<number>, Nullable<number>]) => new TSInterval($ok(a) ? D(a!) : null, $ok(b) ? D(b!) : null) ;
            const counts:TSDictionary<number> = {} ;
            const failure = (name:string) => { counts[name] = (counts[name] ?? 0) + 1 ; } ;
            for (const ob of bounds) {
                const oi = I(ob) ;
                const obj = { s:oi.first ?? null, e:oi.second ?? null } ;
                for (const wb of bounds) {
                    const wi = I(wb) ;
                    const inside = oi.isEmpty && wi.containsDate(oi.start) && !(oi.start.isEqual(wi.start) && $ok(wi.first)) ;
                    if (TSQualifier.CONTINUOUS<any>('s', 'e', wi, true).validateValue(obj) !== oi.continuousWith(wi)) { failure('CONTINUOUS') ; }   // exact
                    if (TSQualifier.OVERLAPS<any>('s', 'e', wi, true).validateValue(obj) !== (oi.intersects(wi) || inside)) { failure('OVERLAPS') ; }
                    if (TSQualifier.CONTAINS<any>('s', 'e', wi, true).validateValue(obj) !== oi.contains(wi)) { failure('CONTAINS') ; }
                }
            }
            t.expect0(counts).is({}) ;
            t.expect1(() => TSQualifier.CONTAINS<any>('s', 'e', new TSInterval(null, D(3)))).throws(/needs the canUnspecify option/) ;
            t.expect2(TSQualifier.CONTINUOUS<any>('s', 'e', 3, 6, true).validateValue({ s:null, e:null })).true() ;
            t.expect3(TSQualifier.CONTINUOUS<any>('s', 'e', 3, 6).validateValue({ s:null, e:null })).false() ;  // without canUnspecify
        }) ;

        group.unary('structure of the generated qualifiers (as translated to database requests)', async (t) => {
            const c = TSQualifier.CONTINUOUS<any>('s', 'e', 3, 6) ;
            t.expect0(c.operator).is('AND') ;
            t.expect1(c.conditions().map((q:any) => [q.operator, q.key(), q.value()])).is([['GTE', 'e', 3], ['LTE', 's', 6]]) ;
            const o = TSQualifier.OVERLAPS<any>('s', 'e', 3, 6) ;
            t.expect2(o.conditions().map((q:any) => [q.operator, q.key(), q.value()])).is([['GT', 'e', 3], ['LT', 's', 6]]) ;
            const u = TSQualifier.OVERLAPS<any>('s', 'e', 3, 6, true) ;
            t.expect3(u.conditions().map((q:any) => q.operator)).is(['OR', 'OR']) ;
            t.expect4((u.conditions()[0] as any).conditions().map((q:any) => [q.operator, q.key(), q.value()])).is([['GT', 'e', 3], ['EQ', 'e', null]]) ;
            t.expect5(TSQualifier.CONTAINEDIN<any>('s', 'e', null, 6).operator).is('LTE') ;
            t.expect6(TSQualifier.AND<any>().continuous('s', 'e', 3, 6).overlaps('s', 'e', [0, 10]).contains('s', 'e', 4, 5).containedIn('s', 'e', 0, 10).conditions().length).is(8) ;
        }) ;
    }),
 ] ;