import { $hasproperties, $isarray, $isnumber, $isstring, $ok } from "./commons";
import { $numcompare } from "./compare";
import { TSError } from "./tserrors";
import { TSClone, TSLeafInspect, TSObject } from "./tsobject";
import { Ascending, Comparison, Descending, Nullable, Same } from "./types";

export interface TSPoint {
    x:number ;
    y:number ;
}

export interface TSSize {
    w:number ;
    h:number ;
}

export enum TSRectEdge {
  TSMinXEdge = 0,
  TSMinYEdge = 1,
  TSMaxXEdge = 2,
  TSMaxYEdge = 3
} ;

export type TSDocumentFormat = 'min' | 'max' |

                              // ISO format 
                              '4a0' | '2a0' | 'a0+' | 'a0' | 'a1+' | 'a1' | 'a2' | 
                              'a3+' | 'a3' | 'a4' | 'a5' | 'a6' | 'a7' | 
                              'a8' | 'a9' | 'a10' | 'a11' | 'a12' | 'a13' |
                              'b0+' | 'b0' | 'b1+' | 'b1' | 'b2+' | 'b2' | 
                              'b3' | 'b4' | 'b5' | 'b6' | 'b7' | 'b8' | 
                              'b9' | 'b10' | 'b11' | 'b12' | 'b13' |
                              'c0' | 'c1' | 'c2' | 'c3' | 'c4' | 'c5' |
                              'c6' | 'c7' | 'c8' | 'c9' | 'c10' |
                              'ra0' | 'ra1' | 'ra2' | 'ra3' | 'ra4' |
                              'sra0' | 'sra1' | 'sra2' | 'sra3' | 'sra4' |
                              'sra1+' | 'sra2+' | 'sra3+' | 'sra3++' |
                              'a0u' | 'a1u' | 'a2u' | 'a3u' | 'a4u' |

                              '4a0-landscape' | '2a0-landscape' | 'a0+landscape' | 'a0-landscape' | 'a1+landscape' | 'a1-landscape' | 'a2-landscape' |
                              'a3+landscape' | 'a3-landscape' | 'a4-landscape' | 'a5-landscape' | 'a6-landscape' | 'a7-landscape'  | 
                              'a8-landscape' | 'a9-landscape' | 'a10-landscape' | 'a11-landscape' | 'a12-landscape' | 'a13-landscape' |
                              'b0+landscape' | 'b0-landscape' | 'b1+landscape' | 'b1-landscape' | 'b2+landscape' | 'b2-landscape' | 
                              'b3-landscape' | 'b4-landscape' | 'b5-landscape' | 'b6-landscape' | 'b7-landscape' | 'b8-landscape' | 
                              'b9-landscape' | 'b10-landscape' | 'b11-landscape' | 'b12-landscape' | 'b13-landscape' |
                              'c0-landscape' | 'c1-landscape' | 'c2-landscape' | 'c3-landscape' | 'c4-landscape' | 'c5-landscape' |
                              'c6-landscape' | 'c7-landscape' | 'c8-landscape' | 'c9-landscape' | 'c10-landscape' |
                              'ra0-landscape' | 'ra1-landscape' | 'ra2-landscape' | 'ra3-landscape' | 'ra4-landscape' |
                              'sra0-landscape' | 'sra1-landscape' | 'sra2-landscape' | 'sra3-landscape' | 'sra4-landscape' |
                              'sra1+landscape' | 'sra2+landscape' | 'sra3+landscape' | 'sra3++landscape' |
                              'a0u-landscape' | 'a1u-landscape' | 'a2u-landscape' | 'a3u-landscape' | 'a4u-landscape' |

                              // US format
                              'letter' | 'legal' | 'tabloid' |
                              'gov-letter' | 'gov-legal' | 'half-letter' | 'junior-legal' |
                              'arch-a' | 'arch-b' | 'arch-c' | 'arch-d' |
                              'arch-e' | 'arch-e1' | 'arch-e2' | 'arch-e3' |
                              'ansi-c' | 'ansi-d' | 'ansi-e' |
                              'letter-landscape' | 'legal-landscape' | 'ledger' | 
                              'gov-letter-landscape' | 'gov-legal-landscape' | 'half-letter-landscape' | 'junior-legal-landscape' |
                              'arch-a-landscape' | 'arch-b-landscape' | 'arch-c-landscape' | 'arch-d-landscape' |
                              'arch-e-landscape' | 'arch-e1-landscape' | 'arch-e2-landscape' | 'arch-e3-landscape' |
                              'ansi-c-landscape' | 'ansi-d-landscape' | 'ansi-e-landscape' |

                              // Some french formats
                              'raisin' | 'demi-raisin' | 'double-raisin' | 'jesus' | 'soleil' | 'univers' |
                              'raisin-landscape' | 'demi-raisin-landscape' | 'double-raisin-landscape' | 'jesus-landscape' | 'soleil-landscape' | 'univers-landscape' | 
                            
                              // german formats
                              'din-d0' | 'din-d1' | 'din-d2' | 'din-d3' | 'din-d4' | 
                              'din-d5' | 'din-d6' | 'din-d7' | 'din-d8' | 
                              'din-d0-landscape' | 'din-d1-landscape' | 'din-d2-landscape' | 'din-d3-landscape' | 'din-d4-landscape' | 
                              'din-d5-landscape' | 'din-d6-landscape' | 'din-d7-landscape' | 'din-d8-landscape' | 

                              // enveloppes
                              'envelope-dl' | 'envelope-b4' | 'envelope-b5' | 'envelope-b6' | 'envelope-c3' | 'envelope-c4' | 'envelope-c4m' | 
                              'envelope-c5' | 'envelope-c6/c5' | 'envelope-c6' | 'envelope-c64m' | 'envelope-c7/c6' | 'envelope-c7' | 
                              'envelope-ce4' | 'envelope-ce64' | 'envelope-e4' | 'envelope-ec45' | 'envelope-ec5' | 'envelope-e5' | 'envelope-e56' | 
                              'envelope-e6' | 'envelope-e65' | 'envelope-r7' | 'envelope-s4' | 'envelope-s5' | 'envelope-s65' | 
                              'envelope-x5' | 'envelope-ex5' |

                              // some books formats
                              'folio' | 'quarto' | 'octavo' | 
                              'a-format' | 'b-format' | 'c-format' |
                              'folio-landscape' | 'quarto-landscape' | 'octavo-landscape' | 
                              'a-format-landscape' | 'b-format-landscape' | 'c-format-landscape'

