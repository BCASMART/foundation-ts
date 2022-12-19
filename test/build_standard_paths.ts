import { writeFileSync } from 'fs';
import {
	basename, 
	dirname,
	extname,
	join,
    isAbsolute,
    normalize 
} from 'path' ;

const paths = [
    "",
    ".doc",
    "c:",
    "c:/",
    "C:",
    "C:/",
    "à:/",
    "À:/",
    "z:/",
    "AB:/",
    "c:/.doc",
    "C:/folder",
    "C:/file.pdf",
    "C:/folder/",
    "C:/folder/file.pdf",
    "C:/folder/folder2",
    "C:/folder/folder2/file.pdf",
    "C://",
    "C://folder",
    "/",
    "/.doc",
    "/folder",
    "/folder/",
    "/folder/.doc",
    "/file.pdf",
    "/folder/file.pdf",
    "/folder/folder2",
    "/folder/folder2/",
    "/folder/folder2/file.pdf",
    "//",
    "//.doc",
    "//server",
    "//server/",
    "//server/.doc",
    "//server/mountpoint",
    "//server/mountpoint/",
    "//server/mountpoint/.doc",
    "//server/mountpoint/file.pdf",
    "//server/mountpoint/folder",
    "//server/mountpoint/folder/",
    "//server/mountpoint/folder/file.pdf",
    "//server/mountpoint/folder/folder2", 
    "//server/mountpoint/folder/folder2/", 
    "//server/mountpoint/folder/folder2/file.pdf", 
    "//server/mountpoint/folder/folder2/.doc", 
    "///",
    "/Users/Durand/Developer/foundation-ts/files",
    "C:/Users/Durand/Developer/foundation-ts/files",
    "//LocalServer/SharedVolume/Users/Durand/Developer/foundation-ts/files",
] ;

const relatives = [
    "myFile.doc",
    "relfold/myFile.doc",
    "../myFile.doc",
    "../../myFile.doc",
    "dummy/../myFile.doc",
    "./dummy/../myFile.doc",
    "../dummy/../myFile.doc",
    "../tutu/titi/tata",
    "../tutu/titi/tata",
    "../../../../../tutu/../tata",
    "../../../../../tutu/../tata",
    "../../../../../../tutu/../tata",
    "../../../../../../tutu/../tata",
    "../../../../../../tutu/../tata/./toto",
    "../../../../../../tutu/../tata/./toto",
    "../../../../../../tutu/../tata/./toto",
    "../../../../../../tutu/../tata/./toto",
    "../../../../../../../tutu/../tata/./toto",
    "../../../../../../../tutu/../tata/./toto",
]
function _w(p:string):string { return p.split("/").join('\\') ; }

function printPathOperation(dest:any[], p:string) {
    dest.push({ path:p, absolute:isAbsolute(p), normalized:normalize(p), dirname:dirname(p), filename:basename(p), extname:extname(p)}) ;
}

function printJoins(dest:any[], p:string, rels:string[]) {
    rels.forEach(r => {
        dest.push({ source:p, complement:r, join:join(p,r)}) ;
        const wr = _w(r) ;
        dest.push({ source:p, complement:wr, join:join(p,wr)}) ;
    }) ;
}

export function TSPrintPathsFunctions() {
    console.log('\n') ;
    console.log("==========================================================") ;
    const output:{paths:any[], joins:any[]} = { paths:[], joins:[] }

    paths.forEach(p => {
        printPathOperation(output.paths,p) ;
        printPathOperation(output.paths,_w(p)) ;
    })
    paths.forEach(p => {
        printJoins(output.joins, p, relatives)
        printJoins(output.joins, _w(p), relatives)
    }) ;

    let f = join(__dirname, `paths-${process.platform}.json`) ;
    console.log(`writing file ${f}...`)
    try {
        writeFileSync(f, JSON.stringify(output, undefined, 2), 'utf-8') ;
        console.log(`done`) ;    
    }
    catch {
        console.log(`**** ERROR ***`) ;    
    }
    console.log("==========================================================") ;
}
TSPrintPathsFunctions() ;