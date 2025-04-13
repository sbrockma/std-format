
// Create string that is string s repeated count times
function repeatString(repeatStr: string, repeatCount: number): string {
    assert(repeatCount >= 0, "repeatCount < 0");
    return new Array(repeatCount + 1).join(repeatStr);
}

// Create number array that contains number n count times
function zeroArray(zeroCount: number): 0[] {
    assert(zeroCount >= 0, "zeroCount < 0");
    return new Array<0>(zeroCount).fill(0);
}

// Test if number is integer.
function isInteger(n: unknown): n is number {
    return typeof n === "number" && !isNaN(n) && isFinite(n) && n === Math.trunc(n);
}

// Function to convert digit value to digit character.
function mapDigitToChar(d: number) {
    return "0123456789abcdef"[d];
}

// Is value negative. For number -0 is negative and +0 is positive.
function isNegative(n: number | bigint) {
    return typeof n === "bigint" ? (n < 0) : (n < 0 || 1.0 / n === -Infinity);
}

// Get number from number or bigint.
function getNumber(n: number | bigint): number {
    if (typeof n === "bigint") {
        // Make sure bigint is in safe number range.
        const MAX_SAFE_INTEGER = 9007199254740991;
        const MIN_SAFE_INTEGER = -9007199254740991;
        assert(n <= MAX_SAFE_INTEGER && n >= MIN_SAFE_INTEGER, "Cannot get number from bigint, too big value.");
        // Return bigint as number.
        return Number(n);
    }
    else {
        // Return number.
        return n;
    }
}

// This parsing context contains all necessary variables required in parsing.
type ParsingContext = {
    formatString: string,
    formatArgs: unknown[],
    parseString: string,
    parsePosition: number,
    resultString: string,
    errorString: string,
    automaticFieldNumber: number,
    hasAutomaticFieldNumbering: boolean,
    hasManualFieldSpecification: boolean
}

function getErrorMessage(ctx: ParsingContext | undefined, msg: string) {
    if (ctx) {
        if (ctx.errorString === ctx.formatString) {
            return msg + ", in \"" + ctx.errorString + "\"";
        }
        else {
            return msg + ", in \"" + ctx.formatString + "\" (col " + ctx.parsePosition + " = \"" + ctx.errorString + "\")";
        }
    }
    else {
        return msg;
    }
}

// Exceoption class, trown on format and value errors.
export class FormatError extends Error {
    // private constructor. Use static functions below to create error objects.
    private constructor(readonly ctx: ParsingContext | undefined, msg: string) {
        super(getErrorMessage(ctx, msg));

        this.name = usingDeprecatedStdFormat ? "StdFormatError" : "FormatError";

        // console.log(this.message);
    }

    // Create specifier is not implemented error.
    static SpecifierIsNotImplemented(ctx: ParsingContext, specifier: string) {
        return new FormatError(ctx, "Specifier '" + specifier + "' is not implemented");
    }

    // Create invalid argument error.
    static InvalidArgumentForType(ctx: ParsingContext, arg: unknown, type: string) {
        return new FormatError(ctx, "Invalid " + typeof arg + " argument '" + String(arg) + "' for type specifier '" + type + "'");
    }

    // Create invalid nested argument error.
    static InvalidNestedArgument(ctx: ParsingContext, arg: unknown) {
        return new FormatError(ctx, "Invalid nested argument '" + String(arg) + "'");
    }

    // Create invalid field number error.
    static InvalidFieldNumber(ctx: ParsingContext, fieldNumber: string) {
        return new FormatError(ctx, "Invalid field number '" + fieldNumber + "'");
    }

    // Create switch between auto/manual field numbering error.
    static SwitchBetweenAutoAndManualFieldNumbering(ctx: ParsingContext) {
        return new FormatError(ctx, "Switch between automatic and manual field numbering");
    }

    // Create encounteger single curly brace error.
    static EncounteredSingleCurlyBrace(ctx: ParsingContext) {
        return new FormatError(ctx, "Encountered single curly brace");
    }

    // Create invalid replacement field error.
    static InvalidReplacementField(ctx: ParsingContext) {
        return new FormatError(ctx, "Invalid replacement field");
    }

    // Create precision not allowed error.
    static PrecisionNotAllowedWith(ctx: ParsingContext, type: string) {
        return new FormatError(ctx, "Precision not allowed with type specifier '" + type + "'");
    }

    // Create specifier not allowed error.
    static SpecifierNotAllowedWith(ctx: ParsingContext, specifier1: string, specifier2: string) {
        return new FormatError(ctx, "Specifier '" + specifier1 + "' not allowed with specifier '" + specifier2 + "'");
    }

    // Create invalid specification hint error.
    static InvalidSpecificationHint(specHint: string) {
        return new FormatError(undefined, "Invalid specification hint '" + specHint + "'. Valid values are 'cpp' and 'python'.");
    }

    // Create assertion failed internal error.
    static AssertionFailed(msg?: string) {
        return new FormatError(undefined, "Assertion failed" + (msg === undefined ? "!" : (": " + msg)));
    }

    // Is this internal error?
    isInternalError() {
        return this.message.startsWith("Assertion failed");
    }
}

// Assert function for internal validation.
function assert(condition: boolean, msg?: string) {
    if (!condition) {
        throw FormatError.AssertionFailed(msg)
    }
}

// Get user/system locale
const defaultLocale = (function getUserLocale(): string | undefined {
    try {
        return (navigator?.languages ? navigator.languages[0] : navigator?.language) ?? Intl.DateTimeFormat().resolvedOptions().locale;
    }
    catch (e) {
        return undefined;
    }
})() ?? "en-UK";

// Locale's decimal and group separators.
let localeDecimalSeparator = ".";
let localeGroupSeparator = ",";

// Set locale that will be used in locale based formatting.
export function setLocale(locale?: string | undefined) {
    try {
        let nf = Intl.NumberFormat(locale ?? defaultLocale).formatToParts(33333.3);

        // Extract decimal and group separators.
        localeDecimalSeparator = nf.find(part => part.type === "decimal")?.value ?? ".";
        localeGroupSeparator = nf.find(part => part.type === "group")?.value ?? "";
    }
    catch (e) {
        if (locale) {
            console.log("Failed to fetch information for locale " + locale + ".");
        }
        localeDecimalSeparator = ".";
        localeGroupSeparator = ",";
    }
}

// Init with default locale
setLocale();

