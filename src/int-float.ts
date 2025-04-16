import JSBI from "jsbi";
import { ThrowFormatError } from "./format-error";
import { isInteger, isNegative } from "./internal";

export class IntWrapper {
    private bigInt: JSBI;

    constructor(value: unknown) {
        if (typeof value === "number" && isInteger(value)) {
            this.bigInt = JSBI.BigInt(value);
        }
        else if (typeof value === "string") {
            this.bigInt = JSBI.BigInt(value);
        }
        else if (typeof value === "bigint") {
            this.bigInt = JSBI.BigInt(value.toString());
        }
        else if (value instanceof IntWrapper) {
            this.bigInt = value.bigInt;
        }
        else {
            ThrowFormatError.throwValueNotInteger(value);
        }
    }

    isNegative(): boolean {
        return JSBI.LT(this.bigInt, 0);
    }

    toSafeNumber(): number {
        const MAX_SAFE_INTEGER = 9007199254740991;
        const MIN_SAFE_INTEGER = -9007199254740991;

        // Make sure is in safe number range.
        if (JSBI.GT(this.bigInt, MAX_SAFE_INTEGER) || JSBI.LT(this.bigInt, MIN_SAFE_INTEGER)) {
            ThrowFormatError.throwRangeError(this.bigInt.toString());
        }

        return JSBI.toNumber(this.bigInt);
    }

    toString(radix?: number): string {
        return this.bigInt.toString(radix);
    }
}

export class FloatWrapper {
    private num: number;

    constructor(value: unknown) {
        if (typeof value === "number") {
            this.num = value;
        }
        else if (typeof value === "string") {
            this.num = Number(value);
        }
        else if (typeof value === "bigint") {
            this.num = Number(value.toString());
        }
        else if (value instanceof FloatWrapper) {
            this.num = value.num;
        }
        else {
            ThrowFormatError.throwValueNotFloat(value);
        }
    }

    isNegative(): boolean {
        return this.num < 0 || 1.0 / this.num === -Infinity;
    }

    toSafeNumber(): number {
        return this.num;
    }

    isNaN(): boolean {
        return isNaN(this.num);
    }

    isInfinity(): boolean {
        return Math.abs(this.num) === Infinity;
    }

    toString(): string {
        return this.num.toString();
    }
}

export function int(value?: unknown): IntWrapper {
    return new IntWrapper(value === "" || value === undefined || value === null ? 0 : value);
}

export function float(value?: unknown): FloatWrapper {
    return new FloatWrapper(value === "" || value === undefined || value === null ? 0.0 : value);
}
