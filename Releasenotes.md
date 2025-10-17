# Foundation-ts release notes

Prior to version 1.6, foundation-ts release notes where included in commit contents. For better assessement of what was changed, from now on, we will maintain this release notes file.

## version 1.7.1

#### Corrections

- corrected  npm js restrictions in package.json

<hr/>

## version 1.7.0 (major version)

#### What's new ?

- define library to use NodeJS v24 and Typescript v5.9.3
- review compiler options to create JS files in 'node20' module format with es2024 types library
- rename the String, Uint8Array and ArrayBuffer names of methods 'toBase64' and 'toBase64URL' to 'base64String' and 'base64URL'
- change the 'req' and 'request' method signatures of TSRequest (body is now Nullable<BodyInit|TSData|number|boolean|object>)
- improve the tests performed on the TSRequest body

<hr/>

## version 1.6.5

#### Bug corrections

- issue #1 was corrected : you can now add a StringEncoding or a TSCharset to the String.toBase64() and String.toBase64URL() method in order to change the current charset which is Binary. Tests were added to check standard UTF8 string encoded in base 64.
- debugged version of encodebase64URL, decodeBase64 and decodeBase64URL (managing missing '=' at the end of base 64 string and not adding '=' in encodeBase64URL)

#### What's new ?

- new scripts for building, testing, packing and publishing the framework on MacOSX using HomeBrew and nvm in order to build and test on our chosen node LTS version 22.15.0.

<hr/>

## version 1.6.4

#### What's new ?

- new function  $generateMultiPartBodyString() mainly for Node.js usages.

#### Bug corrections

- there was some times a crash when a request did have a `/`at the end.

<hr/>

## version 1.6.3

#### Bug corrections

- since `navigator`is defined in Node.js 22.x.x, we did have to update our test in order to known if we are inside a navigator or running as Node.js script.

<hr/>

## version 1.6.2

#### What's new ?

- new method  `addPaths()` (or `addPath()`) usable on strings.

- new method `extension()` (or `ext()`  usable on strings)

- new methods `directory()`, `filename()` and `safeFilename()`  usable on strings

- new method `hasExtension()` (which is case insensitive) usable on strings

- new method `newExtension()` usable on strings

- new method `isAbsolutePath()` usable on strings

- new method `normalizePath()` usable on strings

  All these methods are usable in node.js and in a web browser.. Tests add been added accordingly.

<hr/>

## version 1.6.1

#### What's new ?

- `TSCountry` now manages a standard `numericCode` wich will be returned with `valueOf()` method
- `TSCountry` now implements `[Symbol.toPrimitive]` method
- `TSColor` now implements `valueOf()` and `[Symbol.toPrimitive]` methods
- `TSURL` now implements `[Symbol.toPrimitive]` method
- `TSDate` now implements `valueOf()` and `[Symbol.toPrimitive]` methods
- `TSData` now implements `[Symbol.toPrimitive]` and `toBase64URL()` method
- `String`, `Uint8Array` and `ArrayBuffer` now implements `toBase64URL()` method
- `String` now implements methods `decodeBase64()` and `decodeBase64URL()`
- new function `$browserOS()` wich returns a TSBrowserOS enumeration element

#### What's updated ?

-  `$inbrowser()` function now use `$browserOS()` function for its implementation
-  `$ascii()` function now makes better transformation
-  `TSEndPoint` interface does now contains a context `TSDictionary` which can be used in `TSEndPointController` which now includes a 3rd optional parameter wich is this `TSDictionary`. This new parameter may be used to keep infos through all script's life
-  numeric operations on Arrays now use `valueOf()` and `[Symbol.toPrimitive]` methods 
-  tests were updated in order to reflect all modifications

#### Bug corrections

- `TSServerResponse` `returnData(...)` methods does take into account all types of buffers

<hr/>

## version 1.6.0

#### What's new ?

