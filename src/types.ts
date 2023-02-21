import { TSData } from "./tsdata";

export type Opaque<V> = V & { readonly __opq__: unique symbol };
export type Nullable<V> = V | null | undefined;

// ========== number types =====================
export type int8 	 = Opaque<number> ;
export type int16 	 = Opaque<number> ;
export type int32 	 = Opaque<number> ;
export type int 	 = Opaque<number> ;

export type uint8 	 = Opaque<number> ;
export type uint16 	 = Opaque<number> ;
export type uint32 	 = Opaque<number> ;
export type uint 	 = Opaque<number> ;

export type unichar  = Opaque<number> ;

export type money 	   = Opaque<number> ;
export type percentage = Opaque<number> ; // the percentage type is an unsigned int in 1/1000 of percetage, i.e 20000 = 20% = 0.2

export type id 	 	 = Opaque<number> ;
export type id32 	 = Opaque<number> ;

export const INT8_MAX:int8 = <int8>0x7f
export const INT8_MIN:int8 = <int8>(-INT8_MAX - 1)
export const INT16_MAX:int16 = <int16>0x7fff
export const INT16_MIN:int16 = <int16>(-INT16_MAX - 1)
export const INT32_MAX:int32 = <int32>0x7fffffff
export const INT32_MIN:int32 = <int32>(-INT32_MAX - 1)
export const INT_MAX:int = <int>(Number.MAX_SAFE_INTEGER - 1) ;
export const INT_MIN:int = <int>(Number.MIN_SAFE_INTEGER + 1) ;
export const INT_MAX_BIG:bigint = BigInt(INT_MAX) ;
export const INT_MIN_BIG:bigint = BigInt(INT_MIN) ;
export const UINT8_MAX:uint8 = <uint8>0xff ;
export const UINT8_MIN:uint8 = <uint8>0 ;
export const UINT16_MAX:uint16 = <uint16>0xffff ;
export const UINT16_MIN:uint16 = <uint16>0 ;
export const UINT32_MAX:uint32 = <uint32>0xffffffff ;
export const UINT32_MIN:uint32 = <uint32>0 ;
export const UINT_MAX:uint = <uint>INT_MAX ;
export const UINT_MIN:uint = <uint>0 ;
export const UINT_MAX_BIG:bigint = INT_MAX_BIG ;
export const UINT_MIN_BIG:bigint = BigInt(0) ;

export const MONEY_MIN = <money>-999999999 ;
export const MONEY_MAX = <money>+999999999 ;
export const FREE = <money>0 ;

// ========== string related types =====================
export type UUID   	= Opaque<string> ;
export type email 	= Opaque<string> ;
export type url 	= Opaque<string> ; 
export type isodate = Opaque<string> ; 

export type GUID    = UUID ; // just an alias

// to have a NormativeStringEncoding from a StringEncoding, use the $encoding() function  
export type NormativeStringEncoding = 'ascii' | 'latin1' | 'utf8' | 'utf16le' | 'base64' | 'base64url' | 'hex' ;
export type StringEncoding = NormativeStringEncoding | 
                            'ASCII' |
                            'bin' | 'BIN' | 'binary' | 'BINARY' | 'LATIN1' | 'iso-latin1' | 'ISO-LATIN1' | 'isolatin1' | 'ISOLATIN1' | 'latin-1' | 'LATIN-1' | 'latin_1' | 'LATIN_1' | 'ISOLatin1' | 'ISO-8859-1' | 'iso-8859-1' | '8859-1' | 'ISO_8859-1' | 'iso-ir-100' | '819' | 'cp819' | 'CP819' | 'IBM819' | 'l1' | 'csISOLatin1' | 'ansicpg819' | '\\ansicpg819' | "ISO8859-1" |
                            'utf-8' | 'UTF8' | 'UTF-8' | 'utf_8' | 'UTF_8' | 
                            'unicode' | 'UNICODE' | 'utf16' | 'utf-16' | 'utf_16' | 'UTF16' | 'UTF-16' | 'UTF_16' | "ucs2" | "ucs-2" | 'ucs_2' | 'UCS2' | 'UCS-2' | 'UCS_2' | 'utf-16le' | 'UTF-16LE' | 'utf_16le' | 'UTF_16LE' | 'UTF16LE' |
                            'BASE64' | 'BASE64URL' | 'base64-url' | 'BASE64-URL' | 'base64_url' |  'BASE64_URL' |
                            'HEX' | 'hexa' | 'HEXA' | 'hexadecimal' | 'HEXADECIMAL' ;

