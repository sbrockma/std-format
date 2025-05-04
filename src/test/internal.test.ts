import { getArrayDepth, isArray, isInteger, isMap, isNegative, isRecord, mapDigitToChar, repeatString, zeroArray } from "../internal";

describe("Testing internal functions", () => {

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

    it("isArray", () => {
        expect(isArray(undefined)).toEqual(false);
        expect(isArray(null)).toEqual(false);
        expect(isArray(0)).toEqual(false);
        expect(isArray("0")).toEqual(false);
        expect(isArray({})).toEqual(false);
        expect(isArray(() => { })).toEqual(false);
        expect(isArray([])).toEqual(true);
        expect(isArray([0])).toEqual(true);
        expect(isArray(["0"])).toEqual(true);
    });

    it("isRecord", () => {
        expect(isRecord(undefined)).toEqual(false);
        expect(isRecord(null)).toEqual(false);
        expect(isRecord(0)).toEqual(false);
        expect(isRecord("0")).toEqual(false);
        expect(isRecord({})).toEqual(true);
        expect(isRecord(() => { })).toEqual(false);
        expect(isRecord([])).toEqual(false);
        expect(isRecord(new Map())).toEqual(false);
        expect(isRecord(new Set())).toEqual(false);
        expect(isRecord(new Date())).toEqual(false);
        expect(isRecord(new Error("Oops!"))).toEqual(false);
    });

    it("isMap", () => {
        expect(isMap(undefined)).toEqual(false);
        expect(isMap(null)).toEqual(false);
        expect(isMap(0)).toEqual(false);
        expect(isMap("0")).toEqual(false);
        expect(isMap({})).toEqual(false);
        expect(isMap(() => { })).toEqual(false);
        expect(isMap([])).toEqual(false);
        expect(isMap(new Map([]))).toEqual(true);
    });

    it("getArrayDepth", () => {
        expect(getArrayDepth(undefined)).toEqual(0);
        expect(getArrayDepth(null)).toEqual(0);
        expect(getArrayDepth(0)).toEqual(0);
        expect(getArrayDepth("0")).toEqual(0);
        expect(getArrayDepth(() => { })).toEqual(0);
        expect(getArrayDepth([])).toEqual(1);
        expect(getArrayDepth([0, 1, 2])).toEqual(1);
        expect(getArrayDepth([[0], [1], [2]])).toEqual(2);
        expect(getArrayDepth([[[0], [1]], [2]])).toEqual(3);
        expect(getArrayDepth([0, [1, 2]])).toEqual(2);
        expect(getArrayDepth([[], "0"])).toEqual(2);
        expect(getArrayDepth({})).toEqual(1);
        expect(getArrayDepth([{}])).toEqual(2);
        expect(getArrayDepth({ A: [] })).toEqual(2);

    });
});
