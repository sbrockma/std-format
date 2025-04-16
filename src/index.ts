// Import
import { format } from "./format";
import { setLocale } from "./set-locale";
import { FormatError } from "./format-error";
import { int, float } from "./int-float";
import { stdFormat, stdSpecificationHint, stdLocaleHint, StdFormatError } from "./deprecated";

// Default export
export default {
    format, setLocale, FormatError, int, float,
    stdFormat, stdSpecificationHint, stdLocaleHint, StdFormatError
}

// Named exports
export {
    format, setLocale, FormatError, int, float,
    stdFormat, stdSpecificationHint, stdLocaleHint, StdFormatError
}
