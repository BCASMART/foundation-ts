import { TSTest, TSUnaryTest } from "../src/tstester";
import { $bool, TSCase, TSExtendedArrayNode, TSNode, TSObjectNode, TSParser, TSParserActionContextType, TSParserOptions } from "../src/tsparser";
import { $ok, $phonenumber } from "../src/commons";
import { TSDate } from "../src/tsdate";
import { TSColor } from "../src/tscolor";
import { $inspect, $logterm } from "../src/utils";
import { $absolute, $filename, $loadJSON } from "../src/fs";
import { UINT32_MAX, UUID } from "../src/types";
import { $uuid } from "../src/crypto";
import { TSURL } from "../src/tsurl";

const days:TSExtendedArrayNode = {
    _mandatory:false,
    _min:7,
    _max:7,
    _itemsType:'string!'
} ;

const months = {...days, _min:12, _max:12}

const currencies:TSObjectNode = {
    _keysType:'currency',
    _valueItemsType:{
        unit:'string',
        units: 'string',
        subunit: 'string',
        subunits: 'string',
        code: 'string',
        subcode: 'string'
    }
} ;

const names:TSObjectNode = {
    _mandatory:true,
    _keysType:'language',
    _valueItemsType:'string!'
} ;

export const parserStructureTestDefinition = {
    _mandatory: true,
    _keysCase: TSCase.lowercase,
    name:   'string!',
    firstName: 'string',
    mail:   'email!',
    mobile: 'phone',
    bgcolor: 'color',
    language: { 
        _type:'language',
        _default: 'en'
    },
    company: {
        _mandatory: true,
        name: 'string!',
        hiringDate: 'date!',
        position: 'string!',
        photo: 'data',
        website: 'url',
        tags: ['string'],
        offices:[{ 
            officeType: {
                _type:'uint8',
                _mandatory: true,
                _enum:{ 'headquarter': 1, 'agency': 2 }
            },
            name: 'string!',
        }, 0, 8]
    }
} ;

export function parserStructureTestValue():any {
    return {
        name:   "Monserat",
        firstName: "Henry",
        mail:   'h.monserat@orange.fr',
        mobile: '+(33 1) 45 24 70 00',
        bgcolor: '#ff0000',
        company:{
            name:"MyCompany",
            hiringDate: "2023-06-15",
            position: "chef de projet",
            tags:["informatique", "services"],
            offices:[{
                officeType:"agency",
                name:"Agence de Paris Nord"
            }]
        }
    }
} ;

export function parserStructureTestInterpretation() {
    const v = parserStructureTestValue() ;
    return {
        name:   "Monserat",
        firstname: "Henry",
        language: 'en',
        mail:   'h.monserat@orange.fr',
        mobile: $phonenumber(v.mobile),
        bgcolor: TSColor.fromString(v.bgcolor),
        company:{
            name:"MyCompany",
            hiringDate:TSDate.fromIsoString(v.company.hiringDate),
            position: "chef de projet",
            tags:["informatique", "services"],
            offices:[{
                officeType:2,
                name:"Agence de Paris Nord"
            }]
        }
    } ;
} 
interface BoolTestEntry {
    v:any ;
    b:boolean ;
} ;

const boolTestEntries:BoolTestEntry[] = [
    {v:null, b:false},
    {v:undefined, b:false},
    {v:true, b:true},
    {v:false, b:false},
    {v:1, b:true},
    {v:-1, b:true},
    {v:NaN, b:false},
    {v:-1.25665, b:true},
    {v:Number.POSITIVE_INFINITY, b:true},
    {v:Number.NEGATIVE_INFINITY, b:true},
    {v:0, b:false},
    {v:0.0, b:false},
    {v:'1', b:true},
    {v:'0', b:false},
    {v:'  1 ', b:true},
    {v:'2', b:false},
    {v:'', b:false},
    {v:'    ', b:false},
    {v:'false', b:false},
    {v:'true', b:true},
    {v:' True ', b:true},
    {v:' YES ', b:true},
    {v:' y ', b:true},
    {v:'yes', b:true},
    {v:new Date(), b:false},
    {v:{}, b:false},
    {v:[], b:false}
] ;