;

export const TSDocumentFormats:{[key in TSDocumentFormat]:TSSize} = {
    'min':                      { w:TSmm2Pixels(100),       h:TSmm2Pixels(100)      },
    'max':                      { w:TSmm2Pixels(1200),      h:TSmm2Pixels(1200)     },
    'letter':                   { w:TSInches2Pixels(8.5),   h:TSInches2Pixels(11)   },
    'letter-landscape':         { w:TSInches2Pixels(11),    h:TSInches2Pixels(8.5)  },
    'legal':                    { w:TSInches2Pixels(8.5),   h:TSInches2Pixels(14)   },
    'legal-landscape':          { w:TSInches2Pixels(14),    h:TSInches2Pixels(8.5)  },
    'tabloid':                  { w:TSInches2Pixels(11),    h:TSInches2Pixels(17)   },
    'ledger':                   { w:TSInches2Pixels(17),    h:TSInches2Pixels(11)   },
    'gov-letter':               { w:TSInches2Pixels(8),     h:TSInches2Pixels(10.5) },
    'gov-letter-landscape':     { w:TSInches2Pixels(10.5),  h:TSInches2Pixels(8)    },
    'gov-legal':                { w:TSInches2Pixels(8.5),   h:TSInches2Pixels(13)   },
    'gov-legal-landscape':      { w:TSInches2Pixels(13),    h:TSInches2Pixels(8.5)  },
    'half-letter':              { w:TSInches2Pixels(5.5),   h:TSInches2Pixels(8.5)  },
    'half-letter-landscape':    { w:TSInches2Pixels(8.5),   h:TSInches2Pixels(5.5)  },
    'junior-legal':             { w:TSInches2Pixels(5),     h:TSInches2Pixels(8)    },
    'junior-legal-landscape':   { w:TSInches2Pixels(8),     h:TSInches2Pixels(5)    },
    'arch-a':                   { w:TSInches2Pixels(9),     h:TSInches2Pixels(12)   },
    'arch-a-landscape':         { w:TSInches2Pixels(12),    h:TSInches2Pixels(9)   },
    'arch-b':                   { w:TSInches2Pixels(12),    h:TSInches2Pixels(18)   },
    'arch-b-landscape':         { w:TSInches2Pixels(18),    h:TSInches2Pixels(12)   },
    'arch-c':                   { w:TSInches2Pixels(18),    h:TSInches2Pixels(24)   },
    'arch-c-landscape':         { w:TSInches2Pixels(24),    h:TSInches2Pixels(18)   },
    'arch-d':                   { w:TSInches2Pixels(24),    h:TSInches2Pixels(36)   },
    'arch-d-landscape':         { w:TSInches2Pixels(36),    h:TSInches2Pixels(24)   },
    'arch-e':                   { w:TSInches2Pixels(36),    h:TSInches2Pixels(48)   },
    'arch-e-landscape':         { w:TSInches2Pixels(48),    h:TSInches2Pixels(36)   },
    'arch-e1':                  { w:TSInches2Pixels(30),    h:TSInches2Pixels(42)   },
    'arch-e1-landscape':        { w:TSInches2Pixels(42),    h:TSInches2Pixels(30)   },
    'arch-e2':                  { w:TSInches2Pixels(26),    h:TSInches2Pixels(38)   },
    'arch-e2-landscape':        { w:TSInches2Pixels(38),    h:TSInches2Pixels(26)   },
    'arch-e3':                  { w:TSInches2Pixels(27),    h:TSInches2Pixels(39)   },    
    'arch-e3-landscape':        { w:TSInches2Pixels(39),    h:TSInches2Pixels(27)   },    
    'ansi-c':                   { w:TSInches2Pixels(17),    h:TSInches2Pixels(22)   },    
    'ansi-c-landscape':         { w:TSInches2Pixels(22),    h:TSInches2Pixels(17)   },    
    'ansi-d':                   { w:TSInches2Pixels(22),    h:TSInches2Pixels(34)   },    
    'ansi-d-landscape':         { w:TSInches2Pixels(34),    h:TSInches2Pixels(22)   },    
    'ansi-e':                   { w:TSInches2Pixels(34),    h:TSInches2Pixels(44)   },    
    'ansi-e-landscape':         { w:TSInches2Pixels(44),    h:TSInches2Pixels(34)   },    
    '4a0':                      { w:TSmm2Pixels(1682),      h:TSmm2Pixels(2378)     },
    '4a0-landscape':            { w:TSmm2Pixels(2378),      h:TSmm2Pixels(1682)     },
    '2a0':                      { w:TSmm2Pixels(1189),      h:TSmm2Pixels(1682)     },
    '2a0-landscape':            { w:TSmm2Pixels(1682),      h:TSmm2Pixels(1189)     },
    'a0+':                      { w:TSmm2Pixels(914),       h:TSmm2Pixels(1292)     },
    'a0+landscape':             { w:TSmm2Pixels(1292),      h:TSmm2Pixels(914)      },
    'a0':                       { w:TSmm2Pixels(841),       h:TSmm2Pixels(1189)     },
    'a0-landscape':             { w:TSmm2Pixels(1189),      h:TSmm2Pixels(841)      },
    'a1+':                      { w:TSmm2Pixels(608),       h:TSmm2Pixels(914)      },
    'a1+landscape':             { w:TSmm2Pixels(914),       h:TSmm2Pixels(608)      },
    'a1':                       { w:TSmm2Pixels(594),       h:TSmm2Pixels(841)      },
    'a1-landscape':             { w:TSmm2Pixels(841),       h:TSmm2Pixels(594)      },
    'a2':                       { w:TSmm2Pixels(420),       h:TSmm2Pixels(594)      },
    'a2-landscape':             { w:TSmm2Pixels(594),       h:TSmm2Pixels(420)      },
    'a3+':                      { w:TSmm2Pixels(329),       h:TSmm2Pixels(483)      },
    'a3+landscape':             { w:TSmm2Pixels(483),       h:TSmm2Pixels(329)      },
    'a3':                       { w:TSmm2Pixels(297),       h:TSmm2Pixels(420)      },
    'a3-landscape':             { w:TSmm2Pixels(420),       h:TSmm2Pixels(297)      },
    'a4':                       { w:TSmm2Pixels(210),       h:TSmm2Pixels(297)      },
    'a4-landscape':             { w:TSmm2Pixels(297),       h:TSmm2Pixels(210)      },
    'a5':                       { w:TSmm2Pixels(148),       h:TSmm2Pixels(210)      },
    'a5-landscape':             { w:TSmm2Pixels(210),       h:TSmm2Pixels(148)      },
    'a6':                       { w:TSmm2Pixels(105),       h:TSmm2Pixels(148)      },
    'a6-landscape':             { w:TSmm2Pixels(148),       h:TSmm2Pixels(105)      },
    'a7':                       { w:TSmm2Pixels(74),        h:TSmm2Pixels(105)      },
    'a7-landscape':             { w:TSmm2Pixels(105),       h:TSmm2Pixels(74)       },
    'a8':                       { w:TSmm2Pixels(52),        h:TSmm2Pixels(74)       },
    'a8-landscape':             { w:TSmm2Pixels(74),        h:TSmm2Pixels(52)       },
    'a9':                       { w:TSmm2Pixels(37),        h:TSmm2Pixels(52)       },
    'a9-landscape':             { w:TSmm2Pixels(52),        h:TSmm2Pixels(37)       },
    'a10':                      { w:TSmm2Pixels(26),        h:TSmm2Pixels(37)       },
    'a10-landscape':            { w:TSmm2Pixels(37),        h:TSmm2Pixels(26)       },
    'a11':                      { w:TSmm2Pixels(18),        h:TSmm2Pixels(26)       },
    'a11-landscape':            { w:TSmm2Pixels(26),        h:TSmm2Pixels(18)       },
    'a12':                      { w:TSmm2Pixels(13),        h:TSmm2Pixels(18)       },
    'a12-landscape':            { w:TSmm2Pixels(18),        h:TSmm2Pixels(13)       },
    'a13':                      { w:TSmm2Pixels(9),         h:TSmm2Pixels(13)       },
    'a13-landscape':            { w:TSmm2Pixels(13),        h:TSmm2Pixels(9)        },
    'b0+':                      { w:TSmm2Pixels(1118),      h:TSmm2Pixels(1580)     },
    'b0+landscape':             { w:TSmm2Pixels(1580),      h:TSmm2Pixels(1118)     },
    'b0':                       { w:TSmm2Pixels(1000),      h:TSmm2Pixels(1414)     },
    'b0-landscape':	            { w:TSmm2Pixels(1414),      h:TSmm2Pixels(1000)     },
    'b1+':	                    { w:TSmm2Pixels(720),       h:TSmm2Pixels(1020)     },
    'b1+landscape':             { w:TSmm2Pixels(1020),      h:TSmm2Pixels(720)      },
    'b1':                       { w:TSmm2Pixels(707),       h:TSmm2Pixels(1000)     },
    'b1-landscape':	            { w:TSmm2Pixels(1000),      h:TSmm2Pixels(707)      },
    'b2+':	                    { w:TSmm2Pixels(520),       h:TSmm2Pixels(720)      },
    'b2+landscape':             { w:TSmm2Pixels(720),       h:TSmm2Pixels(520)      },
    'b2':                       { w:TSmm2Pixels(500),       h:TSmm2Pixels(707)      },
    'b2-landscape':	            { w:TSmm2Pixels(707),       h:TSmm2Pixels(500)      },
    'b3':                       { w:TSmm2Pixels(353),       h:TSmm2Pixels(500)      },
    'b3-landscape':	            { w:TSmm2Pixels(500),       h:TSmm2Pixels(353)      },
    'b4':                       { w:TSmm2Pixels(250),       h:TSmm2Pixels(353)      },
    'b4-landscape':	            { w:TSmm2Pixels(353),       h:TSmm2Pixels(250)      },
    'b5':                       { w:TSmm2Pixels(176),       h:TSmm2Pixels(250)      },
    'b5-landscape':	            { w:TSmm2Pixels(250),       h:TSmm2Pixels(176)      },
    'b6':                       { w:TSmm2Pixels(125),       h:TSmm2Pixels(176)      },
    'b6-landscape':	            { w:TSmm2Pixels(176),       h:TSmm2Pixels(125)      },
    'b7':                       { w:TSmm2Pixels(88),        h:TSmm2Pixels(125)      },
    'b7-landscape':	            { w:TSmm2Pixels(125),       h:TSmm2Pixels(88)       },
    'b8':                       { w:TSmm2Pixels(62),        h:TSmm2Pixels(88)       },
    'b8-landscape':	            { w:TSmm2Pixels(88),        h:TSmm2Pixels(62)       },
    'b9':                       { w:TSmm2Pixels(44),        h:TSmm2Pixels(62)       },
    'b9-landscape':	            { w:TSmm2Pixels(62),        h:TSmm2Pixels(44)       },
    'b10':                      { w:TSmm2Pixels(31),        h:TSmm2Pixels(44)       },
    'b10-landscape':	        { w:TSmm2Pixels(44),        h:TSmm2Pixels(31)       },
    'b11':                      { w:TSmm2Pixels(22),        h:TSmm2Pixels(31)       },
    'b11-landscape':	        { w:TSmm2Pixels(31),        h:TSmm2Pixels(22)       },
    'b12':                      { w:TSmm2Pixels(15),        h:TSmm2Pixels(22)       },
    'b12-landscape':	        { w:TSmm2Pixels(22),        h:TSmm2Pixels(15)       },
    'b13':                      { w:TSmm2Pixels(11),        h:TSmm2Pixels(15)       },
    'b13-landscape':	        { w:TSmm2Pixels(15),        h:TSmm2Pixels(11)       },
    'c0':                       { w:TSmm2Pixels(917),       h:TSmm2Pixels(1297)     },
    'c0-landscape':             { w:TSmm2Pixels(1297),      h:TSmm2Pixels(917)      },
    'c1':                       { w:TSmm2Pixels(648),       h:TSmm2Pixels(917)      },
    'c1-landscape':             { w:TSmm2Pixels(917),       h:TSmm2Pixels(648)      },
    'c2':                       { w:TSmm2Pixels(458),       h:TSmm2Pixels(648)      },
    'c2-landscape':             { w:TSmm2Pixels(648),       h:TSmm2Pixels(458)      },
    'c3':                       { w:TSmm2Pixels(324),       h:TSmm2Pixels(458)      },
    'c3-landscape':             { w:TSmm2Pixels(458),       h:TSmm2Pixels(324)      },
    'c4':                       { w:TSmm2Pixels(229),       h:TSmm2Pixels(324)      },
    'c4-landscape':             { w:TSmm2Pixels(324),       h:TSmm2Pixels(229)      },
    'c5':                       { w:TSmm2Pixels(162),       h:TSmm2Pixels(229)      },
    'c5-landscape':             { w:TSmm2Pixels(229),       h:TSmm2Pixels(162)      },
    'c6':                       { w:TSmm2Pixels(114),       h:TSmm2Pixels(162)      },
    'c6-landscape':             { w:TSmm2Pixels(162),       h:TSmm2Pixels(114)      },
    'c7':                       { w:TSmm2Pixels(81),        h:TSmm2Pixels(114)      },
    'c7-landscape':             { w:TSmm2Pixels(114),       h:TSmm2Pixels(81)       },
    'c8':                       { w:TSmm2Pixels(57),        h:TSmm2Pixels(81)       },
    'c8-landscape':             { w:TSmm2Pixels(81),        h:TSmm2Pixels(57)       },
    'c9':                       { w:TSmm2Pixels(40),        h:TSmm2Pixels(57)       },
    'c9-landscape':             { w:TSmm2Pixels(57),        h:TSmm2Pixels(40)       },
    'c10':                      { w:TSmm2Pixels(28),        h:TSmm2Pixels(40)       },
    'c10-landscape':            { w:TSmm2Pixels(40),        h:TSmm2Pixels(28)       },
    'ra0':      	            { w:TSmm2Pixels(860),       h:TSmm2Pixels(1220)     },
    'ra0-landscape':      	    { w:TSmm2Pixels(1220),      h:TSmm2Pixels(860)      },
    'ra1':      	            { w:TSmm2Pixels(610),       h:TSmm2Pixels(860)      },
    'ra1-landscape':      	    { w:TSmm2Pixels(860),      h:TSmm2Pixels(610)       },
    'ra2':      	            { w:TSmm2Pixels(430),       h:TSmm2Pixels(610)      },
    'ra2-landscape':      	    { w:TSmm2Pixels(610),      h:TSmm2Pixels(430)       },
    'ra3':      	            { w:TSmm2Pixels(305),       h:TSmm2Pixels(430)      },
    'ra3-landscape':      	    { w:TSmm2Pixels(430),      h:TSmm2Pixels(305)       },
    'ra4':      	            { w:TSmm2Pixels(215),       h:TSmm2Pixels(305)      },
    'ra4-landscape':      	    { w:TSmm2Pixels(305),      h:TSmm2Pixels(215)       },
    'sra0':     	            { w:TSmm2Pixels(900),       h:TSmm2Pixels(1280)     },
    'sra0-landscape':     	    { w:TSmm2Pixels(1280),     h:TSmm2Pixels(900)       },
    'sra1':     	            { w:TSmm2Pixels(640),       h:TSmm2Pixels(900)      },
    'sra1-landscape':     	    { w:TSmm2Pixels(900),      h:TSmm2Pixels(640)       },
    'sra2':     	            { w:TSmm2Pixels(450),       h:TSmm2Pixels(640)      },
    'sra2-landscape':     	    { w:TSmm2Pixels(640),      h:TSmm2Pixels(450)       },
    'sra3':     	            { w:TSmm2Pixels(320),       h:TSmm2Pixels(450)      },
    'sra3-landscape':     	    { w:TSmm2Pixels(450),      h:TSmm2Pixels(320)       },
    'sra4':     	            { w:TSmm2Pixels(225),       h:TSmm2Pixels(320)      },
    'sra4-landscape':     	    { w:TSmm2Pixels(320),      h:TSmm2Pixels(225)       },
    'sra1+':                    { w:TSmm2Pixels(660),       h:TSmm2Pixels(920)      },
    'sra1+landscape':           { w:TSmm2Pixels(920),      h:TSmm2Pixels(660)       },
    'sra2+':                    { w:TSmm2Pixels(480),       h:TSmm2Pixels(650)      },
    'sra2+landscape':           { w:TSmm2Pixels(650),      h:TSmm2Pixels(480)       },
    'sra3+':                    { w:TSmm2Pixels(320),       h:TSmm2Pixels(460)      },
    'sra3+landscape':           { w:TSmm2Pixels(460),      h:TSmm2Pixels(320)       },
    'sra3++':                   { w:TSmm2Pixels(320),       h:TSmm2Pixels(464)      },
    'sra3++landscape':          { w:TSmm2Pixels(464),      h:TSmm2Pixels(320)       },
    'a0u':                      { w:TSmm2Pixels(880),       h:TSmm2Pixels(1230)     },
    'a0u-landscape':            { w:TSmm2Pixels(1230),     h:TSmm2Pixels(880)       },
    'a1u':                      { w:TSmm2Pixels(625),       h:TSmm2Pixels(880)      },
    'a1u-landscape':            { w:TSmm2Pixels(880),      h:TSmm2Pixels(625)       },
    'a2u':                      { w:TSmm2Pixels(450),       h:TSmm2Pixels(625)      },
    'a2u-landscape':            { w:TSmm2Pixels(625),      h:TSmm2Pixels(450)       },
    'a3u':                      { w:TSmm2Pixels(330),       h:TSmm2Pixels(450)      },
    'a3u-landscape':            { w:TSmm2Pixels(450),      h:TSmm2Pixels(330)       },
    'a4u':                      { w:TSmm2Pixels(240),       h:TSmm2Pixels(330)      },
    'a4u-landscape':            { w:TSmm2Pixels(330),      h:TSmm2Pixels(240)       },
    'demi-raisin':              { w:TSmm2Pixels(325),       h:TSmm2Pixels(500)      },
    'demi-raisin-landscape':    { w:TSmm2Pixels(500),       h:TSmm2Pixels(325)      },
    'raisin':                   { w:TSmm2Pixels(500),       h:TSmm2Pixels(650)      },
    'raisin-landscape':         { w:TSmm2Pixels(650),       h:TSmm2Pixels(500)      },
    'double-raisin':            { w:TSmm2Pixels(650),       h:TSmm2Pixels(1000)     },
    'double-raisin-landscape':  { w:TSmm2Pixels(1000),      h:TSmm2Pixels(650)      },
    'jesus':                    { w:TSmm2Pixels(560),       h:TSmm2Pixels(760)      },
    'jesus-landscape':          { w:TSmm2Pixels(760),       h:TSmm2Pixels(560)      },
    'soleil':                   { w:TSmm2Pixels(600),       h:TSmm2Pixels(800)      },
    'soleil-landscape':         { w:TSmm2Pixels(800),       h:TSmm2Pixels(600)      },
    'univers':                  { w:TSmm2Pixels(1000),      h:TSmm2Pixels(1130)     },
    'univers-landscape':        { w:TSmm2Pixels(1130),      h:TSmm2Pixels(1000)     },
    'din-d0':                   { w:TSmm2Pixels(771),       h:TSmm2Pixels(1090)     },
    'din-d0-landscape':         { w:TSmm2Pixels(1090),      h:TSmm2Pixels(771)      },
    'din-d1':                   { w:TSmm2Pixels(545),       h:TSmm2Pixels(771)      },
    'din-d1-landscape':         { w:TSmm2Pixels(771),       h:TSmm2Pixels(545)      },
    'din-d2':                   { w:TSmm2Pixels(385),       h:TSmm2Pixels(545)      },
    'din-d2-landscape':         { w:TSmm2Pixels(545),       h:TSmm2Pixels(385)      },
    'din-d3':                   { w:TSmm2Pixels(272),       h:TSmm2Pixels(385)      },
    'din-d3-landscape':         { w:TSmm2Pixels(385),       h:TSmm2Pixels(272)      },
    'din-d4':                   { w:TSmm2Pixels(192),       h:TSmm2Pixels(272)      },
    'din-d4-landscape':         { w:TSmm2Pixels(272),       h:TSmm2Pixels(192)      },
    'din-d5':                   { w:TSmm2Pixels(136),       h:TSmm2Pixels(192)      },
    'din-d5-landscape':         { w:TSmm2Pixels(192),       h:TSmm2Pixels(136)      },
    'din-d6':                   { w:TSmm2Pixels(96),        h:TSmm2Pixels(136)      },
    'din-d6-landscape':         { w:TSmm2Pixels(136),       h:TSmm2Pixels(96)       },
    'din-d7':                   { w:TSmm2Pixels(68),        h:TSmm2Pixels(96)       },
    'din-d7-landscape':         { w:TSmm2Pixels(96),        h:TSmm2Pixels(68)       },
    'din-d8':                   { w:TSmm2Pixels(48),        h:TSmm2Pixels(68)       },
    'din-d8-landscape':         { w:TSmm2Pixels(68),        h:TSmm2Pixels(48)       },
    'envelope-dl':	            { w:TSmm2Pixels(110),       h:TSmm2Pixels(220)      },
    'envelope-b4':	            { w:TSmm2Pixels(250),       h:TSmm2Pixels(353)      },
    'envelope-b5':	            { w:TSmm2Pixels(176),       h:TSmm2Pixels(250)      },
    'envelope-b6':	            { w:TSmm2Pixels(125),       h:TSmm2Pixels(176)      },
    'envelope-c3':	            { w:TSmm2Pixels(324),       h:TSmm2Pixels(458)      },
    'envelope-c4':	            { w:TSmm2Pixels(229),       h:TSmm2Pixels(324)      },
    'envelope-c4m':	            { w:TSmm2Pixels(318),       h:TSmm2Pixels(229)      },
    'envelope-c5':	            { w:TSmm2Pixels(162),       h:TSmm2Pixels(229)      },
    'envelope-c6/c5':           { w:TSmm2Pixels(114),       h:TSmm2Pixels(229)      },
    'envelope-c6':	            { w:TSmm2Pixels(114),       h:TSmm2Pixels(162)      },
    'envelope-c64m':	        { w:TSmm2Pixels(318),       h:TSmm2Pixels(114)      },
    'envelope-c7/c6':	        { w:TSmm2Pixels(81),        h:TSmm2Pixels(162)      },
    'envelope-c7':	            { w:TSmm2Pixels(81),        h:TSmm2Pixels(114)      },
    'envelope-ce4':	            { w:TSmm2Pixels(229),       h:TSmm2Pixels(310)      },
    'envelope-ce64':	        { w:TSmm2Pixels(114),       h:TSmm2Pixels(310)      },
    'envelope-e4':	            { w:TSmm2Pixels(220),       h:TSmm2Pixels(312)      },
    'envelope-ec45':	        { w:TSmm2Pixels(220),       h:TSmm2Pixels(229)      },
    'envelope-ec5':	            { w:TSmm2Pixels(155),       h:TSmm2Pixels(229)      },
    'envelope-e5':	            { w:TSmm2Pixels(115),       h:TSmm2Pixels(220)      },
    'envelope-e56':	            { w:TSmm2Pixels(155),       h:TSmm2Pixels(155)      },
    'envelope-e6':	            { w:TSmm2Pixels(110),       h:TSmm2Pixels(155)      },
    'envelope-e65':	            { w:TSmm2Pixels(110),       h:TSmm2Pixels(220)      },
    'envelope-r7':	            { w:TSmm2Pixels(120),       h:TSmm2Pixels(135)      },
    'envelope-s4':	            { w:TSmm2Pixels(250),       h:TSmm2Pixels(330)      },
    'envelope-s5':	            { w:TSmm2Pixels(185),       h:TSmm2Pixels(255)      },
    'envelope-s65':	            { w:TSmm2Pixels(110),       h:TSmm2Pixels(225)      },
    'envelope-x5':	            { w:TSmm2Pixels(105),       h:TSmm2Pixels(216)      },
    'envelope-ex5':	            { w:TSmm2Pixels(155),       h:TSmm2Pixels(216)      },
    'folio':                    { w:TSInches2Pixels(12),    h:TSInches2Pixels(19)   },
    'folio-landscape':          { w:TSInches2Pixels(19),    h:TSInches2Pixels(12)   },
    'quarto':                   { w:TSInches2Pixels(9.5),   h:TSInches2Pixels(12)   },
    'quarto-landscape':         { w:TSInches2Pixels(12),    h:TSInches2Pixels(9.5)  },
    'octavo':                   { w:TSInches2Pixels(6),     h:TSInches2Pixels(9)    },
    'octavo-landscape':         { w:TSInches2Pixels(9),     h:TSInches2Pixels(6)    },
    'a-format':                 { w:TSmm2Pixels(110),       h:TSmm2Pixels(178)      },
    'a-format-landscape':       { w:TSmm2Pixels(178),       h:TSmm2Pixels(110)      },
    'b-format':                 { w:TSmm2Pixels(129),       h:TSmm2Pixels(198)      },
    'b-format-landscape':       { w:TSmm2Pixels(198),       h:TSmm2Pixels(129)      },
    'c-format':                 { w:TSmm2Pixels(135),       h:TSmm2Pixels(216)      },
    'c-format-landscape':       { w:TSmm2Pixels(216),       h:TSmm2Pixels(135)      },
} ;

