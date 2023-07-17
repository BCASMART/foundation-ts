import { TSTest, TSUnaryTest } from "../src/tstester";
import { TSCase, TSExtendedArrayNode, TSNode, TSObjectNode, TSParser, TSParserActionContext, TSParserOptions } from "../src/tsparser";
import { $URL, $ok, $phonenumber } from "../src/commons";
import { TSDate } from "../src/tsdate";
import { TSColor } from "../src/tscolor";
import { $inspect, $logterm } from "../src/utils";
import { $absolute, $filename, $loadJSON } from "../src/fs";
import { UINT32_MAX, UUID } from "../src/types";
import { $uuid } from "../src/crypto";

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
    language: 'language',
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
        language: 'fr',
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
        language: 'fr',
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

export const structureGroups = TSTest.group("TSParser class ", async (group) => {
    group.unary("TSParser example", async(t) => {
        const [struct, _v, _i] = _define(t, parserStructureTestDefinition, 'example') ;
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
            v.language = null ;                     _v(14, v) ;
            v.company.tags.push('other') ;          _v(15, v) ;
            v.company.tags = [] ;                   _v(16, v) ;
            delete v.company.tags ;                 _v(17, v) ;
            v.company.offices.push({
                officeType:'unknown',
                name:'Bad office'
            }) ;                                    _i(18,v) ;
            v.company.offices[1].officeType = 1 ;   _v(19, v) ;
        }
    }) ;
    
    group.unary("TSParser URL array example", async (t) => {
        const [struct, _v, _i] = _define(t, ['url!'], 'URL array' ) ;
        if ($ok(struct)) {            
            const v = ['http://localhost', 'http://localhost/', 'http://localhost:8000', 'http://localhost:8000/toto'] ;
            const vr = v.map(s => $URL(s)) ;
            if (_v(2, v)) {
                const res = struct!.rawInterpret(v) ;
                if (!t.expect3(res).is(vr)) {
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
        const [struct, _v, _i] = _define(t, definition, 'UUID array') ;
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
        const [struct, _v, _i] = _define(t, parserStructureTestDefinition, 'example', 'json') ;
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
                timeFormat: 'string!'
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
    const [struct, _v, _i] = _define(t, def, $filename(file)) ;
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

function _define(t:TSUnaryTest, def:TSNode, test:string, context?:TSParserActionContext):[TSParser|null, (n:number, v:any) => boolean, (n:number, v:any) => boolean] {
    let errors:string[] = [] ;
    const struct = TSParser.define(def, errors) ;
    if (t.expect0(struct).OK() && t.expect1(errors.length).is(0)) { 
        function _v(n:number, v:any) { return _valid(t, struct!, v, n, true, context) ; }
        function _i(n:number, v:any) { return _valid(t, struct!, v, n, false, context) ; }

        return [struct, _v, _i] ; 
    }

    $logterm(`Test[${test}]: cannot define parser. Errors:\n&o${errors.join('\n')}`) ;
    // @ts-ignore
    function _vfalse(n:number, v:any) { return false ;}
    return [null, _vfalse, _vfalse]
}

function _valid(t:TSUnaryTest, struct:TSParser, v:any, n:number, res:boolean, context?:TSParserActionContext):boolean {
    const opts:TSParserOptions = { errors: [], context:context } ;
    const ret = t.expect(struct.validate(v, opts), `val-${n}`).is(res) ;
    if (!ret) {
        $logterm(`Test[${n}]: struct value should be ${res?"valid":"INVALID"}. Error:\n&o${opts.errors!.join('\n')}`) ;
    }
    return ret ;
}
