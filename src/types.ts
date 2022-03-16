export type Opaque<V> = V & { readonly __opq__: unique symbol };

// ========== number types =====================
export type int8 	 = Opaque<number> ;
export type int16 	 = Opaque<number> ;
export type int32 	 = Opaque<number> ;
export type int 	 = Opaque<number> ;

export type uint8 	 = Opaque<number> ;
export type uint16 	 = Opaque<number> ;
export type uint32 	 = Opaque<number> ;
export type uint 	 = Opaque<number> ;

export type money 	 = Opaque<number> ;
export type percentage = Opaque<number> ;

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

export const UINT8_MAX:uint8 = <uint8>0xff ;
export const UINT8_MIN:uint8 = <uint8>0 ;
export const UINT16_MAX:uint16 = <uint16>0xffff ;
export const UINT16_MIN:uint16 = <uint16>0 ;
export const UINT32_MAX:uint32 = <uint32>0xffffffff ;
export const UINT32_MIN:uint32 = <uint32>0 ;
export const UINT_MAX:uint = <uint>(Number.MAX_SAFE_INTEGER - 1) ;
export const UINT_MIN:uint = <uint>0 ;

export const MONEY_MIN = <money>-999999999 ;
export const MONEY_MAX = <money>+999999999 ;
export const FREE = <money>0 ;

// ========== string types =====================
export type uuid   	= Opaque<string> ;
export type email 	= Opaque<string> ;
export type url 	= Opaque<string> ; 
export type isodate = Opaque<string> ; 

export const uuidRegex:RegExp = /^[A-F\d]{8}-[A-F\d]{4}-[A-F\d]{4}-[A-F\d]{4}-[A-F\d]{12}$/i ;
export const emailRegex:RegExp = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()\.,;\s@\"]+\.{0,1})+([^<>()\.,;:\s@\"]{2,}|[\d\.]+))$/ ;
export const urlRegex:RegExp   = /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff_-]{0,62})?[a-z0-9\u00a1-\uffff]\.)+(?:[a-z\u00a1-\uffff]{2,}\.?))(?::\d{2,5})?(?:[/?#]\S*)?$/i ;

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

export type country = keyof typeof Countries ;
export type language = keyof typeof Languages ;

// ========== dictionary types =====================
export type AnyDictionary = 		{ [key: string]: any } ;
export type ObjectDictionary = 		{ [key: string]: object } 
export type StringDictionary = 		{ [key: string]: string } ;
export type NumberDictionary = 		{ [key: string]: number } ;
export type FlagDictionary = 		{ [key: string]: boolean } ;
export type StringArrayDictionary = { [key: string]: string[] } ;
export type NumberArrayDictionary = { [key: string]: number[] } ;


// ========== interfaces =====================
export interface Address {
	streetNumber?:string ;
	street?:string ;
	complement?:string ;
	zipCode?:string ;
	city:string ;
	country:country ;	
}
