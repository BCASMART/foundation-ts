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
    private readonly _isMobile:boolean|undefined = undefined ;
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

    public clone():this { return this ; } // no clone for immutable objects

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
        if (a === b) { return Same ; }
        return a < b ? Ascending : Descending ;
    }

	public isEqual(other:any) : boolean {
        if (this === other) { return true ; }
        if ($isstring(other)) { other = TSPhoneNumber.fromString(other) ; }
        return other instanceof TSPhoneNumber ? this._standardNumber(true) === other._standardNumber(true) : false ;
    } 

	public toArray():any[] { return [this] ; }
    public toJSON():string { return this._standardNumber(true) ; }

    public [Symbol.toPrimitive](hint: "number" | "string" | "default") {
        return hint === 'number' ? Number.NaN : this._standardNumber(true) ; // a phone cannot be really converted to a number since left zeros are not taken into account. 
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
        if (!$length(format)) { format = this.country.phonePlan.format ; }
        const fmt = format! ;
        const fmtlen = fmt.length ;
        const trunk = this.country.phonePlan.trunkCode ;
        const state:PhoneFormatState = {
            number:$length(trunk) > 0 && this.number.startsWith(trunk) ? this.number.slice(1) : this.number,
            pos:0,
            ret:''
        } ;
        const lang = _phoneLanguage(this.country, translation) ;
        let escape:boolean = false ;

        for (let i = 0 ; i < fmtlen ; i++) {
            const c = fmt.charAt(i) ;
            if (escape) {
                // %% is handled by _formatDirective() as an unknown directive outputing its char
                if (!this._formatDirective(c, state, lang)) { return state.ret ; } // %0 conditionaly stops the format
                escape = false ;
            }
            else if (c === '%') { escape = true ; }
            else { state.ret += c ; }
        }
        return state.ret ;
    }

	// ============ private methods =============== 
    // appends the result of the %c directive to state.ret. returns false if the format must stop here
    private _formatDirective(c:string, state:PhoneFormatState, lang:Nullable<language>):boolean {
        switch (c) {
            case '0': return state.pos < state.number.length ;
            case 'C': state.ret += $value(this.country.translatedName(lang), this.country.nativeName) ; break ;
            case 'N': state.ret += this.number ; break ;
            case 'c': state.ret += this.country.label ; break ;
            case 'd': state.ret += this.dialCode ; break ;
            case 'n': state.ret += state.number ; break ;
            case 'l': state.ret += this.country.label ; break ;
            case 't': state.ret += this.country.phonePlan.trunkCode ; break ;
            case 'r': _appendPhoneDigits(state, state.number.length) ; break ;
            case 'x': state.ret += this.country.alpha2Code ; break ;
            case 'X': state.ret += this.country.alpha3Code ; break ;
            default:
                if (c >= '1' && c <= '9') { _appendPhoneDigits(state, c.charCodeAt(0) - 0x30) ; } // NOSONAR: c is an ASCII digit
                else { state.ret += c ; }
                break ;
        }
        return true ;
    }

    private _standardNumber(compact?:boolean):string {
        const p = this.country.phonePlan ;
        const t = p.trunkCode ;
        const n = this.number ; 
        return `+${p.dialCode}${!compact?" ":""}${$length(t) > 0 && n.startsWith(t) ? n.slice(t.length) : n}` ; 
    }

}

// private  functions
interface PhoneFormatState {
    number:string ; // the phone number without its trunk code
    pos:number ;    // the position of the next digit to be output
    ret:string ;    // the formatted string
}

// appends the n next digits of the phone number (or all the remaining ones)
function _appendPhoneDigits(state:PhoneFormatState, n:number) {
    const nlen = state.number.length ;
    if (state.pos < nlen) {
        if (state.pos + n >= nlen) {
            state.ret += state.number.slice(state.pos) ;
            state.pos = nlen ;
        }
        else {
            state.ret += state.number.slice(state.pos, state.pos + n) ;
            state.pos += n ;
        }
    }
}

type PhoneParsingResult = [string|null, TSCountry|null, PhoneValidity, boolean|undefined, number|undefined] ;

