import { FormatStringParser } from "./format-string-parser";

/**
 * Main format function.
 * @public
 **/
export function format(formatString: string, ...formatArgs: unknown[]): string {
    return FormatStringParser.exec(formatString, formatArgs, false);
}