/**
 * https://en.cppreference.com/w/cpp/utility/format/spec
 * https://docs.python.org/3/library/string.html#formatspec
 * 
 * [[fill]align][sign]["z"]["#"]["0"][width][grouping_option]["." precision][L][type]
 */

// The format specification regex. THis is combination of c++ and python specifications.
const FormatSpecificationRegExString =
    "((?<fill>[^{}]?)(?<align>[<^>=]))?" + // fill (any char except '{' or '}') and align
    "(?<sign>[-+ ])?" + // sign
    "(?<zeta>[z])?" + // z
    "(?<sharp>[#])?" + // #
    "(?<zero>[0])?" + // 0
    "((?<width>\\d+)|\{(?<width_field_n>\\d*)\})?" + // width
    "(?<grouping>[,_])?" +  // , or _
    "(\.((?<precision>\\d+)|\{(?<precision_field_n>\\d*)\}))?" + // precision
    "(?<locale>[L])?" + // L
    "(?<type>[s?cdnbBoxXeEfF%gGaA])?"; // type

// Replacement field regex.
const ReplacementFieldRegEx = new RegExp(
    "^\{" +
    "(?<field_n>\\d+)?" +
    "(\:(" + FormatSpecificationRegExString + "))?" +
    "\}"
);

// Regex to test if string loosely matches of replacement field.
const LooseMatchReplacementFieldRegEx = new RegExp(
    "^\{" +
    "[^{}]*" +
    "(:([^{}]*" + "\{[^{}]*\}" + "){0,2}[^{}]*)?" +
    "\}"
);

// Regex to find next curly bracet.
const CurlyBracketRegEx = new RegExp("[{}]");

// Regex for one or more digits.
const DigitsRegex = /^\d+$/;

// The format specification class
class FormatSpecification {
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
    readonly type: "" | "s" | "c" | "b" | "B" | "d" | "o" | "x" | "X" | "a" | "A" | "e" | "E" | "f" | "F" | "g" | "G" | "?" | "%" | "n";

    constructor(readonly ctx: ParsingContext, replFieldMatch: RegExpExecArray, getNestedArgumentInt: (ctx: ParsingContext, argId: string, fs: FormatSpecification) => number) {
        let fill = replFieldMatch.groups?.fill;
        let align = replFieldMatch.groups?.align;
        let sign = replFieldMatch.groups?.sign;
        let zeta = replFieldMatch.groups?.zeta;
        let sharp = replFieldMatch.groups?.sharp;
        let zero = replFieldMatch.groups?.zero;
        let width = replFieldMatch.groups?.width;
        let width_field_n = replFieldMatch.groups?.width_field_n;
        let grouping = replFieldMatch.groups?.grouping;
        let precision = replFieldMatch.groups?.precision;
        let precision_field_n = replFieldMatch.groups?.precision_field_n;
        let locale = replFieldMatch.groups?.locale;
        let type = replFieldMatch.groups?.type;

        this.fill = (fill && fill.length === 1) ? fill : undefined;
        this.align = (align === "<" || align === "^" || align === ">" || align === "=") ? align : undefined;
        this.sign = (sign === "-" || sign === "+" || sign === " ") ? sign : undefined;
        this.zeta = zeta === "z" ? zeta : undefined;
        this.sharp = sharp === "#" ? sharp : undefined;
        this.zero = zero === "0" ? zero : undefined;
        this.grouping = (grouping === "," || grouping === "_") ? grouping : undefined;
        this.locale = locale === "L" ? locale : undefined;
        this.type = (type === "" || type && "s?cdnbBoxXeEfF%gGaA".indexOf(type) >= 0) ? type as any : "";

        // Do these last because getNestedArgumentInt needs this object.
        this.width = width_field_n !== undefined ? getNestedArgumentInt(ctx, width_field_n, this) : (!!width ? +width : undefined);
        this.precision = precision_field_n !== undefined ? getNestedArgumentInt(ctx, precision_field_n, this) : (!!precision ? +precision : undefined);
    }

    // Test if type is one of types given as argument.
    // For example isType("", "d", "xX") tests if type is either "", "d", "x" or "X".
    hasType(...types: string[]) {
        return types.some(type => this.type === type || this.type !== "" && type.indexOf(this.type) >= 0);
    }

    allowSpecifiers(specifierWhiteList: string) {
        if (this.align !== undefined && specifierWhiteList.indexOf(this.align) < 0) {
            throw FormatError.SpecifierNotAllowedWith(this.ctx, this.type, this.align);
        }
        else if (this.sign !== undefined && specifierWhiteList.indexOf(this.sign) < 0) {
            throw FormatError.SpecifierNotAllowedWith(this.ctx, this.type, this.sign);
        }
        else if (this.zeta !== undefined && specifierWhiteList.indexOf(this.zeta) < 0) {
            throw FormatError.SpecifierNotAllowedWith(this.ctx, this.type, this.zeta);
        }
        else if (this.sharp !== undefined && specifierWhiteList.indexOf(this.sharp) < 0) {
            throw FormatError.SpecifierNotAllowedWith(this.ctx, this.type, this.sharp);
        }
        else if (this.zero !== undefined && specifierWhiteList.indexOf(this.zero) < 0) {
            throw FormatError.SpecifierNotAllowedWith(this.ctx, this.type, this.zero);
        }
        else if (this.grouping !== undefined && specifierWhiteList.indexOf(this.grouping) < 0) {
            throw FormatError.SpecifierNotAllowedWith(this.ctx, this.type, this.grouping);
        }
        else if (this.locale !== undefined && specifierWhiteList.indexOf(this.locale) < 0) {
            throw FormatError.SpecifierNotAllowedWith(this.ctx, this.type, this.locale);
        }
    }
}

// Class is for converting finite numbers.
class FiniteNumberConverter {
    // Base of number can be 2, 8, 10 or a6.
    readonly base: number;

    // Sign is 1 or -1.
    sign: number;

    // Digits contains digits of the number. Each digit is between 0 <= digit <= base - 1.
    digits: number[];

    // DotPos tells the position of dot in digits array.
    // It is value between 1 <= dotPos <= digits.length
    //     * If 1 then dot is after first digit in digits array (= scientific notation)
    //     * If digits.length then dot is after last digit in digits array.
    dotPos: number;

    // Exp is the exponent of number. It is relative to dot position.
    exp: number;

