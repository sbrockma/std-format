import { NumberWrapper } from "./number-wrapper";
import { FormatStringParser } from "./format-string-parser";
import { getValidFillCharAt } from "./utils/char-coding";

/**
 * https://en.cppreference.com/w/cpp/utility/format/spec
 * https://docs.python.org/3/library/string.html#formatspec
 * 
 * ElementPresentation:
 *
 * [[fill]align][sign]["z"]["#"]["0"][width][grouping]["." precision][L][type]
 */

/**
 * ArrayPresentation:
 *
 * [[fill]align][width][type]
 * align: '<', '^', '>'
 * type: '' (default), 'd' (default), 'n' (no braces), 'b' (curly braces), 's' (string), 'm' (map)
 */

// Base class for element/array presentations to help with parsing.
abstract class PresentationParser {
    protected parsePos: number = 0;

    constructor(protected parseStr: string) { }

    // Parse fill and align
    protected parseFillAndAlign(p: FormatStringParser, ...alignChars: string[]): { fill: string | undefined, align: string | undefined } {
        let fill = getValidFillCharAt(this.parseStr, this.parsePos);
        if (fill && this.parseStr.length >= this.parsePos + fill.length + 1 && alignChars.indexOf(this.parseStr[this.parsePos + fill.length]) >= 0) {
            this.parsePos += fill.length;
            return { fill, align: this.parseStr[this.parsePos++] }
        }
        else if (this.parseStr.length >= this.parsePos + 1 && alignChars.indexOf(this.parseStr[this.parsePos]) >= 0) {
            return { fill: undefined, align: this.parseStr[this.parsePos++] }
        }
        else {
            return { fill: undefined, align: undefined }
        }
    }

    // Parse specifier.
    protected parseSpecifier(p: FormatStringParser, ...specArr: string[]): any {
        return this.parsePos < this.parseStr.length && specArr.indexOf(this.parseStr[this.parsePos]) >= 0 ? this.parseStr[this.parsePos++] : undefined;
    }

    // Parse digits.
    protected parseDigits(p: FormatStringParser) {
        let digits = "";
        while (this.parsePos < this.parseStr.length && /\d/.test(this.parseStr[this.parsePos])) {
            digits += this.parseStr[this.parsePos++];
        }
        return digits;
    }

    // Parse width and precision, can be nested arg or value.
    protected parseWidthOrPrecision(p: FormatStringParser, type: "width" | "precision"): { value?: number, fieldId?: string } {
        // Precision needs '.'
        if (type === "precision") {
            if (this.parseStr[this.parsePos] !== ".") {
                return {};
            }
            this.parsePos++;
        }

        if (this.parseStr[this.parsePos] === "{") {
            // Get nested arg value.
            this.parsePos++;
            let nextLeftBraceId = this.parseStr.indexOf("{", this.parsePos);
            let nextRightBraceId = this.parseStr.indexOf("}", this.parsePos);
            if (nextRightBraceId >= 0 && (nextLeftBraceId < 0 || (nextLeftBraceId >= 0 && nextRightBraceId < nextLeftBraceId))) {
                let fieldId = this.parseStr.substring(this.parsePos, nextRightBraceId);
                this.parsePos = nextRightBraceId + 1;
                return { fieldId };
            }
            else {
                p.throwInvalidFormatSpecifiers(type);
            }
        }
        else {
            // Get value.
            let digits = this.parseDigits(p);
            if (digits.length > 0) {
                let value = +digits;
                if (type === "width" && value === 0) {
                    p.throwInvalidFormatSpecifiers(type);
                }
                return { value };
            }
        }

        // No width or precision specified.
        return {};
    }
}

// The array presentation class
export class ArrayPresentation extends PresentationParser {
    readonly fill: string | undefined;
    readonly align: "<" | "^" | ">" | undefined;
    width: number | undefined; // Not readonly, could be updated by widthFieldId.
    readonly widthFieldId: string | undefined;
    readonly type: "" | "d" | "n" | "b" | "s" | "m";

    readonly leftBrace: "" | "[" | "{";
    readonly rightBrace: "" | "]" | "}";

