# Foundation-ts release notes

Prior to version 1.6, foundation-ts release notes where included in commit contents. For better assessement of what was changed, from now on, we will maintain this release notes file.

## version 1.8.13

#### Breaking changes

- The conversions and the functions which take bytes (`$bufferFromBytes()`, `$uint8ArrayFromDataLike()`, `$encodeBase64()`, `$encodeHexa()`, `$dataXOR()`, `new TSData()`, `appendBytes()`, the `TSCharset` decoding methods, `$hash()`, `$encrypt()`...) now throw a `TSError` when a plain array contains something else than integers from 0 to 255. These values used to be silently truncated (eg. `258` became `2`).
- `TSURL.compose(origin, path)` refuses a path which is an absolute URL or starts with `//`, and an origin with a query string or a fragment: they used to give absurd URLs (eg. `http://localhost/https://host/x`). `compose()` now returns `null`in that case. Be aware that `TSRequest.req()` and `request()` throw a `TSError` when `TSURL.compose()` returns `null`.

#### Corrections

- `TSData.compareToData()` and `isEqualToData()` said that an array with values greater than 255 (or negative, decimal values, strings) was equal to the data: fixed. Same correction for `$bytesequal()`, `$bytescompare()` and the `TSData` searches (`includes()`, `indexOf()`...).
- `$compare()` threw a `TypeError` when its first argument was a `Buffer` and the second one a `TSData` (or any other non binary object): binary data and a `TSData` are now compared in both orders, and binary data and other values are not comparable (`undefined`).
- `$encodeHexa(source, true)` ignored the lower case for a `TSData` or an `ArrayBuffer`.
- In the browsers, `TSData.includes()`, `indexOf()` and `lastIndexOf()` with an `Uint8Array`, `TSData.copy()` into an `Uint8Array` and `TSData.uint8ArraySlice()` threw a `TypeError`: the `Buffer` of the browser bundles only accepts a `Buffer` there.

#### What's new ?

- `TSData.isEqual()` and `TSData.compare()` accept an `uint8[]`.
- `$equal()` and `$compare()` are now symmetric between an array and an object which compares itself with arrays (eg. `$equal([1, 2], data)` is `$equal(data, [1, 2])`).
- `TSRequest.req()` and `request()` can now directly use an absolute URL (like `fetch()` does). In that case, `TSRequest`'s `origin` is not used.
- A new type `EncodingOrCharset` replaces definitions like `StringEncoding | TSCharset`.
- Type `LocalInfo` does not includes `undefined` or `null` anymore.
- Some useless exports where removed from typescript `*.d.ts` files.

<hr/>

## version 1.8.12

#### Breaking changes

- **The parsing of JSON and of external data is secured against the injection of unwanted code**: 
    the `__proto__`, `constructor` and `prototype` keys are now ignored everywhere external data is read (`$jsonparse()`, `TSParser`, `$loadJSON()`, `TSRequest`, `TSServer`, `$env()`, `$fusion()`, `$partial()`...), and they cannot be read in a fusion template (using new function `$issafekey(key)`). 
    Legitimate data using these keys lose them.
- functions `$fusion()` and `$partial()` now throw an error when an argument is not an object (string, number, array, `Date`, `Map`...) and `$fusion()` like `$partial()` now returns the number of properties of the result.
- Fusion templates:
    - an empty array, `Set`, `Map` or collection is now considered as false in the tests (`{{v?:…}}`, `{{v!:…}}`);
    - a `Date` object used as it is (without formatting) is now written in ISO 8601 + the server's offset 
      (eg. `2024-05-01T12:20:00+02:00`);
    - a `TSDataTemplate` now fails on a character which its charset cannot handle;
    - a malformed number parameter is an error.
- `TSServer` log levels were shifted: before `Errors` logged nothing, `Warnings` only the errors and `Infos` no information. Each level now logs what its name says, so the default level (`Warnings`) now logs the error responses (eg. the 404).

#### Corrections

- Fusion templates: 
  - the global functions no longer pollute the caller's context, 
  - the HTML templates write the values in the charset of the document, 
  - the `\u` surrogate pairs give one character, 
  - `capacity` is set instead of added, 
  - a nested fusion no longer replaces the current output, 
  - an unknown member of a primitive value is reported, 
  - a `null` or `undefined` method parameter was wrongly removed, shifting the next ones: fixed, 
  - an HTML template ending inside an unclosed element got an extra `<` and `>` to avoid an error.
- `$fusion()` with `fusionObjects` no longer wrongly changes `Date` objects and class instances into `{}`.
- `TSCharset`: `base64url` failed in browsers, 
- Loaded charsets gave a 0 byte for some characters they cannot write: fixed.
- Dates: 
  - the `Computer` format wrongly wrote the day with 4 digits: fixed, 
  - dates with a time written by `$components2string()` could not be read again: fixed.
- `$browserOS()` gave `macOS` for an unrecognized operating system: fixed. 
- `$inspect()` of a CMYK `TSColor` did had a stray comma: fixed, 
- `TSRect.toString()` was malformed. Fixed.
- `TSServer` static websites: a missing file stayed refused until the server stopped, even once created. It is now looked for again after `blacklistDuration` seconds (new website option, 60 by default). When the files cache is full, the least recently used file is now evicted (new files used to be no longer cached).

#### What's new ?

- `TSColor.fromString()` now accepts the `#rgba` form (eg. `#a1c8` for `#aa11cc88`).
- `TSCharset` strict conversions, which refuse what the other conversions silently drop or change: `canEncode()`, `unencodableIndex()`, `strictStringToBytes()`, `canDecode()`, `undecodableIndex()`, `strictStringFromBytes()` and `strictStringFromData()`.
- `TSServer`: the number of kept CORS preflight responses is now limited (new option `maxPreflightResponses`, 10000 by default).
- New class `TSCache`, a cache whose keys can be any value, with:
  - an expiration given as a ttl (absolute or sliding), an end of life (`Date`, `TSDate` or TSDate timestamp) or computed from the value (`ttlOf()` option);
  - a maximum count and/or size, with `lru` (Least Recently Used), `fifo` (First In First Out) or `lfu` (Least Frequently Used) eviction mechanism ;
  - `getOrSet()`, which computes a missing value only once, optionally giving the expired value while computing the new one (`staleWhileRevalidate`);
  - statistics and an `onEvict()` callback.

- function `$cache(name)` gives named caches shared by the application, 
- function `$memoize(fn)` caches the results of a function.

<hr/>

## version 1.8.11

This version corrects bugs found in `TSRequest` and `TSParser`.

#### Corrections

