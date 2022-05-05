# Foundation-ts

Foundation-ts is a small library meant to be the core of all of all Business Card Associates Typescript projects. 

It basically covers 3 sets of functionalities :

- several new management types including opaque types for numbers, emails, url… (foundation-ts/types)
- access, check, format, transformation and conversion functions to manipulate basic variables and data (foundation-ts/commons) ;
- comparison and equal functions (foundation-ts/compare)
- file system restricted and synchronized functions (foundation-ts/fs)
- crypto functions (foundation-ts/crypto)
- defaults management throught TSDefault class singleton (foundation-ts/defaults). Manages countries, languages and localization. Use it via TSDefaults.defaults() or provided shortcut functions.
- generic root classe and protocol (foundation-ts/object)
- double chained list class TSList (foundation/list)
- couple of same kind of data class TSCouple (foundation/couple)
- date without timezone management class TSDate (foundation-ts/date) and its associated strucutres (foundation-ts/datecomp)
- interval of dates class TSInterval (foundation/interval)
- integer ranges and rangesets management classes TSRange and TSRangeSet providing intersection, union, complement… methods (foundation-ts/range & foundation-ts/rangeset)
- color management class TSColor (foundation-ts/color)
- a singleton unique errors class (foundation/errors) to facilitate errors management
- TSRequest which is meant to be subclassed in order to write API client classes (foundation/request)
— TSTester which is a simple class to enforce unary and functional tests

Foundation-ts comes whith unary tests written using jest. 

This is open source stuff, so just enjoy
