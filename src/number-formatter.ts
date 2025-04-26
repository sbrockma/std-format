import { assert, getSymbol, isInteger, isValidCodePoint, mapDigitToChar, repeatString } from "./internal";
import { FormatSpecification } from "./format-specification";
import { ThrowFormatError } from "./format-error";
import { NumberConverter } from "./number-converter";
import { getLocaleGroupingInfo } from "./set-locale";
import { GroupingInfo } from "./grouping-info";
import { NumberWrapper } from "./int-float";

// Get number prefix.
function getNumberPrefix(fs: FormatSpecification) {
    return fs.sharp === "#" ? (
        fs.hasType("xX") ? "0x" : fs.hasType("bB") ? "0b" : fs.hasType("o") ? fs.parser.getOctalPrefix() : ""
    ) : "";
}

// Get grouping info
function getGroupingInfo(fs: FormatSpecification): GroupingInfo {
    if (fs.grouping === ",") {
        // Use comma with 3 digits gropuing.
        return GroupingInfo.comma3;
    }
    else if (fs.grouping === "_") {
        if (fs.hasType("deEfF%gG")) {
            // Use underscore with 3 digits gropuing.
            return GroupingInfo.underscore3;
        }
        else if (fs.hasType("bBoxX")) {
            // Use underscore with 4 digits gropuing.
            return GroupingInfo.underscore4;
        }
    }
    else if (fs.locale) {
        // The L option causes the locale-specific form to be used.
        // Use locale's grouping.
        return getLocaleGroupingInfo();
    }
    else if (fs.hasType("n")) {
        // Use locale's grouping.
        return getLocaleGroupingInfo();
    }

    // No grouping.
    return GroupingInfo.noGrouping;
}

// Get valid code point
function toValidCodePoint(value: number | NumberWrapper, fs: FormatSpecification): number {
    try {
        // Is code point valid integer and in range?
        let codePoint = value instanceof NumberWrapper ? value.toSafeNumber() : value;
        assert(isValidCodePoint(codePoint), "Invalid code point value: " + codePoint);
        return codePoint;
    }
    catch (e) {
        ThrowFormatError.throwCannotFormatArgumentAsType(fs.parser, value, fs.type);
    }
}

function applyGrouping(fs: FormatSpecification, intDigits: string) {
    // Get grouping props.
    let groupingInfo = getGroupingInfo(fs);

    if (groupingInfo.hasGrouping()) {
        // Has grouping.
        let intDigitGroups: string[] = [];

        // Create digit groups according to grouping propertie's group sizes.
        for (let digitsLeft = intDigits.length, groupId = 0; digitsLeft > 0; groupId++) {
            // Get group size for groupId.
            let groupSize = groupingInfo.getGroupSize(groupId);

            // Add group of integer digits.
            intDigitGroups.unshift(intDigits.slice(Math.max(0, digitsLeft - groupSize), digitsLeft));

            // Subtract digits left by group size.
            digitsLeft -= groupSize;
        }

        // Join integer digit groups separated by grouping separator.
        return intDigitGroups.join(groupingInfo.getGroupingSeparator());
    }
    else {
        // Has no grouping.
        return intDigits;
    }
}

