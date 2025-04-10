
// Create string that is string s repeated count times
function repeatString(repeatStr: string, repeatCount: number): string {
    return new Array(Math.max(0, repeatCount) + 1).join(repeatStr);
}

// Create number array that contains number n count times
function zeroArray(zeroCount: number): number[] {
    return new Array<number>(Math.max(0, zeroCount)).fill(0);
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

// Exceoption class, trown on format and value errors.
export class FormatError extends Error {
    // private constructor. Use static functions below to create error objects.
    private constructor(readonly message: string) {
        super(message);
        this.name = usingDeprecatedStdFormat ? "StdFormatError" : "FormatError";
        // console.log(message);
    }

    // Create specifier is not implemented error.
    static SpecifierIsNotImplemented(specifier: string, fs: FormatSpecification) {
        return new FormatError("Specifier '" + specifier + "' is not implemented, used in \"" + fs.replacementFieldString + "\".");
    }

    // Create invalid argument error.
    static InvalidArgument(arg: unknown, fs: FormatSpecification) {
        return new FormatError(
            "Invalid " + typeof arg + " argument '" + String(arg) + "' with type specifier '" + fs.type +
            "' in \"" + fs.replacementFieldString + "\".");
    }

    // Create invalid float argument error.
    static InvalidFloatArgument(fs: FormatSpecification) {
        return new FormatError("Invalid floating point argument with type specifier '" + fs.type + "', in \"" + fs.replacementFieldString + "\".");
    }

    // Create invalid nested argument error.
    static InvalidNestedArgument(arg: unknown, fs: FormatSpecification) {
        return new FormatError("Invalid nested argument '" + String(arg) + "' in \"" + fs.replacementFieldString + "\".");
    }

    // Create invalid field number error.
    static InvalidFieldNumber(fieldNumber: string, replacementFieldStr: string) {
        return new FormatError("Invalid field number '" + fieldNumber + "', in \"" + replacementFieldStr + "\".");
    }

    // Create switch between auto/manual field numbering error.
    static SwitchBetweenAutoAndManualFieldNumbering() {
        return new FormatError("Switch between automatic and manual field numbering.");
    }

    // Create encounteger single curly brace error.
    static EncounteredSingleCurlyBrace(char: "{" | "}") {
        return new FormatError("Encountered single curly brace '" + char + "' in format string.");
    }

    // Create invalid replacement field error.
    static InvalidReplacementField(str: string) {
        return new FormatError("Invalid replacement field \"" + str + "\".");
    }

    // Create precision not allowed error.
    static PrecisionNotAllowed(fs: FormatSpecification) {
        return new FormatError("Precision not allowed with type specifier '" + fs.type + "', in \"" + fs.replacementFieldString + "\".");
    }

    // Create invalid specification hint error.
    static InvalidSpecificationHint(specHint: string) {
        return new FormatError("Invalid specification hint '" + specHint + "'. Valid values are 'cpp' and 'python'.");
    }

    // Create specifier not allowed error.
    static SpecifierNotAllowedWith(specifier1: string, specifier2: string, fs: FormatSpecification) {
        let specifier1Str = specifier1 === fs.type ? "Type specifier" : "Specifier";
        let specifier2Str = specifier2 === fs.type ? "type specifier" : "specifier";
        return new FormatError(
            specifier1Str + " '" + specifier1 + "' not allowed with " + specifier2Str + " '" + specifier2 +
            "' in \"" + fs.replacementFieldString + "\".");
    }

    // Create assertion failed internal error.
    static AssertionFailed(msg?: string) {
        return new FormatError("Assertion failed" + (msg === undefined ? "!" : (": " + msg)));
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
    "(?<type>[scbBodxXaAeEfF%gG?n])?"; // type

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
    readonly replacementFieldString: string;
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

    constructor(ctx: ParsingContext, replFieldMatch: RegExpExecArray, getNestedArgumentInt: (ctx: ParsingContext, argId: string, fs: FormatSpecification) => number) {
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

        this.replacementFieldString = replFieldMatch[0];
        this.fill = (fill && fill.length === 1) ? fill : undefined;
        this.align = (align === "<" || align === "^" || align === ">" || align === "=") ? align : undefined;
        this.sign = (sign === "-" || sign === "+" || sign === " ") ? sign : undefined;
        this.zeta = zeta === "z" ? zeta : undefined;
        this.sharp = sharp === "#" ? sharp : undefined;
        this.zero = zero === "0" ? zero : undefined;
        this.grouping = (grouping === "," || grouping === "_") ? grouping : undefined;
        this.locale = locale === "L" ? locale : undefined;
        this.type = (type === "" || type && "scbBodxXaAeEfF%gG?n".indexOf(type) >= 0) ? type as any : "";

        // Do these last because getNestedArgumentInt needs this object.
        this.width = width_field_n !== undefined ? getNestedArgumentInt(ctx, width_field_n, this) : (!!width ? +width : undefined);
        this.precision = precision_field_n !== undefined ? getNestedArgumentInt(ctx, precision_field_n, this) : (!!precision ? +precision : undefined);
    }

    // Test if type is one of types given as argument.
    // For example isType("", "d", "xX") tests if type is either "", "d", "x" or "X".
    hasType(...types: string[]) {
        return types.some(type => this.type === type || this.type !== "" && type.indexOf(this.type) >= 0);
    }

    // Test if this has given specifier excluding type specifier.
    hasNonTypeSpecifier(s: string | undefined): s is string {
        return s !== undefined && (s === this.align || s === this.sign || s === this.zeta || s === this.sharp || s === this.zero || s === this.grouping || s === this.locale);
    }

    // If has given specifier, then require type specifier.
    withSpecifierRequireTypeSpecifier(s: string | undefined, types: string) {
        if (this.hasNonTypeSpecifier(s) && !this.hasType(types)) {
            throw FormatError.SpecifierNotAllowedWith(s, this.type, this);
        }
    }

    // Forbid this to have both specifiers. 
    withSpecifierForbidSpecifier(s1: string | undefined, s2: string | undefined) {
        if (this.hasNonTypeSpecifier(s1) && this.hasNonTypeSpecifier(s2)) {
            throw FormatError.SpecifierNotAllowedWith(s1, s2, this);
        }
    }

    // Forbid this to have both type specifier and specifier.
    withTypeSpecifierForbidSpecifier(types: string, s: string | undefined) {
        if (this.hasType(types) && this.hasNonTypeSpecifier(s)) {
            throw FormatError.SpecifierNotAllowedWith(this.type, s, this);
        }
    }
}

// NumberFormatter class is for formatting numbers.
class NumberFormatter {
    // Sign is 1 or -1 (or NaN if number is nan).
    sign: number;

    // Digits contains digits of the number. Each digit is between 0 <= digit <= base - 1.
    // Special cases are nan and +-inf
    //     * For nan digits is [NaN]
    //     * For +inf digits is [+Infinity].
    //     * For -inf digits is [-Infinity].
    digits: number[];

    // DotPos tells the position of dot in digits array.
    // It is value between 1 <= dotPos <= digits.length
    //     * If 1 then dot is after first digit in digits array (= scientific notation)
    //     * If digits.length then dot is after last digit in digits array.
    dotPos: number;

    // Exp is the exponent of number. It is relative to dot position.
    exp: number;

    // Base of number can be 2, 8, 10 or a6.
    readonly base: number;

    // Constructor of NumberFormatter class.
    // Passed arguments are number @value and format specification @fs.
    private constructor(value: number | bigint, readonly fs: FormatSpecification) {
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

        // Check for valid char code
        if (fs.hasType("c")) {
            // Check specifiers that are not allowed with 'c'.
            fs.withTypeSpecifierForbidSpecifier("c", fs.sign ?? fs.zeta ?? fs.sharp ?? fs.grouping);

            try {
                // Is char code valid integer and in range?
                let charCode = getNumber(value);
                assert(isInteger(charCode) && charCode >= 0 && charCode <= 65535, "Invalid char code.");
            }
            catch (e) {
                throw FormatError.InvalidArgument(value, fs);
            }
        }

        // Initialize sign, digits, dot position and exponent to initial values.
        this.sign = isNegative(value) ? -1 : +1;
        this.digits = [];
        this.dotPos = 0;
        this.exp = 0;

        if (typeof value === "number") {
            // Handle special numbers nan and +-inf
            if (isNaN(value)) {
                // Set sign = NaN and digits = [NaN].
                this.sign = NaN;
                this.digits = [NaN];
                // Initialize dotPos and exp to something.
                this.dotPos = NaN;
                this.exp = NaN;
                return;
            }
            else if (Math.abs(value) === Infinity) {
                // this.sign is already valid.
                this.digits = [Math.abs(value)];
                // Initialize dotPos and exp to something.
                this.dotPos = 1;
                this.exp = 0;
                return;
            }

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
        this.convertToNotation();
    }

    // Is this number "nan"?
    private isNan() {
        return this.digits.length === 1 && isNaN(this.digits[0]);
    }

    // Is this number "+-inf"?
    private isInf() {
        return this.digits.length === 1 && this.digits[0] === Infinity;
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
        if (this.isNan() || this.isInf()) {
            return;
        }

        if (this.isZero()) {
            assert(this.exp === 0, "Is zero but exp != 0");
        }

        assert(this.base === 2 || this.base === 8 || this.base === 10 || this.base === 16, "Invalid base " + this.base);

        assert(isFinite(this.exp), "exp is not finite");
        assert(isFinite(this.dotPos), "dotPos is not finite");

        assert(this.dotPos >= 1, "dotPos = " + this.dotPos + " < 1");
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
        if (this.isNan() || this.isInf()) {
            return;
        }

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
        if (this.isNan() || this.isInf()) {
            return;
        }

        // Get digit count.
        // In fixed type total digit count is number of digits after dot.
        // Else digitCount is precision. 
        let digitCount = precisionType === "fixed" ? (this.dotPos + precision) : precision;

        if (digitCount === this.digits.length || digitCount < 1) {
            // Nothing to do, digitCount equals digits.length or is less than 1.
            return;
        }
        else if (digitCount > this.digits.length) {
            // If digitCount > digits.length then need to add trailing zeroes to set digit count.
            this.digits.splice(this.digits.length, 0, ...zeroArray(digitCount - this.digits.length));
            return;
        }

        // Set starting position to first digit to be removed.
        let pos = digitCount;

        // Get first digit to be removed. It can be past number of digits so ?? 0.
        let firstRemovedDigit = this.digits[pos] ?? 0;

        // Remove digits from pos to end.
        // And add zeroes from pos to dotPos
        this.digits.splice(pos, this.digits.length - pos, ...zeroArray(this.dotPos - pos));

        // Function to check digit if it will round up
        const roundUp = (digit: number) => digit >= Math.ceil(this.base / 2);

        // Check if first removed digit rounds up.
        if (roundUp(firstRemovedDigit)) {
            // Rounding is necessary.
            while (true) {
                // Shitf current digit position left
                pos--;

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
        if (this.isNan() || this.isInf()) {
            return;
        }

        // Make exponent to zero.
        this.toZeroExponent();

        // Set fixed precision digits after dot
        this.toPrecision(precision, "fixed");
    }

    // Convert number to scientific notation.
    // Precision is number of digits after decimal point.
    // So total digits is (p + 1).
    private toScientific(precision: number) {
        if (this.isNan() || this.isInf()) {
            return;
        }

        // Move dot to position to right after first digit.
        this.exp += this.dotPos - 1;
        this.dotPos = 1;

        // Set total (precision + 1) digits.
        this.toPrecision(precision + 1, "precision");
    }

    // Convert number to normalised hexadecimal exponential notation
    private toNormalisedHexadecimalExponential() {
        if (this.isNan() || this.isInf() || this.isZero()) {
            return;
        }

        // Make exponent to zero
        this.toZeroExponent();

        // Some assertions
        assert(this.exp === 0, "exp !== 0");
        assert(this.base === 16, "base !== 16");
        assert(this.dotPos >= 1, "dotPos < 1");

        // Make scientific format setting dotPos to 1 and altering exponent.
        // Exponent in hexadecimal exponential presentation is in binary.
        // Shifting by one pos in hexadecimal shifts by four in binary. 
        this.exp += 4 * (this.dotPos - 1);
        this.dotPos = 1;

        // Convert digits to binary string of zeroes and ones.
        let binary = this.digits.map(d => {
            // Each digit in hexadecimal has four digits in binary.
            // Add leading zeroes to return binary string length of 4.
            let b = Number(d).toString(2);
            return repeatString("0", 4 - b.length) + b;
        }).join("");

        // Multiply by two (shift digits to left) as long as 
        // binary starts with "0000" (hex "0")
        while (binary.startsWith("0000")) {
            // Remove digit from left and add "0" to right.
            binary = binary.substring(1) + "0";

            // Decrease exponent to keep total value unaltered.
            this.exp--;
        }

        // Divide by two (shift digits to right) until 
        // binary binary starts with "0001" (hex "1")
        while (!binary.startsWith("0001")) {
            // Add "0" to left and remove digit from right.
            binary = "0" + binary.substring(0, binary.length - 1);

            // Increase exponent to keep total value unaltered.
            this.exp++;
        }

        // Remove trailing zeroes, "0000" in binary is "0" in hex.
        while (binary.endsWith("0000")) {
            binary = binary.substring(0, binary.length - 4);
        }

        // Convert binary digits back to hexadecimal digits
        this.digits = [];

        // Repeat while there are binary digits left.
        while (binary.length > 0) {
            // Convert first 4 digits from binary and push to end of digits.
            this.digits.push(parseInt(binary.substring(0, 4), 2));

            // Remove four binary digits that were just converted.
            binary = binary.substring(4);
        }

        // Number is now in normalised hexadecimal exponential.

        // Validate internal state
        this.validateInternalState();
    }

    // Convert this number to notation specified by format specification.
    private convertToNotation() {
        if (this.isNan() || this.isInf()) {
            return;
        }

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
        else if (fs.hasType("", "cdbBoxXn")) {
            // Else if type is default '' or integer

            // Precision not allowed for integer
            if (fs.precision !== undefined) {
                throw FormatError.PrecisionNotAllowed(fs);
            }

            // For integers -0 = +0 = 0
            if (this.isZero() && this.sign === -1) {
                this.sign = 1;
            }

            // Make exponent to zero.
            this.toZeroExponent();

            // Number must be integer
            if (!this.isInteger()) {
                throw FormatError.InvalidFloatArgument(fs);
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
            if (this.fs.sharp !== "#") {
                // Remove insignificant trailing zeroes.
                removeInsignificantTrailingZeroes();
            }
        }
        else {
            // All types should have been handled.
            assert(false, "Unhandled type: " + this.fs.type);
        }

        if (fs.zeta === "z") {
            // 'z' is only allowed for floating point types.
            fs.withSpecifierRequireTypeSpecifier("z", "eEfF%gGaA");

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

    // Get number prefix.
    private getNumberPrefix() {
        let { fs } = this;

        return fs.sharp === "#" ? (
            fs.hasType("xX") ? "0x" : fs.hasType("bB") ? "0b" : fs.hasType("o") ? (usingDeprecatedStdFormat ? deprecatedOctalPrefix : "0o") : ""
        ) : "";
    }

    // Get grouping properties
    private getGroupingProps(): { decimalSeparator: string, groupSeparator: string, groupSize: number } {
        let { fs } = this;

        // ',' and '_' not allowed with 'L'
        fs.withSpecifierForbidSpecifier(fs.grouping, fs.locale);

        if (fs.grouping === ",") {
            // Get grouping properties with group specifier ',' for supported type specifiers.
            fs.withSpecifierRequireTypeSpecifier(",", "deEfF%gG");

            return { decimalSeparator: ".", groupSeparator: ",", groupSize: 3 }
        }
        else if (fs.grouping === "_") {
            // Get grouping properties with group specifier '_' for supported type specifiers.
            fs.withSpecifierRequireTypeSpecifier("_", "deEfF%gGbBoxX");

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
            // This option is only valid for arithmetic types.
            fs.withSpecifierRequireTypeSpecifier("L", "deEfF%gGaA");

            // Use locale's decimal and group separators.
            return { decimalSeparator: localeDecimalSeparator, groupSeparator: localeGroupSeparator, groupSize: 3 }
        }
        else if (fs.hasType("n")) {
            // 'n' not allowed with ',', '_' and 'L'.
            fs.withTypeSpecifierForbidSpecifier("n", fs.grouping ?? fs.locale);

            // Use locale's decimal and group separators.
            return { decimalSeparator: localeDecimalSeparator, groupSeparator: localeGroupSeparator, groupSize: 3 }
        }

        // If no grouping then set grouping separator to empty string and group size to Infinity.
        return { decimalSeparator: ".", groupSeparator: "", groupSize: Infinity }
    }

    // Get char code
    private getCharCode() {
        // Only call for type specifier 'c'. Number is integer.
        assert(this.fs.hasType("c") && this.sign === 1 && this.dotPos === this.digits.length &&
            this.exp === 0 && this.base === 10, "Invalid call to getCharCode().");

        // Calculate char code from digits.
        let charCode = 0;

        for (let i = 0, e = 1; i < this.digits.length; i++, e *= 10) {
            // Add digits from right to left, each multiplied by 10^i.
            charCode += this.digits[this.digits.length - 1 - i] * e;
        }

        return charCode;
    }

    // Convert this number to string.
    private toString() {
        // Get format specification fs.
        let { fs } = this;

        // Exponent string.
        let exp: string;

        // Digits string.
        let digits: string;

        // Prefix string. "0x" for hexadecimal, etc.
        let prefix: string;

        // Postfix string. "%" for percentage types, or "".
        let postfix: string = fs.hasType("%") ? "%" : "";

        // Set sign. "-", "+", " " or "".
        let sign: string = this.sign < 0 ? "-" : ((fs.sign === "+" || fs.sign === " ") ? fs.sign : "");

        if (this.isNan()) {
            // Is nan?
            exp = "";
            digits = "nan";
            prefix = "";
        }
        else if (this.isInf()) {
            // Is inf?
            exp = "";
            digits = "inf";
            prefix = "";
        }
        else if (fs.hasType("c")) {
            // Is char? Set digits string to contain single char obtained from char code.
            digits = String.fromCharCode(this.getCharCode());
            // Other props empty.
            sign = exp = prefix = "";
        }
        else {
            // Some type specifiers do not show zero exponent.
            let noZeroExp = !fs.hasType("eEaA");

            // Some type specifiers add zero prefix to single digit exponent.
            let needExp00 = fs.hasType("", "eEgG");

            if (this.exp === 0 && noZeroExp) {
                // No zero exponent.
                exp = "";
            }
            else {
                // Get exponent to string. Absolute value for now.
                exp = "" + Math.abs(this.exp);

                // Add leading zero if exponent needs at least two digits.
                if (exp.length < 2 && needExp00) {
                    exp = "0" + exp;
                }

                // Format exponent string. Add "p" (norm. hex. exp. ntt) or "e",
                // sign, and absolute value of exponent.
                exp = (this.base === 16 ? "p" : "e") + (this.exp < 0 ? "-" : "+") + exp;
            }

            // Get grouping props.
            let groupingProps = this.getGroupingProps();

            // Split digits to integer and fractional parts.
            let intDigits = this.digits.slice(0, this.dotPos);
            let fracDigits = this.digits.slice(this.dotPos);

            if (groupingProps.groupSeparator === "" || intDigits.length <= groupingProps.groupSize) {
                // There is no grouping (or need plain digits to extract char code).
                // Add integer digits.
                digits = intDigits.map(mapDigitToChar).join("");
            }
            else {
                // There is grouping.
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
            if (this.dotPos === this.digits.length && fs.sharp === "#" && fs.hasType("eEfF%gGaA")) {
                digits += ".";
            }

            // Get prefix.
            prefix = this.getNumberPrefix();

            // Remove octal prefix "0" if digits is "0" to prevent "00".
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

    static formatNumber(n: number | bigint, fs: FormatSpecification): string {
        return new NumberFormatter(n, fs).toString();
    }
}

namespace StringFormatter {
    export function formatString(str: string, fs: FormatSpecification) {
        // Check if string formatting specifiers are valid.
        if (!fs.hasType("", "s?")) {
            // Not valid string argument.
            throw FormatError.InvalidArgument(str, fs);
        }

        // Check specifiers not allowed with string.
        fs.withTypeSpecifierForbidSpecifier(fs.type,
            (fs.align === "=" ? "=" : undefined) ?? fs.grouping ?? fs.locale ?? fs.sign ?? fs.sharp ?? fs.zero ?? fs.zeta);

        if (fs.hasType("?")) {
            // Here should format escape sequence string.
            throw FormatError.SpecifierIsNotImplemented(fs.type, fs);
        }

        // For string presentation types precision field indicates the maximum
        // field size - in other words, how many characters will be used from the field content.
        if (fs.precision !== undefined && str.length > fs.precision) {
            str = str.substring(0, fs.precision);
        }

        return str;
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

/**
 * Formats the replacement field.
 * @arg is the argument given to format("", arg0, arg1, ...)
 * @fs is the parsed format specification.
 */
function formatReplacementField(arg: unknown, fs: FormatSpecification): string {
    let { align } = fs;

    // Convert to valid argument: string or number.
    let argStr: string;

    // Is type specifier number compatible?
    let isFsTypeNumberCompatible = fs.hasType("", "cbBodxXaAeEfFgGn%");

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
            throw FormatError.InvalidArgument(arg, fs);
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
            throw FormatError.InvalidArgument(arg, fs);
        }
    }
    else if (typeof arg === "string") {
        // Argument can be string.
        if (fs.hasType("cdxXobB") && arg.length === 1) {
            // If type is integer then use single char string as char and convert it to char code (integer).
            argStr = formatNumber(arg.charCodeAt(0));
        }
        else if (fs.hasType("", "s?")) {
            // Else use string argument as it is.
            argStr = formatString(arg);
        }
        else {
            // Invalid argument conversion from string.
            throw FormatError.InvalidArgument(arg, fs);
        }
    }
    else {
        // Invalid argument type.
        throw FormatError.InvalidArgument(arg, fs);
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
function getArgument(ctx: ParsingContext, fieldNumberStr: string, replacementFieldStr: string): unknown {
    // Throw exception if field number string is not valid.
    // It must be empty "", or contain digits only (= zero or positive integer).
    if (fieldNumberStr !== "" && !DigitsRegex.test(fieldNumberStr)) {
        throw FormatError.InvalidFieldNumber(fieldNumberStr, replacementFieldStr);
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
        throw FormatError.SwitchBetweenAutoAndManualFieldNumbering();
    }

    // Throw exception if field number is out of bounds of arguments array.
    if (fieldNumber < 0 || fieldNumber >= ctx.formatArgs.length) {
        throw FormatError.InvalidFieldNumber("" + fieldNumber, replacementFieldStr);
    }

    // Return argument.
    return ctx.formatArgs[fieldNumber];
}

// Function to get nested argument integer. Width and precision in format specification can be
// in form of nested curly braces {:{width field number}.{precision field number}}
function getNestedArgumentInt(ctx: ParsingContext, fieldNumberStr: string, fs: FormatSpecification): number {
    // Get the argument
    let arg = getArgument(ctx, fieldNumberStr, fs.replacementFieldString);

    // Nested argument is used for width and precision in format specification, and
    // must be integer number >= 0.
    if (!arg || typeof arg !== "number" || !isInteger(arg) || arg < 0) {
        throw FormatError.InvalidNestedArgument(arg, fs);
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

    // Jump over matched replacement field in  parsing string.
    ctx.parseString = ctx.parseString.substring(replFieldMatch[0].length);
    ctx.parsePosition += replFieldMatch[0].length;

    // Get field number fropm match.
    let fieldNumber = replFieldMatch.groups?.field_n ?? "";

    // Get argument.
    let arg = getArgument(ctx, fieldNumber, replFieldMatch[0]);

    // Create format specification.
    let fs = new FormatSpecification(ctx, replFieldMatch, getNestedArgumentInt);

    // Format replacement field and add it to result string.
    ctx.resultString += formatReplacementField(arg, fs);

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
        else if (ctx.parseString[0] === "}") {
            // Throw exception if parsing string starts with "}".
            throw FormatError.EncounteredSingleCurlyBrace("}");
        }
        else if (ctx.parseString[0] === "{") {
            // If parsing string starts with "{" then parse replacement field, and
            // throw exception if it returns false (there was "{" but parsing failed).
            if (!parseReplacementField(ctx)) {
                // For more precise error message get loose match replacement field string.
                let str = getLooseMatchReplacementFieldString(ctx);
                if (str) {
                    // Got loose match of replacement field string that just failed to parse.
                    throw FormatError.InvalidReplacementField(str);
                }
                else {
                    // Got single '{' followed by random stuff.
                    throw FormatError.EncounteredSingleCurlyBrace("{");
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
    const parsingContext = {
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
