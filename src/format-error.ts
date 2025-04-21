import { FloatWrapper, IntWrapper } from "./int-float";
import { FormatStringParser } from "./format-string-parser";

/**
 * Exceoption class, trown on format and value errors.
 * @public
 */
export class FormatError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "FormatError";
        // console.log(this.message);
    }
}

export namespace ThrowFormatError {
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

    // Throw specifier is not implemented error.
    export function throwSpecifierIsNotImplemented(p: FormatStringParser, specifier: string): never {
        throw new FormatError(p.getErrorMessage("Specifier '" + specifier + "' is not implemented"));
    }

    // Throw value not integer error
    export function throwValueNotInteger(value: unknown): never {
        throw new FormatError("Value '" + value + "' is not integer");
    }

    // Throw value not float error
    export function throwValueNotFloat(value: unknown): never {
        throw new FormatError("Value '" + value + "' is not float");
    }

    // Throw invalid code point error
    export function throwInvalidCodePoint(value: number): never {
        throw new FormatError("Invalid code point value" + value);
    }

    // Throw to safe number error
    export function throwToSafeNumberError(value: string): never {
        throw new FormatError(value + " cannot safely to number");
    }

    // Throw invalid argument error.
    export function throwInvalidArgumentForType(p: FormatStringParser, arg: unknown, type: string): never {
        throw new FormatError(p.getErrorMessage(
            "Invalid " + getTypeOfArg(arg) + " '" + String(arg) + "' argument for type specifier '" + type + "'"));
    }

    // Throw invalid nested argument error.
    export function throwInvalidNestedArgument(p: FormatStringParser, arg: unknown): never {
        throw new FormatError(p.getErrorMessage("Invalid nested argument '" + String(arg) + "'"));
    }

    // Throw invalid field number error.
    export function throwInvalidFieldNumber(p: FormatStringParser, fieldNumber: string): never {
        throw new FormatError(p.getErrorMessage("Invalid field number '" + fieldNumber + "'"));
    }

    // Throw switch between auto/manual field numbering error.
    export function throwSwitchBetweenAutoAndManualFieldNumbering(p: FormatStringParser): never {
        throw new FormatError(p.getErrorMessage("Switch between automatic and manual field numbering"));
    }

    // Throw encounteger single curly brace error.
    export function throwEncounteredSingleCurlyBrace(p: FormatStringParser): never {
        throw new FormatError(p.getErrorMessage("Encountered single curly brace"));
    }

    // Throw invalid replacement field error.
    export function throwInvalidFormatSpecifiers(p: FormatStringParser): never {
        throw new FormatError(p.getErrorMessage("Invalid format specifiers"));
    }

    // Throw precision not allowed error.
    export function throwPrecisionNotAllowedWith(p: FormatStringParser, type: string, arg?: unknown): never {
        throw new FormatError(p.getErrorMessage(
            "Precision not allowed with type specifier '" + type + "'" + (arg ? " with " + getTypeOfArg(arg) + " argument" : "")));
    }

    // Throw specifier not allowed with error.
    export function throwSpecifierNotAllowedWith(p: FormatStringParser, specifier1: string, specifier2: string, arg?: unknown): never {
        throw new FormatError(p.getErrorMessage(
            "Specifier '" + specifier1 + "' not allowed with specifier '" + specifier2 + "'" +
            (arg === undefined ? "" : (" with " + getTypeOfArg(arg) + " argument"))));
    }
}
