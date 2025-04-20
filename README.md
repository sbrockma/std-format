# std-format

std-format is a string formatting function for TS/JS.

This is a hobby project. This is early release, still going through some changes, and has many bugs. Hoping to fix them.

## Format Specification

Format specifications for
[c++20](https://en.cppreference.com/w/cpp/utility/format/spec) and
[Python](https://docs.python.org/3/library/string.html#formatspec).

Replacement field:
    
    {[field id][:format specification]}

Format specification:
    
    [[fill]<^>=][+- ][z][#][0][width][,_][.precision][L][s?cdnbBoxXeEfF%gGaA]

- ('n', 'L' partially implemented)
- ('?' not implemented)

### Note!
Python and C++ has int and float types, JavaScript has only number.

    // By default format number as float.
    Fmt.format("{}", 5);          // "5.0"

    // To format number as integer, use type 'd'.
    Fmt.format("{:d}", 5);        // "5"

## Install

    npm i @sbrockma/std-format

## Bundling

This library contains bundles for ESM, CJS and UMD library types.

- Does not do polyfills.
- Trying to use legacy JS functions only.

Transpiling
- Compiled from TypeScript to JavaScript with ES6 target.
- CJS and UMD bundles transpiled with babel targets ie 11.

## Usage

### ESM
    // Import default export
    import Fmt from "@sbrockma/std-format";

    let str = Fmt.format("...");

    // Or import named exports
    import { format } from "@sbrockma/std-format";

    let str = format("...");

### CJS
    const Fmt = require("@sbrockma/std-format");
    
    let str = Fmt.format("...");

### UMD (browser)
UMD version bundles with "jsbi" dependency, so it can be used standalone in browser.

Has library name set to "StdFormat", so it can be accessed With (window.)StdFormat.

    <script src="std-format.umd.js></script>
    
    <script>
        let str = StdFormat.format("...");
    </script>

## Declarations

### Function format(formatString, ...args)

This is the main formatting function.

    import Fmt from "@sbrockma/std-format";

    let str = Fmt.format("{}, {}, {}", "a", "b", "c");
    let str = Fmt.format("{2}, {1}, {0}", "a", "b", "c");
    let str = Fmt.format("{:*<6}", "x");
    let str = Fmt.format("{:*>6}", "x");
    let str = Fmt.format("{:*^6}", "x");
    let str = Fmt.format("{:.2e}", 1);

    // etc.

### Function setLocale(locale)

Decimal and grouping separators are decided by locale when formatting with type specifier "n" or locale specifier "L".

    import Fmt from "@sbrockma/std-format";

    // Use default locale
    Fmt.setLocale();

    // Use locale "en-UK"
    Fmt.setLocale("en-UK");

### Class FormatError

    import Fmt from "@sbrockma/std-format";

    try {
        let str = Fmt.format("{:s}", 42));
    } 
    catch(e) {
        if(e instanceof Fmt.FormatError) {
            console.error(e);
        }
    }

## Deprecated Declarations

### Function stdFormat(formatString, ...args)

Function stdFormat() is deprecated. Use function format() instead.

### Function stdSpecificationHint("pyhon" | "cpp" | "js")

Function stdSpecificationHint() is deprecated.

Specification hint was attempt to support both Python and C++ language ways:
 * "python": octal prefix is "0o", boolean strings are "True" and "False"
 * "cpp": octal prefix is "0", boolean strings are "true" and "false"
 * "js": octal prefix is "0o", boolean strings are "true" and "false"

Using format() function instead the result is not affected by specification hint:
 * octal prefix is "0o", boolean strings are "true" and "false".

### Function stdLocaleHint(locale)

Function stdLocaleHint() is deprecated. Use function setLocale() instead.

### Class StdFormatError

StdFormatError is deprecated. Use class FormatError instead.
