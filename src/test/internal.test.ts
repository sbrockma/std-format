import { assert, getArrayDepth, getSymbol, getSymbolInfoAt, isArray, isInteger, isNegative, mapDigitToChar, repeatString, zeroArray } from "../internal";

describe("Testing internal functions", () => {

    it("assert", () => {
        expect(() => assert(true)).not.toThrow();
        expect(() => assert(false)).toThrow();
    });

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

    it("getCodePoint", () => {
        expect(getSymbolInfoAt("", 0)).toEqual(undefined);
        expect(getSymbolInfoAt("A", -1)).toEqual(undefined);
        expect(getSymbolInfoAt("A", 0)).toEqual({ codePoint: 65, chars: "A" });
        expect(getSymbolInfoAt("A", 1)).toEqual(undefined);
        expect(getSymbolInfoAt("Ω", 0)).toEqual({ codePoint: 0x03A9, chars: "Ω" });
        expect(getSymbolInfoAt("𐍈", 0)).toEqual({ codePoint: 0x10348, chars: "\uD800\uDF48" }); // 𐍈
        expect(getSymbolInfoAt("\uD800\uDF48", 0)).toEqual({ codePoint: 0x10348, chars: "𐍈" }); // 𐍈
        expect(getSymbolInfoAt("𝄞", 0)).toEqual({ codePoint: 0x1D11E, chars: "\uD834\uDD1E" }); // 𝄞
        expect(getSymbolInfoAt("\uD834\uDD1E", 0)).toEqual({ codePoint: 0x1D11E, chars: "𝄞" }); // 𝄞
        expect(getSymbolInfoAt("𐍈𝄞𐍈", 2)).toEqual({ codePoint: 0x1D11E, chars: "𝄞" });

        // Get second char of symbol "𝄞", ok?
        expect(getSymbolInfoAt("\uD834\uDD1E", 1)).toEqual({ codePoint: 0xDD1E, chars: "\uDD1E" });
    });

    it("getSymbol", () => {
        expect(getSymbol(65)).toEqual("A");
        expect(getSymbol(0x03A9)).toEqual("Ω");
        expect(getSymbol(0x10348)).toEqual("𐍈");
        expect(getSymbol(0x10348)).toEqual("\uD800\uDF48"); // 𐍈
        expect(getSymbol(119070)).toEqual("𝄞");
        expect(getSymbol(119070)).toEqual("\uD834\uDD1E"); // 𝄞

        // Invalid code points.
        expect(() => getSymbol(-1)).toThrow();
        expect(() => getSymbol(0x10FFFF + 1)).toThrow();
        expect(() => getSymbol(100.1)).toThrow();
        expect(() => getSymbol(NaN)).toThrow();
        expect(() => getSymbol(Infinity)).toThrow();
        expect(() => getSymbol(-Infinity)).toThrow();
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

    it("getArrayDepth", () => {
        expect(getArrayDepth(undefined)).toEqual(0);
        expect(getArrayDepth(null)).toEqual(0);
        expect(getArrayDepth(0)).toEqual(0);
        expect(getArrayDepth("0")).toEqual(0);
        expect(getArrayDepth({})).toEqual(0);
        expect(getArrayDepth(() => { })).toEqual(0);
        expect(getArrayDepth([])).toEqual(1);
        expect(getArrayDepth([0, 1, 2])).toEqual(1);
        expect(getArrayDepth([[0], [1], [2]])).toEqual(2);
        expect(getArrayDepth([[[0], [1]], [2]])).toEqual(3);
        expect(getArrayDepth([0, [1, 2]])).toEqual(2);
        expect(getArrayDepth([[], "0"])).toEqual(2);
    });
});
