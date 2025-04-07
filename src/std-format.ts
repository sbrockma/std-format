
// Create string that is string s repeated count times
function repeatStr(s: string, count: number): string {
    return new Array(Math.max(0, count) + 1).join(s);
}

// Create number array that contains number n count times
function repeatNum(n: number, count: number): number[] {
    return new Array(Math.max(0, count)).fill(n);
}

// Test if number is integer.
function isInteger(n: number): boolean {
    return !isNaN(n) && isFinite(n) && n === Math.trunc(n);
}

// Function to convert digit value to digit character.
function mapDigitToChar(d: number) {
    return "0123456789abcdef"[d];
}

// Is value negative. For number  -0 is negative and +0 is positive.
function isNegative(n: number | bigint) {
    return typeof n === "bigint" ? (n < 0) : (n < 0 || 1.0 / n === -Infinity);
}

// Get number from number or bigint.
function getNumber(n: number | bigint): number {
    if (typeof n === "bigint") {
        // Make sure bigint is in safe number range.
        assert(n <= Number.MAX_SAFE_INTEGER && n >= Number.MIN_SAFE_INTEGER, "Cannot get number from bigint, too big value.");
        // Return bigint as number.
        return Number(n);
    }
    else {
        // Return number.
        return n;
    }
}

// Exceoption class, trown on format and value errors.
export class StdFormatError extends Error {
    // private constructor. Use static functions below to create error objects.
    private constructor(readonly message: string) {
        super(message);
        this.name = "StdFormatError";
    }

    // Create specifier is not implemented error.
    static SpecifierIsNotImplemented(specifier: string) {
        return new StdFormatError("Specifier '" + specifier + "' is not implemented.");
    }

    // Create value error.
    static ValueError(value: string, base?: number) {
        return new StdFormatError("Value error: " + value + base ? (", base: " + base) : "");
    }

    // Create invalid argument error.
    static InvalidArgument(arg: unknown) {
        return new StdFormatError("Invalid argument '" + String(arg) + "' (" + typeof arg + ").");
    }

    // Create invalid argument conversion error.
    static InvalidArgumentConversion(arg: number | bigint | string | boolean, fsType: string) {
        return new StdFormatError("Invalid argument '" + String(arg) + "' (" + typeof arg + ") to format specifier '" + fsType + "'.");
    }

    // Create invalid field number error.
    static InvalidFieldNumber(fieldNumber: string) {
        return new StdFormatError("Invalid field number: '" + fieldNumber + "'.");
    }

    // Create switch between auto/manual field numbering error.
    static SwitchBetweenAutoAndManualFieldNumbering() {
        return new StdFormatError("Switch between automatic and manual field numbering.");
    }

    // Create single curly brace encountered in format string error.
    static SingleEncounteredInFormatString(char: "{" | "}") {
        return new StdFormatError("Single '" + char + "' encountered in format string.");
    }

    // Create precision not allowed for integer error.
    static PrecisionNotAllowedForInteger() {
        return new StdFormatError("Precision not allowed for integer.");
    }

    // Create invalid specification hint error.
    static InvalidSpecificationHint(specHint: string) {
        return new StdFormatError("Invalid specification hint '" + specHint + "'. Valid values are 'cpp' and 'python'.");
    }

    // Create invalid specification hint error.
    static CannotUseTypeSpecifierWith(typeSpecifier: string, specifier: string) {
        return new StdFormatError("Cannot use type specifier '" + typeSpecifier + "' with specifier '" + specifier + "'.");
    }

    // Create assertion failed internal error.
    static AssertionFailed(msg?: string) {
        return new StdFormatError("Assertion failed" + (msg === undefined ? "!" : (": " + msg)));
    }

    // Is this internal error?
    isInternalError() {
        return this.message.startsWith("Assertion failed");
    }
}

// Assert function for internal validation.
function assert(condition: boolean, msg?: string) {
    if (!condition) {
        throw StdFormatError.AssertionFailed(msg)
    }
}

// The octal number prefix is "0o" in Python and "0" in C++.
let octalPrefix: "0" | "0o" = "0o";
let trueString: "true" | "True" = "True";
let falseString: "false" | "False" = "False";