- `TSRequest.req()` with `RespType.Json` threw a `SyntaxError` on a response which is not JSON (eg. an HTML error page), so that its HTTP status was lost. It now returns the status with a `null` response (an empty response also gives a `null` response).
- The `acceptsUncheckedItems` option of `TSParser.validate()`, `interpret()` and `encode()` was ignored: only the `_acceptsUncheckedItems` field of each object node was used. The option now accepts the non described items of all the objects.
- `TSParser` error messages always name the root value `value`: the errors found in the items of the root object, dictionary or array used to name it `object`, `dict` or `array` (eg. `object.a is not a valid int.` is now `value.a is not a valid int.`, like `value.b is unknown.` or `value.c is mandatory.`).
- `TSParser` integer types (`int`, `int8`... `uint32`, `unsigned`): a string is now converted like it is validated, with `Number()`. Valid integer strings like `'0x10'`, `'1e3'` or `'0b11'` used to be converted to `0`, `1` and `0` instead of `16`, `1000` and `3`. As before, an empty string gives `0`.
- `TSParser` leaf nodes: an absent optional value without default value is valid. It is no longer tested against the enumeration (`{ a:{ _type:'string', _enum:['x', 'y'] } }` refused `{ a:null }`) and no longer given to the specific checker (which could throw on `null` or `undefined`).
- `TSParser` leaf nodes: the specific checker now receives the node `_options`, like the other node functions (`_transformer`, `_natifier`...). It only received the call options.
- `TSParser` enumerations defined with a dictionary: only the own keys of the dictionary are tags (a value like `'toString'` or `'__proto__'` was looked for in `Object.prototype`, giving a wrong error message).
- `TSParser` `jsdate` type: a string is still read with `Date.parse()`, but it must contain a year, a month and a day which exist. Without any timezone indication, the date is now a UTC date (`Date.parse()` used UTC for `2024-05-01`, but local time for `2024-05-01T10:20` or `May 1, 2024`). An invalid `Date` object is refused. The forms which are not ISO 8601 still depend on the JavaScript engine.
- `TSTester`: an exception thrown by a unary test without `catchFunction` (or by its `catchFunction`) was thrown again, which stopped the whole run without any report. It is now a failed expectation, logged with the first lines of its stack, and the run goes on (`stopOnFirstFail` still stops it). In the same way, an exception thrown by a group function is a failure of the group: the unary tests declared before it are run, and so are the other groups. As before, a `catchFunction` can manage the exceptions of its unary test.
- `$args()`: the errors found by the parser on the whole set of arguments, like a missing mandatory argument, were lost (`$args()` returned `null` without any error message). They are now reported (eg. `Argument '-count' is mandatory.`).

#### What's new ?

- `TSRequest` option `keepsTrailingSlash` (also a `keepsTrailingSlash` property). By default (`false`), `req()` still removes the final `/` of the request URLs, as before. Some servers give different answers for `/path` and `/path/` (eg. an HTML page instead of JSON), so with `keepsTrailingSlash:true` the URL path is the one given by the caller: a final `/` is kept if it ends the relative URL, or the base URL when the relative URL is empty (only the `/` added to an empty relative URL is removed). The default value will become `true` in the next major version.
- `TSParser` dictionary nodes option `_normalizesKeys` (`false` by default, which keeps the keys as they are given). With `_normalizesKeys:true`, the keys of the interpreted or encoded dictionary are given in their interpreted form, like the values: eg. `'02'` gives `'2'` for `int` keys, `'fr'` and `'FRA'` give `'FR'` for `country` keys, `' Bob@Example.COM '` gives `'bob@example.com'` for `email` keys. Two keys with the same interpreted form (eg. `'02'` and `'2'`) are then refused by the validation (`value.2 is present several times.`). This option cannot be set on an object node.

<hr/>

## version 1.8.10

This version removes ends the SonarQube analysis with new bug corrections and algorithms improvements.

**<u>Warning</u>**: foundation-ts now requires Node.js 24.22.1 or later (`engines` in `package.json`), because of the security flaws of all previous versions.

#### Corrections

- `TSList`: `toArray()`, `forEach()`, `search()`, `searchNode()` and `toString()` (and therefore `getItems()`, `toJSON()`, `JSON.stringify()`, and the `TSRangeSet` methods using them) were recursive and overflowed the stack on long lists (from about 8000 nodes). They now use loops.
- `$setequal()` (and therefore `$unorderedEqual()`) used `Set.prototype.toArray()`, which is only defined when `mapset.ts` is loaded: it threw a `TypeError` when only `compare.ts` was imported.
- `$unorderedEqual()` now checks that each element is present the same number of times: the duplicates used to be ignored (`[1, 1, 2]` and `[1, 2, 2]` were equal). As before, the elements are compared like `Set.has()` does (objects by reference).

#### What's new ?