const customInspectSymbol = Symbol.for('nodejs.util.inspect.custom') ;

export interface TSFrame extends TSPoint, TSSize {} // the 'interface' version of a TSRect

export class TSRect implements TSFrame, TSObject, TSLeafInspect, TSClone<TSRect> {
    // ignoring affectation warnings because setting is made in this._setInternalValues()
    // @ts-ignore
    public x:number ;
    // @ts-ignore
    public y:number ;
    // @ts-ignore
    public w:number ;
    // @ts-ignore
    public h:number ;

	public constructor() ;
	public constructor(rect:TSRect) ;
	public constructor(frame:TSFrame) ;
    public constructor(format:TSDocumentFormat) ;
    public constructor(arrayRect:number[]) ;
    public constructor(x:number, y:number, w:number, h:number) ;
	public constructor(origin:TSPoint, w:number, h:number) ;
    public constructor(x:number, y:number, size:TSSize|TSDocumentFormat) ;
	public constructor(origin:TSPoint, size:TSSize|TSDocumentFormat) ;
	public constructor() {
		const n = arguments.length ;
        switch (n) {
			case 0:
                this.x = this.y = this.w = this.h = 0 ;
                break ;
            case 1:{
                if ($isstring(arguments[0])) {
                    const s = TSDocumentFormats[arguments[0] as TSDocumentFormat] ;
                    this._setInternalValues('bad document format parameter', 0, 0, s?.w, s?.h, $ok(s)) ;
                }
                else if ($isarray(arguments[0])) {
                    const a = arguments[0] as Array<number> ;
                    this._setInternalValues('bad rect definition array parameter', a[0], a[1], a[2], a[3], a.length === 4) ;
                }
                else if ((arguments[0] instanceof TSRect)) {
                    const r = arguments[0] as TSRect ;
                    this._setInternalValues('bad TSRect parameter', r.minX, r.minY, r.width, r.height) ;
                }
                else if ($conformsToFrame(arguments[0])) {
                    const f = arguments[0] as TSFrame ;
                    this._setInternalValues('bad TSFrame parameter', f.x, f.y, f.w, f.h) ;
                }
                else {
                    TSError.throw('TSRect.constructor() : should have a TSRect, a TSFrame or a document format parameter', { arguments:Array.from(arguments)}) ;
                }
                break ;
            }
            case 2:
                if ($comformsToPoint(arguments[0])) {
                    const s = $isstring(arguments[1]) ? TSDocumentFormats[arguments[1] as TSDocumentFormat] : arguments[1] as TSSize ;
                    if ($conformsToSize(s)) {
                        const p = arguments[0] as TSPoint ;
                        this._setInternalValues('bad TSPoint+(TSSize or TSDocumentFormat) 2 parameters', p.x, p.y, s.w, s.h) ;
                    }
                    else {
                        TSError.throw('TSRect.constructor() : 2nd parameeter is not a TSSize', { arguments:Array.from(arguments)}) ;
                    }
                }
                else {
                    TSError.throw('TSRect.constructor() : 1st parameter is not a TSPoint', { arguments:Array.from(arguments)}) ;
                }
                break ;
            case 3:
                if ($isnumber(arguments[0]) && $isnumber(arguments[1]) && ($isstring(arguments[2]) || $conformsToSize(arguments[2]))) {
                    const s = $isstring(arguments[2]) ? TSDocumentFormats[arguments[2] as TSDocumentFormat] : arguments[2] as TSSize ;
                    this._setInternalValues('bad [number, number, size or format] parameters', arguments[0], arguments[1], s.w, s.h) ;
                }
                else if ($comformsToPoint(arguments[0]) && $isnumber(arguments[1]) && $isnumber(arguments[2])) {
                    const p = (arguments[0] as TSPoint) ;
                    this._setInternalValues('bad [point, number, number] parameters', p.x, p.y, arguments[1], arguments[2]) ;
                }
                else {
                    TSError.throw('TSRect.constructor() : bad TSPoint, TSSize or number parameter', { arguments:Array.from(arguments)}) ;
                }
                break ;
            case 4:
                this._setInternalValues('one or more bad number parameter', arguments[0], arguments[1], arguments[2], arguments[3]) ;
                break ;

            default:
                TSError.throw('TSRect.constructor() : too much arguments', { arguments:Array.from(arguments)}) ;
        }
    }

