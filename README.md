# std-format

std-format is a string formatting of curly braces notation for TS/JS.

It implements curly braces format specification for
[c++20](https://en.cppreference.com/w/cpp/utility/format/spec) and
[Python](https://docs.python.org/3/library/string.html#formatspec).

This is early release. Hoping to fix bugs and implement more features in future.

## Install

    npm install @sbrockma/std-format

## Import

    // Import default export.
    import fmt from "@sbrockma/std-format";
    
    // Or all named exports as fmt.
    // import * as fmt from "@sbrockma/std-format";

    let str = fmt.stdFormat("Hello {}!", "World");
    
Or
    
    // Import named exports.
    import { stdFormat } from "@sbrockma/std-format";
    
    let str = stdFormat("Hello {}!", "World");
    
## Format specification

Both Python and C++ format specifications are parsed.

The format is:

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
* [type] (optional) 's', 'c', 'b', 'B', 'o', 'd', 'x', 'X', 'a', 'A', 'e', 'E', 'f', 'F', 'g', 'G', '%', 'n', or '?' ('?' not yet implemented)

Not all specifiers are yet implemented.

See the C++ and Python links above for full format specification.

## Examples

### Function stdFormat

Here are some simple examples.

    // Automatic field numbering
    stdFormat("{}, {}, {}", "a", "b", "c");

    // Manual field specification
    stdFormat("{2}, {1}, {0}", "a", "b", "c");

    // Fill and align
    stdFormat("{:*<6}", "x");
    stdFormat("{:*>6}", "x");
    stdFormat("{:*^6}", "x");

    // Scientific notation
    stdFormat("{:.2e}", 1);

    // Supported arguments are boolean, string, char, number and bigint
    stdFormat("{:s} {:s} {:c} {:d} {:d}", true, "string", "c", 10, BigInt("999"));

    // And so on...

### Class StdFormatError

    try {
        // Raises exception because 42 is not string.
        let str = stdFormat("{:s}", 42));
    } 
    catch(e) {
        if(e instanceof StdFormatError) {
            console.error(e.toString());
        }
    }

### Function stdSpecificationHint(specificationHint)

    import { stdSpecificationHint } from "@sbrockma/std-format";
    
    stdSpecificationHint("cpp");
    stdSpecificationHint("python");

If "python" then:
* Octal numbers have prefix "0o"
* Boolean string is "True" or "False"

If "cpp" then:
* Octal numbers have prefix "0"
* Boolean string is "true" or "false"

### Function stdLocalerHint(locale)

    import { stdLocaleHint } from "@sbrockma/std-format";

    // Use locale "en-UK"
    stdLocaleHint("en-UK");

    // Use default locale
    stdLocaleHint();

Locale's decimal separator and group separator are used in number formatting when
using type specifier "n" or locale specifier "L".
