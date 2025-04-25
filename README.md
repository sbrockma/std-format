# std-format

This is a simple string formatting library for TS/JS.

This is a non-professional hobby project. Learning how to create and publish an npm package. 

Still going through some changes. Has many bugs, hoping to fix them.

Trying to follow standard format specification, for example:
[C++20](https://en.cppreference.com/w/cpp/utility/format/spec) and
[Python](https://docs.python.org/3/library/string.html#formatspec).

Note! Legacy JavaScript has only *number* type, not separate *int* and *float*.

    // By default format number as float.
    Fmt.format("{}", 5);   // "5.0"

    // To format number as integer, use type "d".
    Fmt.format("{:d}", 5); // "5"

## Install

    npm i @sbrockma/std-format

## Bundling

This library is bundled with webpack to ESM, CJS and UMD bundles.

- Does not do polyfills.
- But! Trying to use legacy JS functions only.

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
This version is bundled with dependencies so it can be used standalone in browser.

    <script src="std-format.umd.js></script>
    
    <script>
        let str = StdFormat.format("...");
    </script>

## Declarations

### Function format(str, ...args)

This is the main formatting function.

    import Fmt from "@sbrockma/std-format";

    // Automatic field numbering
    let str = Fmt.format("{}{}", "A", "B");
    
    // Manual field numbering
    let str = Fmt.format("{1}{0}", "A", "B");

    // Fill, align and width
    let str = Fmt.format("{: ^10}", "Banana");

    // Floating point, precision
    let str = Fmt.format("{:.2e}", 1);

    // Array, Record
    let str = Fmt.format("{:d}", [1, 2, 3]);
    let str = Fmt.format("{:m:}", { x: 1, y: -1});

    // etc.

### Function setLocale(locale)

Default locale is detected. Locale affects decimal and grouping separators when using specifiers "n" or "L".

    import Fmt from "@sbrockma/std-format";
    
    Fmt.setLocale("en-UK");
    Fmt.setLocale(); // Reset

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

## Formatting Info

Replacement field is enclosed in braces '{}' and consists of parts separated by ':'.

    {field_num:arr_1:arr_2:arr_N:elem}

- First part (field_num) is field number.
- Last part (elem) is element format specification.
- Parts between (arr_1...arr_N) are array presentations.
- Any part can be empty string.

Element's format specification:

    [[fill]<^>=][+- ][z][#][0][width][,_][.precision][L][scdnbBoxXeEfF%gGaA]

Array presentations:

    [[fill]<^>][width][dbnms]
