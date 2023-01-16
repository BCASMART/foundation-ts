import { $crc32, $decrypt, $encrypt, $hash } from "../src/crypto";
import { TSTest } from "../src/tstester";

export const cryptoGroups = TSTest.group("Commons cryptographic functions", async (group) => {
    const text = `Lorem Ipsum comes from a latin text written in 45BC by Roman statesman, lawyer, scholar, and philosopher, Marcus Tullius Cicero. The text is titled "de Finibus Bonorum et Malorum" which means "The Extremes of Good and Evil". The most common form of Lorem ipsum is the following:Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. The text is a corrupted version of the original and therefore does not mean anything in particular. The book however where it originates discusses the philosophical views of Epicureanism, Stoicism, and the Platonism of Antiochus of Ascalon. Lorem ipsum is widely in use since the 14th century and up to today as the default dummy "random" text of the typesetting and web development industry. In fact not only it has survived the test of time but it thrived and can be found in many software products, from Microsoft Word to WordPress.` ;
    group.unary("$encrypt()/$decrypt() functions", async(t) => {
        //           12345678901234567890123456789012
        const key = "my32octetskeyforcryptingZPOL1na0" ;
        const encrypted = $encrypt(text, key) ;
        if (t.expect0(encrypted).filled()) {
            const decrypted = $decrypt(encrypted!, key) ;
            t.expect1(decrypted).is(text) ;    
        }
    }) ;
    group.unary("$crc32() function", async(t) => {
        t.expect0($crc32('ABCDEFGHIJKLMNOPQRSTUVWXYZ')).is(0xabf77822) ;
        t.expect1($crc32(text)).is(0x9359156b) ;
    }) ;
    group.unary("$hash() function", async(t) => {
        t.expect0($hash('ABCDEFGHIJKLMNOPQRSTUVWXYZ')).is('d6ec6898de87ddac6e5b3611708a7aa1c2d298293349cc1a6c299a1db7149d38') ;
        t.expect1($hash(text)).is('67b793d0960b450ed81f8c4ff2bfcf45972251de15550a6cfaaf67d3ac38df7f') ;
    }) ;

}) ;

