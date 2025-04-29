import { FormatStringParser } from "format-string-parser";
import { FormatError } from "./format-error";
import { setLocale } from "./set-locale";
import { assert } from "./internal";
import { LRUCache } from "./LRU-cache";

// Use cache as warned message set.
const warnedMessages = new LRUCache<string, boolean>(10);

// Warn message to console once.
function warnOnce(msg: string) {
    if(warnedMessages.get(msg) === true) {
        return;
    }
    console.warn("[std-format] " + msg);
    warnedMessages.set(msg, true);
}

/**
 * @deprecated This is alias to FormatError.
 * @public
 */
export const StdFormatError = FormatError;

/**
 * @deprecated Use format() instead.
 * @public
 */
export function stdFormat(formatString: string, ...formatArgs: unknown[]): string {
    warnOnce("Function stdFormat() is deprecated. Use function format() instead.");

    return FormatStringParser.exec(formatString, formatArgs, true);
}

/**
 * @deprecated Use setLocale() instead.
 * @public
 */
export function stdLocaleHint(locale?: string | undefined) {
    warnOnce("Function stdLocaleHint() is deprecated. Use function setLocale() instead.");

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
    warnOnce("Function stdSpecificationHint() is deprecated. There is no replacement.");

    assert(specHint === "cpp" || specHint === "python" || specHint === "js", "Invalid specification hint '" + specHint + "'");

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
}
