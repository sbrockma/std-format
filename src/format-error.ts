import { FormatStringParser } from "./format-string-parser";

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
    constructor(readonly parser: FormatStringParser | undefined, msg: string) {
        super(getErrorMessage(parser, msg));
        this.name = "FormatError";
    }
}

export namespace ThrowFormatError {
    // Create specifier is not implemented error.
    export function throwSpecifierIsNotImplemented(p: FormatStringParser, specifier: string): never {
        throw new FormatError(p, "Specifier '" + specifier + "' is not implemented");
    }

    // Create invalid argument error.
    export function throwInvalidArgumentForType(p: FormatStringParser, arg: unknown, type: string): never {
        throw new FormatError(p, "Invalid " + typeof arg + " argument '" + String(arg) + "' for type specifier '" + type + "'");
    }

    // Create invalid nested argument error.
    export function throwInvalidNestedArgument(p: FormatStringParser, arg: unknown): never {
        throw new FormatError(p, "Invalid nested argument '" + String(arg) + "'");
    }

    // Create invalid field number error.
    export function throwInvalidFieldNumber(p: FormatStringParser, fieldNumber: string): never {
        throw new FormatError(p, "Invalid field number '" + fieldNumber + "'");
    }

    // Create switch between auto/manual field numbering error.
    export function throwSwitchBetweenAutoAndManualFieldNumbering(p: FormatStringParser): never {
        throw new FormatError(p, "Switch between automatic and manual field numbering");
    }

    // Create encounteger single curly brace error.
    export function throwEncounteredSingleCurlyBrace(p: FormatStringParser): never {
        throw new FormatError(p, "Encountered single curly brace");
    }

    // Create invalid replacement field error.
    export function throwInvalidReplacementField(p: FormatStringParser): never {
        throw new FormatError(p, "Invalid replacement field");
    }

    // Create precision not allowed error.
    export function throwPrecisionNotAllowedWith(p: FormatStringParser, type: string): never {
        throw new FormatError(p, "Precision not allowed with type specifier '" + type + "'");
    }

    // Create specifier not allowed with default error.
    export function throwSpecifierNotAllowedWithDefault(p: FormatStringParser, specifier: string, withArg: unknown): never {
        throw new FormatError(p, "Specifier '" + specifier + "' not allowed with specifier '' (default " + typeof withArg + ")");
    }

    // Create specifier not allowed with error.
    export function throwSpecifierNotAllowedWith(p: FormatStringParser, specifier1: string, specifier2: string): never {
        throw new FormatError(p, "Specifier '" + specifier1 + "' not allowed with specifier '" + specifier2 + "'");
    }

    // Create invalid specification hint error.
    export function throwInvalidSpecificationHint(specHint: string): never {
        throw new FormatError(undefined, "Invalid specification hint '" + specHint + "'. Valid values are 'cpp' and 'python'.");
    }
}
