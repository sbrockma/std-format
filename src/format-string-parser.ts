import { AssertionError, isInteger, repeatString } from "./internal";
import { deprecatedFalseString, deprecatedOctalPrefix, deprecatedTrueString } from "./deprecated";
import { FormatSpecification } from "./format-specification";
import { formatNumber } from "./number-formatter";
import { formatString } from "./string-formatter";
import { ThrowFormatError } from "./format-error";

/**
 * https://en.cppreference.com/w/cpp/utility/format/spec
 * https://docs.python.org/3/library/string.html#formatspec
 * 
 * [[fill]align][sign]["z"]["#"]["0"][width][grouping_option]["." precision][L][type]
 */

export type FormatSpecifiers = {
    fill?: string,
    align?: string,
    sign?: string,
    zeta?: string,
    sharp?: string,
    zero?: string,
    width?: string,
    width_field_n?: string,
    grouping?: string,
    precision?: string,
    precision_field_n?: string,
    locale?: string,
    type?: string
}

// The format specification regex. THis is combination of c++ and python specifications.
const FormatSpecificationRegExString =
    "((?<fill>[^{}]?)(?<align>[<^>=]))?" + // fill (any char except '{' or '}') and align
    "(?<sign>[-+ ])?" + // sign
    "(?<zeta>[z])?" + // z
    "(?<sharp>[#])?" + // #
    "(?<zero>[0])?" + // 0
    "((?<width>\\d+)|\{(?<width_field_n>\\d*)\})?" + // width
    "(?<grouping>[,_])?" +  // , or _
    "(\.((?<precision>\\d+)|\{(?<precision_field_n>\\d*)\}))?" + // precision
    "(?<locale>[L])?" + // L
    "(?<type>[s?cdnbBoxXeEfF%gGaA])?"; // type

// Replacement field regex.
const ReplacementFieldRegEx = new RegExp(
    "^\{" +
    "(?<field_n>\\d+)?" +
    "(\:" + FormatSpecificationRegExString + ")?" +
    "\}"
);

// Regex to test if string loosely matches of replacement field.
const LooseMatchReplacementFieldRegEx = new RegExp(
    "^\{" +
    "[^{}]*" +
    "(:([^{}]*" + "\{[^{}]*\}" + "){0,2}[^{}]*)?" +
    "\}"
);

// Get replacement field string that looks like replacement field but could be invalid.
function getLooseMatchReplacementFieldString(p: FormatStringParser): string | undefined {
    let m = LooseMatchReplacementFieldRegEx.exec(p.parseString);
    return m && m[0] ? m[0] : undefined;
}

// Regex to get index of next curly bracet.
const CurlyBracesRegEx = /[{}]/;

// Regex for one or more digits.
const DigitsRegex = /^\d+$/;

// Test if string contains one or more digits.
function isDigits(str: string): boolean {
    return str.length > 0 && DigitsRegex.test(str);
}

// This parsing context contains all necessary variables required in parsing.
export class FormatStringParser {
    parseString: string;
    parsePosition: number;
    resultString: string;
    errorString: string;
    automaticFieldNumber: number;
    hasAutomaticFieldNumbering: boolean;
    hasManualFieldSpecification: boolean;

    private constructor(readonly formatString: string, readonly formatArgs: unknown[], readonly usingDeprecatedStdFormat: boolean) {
        this.parseString = formatString;
        this.parsePosition = 0;
        this.resultString = "";
        this.errorString = "";
        this.automaticFieldNumber = 0;
        this.hasAutomaticFieldNumbering = false;
        this.hasManualFieldSpecification = false;
    }