- The options interfaces are renamed with a `TS` prefix: `TSMapOptions`, `TSAverageOptions`, `TSNormSpacesOptions`, `TSStringOptions`, `TSPartialOptions`, `TSObjectFusionOptions` (was `$fusionOptions`), `TSEncryptOptions`, `TSDecryptOptions`, `TSHashOptions`, `TSPasswordOptions`, `TSUnitOptions`, `TSWriteStringOptions`, `TSWriteBufferOptions`, `TSStringWithOffsetOptions` (was `$c2StrWOffsetOpts`), `TSDurationDescriptionOptions`, `TSEnvOptions` and `TSParsedEnvOptions`. The former `$...Options` names are still available as deprecated type aliases.
- `$visualsort(values)` returns a new array with the given values sorted like `[...values].sort($visualorder)`, about 10 times faster since the visual key of each value is computed once instead of twice by comparison. As with `Array.sort()`, `undefined` values are put at the end. The new `Array` methods `visualSort()` and `toVisualSorted()` follow the standard `sort()` and `toSorted()` conventions: `arr.visualSort()` sorts the array in place and returns it (like `arr.sort($visualorder)`), `arr.toVisualSorted()` returns a sorted copy (like `arr.toSorted($visualorder)`).
- The new `Array` method `toShuffled(max?)` returns a new array with the elements in a random order, like `$shuffle()`.
- `$visualkey(v)` returns the key compared by `$visualequal()`: two non null values are visually equal if and only if their visual keys are equal.
- `TSRangeSet`: `union()`, `substraction()` and `contains()` with a `TSRangeSet` argument, and the constructor with an array of ranges, now work in one pass on the sorted ranges: `substraction()` is about 300 times faster, `union()`, `contains()` and the constructor 15 to 25 times faster. The methods modifying the set itself (`unionWidth()`, `substractFrom()`) are unchanged.
- `$map()`: the `TSUnicity.Visual` unicity now uses a `Set` of visual keys, and the `TSUnicity.Equality` unicity a `Set` of the primitive values (strings, numbers, booleans, bigints), instead of comparing each value to all the kept ones. The result is several hundred times faster. The objects are still compared one by one with `$equal()`.
- `TSQualifier.LIKE()`: the regular expression is built once per qualifier instead of once per tested value.
- `TSQualifier.IN()` and `TSQualifier.NIN()` with `filterValues()` (and `filterWithQualifier()`): during each call, the primitive values (strings, numbers, booleans, bigints) of the IN and NIN qualifiers are put in a `Set` instead of being compared one by one to each tested value (more than several hundred times faster. The other values are still compared with `$equal()`, `validateValue()` is unchanged and the `validateValue()` method of a subclass is always called.
- `$random()` (and therefore `$shuffle()`): is way faster. When the random bytes come from node crypto or `globalThis.crypto`, they are taken from a 4096 bytes pool (as node `crypto.randomInt()` does) instead of asking 7 bytes for each draw. With a provider set by `$setCryptoProvider()`, the bytes are asked as before.
- `TSList` (and `TSRangeSet`) iteration: the generator is replaced by an iterator object which behaves the same way. It inherits the global `Iterator` class when it exists, so that the iterator helpers (`map()`, `filter()`, `take()`, `toArray()`...) are still available. The result is 1.5 to 3 times faster, except on very short lists.
- **<u>Deprecated</u>**: 
  - the `Array` method `shuffle()` (use `toShuffled()`, which follows the standard naming scheme for this kind of methods. 
  - former options type names `$mapOptions`, `$averageOptions`, `$normspacesOptions`, `$stringOptions`, `$partialOptions`, `$fusionOptions`, `$encryptOptions`, `$decryptOptions`, `$hashOptions`, `$passwordOptions`, `$unitOptions`, `$writeStringOptions`, `$writeBufferOptions`, `$c2StrWOffsetOpts`, `$durationDescriptionOptions`, `$envOptions` and `$parsedEnvOptions` (use the `TS...Options` interfaces above).

<hr/>

## version 1.8.9

This version does not trigger any SonarQube warnings or errors from SonarQube for IDE VSCode extension. Il also remove the `tools` directory and all its configuration files.

#### Breaking changes

- `$octets()` function and `Number.octets()` instance method were deprecated a long time ago: they are now removed from foundation-ts. Use `$bytes()` and `Number.bytes()` instead. In fusion templates, the `$octets()` standard global function is replaced by `$bytes()`.
- `TSTracer` no longer has writable static fields:
  - `TSTracer.log = fn` and `TSTracer.write = fn` are replaced by `TSTracer.setDefaults({ log:fn, write:fn })`, and restoring the original outputs by `TSTracer.resetDefaults()`. The current outputs are given by `TSTracer.defaultLog` and `TSTracer.defaultWrite`.
  - `TSTracer.index` is now read only. Use `TSTracer.resetIndex()` to restart the trace numbering.
- `TSParser` default values (`_default`) are now checked and interpreted like given values:
  - a definition whose default value is not in its enumeration (`_enum`) is now refused, like a default value of a wrong type already was,
  - the default value of an absent object item is now interpreted (eg. `{ _type:'uint8', _default:'12' }` gives `12` instead of `'12'`) and its specific checker (`_checker`) is applied, so the interpretation now fails if the default value does not pass it.
- `TSInterval` is now aligned with `TSRange` (half-open intervals `[start, end[`, a null bound meaning infinite):
  - like `new TSRange(startDate, endDate)`, `new TSInterval(start, end)` and `TSInterval.make(start, end)` now throw if the end date is anterior to the start date. Such an inverted interval used to be silently handled as `[start, +∞[`. An interval inverted afterwards (by changing `first` or `second`) is invalid: it contains nothing, intersects nothing and is continuous with nothing (`containsDate()`, `contains()`, `intersects()` and `continuousWith()` return false).
  - `isValid` is now true for `]-∞, end[` and `]-∞, +∞[` intervals (it used to be true only with a start date), and false for an inverted interval.
- `TSRange.intersectionRange()` of two disjoint ranges now returns a bad range (`isValid` is false, `isEmpty` is still true, `location` is `NaN`). It used to return the valid empty range `[0,0[`, as if the ranges met at location 0. Touching ranges still give an empty range at their common location (`[0,5[ ∩ [5,10[` is `[5,5[`).
- `TSRangeSet` methods no longer throw for an empty or invalid range, an empty range set or a non-integer number. They now answer like `TSRange` (an empty range is a location, an invalid range or an empty set has no location); only an argument of a wrong type still throws:
  - `contains()` is true for an empty range whose location is in the set, `intersects()` is false for an empty or invalid range and for an empty set, and a number is a location (`contains(1.5)` used to throw).
  - `unionWidth()` and `substractFrom()` with an empty or invalid range or an empty set change nothing, and `intersectWidth()` empties the set.

#### Corrections

- **Security** — `$email()` and `$isemail()` (and therefore `String.isEmail()`, the `email` type of `TSParser` and the email validation of `TSServer` endpoints): the regular expression had a quadratic backtracking on some invalid inputs (eg. `'a@' + '1.'.repeat(20000) + '!'` took 1.3 s, and 4 times more each time the length doubled), so that one request could block the server. An email is now split on its last `@` and its local part and domain are checked by two linear regular expressions, and an email longer than 254 characters (RFC 5321, new `EMAIL_MAX_LENGTH` constant) is now refused. The same input is now refused in less than 0.1 ms. Some malformed domains, which were accepted by mistake, are now refused:
  - a domain whose last label is a single digit (eg. `abc@b.1`, `abc@b.cd.1`),
  - a domain ending with one or more dots after a numeric label (eg. `abc@b.12.`, `abc@b.1..`),
  - a domain starting with a dot or containing an empty label, when it ends with digits (eg. `abc@.1`, `abc@..1`),
  - a numeric domain which is not an IPv4 address made of 4 numbers of 1 to 3 digits (eg. `abc@1.2`, `abc@1.2.3`, `abc@1234.5`, `abc@1.2.3.4.`).
  IPv4 domains (eg. `a@192.168.0.1`) are still accepted, without checking that each number is at most 255, as before.
- `$durationNumber2StringFormat()` (and `$duration2String()`): a format ending with a `%` in the else part (`%b`) of a seconds part (`%{`) tested the days instead of the seconds to decide whether the `%` was written (eg. `"x%{%b%"` gave `"x%"` for a 1 second duration and `"x"` for a 1 day duration, instead of the opposite).
- `$parsedenv()`: two names of the parser definition which are the same once trimmed (eg. `' AA'` and `'AA'`) now throw a `found duplicate name definition` error, as expected. The second definition used to silently replace the first one.
- `TSQualifier.validateValue()`: the `validateValueForCondition` callback is now given to the qualifiers nested in an `AND`, `OR` or `NOT` qualifier. A nested composite qualifier with dictionary conditions (eg. `AND([OR([{ minAge:40 }])])`) used to throw `need a validateValueForCondition() callback`.
- `TSFusionTemplate.fromHTMLData()`: a `<fusion type="!TEST">` tag is now a negative test, like `type="!"`, `type="NOT"` or `type="IFNOT"`. It used to be a positive test.
- `$createDirectory(path, mode)` always failed (`Path exists and is a directory but mode does not match`) on an existing folder when a mode was given, even if the folder had this mode: the compared mode also held the file type bits.
- `TSServer` end points:
  - an empty request body is now an absent body: a missing mandatory body gives a `MissingBody` error (it used to give a `BadJSONBody` error), and an absent optional body is accepted (it used to give a `BadJSONBody` error too).
  - a `query`, `body` or `response` definition with an unknown root type (eg. `query:'notatype'`) is now refused when the end point is defined (it used to be accepted).
- `$password()` no longer modifies the given options object (`usesLowercase` used to be set to `true` in it when no character kind was asked), and the "too short" error message is now spelled correctly.
- `TSData.length = n` and `TSData.truncateBy(n)` error messages named `TSDate` instead of `TSData`.
- `TSData.length = n` did not change the length when growing a data created with the `fillWithZeros` option, and the added bytes are now always zeroed (with `fillWithZeros`, the bytes removed by a previous truncation used to come back).
- `TSParser`: an absent non mandatory array (`_mandatory:false`) with a minimal size (`_min`) is now valid, as documented: `_min` and `_max` only apply to a given array. It used to be refused (`value.size is too small (0 < 1).`). The specific checker (`_checker`) is no longer called for an absent array, like for objects and dictionaries.
- `TSRequest.req()`: a `GET` or `HEAD` request with a body now throws a `TSError` (`TSRequest.req(): a GET request cannot have a body`) before using the network, like the other parameter errors. It used to be the `TypeError` thrown by `fetch()`.
- `$charsetFromBytes()` (and therefore `TSCharset.charsetFromDataLike()` and `$charset(data)`):
  - with equal MacRoman and ANSI weights, the detection now gives latin1 (or ANSI if latin1 was eliminated), like when MacRoman is eliminated. It used to give null, so that `$charset(data)` decoded these non UTF-8 data as UTF-8 (eg. `[0xA1]` or `[0xA9, 0xB0]`).
  - a UTF-16 little endian BOM alone (2 bytes) is now detected, and a UTF-16 big endian BOM (`FE FF`) now gives the new UTF-16 big endian charset instead of a single byte charset.
- `TSCharset.encoding()` and `$charset(name)` now find the charsets which are not `Buffer` encodings by their names (eg. `'UTF-16BE'`). An unknown name still gives UTF-8.
- `TSQualifier.validateValue()`: like SQL `IS NULL` and `IS NOT NULL`, `EQ(key, null)` now matches an absent or null value and `NEQ(key, null)` a present one. `EQ(key, null)` used to match nothing, so the `canUnspecify` option of `INCLUDED()` and `INTERSECTS()` had no effect in memory (the qualifier structure, used to build database requests, is unchanged).
- `TSQualifier.INRANGE(key, range)` with a length 1 range used to give `EQ(key, location)`, which did not match a non-integer value: it now always gives `key >= start AND key < end`, like `TSRange.containsLocation()`. With an empty range it now matches nothing instead of throwing.
- Some `TSQualifier` error messages named another method (`INCLUDING()`, `prototype.addRange()`).
- `TSQualifier.validateValue()`: the error thrown for a dictionary condition without `validateValueForCondition()` callback now gives this condition in its `info.condition` (it used to be the absent callback).
- `TSRangeSet` stored the `TSRange` instances given to its constructor or to `unionWidth()`, and could then modify them (eg. `s.unionWidth(r) ; s.substractFrom([5, 10])` changed `r` from `[0,10[` to `[0,5[`). The given ranges are now copied.
- `TSRangeSet.intersection(rangeSet)` and `intersectWidth(rangeSet)` intersected the range set successively with each range of the given set, so the result was empty as soon as the given set had two ranges (`{[0,10[} ∩ {[1,2[, [5,6[}` gave `{}`). It is now the intersection with all the ranges of the given set.
- `TSRangeSet.intersects(rangeSet)` returned true only if all the ranges of the given set intersected the range set (`{[0,5[}.intersects({[2,3[, [10,11[})` returned false). It now returns true if one of them does.
- `TSRange.continuousWith()`, `TSInterval.continuousWith()` and `TSRangeSet.continuousWith()`: an empty range (or interval) strictly inside the other one is now continuous with it, as when it is at one of its bounds. It used to be not continuous, while their intersection was this empty range and their union had no gap.
- `TSRange.unionRange()`: the union of two empty ranges is now located like any other union (`[5,5[ ∪ [5,5[` is `[5,5[`, `[5,5[ ∪ [8,8[` is `[5,8[`). It used to be the empty range `[0,0[`, while an empty range already took part in a union with a non-empty one with its location.
- `TSInterval.contains(emptyInterval)` now returns true if the date of the empty interval is in the interval, like `TSRange.contains()`.
- `TSInterval.containsDate()` gave inverted results for an interval with only a start date (`[2021, +∞[` contained 2020 but not 2022). It now contains the dates greater than or equal to its start.
- `$args()` and `$parsedenv()`: an argument or an environment variable with an unknown type is now refused with its name (`bad structure definition for argument 'count'`, `bad parser definition for env var 'AA'`). It used to fail later, with a message which did not name it.
- `TSRect` constructor: `new TSRect(x, y, format)` with an unknown document format now throws a `TSError` (`bad [number, number, size or format] parameters`) instead of a `TypeError` (`Cannot read properties of undefined`).
- `@TSTrace`: an asynchronous method (returning a promise or any thenable) used to be traced with an unsettled `Promise` as result, an execution time measured before its end, and no trace of its rejection. Its result (or its error) and its real execution time are now traced when it's settled.
- `@TSTrace` on a static method gave `Function.method` instead of `Class.method` in the traces.
- `TSColor`: the conversions from [0 .. 1] components or opacities to [0 .. 255] bytes were truncated instead of rounded. Converting an RGB color to CMYK and back gave another color (one of its channels changed by 1) in nearly half of the cases, `rgbcomponents(0.5, 0.5, 0.5)` gave `rgb(127,127,127)` and an opacity lost a little each time it was converted to an alpha. All these conversions are now rounded, so the byte to component to byte conversions are exact. Some colors computed from components, opacities, `lighterColor()` or `darkerColor()` may change by 1 (eg. `toOpacity(0.5)` now gives an alpha of 128, like CSS, instead of 127).
- `TSColor.gray` (and `toGrayscale()`) of an RGB color was rounded to a percentage, so `rgb(129,129,129).toGrayscale()` did not give back `rgb(129,129,129)`.
- `TSColor.toGrayscale()` lost the opacity of the color (the gray color was always opaque).
- `TSColor.grayscale(gray, opacity)` did not bound its opacity in [0 .. 1] (eg. `grayscale(0.5, 2).opacity` was `2`).
- `TSColor.cmyk()` and `TSColor.grayscale()` could return a cached color with slightly different components (eg. `cmyk(0.1001, 0, 0, 0).cyan` was `0.1` once `cmyk(0.1, 0, 0, 0)` was created). The cache now only merges computation jitters (eg. `1 - 0.7` and `0.3`).
- `TSColor.isSimilar()` now compares the RGB bytes and the alpha of the colors, whatever their color spaces are. Two CMYK or gray colors giving the same RGB color used to be considered as different when their components were not exactly the same.
- `TSParser`: an enumeration tag can now be used as a default value (eg. `{ _type:'uint8', _enum:{ red:1, blue:2 }, _default:'red' }`). Such a definition used to be refused.
- `$args()`: the regular expression used to convert the parser errors into argument errors had a O(n²) backtracking . It's now linear.
- `TSData` is faster

#### What's new ?

- @TSTrace` can now be given options, eg. `@TSTrace({ log:myLogger, write:myWriter, label:'Users.find' })`: specific outputs (the default ones are used for absent outputs) and a specific name for the traced method. `@TSTrace` without options still works.
- `@TSTrace` can now be used as a standard TypeScript 5 method decorator, as well as a legacy one (with the `experimentalDecorators` option).
- `TSParser` array nodes now also accept a `Set` or a `TSCollection` (eg. a `TSList`) in `validate()`, `interpret()` and `encode()` (which used to refuse them, so that a model with a `Set` field could not be encoded). The result is always an array, and the `_checker` function always receives an array. Strings, maps, typed arrays and one-shot iterators are still refused.
- `TSInterval.unionInterval(other)` and `TSInterval.intersectionInterval(other)` give the union (the smallest interval containing both intervals, even disjoint ones) and the intersection of two intervals, like `TSRange.unionRange()` and `TSRange.intersectionRange()`, infinite bounds included (eg. `[2022, +∞[ ∩ ]-∞, 2023[` is `[2022, 2023[`). The intersection of touching intervals is an empty interval at their common date. Both methods return `null` if one of the intervals is not valid, and `intersectionInterval()` returns `null` for disjoint intervals (where `TSRange.intersectionRange()` returns a bad range).
- `TSRangeSet.containsLocation()`, `TSRangeSet.containedIn()` and `TSRangeSet.continuousWith()`, like the `TSRange` methods (a range set is continuous with ranges which intersect or touch one of its ranges).
- `TSQualifier` interval qualifiers named after the `TSRange` methods whose meaning they have (half-open intervals `[start, end[`). The interval is a `TSRange` (or its `[location, length]` array), a `TSInterval` (a null bound is infinite), a `TSRangeSet` (one condition for each of its ranges) or `start` and `end` values (null for infinite); an invalid or inverted interval throws. All of them are made of the existing operators, so they can be translated to database requests like the other qualifiers:
  - `INRANGE(key, interval)` and `INRANGE(key, start, end)`: `key` is in the interval, like `TSRange.containsLocation()`.
  - `CONTINUOUS(startKey, endKey, interval, canUnspecify?)`: the `[startKey, endKey[` interval of the value intersects or touches the interval, like `TSRange.continuousWith()`, empty intervals included.
  - `OVERLAPS(startKey, endKey, interval, canUnspecify?)`: it intersects the interval, like `TSRange.intersects()` (except for a value with an empty interval strictly inside the interval, which is matched: excluding it would need to compare two keys).
  - `CONTAINS(startKey, endKey, interval, canUnspecify?)` and `CONTAINEDIN(startKey, endKey, interval)`: it contains or is contained in the interval, like `TSRange.contains()` and `containedIn()` (except for a value with an empty interval located at the excluded end of the interval, which `CONTAINEDIN()` matches).
  - With `canUnspecify`, a null start or end value is infinite. The instance methods are `inRange()`, `continuous()`, `overlaps()`, `contains()` and `containedIn()`.
- **<u>Deprecated</u>**: `TSQualifier.INCLUDED()` and `included()` (closed intervals: use `INRANGE()`), `TSQualifier.INTERSECTS()` and `intersects()` (use `CONTINUOUS()`, which gives the same conditions, or `OVERLAPS()`, which gives the conditions of the strict mode), and `LAZY_INTERSECTION`.
- UTF-16 big endian charset: `TSCharset.utf16BECharset()`, also named `utf16be`, `utf-16be`, `UTF-16BE`... (new `StringEncoding` names). Like in Node and in the WHATWG encoding standard, the other UTF-16 names (`utf16`, `UTF-16`, `unicode`, `ucs2`...) are still UTF-16 little endian (`TSCharset.unicodeCharset()`). The UTF-16 big endian charset cannot be used by fusion templates, like the little endian one.
- `TSCharset.stringFromDetectedData(data, defaultCharset?)` detects the charset of the data and decodes them, giving the string and the charset. Like `TextDecoder` or a .NET `StreamReader`, the byte order mark which gave the charset (UTF-8, UTF-16 LE or BE) is removed. The `stringFromData()` and `stringFromBytes()` methods still keep a byte order mark (`'\uFEFF'`), like `Buffer.toString()`, and no byte order mark is ever added when encoding.

<hr/>

## version 1.8.8

This is the first version after heavy sonar introspection.

#### Breaking changes

- Random generation no longer falls back on `Math.random()`: without any secure source (no `node:crypto`, no `globalThis.crypto`), `$password()`, `$encrypt()`, `$uuid()`, `$randomBytes()` and `$random()` now throw a `TSError`. Use `$setCryptoProvider()` in such environments.
- Fusion: a procedure now receives the local context of its template level. Each iteration of an enumeration has its own local context. A procedure inside a `?:` or `!:` block writes in the local context of the enclosing level. A `_localContext` property of an enumerated data item is no longer used.
  - **Drawback:** a procedure can no longer use its local context as a memory from one iteration to the next. For example, a counter procedure doing `local.c = (local.c ?? 0) + 1` in `{{items#:[{{*counter}}]}}` used to render `[1][2][3]` and now renders `[1][1][1]`. Use the system context (`{{_index}}`, `{{_position}}`, or the `index` / `position` fields of the system context given to the procedure) or store the data in the global context instead.
- `$numcompare()` and `$numorder()` consider any non-number argument as `NaN` (no more string coercion).
- `TSServer.clearCaches()` is now synchronous and returns `void` instead of `Promise<void>` (an `await` on it still works, a `.then()` does not).
- `TSServer.isRunning()` is now synchronous and returns a `boolean` instead of `Promise<boolean>`. Code calling it without `await` used to always get a truthy promise, even when no server was running.
- `TSURL`: an internationalized hostname is now converted to its ASCII punycode form, like the native `URL` class does (eg. `münchen.de` gives `xn--mnchen-3ya.de`). It used to be transliterated, which gave another domain (`munchen.de`), and an invalid one is now refused.
- `TSURL` now escapes urls exactly like the native `URL` class does: the non-ASCII characters of the path, the search and the hash are percent-encoded in UTF-8 (eg. `/café` gives `/caf%C3%A9` in `href` and `pathname`), each part uses its own set of escaped characters (eg. `'` and `|` are no longer escaped in a path, `{` and `}` are no longer escaped in a search or a hash), tabs and new lines are removed, and backslashes are only replaced by slashes in the path of standard protocols. Two writings of the same URL are now equal.
- `TSServer` query parameters: a key declared as an array in the endpoint `query` definition now always receives an array (`?ids=1&ids=2` → `[1, 2]`, `?ids=1` → `[1]`). A repeated key declared as a non array is now refused with a `400 BadQueryStructure` error, instead of silently keeping its last value. An undeclared repeated key accepted by `_acceptsUncheckedItems` is given as an array.
- `TSUnaryTest.stop(reason)` now really stops the whole run once the current unary test is finished (it used to only set the `stopped` flag): the following tests are not run, `stopItCallback` is called, and the reason is logged and returned in the new `TSTesterResult.stopReason` field.

#### Corrections

- **Security** — `TSServer` static websites: a request path containing `..` segments (sent as is by a non-browser client, eg. `GET /../secret.html`) could read any file outside the website folder whose extension has a known mime type. Such files are now refused (404).
- `$generateMultiPartBodyString()`: binary files were corrupted (their content was decoded as UTF-8 text), file names were never sent, and quotes or line breaks in names were not escaped. File names are now sent, a Blob is sent with the name `blob` like a browser `FormData` does, and names are escaped like browsers do. Use the new `$generateMultiPartBody()` to send binary files.
- `TSParser`: a non mandatory object or dictionary now accepts a `null` or `undefined` value instead of throwing `Cannot convert undefined or null to object`. A `TSServer` endpoint with a non mandatory `query` definition used to answer 500 to a request without query string.
- `TSParser.encode()` (and `rawEncode()`): a non mandatory absent object, dictionary or array, a nested `null` field, and an unchecked item accepted by `_acceptsUncheckedItems` no longer throw (`stringify()` used to return `null` for them, and a `TSServer` response parser to answer 500). Unchecked items are kept as they are, like in `interpret()`. The encoding options (eg. the `url` context) are now given to the items of an object.
- `TSParser`: an invalid mandatory object item is no longer also reported as missing (`value.a is mandatory`), and a duplicate key is now reported even when its first occurrence was not valid. Some definition error messages were also corrected (`_keysCase field should be one of`, `cannot have ... as default value`).
- `$logterm()` / `$writeterm()` in a browser page with a `ftsconsole` element: each call used to rewrite the whole element content, which was quadratic and made long outputs extremely slow. The new content is now appended.
- `TSCountry`: `alpha2CodeForAlpha3Code()`, `alpha3CodeForAlpha2Code()`, `alpha2CodeForNumericCode()`, `alpha2Codes()`, `alpha3Codes()`, `numericCodes()` and `countriesForDialCode()` now load the countries like `country()` does. Called first, they used to throw, and so did the `TSParser` validation of an alpha-3 country code (eg. `'FRA'`).
- `TSParser`: an `_enum` on a leaf type which does not support enumerations (eg. `boolean`) now gives definition errors instead of throwing `manager?.enum is not a function`.
- `TSServerEndPoint`: a parametric token type may now contain digits after its first letter, so `/p/{id:uint32}` (and `uint8`, `uint16`...) is accepted instead of throwing a "forbidden first character" error.
- `TSServerEndPoint`: the "Bad parameter" error of a parametric path now gives the token type (the message used to contain the source of the `nodeType()` method, and the error info had no `type`).
- `TSServer` end points: the request path is now percent-decoded before routing, so an end point whose path contains a space, an accent or an apostrophe (eg. `/café`) is found. The static part of an end point path is now compared without case, like its parametric part: an end point declared as `/Echo` used to be found only with `/echo`.
- `TSServer` static websites: the request path is now percent-decoded before looking for the file, so files whose name contains a space or an accent (eg. `a b.html`, `café.html`) are found. An encoded `..` (`%2e%2e`) is still refused.
- `TSServer` static websites serve `.jpg` files as `image/jpeg` (was the non-standard `image/jpg`).
- `$slowuuid()` (used by `$uuid(true)` or when `crypto.randomUUID()` is not available) generated UUIDs with 14 digits always set to `0`. Fixed.
- `$password()` characters are now drawn without modulo bias.
- `$HTML()` (and `String.toHTML()`) numeric entities are now closed by a `;` (`€1` used to give `&#83641`, which is another character), and a character outside the BMP gives one entity (eg. `&#128512;` for an emoji) instead of two invalid ones, one per UTF-16 code unit.
- `$HTML()` (and `String.toHTML()`) no longer converts line breaks into `<br/>`: the default HTML encoding table was modified by the browser console of `$logterm()`.
- `TSServerEndPoint` constructor error messages about forbidden characters now give the character code instead of the source of the `toHex4()` method.
- `$readStreamBuffer()` now resolves to `null` when the stream fails or is closed before its end, instead of rejecting with `null` (or never resolving). On the server side, a client aborting its request body no longer makes the error handler crash: the endpoint now answers `400` if a body is mandatory.
- `TSServer` CORS preflight cache: its validity test was inverted. Valid preflight responses were discarded (and removed by the periodic caches cleaning) while expired ones were kept, so the requests following a successful preflight did not get their `Access-Control-Allow-Origin` header.
- `TSServer.start()` now waits for the server to really listen to its port. If it cannot (eg. port already used), it returns the `Error` and the server is not considered as running, instead of returning a success then crashing the process with an uncaught `EADDRINUSE` error.
- `TSServer.stop()` now returns the closing error, as stated by its signature, instead of throwing it. It also no longer keeps the process alive for `forceCloseMsTimeout` (15 seconds by default) after the server is stopped.
- `TSServer.start()` returns the `Error` when the HTTPS server cannot be created (eg. invalid certificate or key) instead of rejecting.
- `TSServer` default preflight controller: the headers requested by the browser are now read in `Access-Control-Request-Headers` (it used to read `Access-Control-Allow-Headers`, so custom headers like `Authorization` were never allowed).
- `TSServer` preflight responses: `content-type` and `accept` are now always part of `Access-Control-Allow-Headers` (they were added to the methods instead, so a `permisive` controller allowed no header at all).
- `TSServerResponse.returnString()`, `returnData()` and `returnObject()` with two arguments: the second one is now correctly taken as a content type when it's a string and as a status otherwise. `returnString(s, status)` used to send the status as content type with a 200 status, and `returnData(d, type)` / `returnObject(v, type)` used to take the content type as a status.
- `$insp()` (and `$inspect()` in a browser) no longer throws a `TypeError` on a symbol value.
- `TSURL.pathname` setter now escapes `?` and `#` (as `%3F` and `%23`, like the native `URL` class) and adds the leading `/` to the pathname itself. A path containing them used to produce a wrong `href`, read back with another path, search and hash.
- `$hashfile()` now resolves to `null` on failure instead of rejecting with `null`, and a missing or unreadable file no longer crashes the process (unhandled stream `'error'` event).
- `$isipv6()` and `$isipaddress()` no longer have catastrophic backtracking on adversarial input (zone index).
- Fusion: no more useless warning when a key absent from a local context filled by a procedure is found in the data.
- Methods added to native classes (`String`, `Number`, `Date`, `Array`, `Map`, `Set`, `Uint8Array`, `ArrayBuffer`...) are now non-enumerable (invisible to `for...in`), writable and configurable, and their `name` is the method name. Loading two copies of foundation-ts in the same application no longer throws `Cannot redefine property`.
- `TSTester.run()`: when the run is stopped (`stopOnFirstFail` or `stop()`), the group which did stop it is now counted in the result, so its failures appear in `failures` (a run stopped on a failed test used to report 0 failures).
- `TSTester`: failure messages of `isipv4()`, `isipv6()` and `isip()` no longer expect "a folder", type checks messages no longer end with `>>`, and `toBeUnordered()` now respects `logAllTests`.

#### What's new ?

- `TSURL.utf8Href` gives the href as a readable UTF-8 string, for display: the percent-encoded non-ASCII characters are decoded and an internationalized hostname is given in Unicode. Encoded ASCII characters (eg. `%20`, `%2F`), invalid sequences and invisible or bidirectional characters stay encoded, like in a browser address bar.
- `$generateMultiPartBody(dict, boundary)` returns a multipart/form-data body as bytes (`Uint8Array`), which keeps binary files unchanged. It can be given as is as a `TSRequest` body, with a `multipart/form-data; boundary=...` content type.
- `TSParser.itemParserForKey(key)` returns the parser used for the value of a key (objects, with their aliases and keys case, and dictionaries).
- new `$declareMethods()` function to declare several methods on a class, with the same descriptor as native methods. `$declareMethod()` accepts a new `writable` option.
- `$isipv6()` is now a type guard (`o is string`), like `$isipv4()` and `$isipaddress()`.
- `$shuffle()` is now O(n) instead of O(n²). `$isipv4()` and `$isipv6()` are 30 to 40% faster.

<hr/>

## version 1.8.7

#### What's new ?

- Group `TSServerOptions` `logLevel` and `logger` into a specific `log` data, and add a new option `sensitiveHeaders`, which defines a list of HTTP header names whose values will be hidden in the logs
- It's now possible to define an external logger function for `TSServerEndPointManager` and `TSServerEndPoint` objects

## version 1.8.6

#### Corrections

- function `$realMoveFile()` does now a better job when we needed to copy then unlink the previous file.
- function `$chmod()` now controls if parameter `mode`  is not `0`.

#### What's new ?

- new `$removeDirectory()` function.
- function `$createDirectory()` now accepts a `mode` parameter and an `errors` string array. If `mode`is not set, `0xo755` is used when we really create the folder. If the folder did already existed on the disk and the asked `mode` is not the existing folder's `mode`, the function returns an error.
- functions `$removeFile()` and `$realMoveFile()` now accepts an errors array to be filled,

## version 1.8.5

#### Corrections

- removed all method aliases which did add pointers in classes' instances instead of methods in object prototypes.
- fixed options management bug on core of functions `$partial()`, `$dict()`, `$fusion()`

#### What's new ?

- `TSColor` now caches all colors from all colourspaces.
- `TSExpectAgent` is now really faster on instantiation (15x faster).
- `TSRect` is also faster on instantiation (40% faster)
- On `TSExpectAgent` you now have a method `.toStrictlyBe()`  or `.strictis()` wich handles a `===` comparison
- On `TSExpectAgent` you now have a method `.notToStrictlyBe()`  or `.strictnotis()` wich handles a `!==` comparison

<hr/>

## version 1.8.4

This version is meant to bring bug foptimizations to foundation-ts

#### Corrections

- `$isemail()` && `$email()` function did correct some edge mail format not correctly interpreted (e.g: "a@b.com." was accepted. Its no more the case) and did have a catastrophic backtracking on adversarial input.
- Everything built on `$isfile()`, `$isdirectory()`, `$isreadable()`, `$iswritable()`, `$filesize()`, `$createDirectory()` was working on the fact that if `$stats()`did return `null`then, it meant that the pass did not exist. It may not have been  the case if the error came from folders or file up in the pass. Fixed.

#### What's new ?

- new function `$titleCase()` which works like `$capitalize()` but instead change all letters which are the begining of a word to lower case. Did also ass a `.titleCase()` method on `String`.
- `SHA384` & `SHA12` crypto is back to full `JS` (no more bigint usage on calculation itself) and is now 2x to 3x faster
- `SHA1` & `SHA256` crypto is also 20% faster by using internal scopped buffers
- Native random bytes generation is now 2x to 3.5x faster than before (but is rarely called) and conforms to what the system function does.
- Better memory management inside `$durationDescription()` and `$durationNumber2StringFormat()` functions
- Fastest `TSColor` by adding proper cache for transformations between `RGB` & `CMYK`

<hr/>

## version 1.8.3

#### Corrections

- did upgrade `TSServer` endpoints indexation for faster routage.
- did upgrade headers standardisation management in `TSRequest`

#### What's new ?

- function `$fullWriteBuffer()` and all derived functions can now use an optional `errors` string array in order to report the encountered errors when it returns false to the file writting action. New `errors` array is declared in interface:

  ```typescript
  export interface BasicWriteOptions {
      attomically?: Nullable<boolean>;
      removePrecedentVersion?: Nullable<boolean>;
      mode?: Nullable<number>;
      errors?: Nullable<string[]>; // when set, every error encountered is pushed here
  }
  ```

<hr/>

## version 1.8.2

#### Corrections

- `$decodeBase64()` / `$decodeBase64URL()` were buggy on malformed input: any embedded whitespace or extra `=` padding made it over-read and append garbage trailing bytes.
- `$decodeBase64()` on a single leftover base64 character (6 bits, not enough for a byte) now returns an empty array instead of a one-byte array holding a partial value.
- `$decodeBase64()` / `$decodeBase64URL()` / `$encodeBase64()` / `$encodeBase64URL()` / `$encodeBytesToHexa()` pure internal JS codec are know faster and usage to native Buffer() methods are more accurately used.
- `$ok()` / `$defined()` /  `$isnumber()` dropped some redundant code
- `$ltrim()` / `$rtrim()` / `$trim()` (same as `$ftrim`) are know faster by avoiding double regex usage
- `$keys()` now lists only enumerable keys.
- `$term()` / `$termclean()` were reimplemented and are really faster.
- `Number.prototype.toHex1()` / `toHex2()` / `toHex4()` / `toHex8()` commes know bug free for number out of 4 octets range and are way faster.
- `TSData.splice()` / `appendBytes()` / `replaceBytes()` / `appendData()` were writing bytes at a wrong offset when the source was a plain `number[]` or a non-`Buffer` `Uint8Array` **and** a `sourceStart` greater than 0 was given (or the internal grow-and-insert path was taken). `TSData` and `Buffer` sources were not affected. Fixed.
- static method `TSURL.url()`did never throw even if the `throwsError`option was set. Fixed and added test to valid it.
- `$string()` object conversion rewritten to follow the `JS` `ToPrimitive` algorithm (hint `"string"`): it tries `[Symbol.toPrimitive]`, then `toString()`, then `valueOf()`, keeping only a result of the type each is expected to give. The former ad-hoc `$ismethod()` probe plus a `` `${v}` `` fall-back **threw** on a null-prototype object (`Object.create(null)`); `$string()` never throws now. A boxed `Boolean` (`new Boolean(...)`) also correctly goes through the `trueValue` / `falseValue` options.
- server error responses (`404` / `405` / `bad-query` / `bad-body` — every `TSError` carrying an `HTTP` `Resp` code) no longer pay V8's stack-trace capture, the dominant cost of constructing an `Error`, on paths that scan/probe traffic hits constantly. `TSError.status` and the server's inline status check now test membership in a `Set` built once instead of rebuilding `Object.values(Resp)` on every errored request.
- Error, TSUniqueError and TSError are better handled by $insp()
- `TSDate`, `TSColor`, `TSURL`, `TSData` and `TSCharset` `[Symbol.toPrimitive]` hint handling made consistent.
- `TSListNode` toArray() methods now returns an array containing the list node data (coherent with all other methods)

#### What's new ?

- `TSData.mutableBuffer` accessor know handles a cache which is really faster
- `$string()`function does not accepts a second boolean optional parameter anymore but an optional `$stringOptions`object instead which manages more precisely how to string convertion are handled. No options means works like before.
- new `TSData.appendASCII(source, sourceStart?, sourceEnd?)` instance method: appends a string as raw bytes (`charCodeAt(i) & 0xff`).
- `$decodeBase64()` / `$decodeBase64URL()` are now tolerant of either base64 alphabet, of embedded whitespace, and of missing or extra `=` padding (previously only well-formed input was safe — see Corrections).
- `$loadJSON()` no longer accepts a `TSDataLike` source (pass a path string and use `$jsonparse()` for in-memory data) and now takes an optional standard `reviver` callback forwarded to `$jsonparse()`.
- new `toString()` instance methods on `TSCharset`, on `TSFusionTemplate` and subclasses.
- `transliteration.ts` no longer decodes its ~442 KB of lookup tables at import time. The header always said "loaded lazily on first call" but the work ran on module evaluation, the moment anything imported `strings` or `commons`. It is now genuinely deferred to the first `$ascii()` / `$transliterate()` call.
- test coverage raised across the board: global code coverage is at nearly 98% and every source file is now at 90% minimum for statements and functions. The suite now runs more than 23400 tests on `Node.js` and more 21300 tests on `Chrome`, `WebKit` and `Firefox` headless environments.

<hr/>

## version 1.8.1

#### Corrections

- potential bug corrected in `$timeBetweenDates()` in case of the passed parameters where not strictly of the right types.
- `$icast()` function rewrited to avoid overflow
- `$firstcap()` and `$capitalize()` common core rewritten to be fully conform to unicode specs
- `TSData set length()` accessor was completly wrong. Corrected.
- `TSData`'s `getInt8`, `getUint8`, ... `getBigInt64`, `getBigUint64` methods where rewritten to avoid reading in non used buffer parts
- bug correction in `TSData uint8ArraySlice()` instance method which returned a wrong array
- bug correction in `TSList toString()` instance method which did use the wrong separator
- did rewrite static method `TSError.assert()` (no more duplicated dead code)
- crypto functions does not rely anymore to import of { Hash, getRandomValues, randomInt, RandomUUID } from crypto
- A`TSRangeSet` built from another set (`clone()`, `union()`, `substraction()`, `intersection()`, `complement()`) now clones its ranges: those methods no longer mutate the source set
- function`$parsetime()` was broken for `HH:MM` / `HH:MM:SS` / packed-number forms (only the hour was read, minutes & seconds came out as 0). Rewritten to read the right regex groups and to support `H`, `HH`, `HMM`, `HHMM`, `HMMSS`, `HHMMSS` packed forms
- Fixed`$parsedatetime()` / `$parsedate()` / `TSDate.fromString()` (non-ISO `Standard` / `English` / `Computer` forms) which had the same time-parsing bug
- Fixed`TSRequest.setToken()` was a no-op (it computed the bearer string but did not assign `this.token`)
- Fixed`TSURL` `set pathname` : it assigned to itself (`this.pathname = …` instead of `this._pathname = …`) and infinitely recursed / stack-overflowed.

#### What's new ?

- new function `$setCryptoProvider()` in crypto.ts so you can use your own functions to randomize, hash, get random UUID, cypher and decypher.
- new function `$cryptoProvider()`to access the functions you defined.
- removed `JSONType` as a type. Replaced by type `any` in order to avoid anoying mandatory casting.
- `$uuid()` function does not log anymore if `randomUUI()` is not available in execution context.
- did make `enum TSBrowserOS` public
- `$jsonparse()`function now accepts common `reviver` parameter
- new methods `toBeAFile()`, `toBeADirectory()`, `toBeAnIPv6()`, `toBeAnIPv4()`, `toBeAnIPAddress()`, `toBeAPhoneNumber()`, `toBeADataObject()`, `toThrow()`, `notToThwo()`, `toReject()` in `TSExpectAgent` class
- new alias methods in `TSExpectAgent`: `isnumber`, `isint`, `isuint`, `isstring`, `isbool`, `isemail`, `isurl`, `isuuid`, `isobject`, `isiterable`, `isarray`, `isdate`, `isfunction`, `isfile`, `isdir`, `isipv4`, `isipv6`, `isip`, `isphone`, `isdata`, `throws`, `doesNotThrow`, `rejects`
- more tests for everything: we have now more than 22800 tests covering more than 95% of the code
- new `npm run test:jsdom` in order to validate foundation-ts functions and classes inside a browser-like environment
- new `npm run test:chrome`, `test:firefox` and `test:webkit` in order to validate foundation-ts inside a real headless browser (Chromium/Chrome, Firefox, WebKit) through playwright-core ; `test:browsers` runs the three
- new `npm run test:all` in order to validate foundation-ts in Node + jsdom + the three browser engines
- `npm run playwright:install` downloads the Playwright Firefox & WebKit builds (test:chrome uses the system Chrome, no download)
- new `npm run coverage` : runs the Node suite under `c8` and reports line/branch/function coverage (console + HTML + lcov in `coverage/`, remapped to `src/*.ts`)

<hr/>

## version 1.8.0

#### Corrections

- functions $ok(), $defined() … $isstring() conform to type management for the following code (issue #11)
- new implementation for $ascii() function (issue #6)
- TSEndianness is no more a type but a constant object with BE = false and LE = true (issue #5)
- new function $uint32ArrayFromUint8Array() replacing $uint32ArrayFromBuffer() (issue #5)
- modify read/write number functions implementation in order to use new DataView methods (issue #5)
- remove read/write number functions from Uint8Array (data.ts) since we prefer developers directly use DataView methods (issue #5)
- Improved TSPhoneNumber class with more accuracy, tests and methods to know if a phone number is mobile, and land line or undetermined  (issue #9)
- Did add TSReques's defined RespType.OptionalJson in order to manage request with JSON wich may not be present in requests' responses (issue #10)

#### What's new ?

- removed wrongly conceived TSDataCursor class (issue #5)
- new $strictascii() function which returns null if some charaters cannot be represented in ASCII  (issue #6)
- new $jsonparse() function replacing JSON.parse() and permitting to ignore commentaries in parsing (issue #8)
- new $jsonstrip() function removing // and /* .. */ commentaries in JSON string (issue #8)
- did add reading DataView methods to TSData (issue #5)

  ```typescript
  getInt8(byteOffset):number // Reads an 8-bit signed integer.
  getUint8(byteOffset):number // Reads an 8-bit unsigned integer.
  getInt16(byteOffset:number, littleEndian?:boolean):number // Reads a 16-bit signed integer.
  getUint16(byteOffset:number, littleEndian?:boolean):number // Reads a 16-bit unsigned integer.
  getInt32(byteOffset:number, littleEndian?:boolean):number // Reads a 32-bit signed integer.
  getUint32(byteOffset:number, littleEndian?:boolean):number // Reads a 32-bit unsigned integer.
  getFloat32(byteOffset:number, littleEndian?:boolean):number // Reads a 32-bit floating point number.
  getFloat64(byteOffset:number, littleEndian?:boolean):number // Reads a 64-bit floating point number.
  getBigInt64(byteOffset:number, littleEndian?:boolean):bigint // Reads a 64-bit signed integer as BigInt.
  getBigUint64(byteOffset:number, littleEndian?:boolean):bigint // Reads a 64-bit unsigned integer as BigInt.
  ```
- did add writing DataView methods to TSData (issue #5)

  ```typescript
  settInt8(byteOffset:number, value:number) // Writes an 8-bit signed integer.
  setUint8(byteOffset:number, value:number) // Writes an 8-bit unsigned integer.
  setInt16(byteOffset:number, value:number, littleEndian?:boolean) // Writes a 16-bit signed integer.
  setUint16(byteOffset:number, value:number, littleEndian?:boolean) // Writes a 16-bit unsigned integer.
  setInt32(byteOffset:number, value:number, littleEndian?:boolean) // Writes a 32-bit signed integer.
  setUint32(byteOffset:number, value:number, littleEndian?:boolean) // Writes a 32-bit unsigned integer.
  setFloat32(byteOffset:number, value:number, littleEndian?:boolean) // Writes a 32-bit floating point number.
  setFloat64(byteOffset:number, value:number, littleEndian?:boolean) // Writes a 64-bit floating point number.
  setBigInt64(byteOffset:number, value:bigint, littleEndian?:boolean) // Writes a 64-bit signed integer BigInt.
  setBigUint64(byteOffset:number, value:bigint, littleEndian?:boolean) // Writes a 64-bit unsigned integer BigInt.
  ```
- add function $bufferFromHexaString(s:string):Buffer|null. Please use it instead of Buffer.from(xxx, 'hex') which may silently fail (issue #4)
- add function $uint8ArrayFromHexaString(s:string):Uint8Array|null. (issue #4)
- add function $arrayBufferFromHexaString(s:string):ArrayBuffer|null. (issue #4)
- declare fromHex() method on Uint8ArrayConstructor because it was not done by Typescript itself (issue #4)
- add static methods TSData.fromHexaString(), TSData.fromBase64String(), TSData.fromBase64URLString() (issue #4)
- did add ordinals values in Locales.json in order to manage %E indicator in date formats (issue #2)
- did add 'pdf-max' and 'pdf-min' document formats (issue #7)

<hr/>

## version 1.7.3

#### Corrections

- function $sleep() is now working and is tested.

<hr/>

## version 1.7.2

#### Corrections

- slowhash algorith did not work correctly with Node24. A much simpler algorith as been put in place instead of the previous one. crc16, crc32, sha1, sha224, sha256, sha384 and sha512 were rewritten.

#### What's new ?

- MDS hash functions were discarted
- $uuidhash() and $uuidhashfile() functions were discarted
- $sha256partial() function was discarded
- uuidhash() method was discarted from all classes
- TSData now respons to hexaString(), base64String() and base64URL() common methods (previous were keeped for backward compatibility)
- separator field was discarted $hashOptions parameters
- separator parameter was discarted in functions $sha1(), $sha224(), $sha256(), $sha384() and $sha512() function
- $exit() function now returns never
- new crypto hash tests have been added

<hr/>

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

- `$inbrowser()` function now use `$browserOS()` function for its implementation
- `$ascii()` function now makes better transformation
- `TSEndPoint` interface does now contains a context `TSDictionary` which can be used in `TSEndPointController` which now includes a 3rd optional parameter wich is this `TSDictionary`. This new parameter may be used to keep infos through all script's life
- numeric operations on Arrays now use `valueOf()` and `[Symbol.toPrimitive]` methods
- tests were updated in order to reflect all modifications

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

- `$length()` function now works with Blob
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

- `Locales` interface now have a `ordinals` array wich will in the future be used by `%E` date format and will output 1st, 2nd, 3e …

<hr />
