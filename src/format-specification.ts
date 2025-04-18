import { FloatWrapper, IntWrapper } from "./int-float";
import { ThrowFormatError } from "./format-error";
import { FormatStringParser } from "./format-string-parser";

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

    private parsePos: number = 0;

    constructor(readonly parser: FormatStringParser, readonly specifiers: string) {
        if (this.specifiers === "") {
            this.type = "";
            return;
        }

        // Get fill and align.
        if (specifiers.length >= 1 && ["<", "^", ">", "="].indexOf(this.specifiers[this.parsePos]) >= 0) {
            this.fill = undefined;
            this.align = this.specifiers[this.parsePos++] as any;
        }
        else if (specifiers.length >= 2 && ["<", "^", ">", "="].indexOf(this.specifiers[this.parsePos + 1]) >= 0) {
            this.fill = this.specifiers[this.parsePos++];
            this.align = this.specifiers[this.parsePos++] as any;
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
        if (this.parsePos !== this.specifiers.length) {
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

    // Throws error if this has given type and has specifier that is not on whitelist.
    private allowSpecifiersWithType(type: string, specifierWhiteList: string, withArg?: unknown) {
        if (this.hasType(type)) {
            // Fuction to throw error depending whether specifier is default specifier ('') or regular pecifier. 
            const throwSpecifierNotAllowedWith = this.type === "" && withArg !== undefined
                ? (specifier: string): never => { ThrowFormatError.throwSpecifierNotAllowedWithDefault(this.parser, specifier, withArg); }
                : (specifier: string): never => { ThrowFormatError.throwSpecifierNotAllowedWith(this.parser, specifier, this.type); }

            if (this.align !== undefined && specifierWhiteList.indexOf(this.align) < 0) {
                throwSpecifierNotAllowedWith(this.align);
            }
            else if (this.sign !== undefined && specifierWhiteList.indexOf(this.sign) < 0) {
                throwSpecifierNotAllowedWith(this.sign);
            }
            else if (this.zeta !== undefined && specifierWhiteList.indexOf(this.zeta) < 0) {
                throwSpecifierNotAllowedWith(this.zeta);
            }
            else if (this.sharp !== undefined && specifierWhiteList.indexOf(this.sharp) < 0) {
                throwSpecifierNotAllowedWith(this.sharp);
            }
            else if (this.zero !== undefined && specifierWhiteList.indexOf(this.zero) < 0) {
                throwSpecifierNotAllowedWith(this.zero);
            }
            else if (this.grouping !== undefined && specifierWhiteList.indexOf(this.grouping) < 0) {
                throwSpecifierNotAllowedWith(this.grouping);
            }
            else if (this.locale !== undefined && specifierWhiteList.indexOf(this.locale) < 0) {
                throwSpecifierNotAllowedWith(this.locale);
            }
        }
    }

    // Validate what specifiers can be used together.
    validate(arg: unknown) {
        if (this.specifiers === "") {
            return;
        }

        // Specifiers that are allowed with default type '' depend on argument type.
        if (typeof arg === "string" || typeof arg === "boolean") {
            this.allowSpecifiersWithType("", "<^>", arg);
        }
        else if (typeof arg === "number" || arg instanceof FloatWrapper) {
            this.allowSpecifiersWithType("", "<^>=-+ z0,_L", arg);
        }
        else if (arg instanceof IntWrapper) {
            this.allowSpecifiersWithType("", "<^>=-+ 0,_L", arg);
        }

        // Specifiers that are allowed with string types.
        this.allowSpecifiersWithType("s?", "<^>");

        // Specifiers that are allowed with char type.
        this.allowSpecifiersWithType("c", "<^>=0");

        // Specifiers that are allowed with integer type 'd'.
        this.allowSpecifiersWithType("d", "<^>=-+ #0,_L");

        // Specifiers that are allowed with locale aware integer type 'n'.
        this.allowSpecifiersWithType("n", "<^>=-+ #0");

        // Specifiers that are allowed with binary, octal and hexadecimal types.
        this.allowSpecifiersWithType("bBoxX", "<^>=-+ #0_");

        // Specifiers that are allowed with floating point types.
        this.allowSpecifiersWithType("eEfF%gGaA", "<^>=-+ z#0,_L");

        // Precision not allowed for integer format specifiers.
        if (this.hasType("cdnbBoxX") && this.precision !== undefined) {
            ThrowFormatError.throwPrecisionNotAllowedWith(this.parser, this.type);
        }

        // Precision not allowed for '' with int.
        if (this.hasType("") && arg instanceof IntWrapper && this.precision !== undefined) {
            ThrowFormatError.throwPrecisionNotAllowedWith(this.parser, this.type, arg);
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