// Use specification hint. Specification hint can be "python" or "cpp".
export function stdSpecificationHint(specHint: "cpp" | "python") {
    if (specHint === "cpp") {
        // Set variables belonging to "cpp" specification.
        octalPrefix = "0";
        trueString = "true";
        falseString = "false";
    }
    else if (specHint === "python") {
        // Set variables belonging to "python" specification.
        octalPrefix = "0o";
        trueString = "True";
        falseString = "False";
    }
    else {
        // Invalid specification hint.
        throw StdFormatError.InvalidSpecificationHint(specHint);
    }
}

// Get user/system locale
function getUserLocale(): string | undefined {
    if (navigator) {
        return navigator.languages ? navigator.languages[0] : navigator?.language ?? Intl.DateTimeFormat().resolvedOptions().locale;
    }
    else {
        return Intl.DateTimeFormat().resolvedOptions().locale;
    }
}

// Set default locale. Use "en-UK" as fallback.
let defaultLocale: string = getUserLocale() ?? "en-UK";

// Locale's decimal and group separators.
let localeDecimalSeparator = ".";
let localeGroupSeparator = ",";

// Set locale that will be used in locale based formatting.
export function stdLocaleHint(locale?: string | undefined) {
    let nf = Intl.NumberFormat(!locale ? defaultLocale : locale).formatToParts(33333.3);

    // Extract decimal and group separators.
    localeDecimalSeparator = nf.find(part => part.type === "decimal")?.value ?? ".";
    localeGroupSeparator = nf.find(part => part.type === "group")?.value ?? ",";
}

// Init with default locale
stdLocaleHint();

/**
 * https://en.cppreference.com/w/cpp/utility/format/spec
 * https://docs.python.org/3/library/string.html#formatspec
 * 
 * [[fill]align][sign]["z"]["#"]["0"][width][grouping_option]["." precision][L][type]
 */

// The format specification regex. THis is combination of c++ and python specifications.
const FormatSpecificationRegExString =
    "((?<fill>.?)(?<align>[<^>=]))?" + // fill and align
    "(?<sign>[-+ ])?" + // sign
    "(?<zeta>[z])?" + // z
    "(?<sharp>[#])?" + // #
    "(?<zero>[0])?" + // 0
    "((?<width>\\d+)|\{(?<width_field_n>\\d*)\})?" + // width
    "(?<grouping>[,_])?" +  // , or _
    "(\.((?<precision>\\d+)|\{(?<precision_field_n>\\d*)\}))?" + // precision
    "(?<locale>[L])?" + // L
    "(?<type>[scbBodxXaAeEfFgG?%n])?"; // type

// Replacement field regex.
const ReplacementFieldRegEx = new RegExp(
    "^\{" +
    "(?<field_n>\\d+)?" +
    "(\:(" + FormatSpecificationRegExString + "))?" +
    "\}"
);

// Regex to find next curly bracet.
const CurlyBracketRegEx = new RegExp("[{}]");

// Regex for one or more digits.
const DigitsRegex = /^\d+$/;

// The format specification class
class FormatSpecification {
    readonly replFieldString: string;
    readonly fill: string; // single character, default " "
    readonly align: "<" | "^" | ">" | "=" | undefined;
    readonly sign: "+" | "-" | " ";
    readonly zeta: "z" | undefined;
    readonly sharp: "#" | undefined;
    readonly zero: "0" | undefined;
    readonly width: number | undefined;
    readonly grouping: "," | "_" | undefined;
    readonly precision: number | undefined;
    readonly locale: "L" | undefined;
    readonly type: "" | "s" | "c" | "b" | "B" | "d" | "o" | "x" | "X" | "a" | "A" | "e" | "E" | "f" | "F" | "g" | "G" | "?" | "%" | "n";

    constructor(replFieldMatch: RegExpExecArray, getNestedArgumentInt: (argId: string) => number) {
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

        this.replFieldString = replFieldMatch[0];
        this.fill = !fill ? " " : fill; // default " "
        this.align = (align === "<" || align === "^" || align === ">" || align === "=") ? align : undefined;
        this.sign = (sign === "-" || sign === "+" || sign === " ") ? sign : "-"
        this.zeta = zeta === "z" ? zeta : undefined;
        this.sharp = sharp === "#" ? sharp : undefined;
        this.zero = zero === "0" ? zero : undefined;
        this.width = width_field_n !== undefined ? getNestedArgumentInt(width_field_n) : (!!width ? +width : undefined);
        this.grouping = (grouping === "," || grouping === "_") ? grouping : undefined;
        this.precision = precision_field_n !== undefined ? getNestedArgumentInt(precision_field_n) : (!!precision ? +precision : undefined);
        this.locale = locale === "L" ? locale : undefined;
        this.type = (type === "" || type && "scbBodxXaAeEfFgG?%n".indexOf(type) >= 0) ? type as any : "";

        // Unimplemented specifiers
        if (this.isType("?")) {
            throw StdFormatError.SpecifierIsNotImplemented(this.type);
        }
    }