    public get origin():TSPoint { return { x:this.minX, y:this.minY } ; }
    public get size():TSSize    { return { w:this.width, h:this.height } ; }
    public get width():number   { return this.maxX - this.minX ; }
    public get height():number  { return this.maxY - this.minY ; }
    public get frame():TSFrame  { return { x:this.minX, y:this.minY, w:this.width, h:this.height } ; }

    public get minX():number    { return this.x ; }
    public get minY():number    { return this.y ; }
    public get maxX():number    { return this.x + this.w ; }
    public get maxY():number    { return this.y + this.h ; }

    public get midX():number    { return this.x + this.w/2 ; }
    public get midY():number    { return this.y + this.h/2 ; }

    public get isEmpty():boolean  { return this.w > 0 && this.h > 0 ? false : true ; }

    public contains(p:Nullable<TSPoint|TSRect|number[]>):boolean {
        if (p instanceof TSRect) {
            const r = p as TSRect ;
            return !r.isEmpty && this.minX <= r.minX && this.minY <= r.minY && this.maxX >= r.maxX && this.maxY >= r.maxY ;
        }
        if ($isarray(p)) {
            const a = p as number[] ;
            if ((a.length === 2 || a.length === 4) && $isnumber(a[0]) && $isnumber(a[1]) && (a.length === 2 || ($isnumber(a[2]) && $isnumber(a[3]) && a[2] >= 0 && a[3]>=0))) {
                return a.length === 2 ? this.contains({x:a[0], y:a[1]}) : this.contains(new TSRect(a[0], a[1], a[2], a[3]))
            }
            return false ;
        }
        return $comformsToPoint(p) ? (p as TSPoint).x >= this.minX && (p as TSPoint).x <= this.maxX && (p as TSPoint).y >= this.minY && (p as TSPoint).y <= this.maxY : false ;
    }

