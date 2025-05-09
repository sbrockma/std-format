import { getCodePointAt, getGraphemeAt, getSymbol } from "./char-coding";

describe("Testing char coding functions", () => {

    it("getCodePointAt", () => {
        expect(getCodePointAt("", 0)).toEqual(undefined);
        expect(getCodePointAt("A", -1)).toEqual(undefined);
        expect(getCodePointAt("A", 0)).toEqual(65);
        expect(getCodePointAt("A", 1)).toEqual(undefined);
        expect(getCodePointAt("Ω", 0)).toEqual(0x03A9);
        expect(getCodePointAt("𐍈", 0)).toEqual(0x10348); // 𐍈
        expect(getCodePointAt("\uD800\uDF48", 0)).toEqual(0x10348); // 𐍈
        expect(getCodePointAt("𝄞", 0)).toEqual(0x1D11E); // 𝄞
        expect(getCodePointAt("\uD834\uDD1E", 0)).toEqual(0x1D11E); // 𝄞
        expect(getCodePointAt("𐍈𝄞𐍈", 2)).toEqual(0x1D11E);

        // Get second char of symbol "𝄞"
        expect(getCodePointAt("\uD834\uDD1E", 1)).toEqual(0xDD1E);
    });

    it("getGraphemeAt", () => {
        expect(getGraphemeAt("", 0)).toEqual(Object({ grapheme: "", length: 0 }));
        expect(getGraphemeAt("A", -1)).toEqual(Object({ grapheme: "", length: 0 }));
        expect(getGraphemeAt("A", 0)).toEqual(Object({ grapheme: "A", length: 1 }));
        expect(getGraphemeAt("A", 1)).toEqual(Object({ grapheme: "", length: 0 }));
        expect(getGraphemeAt("Ω", 0)).toEqual(Object({ grapheme: "Ω", length: 1 }));
        expect(getGraphemeAt("𐍈", 0)).toEqual(Object({ grapheme: "\uD800\uDF48", length: 2 })); // 𐍈
        expect(getGraphemeAt("\uD800\uDF48", 0)).toEqual(Object({ grapheme: "𐍈", length: 2 })); // 𐍈
        expect(getGraphemeAt("𝄞", 0)).toEqual(Object({ grapheme: "\uD834\uDD1E", length: 2 })); // 𝄞
        expect(getGraphemeAt("\uD834\uDD1E", 0)).toEqual(Object({ grapheme: "𝄞", length: 2 })); // 𝄞
        expect(getGraphemeAt("𐍈𝄞𐍈", 2)).toEqual(Object({ grapheme: "𝄞", length: 2 }));

        // Get second char of symbol "𝄞"
        expect(getGraphemeAt("\uD834\uDD1E", 1)).toEqual(Object({ grapheme: "\uDD1E", length: 1 }));
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
});
