import { TSTester } from '../src/tstester'
import { commonsGroups } from "./commons.test";
import { fsGroups } from './fs.test';
import { colorGroups } from './tscolor.test';
import { countriesGroups } from './tscountry.test';
import { dataGroups } from './tsdata.test';
import { dateGroups } from './tsdate.test';
import { dateCompGroups } from './tsdatecomp.test';
import { defaultsGroups } from './tsdefaults.test';
import { geometryGroups } from './tsgeometry.test';
import { intervalGroups } from './tsinterval.test';
import { qualifierGroups } from './tsqualifier.test';
import { rangeGroups } from './tsrange.test';
import { rangeSetGroups } from './tsrangeset.test';
import { requestGroups } from './tsrequest.test';
import { serverGroups } from './tsserver.test';
import { utilsGroups } from './utils.test';

const tester = new TSTester("Foundation-ts unary tests") ;

tester.addGroups(commonsGroups) ;
tester.addGroups(fsGroups) ;
tester.addGroups(countriesGroups) ;
tester.addGroups(dateGroups) ;
tester.addGroups(dateCompGroups) ;
tester.addGroups(defaultsGroups) ;
tester.addGroups(intervalGroups) ;
tester.addGroups(rangeGroups) ;
tester.addGroups(rangeSetGroups) ;
tester.addGroups(requestGroups) ;
tester.addGroups(serverGroups) ;
tester.addGroups(utilsGroups) ;
tester.addGroups(dataGroups) ;
tester.addGroups(colorGroups) ;
tester.addGroups(geometryGroups) ;
tester.addGroups(qualifierGroups) ;

tester.run() ;