    public containsPoint(p:Nullable<TSPoint|number[]>):boolean {
        if ($isarray(p) && (p as number[]).length !== 2) { return false ; }
        return this.contains(p) ;
    }

    public containsRect(p:Nullable<TSRect|number[]>):boolean {
        if ($isarray(p) && (p as number[]).length !== 4) { return false ; }
        return this.contains(p) ;
    }

    public containedIn(r:Nullable<TSRect|number[]>):boolean {
        if (!$ok(r)) { return false ; }
        try { r = $isarray(r) ? new TSRect(r as number[]) : r as TSRect ; }
        catch { return false ; }

        return r.contains(this) ;
    }
    containedInRect = this.containedIn ;

    public intersects(r:Nullable<TSRect|number[]>):boolean {
        if (!$ok(r)) { return false ; }

        try { r = $isarray(r) ? new TSRect(r as number[]) : r as TSRect ; }
        catch { return false ; }

        return this.maxX <= r.minX || r.maxX <= this.minX || this.maxY <= r.minY || r.maxY <= this.minY || this.isEmpty || r.isEmpty ? false : true ;
    }
    intersectsRect = this.intersects ;

    public intersection(r:Nullable<TSRect|number[]>):TSRect {
        let rect = new TSRect() ;
        if (!$ok(r)) { return rect ; }
        try { r = $isarray(r) ? new TSRect(r as number[]) : r as TSRect ; }
        catch { return rect ; }

        if (this.maxX <= r.minX || r.maxX <= this.minX || this.maxY <= r.minY || r.maxY <= this.minY) {
            return rect ;
        }

        rect.x = Math.max(this.minX, r.minX) ;
        rect.y = Math.max(this.minY, r.minY) ;
        rect.w = Math.min(this.maxX, r.maxX) - rect.x ;
        rect.h = Math.min(this.maxY, r.maxY) - rect.y ;

        return rect ;
    }
    intersectionRect = this.intersection ;

