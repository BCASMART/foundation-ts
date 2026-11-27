import { TSTest } from "../src/tstester";
import { TSDataTemplate, TSFusionTemplate, TSHTMLTemplate, TSStringTemplate } from '../src/tsfusion';
import { TSFusionContextType, TSFusionNodeType, TSFusionTreeNode } from '../src/tsfusionnode';
import { TSDictionary } from "../src/types";
import { TSData } from "../src/tsdata";
import { $inbrowser, $inspect } from "../src/utils";
import { TSCharset } from "../src/tscharset";
import { TSDate } from "../src/tsdate";

class P {
    constructor(public title:string, public firstName:string, public lastName:string, public isMan?:boolean, public isWoman?:boolean) {}
}

enum Sex {
    Unknown,
    Man,
    Woman
}

class PI {
    private _lastName:string ;
    private _firstName:string ;
    private _title:string ;
    private _sex:Sex ;
    public test = 'T' ;
    public insideHTML = '<div style="background:#FF00">Ceci est assurément une r&eacute;ussite</div>' ;
    public collaborators:Array<P|PI> = [] ;

    constructor(title:string, firstName:string, lastName:string, sex:Sex = Sex.Unknown) {
        this._title = title ;
        this._firstName = firstName ;
        this._lastName = lastName ;
        this._sex = sex ;
    }
    public get isMan():boolean { return this._sex === Sex.Man ; }
    public get isWoman():boolean { return this._sex === Sex.Woman ; }

    public get women():PI[] { return this.collaborators.filter(p => p instanceof PI && p.isWoman) as PI[] ; }
    public get men():PI[]   { return this.collaborators.filter(p => p instanceof PI && p.isMan) as PI[] ; }

    public title():string { return this._title ; }
    public get firstName():string { return this._firstName ; }
    public get lastName():string { return this._lastName ; }

    public addCollaborator(c:P|PI) {
        this.collaborators.push(c) ;
    }
    public clone():PI {
        const ret = new PI(this._title, this._firstName, this._lastName) ;
        this.collaborators.forEach(c => ret.addCollaborator(c)) ;
        return ret ;
    }

}

// @ts-ignore
function richTextName(data:any, rootData:any, localContext:TSDictionary, context:TSDictionary, systemContext:TSDictionary):string {
    if (data instanceof PI) {
        return context.nameColor+data.title().capitalize()+' '+data.firstName.capitalize()+' '+context.lastNameColor+data.lastName.toLocaleUpperCase()+"&0" ;
    }
    return context.nameColor+data.title.capitalize()+' '+data.firstName.capitalize()+' '+context.lastNameColor+data.lastName.toLocaleUpperCase()+"&0" ;
}

// @ts-ignore
function htmlName(data:any, rootData:any, localContext:TSDictionary, context:TSDictionary, systemContext:TSDictionary):string {
    if (data instanceof PI) {
        return data.title().capitalize()+' '+data.firstName.capitalize()+' '+data.lastName.toLocaleUpperCase() ;
    }
    return data.title.capitalize()+' '+data.firstName.capitalize()+' '+data.lastName.toLocaleUpperCase() ;
}



