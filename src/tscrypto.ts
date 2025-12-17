import { $length, $ok } from "./commons";
import { Nullable, uint16, uint32 } from "./types";

export class TSCrypto {

    static sha1(data:Nullable<Uint8Array>):Uint8Array { return _Uint8ArrayFromUIntegers(TSCrypto._sha1(data)) ; }
    static sha1String(data:Nullable<Uint8Array>):string { return _stringFromUIntegers(TSCrypto._sha1(data)) ; }

    static sha224(data:Nullable<Uint8Array>):Uint8Array { return _Uint8ArrayFromUIntegers(TSCrypto._sha256(data, true)) ; }
    static sha224String(data:Nullable<Uint8Array>):string { return _stringFromUIntegers(TSCrypto._sha256(data, true)) ; }

    static sha256(data:Nullable<Uint8Array>):Uint8Array { return _Uint8ArrayFromUIntegers(TSCrypto._sha256(data, false)) ; }
    static sha256String(data:Nullable<Uint8Array>):string { return _stringFromUIntegers(TSCrypto._sha256(data, false)) ; }

    static sha384(data:Nullable<Uint8Array>):Uint8Array { return _Uint8ArrayFromBigIntegers(TSCrypto._sha512(data, true)) ; }
    static sha384String(data:Nullable<Uint8Array>):string { return _stringFromBigIntegers(TSCrypto._sha512(data, true)) ; }

    static sha512(data:Nullable<Uint8Array>):Uint8Array { return _Uint8ArrayFromBigIntegers(TSCrypto._sha512(data, false)) ; }
    static sha512String(data:Nullable<Uint8Array>):string { return _stringFromBigIntegers(TSCrypto._sha512(data, false)) ; }

    // CRC-16/ARC algorithm
    static crc16(source: Nullable<Uint8Array>): uint16
    { 
        return $ok(source) ? 
               TSCrypto._crc(source!, 0, TSCrypto.TSCRC16ARCTable, 0xffff) >>> 0 as uint16 : 
               0 as uint16 ; 
    }

    // CRC-32 algorithm
    static crc32(source: Nullable<Uint8Array>): uint32
    { 
        return $ok(source) ? 
               (TSCrypto._crc(source!, 0 ^ -1, TSCrypto.TSCRC32Table, 0x00ffffff) ^ -1) >>> 0 as uint32 :
               ((0 ^ 1) ^ -1) >>> 0 as uint32 ; 
    }