    public union(r:Nullable<TSRect|number[]>):TSRect {
        if (!$ok(r))      { return this.clone() ; }
        r = $isarray(r) ? new TSRect(r as number[]) : r as TSRect ;

        if (this.isEmpty) { return r.clone() ; } // r may be empty here. We clone it anyway.
        if (r.isEmpty)    { return this.clone() ; }

        let rect = new TSRect() ;

        rect.x = Math.min(this.minX, r.minX) ;
        rect.y = Math.min(this.minY, r.minY) ;
        rect.w = Math.max(this.maxX, r.maxX) - rect.x ;
        rect.h = Math.max(this.maxY, r.maxY) - rect.y ;

        return rect ;
    }
    unionRect = this.union ;

    public offset(xOffset:number, yOffset:number):TSRect {
        if (!$isnumber(xOffset) || !$isnumber(yOffset)) {
            TSError.throw('TSRect.offset() : invalid offset parameter', { xOffset:xOffset, yOffset:yOffset}) ;
        }
        return new TSRect(this.minX+xOffset, this.minY+yOffset, this.width, this.height) ;
    }
    offsetRect = this.offset ;

    public inset(insetWidth:number, insetHeight:number):TSRect {
        if (!$isnumber(insetWidth) || !$isnumber(insetHeight)) {
            TSError.throw('TSRect.inset() : invalid inset parameter', { insetWidth:insetWidth, insetHeight:insetHeight}) ;
        }
        return new TSRect(this.minX-insetWidth, this.minY-insetHeight, this.width + insetWidth*2, this.height + insetHeight*2) ;
    }
    insetRect = this.inset ;

