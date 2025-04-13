import { assert, getNumber, isInteger, mapDigitToChar, repeatString } from "./internal";
import { FormatSpecification } from "./format-specification";
import { ThrowFormatError } from "./format-error";
import { NumberConverter } from "./number-converter";
import { localeDecimalSeparator, localeGroupSeparator } from "./set-locale";

// Get number prefix.
function getNumberPrefix(fs: FormatSpecification) {
    return fs.sharp === "#" ? (
        fs.hasType("xX") ? "0x" : fs.hasType("bB") ? "0b" : fs.hasType("o") ? fs.parser.getOctalPrefix() : ""
    ) : "";
}

// Get grouping properties
function getGroupingProps(fs: FormatSpecification): { decimalSeparator: string, groupSeparator: string, groupSize: number } {
    if (fs.grouping === ",") {
        return { decimalSeparator: ".", groupSeparator: ",", groupSize: 3 }
    }
    else if (fs.grouping === "_") {
        if (fs.hasType("deEfF%gG")) {
            return { decimalSeparator: ".", groupSeparator: "_", groupSize: 3 }
        }
        else if (fs.hasType("bBoxX")) {
            // With binary, octal and hexadecimal type specifiers group size is 4.
            return { decimalSeparator: ".", groupSeparator: "_", groupSize: 4 }
        }
    }
    else if (fs.locale) {
        // The L option causes the locale-specific form to be used.
        // Use locale's decimal and group separators.
        return { decimalSeparator: localeDecimalSeparator, groupSeparator: localeGroupSeparator, groupSize: 3 }
    }
    else if (fs.hasType("n")) {
        // Use locale's decimal and group separators.
        return { decimalSeparator: localeDecimalSeparator, groupSeparator: localeGroupSeparator, groupSize: 3 }
    }

    // If no grouping then set grouping separator to empty string and group size to Infinity.
    return { decimalSeparator: ".", groupSeparator: "", groupSize: Infinity }
}

// Get char code
function getCharCode(value: number | bigint, fs: FormatSpecification): number {
    try {
        // Is char code valid integer and in range?
        let charCode = getNumber(value);
        assert(isInteger(charCode) && charCode >= 0 && charCode <= 65535, "Invalid char code.");
        return charCode;
    }
    catch (e) {
        ThrowFormatError.throwInvalidArgumentForType(fs.parser, value, fs.type);
    }
}

// Convert this number to string.
export function formatNumber(value: number | bigint, fs: FormatSpecification): string {
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

    const getSign = (v: number) => v < 0 ? "-" : ((fs.sign === "+" || fs.sign === " ") ? fs.sign : "");

    if (fs.hasType("c")) {
        // Is char? Set digits string to contain single char obtained from char code.
        digits = String.fromCharCode(getCharCode(value, fs));

        // Other props empty.
        sign = exp = prefix = "";
    }
    else if (typeof value === "number" && isNaN(value)) {
        // Is nan?
        prefix = "";
        sign = getSign(value);
        digits = "nan";
        exp = "";
    }
    else if (typeof value === "number" && Math.abs(value) === Infinity) {
        // Is inf?
        prefix = "";
        sign = getSign(value);
        digits = "inf";
        exp = "";
    }
    else {
        let n = new NumberConverter(value, fs);

        sign = getSign(n.sign);

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

        // Get grouping props.
        let groupingProps = getGroupingProps(fs);

        // Split digits to integer and fractional parts.
        let intDigits = n.digits.slice(0, n.dotPos);
        let fracDigits = n.digits.slice(n.dotPos);

        if (groupingProps.groupSeparator === "" || intDigits.length <= groupingProps.groupSize) {
            // No grouping required.
            // Add integer digits.
            digits = intDigits.map(mapDigitToChar).join("");
        }
        else {
            // Grouping required.
            digits = "";

            // Get group count.
            let groupCount = Math.ceil(intDigits.length / groupingProps.groupSize);

            // Add groups' digits separated by group separator.
            for (let g = groupCount - 1; g >= 0; g--) {
                let start = intDigits.length - (g + 1) * groupingProps.groupSize;
                let end = intDigits.length - g * groupingProps.groupSize;
                let groupDigits = intDigits.slice(Math.max(0, start), end).map(mapDigitToChar).join("");
                digits += groupDigits + (g > 0 ? groupingProps.groupSeparator : "");
            }
        }

        // Is there fraction digits?
        if (fracDigits.length > 0) {
            // Add decimal separator and fraction digits.
            digits += groupingProps.decimalSeparator + fracDigits.map(mapDigitToChar).join("");
        }

        // Include dot after last digit if sharp specifier is '#' with some type specifiers.
        if (n.dotPos === n.digits.length && fs.sharp === "#" && fs.hasType("eEfF%gGaA")) {
            digits += ".";
        }

        // Get prefix.
        prefix = getNumberPrefix(fs);

        // Omit octal prefix "0" if digits is "0".
        if (prefix === "0" && digits === "0") {
            prefix = "";
        }
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