    // Constructor
    constructor(value: number | bigint, readonly fs: FormatSpecification) {
        // Value must be finite number
        assert(typeof value === "bigint" || typeof value === "number" && isFinite(value), "Value is not finite.");

        // Set base
        if (fs.hasType("bB")) {
            this.base = 2;
        }
        else if (fs.hasType("o")) {
            this.base = 8;
        }
        else if (fs.hasType("xXaA")) {
            this.base = 16;
        }
        else {
            this.base = 10;
        }

        // Initialize sign, digits, dot position and exponent to initial values.
        this.sign = isNegative(value) ? -1 : +1;
        this.digits = [];
        this.dotPos = 0;
        this.exp = 0;

        if (typeof value === "number") {
            // Split absolute value into integer and fractional parts.
            let absValue = Math.abs(value);
            let intPart = Math.floor(absValue);
            let fracPart = absValue - intPart;

            // Get integer part digits. Repeat while remaining integer part > 0
            while (intPart > 0) {
                // Calculate digit
                let digit = intPart % this.base;

                if (this.digits.length === 0 && digit === 0) {
                    // Do not add trailing zeroes, just increase exponent.
                    this.exp++;
                }
                else {
                    // Add digit to left of digits array.
                    this.digits.unshift(digit);

                    // Increase dot position so it keeps pointing after last digit.
                    this.dotPos++;
                }

                // Make next digit to become lowest digit of integer part.
                intPart = Math.trunc(intPart / this.base);
            }

            // Get fraction part digits.
            if (fracPart > 0) {
                // Have to add trailing zeroes of integer part before adding fraction digits.
                while (this.exp > 0) {
                    // Add trailing zero.
                    this.digits.push(0);

                    // Increase dot position to keep it pointing after last digit,
                    // and decrease exponent to keep total value unchanged.
                    this.dotPos++;
                    this.exp--;
                }

                // Repeat while remaining fraction part > 0.
                while (fracPart > 0) {
                    // Multiply frac part to make left most digit integer.
                    fracPart *= this.base;

                    // Left most digit is now integer part.
                    let digit = Math.floor(fracPart);

                    // Remove digit from fractional part.
                    fracPart -= digit;

                    if (digit === 0 && this.digits.length === 0) {
                        // Digit is zero and digits is still empty, there is no integer nor fraction part.
                        // Getting smaller number, decrease exponent.
                        this.exp--;
                    }
                    else if (digit > 0 && this.digits.length === 0) {
                        // Got non-zero digit but digits is still empty, let's add first fraction digit.
                        this.digits.push(digit);

                        // Decrease exponent, and set dot position after first digit.
                        this.exp--;
                        this.dotPos = 1;
                    }
                    else {
                        // Digits is not empty, lets just add new fraction digit.
                        this.digits.push(digit);
                    }
                }
            }
        }
        else if (typeof value === "bigint") {
            // Get absolute integer parts.
            let intPart = value < 0 ? -value : value;

            // Get integer part digits. Repeat while remaining integer part > 0
            while (intPart > 0) {
                // Calculate digit
                let digit = Number(intPart % BigInt(this.base));

                if (this.digits.length === 0 && digit === 0) {
                    // Do not add trailing zeroes, just increase exponent.
                    this.exp++;
                }
                else {
                    // Add digit to left of digits array.
                    this.digits.unshift(digit);

                    // Increase dot position so it keeps pointing after last digit.
                    this.dotPos++;
                }

                // Make next digit to become lowest digit of integer part.
                // bigint division truncates.
                intPart = intPart / BigInt(this.base);
            }
        }

        // Was zero?
        if (this.digits.length === 0) {
            this.digits = [0];
            this.dotPos = 1;
            this.exp = 0;
        }

        // The digitizer algorithm above works so that there should not be any leading or trailing zeroes.
        assert(this.digits.length === 1 || this.digits.length > 1 && this.digits[0] !== 0 && this.digits[this.digits.length - 1] !== 0,
            "Unexpected leading or trailing zero.");

        // If format specifier is "%" then convert value to percents.
        if (!this.isZero() && fs.hasType("%")) {
            // Multiply by 100 by moving exponent right two digits (base = 10).
            this.exp += 2;
        }

        // Make scientific notation (dot position = 1)
        this.exp += this.dotPos - 1;
        this.dotPos = 1;

        // Convert this number to notation specified by format specification.
        this.convertToNotation(value);
    }

    // Get parsing context
    get ctx() {
        return this.fs.ctx;
    }

    // Is this number zero?
    private isZero() {
        // After conversion zero can have more than one zero digits, for exmaple "0.00".
        return this.digits.length >= 1 && this.digits.every(d => d === 0);
    }

    // Is this number integer?
    private isInteger() {
        // It is integer if dot position + exponent is at the end of digits or further.
        return (this.dotPos + this.exp) >= this.digits.length;
    }

    // Validate internal state.
    private validateInternalState() {
        if (this.isZero()) {
            assert(this.exp === 0, "Is zero but exp != 0");
            assert(this.dotPos === 1, "Is zero but dot pos != 1");
        }

        assert(isInteger(this.exp), "exp is not finite");
        assert(isInteger(this.dotPos), "dotPos is not finite");

        assert(isInteger(this.dotPos) && this.dotPos >= 1, "dotPos = " + this.dotPos + " < 1");
        assert(this.dotPos <= this.digits.length, "dotPos = " + this.dotPos + " > digits.length = " + this.digits.length);
    }

    // Get copy of class properties sign, digits, dotPos and exp.
    private save() {
        let sign = this.sign;
        let digits = this.digits.slice();
        let dotPos = this.dotPos;
        let exp = this.exp;
        return { sign, digits, dotPos, exp }
    }

    // Restore saved class properties.
    private restore(saved: { sign: number, digits: number[], dotPos: number, exp: number }) {
        this.sign = saved.sign;
        this.digits = saved.digits.slice()
        this.dotPos = saved.dotPos;
        this.exp = saved.exp;
    }

    // Convert number format so that exponent is removed (exp = 0).
    private toZeroExponent() {
        // Move dot position by exponent and set exponent to zero.
        this.dotPos += this.exp;
        this.exp = 0;

        // If dot position was moved right past end of digits then
        // add zeroes from the end of digits to dot position.
        if (this.dotPos > this.digits.length) {
            this.digits.splice(this.digits.length, 0, ...zeroArray(this.dotPos - this.digits.length));
        }

        // If dot position was moved left past first digit then
        // add zeroes to beginning so that dot position becomes 1.
        if (this.dotPos < 1) {
            this.digits.splice(0, 0, ...zeroArray(1 - this.dotPos));
            this.dotPos = 1;
        }

        // Validate internal state
        this.validateInternalState();
    }

