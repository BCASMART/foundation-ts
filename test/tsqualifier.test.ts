import { Address } from "../src/types";
import { TSTest } from '../src/tstester';
import { $valuesForKeyPath, TSQualifier } from "../src/tsqualifier";

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

        group.unary('INRANGE collapses to EQ for a length-1 range, throws on empty', async (t) => {
            t.expect0(TSQualifier.INRANGE<People>('age', [23, 1]).operator).is('EQ') ;
            t.expect1(idx(TSQualifier.INRANGE<People>('age', [23, 1]))).is([2]) ;
            t.expect2(() => TSQualifier.INRANGE<People>('age', [0, 0])).throws() ;
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
            // canUnspecify path
            const q = TSQualifier.INTERSECTS<Slot>('start', 'end', 6, 25, true) ;
            t.expect3(q.operator).is('AND') ;
            t.expect4(sidx(q).includes(3)).false() ;   // EQ(key,null) does not match a *missing* key
            t.expect5(sidx(q).includes(0)).true() ;
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
    }),
 ] ;