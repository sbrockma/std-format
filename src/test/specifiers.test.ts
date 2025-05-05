import { format, int, float } from "../index";

/**
 * Test allowed specifiers for each type.
 * Specifiers are: '<^>=-+ z#0,_L'
 * Types are: 's?cdnbBoxXaAeEfF%gG'
 */

describe("Testing allowed specifier for", () => {
    it("grouping and locale together", () => {
        expect(() => format("{:,Ld}", 0)).toThrow();
        expect(() => format("{:_Ld}", 0)).toThrow();
        expect(() => format("{:Ln}", 0)).toThrow();
    });

    it("'' (string)", () => {
        expect(() => format("{:}", "Hello")).not.toThrow();
        expect(() => format("{:*<8}", "Hello")).not.toThrow();
        expect(() => format("{:*^8}", "Hello")).not.toThrow();
        expect(() => format("{:*>8}", "Hello")).not.toThrow();
        expect(() => format("{:*=8}", "Hello")).toThrow();
        expect(() => format("{:-}", "Hello")).toThrow();
        expect(() => format("{:+}", "Hello")).toThrow();
        expect(() => format("{: }", "Hello")).toThrow();
        expect(() => format("{:z}", "Hello")).toThrow();
        expect(() => format("{:#}", "Hello")).toThrow();
        expect(() => format("{:08}", "Hello")).toThrow();
        expect(() => format("{:5}", "Hello")).not.toThrow();
        expect(() => format("{:,}", "Hello")).toThrow();
        expect(() => format("{:_}", "Hello")).toThrow();
        expect(() => format("{:.3}", "Hello")).not.toThrow();
        expect(() => format("{:L}", "Hello")).toThrow();
    });

    it("'' (bool)", () => {
        expect(() => format("{:}", true)).not.toThrow();
        expect(() => format("{:*<8}", true)).not.toThrow();
        expect(() => format("{:*^8}", true)).not.toThrow();
        expect(() => format("{:*>8}", true)).not.toThrow();
        expect(() => format("{:*=8}", true)).toThrow();
        expect(() => format("{:-}", true)).toThrow();
        expect(() => format("{:+}", true)).toThrow();
        expect(() => format("{: }", true)).toThrow();
        expect(() => format("{:z}", true)).toThrow();
        expect(() => format("{:#}", true)).toThrow();
        expect(() => format("{:08}", true)).toThrow();
        expect(() => format("{:5}", true)).not.toThrow();
        expect(() => format("{:,}", true)).toThrow();
        expect(() => format("{:_}", true)).toThrow();
        expect(() => format("{:.3}", true)).not.toThrow();
        expect(() => format("{:L}", true)).toThrow();
    });

    it("'' (number|float)", () => {
        expect(() => format("{:}", 10)).not.toThrow();
        expect(() => format("{:*<8}", 10)).not.toThrow();
        expect(() => format("{:*^8}", 10)).not.toThrow();
        expect(() => format("{:*>8}", 10)).not.toThrow();
        expect(() => format("{:*=8}", 10)).not.toThrow();
        expect(() => format("{:-}", 10)).not.toThrow();
        expect(() => format("{:+}", 10)).not.toThrow();
        expect(() => format("{: }", 10)).not.toThrow();
        expect(() => format("{:z}", 10)).not.toThrow(); // Allow 'z'
        expect(() => format("{:#}", 10)).toThrow();
        expect(() => format("{:08}", 10)).not.toThrow();
        expect(() => format("{:5}", 10)).not.toThrow();
        expect(() => format("{:,}", 10)).not.toThrow();
        expect(() => format("{:_}", 10)).not.toThrow();
        expect(() => format("{:.3}", 10)).not.toThrow();
        expect(() => format("{:L}", 10)).not.toThrow();

        expect(() => format("{:}", float(10))).not.toThrow();
        expect(() => format("{:*<8}", float(10))).not.toThrow();
        expect(() => format("{:*^8}", float(10))).not.toThrow();
        expect(() => format("{:*>8}", float(10))).not.toThrow();
        expect(() => format("{:*=8}", float(10))).not.toThrow();
        expect(() => format("{:-}", float(10))).not.toThrow();
        expect(() => format("{:+}", float(10))).not.toThrow();
        expect(() => format("{: }", float(10))).not.toThrow();
        expect(() => format("{:z}", float(10))).not.toThrow(); // Allow 'z'
        expect(() => format("{:#}", float(10))).toThrow();
        expect(() => format("{:08}", float(10))).not.toThrow();
        expect(() => format("{:5}", float(10))).not.toThrow();
        expect(() => format("{:,}", float(10))).not.toThrow();
        expect(() => format("{:_}", float(10))).not.toThrow();
        expect(() => format("{:.3}", float(10))).not.toThrow();
        expect(() => format("{:L}", float(10))).not.toThrow();
    });

    it("'' (int|BigInt)", () => {
        expect(() => format("{:}", int(999))).not.toThrow();
        expect(() => format("{:*<8}", int(999))).not.toThrow();
        expect(() => format("{:*^8}", int(999))).not.toThrow();
        expect(() => format("{:*>8}", int(999))).not.toThrow();
        expect(() => format("{:*=8}", int(999))).not.toThrow();
        expect(() => format("{:-}", int(999))).not.toThrow();
        expect(() => format("{:+}", int(999))).not.toThrow();
        expect(() => format("{: }", int(999))).not.toThrow();
        expect(() => format("{:z}", int(999))).toThrow();
        expect(() => format("{:#}", int(999))).toThrow();
        expect(() => format("{:08}", int(999))).not.toThrow();
        expect(() => format("{:5}", int(999))).not.toThrow();
        expect(() => format("{:,}", int(999))).not.toThrow();
        expect(() => format("{:_}", int(999))).not.toThrow();
        expect(() => format("{:.3}", int(999))).toThrow();
        expect(() => format("{:L}", int(999))).not.toThrow();

        expect(() => format("{:}", BigInt(999))).not.toThrow();
        expect(() => format("{:*<8}", BigInt(999))).not.toThrow();
        expect(() => format("{:*^8}", BigInt(999))).not.toThrow();
        expect(() => format("{:*>8}", BigInt(999))).not.toThrow();
        expect(() => format("{:*=8}", BigInt(999))).not.toThrow();
        expect(() => format("{:-}", BigInt(999))).not.toThrow();
        expect(() => format("{:+}", BigInt(999))).not.toThrow();
        expect(() => format("{: }", BigInt(999))).not.toThrow();
        expect(() => format("{:z}", BigInt(999))).toThrow();
        expect(() => format("{:#}", BigInt(999))).toThrow();
        expect(() => format("{:08}", BigInt(999))).not.toThrow();
        expect(() => format("{:5}", BigInt(999))).not.toThrow();
        expect(() => format("{:,}", BigInt(999))).not.toThrow();
        expect(() => format("{:_}", BigInt(999))).not.toThrow();
        expect(() => format("{:.3}", BigInt(999))).toThrow();
        expect(() => format("{:L}", BigInt(999))).not.toThrow();
    });

    it("'s'", () => {
        expect(() => format("{:s}", "Hello")).not.toThrow();
        expect(() => format("{:*<8s}", "Hello")).not.toThrow();
        expect(() => format("{:*^8s}", "Hello")).not.toThrow();
        expect(() => format("{:*>8s}", "Hello")).not.toThrow();
        expect(() => format("{:*=8s}", "Hello")).toThrow();
        expect(() => format("{:-s}", "Hello")).toThrow();
        expect(() => format("{:+s}", "Hello")).toThrow();
        expect(() => format("{: s}", "Hello")).toThrow();
        expect(() => format("{:zs}", "Hello")).toThrow();
        expect(() => format("{:#s}", "Hello")).toThrow();
        expect(() => format("{:08s}", "Hello")).toThrow();
        expect(() => format("{:5s}", "Hello")).not.toThrow();
        expect(() => format("{:,s}", "Hello")).toThrow();
        expect(() => format("{:_s}", "Hello")).toThrow();
        expect(() => format("{:.3s}", "Hello")).not.toThrow();
        expect(() => format("{:Ls}", "Hello")).toThrow();
    });

    it("'?'", () => {
        // Not implemented
    });

    it("'c'", () => {
        expect(() => format("{:c}", 65)).not.toThrow();
        expect(() => format("{:*<8c}", 65)).not.toThrow();
        expect(() => format("{:*^8c}", 65)).not.toThrow();
        expect(() => format("{:*>8c}", 65)).not.toThrow();
        expect(() => format("{:*=8c}", 65)).not.toThrow();
        expect(() => format("{:-c}", 65)).toThrow();
        expect(() => format("{:+c}", 65)).toThrow();
        expect(() => format("{: c}", 65)).toThrow();
        expect(() => format("{:zc}", 65)).toThrow();
        expect(() => format("{:#c}", 65)).toThrow();
        expect(() => format("{:08c}", 65)).not.toThrow();
        expect(() => format("{:5c}", 65)).not.toThrow();
        expect(() => format("{:,c}", 65)).toThrow();
        expect(() => format("{:_c}", 65)).toThrow();
        expect(() => format("{:.3c}", 65)).toThrow();
        expect(() => format("{:Lc}", 65)).toThrow();
    });

    it("'d'", () => {
        expect(() => format("{:d}", 65)).not.toThrow();
        expect(() => format("{:*<8d}", 65)).not.toThrow();
        expect(() => format("{:*^8d}", 65)).not.toThrow();
        expect(() => format("{:*>8d}", 65)).not.toThrow();
        expect(() => format("{:*=8d}", 65)).not.toThrow();
        expect(() => format("{:-d}", 65)).not.toThrow();
        expect(() => format("{:+d}", 65)).not.toThrow();
        expect(() => format("{: d}", 65)).not.toThrow();
        expect(() => format("{:zd}", 65)).toThrow();
        expect(() => format("{:#d}", 65)).not.toThrow(); // '#' not used but not throw
        expect(() => format("{:08d}", 65)).not.toThrow();
        expect(() => format("{:5d}", 65)).not.toThrow();
        expect(() => format("{:,d}", 65)).not.toThrow();
        expect(() => format("{:_d}", 65)).not.toThrow();
        expect(() => format("{:.3d}", 65)).toThrow();
        expect(() => format("{:Ld}", 65)).not.toThrow();
    });

    it("'n'", () => {
        expect(() => format("{:n}", 65)).not.toThrow();
        expect(() => format("{:*<8n}", 65)).not.toThrow();
        expect(() => format("{:*^8n}", 65)).not.toThrow();
        expect(() => format("{:*>8n}", 65)).not.toThrow();
        expect(() => format("{:*=8n}", 65)).not.toThrow();
        expect(() => format("{:-n}", 65)).not.toThrow();
        expect(() => format("{:+n}", 65)).not.toThrow();
        expect(() => format("{: n}", 65)).not.toThrow();
        expect(() => format("{:zn}", 65)).toThrow();
        expect(() => format("{:#n}", 65)).not.toThrow(); // '#' not used but not throw
        expect(() => format("{:08n}", 65)).not.toThrow();
        expect(() => format("{:5n}", 65)).not.toThrow();
        expect(() => format("{:,n}", 65)).toThrow();
        expect(() => format("{:_n}", 65)).toThrow();
        expect(() => format("{:.3n}", 65)).toThrow();
        expect(() => format("{:Ln}", 65)).toThrow();
    });

    it("'b'", () => {
        expect(() => format("{:b}", 65)).not.toThrow();
        expect(() => format("{:*<8b}", 65)).not.toThrow();
        expect(() => format("{:*^8b}", 65)).not.toThrow();
        expect(() => format("{:*>8b}", 65)).not.toThrow();
        expect(() => format("{:*=8b}", 65)).not.toThrow();
        expect(() => format("{:-b}", 65)).not.toThrow();
        expect(() => format("{:+b}", 65)).not.toThrow();
        expect(() => format("{: b}", 65)).not.toThrow();
        expect(() => format("{:zb}", 65)).toThrow();
        expect(() => format("{:#b}", 65)).not.toThrow();
        expect(() => format("{:08b}", 65)).not.toThrow();
        expect(() => format("{:5b}", 65)).not.toThrow();
        expect(() => format("{:,b}", 65)).toThrow();
        expect(() => format("{:_b}", 65)).not.toThrow();
        expect(() => format("{:.3b}", 65)).toThrow();
        expect(() => format("{:Lb}", 65)).toThrow();
    });

    it("'B'", () => {
        expect(() => format("{:B}", 65)).not.toThrow();
        expect(() => format("{:*<8B}", 65)).not.toThrow();
        expect(() => format("{:*^8B}", 65)).not.toThrow();
        expect(() => format("{:*>8B}", 65)).not.toThrow();
        expect(() => format("{:*=8B}", 65)).not.toThrow();
        expect(() => format("{:-B}", 65)).not.toThrow();
        expect(() => format("{:+B}", 65)).not.toThrow();
        expect(() => format("{: B}", 65)).not.toThrow();
        expect(() => format("{:zB}", 65)).toThrow();
        expect(() => format("{:#B}", 65)).not.toThrow();
        expect(() => format("{:08B}", 65)).not.toThrow();
        expect(() => format("{:5B}", 65)).not.toThrow();
        expect(() => format("{:,B}", 65)).toThrow();
        expect(() => format("{:_B}", 65)).not.toThrow();
        expect(() => format("{:.3B}", 65)).toThrow();
        expect(() => format("{:LB}", 65)).toThrow();
    });

    it("'o'", () => {
        expect(() => format("{:o}", 65)).not.toThrow();
        expect(() => format("{:*<8o}", 65)).not.toThrow();
        expect(() => format("{:*^8o}", 65)).not.toThrow();
        expect(() => format("{:*>8o}", 65)).not.toThrow();
        expect(() => format("{:*=8o}", 65)).not.toThrow();
        expect(() => format("{:-o}", 65)).not.toThrow();
        expect(() => format("{:+o}", 65)).not.toThrow();
        expect(() => format("{: o}", 65)).not.toThrow();
        expect(() => format("{:zo}", 65)).toThrow();
        expect(() => format("{:#o}", 65)).not.toThrow();
        expect(() => format("{:08o}", 65)).not.toThrow();
        expect(() => format("{:5o}", 65)).not.toThrow();
        expect(() => format("{:,o}", 65)).toThrow();
        expect(() => format("{:_o}", 65)).not.toThrow();
        expect(() => format("{:.3o}", 65)).toThrow();
        expect(() => format("{:Lo}", 65)).toThrow();
    });

    it("'x'", () => {
        expect(() => format("{:x}", 65)).not.toThrow();
        expect(() => format("{:*<8x}", 65)).not.toThrow();
        expect(() => format("{:*^8x}", 65)).not.toThrow();
        expect(() => format("{:*>8x}", 65)).not.toThrow();
        expect(() => format("{:*=8x}", 65)).not.toThrow();
        expect(() => format("{:-x}", 65)).not.toThrow();
        expect(() => format("{:+x}", 65)).not.toThrow();
        expect(() => format("{: x}", 65)).not.toThrow();
        expect(() => format("{:zx}", 65)).toThrow();
        expect(() => format("{:#x}", 65)).not.toThrow();
        expect(() => format("{:08x}", 65)).not.toThrow();
        expect(() => format("{:5x}", 65)).not.toThrow();
        expect(() => format("{:,x}", 65)).toThrow();
        expect(() => format("{:_x}", 65)).not.toThrow();
        expect(() => format("{:.3x}", 65)).toThrow();
        expect(() => format("{:Lx}", 65)).toThrow();
    });

    it("'X'", () => {
        expect(() => format("{:X}", 65)).not.toThrow();
        expect(() => format("{:*<8X}", 65)).not.toThrow();
        expect(() => format("{:*^8X}", 65)).not.toThrow();
        expect(() => format("{:*>8X}", 65)).not.toThrow();
        expect(() => format("{:*=8X}", 65)).not.toThrow();
        expect(() => format("{:-X}", 65)).not.toThrow();
        expect(() => format("{:+X}", 65)).not.toThrow();
        expect(() => format("{: X}", 65)).not.toThrow();
        expect(() => format("{:zX}", 65)).toThrow();
        expect(() => format("{:#X}", 65)).not.toThrow();
        expect(() => format("{:08X}", 65)).not.toThrow();
        expect(() => format("{:5X}", 65)).not.toThrow();
        expect(() => format("{:,X}", 65)).toThrow();
        expect(() => format("{:_X}", 65)).not.toThrow();
        expect(() => format("{:.3X}", 65)).toThrow();
        expect(() => format("{:LX}", 65)).toThrow();
    });

    it("'a'", () => {
        expect(() => format("{:a}", 5.5)).not.toThrow();
        expect(() => format("{:*<8a}", 5.5)).not.toThrow();
        expect(() => format("{:*^8a}", 5.5)).not.toThrow();
        expect(() => format("{:*>8a}", 5.5)).not.toThrow();
        expect(() => format("{:*=8a}", 5.5)).not.toThrow();
        expect(() => format("{:-a}", 5.5)).not.toThrow();
        expect(() => format("{:+a}", 5.5)).not.toThrow();
        expect(() => format("{: a}", 5.5)).not.toThrow();
        expect(() => format("{:za}", 5.5)).not.toThrow();
        expect(() => format("{:#a}", 5.5)).not.toThrow();
        expect(() => format("{:08a}", 5.5)).not.toThrow();
        expect(() => format("{:5a}", 5.5)).not.toThrow();
        expect(() => format("{:,a}", 5.5)).not.toThrow();
        expect(() => format("{:_a}", 5.5)).not.toThrow();
        expect(() => format("{:.3a}", 5.5)).not.toThrow();
        expect(() => format("{:La}", 5.5)).not.toThrow();
    });

    it("'A'", () => {
        expect(() => format("{:A}", 5.5)).not.toThrow();
        expect(() => format("{:*<8A}", 5.5)).not.toThrow();
        expect(() => format("{:*^8A}", 5.5)).not.toThrow();
        expect(() => format("{:*>8A}", 5.5)).not.toThrow();
        expect(() => format("{:*=8A}", 5.5)).not.toThrow();
        expect(() => format("{:-A}", 5.5)).not.toThrow();
        expect(() => format("{:+A}", 5.5)).not.toThrow();
        expect(() => format("{: A}", 5.5)).not.toThrow();
        expect(() => format("{:zA}", 5.5)).not.toThrow();
        expect(() => format("{:#A}", 5.5)).not.toThrow();
        expect(() => format("{:08A}", 5.5)).not.toThrow();
        expect(() => format("{:5A}", 5.5)).not.toThrow();
        expect(() => format("{:,A}", 5.5)).not.toThrow();
        expect(() => format("{:_A}", 5.5)).not.toThrow();
        expect(() => format("{:.3A}", 5.5)).not.toThrow();
        expect(() => format("{:LA}", 5.5)).not.toThrow();
    });

    it("'e'", () => {
        expect(() => format("{:e}", 5.5)).not.toThrow();
        expect(() => format("{:*<8e}", 5.5)).not.toThrow();
        expect(() => format("{:*^8e}", 5.5)).not.toThrow();
        expect(() => format("{:*>8e}", 5.5)).not.toThrow();
        expect(() => format("{:*=8e}", 5.5)).not.toThrow();
        expect(() => format("{:-e}", 5.5)).not.toThrow();
        expect(() => format("{:+e}", 5.5)).not.toThrow();
        expect(() => format("{: e}", 5.5)).not.toThrow();
        expect(() => format("{:ze}", 5.5)).not.toThrow();
        expect(() => format("{:#e}", 5.5)).not.toThrow();
        expect(() => format("{:08e}", 5.5)).not.toThrow();
        expect(() => format("{:5e}", 5.5)).not.toThrow();
        expect(() => format("{:,e}", 5.5)).not.toThrow();
        expect(() => format("{:_e}", 5.5)).not.toThrow();
        expect(() => format("{:.3e}", 5.5)).not.toThrow();
        expect(() => format("{:Le}", 5.5)).not.toThrow();
    });


    it("'E'", () => {
        expect(() => format("{:E}", 5.5)).not.toThrow();
        expect(() => format("{:*<8E}", 5.5)).not.toThrow();
        expect(() => format("{:*^8E}", 5.5)).not.toThrow();
        expect(() => format("{:*>8E}", 5.5)).not.toThrow();
        expect(() => format("{:*=8E}", 5.5)).not.toThrow();
        expect(() => format("{:-E}", 5.5)).not.toThrow();
        expect(() => format("{:+E}", 5.5)).not.toThrow();
        expect(() => format("{: E}", 5.5)).not.toThrow();
        expect(() => format("{:zE}", 5.5)).not.toThrow();
        expect(() => format("{:#E}", 5.5)).not.toThrow();
        expect(() => format("{:08E}", 5.5)).not.toThrow();
        expect(() => format("{:5E}", 5.5)).not.toThrow();
        expect(() => format("{:,E}", 5.5)).not.toThrow();
        expect(() => format("{:_E}", 5.5)).not.toThrow();
        expect(() => format("{:.3E}", 5.5)).not.toThrow();
        expect(() => format("{:LE}", 5.5)).not.toThrow();
    });


    it("'f'", () => {
        expect(() => format("{:f}", 5.5)).not.toThrow();
        expect(() => format("{:*<8f}", 5.5)).not.toThrow();
        expect(() => format("{:*^8f}", 5.5)).not.toThrow();
        expect(() => format("{:*>8f}", 5.5)).not.toThrow();
        expect(() => format("{:*=8f}", 5.5)).not.toThrow();
        expect(() => format("{:-f}", 5.5)).not.toThrow();
        expect(() => format("{:+f}", 5.5)).not.toThrow();
        expect(() => format("{: f}", 5.5)).not.toThrow();
        expect(() => format("{:zf}", 5.5)).not.toThrow();
        expect(() => format("{:#f}", 5.5)).not.toThrow();
        expect(() => format("{:08f}", 5.5)).not.toThrow();
        expect(() => format("{:5f}", 5.5)).not.toThrow();
        expect(() => format("{:,f}", 5.5)).not.toThrow();
        expect(() => format("{:_f}", 5.5)).not.toThrow();
        expect(() => format("{:.3f}", 5.5)).not.toThrow();
        expect(() => format("{:Lf}", 5.5)).not.toThrow();
    });


    it("'F'", () => {
        expect(() => format("{:F}", 5.5)).not.toThrow();
        expect(() => format("{:*<8F}", 5.5)).not.toThrow();
        expect(() => format("{:*^8F}", 5.5)).not.toThrow();
        expect(() => format("{:*>8F}", 5.5)).not.toThrow();
        expect(() => format("{:*=8F}", 5.5)).not.toThrow();
        expect(() => format("{:-F}", 5.5)).not.toThrow();
        expect(() => format("{:+F}", 5.5)).not.toThrow();
        expect(() => format("{: F}", 5.5)).not.toThrow();
        expect(() => format("{:zF}", 5.5)).not.toThrow();
        expect(() => format("{:#F}", 5.5)).not.toThrow();
        expect(() => format("{:08F}", 5.5)).not.toThrow();
        expect(() => format("{:5F}", 5.5)).not.toThrow();
        expect(() => format("{:,F}", 5.5)).not.toThrow();
        expect(() => format("{:_F}", 5.5)).not.toThrow();
        expect(() => format("{:.3F}", 5.5)).not.toThrow();
        expect(() => format("{:LF}", 5.5)).not.toThrow();
    });


    it("'%'", () => {
        expect(() => format("{:%}", 5.5)).not.toThrow();
        expect(() => format("{:*<8%}", 5.5)).not.toThrow();
        expect(() => format("{:*^8%}", 5.5)).not.toThrow();
        expect(() => format("{:*>8%}", 5.5)).not.toThrow();
        expect(() => format("{:*=8%}", 5.5)).not.toThrow();
        expect(() => format("{:-%}", 5.5)).not.toThrow();
        expect(() => format("{:+%}", 5.5)).not.toThrow();
        expect(() => format("{: %}", 5.5)).not.toThrow();
        expect(() => format("{:z%}", 5.5)).not.toThrow();
        expect(() => format("{:#%}", 5.5)).not.toThrow();
        expect(() => format("{:08%}", 5.5)).not.toThrow();
        expect(() => format("{:5%}", 5.5)).not.toThrow();
        expect(() => format("{:,%}", 5.5)).not.toThrow();
        expect(() => format("{:_%}", 5.5)).not.toThrow();
        expect(() => format("{:.3%}", 5.5)).not.toThrow();
        expect(() => format("{:L%}", 5.5)).not.toThrow();
    });


    it("'g'", () => {
        expect(() => format("{:g}", 5.5)).not.toThrow();
        expect(() => format("{:*<8g}", 5.5)).not.toThrow();
        expect(() => format("{:*^8g}", 5.5)).not.toThrow();
        expect(() => format("{:*>8g}", 5.5)).not.toThrow();
        expect(() => format("{:*=8g}", 5.5)).not.toThrow();
        expect(() => format("{:-g}", 5.5)).not.toThrow();
        expect(() => format("{:+g}", 5.5)).not.toThrow();
        expect(() => format("{: g}", 5.5)).not.toThrow();
        expect(() => format("{:zg}", 5.5)).not.toThrow();
        expect(() => format("{:#g}", 5.5)).not.toThrow();
        expect(() => format("{:08g}", 5.5)).not.toThrow();
        expect(() => format("{:5g}", 5.5)).not.toThrow();
        expect(() => format("{:,g}", 5.5)).not.toThrow();
        expect(() => format("{:_g}", 5.5)).not.toThrow();
        expect(() => format("{:.3g}", 5.5)).not.toThrow();
        expect(() => format("{:Lg}", 5.5)).not.toThrow();
    });

    it("'G'", () => {
        expect(() => format("{:G}", 5.5)).not.toThrow();
        expect(() => format("{:*<8G}", 5.5)).not.toThrow();
        expect(() => format("{:*^8G}", 5.5)).not.toThrow();
        expect(() => format("{:*>8G}", 5.5)).not.toThrow();
        expect(() => format("{:*=8G}", 5.5)).not.toThrow();
        expect(() => format("{:-G}", 5.5)).not.toThrow();
        expect(() => format("{:+G}", 5.5)).not.toThrow();
        expect(() => format("{: G}", 5.5)).not.toThrow();
        expect(() => format("{:zG}", 5.5)).not.toThrow();
        expect(() => format("{:#G}", 5.5)).not.toThrow();
        expect(() => format("{:08G}", 5.5)).not.toThrow();
        expect(() => format("{:5G}", 5.5)).not.toThrow();
        expect(() => format("{:,G}", 5.5)).not.toThrow();
        expect(() => format("{:_G}", 5.5)).not.toThrow();
        expect(() => format("{:.3G}", 5.5)).not.toThrow();
        expect(() => format("{:LG}", 5.5)).not.toThrow();
    });
});