    // Convert to precision (number of digits). Performs rounding if necessary.
    private toPrecision(precision: number, precisionType: "fixed" | "precision") {
        // Get new digit count.
        // * In fixed type new digit count is number of digits after dot.
        // * Else new digit count is precision. 
        let newDigitCount = precisionType === "fixed" ? (this.dotPos + precision) : precision;

        if (newDigitCount === this.digits.length || newDigitCount < 1) {
            // Nothing to do, newDigitCount equals digits.length or is less than 1.
            return;
        }
        else if (newDigitCount > this.digits.length) {
            // If newDigitCount > digits.length then all that is needed is to add trailing zeroes.
            this.digits.splice(this.digits.length, 0, ...zeroArray(newDigitCount - this.digits.length));
            return;
        }

        // Get first digit to be removed. It can be past number of digits so ?? 0.
        let firstRemovedDigit = this.digits[newDigitCount] ?? 0;

        // Remove digits from end (newDigitCount < digits.length).
        this.digits.splice(newDigitCount, this.digits.length - newDigitCount);

        // And add zeroes from newDigitCount to dotPos
        if (newDigitCount < this.dotPos) {
            this.digits.splice(newDigitCount, 0, ...zeroArray(this.dotPos - newDigitCount));
        }

        // Does first removed digit cause rounding up.
        if (firstRemovedDigit >= Math.ceil(this.base / 2)) {
            // Yes.
            for (let pos = newDigitCount - 1; ; pos--) {
                // Is pos greater or equal to zero (handling existing digits)
                if (pos >= 0) {
                    // Digit in current position increased because there is rounding
                    let curDigit = this.digits[pos] + 1;

                    // Is current digit over max allowed value in base?
                    if (curDigit >= this.base) {
                        // Set current digit to zero
                        this.digits[pos] = 0;
                        // Continue while loop (rounding next digit)
                        continue;
                    }
                    else {
                        // Set current digit.
                        this.digits[pos] = curDigit;
                        // No more rounding necessary, current digit belongs to base.
                        break;
                    }
                }
                else {
                    // Digit pos < 0, need to add "1" to start of digits
                    this.digits.unshift(1);

                    if (precisionType === "fixed") {
                        // If type = "fixed" then increase dot pos to compensate 
                        // because we just added new digit to start of digits.
                        // Digits after dot position and exponent remains unaltered.
                        this.dotPos++;
                    }
                    else {
                        // If type = "precision" then need to keep total digit count 
                        // unaltered, so remove digit (0) from right.
                        this.digits.pop();

                        // Increase exponent to compensate that dotPos now 
                        // points one position too left. This keeps digit count 
                        // left side of dot unaltered.
                        this.exp++;
                    }

                    // DotPos was possibly increased over digits length
                    if (this.dotPos > this.digits.length) {
                        // Move dotPos back to end of digits.
                        this.exp += this.dotPos - this.digits.length;
                        this.dotPos = this.digits.length;
                    }

                    // We are done
                    break;
                }
            }
        }

        // Validate internal state
        this.validateInternalState();
    }

    // Convert number to fixed notation.
    // Precision is number of digits after decimal point.
    private toFixed(precision: number) {
        // Make exponent to zero.
        this.toZeroExponent();

        // Set fixed precision digits after dot
        this.toPrecision(precision, "fixed");
    }

    // Convert number to scientific notation.
    // Precision is number of digits after decimal point.
    // So total digits is (p + 1).
    private toScientific(precision: number) {
        // Move dot to position to right after first digit.
        this.exp += this.dotPos - 1;
        this.dotPos = 1;

        // Set total (precision + 1) digits.
        this.toPrecision(precision + 1, "precision");
    }

    // Convert number to normalised hexadecimal exponential notation
    private toNormalisedHexadecimalExponential() {
        if (this.isZero()) {
            // nothing to do.
            return;
        }

        // Make exponent to zero
        this.toZeroExponent();

        // Some assertions
        assert(this.exp === 0, "exp !== 0");
        assert(this.base === 16, "base !== 16");
        assert(this.dotPos >= 1, "dotPos < 1");

        // Make scientific format setting dotPos to 1 and altering exponent.
        // Exponent in hexadecimal exponential presentation is in binary (thus * 4).
        this.exp += (this.dotPos - 1) * 4;
        this.dotPos = 1;

        // Convert digits to binary string of zeroes and ones.
        let binaryDigits: (0 | 1)[] = [];
        for (let i = 0; i < this.digits.length; i++) {
            let d = this.digits[i];
            binaryDigits.push(d & 0b1000 ? 1 : 0);
            binaryDigits.push(d & 0b0100 ? 1 : 0);
            binaryDigits.push(d & 0b0010 ? 1 : 0);
            binaryDigits.push(d & 0b0001 ? 1 : 0);
        }

        // Make first four digits [0, 0, 0, 1].
        let firstOneId = binaryDigits.indexOf(1);
        if (firstOneId >= 0) {
            if (firstOneId > 3) {
                // Multiply by shifting left.
                let shiftLeft = firstOneId - 3;

                // Remove digits from left.
                binaryDigits.splice(0, shiftLeft);

                // Decrease exponent to keep value unchanged.
                this.exp -= shiftLeft;
            }
            else if (firstOneId < 3) {
                // Divide by shifting right.
                let shiftRight = 3 - firstOneId;

                // Add zeroes to left.
                binaryDigits.splice(0, 0, ...zeroArray(shiftRight));

                // Remove digits from right.
                binaryDigits.splice(binaryDigits.length - shiftRight, firstOneId);

                // Increase exponent to keep value unchanged.
                this.exp += shiftRight;
            }
        }

        // First 4 digits should be 0001 (binary) = 1 (hex).
        assert(binaryDigits[0] === 0 && binaryDigits[1] === 0 && binaryDigits[2] === 0 && binaryDigits[3] === 1);

        // Convert binary digits back to hexadecimal digits
        this.digits = [];
        for (let i = 0; i < binaryDigits.length; i += 4) {
            // Convert 4 digits from binary to hex and push to end of digits.
            this.digits.push(
                (binaryDigits[i + 0] ? 0b1000 : 0) |
                (binaryDigits[i + 1] ? 0b0100 : 0) |
                (binaryDigits[i + 2] ? 0b0010 : 0) |
                (binaryDigits[i + 3] ? 0b0001 : 0)
            );
        }

        // Remove any trailing zeroes (ok, is in scientific notation).
        while (this.digits.length > 1 && this.digits[this.digits.length - 1] === 0) {
            this.digits.pop();
        }

        // Number is now in normalised hexadecimal exponential.

        // Validate internal state
        this.validateInternalState();
    }

