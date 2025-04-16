import { FloatWrapper, IntWrapper } from "./int-float";
import { ThrowFormatError } from "./format-error";
import { FormatSpecifiers, FormatStringParser } from "./format-string-parser";

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

    constructor(readonly parser: FormatStringParser, readonly formatSpecifiers: FormatSpecifiers | undefined) {
        if (!formatSpecifiers) {
            this.type = "";
        }
        else {
            let { fill, align, sign, zeta, sharp, zero, width, width_field_n, grouping, precision, precision_field_n, locale, type } = formatSpecifiers;

            this.fill = (fill && fill.length === 1) ? fill : undefined;
            this.align = (align === "<" || align === "^" || align === ">" || align === "=") ? align : undefined;
            this.sign = (sign === "-" || sign === "+" || sign === " ") ? sign : undefined;
            this.zeta = zeta === "z" ? zeta : undefined;
            this.sharp = sharp === "#" ? sharp : undefined;
            this.zero = zero === "0" ? zero : undefined;
            this.width = width_field_n !== undefined ? parser.getNestedArgumentInt(width_field_n) : (!!width ? +width : undefined);
            this.grouping = (grouping === "," || grouping === "_") ? grouping : undefined;
            this.precision = precision_field_n !== undefined ? parser.getNestedArgumentInt(precision_field_n) : (!!precision ? +precision : undefined);
            this.locale = locale === "L" ? locale : undefined;
            this.type = (type === "" || type && "s?cdnbBoxXeEfF%gGaA".indexOf(type) >= 0) ? type as any : "";
        }
    }

    // Test if type is one of types given as argument.
    // For example isType("", "d", "xX") tests if type is either "", "d", "x" or "X".
    hasType(...types: string[]) {
        return !this.formatSpecifiers
            ? types.some(type => this.type === type) // If has no specifiers then this.type = "".
            : types.some(type => this.type === type || this.type !== "" && type.indexOf(this.type) >= 0);
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
        if (!this.formatSpecifiers) {
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
}
