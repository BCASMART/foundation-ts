import { $map } from "./array";
import { $count, $defined, $isstring, $length, $ok, $value } from "./commons";
import { $random } from "./crypto";
import { $ascii, $normspaces } from "./strings";
import { TSCountry } from "./tscountry";
import { $language, TSDefaults } from "./tsdefaults";
import { TSClone, TSLeafInspect, TSObject } from "./tsobject";
import { Ascending, Comparison, Descending, language, Nullable, Same } from "./types";

/**
 * TSPhoneNumber objects are immutable and you create one
 * with the static methods TSPhoneNumber.fromString() 
 * or TSPhoneNumber.interpret()
 */
const customInspectSymbol = Symbol.for('nodejs.util.inspect.custom') ;

export interface PhonePlanCommons {
    dialCode:string;
    trunkCode:string ;
    minDigits:number ;
    maxDigits:number ;
    areaCodes?:string[];
    format?:string ;
    dummies?:string[] ;
} ;

export interface PhonePlanInfo extends PhonePlanCommons {
    mobileRegex?:string ;
    fixedLineRegex?:string ;
    regex?:string ;
    note?:string ;
}

export interface PhonePlan extends Required<PhonePlanCommons> {
    mobileRegex?:RegExp ;
    fixedLineRegex?:RegExp ;
    regex?:RegExp ;
} ;


// export type PhonePlan = Required<PhonePlanInfo> ;

export enum PhoneValidity {
    OK = 'OK',
    WrongLength = 'Wrong length',
    MalformedNumber = 'Malformed number',
    MissingTrunkCode = 'Missing trunk code',
    BadCountryNumber = 'Bad country dial code',
    CountryNotFound = 'Country was not found',
    MixedCountries = 'Several countries found'
} ;


export class TSPhoneNumber implements TSObject, TSLeafInspect, TSClone<TSPhoneNumber> {

    // the common static method to instantiate a new TSPhoneNumber object
    static fromString(source:Nullable<string>, telcountry?:Nullable<TSCountry>):TSPhoneNumber|null {
        // for now we discard the encountered error
        const [phoneNumber, phoneCountry, validity, isMobile,] = $phoneFromString(source, telcountry) ;
        return validity === PhoneValidity.OK ? new TSPhoneNumber(phoneNumber!, phoneCountry!, isMobile) : null ;
    }

    // use this static method if you want to know why your phone number is wrong
    static interpret(source:Nullable<string>, telcountry?:Nullable<TSCountry>):TSPhoneNumber|PhoneValidity {
        const [phoneNumber, phoneCountry, validity, isMobile,] = $phoneFromString(source, telcountry) ;
        return validity === PhoneValidity.OK ? new TSPhoneNumber(phoneNumber!, phoneCountry!, isMobile) : validity ;
    }

    static validity(source:Nullable<string>, telcountry?:Nullable<TSCountry>):PhoneValidity {
        const [,,validity,,] = $phoneFromString(source, telcountry) ; 
        return validity ;
    }

    static exampleNumber(telcountry?:Nullable<TSCountry>):TSPhoneNumber|null {
        const country = $value(telcountry, TSDefaults.defaults().defaultCountry) ;
        const dummies = country.phonePlan.dummies ;
        const count = $count(dummies) ;
        if (count) {
            const dummy = dummies[$random(count)] ;
            const parts = dummy.split('X') ;
            const n = $count(parts) ;
            if (n > 1) {
                let s = parts[0] ;
                const ref = '0123456789' ;
                for (let i = 0 ; i < n ; i++) {
                    s += ref[$random(10)] ;
                    s += parts[i] ;
                }
                return this.fromString(s, country) ;
            }
        }
        return null ;
    }
    private _isMobile:boolean|undefined = undefined ;
    public constructor(public readonly number:string, public readonly country:TSCountry, isMobile?:boolean|undefined) {
        this._isMobile = isMobile ;
    }

    public get dialCode() { return this.country.phonePlan.dialCode ; }
    public get standardNumber():string {  return this._standardNumber() ; }
    public get compactNumber():string {  return this._standardNumber(true) ; }
    public get alpha2Code():string    { return this.country.alpha2Code ; }
    public get alpha3Code():string    { return this.country.alpha3Code ; }
    public get trunkCode():string    { return this.country.phonePlan.trunkCode ; }

    public get isMobileNumber():boolean { return !!this._isMobile ; }
    public get isLandLineNumber():boolean { return $defined(this._isMobile) ? !this._isMobile : false ; } 
    public get isUndeterminedNumber():boolean { return !$defined(this._isMobile) ; }

    public clone():TSPhoneNumber { return this ; } // no clone for immutable objects

    // ============ TSLeafInspect conformance =============== 
    public leafInspect():string { return this._standardNumber(true) ; }

    // @ts-ignore
    [customInspectSymbol](depth:number, inspectOptions:any, inspect:any) {
        return this.leafInspect()
    }
    
