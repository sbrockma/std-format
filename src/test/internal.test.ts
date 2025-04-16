import { float, int } from "../int-float";
import { getNumber, isNegative } from "../internal";

describe("Testing internal functions", () => {
    it("isNegative", () => {
        expect(isNegative(-1)).toEqual(true);
        expect(isNegative(-0)).toEqual(true);
        expect(isNegative(0)).toEqual(false);
        expect(isNegative(1)).toEqual(false);

        expect(isNegative(int(-1))).toEqual(true);
        expect(isNegative(int(-0))).toEqual(false);
        expect(isNegative(int(0))).toEqual(false);
        expect(isNegative(int(1))).toEqual(false);

        expect(isNegative(float(-1))).toEqual(true);
        expect(isNegative(float(-0))).toEqual(true);
        expect(isNegative(float(0))).toEqual(false);
        expect(isNegative(float(1))).toEqual(false);
    });

    it("getNumber", () => {
        expect(getNumber(9007199254740991)).toEqual(9007199254740991);
        expect(getNumber(-9007199254740991)).toEqual(-9007199254740991);

        expect(getNumber(int("9007199254740991"))).toEqual(9007199254740991);
        expect(getNumber(int("-9007199254740991"))).toEqual(-9007199254740991);

        expect(() => getNumber(int("9007199254740992"))).toThrow();
        expect(() => getNumber(int("-9007199254740992"))).toThrow();
    });
});