export const structureGroups = TSTest.group("TSParser class ", async (group) => {
    group.unary("$bool() function", async(t) => {
        for (let i = 0, n = boolTestEntries.length ; i < n ; i++) {
            const entry = boolTestEntries[i] ;
            t.expect($bool(entry.v), `BT-${i}`).is(entry.b) ;
        }
    }) ;
    group.unary("TSParser example", async(t) => {
        const [struct, _v, _i] = _define(0, t, parserStructureTestDefinition, 'example') ;
        if ($ok(struct)) {    
            let v = parserStructureTestValue() ;         
            if (_v(2, v)) {
                const res = struct!.rawInterpret(v) ;
                if (!t.expect3(res).is(parserStructureTestInterpretation())) {
                    console.log($inspect(struct!.toJSON(), 10)) ;
                }
            }
            v = parserStructureTestValue() ;
            v.language = '@@' ;                     _i(11, v) ;

            v = parserStructureTestValue() ;
            v.plus = '+' ;                          _i(13, v) ;

            v = parserStructureTestValue() ;
            v.language = 'fr' ;
            if (_v(14, v)) {
                const r = parserStructureTestInterpretation() ;
                r.language = 'fr' ;
                const res = struct!.rawInterpret(v) ;
                if (!t.expectA(res).is(r)) {
                    console.log($inspect(struct!.toJSON(), 10)) ;
                }
            }
            v = parserStructureTestValue() ;
            v.language = null ;
            if (_v(15, v)) {
                const r = parserStructureTestInterpretation() ;
                const res = struct!.rawInterpret(v) ;
                if (!t.expectB(res).is(r)) {
                    console.log($inspect(struct!.toJSON(), 10)) ;
                }
            }
            v = parserStructureTestValue() ;
            v.language = undefined ;
            if (_v(16, v)) {
                const r = parserStructureTestInterpretation() ;
                const res = struct!.rawInterpret(v) ;
                if (!t.expectC(res).is(r)) {
                    console.log($inspect(struct!.toJSON(), 10)) ;
                }
            }


            v.company.tags.push('other') ;          _v(20, v) ;
            v.company.tags = [] ;                   _v(21, v) ;
            delete v.company.tags ;                 _v(22, v) ;
            v.company.offices.push({
                officeType:'unknown',
                name:'Bad office'
            }) ;                                    _i(23, v) ;
            v.company.offices[1].officeType = 1 ;   _v(24, v) ;
        }
    }) ;

    group.unary("TSParser check dictionary enumeration output", async(t) => {
        const def = {
            ...parserStructureTestDefinition,
            company:{
                ...parserStructureTestDefinition.company,
                offices:[{ 
                    officeType: {
                        _type:'uint8',
                        _mandatory: true,
                        _enum:{ 'headquarter': 1, 'agency': 2 },
                        _exportAsEnum:true
                    },
                    name: 'string!',
                }, 0, 8]        
            }
        } ;
        const [struct, _v, _i] = _define(0, t, def, 'example with enum exported') ;
        if ($ok(struct)) {    
            let v = parserStructureTestValue() ;
            if (_v(2, v)) {
                const r = parserStructureTestInterpretation() ;
                const res = struct!.rawInterpret(v) ;
                if (!t.expect3(res).is(r)) {
                    console.log($inspect(struct!.toJSON(), 10)) ;
                }
                else {
                    let out = parserStructureTestValue() ;
                    out.firstname = out.firstName ; delete out.firstName ;
                    out.language = 'en' ;
                    out.bgcolor = out.bgcolor + 'ff' ;
                    out.mobile = $phonenumber(out.mobile)?.standardNumber ;
                    out.company.hiringDate = out.company.hiringDate+'T00:00:00' ;
                    
                    // here, the exported office type is the string of the enum

                    if (!t.expect4(struct!.rawEncode(res)).is(out)) {
                        console.log($inspect(struct!.toJSON(), 10)) ;
                    }
                }
            }

        }
    }) ;

    group.unary('TSParser validate enum and default values', async(t) => {
        const def0 = {
            _mandatory:true, 
            name:'string!',
            format:{
                _type:'paper',
                _default:'toto'
            },
        } ;
        let errors:string[] = [] ;
        const struct0 = TSParser.define(def0, errors) ;
        if (t.expect0(struct0).KO()) {
            if (!t.expect1(errors.length).is(1) || 
                !t.expect2(errors[0]).is("Parser type 'paper' cannot be have toto as default value")) {
                console.log(errors) ;
            }
        } 

        errors = [] ;        
        const def3 = {
            _mandatory:true, 
            name:'string!',
            lang:{
                _type:'paper',
                _enum:['a4', 'c1', 'toto']
            },
        } ;
        const struct3 = TSParser.define(def3, errors) ;
        if (t.expect3(struct3).KO()) {
            if (!t.expect4(errors.length).is(1) || 
                !t.expect5(errors[0]).is("Enumeration value 'toto' is invalid for type 'paper'")) {
                console.log(errors) ;
            }
        } 

    }) ;

    group.unary("TSParser example with aliases", async(t) => {
        const ma = new Map<string,string>() ;
        const ca = new Map<string,string>() ;
        const mao = new Map<string,string>() ;
        const cao = new Map<string,string>() ;
        const aliasParserDefinition = {
            ...parserStructureTestDefinition,
            company:{
                ...parserStructureTestDefinition.company,
                _aliases:ca,
                _outputAliases:cao
            },
            _aliases:ma,
            _outputAliases:mao
        } ;
        ma.set('lastName', 'name') ;
        ma.set('last-name', 'name') ;
        ma.set('color', 'bgColor') ;
        ma.set('phone', 'mobile') ;
        ma.set('tel', 'mobile') ;
        ma.set('mobile-phone', 'mobile') ;
        ma.set('color', 'bgColor') ;
        ma.set('background-color', 'bgColor') ;
        ma.set('email', 'mail') ;
        ma.set('e-mail', 'mail') ;

        ca.set('situation', 'position') ;
        ca.set('job', 'position') ;
        
        mao.set('name', 'lastName') ;
        mao.set('bgcolor', 'background-color') ;

        cao.set('position', 'job') ;

        const [struct, _v, _i] = _define(0, t, aliasParserDefinition, 'example with aliases') ;

        if ($ok(struct)) {    
            let v = parserStructureTestValue() ;
            v.lastName = v.name ; delete v.name ;
            v['mobile-phone'] = v.mobile ; delete v.mobile ;
            v['color'] = v.bgcolor ; delete v.bgcolor ;
            v.company.job = v.company.position ; delete v.company.position ;
            
            if (_v(2, v)) {
                const r = parserStructureTestInterpretation() ;
                const res = struct!.rawInterpret(v) ;
                if (!t.expect3(res).is(r)) {
                    console.log($inspect(struct!.toJSON(), 10)) ;
                }
                else {
                    let out = parserStructureTestValue() ;
                    out.firstname = out.firstName ; delete out.firstName ;
                    out.lastName = out.name ; delete out.name ;
                    out['background-color'] = out.bgcolor+'ff' ; delete out.bgcolor ; // TODO: export as HTML ?
                    out.language = 'en' ;
                    out.mobile = $phonenumber(out.mobile)?.standardNumber ;
                    out.company.hiringDate = out.company.hiringDate+'T00:00:00' ; // TODO: export short day values if there's no time ?
                    out.company.job = out.company.position ; delete out.company.position ;
                    out.company.offices[0].officeType = 2 ; // TODO: export the enum value ?

                    if (!t.expect4(struct!.rawEncode(res)).is(out)) {
                        console.log($inspect(struct!.toJSON(), 10)) ;
                    }
                }

            }
        }

    }) ;

    group.unary('TSParser emulating insensitive case entries', async(t) => {
        const aliases = new Map<string,string>() ;
        aliases.set('documentformat', 'documentFormat') ;
        aliases.set('name', 'name') ;
        const def = {
            _mandatory:true, 
            name:'string!',
            documentFormat:{
                _type:'paper',
                _default:'a4'
            },
            _aliases:aliases,
            _aliasUnsensitive:true
        } ;

        const value = { NAME:"John DOE", DOCUMENTFORMAT:"folio" }
        const interpretedValue = { name:"John DOE", documentFormat:"folio" }
        
        const [struct, _v, _i] = _define(0, t, def, 'emulating insensitive keys entries' ) ;
        if ($ok(struct)) {
            if (_v(0, value)) {
                const res = struct!.rawInterpret(value) ;
                t.expect0(res).is(interpretedValue)
            }
        }
        const outa = new Map<string,string>() ;
        outa.set('documentFormat', 'document-format') ;
        outa.set('name', 'field-name') ;
        aliases.set('document-format', "documentFormat") ;
        (def as any)._outputAliases = outa ; 
        
        const value1 = { NAME:"John DOE", "DOCUMENT-FORMAT":"ledger" }
        const interpretedValue1 = { name:"John DOE", documentFormat:"ledger" }
        
        const [struct1, _v1, _i1] = _define(1, t, def, 'emulating insensitive keys entries with other aliases' ) ;
        if ($ok(struct1)) {
            if (_v1(1, value1)) {
                const res = struct1!.rawInterpret(value1) ;
                if (t.expect1(res).is(interpretedValue1)) {
                    if (!t.expect2(struct1!.rawEncode(res)).is({ "field-name":"John DOE", "document-format":"ledger" })) {
                        console.log($inspect(struct1!.toJSON(), 10)) ;
                    }
                }
            }
        }

    }) ;

    group.unary("TSParser url array example", async (t) => {
        const [struct, _v, _i] = _define(0, t, ['url!'], 'url array' ) ;
        if ($ok(struct)) {            
            const v = ['http://localhost', 'http://localhost/', 'http://localhost:8000', 'http://localhost:8000/toto'] ;
            const vr = v.map(s => TSURL.url(s)) ;
            if (_v(2, v)) {
                const res = struct!.rawInterpret(v) ;
                if (!t.expect0(res).is(vr)) {
                    console.log($inspect(struct!.toJSON(), 10)) ;
                }
            }
        }

    }) ;
    group.unary("TSParser UUID array example", async (t) => {
        const definition:TSExtendedArrayNode = {
            _mandatory:true,
            _itemsType:'uuid!',
            _min:2,
            _max:4
        } 
        const [struct, _v, _i] = _define(0, t, definition, 'UUID array') ;
        if ($ok(struct)) {   
            for (let i = 2 ; i < 8 ; i+=2 ) {
                const v:UUID[] = [] ;
                for (let j = 0 ; j < i ; j++) { v.push($uuid()) ; }
                if (i <= 4 ? _v(i, v) : _i(i, v)) {
                    if (i <= 4) {
                        const res = struct!.rawInterpret(v) ;
                        if (!t.expect(res, 'res'+i).is(v)) {
                            console.log($inspect(struct!.toJSON(), 10)) ;
                        }
                    } 
                }
            }    
        }

    }) ;

    group.unary("TSParser example in JSON mode", async(t) => {
        const [struct, _v, _i] = _define(0, t, parserStructureTestDefinition, 'example', 'json') ;
        if ($ok(struct)) {            
            const v = parserStructureTestValue() ;         
            if (_v(2, v)) {
                const res = struct!.rawInterpret(v) ;
                if (!t.expect3(res).is(parserStructureTestInterpretation())) {
                    console.log($inspect(struct!.toJSON(), 10)) ;
                }
            }
        }
    }) ;

    group.unary("Currencies JSON", async(t) => {
        const def:TSObjectNode = {
            _mandatory:true,
            _keysType:'currency',
            _valueItemsType:{
                _mandatory:true,
                unit:'string!',
                units:'string!',
                subunit: 'string!',
                subunits: 'string!',
                code: 'string',
                subcode: 'string'
            }
        } ;
        _validateJSON(t, def, 'tdist/src/currencies.json') ;
    }) ;

    group.unary("Charsets JSON", async(t) => {
        const def:TSExtendedArrayNode = {
            _mandatory:true,
            _itemsType:{
                name:'string!',
                aliases:['string!'],
                charset:[{
                    _mandatory:true,
                    _type:'int',
                    _checker:(v:any) => v === -1 || (v >= 0 && v <= UINT32_MAX)
                }]
            }
        } ;
        _validateJSON(t, def, 'tdist/src/tscharsets.json') ;
    }) ;

    group.unary("Locales JSON", async(t) => {
        const def:TSExtendedArrayNode = {
            _mandatory:true,
            _itemsType:{
                ampm: ['string!', 2, 2],
                continentNames:{
                    _mandatory:true,
                    _keysType:'continent',
                    _valueItemsType:'string!'
                },
                currencies:currencies,
                dateFormat: 'string!',
                dateTimeFormat:'string!',
                days:['string!', 7, 7],
                daysList:days,
                language:'language!',
                months:['string!', 12, 12],
                monthsList:months,
                names:names,
                partialTimeFormat:'string!',
                shortDateFormat:'string!',
                shortDateTimeFormat:'string!',
                shortDays:['string!', 7, 7],
                shortMonths:['string!', 12, 12],
                startingWeekDay:'uint8!',
                timeFormat: 'string!',
                unitNames:{
                    _mandatory:true,
                    _keysType:'string',
                    _valueItemsType:['string!',2,3] /* 0 = singulat unit name, 1 = plural unit name, 2 = optional translated SI abbreviation */
                }
            }
        } ;
        _validateJSON(t, def, 'tdist/src/locales.json') ;
    }) ;

    group.unary("Countries JSON", async(t) => {

        const def:TSExtendedArrayNode = {
            _mandatory:true,
            _itemsType:{
                _mandatory:true,
                alpha2Code:'country!',
                alpha3Code:'string!',
                continent:'continent!',
                currency: 'currency!',
                domains:['string!', 1],
                EEC:'boolean!',
                names:names,
                phonePlan:{
                    _mandatory:true,
                    dialCode:'string!',
                    trunkCode:'string!',
                    areaCodes:['string!'],
                    minDigits:'uint8',
                    maxDigits:'uint8',
                    _checker: (v:any) => !$ok(v.minDigits) || !$ok(v.maxDigits) || v.minDigits <= v.maxDigits
                },
                aliases:['string!'],
                localeLanguage:'language',
                specificLocales:{
                    ampm: {
                        _mandatory:false,
                        _itemsType:'string',
                        _min:2,
                        _max:2
                    },
                    currencies:{
                        _keysType:'currency',
                        _valueItemsType:{
                            unit:'string',
                            units: 'string',
                            subunit: 'string',
                            subunits: 'string',
                            code: 'string',
                            subcode: 'string'
                        }
                    },
                    dateFormat: 'string',
                    dateTimeFormat:'string',
                    days:days,
                    daysList:days,
                    months:months,
                    monthsList:months,
                    partialTimeFormat:'string',
                    shortDateFormat:'string',
                    shortDateTimeFormat:'string',
                    shortDays:days,
                    shortMonths:months,
                    startingWeekDay:'uint8',
                    timeFormat: 'string'
                },
                spokenLanguages:['language!', 1],
                state:'country'
            }
        } ;
        _validateJSON(t, def, 'tdist/src/countries.json') ;
    }) ;

}) ;

