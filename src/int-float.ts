import JSBI from "jsbi";
import { ThrowFormatError } from "./format-error";
import { assert, isInteger, isNegative } from "./internal";

const MAX_SAFE_INTEGER = 9007199254740991;
const MIN_SAFE_INTEGER = -9007199254740991;

export abstract class NumberWrapper {
    abstract isIntType(): boolean;
    abstract isFloatType(): boolean;
    abstract isNaN(): boolean;
    abstract isInfinity(): boolean;
    abstract isNegative(): boolean;
    abstract toSafeNumber(): number;
    abstract toString(radix?: number): string;

    static isIntType(arg: unknown): arg is NumberWrapper {
        return arg instanceof NumberWrapper && arg.isIntType();
    }

    static isFloatType(arg: unknown): arg is NumberWrapper {
        return arg instanceof NumberWrapper && arg.isFloatType();
    }
}

export class IntWrapper extends NumberWrapper {
    private bigInt: JSBI;

    constructor(value: unknown) {
        super();

        if (typeof value === "number" && isInteger(value)) {
            this.bigInt = JSBI.BigInt(value);
        }
        else if (typeof value === "string") {
            this.bigInt = JSBI.BigInt(value || "0");
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

    isIntType(): boolean {
        return true;
    }

    isFloatType(): boolean {
        return false;
    }

    isNaN(): boolean {
        return false;
    }

    isInfinity(): boolean {
        return false;
    }

    isNegative(): boolean {
        return JSBI.LT(this.bigInt, 0);
    }

    toSafeNumber(): number {
        // Make sure is in safe number range.
        if (JSBI.GT(this.bigInt, MAX_SAFE_INTEGER) || JSBI.LT(this.bigInt, MIN_SAFE_INTEGER)) {
            ThrowFormatError.throwToSafeNumberError(this.bigInt.toString());
        }

        return JSBI.toNumber(this.bigInt);
    }

    toString(radix?: number): string {
        return this.bigInt.toString(radix);
    }
}

export class FloatWrapper extends NumberWrapper {
    private num: number;

    constructor(value: unknown) {
        super();

        if (typeof value === "number") {
            this.num = value;
        }
        else if (typeof value === "string") {
            this.num = Number(value || "0");
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

    isIntType(): boolean {
        return false;
    }

    isFloatType(): boolean {
        return true;
    }

    isNaN(): boolean {
        return isNaN(this.num);
    }

    isInfinity(): boolean {
        return Math.abs(this.num) === Infinity;
    }

    isNegative(): boolean {
        return isNegative(this.num);
    }

    toSafeNumber(): number {
        return this.num;
    }

    toString(radix?: number): string {
        assert(radix === undefined || radix === 10, "FloatWrapper cannot toString to radix = " + radix);
        return this.num.toString();
    }
}

/**
 * @public
 */
export function int(value?: unknown): unknown {
    return value === undefined || value === null ? value : new IntWrapper(value);
}

/**
 * @public
 */
export function float(value?: unknown): unknown {
    return value === undefined || value === null ? value : new FloatWrapper(value);
}