    public integral():TSRect {
        let rect = new TSRect() ;
        rect.x = Math.floor(this.minX) ;
        rect.y = Math.floor(this.minY) ;

        if (this.isEmpty) { return rect ; }
        rect.w = Math.ceil(this.maxX) - rect.x ;
        rect.h = Math.ceil(this.maxY) - rect.y ;
        
        return rect ;
    }
    integralRect = this.integral ;

    /**
     * 
     * @param amount the part of widh or height we keep for the slice
     * @param edge on which edge do we decide to divide our rect
     * @returns a tupple with first the slice we want and second the remainding part of the rect
     */
    public divide(amount:number, edge:TSRectEdge):[TSRect,TSRect] {
        const x = this.minX ;
        const y = this.minY ;
        const w = this.width ;
        const h = this.height ;

        if (amount === Number.POSITIVE_INFINITY) { amount = Math.max(w,h) ; }
        if (!$isnumber(amount) || amount < 0) { amount = 0 ; }

        switch (edge) {
            case TSRectEdge.TSMinXEdge:
                return amount > w ? 
                       [new TSRect(x,y,w,h), new TSRect(this.maxX, y, 0, h)] :
                       [new TSRect(x, y, amount, h), new TSRect(x+amount, y, w-amount, h)] ; 
            case TSRectEdge.TSMinYEdge:
                return amount > h ?
                       [new TSRect(x,y,w,h), new TSRect(x, this.maxY, w, 0)] :
                       [new TSRect(x, y, w, amount), new TSRect(x, y+amount, w, h-amount)] ;
            case TSRectEdge.TSMaxXEdge:
                return amount > w ?
                       [new TSRect(x,y,w,h), new TSRect(x, y, 0, h)] :
                       [new TSRect(this.maxX-amount, y, amount, h), new TSRect(x, y, w-amount, h)] ;
            case TSRectEdge.TSMaxYEdge:
                return amount > h ?
                       [new TSRect(x,y,w,h), new TSRect(x, y, w, 0)] :
                       [new TSRect(x, this.maxY-amount, w, amount), new TSRect(x, y, w, h - amount)] ;
            default:
                // we should never be here, but ...
                TSError.throw('TSRect.divide() : bad edge parameter', { amount:amount, edge:edge}) ;
        }
    }
    divideRect = this.divide ;