	// ============ TSObject conformance =============== 
    public compare(other:any) : Comparison {
        if (this === other) { return Same ; }
        if ($isstring(other)) { other = TSPhoneNumber.fromString(other) ; }
        if (!(other instanceof TSPhoneNumber)) { return undefined ; }
        const a = this._standardNumber(true) ;
        const b = other._standardNumber(true) ;
        return a > b ? Descending : (a < b ? Ascending : Same) ;
    }

	public isEqual(other:any) : boolean {
        if (this === other) { return true ; }
        if ($isstring(other)) { other = TSPhoneNumber.fromString(other) ; }
        return other instanceof TSPhoneNumber ? this._standardNumber(true) === other._standardNumber(true) : false ;
    } 

	public toArray():any[] { return [this] ; }
    public toJSON():string { return this._standardNumber(true) ; }

    public [Symbol.toPrimitive](hint: "number" | "string" | "default") {
        return hint === 'number' ? NaN : this._standardNumber(true) ; // a phone cannot be really converted to a number since left zeros are not taken into account. 
    }
    // for the same reason, we do not implement valueOf() since it would return a number

    /*
        if format undefined => returns standard non compact string
        if format null or empty uses standard country format

        Format composition
        ---------------------
        %c      country label
        %C      country localized name
        %d      dialcode
        %t      trunkCode
        %n      phone number without the trunk code if present
        %N      phone number including potential trunk code
        %0      this stops the rest of the format if there's no more number digit remaining
        %1      next digit of phone number
        %2      next 2 digits of phone number
        %3      next 3 digits of phone number
        %4 %5 %6 %7 %8 %9
        %9      next 9 digits of phone number
        %r      all remaining digits of phone number  
        %x      country alpha2 code
        %X      country alpha3 code   
        %%      a percent
    */

    public toString(format?:Nullable<string>, translation?:Nullable<language|'default'|'native'>):string {
        if (!$defined(format)) { return this._standardNumber() ; }
        let fmtlen = $length(format) ;
        if (!fmtlen) { 
            format = this.country.phonePlan.format ;
            fmtlen = format!.length ;
        }
        let escape:boolean = false ;
        let ret = "" ;
        let pos = 0 ;
        let trunk = this.country.phonePlan.trunkCode ;
        let number = $length(trunk) > 0 && this.number.startsWith(trunk) ? 
                     this.number.slice(1) : 
                     this.number ;
        const nlen = number.length ;

        const lang = !$length(translation) || translation == 'default' ? 
                     $language() :
                     (translation == 'native' ? this.country.nativeLanguage : translation) ;

        
        for (let i = 0 ; i < fmtlen ; i++) {
            const c = format!.charAt(i) ;
            if (c == '%') {
                if (escape) { ret += '%' ; escape = false ; }
                else { escape = true ;}
            }
            else if (escape) {
                switch (c) {
                    case '0': if (pos >= nlen) { return ret ; } break ; // conditionaly stops the format
                    case 'C': ret += $value(this.country.translatedName(lang), this.country.nativeName) ; break ;
                    case 'N': ret += this.number ; break ;
                    case 'c': ret += this.country.label ; break ;
                    case 'd': ret += this.dialCode ; break ;
                    case 'n': ret += number ; break ;
                    case 'l': ret += this.country.label ; break ;
                    case 't': ret += this.country.phonePlan.trunkCode ; break ;
                    case 'r':
                        if (pos < nlen) {
                            ret += number.slice(pos) ;
                            pos = nlen ;
                        }
                        break ;
                    case 'x': ret += this.country.alpha2Code ; break ;
                    case 'X': ret += this.country.alpha3Code ; break ;
                    default:
                        if (c >= '1' && c <= '9') {
                            if (pos < nlen) {
                                const nl = c.charCodeAt(0) - 0x30 ;
                                if (pos + nl >= nlen) {
                                    ret += number.slice(pos) ;
                                    pos = nlen ;
                                }
                                else {
                                    ret += number.slice(pos, pos+nl) ;
                                    pos += nl ;
                                }
                            }
                        }
                        else { ret += c ; }
                        break ;
                }
                escape = false ;
            }
            else { ret += c ; }
        }
        return ret ;
    }

	// ============ private methods =============== 
    private _standardNumber(compact?:boolean):string {
        const p = this.country.phonePlan ;
        const t = p.trunkCode ;
        const n = this.number ; 
        return `+${p.dialCode}${!compact?" ":""}${$length(t) > 0 && n.startsWith(t) ? n.slice(t.length) : n}` ; 
    }

}

