// Import
import { format } from "./format";
import { setLocale } from "./set-locale";
import { FormatError } from "./format-error";
import { stdFormat, stdSpecificationHint, stdLocaleHint, StdFormatError } from "./deprecated";

// Default export
/** @public */
const DefaultExport = {
    format, setLocale, FormatError,
    stdFormat, stdSpecificationHint, stdLocaleHint, StdFormatError
}

export default DefaultExport;
export {
    format, setLocale, FormatError,
    stdFormat, stdSpecificationHint, stdLocaleHint, StdFormatError
}