export const fusionGroups = [

TSTest.group("Fusion tests", async (group) => {
    const p = new PI('M.', 'John', 'Smith') ;
    p.addCollaborator({title:'M.', firstName:'John', lastName:'Adams', isMan:true}) ;
    p.addCollaborator({title:'gal',firstName:'Georges', lastName:'Washington', isMan:true}) ;
    const glob = { job:"Consultant", nameColor:'&w', lastNameColor:'&c' } ;
    const mac = TSCharset.macCharset() ;
    const ansi = TSCharset.ansiCharset() ;
    
    group.unary("the templates built from a plain array report an element which is not a byte under the called function", async(t) => {
        const nb = (fn:string) => (e:any) => e?.message === `${fn}: element #1 (300) is not a byte (an integer from 0 to 255).` ;
        const bad = [65, 300] as any ;
        t.expect0(() => TSFusionTemplate.fromData(bad)).throws(nb('TSDataTemplate.fromData()')) ;
        t.expect1(() => TSDataTemplate.fromData(bad)).throws(nb('TSDataTemplate.fromData()')) ;
        t.expect2(() => TSFusionTemplate.fromHTMLData(bad)).throws(nb('TSHTMLTemplate.fromHTMLData()')) ;
        t.expect3(() => new TSHTMLTemplate(bad)).throws(nb('new TSHTMLTemplate()')) ;
        t.expect4(() => new TSDataTemplate(bad, TSCharset.utf8Charset())).throws(nb('new TSDataTemplate()')) ;
        t.expect5(TSFusionTemplate.fromData([...Buffer.from('a{{b}}')] as any)).notnull() ; // a valid array is accepted
    }) ;

    group.unary("String untouched", async(t) => {
        const s = ' Ceci est une belle chaîne de {\n caractères}' ;
        const template = TSFusionTemplate.fromString(s, { debugParsing:false }) ;
        if (t.expect0(template).OK()) {
            let errors:string[] = [] ;
            const res = template!.fusionWithDataContext({myData:1}, {}, errors) ;
            t.register('template', $inspect(template?.source)) ;
            t.register('errors', $inspect(errors)) ;
            t.expect1(res).is(s) ;
        }
    }) ;
    group.unary("fusionStringWithDataContext() is an exact alias of fusionWithDataContext()", async(t) => {
        const s = 'Cette lettre est adressée à {{title}} {{firstName}} {{lastName}}' ;
        const template = TSFusionTemplate.fromString(s, { debugParsing:false }) ;
        if (t.expect0(template).OK()) {
            const errors1:string[] = [] ;
            const errors2:string[] = [] ;
            const res1 = template!.fusionWithDataContext(p, glob, errors1) ;
            const res2 = template!.fusionStringWithDataContext(p, glob, errors2) ;
            t.expect1(res2).is(res1) ;
            t.expect2(errors2).is(errors1) ;
        }
    }) ;

    group.unary("Simple vars replacement", async(t) => {
        const s = 'Cette lettre est adressée à {{title}} {{firstName}} {{lastName}} ({{$job}}) [{{_index}}, {{_count}}]' ;
        const q = 'Cette lettre est adressée à {{@title}} {{firstName}} {{@lastName}} ({{$job}}) [{{_index}}, {{_count}}]' ;
        const r = 'Cette lettre est adressée à M. John Smith (Consultant) [0, 1]' ;
        const template = TSFusionTemplate.fromString(q, { debugParsing:false }) ;
        const data = {title:'M.', firstName:'John', lastName:'Smith'} ;
        if (t.expect0(template).OK()) {
            let errors:string[] = [] ;
            const res = template!.fusionWithDataContext(data, glob, errors) ;
            t.register('errors', $inspect(errors)) ;
            t.expect1(res).is(r) ;

            t.expectA(template?.globalVariables).is(['job']) ;
            t.expectB(template?.userVariables).is([]) ;
            t.expectC(template?.systemVariables).toBeUnordered(['count', 'index']) ;
            t.expectD(template?.rootVariables).toBeUnordered(['title', 'lastName']) ;
            t.expectE(template?.localVariables).is(['firstName']) ;
            t.expectY(template?.variables).toBeUnordered(['title', 'firstName', 'lastName', 'job', 'index', 'count']) ;
            t.expectZ(template?.variables).toBeUnordered(['job', 'index', 'firstName', 'title', 'lastName', 'count']) ; // this one is for testing the tester
        }

        const template2 = TSFusionTemplate.fromString(s) ;
        if (t.expect2(template2).OK()) {
            let errors1:string[] = [] ;
            const res = template2!.fusionWithDataContext(data, glob, errors1) ;
            t.register('errors(1)', $inspect(errors1)) ;
            t.expect3(res).is(r) ;

            let errors2:string[] = [] ;
            const res2 = template2?.fusionWithDataContext(new P('M.', 'John', 'Smith'), glob, errors2) ;
            t.register('errors(2)', $inspect(errors2)) ;
            t.expect4(res2).is(r) ;

            let errors3:string[] = [] ;
            const res3 = template2?.fusionWithDataContext(p, glob, errors3) ;
            t.register('errors(3)', $inspect(errors3)) ;
            t.expect5(res3).is(r) ;
        }

    }) ;
    group.unary("System vars", async(t) => {
        const s = "{{items#:[{{_index}},{{_position}},{{_count}},{{_remaining}}]\n}}" ;
        const template = TSFusionTemplate.fromString(s, { debugParsing:false }) ;
        if (t.expect0(template).OK()) {
            let errors:string[] = [] ;
            const res = template?.fusionWithDataContext({items:["one", "two", "three", "four"]}, glob, errors) ;
            t.register('errors', $inspect(errors)) ;
            t.expect1(res).is("[0,1,4,3]\n[1,2,4,2]\n[2,3,4,1]\n[3,4,4,0]\n") ;
        }
    }) ;
    group.unary("Simple vars replacement with parameters", async(t) => {
        const D = new TSDate(1945, 5, 8, 23, 1, 3) ; // nearly 3 seconds after armistice signature
        const context = {
            starter:"Nous sommes",
            streamLen:3,
            toto:{
                date:D
            }
        } ;
        const s = "{{starter}} le {{toto.date.toString('%A, %e %B %Y à %Hh%M')}}. Le fil fait {{streamLen#:{{$meters(current,0)}}}}." ;

        const template = TSFusionTemplate.fromString(s, { debugParsing:false, addStandardGlobalFunctions:true }) ;
        if (t.expect0(template).OK()) {
            let errors:string[] = [] ;
            const res = template?.fusionWithDataContext(context, glob, errors) ;
            t.register('errors', $inspect(errors)) ;
            t.expect1(res).is("Nous sommes le mardi, 8 mai 1945 à 23h01. Le fil fait 3 m.") ;
        }
        
        const sA = "Nous sommes le {{toto.date.dateByAdding(0,0,1,0,2)#:{{self.toString('%A, %e %B %Y à \\\"%Hh%M\\\"')}}}}." ;
        const templateA = TSFusionTemplate.fromString(sA, { debugParsing:false }) ;
        const expResA = "Nous sommes le mercredi, 9 mai 1945 à \"23h03\"." ; 
        if (t.expectA(templateA).OK()) {
            let errors:string[] = [] ;
            const resA = templateA?.fusionWithDataContext({ toto:{ date: D}}, glob, errors) ;
            t.register('errors{A}', $inspect(errors)) ;
            t.expectB(resA).is(expResA) ;
        }
        const sX = "Nous sommes le {{toto.date.dateByAdding(0,0,1,0,2,6)#:{{toString('%A, %e %B %Y \\U00e0 \\\"%Hh%M\\\"')}}}}." ;
        const templateX = TSFusionTemplate.fromString(sX, { debugParsing:false }) ;
        if (t.expectX(templateA).OK()) {
            let errors:string[] = [] ;
            const resX = templateX?.fusionWithDataContext({ toto:{ date: D}}, glob, errors) ;
            t.register('errors{X}', $inspect(errors)) ;
            t.expectY(resX).is(expResA) ;
        }

    }) ;

    group.unary("Replacements with enclosing contexts", async(t) => {
        const s = 'Cette lettre est adressée à {{.title}} {{@firstName}} {{.self.lastName}}{{collaborators.length?:\nCollaborators:\n{{.collaborators#:{{_position}} - {{title}} {{self.firstName}} {{.lastName}} [{{..test}}]{{_remaining?:,}}\n}}}}' ;
        const template = TSFusionTemplate.fromString(s, { debugParsing:false }) ;
        const resC = 'Cette lettre est adressée à M. John Smith\nCollaborators:\n1 - M. John Adams [T],\n2 - gal Georges Washington [T]\n' ;
        if (t.expect0(template).OK()) {
            let errors:string[] = [] ;
            const res4 = template?.fusionWithDataContext(p, glob, errors) ;
            t.register('errors{0}', $inspect(errors)) ;
            t.expect1(res4).is(resC) ;
        }
        const d = TSData.fromString(s, mac) ;
        if (t.expect2(d).OK()) {
            const templateA = TSFusionTemplate.fromData(d!, mac, { debugParsing:false })
            if (t.expectA(templateA).OK()) {
                let errors:string[] = [] ;
                const resA = templateA?.fusionWithDataContext(p, glob, errors) ;
                t.register('errors{A}', $inspect(errors)) ;
                t.expectB(resA).OK() ;
                t.expectC(resA?.toString(mac)).is(resC) ;
                let errorsBis:string[] = [] ;
                const resAM = templateA?.fusionStringWithDataContext(p, glob, errorsBis) ;
                t.register('errors{A-bis}', $inspect(errorsBis)) ;
                t.expectD(resAM).OK() ;
                t.expectE(resAM).is(resC) ;
            }
        }
    }) ;

    group.unary("Replacements with enclosing contexts and a procedure", async(t) => {
        const s = '&0Cette lettre est adressée à {{title}} {{firstName}} {{lastName}}{{collaborators.length?:\nCollaborators:\n{{collaborators#:{{_position}} - {{*name}}{{_remaining?:,}}\n}}}}' ;
        const s2 = '&0Cette lettre est adressée à =[title]= =[.firstName]= =[@lastName]==[collaborators.length?&&\nCollaborators:\n=[.collaborators#&&=[_position]= - =[*name]==[_remaining?&&,]=\n]=]=' ;
        const s4 = '&0Cette lettre est adressée à =[title]= =[firstName]= =[lastName]==[collaborators.length?=\nCollaborators:\n=[collaborators#==[_position]= - =[*name]==[_remaining?=,]=\n]=]=' ;
        const resC = '&0Cette lettre est adressée à M. John Smith\nCollaborators:\n1 - &wM. John &cADAMS&0,\n2 - &wGal Georges &cWASHINGTON&0\n' ;
        const template = TSFusionTemplate.fromString(s, { 
            debugParsing:false, 
            procedures:{ name:richTextName } 
        }) ;
        if (t.expect0(template).OK()) {
            let errors:string[] = [] ;
            const res = template?.fusionWithDataContext(p, glob, errors) ;
            t.register('errors/0', $inspect(errors)) ;
            t.expect1(res).is(resC) ;

            t.expectA(template?.globalVariables).is([]) ;
            t.expectB(template?.userVariables).is([]) ;
            t.expectC(template?.variables).toBeUnordered(['title', 'firstName', 'lastName', 'collaborators', 'position', 'remaining', 'name']) ;
            t.expectD(template?.procedures).is(['name']) ;
            t.expectE(template?.localVariables).toBeUnordered(['firstName', 'lastName', 'title', 'collaborators']) ;
            t.expectF(template?.systemVariables).toBeUnordered(['remaining', 'position']) ;
        }
        const template2 = TSFusionTemplate.fromString(s2, {
            debugParsing:false, 
            procedures:{ name:richTextName },
            startingMark:'=[',
            endingMark:']=',
            separator:'&&'
        }) ;
        if (t.expect2(template2).OK()) {
            let errors:string[] = [] ;
            const res = template2?.fusionWithDataContext(p, glob, errors) ;
            t.register('errors/2', $inspect(errors)) ;
            t.expect3(res).is(resC) ;
        }
        const template4 = TSFusionTemplate.fromString(s4, {
            debugParsing:false, 
            procedures:{ name:richTextName },
            startingMark:'=[',
            endingMark:']=',
            separator:'='
        }) ;
        t.expect4(template4).KO() ;

        const template5 = TSFusionTemplate.fromString(s, {
            debugParsing:false, 
            procedures:{ richTextName:richTextName }, // richTextName procedure will never be called since we exepect a '*name' proc in template
        }) ;
        if (t.expect5(template5).OK()) {
            const errors:string[] = [] ;
            const res = template5?.fusionWithDataContext(p, glob, errors) ;
            const truncatedResult = '&0Cette lettre est adressée à M. John Smith\nCollaborators:\n1 - ,\n2 - \n' ;
            t.expect6(res).is(truncatedResult) ;
            if (!t.expect7(errors.length).is(4)) {
                const print = errors.map(s => s.includes('!ERROR!:') ? '&R&w ERROR &0&o'+s.slice(7)+'&0' : '&a'+s+'&0')
                group.description('Errors and warnings from &0&pexpect7()&y:\n&o'+print.join('\n')) ;
            }
        }

    }) ;

    group.unary("HTML Replacements with enclosing contexts, a procedure", async(t) => {
        const s = '<!doctype html><html><head><meta charset="MacRoman"></head><body><div>Lettre adressée à {{title}} {{firstName}} {{lastName}}</div><fusion type="if" path="collaborators.length"><div style="background:red;"><h2>Collaborators:</h2><ul><fusion type="enum" path="collaborators"><li>[{{_position}}] {{*name}}{{_remaining?:,}}</li></fusion></ul></fusion></body></html>' ;
        const i = '<!doctype html><html><head><meta charset="MacRoman"></head><body><div>Lettre adressée à {{title}} {{firstName}} {{lastName}}</div>{{.collaborators.length?:<div style="background:red;"><h2>Collaborators:</h2><ul>{{.collaborators#:<li>[{{_position}}] {{*name}}{{_remaining?:,}}</li>}}</ul>}}</body></html>' ;
        const d = TSData.fromString(s, mac) ;
        const p1 = p.clone() ;
        p1.addCollaborator({title:'Général', firstName:'Charles', lastName:'de Gaulle'}) ;
        const r = '<!doctype html><html><head><meta charset="MacRoman"></head><body><div>Lettre adressée à M. John Smith</div><div style="background:red;"><h2>Collaborators:</h2><ul><li>[1] M. John ADAMS,</li><li>[2] Gal Georges WASHINGTON,</li><li>[3] G&eacute;n&eacute;ral Charles DE GAULLE</li></ul></body></html>' ;

        if (t.expect0(d).OK()) {
            const template = TSFusionTemplate.fromHTMLData(d!, { 
                debugParsing:false, 
                procedures:{ name:htmlName } 
            }) ;
            
            t.expectZ(template).OK() ;

            if (t.expect1(template?.source.toString(mac)).is(i)) {
                let errors:string[] = [] ;
                const res = template?.fusionStringWithDataContext(p1, glob, errors) ;
                t.register('errors[1]', $inspect(errors)) ;
                t.expect2(res).is(r) ;
            }        
        }

        const s2 = '<!doctype html><html><head><meta charset="MacRoman"></head><body><div>Lettre adressée à {{title}} {{firstName}} {{lastName}}</div><fusion type="if" path="collaborators.length"><div style="background:red;"><h2>Collaborators:</h2><ul><fusion type="enum" path="collaborators"><li>[{{_position}}] <fusion context="function" path="name">{{_remaining?:,}}</li></fusion></ul></fusion></body></html>' ;
        const d2 = TSData.fromString(s2, mac) ;
        if (t.expect4(d2).OK()) {
            const template = TSFusionTemplate.fromHTMLData(d2!, { 
                debugParsing:false, 
                procedures:{ name:htmlName } 
            }) ;
            t.expect5(template?.source.toString(mac)).is(i) ;
        }

        const s3 = '<!doctype html><html><head><meta charset="MacRoman"></head><body><div>Lettre adressée à <fusion path=title> <fusion path = "firstName"  / > <fusion   path   =   lastName    /></div><fusion type="if" path="collaborators.length"><div style="background:red;"><h2>Collaborators:</h2><ul><fusion type="enum" path="collaborators"><li>[<fusion context="system" path="position" />] <fusion context="function" path="name"><fusion context="sys" path="remaining" type="test">,</fusion></li></fusion  ></ul></fusion ></body></html>' ;
        const d3 = TSData.fromString(s3, ansi) ;
        if (t.expect6(d3).OK()) {
            const i3 = '<!doctype html><html><head><meta charset="MacRoman"></head><body><div>Lettre adressée à {{.title}} {{.firstName}} {{.lastName}}</div>{{.collaborators.length?:<div style="background:red;"><h2>Collaborators:</h2><ul>{{.collaborators#:<li>[{{_position}}] {{*name}}{{_remaining?:,}}</li>}}</ul>}}</body></html>' ;
            const template = TSFusionTemplate.fromHTMLData(d3!, { 
                debugParsing:false, 
                procedures:{ name:htmlName } 
            }) ;
            if (t.expect7(template?.source.toString(ansi)).is(i3)) {
                let errors:string[] = [] ;
                const res = template?.fusionWithDataContext(p1, glob, errors) ;
                t.register('errors[3]', $inspect(errors)) ;
                t.expect8(res).OK() ;
                t.expect9(res?.toString(ansi)).is(r) ;
            }
        }

        const s4 = '<!doctype html><html><head><meta charset="MacRoman"></head><body><div>Lettre adressée à <fusion path=title> <fusion path = "firstName"  / > <fusion   path   =   lastName    /></div><fusion type="if" path="collaborators.length"><div style="background:red;"><h2>Collaborators:</h2><ul><fusion type="enum" path="collaborators"><li>[<fusion context="system" path="position" />] <fusion context="function" path="name"><fusion context="sys" path="remaining" type="test">,</fusion></li></fusion  ></ul></fusion ><fusion path="insideHTML.toHTMLContent"></body></html>' ;
        const d4 = TSData.fromString(s4, ansi) ;
        if (t.expectA(d4).OK()) {
            const i4 = '<!doctype html><html><head><meta charset="MacRoman"></head><body><div>Lettre adressée à {{.title}} {{.firstName}} {{.lastName}}</div>{{.collaborators.length?:<div style="background:red;"><h2>Collaborators:</h2><ul>{{.collaborators#:<li>[{{_position}}] {{*name}}{{_remaining?:,}}</li>}}</ul>}}{{.insideHTML.toHTMLContent}}</body></html>' ;
            const r4 = '<!doctype html><html><head><meta charset="MacRoman"></head><body><div>Lettre adressée à M. John Smith</div><div style="background:red;"><h2>Collaborators:</h2><ul><li>[1] M. John ADAMS,</li><li>[2] Gal Georges WASHINGTON,</li><li>[3] G&eacute;n&eacute;ral Charles DE GAULLE</li></ul><div style="background:#FF00">Ceci est assur&eacute;ment une r&eacute;ussite</div></body></html>' ;
            const template = TSFusionTemplate.fromHTMLData(d4!, { 
                debugParsing:false, 
                procedures:{ name:htmlName } 
            }) ;
            if (t.expectB(template?.source.toString(ansi)).is(i4)) {
                let errors:string[] = [] ;
                const res = template?.fusionWithDataContext(p1, glob, errors) ;
                t.register('errors[4]', $inspect(errors)) ;
                t.expectC(res).OK() ;
                t.expectD(res?.toString(ansi)).is(r4) ;
            }
        }

    }) ;
}),

TSTest.group("Fusion — operators, params, constants", async (group) => {
    const S = (s:string, data:any, opts:any = {}) => {
        const tpl = TSFusionTemplate.fromString(s, opts) ;
        if (!tpl) return { r:undefined as any, e:['PARSE-NULL'] } ;
        const e:string[] = [] ;
        return { r:tpl.fusionWithDataContext(data, {}, e), e } ;
    } ;

    group.unary('negative test {{path!:...}}', async (t) => {
        t.expect0(S('{{flag!:HIDDEN}}', { flag:true }).r).is('') ;
        t.expect1(S('{{flag!:SHOWN}}', { flag:false }).r).is('SHOWN') ;
        t.expect2(S('{{missing!:SHOWN}}', {}).r).is('SHOWN') ;
        t.expect3(S('{{items.length!:EMPTY}}', { items:[] }).r).is('EMPTY') ;
        t.expect4(S('{{items.length!:EMPTY}}', { items:[1] }).r).is('') ;
    }) ;

    group.unary('positive test & nested test/enum', async (t) => {
        t.expect0(S('{{n?:YES}}', { n:0 }).r).is('') ;          // 0 is falsy
        t.expect1(S('{{n?:YES}}', { n:5 }).r).is('YES') ;
        t.expect2(S('{{s?:YES}}', { s:'' }).r).is('') ;
        t.expect3(S('{{a?:{{b#:[{{self}}]}}}}', { a:1, b:['x', 'y'] }).r).is('[x][y]') ;
        t.expect4(S('{{items.length?:HAS}}', { items:[1, 2] }).r).is('HAS') ;
    }) ;

    group.unary('enumeration system variables', async (t) => {
        const res = S('{{items#:{{_position}}/{{_count}}/{{_remaining}}/{{_index}} }}', { items:['a', 'b', 'c'] }).r ;
        t.expect0(res).is('1/3/2/0 2/3/1/1 3/3/0/2 ') ;
        t.expect1(S('{{x#:[{{self}}]}}', { x:'solo' }).r).is('[solo]') ;   // enum on a scalar -> single iteration
    }) ;

    group.unary('method calls & parameter literals', async (t) => {
        t.expect0(S("{{d.toString('%Y-%m-%d')}}", { d:new TSDate(2020, 3, 15) }).r).is('2020-03-15') ;
        t.expect1(S('{{o.f(42)}}', { o:{ f:(n:number) => n * 2 } }).r).is('84') ;
        t.expect2(S('{{o.f(-5)}}', { o:{ f:(n:number) => n + 1 } }).r).is('-4') ;
        t.expect3(S('{{o.f(1,2,3)}}', { o:{ f:(a:number, b:number, c:number) => a + b + c } }).r).is('6') ;
        t.expect4(S("{{o.f('hi')}}", { o:{ f:(s:string) => s.toUpperCase() } }).r).is('HI') ;
        t.expect5(S('{{o.f(true)}}', { o:{ f:(b:any) => b === true ? 'T' : 'F' } }).r).is('T') ;
        t.expect6(S('{{o.f(NaN)}}', { o:{ f:(x:any) => Number.isNaN(x) ? 'NAN' : '?' } }).r).is('NAN') ;
        t.expect7(S('{{o.g(2,undefined)}}', { o:{ g:(a:number, b:any) => `${a}:${b}` } }).r).is('2:undefined') ;
        t.expect8(S('{{o.f(PAST)}}', { o:{ f:(d:any) => (d?.isEqual && d.isEqual(TSDate.past())) ? 'ISPAST' : '?' } }).r).is('ISPAST') ;
    }) ;

    group.unary('standard global functions (in nested form)', async (t) => {
        const o = { addStandardGlobalFunctions:true } ;
        t.expect0(S('[{{x#:{{$max(3,9)}}}}]', { x:1 }, o).r).is('[9]') ;
        t.expect1(S('[{{x#:{{$bytes(1536,1)}}}}]', { x:1 }, o).r).is('[1.5 ko]') ;
        t.expect2(S('[{{n#:{{$meters(current,0)}}}}]', { n:5 }, o).r).is('[5 m]') ;
    }) ;

    group.unary('value rendering by type', async (t) => {
        t.expect0(S('v={{n}}', { n:3.14 }).r).is('v=3.14') ;
        t.expect1(S('v={{b}}', { b:false }).r).is('v=false') ;
        t.expect2(S('v={{d}}', { d:new TSDate(2020, 1, 1) }).r).is('v=2020-01-01T00:00:00') ;
        t.expect3(S('v={{d}}', { d:TSData.fromString('abc') }).r).is('v=abc') ;
    }) ;

    group.unary('error reporting', async (t) => {
        const miss = S('[{{nope}}]', {}) ;
        t.expect0(miss.r).is('[]') ;
        t.expect1(miss.e.some(m => m.startsWith('WARNING:'))).true() ;

        const noProc = S('{{*noproc}}', {}, {}) ;
        t.expect2(noProc.e.some(m => m.includes('Procedure noproc() does not exist'))).true() ;

        const throwProc = S('{{*boom}}', {}, { procedures:{ boom:() => { throw new Error('x') ; } } }) ;
        t.expect3(throwProc.e.some(m => m.includes('Procedure boom() execution did fail'))).true() ;

        const dotted = S('{{*a.b}}', {}, { procedures:{} }) ;
        t.expect4(dotted.e.some(m => m.includes('Malformed procedure name'))).true() ;
    }) ;

    group.unary('parse failures return null', async (t) => {
        t.expect0(TSFusionTemplate.fromString(null as any)).null() ;
        t.expect1(TSFusionTemplate.fromString('hello {{unbalanced')).null() ;
        t.expect2(TSFusionTemplate.fromString('x', { startingMark:'' })).null() ;             // marks may not be empty
        t.expect3(TSFusionTemplate.fromString('x', { separator:'=' })).null() ;               // separator collides with a mark char class
        t.expect4(TSFusionTemplate.fromData(Buffer.from('x'), 'hex')).null() ;                // forbidden encoding
        t.expect5(TSFusionTemplate.fromData(Buffer.from('x'), 'utf16le')).null() ;
    }) ;

    group.unary('fromData / fromHTMLData round-trips', async (t) => {
        const d = TSData.fromString('Hi {{name}}') ;
        const tpl = TSFusionTemplate.fromData(d!) ;
        t.expect0(tpl).OK() ;
        const e1:string[] = [] ;
        t.expect1(tpl!.fusionStringWithDataContext({ name:'Bob' }, {}, e1)).is('Hi Bob') ;

        const h = TSData.fromString('<p>Hi <fusion path="name"/></p>') ;
        const htpl = TSFusionTemplate.fromHTMLData(h!) ;
        t.expect2(htpl).OK() ;
        const e2:string[] = [] ;
        t.expect3(htpl!.fusionStringWithDataContext({ name:'Bob' }, {}, e2)).is('<p>Hi Bob</p>') ;
    }) ;

    group.unary('enumeration over Set / Map and key-path error reporting', async (t) => {
        const run = (s:string, data:any) => {
            const errors:string[] = [] ;
            const tpl = TSFusionTemplate.fromString(s, { debugParsing:false }) ;
            const res = tpl!.fusionStringWithDataContext(data, {}, errors) ;
            return { res, errors:errors.join('\n') } ;
        } ;

        t.expect0(run("{{tags#:[{{self}}]}}", { tags:new Set(['a', 'b', 'c']) }).res).is('[a][b][c]') ;
        t.expect1(run("{{m#:{{key}}={{value}} }}", { m:new Map([['x', 1], ['y', 2]]) }).res).is('x=1 y=2 ') ;

        t.expect2(run("{{a..b}}", { a:{ b:1 } }).errors.includes("contains internal '..'")).true() ;
        t.expect3(run("{{a.zz}}", { a:{ b:1 } }).errors.includes("unknown method or property 'zz'")).true() ;
        t.expect4(run("{{a.foo}}", { a:{ foo:(x:number) => x } }).errors.includes("is not a simple accessor")).true() ;
        t.expect5(run("{{a.n}}", { a:{ n:Number.NaN } }).errors.includes("would return NaN which was transformed to null")).true() ;
    }) ;
}),

TSTest.group("Fusion — template introspection & capacity", async (group) => {

    group.unary('per-context variable predicates', async (t) => {
        const tpl = TSFusionTemplate.fromString("{{$g}}|{{+u}}|{{_sys}}|{{@r}}|{{.l}}|{{*p}}") ;
        if (!t.expect0(tpl).OK()) { return ; }

        // isVariable() / unknown variable
        t.expectA(tpl!.isVariable('g')).true() ;
        t.expectB(tpl!.isVariable('l')).true() ;
        t.expectC(tpl!.isVariable('nope')).false() ;

        // typed predicates — positive cases (also exercises isVariableOfType())
        t.expectD(tpl!.isGlobalVariable('g')).true() ;
        t.expectE(tpl!.isUserVariable('u')).true() ;
        t.expectF(tpl!.isSystemVariable('sys')).true() ;
        t.expectG(tpl!.isRootVariable('r')).true() ;
        t.expectH(tpl!.isLocalVariable('l')).true() ;
        t.expectI(tpl!.isProcedure('p')).true() ;

        // typed predicates — negative cases
        t.expectJ(tpl!.isGlobalVariable('u')).false() ;      // known variable, wrong context
        t.expectK(tpl!.isProcedure('unknown')).false() ;     // unknown variable altogether
        t.expectL(tpl!.isUserVariable('g')).false() ;
    }) ;

    group.unary('capacity getter / setter', async (t) => {
        const tpl = TSFusionTemplate.fromString("Hello {{name}}, welcome !") ;
        if (!t.expect0(tpl).OK()) { return ; }

        const base = tpl!.capacity ;
        t.expect1(base).gt(0) ;

        tpl!.capacity = base * 8 ;              // larger request -> capacity grows
        t.expect2(tpl!.capacity).gt(base) ;

        const grown = tpl!.capacity ;
        tpl!.capacity = 1 ;                     // smaller request -> capacity unchanged
        t.expect3(tpl!.capacity).is(grown) ;
    }) ;

    group.unary('forbidden special character inside a mark', async (t) => {
        // a FUSION special char ('@') in the starting mark must abort parsing
        t.expect0(TSFusionTemplate.fromString("a rather long template body here", { startingMark:'@{' })).null() ;
        t.expect1(TSFusionTemplate.fromString("a rather long template body here", { endingMark:'#}' })).null() ;
        t.expect2(TSFusionTemplate.fromString("a rather long template body here", { separator:'*' })).null() ;
    }) ;

    group.unary('malformed variable declarations abort parsing', async (t) => {
        const KO = (s:string) => TSFusionTemplate.fromString(s) ;

        t.expect0(KO("{{)x}}")).null() ;              // forbidden initial variable character
        t.expect1(KO("{{.9}}")).null() ;              // forbidden character right after a leading dot
        t.expect2(KO("{{ab)cd}}")).null() ;           // forbidden character inside a variable name
        t.expect3(KO("{{name x}}")).null() ;          // neither separator nor ending mark after the name
        t.expect4(KO("{{name:x}}")).null() ;          // separator on a non-container variable
        t.expect5(KO("{{items# }}")).null() ;         // container variable without its separator
        t.expect6(KO("{{name}x}}")).null() ;          // broken ending mark
        t.expect7(KO("{{a}} then a stray }} here")).null() ; // supernumerary ending mark
    }) ;

    group.unary('malformed parameters abort parsing', async (t) => {
        const KO = (s:string) => TSFusionTemplate.fromString(s) ;

        t.expect0(KO("{{f(&)}}")).null() ;            // forbidden character where a parameter is expected
        t.expect1(KO("{{f(1x)}}")).null() ;           // non-numeric character in a numeric parameter
        t.expect2(KO("{{f(trX)}}")).null() ;          // wrong character while decoding a constant parameter
        t.expect3(KO("{{f(1 2)}}")).null() ;          // missing comma between parameters
        t.expect4(KO("{{f(1)x}}")).null() ;           // junk right after the closing parenthesis
        t.expect5(KO('{{f(|{ nope |)}}')).null() ;    // unparsable JSON parameter
        t.expect6(KO('{{f("\\uZZZZ")}}')).null() ;    // bad hexadecimal in a \\u escape
    }) ;

    group.unary('debug parsing mode produces a template', async (t) => {
        // exercises the debugParsing logging paths + TSFusionTreeNode.label
        const tpl = TSFusionTemplate.fromString('Hi {{name}} {{items#:[{{self}}]}} {{flag?:Y}}', { debugParsing:true }) ;
        if (t.expect0(tpl).OK()) {
            const e:string[] = [] ;
            const r = tpl!.fusionWithDataContext({ name:'Bob', items:[1, 2], flag:true }, {}, e) ;
            t.expect1(r).is('Hi Bob [1][2] Y') ;
        }
        // debug parsing on a broken template still returns null (logs the error)
        t.expect2(TSFusionTemplate.fromString('broken {{unclosed', { debugParsing:true })).null() ;
        t.expect3(TSFusionTemplate.fromHTMLData(Buffer.from('<p><fusion path="x"></p>'), { debugParsing:true })).OK() ;
    }) ;

    group.unary('fusion runtime — contexts, key-path errors, user log', async (t) => {
        const F = (s:string, data:any, opts:any = {}) => {
            const tpl = TSFusionTemplate.fromString(s, opts) ;
            const e:string[] = [] ;
            const r = tpl ? tpl.fusionWithDataContext(data, opts.globalContext ?? {}, e) : null ;
            return { r, e } ;
        } ;

        // user context {{+var}} resolves against the global context
        t.expect0(F('{{+job}}', {}, { globalContext:{ job:'Dev' } }).r).is('Dev') ;

        // system {{_log(...)}} pushes a USERLOG entry and renders nothing
        const logged = F('[{{_log("hello")}}]', {}, { addStandardGlobalFunctions:true }) ;
        t.expect1(logged.r).is('[]') ;
        t.expect2(logged.e.some(m => m === 'USERLOG:hello')).true() ;

        // a throwing getter on the data bubbles up to the outer catch -> null + "Fusion did encounter error"
        const boom = F('{{x}}', { get x() { throw new Error('kaboom') ; } }) ;
        t.expect3(boom.r).null() ;
        t.expect4(boom.e.some(m => m.includes('Fusion did encounter error'))).true() ;

        // too many leading dots underflows the stack
        t.expect5(F('{{....x}}', { x:1 }).e.some(m => m.includes('underflow the stack'))).true() ;

        // a zero-arg accessor that throws
        t.expect6(F('{{o.boom}}', { o:{ boom:() => { throw new Error('x') ; } } }).e.some(m => m.includes('execution did fail'))).true() ;

        // parameters applied to a non-function property
        t.expect7(F('{{o.p(1)}}', { o:{ p:42 } }).e.some(m => m.includes("unknown method 'p()'"))).true() ;

        // a procedure that injects into the local context, then a local var that only exists in the data
        const proc = (_d:any, _r:any, local:TSDictionary) => { local.injected = 'I' ; return 'P' ; } ;
        t.expect8(F('{{*p}}{{.injected}}/{{.realKey}}', { realKey:'R' }, { procedures:{ p:proc } }).r).is('PI/R') ;
    }) ;
}),

TSTest.group("Fusion — procedures, contexts and key paths", async (group) => {
    const F = (s:string, data:any, glob:TSDictionary = {}, procedures:TSDictionary = {}) => {
        const tpl = TSFusionTemplate.fromString(s, { procedures:procedures }) ;
        const e:string[] = [] ;
        return { r:tpl?.fusionWithDataContext(data, glob, e), e:e } ;
    } ;

    group.unary('procedure arguments inside an enumeration', async (t) => {
        const seen:any[] = [] ;
        const info = (d:any, r:any, _l:TSDictionary, g:TSDictionary, s:TSDictionary) => {
            seen.push([d, r.title, g.gk, s.index, s.count, s.position, s.remaining]) ;
            s.index = 99 ;  // the procedure receives a copy of the system context
            return `<${d}>` ;
        } ;
        const res = F('{{items#:{{*info}}{{_index}};}}', { title:'T', items:['a', 'b'] }, { gk:'G' }, { info:info }) ;
        t.expect0(res.r).is('<a>0;<b>1;') ;             // the modified copy does not change {{_index}}
        t.expect1(res.e).is([]) ;
        t.expect2(seen).is([['a', 'T', 'G', 0, 2, 1, 1], ['b', 'T', 'G', 1, 2, 2, 0]]) ;
    }) ;

    group.unary('local context written by a procedure', async (t) => {
        const setx = (d:any, _r:any, l:TSDictionary) => { if (d.flag) { l.x = 'LOCAL' ; } return '' ; } ;
        const tpl = TSFusionTemplate.fromString('[{{*setx}}][{{x}}][{{y}}]', { procedures:{ setx:setx } }) ;
        if (!t.expect0(tpl).OK()) { return ; }
        // the local context is predominant over the data, which is used for the other keys
        // without any warning about the key 'y' which is not in the local context
        const e1:string[] = [] ;
        t.expect1(tpl!.fusionWithDataContext({ flag:true, x:'DATA', y:'Y' }, {}, e1)).is('[][LOCAL][Y]') ;
        t.expect2(e1).is([]) ;
        // the local contexts are cleaned at the beginning of each fusion
        t.expect3(tpl!.fusionWithDataContext({ flag:false, x:'DATA', y:'Y' }, {}, [])).is('[][DATA][Y]') ;
        // a key found neither in the local context nor in the data is still reported for both
        const e2:string[] = [] ;
        t.expect4(tpl!.fusionWithDataContext({ flag:true, x:'DATA' }, {}, e2)).is('[][LOCAL][]') ;
        t.expect5(e2).is([
            "WARNING: unknown method or property 'y' in local context.",
            "!ERROR!: unknown method or property 'y' in target object.",
            "WARNING: value returned for 'y' was undefined or null and should have result in data to merge in fusion.",
        ]) ;
    }) ;

    group.unary('local contexts of the template levels', async (t) => {
        const set = (d:any, _r:any, l:TSDictionary) => { l.mark = `M-${d.id ?? d}` ; return '' ; } ;
        // inside an enumeration, each iteration has its own local context
        const r1 = F('{{items#:[{{.mark}}{{*set}}{{.mark}}]}}', { items:[{ id:1 }, { id:2 }] }, {}, { set:set }) ;
        t.expect0(r1.r).is('[M-1][M-2]') ;                          // nothing before the procedure call in each iteration
        t.expect1(r1.e.filter(m => m.startsWith('WARNING: value returned for')).length).is(2) ;
        // a test block does not create a new level: its local context is the one of the enclosing level
        const r2 = F('{{flag?:{{*set}}}}[{{.mark}}]', { flag:true, id:'R' }, {}, { set:set }) ;
        t.expect2(r2.r).is('[M-R]') ;
        t.expect3(r2.e).is([]) ;
        // the local context of an iteration does not leak to the enclosing level
        const r3 = F('{{items#:{{*set}}}}[{{mark}}]', { items:['a'], mark:'DATA' }, {}, { set:set }) ;
        t.expect4(r3.r).is('[DATA]') ;
        // an enumerated data item with a '_localContext' property is not used as a local context
        const r4 = F('{{items#:[{{mark}}]}}', { items:[{ _localContext:{ mark:'HIDDEN' }, mark:'ITEM' }] }) ;
        t.expect5(r4.r).is('[ITEM]') ;
    }) ;

    group.unary('global, user, root and system contexts', async (t) => {
        const res = F('[{{+u}}][{{$u}}][{{@title}}][{{items#:{{@title}}{{_count}}{{..title}}{{self}}|}}]', { title:'T', items:['a', 'b'] }, { u:'U' }) ;
        t.expect0(res.r).is('[U][U][T][T2Ta|T2Tb|]') ;   // '+' user variables are read in the global context
        t.expect1(res.e).is([]) ;
    }) ;

    group.unary('key path walk: self, accessors and NaN', async (t) => {
        class Person {
            constructor(public name:string) {}
            public nanfn() { return Number.NaN ; }
            public get me() { return this ; }
        }
        const res = F('[{{p.self.name}}][{{p.me.name}}][{{p.nanfn}}][{{ps#:{{fails}}}}]', { p:new Person('ann'), ps:[{ fails() { throw new Error('x') ; } }] }) ;
        t.expect0(res.r).is('[ann][ann][][]') ;
        t.expect1(res.e.includes("WARNING: key path 'p.nanfn' would return NaN which was transformed to null.")).true() ;  // a method returning NaN
        t.expect2(res.e.includes('!ERROR!: method fails() execution did fail on local context')).true() ;
        // an empty key path component inside the path
        t.expect3(F('{{p..name}}', { p:new Person('ann') }).e.includes("!ERROR!: key path 'p..name' contains internal '..'.")).true() ;
    }) ;

    group.unary('fromHTMLData() — type="!TEST" is a negative test', async (t) => {
        const html = TSCharset.utf8Charset().dataFromString('<p><fusion type="!TEST" path="flag">no</fusion></p>') ;
        const template = TSFusionTemplate.fromHTMLData(html) ;
        t.expect0(template?.fusionStringWithDataContext({ flag:false }, {})).is('<p>no</p>') ;
        t.expect1(template?.fusionStringWithDataContext({ flag:true }, {})).is('<p></p>') ;
    }) ;

    group.unary('template definition and structure errors', async (t) => {
        const error = (source:string, opts?:any):string => {
            try { new TSStringTemplate(source, opts) ; return '' ; }
            catch (e) { return (e as Error).message ; }
        } ;
        // marks and separator
        t.expect0(error('a {{b}}', { startingMark:'{{', endingMark:'{{' })).is('starting mark, ending mark and separator must be distinct') ;
        t.expect1(error('a {{b}}', { separator:'{{' })).is('starting mark, ending mark and separator must be distinct') ;
        t.expect2(error('a ,{b}}', { startingMark:',{' })).is('first character of starting mark cannot be a comma') ;
        t.expect3(error('a {{b(x', { endingMark:'(x' })).is('first character of ending mark cannot be a left parenthesis or a comma') ;
        t.expect4(error('a {{b,}', { endingMark:',}' })).is('first character of ending mark cannot be a left parenthesis or a comma') ;
        t.expect5(error('a {{b}}', { separator:'(a' })).is('first character of separator cannot be a parenthesis or a comma') ;
        t.expect6(error('a {{b}}', { separator:')a' })).is('first character of separator cannot be a parenthesis or a comma') ;
        t.expect7(error('a {{b}}', { separator:',a' })).is('first character of separator cannot be a parenthesis or a comma') ;
        // structure
        t.expect8(error('a {{x?:yes')).is('Malformed template structure. Template is not properly closed.') ;
        t.expect9(error('a {{list#:{{y}}')).is('Malformed template structure. Template is not properly closed.') ;
        t.expectA(/^Malformed template structure : found forbidden character 0xc3 .* at position 9 /.test(error('a {{b("x\\é")}}'))).true() ;
        t.expectB(error('')).is('template string to small') ;
        // the from...() functions return null instead of throwing
        t.expectC(TSFusionTemplate.fromString('a {{x?:yes')).null() ;
        t.expectD(TSFusionTemplate.fromString('')).null() ;
        t.expectE(TSFusionTemplate.fromHTMLData(new Uint8Array(0))).null() ;
        t.expectF(TSFusionTemplate.fromHTMLData(TSData.fromString('<p>{{x?:yes</p>')!)).null() ;
        t.expectG(TSFusionTemplate.fromHTMLData(TSData.fromString('<p>{{x}}</p>')!)).OK() ;
        t.expectH(TSFusionTemplate.fromData(TSData.fromString('a {{x}}')!, 'utf16be')).null() ;   // UTF-16 cannot be used, like utf16le
        t.expectI(TSFusionTemplate.fromData(TSData.fromString('a {{x}}')!, 'utf16le')).null() ;
    }) ;

    group.unary('TSFusionTreeNode construction errors', async (t) => {
        const root = TSFusionTreeNode.root() ;
        root.pushData(new Uint8Array([65])) ;
        const data = root.nodes![0] ;
        t.expect0(() => data.pushData(new Uint8Array([66]))).toThrow('Impossible to add subnode to a text FusionTreeNode') ;
        t.expect1(() => data.pushVariable('x', TSFusionNodeType.Variable, TSFusionContextType.Local)).toThrow('Impossible to add subnode to a text FusionTreeNode') ;
        t.expect2(() => root.pushVariable('', TSFusionNodeType.Variable, TSFusionContextType.Local)).toThrow('Impossible to add an unamed fusion variable to Root variable.') ;
        t.expect3(() => root.pushVariable('x', TSFusionNodeType.Root, TSFusionContextType.Local)).toThrow(`Impossible to add fusion variable 'x' as a root variable`) ;
        t.expect4(() => root.pushVariable('x', TSFusionNodeType.Data, TSFusionContextType.Local)).toThrow(`Impossible to add fusion variable 'x' as a data variable`) ;
        const variable = root.pushVariable('x', TSFusionNodeType.Variable, TSFusionContextType.Local) ;
        t.expect5(variable.label).is('x') ;
        t.expect6(() => variable.fusion(TSFusionTemplate.fromString('a {{x}}')!, {})).toThrow('Impossible invoque fusion() method on non-root FusionNodeType') ;
    }) ;

    group.unary('TSFusionTemplate.fromData() failures', async (t) => {
        t.expect0(TSFusionTemplate.fromData(new Uint8Array(0))).null() ;                          // empty source
        t.expect1(TSFusionTemplate.fromData(TSData.fromString('a {{x}}')!, 'hex')).null() ;        // forbidden encodings
        t.expect2(TSFusionTemplate.fromData(TSData.fromString('a {{x}}')!, 'utf16le')).null() ;
        t.expect3(TSFusionTemplate.fromData(TSData.fromString('a {{x?:yes')!, 'utf8')).null() ;   // parsing error
        t.expect4(TSFusionTemplate.fromData(TSData.fromString('a {{x}}')!, 'utf8')).OK() ;

        // with the debugParsing option, the failures are logged
        const originalLog = console.log ;
        let output = '' ;
        console.log = ((...args:any[]) => { output += args.join(' ') + '\n' ; }) as any ;
        let forbidden:any, malformed:any ;
        try {
            forbidden = TSFusionTemplate.fromData(TSData.fromString('a {{x}}')!, 'hex', { debugParsing:true }) ;
            malformed = TSFusionTemplate.fromData(TSData.fromString('a {{x?:yes')!, 'utf8', { debugParsing:true }) ;
        }
        finally { console.log = originalLog ; }
        t.expect5(forbidden).null() ;
        t.expect6(malformed).null() ;
        if (!$inbrowser()) {
            t.expect7(output.includes("Data Parsing cannot use encoding: 'hex'")).true() ;
            t.expect8(output.includes('Data Parsing did encounter error')).true() ;
        }
    }) ;

    group.unary('parameters, separators and marks parsing', async (t) => {
        const S = (src:string, data:any, opts:any = {}):string|null => TSFusionTemplate.fromString(src, opts)?.fusionWithDataContext(data, {}, []) ?? 'PARSE FAILED' ;
        const error = (source:string, opts?:any):string => {
            try { new TSStringTemplate(source, opts) ; return '' ; }
            catch (e) { return (e as Error).message ; }
        } ;
        const o = { f:(...a:any[]) => JSON.stringify(a), twice:(n:number) => [n, n] } ;
        t.expect0(S('{{o.f()}}', { o })).is('[]') ;                          // no parameter
        t.expect1(S('{{o.f(1,)}}', { o })).is('[1]') ;                       // a comma before the closing parenthesis
        t.expect2(S('{{o.f(2) }}', { o })).is('[2]') ;                       // a space after the parameters
        t.expect3(S('{{o.twice(7)#:[{{self}}]}}', { o })).is('[7][7]') ;     // an enumeration of a method result
        t.expect4(error('{{o.f(1)x}}').startsWith("Malformed var : found forbidden character 0x78 ('x') at position 8")).true() ;
        // a two characters separator
        t.expect5(S('{{a#:;[{{self}}]}}', { a:[1, 2] }, { separator:':;' })).is('[1][2]') ;
        t.expect6(error('{{a#:x}}', { separator:':;' })).is("Malformed template structure on variable separator. Unatended character  0x78 ('x') at position 5 while decoding separator.") ;
        // a three characters ending mark: a partial ending mark in the text is a text
        t.expect7(S('a}x}}y{{b}}}', { b:1 }, { endingMark:'}}}' })).is('a}x}}y1') ;
        t.expect8(error('a{{b}}x}', { endingMark:'}}}' })).is("Malformed template structure on closing variable. Unatended character  0x78 ('x') at position 6 while decoding ending mark.") ;
        t.expect9(error('a }} b')).is('Malformed template structure. We have found a supernumerary ending mark at position 3.') ;
        // a unicode parameter character which the charset of the template cannot write
        const latin1 = TSCharset.charset('latin1')! ;
        t.expectA(() => new TSDataTemplate(Buffer.from("{{s.concat('\\u20AC')}}"), latin1)).throws('Malformed template structure : unicode character U+20AC ending at position 17 cannot be written in latin1.') ;
        t.expectB(new TSDataTemplate(Buffer.from("{{s.concat('\\u00E9')}}"), latin1).fusionStringWithDataContext({ s:'a' }, {}, [])).is('aé') ;
    }) ;

    group.unary('HTML elements which are not fusion elements are kept', async (t) => {
        const H = (src:string, data:any) => TSFusionTemplate.fromHTMLData(Buffer.from(src))?.fusionStringWithDataContext(data, {}, []) ;
        t.expect0(H('a</ b>c', {})).is('a</ b>c') ;                                          // not a closing element
        t.expect1(H('a<b$>c', {})).is('a<b$>c') ;                                            // not an element name
        t.expect2(H('<fusion path="x"y>{{x}}', { x:1 })).is('<fusion path="x"y>1') ;         // bad character after a quoted value
        t.expect3(H('<p>{{b}}/{{n}}</p>', { b:true, n:3 })).is('<p>true/3</p>') ;           // values without toHTML() method
        // an element which is not closed at the end of the source is kept as it is (it got a second '<' and a '>')
        t.expect4(H('abc <b', {})).is('abc <b') ;
        t.expect5(H('abc <b class="x', {})).is('abc <b class="x') ;
        t.expect6(H('{{a}} <', { a:1 })).is('1 <') ;
    }) ;

    group.unary('inspection and enumerations of Map and Set', async (t) => {
        const tpl = TSFusionTemplate.fromString('a{{b}}')! ;
        t.expect0($inspect(tpl)).is('[object TSStringTemplate]') ;
        t.expect1(tpl.toString()).is('[object TSStringTemplate]') ;
        t.expect2($inspect(TSFusionTreeNode.root())).is('[FusionNode Root]') ;
        t.expect3(new Map<any, any>([['k', 1], [2, 'v']]).fusionEnumeration()).is([{ key:'k', value:1 }, { key:2, value:'v' }]) ;
        t.expect4(new Set(['a', 'b']).fusionEnumeration()).is(['a', 'b']) ;
        // a null or undefined parameter is given as it is (it was removed, the following ones being shifted)
        const P = (src:string) => TSFusionTemplate.fromString(src)?.fusionWithDataContext({ o:{ g:(a:any, b:any, c:any) => `${a}:${b}:${c}` } }, {}, []) ;
        t.expect5(P('{{o.g(undefined,2,3)}}')).is('undefined:2:3') ;
        t.expect6(P('{{o.g(null,2,3)}}')).is('null:2:3') ;
        t.expect7(P('{{o.g(1,null,3)}}')).is('1:null:3') ;
        t.expect8(P('{{o.g(1,2)}}')).is('1:2:undefined') ;
    }) ;
}),

TSTest.group("Fusion — 1.8.12 corrections", async (group) => {
    const S = (src:string, data:any, g:TSDictionary = {}, opts:any = {}):[string|null, string[]] => {
        const e:string[] = [] ;
        const t = TSFusionTemplate.fromString(src, opts) ;
        return [t ? t.fusionWithDataContext(data, g, e) as string|null : 'PARSE FAILED', e] ;
    } ;

    group.unary("F1: the caller's global context is not modified", async (t) => {
        const ctx:TSDictionary = { a:1 } ;
        const A = TSFusionTemplate.fromString('A={{$f(1)}}', { globalFunctions:{ f:(_:any) => 'fromA' } })! ;
        const B = TSFusionTemplate.fromString('B={{$f(1)}}', { globalFunctions:{ f:(_:any) => 'fromB' } })! ;
        t.expect0([A.fusionWithDataContext({}, ctx, []), B.fusionWithDataContext({}, ctx, [])]).is(['A=fromA', 'B=fromB']) ;
        t.expect1(Object.keys(ctx)).is(['a']) ;
        S('{{$count}}', {}, ctx, { addStandardGlobalFunctions:true }) ;
        t.expect2(Object.keys(ctx)).is(['a']) ;
        // a value of the caller's context comes first, a procedure still writes in the caller's context
        t.expect3(S('{{$f}}', {}, { f:'mine' }, { globalFunctions:{ f:() => 'fn' } })[0]).is('mine') ;
        const written:TSDictionary = {} ;
        const P = TSFusionTemplate.fromString('{{*w}}{{$x}}', { procedures:{ w:(_d:any, _r:any, _l:any, g:TSDictionary) => { g.x = 'X' ; return '' ; } } })! ;
        t.expect4(P.fusionWithDataContext({}, written, [])).is('X') ;
        t.expect5(written.x).is('X') ;
    }) ;

    group.unary("F2 and F3: characters which the charset cannot write", async (t) => {
        const html = TSFusionTemplate.fromHTMLData(Buffer.from('<html><meta charset="iso-8859-1"><p>{{a}}</p></html>'))! ;
        t.expect0(html.fusionStringWithDataContext({ a:{ toHTML:() => '<i>é€</i>' } }, {}, [])).is('<html><meta charset="iso-8859-1"><p><i>é&#8364;</i></p></html>') ;
        const html8 = TSFusionTemplate.fromHTMLData(Buffer.from('<html><meta charset="utf-8"><p>{{a}}</p></html>'))! ;
        t.expect1(html8.fusionStringWithDataContext({ a:{ toHTML:() => '<i>é€</i>' } }, {}, [])).is('<html><meta charset="utf-8"><p><i>é€</i></p></html>') ;
        const latin = TSFusionTemplate.fromData(Buffer.from('v={{a}}'), 'latin1')! ;
        t.expect2(latin.fusionStringWithDataContext({ a:'é' }, {}, [])).is('v=é') ;
        const errors:string[] = [] ;
        t.expect3(latin.fusionStringWithDataContext({ a:'é€' }, {}, errors)).null() ; // € used to be written as ¬
        t.expect4(errors.some(e => e.includes("character '€' (U+20AC) cannot be written in latin1"))).true() ;
    }) ;

    group.unary("F4 and F5: unicode escapes and numbers of the parameters", async (t) => {
        t.expect0(S("{{s.concat('\\uD83D\\uDE00\\u00e9')}}", { s:'a' })[0]).is('a😀é') ;
        t.expect1(S("{{s.concat('\\uD83Dx')}}", { s:'a' })[0]).is('PARSE FAILED') ;
        t.expect2(S("{{s.concat('\\uDE00')}}", { s:'a' })[0]).is('PARSE FAILED') ;
        for (const [i, n] of ['1.2.3', '-', '.', '1..2'].entries()) { t.expect(S(`{{s.slice(${n})}}`, { s:'abcdef' })[0], `num-${i}`).is('PARSE FAILED') ; }
        t.expect3(S('{{s.slice(-2)}}', { s:'abcdef' })[0]).is('ef') ;
        t.expect4(S('{{s.slice(1.)}}', { s:'abcdef' })[0]).is('bcdef') ;
    }) ;

    group.unary("F6 and F7: capacity and a fusion during another one", async (t) => {
        const c = TSFusionTemplate.fromString('abc{{a}}')! ;
        c.capacity = 1000 ;
        const capacity = c.capacity ;
        t.expect0(capacity).is(1536) ; // $capacityForCount(1000): it used to be added to the current capacity (16 + 1536)
        c.capacity = 1000 ;
        t.expect1(c.capacity).is(capacity) ;
        let tpl:any ;
        tpl = TSFusionTemplate.fromString('[{{v}}{{n?:{{*inner}}}}]', { procedures:{ inner:() => tpl.fusionWithDataContext({ v:'in' }, {}, []) } })! ;
        t.expect2(tpl.fusionWithDataContext({ v:'out', n:true }, {}, [])).is('[out[in]]') ;
        let dtpl:any ;
        dtpl = TSFusionTemplate.fromData(Buffer.from('[{{v}}{{n?:{{*inner}}}}]'), 'utf8', { procedures:{ inner:() => dtpl.fusionStringWithDataContext({ v:'in' }, {}, []) } })! ;
        t.expect3(dtpl.fusionStringWithDataContext({ v:'out', n:true }, {}, [])).is('[out[in]]') ;
    }) ;

    group.unary("an unknown member of a primitive value is reported", async (t) => {
        const [r, e] = S('[{{s.foo}}][{{s.length}}][{{n.bar}}][{{n.toFixed(1)}}]', { s:'abc', n:2 }) ;
        t.expect0(r).is('[][3][][2.0]') ;
        t.expect1(e.filter(x => x.includes("unknown method or property 'foo'")).length).is(1) ;
        t.expect2(e.filter(x => x.includes("unknown method or property 'bar'")).length).is(1) ;
        t.expect3(S('[{{b.x}}]', { b:true })[1].some(x => x.includes("unknown method or property 'x'"))).true() ;
    }) ;

    group.unary("empty values are false in the tests, Dates in ISO 8601 local time", async (t) => {
        const tpl = '{{l?:list}}{{l!:empty}}' ;
        for (const [i, v] of [[], new Set(), new Map(), '', 0, null].entries()) { t.expect(S(tpl, { l:v })[0], `empty-${i}`).is('empty') ; }
        for (const [i, v] of [[1], new Set([1]), new Map([[1, 1]]), 'x', 1, {}].entries()) { t.expect(S(tpl, { l:v })[0], `full-${i}`).is('list') ; }
        const d = new Date(Date.UTC(2024, 4, 1, 10, 20, 0)) ;
        const local = S('{{d}}', { d })[0]! ;
        t.expect0(/^2024-05-01T\d{2}:20:00[+-]\d{2}:\d{2}$/.test(local)).true() ;
        t.expect1(new Date(local).getTime()).is(d.getTime()) ;            // the same instant
        t.expect2(S('{{d}}', { d:new Date(Date.UTC(2024, 4, 1, 10, 20, 0, 5)) })[0]!.includes(':00.005')).true() ;
        t.expect3(S('{{d.toISOString}}', { d })[0]).is('2024-05-01T10:20:00.000Z') ;
    }) ;
}),

] ;
