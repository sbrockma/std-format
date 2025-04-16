# std-format

std-format is a string formatting function for TS/JS.

This is a hobby project. This is early release, and has many bugs. Hoping to fix them.

## Format Specification

Format specifications for
[c++20](https://en.cppreference.com/w/cpp/utility/format/spec) and
[Python](https://docs.python.org/3/library/string.html#formatspec).

### Design Note!
Python and C++ has int and float types, JavaScript has only number.

    // By default format number as float.
    Fmt.format("{}", 5);          // "5.0"

    // With integer type 'd' format number as integer.
    Fmt.format("{:d}", 5);        // "5"
    
    // Or use wrapper function Fmt.int().
    Fmt.format("{}", Fmt.int(5)); // "5"

## Library Bundle

- Bundled to a Universal Module Definition (UMD) - module.
- Transpiled using babel, targets "> 0.25%, not dead".
- Does not do polyfills!

## Install

    npm i @sbrockma/std-format

## Import

    // Import default export.
    import Fmt from "@sbrockma/std-format";

    // Or import named exports
    import { format, int, setLocale, FormatError } from "@sbrockma/std-format";

## Declarations

### Function format(formatString, ...args)

    import Fmt from "@sbrockma/std-format";

    // Automatic field numbering
    let str = Fmt.format("{}, {}, {}", "a", "b", "c");

    // Manual field specification
    let str = Fmt.format("{2}, {1}, {0}", "a", "b", "c");

    // Fill and align
    let str = Fmt.format("{:*<6}", "x");
    let str = Fmt.format("{:*>6}", "x");
    let str = Fmt.format("{:*^6}", "x");

    // Scientific notation
    let str = Fmt.format("{:.2e}", 1);

    // Supported arguments are boolean, string, char, number and int
    let str = Fmt.format("{:s} {:s} {:c} {:d} {:d}", true, "string", "c", 10, int(999));

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

Class StdFormatError is deprecated. Use class FormatError instead.
