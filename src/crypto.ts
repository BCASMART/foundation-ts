import * as crypto from 'crypto' ;
import { createReadStream } from 'fs' ;
import { $length } from './commons';
import { v4 as uuidv4, v5 as uuidv5 } from 'uuid'
import { uuid } from './types';

export function $uuid(namespace?:string, data?:string) : uuid 
{ 
	if ($length(namespace)) {
		if (!$length(data)) data = '' ;
		return <uuid>uuidv5(<string>namespace, <string>data) ;
	} 
	return <uuid>uuidv4() ; 
}

export enum HashMethod {
	SHA256 = 'SHA256',
	SHA384 = 'SHA384',
	SHA512 = 'SHA512'
}

export function $encrypt(source:string, key:string) : string|null
{
	if ($length(key) !== 32 || !$length(source)) { return null ; }
	let returnValue ;
	try {
		let iv = crypto.randomBytes(16);
		let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
		let encrypted = cipher.update(source);
		encrypted = Buffer.concat([encrypted, cipher.final()]) ;
		returnValue = iv.toString('hex') + encrypted.toString('hex') ;
	}
	catch (e) {
		returnValue = null ;
	}
	return returnValue ;
}

export function $decrypt(source:string, key:string) : string|null
{
	if ($length(key) !== 32 || $length(source) < 32) { return null ; }
	let returnValue ;
	try {
		let iv = Buffer.from(source.slice(0,32), 'hex');
		let encryptedText = Buffer.from(source.slice(32), 'hex');
		let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);
		let decrypted = decipher.update(encryptedText);
		decrypted = Buffer.concat([decrypted, decipher.final()]);
		returnValue = decrypted.toString();
	}
	catch (e) {
		returnValue = null ;
	}
	return returnValue ;
}

export function $hash(buf:Buffer, method?:HashMethod):string|null
{
    let ret:string|null = null ;
    try {
	    let hash = crypto.createHash($length(method) ? (<string>method).toLowerCase() : 'sha256') ;
	    hash.update(buf) ;
	    ret = hash.digest('hex') ;
    }
    catch(e) { ret = null ; }
    return ret ;
}

export async function $hashfile(filePath:string|null|undefined, method?:HashMethod):Promise<string|null>
{
	return new Promise((resolve, reject) => {
		let hash = crypto.createHash($length(method) ? (<string>method).toLowerCase() : 'sha256') ;
		if (!$length(filePath)) { return reject(null) ; }
		try {
			createReadStream(<string>filePath).on('data', data => hash.update(data)).on('end', () => resolve(hash.digest('hex')));
		}
		catch (e) { return reject(null) ; }
	}) ;
}

interface PasswordOptions {
	hasLowercase?:boolean,
	hasUppercase?:boolean,
	hasNumeric?:boolean,
	hasSpecials?:boolean
} ;

// TODO a better random generator
export function $random(max:number) : number
{
	return Math.floor(Math.random() * Math.floor(max)) ;
}

export function $password(len:number, opts:PasswordOptions={ hasLowercase:true }) : string | null {
	const MAX_CONSECUTIVE_CHARS = 2 ;

	if (!opts.hasLowercase && !opts.hasNumeric && !opts.hasSpecials && !opts.hasUppercase) {
		opts.hasUppercase = true ;
	}
	if (len < 3 || len > 256) return null ;

	let base = '' ;
	if (opts.hasLowercase) { base = base + "abcdefghijklmnopqrstuvwxyz" ; }
	if (opts.hasUppercase) { base = base + "ABCDEFGHIJKLMNOPQRSTUVWXYZ" ; }
	if (opts.hasNumeric) { base = base + "0123456789" ; }
	if (opts.hasLowercase && ($random(891) % 7)) { base = base + "abcdefghijklmnopqrstuvwxyz" ; }
	if (opts.hasLowercase) { base = base + "abcdefghijklmnopqrstuvwxyz" ; }
	if (opts.hasSpecials) { base = base + "!#$-_&*@()+/" ; }
	if (opts.hasSpecials && ($random(1795) % 3)) { base = base + "-#@*!" ; }
	if (opts.hasNumeric && ($random(733) % 2)) { base = base + "0123456789" ; }
	if (opts.hasNumeric) { base = base + "0123456789" ; }
	if (opts.hasLowercase) { base = base + "abcdefghijklmnopqrstuvwxyz" ; }
	const charlen = base.length ;
    let identicals = 0, i = 0 ;
	let last = '', password = '' ;

	while (i < len) {
        let c = base.charAt($random(charlen)) ;
		if (c == last) {
            if (++identicals == MAX_CONSECUTIVE_CHARS) { identicals -- ; }
            else { 
				password =  password + c ; 
				i++ 
			} ;
		}
        else {
            last = c ;
            identicals = 0 ;
            password =  password + c ;
			i++ ;
        }
	}
	return password ;
}
