import { assert, getArrayDepth, getStringRealLength, getSymbolInfoAt, hasGoodProperty, isArray, isInteger, isMap, isRecord, isSet, mapToRecord, repeatString, setStringRealLength, setToArray } from "./internal";
import { deprecatedFalseString, deprecatedOctalPrefix, deprecatedTrueString } from "./deprecated";
import { FormatSpecification } from "./format-specification";
import { formatNumber } from "./number-formatter";
import { ThrowFormatError } from "./format-error";
import { IntWrapper, NumberWrapper } from "./int-float";

// Regex to test if string loosely matches of replacement field.
// Starts with '{', solves nested braces '{d}', until finally matched closing brace '}'.
const LooseMatchReplacementFieldRegEx = new RegExp("^\{([^{}]*(\{[0-9]*\})?)*[^{}]*\}");

// Regex to get index of next curly bracet.
const CurlyBracesRegEx = /[{}]/;

// Regex for one or more digits.
const DigitsRegex = /^\d+$/;

// Test if string contains one or more digits.
function isDigits(str: string): boolean {
    return str.length > 0 && DigitsRegex.test(str);
}

class PassToLeaf {
    constructor(readonly str: string) { }
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
    }

    // Formats argument.
    private formatArgument(arg: unknown, fs: FormatSpecification, curArrayDepth?: number, totArrayDepth?: number): string {
        // Validate format specification
        fs.validate(arg); // FIXME: Here or There

        // Is type specifier number compatible?
        let isFsTypeNumberCompatible = fs.hasType("", "cdnbBoxXeEfF%gGaA");

        if (typeof arg === "boolean") {
            // Argument can be boolean.
            if (fs.hasType("", "s")) {
                // Convert boolean to string, if type is default '' or string 's'.
                let b = fs.parser.getBooleanString(arg);
                return this.formatKnownArgument(b, fs, curArrayDepth, totArrayDepth);
            }
            else if (isFsTypeNumberCompatible) {
                // Convert boolean to number 0 or 1.
                return this.formatKnownArgument(arg ? 1 : 0, fs, curArrayDepth, totArrayDepth);
            }
        }
        else if (typeof arg === "number" || arg instanceof NumberWrapper) {
            // Argument can be number or int.
            if (isFsTypeNumberCompatible) {
                // Use number argument as it is.
                return this.formatKnownArgument(arg, fs, curArrayDepth, totArrayDepth);
            }
        }
        else if (typeof arg === "bigint") {
            // Convert BigInt to IntWrapper.
            return this.formatKnownArgument(new IntWrapper(arg), fs, curArrayDepth, totArrayDepth);
        }
        else if (typeof arg === "string") {
            // Argument can be string.
            if (fs.hasType("cdnxXobB")) {
                // For integer types get code point of arg if it contains single symbol.
                let symbolInfo = getSymbolInfoAt(arg, 0);

                // Does arg contain single symbol?
                if (symbolInfo && arg === symbolInfo.chars) {
                    return this.formatKnownArgument(symbolInfo.codePoint, fs, curArrayDepth, totArrayDepth);
                }
            }
            else if (fs.hasType("", "s?")) {
                // Else use string argument as it is.
                return this.formatKnownArgument(arg, fs, curArrayDepth, totArrayDepth);
            }
        }
        else if (isArray(arg) || isRecord(arg)) {
            // Format array or record.
            return this.formatKnownArgument(arg, fs, curArrayDepth, totArrayDepth);
        }
        else if (isMap(arg)) {
            // Format Map as record.
            return this.formatKnownArgument(mapToRecord(arg), fs, curArrayDepth, totArrayDepth);
        }
        else if (isSet(arg)) {
            // Format Set as array.
            return this.formatKnownArgument(setToArray(arg), fs, curArrayDepth, totArrayDepth);
        }

        // Invalid argument type.
        ThrowFormatError.throwInvalidArgumentForType(this, arg, fs.type);
    }

    // Formats known argument.
    private formatKnownArgument(arg: unknown, fs: FormatSpecification, curArrayDepth?: number, totArrayDepth?: number): string {
        // Validate format specification.
        fs.validate(arg); // FIXME: Here or There

        // Get align.
        let { align } = fs;

        // Width of field or 0 if not given.
        let width = 0;

        // Fill char.
        let fill = " ";

        // Convert to valid argument: string or number.
        let argStr: string;

        if (typeof arg === "number" || arg instanceof NumberWrapper) {
            // Format number to string.
            argStr = formatNumber(arg, fs);

            // Set fill, align and width.
            fill = fs.fill ?? fs.zero ?? " ";
            align ??= ">";
            width = fs.width ?? 0;
        }
        else if (typeof arg === "string") {
            if (fs.hasType("?")) {
                // Here should format escape sequence string.
                ThrowFormatError.throwSpecifierIsNotImplemented(fs.parser, fs.type);
            }

            // For string presentation types precision field indicates the maximum
            // field size - in other words, how many characters will be used from the field content.
            if (fs.precision !== undefined && getStringRealLength(arg) > fs.precision) {
                argStr = setStringRealLength(arg, fs.precision);
            }
            else {
                argStr = arg;
            }

            // Set fill, align and width.
            fill = fs.fill ?? fs.zero ?? " ";
            align ??= "<";
            width = fs.width ?? 0;
        }
        else if (arg instanceof PassToLeaf) {
            argStr = arg.str;
        }
        else if (isArray(arg)) {
            // Format array.
            totArrayDepth ??= getArrayDepth(arg);
            curArrayDepth ??= 0

            let ap = fs.getArrayPresentation(curArrayDepth, totArrayDepth);

            argStr = ap.leftBrace;

            for (let i = 0; i < arg.length; i++) {
                if (i > 0 && ap.type !== "s") {
                    argStr += ", ";
                }
                argStr += this.formatArgument(arg[i], fs, curArrayDepth + 1, totArrayDepth);
            }

            argStr += ap.rightBrace;

            // Set fill, align and width.
            fill = ap.fill ?? " ";
            align = ap.align ?? "<";
            width = ap.width ?? 0;
        }
        else if (isRecord(arg)) {
            // Format array.
            totArrayDepth ??= getArrayDepth(arg);
            curArrayDepth ??= 0

            let ap = fs.getArrayPresentation(curArrayDepth, totArrayDepth);

            argStr = ap.leftBrace;

            let i = 0;

            for (let key in arg) {
                if (hasGoodProperty(arg, key)) {
                    if (i++ > 0) {
                        argStr += ap.type === "s" ? "" : ", ";
                    }

                    let value = this.formatArgument(arg[key], fs, curArrayDepth + 1, totArrayDepth)

                    if (ap.type === "n" || ap.type === "m") {
                        argStr += key + ": " + value;
                    }
                    else if (ap.type === "s") {
                        argStr += key + value;
                    }
                    else {
                        argStr += ap.leftBrace + key + ", " + value + ap.rightBrace;
                    }
                }
            }

            argStr += ap.rightBrace;

            // Set fill, align and width.
            fill = ap.fill ?? " ";
            align = ap.align ?? "<";
            width = ap.width ?? 0;
        }
        else {
            // Invalid argument type.
            ThrowFormatError.throwInvalidArgumentForType(this, arg, fs.type);
        }

        // If arg not leaf node, then pass it forward to get correct fill, align and width.
        if (!isArray(arg) && curArrayDepth !== undefined && totArrayDepth !== undefined && curArrayDepth < totArrayDepth) {
            // Pass argStr forward until it reaches leaf total depth of array.
            argStr = this.formatKnownArgument(new PassToLeaf(argStr), fs, curArrayDepth + 1, totArrayDepth);

            let ap = fs.getArrayPresentation(curArrayDepth, totArrayDepth);

            // Set fill, align and width.
            fill = ap.fill ?? " ";
            align = ap.align ?? "<";
            width = ap.width ?? 0;
        }

        // Next apply fill and alignment according to format specification.

        // Calculate fillCount
        let fillCount = Math.max(0, width - getStringRealLength(argStr));

        // Initialize replacement string.
        let replacementStr: string = argStr;

        // Modify replacement string if filling is required.
        if (fillCount > 0) {
            switch (align) {
                case "<":
                    // Field is left aligned. Add filling to right.
                    replacementStr = argStr + repeatString(fill, fillCount);
                    break;
                case "^":
                    // Field is center aligned. Add filling to left and right right.
                    replacementStr = repeatString(fill, Math.floor(fillCount / 2)) + argStr + repeatString(fill, Math.ceil(fillCount / 2));
                    break;
                case ">":
                    // Field is right aligned. Add filling to left.
                    replacementStr = repeatString(fill, fillCount) + argStr;
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

            // Remove edges '{' and '}' and split to parts by ':'.
            let replFieldParts = match.substring(1, match.length - 1).split(":");

            // First part is field number.
            let fieldNumber = replFieldParts.shift() ?? "";

            // Set error string.
            this.errorString = match;

            // Get argument.
            let arg = this.getArgument(fieldNumber);

            // Create format specification.
            let fs = new FormatSpecification(this, replFieldParts);

            // Format argument and add it to result string.
            this.resultString += this.formatArgument(arg, fs);

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

    // Get error message.
    getErrorMessage(msg: string) {
        if (this.errorString === this.formatString) {
            return msg + ", \"" + this.errorString + "\".";
        }
        else {
            return msg + ", \"" + this.errorString + "\" in \"" + this.formatString + "\".";
        }
    }

    static exec(formatString: string, formatArgs: unknown[], usingDeprecatedStdFormat: boolean): string {
        // Init parser.
        let parser = new FormatStringParser(formatString, formatArgs, usingDeprecatedStdFormat);

        // Parse format string.
        parser.parseFormatString();

        // Return result string.
        return parser.resultString;
    }
}