export type Bytes = uint8[]|Uint8Array|Buffer ;
export type TSDataLike = Bytes|ArrayBuffer|TSData ;

export type UUIDVersion = 1 | 4 ; 
export const UUIDv1:UUIDVersion = 1 ;
export const UUIDv4:UUIDVersion = 4 ;

export const uuidV1Regex:RegExp   = /^[A-F\d]{8}-[A-F\d]{4}-[A-F\d]{4}-[A-F\d]{4}-[A-F\d]{12}$/i ;
export const uuidV4Regex:RegExp = /^[A-F\d]{8}-[A-F\d]{4}-4[A-F\d]{3}-[89AB][A-F\d]{3}-[A-F\d]{12}$/i ;
export const emailRegex:RegExp = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()\.,;\s@\"]+\.{0,1})+([^<>()\.,;:\s@\"]{2,}|[\d\.]+))$/ ;
export const urlRegex:RegExp   = /^(?:(?:([a-zA-Z]+):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff_-]{0,62})?[a-z0-9\u00a1-\uffff]\.)+(?:[a-z\u00a1-\uffff]{2,}\.?))(?::\d{2,5})?(?:[/?#]\S*)?$/i ;

// ========== comparison types =====================
export const Ascending = -1 ;
export const Same = 0 ;
export const Descending = 1 ;

export type Comparison = -1 | 0 | 1 | undefined ; 

// ========== enumerated types =====================
// ISO 3166-1 alpha-2
export enum Countries {
    AC = 'AC',  AD = 'AD',  AE = 'AE',  AF = 'AF',  AG = 'AG',  AI = 'AI',  AL = 'AL',  AM = 'AM',  AO = 'AO',  AR = 'AR',  AS = 'AS',  AT = 'AT',  AU = 'AU',  AW = 'AW',  AX = 'AX',  AZ = 'AZ',  
    BA = 'BA',  BB = 'BB',  BD = 'BD',  BE = 'BE',  BF = 'BF',  BG = 'BG',  BH = 'BH',  BI = 'BI',  BJ = 'BJ',  BL = 'BL',  BM = 'BM',  BN = 'BN',  BO = 'BO',  BQ = 'BQ',  BR = 'BR',  BS = 'BS',  BT = 'BT',  BW = 'BW',  BY = 'BY',  BZ = 'BZ',
    CA = 'CA',  CC = 'CC',  CD = 'CD',  CF = 'CF',  CG = 'CG',  CH = 'CH',  CI = 'CI',  CK = 'CK',  CL = 'CL',  CM = 'CM',  CN = 'CN',  CO = 'CO',  CR = 'CR',  CU = 'CU',  CV = 'CV',  CW = 'CW',  CX = 'CX',  CY = 'CY',  CZ = 'CZ',
    DE = 'DE',  DJ = 'DJ',  DK = 'DK',  DM = 'DM',  DO = 'DO',  DZ = 'DZ',  
    EC = 'EC',  EE = 'EE',  EG = 'EG',  EH = 'EH',  ER = 'ER',  ES = 'ES',  ET = 'ET',  
    FI = 'FI',  FJ = 'FJ',  FK = 'FK',  FM = 'FM',  FO = 'FO',  FR = 'FR',  
    GA = 'GA',  GB = 'GB',  GD = 'GD',  GE = 'GE',  GF = 'GF',  GG = 'GG',  GH = 'GH',  GI = 'GI',  GL = 'GL',  GM = 'GM',  GN = 'GN',  GP = 'GP',  GQ = 'GQ',  GR = 'GR',  GT = 'GT',  GU = 'GU',  GW = 'GW',  GY = 'GY',  
    HK = 'HK',  HN = 'HN',  HR = 'HR',  HT = 'HT',  HU = 'HU',  
    ID = 'ID',  IE = 'IE',  IL = 'IL',  IM = 'IM',  IN = 'IN',  IO = 'IO',  IQ = 'IQ',  IR = 'IR',  IS = 'IS',  IT = 'IT',  
    JE = 'JE',  JM = 'JM',  JO = 'JO',  JP = 'JP',  
    KE = 'KE',  KG = 'KG',  KH = 'KH',  KI = 'KI',  KM = 'KM',  KN = 'KN',  KP = 'KP',  KR = 'KR',  KW = 'KW',  KY = 'KY',  KZ = 'KZ',  
    LA = 'LA',  LB = 'LB',  LC = 'LC',  LI = 'LI',  LK = 'LK',  LR = 'LR',  LS = 'LS',  LT = 'LT',  LU = 'LU',  LV = 'LV',  LY = 'LY',  
    MA = 'MA',  MC = 'MC',  MD = 'MD',  ME = 'ME',  MF = 'MF',  MG = 'MG',  MH = 'MH',  MK = 'MK',  ML = 'ML',  MM = 'MM',  MN = 'MN',  MO = 'MO',  MP = 'MP',  MQ = 'MQ',  MR = 'MR',  MS = 'MS',  MT = 'MT',  MU = 'MU',  MV = 'MV',  MW = 'MW',  MX = 'MX',  MY = 'MY',  MZ = 'MZ',  
    NA = 'NA',  NC = 'NC',  NE = 'NE',  NF = 'NF',  NG = 'NG',  NI = 'NI',  NL = 'NL',  NO = 'NO',  NP = 'NP',  NR = 'NR',  NU = 'NU',  NZ = 'NZ',  
    OM = 'OM',  
    PA = 'PA',  PE = 'PE',  PF = 'PF',  PG = 'PG',  PH = 'PH',  PK = 'PK',  PL = 'PL',  PM = 'PM',  PR = 'PR',  PS = 'PS',  PT = 'PT',  PW = 'PW',  PY = 'PY',  
    QA = 'QA',  
    RE = 'RE',  RO = 'RO',  RS = 'RS',  RU = 'RU',  RW = 'RW',  
    SA = 'SA',  SB = 'SB',  SC = 'SC',  SD = 'SD',  SE = 'SE',  SG = 'SG',  SH = 'SH',  SI = 'SI',  SJ = 'SJ',  SK = 'SK',  SL = 'SL',  SM = 'SM',  SN = 'SN',  SO = 'SO',  SR = 'SR',  SS = 'SS',  ST = 'ST',  SV = 'SV',  SX = 'SX',  SY = 'SY',  SZ = 'SZ',  
    TA = 'TA',  TC = 'TC',  TD = 'TD',  TG = 'TG',  TH = 'TH',  TJ = 'TJ',  TK = 'TK',  TL = 'TL',  TM = 'TM',  TN = 'TN',  TO = 'TO',  TR = 'TR',  TT = 'TT',  TV = 'TV',  TW = 'TW',  TZ = 'TZ',  
    UA = 'UA',  UG = 'UG',  US = 'US',  UY = 'UY',  UZ = 'UZ',  
    VA = 'VA',  VC = 'VC',  VE = 'VE',  VG = 'VG',  VI = 'VI',  VN = 'VN',  VU = 'VU',  
    WF = 'WF',  WS = 'WS',  
    XK = 'XK',  
    YE = 'YE',  YT = 'YT',  
    ZA = 'ZA',  ZM = 'ZM',  ZW = 'ZW'
} ;

// ISO 639-1 (excepted all constructed languages)
export enum Languages {
    aa = 'aa', ab = 'ab', ae = 'ae', af = 'af', ak = 'ak', am = 'am', an = 'an', ar = 'ar', as = 'as', av = 'av', ay = 'ay', az = 'az',
    ba = 'ba', be = 'be', bg = 'bg', bh = 'bh', bi = 'bi', bm = 'bm', bn = 'bn', bo = 'bo', br = 'br', bs = 'bs',
    ca = 'ca', ce = 'ce', ch = 'ch', co = 'co', cr = 'cr', cs = 'cs', cu = 'cu', cv = 'cv', cy = 'cy',
    da = 'da', de = 'de', dv = 'dv', dz = 'dz',
    ee = 'ee', el = 'el', en = 'en', es = 'es', et = 'et', eu = 'eu',
    fa = 'fa', ff = 'ff', fi = 'fi', fj = 'fj', fo = 'fo', fr = 'fr', fy = 'fy',
    ga = 'ga', gd = 'gd', gl = 'gl', gn = 'gn', gu = 'gu', gv = 'gv',
    ha = 'ha', he = 'he', hi = 'hi', ho = 'ho', hr = 'hr', ht = 'ht', hu = 'hu', hy = 'hy', hz = 'hz',
    id = 'id', ig = 'ig', ii = 'ii', ik = 'ik', is = 'is', it = 'it', iu = 'iu',
    ja = 'ja', jv = 'jv',
    ka = 'ka', kg = 'kg', ki = 'ki', kj = 'kj', kk = 'kk', kl = 'kl', km = 'km', kn = 'kn', ko = 'ko', kr = 'kr', ks = 'ks', ku = 'ku', kv = 'kv', kw = 'kw', ky = 'ky',
    la = 'la', lb = 'lb', lg = 'lg', li = 'li', ln = 'ln', lo = 'lo', lt = 'lt', lu = 'lu', lv = 'lv',
    mg = 'mg', mh = 'mh', mi = 'mi', mk = 'mk', ml = 'ml', mn = 'mn', mr = 'mr', ms = 'ms', mt = 'mt', my = 'my',
    na = 'na', nb = 'nb', nd = 'nd', ne = 'ne', ng = 'ng', nl = 'nl', nn = 'nn', no = 'no', nr = 'nr', nv = 'nv', ny = 'ny',
    oc = 'oc', oj = 'oj', om = 'om', or = 'or', os = 'os',
    pa = 'pa', pi = 'pi', pl = 'pl', ps = 'ps', pt = 'pt',
    qu = 'qu',
    rm = 'rm', rn = 'rn', ro = 'ro', ru = 'ru', rw = 'rw',
    sa = 'sa', sc = 'sc', sd = 'sd', se = 'se', sg = 'sg', si = 'si', sk = 'sk', sl = 'sl', sm = 'sm', sn = 'sn', so = 'so', sq = 'sq', sr = 'sr', ss = 'ss', st = 'st', su = 'su', sv = 'sv', sw = 'sw',
    ta = 'ta', te = 'te', tg = 'tg', th = 'th', ti = 'ti', tk = 'tk', tl = 'tl', tn = 'tn', to = 'to', tr = 'tr', ts = 'ts', tt = 'tt', tw = 'tw', ty = 'ty',
    ug = 'ug', uk = 'uk', ur = 'ur', uz = 'uz',
    ve = 've', vi = 'vi',
    wa = 'wa', wo = 'wo',
    xh = 'xh',
    yi = 'yi', yo = 'yo',
    za = 'za', zh = 'zh', zu = 'zu'
} ;

export enum Currencies {
    AED = 'AED', AFN = 'AFN', ALL = 'ALL', AMD = 'AMD', ANG = 'ANG', AOA = 'AOA', ARP = 'ARP', ARS = 'ARS', AUD = 'AUD', AWG = 'AWG', AZN = 'AZN', 
    BAM = 'BAM', BBD = 'BBD', BDT = 'BDT', BGN = 'BGN', BHD = 'BHD', BIF = 'BIF', BMD = 'BMD', BND = 'BND', BOB = 'BOB', BOV = 'BOV', BRL = 'BRL', BSD = 'BSD', BTN = 'BTN', BWP = 'BWP', BYR = 'BYR', BYN = 'BYN', BZD = 'BZD', 
    CAD = 'CAD', CDF = 'CDF', CHF = 'CHF', CLF = 'CLF', CLP = 'CLP', CNY = 'CNY', COP = 'COP', COU = 'COU', CRC = 'CRC', CUC = 'CUC', CUP = 'CUP', CVE = 'CVE', CYP = 'CYP', CZK = 'CZK', 
    DJF = 'DJF', DKK = 'DKK', DOP = 'DOP', DZD = 'DZD', 
    ECS = 'ECS', ECV = 'ECV', EGP = 'EGP', ERN = 'ERN', ETB = 'ETB', EUR = 'EUR', 
    FJD = 'FJD', FKP = 'FKP', 
    GBP = 'GBP', GEL = 'GEL', GHS = 'GHS', GIP = 'GIP', GMD = 'GMD', GNF = 'GNF', GTQ = 'GTQ', GWP = 'GWP', GYD = 'GYD', 
    HKD = 'HKD', HNL = 'HNL', HRK = 'HRK', HTG = 'HTG', HUF = 'HUF', 
    IDR = 'IDR', ILS = 'ILS', INR = 'INR', IQD = 'IQD', IRR = 'IRR', ISK = 'ISK', 
    JMD = 'JMD', JOD = 'JOD', JPY = 'JPY', 
    KES = 'KES', KGS = 'KGS', KHR = 'KHR', KMF = 'KMF', KPW = 'KPW', KRW = 'KRW', KZT = 'KZT', KWD = 'KWD', KYD = 'KYD', 
    LAK = 'LAK', LBP = 'LBP', LKR = 'LKR', LRD = 'LRD', LSL = 'LSL', LTL = 'LTL', LVL = 'LVL', LYD = 'LYD', 
    MAD = 'MAD', MDL = 'MDL', MGA = 'MGA', MKD = 'MKD', MMK = 'MMK', MNT = 'MNT', MOP = 'MOP', MRU = 'MRU', MUR = 'MUR', MVR = 'MVR', MWK = 'MWK', MXN = 'MXN', MXV = 'MXV', MYR = 'MYR', MZN = 'MZN', 
    NAD = 'NAD', NGN = 'NGN', NHF = 'NHF', NIO = 'NIO', NOK = 'NOK', NPR = 'NPR', NZD = 'NZD', 
    OMR = 'OMR', 
    PAB = 'PAB', PEN = 'PEN', PGK = 'PGK', PHP = 'PHP', PKR = 'PKR', PLN = 'PLN', PYG = 'PYG', 
    QAR = 'QAR', 
    RON = 'RON', RSD = 'RSD', RUB = 'RUB', RWF = 'RWF', 
    SAR = 'SAR', SBD = 'SBD', SCR = 'SCR', SDG = 'SDG', SEK = 'SEK', SGD = 'SGD', SHP = 'SHP', SLL = 'SLL', SOS = 'SOS', SRD = 'SRD', SSP = 'SSP', STD = 'STD', SVC = 'SVC', SYP = 'SYP', SZL = 'SZL', 
    THB = 'THB', TJS = 'TJS', TMT = 'TMT', TND = 'TND', TOP = 'TOP', TRY = 'TRY', TTD = 'TTD', TWD = 'TWD', TZS = 'TZS', 
    UAH = 'UAH', UGX = 'UGX', USD = 'USD', USN = 'USN', UYU = 'UYU', UYW = 'UYW', UZS = 'UZS', 
    VEB = 'VEB', VES = 'VES', VND = 'VND', VUV = 'VUV', 
    WST = 'WST', 
    XAF = 'XAF', XAG = 'XAG', XAU = 'XAU', XCD = 'XCD', XDR = 'XDR', XFO = 'XFO', XFU = 'XFU', XOF = 'XOF', XPD = 'XPD', XPF = 'XPF', XPT = 'XPT', XSU = 'XSU', XUA = 'XUA', 
    YER = 'YER', 
    ZAR = 'ZAR', ZMK = 'ZMK', ZWL = 'ZWL'
} ;

export type country = keyof typeof Countries ;
export type language = keyof typeof Languages ;
export type currency = keyof typeof Currencies ;

// ========== dictionary types =====================
export type TSDictionary<T = any> = { [k: string]: T };

export type ObjectDictionary = 		TSDictionary<object> 
export type StringDictionary = 		TSDictionary<string> ;
export type NumberDictionary = 		TSDictionary<number> ;
export type FlagDictionary = 		TSDictionary<boolean> ;
export type StringArrayDictionary = TSDictionary<string[]> ;
export type NumberArrayDictionary = TSDictionary<number[]> ;
export type StringTranslation =     { [key in Languages]?:string } ;

// ========== interfaces =====================
export interface Address {
	streetNumber?:string ;
	street?:string ;
	complement?:string ;
	zipCode?:string ;
	city:string ;
	country:country ;	
}