    static readonly TSCRC16ARCTable = [
        0x0000, 0xc0c1, 0xc181, 0x0140, 0xc301, 0x03c0, 0x0280, 0xc241, 
        0xc601, 0x06c0, 0x0780, 0xc741, 0x0500, 0xc5c1, 0xc481, 0x0440, 
        0xcc01, 0x0cc0, 0x0d80, 0xcd41, 0x0f00, 0xcfc1, 0xce81, 0x0e40,
        0x0a00, 0xcac1, 0xcb81, 0x0b40, 0xc901, 0x09c0, 0x0880, 0xc841, 
        0xd801, 0x18c0, 0x1980, 0xd941, 0x1b00, 0xdbc1, 0xda81, 0x1a40, 
        0x1e00, 0xdec1, 0xdf81, 0x1f40, 0xdd01, 0x1dc0, 0x1c80, 0xdc41,
        0x1400, 0xd4c1, 0xd581, 0x1540, 0xd701, 0x17c0, 0x1680, 0xd641, 
        0xd201, 0x12c0, 0x1380, 0xd341, 0x1100, 0xd1c1, 0xd081, 0x1040, 
        0xf001, 0x30c0, 0x3180, 0xf141, 0x3300, 0xf3c1, 0xf281, 0x3240,
        0x3600, 0xf6c1, 0xf781, 0x3740, 0xf501, 0x35c0, 0x3480, 0xf441, 
        0x3c00, 0xfcc1, 0xfd81, 0x3d40, 0xff01, 0x3fc0, 0x3e80, 0xfe41, 
        0xfa01, 0x3ac0, 0x3b80, 0xfb41, 0x3900, 0xf9c1, 0xf881, 0x3840,
        0x2800, 0xe8c1, 0xe981, 0x2940, 0xeb01, 0x2bc0, 0x2a80, 0xea41, 
        0xee01, 0x2ec0, 0x2f80, 0xef41, 0x2d00, 0xedc1, 0xec81, 0x2c40, 
        0xe401, 0x24c0, 0x2580, 0xe541, 0x2700, 0xe7c1, 0xe681, 0x2640,
        0x2200, 0xe2c1, 0xe381, 0x2340, 0xe101, 0x21c0, 0x2080, 0xe041, 
        0xa001, 0x60c0, 0x6180, 0xa141, 0x6300, 0xa3c1, 0xa281, 0x6240, 
        0x6600, 0xa6c1, 0xa781, 0x6740, 0xa501, 0x65c0, 0x6480, 0xa441,
        0x6c00, 0xacc1, 0xad81, 0x6d40, 0xaf01, 0x6fc0, 0x6e80, 0xae41, 
        0xaa01, 0x6ac0, 0x6b80, 0xab41, 0x6900, 0xa9c1, 0xa881, 0x6840, 
        0x7800, 0xb8c1, 0xb981, 0x7940, 0xbb01, 0x7bc0, 0x7a80, 0xba41,
        0xbe01, 0x7ec0, 0x7f80, 0xbf41, 0x7d00, 0xbdc1, 0xbc81, 0x7c40, 
        0xb401, 0x74c0, 0x7580, 0xb541, 0x7700, 0xb7c1, 0xb681, 0x7640, 
        0x7200, 0xb2c1, 0xb381, 0x7340, 0xb101, 0x71c0, 0x7080, 0xb041,
        0x5000, 0x90c1, 0x9181, 0x5140, 0x9301, 0x53c0, 0x5280, 0x9241, 
        0x9601, 0x56c0, 0x5780, 0x9741, 0x5500, 0x95c1, 0x9481, 0x5440, 
        0x9c01, 0x5cc0, 0x5d80, 0x9d41, 0x5f00, 0x9fc1, 0x9e81, 0x5e40,
        0x5a00, 0x9ac1, 0x9b81, 0x5b40, 0x9901, 0x59c0, 0x5880, 0x9841, 
        0x8801, 0x48c0, 0x4980, 0x8941, 0x4b00, 0x8bc1, 0x8a81, 0x4a40, 
        0x4e00, 0x8ec1, 0x8f81, 0x4f40, 0x8d01, 0x4dc0, 0x4c80, 0x8c41,
        0x4400, 0x84c1, 0x8581, 0x4540, 0x8701, 0x47c0, 0x4680, 0x8641, 
        0x8201, 0x42c0, 0x4380, 0x8341, 0x4100, 0x81c1, 0x8081, 0x4040
    ] ;

