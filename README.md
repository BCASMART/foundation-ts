# Foundation-ts

Foundation-ts is a small library meant to be the core of all Business Card Associates Typescript projects. It was designed to have minimal dependencies and maximal functionalities. For now the only dependency is Axios module and it will be removed in the foreseeable future.

Foundation-ts is a collection of functions and classes aiming at facilitating developing web apps in Typescript, both on server or client side. It defines some types and functions for manipulating, checking and converting some basic data like integers, language, countries, emails, addresses, URLs, geometric points, etc.

Each function in TSFoundation begins with a $ character, facilitating their recognition. Every function specifically manipulating basic date like number, string or array is doubled by corresponding added methods to Number, String and Array JavaScript standard classes. For example, there is a `$capitalize(s:string):string `function which is directly available through a`capitalize():string` method added on String class.

Finally, it also provides functions to:

- compare and equal things (functions like `$equal()` and `$compare()`)
- manipulate paths (even inside browsers) and files. Paths functions have specific implementations
  for running in browsers and on unix systems. On Windows, Node.js implementation is always used.
- some light crypto methods (only for non-really robust usage)
- logging things on terminal with full rich-text capabilities using function `$logterm()` with '&' escape char (e.g. `"&R&w DONE &0"` means you will write DONE in white on a red background (&0 if for reseting the colors as normal)
- logging within a specific div (identified by its `'ftsconsole'` id) in your navigator with the same function
- inspecting objects the same way in node.js as in navigators (`$inspect()` function)

Foundation-ts also define several classes to deal with common data :

* `TSCouple` : a simple class to manipulate couple patterns
* `TSRange` : a class to manage integer ranges (location + length)
* `TSDate` : a without time zone date class facilitating the exchange, manipulation and storage of dates
* `TSInterval` : an open interval of TSDates
* `TSColor` : to manage colors in RGB, GrayScale and CMYK color space
* `TSList` : a classic double-linked list class
* `TSRangeSet` : a class managing a set of ranges providing inclusion, intersection, union and complementary methods
* `TSData`: a really mutable buffer-like class
* `TSDataCursor`: a subclass of TSData made for writing and reading things like numbers into or from a buffer
* `TSRect` : a class managing rectangles with division, unions, inclusion and intersection methods
* `TSUniqueError` / `TSError` / `TSHTTPError` : simple Error subclasses managing singleton errors, errors with info and errors with HTTP status
* `TSRequest`: a generic class to be subclassed to easily write API client classes (internally using Axios)
* `TSServer` : a simple HTTP(/S) class server working as a singleton, very easy to set up and work with for your tests without any other dependency
* `TSQualifier` : a full object-oriented generic SQL-like qualifier constructor with strong typing you may want to use for 1) filter an array 2) subclassing to output specific SQL or ORM requests 3) use complex intersection / inclusion patterns
* `TSTester`: a class allowing you to simply write your own tests (just as we did for foundation-ts) in a simple manner with async functions in the same environment your code will be used.
* `TSDefaults` : a singleton class made to hold standard and your defaults in your app
* `TSCountry` : a multi-singleton class holding info like spoken languages, locales, dialCode, used currency, ... on a listed bunch of European countries

Foundation-ts is a full-Typescript project, coming with its own unary tests (`npm run test`). It can be uses as any npm module and is full open source with an MIT license.

Foundation-ts is a work in progress used in our own project. We provide it as it is, with no guarantee and we want you to be aware that regularly, we change things in it which can break your inclusions. Don't panic, nothing may be lost : we only add new functions or methods or change algorithms or source code files organization like we did in version 1.3.

Enjoy.
