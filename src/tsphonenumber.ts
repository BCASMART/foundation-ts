import { $isstring, $ok, $value } from "./commons";
import { $ascii, $normspaces } from "./strings";
import { TSCountry } from "./tscountry";
import { TSDefaults } from "./tsdefaults";
import { TSClone, TSLeafInspect, TSObject } from "./tsobject";
import { Ascending, Comparison, Descending, Nullable, Same } from "./types";

/**
 * TSPhoneNumber objects are immutable and you create one
 * with the static methods TSPhoneNumber.fromString() 
 * or TSPhoneNumber.interpret()
 */
const customInspectSymbol = Symbol.for('nodejs.util.inspect.custom') ;

export interface PhonePlanInfo {
    dialCode:string;
    trunkCode:string ;
    areaCodes?:string[];
    minDigits?:number ;
    maxDigits?:number ;
}

export type PhonePlan = Required<PhonePlanInfo> ;

export enum PhoneValidity {
    OK,
    WrongLength,
    MalformedNumber,
    BadCountryNumber,
    CountryNotFound,
    MixedCountries
} ;


export class TSPhoneNumber implements TSObject, TSLeafInspect, TSClone<TSPhoneNumber> {

    // the common static method to instantiate a new TSPhoneNumber object
    static fromString(source:Nullable<string>, telcountry?:Nullable<TSCountry>):TSPhoneNumber|null {
        // for now we discard the encountered error
        const [phoneNumber, phoneCountry, validity] = _phoneFromString(source, telcountry) ;
        return validity === PhoneValidity.OK ? new TSPhoneNumber(phoneNumber!, phoneCountry!) : null ;
    }

    // use this static method if you want to know why your phone number is wrong
    static interpret(source:Nullable<string>, telcountry?:Nullable<TSCountry>):TSPhoneNumber|PhoneValidity {
        const [phoneNumber, phoneCountry, validity] = _phoneFromString(source, telcountry) ;
        return validity === PhoneValidity.OK ? new TSPhoneNumber(phoneNumber!, phoneCountry!) : validity ;
    }

    static validity(source:Nullable<string>, telcountry?:Nullable<TSCountry>):PhoneValidity {
        const [,,validity] = _phoneFromString(source, telcountry) ; 
        return validity ;
    }

    private constructor(public readonly number:string, public readonly country:TSCountry) {}

    public get dialCode() { return this.country.phonePlan.dialCode ; }
    public get standardNumber() {  return this._standardNumber() }

    public clone():TSPhoneNumber { return this ; } // no clone for immutable objects

    // ============ TSLeafInspect conformance =============== 
    leafInspect = TSPhoneNumber.prototype._standardNumber ;

    // @ts-ignore
    [customInspectSymbol](depth:number, inspectOptions:any, inspect:any) {
        return this.leafInspect()
    }
    
	// ============ TSObject conformance =============== 
    public compare(other:any) : Comparison {
        if (this === other) { return Same ; }
        if ($isstring(other)) { other = TSPhoneNumber.fromString(other) ; }
        if (!(other instanceof TSPhoneNumber)) { return undefined ; }
        const a = this._standardNumber() ;
        const b = other._standardNumber() ;
        return a > b ? Descending : (a < b ? Ascending : Same) ;
    }

	public isEqual(other:any) : boolean {
        if (this === other) { return true ; }
        if ($isstring(other)) { other = TSPhoneNumber.fromString(other) ; }
        return other instanceof TSPhoneNumber ? this._standardNumber() === other._standardNumber() : false ;
    } 

	public toArray():any[] { return [this] ; }

    toString = TSPhoneNumber.prototype._standardNumber ; // for now. in the future we may have options to ouptut other formats
    toJSON = TSPhoneNumber.prototype._standardNumber ;

	// ============ private methods =============== 
    private _standardNumber():string {
        const p = this.country.phonePlan ;
        const t = p.trunkCode ;
        const n = this.number ; 
        return `+${p.dialCode} ${t.length > 0 && n.startsWith(t) ? n.slice(t.length) : n}` ; 
    }

}

