import { FloatWrapper, IntWrapper } from "./int-float";
import { ThrowFormatError } from "./format-error";
import { FormatStringParser } from "./format-string-parser";
import { getSymbolInfoAt } from "internal";

/**
 * https://en.cppreference.com/w/cpp/utility/format/spec
 * https://docs.python.org/3/library/string.html#formatspec
 * 
 * [[fill]align][sign]["z"]["#"]["0"][width][grouping]["." precision][L][type]
 */

// The format specification class
export class FormatSpecification {
    readonly fill: string | undefined;
    readonly align: "<" | "^" | ">" | "=" | undefined;
    readonly sign: "+" | "-" | " " | undefined;
    readonly zeta: "z" | undefined;
    readonly sharp: "#" | undefined;
    readonly zero: "0" | undefined;
    readonly width: number | undefined;
    readonly grouping: "," | "_" | undefined;
    readonly precision: number | undefined;
    readonly locale: "L" | undefined;
    readonly type: "" | "s" | "?" | "c" | "d" | "n" | "b" | "B" | "o" | "x" | "X" | "e" | "E" | "f" | "F" | "%" | "g" | "G" | "a" | "A";

    // Parse starts from pos 1, skip ":" at pos 0.
    private parsePos: number = 1; 

    constructor(readonly parser: FormatStringParser, readonly specifiers: string) {
        if (!specifiers || specifiers[0] !== ":") {
            this.type = "";
            return;
        }

        // Get fill and align.
        let fill = getSymbolInfoAt(specifiers, this.parsePos);
        if (fill && specifiers.length >= this.parsePos + fill.chars.length + 1 && ["<", "^", ">", "="].indexOf(specifiers[this.parsePos + fill.chars.length]) >= 0) {
            this.fill = fill.chars;
            this.parsePos += fill.chars.length;
            this.align = specifiers[this.parsePos++] as any;
        }
        else if (specifiers.length >= this.parsePos + 1 && ["<", "^", ">", "="].indexOf(specifiers[this.parsePos]) >= 0) {
            this.fill = undefined;
            this.align = specifiers[this.parsePos++] as any;
        }

        // Get rest of the specifiers.
        this.sign = this.parseSpecifier("-", "+", " ");
        this.zeta = this.parseSpecifier("z");
        this.sharp = this.parseSpecifier("#");
        this.zero = this.parseSpecifier("0");
        this.width = this.parseWidthOrPrecision("width");
        this.grouping = this.parseSpecifier(",", "_");
        this.precision = this.parseWidthOrPrecision("precision");
        this.locale = this.parseSpecifier("L");
        this.type = this.parseSpecifier("s", "?", "c", "d", "n", "b", "B", "o", "x", "X", "e", "E", "f", "F", "%", "g", "G", "a", "A") ?? "";

        // Parse position should have reached end of specifiers.
        if (this.parsePos !== specifiers.length) {
            ThrowFormatError.throwInvalidFormatSpecifiers(this.parser);
        }
    }

    // Parse specifier.
    private parseSpecifier(...specArr: string[]): any {
        return this.parsePos < this.specifiers.length && specArr.indexOf(this.specifiers[this.parsePos]) >= 0 ? this.specifiers[this.parsePos++] : undefined;
    }

    // Parse digits.
    private parseDigits() {
        let digits = "";
        while (this.parsePos < this.specifiers.length && /\d/.test(this.specifiers[this.parsePos])) {
            digits += this.specifiers[this.parsePos++];
        }
        return digits;
    }

    // Parse width and precision, can be nested arg or value.
    private parseWidthOrPrecision(type: "width" | "precision"): number | undefined {
        // Precision needs '.'
        if (type === "precision") {
            if (this.specifiers[this.parsePos] !== ".") {
                return undefined;
            }
            this.parsePos++;
        }

        if (this.specifiers[this.parsePos] === "{") {
            // Get nested arg value.
            this.parsePos++;
            let digits = this.parseDigits();
            if (this.specifiers[this.parsePos] === "}") {
                this.parsePos++;
                return this.parser.getNestedArgumentInt(digits);
            }
            else {
                ThrowFormatError.throwInvalidFormatSpecifiers(this.parser);
            }
        }
        else {
            // Get value.
            let digits = this.parseDigits();
            if (digits.length > 0) {
                let value = +digits;
                if (type === "width" && value === 0) {
                    ThrowFormatError.throwInvalidFormatSpecifiers(this.parser);
                }
                return value;
            }
        }

        // No width or precision specified.
        return undefined;
    }

