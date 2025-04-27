import { FormatError, ThrowFormatError } from "./format-error";

// Assertion error class.
export class AssertionError extends FormatError {
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

// Get symbol info (code point and symbol chars) at pos.
export function getSymbolInfoAt(str: string, pos: number): { codePoint: number, chars: string } | undefined {
    if (pos < 0 || pos >= str.length) {
        return undefined;
    }

    // Get first 16-bit UTF-16 code unit
    const first = str.charCodeAt(pos);

    // Check if first is a high surrogate.
    if (first >= 0xD800 && first <= 0xDBFF && pos + 1 < str.length) {
        // Get second 16-bit UTF-16 code unit.
        let second = str.charCodeAt(pos + 1);
        if (second >= 0xDC00 && second <= 0xDFFF) {
            // Combine the surrogate pair.
            return {
                codePoint: ((first - 0xD800) << 10) + (second - 0xDC00) + 0x10000,
                chars: str[pos] + str[pos + 1]
            }
        }
    }

    // Not a surrogate pair.
    return {
        codePoint: first,
        chars: str[pos]
    }
}

// Is valid code point value?
export function isValidCodePoint(codePoint: number): boolean {
    return isInteger(codePoint) && codePoint >= 0 && codePoint <= 0x10FFFF;
}

// Get symbol from code point.
export function getSymbol(codePoint: number): string {
    if (!isValidCodePoint(codePoint)) {
        ThrowFormatError.throwInvalidCodePoint(codePoint);
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

// Get string real length
export function getStringRealLength(str: string): number {
    let curLen = 0;
    let charPos = 0;

    while (charPos < str.length) {
        let symbolInfo = getSymbolInfoAt(str, charPos);
        if (symbolInfo) {
            curLen++;
            charPos += symbolInfo.chars.length;
        }
        else {
            charPos++;
        }
    }

    return curLen;
}

// Set string real length.
export function setStringRealLength(str: string, newLen: number): string {
    let curLen = 0;
    let charPos = 0;

    while (charPos < str.length && curLen < newLen) {
        let symbolInfo = getSymbolInfoAt(str, charPos);
        if (symbolInfo) {
            curLen++;
            charPos += symbolInfo.chars.length;
        }
        else {
            charPos++;
        }
    }

    // Did not reach length, return full string.
    return str.substring(0, charPos);
}

// Is array?
export function isArray<T>(arg: unknown | T[]): arg is T[] {
    return !!arg && Object.prototype.toString.call(arg) === "[object Array]";
}

// Is map?
export function isMap(arg: unknown): arg is Map<unknown, unknown> {
    return typeof Map === "function" && arg instanceof Map;
}

// Is set?
export function isSet(arg: unknown): arg is Set<unknown> {
    return typeof Set === "function" && arg instanceof Set;
}

// Is record (plain object or custom class)?
export function isRecord(arg: unknown): arg is Record<string, unknown> {
    return typeof arg === "object" && arg !== null &&
        !(
            isArray(arg) ||
            isMap(arg) ||
            isSet(arg) ||
            arg instanceof Function ||
            arg instanceof Date ||
            arg instanceof RegExp ||
            arg instanceof Error
        );
}

export function isPlainObject(arg: unknown): arg is Record<string, unknown> {
    return !!arg && Object.prototype.toString.call(arg) === "[object Object]";
}

// Get record from Map..
export function mapToRecord(arg: unknown): Record<string, unknown> {
    if (isMap(arg)) {
        let r: Record<string, unknown> = Object.create(null);

        arg.forEach((value, key) => r[String(key)] = value);

        return r;
    }
    else {
        return {};
    }
}

// Get record from Map..
export function setToArray(arg: unknown): Array<unknown> {
    if (isSet(arg)) {
        let arr: Array<unknown> = [];

        arg.forEach(value => arr.push(value));

        return arr;
    }
    else {
        return [];
    }
}

// Does object have ok property?
export function hasOkProperty(obj: { [key: string]: unknown }, prop: string): boolean {
    if (!(prop in obj)) {
        return false;
    }
    const type = typeof obj[prop];
    return type !== "function" && type !== "symbol";
}

// Get depth of (nested) array.
export function getArrayDepth<T>(arg: unknown | T[]): number {
    if (isArray(arg)) {
        let depth = 1;

        for (let i = 0; i < arg.length; i++) {
            depth = Math.max(depth, getArrayDepth(arg[i]) + 1);
        }

        return depth;
    }
    else if (isRecord(arg)) {
        let depth = 1;

        for (let key in arg) {
            if (hasOkProperty(arg, key)) {
                depth = Math.max(depth, getArrayDepth(arg[key]) + 1);
            }
        }

        return depth;
    }
    else {
        return 0;
    }
}