    static readonly TSCRC32Table = [
        0x00000000, 0x77073096, 0xee0e612c, 0x990951ba, 0x076dc419, 0x706af48f, 0xe963a535, 0x9e6495a3,
        0x0edb8832, 0x79dcb8a4, 0xe0d5e91e, 0x97d2d988, 0x09b64c2b, 0x7eb17cbd, 0xe7b82d07, 0x90bf1d91,
        0x1db71064, 0x6ab020f2, 0xf3b97148, 0x84be41de, 0x1adad47d, 0x6ddde4eb, 0xf4d4b551, 0x83d385c7,
        0x136c9856, 0x646ba8c0, 0xfd62f97a, 0x8a65c9ec, 0x14015c4f, 0x63066cd9, 0xfa0f3d63, 0x8d080df5,
        0x3b6e20c8, 0x4c69105e, 0xd56041e4, 0xa2677172, 0x3c03e4d1, 0x4b04d447, 0xd20d85fd, 0xa50ab56b,
        0x35b5a8fa, 0x42b2986c, 0xdbbbc9d6, 0xacbcf940, 0x32d86ce3, 0x45df5c75, 0xdcd60dcf, 0xabd13d59,
        0x26d930ac, 0x51de003a, 0xc8d75180, 0xbfd06116, 0x21b4f4b5, 0x56b3c423, 0xcfba9599, 0xb8bda50f,
        0x2802b89e, 0x5f058808, 0xc60cd9b2, 0xb10be924, 0x2f6f7c87, 0x58684c11, 0xc1611dab, 0xb6662d3d,
        0x76dc4190, 0x01db7106, 0x98d220bc, 0xefd5102a, 0x71b18589, 0x06b6b51f, 0x9fbfe4a5, 0xe8b8d433,
        0x7807c9a2, 0x0f00f934, 0x9609a88e, 0xe10e9818, 0x7f6a0dbb, 0x086d3d2d, 0x91646c97, 0xe6635c01,
        0x6b6b51f4, 0x1c6c6162, 0x856530d8, 0xf262004e, 0x6c0695ed, 0x1b01a57b, 0x8208f4c1, 0xf50fc457,
        0x65b0d9c6, 0x12b7e950, 0x8bbeb8ea, 0xfcb9887c, 0x62dd1ddf, 0x15da2d49, 0x8cd37cf3, 0xfbd44c65,
        0x4db26158, 0x3ab551ce, 0xa3bc0074, 0xd4bb30e2, 0x4adfa541, 0x3dd895d7, 0xa4d1c46d, 0xd3d6f4fb,
        0x4369e96a, 0x346ed9fc, 0xad678846, 0xda60b8d0, 0x44042d73, 0x33031de5, 0xaa0a4c5f, 0xdd0d7cc9,
        0x5005713c, 0x270241aa, 0xbe0b1010, 0xc90c2086, 0x5768b525, 0x206f85b3, 0xb966d409, 0xce61e49f,
        0x5edef90e, 0x29d9c998, 0xb0d09822, 0xc7d7a8b4, 0x59b33d17, 0x2eb40d81, 0xb7bd5c3b, 0xc0ba6cad,
        0xedb88320, 0x9abfb3b6, 0x03b6e20c, 0x74b1d29a, 0xead54739, 0x9dd277af, 0x04db2615, 0x73dc1683,
        0xe3630b12, 0x94643b84, 0x0d6d6a3e, 0x7a6a5aa8, 0xe40ecf0b, 0x9309ff9d, 0x0a00ae27, 0x7d079eb1,
        0xf00f9344, 0x8708a3d2, 0x1e01f268, 0x6906c2fe, 0xf762575d, 0x806567cb, 0x196c3671, 0x6e6b06e7,
        0xfed41b76, 0x89d32be0, 0x10da7a5a, 0x67dd4acc, 0xf9b9df6f, 0x8ebeeff9, 0x17b7be43, 0x60b08ed5,
        0xd6d6a3e8, 0xa1d1937e, 0x38d8c2c4, 0x4fdff252, 0xd1bb67f1, 0xa6bc5767, 0x3fb506dd, 0x48b2364b,
        0xd80d2bda, 0xaf0a1b4c, 0x36034af6, 0x41047a60, 0xdf60efc3, 0xa867df55, 0x316e8eef, 0x4669be79,
        0xcb61b38c, 0xbc66831a, 0x256fd2a0, 0x5268e236, 0xcc0c7795, 0xbb0b4703, 0x220216b9, 0x5505262f,
        0xc5ba3bbe, 0xb2bd0b28, 0x2bb45a92, 0x5cb36a04, 0xc2d7ffa7, 0xb5d0cf31, 0x2cd99e8b, 0x5bdeae1d,
        0x9b64c2b0, 0xec63f226, 0x756aa39c, 0x026d930a, 0x9c0906a9, 0xeb0e363f, 0x72076785, 0x05005713,
        0x95bf4a82, 0xe2b87a14, 0x7bb12bae, 0x0cb61b38, 0x92d28e9b, 0xe5d5be0d, 0x7cdcefb7, 0x0bdbdf21,
        0x86d3d2d4, 0xf1d4e242, 0x68ddb3f8, 0x1fda836e, 0x81be16cd, 0xf6b9265b, 0x6fb077e1, 0x18b74777,
        0x88085ae6, 0xff0f6a70, 0x66063bca, 0x11010b5c, 0x8f659eff, 0xf862ae69, 0x616bffd3, 0x166ccf45,
        0xa00ae278, 0xd70dd2ee, 0x4e048354, 0x3903b3c2, 0xa7672661, 0xd06016f7, 0x4969474d, 0x3e6e77db,
        0xaed16a4a, 0xd9d65adc, 0x40df0b66, 0x37d83bf0, 0xa9bcae53, 0xdebb9ec5, 0x47b2cf7f, 0x30b5ffe9,
        0xbdbdf21c, 0xcabac28a, 0x53b39330, 0x24b4a3a6, 0xbad03605, 0xcdd70693, 0x54de5729, 0x23d967bf,
        0xb3667a2e, 0xc4614ab8, 0x5d681b02, 0x2a6f2b94, 0xb40bbe37, 0xc30c8ea1, 0x5a05df1b, 0x2d02ef8d
    ] ;

