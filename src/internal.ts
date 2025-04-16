import { IntWrapper } from "./int";

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

// Test if number is integer.
export function isInteger(n: unknown): n is number {
    return typeof n === "number" && isFinite(n) && n === Math.trunc(n);
}

// Function to convert digit value to digit character.
export function mapDigitToChar(d: number) {
    return "0123456789abcdef"[d];
}

// Is value negative. For number -0 is negative and +0 is positive.
export function isNegative(n: number | IntWrapper): boolean {
    if (n instanceof IntWrapper) {
        return n.isNegative();
    }
    else {
        return n < 0 || 1.0 / n === -Infinity;
    }
}

// Get number from number or Int.
export function getNumber(n: number | IntWrapper): number {
    return n instanceof IntWrapper ? n.toSafeNumber() : n;
}
