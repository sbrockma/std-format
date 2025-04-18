
// Assertion error class.
export class AssertionError extends Error {
    constructor(msg?: string) {
        super("Assertion failed" + (msg === undefined ? "!" : (": " + msg)));
        this.name = "AssertionError";
    }
}

// Assert function for internal validation.
export function assert(condition: boolean, msg?: string) {
    if (!condition) {
        throw new AssertionError(msg);
    }
}

// Create string that is string s repeated count times
export function repeatString(repeatStr: string, repeatCount: number): string {
    assert(repeatCount >= 0, "repeatCount < 0");
    return new Array(repeatCount + 1).join(repeatStr);
}

// Create number array that contains number n count times
export function zeroArray(zeroCount: number): 0[] {
    assert(zeroCount >= 0, "zeroCount < 0");
    return new Array<0>(zeroCount).fill(0);
}

// Function to convert digit value to digit character.
export function mapDigitToChar(d: number) {
    return "0123456789abcdef".charAt(d);
}

// Test if number is integer.
export function isInteger(n: unknown): n is number {
    return typeof n === "number" && isFinite(n) && n === Math.trunc(n);
}

// Is number negative. For number -0 is negative and +0 is positive.
export function isNegative(n: number): boolean {
    return n < 0 || 1.0 / n === -Infinity;
}

// Get code point from symbol.
export function getCodePoint(sym: string): number | undefined {
    if (sym.length === 0) {
        return undefined;
    }

    // Get first 16-bit UTF-16 code unit
    const first = sym.charCodeAt(0);

    // Check if first is a high surrogate.
    if (first >= 0xD800 && first <= 0xDBFF && sym.length > 1) {
        // Get second 16-bit UTF-16 code unit
        let second = sym.charCodeAt(1);
        if (second >= 0xDC00 && second <= 0xDFFF) {
            // Combine the surrogate pair.
            return ((first - 0xD800) << 10) + (second - 0xDC00) + 0x10000;
        }
    }

    // Not a surrogate pair.
    return first;
}

// Is str single symbol?
export function isSingleSymbol(str: string): boolean {
    return str.length === 1 || (str.length === 2 && getCodePoint(str)! > 0xFFFF);
}

// Is valid code point value?
export function isValidCodePoint(codePoint: number): boolean {
    return isInteger(codePoint) && codePoint >= 0 && codePoint <= 0x10FFFF;
}

// Get symbol from code point.
export function getSymbol(codePoint: number): string {
    if (!isValidCodePoint(codePoint)) {
        throw RangeError("Invalid code point: " + codePoint);
    }

    if (codePoint <= 0xFFFF) {
        return String.fromCharCode(codePoint);
    }
    else {
        // Encode surrogate pair.
        codePoint -= 0x10000;

        const highSurrogate = 0xD800 + (codePoint >> 10);
        const lowSurrogate = 0xDC00 + (codePoint & 0x3FF);

        return String.fromCharCode(highSurrogate, lowSurrogate);
    }
}