    // Convert this number to notation specified by format specification.
    private convertToNotation(value: number | bigint) {
        // Remove insignificant trailing zeroes (optionally leaving that one digit past dotPos)
        const removeInsignificantTrailingZeroes = (leave: 0 | 1 = 0) => {
            while (this.digits.length > Math.max(1, this.dotPos + leave) && this.digits[this.digits.length - 1] === 0) {
                this.digits.pop();
            }
        }

        // Format specification fs.
        let { fs } = this;

        // Now make conversion according to fs.type
        if (fs.hasType("") && (fs.precision !== undefined || !this.isInteger())) {
            // If type is default, and has precision or is not integer.

            // This is almost like the 'g'. Use p = as large as needed to represent
            // the given value faithfully, if not given. Treat p = 0 as p = 1.
            let p = Math.max(1, fs.precision ?? this.digits.length);

            // Save number value. Possibly needs to be restored later.
            let saved = this.save();

            // Convert to scientific notation with precision (p - 1).
            this.toScientific(p - 1);

            // Switch to fixed if -4 < exp < p-1.
            if (-4 <= this.exp && this.exp < p - 1) {
                // Restore original format before switching to another notation.
                this.restore(saved);

                // Convert to fixed notation.
                this.toFixed(Math.max(1, p - 1 - this.exp));

                // Remove insignificant trailing zeroes.
                // Include at least one digit past the decimal point.
                removeInsignificantTrailingZeroes(1);
            }
            else {
                // Remove insignificant trailing zeroes.
                removeInsignificantTrailingZeroes();
            }
        }
        else if (fs.hasType("", "dnbBoxX")) {
            // Else if type is default '' or integer

            // For integers -0 = +0 = 0
            if (this.isZero() && this.sign === -1) {
                this.sign = 1;
            }

            // Make exponent to zero.
            this.toZeroExponent();

            // Number must be integer
            if (!this.isInteger()) {
                throw FormatError.InvalidArgumentForType(this.ctx, value, fs.type);
            }
        }
        else if (fs.hasType("eE")) {
            // Get precision. If not given, default is 6.
            let p = fs.precision ?? 6;

            // Convert to scientific notation
            this.toScientific(p);
        }
        else if (fs.hasType("fF%")) {
            // Get precision. If not given, default is 6.
            let p = fs.precision ?? 6;

            // Convert to fixed notation.
            this.toFixed(p);
        }
        else if (fs.hasType("gG")) {
            // Convert to general notation.

            // Get precision. Treat p = 0 as p = 1. If not given, default is 6.
            let p = Math.max(1, fs.precision ?? 6);

            // Save number value. Possibly needs to be restored later.
            let saved = this.save();

            // Convert to scientific notation.
            this.toScientific(p - 1);

            // Switch to fixed notation if -4 <= exp < p.
            if (-4 <= this.exp && this.exp < p) {
                // restore number value before converting to fixed.
                this.restore(saved);

                // Convert to fixed notation. Precision is (p - 1 - exp).
                this.toFixed(p - 1 - this.exp);
            }

            // Was sharp specifier '#' was given for 'g' and 'G'?
            if (fs.sharp !== "#") {
                // Remove insignificant trailing zeroes.
                removeInsignificantTrailingZeroes();
            }
        }
        else if (fs.hasType("aA")) {
            // Convert to normalised hexadecimal exponential notation.
            this.toNormalisedHexadecimalExponential();

            // If precision not given use as big precision as possible.
            let p = fs.precision ?? (this.digits.length - 1);

            // Convert to scientific notation. Normalised hexadecimal exponential notation
            // already is in scientific notation but this sets precision and does rounding. 
            this.toScientific(p);
        }
        else {
            throw FormatError.InvalidArgumentForType(this.ctx, value, fs.type);
        }

        if (fs.zeta === "z") {
            // The 'z' option coerces negative zero floating-point values to
            // positive zero after rounding to the format precision.
            // Change -0 to 0.
            if (this.isZero() && this.sign === -1) {
                this.sign = 1;
            }
        }

        // Validate internal state.
        this.validateInternalState();
    }
}

namespace NumberFormatter {
    // Get number prefix.
    function getNumberPrefix(fs: FormatSpecification) {
        return fs.sharp === "#" ? (
            fs.hasType("xX") ? "0x" : fs.hasType("bB") ? "0b" : fs.hasType("o") ? (usingDeprecatedStdFormat ? deprecatedOctalPrefix : "0o") : ""
        ) : "";
    }

    // Get grouping properties
    function getGroupingProps(fs: FormatSpecification): { decimalSeparator: string, groupSeparator: string, groupSize: number } {
        if (fs.grouping === ",") {
            return { decimalSeparator: ".", groupSeparator: ",", groupSize: 3 }
        }
        else if (fs.grouping === "_") {
            if (fs.hasType("deEfF%gG")) {
                return { decimalSeparator: ".", groupSeparator: "_", groupSize: 3 }
            }
            else if (fs.hasType("bBoxX")) {
                // With binary, octal and hexadecimal type specifiers group size is 4.
                return { decimalSeparator: ".", groupSeparator: "_", groupSize: 4 }
            }
        }
        else if (fs.locale) {
            // The L option causes the locale-specific form to be used.
            // Use locale's decimal and group separators.
            return { decimalSeparator: localeDecimalSeparator, groupSeparator: localeGroupSeparator, groupSize: 3 }
        }
        else if (fs.hasType("n")) {
            // Use locale's decimal and group separators.
            return { decimalSeparator: localeDecimalSeparator, groupSeparator: localeGroupSeparator, groupSize: 3 }
        }

        // If no grouping then set grouping separator to empty string and group size to Infinity.
        return { decimalSeparator: ".", groupSeparator: "", groupSize: Infinity }
    }

    // Get char code
    function getCharCode(value: number | bigint, fs: FormatSpecification): number {
        try {
            // Is char code valid integer and in range?
            let charCode = getNumber(value);
            assert(isInteger(charCode) && charCode >= 0 && charCode <= 65535, "Invalid char code.");
            return charCode;
        }
        catch (e) {
            throw FormatError.InvalidArgumentForType(fs.ctx, value, fs.type);
        }
    }

