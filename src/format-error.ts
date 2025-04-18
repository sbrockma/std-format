import { FloatWrapper, IntWrapper } from "./int-float";
import { FormatStringParser } from "./format-string-parser";

// Get error message.
function getErrorMessage(parser: FormatStringParser | undefined, msg: string) {
    if (parser) {
        if (parser.errorString === parser.formatString) {
            return msg + ", in \"" + parser.errorString + "\"";
        }
        else {
            return msg + ", in \"" + parser.formatString + "\" (col " + parser.parsePosition + " = \"" + parser.errorString + "\")";
        }
    }
    else {
        return msg;
    }
}

// Exceoption class, trown on format and value errors.
export class FormatError extends Error {
    // FormatError constructor.
    constructor(parser: FormatStringParser | undefined, msg: string) {
        super(getErrorMessage(parser, msg));
        this.name = "FormatError";
        // console.log(this.message);
    }
}

// Get type of arg.
function getTypeOfArg(arg: unknown): string {
    if (arg instanceof IntWrapper) {
        return "int";
    }
    else if (arg instanceof FloatWrapper) {
        return "float";
    }
    else {
        return typeof arg;
    }
}

export namespace ThrowFormatError {
    // Throw specifier is not implemented error.
    export function throwSpecifierIsNotImplemented(p: FormatStringParser, specifier: string): never {
        throw new FormatError(p, "Specifier '" + specifier + "' is not implemented");
    }

    // Throw value not integer error
    export function throwValueNotInteger(value: unknown): never {
        throw new FormatError(undefined, "Value '" + value + "' is not integer");
    }

    // Throw value not float error
    export function throwValueNotFloat(value: unknown): never {
        throw new FormatError(undefined, "Value '" + value + "' is not float");
    }

    // Throw range error
    export function throwRangeError(value: unknown): never {
        throw new FormatError(undefined, "Range errror, '" + value + "' out of range");
    }

    // Throw invalid argument error.
    export function throwInvalidArgumentForType(p: FormatStringParser, arg: unknown, type: string): never {
        throw new FormatError(p, "Invalid " + getTypeOfArg(arg) + " '" + String(arg) + "' argument for type specifier '" + type + "'");
    }

    // Throw invalid nested argument error.
    export function throwInvalidNestedArgument(p: FormatStringParser, arg: unknown): never {
        throw new FormatError(p, "Invalid nested argument '" + String(arg) + "'");
    }

    // Throw invalid field number error.
    export function throwInvalidFieldNumber(p: FormatStringParser, fieldNumber: string): never {
        throw new FormatError(p, "Invalid field number '" + fieldNumber + "'");
    }

    // Throw switch between auto/manual field numbering error.
    export function throwSwitchBetweenAutoAndManualFieldNumbering(p: FormatStringParser): never {
        throw new FormatError(p, "Switch between automatic and manual field numbering");
    }

    // Throw encounteger single curly brace error.
    export function throwEncounteredSingleCurlyBrace(p: FormatStringParser): never {
        throw new FormatError(p, "Encountered single curly brace");
    }

    // Throw invalid replacement field error.
    export function throwInvalidFormatSpecifiers(p: FormatStringParser): never {
        throw new FormatError(p, "Invalid format specifiers");
    }

    // Throw precision not allowed error.
    export function throwPrecisionNotAllowedWith(p: FormatStringParser, type: string, arg?: unknown): never {
        throw new FormatError(p, "Precision not allowed with type specifier '" + type + "'" + (arg ? " (" + getTypeOfArg(arg) + ")" : ""));
    }

    // Throw specifier not allowed with default error.
    export function throwSpecifierNotAllowedWithDefault(p: FormatStringParser, specifier: string, withArg: unknown): never {
        throw new FormatError(p, "Specifier '" + specifier + "' not allowed with specifier '' (default " + getTypeOfArg(withArg) + ")");
    }

    // Throw specifier not allowed with error.
    export function throwSpecifierNotAllowedWith(p: FormatStringParser, specifier1: string, specifier2: string): never {
        throw new FormatError(p, "Specifier '" + specifier1 + "' not allowed with specifier '" + specifier2 + "'");
    }

    // Throw invalid specification hint error.
    export function throwInvalidSpecificationHint(specHint: string): never {
        throw new FormatError(undefined, "Invalid specification hint '" + specHint + "'. Valid values are 'cpp' and 'python'.");
    }
}
