import { assert, isInteger, isNegative, zeroArray } from "./utils/common";
import { ElementPresentation } from "./replacement-field";
import { FormatStringParser } from "format-string-parser";

// Class is for converting finite numbers.
export class NumberConverter {
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
    constructor(value: number, p: FormatStringParser, ep: ElementPresentation) {
        // Is valid?
        if (!isFinite(value) || !ep.hasType("", "eEfF%gGaA")) {
            p.throwCannotFormatArgumentAsType(value, ep.type);
        }

        // Set base
        this.base = ep.hasType("aA") ? 16 : 10;

        // Initialize sign, digits, dot position and exponent to initial values.
        this.sign = isNegative(value) ? -1 : +1;
        this.digits = [];
        this.dotPos = 0;
        this.exp = 0;

        if (this.base === 10) {
            // Convert base 10 value using toString() and parsing the string.
            let valueStr = value.toString(10);

            // Remove sign
            if (valueStr[0] === "-") {
                valueStr = valueStr.substring(1);
            }

            // Get exponent.
            let i = valueStr.indexOf("e");
            if (i >= 0) {
                this.exp = +valueStr.substring(i + 1);
                valueStr = valueStr.substring(0, i);
            }
            else {
                this.exp = 0;
            }

            // Get dot position.
            i = valueStr.indexOf(".");
            if (i >= 0) {
                this.dotPos = i;
                valueStr = valueStr.substring(0, i) + valueStr.substring(i + 1);
            }
            else {
                this.dotPos = valueStr.length;
            }

            // Get digits, map each digit "0"-"9" to number 0-9.
            this.digits = valueStr.split("").map(c => +c);
        }
        else {
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

        // Was zero?
        if (this.digits.length === 0) {
            this.digits = [0];
            this.dotPos = 1;
            this.exp = 0;
        }

        // Remove any leading zeroes.
        while (this.digits.length > 1 && this.digits[0] === 0) {
            assert(this.dotPos === 1, "Has leading zero but dotPos != 1.")
            this.digits.shift();
            this.exp--;
        }

        // Remove any trailing zeroes.
        while (this.digits.length > 1 && this.digits[this.digits.length - 1] === 0) {
            this.digits.pop();
            if (this.dotPos > this.digits.length) {
                this.dotPos--;
                this.exp++;
            }
        }

        // If format specifier is "%" then convert value to percents.
        if (!this.isZero() && ep.hasType("%")) {
            // Multiply by 100 by moving exponent right two digits (base = 10).
            this.exp += 2;
        }

        // Make scientific notation (dot position = 1)
        this.exp += this.dotPos - 1;
        this.dotPos = 1;

        //////////////////////////////////////////////////////////////////////////
        // Convert this number to notation according to element presentation.

        if (ep.hasType("")) {
            // If type is default ''.
            // Then handle as float.

            // This is almost like the 'g'. Use p = as large as needed to represent
            // the given value faithfully, if not given. Treat p = 0 as p = 1.
            let p = Math.max(1, ep.precision ?? 17); // FIXME!

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
                this.removeInsignificantTrailingZeroes(1);
            }
            else {
                // Remove insignificant trailing zeroes.
                this.removeInsignificantTrailingZeroes();
            }
        }
        else if (ep.hasType("eE")) {
            // Get precision. If not given, default is 6.
            let p = ep.precision ?? 6;

            // Convert to scientific notation
            this.toScientific(p);
        }
        else if (ep.hasType("fF%")) {
            // Get precision. If not given, default is 6.
            let p = ep.precision ?? 6;

            // Convert to fixed notation.
            this.toFixed(p);
        }
        else if (ep.hasType("gG")) {
            // Convert to general notation.

            // Get precision. Treat p = 0 as p = 1. If not given, default is 6.
            let p = Math.max(1, ep.precision ?? 6);

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
            if (ep.sharp !== "#") {
                // Remove insignificant trailing zeroes.
                this.removeInsignificantTrailingZeroes();
            }
        }
        else if (ep.hasType("aA")) {
            // Convert to normalised hexadecimal exponential notation.
            this.toNormalisedHexadecimalExponential();

            // If precision not given use as big precision as possible.
            let p = ep.precision ?? (this.digits.length - 1);

            // Convert to scientific notation. Normalised hexadecimal exponential notation
            // already is in scientific notation but this sets precision and does rounding. 
            this.toScientific(p);
        }
        else {
            p.throwCannotFormatArgumentAsType(value, ep.type);
        }

        if (ep.zeta === "z") {
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

    // Is this number zero?
    private isZero() {
        // After conversion zero can have more than one zero digits, for exmaple "0.00".
        return this.digits.length >= 1 && this.digits.every(d => d === 0);
    }

    // Validate internal state.
    private validateInternalState() {
        if (this.isZero()) {
            assert(this.exp === 0, "Is zero but exp != 0");
            assert(this.dotPos === 1, "Is zero but dot pos != 1");
        }

        assert(isInteger(this.exp), "exp is not integer");
        assert(isInteger(this.dotPos), "dotPos is not integer");

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
    private toPrecision(precision: number, precisionType: "after_dot" | "total") {
        // Get new digit count.
        // * In fixed type new digit count is number of digits after dot.
        // * Else new digit count is precision. 
        let newDigitCount = precisionType === "after_dot" ? (this.dotPos + precision) : precision;

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

                    if (precisionType === "after_dot") {
                        // If type = "after_dot" then increase dot pos to compensate 
                        // because we just added new digit to start of digits.
                        // Digits after dot position and exponent remains unaltered.
                        this.dotPos++;
                    }
                    else {
                        // If type = "total" then need to keep total digit count 
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
        this.toPrecision(precision, "after_dot");
    }

    // Convert number to scientific notation.
    // Precision is number of digits after decimal point.
    // So total digits is (p + 1).
    private toScientific(precision: number) {
        // Move dot to position to right after first digit.
        this.exp += this.dotPos - 1;
        this.dotPos = 1;

        // Set total (precision + 1) digits.
        this.toPrecision(precision + 1, "total");
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

    // Remove insignificant trailing zeroes (optionally leave one digit past dot position).
    private removeInsignificantTrailingZeroes(leave: 0 | 1 = 0) {
        while (this.digits.length > Math.max(1, this.dotPos + leave) && this.digits[this.digits.length - 1] === 0) {
            this.digits.pop();
        }
    }
}
