import { FormatError } from "./format-error";

// Assert function for internal validation.
export function assert(condition: boolean, msg?: string) {
    if (!condition) {
        throw new FormatError("Assertion failed" + (msg === undefined ? "!" : (": " + msg)));
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

// Convert Map to Record.
export function convertMapToRecord(arg: unknown): Record<string, unknown> {
    if (isMap(arg)) {
        let r: Record<string, unknown> = Object.create(null);

        arg.forEach((value, key) => r[String(key)] = value);

        return r;
    }
    else {
        return {};
    }
}

// Convert Set to Array.
export function convertSetToArray(arg: unknown): Array<unknown> {
    if (isSet(arg)) {
        let arr: Array<unknown> = [];

        arg.forEach(value => arr.push(value));

        return arr;
    }
    else {
        return [];
    }
}

// Does object have formattable property?
export function hasFormattableProperty(obj: { [key: string]: unknown }, prop: string): boolean {
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
            if (hasFormattableProperty(arg, key)) {
                depth = Math.max(depth, getArrayDepth(arg[key]) + 1);
            }
        }

        return depth;
    }
    else {
        return 0;
    }
}
