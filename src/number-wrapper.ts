import JSBI from "jsbi";
import { assert, isInteger, isNegative } from "./utils/common";
import { FormatError } from "./index";

const MAX_SAFE_INTEGER = 9007199254740991;
const MIN_SAFE_INTEGER = -9007199254740991;

// Throw value not integer error
export function throwValueNotInteger(value: unknown): never {
    throw new FormatError("Value '" + value + "' is not integer");
}

// Throw value not float error
export function throwValueNotFloat(value: unknown): never {
    throw new FormatError("Value '" + value + "' is not float");
}

// Throw to safe number error
export function throwToSafeNumberError(value: string): never {
    throw new FormatError(value + " cannot safely to number");
}

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
            throwValueNotInteger(value);
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
            throwToSafeNumberError(this.bigInt.toString());
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
            throwValueNotFloat(value);
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