// private  functions
function _phoneFromString(source:Nullable<string>, telcountry?:Nullable<TSCountry>):[string|null, TSCountry|null, PhoneValidity] {
    let s =  $ascii($normspaces(source, { replacer:"", strict:true })) ; // remove all spaces (except new lines) and make the string ASCII
    let len = s.length ;
    let min = 5 ;
    
    if (s.startsWith('(')) {
        // here if we have something like :
        // (+XXX)nnnn or (00XXX)nnnn or (00<separator>XXX)nnnn 
        // we transform the string in
        // +(XXX)nnnn 
        if (s.slice(1,2) === '+') { s = '+('+s.slice(2) ; }
        else if (s.slice(1,3) === '00') {
            s = s.slice(3) ;
            if (s.length < 2) { return [null, null, PhoneValidity.MalformedNumber] } ;
            s = '+('+ (_isPhoneSeparator(s[0]) ? s.slice(1) : s) ;
        }
        len = s.length ;
        min += 2 ; // me must have the room for 2 parentheses
    }
    if (len < min) { return [null, null, PhoneValidity.WrongLength] ; }

    // enougth room to have +Xnnnn or +XXXnn or +(X)nnnn or +(XXX)nn
    let start = 0 ;
    let dialCode:string = '' ;
    let countries:TSCountry[] = [] ;
    let localNumber = false ;

    if (s[0] === '+' || s.startsWith('00')) {
        // search for dialcode
        start = s[0] === '+' ? 1 : 2 ;
        const ds = _removeSeparators(s.slice(start)) ;
        if (!$ok(ds)) { return [null, null, PhoneValidity.MalformedNumber] ; }
        s = ds! ;
        len = s.length ;
        if (len < 5) { return [null, null, PhoneValidity.WrongLength] ; } // enougth to have XXXnn or Xnnnn
        [dialCode, countries] = _findDialCode(s) ;
        start = dialCode.length ;
        if (!start || !countries.length) { return [null, null, PhoneValidity.CountryNotFound] ; }
        if ($ok(telcountry) && !countries.includes(telcountry!)) { return [null, null, PhoneValidity.BadCountryNumber] ; }
        else if ($ok(telcountry)) { countries = [telcountry!] ; }
    }
    else {
        const defaultCountry = $value(telcountry, TSDefaults.defaults().defaultCountry) ;
        dialCode = defaultCountry.phonePlan.dialCode ;
        countries = [defaultCountry] ;
        localNumber = true ;
    }
    s = s.slice(start) ;
    len = s.length ;
    countries = countries.filter(c => {
        const t = c.phonePlan.trunkCode ;
        const min = c.phonePlan.minDigits - (!localNumber && t.length > 0 && !s.startsWith(t) ? t.length : 0) ;
        return len >= min && len <= c.phonePlan.maxDigits ;
    }) ;
    if (!countries.length) { return [null, null, PhoneValidity.WrongLength] ; }

    const countriesWithValidAreaCodes = countries.filter(c => _numberInAreaCodes(s, c)) ;
    countries = countriesWithValidAreaCodes.length > 0 ? countriesWithValidAreaCodes : countries.filter(c => c.phonePlan.areaCodes.length === 0) ;
    if (!countries.length) { return [null, null, PhoneValidity.CountryNotFound] ; }

    const c = countries[0] ;
    const t = c.phonePlan.trunkCode ; 
    if (!localNumber && t.length > 0 && !s.startsWith(t)) { s = t + s ;}

    if (countries.length > 1) { return [s, null, PhoneValidity.MixedCountries] ; }

    if ($ok(telcountry) && c !== telcountry) { return [s, c, PhoneValidity.BadCountryNumber] ; }

    return [s, c, PhoneValidity.OK] ;
}

function _numberInAreaCodes(s:string, c:TSCountry):boolean {
    const areaCodes = c.phonePlan.areaCodes ;
    if (areaCodes.length) { 
        for (let ac of areaCodes) { if (s.startsWith(ac)) return true ; }
    }
    return false ;
}

function _removeSeparators(s:string):string|null {
    let ret = '' ;
    let foundOpenParenthesis = false ;
    let foundClosedParenthesis = false ;

    enum SepState { Start, None, Last } ; 
    let sepstate = SepState.Start ;

    for (let c of s ) {
        if (c === '(') { 
            if (sepstate === SepState.Last || foundOpenParenthesis) { return null ; }
            foundOpenParenthesis = true ;
            sepstate = SepState.Last ;
        }
        else if (c === ')') {
            if (sepstate !== SepState.None || !foundOpenParenthesis || foundClosedParenthesis) { return null ; }
            foundClosedParenthesis = true ;
            sepstate = SepState.None ;
        }
        else if (c >= '0' && c <= '9') { 
            ret += c ; 
            sepstate = SepState.None ;
        }
        else if (_isPhoneSeparator(c)) {
            if (sepstate !== SepState.None) { return null ; } // never have a separator at first or two following separator
            sepstate = SepState.Last ;
        }
        else {
            // unauthorized character (warning new lines chars are not valid here)
            return null ;
        }
    }    

    // never have an open parenthesis without a closed one and never finish on a separator
    return sepstate === SepState.None && (!foundOpenParenthesis || foundClosedParenthesis) ? ret : null ;
}

function _isPhoneSeparator(c:string):boolean { return c === '.' || c === '-' || c === '~' || c === '/' ; } 

function _findDialCode(s:string):[string, Array<TSCountry>] {
    for (let i = 1 ; i < 4 ; i++) {
        const dialCode = s.slice(0,i) ;
        const countries = TSCountry.countriesForDialCode(dialCode) ;
        if (countries.length > 0) { return [dialCode, countries] ; }
    }
    return ['', []] ;
}
