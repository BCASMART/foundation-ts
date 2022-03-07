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
export type uuid   	 = Opaque<string> ;
export type email 	 = Opaque<string> ;
export type url 	 = Opaque<string> ; 

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
export type country = 'AC' | 'AD' | 'AE' | 'AF' | 'AG' | 'AI' | 'AL' | 'AM' | 'AO' | 'AR' | 'AS' | 'AT' | 'AU' | 'AW' | 'AX' | 'AZ' | 'BA' | 'BB' | 'BD' | 'BE' | 'BF' | 'BG' | 'BH' | 'BI' | 'BJ' | 'BL' | 'BM' | 'BN' | 'BO' | 'BQ' | 'BR' | 'BS' | 'BT' | 'BW' | 'BY' | 'BZ' | 'CA' | 'CC' | 'CD' | 'CF' | 'CG' | 'CH' | 'CI' | 'CK' | 'CL' | 'CM' | 'CN' | 'CO' | 'CR' | 'CU' | 'CV' | 'CW' | 'CX' | 'CY' | 'CZ' | 'DE' | 'DJ' | 'DK' | 'DM' | 'DO' | 'DZ' | 'EC' | 'EE' | 'EG' | 'EH' | 'ER' | 'ES' | 'ET' | 'FI' | 'FJ' | 'FK' | 'FM' | 'FO' | 'FR' | 'GA' | 'GB' | 'GD' | 'GE' | 'GF' | 'GG' | 'GH' | 'GI' | 'GL' | 'GM' | 'GN' | 'GP' | 'GQ' | 'GR' | 'GT' | 'GU' | 'GW' | 'GY' | 'HK' | 'HN' | 'HR' | 'HT' | 'HU' | 'ID' | 'IE' | 'IL' | 'IM' | 'IN' | 'IO' | 'IQ' | 'IR' | 'IS' | 'IT' | 'JE' | 'JM' | 'JO' | 'JP' | 'KE' | 'KG' | 'KH' | 'KI' | 'KM' | 'KN' | 'KP' | 'KR' | 'KW' | 'KY' | 'KZ' | 'LA' | 'LB' | 'LC' | 'LI' | 'LK' | 'LR' | 'LS' | 'LT' | 'LU' | 'LV' | 'LY' | 'MA' | 'MC' | 'MD' | 'ME' | 'MF' | 'MG' | 'MH' | 'MK' | 'ML' | 'MM' | 'MN' | 'MO' | 'MP' | 'MQ' | 'MR' | 'MS' | 'MT' | 'MU' | 'MV' | 'MW' | 'MX' | 'MY' | 'MZ' | 'NA' | 'NC' | 'NE' | 'NF' | 'NG' | 'NI' | 'NL' | 'NO' | 'NP' | 'NR' | 'NU' | 'NZ' | 'OM' | 'PA' | 'PE' | 'PF' | 'PG' | 'PH' | 'PK' | 'PL' | 'PM' | 'PR' | 'PS' | 'PT' | 'PW' | 'PY' | 'QA' | 'RE' | 'RO' | 'RS' | 'RU' | 'RW' | 'SA' | 'SB' | 'SC' | 'SD' | 'SE' | 'SG' | 'SH' | 'SI' | 'SJ' | 'SK' | 'SL' | 'SM' | 'SN' | 'SO' | 'SR' | 'SS' | 'ST' | 'SV' | 'SX' | 'SY' | 'SZ' | 'TA' | 'TC' | 'TD' | 'TG' | 'TH' | 'TJ' | 'TK' | 'TL' | 'TM' | 'TN' | 'TO' | 'TR' | 'TT' | 'TV' | 'TW' | 'TZ' | 'UA' | 'UG' | 'US' | 'UY' | 'UZ' | 'VA' | 'VC' | 'VE' | 'VG' | 'VI' | 'VN' | 'VU' | 'WF' | 'WS' | 'XK' | 'YE' | 'YT' | 'ZA' | 'ZM' | 'ZW';

// ISO 639-1 (excepted all constructed languages)
export type language = 'aa' | 'ab' | 'ae' | 'af' | 'ak' | 'am' | 'an' | 'ar' | 'as' | 'av' | 'ay' | 'az' | 'ba' | 'be' | 'bg' | 'bh' | 'bi' | 'bm' | 'bn' | 'bo' | 'br' | 'bs' | 'ca' | 'ce' | 'ch' | 'co' | 'cr' | 'cs' | 'cu' | 'cv' | 'cy' | 'da' | 'de' | 'dv' | 'dz' | 'ee' | 'el' | 'en' | 'es' | 'et' | 'eu' | 'fa' | 'ff' | 'fi' | 'fj' | 'fo' | 'fr' | 'fy' | 'ga' | 'gd' | 'gl' | 'gn' | 'gu' | 'gv' | 'ha' | 'he' | 'hi' | 'ho' | 'hr' | 'ht' | 'hu' | 'hy' | 'hz' | 'id' | 'ig' | 'ii' | 'ik' | 'is' | 'it' | 'iu' | 'ja' | 'jv' | 'ka' | 'kg' | 'ki' | 'kj' | 'kk' | 'kl' | 'km' | 'kn' | 'ko' | 'kr' | 'ks' | 'ku' | 'kv' | 'kw' | 'ky' | 'la' | 'lb' | 'lg' | 'li' | 'ln' | 'lo' | 'lt' | 'lu' | 'lv' | 'mg' | 'mh' | 'mi' | 'mk' | 'ml' | 'mn' | 'mr' | 'ms' | 'mt' | 'my' | 'na' | 'nb' | 'nd' | 'ne' | 'ng' | 'nl' | 'nn' | 'no' | 'nr' | 'nv' | 'ny' | 'oc' | 'oj' | 'om' | 'or' | 'os' | 'pa' | 'pi' | 'pl' | 'ps' | 'pt' | 'qu' | 'rm' | 'rn' | 'ro' | 'ru' | 'rw' | 'sa' | 'sc' | 'sd' | 'se' | 'sg' | 'si' | 'sk' | 'sl' | 'sm' | 'sn' | 'so' | 'sq' | 'sr' | 'ss' | 'st' | 'su' | 'sv' | 'sw' | 'ta' | 'te' | 'tg' | 'th' | 'ti' | 'tk' | 'tl' | 'tn' | 'to' | 'tr' | 'ts' | 'tt' | 'tw' | 'ty' | 'ug' | 'uk' | 'ur' | 'uz' | 've' | 'vi' | 'wa' | 'wo' | 'xh' | 'yi' | 'yo' | 'za' | 'zh' | 'zu' ;

// ========== dictionary types =====================
export type AnyDictionary = 		{ [key: string]: any } ;
export type ObjectDictionary = 		{ [key: string]: object } 
export type StringDictionary = 		{ [key: string]: string } ;
export type NumberDictionary = 		{ [key: string]: number } ;
export type FlagDictionary = 		{ [key: string]: boolean } ;
export type StringArrayDictionary = { [key: string]: string[] } ;
export type NumberArrayDictionary = { [key: string]: number[] } ;

export type Translation = { [key in language]:string }
export type TranslationDictionary = { [key:string]:Translation }

// ========== interfaces =====================
export interface Address {
	streetNumber?:string ;
	street?:string ;
	complement?:string ;
	zipCode?:string ;
	city:string ;
	country:country ;	
}
