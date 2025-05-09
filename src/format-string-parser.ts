import { assert, isInteger, repeatString } from "./utils/common";
import { getArrayDepth, hasFormattableProperty, isArray, isMap, isRecord, isSet, convertMapToRecord, convertSetToArray } from "./utils/obj-types";
import { getStringRealLength, setStringRealLength, getSymbol, getCodePointAt } from "./utils/char-coding";
import { ReplacementField } from "./replacement-field";
import { formatNumber } from "./number-formatter";
import { FormatError } from "./index";
import { IntWrapper, NumberWrapper } from "./number-wrapper";
import { LRUCache } from "./utils/LRU-cache";

// Replacement field regex arr. Try simple first, if fails try with nested braces.
const ReplacementFieldRegExs: RegExp[] = [
    // Simple match, just any chars between braces '{...}'.
    new RegExp("^\{[^{}]*\}"),
    // Match that works for nested braces '{...{d}...{d}...}'.
    new RegExp("^\{([^{}]*(\{[^{}]*\})?)*[^{}]*\}")
];

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

// Get type of arg.
function getTypeOfArg(arg: unknown): string {
    if (NumberWrapper.isIntType(arg)) {
        return "int";
    }
    else if (NumberWrapper.isFloatType(arg)) {
        return "float";
    }
    else {
        return typeof arg;
    }
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

    static replacementFieldCache = new LRUCache<string, ReplacementField>(250, 100);
    static formatStringCache = new LRUCache<string, ReadonlyArray<string | ReplacementField>>(250, 1000);

    private constructor(readonly formatString: string, readonly formatArgs: unknown[]) {
        assert(typeof this.formatString === "string", "Invalid format string!");

        this.parseString = this.formatString;
        this.parsePosition = 0;
        this.resultString = "";
        this.errorString = "";
        this.automaticFieldNumber = 0;
        this.hasAutomaticFieldNumbering = false;
        this.hasManualFieldSpecification = false;
    }

    // Get error message.
    private getErrorMessage(msg: string) {
        if (this.errorString === this.formatString) {
            return msg + ", '" + this.errorString + "'.";
        }
        else {
            return msg + ", '" + this.errorString + "' in '" + this.formatString + "'.";
        }
    }

    // Throw invalid argument error.
    throwCannotFormatArgumentAsType(arg: unknown, type: string): never {
        throw new FormatError(this.getErrorMessage(
            "Cannot format " + getTypeOfArg(arg) + " '" + String(arg) + "' argument as type '" + type + "'"));
    }

    // Throw invalid nested argument error.
    throwInvalidNestedArgument(arg: unknown): never {
        throw new FormatError(this.getErrorMessage("Invalid nested argument '" + String(arg) + "'"));
    }

    // Throw invalid field number error.
    throwInvalidFieldId(fieldId: string): never {
        throw new FormatError(this.getErrorMessage("Invalid field id '" + fieldId + "'"));
    }

    // Throw switch between auto/manual field numbering error.
    throwSwitchBetweenAutoAndManualFieldNumbering(): never {
        throw new FormatError(this.getErrorMessage("Switch between automatic and manual field numbering"));
    }

    // Throw encounteger single curly brace error.
    throwEncounteredSingleCurlyBrace(): never {
        throw new FormatError(this.getErrorMessage("Encountered single curly brace"));
    }

    // Throw invalid replacement field error.
    throwInvalidFormatSpecifiers(...specifiers: string[]): never {
        throw new FormatError(this.getErrorMessage("Invalid format specifiers " + specifiers.map(s => "'" + s + "'").join(" with ")));
    }

    // Throw precision not allowed error.
    throwPrecisionNotAllowedWith(type: string): never {
        throw new FormatError(this.getErrorMessage("Precision not allowed with '" + type + "' specifier"));
    }

    // Formats argument.
    formatArgument(arg: unknown, rf: ReplacementField, curArrayDepth?: number, totArrayDepth?: number): string {
        let ep = rf.getElementPresentation();

        let isNumberCompatibleType = ep.hasType("", "cdnbBoxXeEfF%gGaA");
        let isStringCompatibleType = ep.hasType("", "s?");

        if (arg === undefined || arg === null) {
            // undefined and null can be stringified.
            if (isStringCompatibleType) {
                return this.formatKnownArgument(String(arg), rf, curArrayDepth, totArrayDepth);
            }
        }
        else if (typeof arg === "boolean") {
            // Argument can be boolean.
            if (isStringCompatibleType) {
                // Boolean can be stringified.
                return this.formatKnownArgument(arg ? "true" : "false", rf, curArrayDepth, totArrayDepth);
            }
            else if (isNumberCompatibleType) {
                // Boolean can be converted to number 0 or 1.
                return this.formatKnownArgument(arg ? 1 : 0, rf, curArrayDepth, totArrayDepth);
            }
        }
        else if (typeof arg === "number" || arg instanceof NumberWrapper) {
            // Argument can be number or int.
            if (isNumberCompatibleType) {
                // Use number argument as it is.
                return this.formatKnownArgument(arg, rf, curArrayDepth, totArrayDepth);
            }
        }
        else if (typeof arg === "bigint") {
            // Convert BigInt to IntWrapper.
            return this.formatKnownArgument(new IntWrapper(arg), rf, curArrayDepth, totArrayDepth);
        }
        else if (typeof arg === "string") {
            // Argument can be string.
            if (ep.hasType("cdnxXobB")) {
                // For integer types get code point of arg if it contains single symbol.
                let codePoint = getCodePointAt(arg, 0);

                // Does arg contain single symbol?
                if (codePoint && arg === getSymbol(codePoint)) {
                    return this.formatKnownArgument(codePoint, rf, curArrayDepth, totArrayDepth);
                }
            }
            else if (isStringCompatibleType) {
                // Else use string argument as it is.
                return this.formatKnownArgument(arg, rf, curArrayDepth, totArrayDepth);
            }
        }
        else if (isArray(arg) || isRecord(arg)) {
            // Format array or record.
            return this.formatKnownArgument(arg, rf, curArrayDepth, totArrayDepth);
        }
        else if (isMap(arg)) {
            // Format Map as record.
            return this.formatKnownArgument(convertMapToRecord(arg), rf, curArrayDepth, totArrayDepth);
        }
        else if (isSet(arg)) {
            // Format Set as array.
            return this.formatKnownArgument(convertSetToArray(arg), rf, curArrayDepth, totArrayDepth);
        }

        // Invalid argument type.
        this.throwCannotFormatArgumentAsType(arg, ep.type);
    }

    // Formats known argument.
    private formatKnownArgument(arg: unknown, rf: ReplacementField, curArrayDepth?: number, totArrayDepth?: number): string {
        let ep = rf.getElementPresentation();

        // Validate element presentation.
        ep.validate(this, arg);

        // Get align.
        let { align } = ep;

        // Width of field or 0 if not given.
        let width = 0;

        // Fill char.
        let fill = " ";

        // Convert to valid argument: string or number.
        let argStr: string;

        if (typeof arg === "number" || arg instanceof NumberWrapper) {
            // Format number to string.
            argStr = formatNumber(arg, this, ep);

            // Set fill, align and width.
            fill = ep.fill ?? ep.zero ?? " ";
            align ??= ">";
            width = ep.width ?? 0;
        }
        else if (typeof arg === "string") {
            // For string presentation types precision field indicates the maximum
            // field size - in other words, how many characters will be used from the field content.
            if (ep.precision !== undefined && getStringRealLength(arg) > ep.precision) {
                argStr = setStringRealLength(arg, ep.precision);
            }
            else {
                argStr = arg;
            }

            // Set fill, align and width.
            fill = ep.fill ?? ep.zero ?? " ";
            align ??= "<";
            width = ep.width ?? 0;
        }
        else if (arg instanceof PassToLeaf) {
            argStr = arg.str;
        }
        else if (isArray(arg)) {
            // Format array.
            totArrayDepth ??= getArrayDepth(arg);
            curArrayDepth ??= 0

            let ap = rf.getArrayPresentation(curArrayDepth, totArrayDepth);

            argStr = ap.leftBrace;

            for (let i = 0; i < arg.length; i++) {
                if (i > 0 && ap.type !== "s") {
                    argStr += ", ";
                }
                argStr += this.formatArgument(arg[i], rf, curArrayDepth + 1, totArrayDepth);
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

            let ap = rf.getArrayPresentation(curArrayDepth, totArrayDepth);

            argStr = ap.leftBrace;

            let i = 0;

            for (let key in arg) {
                if (hasFormattableProperty(arg, key)) {
                    if (i++ > 0) {
                        argStr += ap.type === "s" ? "" : ", ";
                    }

                    let value = this.formatArgument(arg[key], rf, curArrayDepth + 1, totArrayDepth)

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
            this.throwCannotFormatArgumentAsType(arg, ep.type);
        }

        // If arg not leaf node, then pass it forward to get correct fill, align and width.
        if (!isArray(arg) && curArrayDepth !== undefined && totArrayDepth !== undefined && curArrayDepth < totArrayDepth) {
            // Pass argStr forward until it reaches leaf total depth of array.
            argStr = this.formatKnownArgument(new PassToLeaf(argStr), rf, curArrayDepth + 1, totArrayDepth);

            let ap = rf.getArrayPresentation(curArrayDepth, totArrayDepth);

            // Set fill, align and width.
            fill = ap.fill ?? " ";
            align = ap.align ?? "<";
            width = ap.width ?? 0;
        }

        // Next apply fill, align and width.

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
    getArgument(fieldId: string): unknown {
        // Is field number string empty?
        if (fieldId.length > 0) {
            // Use manual field specification.
            this.hasManualFieldSpecification = true;
        }
        else {
            // Use automatic field numbering.
            this.hasAutomaticFieldNumbering = true;

            // Get ascending field number
            fieldId = String(this.automaticFieldNumber++);
        }

        // Throw exception switching between automatic and manual field numbering.
        if (this.hasAutomaticFieldNumbering && this.hasManualFieldSpecification) {
            this.throwSwitchBetweenAutoAndManualFieldNumbering();
        }

        if (isDigits(fieldId)) {
            let fieldNumber = +fieldId;

            // Throw exception if field number is out of bounds of arguments array.
            if (fieldNumber < 0 || fieldNumber >= this.formatArgs.length) {
                this.throwInvalidFieldId(String(fieldNumber));
            }

            // Return argument.
            return this.formatArgs[fieldNumber];
        }
        else {
            // Argument 0 might be record that contains named args [name: value].
            let argsObj = this.formatArgs[0];

            if (isRecord(argsObj) && fieldId in argsObj) {
                return argsObj[fieldId];
            }
            else {
                this.throwInvalidFieldId(fieldId);
            }
        }
    }

    // Function to get nested argument integer. Width and precision in element/array 
    // presentations can be in nested curly braces.
    getNestedArgumentInt(fieldNumberStr: string): number {
        // Get the argument
        let arg = this.getArgument(fieldNumberStr);

        // Nested argument is used for width and precision. Must be integer >= 0.
        if (isInteger(arg) && arg >= 0) {
            // Return nested argument integer.
            return arg;
        } else {
            // Throw invalid nested argument error.
            this.throwInvalidNestedArgument(arg);
        }
    }

    // Function to parse replacement field.
    private parseReplacementField(): ReplacementField {
        assert(this.parseString[0] === "{");

        // Get replacement field match string.
        let match: string | undefined = undefined;

        for (let i = 0; match === undefined && i < ReplacementFieldRegExs.length; i++) {
            let m = ReplacementFieldRegExs[i].exec(this.parseString);
            match = !!m && !!m[0] ? m[0] : undefined;
        }

        if (match) {
            // Get replacement field.
            let rf = FormatStringParser.replacementFieldCache.get(match);

            if (!rf) {
                rf = new ReplacementField(this, match);
                FormatStringParser.replacementFieldCache.set(match, rf);
            }

            // Jump over matched replacement field in parsing string.
            this.parseString = this.parseString.substring(match.length);
            this.parsePosition += match.length;

            return rf;
        }
        else {
            // Ecountered single '{' followed by random stuff.
            this.errorString = "{";
            this.throwEncounteredSingleCurlyBrace();
        }
    }

    // Get next curly brace index, or end of parsing string if no curly braces found.
    private getNextCurlyBraceIndex(): number {
        let id = CurlyBracesRegEx.exec(this.parseString)?.index;
        return (id === undefined || id < 0) ? this.parseString.length : id;
    }

    // Function to parse format string.
    private parseFormatString() {
        this.resultString = "";

        // Get segment string.
        const getSegmentString = (seg: string | ReplacementField) => {
            return typeof seg === "string" ? seg : seg.format(this);
        }

        // Get chached segments if any.
        let cachedSegments = FormatStringParser.formatStringCache.get(this.formatString);

        if (cachedSegments !== undefined) {
            // Add cached segments to result string.
            cachedSegments.forEach(seg => this.resultString += getSegmentString(seg));
        }
        else {
            let segments: Array<string | ReplacementField> = [];

            // Add segment, and add it to result string.
            const addSegment = (seg: string | ReplacementField) => {
                this.resultString += getSegmentString(seg);
                segments.push(seg);
            }

            // Loop until terminated by break.
            while (true) {
                // Jump to next curly brace "{" or "}" or end of parsing string.
                let i = this.getNextCurlyBraceIndex();

                // Get ordinary text.
                let text = this.parseString.substring(0, i);

                if (text.length > 0) {
                    // Add ordinary string.
                    addSegment(text);

                    // Jump over non-formatting part in parsing.
                    this.parseString = this.parseString.substring(text.length);
                    this.parsePosition += text.length;
                }

                // Now parse string starts with "{", "}", or is empty.

                if (this.parseString[0] === "{" && this.parseString[1] === "{" || this.parseString[0] === "}" && this.parseString[1] === "}") {
                    // If parsing string starts with double curly braces
                    // Then add single curly brace.
                    addSegment(this.parseString[0]);

                    // Jump over double curly braces on parsing string.
                    this.parseString = this.parseString.substring(2);
                    this.parsePosition += 2;
                }
                else if (this.parseString[0] === "}") {
                    // Encountered single '}' ff parsing string starts with '}'.
                    this.errorString = "}";
                    this.throwEncounteredSingleCurlyBrace();
                }
                else if (this.parseString[0] === "{") {
                    // If parsing string starts with '{' then add replacement field.
                    addSegment(this.parseReplacementField());
                }
                else {
                    // Did not find any curly braces. Parsing was executed to end of string.
                    // Break out of while loop.
                    break;
                }
            }

            // Save format string to cache.
            FormatStringParser.formatStringCache.set(this.formatString, segments);
        }
    }

    static exec(formatString: string, formatArgs: unknown[]): string {
        // Init parser.
        let parser = new FormatStringParser(formatString, formatArgs);

        // Parse format string.
        parser.parseFormatString();

        // Return result string.
        return parser.resultString;
    }
}