    // Convert this number to string.
    export function formatNumber(value: number | bigint, fs: FormatSpecification): string {
        // Set sign. "-", "+", " " or "".
        let sign: string;

        // Prefix string. "0x" for hexadecimal, etc.
        let prefix: string;

        // Digits string.
        let digits: string;

        // Exponent string.
        let exp: string;

        // Postfix string. "%" for percentage types, or "".
        let postfix: string = fs.hasType("%") ? "%" : "";

        const getSign = (v: number) => v < 0 ? "-" : ((fs.sign === "+" || fs.sign === " ") ? fs.sign : "");

        if (fs.hasType("c")) {
            // Is char? Set digits string to contain single char obtained from char code.
            digits = String.fromCharCode(getCharCode(value, fs));

            // Other props empty.
            sign = exp = prefix = "";
        }
        else if (typeof value === "number" && isNaN(value)) {
            // Is nan?
            prefix = "";
            sign = getSign(value);
            digits = "nan";
            exp = "";
        }
        else if (typeof value === "number" && Math.abs(value) === Infinity) {
            // Is inf?
            prefix = "";
            sign = getSign(value);
            digits = "inf";
            exp = "";
        }
        else {
            let n = new FiniteNumberConverter(value, fs);

            sign = getSign(n.sign);

            // Some type specifiers do not show zero exponent.
            let omitZeroExp = !fs.hasType("eEaA");

            // Some type specifiers add zero prefix to single digit exponent.
            let needTwoDigitExp = fs.hasType("", "eEgG");

            if (n.exp === 0 && omitZeroExp) {
                // No zero exponent.
                exp = "";
            }
            else {
                // Get exponent to string. Absolute value for now.
                exp = "" + Math.abs(n.exp);

                // Add leading zero if exponent needs at least two digits.
                if (exp.length < 2 && needTwoDigitExp) {
                    exp = "0" + exp;
                }

                // Format exponent string. Add "p" (norm. hex. exp. ntt) or "e",
                // sign, and absolute value of exponent.
                exp = (n.base === 16 ? "p" : "e") + (n.exp < 0 ? "-" : "+") + exp;
            }

            // Get grouping props.
            let groupingProps = getGroupingProps(fs);

            // Split digits to integer and fractional parts.
            let intDigits = n.digits.slice(0, n.dotPos);
            let fracDigits = n.digits.slice(n.dotPos);

            if (groupingProps.groupSeparator === "" || intDigits.length <= groupingProps.groupSize) {
                // No grouping required.
                // Add integer digits.
                digits = intDigits.map(mapDigitToChar).join("");
            }
            else {
                // Grouping required.
                digits = "";

                // Get group count.
                let groupCount = Math.ceil(intDigits.length / groupingProps.groupSize);

                // Add groups' digits separated by group separator.
                for (let g = groupCount - 1; g >= 0; g--) {
                    let start = intDigits.length - (g + 1) * groupingProps.groupSize;
                    let end = intDigits.length - g * groupingProps.groupSize;
                    let groupDigits = intDigits.slice(Math.max(0, start), end).map(mapDigitToChar).join("");
                    digits += groupDigits + (g > 0 ? groupingProps.groupSeparator : "");
                }
            }

            // Is there fraction digits?
            if (fracDigits.length > 0) {
                // Add decimal separator and fraction digits.
                digits += groupingProps.decimalSeparator + fracDigits.map(mapDigitToChar).join("");
            }

            // Include dot after last digit if sharp specifier is '#' with some type specifiers.
            if (n.dotPos === n.digits.length && fs.sharp === "#" && fs.hasType("eEfF%gGaA")) {
                digits += ".";
            }

            // Get prefix.
            prefix = getNumberPrefix(fs);

            // Omit octal prefix "0" if digits is "0".
            if (prefix === "0" && digits === "0") {
                prefix = "";
            }
        }

        // Get formatting width for number related filling.
        let width = fs.width ?? 0;

        // Get count of fill characters.
        // It is width minus sign, prefix, digits, exponent, and postfix.
        let fillCount = Math.max(0, width - sign.length - prefix.length - digits.length - exp.length - postfix.length);

        // Fill character.
        let fillChar: string;

        // Here we only add filling that occurs between sign (or prefix) and digits.
        // That means if align is '=' or if align is not defined and '0' is specified.
        if (fs.align === "=") {
            fillChar = fs.fill ?? fs.zero ?? " ";
        }
        else if (fs.align === undefined && fs.zero !== undefined) {
            fillChar = fs.zero;
        }
        else {
            fillChar = "";
            fillCount = 0;
        }

        // Form final string representation by adding all components and fill.
        let str = sign + prefix + repeatString(fillChar, fillCount) + digits + exp + postfix;

        // Convert to uppercase if specified by format specification type.
        return fs.hasType("AGEFBX") ? str.toUpperCase() : str;
    }
}

namespace StringFormatter {
    export function formatString(str: string, fs: FormatSpecification) {
        if (fs.hasType("?")) {
            // Here should format escape sequence string.
            throw FormatError.SpecifierIsNotImplemented(fs.ctx, fs.type);
        }

        // For string presentation types precision field indicates the maximum
        // field size - in other words, how many characters will be used from the field content.
        if (fs.precision !== undefined && str.length > fs.precision) {
            str = str.substring(0, fs.precision);
        }

        return str;
    }
}

// Validate that specifiers are good for given type specifier and argument.
function validateSpecifiers(arg: unknown, fs: FormatSpecification) {
    switch (fs.type) {
        default:
            if (typeof arg === "string") {
                fs.allowSpecifiers("<^>");
            }
            else if (typeof arg === "number" || typeof arg === "bigint") {
                // Allow 'z' (and precision) for numbers (there is not separate int/float).
                fs.allowSpecifiers("<^>=-+ z0,_L");
            }
            break;
        case "s": case "?":
            fs.allowSpecifiers("<^>");
            break;
        case "c":
            fs.allowSpecifiers("<^>=0");
            break;
        case "d":
            fs.allowSpecifiers("<^>=-+ #0,_L");
            break;
        case "n":
            fs.allowSpecifiers("<^>=-+ #0");
            break;
        case "b": case "B": case "o": case "x": case "X":
            fs.allowSpecifiers("<^>=-+ #0_");
            break;
        case "e": case "E": case "f": case "F": case "%": case "g": case "G": case "a": case "A":
            fs.allowSpecifiers("<^>=-+ z#0,_L");
            break;
    }

    // Precision not allowed for integer format specifiers.
    if (fs.hasType("cdnbBoxX") && fs.precision !== undefined) {
        throw FormatError.PrecisionNotAllowedWith(fs.ctx, fs.type);
    }

    // Grouping not allowed with locale.
    if (fs.grouping !== undefined && fs.locale !== undefined) {
        throw FormatError.SpecifierNotAllowedWith(fs.ctx, fs.grouping, fs.locale);
    }
}