    // Test if type is one of types given as argument.
    // For example isType("", "d", "xX") tests if type is either "", "d", "x" or "X".
    hasType(...types: string[]) {
        return types.some(type => this.type === type || this.type !== "" && type.indexOf(this.type) >= 0);
    }

    // Validate what specifiers can be used together.
    validate(arg: unknown) {
        if (this.specifiers === "") {
            return;
        }

        const rejectSpecifiers = (rejectedSpecifiers: string, arg?: unknown) => {
            if (this.align !== undefined && rejectedSpecifiers.indexOf(this.align) >= 0) {
                ThrowFormatError.throwSpecifierNotAllowedWith(this.parser, this.align, this.type, arg);
            }
            else if (this.sign !== undefined && rejectedSpecifiers.indexOf(this.sign) >= 0) {
                ThrowFormatError.throwSpecifierNotAllowedWith(this.parser, this.sign, this.type, arg);
            }
            else if (this.zeta !== undefined && rejectedSpecifiers.indexOf(this.zeta) >= 0) {
                ThrowFormatError.throwSpecifierNotAllowedWith(this.parser, this.zeta, this.type, arg);
            }
            else if (this.sharp !== undefined && rejectedSpecifiers.indexOf(this.sharp) >= 0) {
                ThrowFormatError.throwSpecifierNotAllowedWith(this.parser, this.sharp, this.type, arg);
            }
            else if (this.zero !== undefined && rejectedSpecifiers.indexOf(this.zero) >= 0) {
                ThrowFormatError.throwSpecifierNotAllowedWith(this.parser, this.zero, this.type, arg);
            }
            else if (this.grouping !== undefined && rejectedSpecifiers.indexOf(this.grouping) >= 0) {
                ThrowFormatError.throwSpecifierNotAllowedWith(this.parser, this.grouping, this.type, arg);
            }
            else if (this.locale !== undefined && rejectedSpecifiers.indexOf(this.locale) >= 0) {
                ThrowFormatError.throwSpecifierNotAllowedWith(this.parser, this.locale, this.type, arg);
            }
        }

        const rejectPrecision = () => {
            if (this.precision !== undefined) {
                ThrowFormatError.throwPrecisionNotAllowedWith(this.parser, this.type);
            }
        }

        switch (this.type) {
            case "": {
                // Specifiers that are allowed with default type '' depends on arg.
                if (typeof arg === "string" || typeof arg === "boolean") {
                    // allowSpecifiers("<^>", arg);
                    rejectSpecifiers("=-+ z#0,_L", arg);
                }
                else if (typeof arg === "number" || arg instanceof FloatWrapper) {
                    // allowSpecifiers("<^>=-+ z0,_L", arg);
                    rejectSpecifiers("#", arg);
                }
                else if (arg instanceof IntWrapper) {
                    // allowSpecifiers("<^>=-+ 0,_L", arg);
                    rejectSpecifiers("z#", arg);
                    rejectPrecision();
                }
                break;
            }
            case "s": case "?": {
                // allowSpecifiers("<^>");
                rejectSpecifiers("=-+ z#0,_L");
                break;
            }
            case "c": {
                // allowSpecifiers("<^>=0");
                rejectSpecifiers("-+ z#,_L");
                rejectPrecision();
                break;
            }
            case "d": {
                // allowSpecifiers("<^>=-+ #0,_L");
                rejectSpecifiers("z");
                rejectPrecision();
                break;
            }
            case "n": {
                // allowSpecifiers("<^>=-+ #0");
                rejectSpecifiers("z,_L");
                rejectPrecision();
                break;
            }
            case "b": case "B": case "o": case "x": case "X": {
                // allowSpecifiers("<^>=-+ #0_");
                rejectSpecifiers("z,L");
                rejectPrecision();
                break;
            }
            case "e": case "E": case "f": case "F": case "%": case "g": case "G": case "a": case "A": {
                // allowSpecifiers("<^>=-+ z#0,_L");
                // rejectSpecifiers("");
                break;
            }
        }

        // Grouping not allowed with locale.
        if (this.grouping !== undefined && this.locale !== undefined) {
            ThrowFormatError.throwSpecifierNotAllowedWith(this.parser, this.grouping, this.locale);
        }
    }

    getSignChar(isNeg: boolean) {
        return isNeg ? "-" : ((this.sign === "+" || this.sign === " ") ? this.sign : "");
    }
}
