import { FormatSpecification } from "./format-specification";
import { ThrowFormatError } from "./format-error";
import { getStringRealLength, setStringRealLength } from "internal";

export function formatString(str: string, fs: FormatSpecification) {
    if (fs.hasType("?")) {
        // Here should format escape sequence string.
        ThrowFormatError.throwSpecifierIsNotImplemented(fs.parser, fs.type);
    }

    // For string presentation types precision field indicates the maximum
    // field size - in other words, how many characters will be used from the field content.
    if (fs.precision !== undefined && getStringRealLength(str) > fs.precision) {
        str = setStringRealLength(str, fs.precision);
    }

    return str;
}
