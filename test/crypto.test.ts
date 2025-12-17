import { $isuuid } from "../src/commons";
import { $crc16, $crc32, $decrypt, $encrypt, $hash, $random, $setCommonItializationVector, $slowhash, $uuid, $uuidVersion, AES128, SHA1, SHA384, SHA512, SHA224, $password, $shuffle, $randomBytes, $nativeHash, $sha1, $sha256, $sha512 } from "../src/crypto";
import { $div } from "../src/number";
import { TSTest } from "../src/tstester";
import { UUIDv1, UUIDv4 } from "../src/types";
import { TSCrypto } from "../src/tscrypto"
import { TSCharset } from "../src/tscharset";

const text = `Lorem Ipsum comes from a latin text written in 45BC by Roman statesman, lawyer, scholar, and philosopher, Marcus Tullius Cicero. The text is titled "de Finibus Bonorum et Malorum" which means "The Extremes of Good and Evil". The most common form of Lorem ipsum is the following:Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. The text is a corrupted version of the original and therefore does not mean anything in particular. The book however where it originates discusses the philosophical views of Epicureanism, Stoicism, and the Platonism of Antiochus of Ascalon. Lorem ipsum is widely in use since the 14th century and up to today as the default dummy "random" text of the typesetting and web development industry. In fact not only it has survived the test of time but it thrived and can be found in many software products, from Microsoft Word to WordPress.` ;

