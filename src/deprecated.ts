import { FormatStringParser } from "format-string-parser";
import { FormatError, ThrowFormatError } from "./format-error";
import { setLocale } from "./set-locale";

/**
 * @deprecated This is alias to FormatError.
 * @public
 */
export const StdFormatError = FormatError;

let stdFormatWarned = false;
let stdSpecificationHintWarned = false;
let stdLocaleHintWarned = false;

/**
 * @deprecated Use format() instead.
 * @public
 */
export function stdFormat(formatString: string, ...formatArgs: unknown[]): string {
    if (!stdFormatWarned) {
        console.warn("std-format: function stdFormat() is deprecated. Use function format() instead.");
        stdFormatWarned = true;
    }

    return FormatStringParser.exec(formatString, formatArgs, true);
}

/**
 * @deprecated Use setLocale() instead.
 * @public
 */
export function stdLocaleHint(locale?: string | undefined) {
    if (!stdLocaleHintWarned) {
        console.warn("std-format: function stdLocaleHint() is deprecated. Use function setLocale() instead.");
        stdLocaleHintWarned = true;
    }

    setLocale(locale);
}

// The octal number prefix is "0o" in Python and "0" in C++.
export let deprecatedOctalPrefix: "0" | "0o" = "0o";
export let deprecatedTrueString: "true" | "True" = "True";
export let deprecatedFalseString: "false" | "False" = "False";

/**
 * @deprecated This has no replacement.
 * @public
 */
export function stdSpecificationHint(specHint: "cpp" | "python" | "js") {
    if (!stdSpecificationHintWarned) {
        console.warn("std-format: function stdSpecificationHint() is deprecated.");
        stdSpecificationHintWarned = true;
    }

    if (specHint === "cpp") {
        deprecatedOctalPrefix = "0";
        deprecatedTrueString = "true";
        deprecatedFalseString = "false";
    }
    else if (specHint === "python") {
        deprecatedOctalPrefix = "0o";
        deprecatedTrueString = "True";
        deprecatedFalseString = "False";
    }
    else if (specHint === "js") {
        deprecatedOctalPrefix = "0o";
        deprecatedTrueString = "true";
        deprecatedFalseString = "false";
    }
    else {
        // Invalid specification hint.
        ThrowFormatError.throwInvalidSpecificationHint(specHint);
    }
}