    static readonly K256 = [
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
        0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
        0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
        0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
        0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
        0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
        0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ] ;

    static readonly K512 = [
        0x428a2f98d728ae22n, 0x7137449123ef65cdn, 0xb5c0fbcfec4d3b2fn, 0xe9b5dba58189dbbcn,
        0x3956c25bf348b538n, 0x59f111f1b605d019n, 0x923f82a4af194f9bn, 0xab1c5ed5da6d8118n,
        0xd807aa98a3030242n, 0x12835b0145706fben, 0x243185be4ee4b28cn, 0x550c7dc3d5ffb4e2n,
        0x72be5d74f27b896fn, 0x80deb1fe3b1696b1n, 0x9bdc06a725c71235n, 0xc19bf174cf692694n,
        0xe49b69c19ef14ad2n, 0xefbe4786384f25e3n, 0x0fc19dc68b8cd5b5n, 0x240ca1cc77ac9c65n,
        0x2de92c6f592b0275n, 0x4a7484aa6ea6e483n, 0x5cb0a9dcbd41fbd4n, 0x76f988da831153b5n,
        0x983e5152ee66dfabn, 0xa831c66d2db43210n, 0xb00327c898fb213fn, 0xbf597fc7beef0ee4n,
        0xc6e00bf33da88fc2n, 0xd5a79147930aa725n, 0x06ca6351e003826fn, 0x142929670a0e6e70n,
        0x27b70a8546d22ffcn, 0x2e1b21385c26c926n, 0x4d2c6dfc5ac42aedn, 0x53380d139d95b3dfn,
        0x650a73548baf63den, 0x766a0abb3c77b2a8n, 0x81c2c92e47edaee6n, 0x92722c851482353bn,
        0xa2bfe8a14cf10364n, 0xa81a664bbc423001n, 0xc24b8b70d0f89791n, 0xc76c51a30654be30n,
        0xd192e819d6ef5218n, 0xd69906245565a910n, 0xf40e35855771202an, 0x106aa07032bbd1b8n,
        0x19a4c116b8d2d0c8n, 0x1e376c085141ab53n, 0x2748774cdf8eeb99n, 0x34b0bcb5e19b48a8n,
        0x391c0cb3c5c95a63n, 0x4ed8aa4ae3418acbn, 0x5b9cca4f7763e373n, 0x682e6ff3d6b2b8a3n,
        0x748f82ee5defb2fcn, 0x78a5636f43172f60n, 0x84c87814a1f0ab72n, 0x8cc702081a6439ecn,
        0x90befffa23631e28n, 0xa4506cebde82bde9n, 0xbef9a3f7b2c67915n, 0xc67178f2e372532bn,
        0xca273eceea26619cn, 0xd186b8c721c0c207n, 0xeada7dd6cde0eb1en, 0xf57d4f7fee6ed178n,
        0x06f067aa72176fban, 0x0a637dc5a2c898a6n, 0x113f9804bef90daen, 0x1b710b35131c471bn,
        0x28db77f523047d84n, 0x32caab7b40c72493n, 0x3c9ebe0a15c9bebcn, 0x431d67c49c100d4cn,
        0x4cc5d4becb3e42b6n, 0x597f299cfc657e2an, 0x5fcb6fab3ad6faecn, 0x6c44198c4a475817n
    ] ;

