import { TSTest, TSUnaryTest } from "../src/tstester";
import { $bool, TSCase, TSExtendedArrayNode, TSNode, TSObjectNode, TSParser, TSParserActionContextType, TSParserOptions } from "../src/tsparser";
import { $ok, $phonenumber, $string } from "../src/commons";
import { TSDate } from "../src/tsdate";
import { TSColor } from "../src/tscolor";
import { $inspect, $logterm } from "../src/utils";
import { $absolute, $filename, $loadJSON } from "../src/fs";
import { Continents, Countries, Currencies, Languages, UINT32_MAX, UUID } from "../src/types";
import { $uuid } from "../src/crypto";
import { TSURL } from "../src/tsurl";
import { $decodeBase64 } from "../src/data";
import { TSCharset } from "../src/tscharset";
import { TSData } from "../src/tsdata";
import { TSCountry } from "../src/tscountry";

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
const photoBase64Value = "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" ;
const photoHexaValue = "89504E470D0A1A0A0000000D494844520000003C0000003108060000008662CAAC0000000467414D410000AFC837058AE90000001974455874536F6674776172650041646F626520496D616765526561647971C9653C00000B2B4944415478DAD45A596C14DB11BDB378B7590CB621EC8B09F044108B0D1888D985506461B1F92B8A22254A147E013DBE50100A3CB1248A108978487C802020BD274890080184D902060C7EB6C086806D8C6D301803DE673CD339D5E976CA35F78E872511AFA5D2CCF4DCE9BEE79EAA5355B7C7A33EFEF088F79E75EBD62DF47ABDBFF4783C0BF1390B16C7C6BC833D0D87C3FFC0F79361B9F83C445C33086BB42CEB2CC6FDE9E4C99365CE798B8DB13E76B21F0D74F9F2E583D2D3D37702C4CF9B9B9BBDCB962D538B172F56999999CAE7F3A9AEAE2EF5F0E14375EEDC39555A5AAA060D1AA40A0B0BD5FCF9F3D5C081037BC7343434A8B367CFAAF3E7CFAB112346B401F4EF4E9C38F19503D2FA14C03F042C9917E683F9012A71C3860D7FCDC9C9B18E1E3D6AF577B4B6B6F63BA6A3A3C3DAB66D9B45D784D7FCD6F114BF734F2F9BC7FF84612DA32929293FF4FBFD33E0C28B6A6B6BD7EEDEBD5B2D58B0E0BFCB6F59B68175DBDCCF18DFE77BFBA2CE1830DAFB9E8EBD7BF7AA5BB76E05C0FE86B6B6B65B60BE09A7C3826DEB53018E000A374DCDC8C8F83526FDD396969629E4866043AD5EBD5A6DDDBA3502AC0BC63DE782A5C305E72E8A6E0C7D5EBA74A9CACACA2290F5F87C23140A9DBE79F3E689BABABAD0FBB8B92746B0AEEB7800EA8B8484848335353539F3E6CD536BD7AE55D3A74F5738A7E2E2E2FA4C521E9259CE263FE77EE6E72A2B2B555555956DD7AE5D53D0083572E4C8739D9D9DBF397DFA748DC3B87A5FC6A3C5691C567938E2F4EE92254BACF2F2726DDC0140AFB99FC186D5D3D3D3E73BDD1832DD18771C3F8A8B8BADFCFC7C8BE683D78C4F11DB7DC0C212C1E6F6DCDC5CABBABA3A029C3B690E428E8906CA3DEF8ED15DDFFDDE3D9E3C7962E5E5E591A0EDC4FC129C794605ED8D15745A5A5A1C0913B9EFD8B163FBC4A7FBDE753FEEAE3A17972E2BDD9E5F43DE870E80B65FC78D1B67A734CC6B29DC3B291686BDFDC4ADCBB00F69845E5371F45154A9B05C8C64BC4A60529CF862B80B46DF9399EE3378F060FA2E0D1A2201AB58016B5D1A62B509379A484581BBC23AE03CA54885D689131F233D83332CC7D3015D50972F5FA6D7EF1E3F7EDC6388634F34C0925D32FF9A356BF6D5D7D76F9D387162EABE7DFB2272A83B2197095DDE95C0E402F0DFE8D45BDE878E3D7BF6D8EA8DF3F1493804602D99BEFE982D2828F8D9F3E7CFBFDCBC79B3DAB871A3422C47B02BDDD205CE5D8FBBA27CD5C5B6CE8DE578E465BB1CBD7BF7EEE4193366643D7AF4E8027E131245896502CC5DC02E1771C114B0FAFBD1A347676DD9B225224F4A503A967460F83578ACEBC6486FE0F7193264885AB46811098BBA7EFDFA3488D86D64909A685598D710D736C3D9D9D9E370E131603922A64C93D0C59D3CA7132D0E4E171AF23E5CB58B8A8AEC7300FE63E6D61E11A27D007B340CFB5032D2FB30AA993E8224599293D08914575ED318CEBACEED4DF77153157E1774007B4DE949275ABD1D504545C50B5CA8FAF8F1E3BD2BCF6FCED5940393F959A7B03A45967958578FEBD2D9F6EDDBD5B061C3C22F5EBCB8EA92654A4F3E9D2A3B9600B94F407FDB0A8657A176B67B5B539A91B5B2AE21902ACBE355161CA66BB8AF00A7D03CD8CDCABD7BF75430183C70E5CA95BF3B9B073D8EC958EE03D8C3005389164FA09F3E7DFA6AC2840941E4B91C6ACAC78F1FAFB0080A2D619F0949C1895678C87835A9B47B0D1946740E22A5D6AF5F4FF379FBFAF5EB7D007B1A43020E60B290636113C3BDEAEC18014E842541F9AA870E1DDA00511855525232F0CE9D3B9E152B56684B423E492954B2FD33151EA6BCCE5946F650EDEDEDEAD5AB571D60FA707777775B14C05A95F61852946DA5A5A5B72F5CB8F0152EDC8826DCD8BCF7571DC9899B0A0FD335B837AD5AB58AFAF074F4E6199AF9BF5769C91BE9DE5C867ABA1DCAFD9CE24757D7EA266DAA936511219B099D07C831F7EFDFA7428876423A62DDFDD0C5B097B9B61BCBEEAB1F6E1D078198456960D6AC59110065D9A903675A24D367173C3712AA1D3B76D0F797CACACAA8C2EAC2F06EC7024CB842D144CB2300FB1970BBD44499F912229684589E70FBF66D3566CC183560C0803EBB1D5C78E4568E6E8C4EA1F9F714AB6FDEBC512D2D2DF6AEE7CE9D3BD5810307A8B47C80F8FD1A6EFD0643BB1CEB66B11C11C31E8368B982950C4B8151019DEA187D4E9E3D7BF6A251A3462D6B6E6ECE20B6A74D9BA6A8B1484C4C34E653A9EABABCAC536FDA183C72E488BD954BE791259A5FBE7CF94FB0FC3784D94B67AF9BAC15D60EEB70C007457A8A00CC7738121CD0298EA532A3854806B834A8E517607C1956F907B4DFCC0FD9F1E85895CCCBDA3A1008A8952B572A3443FF827694E33EAF511354A236687180B532B06D0EE04E13CB3E03D33AA5F68A45F162425EB878135C3A0E2C4FA61D88E1C387DB395A97B24C9D93EE3B32DA09A50E0D1D511752E1F1AAAAAAFB48430D2888DA1DD7ED7440773AE6BAB4367E4DA9C8AB71ED2487D55E96172E5CB83633337325FD0631D600779B8218F3519CE5E5E5A94D9B36D15303A3FC171717DB4F1728B5E4E6E6DABB9EEE017755172F5E54870E1DA2A7139DE879BF292F2FBFE730E6C66A87C3669B70E54E07347767255D9ABFF70AD78E770027B9AE9D9393B3142EB66DEEDCB9F616CBB163C7A855BB0A572B07C8291093598D8D8D69B4F73567CE1C5BD828B6DFBE7DAB1E3C78609784D490E037ADEFDEBD4B23B74D4E4E56F1F1F1B640210B506DDC83F1C05A7909D7AD7600740B66DB19E80EC7B84A47EC59FB45CEF538AF6151630778AA82684C2097DBB56B973D08AB4F2A3AB8FA3FC7532C42C9A449937E84094F0293E970F164727FEA6670B4C2FD9B108FC82665CFE11903016E34C60CC5793FAC0342548F66BEA6A1A1A191B9A70BB68B31D9A171E50865E687DF506C28063CE45C2808711A8012730A9848A76682DC9218AEABABA3B4D4E42C8C1F6EDD0C162F91E722BE69E32F1542E403D800BE7B074683EE7D682CAEF55873CFDEFB3AD7E5EC760AC0A65464458B619D6BF7C6727E7EFE6C307118131C81D527570DA3B1F0921B82A44728E60F22F6DA587BE611FDB6696195985C580336C062B78BB1DAC9580F8AB80DEB00FB63DD9947B9FA0B742523F6EFDFAF0E1E3CA86A6B6B5BC1DAD770BF208A904A286A58B36BE8D5ED3A684AC0307BD5B1CB8B8A4EC676B710A890895913E0889404374E9E3A75EA4F006E36094B7676368127C0564545C555C46E883DC60C6A761B4C802D03BB6116B701E6CEB292EA16AC8604B3DA9ADA1F05ACEDD23367CEFC23726D1195914D4D4D8A1EA0510A81EA9E8228B53B8C5A0CAC299F9B74C2E4CEBAF8ED66E764A36F746313A3B2C4F4151414AC04AB7F292A2A8AA33472EAD4A9105CF71B9493B76EDCB8510245F50AB7B5627C4A691958D6B9348FE3003B1F626619AEA9FA63B8B7632A2C2CDC0026FF00318AA3CA097D30553FF567CE9CD90DA0AE9859EC8661F19EDF341A601EC73AD03DA2FBE9D134F7313F1FF61B9E25F991667E853A79003D8846E34F8F02BF7BF6ECD99F01D65D1817949C1C77AF587A6D1DCBDCB5430264288AFBF6FB4CD86F6A0F51AFDE44DCCEA1BE13E0CF7DFBEDB75F3A55974F286A50B85F2806C05614D092E9B0B8663856F7356D00C81ADA2E29DBDADACA90779BC06C496969E961A49F1E06D66260834C39B90563B01ECD82F518DC37F4A1FFEB88F62C89D7CF894E8B98E0EE763015D61506014DFF69C5C0B0E99CD58F187DD0DF95FC1A7796E631B81A4F1901910F43314ECC7ACFC5F8E8FF65F9A3B0AE445C71579639526E8D5AFDE5C3F79CFC27FBF399A9D2B21838AF58F590263FF644A961FF2FFF94FB50C0B2BC93C57F585441C1EF13580E5897033D62675357FAC9980D7FAE403960DEF8BB2EAB18A35E0DFB214369F7598335316C12304B24FF702CDDC9E70A58A7C696A1A59329EA7B03968E7F0B3000E19DE15F5B953B610000000049454E44AE426082" ;
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
            photo: photoBase64Value,
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
            photo:$decodeBase64(photoBase64Value),
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
    
    group.unary('TSParser unary data parser', async(t) => {

        const b64decoded = $decodeBase64(photoBase64Value) ;
        const hexaDecoded = Buffer.from(photoHexaValue, 'hex') ;
        t.expect0(hexaDecoded).is(b64decoded) ;

        const def = {
            _mandatory:true,
            _type:'hexa'
        }
        const [struct, _v] = _define(0, t, def, 'unary hexa data parser') ;
        if ($ok(struct)) {    
            if (_v(0, photoHexaValue)) {
                const res = struct!.rawInterpret(photoHexaValue) ;
                t.expect1(res).is(b64decoded) ;
            }
            if (_v(1, hexaDecoded)) {
                const res = struct!.rawInterpret(hexaDecoded) ;
                t.expect3(res).is(b64decoded) ;
            }
            if (_v(2, b64decoded)) {
                const res = struct!.rawInterpret(b64decoded) ;
                t.expect4(res).is(hexaDecoded) ;
            }
            const data_object = new TSData(b64decoded) ;
            if (_v(3, data_object)) {
                const res = struct!.rawInterpret(data_object) ;
                t.expect5(res instanceof TSData).OK() ;
                t.expect6(res).is(hexaDecoded) ;
            }

        }

        const def64 = {
            _mandatory:true,
            _type:'data'
        } ;
        const [struct64, _v64] = _define(1, t, def64, 'unary base64 data parser') ;
        if ($ok(struct64)) {    
            if (_v64(0, photoBase64Value)) {
                const res = struct64!.rawInterpret(photoBase64Value) ;
                t.expect2(res).is(hexaDecoded) ;
            }
            if (_v64(1, b64decoded)) {
                const res = struct64!.rawInterpret(b64decoded) ;
                t.expect3(res).is(hexaDecoded) ;
            }
            if (_v64(2, hexaDecoded)) {
                const res = struct64!.rawInterpret(hexaDecoded) ;
                t.expect4(res).is(b64decoded) ;
            }
            const data_object = new TSData(hexaDecoded) ;
            if (_v64(3, data_object)) {
                const res = struct64!.rawInterpret(data_object) ;
                t.expect5(res instanceof TSData).OK() ;
                t.expect6(res).is(b64decoded) ;
            }
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
    
    /*group.unary('Remaining types validation', async(t) => {
        const all = {
            _mandatory:true,
            'int8!',
            'int16!',
            'int32!', 
            'ipaddress!',
            'ipv4!',
            'ipv6!', 
            'jsdate!',
            'uint16!',
            'uint32!',
            'unsigned!'            
        }
    }) ;*/
    group.unary('TSParser with any values', async(t) => {
        const def = {
            _mandatory:true,
            name:"string!",
            x:'native!',
            y:'native'
        } ;
        const values:Array<any> = [
            /* 0 */{ name:"A", x:"folio" },
            /* 1 */{ name:"B", x:true, y:3 },
            /* 2 */{ name:"C", x:1, y:"mine"},
            /* 3 */{ name:"D", x:Symbol("foo"), y:false},
            /* 4 */{ name:"E", x:142, y:BigInt(1)},
            /* 5 */{ name:'F', x:true },
            /* 6 */{ name:'G', x:'true', y:undefined },
            /* 7 */{ name:'H', x:-1024, y:null }
        ] ;

        
        const decodedValues = [...values] ;
        decodedValues.pop() ;
        decodedValues.push({ name:'H', x:-1024 }) ;

        const exportedValues = [... decodedValues] ;
        exportedValues[3] = {...values[3], x:$string(values[3].x) } ;
        exportedValues[4] = {...values[4], y:Number(values[4].y) } ;
        exportedValues[6] = { name:values[6].name, x:values[6].x } ;
        exportedValues[7] = { name:values[7].name, x:values[7].x } ;

        const [struct, _v, _i] = _define(0, t, def, 'managing "any" values' ) ;
        if ($ok(struct)) {
            const n = values.length ;
            for (let i = 0 ; i < n ; i++) {
                const v = values[i] ;
                if (_v(i, v)) {
                    const res = struct!.rawInterpret(v) ;
                    if (t.expect(res, 'raw'+i).is(decodedValues[i])) {
                        t.expect(struct!.rawEncode(res), 'enc'+i).is(exportedValues[i]) ;
                    }
                }
            }
            _i(50, {name:'AA', x:undefined}) ;
            _i(51, {name:'BB', x:null}) ;
            _i(52, {name:'CC', x:{}}) ;
            _i(53, {name:'DD', x:{a:'NO'}}) ;
            _i(54, {name:'EE', x:Buffer.from('A1B0C3')}) ;
            _i(55, {name:'FF', x:TSDate}) ;
            _i(56, {name:'GG', x:(c:string)=>console.log(c)}) ;
            _i(57, {name:'HH', y:'missing-x' }) ;
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

    group.unary("TSParser path array example", async (t) => {
        const [struct, _v, _i] = _define(0, t, ['path!'], 'path array' ) ;
        if ($ok(struct)) {            
            const v = [
                ".",
                ".doc",
                "c:",
                "c:/",
                "c:\\",
                "C:",
                "C:/",
                "C:\\",
                "à:/",
                "à:\\",
                "À:/",
                "À:\\",
                "z:/",
                "z:\\",
                "AB:/",
                "AB:\\",
                "c:/.doc",
                "c:\\.doc",
                "C:/folder",
                "C:\\folder",
                "C:/file.pdf",
                "C:\\file.pdf",
                "C:/folder/",
                "C:\\folder\\",
                "C:/folder/file.pdf",
                "C:\\folder\\file.pdf",
                "C:/folder/folder2",
                "C:\\folder\\folder2",
                "C:/folder/folder2/file.pdf",
                "C:\\folder\\folder2\\file.pdf",
                "C://",
                "C:\\\\",
                "C://folder",
                "C:\\\\folder",
                "/",
                "\\",
                "/.doc",
                "\\.doc",
                "/folder",
                "\\folder",
                "/folder/",
                "\\folder\\",
                "/folder/.doc",
                "\\folder\\.doc",
                "/file.pdf",
                "\\file.pdf",
                "/folder/file.pdf",
                "\\folder\\file.pdf",
                "/folder/folder2",
                "\\folder\\folder2",
                "/folder/folder2/",
                "\\folder\\folder2\\",
                "/folder/folder2/file.pdf",
                "\\folder\\folder2\\file.pdf",
                "//",
                "\\\\",
                "//.doc",
                "\\\\.doc",
                "//server",
                "\\\\server",
                "//server/",
                "\\\\server\\",
                "//server/.doc",
                "\\\\server\\.doc",
                "//server/volume",
                "\\\\server\\volume",
                "//server/volume/",
                "\\\\server\\volume\\",
                "//server/volume/.doc",
                "\\\\server\\volume\\.doc",
                "//server/volume/file.pdf",
                "\\\\server\\volume\\file.pdf",
                "//server/volume/folder",
                "\\\\server\\volume\\folder",
                "//server/volume/folder/",
                "\\\\server\\volume\\folder\\",
                "//server/volume/folder/file.pdf",
                "\\\\server\\volume\\folder\\file.pdf",
                "//server/volume/folder/folder2",
                "\\\\server\\volume\\folder\\folder2",
                "//server/volume/folder/folder2/",
                "\\\\server\\volume\\folder\\folder2\\",
                "//server/volume/folder/folder2/file.pdf",
                "\\\\server\\volume\\folder\\folder2\\file.pdf",
                "//server/volume/folder/folder2/.doc",
                "\\\\server\\volume\\folder\\folder2\\.doc",
                "///",
                "\\\\\\",
                "/Users/Durand/Developer/foundation-ts/files",
                "\\Users\\Durand\\Developer\\foundation-ts\\files",
                "C:/Users/Durand/Developer/foundation-ts/files",
                "C:\\Users\\Durand\\Developer\\foundation-ts\\files",
                "//LocalServer/SharedVolume/Users/Durand/Developer/foundation-ts/files",
                "\\\\LocalServer\\SharedVolume\\Users\\Durand\\Developer\\foundation-ts\\files",
                "/folder/folder2\\",
                "/folder\\folder2",
                "/folder\\folder2/",
                "/folder\\folder2\\",
                "\\folder/folder2",
                "\\folder/folder2/",
                "\\folder/folder2\\",
                "\\folder\\folder2/",
                "C:/folder/folder2\\",
                "C:/folder\\folder2",
                "C:/folder\\folder2/",
                "C:/folder\\folder2\\",
                "C:\\folder/folder2",
                "C:\\folder/folder2/",
                "C:\\folder/folder2\\",
                "C:\\folder\\folder2/",
                "//server/volume/folder/folder2\\",
                "//server/volume/folder\\folder2",
                "//server/volume/folder\\folder2/",
                "//server/volume/folder\\folder2\\",
                "//server/volume\\folder\\folder2",
                "//server/volume\\folder\\folder2\\",
                "//server\\volume\\folder\\folder2",
                "//server\\volume\\folder\\folder2\\",
                "/\\server\\volume\\folder\\folder2",
                "/\\server\\volume\\folder\\folder2\\",
                "\\\\server\\volume\\folder\\folder2/",
                "\\\\server\\volume\\folder/folder2/",
                "\\\\server\\volume\\folder/folder2",
                "\\\\server\\volume/folder/folder2/",
                "\\\\server\\volume/folder/folder2",
                "\\\\server/volume/folder/folder2/",
                "\\\\server/volume/folder/folder2",
                "\\/server/volume/folder/folder2"            
            ] ;
            if (_v(2, v)) {
                const res = struct!.rawInterpret(v) ;
                if (!t.expect0(res).is(v)) {
                    console.log('\n>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', v) ;
                }
            }
        }
    }) ;

    group.unary("TSParser language array", async (t) => {
        const [struct, _v, _i] = _define(0, t, ['language!'], 'language array' ) ;
        if ($ok(struct)) {            
            const v = Object.values(Languages) ;
            _v(0, v) ;
            _i(1, ['XX']) ;
            _v(2, ['DE ', ' EN   ', '   Fr ']) ;
        }
    }) ;

    group.unary("TSParser currency array", async (t) => {
        const [struct, _v, _i] = _define(0, t, ['currency!'], 'currency array' ) ;
        if ($ok(struct)) {            
            const v = Object.values(Currencies) ;
            _v(0, v) ;
            _i(1, ['FRF']) ;
            _v(2, ['eur ', '   gbP ']) ;
        }
    }) ;

    group.unary("TSParser charset array", async (t) => {
        const [struct, _v, _i] = _define(0, t, ['charset!'], 'charset array' ) ;
        if ($ok(struct)) {            
            _v(0, TSCharset.allCharsetNames()) ;
            _i(1, ['ISO-8859-12']) ;
            _i(2, ['linux']) ;
        }
    }) ;

    group.unary("TSParser countries array", async (t) => {
        const [struct, _v, _i] = _define(0, t, ['country!'], 'country array' ) ;
        if ($ok(struct)) {            
            const v = Object.values(Countries) ;
            _v(0, v) ;
            _i(1, ['Alaska']) ;
            _v(2, [' Fr ', '  us  ', ' ua ']) ;
            _v(3, [' frA ', '  Usa  ', 'gbr', 'Gb ']) ;

            const v4 = TSCountry.alpha2Codes() ;
            _v(4, v4) ;

            const v5 = TSCountry.alpha3Codes() ;
            if (_v(5, v5)) {
                const res = struct!.rawInterpret(v5) ;
                t.expect5(res).is(v4) ;
            }

        }
    }) ;

    group.unary("TSParser continents array", async (t) => {
        const [struct, _v, _i] = _define(0, t, ['continent!'], 'continent array' ) ;
        if ($ok(struct)) {            
            const v = Object.values(Continents) ;
            _v(0, v) ;
            _i(1, ['Middle Earth']) ;
            _v(2, [' Eu', '  oc     '])
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
                datePartialTimeFormat: 'string!',
                shortDatePartialTimeFormat: 'string!',
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
                    datePartialTimeFormat: 'string',
                    shortDatePartialTimeFormat: 'string',
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