/**
 * Formats the replacement field.
 * @arg is the argument given to format("", arg0, arg1, ...)
 * @fs is the parsed format specification.
 */
function formatReplacementField(ctx: ParsingContext, arg: unknown, fs: FormatSpecification): string {
    validateSpecifiers(arg, fs);

    let { align } = fs;

    // Convert to valid argument: string or number.
    let argStr: string;

    // Is type specifier number compatible?
    let isFsTypeNumberCompatible = fs.hasType("", "cdnbBoxXeEfF%gGaA");

    function formatNumber(arg: number | bigint): string {
        // Default align for number is right.
        align ??= ">";

        // Format number to string.
        return NumberFormatter.formatNumber(arg, fs);
    }

    function formatString(arg: string): string {
        // Default align for string is left.
        align ??= "<";

        // Apply string formatting.
        return StringFormatter.formatString(arg, fs);
    }

    if (typeof arg === "boolean") {
        // Argument can be boolean.
        if (fs.hasType("", "s")) {
            // Convert boolean to string, if type is default '' or string 's'.
            let b = arg
                ? (usingDeprecatedStdFormat ? deprecatedTrueString : "true")
                : (usingDeprecatedStdFormat ? deprecatedFalseString : "false");

            argStr = formatString(b);
        }
        else if (isFsTypeNumberCompatible) {
            // Convert boolean to number 0 or 1.
            argStr = formatNumber(arg ? 1 : 0);
        }
        else {
            // Invalid argument conversion from boolean.
            throw FormatError.InvalidArgumentForType(ctx, arg, fs.type);
        }
    }
    else if (typeof arg === "number" || typeof arg === "bigint") {
        // Argument can be number or bigint.
        if (isFsTypeNumberCompatible) {
            // Use number argument as it is.
            argStr = formatNumber(arg);
        }
        else {
            // Invalid argument conversion from number.
            throw FormatError.InvalidArgumentForType(ctx, arg, fs.type);
        }
    }
    else if (typeof arg === "string") {
        // Argument can be string.
        if (fs.hasType("cdnxXobB") && arg.length === 1) {
            // If type is integer then use single char string as char and convert it to char code (integer).
            argStr = formatNumber(arg.charCodeAt(0));
        }
        else if (fs.hasType("", "s?")) {
            // Else use string argument as it is.
            argStr = formatString(arg);
        }
        else {
            // Invalid argument conversion from string.
            throw FormatError.InvalidArgumentForType(ctx, arg, fs.type);
        }
    }
    else {
        // Invalid argument type.
        throw FormatError.InvalidArgumentForType(ctx, arg, fs.type);
    }

    // Next apply fill and alignment according to format specification.

    // Get width of field or 0 if not given.
    let width = fs.width ?? 0;

    // Calculate fillCount
    let fillCount = Math.max(0, width - argStr.length);

    // Get fill char.
    let fillChar = fs.fill ?? fs.zero ?? " ";

    // Initialize replacement string.
    let replacementStr: string = argStr;

    // Modify replacement string if filling is required.
    if (fillCount > 0) {
        switch (align) {
            case "<":
                // Field is left aligned. Add filling to right.
                replacementStr = argStr + repeatString(fillChar, fillCount);
                break;
            case "^":
                // Field is center aligned. Add filling to left and right right.
                replacementStr = repeatString(fillChar, Math.floor(fillCount / 2)) + argStr + repeatString(fillChar, Math.ceil(fillCount / 2));
                break;
            case ">":
                // Field is right aligned. Add filling to left.
                replacementStr = repeatString(fillChar, fillCount) + argStr;
                break;
        }
    }

    // Return final replacement string.
    return replacementStr;
}

// Function to get argument from formatArgs[fieldNumber].
function getArgument(ctx: ParsingContext, fieldNumberStr: string): unknown {
    // Throw exception if field number string is not valid.
    // It must be empty "", or contain digits only (= zero or positive integer).
    if (fieldNumberStr !== "" && !DigitsRegex.test(fieldNumberStr)) {
        throw FormatError.InvalidFieldNumber(ctx, fieldNumberStr);
    }

    // Get field number
    let fieldNumber: number;

    // Is field number string empty?
    if (fieldNumberStr.length > 0) {
        // Use manual field specification.
        ctx.hasManualFieldSpecification = true;

        // Convert field number string to number
        fieldNumber = +fieldNumberStr;
    }
    else {
        // Use automatic field numbering.
        ctx.hasAutomaticFieldNumbering = true;

        // Get ascending field number
        fieldNumber = ctx.automaticFieldNumber++;
    }

    // Throw exception switching between automatic and manual field numbering.
    if (ctx.hasAutomaticFieldNumbering && ctx.hasManualFieldSpecification) {
        throw FormatError.SwitchBetweenAutoAndManualFieldNumbering(ctx);
    }

    // Throw exception if field number is out of bounds of arguments array.
    if (fieldNumber < 0 || fieldNumber >= ctx.formatArgs.length) {
        throw FormatError.InvalidFieldNumber(ctx, "" + fieldNumber);
    }

    // Return argument.
    return ctx.formatArgs[fieldNumber];
}

// Function to get nested argument integer. Width and precision in format specification can be
// in form of nested curly braces {:{width field number}.{precision field number}}
function getNestedArgumentInt(ctx: ParsingContext, fieldNumberStr: string, fs: FormatSpecification): number {
    // Get the argument
    let arg = getArgument(ctx, fieldNumberStr);

    // Nested argument is used for width and precision in format specification, and
    // must be integer number >= 0.
    if (!arg || typeof arg !== "number" || !isInteger(arg) || arg < 0) {
        throw FormatError.InvalidNestedArgument(ctx, arg);
    }

    // Return nested argument integer
    return arg;
}

