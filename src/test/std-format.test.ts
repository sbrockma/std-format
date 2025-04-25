import { format, setLocale, stdFormat, stdLocaleHint, stdSpecificationHint } from "../index";
import { int, float } from "../int-float";
import DefaultExport from "../index";

describe("Testing std-format", () => {
    function formatLocale(locale: string, fmt: string, ...args: unknown[]) {
        setLocale(locale);
        return format(fmt, ...args);
    }

    function toNonBreakingSpaces(s: string) {
        return s.replace(/ /g, "\u00a0");
    }

    it("test default export", () => {
        expect(DefaultExport.format("The answer is {}.", int(42))).toEqual("The answer is 42.");
    });

    it("using curly braces", () => {
        expect(format("Test {{ }} {{}}", 1, 2)).toEqual("Test { } {}");
        expect(format("frac{{{}}}{{{}}}", int(1), int(2))).toEqual("frac{1}{2}");
        expect(format("frac{{{0}}}{{{1}}}", int(1), int(2))).toEqual("frac{1}{2}");

        expect(() => format("Hello { World!")).toThrow(); // Single '{'
        expect(() => format("Hello } World!")).toThrow(); // Single '}'

        expect(() => format("{:{^5}", 0)).toThrow(); // Invalid fill character '{'
        expect(() => format("{:}^5}", 0)).toThrow(); // Invalid fill character '}'
    });

    it("invalid replacement field", () => {
        expect(() => format("{***}", 1, 2)).toThrow();
        expect(() => format("{:q}", 1, 2)).toThrow();
        expect(() => format("{x:q}", 1, 2)).toThrow();
        expect(() => format("{:{}D}", 1, 2)).toThrow();
        expect(() => format("{:{}{}}", 0, 5, 2)).toThrow(); // Missing '.' before precision
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

        // Field number not a number
        expect(() => format("{a}")).toThrow();
        expect(() => format("{b:}")).toThrow();
        expect(() => format("{c:d}")).toThrow();
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
    });

    it("type specifier n", () => {
        expect(formatLocale("en-UK", "{:n}", 1234567890)).toEqual("1,234,567,890");

        expect(formatLocale("hi-IN", "{:n}", 1234567891)).toEqual("1,23,45,67,891");
        expect(formatLocale("hi-IN", "{:n}", 123456789)).toEqual("12,34,56,789");
        expect(formatLocale("hi-IN", "{:n}", 5)).toEqual("5");
    });

    it("locale specifier L", () => {
        expect(formatLocale("en-UK", "{:Ld}", 9876543210)).toEqual("9,876,543,210");
        expect(formatLocale("en-UK", "{:.2Lf}", 654321.0987)).toEqual("654,321.10");

        expect(formatLocale("hi-IN", "{:.2Lf}", 345678.9012)).toEqual("3,45,678.90");
        expect(formatLocale("hi-IN", "{:.2Lf}", 67890.1234)).toEqual("67,890.12");
        expect(formatLocale("hi-IN", "{:.2Lf}", 5678.9012)).toEqual("5,678.90");
        expect(formatLocale("hi-IN", "{:.2Lf}", 876.5432)).toEqual("876.54");
        expect(formatLocale("hi-IN", "{:.2Lf}", 45.6789)).toEqual("45.68");

        expect(formatLocale("ge-GE", "{:.2Lf}", 9876543.210)).toEqual(toNonBreakingSpaces("9 876 543,21"));
    });

    it("sign", () => {
        expect(format("{0:d},{0:+d},{0:-d},{0: d}", 1)).toEqual("1,+1,1, 1");
        expect(format("{0:d},{0:+d},{0:-d},{0: d}", -1)).toEqual("-1,-1,-1,-1");
        expect(format("{0:},{0:+},{0:-},{0: }", int(1))).toEqual("1,+1,1, 1");
        expect(format("{0:},{0:+},{0:-},{0: }", int(-1))).toEqual("-1,-1,-1,-1");
        expect(format("{0:},{0:+},{0:-},{0: }", Infinity)).toEqual("inf,+inf,inf, inf");
        expect(format("{0:},{0:+},{0:-},{0: }", NaN)).toEqual("nan,+nan,nan, nan");

        expect(format("{:+}, {: }", 314, 314)).toEqual("+314.0,  314.0");
        expect(format("{:+}, {: }", int(314), int(314))).toEqual("+314,  314");

        expect(format("{:+f}; {:+f}", 3.14, -3.14)).toEqual("+3.140000; -3.140000");
        expect(format("{: f}; {: f}", 3.14, -3.14)).toEqual(" 3.140000; -3.140000");
        expect(format("{:-f}; {:-f}", 3.14, -3.14)).toEqual("3.140000; -3.140000");
    });

    it("fill and align", () => {
        // Default fill and default align
        expect(format("{:6}", int(42))).toEqual("    42");
        expect(format("{:6}", 42)).toEqual("  42.0");
        expect(format("{:6}", "x")).toEqual("x     ");
        expect(format("{:*<6}", "x")).toEqual("x*****");
        expect(format("{:*>6}", "x")).toEqual("*****x");
        expect(format("{:*^6}", "x")).toEqual("**x***");
        expect(format("{:6d}", 120)).toEqual("   120");

        expect(format("{:?<8d}", 10)).toEqual("10??????");
        expect(format("{:?^8d}", 10)).toEqual("???10???");
        expect(format("{:?>8d}", 10)).toEqual("??????10");
        expect(format("{:?=8d}", 10)).toEqual("??????10");

        expect(format("{:<9}", -42)).toEqual("-42.0    "); // Default fill char ' '
        expect(format("{:^9}", -42)).toEqual("  -42.0  ");
        expect(format("{:>9}", -42)).toEqual("    -42.0");
        expect(format("{:=9}", -42)).toEqual("-    42.0");

        expect(format("{:<09}", int(-42))).toEqual("-42000000"); // '0' is specified
        expect(format("{:^09}", int(-42))).toEqual("000-42000");
        expect(format("{:>09}", int(-42))).toEqual("000000-42");
        expect(format("{:=09}", int(-42))).toEqual("-00000042");

        expect(format("{:#<9d}", -42)).toEqual("-42######"); // Fill char is given
        expect(format("{:#^9d}", -42)).toEqual("###-42###");
        expect(format("{:#>9d}", -42)).toEqual("######-42");
        expect(format("{:#=9d}", -42)).toEqual("-######42");

        expect(format("{:7}|{:7}|{:7}|{:7}", int(1), -.2, "str", "c")).toEqual("      1|   -0.2|str    |c      ");
        expect(format("{:*<7}|{:*<7}|{:*>7}|{:*>7}", int(1), -.2, "str", "c")).toEqual("1******|-0.2***|****str|******c");
        expect(format("{:07}|{:07}|{:^7}|{:^7}", int(1), -.2, "str", "c")).toEqual("0000001|-0000.2|  str  |   c   ");

        expect(format("{:<30}", "left aligned")).toEqual("left aligned                  ");
        expect(format("{:>30}", "right aligned")).toEqual("                 right aligned");
        expect(format("{:^30}", "centered")).toEqual("           centered           ");
        expect(format("{:*^30}", "centered")).toEqual("***********centered***********");

        // Fill and align with fill character and/or '0'-padding.
        expect(format("{:<08d}", 10)).toEqual("10000000");
        expect(format("{:*<08d}", 10)).toEqual("10******");
        expect(format("{:*<8d}", 10)).toEqual("10******");
        expect(format("{:^08d}", 10)).toEqual("00010000");
        expect(format("{:*^08d}", 10)).toEqual("***10***");
        expect(format("{:*^8d}", 10)).toEqual("***10***");
        expect(format("{:>08d}", 10)).toEqual("00000010");
        expect(format("{:*>08d}", 10)).toEqual("******10");
        expect(format("{:*>8d}", 10)).toEqual("******10");

        // Fill char is align char '<', '^', '>' or '='
        expect(format("{:^<8d}", 10)).toEqual("10^^^^^^");
        expect(format("{:>^8d}", 10)).toEqual(">>>10>>>");
        expect(format("{:=>8d}", 10)).toEqual("======10");
        expect(format("{:<=8d}", 10)).toEqual("<<<<<<10");
    });

    it("align specifier =", () => {
        expect(format("{:*=8d}", 10)).toEqual("******10");
        expect(format("{:*=8d}", -10)).toEqual("-*****10");
        expect(format("{:0=#10x}", 10)).toEqual("0x0000000a");
        expect(format("{:0=#10x}", -10)).toEqual("-0x000000a");

        // Both fill and 0 with signs '+' and ' '
        expect(format("{:*=+#08d}", 10)).toEqual("+*****10");
        expect(format("{:*=+#08d}", -10)).toEqual("-*****10");
        expect(format("{:*= #08d}", 10)).toEqual(" *****10");
        expect(format("{:*= #08d}", -10)).toEqual("-*****10");
    });

    it("padding specifier 0", () => {
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

        expect(() => format("{:00}", 9)).toThrow();       // Width = 0
        expect(() => format("{:01}", 9)).not.toThrow();   // Width = 1
        expect(() => format("{:001}", 9)).not.toThrow();  // Width = 01
        expect(() => format("{:01.0}", 9)).not.toThrow(); // Precision can be 0.

        // Width and precision with strings.
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

        // Width alone
        expect(format("{:9}", "Apple")).toEqual("Apple    ");
        expect(format("{:9.3}", "Apple")).toEqual("App      ");
        expect(format("{:9}", 42)).toEqual("     42.0");
        expect(format("{:9}", int(42))).toEqual("       42");
        expect(format("{:9}", true)).toEqual("true     ");
    });

    it("wider unicode symbols", () => {
        // Fill symbol.
        expect(format("{:𝞅<8d}", 22)).toEqual("22𝞅𝞅𝞅𝞅𝞅𝞅");
        expect(format("{:𝄞^8d}", 22)).toEqual("𝄞𝄞𝄞22𝄞𝄞𝄞");
        expect(format("{:🧠>8d}", 22)).toEqual("🧠🧠🧠🧠🧠🧠22");
        expect(format("{:\uD802\uDC00^9d}", 555)).toEqual(
            "\uD802\uDC00\uD802\uDC00\uD802\uDC00555\uD802\uDC00\uD802\uDC00\uD802\uDC00");

        // String with precision.
        expect(format("{:.5s}", "🐉🐉🐉🐉🐉🐉🐉🐉🐉🐉")).toEqual("🐉🐉🐉🐉🐉");
        expect(format("{:𝒜^5.3s}", "😀")).toEqual("𝒜𝒜😀𝒜𝒜");
        expect(format("{:𝒜^5.3s}", "😀😀😀😀😀")).toEqual("𝒜😀😀😀𝒜");
    });

    it("negative and positive zero", () => {
        expect(format("{}", -0)).toEqual("-0.0");
        expect(format("{}", +0)).toEqual("0.0");

        // float
        expect(format("{}", float(-0))).toEqual("-0.0");
        expect(format("{}", float(+0))).toEqual("0.0");

        expect(format("{}", float("-0"))).toEqual("-0.0");
        expect(format("{}", float("+0"))).toEqual("0.0");

        // int has no -0.
        expect(format("{}", int(-0))).toEqual("0");
        expect(format("{}", int(+0))).toEqual("0");

        expect(format("{}", int("-0"))).toEqual("0");
        expect(format("{}", int("+0"))).toEqual("0");

        // Integer has no -0
        expect(format("{:d}", -0)).toEqual("0");
        expect(format("{:d}", +0)).toEqual("0");
        expect(format("{:X}", -0)).toEqual("0");
        expect(format("{:X}", +0)).toEqual("0");

        // Float has -0
        expect(format("{:.2e}", -0)).toEqual("-0.00e+00");
        expect(format("{:.2e}", +0)).toEqual("0.00e+00");
        expect(format("{:+.2e}", -0)).toEqual("-0.00e+00");
        expect(format("{:+.2e}", +0)).toEqual("+0.00e+00");

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
    });

    it("nan", () => {
        expect(() => format("{:s}", NaN)).toThrow();
        expect(() => format("{:?}", NaN)).toThrow();
        expect(() => format("{:c}", NaN)).toThrow();
        expect(format("{:d}", NaN)).toEqual("nan");
        expect(format("{:n}", NaN)).toEqual("nan");
        expect(format("{:x}", NaN)).toEqual("nan");
        expect(format("{:X}", NaN)).toEqual("NAN");
        expect(format("{:b}", NaN)).toEqual("nan");
        expect(format("{:B}", NaN)).toEqual("NAN");
        expect(format("{:o}", NaN)).toEqual("nan");
        expect(format("{:e}", NaN)).toEqual("nan");
        expect(format("{:E}", NaN)).toEqual("NAN");
        expect(format("{:f}", NaN)).toEqual("nan");
        expect(format("{:F}", NaN)).toEqual("NAN");
        expect(format("{:g}", NaN)).toEqual("nan");
        expect(format("{:G}", NaN)).toEqual("NAN");
        expect(format("{:a}", NaN)).toEqual("nan");
        expect(format("{:A}", NaN)).toEqual("NAN");

        expect(format("{:08}", NaN)).toEqual("00000nan");
    });

    it("inf", () => {
        expect(() => format("{:s}", +Infinity)).toThrow();
        expect(() => format("{:?}", -Infinity)).toThrow();
        expect(() => format("{:c}", +Infinity)).toThrow();
        expect(format("{:d}", -Infinity)).toEqual("-inf");
        expect(format("{:n}", +Infinity)).toEqual("inf");
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

    it("type specifier <default number>", () => {
        expect(format("{}", 482.1)).toEqual("482.1");
        expect(format("{}", 482.2)).toEqual("482.2");

        expect(format("{}", 482.2e+1)).toEqual("4822.0");
        expect(format("{}", 482.2e+2)).toEqual("48220.0");
        expect(format("{}", 482.2e-1)).toEqual("48.22");
        expect(format("{}", 482.2e-2)).toEqual("4.822");

        expect(format("{}", 0.456)).toEqual("0.456");
        expect(format("{}", 56.454577)).toEqual("56.454577");
        expect(format("{}", 567.5675583333766658)).toEqual("567.5675583333766");
        expect(format("{}", 756437.6586784566668)).toEqual("756437.6586784567");
        expect(format("{}", 56375685864.67575445)).toEqual("56375685864.67575");

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

    it("type specifier <default int>", () => {
        expect(format("{}", int(100))).toEqual("100");
        expect(format("{}", int(10))).toEqual("10");
        expect(format("{}", int(1))).toEqual("1");
        expect(format("{}", int(0))).toEqual("0");
        expect(format("{}", int(-1))).toEqual("-1");
        expect(format("{}", int(-10))).toEqual("-10");
        expect(format("{}", int(-100))).toEqual("-100");

        expect(format("{:}", int(999))).toEqual("999");
    });

    it("type specifier <default float>", () => {
        // TODO
    });

    it("type specifier s", () => {
        expect(format("{:s}", "Hello")).toEqual("Hello");
        expect(format("{:s}", "42")).toEqual("42");
        expect(() => format("{:s}", 42)).toThrow();
        expect(format("{:s}", false)).toEqual("false");

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

        // Precision for char throws
        expect(() => format("{:x=5.2c}", 65)).toThrow();

        // Get char code from single char (in c++ you could use char 'A').
        expect(format("{:c}", "A")).toEqual("A");
        expect(() => format("{:c}", "")).toThrow();
        expect(() => format("{:c}", "Hello")).toThrow();

        // Char code must be int in range 0..0xFFFF.
        expect(() => format("{:c}", -1)).toThrow();
        expect(() => format("{:c}", 0x10FFFF + 1)).toThrow();
        expect(() => format("{:c}", int("888888888888888888888888"))).toThrow();
        expect(() => format("{:c}", float(65))).toThrow();
        expect(() => format("{:c}", 111.1)).toThrow();
        expect(() => format("{:c}", NaN)).toThrow();
        expect(() => format("{:c}", Infinity)).toThrow();

        // Ω
        expect(format("{:c}", 0x03A9)).toEqual("Ω");
        expect(format("{:c}", 0x03A9)).toEqual("\u03A9");
        expect(format("{:c}", "\u03A9")).toEqual("Ω");
        expect(format("{:c}", "\u03A9")).toEqual("\u03A9");
        // 𐍈
        expect(format("{:c}", 0x10348)).toEqual("𐍈");
        expect(format("{:c}", 0x10348)).toEqual("\uD800\uDF48");
        expect(format("{:c}", "\uD800\uDF48")).toEqual("𐍈");
        expect(format("{:c}", "\uD800\uDF48")).toEqual("\uD800\uDF48");
    });

    it("type specifier ?", () => {
        // Not yet implemented
        expect(() => format("{:?}", "\t")).toThrow();
    });

    it("type specifier d", () => {
        expect(format("{:d}", -1)).toEqual("-1");
        expect(format("{:d}", -0)).toEqual("0");
        expect(format("{:d}", 0)).toEqual("0");
        expect(format("{:d}", 1)).toEqual("1");
        expect(format("{:d}", 321)).toEqual("321");
        expect(format("{:d}", -321)).toEqual("-321");
        expect(() => format("{:d}", 0.1)).toThrow();
        expect(() => format("{:d}", -5.9)).toThrow();

        // Get char code from single char (in c++ you could use char 'c').
        expect(format("{:d}", "c")).toEqual("99");
        expect(format("{:+06d}", String.fromCharCode(99))).toEqual("+00099");
        expect(format("{:+06d}", 99)).toEqual("+00099");

        // But other strings throw.
        expect(() => format("{:d}", "")).toThrow();
        expect(() => format("{:d}", "Hello")).toThrow();

        // boolean to number
        expect(format("{:d} {:d}", true, false)).toEqual("1 0");
        expect(format("{:g} {:g}", true, false)).toEqual("1 0");

        // Precision for integer not allowed.
        expect(() => format("{:.4d}", 32)).toThrow();
    });

    it("type specifier x and X", () => {
        expect(format("{:#x}", -1)).toEqual("-0x1");
        expect(format("{:#x}", -0)).toEqual("0x0");
        expect(format("{:#X}", 0)).toEqual("0X0");
        expect(format("{:#X}", 1)).toEqual("0X1");

        expect(format("{:#06x}", 0xa)).toEqual("0x000a");
        expect(format("{:#06x}", -0xa)).toEqual("-0x00a");
        expect(format("{:x}", 314)).toEqual("13a");
        expect(format("{:x}", "c")).toEqual("63");
        expect(format("{:#x}", 314)).toEqual("0x13a");
        expect(format("{:#X}", 314)).toEqual("0X13A");

        // Precision for integer not allowed.
        expect(() => format("{:.4x}", 32)).toThrow();
        expect(() => format("{:.4X}", 32)).toThrow();
    });

    it("type specifier b and B", () => {
        expect(format("{:#b}", -1)).toEqual("-0b1");
        expect(format("{:#b}", -0)).toEqual("0b0");
        expect(format("{:#B}", 0)).toEqual("0B0");
        expect(format("{:#B}", 1)).toEqual("0B1");

        expect(format("{:b}", 314)).toEqual("100111010");
        expect(format("{:#b}", 314)).toEqual("0b100111010");

        // Precision for integer not allowed.
        expect(() => format("{:.4b}", 32)).toThrow();
        expect(() => format("{:.4B}", 32)).toThrow();
    });

    it("type specifier o", () => {
        expect(format("{:#o}", -1)).toEqual("-0o1");
        expect(format("{:#o}", -0)).toEqual("0o0");
        expect(format("{:#o}", 0)).toEqual("0o0");
        expect(format("{:#o}", 1)).toEqual("0o1");

        expect(format("{:o}", 834)).toEqual("1502");
        expect(format("{:o}", -834)).toEqual("-1502");

        expect(format("{:#o}", 834)).toEqual("0o1502");
        expect(format("{:#o}", -834)).toEqual("-0o1502");
        expect(format("{:#o}", 0)).toEqual("0o0");

        // Precision for integer not allowed.
        expect(() => format("{:.4o}", 32)).toThrow();
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
        expect(() => format("{:d}", float(777))).toThrow();
        expect(() => format("{:d}", float(-777))).toThrow();

        expect(() => format("{:#x}", 222.222)).toThrow();
        expect(() => format("{:#X}", -222.222)).toThrow();

        expect(() => format("{:o}", 777.777)).toThrow();
        expect(() => format("{:o}", -777.777)).toThrow();

        expect(() => format("{:b}", 222.222)).toThrow();
        expect(() => format("{:#b}", -222.222)).toThrow();

        expect(() => format("{:x}", 0.123)).toThrow();
        expect(() => format("{:x}", 1.23)).toThrow();
    });

    it("integer to float throws", () => {
        // Allowed, treat number as float by default
        expect(() => format("{:g}", 777)).not.toThrow();
        expect(() => format("{:g}", -777)).not.toThrow();

        // Integer to float throws.
        expect(() => format("{:g}", int(777))).toThrow();
        expect(() => format("{:g}", int(-777))).toThrow();
    });

    it("all together", () => {
        expect(format("{:*<+10.4f}", Math.PI)).toEqual("+3.1416***");
        expect(format("{:+#09x}", 314)).toEqual("+0x00013a");
    });

    it("supported arguments", () => {
        // boolean, string, "char", number, int, float
        expect(format("{:s} {:s} {:c} {:d} {:d} {:g} {:g}", true, "string", "c", 10, int(999), -5, float(-5))).
            toEqual("true string c 10 999 -5 -5");

        // array, set
        expect(format("{:d}", [65, 66])).toEqual("[65, 66]");
        expect(format("{:d}", new Set([65, 66, 65]))).toEqual("[65, 66]");

        // record, map
        expect(format("{:d}", { "A": 65, "B": 66 })).toEqual("[[A, 65], [B, 66]]");
        expect(format("{:d}", new Map([["A", 65], ["B", 66]]))).toEqual("[[A, 65], [B, 66]]");
    });

    it("int()", () => {
        // int(0)
        expect(format("{}", int(""))).toEqual("0");
        expect(format("{}", int())).toEqual("0");
        expect(format("{}", int(undefined))).toEqual("0");
        expect(format("{}", int(null))).toEqual("0");
        expect(format("{}", int(0))).toEqual("0");

        // Not int
        expect(() => format("{}", int(1.1))).toThrow();
        expect(() => format("{}", int(NaN))).toThrow();
        expect(() => format("{}", int(-Infinity))).toThrow();
        expect(() => format("{}", int(Infinity))).toThrow();

        expect(format("{:c}", int(65))).toEqual("A");

        expect(format("{:d}", int("123456789012345678901234567890"))).toEqual("123456789012345678901234567890");
        expect(format("{:d}", int("-123456789012345678901234567890"))).toEqual("-123456789012345678901234567890");

        // Can also pass BigInt
        expect(format("{:d}", BigInt("123456789012345678901234567890"))).toEqual("123456789012345678901234567890");
        expect(format("{:d}", BigInt("-123456789012345678901234567890"))).toEqual("-123456789012345678901234567890");

        expect(format("{}", int("90000000000000000000000"))).toEqual("90000000000000000000000");
        expect(format("{}", int("0000000009"))).toEqual("9");

        expect(format("{:d}", int("0x0B"))).toEqual("11");
        expect(format("{:x}", int("0x0A"))).toEqual("a");
        expect(format("{}", int("0b0011"))).toEqual("3");

        // Int not allowed for float types.
        expect(() => format("{:.2e}", int(1234))).toThrow();
        expect(() => format("{:.2E}", int(1234))).toThrow();
        expect(() => format("{:.2f}", int(1234))).toThrow();
        expect(() => format("{:.2F}", int(1234))).toThrow();
        expect(() => format("{:.2%}", int(1234))).toThrow();
        expect(() => format("{:.2g}", int(1234))).toThrow();
        expect(() => format("{:.2G}", int(1234))).toThrow();
        expect(() => format("{:.2a}", int(1234))).toThrow();
        expect(() => format("{:.2A}", int(1234))).toThrow();

        // No int for string types
        expect(() => format("{:s}", int(8))).toThrow();
        expect(() => format("{:?}", int(8))).toThrow();
    });

    it("float()", () => {
        // float(0)
        expect(format("{}", float(""))).toEqual("0.0");
        expect(format("{}", float())).toEqual("0.0");
        expect(format("{}", float(undefined))).toEqual("0.0");
        expect(format("{}", float(null))).toEqual("0.0");
        expect(format("{}", float(0))).toEqual("0.0");

        // More float
        expect(format("{}", float(1.1))).toEqual("1.1");
        expect(format("{}", float("-1.1"))).toEqual("-1.1");
        expect(format("{}", float(NaN))).toEqual("nan");
        expect(format("{}", float(-Infinity))).toEqual("-inf");
        expect(format("{}", float(Infinity))).toEqual("inf");

        // Float not allowed for integer types.
        expect(() => format("{:c}", float(89))).toThrow();
        expect(() => format("{:d}", float(12.34))).toThrow();
        expect(() => format("{:n}", float(12.34))).toThrow();
        expect(() => format("{:b}", float(12.34))).toThrow();
        expect(() => format("{:B}", float(12.34))).toThrow();
        expect(() => format("{:o}", float(12.34))).toThrow();
        expect(() => format("{:x}", float(12.34))).toThrow();
        expect(() => format("{:X}", float(12.34))).toThrow();

        // No float for string types
        expect(() => format("{:s}", float(9.1))).toThrow();
        expect(() => format("{:?}", float(9.1))).toThrow();
    });

    it("number digitizer algorithm", () => {
        // This algorithm no longer used for base 10.
        expect(format("{:.5f}", 5.5)).toEqual("5.50000");
        expect(format("{:.5f}", 50.05)).toEqual("50.05000");
        expect(format("{:.5f}", 500.005)).toEqual("500.00500");
        expect(format("{:.5f}", 5000.0005)).toEqual("5000.00050");
    });

    it("array formatting", () => {
        expect(format("{}", [])).toEqual("[]");
        expect(format("{}", [0])).toEqual("[0.0]");
        expect(format("{:d}", [0])).toEqual("[0]");
        expect(format("{}", [0, 1])).toEqual("[0.0, 1.0]");
        expect(format("{:d}", [0, 1])).toEqual("[0, 1]");
        expect(format("{:d}", [0, [1, 2]])).toEqual("[0, [1, 2]]");
        expect(format("{}", ["Hello", "world!"])).toEqual("[Hello, world!]");
        expect(format("{:!^3s}", ["A", "B", "C"])).toEqual("[!A!, !B!, !C!]");
        expect(format("{:}", [1])).toEqual("[1.0]");
        expect(format("{::}", [1])).toEqual("[1.0]");
        expect(format("{::b}", [3, -2])).toEqual("[11, -10]");
        expect(format("{:d:b}", [3, -2])).toEqual("[11, -10]");
        expect(format("{:n:b}", [3, -2])).toEqual("11, -10");
        expect(format("{:b:b}", [3, -2])).toEqual("{11, -10}");
        expect(format("{}", [[], []])).toEqual("[[], []]");

        expect(format("|{:20d:d}|", [1, 2, 3])).toEqual("|[1, 2, 3]           |"); // Default alignment '<'
        expect(format("|{:*<20d:d}|", [1, 2, 3])).toEqual("|[1, 2, 3]***********|");
        expect(format("|{:*^20d:d}|", [1, 2, 3])).toEqual("|*****[1, 2, 3]******|");
        expect(format("|{:*>20d:.1f}|", [1, 2, 3])).toEqual("|*****[1.0, 2.0, 3.0]|");
        expect(() => format("{:*=20d:d}", [1, 2, 3])).toThrow(); // Invalid alignment '='

        expect(format("{:e<40b:x^10b:a>5:x}", [[[11], [7, 4]], [[13]]])).toEqual("{{aa[b], [7, 4]}, x{aa[d]}xx}eeeeeeeeeee");
        expect(format("{:#^7b:d}", [[1], [7], [3]])).toEqual("[##{1}##, ##{7}##, ##{3}##]");
        expect(format("{:d:-^10b:d}", [[0], [1, 2]])).toEqual("[---{0}----, --{1, 2}--]");
        expect(format("{:d:-^10b:d}", [0, [1, 2]])).toEqual("[----0-----, --{1, 2}--]");

        expect(format("{:d}", [12, 10, 15, 14])).toEqual("[12, 10, 15, 14]");
        expect(format("{:X}", [12, 10, 15, 14])).toEqual("[C, A, F, E]");
        expect(format("{:n:_^4d}", [12, 10, 15, 14])).toEqual("_12_, _10_, _15_, _14_");
        expect(format("{::s}", ["S", "T", "A", "R"])).toEqual("[S, T, A, R]");
        expect(format("{:s:s}", ["S", "T", "A", "R"])).toEqual("STAR");

        // Format Set like an array
        expect(format("({:n:d})", new Set([0, 1, 2, 2, 3]))).toEqual("(0, 1, 2, 3)");
    });

    it("record and map formatting", () => {
        expect(format("{:d}", { A: 65, B: 66 })).toEqual("[[A, 65], [B, 66]]");
        expect(format("{:d}", new Map([["A", 65], ["B", 66]]))).toEqual("[[A, 65], [B, 66]]");

        expect(format("{:b:d}", { A: 65, B: 66 })).toEqual("{{A, 65}, {B, 66}}");
        expect(format("{:b:d}", new Map([["A", 65], ["B", 66]]))).toEqual("{{A, 65}, {B, 66}}");

        expect(format("{:n:d}", { A: 65, B: 66 })).toEqual("A: 65, B: 66");
        expect(format("{:n:d}", new Map([["A", 65], ["B", 66]]))).toEqual("A: 65, B: 66");

        expect(format("{:m:d}", { A: 65, B: 66 })).toEqual("[A: 65, B: 66]");
        expect(format("{:m:d}", new Map([["A", 65], ["B", 66]]))).toEqual("[A: 65, B: 66]");

        expect(format("{:s:d}", { A: 65, B: 66 })).toEqual("A65B66");
        expect(format("{:s:d}", new Map([["A", 65], ["B", 66]]))).toEqual("A65B66");

        expect(format("{:!^30:*^6:d}", { A: 65, B: [66] })).toEqual("!![[A, **65**], [B, *[66]*]]!!");
        expect(format("{:!^30:*^11:d}", [65, { B: 66 }])).toEqual("!![****65*****, *[[B, 66]]*]!!");

        expect(format("{:*<24:d}", { A: 65, B: 66 })).toEqual("[[A, 65], [B, 66]]******");
        expect(format("{:*^24:d}", { A: 65, B: 66 })).toEqual("***[[A, 65], [B, 66]]***");
        expect(format("{:*>24:d}", { A: 65, B: 66 })).toEqual("******[[A, 65], [B, 66]]");

        expect(format("{:m:}", { x: 1, y: -1 })).toEqual("[x: 1.0, y: -1.0]");

        class TestClass { a = 0; b = 1; }
        expect(format("{:d}", new TestClass())).toEqual("[[a, 0], [b, 1]]");

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