// Convert this number to string.
export function formatNumber(value: number | NumberWrapper, fs: FormatSpecification): string {
    // Set sign. "-", "+", " " or "".
    let sign: string;

    // Prefix string. "0x" for hexadecimal, etc.
    let prefix: string;

    // Digits string.
    let digits: string;

    // Exponent string.
    let exp: string;

    // Postfix string. "%" for percentage types, or "".
    let postfix: string = fs.hasType("%") ? "%" : "";

    if (fs.hasType("c") && (typeof value === "number" || NumberWrapper.isIntType(value))) {
        // Set digits string to contain single symbol.
        digits = getSymbol(toValidCodePoint(value, fs));

        // Other props empty.
        sign = exp = prefix = "";
    }
    else if (typeof value === "number" && isNaN(value) || value instanceof NumberWrapper && value.isNaN()) {
        // Is nan?
        prefix = "";
        sign = fs.getSignChar(value instanceof NumberWrapper ? value.isNegative() : value < 0);
        digits = "nan";
        exp = "";
    }
    else if (typeof value === "number" && Math.abs(value) === Infinity || value instanceof NumberWrapper && value.isInfinity()) {
        // Is inf?
        prefix = "";
        sign = fs.getSignChar(value instanceof NumberWrapper ? value.isNegative() : value < 0);
        digits = "inf";
        exp = "";
    }
    else if (fs.hasType("") && NumberWrapper.isIntType(value) || fs.hasType("dnbBoxX") && (NumberWrapper.isIntType(value) || isInteger(value))) {
        // Get target base
        let base = fs.hasType("bB") ? 2 : fs.hasType("o") ? 8 : fs.hasType("xX") ? 16 : 10;

        // Convert value to string.
        let valueStr = value.toString(base);

        // Remove sign.
        if (valueStr[0] === "-") {
            valueStr = valueStr.substring(1);
        }

        // Get sign.
        sign = fs.getSignChar(value instanceof NumberWrapper ? value.isNegative() : value < 0);

        // Apply grouping.
        digits = applyGrouping(fs, valueStr);

        // No exponent.
        exp = "";

        // Get prefix.
        prefix = getNumberPrefix(fs);
    }
    else if (fs.hasType("", "eEfF%gGaA") && (typeof value === "number" || NumberWrapper.isFloatType(value))) {
        let n = new NumberConverter(value instanceof NumberWrapper ? value.toSafeNumber() : value, fs);

        sign = fs.getSignChar(n.sign < 0);

        // Some type specifiers do not show zero exponent.
        let omitZeroExp = !fs.hasType("eEaA");

        // Some type specifiers add zero prefix to single digit exponent.
        let needTwoDigitExp = fs.hasType("", "eEgG");

        if (n.exp === 0 && omitZeroExp) {
            // No zero exponent.
            exp = "";
        }
        else {
            // Get exponent to string. Absolute value for now.
            exp = "" + Math.abs(n.exp);

            // Add leading zero if exponent needs at least two digits.
            if (exp.length < 2 && needTwoDigitExp) {
                exp = "0" + exp;
            }

            // Format exponent string. Add "p" (norm. hex. exp. ntt) or "e",
            // sign, and absolute value of exponent.
            exp = (n.base === 16 ? "p" : "e") + (n.exp < 0 ? "-" : "+") + exp;
        }

        // Split digits to integer and fractional parts.
        let intDigits = n.digits.slice(0, n.dotPos).map(mapDigitToChar).join("");
        let fracDigits = n.digits.slice(n.dotPos).map(mapDigitToChar).join("");

        // Apply grouping to int part.
        digits = applyGrouping(fs, intDigits);

        // Get grouping info.
        let groupingInfo = getGroupingInfo(fs);

        // Is there fraction digits?
        if (fracDigits.length > 0) {
            // Add decimal separator and fraction digits.
            digits += groupingInfo.getDecimalSeparator() + fracDigits;
        }
        else if (n.dotPos === n.digits.length && fs.sharp === "#") {
            // Add decimal separator after last digit if sharp specifier is '#'.
            digits += groupingInfo.getDecimalSeparator();
        }

        // Get prefix.
        prefix = getNumberPrefix(fs);
    }
    else {
        // Invalid argument for type
        ThrowFormatError.throwCannotFormatArgumentAsType(fs.parser, value, fs.type);
    }

    // Omit octal prefix "0" if digits is "0".
    if (prefix === "0" && digits === "0") {
        prefix = "";
    }

    // Get formatting width for number related filling.
    let width = fs.width ?? 0;

    // Get count of fill characters.
    // It is width minus sign, prefix, digits, exponent, and postfix.
    let fillCount = Math.max(0, width - sign.length - prefix.length - digits.length - exp.length - postfix.length);

    // Fill character.
    let fillChar: string;

    // Here we only add filling that occurs between sign (or prefix) and digits.
    // That means if align is '=' or if align is not defined and '0' is specified.
    if (fs.align === "=") {
        fillChar = fs.fill ?? fs.zero ?? " ";
    }
    else if (fs.align === undefined && fs.zero !== undefined) {
        fillChar = fs.zero;
    }
    else {
        fillChar = "";
        fillCount = 0;
    }

    // Form final string representation by adding all components and fill.
    let str = sign + prefix + repeatString(fillChar, fillCount) + digits + exp + postfix;

    // Convert to uppercase if specified by format specification.
    return fs.hasType("BXEFGA") ? str.toUpperCase() : str;
}
