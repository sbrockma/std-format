// Import
import { format } from "./format";
import { setLocale } from "./set-locale";
import { FormatError } from "./format-error";
import { stdFormat, stdSpecificationHint, stdLocaleHint, StdFormatError } from "./deprecated";

// Default export
export default {
    format, setLocale, FormatError, 
    stdFormat, stdSpecificationHint, stdLocaleHint, StdFormatError
}

// Named exports
export {
    format, setLocale, FormatError, 
    stdFormat, stdSpecificationHint, stdLocaleHint, StdFormatError
}
