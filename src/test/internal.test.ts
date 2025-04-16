import { int } from "../int";
import { getNumber, isNegative } from "../internal";

describe("Testing internal functions", () => {
    it("isNegative", () => {
        expect(isNegative(-1)).toEqual(true);
        expect(isNegative(1)).toEqual(false);

        expect(isNegative(-0)).toEqual(true);
        expect(isNegative(+0)).toEqual(false);

        expect(isNegative(int(-0))).toEqual(false);
        expect(isNegative(int(+0))).toEqual(false);
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