- foundation-ts needs now **Node.js 20.0.0** to run. a new `engines` section in `package.json` and a new `.npmrc` file are here to enforce this.

- new `$randomBytes()` function in for generating random bytes arrays

- new `$arrayBufferFromBlob()`,  `$bufferFromBlob()`, `$uint8ArrayFromBlob()`, `$blobFromBytes()` and  `$blobFromDataLike()` functions to convert data from and to blobs.

- new `$encodeHewa()` and `$encodeBytesToHexa()` functions

- new `toHexa()` method on `Uint8Array`, `ArrayBuffer` and `TSData` instances

- new `$asciifs()` function which concerts any string to ASCII and replaces non recognized ASCII characters in file systems by `'_'`.

- new `asciifs` method on String objects.

- new `$safeFilename()` function which converts any filename in a safe filename using `$asciifs()`

- new `$timezoneOffsetWithComponents()` function which calculate any time zone offset from specific date, time and timezone name

- `TSDate` has a new `toTimezoneString()` and `toUTCDate()` methods

- `TSPhoneNumber` class now provides new static method `exampleNumber()` for generating, if possible dummy phone numbers.

- `TSPhoneNumber` class now provides new instance methods

  - `toJSON()` => a valid phone's string representation for JSON

  - `compactNumber()` => something like +33145247000

  - `alpha2Code()` => phone's country alpha2 code

  - `alpha3Code()` => phone's country alpha3 code

  - `toString()` => which provides a way to format your phone number as you wish with the following format tags :

    ```typescript
    /*
      if format undefined => returns standard non compact string
      if format null or empty uses standard country format
    
      Format composition
      ---------------------
      %c      country label
      %C      country localized name
      %d      dialcode
      %t      trunkCode
      %n      phone number without the trunk code if present
      %N      phone number including potential trunk code
      %0      this stops the rest of the format if no more number digit remains
      %1      next digit of phone number
      %2      next 2 digits of phone number
      %3      next 3 digits of phone number
      %4 %5 %6 %7 %8 %9
      %9      next 9 digits of phone number
      %r      all remaining digits of phone number  
      %x      country alpha2 code
      %X      country alpha3 code   
      %%      a percent
    */
    
    ```

- `TSUnaryTest` class has now a boolean `logAllTests` you can activate to show all expected tests to log PASS and FAIL

#### What's updated ?

-  `$length()` function now works with Blob

- `$ascii()` function does now a better job in converting Unicode strings to ASCII (for example it removes all characters considered as modifiers) and is now restricted in convertinf UTF16 characters (all character after 0xFFFF are dropped)

- `TSCountry` class now accepts in its countries.json definition file standard phone formats and dummies phone range templates. Accordingly `PhonePlanInfo` interface now contains `format` and `dummies` new fields

- `TSDate` max time stamp is now `31/12/275760 23:59:59` 

- `TSCouple`, `TSData` and `TSList` have now a standard `Symbol.iterator` method.

- `$components2date()` function has now 2 optional parameters in order to pass `milliseconds` and if you want a current `Date` or an `UTC` `Date`

- `TSRequest` class now use internal Node `fetch()` function to send HTTP requests. In short: we drop the use of Axios module.

- interface `TSServerOptions` has now a `logLevel` field use to choose what to log. The log level is defined by the explicit new enum:

  ```typescript
  export enum TSServerLogLevel {
      None = 0,
      Errors = 1,
      Warnings = 2,
      Infos = 3,
      Developer = 4
  }
  ```

#### Bug corrections

- static methods `TSError` `throw()` and `assert()` were corrected. Wrong argumend where passed to constructors
- function `$subclassReponsabililty()` now returns `never` in spite of `any`
- Bug correction in `TSTester` final tests logging

#### Work in progress (stay tuned for for future versions)

-  `Locales` interface now have a `ordinals` array wich will in the future be used by `%E` date format and will output 1st, 2nd, 3e … 

<hr />