    static readonly HSHA1 = [0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476, 0xC3D2E1F0] ;
    static readonly HSHA224 = [0xc1059ed8, 0x367cd507, 0x3070dd17, 0xf70e5939, 0xffc00b31, 0x68581511, 0x64f98fa7, 0xbefa4fa4] ;
    static readonly HSHA256 = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19] ;
    static readonly HSHA384 = [0xcbbb9d5dc1059ed8n, 0x629a292a367cd507n, 0x9159015a3070dd17n, 0x152fecd8f70e5939n,
                               0x67332667ffc00b31n, 0x8eb44a8768581511n, 0xdb0c2e0d64f98fa7n, 0x47b5481dbefa4fa4n] ; 
    static readonly HSHA512 = [0x6a09e667f3bcc908n, 0xbb67ae8584caa73bn, 0x3c6ef372fe94f82bn, 0xa54ff53a5f1d36f1n,
                               0x510e527fade682d1n, 0x9b05688c2b3e6c1fn, 0x1f83d9abfb41bd6bn, 0x5be0cd19137e2179n] ;

    static _sha1(data:Nullable<Uint8Array>):number[] {
        const h = [...TSCrypto.HSHA1] ;
        const message = _padSHA1And256(data) ;
        const mlen = message.length ;

        for (let i = 0; i < mlen ; i += 64) {
            const w = new Array(80);
            for (let j = 0; j < 16; j++) {
                w[j] = (message[i + j * 4] << 24) | (message[i + j * 4 + 1] << 16) |
                        (message[i + j * 4 + 2] << 8) | message[i + j * 4 + 3];
            }
            
            for (let j = 16; j < 80; j++) {
                w[j] = _rotleft32(w[j-3] ^ w[j-8] ^ w[j-14] ^ w[j-16], 1);
            }
            
            let [a, b, c, d, e] = h;
            
            for (let j = 0; j < 80; j++) {
                let f, k;
                if (j < 20) {
                    f = (b & c) | (~b & d);
                    k = 0x5A827999;
                } else if (j < 40) {
                    f = b ^ c ^ d;
                    k = 0x6ED9EBA1;
                } else if (j < 60) {
                    f = (b & c) | (b & d) | (c & d);
                    k = 0x8F1BBCDC;
                } else {
                    f = b ^ c ^ d;
                    k = 0xCA62C1D6;
                }
                
                const temp = (_rotleft32(a, 5) + f + e + k + w[j]) >>> 0;
                e = d;
                d = c;
                c = _rotleft32(b, 30);
                b = a;
                a = temp;
            }
            
            h[0] = (h[0] + a) >>> 0;
            h[1] = (h[1] + b) >>> 0;
            h[2] = (h[2] + c) >>> 0;
            h[3] = (h[3] + d) >>> 0;
            h[4] = (h[4] + e) >>> 0;
        }
        return h ;        
    }
    
    private static _sha256(data:Nullable<Uint8Array>, is224:boolean):number[] {
        const k = TSCrypto.K256 ;
        const h = [...(is224 ? TSCrypto.HSHA224 : TSCrypto.HSHA256)] ;
        const message = _padSHA1And256(data);
        
        for (let i = 0; i < message.length; i += 64) {
            const w = new Array(64);
            for (let j = 0; j < 16; j++) {
                w[j] = (message[i + j * 4] << 24) | (message[i + j * 4 + 1] << 16) |
                        (message[i + j * 4 + 2] << 8) | message[i + j * 4 + 3];
            }
            
            for (let j = 16; j < 64; j++) {
                const s0 = _rotright32(w[j-15], 7) ^ _rotright32(w[j-15], 18) ^ (w[j-15] >>> 3);
                const s1 = _rotright32(w[j-2], 17) ^ _rotright32(w[j-2], 19) ^ (w[j-2] >>> 10);
                w[j] = (w[j-16] + s0 + w[j-7] + s1) >>> 0;
            }
            
            let [a, b, c, d, e, f, g, h0] = h;
            
            for (let j = 0; j < 64; j++) {
                const S1 = _rotright32(e, 6) ^ _rotright32(e, 11) ^ _rotright32(e, 25);
                const ch = (e & f) ^ (~e & g);
                const temp1 = (h0 + S1 + ch + k[j] + w[j]) >>> 0;
                const S0 = _rotright32(a, 2) ^ _rotright32(a, 13) ^ _rotright32(a, 22);
                const maj = (a & b) ^ (a & c) ^ (b & c);
                const temp2 = (S0 + maj) >>> 0;
                
                h0 = g;
                g = f;
                f = e;
                e = (d + temp1) >>> 0;
                d = c;
                c = b;
                b = a;
                a = (temp1 + temp2) >>> 0;
            }
            
            h[0] = (h[0] + a) >>> 0;
            h[1] = (h[1] + b) >>> 0;
            h[2] = (h[2] + c) >>> 0;
            h[3] = (h[3] + d) >>> 0;
            h[4] = (h[4] + e) >>> 0;
            h[5] = (h[5] + f) >>> 0;
            h[6] = (h[6] + g) >>> 0;
            h[7] = (h[7] + h0) >>> 0;
        }
        return is224 ? h.slice(0, 7) : h;
        // return hf.map(n => n.toString(16).padStart(8, '0')).join('');
    }
    
    private static _sha512(data:Nullable<Uint8Array>, is384:boolean):bigint[] {
        const k = TSCrypto.K512 ;
        const h = [...(is384 ? TSCrypto.HSHA384 : TSCrypto.HSHA512)] ;
        const message = _padSHA512(data);

        for (let i = 0; i < message.length; i += 128) {
            const w = new Array<bigint>(80);
            for (let j = 0; j < 16; j++) {
                w[j] = BigInt(message[i + j * 8]) << 56n |
                        BigInt(message[i + j * 8 + 1]) << 48n |
                        BigInt(message[i + j * 8 + 2]) << 40n |
                        BigInt(message[i + j * 8 + 3]) << 32n |
                        BigInt(message[i + j * 8 + 4]) << 24n |
                        BigInt(message[i + j * 8 + 5]) << 16n |
                        BigInt(message[i + j * 8 + 6]) << 8n |
                        BigInt(message[i + j * 8 + 7]);
            }
            
            for (let j = 16; j < 80; j++) {
                const s0 = _rotright64(w[j-15], 1n) ^ _rotright64(w[j-15], 8n) ^ (w[j-15] >> 7n) ;
                const s1 = _rotright64(w[j-2], 19n) ^ _rotright64(w[j-2], 61n) ^ (w[j-2] >> 6n) ;
                w[j] = (w[j-16] + s0 + w[j-7] + s1) & 0xffffffffffffffffn ;
            }
            
            let [a, b, c, d, e, f, g, h0] = h;
            
            for (let j = 0; j < 80; j++) {
                const S1 = _rotright64(e, 14n) ^ _rotright64(e, 18n) ^ _rotright64(e, 41n) ;
                const ch = (e & f) ^ (~e & g) ;
                const temp1 = (h0 + S1 + ch + k[j] + w[j]) & 0xffffffffffffffffn ;
                const S0 = _rotright64(a, 28n) ^ _rotright64(a, 34n) ^ _rotright64(a, 39n) ;
                const maj = (a & b) ^ (a & c) ^ (b & c) ;
                const temp2 = (S0 + maj) & 0xffffffffffffffffn ;
                
                h0 = g ;
                g = f ;
                f = e ;
                e = (d + temp1) & 0xffffffffffffffffn ;
                d = c ;
                c = b ;
                b = a ;
                a = (temp1 + temp2) & 0xffffffffffffffffn ;
            }
            
            h[0] = (h[0] + a) & 0xffffffffffffffffn ;
            h[1] = (h[1] + b) & 0xffffffffffffffffn ;
            h[2] = (h[2] + c) & 0xffffffffffffffffn ;
            h[3] = (h[3] + d) & 0xffffffffffffffffn ;
            h[4] = (h[4] + e) & 0xffffffffffffffffn ;
            h[5] = (h[5] + f) & 0xffffffffffffffffn ;
            h[6] = (h[6] + g) & 0xffffffffffffffffn ;
            h[7] = (h[7] + h0) & 0xffffffffffffffffn ;
        }
        
        return is384 ? h.slice(0, 6) : h ;
        // return result.map(n => n.toString(16).padStart(16, '0')).join('') ;
    }

    public static _crc(src: Uint8Array, crc:number, table:number[], andValue:number):number
    {
        for (let i = 0, len = src.length; i < len; i++) {
            crc = ((crc >> 8) & andValue) ^ table[(crc ^ src[i]) & 0xff] ;
        }
        return crc ;
    }

}

