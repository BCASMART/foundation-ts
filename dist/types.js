export const INT8_MAX = 0x7f;
export const INT8_MIN = (-INT8_MAX - 1);
export const INT16_MAX = 0x7fff;
export const INT16_MIN = (-INT16_MAX - 1);
export const INT32_MAX = 0x7fffffff;
export const INT32_MIN = (-INT32_MAX - 1);
export const INT_MAX = (Number.MAX_SAFE_INTEGER - 1);
export const INT_MIN = (Number.MIN_SAFE_INTEGER + 1);
export const UINT8_MAX = 0xff;
export const UINT8_MIN = 0;
export const UINT16_MAX = 0xffff;
export const UINT16_MIN = 0;
export const UINT32_MAX = 0xffffffff;
export const UINT32_MIN = 0;
export const UINT_MAX = (Number.MAX_SAFE_INTEGER - 1);
export const UINT_MIN = 0;
export const MONEY_MIN = -999999999;
export const MONEY_MAX = +999999999;
export const FREE = 0;
export const uuidRegex = /^[A-F\d]{8}-[A-F\d]{4}-[A-F\d]{4}-[A-F\d]{4}-[A-F\d]{12}$/i;
export const emailRegex = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()\.,;\s@\"]+\.{0,1})+([^<>()\.,;:\s@\"]{2,}|[\d\.]+))$/;
export const urlRegex = /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff_-]{0,62})?[a-z0-9\u00a1-\uffff]\.)+(?:[a-z\u00a1-\uffff]{2,}\.?))(?::\d{2,5})?(?:[/?#]\S*)?$/i;
// ========== comparison types =====================
export const Ascending = -1;
export const Same = 0;
export const Descending = 1;
//# sourceMappingURL=types.js.map