    // Test if type is one of types given as argument.
    // For example isType("", "d", "xX") tests if type is either "", "d", "x" or "X".
    isType(...types: string[]) {
        return types.some(type => this.type === type || this.type !== "" && type.indexOf(this.type) >= 0);
    }

    // Get replacement field string.
    toString() {
        return this.replFieldString;
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
    constructor(value: number | bigint, readonly fs: FormatSpecification) {
        // Set base
        if (fs.isType("bB")) {
            this.base = 2;
        }
        else if (fs.isType("o")) {
            this.base = 8;
        }
        else if (fs.isType("xXaA")) {
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
        if (!this.isZero() && fs.isType("%")) {
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
            this.digits.splice(this.digits.length, 0, ...repeatNum(0, this.dotPos - this.digits.length));
        }

        // If dot position was moved left past first digit then
        // add zeroes to beginning so that dot position becomes 1.
        if (this.dotPos < 1) {
            this.digits.splice(0, 0, ...repeatNum(0, 1 - this.dotPos));
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
            this.digits.splice(this.digits.length, 0, ...repeatNum(0, digitCount - this.digits.length));
            return;
        }

        // Set starting position to first digit to be removed.
        let pos = digitCount;

        // Get first digit to be removed. It can be past number of digits so ?? 0.
        let firstRemovedDigit = this.digits[pos] ?? 0;

        // Remove digits from pos to end.
        // And add zeroes from pos to dotPos
        this.digits.splice(pos, this.digits.length - pos, ...repeatNum(0, this.dotPos - pos));

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
            return repeatStr("0", 4 - b.length) + b;
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
            this.digits.push(Number.parseInt(binary.substring(0, 4), 2));

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
        if (fs.isType("") && (fs.precision !== undefined || !this.isInteger() || this.isZero())) {
            // If type is default and has precision or is float or zero

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
        else if (fs.isType("", "dbBoxXn")) {
            // Else if type is default '' or integer

            // Precision not allowed for integer
            if (fs.precision !== undefined) {
                throw StdFormatError.PrecisionNotAllowedForInteger();
            }

            // For integers -0 = +0 = 0
            if (this.isZero() && this.sign === -1) {
                this.sign = 1;
            }

            // Make exponent to zero.
            this.toZeroExponent();

            // Number must be integer
            if (!this.isInteger()) {
                throw StdFormatError.InvalidArgumentConversion("float", fs.type);
            }
        }
        else if (fs.isType("aA")) {
            // Convert to normalised hexadecimal exponential notation.
            this.toNormalisedHexadecimalExponential();

            // If precision not given use as big precision as possible.
            let p = fs.precision ?? (this.digits.length - 1);

            // Convert to scientific notation. Normalised hexadecimal exponential notation
            // already is in scientific notation but this sets precision and does rounding. 
            this.toScientific(p);
        }
        else if (fs.isType("eE")) {
            // Get precision. If not given, default is 6.
            let p = fs.precision ?? 6;

            // Convert to scientific notation
            this.toScientific(p);
        }
        else if (fs.isType("fF%")) {
            // Get precision. If not given, default is 6.
            let p = fs.precision ?? 6;

            // Convert to fixed notation.
            this.toFixed(p);
        }
        else if (fs.isType("gG")) {
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
            // The 'z' option coerces negative zero floating-point values to positive zero after rounding
            // to the format precision. This option is only valid for floating-point presentation types.
            if (!fs.isType("eEfFgGaA")) {
                throw StdFormatError.CannotUseTypeSpecifierWith(fs.type, fs.zeta);
            }
            else if (this.isZero() && this.sign === -1) {
                this.sign = 1;
            }
        }

        // Validate internal state.
        this.validateInternalState();
    }

    // Get number prefix.
    // If sharp is "#" then the prefix is:
    //      Hexadecimal:     "0x"
    //      Binary:          "0b"
    //      Octal (cpp):     "0"
    //      Octal (python):  "0o"
    // Else prefix is ""
    getNumberPrefix() {
        let { fs } = this;

        return fs.sharp === "#" ? (
            fs.isType("xX") ? "0x" : fs.isType("bB") ? "0b" : fs.isType("o") ? octalPrefix : ""
        ) : "";
    }

    // Get grouping properties
    private getGroupingProps(): { decimalSeparator: string, groupSeparator: string, groupSize: number } {
        let { fs } = this;
        let { grouping } = fs;

        if (grouping === ",") {
            // Get grouping properties with group specifier ',' for supported type specifiers.
            if (fs.isType("deEfFgG")) {
                return { decimalSeparator: ".", groupSeparator: ",", groupSize: 3 }
            }
            else {
                // Cannot use ',' with fs.type.
                throw StdFormatError.CannotUseTypeSpecifierWith(fs.type, grouping);
            }
        }
        else if (grouping === "_") {
            // Get grouping properties with group specifier '_' for supported type specifiers.
            if (fs.isType("deEfFgG")) {
                return { decimalSeparator: ".", groupSeparator: "_", groupSize: 3 }
            }
            else if (fs.isType("bBoxX")) {
                // With binary, octal and hexadecimal type specifiers group size is 4.
                return { decimalSeparator: ".", groupSeparator: "_", groupSize: 4 }
            }
            else {
                // Cannot use '_' with fs.type.
                throw StdFormatError.CannotUseTypeSpecifierWith(fs.type, grouping);
            }
        }
        else if (fs.locale) {
            // The L option causes the locale-specific form to be used. This option is only valid for arithmetic types.
            if (fs.isType("deEfFgGaA")) {
                // Use locale's decimal and group separators.
                return { decimalSeparator: localeDecimalSeparator, groupSeparator: localeGroupSeparator, groupSize: 3 }
            }
            else {
                // Cannot use 'L' with fs.type.
                throw StdFormatError.CannotUseTypeSpecifierWith(fs.type, fs.locale);
            }
        }
        else if (fs.isType("n")) {
            // Use locale's decimal and group separators.
            return { decimalSeparator: localeDecimalSeparator, groupSeparator: localeGroupSeparator, groupSize: 3 }
        }
        else {
            // If no grouping then set grouping separator to empty string and group size to Infinity.
            return { decimalSeparator: ".", groupSeparator: "", groupSize: Infinity }
        }
    }

    // Convert this number to string.
    toString() {
        // Get format specification fs.
        let { fs } = this;

        // This will be exponent string.
        let exp: string;

        // This will be digits string.
        let digits: string;

        // This will be prefix string. "0x" for hexadecimal, etc.
        let prefix: string;

        // This will be postfix string. "%" for percentage types, or "".
        let postfix: string = fs.isType("%") ? "%" : "";

        // This will be sign. "-", "+" or " ".
        let sign: string = this.sign < 0 ? "-" : (fs.sign === "-" ? "" : fs.sign);

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
        else {
            // Some type specifiers do not show zero exponent.
            let noZeroExp = !fs.isType("eEaA");

            // Some type specifiers add zero prefix to single digit exponent.
            let needExp00 = fs.isType("", "eEgG");

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

            // Is there grouping?
            if (groupingProps.groupSeparator === "" || intDigits.length <= groupingProps.groupSize) {
                // There is no grouping. Add integer digits.
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
            if (this.dotPos === this.digits.length && fs.sharp === "#" && fs.isType("fFeEgGaA%")) {
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

        // No filling for numbers if align is '<'.
        if (fs.align === "<") {
            fillCount = 0;
        }

        // Get fill character.
        // If align is '=' then use fs.fill.
        // Else use fs.zero if given or '' (no fill) otherwise.
        let fillChar = fs.align === "=" ? fs.fill : (fs.zero ?? "");

        // Form final string representation by adding all components and fill.
        let str = sign + prefix + repeatStr(fillChar, fillCount) + digits + exp + postfix;

        // Convert to uppercase if specified by format specification type.
        return fs.isType("AGEFBX") ? str.toUpperCase() : str;
    }
}

// Check if string formating specifiers are valid.
function validateStringFormatting(str: string, fs: FormatSpecification) {
    if (fs.align === "=") {
        // Align specifier '=' cannot be used with string.
        throw StdFormatError.CannotUseTypeSpecifierWith(fs.type, fs.align);
    }
    else if (fs.grouping !== undefined) {
        // Grouping specifiers ',' and '_' cannot be used with string.
        throw StdFormatError.CannotUseTypeSpecifierWith(fs.type, fs.grouping);
    }
    else if (fs.locale !== undefined) {
        // Locale specifier 'L' cannot be used with string.
        throw StdFormatError.CannotUseTypeSpecifierWith(fs.type, fs.locale);
    }

    return str;
}

// Formats the replacement field.
// @arg is the argument given to stdFormat("", arg0, arg1, ...)
// @fs is the parsed format specification.
function formatReplacementField(arg: unknown, fs: FormatSpecification): string {
    let { align, fill } = fs;

    // Convert to valid argument: string or number.
    let argStr: string;

    // Is type specifier number compatible?
    let isFsTypeNumberCompatible = fs.isType("", "bBodxXaAeEfFgGn%");

    function formatNumber(arg: number | bigint): string {
        // Default align for number is right.
        align ??= ">";

        // Format number to string.
        return new NumberFormatter(arg, fs).toString();
    }

    function formatString(arg: string): string {
        // Default align for string is left.
        align ??= "<";

        // Validate string formatting.
        return validateStringFormatting(arg, fs);
    }

    if (typeof arg === "boolean") {
        // Argument can be boolean.
        if (fs.isType("", "s")) {
            // Convert boolean to string, if type is default '' or string 's'.
            argStr = formatString(arg ? trueString : falseString);
        }
        else if (isFsTypeNumberCompatible) {
            // Convert boolean to number 0 or 1.
            argStr = formatNumber(arg ? 1 : 0);
        }
        else {
            // Invalid argument conversion from boolean.
            throw StdFormatError.InvalidArgumentConversion(arg, fs.type);
        }
    }
    else if (typeof arg === "number" || typeof arg === "bigint") {
        // Argument can be number or bigint.
        if (fs.isType("c")) {
            // If type is 'c' then use argument as char code to convert it to char (string).
            argStr = formatString(String.fromCharCode(getNumber(arg)));
        }
        else if (isFsTypeNumberCompatible) {
            // Use number argument as it is.
            argStr = formatNumber(arg);
        }
        else {
            // Invalid argument conversion from number.
            throw StdFormatError.InvalidArgumentConversion(arg, fs.type);
        }
    }
    else if (typeof arg === "string") {
        // Argument can be string.
        if (fs.isType("dxXobB") && arg.length === 1) {
            // If type is integer then use single char string argument
            // as char and convert it to char code (integer).
            argStr = formatNumber(arg.charCodeAt(0));
        }
        else if (fs.isType("", "s") || fs.isType("c") && arg.length === 1) {
            // Else use string argument as it is.
            argStr = formatString(arg);
        }
        else {
            // Invalid argument conversion from string.
            throw StdFormatError.InvalidArgumentConversion(arg, fs.type);
        }
    }
    else {
        // Invalid argument type.
        throw StdFormatError.InvalidArgument(arg);
    }

    // Next apply fill and alignment according to format specification.

    // Get width of field or 0 if not given.
    let width = fs.width ?? 0;

    // Calculate fillCount
    let fillCount = Math.max(0, width - argStr.length);

    // Initialize replacement string.
    let replacementStr: string = argStr;

    // Modify replacement string if filling is required.
    if (fillCount > 0 && fill.length > 0) {
        switch (align) {
            case "<":
                // Field is left aligned. Add filling to right.
                replacementStr = argStr + repeatStr(fill, fillCount);
                break;
            case "^":
                // Field is center aligned. Add filling to left and right right.
                replacementStr = repeatStr(fill, Math.floor(fillCount / 2)) + argStr + repeatStr(fill, Math.ceil(fillCount / 2));
                break;
            case ">":
                // Field is right aligned. Add filling to left.
                replacementStr = repeatStr(fill, fillCount) + argStr;
                break;
        }
    }

    // Return final replacement string.
    return replacementStr;
}

// Main function to format string using curly bracket notation.
export function stdFormat(formatString: string, ...formatArgs: unknown[]): string {
    // Current string being parsed.
    let parseString = formatString;

    // Result string.
    let resultString: string = "";

    // Automatic field number that is used to obtain argument.
    let automaticFieldNumber = 0;

    // Has automatic or manual field numbering? Cannot have both.
    let hasAutomaticFieldNumbering = false;
    let hasManualFieldSpecification = false;

    // Function to get argument from formatArgs[fieldNumber].
    const getArgument = (fieldNumberStr: string): unknown => {
        // Throw exception if field number string is not valid.
        // It must be empty "", or contain digits only (= zero or positive integer).
        if (fieldNumberStr !== "" && !DigitsRegex.test(fieldNumberStr)) {
            throw StdFormatError.InvalidFieldNumber(fieldNumberStr);
        }

        // Get field number
        let fieldNumber: number;

        // Is field number string empty?
        if (fieldNumberStr.length > 0) {
            // Use manual field specification.
            hasManualFieldSpecification = true;

            // Convert field number string to number
            fieldNumber = +fieldNumberStr;
        }
        else {
            // Use automatic field numbering.
            hasAutomaticFieldNumbering = true;

            // Get ascending field number
            fieldNumber = automaticFieldNumber++;
        }

        // Throw exception switching between automatic and manual field numbering.
        if (hasAutomaticFieldNumbering && hasManualFieldSpecification) {
            throw StdFormatError.SwitchBetweenAutoAndManualFieldNumbering();
        }

        // Throw exception if field number is out of bounds of arguments array.
        if (fieldNumber < 0 || fieldNumber >= formatArgs.length) {
            throw StdFormatError.InvalidFieldNumber("" + fieldNumber);
        }

        // Return argument.
        return formatArgs[fieldNumber];
    }

    // Function to get nested argument integer. Width and precision in format specification can be
    // in form of nested curly braces {:{width field number}.{precision field number}}
    const getNestedArgumentInt = (fieldNumberStr: string): number => {
        // Get the argument
        let arg = getArgument(fieldNumberStr);

        // Nested argument is used for width and precision in format specification, and
        // must be integer number >= 0.
        if (!arg || typeof arg !== "number" || !isInteger(arg) || arg < 0) {
            throw StdFormatError.InvalidArgument(arg);
        }

        // Return nested argument integer
        return arg;
    }

    // Function to parse replacement field.
    const parseReplacementField = () => {
        // Replacement field starts with "{".
        if (parseString[0] !== "{") {
            // Failed to parse replacement field, return false.
            return false;
        }

        // Execute replacement field regex.
        let replFieldMatch = ReplacementFieldRegEx.exec(parseString);

        if (!replFieldMatch || !replFieldMatch[0]) {
            // Failed to parse replacement field, return false.
            return false;
        }

        // Remove matched replacement field from parsing string.
        parseString = parseString.substring(replFieldMatch[0].length);

        // Get field number fropm match.
        let fieldNumber = replFieldMatch.groups?.field_n ?? "";

        // Get argument.
        let arg = getArgument(fieldNumber);

        // Create format specification.
        let fs = new FormatSpecification(replFieldMatch, getNestedArgumentInt);

        // Format replacement field and add it to result string.
        resultString += formatReplacementField(arg, fs);

        // Parsed replacement field ok, return true.
        return true;
    }

    // Function to parse format string.
    const parseFormatString = () => {
        // Loop until terminated by break.
        while (true) {
            // Jump to next curly brace "{" or "}".
            let i = CurlyBracketRegEx.exec(parseString)?.index;

            // Set i to end of parsing string, if did not find curly braces.
            if (i === undefined || i < 0) {
                i = parseString.length;
            }

            // Add ordinary string to result string.
            resultString += parseString.substring(0, i);

            // Jump over ordinary string on parsing string.
            parseString = parseString.substring(i);

            // Now parsing string starts with "{", "}", or is empty.

            if (parseString.startsWith("{{") || parseString.startsWith("}}")) {
                // If parsing string starts with double curly braces
                // Then add single curly brace to result string.
                resultString += parseString[0];

                // Remove double curly braces from parsing string.
                parseString = parseString.substring(2);

                // Continue parsing on next loop.
                continue;
            }
            else if (parseString[0] === "}") {
                // Throw exception if parsing string starts with "}".
                throw StdFormatError.SingleEncounteredInFormatString("}");
            }
            else if (parseString[0] === "{") {
                // If parsing string starts with "{" then parse replacement field, and
                // throw exception if it returns false (there was "{" but parsing failed).
                if (!parseReplacementField()) {
                    throw StdFormatError.SingleEncounteredInFormatString("{");
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

    try {
        // Now parse format string.
        parseFormatString();
    }
    catch (e) {
        // Log internal error to console.
        if (e instanceof StdFormatError && e.isInternalError()) {
            console.error(e.toString());
        }

        // Throw exception forward.
        throw e;
    }

    // Parsing is finished. Return result string.
    return resultString;
}
