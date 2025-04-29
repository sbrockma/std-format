// Import
import { format } from "./format";
import { int, float } from "./int-float";
import { setLocale } from "./set-locale";
import { FormatError } from "./format-error";
import { stdFormat, stdSpecificationHint, stdLocaleHint, StdFormatError } from "./deprecated";

/**
 * Default export.
 * @public 
 */
const DefaultExport = {
    format, int, float, setLocale, FormatError,
    stdFormat, stdSpecificationHint, stdLocaleHint, StdFormatError
}
export default DefaultExport;

// Named exports.
export {
    format, int, float, setLocale, FormatError,
    stdFormat, stdSpecificationHint, stdLocaleHint, StdFormatError
}

// Log lib loaded to console.
declare const __LIB_VERSION__: string;
console.log("[std-format] Loaded version " + __LIB_VERSION__);
