# std-format

This is a simple string formatting library for TS/JS.

Inspired by [C++20 std::format](https://en.cppreference.com/w/cpp/utility/format/spec) and
[Python format](https://docs.python.org/3/library/string.html#formatspec).

## Disclaimer!

This is a non-professional, hobby project. 
I'm building it for fun and learning, but I'm giving it my best effort! 
So please keep that in mind when using it!

Still going through some changes. Has many bugs, hoping to fix them.

## Note!

Legacy JavaScript has only *number* type, not separate *int* and *float*.

    // By default format number as float.
    Fmt.format("{}", 5);   // "5.0"

    // To format number as integer, use type "d".
    Fmt.format("{:d}", 5); // "5"

    // Now you can also use int() and float() wrappers. See more below.
    Fmt.format("{}", Fmt.int(5));   // "5"
    Fmt.format("{}", Fmt.float(5)); // "5.0"

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

    let str = Fmt.format("{} {}!", "Hello", "World");

### Functions int() and float()

int() and float() are wrapper functions that can be used to force *number* to int or float.

    format("{}", int(5));   // "5"
    format("{}", float(5)); // "5.0"

Note! Formatting rules are strict.

    format("{:.2e}", int(5)); // Throws, cannot format int as float.
    format("{:d}", float(5)); // Throws, cannot format float as int.

While float() just wraps a *number*, int() wraps a JSBI.BigInt and formats big integers nicely.

    format("{:d}", int("111111111111111111111111111111"));

You can also pass BigInt to format(), it will be safely wrapped to int().

    format("{:d}", BigInt("111111111111111111111111111111"));


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

## String Formatting

Replacement field is enclosed in braces '{}' and consists of parts separated by ':'.

    {field_num:arr_1:arr_2:arr_N:elem}

- First part (field_num) is field number.
- Last part (elem) is element presentation.
- Parts between (arr_1...arr_N) are array presentations.
- Any part can be empty string.

Format specification for element:

    [[fill]<^>=][+- ][z][#][0][width][,_][.precision][L][scdnbBoxXeEfF%gGaA]

Format specification for array (and set, map, object):

    [[fill]<^>][width][dbnms]

## Examples

    // Using auto field numbering
    let str = Fmt.format("{}{}", "A", "B"); // "AB"
    
    // Using manual field numbering
    let str = Fmt.format("{1}{0}", "A", "B"); // "BA"

    // Using named fields
    let str = Fmt.format("{name} {age:d}", { name: "Tim", age: 95 }); // "Tim 95"

    // Fill, align and width
    let str = Fmt.format("{:0<8d}", 777);  // "77700000"
    let str = Fmt.format("{:0^8d}", 777);  // "00777000"
    let str = Fmt.format("{:0>8d}", -777); // "0000-777"
    let str = Fmt.format("{:0=8d}", -777); // "-0000777"

    // Precision
    let str = Fmt.format("{:.2f}", 1); // "1.00"

    // String width
    let str = Fmt.format("{:10.4s}", "Alligator"); // "Alli      "

    // With nested arguments
    let str = Fmt.format("{:{}.{}s}", "Alligator", 10, 4); // "Alli      "

    // Array
    let str = Fmt.format("{:d}", [1, 2, 3]); // "[1, 2, 3]"

    // Set
    let str = Fmt.format("{:d}", new Set([1, 2, 3, 2])); // "[1, 2, 3]"

    // Map
    let str = Fmt.format("{:m:}", new Map([["x", 1], ["y", -1]])); // "[x: 1.0, y: -1.0]"

    // Object
    let str = Fmt.format("{{{:n:}}}", { x: 1, y: -1}); // "{x: 1.0, y: -1.0}"
