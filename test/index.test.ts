import { TSTester } from '../src/tstester'
import { commonsGroups } from "./commons.test";
import { fsGroups } from './fs.test';
import { countriesGroups } from './tscountry.test';
import { dateGroups } from './tsdate.test';
import { dateCompGroups } from './tsdatecomp.test';
import { defaultsGroups } from './tsdefaults.test';
import { intervalGroups } from './tsinterval.test';
import { rangeGroups } from './tsrange.test';
import { rangeSetGroups } from './tsrangeset.test';
import { requestGroups } from './tsrequest.test';
import { serverGroups } from './tsserver.test';
import { utilsGroups } from './utils.test';

const tester = new TSTester("Foundation-ts unary tests") ;

tester.addGroups(commonsGroups) ;
tester.addGroups(fsGroups) ;
tester.addGroups(utilsGroups) ;
tester.addGroups(countriesGroups) ;
tester.addGroups(dateGroups) ;
tester.addGroups(dateCompGroups) ;
tester.addGroups(defaultsGroups) ;
tester.addGroups(intervalGroups) ;
tester.addGroups(rangeGroups) ;
tester.addGroups(rangeSetGroups) ;
tester.addGroups(requestGroups) ;
tester.addGroups(serverGroups) ;

tester.run() ;