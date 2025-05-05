import { FloatWrapper, IntWrapper } from "./number-wrapper";
import { FormatStringParser } from "./format-string-parser";
import { GroupingInfo } from "./grouping-info";

/**
 * Main format function.
 * @public
 **/
export function format(formatString: string, ...formatArgs: unknown[]): string {
    return FormatStringParser.exec(formatString, formatArgs);
}

/**
 * @public
 */
export function int(value?: unknown): unknown {
    return value === undefined || value === null ? value : new IntWrapper(value);
}

/**
 * @public
 */
export function float(value?: unknown): unknown {
    return value === undefined || value === null ? value : new FloatWrapper(value);
}

/** 
 * Set locale
 * @public
 */
export function setLocale(locale?: string) {
    GroupingInfo.setLocale(locale);
}

/**
 * Exceoption class, trown on format and value errors.
 * @public
 */
export class FormatError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "FormatError";
        // console.log(this.message);
    }
}

/**
 * Create default export.
 * @public 
 */
const DefaultExport = { format, int, float, setLocale, FormatError }
export default DefaultExport;
