import { FormatStringParser } from "./format-string-parser";

export function format(formatString: string, ...formatArgs: unknown[]): string {
    return FormatStringParser.exec(formatString, formatArgs, false);
}
