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
        age:11,
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
            t.expect($valuesForKeyPath<People>(peoples[0], 'office.address.zipCode')).toBe(['75015']) ;
        }) ;
        group.unary('On multiple possible values', async(t) => {
            t.expect($valuesForKeyPath<People>(peoples[7], 'homes.address.city')).toBe(['Lyon', 'Paris']) ;
        }) ;
    }),
    TSTest.group("Filtering with TSQualifier()", async (group) => {

        group.unary("OR filter()", async(t) => {
            const qualifier = TSQualifier.OR<People>()
                .is('lastName', 'Durand')
                .gte('age', 38)
                .is('homes.address.city', 'Clermont-Ferrand') ;
            
            t.register('qualifier', qualifier) ;

            t.expect0(qualifier.isComposite).toBeTruthy() ;
            t.expect1(qualifier.isKeyValue).toBeFalsy() ;
            t.expect2(qualifier.keyArray()).toBe([]) ;
            t.expect3(qualifier.key()).toBeUndefined() ;
            t.expect4(qualifier.value()).toBeUndefined() ;
            t.expect5(qualifier.conditions().length).toBe(3) ;
            

            t.expectA(peoples.filterWithQualifier(qualifier)).toBe([
                {
                    firstName:'Jean',
                    lastName:'Durand',
                    homes:[{address:{
                        city:'Paris',
                        country:'FR'
                    }}],
                    age:23
                },
                {
                    firstName:'Alice',
                    lastName:'de France',
                    homes:[{address:{
                        city:'Clermont-Ferrand',
                        country:'FR'
                    }}],
                    age:34
                },
                    {
                    firstName:'Pierre',
                    lastName:'Delahaye',
                    homes:[{}],
                    age:38
                },
                {
                    firstName:'Georges',
                    lastName:'Durand',
                    age:47
                }        
            ]) ;
        }) ;

        group.unary("AND filter()", async(t) => {
            const qualifier = TSQualifier.AND<People>(
                [TSQualifier.EQ<People>('homes.address.city', 'Paris'), TSQualifier.GT('age', 35)]
            ) ;
            t.register('qualifier', qualifier) ;

            t.expect0(qualifier.isComposite).toBeTruthy() ;
            t.expect1(qualifier.isKeyValue).toBeFalsy() ;
            t.expect2(qualifier.keyArray()).toBe([]) ;
            t.expect3(qualifier.key()).toBeUndefined() ;
            t.expect4(qualifier.value()).toBeUndefined() ;
            t.expect5(qualifier.conditions().length).toBe(2) ;


            t.expectA(peoples.filterWithQualifier(qualifier)).toBe([
                {
                    firstName:'Ange',
                    lastName:'Soleil',
                    homes: [{address:{
                        city:'Paris',
                        country:'FR'
                    }}],
                    age:37
                },
            ]) ;
        }) ;

        group.unary("Single existence filter OK()", async(t) => {
            const qualifier = TSQualifier.OK<People>('selection') ;
            t.register('qualifier', qualifier) ;

            t.expect0(qualifier.isComposite).toBeFalsy() ;
            t.expect1(qualifier.isKeyValue).toBeFalsy() ;
            t.expect2(qualifier.keyArray()).toBe(['selection']) ;
            t.expect3(qualifier.key()).toBe('selection') ;
            t.expect4(qualifier.value()).toBeUndefined() ;
            t.expect5(qualifier.conditions()).toBe([]) ;


            t.expectA(TSQualifier.OK<People>('selection').filterValues(peoples)).toBe([
                {
                    firstName:'Jean',
                    lastName:'Valjean',
                    age:11,
                    selection:'red team'
                }
            ]) ;

        }) ;

        group.unary("Single equalifty filter EQ()", async(t) => {
            const qualifier = TSQualifier.EQ<People>('homes.address.city', 'Lyon') ; 
            t.register('qualifier', qualifier) ;

            t.expect0(qualifier.isComposite).toBeFalsy() ;
            t.expect1(qualifier.isKeyValue).toBeTruthy() ;
            t.expect2(qualifier.keyArray()).toBe(['homes', 'address', 'city']) ;
            t.expect3(qualifier.key()).toBe('homes.address.city') ;
            t.expect4(qualifier.value()).toBe('Lyon') ;
            t.expect5(qualifier.conditions()).toBe([]) ;


            t.expectA(qualifier.filterValues(peoples)).toBe([
                {
                    firstName:'Luna',
                    lastName:'Soleil',
                    age:9,
                    homes:[
                        { address:{ city:'Lyon', country:'FR' }},
                        { address:{ city:'Paris', country:'FR' }}
                    ]
                }
        
            ])
        }) ;

        group.unary("Single equalifty filter LIKE()", async(t) => {
            const qualifier = TSQualifier.LIKE<People>('description', '%che_in%') ;

            t.register('qualifier', qualifier) ;

            t.expect0(qualifier.isComposite).toBeFalsy() ;
            t.expect1(qualifier.isKeyValue).toBeTruthy() ;
            t.expect2(qualifier.keyArray()).toBe(['description']) ;
            t.expect3(qualifier.key()).toBe('description') ;
            t.expect4(qualifier.value()).toBe('%che_in%') ;
            t.expect5(qualifier.conditions()).toBe([]) ;

    
            t.expectA(qualifier.filterValues(peoples)).toBe([
                {   // 4
                    firstName:'Pierre',
                    lastName:'Delahaye',
                    homes:[{}],
                    age:38,
                    description:" Le petit chemin, qui est plein de violettes."
                },
                {   // 6
                    firstName:'Jean',
                    lastName:'Valjean',
                    age:11,
                    selection:'red team',
                    description:"Chemin vers la victoire"
                },
                {   // 8
                    firstName:'Henri',
                    lastName:'Du Mans',
                    description:"Autrefois j'avais un CHENIN."
                }
                                    
            ]) ;
        }) ;

        group.unary("AND+OR+INRANGE filter test", async(t) => {
            const qualifier = TSQualifier.AND<People>() ;

            qualifier.inRange("age", [15, 10])
                     .and() // does not change anything, we already are in a AND() qualifier
                     .or().or().or() // 1, 2 or 3 or() give the same result. We already are in a OR() qualifier with the first one
                        .is("office.address.city", "Paris")
                        .is("homes.address.city", "Paris") ;
            
            t.register('qualifier', qualifier) ;

            t.expect0(qualifier.isComposite).toBeTruthy() ;
            t.expect1(qualifier.isKeyValue).toBeFalsy() ;
            t.expect2(qualifier.keyArray()).toBe([]) ;
            t.expect3(qualifier.key()).toBeUndefined() ;
            t.expect4(qualifier.value()).toBeUndefined() ;
            t.expect5(qualifier.conditions().length).toBe(3) ; // 2 for the inRange(), 1 for the or()
            t.expect6(qualifier.conditions()[2]?.conditions()?.length).toBe(2) ;


            t.expectA(qualifier.filterValues(peoples)).toBe([
                {   // 2
                    firstName:'Jean',
                    lastName:'Durand',
                    homes: [{ address:{
                        city:'Paris',
                        country:'FR'
                    }}],
                    age:23
                },
            ]) ;

        }) ;


    })
 ] ;