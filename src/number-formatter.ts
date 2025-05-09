import { assert, isInteger, mapDigitToChar, repeatString } from "./utils/common";
import { getSymbol, isValidCodePoint } from "./utils/char-coding";
import { ElementPresentation } from "./replacement-field";
import { NumberConverter } from "./number-converter";
import { GroupingInfo } from "./grouping-info";
import { NumberWrapper } from "./number-wrapper";
import { FormatStringParser } from "format-string-parser";

// Get number prefix.
function getNumberPrefix(ep: ElementPresentation) {
    return ep.sharp === "#" ? (
        ep.hasType("xX") ? "0x" : ep.hasType("bB") ? "0b" : ep.hasType("o") ? "0o" : ""
    ) : "";
}

// Get grouping info
function getGroupingInfo(ep: ElementPresentation): GroupingInfo {
    if (ep.grouping === ",") {
        // Use comma with 3 digits gropuing.
        return GroupingInfo.comma3;
    }
    else if (ep.grouping === "_") {
        if (ep.hasType("deEfF%gG")) {
            // Use underscore with 3 digits gropuing.
            return GroupingInfo.underscore3;
        }
        else if (ep.hasType("bBoxX")) {
            // Use underscore with 4 digits gropuing.
            return GroupingInfo.underscore4;
        }
    }
    else if (ep.locale) {
        // The L option causes the locale-specific form to be used.
        // Use locale's grouping.
        return GroupingInfo.getLocaleGroupingInfo();
    }
    else if (ep.hasType("n")) {
        // Use locale's grouping.
        return GroupingInfo.getLocaleGroupingInfo();
    }

    // No grouping.
    return GroupingInfo.noGrouping;
}

// Get valid code point
function toValidCodePoint(value: number | NumberWrapper, p: FormatStringParser, ep: ElementPresentation): number {
    try {
        // Is code point valid integer and in range?
        let codePoint = value instanceof NumberWrapper ? value.toSafeNumber() : value;
        assert(isValidCodePoint(codePoint), "Invalid code point value: " + codePoint);
        return codePoint;
    }
    catch (e) {
        p.throwCannotFormatArgumentAsType(value, ep.type);
    }
}

function applyGrouping(ep: ElementPresentation, intDigits: string) {
    // Get grouping props.
    let groupingInfo = getGroupingInfo(ep);

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
export function formatNumber(value: number | NumberWrapper, p: FormatStringParser, ep: ElementPresentation): string {
    // Set sign. "-", "+", " " or "".
    let sign: string;

    // Prefix string. "0x" for hexadecimal, etc.
    let prefix: string;

    // Digits string.
    let digits: string;

    // Exponent string.
    let exp: string;

    // Postfix string. "%" for percentage types, or "".
    let postfix: string = ep.hasType("%") ? "%" : "";

    if (ep.hasType("c") && (typeof value === "number" || NumberWrapper.isIntType(value))) {
        // Set digits string to contain single symbol.
        digits = getSymbol(toValidCodePoint(value, p, ep));

        // Other props empty.
        sign = exp = prefix = "";
    }
    else if (typeof value === "number" && isNaN(value) || value instanceof NumberWrapper && value.isNaN()) {
        // Is nan?
        prefix = "";
        sign = ep.getSignChar(value instanceof NumberWrapper ? value.isNegative() : value < 0);
        digits = "nan";
        exp = "";
    }
    else if (typeof value === "number" && Math.abs(value) === Infinity || value instanceof NumberWrapper && value.isInfinity()) {
        // Is inf?
        prefix = "";
        sign = ep.getSignChar(value instanceof NumberWrapper ? value.isNegative() : value < 0);
        digits = "inf";
        exp = "";
    }
    else if (ep.hasType("") && NumberWrapper.isIntType(value) || ep.hasType("dnbBoxX") && (NumberWrapper.isIntType(value) || isInteger(value))) {
        // Get target base
        let base = ep.hasType("bB") ? 2 : ep.hasType("o") ? 8 : ep.hasType("xX") ? 16 : 10;

        // Convert value to string.
        let valueStr = value.toString(base);

        // Remove sign.
        if (valueStr[0] === "-") {
            valueStr = valueStr.substring(1);
        }

        // Get sign.
        sign = ep.getSignChar(value instanceof NumberWrapper ? value.isNegative() : value < 0);

        // Apply grouping.
        digits = applyGrouping(ep, valueStr);

        // No exponent.
        exp = "";

        // Get prefix.
        prefix = getNumberPrefix(ep);
    }
    else if (ep.hasType("", "eEfF%gGaA") && (typeof value === "number" || NumberWrapper.isFloatType(value))) {
        let n = new NumberConverter(value instanceof NumberWrapper ? value.toSafeNumber() : value, p, ep);

        sign = ep.getSignChar(n.sign < 0);

        // Some type specifiers do not show zero exponent.
        let omitZeroExp = !ep.hasType("eEaA");

        // Some type specifiers add zero prefix to single digit exponent.
        let needTwoDigitExp = ep.hasType("", "eEgG");

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
        digits = applyGrouping(ep, intDigits);

        // Get grouping info.
        let groupingInfo = getGroupingInfo(ep);

        // Is there fraction digits?
        if (fracDigits.length > 0) {
            // Add decimal separator and fraction digits.
            digits += groupingInfo.getDecimalSeparator() + fracDigits;
        }
        else if (n.dotPos === n.digits.length && ep.sharp === "#") {
            // Add decimal separator after last digit if sharp specifier is '#'.
            digits += groupingInfo.getDecimalSeparator();
        }

        // Get prefix.
        prefix = getNumberPrefix(ep);
    }
    else {
        // Invalid argument for type
        p.throwCannotFormatArgumentAsType(value, ep.type);
    }

    // Get formatting width for number related filling.
    let width = ep.width ?? 0;

    // Get count of fill characters.
    // It is width minus sign, prefix, digits, exponent, and postfix.
    let fillCount = Math.max(0, width - sign.length - prefix.length - digits.length - exp.length - postfix.length);

    // Fill character.
    let fillChar: string;

    // Here we only add filling that occurs between sign (or prefix) and digits.
    // That means if align is '=' or if align is not defined and '0' is specified.
    if (ep.align === "=") {
        fillChar = ep.fill ?? ep.zero ?? " ";
    }
    else if (ep.align === undefined && ep.zero !== undefined) {
        fillChar = ep.zero;
    }
    else {
        fillChar = "";
        fillCount = 0;
    }

    // Form final string representation by adding all components and fill.
    let str = sign + prefix + repeatString(fillChar, fillCount) + digits + exp + postfix;

    // Convert to uppercase if specified by element presentation.
    return ep.hasType("BXEFGA") ? str.toUpperCase() : str;
}