function _stringFromUIntegers(hash:number[]):string {
    return hash.map(n => n.toString(16).padStart(8, '0')).join('');
}

function _Uint8ArrayFromUIntegers(hash:number[]):Uint8Array {
    const array = new Uint8Array(hash.length*4) ;
    let i = 0 ;
    hash.forEach(uint32 => {
        array[i++] = (uint32 >> 24) & 0xFF;
        array[i++] = (uint32 >> 16) & 0xFF;
        array[i++] = (uint32 >> 8) & 0xFF;
        array[i++] = uint32 & 0xFF;
    });
    return array ;
}

function _stringFromBigIntegers(hash:bigint[]):string {
    return hash.map(n => n.toString(16).padStart(16, '0')).join('')
}

function _Uint8ArrayFromBigIntegers(hash:bigint[]):Uint8Array {
    const array = new Uint8Array(hash.length*8) ;
    let i = 0 ;
    hash.forEach(uint64 => {
        array[i++] = Number((uint64 >> 56n) & 0xFFn);
        array[i++] = Number((uint64 >> 48n) & 0xFFn);
        array[i++] = Number((uint64 >> 40n) & 0xFFn);
        array[i++] = Number((uint64 >> 32n) & 0xFFn);
        array[i++] = Number((uint64 >> 24n) & 0xFFn);
        array[i++] = Number((uint64 >> 16n) & 0xFFn);
        array[i++] = Number((uint64 >> 8n) & 0xFFn);
        array[i++] = Number(uint64 & 0xFFn);
    });
    return array ;
}