// Function to parse replacement field.
function parseReplacementField(ctx: ParsingContext) {
    // Replacement field starts with "{".
    if (ctx.parseString[0] !== "{") {
        // Failed to parse replacement field, return false.
        return false;
    }

    // Execute replacement field regex.
    let replFieldMatch = ReplacementFieldRegEx.exec(ctx.parseString);

    if (!replFieldMatch || !replFieldMatch[0]) {
        // Failed to parse replacement field, return false.
        return false;
    }

    // Set error string.
    ctx.errorString = replFieldMatch[0];

    // Get field number fropm match.
    let fieldNumber = replFieldMatch.groups?.field_n ?? "";

    // Get argument.
    let arg = getArgument(ctx, fieldNumber);

    // Create format specification.
    let fs = new FormatSpecification(ctx, replFieldMatch, getNestedArgumentInt);

    // Format replacement field and add it to result string.
    ctx.resultString += formatReplacementField(ctx, arg, fs);

    // Jump over matched replacement field in  parsing string.
    ctx.parseString = ctx.parseString.substring(replFieldMatch[0].length);
    ctx.parsePosition += replFieldMatch[0].length;

    // Parsed replacement field ok, return true.
    return true;
}

// Get replacement field string that looks like replacement field but could be invalid.
function getLooseMatchReplacementFieldString(ctx: ParsingContext): string | undefined {
    let m = LooseMatchReplacementFieldRegEx.exec(ctx.parseString);
    return m && m[0] ? m[0] : undefined;
}

// Function to parse format string.
function parseFormatString(ctx: ParsingContext) {
    // Loop until terminated by break.
    while (true) {
        // Jump to next curly brace "{" or "}".
        let i = CurlyBracketRegEx.exec(ctx.parseString)?.index;

        // Set i to end of parsing string, if did not find curly braces.
        if (i === undefined || i < 0) {
            i = ctx.parseString.length;
        }

        // Add ordinary string to result string.
        ctx.resultString += ctx.parseString.substring(0, i);

        // Jump over non-formatting part in parsing.
        ctx.parseString = ctx.parseString.substring(i);
        ctx.parsePosition += i;

        // Now parsing string starts with "{", "}", or is empty.

        if (ctx.parseString.startsWith("{{") || ctx.parseString.startsWith("}}")) {
            // If parsing string starts with double curly braces
            // Then add single curly brace to result string.
            ctx.resultString += ctx.parseString[0];

            // Jump over double curly braces on parsing string.
            ctx.parseString = ctx.parseString.substring(2);
            ctx.parsePosition += 2;

            // Continue parsing on next loop.
            continue;
        }
        else if (ctx.parseString.startsWith("}")) {
            // Encountered single '}' ff parsing string starts with '}'.
            ctx.errorString = "}";
            throw FormatError.EncounteredSingleCurlyBrace(ctx);
        }
        else if (ctx.parseString.startsWith("{")) {
            // If parsing string starts with '{' then parse replacement field.
            // Throw exception if it returns false (parsing replacement field failed).
            if (!parseReplacementField(ctx)) {
                // For more precise error message get loose match replacement field string.
                let str = getLooseMatchReplacementFieldString(ctx);
                if (str) {
                    ctx.errorString = str;
                    // Got loose match of replacement field string that just failed to parse.
                    throw FormatError.InvalidReplacementField(ctx);
                }
                else {
                    // Ecountered single '{' followed by random stuff.
                    ctx.errorString = "{";
                    throw FormatError.EncounteredSingleCurlyBrace(ctx);
                }
            }

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

// Main function to format string using curly bracket notation.
export function format(formatString: string, ...formatArgs: unknown[]): string {

    // Create parsing context.
    const parsingContext: ParsingContext = {
        formatString,
        formatArgs,
        parseString: formatString,
        parsePosition: 0,
        resultString: "",
        errorString: "",
        automaticFieldNumber: 0,
        hasAutomaticFieldNumbering: false,
        hasManualFieldSpecification: false
    }

    try {
        // Now parse format string.
        parseFormatString(parsingContext);
    }
    catch (e) {
        // Log internal error to console.
        if (e instanceof FormatError && e.isInternalError()) {
            console.error(e);
        }

        // Throw exception forward.
        throw e;
    }

    // Parsing is finished. Return result string.
    return parsingContext.resultString;
}

/******************** 
 * Deprecated Stuff *
 ********************/

/**
 * @deprecated
 */
export const StdFormatError = FormatError;

let stdFormatWarned = false;
let stdSpecificationHintWarned = false;
let stdLocaleHintWarned = false;

let usingDeprecatedStdFormat = false;

/**
 * @deprecated
 */
export function stdFormat(formatString: string, ...formatArgs: unknown[]): string {
    if (!stdFormatWarned) {
        console.warn("std-format: function stdFormat() is deprecated. Use function format() instead.");
        stdFormatWarned = true;
    }

    try {
        usingDeprecatedStdFormat = true;
        return format(formatString, ...formatArgs);
    }
    finally {
        usingDeprecatedStdFormat = false;
    }
}

/**
 * @deprecated
 */
export function stdLocaleHint(locale?: string | undefined) {
    if (!stdLocaleHintWarned) {
        console.warn("std-format: function stdLocaleHint() is deprecated. Use function setLocale() instead.");
        stdLocaleHintWarned = true;
    }

    setLocale(locale);
}

// The octal number prefix is "0o" in Python and "0" in C++.
let deprecatedOctalPrefix: "0" | "0o" = "0o";
let deprecatedTrueString: "true" | "True" = "True";
let deprecatedFalseString: "false" | "False" = "False";

/**
 * @deprecated
 */
export function stdSpecificationHint(specHint: "cpp" | "python" | "js") {
    if (!stdSpecificationHintWarned) {
        console.warn("std-format: function stdSpecificationHint() is deprecated.");
        stdSpecificationHintWarned = true;
    }

    if (specHint === "cpp") {
        deprecatedOctalPrefix = "0";
        deprecatedTrueString = "true";
        deprecatedFalseString = "false";
    }
    else if (specHint === "python") {
        deprecatedOctalPrefix = "0o";
        deprecatedTrueString = "True";
        deprecatedFalseString = "False";
    }
    else if (specHint === "js") {
        deprecatedOctalPrefix = "0o";
        deprecatedTrueString = "true";
        deprecatedFalseString = "false";
    }
    else {
        // Invalid specification hint.
        throw FormatError.InvalidSpecificationHint(specHint);
    }
}
