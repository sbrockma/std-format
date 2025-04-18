import { assert, AssertionError, getCodePoint, isInteger, isSingleSymbol, repeatString } from "./internal";
import { deprecatedFalseString, deprecatedOctalPrefix, deprecatedTrueString } from "./deprecated";
import { FormatSpecification } from "./format-specification";
import { formatNumber } from "./number-formatter";
import { formatString } from "./string-formatter";
import { ThrowFormatError } from "./format-error";
import { FloatWrapper, IntWrapper, int } from "./int-float";

// Regex to test if string loosely matches of replacement field.
const LooseMatchReplacementFieldRegEx = new RegExp(
    "^\{" +
    "([0-9]+)?" +
    "(:([^{}]*" + "\{[^{}]*\}" + "){0,2}[^{}]*)?" +
    "\}"
);

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
        assert(typeof this.formatString === "string", "Invalid format string!");

        this.parseString = this.formatString;
        this.parsePosition = 0;
        this.resultString = "";
        this.errorString = "";
        this.automaticFieldNumber = 0;
        this.hasAutomaticFieldNumbering = false;
        this.hasManualFieldSpecification = false;

        // Convert BigInts to ints.
        for (let i = 0; i < this.formatArgs.length; i++) {
            if (typeof this.formatArgs[i] === "bigint") {
                this.formatArgs[i] = int(this.formatArgs[i]);
            }
        }
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

        function formatNum(arg: number | IntWrapper | FloatWrapper): string {
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
        else if (typeof arg === "number" || arg instanceof IntWrapper || arg instanceof FloatWrapper) {
            // Argument can be number or int.
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
            if (fs.hasType("cdnxXobB") && isSingleSymbol(arg)) {
                // If type is integer then get code point from single symbol string.
                argStr = formatNum(getCodePoint(arg)!);
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
    private parseReplacementField(): void {
        assert(this.parseString[0] === "{");

        // Get replacement field match.
        let m = LooseMatchReplacementFieldRegEx.exec(this.parseString);

        if (m && m[0]) {
            let match = m[0];
            let fieldNumber = m[1] ?? "";
            let specifiers = (m[2] ?? ":").substring(1); // Remove ":" with substring(1)

            // Set error string.
            this.errorString = match;

            // Get argument.
            let arg = this.getArgument(fieldNumber);

            // Create format specification.
            let fs = new FormatSpecification(this, specifiers);

            // Format replacement field and add it to result string.
            this.resultString += this.formatReplacementField(arg, fs);

            // Jump over matched replacement field in parsing string.
            this.parseString = this.parseString.substring(match.length);
            this.parsePosition += match.length;
        }
        else {
            // Ecountered single '{' followed by random stuff.
            this.errorString = "{";
            ThrowFormatError.throwEncounteredSingleCurlyBrace(this);
        }
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

            if (this.parseString[0] === "{" && this.parseString[1] === "{" || this.parseString[0] === "}" && this.parseString[1] === "}") {
                // If parsing string starts with double curly braces
                // Then add single curly brace to result string.
                this.resultString += this.parseString[0];

                // Jump over double curly braces on parsing string.
                this.parseString = this.parseString.substring(2);
                this.parsePosition += 2;

                // Continue parsing on next loop.
                continue;
            }
            else if (this.parseString[0] === "}") {
                // Encountered single '}' ff parsing string starts with '}'.
                this.errorString = "}";
                ThrowFormatError.throwEncounteredSingleCurlyBrace(this);
            }
            else if (this.parseString[0] === "{") {
                // If parsing string starts with '{' then parse replacement field.
                this.parseReplacementField();

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
            // Log assertion error to console.
            if (e instanceof AssertionError) {
                console.error(e.toString());
            }

            // Throw exception forward.
            throw e;
        }
    }
}
