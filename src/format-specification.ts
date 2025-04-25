import { NumberWrapper } from "./int-float";
import { ThrowFormatError } from "./format-error";
import { FormatStringParser } from "./format-string-parser";
import { getSymbolInfoAt } from "internal";

/**
 * https://en.cppreference.com/w/cpp/utility/format/spec
 * https://docs.python.org/3/library/string.html#formatspec
 * 
 * [[fill]align][sign]["z"]["#"]["0"][width][grouping]["." precision][L][type]
 */

/**
 * Format specification for array (ArrayPresentation)
 * 
 * [[fill]align][width][type]
 * align: '<', '^', '>'
 * type: '' (default), 'd' (default), 'n' (no braces), 'b' (curly braces), 's' (string), 'm' (map)
 */

export type ArrayPresentation = {
    fill?: string,
    align?: "<" | "^" | ">",
    width?: number,
    type: "" | "d" | "n" | "b" | "s" | "m",
    leftBrace: "" | "[" | "{",
    rightBrace: "" | "]" | "}"
}

const DefaultArrayPresenation: ArrayPresentation = {
    type: "",
    leftBrace: "[",
    rightBrace: "]"
}

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

    readonly elemSpecifiers: string;
    readonly arraySpecifiers: string[];

    readonly arrayPresentations: ArrayPresentation[];

    // Parse str and pos.
    private parseStr: string = "";
    private parsePos: number = 0;

    constructor(readonly parser: FormatStringParser, fsParts: string[]) {
        if (fsParts.length === 0 || fsParts.length === 1 && fsParts[0] === "") {
            this.elemSpecifiers = "";
            this.arraySpecifiers = [];
            this.arrayPresentations = [];
            this.type = "";
            return;
        }

        // Last part is always element's format specification.
        this.elemSpecifiers = fsParts.pop() ?? "";

        // Previous parts are array presentations.
        this.arraySpecifiers = fsParts;

        // Init parse string and position.
        this.parseStr = this.elemSpecifiers;
        this.parsePos = 0;

        // Get fill and align.
        let { fill, align } = this.parseFillAndAlign("<", "^", ">", "=");
        this.fill = fill;
        this.align = align as any;

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

        // Parse position should have reached end of parse str.
        if (this.parsePos !== this.parseStr.length) {
            ThrowFormatError.throwInvalidFormatSpecifiers(this.parser);
        }

        this.arrayPresentations = this.arraySpecifiers.map(s => {
            // Init parse string and position.
            this.parseStr = s;
            this.parsePos = 0;

            // Get fill, align, width and type
            let { fill, align } = this.parseFillAndAlign("<", "^", ">") as { fill: string, align: "<" | "^" | ">" };
            let width = this.parseWidthOrPrecision("width");
            let type = this.parseSpecifier("d", "n", "b", "s", "m") as "d" | "n" | "b" | "s" | "m" ?? "";

            // Parse position should have reached end of parse str.
            if (this.parsePos !== this.parseStr.length) {
                ThrowFormatError.throwInvalidFormatSpecifiers(this.parser);
            }

            // Solve left and right braces.
            let leftBrace: "" | "[" | "{" = type === "n" || type === "s" ? "" : (type === "b" ? "{" : "[");
            let rightBrace: "" | "]" | "}" = type === "n" || type === "s" ? "" : (type === "b" ? "}" : "]");

            return { fill, align, width, type, leftBrace, rightBrace }
        });
    }

    getArrayPresentation(curArrayDepth: number, totArrayDepth: number): ArrayPresentation {
        let i = curArrayDepth + this.arrayPresentations.length - totArrayDepth;
        return i >= 0 && i < this.arrayPresentations.length ? this.arrayPresentations[i] : DefaultArrayPresenation;
    }

    // Parse fill and align
    private parseFillAndAlign(...alignChars: string[]): { fill: string | undefined, align: string | undefined } {
        let fill = getSymbolInfoAt(this.parseStr, this.parsePos);
        if (fill && this.parseStr.length >= this.parsePos + fill.chars.length + 1 && alignChars.indexOf(this.parseStr[this.parsePos + fill.chars.length]) >= 0) {
            this.parsePos += fill.chars.length;
            return { fill: fill.chars, align: this.parseStr[this.parsePos++] }
        }
        else if (this.parseStr.length >= this.parsePos + 1 && alignChars.indexOf(this.parseStr[this.parsePos]) >= 0) {
            return { fill: undefined, align: this.parseStr[this.parsePos++] }
        }
        else {
            return { fill: undefined, align: undefined }
        }
    }

    // Parse specifier.
    private parseSpecifier(...specArr: string[]): any {
        return this.parsePos < this.parseStr.length && specArr.indexOf(this.parseStr[this.parsePos]) >= 0 ? this.parseStr[this.parsePos++] : undefined;
    }

    // Parse digits.
    private parseDigits() {
        let digits = "";
        while (this.parsePos < this.parseStr.length && /\d/.test(this.parseStr[this.parsePos])) {
            digits += this.parseStr[this.parsePos++];
        }
        return digits;
    }

    // Parse width and precision, can be nested arg or value.
    private parseWidthOrPrecision(type: "width" | "precision"): number | undefined {
        // Precision needs '.'
        if (type === "precision") {
            if (this.parseStr[this.parsePos] !== ".") {
                return undefined;
            }
            this.parsePos++;
        }

        if (this.parseStr[this.parsePos] === "{") {
            // Get nested arg value.
            this.parsePos++;
            let digits = this.parseDigits();
            if (this.parseStr[this.parsePos] === "}") {
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
        if (this.elemSpecifiers === "") {
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
                else if (typeof arg === "number" || NumberWrapper.isFloatType(arg)) {
                    // allowSpecifiers("<^>=-+ z0,_L", arg);
                    rejectSpecifiers("#", arg);
                }
                else if (NumberWrapper.isIntType(arg)) {
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
