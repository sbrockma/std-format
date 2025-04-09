# std-format

std-format is a string formatting of curly braces notation for TS/JS following standard format specifications.

This is early release. Hoping to fix bugs and add new features in future.

## Format Specification

This is mix of both [c++20](https://en.cppreference.com/w/cpp/utility/format/spec) and
[Python](https://docs.python.org/3/library/string.html#formatspec) format specifications.

    [[fill]align][sign]['z']['#']['0'][width][grouping]['.' precision]['L'][type]

* [fill] (optional) any character except '{' or '}'
* [align] (optional) '<', '^', '>' or '='
* [sign] (optional ) '+', '-' or ' '
* ['z'] (optional) coerse -0 to 0 on float types
* ['#'] (optional) alternate form
* ['0'] (optional) zero padding
* [width] (optional) minimum total width
* [precision] (optional) precision
* ['L'] (optinlal) locale aware formatting
* [type] (optional) 's', 'c', 'b', 'B', 'o', 'd', 'x', 'X', 'a', 'A', 'e', 'E', 'f', 'F', 'g', 'G', '%', 'n', or '?' ('?' not implemented)

See the C++ and Python links above for full format specification.

## Install

    npm i @sbrockma/std-format

## Import

    // Import default export.
    import Fmt from "@sbrockma/std-format";

    // Or import named exports
    import { format, setLocale, FormatError } from "@sbrockma/std-format";

## Declarations

### function format(formatString, ...args)

    import Fmt from "@sbrockma/std-format";

    // Automatic field numbering
    Fmt.format("{}, {}, {}", "a", "b", "c");

    // Manual field specification
    Fmt.format("{2}, {1}, {0}", "a", "b", "c");

    // Fill and align
    Fmt.format("{:*<6}", "x");
    Fmt.format("{:*>6}", "x");
    Fmt.format("{:*^6}", "x");

    // Scientific notation
    Fmt.format("{:.2e}", 1);

    // Supported arguments are boolean, string, char, number and bigint
    Fmt.format("{:s} {:s} {:c} {:d} {:d}", true, "string", "c", 10, BigInt("999"));

    // etc.

### class FormatError

    import Fmt from "@sbrockma/std-format";

    try {
        let str = Fmt.format("{:s}", 42));
    } 
    catch(e) {
        if(e instanceof Fmt.FormatError) {
            console.error(e);
        }
    }

### function setLocale(locale)

Decimal and grouping separators are decided by locale when formatting with type specifier "n" or locale specifier "L".

    import Fmt from "@sbrockma/std-format";

    // Use default locale
    Fmt.setLocale();

    // Use locale "en-UK"
    Fmt.setLocale("en-UK");

## Old Declarations

Decided to simplify to declaration names without std-prefix. However, these old declarations work too.

### function stdFormat(formatString, ...args)

Was replaced by format(formatString, ...args).

### function stdSpecificationHint("pyhon" | "cpp" | "js")

Specification hint was me trying to be smart and support both Python and C++ language ways:
 * "python": octal prefix is "0o", boolean strings are "True" and "False"
 * "cpp": octal prefix is "0", boolean strings are "true" and "false"
 * "js": octal prefix is "0o", boolean strings are "true" and "false"

Using format() function instead the result is not affected by specification hint:
 * octal prefix is "0o", boolean strings are "true" and "false".

### function stdLocaleHint(locale)

Was replaced by setLocale(locale).

### class StdFormatError

Was replaced by class FormatError.