    // Formats replacement field.
    private formatReplacementField(arg: unknown, fs: FormatSpecification): string {
        // Validate format specification.
        fs.validate(arg);

        // Get align.
        let { align } = fs;

        // Convert to valid argument: string or number.
        let argStr: string;

        // Is type specifier number compatible?
        let isFsTypeNumberCompatible = fs.hasType("", "cdnbBoxXeEfF%gGaA");

        function formatNum(arg: number | bigint): string {
            // Default align for number is right.
            align ??= ">";

            // Format number to string.
            return formatNumber(arg, fs);
        }

        function formatStr(arg: string): string {
            // Default align for string is left.
            align ??= "<";

            // Apply string formatting.
            return formatString(arg, fs);
        }

        if (typeof arg === "boolean") {
            // Argument can be boolean.
            if (fs.hasType("", "s")) {
                // Convert boolean to string, if type is default '' or string 's'.
                let b = fs.parser.getBooleanString(arg);
                argStr = formatStr(b);
            }
            else if (isFsTypeNumberCompatible) {
                // Convert boolean to number 0 or 1.
                argStr = formatNum(arg ? 1 : 0);
            }
            else {
                // Invalid argument conversion from boolean.
                ThrowFormatError.throwInvalidArgumentForType(this, arg, fs.type);
            }
        }
        else if (typeof arg === "number" || typeof arg === "bigint") {
            // Argument can be number or bigint.
            if (isFsTypeNumberCompatible) {
                // Use number argument as it is.
                argStr = formatNum(arg);
            }
            else {
                // Invalid argument conversion from number.
                ThrowFormatError.throwInvalidArgumentForType(this, arg, fs.type);
            }
        }
        else if (typeof arg === "string") {
            // Argument can be string.
            if (fs.hasType("cdnxXobB") && arg.length === 1) {
                // If type is integer then use single char string as char and convert it to char code (integer).
                argStr = formatNum(arg.charCodeAt(0));
            }
            else if (fs.hasType("", "s?")) {
                // Else use string argument as it is.
                argStr = formatStr(arg);
            }
            else {
                // Invalid argument conversion from string.
                ThrowFormatError.throwInvalidArgumentForType(this, arg, fs.type);
            }
        }
        else {
            // Invalid argument type.
            ThrowFormatError.throwInvalidArgumentForType(this, arg, fs.type);
        }

        // Next apply fill and alignment according to format specification.

        // Get width of field or 0 if not given.
        let width = fs.width ?? 0;

        // Calculate fillCount
        let fillCount = Math.max(0, width - argStr.length);

        // Get fill char.
        let fillChar = fs.fill ?? fs.zero ?? " ";

        // Initialize replacement string.
        let replacementStr: string = argStr;

        // Modify replacement string if filling is required.
        if (fillCount > 0) {
            switch (align) {
                case "<":
                    // Field is left aligned. Add filling to right.
                    replacementStr = argStr + repeatString(fillChar, fillCount);
                    break;
                case "^":
                    // Field is center aligned. Add filling to left and right right.
                    replacementStr = repeatString(fillChar, Math.floor(fillCount / 2)) + argStr + repeatString(fillChar, Math.ceil(fillCount / 2));
                    break;
                case ">":
                    // Field is right aligned. Add filling to left.
                    replacementStr = repeatString(fillChar, fillCount) + argStr;
                    break;
            }
        }

        // Return final replacement string.
        return replacementStr;
    }

    // Function to get argument from formatArgs[fieldNumber].
    getArgument(fieldNumberStr: string): unknown {
        // Get field number
        let fieldNumber: number;

        // Is field number string empty?
        if (fieldNumberStr.length > 0) {
            // Use manual field specification.
            this.hasManualFieldSpecification = true;

            // Throw exception if field number string is not one or more digits.
            if (!isDigits(fieldNumberStr)) {
                ThrowFormatError.throwInvalidFieldNumber(this, fieldNumberStr);
            }

            // Convert field number string to number
            fieldNumber = +fieldNumberStr;
        }
        else {
            // Use automatic field numbering.
            this.hasAutomaticFieldNumbering = true;

            // Get ascending field number
            fieldNumber = this.automaticFieldNumber++;
        }

        // Throw exception switching between automatic and manual field numbering.
        if (this.hasAutomaticFieldNumbering && this.hasManualFieldSpecification) {
            ThrowFormatError.throwSwitchBetweenAutoAndManualFieldNumbering(this);
        }

        // Throw exception if field number is out of bounds of arguments array.
        if (fieldNumber < 0 || fieldNumber >= this.formatArgs.length) {
            ThrowFormatError.throwInvalidFieldNumber(this, "" + fieldNumber);
        }

        // Return argument.
        return this.formatArgs[fieldNumber];
    }

    // Function to get nested argument integer. Width and precision in format specification can be
    // in form of nested curly braces {:{width field number}.{precision field number}}
    getNestedArgumentInt(fieldNumberStr: string): number {
        // Get the argument
        let arg = this.getArgument(fieldNumberStr);

        // Nested argument is used for width and precision. Must be integer >= 0.
        if (isInteger(arg) && arg >= 0) {
            // Return nested argument integer.
            return arg;
        } else {
            // Throw invalid nested argument error.
            ThrowFormatError.throwInvalidNestedArgument(this, arg);
        }
    }

