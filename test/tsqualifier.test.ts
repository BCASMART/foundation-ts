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
            const qualifier = TSQualifier.OR<People>() ;
            qualifier.addValue('lastName', 'Durand') ;
            qualifier.add(TSQualifier.GTE('age', 38)) ;
            qualifier.addValue('homes.address.city', 'Clermont-Ferrand') ;

            t.expect(qualifier.isComposite).toBeTruthy() ;
            t.expect(qualifier.isKeyValue).toBeFalsy() ;
            t.expect(qualifier.keyArray()).toBe([]) ;
            t.expect(qualifier.key()).toBeUndefined() ;
            t.expect(qualifier.value()).toBeUndefined() ;
            t.expect(qualifier.conditions().length).toBe(3) ;

            t.expect(peoples.filterWithQualifier(qualifier)).toBe([
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
            t.expect(qualifier.isComposite).toBeTruthy() ;
            t.expect(qualifier.isKeyValue).toBeFalsy() ;
            t.expect(qualifier.keyArray()).toBe([]) ;
            t.expect(qualifier.key()).toBeUndefined() ;
            t.expect(qualifier.value()).toBeUndefined() ;
            t.expect(qualifier.conditions().length).toBe(2) ;

            t.expect(peoples.filterWithQualifier(qualifier)).toBe([
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
            t.expect(qualifier.isComposite).toBeFalsy() ;
            t.expect(qualifier.isKeyValue).toBeFalsy() ;
            t.expect(qualifier.keyArray()).toBe(['selection']) ;
            t.expect(qualifier.key()).toBe('selection') ;
            t.expect(qualifier.value()).toBeUndefined() ;
            t.expect(qualifier.conditions()).toBe([]) ;

            t.expect(TSQualifier.OK<People>('selection').filterValues(peoples)).toBe([
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
            t.expect(qualifier.isComposite).toBeFalsy() ;
            t.expect(qualifier.isKeyValue).toBeTruthy() ;
            t.expect(qualifier.keyArray()).toBe(['homes', 'address', 'city']) ;
            t.expect(qualifier.key()).toBe('homes.address.city') ;
            t.expect(qualifier.value()).toBe('Lyon') ;
            t.expect(qualifier.conditions()).toBe([]) ;

            t.expect(qualifier.filterValues(peoples)).toBe([
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
            t.expect(qualifier.isComposite).toBeFalsy() ;
            t.expect(qualifier.isKeyValue).toBeTruthy() ;
            t.expect(qualifier.keyArray()).toBe(['description']) ;
            t.expect(qualifier.key()).toBe('description') ;
            t.expect(qualifier.value()).toBe('%che_in%') ;
            t.expect(qualifier.conditions()).toBe([]) ;

            t.expect(qualifier.filterValues(peoples)).toBe([
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

    })
 ] ;