    constructor(p: FormatStringParser, str: string) {
        super(str);

        // Get fill, align, width and type
        let { fill, align } = this.parseFillAndAlign(p, "<", "^", ">") as { fill: string, align: "<" | "^" | ">" };
        this.fill = fill;
        this.align = align;

        let { value: width, fieldId: widthFieldId } = this.parseWidthOrPrecision(p, "width");
        this.width = width;
        this.widthFieldId = widthFieldId;

        this.type = this.parseSpecifier(p, "d", "n", "b", "s", "m") as "d" | "n" | "b" | "s" | "m" ?? "";

        // Parse position should have reached end of parse str.
        if (this.parsePos !== this.parseStr.length) {
            p.throwInvalidFormatSpecifiers(this.parseStr.substring(this.parsePos));
        }

        // Solve left and right braces.
        this.leftBrace = this.type === "n" || this.type === "s" ? "" : (this.type === "b" ? "{" : "[");
        this.rightBrace = this.type === "n" || this.type === "s" ? "" : (this.type === "b" ? "}" : "]");
    }
}

// The element presentation class
export class ElementPresentation extends PresentationParser {
    readonly fill: string | undefined;
    readonly align: "<" | "^" | ">" | "=" | undefined;
    readonly sign: "+" | "-" | " " | undefined;
    readonly zeta: "z" | undefined;
    readonly sharp: "#" | undefined;
    readonly zero: "0" | undefined;
    width: number | undefined; // Not readonly, could be updated by widthFieldId.
    readonly widthFieldId: string | undefined;
    readonly grouping: "," | "_" | undefined;
    precision: number | undefined; // Not readonly, could be updated by precisionFieldId.
    readonly precisionFieldId: string | undefined;
    readonly locale: "L" | undefined;
    readonly type: "" | "s" | "c" | "d" | "n" | "b" | "B" | "o" | "x" | "X" | "e" | "E" | "f" | "F" | "%" | "g" | "G" | "a" | "A";

    constructor(p: FormatStringParser, str: string) {
        super(str);

        if (str.length === 0) {
            this.type = "";
            return;
        }

        // Get fill and align.
        let { fill, align } = this.parseFillAndAlign(p, "<", "^", ">", "=");
        this.fill = fill;
        this.align = align as any;

        // Get rest of the specifiers.
        this.sign = this.parseSpecifier(p, "-", "+", " ");
        this.zeta = this.parseSpecifier(p, "z");
        this.sharp = this.parseSpecifier(p, "#");
        this.zero = this.parseSpecifier(p, "0");
        let { value: width, fieldId: widthFieldId } = this.parseWidthOrPrecision(p, "width");
        this.width = width;
        this.widthFieldId = widthFieldId;
        this.grouping = this.parseSpecifier(p, ",", "_");
        let { value: precision, fieldId: precisionFieldId } = this.parseWidthOrPrecision(p, "precision");
        this.precision = precision;
        this.precisionFieldId = precisionFieldId;
        this.locale = this.parseSpecifier(p, "L");
        this.type = this.parseSpecifier(p, "s", "c", "d", "n", "b", "B", "o", "x", "X", "e", "E", "f", "F", "%", "g", "G", "a", "A") ?? "";

        // Parse position should have reached end of parse str.
        if (this.parsePos !== this.parseStr.length) {
            p.throwInvalidFormatSpecifiers(this.parseStr.substring(this.parsePos));
        }
    }

    // Test if type is one of types given as argument.
    // For example isType("", "d", "xX") tests if type is either "", "d", "x" or "X".
    hasType(...types: string[]) {
        return types.some(type => this.type === type || this.type !== "" && type.indexOf(this.type) >= 0);
    }

