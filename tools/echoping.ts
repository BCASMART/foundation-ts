import { $unsigned } from "../src/commons";
import { uint, uint16 } from "../src/types";

export const PingStructure = {
    _mandatory:true,
    date: 'jsdate!',
    n:   'unsigned!'
}

export const EchoStructure = {
    ...PingStructure,
    responseDate:'jsdate!'
}

export const Args = process.argv.slice(2) ;
const port:number = $unsigned(Args[0], 3000 as uint) ;

export const ServicePort = Math.max(Math.min(65534, port), 1025) as uint16 ;
