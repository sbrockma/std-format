// Import
import { format } from "./format";
import { int, float } from "./int-float";
import { setLocale } from "./set-locale";
import { FormatError } from "./format-error";

/**
 * Default export.
 * @public 
 */
const DefaultExport = { format, int, float, setLocale, FormatError }
export default DefaultExport;

// Named exports.
export { format, int, float, setLocale, FormatError }

// Log lib loaded to console.
declare const __LIB_VERSION__: string;
console.log("[std-format] Loaded version " + __LIB_VERSION__);
