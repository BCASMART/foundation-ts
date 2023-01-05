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



export const fusionGroups = TSTest.group("Fusion tests", async (group) => {
    const p = new PI('M.', 'John', 'Smith') ;
    p.addCollaborator({title:'M.', firstName:'John', lastName:'Adams', isMan:true}) ;
    p.addCollaborator({title:'gal',firstName:'Georges', lastName:'Washington', isMan:true}) ;
    const glob = { job:"Consultant", nameColor:'&w', lastNameColor:'&c' } ;
    const mac = TSCharset.macCharset() ;
    const ansi = TSCharset.ansiCharset() ;
    
    group.unary("String untouched", async(t) => {
        const s = ' Ceci est une belle chaîne de {\n caractères}' ;
        const template = TSFusionTemplate.fromString(s, { debugParsing:false }) ;
        if (t.expect0(template).toBeOK()) {
            let errors:string[] = [] ;
            const res = template!.fusionWithDataContext({myData:1}, {}, errors) ;
            t.register('template', $inspect(template?.source)) ;
            t.register('errors', $inspect(errors)) ;
            t.expect1(res).toBe(s) ;
        }
    }) ;
    group.unary("Simple vars replacement", async(t) => {
        const s = 'Cette lettre est adressée à {{title}} {{firstName}} {{lastName}} ({{$job}}) [{{_index}}, {{_count}}]' ;
        const q = 'Cette lettre est adressée à {{@title}} {{firstName}} {{@lastName}} ({{$job}}) [{{_index}}, {{_count}}]' ;
        const r = 'Cette lettre est adressée à M. John Smith (Consultant) [0, 1]' ;
        const template = TSFusionTemplate.fromString(q, { debugParsing:false }) ;
        const data = {title:'M.', firstName:'John', lastName:'Smith'} ;
        if (t.expect0(template).toBeOK()) {
            let errors:string[] = [] ;
            const res = template!.fusionWithDataContext(data, glob, errors) ;
            t.register('errors', $inspect(errors)) ;
            t.expect1(res).toBe(r) ;

            t.expectA(template?.globalVariables).toBe(['job']) ;
            t.expectB(template?.userVariables).toBe([]) ;
            t.expectC(template?.systemVariables).toBeUnordered(['count', 'index']) ;
            t.expectD(template?.rootVariables).toBeUnordered(['title', 'lastName']) ;
            t.expectE(template?.localVariables).toBe(['firstName']) ;
            t.expectY(template?.variables).toBeUnordered(['title', 'firstName', 'lastName', 'job', 'index', 'count']) ;
            t.expectZ(template?.variables).toBeUnordered(['job', 'index', 'firstName', 'title', 'lastName', 'count']) ; // this one is for testing the tester
        }

        const template2 = TSFusionTemplate.fromString(s) ;
        if (t.expect2(template2).toBeOK()) {
            let errors1:string[] = [] ;
            const res = template2!.fusionWithDataContext(data, glob, errors1) ;
            t.register('errors(1)', $inspect(errors1)) ;
            t.expect3(res).toBe(r) ;

            let errors2:string[] = [] ;
            const res2 = template2?.fusionWithDataContext(new P('M.', 'John', 'Smith'), glob, errors2) ;
            t.register('errors(2)', $inspect(errors2)) ;
            t.expect4(res2).toBe(r) ;

            let errors3:string[] = [] ;
            const res3 = template2?.fusionWithDataContext(p, glob, errors3) ;
            t.register('errors(3)', $inspect(errors3)) ;
            t.expect5(res3).toBe(r) ;
        }

    }) ;

    group.unary("Simple vars replacement with parameters", async(t) => {
        const D = new TSDate(1945, 5, 8, 23, 1, 3) ; // nearly 3 seconds after armistice signature
        const context = {
            starter:"Nous sommes",
            toto:{
                date:D
            }
        } ;
        const s = "{{starter}} le {{toto.date.toString('%A, %e %B %Y à %Hh%M')}}." ;
        t.register('starter in context', 'starter' in context) ;
        t.register('date in context', ('toto' in context) && ('date' in context.toto)) ;

        const template = TSFusionTemplate.fromString(s, { debugParsing:false }) ;
        if (t.expect0(template).toBeOK()) {
            let errors:string[] = [] ;
            const res = template?.fusionWithDataContext(context, glob, errors) ;
            t.register('errors', $inspect(errors)) ;
            t.expect1(res).is("Nous sommes le mardi, 8 mai 1945 à 23h01.") ;
        }

        const sA = "Nous sommes le {{toto.date.dateByAdding(0,0,1,0,2)#:{{self.toString('%A, %e %B %Y à \\\"%Hh%M\\\"')}}}}." ;
        const templateA = TSFusionTemplate.fromString(sA, { debugParsing:false }) ;
        const expResA = "Nous sommes le mercredi, 9 mai 1945 à \"23h03\"." ; 
        if (t.expectA(templateA).toBeOK()) {
            let errors:string[] = [] ;
            const resA = templateA?.fusionWithDataContext({ toto:{ date: D}}, glob, errors) ;
            t.register('errors{A}', $inspect(errors)) ;
            t.expectB(resA).is(expResA) ;
        }
        const sX = "Nous sommes le {{toto.date.dateByAdding(0,0,1,0,2,6)#:{{toString('%A, %e %B %Y \\U00e0 \\\"%Hh%M\\\"')}}}}." ;
        const templateX = TSFusionTemplate.fromString(sX, { debugParsing:false }) ;
        if (t.expectX(templateA).toBeOK()) {
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
        if (t.expect0(template).toBeOK()) {
            let errors:string[] = [] ;
            const res4 = template?.fusionWithDataContext(p, glob, errors) ;
            t.register('errors{0}', $inspect(errors)) ;
            t.expect1(res4).toBe(resC) ;
        }
        const d = TSData.fromString(s, mac) ;
        if (t.expect2(d).toBeOK()) {
            const templateA = TSFusionTemplate.fromData(d!, mac, { debugParsing:false })
            if (t.expectA(templateA).toBeOK()) {
                let errors:string[] = [] ;
                const resA = templateA?.fusionWithDataContext(p, glob, errors) ;
                t.register('errors{A}', $inspect(errors)) ;
                t.expectB(resA).toBeOK() ;
                t.expectC(resA?.toString(mac)).toBe(resC) ;
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
        if (t.expect0(template).toBeOK()) {
            let errors:string[] = [] ;
            const res = template?.fusionWithDataContext(p, glob, errors) ;
            t.register('errors/0', $inspect(errors)) ;
            t.expect1(res).toBe(resC) ;

            t.expectA(template?.globalVariables).toBe([]) ;
            t.expectB(template?.userVariables).toBe([]) ;
            t.expectC(template?.variables).toBeUnordered(['title', 'firstName', 'lastName', 'collaborators', 'position', 'remaining', 'name']) ;
            t.expectD(template?.procedures).toBe(['name']) ;
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
        if (t.expect2(template2).toBeOK()) {
            let errors:string[] = [] ;
            const res = template2?.fusionWithDataContext(p, glob, errors) ;
            t.register('errors/2', $inspect(errors)) ;
            t.expect3(res).toBe(resC) ;
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
        if (t.expect5(template5).toBeOK()) {
            const errors:string[] = [] ;
            const res = template5?.fusionWithDataContext(p, glob, errors) ;
            const truncatedResult = '&0Cette lettre est adressée à M. John Smith\nCollaborators:\n1 - ,\n2 - \n' ;
            t.expect6(res).toBe(truncatedResult) ;
            if (!t.expect7(errors.length).toBe(9)) {
                const print = errors.map(s => s.includes('!ERROR!:') ? '&R&w ERROR &0&o'+s.slice(7)+'&0' : '&a'+s+'&0')
                group.description('Errors and warnings from &0&pexpect6()&y:\n&o'+print.join('\n')) ;
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

        if (t.expect0(d).toBeOK()) {
            const template = TSFusionTemplate.fromHTMLData(d!, { 
                debugParsing:false, 
                procedures:{ name:htmlName } 
            }) ;

            if (t.expect1(template?.source.toString(mac)).toBe(i)) {
                let errors:string[] = [] ;
                const res = template?.fusionWithDataContext(p1, glob, errors) ;
                t.register('errors[1]', $inspect(errors)) ;
                t.expect2(res).toBeOK() ;
                t.expect3(res?.toString(mac)).toBe(r) ;
            }        
        }

        const s2 = '<!doctype html><html><head><meta charset="MacRoman"></head><body><div>Lettre adressée à {{title}} {{firstName}} {{lastName}}</div><fusion type="if" path="collaborators.length"><div style="background:red;"><h2>Collaborators:</h2><ul><fusion type="enum" path="collaborators"><li>[{{_position}}] <fusion context="function" path="name">{{_remaining?:,}}</li></fusion></ul></fusion></body></html>' ;
        const d2 = TSData.fromString(s2, mac) ;
        if (t.expect4(d2).toBeOK()) {
            const template = TSFusionTemplate.fromHTMLData(d2!, { 
                debugParsing:false, 
                procedures:{ name:htmlName } 
            }) ;
            t.expect5(template?.source.toString(mac)).toBe(i) ;
        }

        const s3 = '<!doctype html><html><head><meta charset="MacRoman"></head><body><div>Lettre adressée à <fusion path=title> <fusion path = "firstName"  / > <fusion   path   =   lastName    /></div><fusion type="if" path="collaborators.length"><div style="background:red;"><h2>Collaborators:</h2><ul><fusion type="enum" path="collaborators"><li>[<fusion context="system" path="position" />] <fusion context="function" path="name"><fusion context="sys" path="remaining" type="test">,</fusion></li></fusion  ></ul></fusion ></body></html>' ;
        const d3 = TSData.fromString(s3, ansi) ;
        if (t.expect6(d3).toBeOK()) {
            const i3 = '<!doctype html><html><head><meta charset="MacRoman"></head><body><div>Lettre adressée à {{.title}} {{.firstName}} {{.lastName}}</div>{{.collaborators.length?:<div style="background:red;"><h2>Collaborators:</h2><ul>{{.collaborators#:<li>[{{_position}}] {{*name}}{{_remaining?:,}}</li>}}</ul>}}</body></html>' ;
            const template = TSFusionTemplate.fromHTMLData(d3!, { 
                debugParsing:false, 
                procedures:{ name:htmlName } 
            }) ;
            if (t.expect7(template?.source.toString(ansi)).toBe(i3)) {
                let errors:string[] = [] ;
                const res = template?.fusionWithDataContext(p1, glob, errors) ;
                t.register('errors[3]', $inspect(errors)) ;
                t.expect8(res).toBeOK() ;
                t.expect9(res?.toString(ansi)).toBe(r) ;
            }
        }

        const s4 = '<!doctype html><html><head><meta charset="MacRoman"></head><body><div>Lettre adressée à <fusion path=title> <fusion path = "firstName"  / > <fusion   path   =   lastName    /></div><fusion type="if" path="collaborators.length"><div style="background:red;"><h2>Collaborators:</h2><ul><fusion type="enum" path="collaborators"><li>[<fusion context="system" path="position" />] <fusion context="function" path="name"><fusion context="sys" path="remaining" type="test">,</fusion></li></fusion  ></ul></fusion ><fusion path="insideHTML.toHTMLContent"></body></html>' ;
        const d4 = TSData.fromString(s4, ansi) ;
        if (t.expectA(d4).toBeOK()) {
            const i4 = '<!doctype html><html><head><meta charset="MacRoman"></head><body><div>Lettre adressée à {{.title}} {{.firstName}} {{.lastName}}</div>{{.collaborators.length?:<div style="background:red;"><h2>Collaborators:</h2><ul>{{.collaborators#:<li>[{{_position}}] {{*name}}{{_remaining?:,}}</li>}}</ul>}}{{.insideHTML.toHTMLContent}}</body></html>' ;
            const r4 = '<!doctype html><html><head><meta charset="MacRoman"></head><body><div>Lettre adressée à M. John Smith</div><div style="background:red;"><h2>Collaborators:</h2><ul><li>[1] M. John ADAMS,</li><li>[2] Gal Georges WASHINGTON,</li><li>[3] G&eacute;n&eacute;ral Charles DE GAULLE</li></ul><div style="background:#FF00">Ceci est assur&eacute;ment une r&eacute;ussite</div></body></html>' ;
            const template = TSFusionTemplate.fromHTMLData(d4!, { 
                debugParsing:false, 
                procedures:{ name:htmlName } 
            }) ;
            if (t.expectB(template?.source.toString(ansi)).toBe(i4)) {
                let errors:string[] = [] ;
                const res = template?.fusionWithDataContext(p1, glob, errors) ;
                t.register('errors[4]', $inspect(errors)) ;
                t.expectC(res).toBeOK() ;
                t.expectD(res?.toString(ansi)).toBe(r4) ;
            }
        }

    }) ;
}) ;