    public clone():TSRect
    { return new TSRect(this.minX, this.minY, this.width, this.height) ; }
   
    // this method returns 5 points
    public closedPolygon(updatesYCoordinatesfirst:boolean = false):TSPoint[] {
        const x1 = this.minX, y1 = this.minY, x2 = this.maxX, y2 = this.maxY ;
        return updatesYCoordinatesfirst ?
            [{x:x1,y:y1}, {x:x1, y:y2}, {x:x2, y:y2}, {x:x2, y:y1}, {x:x1, y:y1}] :
            [{x:x1,y:y1}, {x:x2, y:y1}, {x:x2, y:y2}, {x:x1, y:y2}, {x:x1, y:y1}] ;
    }
    // ============ TSObject conformance =============== 

    public isEqual(other:any) : boolean 
    { return this === other || (other instanceof TSRect && other.minX === this.minX && other.maxX === this.maxX && other.minY === this.minY && other.maxY === this.maxY) ; }

    public compare(other:any):Comparison {
        if (other === this) { return Same ; }
        if (!(other instanceof TSRect)) { return undefined ; }

        const area = this.width * this.height ;
        const otherArea = other.width * other.height ;

        if (area === otherArea) {
            const aX = this.minX ; const aY = this.minY ;
            const bX = other.minX ; const bY = other.minY ;
            if (aX === bX) { return aY < bY ? Ascending : (aY > bY ? Descending : Same) ; }
            if (aY === other.y) { return aX < bX ? Ascending : Descending ; }
            if (aX < bX && aY < bY) { return Ascending ; }
            if (aX > bX && aY > bY) { return Descending ; }
            return undefined ; // same area but origins are not comparable
        }
        return area < otherArea ? Ascending : Descending ;
    }
    
    public toJSON():TSFrame { return this.frame ; } 
    
    public toString(): string { 
        return `{ x = ${this.minX}, y = ${this.minY}), w:${this.width}, h:${this.height} }` ; 
    }

    // warning : dont use generated array to create new Rect because we did send the oposite points here
    // QUESTION: should we return [x,y,w,h] here ? 
    public toArray(): number[] { return [this.minX, this.minY, this.maxX, this.maxY] ; }

    // ============ TSLeafInspect conformance =============== 
    leafInspect = this.toString ;

    // @ts-ignore
    [customInspectSymbol](depth:number, inspectOptions:any, inspect:any) {
        return this.leafInspect()
    }
    
    // ============ private methods ===============
    _setInternalValues(message:string, x:any, y:any, w:any, h:any, _moreTest:boolean = true) {
        if (!!_moreTest && $isnumber(x) && $isnumber(y) && $isnumber(w) && $isnumber(h) && w >= 0 && h >= 0) {
            this.x = x ; this.y = y ;
            this.w = w ; this.h = h ;    
        }
        else {
            TSError.throw(`TSRect.constructor() : ${message}`, { x:x, y:y, w:w, h:h}) ;
        }

    }
}


export function TSmm2Pixels(mm:number):number { return mm * 45 / 16 ; }
export function TScm2Pixels(cm:number):number { return cm * 225 / 8 ; }

export function TSPixels2cm(pixels:number):number { return pixels * 8 / 225 ; }
export function TSPixels2mm(pixels:number):number { return pixels * 16 / 45 ; }

export function TSInches2Pixels(inches:number):number { return inches * 72 ; }
export function TSPixels2Inches(pixels:number):number { return pixels / 72 ; }

export function TSEqualPoints(A:TSPoint, B:TSPoint):boolean { return A.x === B.x && A.y === B.y ; }

export function TSEqualSizes(A:TSSize, B:TSSize):boolean { return A.w === B.w && A.h === B.h ; }
export function TSArea(A:TSSize):number { return A.w * A.h ; }
export function TSValidSize(A:Nullable<TSSize>):boolean { return $ok(A) && A!.w >=0 && A!.h >= 0 ; }
export function TSCompareSizes(A:TSSize, B:TSSize):Comparison { return $numcompare(TSArea(A), TSArea(B)) ; }

export interface TSAssertFormatOptions {
    defaultSize?:TSSize,
    minimalSize?:TSSize,
    maximalSize?:TSSize,
    invalidSizeRaise?:boolean,
    undersizeRaise?:boolean,
    oversizeRaise?:boolean
} ;

export function TSAssertFormat(format:Nullable<TSDocumentFormat|TSSize>, opts:TSAssertFormatOptions={}):TSSize 
{
    const size:Nullable<TSSize> = $isstring(format) ? TSDocumentFormats[format as TSDocumentFormat] : format as Nullable<TSSize> ;
    
    const defaultSize = TSValidSize(opts.defaultSize) ? opts.defaultSize! : TSDocumentFormats.a4 ;
    if (!TSValidSize(size)) { 
        if (opts.invalidSizeRaise) { 
            TSError.throw('TSAssertFormat() : invalid size format', { size:size }) ;
        } 
        return defaultSize ; 
    }

    const min = TSValidSize(opts.minimalSize) ? opts.minimalSize! : TSDocumentFormats.min ;
    if (size!.w < min.w || size!.h < min.h) { 
        if (opts.oversizeRaise) { 
            TSError.throw('TSAssertFormat() : size format too small', { size:size, minimalSize:min }) ;
        } 
        return min ;
    }

    const max = TSValidSize(opts.maximalSize) ? opts.maximalSize! : TSDocumentFormats.max ;
    if (size!.w > max.w || size!.h > max.h) {
        if (opts.oversizeRaise) { 
            TSError.throw('TSAssertFormat() : size format too large', { size:size, maximalSize:max }) ;
        } 
        return max ; 
    }

    return size!
}

export const TSCM = TScm2Pixels(1) ;
export const TSMM = TSmm2Pixels(1) ;
export const TSIN = TSInches2Pixels(1) ;

const LocalPointProperties = ['x', 'y'] ;
export function $comformsToPoint(v:any):boolean
{ return v instanceof TSRect || $hasproperties(v, LocalPointProperties) ; }

const LocalSizeProperties = ['w', 'h'] ;
export function $conformsToSize(v:any):boolean
{ return v instanceof TSRect || $hasproperties(v, LocalSizeProperties) ; }

export function $conformsToFrame(v:any):boolean
{ return $comformsToPoint(v) && $conformsToSize(v) ; }