export const cryptoGroups = [
    TSTest.group("Standard hash functions", async (group) => {
        group.unary("$hash(SHA1) function", async(t) => {
            t.expect0($hash("123456789", SHA1)).is('f7c3bc1d808e04732adf679965ccc34ca7ae3441') ;
            t.expect1($hash('ABCDEFGHIJKLMNOPQRSTUVWXYZ', SHA1)).is('80256f39a9d308650ac90d9be9a72a9562454574') ;
            t.expect2($hash(text, SHA1)).is('10c63ddf4e24463770e9dbc14e98ee64be9a15c6') ;
            t.expect3(Buffer.from(text).hash(SHA1)).is('10c63ddf4e24463770e9dbc14e98ee64be9a15c6') ;
            t.expectA("123456789".hash(SHA1)).is('f7c3bc1d808e04732adf679965ccc34ca7ae3441') ;
            t.expectB('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.hash(SHA1)).is('80256f39a9d308650ac90d9be9a72a9562454574') ;
            t.expectC(text.hash(SHA1)).is('10c63ddf4e24463770e9dbc14e98ee64be9a15c6') ;
            t.expectD('@'.hash(SHA1)).is('9a78211436f6d425ec38f5c4e02270801f3524f8') ;
        }) ;

        group.unary("$hash(SHA224) function", async(t) => {
            t.expect0($hash("123456789", SHA224)).is('9b3e61bf29f17c75572fae2e86e17809a4513d07c8a18152acf34521') ;
            t.expect1($hash('ABCDEFGHIJKLMNOPQRSTUVWXYZ', SHA224)).is('174ee2931ce092fc30f4992332c6586cf2fedec88c6bf192549fee08') ;
            t.expect2($hash(text, SHA224)).is('ee9764513238d3147ed8633e79fc5ab7fb1a57e2211e6c453e63a577') ;
            t.expect3(Buffer.from(text).hash(SHA224)).is('ee9764513238d3147ed8633e79fc5ab7fb1a57e2211e6c453e63a577') ;
            t.expectA("123456789".hash(SHA224)).is('9b3e61bf29f17c75572fae2e86e17809a4513d07c8a18152acf34521') ;
            t.expectB('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.hash(SHA224)).is('174ee2931ce092fc30f4992332c6586cf2fedec88c6bf192549fee08') ;
            t.expectC(text.hash(SHA224)).is('ee9764513238d3147ed8633e79fc5ab7fb1a57e2211e6c453e63a577') ;
        }) ;

        group.unary("$hash(SHA256) function", async(t) => {
            t.expect0($hash("123456789")).is('15e2b0d3c33891ebb0f1ef609ec419420c20e320ce94c65fbc8c3312448eb225') ;
            t.expect1($hash('ABCDEFGHIJKLMNOPQRSTUVWXYZ')).is('d6ec6898de87ddac6e5b3611708a7aa1c2d298293349cc1a6c299a1db7149d38') ;
            t.expect2($hash(text)).is('67b793d0960b450ed81f8c4ff2bfcf45972251de15550a6cfaaf67d3ac38df7f') ;
            t.expect3(Buffer.from(text).hash()).is('67b793d0960b450ed81f8c4ff2bfcf45972251de15550a6cfaaf67d3ac38df7f') ;
            t.expectA("123456789".hash()).is('15e2b0d3c33891ebb0f1ef609ec419420c20e320ce94c65fbc8c3312448eb225') ;
            t.expectB('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.hash()).is('d6ec6898de87ddac6e5b3611708a7aa1c2d298293349cc1a6c299a1db7149d38') ;
            t.expectC(text.hash()).is('67b793d0960b450ed81f8c4ff2bfcf45972251de15550a6cfaaf67d3ac38df7f') ;
            t.expectD('@'.hash()).is('c3641f8544d7c02f3580b07c0f9887f0c6a27ff5ab1d4a3e29caf197cfc299ae') ;
            t.expectE('012345678901234567890123456789abcdefghijklmnopqrstuvwxy'.hash()).is('d8f3a2a11a90907715ed92c747bd774f869b47dbdca903438ae4e67301aa303d') ;
            t.expectF('012345678901234567890123456789abcdefghijklmnopqrstuvwxyz'.hash()).is('d39140ddd4e24cb6a19613825cb8a7ad0bf8abc37e799f41bd12cab6eb0becb2') ;
            t.expectG('01234567890123456789@0123456789abcdefghijklmnopqrstuvwxyz'.hash()).is('cfeac71b0c4fa797b4fdf352dfc12ea603c6f2296530def888ec456395a96479') ;
            t.expectH('01234567890123456789@0123456789abcdefghijklmnopqrstuvwxyz-'.hash()).is('3f845794260a441ad040d8563d33b42da3d9796e3d3c7b2d322b0752e7f01271') ;
            t.expectI('01234567890123456789@0123456789abcdefghijklmnopqrstuvwxyz-$'.hash()).is('256f413818c2eb2a7545e6a71f25cce0e9b767846e42773152c95f47635bb738') ;
            t.expectJ('01234567890123456789@0123456789abcdefghijklmnopqrstuvwxyz-$+'.hash()).is('7d87d60506479f9a5c4885a620957bb738b6654f0b91dd5139b99194611d737e') ;
            t.expectK('01234567890123456789@0123456789abcdefghijklmnopqrstuvwxyz-$+*'.hash()).is('2a53f319864592f0b9428e1bad7a9a492e77ff416139a59c797781084d899146') ;
            t.expectL('01234567890123456789@0123456789abcdefghijklmnopqrstuvwxyz-$+*/'.hash()).is('b282e9fca01c44063cc49e5454ced67d446b737babdc47d18cf7014b028dfe2c') ;
            t.expectM('01234567890123456789@0123456789abcdefghijklmnopqrstuvwxyz-$+*/#'.hash()).is('609bb723fc277bf53c3ec01b19773aa2f99659b1016cbb516398d57dee7d31ee') ;
            t.expectN('01234567890123456789@0123456789abcdefghijklmnopqrstuvwxyz-$+*/#%'.hash()).is('07ed8661095f53130abc354cd363568c16e277d83080284e90839b010673f018') ;
        }) ;

        group.unary("$hash(SHA384) function", async(t) => {
            t.expect0($hash("123456789", SHA384)).is('eb455d56d2c1a69de64e832011f3393d45f3fa31d6842f21af92d2fe469c499da5e3179847334a18479c8d1dedea1be3') ;
            t.expect1($hash('ABCDEFGHIJKLMNOPQRSTUVWXYZ', SHA384)).is('be1ef2903d1e27460a352f5a69cce87ac31142810a2b52f84062fa6f939e357bf1c139dabc88666bc17e4fd879c65dfb') ;
            t.expect2($hash(text, SHA384)).is('b989595962cba380d78f18e298f83f29b4fe7f6b6eeb03cfaf9557e12960e827ed9fd6455b0ec8a4087f2c92a06efa7f') ;
            t.expect3(Buffer.from(text).hash(SHA384)).is('b989595962cba380d78f18e298f83f29b4fe7f6b6eeb03cfaf9557e12960e827ed9fd6455b0ec8a4087f2c92a06efa7f') ;
            t.expectA("123456789".hash(SHA384)).is('eb455d56d2c1a69de64e832011f3393d45f3fa31d6842f21af92d2fe469c499da5e3179847334a18479c8d1dedea1be3') ;
            t.expectB('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.hash(SHA384)).is('be1ef2903d1e27460a352f5a69cce87ac31142810a2b52f84062fa6f939e357bf1c139dabc88666bc17e4fd879c65dfb') ;
            t.expectC(text.hash(SHA384)).is('b989595962cba380d78f18e298f83f29b4fe7f6b6eeb03cfaf9557e12960e827ed9fd6455b0ec8a4087f2c92a06efa7f') ;
        }) ;

        group.unary("$hash(SHA512) function", async(t) => {
            t.expect0($hash("123456789", SHA512)).is('d9e6762dd1c8eaf6d61b3c6192fc408d4d6d5f1176d0c29169bc24e71c3f274ad27fcd5811b313d681f7e55ec02d73d499c95455b6b5bb503acf574fba8ffe85') ;
            t.expect1($hash('ABCDEFGHIJKLMNOPQRSTUVWXYZ', SHA512)).is('f9292a765b5826c3e5786d9cf361e677f58ec5e3b5cecfd7a8bf122f5407b157196753f062d109ac7c16b29b0f471f81da9787c8d314e873413edca956027799') ;
            t.expect2($hash(text, SHA512)).is('5c4519633f4251e6a6ba460407212dfd2cd48b8ae50a0d9072d562d33a5f68da6d8692e9eb7dfc5325a36be9234e7358ecaf8de21921ecaf9fcffa6ecb392366') ;
            t.expect3(Buffer.from(text).hash(SHA512)).is('5c4519633f4251e6a6ba460407212dfd2cd48b8ae50a0d9072d562d33a5f68da6d8692e9eb7dfc5325a36be9234e7358ecaf8de21921ecaf9fcffa6ecb392366') ;
            t.expectA("123456789".hash(SHA512)).is('d9e6762dd1c8eaf6d61b3c6192fc408d4d6d5f1176d0c29169bc24e71c3f274ad27fcd5811b313d681f7e55ec02d73d499c95455b6b5bb503acf574fba8ffe85') ;
            t.expectB('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.hash(SHA512)).is('f9292a765b5826c3e5786d9cf361e677f58ec5e3b5cecfd7a8bf122f5407b157196753f062d109ac7c16b29b0f471f81da9787c8d314e873413edca956027799') ;
            t.expectC(text.hash(SHA512)).is('5c4519633f4251e6a6ba460407212dfd2cd48b8ae50a0d9072d562d33a5f68da6d8692e9eb7dfc5325a36be9234e7358ecaf8de21921ecaf9fcffa6ecb392366') ;
            t.expectD('@'.hash(SHA512)).is('e97b9cc0c1e22c66bff31f6c457c2b95b9f9af955c8a098e043734df7439031fd1c6748a139d99077eb2db5f3d98a0e9d05b6606e3d4010ec107a52cd7e43359') ;
            t.expectE('012345678901234567890123456789abcdefghijklmnopqrstuvwxy'.hash(SHA512)).is('62fd6674e65d5a2cceb8ad94cac92d3b5b58674eb9b41dd6451218ddef42a0333ba13f30ee6aabcf1fb5269bf1b92d3efeb1f2c3482da1f81ecdeab78dcd4a94') ;
            t.expectF('012345678901234567890123456789abcdefghijklmnopqrstuvwxyz'.hash(SHA512)).is('d119a139ae3cc4c9fcddf70115da0d58870b9482542ed237e052f286c004c3eae8c9dadd5a8b85993e757164f75ec260a1cf4ac2296ce97bbb17d0221d9a3964') ;
            t.expectG('01234567890123456789@0123456789abcdefghijklmnopqrstuvwxyz'.hash(SHA512)).is('0c78d1519c1eaad4fd224ca87ef72f5ed92cf882406a86a14d59539228d1259eb529ac823150d449e06d6490a5a8674a1e38d74f2d5b324108385c9144f1d1c9') ;
            t.expectH('01234567890123456789@0123456789abcdefghijklmnopqrstuvwxyz-'.hash(SHA512)).is('28712b90d5cdcf42d9a77e5bdfd63722f25db85babd2adda02fce54aaaaf3bd1bb19c2d23979ab07923204664fc2682f7cdb23b2ca7096dff5211345b4477fcd') ;
            t.expectI('01234567890123456789@0123456789abcdefghijklmnopqrstuvwxyz-$'.hash(SHA512)).is('3679e4b33fb95cdd77db85b17e873aa1ebc65140d1baae1deed22a80ecb894a66e246a8b958d1af1c1cdcbf8a5d9565c84b20283eca79ddcb3436ad6fd3530b2') ;
            t.expectJ('01234567890123456789@0123456789abcdefghijklmnopqrstuvwxyz-$+'.hash(SHA512)).is('8a19e034065dd2eac19dee9da9b3eca9cf29e456bea7b7846d68967bcf2931fc2865b4f2ad95945d15ecd891ced889ef49f55ffa14b23e375fdee769e2577ba9') ;
            t.expectK('01234567890123456789@0123456789abcdefghijklmnopqrstuvwxyz-$+*'.hash(SHA512)).is('831fb9cb1955a42a3dca4d766512fa4d2dd88cea979083441b1b63034c02c767f882c2289a46ebb7bf13023cef08ecd168cd99a64f680ee3aba0e8552e3c4f1d') ;
            t.expectL('01234567890123456789@0123456789abcdefghijklmnopqrstuvwxyz-$+*/'.hash(SHA512)).is('0b4e885f05e062db4a4273ec6b0150cca48fbccdb9c054b3b7bf5e583214e6ad2c76c2e985876f43dce4246f4baa39cecb638466ebc0e39d030be5faa2ebdc61') ;
            t.expectM('01234567890123456789@0123456789abcdefghijklmnopqrstuvwxyz-$+*/#'.hash(SHA512)).is('5a6465b5e7223d39521d60b6953459a060952bab876144b96deb5170884db8771272a51889b82de511357e440459dd0081f7a6ceccea8d96cb77e1e96899fb7a') ;
            t.expectN('01234567890123456789@0123456789abcdefghijklmnopqrstuvwxyz-$+*/#%'.hash(SHA512)).is('e62cce3426ea49e03fc66ea9d8f9749cad13370232617c88088ecf24bc9fda4c571afbd125ebac468ad1bb6851bc0eaefdafa14a99bd26c15d68ef3c07f180f2') ;
        }) ;
    }),
    TSTest.group("TSCrypto methods", async (group) => {
        const source = TSCharset.binaryCharset().uint8ArrayFromString('ABCDEFGHIJKLMNOPQRSTUVWXYZ') ;
        const source2 = TSCharset.binaryCharset().uint8ArrayFromString('012345678901234567890123456789abcdefghijklmnopqrstuvwxy') ;
        const source3 = TSCharset.binaryCharset().uint8ArrayFromString(
           //0        1         2         3         4         5         6         7         8         9         10        11        12
           //123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789            
            'aB3cD5eF7gH9jK1lM3nO5pQ7rS9tU1vW3xY5zA7bC9dE1fG3hJ5kL7mN9pQ1rS3tU5vW7xY9zA2bC4dE6fG8hJ0kL2mN4pQ6rS8tU0vW2xY4zA6bC8dE0fG2hJ4kL6mN8'
        ) ;
        group.unary("TSCrypto.crc methods", async (t) => {
            t.expect0(TSCrypto.crc16(source)).is(0x18E7) ;
            t.expect1(TSCrypto.crc32(source)).is(0xabf77822) ;
        }) ;

        group.unary("TSCrypto.sha1()", async (t) => {
            t.expect0(TSCrypto.sha1String(source)).is('80256f39a9d308650ac90d9be9a72a9562454574') ;
            t.expect1(TSCrypto.sha1(source).hexaString(true))   .is('80256f39a9d308650ac90d9be9a72a9562454574') ;
            t.expect2(TSCrypto.sha1String(source2))             .is('f79ebaa18fe5cdffbb53777191185f3d88370a28') ;
            t.expect3(TSCrypto.sha1(source2).hexaString(true))  .is('f79ebaa18fe5cdffbb53777191185f3d88370a28') ;
            t.expect4(TSCrypto.sha1String(source3))             .is('7ffc73258b6b5697fa1d45b76884f639c487a001') ;
            t.expect5(TSCrypto.sha1(source3).hexaString(true))  .is('7ffc73258b6b5697fa1d45b76884f639c487a001') ;
        }) ;
        group.unary("TSCrypto.sha224()", async (t) => {
            t.expect0(TSCrypto.sha224String(source)).is('174ee2931ce092fc30f4992332c6586cf2fedec88c6bf192549fee08') ;
            t.expect1(TSCrypto.sha224(source).hexaString(true)).is('174ee2931ce092fc30f4992332c6586cf2fedec88c6bf192549fee08') ;
            t.expect4(TSCrypto.sha224String(source3)).is('ecf8aa6b6e6b54b599a7268faa2fef74fb86c20998d1379b73915861') ;
            t.expect5(TSCrypto.sha224(source3).hexaString(true)).is('ecf8aa6b6e6b54b599a7268faa2fef74fb86c20998d1379b73915861') ;
        }) ;
        group.unary("TSCrypto.sha256()", async (t) => {
            t.expect0(TSCrypto.sha256String(source)).is('d6ec6898de87ddac6e5b3611708a7aa1c2d298293349cc1a6c299a1db7149d38') ;
            t.expect1(TSCrypto.sha256(source).hexaString(true)).is('d6ec6898de87ddac6e5b3611708a7aa1c2d298293349cc1a6c299a1db7149d38') ;
            t.expect2(TSCrypto.sha256String(source2)).is('d8f3a2a11a90907715ed92c747bd774f869b47dbdca903438ae4e67301aa303d') ;
            t.expect3(TSCrypto.sha256(source2).hexaString(true)).is('d8f3a2a11a90907715ed92c747bd774f869b47dbdca903438ae4e67301aa303d') ;
            t.expect2(TSCrypto.sha256String(source3)).is('87a34fba755ac05e166caa6589785f10d81bb3973560a91bbc428809b4186dea') ;
            t.expect3(TSCrypto.sha256(source3).hexaString(true)).is('87a34fba755ac05e166caa6589785f10d81bb3973560a91bbc428809b4186dea') ;
        }) ;
        group.unary("TSCrypto.sha384()", async (t) => {
            t.expect0(TSCrypto.sha384String(source)).is('be1ef2903d1e27460a352f5a69cce87ac31142810a2b52f84062fa6f939e357bf1c139dabc88666bc17e4fd879c65dfb') ;
            t.expect1(TSCrypto.sha384(source).hexaString(true)).is('be1ef2903d1e27460a352f5a69cce87ac31142810a2b52f84062fa6f939e357bf1c139dabc88666bc17e4fd879c65dfb') ;
            t.expect4(TSCrypto.sha384String(source3)).is('1cb53e67c25af0d1603f54b6e9c0cde0c544b9a8cb30019db637a2e392e25935a0cba4e564f45116f6529d94485b84a1') ;
            t.expect5(TSCrypto.sha384(source3).hexaString(true)).is('1cb53e67c25af0d1603f54b6e9c0cde0c544b9a8cb30019db637a2e392e25935a0cba4e564f45116f6529d94485b84a1') ;
        }) ;
        group.unary("TSCrypto.sha512()", async (t) => {
            t.expect0(TSCrypto.sha512String(source))            .is('f9292a765b5826c3e5786d9cf361e677f58ec5e3b5cecfd7a8bf122f5407b157196753f062d109ac7c16b29b0f471f81da9787c8d314e873413edca956027799') ;
            t.expect1(TSCrypto.sha512(source).hexaString(true)) .is('f9292a765b5826c3e5786d9cf361e677f58ec5e3b5cecfd7a8bf122f5407b157196753f062d109ac7c16b29b0f471f81da9787c8d314e873413edca956027799') ;
            t.expect4(TSCrypto.sha512String(source3))           .is('7a8fe7ad4cbec1fc773fa81e466a9fd837bf875d53a3cfa8e51f6484a56b3f9bf2d8b76036b6fc4ee7b8d9b54929a81e3f9b2b736193293ef7ac7deb1f75c434') ;
            t.expect5(TSCrypto.sha512(source3).hexaString(true)).is('7a8fe7ad4cbec1fc773fa81e466a9fd837bf875d53a3cfa8e51f6484a56b3f9bf2d8b76036b6fc4ee7b8d9b54929a81e3f9b2b736193293ef7ac7deb1f75c434') ;
        }) ;
    }),
    TSTest.group("Internal hash functions", async (group) => {
        group.unary("$slowhash(SHA1) function", async(t) => {
            t.expect0($slowhash("123456789", { method:SHA1 })).is('f7c3bc1d808e04732adf679965ccc34ca7ae3441') ;
            t.expect1($slowhash('ABCDEFGHIJKLMNOPQRSTUVWXYZ', { method:SHA1 })).is('80256f39a9d308650ac90d9be9a72a9562454574') ;
            t.expect2($slowhash(text, { method:SHA1 })).is('10c63ddf4e24463770e9dbc14e98ee64be9a15c6') ;
            t.expect3(Buffer.from(text).slowhash({ method:SHA1 })).is('10c63ddf4e24463770e9dbc14e98ee64be9a15c6') ;
            t.expectA("123456789".slowhash({ method:SHA1 })).is('f7c3bc1d808e04732adf679965ccc34ca7ae3441') ;
            t.expectB('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.slowhash({ method:SHA1 })).is('80256f39a9d308650ac90d9be9a72a9562454574') ;
            t.expectC(text.slowhash({ method:SHA1 })).is('10c63ddf4e24463770e9dbc14e98ee64be9a15c6') ;
            t.expectD('@'.slowhash({ method:SHA1 })).is('9a78211436f6d425ec38f5c4e02270801f3524f8') ;
        }) ;

        group.unary("$slowhash(SHA224) function", async(t) => {
            t.expect0($slowhash("123456789", { method:SHA224 })).is('9b3e61bf29f17c75572fae2e86e17809a4513d07c8a18152acf34521') ;
            t.expect1($slowhash('ABCDEFGHIJKLMNOPQRSTUVWXYZ', { method:SHA224 })).is('174ee2931ce092fc30f4992332c6586cf2fedec88c6bf192549fee08') ;
            t.expect2($slowhash(text, { method:SHA224 })).is('ee9764513238d3147ed8633e79fc5ab7fb1a57e2211e6c453e63a577') ;
            t.expect3(Buffer.from(text).slowhash({ method:SHA224 })).is('ee9764513238d3147ed8633e79fc5ab7fb1a57e2211e6c453e63a577') ;
            t.expectA("123456789".slowhash({ method:SHA224 })).is('9b3e61bf29f17c75572fae2e86e17809a4513d07c8a18152acf34521') ;
            t.expectB('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.slowhash({ method:SHA224 })).is('174ee2931ce092fc30f4992332c6586cf2fedec88c6bf192549fee08') ;
            t.expectC(text.slowhash({ method:SHA224 })).is('ee9764513238d3147ed8633e79fc5ab7fb1a57e2211e6c453e63a577') ;
        }) ;

        group.unary("$slowhash(SHA256) function", async(t) => {
            t.expect0($slowhash("123456789")).is('15e2b0d3c33891ebb0f1ef609ec419420c20e320ce94c65fbc8c3312448eb225') ;
            t.expect1($slowhash('ABCDEFGHIJKLMNOPQRSTUVWXYZ')).is('d6ec6898de87ddac6e5b3611708a7aa1c2d298293349cc1a6c299a1db7149d38') ;
            t.expect2($slowhash(text)).is('67b793d0960b450ed81f8c4ff2bfcf45972251de15550a6cfaaf67d3ac38df7f') ;
            t.expect3(Buffer.from(text).slowhash()).is('67b793d0960b450ed81f8c4ff2bfcf45972251de15550a6cfaaf67d3ac38df7f') ;
            t.expectA("123456789".slowhash()).is('15e2b0d3c33891ebb0f1ef609ec419420c20e320ce94c65fbc8c3312448eb225') ;
            t.expectB('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.slowhash()).is('d6ec6898de87ddac6e5b3611708a7aa1c2d298293349cc1a6c299a1db7149d38') ;
            t.expectC(text.slowhash()).is('67b793d0960b450ed81f8c4ff2bfcf45972251de15550a6cfaaf67d3ac38df7f') ;
            t.expectD('@'.slowhash()).is('c3641f8544d7c02f3580b07c0f9887f0c6a27ff5ab1d4a3e29caf197cfc299ae') ;
            t.expectE('012345678901234567890123456789abcdefghijklmnopqrstuvwxy'.slowhash()).is('d8f3a2a11a90907715ed92c747bd774f869b47dbdca903438ae4e67301aa303d') ;
            t.expectF('012345678901234567890123456789abcdefghijklmnopqrstuvwxyz'.slowhash()).is('d39140ddd4e24cb6a19613825cb8a7ad0bf8abc37e799f41bd12cab6eb0becb2') ;
            t.expectG('01234567890123456789@0123456789abcdefghijklmnopqrstuvwxyz'.slowhash()).is('cfeac71b0c4fa797b4fdf352dfc12ea603c6f2296530def888ec456395a96479') ;
            t.expectH('01234567890123456789@0123456789abcdefghijklmnopqrstuvwxyz-'.slowhash()).is('3f845794260a441ad040d8563d33b42da3d9796e3d3c7b2d322b0752e7f01271') ;
            t.expectI('01234567890123456789@0123456789abcdefghijklmnopqrstuvwxyz-$'.slowhash()).is('256f413818c2eb2a7545e6a71f25cce0e9b767846e42773152c95f47635bb738') ;
            t.expectJ('01234567890123456789@0123456789abcdefghijklmnopqrstuvwxyz-$+'.slowhash()).is('7d87d60506479f9a5c4885a620957bb738b6654f0b91dd5139b99194611d737e') ;
            t.expectK('01234567890123456789@0123456789abcdefghijklmnopqrstuvwxyz-$+*'.slowhash()).is('2a53f319864592f0b9428e1bad7a9a492e77ff416139a59c797781084d899146') ;
            t.expectL('01234567890123456789@0123456789abcdefghijklmnopqrstuvwxyz-$+*/'.slowhash()).is('b282e9fca01c44063cc49e5454ced67d446b737babdc47d18cf7014b028dfe2c') ;
            t.expectM('01234567890123456789@0123456789abcdefghijklmnopqrstuvwxyz-$+*/#'.slowhash()).is('609bb723fc277bf53c3ec01b19773aa2f99659b1016cbb516398d57dee7d31ee') ;
            t.expectN('01234567890123456789@0123456789abcdefghijklmnopqrstuvwxyz-$+*/#%'.slowhash()).is('07ed8661095f53130abc354cd363568c16e277d83080284e90839b010673f018') ;
        }) ;

        group.unary("$slowhash(SHA384) function", async(t) => {
            t.expect0($slowhash("123456789", { method:SHA384 })).is('eb455d56d2c1a69de64e832011f3393d45f3fa31d6842f21af92d2fe469c499da5e3179847334a18479c8d1dedea1be3') ;
            t.expect1($slowhash('ABCDEFGHIJKLMNOPQRSTUVWXYZ', { method:SHA384 })).is('be1ef2903d1e27460a352f5a69cce87ac31142810a2b52f84062fa6f939e357bf1c139dabc88666bc17e4fd879c65dfb') ;
            t.expect2($slowhash(text, { method:SHA384 })).is('b989595962cba380d78f18e298f83f29b4fe7f6b6eeb03cfaf9557e12960e827ed9fd6455b0ec8a4087f2c92a06efa7f') ;
            t.expect3(Buffer.from(text).slowhash({ method:SHA384 })).is('b989595962cba380d78f18e298f83f29b4fe7f6b6eeb03cfaf9557e12960e827ed9fd6455b0ec8a4087f2c92a06efa7f') ;
            t.expectA("123456789".slowhash({ method:SHA384 })).is('eb455d56d2c1a69de64e832011f3393d45f3fa31d6842f21af92d2fe469c499da5e3179847334a18479c8d1dedea1be3') ;
            t.expectB('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.slowhash({ method:SHA384 })).is('be1ef2903d1e27460a352f5a69cce87ac31142810a2b52f84062fa6f939e357bf1c139dabc88666bc17e4fd879c65dfb') ;
            t.expectC(text.slowhash({ method:SHA384 })).is('b989595962cba380d78f18e298f83f29b4fe7f6b6eeb03cfaf9557e12960e827ed9fd6455b0ec8a4087f2c92a06efa7f') ;
        }) ;
        
        group.unary("$slowhash(SHA512) function", async(t) => {
            t.expect0($slowhash("123456789", { method:SHA512 })).is('d9e6762dd1c8eaf6d61b3c6192fc408d4d6d5f1176d0c29169bc24e71c3f274ad27fcd5811b313d681f7e55ec02d73d499c95455b6b5bb503acf574fba8ffe85') ;
            t.expect1($slowhash('ABCDEFGHIJKLMNOPQRSTUVWXYZ', { method:SHA512 })).is('f9292a765b5826c3e5786d9cf361e677f58ec5e3b5cecfd7a8bf122f5407b157196753f062d109ac7c16b29b0f471f81da9787c8d314e873413edca956027799') ;
            t.expect2($slowhash(text, { method:SHA512 })).is('5c4519633f4251e6a6ba460407212dfd2cd48b8ae50a0d9072d562d33a5f68da6d8692e9eb7dfc5325a36be9234e7358ecaf8de21921ecaf9fcffa6ecb392366') ;
            t.expect3(Buffer.from(text).slowhash({ method:SHA512 })).is('5c4519633f4251e6a6ba460407212dfd2cd48b8ae50a0d9072d562d33a5f68da6d8692e9eb7dfc5325a36be9234e7358ecaf8de21921ecaf9fcffa6ecb392366') ;
            t.expectA("123456789".slowhash({ method:SHA512 })).is('d9e6762dd1c8eaf6d61b3c6192fc408d4d6d5f1176d0c29169bc24e71c3f274ad27fcd5811b313d681f7e55ec02d73d499c95455b6b5bb503acf574fba8ffe85') ;
            t.expectB('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.slowhash({ method:SHA512 })).is('f9292a765b5826c3e5786d9cf361e677f58ec5e3b5cecfd7a8bf122f5407b157196753f062d109ac7c16b29b0f471f81da9787c8d314e873413edca956027799') ;
            t.expectC(text.slowhash({ method:SHA512 })).is('5c4519633f4251e6a6ba460407212dfd2cd48b8ae50a0d9072d562d33a5f68da6d8692e9eb7dfc5325a36be9234e7358ecaf8de21921ecaf9fcffa6ecb392366') ;
            t.expectD('@'.slowhash({ method:SHA512 })).is('e97b9cc0c1e22c66bff31f6c457c2b95b9f9af955c8a098e043734df7439031fd1c6748a139d99077eb2db5f3d98a0e9d05b6606e3d4010ec107a52cd7e43359') ;
            t.expectE('012345678901234567890123456789abcdefghijklmnopqrstuvwxy'.slowhash({ method:SHA512 })).is('62fd6674e65d5a2cceb8ad94cac92d3b5b58674eb9b41dd6451218ddef42a0333ba13f30ee6aabcf1fb5269bf1b92d3efeb1f2c3482da1f81ecdeab78dcd4a94') ;
            t.expectF('012345678901234567890123456789abcdefghijklmnopqrstuvwxyz'.slowhash({ method:SHA512 })).is('d119a139ae3cc4c9fcddf70115da0d58870b9482542ed237e052f286c004c3eae8c9dadd5a8b85993e757164f75ec260a1cf4ac2296ce97bbb17d0221d9a3964') ;
            t.expectG('01234567890123456789@0123456789abcdefghijklmnopqrstuvwxyz'.slowhash({ method:SHA512 })).is('0c78d1519c1eaad4fd224ca87ef72f5ed92cf882406a86a14d59539228d1259eb529ac823150d449e06d6490a5a8674a1e38d74f2d5b324108385c9144f1d1c9') ;
            t.expectH('01234567890123456789@0123456789abcdefghijklmnopqrstuvwxyz-'.slowhash({ method:SHA512 })).is('28712b90d5cdcf42d9a77e5bdfd63722f25db85babd2adda02fce54aaaaf3bd1bb19c2d23979ab07923204664fc2682f7cdb23b2ca7096dff5211345b4477fcd') ;
            t.expectI('01234567890123456789@0123456789abcdefghijklmnopqrstuvwxyz-$'.slowhash({ method:SHA512 })).is('3679e4b33fb95cdd77db85b17e873aa1ebc65140d1baae1deed22a80ecb894a66e246a8b958d1af1c1cdcbf8a5d9565c84b20283eca79ddcb3436ad6fd3530b2') ;
            t.expectJ('01234567890123456789@0123456789abcdefghijklmnopqrstuvwxyz-$+'.slowhash({ method:SHA512 })).is('8a19e034065dd2eac19dee9da9b3eca9cf29e456bea7b7846d68967bcf2931fc2865b4f2ad95945d15ecd891ced889ef49f55ffa14b23e375fdee769e2577ba9') ;
            t.expectK('01234567890123456789@0123456789abcdefghijklmnopqrstuvwxyz-$+*'.slowhash({ method:SHA512 })).is('831fb9cb1955a42a3dca4d766512fa4d2dd88cea979083441b1b63034c02c767f882c2289a46ebb7bf13023cef08ecd168cd99a64f680ee3aba0e8552e3c4f1d') ;
            t.expectL('01234567890123456789@0123456789abcdefghijklmnopqrstuvwxyz-$+*/'.slowhash({ method:SHA512 })).is('0b4e885f05e062db4a4273ec6b0150cca48fbccdb9c054b3b7bf5e583214e6ad2c76c2e985876f43dce4246f4baa39cecb638466ebc0e39d030be5faa2ebdc61') ;
            t.expectM('01234567890123456789@0123456789abcdefghijklmnopqrstuvwxyz-$+*/#'.slowhash({ method:SHA512 })).is('5a6465b5e7223d39521d60b6953459a060952bab876144b96deb5170884db8771272a51889b82de511357e440459dd0081f7a6ceccea8d96cb77e1e96899fb7a') ;
            t.expectN('01234567890123456789@0123456789abcdefghijklmnopqrstuvwxyz-$+*/#%'.slowhash({ method:SHA512 })).is('e62cce3426ea49e03fc66ea9d8f9749cad13370232617c88088ecf24bc9fda4c571afbd125ebac468ad1bb6851bc0eaefdafa14a99bd26c15d68ef3c07f180f2') ;

        }) ;
    }),
    TSTest.group("Random hash comparison test", async (group) => {
        for (let i = 0 ; i < 500 ; i++) {
            const length = $random(8192) ;
            const source = $randomBytes(length) ;
            group.unary(`crypto test ${i+1}: ${length}`, async (t) => {
                let n = $nativeHash(source,'SHA1') ;
                let s = $sha1(source) ;
                t.expect0(s).is(n) ;

                n = $nativeHash(source,'SHA256') ;
                s = $sha256(source) ;
                t.expect1(s).is(n) ;

                n = $nativeHash(source,'SHA512') ;
                s = $sha512(source) ;
                t.expect2(s).is(n) ;

            }) ;
        }
    }),
    TSTest.group("Commons other cryptographic functions", async (group) => {
        group.unary("$encrypt()/$decrypt() functions", async(t) => {
            // AES 256 test
            //           12345678901234567890123456789012
            const key256 = "my32octetskeyforcryptingZPOL1na0" ;
            const encrypted256 = $encrypt(text, key256) ;
            if (t.expect(encrypted256, "enc+00").filled()) {
                const decrypted = $decrypt(encrypted256!, key256) ;
                t.expect(decrypted, "dec+00").is(text) ;    
            }

            // AES128 tests
            const optsp = {
                algorithm:AES128
            } ;
            const opts = { 
                ...optsp,
                noInitializationVector:true
            }
            const k = 'crypt16octetskey' ;
            const localVector = Buffer.from('ThisIsMyLocalIV!') ;

            for (let i = 1 ; i < 265 ; i++) {
                let s = '' ;
                for (let j = 0 ; j < i ; j++) { s += String.fromCharCode(($random(1)?65:97)+$random(26)) ; }
                t.register(`str[${i}]`, s) ;
                const enc = $encrypt(s, k, opts) ;
                const n = i.toString(16) ;
                const l = ($div(i,16)+1)*16 ;
                if (t.expect(enc, "enc-"+n).filled()) {
                    t.expect(enc!.length/2, 'len-'+n).is(l)
                    const dec = $decrypt(enc!, k, opts) ;
                    t.expect(dec, "dec-"+n).is(s) ;
                }

                $setCommonItializationVector(localVector) ;
                let encl = $encrypt(s, k, opts) ;
                if (t.expect(encl, "encl"+n).filled()) {
                    t.expect(encl!.length/2, 'lenl'+n).is(l)
                    const dec = $decrypt(encl!, k, opts) ;
                    t.expect(dec, "decl"+n).is(s) ;
                }
                $setCommonItializationVector() ;

                let encp = $encrypt(s, k, optsp) ;
                if (t.expect(encp, "enc+"+n).filled()) {
                    t.expect(encp!.length/2, 'len+'+n).is(l+16)
                    const dec = $decrypt(encp!, k, optsp) ;
                    t.expect(dec, "dec+"+n).is(s) ;
                }

            }

        }) ;
        
        group.unary("$uuid() and $uuidVersion() functions", async(t) => {
            const u1 = $uuid() ;
            t.register('uuid1', u1) ;
            t.expect0($isuuid(u1, UUIDv4)).true() ;
            t.expect1($uuidVersion(u1)).is(UUIDv4) ;

            const u2 = $uuid(true) ;
            t.register('uuid2', u2) ;
            t.expect2($isuuid(u2, UUIDv4)).true() ;
            t.expect3($uuidVersion(u2)).is(UUIDv4) ;

            t.expectA($uuidVersion('a14ceb40-ac4f-11ed-b648-67a97617e043')).is(UUIDv1) ;
            t.expectB($uuidVersion('3C244E6D-A03E-4D45-A87C-B1E1F967B362')).is(UUIDv4) ;
            t.expectC($uuidVersion('a14ceb40-ac4f-11hd-b648-67a97617e043')).undef() ;
            t.expectD($uuidVersion('3C244E6D-A03E-4D45-A87C-B1E1F967B36')).undef() ;
        }) ;

        group.unary("$crc16() function", async(t) => {
            t.expect0($crc16('ABCDEFGHIJKLMNOPQRSTUVWXYZ')).is(0x18E7) ;
            t.expect1($crc16('123456789')).is(0xBB3D) ;
            t.expect2(Buffer.from('123456789').crc16()).is(0xBB3D) ;
            t.expect3($crc16(text)).is(0xB2B9) ;
        }) ;
        
        group.unary("$crc32() function", async(t) => {
            t.expect0($crc32('ABCDEFGHIJKLMNOPQRSTUVWXYZ')).is(0xabf77822) ;
            t.expect1($crc32('123456789')).is(0xCBF43926) ;
            t.expect2(Buffer.from('123456789').crc32()).is(0xCBF43926) ;
            t.expect3($crc32(text)).is(0x9359156b) ;
        }) ;
        
        group.unary("$password() function", async (t) => {
            const p1 = $password(16, { usesDigits:true, usesSpecials:true, usesLowercase:true })
            t.expect0(p1.length).is(16) ;
            let digits = 0, specials = 0, lowercases = 0 ;
            for (let i = 0 ; i < p1.length ; i++) {
                const c = p1.charCodeAt(i) ;
                if (c >= 0x61 && c <= 0x7A) { lowercases ++ ; }
                else if (c >= 0x30 && c <= 0x39) { digits ++ ; }
                else if ('!#$-_&*@()+/-=[]{}^:;,.'.includes(p1.charAt(i))) { specials ++ ; }
            }
            t.expect1(digits).gt(0) ;            
            t.expect2(specials).gt(0) ;            
            t.expect3(lowercases).gt(0) ;            
            t.expect4(digits+specials+lowercases).is(p1.length) ;
        })

        group.unary("$shuffle() function and Array.shuffle() method", async (t) => {
            let N = 63 ;
            const base:number[] = [] ;
    
            for (let i = 0 ; i < N ; i++) { base[i] = i ; }
    
            const res = $shuffle(base) ;

            t.expectA(res.length).is(N) ;
            
            const set = new Set<number>() ;
            for (let i = 0 ; i < N ; i++) { 
                t.expect(base.includes(res[i]), `b[${i}]`).true() ;
                set.add(res[i]) ; 
            }
            t.expectB(set.size).is(N) ;

            N = 16 ;
            const base2 = base.slice(0, N) ;
            const res2 = base2.shuffle(N*2) ;
            
            t.expectC(res2.length).is(N) ;

            const set2 = new Set<number>() ;
            for (let i = 0 ; i < N ; i++) { 
                t.expect(base.includes(res[i]), `b2[${i}]`).true() ;
                set2.add(res[i]) ; 
            }
            t.expectD(set2.size).is(N) ;

        }) ;
    
    })
] ;
