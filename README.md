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
    import { stdFormat, StdFormatError, stdSpecificationHint } from "@sbrockma/std-format";
    
    let str = stdFormat("Hello {}!", "World");
    
## Format specification

Both Python and C++ format specifications are parsed.

The format is:

    [[fill]align][sign]["z"]["#"]["0"][width][grouping]["." precision]["L"][type]


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

    // And so on...

### Class StdFormatError

    try {
        let str = stdFormat("{:s}", 42)); // Argument 42 is not string.
    } 
    catch(e) {
        if(e instanceof StdFormatError) {
            console.error(e.toString());
        }
    }

### Function stdSpecificationHint

    stdSpecificationHint("cpp");
    stdSpecificationHint("python");

If "python" then:
* Octal numbers have prefix "0o"
* Boolean string is "True" or "False"

If "cpp" then:
* Octal numbers have prefix "0"
* Boolean string is "true" or "false"