function _validateJSON(t:TSUnaryTest, def:TSNode, file:string, n:number = 0) {
    const [struct, _v, _i] = _define(0, t, def, $filename(file)) ;
    if ($ok(struct)) {
        const json = $loadJSON($absolute(file)) ;
        if (t.expect(json).OK(), `json${n*2}`) {
            if (!_v(n*2+1, json)) {
                $logterm('&0\n&x=================================================================') ;
                $logterm(`&0&x Faulty JSON &R&w ${file} &0&x":`) ;
                $logterm('&0&x=================================================================') ;
                $logterm(`&0&a${$inspect(json)}`)
                $logterm('&0&x=================================================================&0') ;
            }
        }
    }
}

function _define(n:number, t:TSUnaryTest, def:TSNode, test:string, context?:TSParserActionContextType):[TSParser|null, (n:number, v:any) => boolean, (n:number, v:any) => boolean] {
    let errors:string[] = [] ;
    const struct = TSParser.define(def, errors) ;
    if (t.expect(struct, `def-${n}`).OK() && t.expect(errors.length, `err-${n}`).is(0)) { 
        function _v(n:number, v:any) { return _valid(t, struct!, v, n, true, context) ; }
        function _i(n:number, v:any) { return _valid(t, struct!, v, n, false, context) ; }

        return [struct, _v, _i] ; 
    }

    $logterm(`Test[${test}]: cannot define parser. Errors:\n&o${errors.join('\n')}`) ;
    // @ts-ignore
    function _vfalse(n:number, v:any) { return false ;}
    return [null, _vfalse, _vfalse]
}

function _valid(t:TSUnaryTest, struct:TSParser, v:any, n:number, res:boolean, context?:TSParserActionContextType):boolean {
    const opts:TSParserOptions = { errors: [], context:context } ;
    const ret = t.expect(struct.validate(v, opts), `val-${n}`).is(res) ;
    if (!ret) {
        $logterm(`Test[${n}]: struct value should be ${res?"valid":"INVALID"}. Error:\n&o${opts.errors!.join('\n')}`) ;
    }
    return ret ;
}