    // Validate what specifiers can be used together.
    validate(p: FormatStringParser, arg: unknown) {
        if (this.parseStr === "") {
            return;
        }

        const rejectSpecifiers = (rejectedSpecifiers: string, arg?: unknown) => {
            if (this.align !== undefined && rejectedSpecifiers.indexOf(this.align) >= 0) {
                p.throwInvalidFormatSpecifiers(this.align, this.type);
            }
            else if (this.sign !== undefined && rejectedSpecifiers.indexOf(this.sign) >= 0) {
                p.throwInvalidFormatSpecifiers(this.sign, this.type);
            }
            else if (this.zeta !== undefined && rejectedSpecifiers.indexOf(this.zeta) >= 0) {
                p.throwInvalidFormatSpecifiers(this.zeta, this.type);
            }
            else if (this.sharp !== undefined && rejectedSpecifiers.indexOf(this.sharp) >= 0) {
                p.throwInvalidFormatSpecifiers(this.sharp, this.type);
            }
            else if (this.zero !== undefined && rejectedSpecifiers.indexOf(this.zero) >= 0) {
                p.throwInvalidFormatSpecifiers(this.zero, this.type);
            }
            else if (this.grouping !== undefined && rejectedSpecifiers.indexOf(this.grouping) >= 0) {
                p.throwInvalidFormatSpecifiers(this.grouping, this.type);
            }
            else if (this.locale !== undefined && rejectedSpecifiers.indexOf(this.locale) >= 0) {
                p.throwInvalidFormatSpecifiers(this.locale, this.type);
            }
        }

        const rejectPrecision = () => {
            if (this.precision !== undefined) {
                p.throwPrecisionNotAllowedWith(this.type);
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
            case "s": {
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
            p.throwInvalidFormatSpecifiers(this.grouping, this.locale);
        }
    }

    getSignChar(isNeg: boolean) {
        return isNeg ? "-" : ((this.sign === "+" || this.sign === " ") ? this.sign : "");
    }
}

export class ReplacementField {
    private argumentFieldId: string;
    private elementPresentation: ElementPresentation;
    private arrayPresentations: ArrayPresentation[];

    private static defaultArrayPresentation?: ArrayPresentation;

    constructor(p: FormatStringParser, readonly replFieldStr: string) {
        // Set error string.
        p.errorString = replFieldStr;

        // Remove edges '{' and '}' and split to parts by ':'.
        let replFieldParts = replFieldStr.substring(1, replFieldStr.length - 1).split(":");

        // First part is field identifier.
        this.argumentFieldId = replFieldParts.shift() ?? "";

        // Last part is element presentation.
        let epString = replFieldParts.pop() ?? "";

        // Parts in between are array presentations.
        let apStrings = replFieldParts;

        // Create element presentation.
        this.elementPresentation = new ElementPresentation(p, epString);

        // Create array presentations.
        this.arrayPresentations = apStrings.map(apString => new ArrayPresentation(p, apString));

        // Create default array presentation.
        if (!ReplacementField.defaultArrayPresentation) {
            ReplacementField.defaultArrayPresentation = new ArrayPresentation(p, "");
        }
    }

    // Get element presentation.
    getElementPresentation() {
        return this.elementPresentation;
    }

    // Get array presentation on given depth.
    getArrayPresentation(curArrayDepth: number, totArrayDepth: number): ArrayPresentation {
        let i = curArrayDepth + this.arrayPresentations.length - totArrayDepth;
        return i >= 0 && i < this.arrayPresentations.length ? this.arrayPresentations[i] : ReplacementField.defaultArrayPresentation!;
    }


    format(p: FormatStringParser): string {
        // Set error string.
        p.errorString = this.replFieldStr;

        // Following order is important for automatic field numbering.

        // 1: get argument.
        let arg = p.getArgument(this.argumentFieldId);

        // 2: Update width field of array presentations.
        this.arrayPresentations.forEach(ap => {
            if (ap.widthFieldId !== undefined) {
                ap.width = p.getNestedArgumentInt(ap.widthFieldId);
            }
        })

        let { elementPresentation: ep } = this;

        // 3: Update width field of element presentation.
        if (ep.widthFieldId !== undefined) {
            ep.width = p.getNestedArgumentInt(ep.widthFieldId);
        }

        // 4: Update precision field of element presentation.
        if (ep.precisionFieldId !== undefined) {
            ep.precision = p.getNestedArgumentInt(ep.precisionFieldId);
        }

        // Format argument and add it to result string.
        return p.formatArgument(arg, this);
    }
}
