import { format, setLocale, stdFormat, stdLocaleHint, stdSpecificationHint } from "./index";
import DefaultExport from "./index";

describe("Testing std-format", () => {
    function formatLocale(locale: string, fmt: string, ...args: unknown[]) {
        setLocale(locale);
        return format(fmt, ...args);
    }

    it("test default export", () => {
        expect(DefaultExport.stdFormat("The answer is {}.", 42)).toEqual("The answer is 42.");
    });

    it("using curly braces", () => {
        expect(format("Test {{ }} {{}}", 1, 2)).toEqual("Test { } {}");
        expect(format("frac{{{}}}{{{}}}", 1, 2)).toEqual("frac{1}{2}");
        expect(format("frac{{{0}}}{{{1}}}", 1, 2)).toEqual("frac{1}{2}");

        expect(() => format("Hello { World!")).toThrow(); // Single '{'
        expect(() => format("Hello } World!")).toThrow(); // Single '}'

        expect(() => format("{:{^5}", 0)).toThrow(); // Invalid fill character '{'
        expect(() => format("{:}^5}", 0)).toThrow(); // Invalid fill character '}'
    });

    it("invalid replacement field", () => {
        expect(() => format("{***}", 1, 2)).toThrow();
        expect(() => format("{x:q}", 1, 2)).toThrow();
        expect(() => format("{:{}D}", 1, 2)).toThrow();
        expect(() => format("{:{}{}}", 0, 5, 2)).toThrow(); // Missing '.' between braces {:{}.{}}
    });

    it("field numbering", () => {
        expect(format("{} World!", "Hello")).toEqual("Hello World!");
        expect(format("{:} World!", "Hello")).toEqual("Hello World!");
        expect(format("{0:} World!", "Hello")).toEqual("Hello World!");

        expect(format("{0}, {1}, {2}", "a", "b", "c")).toEqual("a, b, c");
        expect(format("{}, {}, {}", "a", "b", "c")).toEqual("a, b, c");
        expect(format("{2}, {1}, {0}", "a", "b", "c")).toEqual("c, b, a");
        expect(format("{0}{1}{0}", "abra", "cad")).toEqual("abracadabra");

        expect(() => format("{3}", 0, 1)).toThrow();
        expect(() => format("{-1}", 0, 1)).toThrow();
        expect(() => format("{1.5}", 0, 1)).toThrow();

        // Nested fields
        expect(format("{:!^{}.{}f}", 123.45, 8, 1)).toEqual("!123.5!!");
        expect(format("{2:!^{1}.{0}f}", 1, 8, 123.45)).toEqual("!123.5!!");
        expect(format("{:0{}d}", 1, 4)).toEqual("0001");

        // Cannot switch between manual and automatic field numbering
        expect(() => format("{}{1}", 0, 1)).toThrow();
        expect(() => format("{0}{}", 0, 1)).toThrow();
        expect(() => format("{2:!^{}.{}f}", 123.45, 8, 1)).toThrow();
        expect(() => format("{:!^{1}.{0}f}", 123.45, 8, 1)).toThrow();
    });

    it("grouping specifier ,", () => {
        // Apply grouping with type specifiers "deEfFgG"
        expect(format("{:,d}", 12)).toEqual("12");
        expect(format("{:,d}", 123)).toEqual("123");
        expect(format("{:,d}", 1234)).toEqual("1,234");
        expect(format("{:,d}", 12345)).toEqual("12,345");
        expect(format("{:,d}", 123456)).toEqual("123,456");
        expect(format("{:,d}", 1234567)).toEqual("1,234,567");
        expect(format("{:,d}", 12345678)).toEqual("12,345,678");

        expect(format("{:,.4e}", 123456.123456)).toEqual("1.2346e+05");
        expect(format("{:,.4E}", 123456.123456)).toEqual("1.2346E+05");
        expect(format("{:,.4f}", 123456.123456)).toEqual("123,456.1235");
        expect(format("{:,.4F}", 123456.123456)).toEqual("123,456.1235");
        expect(format("{:,.4g}", 123456.123456)).toEqual("1.235e+05");
        expect(format("{:,.4G}", 123456.123456)).toEqual("1.235E+05");
        expect(format("{:,.2%}", 123)).toEqual("12,300.00%");

        expect(format("{:,d}", BigInt("5555555555555555555555555555555555555555"))).
            toEqual("5,555,555,555,555,555,555,555,555,555,555,555,555,555");

        // Unsupported type specifiers
        expect(() => format("{:,}", 1)).toThrow();
        expect(() => format("{:,b}", 1)).toThrow();
        expect(() => format("{:,B}", 1)).toThrow();
        expect(() => format("{:,o}", 1)).toThrow();
        expect(() => format("{:,x}", 1)).toThrow();
        expect(() => format("{:,X}", 1)).toThrow();
        expect(() => format("{:,s}", 1)).toThrow();
        expect(() => format("{:,c}", 1)).toThrow();
        expect(() => format("{:,a}", 1)).toThrow();
        expect(() => format("{:,A}", 1)).toThrow();
        expect(() => format("{:,?}", 1)).toThrow();
        expect(() => format("{:,n}", 1)).toThrow();
    });

    it("grouping specifier _", () => {
        // Apply grouping with type specifiers "deEfFgG"
        expect(format("{:_d}", 12)).toEqual("12");
        expect(format("{:_d}", 123)).toEqual("123");
        expect(format("{:_d}", 1234)).toEqual("1_234");
        expect(format("{:_d}", 12345)).toEqual("12_345");
        expect(format("{:_d}", 123456)).toEqual("123_456");
        expect(format("{:_d}", 1234567)).toEqual("1_234_567");
        expect(format("{:_d}", 12345678)).toEqual("12_345_678");

        expect(format("{:_.4e}", 123456.123456)).toEqual("1.2346e+05");
        expect(format("{:_.4E}", 123456.123456)).toEqual("1.2346E+05");
        expect(format("{:_.4f}", 123456.123456)).toEqual("123_456.1235");
        expect(format("{:_.4F}", 123456.123456)).toEqual("123_456.1235");
        expect(format("{:_.4g}", 123456.123456)).toEqual("1.235e+05");
        expect(format("{:_.4G}", 123456.123456)).toEqual("1.235E+05");
        expect(format("{:_.2%}", 123)).toEqual("12_300.00%");

        // Apply grouping with type specifiers "bBoxX" (group size = 4)
        expect(format("{:_b}", 555)).toEqual("10_0010_1011");
        expect(format("{:#_B}", 555)).toEqual("0B10_0010_1011");
        expect(format("{:_o}", 444666888)).toEqual("32_4021_2010");
        expect(format("{:#_x}", 8765432)).toEqual("0x85_bff8");
        expect(format("{:_X}", 8765432)).toEqual("85_BFF8");

        expect(format("{:_d}", BigInt("-5555555555555555555555555555555555555555"))).
            toEqual("-5_555_555_555_555_555_555_555_555_555_555_555_555_555");

        // Unsupported type specifiers
        expect(() => format("{:_}", 1)).toThrow();
        expect(() => format("{:_s}", 1)).toThrow();
        expect(() => format("{:_c}", 1)).toThrow();
        expect(() => format("{:_a}", 1)).toThrow();
        expect(() => format("{:_A}", 1)).toThrow();
        expect(() => format("{:_?}", 1)).toThrow();
        expect(() => format("{:_n}", 1)).toThrow();
    });

    it("type specifier n", () => {
        expect(formatLocale("en-UK", "{:n}", 5555555555)).toEqual("5,555,555,555");
    });

    it("locale specifier L", () => {
        expect(formatLocale("en-UK", "{:Ld}", 4444444444)).toEqual("4,444,444,444");
        expect(formatLocale("en-UK", "{:.2Lf}", 444444.4444)).toEqual("444,444.44");

        // Cannot use specifier together
        expect(() => format("{:,Ld}", 0)).toThrow();
        expect(() => format("{:_Ld}", 0)).toThrow();
        expect(() => format("{:Ln}", 0)).toThrow();
    });

    it("sign", () => {
        expect(format("{0:},{0:+},{0:-},{0: }", 1)).toEqual("1,+1,1, 1");
        expect(format("{0:},{0:+},{0:-},{0: }", -1)).toEqual("-1,-1,-1,-1");
        expect(format("{0:},{0:+},{0:-},{0: }", Infinity)).toEqual("inf,+inf,inf, inf");
        expect(format("{0:},{0:+},{0:-},{0: }", NaN)).toEqual("nan,+nan,nan, nan");

        expect(format("{:+}, {: }", 314, 314)).toEqual("+314,  314");

        expect(format("{:+f}; {:+f}", 3.14, -3.14)).toEqual("+3.140000; -3.140000");
        expect(format("{: f}; {: f}", 3.14, -3.14)).toEqual(" 3.140000; -3.140000");
        expect(format("{:-f}; {:-f}", 3.14, -3.14)).toEqual("3.140000; -3.140000");
    });

    it("fill and align", () => {
        // Default fill and default align
        expect(format("{:6}", 42)).toEqual("    42");
        expect(format("{:6}", "x")).toEqual("x     ");
        expect(format("{:*<6}", "x")).toEqual("x*****");
        expect(format("{:*>6}", "x")).toEqual("*****x");
        expect(format("{:*^6}", "x")).toEqual("**x***");
        expect(format("{:6d}", 120)).toEqual("   120");

        expect(format("{:?<8d}", 10)).toEqual("10??????");
        expect(format("{:?^8d}", 10)).toEqual("???10???");
        expect(format("{:?>8d}", 10)).toEqual("??????10");
        expect(format("{:?=8d}", 10)).toEqual("??????10");

        expect(format("{:<6}", -42)).toEqual("-42   "); // Default fill char ' '
        expect(format("{:^6}", -42)).toEqual(" -42  ");
        expect(format("{:>6}", -42)).toEqual("   -42");
        expect(format("{:=6}", -42)).toEqual("-   42");

        expect(format("{:<06}", -42)).toEqual("-42000"); // '0' is specified
        expect(format("{:^06}", -42)).toEqual("0-4200");
        expect(format("{:>06}", -42)).toEqual("000-42");
        expect(format("{:=06}", -42)).toEqual("-00042");

        expect(format("{:q<6}", -42)).toEqual("-42qqq"); // Fill char is given
        expect(format("{:q^6}", -42)).toEqual("q-42qq");
        expect(format("{:q>6}", -42)).toEqual("qqq-42");
        expect(format("{:q=6}", -42)).toEqual("-qqq42");

        expect(format("{:7}|{:7}|{:7}|{:7}", 1, -.2, "str", "c")).toEqual("      1|   -0.2|str    |c      ");
        expect(format("{:*<7}|{:*<7}|{:*>7}|{:*>7}", 1, -.2, "str", "c")).toEqual("1******|-0.2***|****str|******c");
        expect(format("{:07}|{:07}|{:^7}|{:^7}", 1, -.2, "str", "c")).toEqual("0000001|-0000.2|  str  |   c   ");

        expect(format("{:<30}", "left aligned")).toEqual("left aligned                  ");
        expect(format("{:>30}", "right aligned")).toEqual("                 right aligned");
        expect(format("{:^30}", "centered")).toEqual("           centered           ");
        expect(format("{:*^30}", "centered")).toEqual("***********centered***********");
    });

    it("fill specifier =", () => {
        expect(format("{:*=8d}", 10)).toEqual("******10");
        expect(format("{:*=8d}", -10)).toEqual("-*****10");
        expect(format("{:0=#10x}", 10)).toEqual("0x0000000a");
        expect(format("{:0=#10x}", -10)).toEqual("-0x000000a");

        // Both fill and 0 with signs '+' and ' '
        expect(format("{:*=+#08d}", 10)).toEqual("+*****10");
        expect(format("{:*=+#08d}", -10)).toEqual("-*****10");
        expect(format("{:*= #08d}", 10)).toEqual(" *****10");
        expect(format("{:*= #08d}", -10)).toEqual("-*****10");

        // '=' alignment not allowed on strings
        expect(() => format("{:*=9s}", "oho")).toThrow();
        expect(() => format("{:*=9?}", "oho")).toThrow();
        expect(() => format("{:*=9}", "oho")).toThrow();

        // '=' allowed for char specifier 'c'
        expect(format("{:*=9c}", 65)).toEqual("********A");
    });

    it("specifier 0", () => {
        expect(format("{:015.2f}", 1234.5678)).toEqual("000000001234.57");
        expect(format("{:15.02f}", 1234.5678)).toEqual("        1234.57");

        expect(format("{:#8x}", 1)).toEqual("     0x1");
        expect(format("{:#08x}", 1)).toEqual("0x000001");

        expect(format("{:#15b}", -7)).toEqual("         -0b111");
        expect(format("{:#015b}", -7)).toEqual("-0b000000000111");
    });

    it("width and precision", () => {
        let b = 3.14;
        expect(format("{:.2f}", 0)).toEqual("0.00");
        expect(format("{:10f}", b)).toEqual("  3.140000");
        expect(format("{:{}f}", b, 10)).toEqual("  3.140000");
        expect(format("{:.5f}", b)).toEqual("3.14000");
        expect(format("{:.{}f}", b, 5)).toEqual("3.14000");
        expect(format("{:10.5f}", b)).toEqual("   3.14000");
        expect(format("{:{}.{}f}", b, 10, 5)).toEqual("   3.14000");

        expect(() => format("{:{}f}", Math.PI, 10.1)).toThrow(); // Width is not integer
        expect(() => format("{:{}f}", Math.PI, -10)).toThrow();  // Width is negative

        expect(() => format("{:.{}f}", Math.PI, 5.2)).toThrow(); // Precision is not integer
        expect(() => format("{:.{}f}", Math.PI, -2)).toThrow();  // Precision is negative

        expect(format("{:.0s}", "Hello World!")).toEqual("");
        expect(format("{:.1s}", "Hello World!")).toEqual("H");
        expect(format("{:.2s}", "Hello World!")).toEqual("He");
        expect(format("{:.3s}", "Hello World!")).toEqual("Hel");
        expect(format("{:.4s}", "Hello World!")).toEqual("Hell");
        expect(format("{:.5s}", "Hello World!")).toEqual("Hello");

        expect(format("{:*^5.5s}", "A")).toEqual("**A**");
        expect(format("{:*^5.5s}", "AA")).toEqual("*AA**");
        expect(format("{:*^5.5s}", "AAA")).toEqual("*AAA*");
        expect(format("{:*^5.5s}", "AAAA")).toEqual("AAAA*");
        expect(format("{:*^5.5s}", "AAAAA")).toEqual("AAAAA");
        expect(format("{:*^5.5s}", "AAAAAA")).toEqual("AAAAA");
        expect(format("{:*^5.5s}", "AAAAAAA")).toEqual("AAAAA");
    });

    it("negative and positive zero", () => {
        // Default type, treat -0 and +0 zero as integer 0.
        expect(format("{}", -0.0)).toEqual("0");
        expect(format("{}", +0.0)).toEqual("0");

        // With integer specifiers treat +0 and -0 as 0
        expect(format("{:d}", -0.0)).toEqual("0");
        expect(format("{:d}", +0.0)).toEqual("0");
        expect(format("{:X}", -0.0)).toEqual("0");
        expect(format("{:X}", +0.0)).toEqual("0");

        // With floating point specifiers there is -0 and +0
        expect(format("{:.2e}", -0.0)).toEqual("-0.00e+00");
        expect(format("{:.2e}", +0.0)).toEqual("0.00e+00");
        expect(format("{:+.2e}", -0.0)).toEqual("-0.00e+00");
        expect(format("{:+.2e}", +0.0)).toEqual("+0.00e+00");

        expect(format("{:.2f}", +0.0005)).toEqual("0.00");
        expect(format("{:.2f}", -0.0005)).toEqual("-0.00");

    });

    it("specifier z", () => {
        // Coerse -0 to 0 for floating point types.
        expect(format("{:z.2e}", -0.0)).toEqual("0.00e+00");
        expect(format("{:z.2E}", -0.0)).toEqual("0.00E+00");
        expect(format("{:z.2f}", -0.0005)).toEqual("0.00");
        expect(format("{:z.2F}", -0.0005)).toEqual("0.00");
        expect(format("{:z.2%}", -0.00001)).toEqual("0.00%");
        expect(format("{:z.2g}", -0.0)).toEqual("0");
        expect(format("{:z.2G}", -0.0)).toEqual("0");
        expect(format("{:z.2a}", -0.0)).toEqual("0.00p+0");
        expect(format("{:z.2A}", -0.0)).toEqual("0.00P+0");

        // 'z' allowed only for foating point types.
        expect(() => format("{:z}", -0)).toThrow();
        expect(() => format("{:zs}", -0)).toThrow();
        expect(() => format("{:zc}", -0)).toThrow();
        expect(() => format("{:zd}", -0)).toThrow();
        expect(() => format("{:zb}", -0)).toThrow();
        expect(() => format("{:zB}", -0)).toThrow();
        expect(() => format("{:zo}", -0)).toThrow();
        expect(() => format("{:zx}", -0)).toThrow();
        expect(() => format("{:zX}", -0)).toThrow();
        expect(() => format("{:z?}", -0)).toThrow();
        expect(() => format("{:zn}", -0)).toThrow();
    });

    it("type specifier ?", () => {
        // Not yet implemented.
        expect(() => format("{:?}", 0)).toThrow();
    });

    it("nan", () => {
        expect(format("{:d}", NaN)).toEqual("nan");
        expect(format("{:x}", NaN)).toEqual("nan");
        expect(format("{:X}", NaN)).toEqual("NAN");
        expect(format("{:b}", NaN)).toEqual("nan");
        expect(format("{:B}", NaN)).toEqual("NAN");
        expect(format("{:o}", NaN)).toEqual("nan");
        expect(format("{:a}", NaN)).toEqual("nan");
        expect(format("{:A}", NaN)).toEqual("NAN");
        expect(format("{:e}", NaN)).toEqual("nan");
        expect(format("{:E}", NaN)).toEqual("NAN");
        expect(format("{:f}", NaN)).toEqual("nan");
        expect(format("{:F}", NaN)).toEqual("NAN");
        expect(format("{:g}", NaN)).toEqual("nan");
        expect(format("{:G}", NaN)).toEqual("NAN");

        expect(format("{:08}", NaN)).toEqual("00000nan");
    });

    it("inf", () => {
        expect(format("{:d}", +Infinity)).toEqual("inf");
        expect(format("{:d}", -Infinity)).toEqual("-inf");
        expect(format("{:x}", +Infinity)).toEqual("inf");
        expect(format("{:X}", -Infinity)).toEqual("-INF");
        expect(format("{:b}", +Infinity)).toEqual("inf");
        expect(format("{:B}", -Infinity)).toEqual("-INF");
        expect(format("{:o}", +Infinity)).toEqual("inf");
        expect(format("{:o}", -Infinity)).toEqual("-inf");
        expect(format("{:a}", +Infinity)).toEqual("inf");
        expect(format("{:A}", -Infinity)).toEqual("-INF");
        expect(format("{:e}", +Infinity)).toEqual("inf");
        expect(format("{:E}", -Infinity)).toEqual("-INF");
        expect(format("{:f}", +Infinity)).toEqual("inf");
        expect(format("{:F}", -Infinity)).toEqual("-INF");
        expect(format("{:g}", +Infinity)).toEqual("inf");
        expect(format("{:G}", -Infinity)).toEqual("-INF");

        expect(format("{:08}", Infinity)).toEqual("00000inf");
        expect(format("{:08}", -Infinity)).toEqual("-0000inf");
    });

    it("type specifier <none>, bool", () => {
        expect(format("{} {}", true, false)).toEqual("true false");
    });

    it("type specifier <none>, string", () => {
        expect(format("{}", "string")).toEqual("string");
    });

    it("type specifier <none>, integer", () => {
        expect(format("{}", 100)).toEqual("100");
        expect(format("{}", 10)).toEqual("10");
        expect(format("{}", 1)).toEqual("1");
        expect(format("{}", 0)).toEqual("0");
        expect(format("{}", -1)).toEqual("-1");
        expect(format("{}", -10)).toEqual("-10");
        expect(format("{}", -100)).toEqual("-100");

        expect(format("{:}", 999)).toEqual("999");
    });

    it("type specifier <none>, float", () => {
        expect(format("{:.2}", Math.PI)).toEqual("3.1");

        expect(format("{:.1}", 10)).toEqual("1e+01");
        expect(format("{:.2}", 10)).toEqual("1e+01");
        expect(format("{:.3}", 10)).toEqual("10.0");
        expect(format("{:.4}", 10)).toEqual("10.0");

        expect(format("{:.2}", 9.99)).toEqual("1e+01");
        expect(format("{:.2}", 99.99)).toEqual("1e+02");
        expect(format("{:.5}", 99.99999)).toEqual("100.0");

        expect(format("{:.0}", 123e+8)).toEqual("1e+10");
        expect(format("{:.1}", 123e+8)).toEqual("1e+10");
        expect(format("{:.2}", 123e+8)).toEqual("1.2e+10");

        expect(format("{:.0}", 678e-8)).toEqual("7e-06");
        expect(format("{:.1}", 678e-8)).toEqual("7e-06");
        expect(format("{:.2}", 678e-8)).toEqual("6.8e-06");
    });

    it("type specifier s", () => {
        expect(format("{:s}", "Hello")).toEqual("Hello");
        expect(format("{:s}", "42")).toEqual("42");

        expect(() => format("{:s}", 42)).toThrow();

        // Fill and align
        expect(format("{:15s}", "Banana")).toEqual("Banana         ");
        expect(format("{:!<15s}", "Banana")).toEqual("Banana!!!!!!!!!");
        expect(format("{:!^15s}", "Banana")).toEqual("!!!!Banana!!!!!");
        expect(format("{:!>15s}", "Banana")).toEqual("!!!!!!!!!Banana");

        // Precision = how may chars.
        expect(format("{:-^8.4s}", "doc")).toEqual("--doc---");
        expect(format("{:-^8.3s}", "doc")).toEqual("--doc---");
        expect(format("{:-^8.2s}", "doc")).toEqual("---do---");
        expect(format("{:-^8.1s}", "doc")).toEqual("---d----");
        expect(format("{:-^8.0s}", "doc")).toEqual("--------");


        // Specifiers not allowed with 's'
        expect(() => format("{:0s}", "Hello")).toThrow();
        expect(() => format("{:=8s}", "Hello")).toThrow();
        expect(() => format("{:,s}", "Hello")).toThrow();
        expect(() => format("{:_s}", "Hello")).toThrow();
        expect(() => format("{:Ls}", "Hello")).toThrow();
        expect(() => format("{:+s}", "Hello")).toThrow();
        expect(() => format("{:#s}", "Hello")).toThrow();
        expect(() => format("{:zs}", "Hello")).toThrow();
    });

    it("type specifier c", () => {
        expect(format("{:c}", 65)).toEqual("A");

        // Fill and align
        expect(format("{:5c}", 65)).toEqual("    A");
        expect(format("{:05c}", 65)).toEqual("0000A");
        expect(format("{:x<5c}", 65)).toEqual("Axxxx");
        expect(format("{:x^5c}", 65)).toEqual("xxAxx");
        expect(format("{:x>5c}", 65)).toEqual("xxxxA");
        expect(format("{:x=5c}", 65)).toEqual("xxxxA");
        expect(() => format("{:x=5.2c}", 65)).toThrow();

        // Use single char string as char (in c++ you could use char 'A').
        expect(format("{:c}", "A")).toEqual("A");
        expect(() => format("{:c}", "")).toThrow();
        expect(() => format("{:c}", "Hello")).toThrow();

        // Char code must be int in range 0..0xFFFF.
        expect(() => format("{:c}", -1)).toThrow();
        expect(() => format("{:c}", 65536)).toThrow();
        expect(() => format("{:c}", BigInt("888888888888888888888888"))).toThrow();
        expect(() => format("{:c}", 111.1)).toThrow();
        expect(() => format("{:c}", NaN)).toThrow();
        expect(() => format("{:c}", Infinity)).toThrow();

        // Specifiers that are not allowed with 'c'.
        expect(() => format("{:+c}", 'A')).toThrow();
        expect(() => format("{:zc}", 'A')).toThrow();
        expect(() => format("{:#c}", 'A')).toThrow();
        expect(() => format("{:,c}", 'A')).toThrow();
        expect(() => format("{:_c}", 'A')).toThrow();
    });

    it("type specifier ?", () => {
        // Not yet implemented
        expect(() => format("{:?}", "\t")).toThrow();
    });

    it("type specifier d", () => {
        expect(format("{:d}", 321)).toEqual("321");
        expect(format("{:d}", -321)).toEqual("-321");

        // Use single char string as char (in c++ you could use char 'c').
        expect(format("{:d}", "c")).toEqual("99");
        expect(format("{:+06d}", String.fromCharCode(120))).toEqual("+00120");
        expect(format("{:+06d}", 120)).toEqual("+00120");

        expect(format("{:d} {:d}", true, false)).toEqual("1 0");

        expect(() => format("{:d}", "hello")).toThrow();
    });

    it("type specifier x and X", () => {
        expect(format("{:#06x}", 0xa)).toEqual("0x000a");
        expect(format("{:#06x}", -0xa)).toEqual("-0x00a");
        expect(format("{:x}", 314)).toEqual("13a");
        expect(format("{:x}", "c")).toEqual("63");
        expect(format("{:#x}", 314)).toEqual("0x13a");
        expect(format("{:#X}", 314)).toEqual("0X13A");
    });

    it("type specifier b and B", () => {
        expect(format("{:b}", 314)).toEqual("100111010");
        expect(format("{:#b}", 314)).toEqual("0b100111010");
    });

    it("type specifier o", () => {
        expect(format("{:o}", 834)).toEqual("1502");
        expect(format("{:o}", -834)).toEqual("-1502");

        expect(format("{:#o}", 834)).toEqual("0o1502");
        expect(format("{:#o}", -834)).toEqual("-0o1502");
        expect(format("{:#o}", 0)).toEqual("0o0");
    });

    it("precision for integer", () => {
        expect(() => format("{:.4d}", 32)).toThrow();
        expect(() => format("{:.4B}", 32)).toThrow();
    });

    it("type specifier f and F", () => {
        expect(format("{:.2f}", 0)).toEqual("0.00");
        expect(format("{:.1f}", 0)).toEqual("0.0");
        expect(format("{:.0f}", 0)).toEqual("0");
        expect(format("{:#.0f}", 0)).toEqual("0.");

        expect(format("{:.2f}", 1)).toEqual("1.00");
        expect(format("{:.1f}", 1)).toEqual("1.0");
        expect(format("{:.0f}", 1)).toEqual("1");
        expect(format("{:#.0f}", 1)).toEqual("1.");

        // rounding up
        expect(format("{:.2f}", 567.567)).toEqual("567.57");
        expect(format("{:.1f}", 567.567)).toEqual("567.6");
        expect(format("{:.0f}", 567.567)).toEqual("568");
        expect(format("{:#.0f}", 567.567)).toEqual("568.");

        // no rounding
        expect(format("{:.2f}", 423.423)).toEqual("423.42");
        expect(format("{:.1f}", 423.423)).toEqual("423.4");
        expect(format("{:.0f}", 423.423)).toEqual("423");
        expect(format("{:#.0f}", 423.423)).toEqual("423.");

        expect(format("{:.3f}", 6e+10)).toEqual("60000000000.000");
        expect(format("{:.0f}", 6e+10)).toEqual("60000000000");
        expect(format("{:#.0f}", 6e+10)).toEqual("60000000000.");

        expect(format("{:.3f}", 4e-10)).toEqual("0.000");
        expect(format("{:.0f}", 4e-10)).toEqual("0");
        expect(format("{:#.0f}", 4e-10)).toEqual("0.");

        expect(format("{:.1f}", 9.999)).toEqual("10.0");
        expect(format("{:.1f}", 99.99)).toEqual("100.0");
        expect(format("{:.1f}", 999.9)).toEqual("999.9");
        expect(format("{:.1f}", 9999)).toEqual("9999.0");

        expect(() => format("{:.2f}", "100")).toThrow();
    });

    it("type specifier e and E", () => {
        expect(format("{:.2e}", 0)).toEqual("0.00e+00");
        expect(format("{:.1e}", 0)).toEqual("0.0e+00");
        expect(format("{:.0E}", 0)).toEqual("0E+00");
        expect(format("{:#.0E}", 0)).toEqual("0.E+00");

        expect(format("{:.2e}", 1)).toEqual("1.00e+00");
        expect(format("{:.1e}", -1)).toEqual("-1.0e+00");
        expect(format("{:.0E}", -1)).toEqual("-1E+00");
        expect(format("{:#.0E}", 1)).toEqual("1.E+00");

        // rounding up
        expect(format("{:.3e}", -86.8676)).toEqual("-8.687e+01");
        expect(format("{:.2e}", -86.8676)).toEqual("-8.69e+01");
        expect(format("{:.1e}", 86.8676)).toEqual("8.7e+01");
        expect(format("{:.0e}", 86.8676)).toEqual("9e+01");
        expect(format("{:.2e}", 99999)).toEqual("1.00e+05");

        expect(format("{:.2E}", Math.PI)).toEqual("3.14E+00");

        expect(format("{:.2e}", 99999)).toEqual("1.00e+05");

        expect(format("{:.1e}", 456e+10)).toEqual("4.6e+12");
        expect(format("{:.1e}", 456e-10)).toEqual("4.6e-08");

        let a = 9867.498;
        expect(format("{:.4e}", a)).toEqual("9.8675e+03");
        expect(format("{:.3e}", a)).toEqual("9.867e+03");
        expect(format("{:.2e}", a)).toEqual("9.87e+03");
        expect(format("{:.1e}", a)).toEqual("9.9e+03");
        expect(format("{:.0e}", a)).toEqual("1e+04");
    });

    it("type specifier g and G", () => {
        expect(format("{:.2g}", 0)).toEqual("0");
        expect(format("{:.1g}", 0)).toEqual("0");
        expect(format("{:.0G}", 0)).toEqual("0");
        expect(format("{:#.0G}", 0)).toEqual("0.");

        expect(format("{:.2g}", 1)).toEqual("1");
        expect(format("{:.1g}", -1)).toEqual("-1");
        expect(format("{:.0G}", -1)).toEqual("-1");
        expect(format("{:#.0G}", 1)).toEqual("1.");

        expect(format("{:.5g}", Math.PI)).toEqual("3.1416");

        expect(format("{:g}", 123.456789e+10)).toEqual("1.23457e+12");
        expect(format("{:g}", 123.456789)).toEqual("123.457");

        expect(format("{:.1g}", 9.9999e+4)).toEqual("1e+05");
        expect(format("{:.1g}", 9.9999)).toEqual("1e+01");
        expect(format("{:.1g}", 9.9999e-4)).toEqual("0.001");

        expect(format("{:.2g}", 0.0008379643567865)).toEqual("0.00084");
        expect(format("{:.2g}", 0.08379643567865)).toEqual("0.084");
        expect(format("{:.2g}", 8.379643567865)).toEqual("8.4");
        expect(format("{:.2g}", 837.9643567865)).toEqual("8.4e+02");
        expect(format("{:.2g}", 83796.43567865)).toEqual("8.4e+04");
        expect(format("{:.2g}", 8379643.567865)).toEqual("8.4e+06");
        expect(format("{:.2g}", 837964356.7865)).toEqual("8.4e+08");
        expect(format("{:.2g}", 83796435678.65)).toEqual("8.4e+10");
        expect(format("{:.2g}", 8379643567865)).toEqual("8.4e+12");

        expect(format("{:.6g}", 0.0008379643567865)).toEqual("0.000837964");
        expect(format("{:.6g}", 0.08379643567865)).toEqual("0.0837964");
        expect(format("{:.6g}", 8.379643567865)).toEqual("8.37964");
        expect(format("{:.6g}", 837.9643567865)).toEqual("837.964");
        expect(format("{:.6g}", 83796.43567865)).toEqual("83796.4");
        expect(format("{:.6g}", 8379643.567865)).toEqual("8.37964e+06");
        expect(format("{:.6g}", 837964356.7865)).toEqual("8.37964e+08");
        expect(format("{:.6g}", 83796435678.65)).toEqual("8.37964e+10");
        expect(format("{:.6g}", 8379643567865)).toEqual("8.37964e+12");

        // Trailing zeroes not removed with '#' specifier
        expect(format("{:#.3g}", 0.0)).toEqual("0.00");
        expect(format("{:#.3g}", 1.0)).toEqual("1.00");
        expect(format("{:#.3g}", 1e+6)).toEqual("1.00e+06");
        expect(format("{:#.3g}", 1e-6)).toEqual("1.00e-06");
    });

    it("type specifier a and A", () => {
        expect(format("{:+#.0a}", 0)).toEqual("+0.p+0");
        expect(format("{:#.2a}", 1)).toEqual("1.00p+0");

        expect(format("{:a}", 1.1)).toEqual("1.199999999999ap+0");
        expect(format("{: a}", 1.1)).toEqual(" 1.199999999999ap+0");
        expect(format("{:+a}", 1.1)).toEqual("+1.199999999999ap+0");
        expect(format("{:-a}", 1.1)).toEqual("1.199999999999ap+0");
        expect(format("{:-a}", -1.1)).toEqual("-1.199999999999ap+0");
        expect(format("{:.5a}", 1.1)).toEqual("1.1999ap+0");

        expect(format("{:.2a}", 1e-2)).toEqual("1.48p-7");
        expect(format("{:.2a}", 1e+2)).toEqual("1.90p+6");

        expect(format("{:.3a}", 1234567890)).toEqual("1.266p+30");
        expect(format("{:.3a}", -1234567890)).toEqual("-1.266p+30");
        expect(format("{:.3a}", 1234567890e-20)).toEqual("1.b26p-37");
        expect(format("{:.3a}", -1234567890e-20)).toEqual("-1.b26p-37");

        expect(format("{:a}", 0.0001)).toEqual("1.a36e2eb1c432dp-14");
        expect(format("{:a}", 0.001)).toEqual("1.0624dd2f1a9fcp-10");
        expect(format("{:a}", 0.01)).toEqual("1.47ae147ae147bp-7");
        expect(format("{:a}", 0.1)).toEqual("1.999999999999ap-4");
        expect(format("{:a}", 1)).toEqual("1p+0");
        expect(format("{:a}", 10)).toEqual("1.4p+3");
        expect(format("{:a}", 100)).toEqual("1.9p+6");
        expect(format("{:a}", 1000)).toEqual("1.f4p+9");
    });

    it("type specifier %", () => {
        expect(format("{:.0%}", 0)).toEqual("0%");
        expect(format("{:.1%}", 0)).toEqual("0.0%");
        expect(format("{:.2%}", 0)).toEqual("0.00%");

        expect(format("{:.0%}", 1)).toEqual("100%");
        expect(format("{:.1%}", 1)).toEqual("100.0%");
        expect(format("{:.2%}", 1)).toEqual("100.00%");

        expect(format("{:#.0%}", 0)).toEqual("0.%");
        expect(format("{:#.0%}", 1)).toEqual("100.%");

        expect(format("{:#.3%}", 77.7777)).toEqual("7777.770%");
        expect(format("{:#.1%}", 77.7777)).toEqual("7777.8%");
    });

    it("float to integer throws", () => {
        expect(() => format("{:d}", 777.777)).toThrow();
        expect(() => format("{:d}", -777.777)).toThrow();

        expect(() => format("{:#x}", 222.222)).toThrow();
        expect(() => format("{:#X}", -222.222)).toThrow();

        expect(() => format("{:o}", 777.777)).toThrow();
        expect(() => format("{:o}", -777.777)).toThrow();

        expect(() => format("{:b}", 222.222)).toThrow();
        expect(() => format("{:#b}", -222.222)).toThrow();

        expect(() => format("{:x}", 0.123)).toThrow();
        expect(() => format("{:x}", 1.23)).toThrow();
    });

    it("all together", () => {
        expect(format("{:*<+10.4f}", Math.PI, 314)).toEqual("+3.1416***");
        expect(format("{:+#09x}", 314)).toEqual("+0x00013a");
    });

    it("invalid argument object", () => {
        expect(() => format("{}", {})).toThrow();
    });

    it("supported arguments", () => {
        // boolean, string, char, number, bigint
        expect(format("{:s} {:s} {:c} {:d} {:d}", true, "string", "c", 10, BigInt("999"))).
            toEqual("true string c 10 999");
    });

    it("bigint", () => {
        // bigint has no separate negative/positive zero, just zero
        expect(format("{}", BigInt("-0"))).toEqual("0");
        expect(format("{}", BigInt("+0"))).toEqual("0");

        expect(format("{:d}", BigInt("123456789012345678901234567890"))).toEqual("123456789012345678901234567890");
        expect(format("{:d}", BigInt("-123456789012345678901234567890"))).toEqual("-123456789012345678901234567890");

        expect(format("{}", BigInt("90000000000000000000000"))).toEqual("90000000000000000000000");
        expect(format("{}", BigInt("0000000009"))).toEqual("9");

        expect(format("{:.02f}", BigInt(1234))).toEqual("1234.00");
        expect(format("{:.02f}", BigInt(9876))).toEqual("9876.00");

        expect(format("{:.02e}", BigInt(1234))).toEqual("1.23e+03");
        expect(format("{:.02e}", BigInt(9876))).toEqual("9.88e+03");

        expect(format("{:d}", BigInt("0x0A"))).toEqual("10");
        expect(format("{:x}", BigInt("0x0A"))).toEqual("a");
        expect(format("{}", BigInt("0b0011"))).toEqual("3");
    });

    it("number digitizer algorithm", () => {
        // Handle zeroes around decimal dot
        expect(format("{:.3f}", 230.023)).toEqual("230.023");
        expect(format("{:.5f}", 500.005)).toEqual("500.00500");
    });

    it("deprecated stuff", () => {
        function stdFormatSpec(spec: "cpp" | "python" | "js", fmt: string, ...args: unknown[]) {
            stdSpecificationHint(spec);
            return stdFormat(fmt, ...args);
        }

        function stdFormatLocale(locale: string, fmt: string, ...args: unknown[]) {
            stdLocaleHint(locale);
            return stdFormat(fmt, ...args);
        }

        // Test boolean strings.
        expect(stdFormatSpec("python", "{} {}", true, false)).toEqual("True False");
        expect(stdFormatSpec("cpp", "{} {}", true, false)).toEqual("true false");
        expect(stdFormatSpec("js", "{} {}", true, false)).toEqual("true false");
        expect(format("{} {}", true, false)).toEqual("true false");

        // Test octal in "cpp"
        expect(stdFormatSpec("cpp", "{:#o}", 834)).toEqual("01502");
        expect(stdFormatSpec("cpp", "{:#o}", -834)).toEqual("-01502");
        expect(stdFormatSpec("cpp", "{:#o}", 0)).toEqual("0");

        // Test octal in "python"
        expect(stdFormatSpec("python", "{:#o}", 834)).toEqual("0o1502");
        expect(stdFormatSpec("python", "{:#o}", -834)).toEqual("-0o1502");
        expect(stdFormatSpec("python", "{:#o}", 0)).toEqual("0o0");

        // Test octal in "js"
        expect(stdFormatSpec("js", "{:#o}", 834)).toEqual("0o1502");
        expect(stdFormatSpec("js", "{:#o}", -834)).toEqual("-0o1502");
        expect(stdFormatSpec("js", "{:#o}", 0)).toEqual("0o0");

        // Test octal new default/JS way. 
        expect(format("{:#o}", 834)).toEqual("0o1502");
        expect(format("{:#o}", -834)).toEqual("-0o1502");
        expect(format("{:#o}", 0)).toEqual("0o0");

        expect(stdFormatLocale("en-UK", "{:Ld}", 55555555)).toEqual("55,555,555");
        expect(stdFormatLocale("en-UK", "{:.2f}", 5555.5555)).toEqual("5555.56");
        expect(stdFormatLocale("en-UK", "{:.2Lf}", 5555.5555)).toEqual("5,555.56");
    });
});
