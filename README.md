# std-format

This is a simple string formatting library for TS/JS.

Inspired by [C++20 std::format](https://en.cppreference.com/w/cpp/utility/format/spec) and
[Python format](https://docs.python.org/3/library/string.html#formatspec).

## Disclaimer!

This is a non-professional, hobby project. 
I'm building it for fun and learning, but I'm giving it my best effort! 
So please keep that in mind when using it!

This library feels now feature complete. Transitioning into maintenance and bug fixing.

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

    Fmt.format("...");

    // Or import named exports
    import { format } from "@sbrockma/std-format";

    format("...");

### CJS
    const Fmt = require("@sbrockma/std-format");
    
    Fmt.format("...");

### UMD (browser)
This version is bundled with dependencies so it can be used standalone in browser. Works now from unpkg CDN.

    <script src="https://unpkg.com/@sbrockma/std-format@1"></script>
    
    <script>
        StdFormat.format("...");
    </script>

## Declarations

### Function format(str, ...args)

This is the main formatting function.

    import Fmt from "@sbrockma/std-format";

    Fmt.format("{} {}!", "Hello", "World");

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
        Fmt.format("{:s}", 42));
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
    Fmt.format("{}{}", "A", "B"); // "AB"
    
    // Using manual field numbering
    Fmt.format("{1}{0}", "A", "B"); // "BA"

    // Using named fields
    Fmt.format("{name} {age:d}", { name: "Tim", age: 95 }); // "Tim 95"

    // Fill, align and width
    Fmt.format("{:0<8d}", 777);  // "77700000"
    Fmt.format("{:0^8d}", 777);  // "00777000"
    Fmt.format("{:0>8d}", -777); // "0000-777"
    Fmt.format("{:0=8d}", -777); // "-0000777"

    // Precision
    Fmt.format("{:.2f}", 1); // "1.00"

    // String width
    Fmt.format("{:10.4s}", "Alligator"); // "Alli      "

    // With nested arguments
    Fmt.format("{:{}.{}s}", "Alligator", 10, 4); // "Alli      "

    // Array
    Fmt.format("{:d}", [1, 2, 3]); // "[1, 2, 3]"

    // Set
    Fmt.format("{:d}", new Set([1, 2, 3, 2])); // "[1, 2, 3]"

    // Map
    Fmt.format("{:m:}", new Map([["x", 1], ["y", -1]])); // "[x: 1.0, y: -1.0]"

    // Object
    Fmt.format("{{{:n:}}}", { x: 1, y: -1}); // "{x: 1.0, y: -1.0}"

    // Floating point types
    Fmt.format("{0:.3e} {0:.3f} {0:.3%} {0:.3g} {0:.3a}", Math.PI); // "3.142e+00 3.142 314.159% 3.14 1.922p+1"

    // Integer types
    Fmt.format("{0:#b} {0:#o} {0:#d} {0:#x}", 65); // "0b1000001 0o101 65 0x41"

    // Char, string
    Fmt.format("{0:c} {1:c} {2:*^10.5s}", 65, "B", "Hello World!"); // "A B **Hello***"

## Found a bug or want to request a feature?

Please [open an issue](https://github.com/sbrockma/std-format/issues) with a simple
input/output example — it really helps make the project better!

## License

This project is licensed under the [zlib License](./LICENSE).

It also bundles the [JSBI](https://github.com/GoogleChromeLabs/jsbi) library,
which is licensed under the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0).

Please see the [LICENSE](./LICENSE) file for full details.