// private  functions
export function $phoneFromString(source:Nullable<string>, telcountry?:Nullable<TSCountry>):[string|null, TSCountry|null, PhoneValidity, boolean|undefined, number|undefined] {
    const ascii =  $ascii($normspaces(source, { replacer:"", strict:true })) ; // remove all spaces (except new lines) and make the string ASCII
    if (!$ok(ascii)) { return [ascii, null, PhoneValidity.MalformedNumber, false, 0] ; }
    let s = ascii ;
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
            if (s.length < 2) { return [s, null, PhoneValidity.MalformedNumber, undefined, 1] } ;
            s = '+('+ (_isPhoneSeparator(s[0]) ? s.slice(1) : s) ;
        }
        len = s.length ;
        min += 2 ; // me must have the room for 2 parentheses
    }
    if (len < min) { return [s, null, PhoneValidity.WrongLength, undefined, 2] ; }

    // enougth room to have +Xnnnn or +XXXnn or +(X)nnnn or +(XXX)nn
    let start = 0 ;
    let dialCode:string = '' ;
    let countries:TSCountry[] = [] ;
    let localNumber = false ;

    if (s[0] === '+' || s.startsWith('00')) {
        // search for dialcode
        start = s[0] === '+' ? 1 : 2 ;
        const ds = _removeSeparators(s.slice(start)) ;
        if (!$ok(ds)) { return [s, null, PhoneValidity.MalformedNumber, undefined, 3] ; }
        s = ds ;
        len = s.length ;
        if (len < 5) { return [s, null, PhoneValidity.WrongLength, undefined, 4] ; } // enougth to have XXXnn or Xnnnn
        [dialCode, countries] = _findDialCode(s) ;
        start = dialCode.length ;
        if (!start || !countries.length) { return [s, null, PhoneValidity.CountryNotFound, undefined, 5] ; }
        if ($ok(telcountry)) {
            if (!countries.includes(telcountry)) { return [s, null, PhoneValidity.BadCountryNumber, undefined, 6] ; }
            countries = [telcountry] ;
        }
    }
    else {
        const defaultCountry = $value(telcountry, TSDefaults.defaults().defaultCountry) ;
        const t = defaultCountry.phonePlan.trunkCode ;
        dialCode = defaultCountry.phonePlan.dialCode ;
        countries = [defaultCountry] ;
        localNumber = true ;
        if (!s.startsWith(t)) {
            return [s, defaultCountry, PhoneValidity.MissingTrunkCode, undefined, 7] ;
        }
    }
    s = s.slice(start) ;
    len = s.length ;
    const presumedCountry = $count(countries) === 1 ? countries[0] : null ;
    //const pci = $ok(presumedCountry) ? presumedCountry.alpha2Code : '<unknown>' ;
    let acceptableCountries = $map(countries, c => {
        const p = c.phonePlan ;
        const t = p.trunkCode ;
        const tlen = $length(t) ;
        let str = tlen > 0 && s.startsWith(t) ? s.slice(tlen) : s ;
        let strlen = str.length ;
        if (strlen >= p.minDigits && strlen <= p.maxDigits) {
            const mobile = $ok(p.mobileRegex) && p.mobileRegex.test(str) ;
            const landline = $ok(p.fixedLineRegex) && p.fixedLineRegex.test(str) ;
            if (!mobile && !landline) {
                if ($ok(p.regex) && p.regex.test(str)) { return { country:c, isMobile:undefined } ; }            
            }
            else if (mobile && landline) {
                return { country:c, isMobile:undefined } ;
            }
            else if (mobile) {
                return { country:c, isMobile:true } ;
            }
            else if (landline) {
                return { country:c, isMobile:false } ;
            }
            //$logterm(`\n ${pci} ${localNumber?'local ':''}number ${str} length = ${strlen}, did not match any regex`) ;
        }
        else {
            //$logterm(`\n ${pci} ${localNumber?'local ':''}number ${str} length = ${strlen}, min = ${p.minDigits}, max = ${p.maxDigits}`)
        }
        return null ;
    }) ;
    if (!acceptableCountries.length) { return [s, presumedCountry, PhoneValidity.CountryNotFound, undefined, 8] ; }

    const countriesWithValidAreaCodes = acceptableCountries.filter(n => _numberInAreaCodes(s, n.country)) ;
    acceptableCountries = countriesWithValidAreaCodes.length > 0 ? countriesWithValidAreaCodes : acceptableCountries.filter(n => n.country.phonePlan.areaCodes.length === 0) ;
    if (!acceptableCountries.length) { return [s, presumedCountry, PhoneValidity.CountryNotFound, undefined, 9] ; }

    const c = acceptableCountries[0].country ;
    const isMobile = acceptableCountries[0].isMobile ;
    const t = c.phonePlan.trunkCode ; 
    if (!localNumber && t.length > 0 && !s.startsWith(t)) { s = t + s ;}

    if (acceptableCountries.length > 1) { return [s, null, PhoneValidity.MixedCountries, isMobile, 10] ; }

    if ($ok(telcountry) && c !== telcountry) { return [s, c, PhoneValidity.BadCountryNumber, isMobile, 11] ; }

    return [s, c, PhoneValidity.OK, isMobile, undefined] ;
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
