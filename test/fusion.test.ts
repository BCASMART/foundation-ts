import { TSTest } from "../src/tstester";
import { TSFusionTemplate } from '../src/tsfusion';
import { TSDictionary } from "../src/types";
import { TSData } from "../src/tsdata";
import { $inspect } from "../src/utils";
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
        t.expect1(S('[{{x#:{{$octets(1536,1)}}}}]', { x:1 }, o).r).is('[1.5 ko]') ;
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
        t.expect3(run("{{a.zz}}", { a:{ b:1 } }).errors.includes("unknown method or preperty 'zz'")).true() ;
        t.expect4(run("{{a.foo}}", { a:{ foo:(x:number) => x } }).errors.includes("is not an sinple accessor")).true() ;
        t.expect5(run("{{a.n}}", { a:{ n:NaN } }).errors.includes("would return NaN which was transformed to null")).true() ;
    }) ;
}),

] ;
