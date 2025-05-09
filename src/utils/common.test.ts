import { isInteger, isNegative, mapDigitToChar, repeatString, zeroArray } from "./common";

describe("Testing util common functions", () => {
    it("repetString", () => {
        expect(repeatString("Aa", 0)).toEqual("");
        expect(repeatString("Aa", 1)).toEqual("Aa");
        expect(repeatString("Aa", 2)).toEqual("AaAa");
        expect(() => repeatString("Fail", -1)).toThrow();
    });

    it("zeroArray", () => {
        expect(zeroArray(0)).toEqual([]);
        expect(zeroArray(1)).toEqual([0]);
        expect(zeroArray(2)).toEqual([0, 0]);
        expect(() => zeroArray(-1)).toThrow();
    });

    it("isInteger", () => {
        expect(isInteger(-1)).toEqual(true);
        expect(isInteger(0)).toEqual(true);
        expect(isInteger(1)).toEqual(true);
        expect(isInteger("1")).toEqual(false);
        expect(isInteger(false)).toEqual(false);
        expect(isInteger({})).toEqual(false);
        expect(isInteger(5.70)).toEqual(false);
        expect(isInteger(NaN)).toEqual(false);
        expect(isInteger(Infinity)).toEqual(false);
        expect(isInteger(-Infinity)).toEqual(false);
    });

    it("mapDigitToChar", () => {
        expect(mapDigitToChar(-1)).toEqual("");
        expect(mapDigitToChar(0)).toEqual("0");
        expect(mapDigitToChar(1)).toEqual("1");
        expect(mapDigitToChar(2)).toEqual("2");
        expect(mapDigitToChar(3)).toEqual("3");
        expect(mapDigitToChar(4)).toEqual("4");
        expect(mapDigitToChar(5)).toEqual("5");
        expect(mapDigitToChar(6)).toEqual("6");
        expect(mapDigitToChar(7)).toEqual("7");
        expect(mapDigitToChar(8)).toEqual("8");
        expect(mapDigitToChar(9)).toEqual("9");
        expect(mapDigitToChar(10)).toEqual("a");
        expect(mapDigitToChar(11)).toEqual("b");
        expect(mapDigitToChar(12)).toEqual("c");
        expect(mapDigitToChar(13)).toEqual("d");
        expect(mapDigitToChar(14)).toEqual("e");
        expect(mapDigitToChar(15)).toEqual("f");
        expect(mapDigitToChar(16)).toEqual("");
    });

    it("isNegative", () => {
        expect(isNegative(-1)).toEqual(true);
        expect(isNegative(-0)).toEqual(true);
        expect(isNegative(0)).toEqual(false);
        expect(isNegative(1)).toEqual(false);

        expect(isNegative(NaN)).toEqual(false);
        expect(isNegative(Infinity)).toEqual(false);
        expect(isNegative(-Infinity)).toEqual(true);
    });
});