interface PhoneOrigin {
    s:string ;                  // the number without its international prefix and dial code
    countries:TSCountry[] ;     // the possible countries
    localNumber:boolean ;       // true if there was no international prefix
}

interface PhoneCountryCandidate {
    country:TSCountry ;
    isMobile:boolean|undefined ;
}

export function $phoneFromString(source:Nullable<string>, telcountry?:Nullable<TSCountry>):[string|null, TSCountry|null, PhoneValidity, boolean|undefined, number|undefined] {
    const ascii =  $ascii($normspaces(source, { replacer:"", strict:true })) ; // remove all spaces (except new lines) and make the string ASCII
    if (!$ok(ascii)) { return [ascii, null, PhoneValidity.MalformedNumber, false, 0] ; }

    const prefixed = _phoneWithNormalizedParenthesis(ascii) ;
    if (Array.isArray(prefixed)) { return prefixed ; }
    if (prefixed.s.length < prefixed.min) { return [prefixed.s, null, PhoneValidity.WrongLength, undefined, 2] ; }

    // enougth room to have +Xnnnn or +XXXnn or +(X)nnnn or +(XXX)nn
    const origin = _phoneOrigin(prefixed.s, telcountry) ;
    return Array.isArray(origin) ? origin : _phoneFromNationalNumber(origin, telcountry) ;
}

// here if we have something like :
// (+XXX)nnnn or (00XXX)nnnn or (00<separator>XXX)nnnn 
// we transform the string in
// +(XXX)nnnn 
function _phoneWithNormalizedParenthesis(s:string):{s:string, min:number}|PhoneParsingResult {
    if (!s.startsWith('(')) { return { s:s, min:5 } ; }
    if (s.slice(1,2) === '+') { s = '+('+s.slice(2) ; }
    else if (s.slice(1,3) === '00') {
        s = s.slice(3) ;
        if (s.length < 2) { return [s, null, PhoneValidity.MalformedNumber, undefined, 1] } ;
        s = '+('+ (_isPhoneSeparator(s[0]) ? s.slice(1) : s) ;
    }
    return { s:s, min:7 } ; // me must have the room for 2 parentheses
}

function _phoneOrigin(s:string, telcountry?:Nullable<TSCountry>):PhoneOrigin|PhoneParsingResult {
    if (s.startsWith('+') || s.startsWith('00')) {
        // search for dialcode
        const ds = _removeSeparators(s.slice(s.startsWith('+') ? 1 : 2)) ;
        if (!$ok(ds)) { return [s, null, PhoneValidity.MalformedNumber, undefined, 3] ; }
        s = ds! ;
        if (s.length < 5) { return [s, null, PhoneValidity.WrongLength, undefined, 4] ; } // enougth to have XXXnn or Xnnnn
        let [dialCode, countries] = _findDialCode(s) ;
        const start = dialCode.length ;
        if (!start || !countries.length) { return [s, null, PhoneValidity.CountryNotFound, undefined, 5] ; }
        if ($ok(telcountry)) {
            if (!countries.includes(telcountry!)) { return [s, null, PhoneValidity.BadCountryNumber, undefined, 6] ; }
            countries = [telcountry!] ;
        }
        return { s:s.slice(start), countries:countries, localNumber:false } ;
    }
    const defaultCountry = $value(telcountry, TSDefaults.defaults().defaultCountry) ;
    if (!s.startsWith(defaultCountry.phonePlan.trunkCode)) {
        return [s, defaultCountry, PhoneValidity.MissingTrunkCode, undefined, 7] ;
    }
    return { s:s, countries:[defaultCountry], localNumber:true } ;
}