    // Function to parse replacement field.
    private parseReplacementField(): boolean {
        // Replacement field starts with "{".
        if (this.parseString[0] !== "{") {
            // Failed to parse replacement field, return false.
            return false;
        }

        // Match string.
        let matchString: string;

        // Replacement field match, or undefined for simple cases "{}" and "{d}".
        let formatSpecifiers: FormatSpecifiers | undefined;

        // Field number n of "{n:}".
        let fieldNumber: string;

        if (this.parseString[1] === "}") {
            // Special case where match string is simple "{}"

            // Set match string
            matchString = this.parseString.substring(0, 2);

            // Has no format specifiers.
            formatSpecifiers = undefined;

            // Has no field number.
            fieldNumber = "";
        }
        else if (this.parseString[2] === "}" && isDigits(this.parseString[1])) {
            // Special case where match string is simple "{d}".

            // Set match string.
            matchString = this.parseString.substring(0, 3);

            // Has no format specifiers.
            formatSpecifiers = undefined;

            // Has single digit field number.
            fieldNumber = this.parseString[1];
        }
        else {
            // Execute replacement field regex.
            let replFieldMatch = ReplacementFieldRegEx.exec(this.parseString)

            if (!replFieldMatch || !replFieldMatch[0] || !replFieldMatch.groups) {
                // Failed to parse replacement field, return false.
                return false;
            }

            // Set match string
            matchString = replFieldMatch[0];

            // Set format specifiers.
            formatSpecifiers = <FormatSpecifiers>replFieldMatch.groups;

            // Set field number.
            fieldNumber = replFieldMatch.groups.field_n ?? "";
        }


        // Set error string.
        this.errorString = matchString;

        // Get argument.
        let arg = this.getArgument(fieldNumber);

        // Create format specification.
        let fs = new FormatSpecification(this, formatSpecifiers);

        // Format replacement field and add it to result string.
        this.resultString += this.formatReplacementField(arg, fs);

        // Jump over matched replacement field in  parsing string.
        this.parseString = this.parseString.substring(matchString.length);
        this.parsePosition += matchString.length;

        // Parsed replacement field ok, return true.
        return true;
    }

    // Get next curly brace index, or end of parsing string if no curly braces found.
    private getNextCurlyBraceIndex(): number {
        let id = CurlyBracesRegEx.exec(this.parseString)?.index;
        return (id === undefined || id < 0) ? this.parseString.length : id;
    }

    // Function to parse format string.
    private parseFormatString() {
        // Loop until terminated by break.
        while (true) {
            // Jump to next curly brace "{" or "}" or end of parsing string.
            let i = this.getNextCurlyBraceIndex();

            // Add ordinary string to result string.
            this.resultString += this.parseString.substring(0, i);

            // Jump over non-formatting part in parsing.
            this.parseString = this.parseString.substring(i);
            this.parsePosition += i;

            // Now parsing string starts with "{", "}", or is empty.

            if (this.parseString.startsWith("{{") || this.parseString.startsWith("}}")) {
                // If parsing string starts with double curly braces
                // Then add single curly brace to result string.
                this.resultString += this.parseString[0];

                // Jump over double curly braces on parsing string.
                this.parseString = this.parseString.substring(2);
                this.parsePosition += 2;

                // Continue parsing on next loop.
                continue;
            }
            else if (this.parseString.startsWith("}")) {
                // Encountered single '}' ff parsing string starts with '}'.
                this.errorString = "}";
                ThrowFormatError.throwEncounteredSingleCurlyBrace(this);
            }
            else if (this.parseString.startsWith("{")) {
                // If parsing string starts with '{' then parse replacement field.
                // Throw exception if it returns false (parsing replacement field failed).
                if (!this.parseReplacementField()) {
                    // For more precise error message get loose match replacement field string.
                    let str = getLooseMatchReplacementFieldString(this);
                    if (str) {
                        this.errorString = str;
                        // Got loose match of replacement field string that just failed to parse.
                        ThrowFormatError.throwInvalidReplacementField(this);
                    }
                    else {
                        // Ecountered single '{' followed by random stuff.
                        this.errorString = "{";
                        ThrowFormatError.throwEncounteredSingleCurlyBrace(this);
                    }
                }

                // Continue parsing on next loop.
                continue;
            }
            else {
                // Did not find any curly braces. Parsing was executed to end of string.
                // Break out of while loop.
                break;
            }
        }
    }

    getOctalPrefix() {
        return this.usingDeprecatedStdFormat ? deprecatedOctalPrefix : "0o";
    }

    getBooleanString(b: boolean) {
        return this.usingDeprecatedStdFormat ? (b ? deprecatedTrueString : deprecatedFalseString) : (b ? "true" : "false");
    }

    static exec(formatString: string, formatArgs: unknown[], usingDeprecatedStdFormat: boolean): string {
        try {
            // Init parser.
            let parser = new FormatStringParser(formatString, formatArgs, usingDeprecatedStdFormat);

            // Parse format string.
            parser.parseFormatString();

            // Return result string.
            return parser.resultString;
        }
        catch (e) {
            // Log internal error to console.
            if (e instanceof AssertionError) {
                console.error(e);
            }

            // Throw exception forward.
            throw e;
        }
    }
}