function _padSHA1And256(data: Nullable<Uint8Array>): Uint8Array {
    const len = $length(data) ;
    const bitLen = len * 8 ;
    const blockSize = 64;
    const k = (blockSize - ((len + 9) % blockSize)) % blockSize;
    const totalLen = len + 1 + k + 8;
    const padded = new Uint8Array(totalLen);

    if (len) { padded.set(data!) ; }
    padded[len] = 0x80;

    const view = new DataView(padded.buffer);
    view.setUint32(totalLen - 8, Math.floor(bitLen / 0x100000000), false);
    view.setUint32(totalLen - 4, bitLen >>> 0, false);

    return padded;
}

export function _padSHA512(data:Nullable<Uint8Array>) {
    const len = $length(data) ;
    const bitLen = len * 8 ;
    const blockSize = 128;

    const totalBeforePadding = len + 1 + 16;
    const paddingLength = (blockSize - (totalBeforePadding % blockSize)) % blockSize;
    const finalLength = len + 1 + paddingLength + 16;

    const padded = new Uint8Array(finalLength) ;
    if (len && $ok(data)) { padded.set(data!, 0) ; }
    padded[len] = 0x80;

    const lenBuffer = new ArrayBuffer(16);
    const view = new DataView(lenBuffer) ;
    view.setBigUint64(0, 0n, false); // 64 bits hauts à 0
    view.setBigUint64(8, BigInt(bitLen), false) ; 
    padded.set(new Uint8Array(lenBuffer), padded.length - 16);

    return padded ;
}

function _rotleft32(n:number, b:number):number      { return ((n << b) | (n >>> (32 - b))) >>> 0 ; }
function _rotright32(n: number, b: number): number  { return ((n >>> b) | (n << (32 - b))) >>> 0 ; }
function _rotright64(n:bigint, b:bigint): bigint    { return ((n >> b) | (n << (64n - b))) & 0xffffffffffffffffn ; }