function _phoneFromNationalNumber(origin:PhoneOrigin, telcountry?:Nullable<TSCountry>):PhoneParsingResult {
    let s = origin.s ;
    const countries = origin.countries ;
    const presumedCountry = $count(countries) === 1 ? countries[0] : null ;
    let acceptableCountries = $map(countries, c => _phoneCountryCandidate(c, s)) ;
    if (!acceptableCountries.length) { return [s, presumedCountry, PhoneValidity.CountryNotFound, undefined, 8] ; }

    const countriesWithValidAreaCodes = acceptableCountries.filter(n => _numberInAreaCodes(s, n.country)) ;
    acceptableCountries = countriesWithValidAreaCodes.length > 0 ? countriesWithValidAreaCodes : acceptableCountries.filter(n => n.country.phonePlan.areaCodes.length === 0) ;
    if (!acceptableCountries.length) { return [s, presumedCountry, PhoneValidity.CountryNotFound, undefined, 9] ; }

    const c = acceptableCountries[0].country ;
    const isMobile = acceptableCountries[0].isMobile ;
    const t = c.phonePlan.trunkCode ; 
    if (!origin.localNumber && t.length > 0 && !s.startsWith(t)) { s = t + s ;}

    if (acceptableCountries.length > 1) { return [s, null, PhoneValidity.MixedCountries, isMobile, 10] ; }

    if ($ok(telcountry) && c !== telcountry) { return [s, c, PhoneValidity.BadCountryNumber, isMobile, 11] ; }

    return [s, c, PhoneValidity.OK, isMobile, undefined] ;
}

// returns the country with its mobile status if s is a valid number for this country, null otherwise
function _phoneCountryCandidate(c:TSCountry, s:string):PhoneCountryCandidate|null {
    const p = c.phonePlan ;
    const t = p.trunkCode ;
    const tlen = $length(t) ;
    const str = tlen > 0 && s.startsWith(t) ? s.slice(tlen) : s ;
    const strlen = str.length ;
    if (strlen < p.minDigits || strlen > p.maxDigits) { return null ; }

    const mobile = $ok(p.mobileRegex) && p.mobileRegex!.test(str) ;
    const landline = $ok(p.fixedLineRegex) && p.fixedLineRegex!.test(str) ;
    if (mobile && landline) { return { country:c, isMobile:undefined } ; }
    if (mobile) { return { country:c, isMobile:true } ; }
    if (landline) { return { country:c, isMobile:false } ; }
    return $ok(p.regex) && p.regex!.test(str) ? { country:c, isMobile:undefined } : null ;
}

function _numberInAreaCodes(s:string, c:TSCountry):boolean {
    const areaCodes = c.phonePlan.areaCodes ;
    if (areaCodes.length) { 
        for (let ac of areaCodes) { if (s.startsWith(ac)) return true ; }
    }
    return false ;
}

enum SepState { Start, None, Last } ; 

interface SeparatorsParsing {
    ret:string ;
    foundOpenParenthesis:boolean ;
    foundClosedParenthesis:boolean ;
    sepstate:SepState ;
}

function _removeSeparators(s:string):string|null {
    const p:SeparatorsParsing = { ret:'', foundOpenParenthesis:false, foundClosedParenthesis:false, sepstate:SepState.Start } ;
    for (let c of s ) {
        if (!_parseSeparatorChar(p, c)) { return null ; }
    }
    // never have an open parenthesis without a closed one and never finish on a separator
    return p.sepstate === SepState.None && (!p.foundOpenParenthesis || p.foundClosedParenthesis) ? p.ret : null ;
}

// returns false if c is not acceptable at this place
function _parseSeparatorChar(p:SeparatorsParsing, c:string):boolean {
    if (c === '(') { 
        if (p.sepstate === SepState.Last || p.foundOpenParenthesis) { return false ; }
        p.foundOpenParenthesis = true ;
        p.sepstate = SepState.Last ;
    }
    else if (c === ')') {
        if (p.sepstate !== SepState.None || !p.foundOpenParenthesis || p.foundClosedParenthesis) { return false ; }
        p.foundClosedParenthesis = true ;
        p.sepstate = SepState.None ;
    }
    else if (c >= '0' && c <= '9') { 
        p.ret += c ; 
        p.sepstate = SepState.None ;
    }
    else if (_isPhoneSeparator(c)) {
        if (p.sepstate !== SepState.None) { return false ; } // never have a separator at first or two following separator
        p.sepstate = SepState.Last ;
    }
    else {
        // unauthorized character (warning new lines chars are not valid here)
        return false ;
    }
    return true ;
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

function _phoneLanguage(country:TSCountry, translation?:Nullable<language|'default'|'native'>) {
    if (!$length(translation) || translation == 'default') { return $language() ; }
    return translation == 'native' ? country.nativeLanguage : translation ;
}
