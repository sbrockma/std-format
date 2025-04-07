import { stdFormat, stdSpecificationHint } from "std-format";

describe("std format", () => {
    it("using curly braces", () => {

        expect(stdFormat("Test {{ }} {{}}", 1, 2)).toEqual("Test { } {}");
        expect(stdFormat("frac{{{0}}}{{{1}}}", 1, 2)).toEqual("frac{1}{2}");

        expect(() => stdFormat("Hello {")).toThrow(); // Encounteger single '{'
        expect(() => stdFormat("} Worls")).toThrow(); // Encounteger single '}'

        expect(() => stdFormat(":{^5")).toThrow(); // Invalid fill character '{'
        expect(() => stdFormat(":}^5")).toThrow(); // Invalid fill character '}'
    });

    it("field numbering", () => {
        expect(stdFormat("{} World!", "Hello")).toEqual("Hello World!");
        expect(stdFormat("{:} World!", "Hello")).toEqual("Hello World!");
        expect(stdFormat("{0:} World!", "Hello")).toEqual("Hello World!");

        expect(stdFormat("{0}, {1}, {2}", "a", "b", "c")).toEqual("a, b, c");
        expect(stdFormat("{}, {}, {}", "a", "b", "c")).toEqual("a, b, c");
        expect(stdFormat("{2}, {1}, {0}", "a", "b", "c")).toEqual("c, b, a");
        expect(stdFormat("{0}{1}{0}", "abra", "cad")).toEqual("abracadabra");

        // Nested fields
        expect(stdFormat("{:!^{}.{}f}", 123.45, 8, 1)).toEqual("!123.5!!");
        expect(stdFormat("{2:!^{1}.{0}f}", 1, 8, 123.45)).toEqual("!123.5!!");

        // Cannot switch between manual and automatic field numbering
        expect(() => stdFormat("{}{1}", 0, 1)).toThrow();
        expect(() => stdFormat("{0}{}", 0, 1)).toThrow();
        expect(() => stdFormat("{0:!^{}.{}f}", 123.45, 8, 1)).toThrow();
    });

    it("grouping specifier ,", () => {
        // Not yet implemented.
        expect(() => stdFormat("{:,d}", 8)).toThrow();
    });

    it("grouping specifier _", () => {
        // Not yet implemented.
        expect(() => stdFormat("{:_d}", 8)).toThrow();
    });

    it("type specifier n", () => {
        // Not yet implemented.
        expect(() => stdFormat("{:n}", 8)).toThrow();
    });

    it("locale specifier L", () => {
        // Not yet implemented.
        expect(() => stdFormat("{:Ld}", 8)).toThrow();
    });

    it("sign", () => {
        expect(stdFormat("{0:},{0:+},{0:-},{0: }", 1)).toEqual("1,+1,1, 1");
        expect(stdFormat("{0:},{0:+},{0:-},{0: }", -1)).toEqual("-1,-1,-1,-1");
        expect(stdFormat("{0:},{0:+},{0:-},{0: }", Infinity)).toEqual("inf,+inf,inf, inf");
        expect(stdFormat("{0:},{0:+},{0:-},{0: }", NaN)).toEqual("nan,+nan,nan, nan");

        expect(stdFormat("{:+}, {: }", 314, 314)).toEqual("+314,  314");

        expect(stdFormat('{:+f}; {:+f}', 3.14, -3.14)).toEqual('+3.140000; -3.140000');
        expect(stdFormat('{: f}; {: f}', 3.14, -3.14)).toEqual(' 3.140000; -3.140000');
        expect(stdFormat('{:-f}; {:-f}', 3.14, -3.14)).toEqual('3.140000; -3.140000');
    });

    it("fill and align", () => {
        expect(stdFormat("{:6}", 42)).toEqual("    42");
        expect(stdFormat("{:6}", "x")).toEqual("x     ");
        expect(stdFormat("{:*<6}", "x")).toEqual("x*****");
        expect(stdFormat("{:*>6}", "x")).toEqual("*****x");
        expect(stdFormat("{:*^6}", "x")).toEqual("**x***");
        expect(stdFormat("{:6d}", 120)).toEqual("   120");

        expect(stdFormat("{:<06}", -42)).toEqual("-42   ");  // 0 is ignored because of "<"

        expect(stdFormat("{:7}|{:7}|{:7}|{:7}", 1, -.2, "str", "c")).toEqual("      1|   -0.2|str    |c      ");
        expect(stdFormat("{:*<7}|{:*<7}|{:*>7}|{:*>7}", 1, -.2, "str", "c")).toEqual("1******|-0.2***|****str|******c");
        expect(stdFormat("{:07}|{:07}|{:^7}|{:^7}", 1, -.2, "str", "c")).toEqual("0000001|-0000.2|  str  |   c   ");

        expect(stdFormat("{:<30}", "left aligned")).toEqual("left aligned                  ");
        expect(stdFormat("{:>30}", "right aligned")).toEqual("                 right aligned");
        expect(stdFormat("{:^30}", "centered")).toEqual("           centered           ");
        expect(stdFormat("{:*^30}", "centered")).toEqual("***********centered***********");
    });

    it("width and precision", () => {
        let b = 3.14;
        expect(stdFormat("{:.2f}", 0)).toEqual("0.00");
        expect(stdFormat("{:10f}", b)).toEqual("  3.140000");
        expect(stdFormat("{:{}f}", b, 10)).toEqual("  3.140000");
        expect(stdFormat("{:.5f}", b)).toEqual("3.14000");
        expect(stdFormat("{:.{}f}", b, 5)).toEqual("3.14000");
        expect(stdFormat("{:10.5f}", b)).toEqual("   3.14000");
        expect(stdFormat("{:{}.{}f}", b, 10, 5)).toEqual("   3.14000");

        expect(() => stdFormat("{:{}f}", Math.PI, 10.1)).toThrow(); // Width is not integer
        expect(() => stdFormat("{:{}f}", Math.PI, -10)).toThrow();  // Width is negative

        expect(() => stdFormat("{:.{}f}", Math.PI, 5.2)).toThrow(); // Precision is not integer
        expect(() => stdFormat("{:.{}f}", Math.PI, -2)).toThrow();  // Precision is negative
    });

    it("fill specifier =", () => {
        // Default fill ' '
        expect(stdFormat("{:10}", "test")).toEqual("test      ");
        expect(stdFormat("{:<8d}", 10)).toEqual("10      ");

        expect(stdFormat("{:*=8d}", 10)).toEqual("******10");
        expect(stdFormat("{:*=8d}", -10)).toEqual("-*****10");
        expect(stdFormat("{:0=#10x}", 10)).toEqual("0x0000000a");
        expect(stdFormat("{:0=#10x}", -10)).toEqual("-0x000000a");

        // Both fill and 0 with signs '+' and ' '
        expect(stdFormat("{:*=+#08d}", 10)).toEqual("+*****10");
        expect(stdFormat("{:*=+#08d}", -10)).toEqual("-*****10");
        expect(stdFormat("{:*= #08d}", 10)).toEqual(" *****10");
        expect(stdFormat("{:*= #08d}", -10)).toEqual("-*****10");

        // '=' alignment not allowed on strings
        expect(() => stdFormat("{:*=9s}", "oho")).toThrow();
    });

    it("negative and positive zero", () => {
        // In js there is not separate integer and float.
        // Treat 0 = 0.0 and -0 = -0.0
        expect(stdFormat("{}", -0.0)).toEqual("-0");
        expect(stdFormat("{}", +0.0)).toEqual("0");

        // With integer specifier +0 and -0 => "0"
        expect(stdFormat("{:d}", -0.0)).toEqual("0");
        expect(stdFormat("{:d}", +0.0)).toEqual("0");
        expect(stdFormat("{:X}", -0.0)).toEqual("0");
        expect(stdFormat("{:X}", +0.0)).toEqual("0");

        expect(stdFormat("{:.2e}", -0.0)).toEqual("-0.00e+00");
        expect(stdFormat("{:.2e}", +0.0)).toEqual("0.00e+00");
        expect(stdFormat("{:+.2e}", -0.0)).toEqual("-0.00e+00");
        expect(stdFormat("{:+.2e}", +0.0)).toEqual("+0.00e+00");
    });

    it("nan", () => {
        expect(stdFormat("{:d}", NaN)).toEqual("nan");
        expect(stdFormat("{:x}", NaN)).toEqual("nan");
        expect(stdFormat("{:X}", NaN)).toEqual("NAN");
        expect(stdFormat("{:b}", NaN)).toEqual("nan");
        expect(stdFormat("{:B}", NaN)).toEqual("NAN");
        expect(stdFormat("{:o}", NaN)).toEqual("nan");
        expect(stdFormat("{:a}", NaN)).toEqual("nan");
        expect(stdFormat("{:A}", NaN)).toEqual("NAN");
        expect(stdFormat("{:e}", NaN)).toEqual("nan");
        expect(stdFormat("{:E}", NaN)).toEqual("NAN");
        expect(stdFormat("{:f}", NaN)).toEqual("nan");
        expect(stdFormat("{:F}", NaN)).toEqual("NAN");
        expect(stdFormat("{:g}", NaN)).toEqual("nan");
        expect(stdFormat("{:G}", NaN)).toEqual("NAN");

        expect(stdFormat("{:08}", NaN)).toEqual("00000nan");
    });

    it("inf", () => {
        expect(stdFormat("{:d}", +Infinity)).toEqual("inf");
        expect(stdFormat("{:d}", -Infinity)).toEqual("-inf");
        expect(stdFormat("{:x}", +Infinity)).toEqual("inf");
        expect(stdFormat("{:X}", -Infinity)).toEqual("-INF");
        expect(stdFormat("{:b}", +Infinity)).toEqual("inf");
        expect(stdFormat("{:B}", -Infinity)).toEqual("-INF");
        expect(stdFormat("{:o}", +Infinity)).toEqual("inf");
        expect(stdFormat("{:o}", -Infinity)).toEqual("-inf");
        expect(stdFormat("{:a}", +Infinity)).toEqual("inf");
        expect(stdFormat("{:A}", -Infinity)).toEqual("-INF");
        expect(stdFormat("{:e}", +Infinity)).toEqual("inf");
        expect(stdFormat("{:E}", -Infinity)).toEqual("-INF");
        expect(stdFormat("{:f}", +Infinity)).toEqual("inf");
        expect(stdFormat("{:F}", -Infinity)).toEqual("-INF");
        expect(stdFormat("{:g}", +Infinity)).toEqual("inf");
        expect(stdFormat("{:G}", -Infinity)).toEqual("-INF");

        expect(stdFormat("{:08}", Infinity)).toEqual("00000inf");
        expect(stdFormat("{:08}", -Infinity)).toEqual("-0000inf");
    });

    it("type specifier <none>, bool (cpp)", () => {
        stdSpecificationHint("cpp");
        expect(stdFormat("{} {}", true, false)).toEqual("true false");
        expect(stdFormat("{:<7}", true)).toEqual("true   ");
        expect(stdFormat("{:^7}", true)).toEqual(" true  ");
        expect(stdFormat("{:>7}", false)).toEqual("  false");
    });

    it("type specifier <none>, bool (python)", () => {
        stdSpecificationHint("python");
        expect(stdFormat("{} {}", true, false)).toEqual("True False");
        expect(stdFormat("{:<7}", true)).toEqual("True   ");
        expect(stdFormat("{:^7}", true)).toEqual(" True  ");
        expect(stdFormat("{:>7}", false)).toEqual("  False");
    });

    it("type specifier <none>, string", () => {
        expect(stdFormat("{}", "string")).toEqual("string");
    });

    it("type specifier <none>, integer", () => {
        expect(stdFormat("{}", 100)).toEqual("100");
        expect(stdFormat("{}", 10)).toEqual("10");
        expect(stdFormat("{}", 1)).toEqual("1");
        expect(stdFormat("{}", 0)).toEqual("0");
        expect(stdFormat("{}", -1)).toEqual("-1");
        expect(stdFormat("{}", -10)).toEqual("-10");
        expect(stdFormat("{}", -100)).toEqual("-100");

        expect(stdFormat("{:}", 999)).toEqual("999");
    });

    it("type specifier <none>, float", () => {
        expect(stdFormat("{:.2}", Math.PI)).toEqual("3.1");

        expect(stdFormat("{:.1}", 10)).toEqual("1e+01");
        expect(stdFormat("{:.2}", 10)).toEqual("1e+01");
        expect(stdFormat("{:.3}", 10)).toEqual("10.0");
        expect(stdFormat("{:.4}", 10)).toEqual("10.0");

        expect(stdFormat("{:.2}", 9.99)).toEqual("1e+01");
        expect(stdFormat("{:.2}", 99.99)).toEqual("1e+02");
        expect(stdFormat("{:.5}", 99.99999)).toEqual("100.0");

        expect(stdFormat("{:.0}", 123e+8)).toEqual("1e+10");
        expect(stdFormat("{:.1}", 123e+8)).toEqual("1e+10");
        expect(stdFormat("{:.2}", 123e+8)).toEqual("1.2e+10");

        expect(stdFormat("{:.0}", 678e-8)).toEqual("7e-06");
        expect(stdFormat("{:.1}", 678e-8)).toEqual("7e-06");
        expect(stdFormat("{:.2}", 678e-8)).toEqual("6.8e-06");
    });

    it("type specifier s", () => {
        expect(stdFormat("{:s}", "Hello")).toEqual("Hello");
        expect(stdFormat("{:s}", "42")).toEqual("42");

        expect(() => stdFormat("{:s}", 42)).toThrow(); // error
    });

    it("type specifier c", () => {
        expect(stdFormat("{:c}", 65)).toEqual("A");

        // Single-char-string as char
        expect(stdFormat("{:c}", "A")).toEqual("A");
        expect(() => stdFormat("{:c}", "AA")).toThrow();
        expect(() => stdFormat("{:c}", "")).toThrow();
    });

    it("type specifier ?", () => {
        // Not yet implemented
        expect(() => stdFormat("{:?}", "\t")).toThrow();
    });

    it("type specifier d", () => {
        expect(stdFormat("{:d}", -321)).toEqual("-321");
        expect(stdFormat("{:d}", "c")).toEqual("99"); // Single char string as char code
        expect(stdFormat("{:+06d}", String.fromCharCode(120))).toEqual("+00120");
        expect(stdFormat("{:+06d}", 120)).toEqual("+00120");

        expect(stdFormat("{:d} {:d}", true, false)).toEqual("1 0");

        expect(() => stdFormat("{:d}", "hello")).toThrow();
    });

    it("type specifier x and X", () => {
        expect(stdFormat("{:#06x}", 0xa)).toEqual("0x000a");
        expect(stdFormat("{:#06x}", -0xa)).toEqual("-0x00a");
        expect(stdFormat("{:x}", 314)).toEqual("13a");
        expect(stdFormat("{:x}", "c")).toEqual("63");
        expect(stdFormat("{:#x}", 314)).toEqual("0x13a");
        expect(stdFormat("{:#X}", 314)).toEqual("0X13A");
    });

    it("type specifier b and B", () => {
        expect(stdFormat("{:b}", 314)).toEqual("100111010");
        expect(stdFormat("{:#b}", 314)).toEqual("0b100111010");
    });

    it("type specifier o", () => {
        expect(stdFormat("{:o}", 834)).toEqual("1502");
        expect(stdFormat("{:o}", -834)).toEqual("-1502");
    });

    it("type specifier o (cpp prefix)", () => {
        stdSpecificationHint("cpp");
        expect(stdFormat("{:#o}", 834)).toEqual("01502");
        expect(stdFormat("{:#o}", -834)).toEqual("-01502");
        expect(stdFormat("{:#o}", 0)).toEqual("0");
    });

    it("type specifier o (python prefix)", () => {
        stdSpecificationHint("python");
        expect(stdFormat("{:#o}", 834)).toEqual("0o1502");
        expect(stdFormat("{:#o}", -834)).toEqual("-0o1502");
        expect(stdFormat("{:#o}", 0)).toEqual("0o0");
    });

    it("precision for integer", () => {
        expect(() => stdFormat("{:.4d}", 32)).toThrow();
        expect(() => stdFormat("{:.4B}", 32)).toThrow();
    });

    it("type specifier f and F", () => {
        expect(stdFormat("{:.2f}", 0)).toEqual("0.00");
        expect(stdFormat("{:.1f}", 0)).toEqual("0.0");
        expect(stdFormat("{:.0f}", 0)).toEqual("0");
        expect(stdFormat("{:#.0f}", 0)).toEqual("0.");

        expect(stdFormat("{:.2f}", 1)).toEqual("1.00");
        expect(stdFormat("{:.1f}", 1)).toEqual("1.0");
        expect(stdFormat("{:.0f}", 1)).toEqual("1");
        expect(stdFormat("{:#.0f}", 1)).toEqual("1.");

        // rounding up
        expect(stdFormat("{:.2f}", 567.567)).toEqual("567.57");
        expect(stdFormat("{:.1f}", 567.567)).toEqual("567.6");
        expect(stdFormat("{:.0f}", 567.567)).toEqual("568");
        expect(stdFormat("{:#.0f}", 567.567)).toEqual("568.");

        // no rounding
        expect(stdFormat("{:.2f}", 423.423)).toEqual("423.42");
        expect(stdFormat("{:.1f}", 423.423)).toEqual("423.4");
        expect(stdFormat("{:.0f}", 423.423)).toEqual("423");
        expect(stdFormat("{:#.0f}", 423.423)).toEqual("423.");

        expect(stdFormat("{:.3f}", 6e+10)).toEqual("60000000000.000");
        expect(stdFormat("{:.0f}", 6e+10)).toEqual("60000000000");
        expect(stdFormat("{:#.0f}", 6e+10)).toEqual("60000000000.");

        expect(stdFormat("{:.3f}", 4e-10)).toEqual("0.000");
        expect(stdFormat("{:.0f}", 4e-10)).toEqual("0");
        expect(stdFormat("{:#.0f}", 4e-10)).toEqual("0.");

        expect(stdFormat("{:.1f}", 9.999)).toEqual("10.0");
        expect(stdFormat("{:.1f}", 99.99)).toEqual("100.0");
        expect(stdFormat("{:.1f}", 999.9)).toEqual("999.9");
        expect(stdFormat("{:.1f}", 9999)).toEqual("9999.0");

        expect(() => stdFormat("{:.2f}", "100")).toThrow();
    });

    it("type specifier e and E", () => {
        expect(stdFormat("{:.2e}", 0)).toEqual("0.00e+00");
        expect(stdFormat("{:.1e}", 0)).toEqual("0.0e+00");
        expect(stdFormat("{:.0E}", 0)).toEqual("0E+00");
        expect(stdFormat("{:#.0E}", 0)).toEqual("0.E+00");

        expect(stdFormat("{:.2e}", 1)).toEqual("1.00e+00");
        expect(stdFormat("{:.1e}", -1)).toEqual("-1.0e+00");
        expect(stdFormat("{:.0E}", -1)).toEqual("-1E+00");
        expect(stdFormat("{:#.0E}", 1)).toEqual("1.E+00");

        // rounding up
        expect(stdFormat("{:.3e}", -86.8676)).toEqual("-8.687e+01");
        expect(stdFormat("{:.2e}", -86.8676)).toEqual("-8.69e+01");
        expect(stdFormat("{:.1e}", 86.8676)).toEqual("8.7e+01");
        expect(stdFormat("{:.0e}", 86.8676)).toEqual("9e+01");
        expect(stdFormat("{:.2e}", 99999)).toEqual("1.00e+05");

        expect(stdFormat("{:.2E}", Math.PI)).toEqual("3.14E+00");

        expect(stdFormat("{:.2e}", 99999)).toEqual("1.00e+05");

        expect(stdFormat("{:.1e}", 456e+10)).toEqual("4.6e+12");
        expect(stdFormat("{:.1e}", 456e-10)).toEqual("4.6e-08");

        let a = 9867.498;
        expect(stdFormat("{:.4e}", a)).toEqual("9.8675e+03");
        expect(stdFormat("{:.3e}", a)).toEqual("9.867e+03");
        expect(stdFormat("{:.2e}", a)).toEqual("9.87e+03");
        expect(stdFormat("{:.1e}", a)).toEqual("9.9e+03");
        expect(stdFormat("{:.0e}", a)).toEqual("1e+04");
    });

    it("type specifier g and G", () => {
        expect(stdFormat("{:.2g}", 0)).toEqual("0");
        expect(stdFormat("{:.1g}", 0)).toEqual("0");
        expect(stdFormat("{:.0G}", 0)).toEqual("0");
        expect(stdFormat("{:#.0G}", 0)).toEqual("0.");

        expect(stdFormat("{:.2g}", 1)).toEqual("1");
        expect(stdFormat("{:.1g}", -1)).toEqual("-1");
        expect(stdFormat("{:.0G}", -1)).toEqual("-1");
        expect(stdFormat("{:#.0G}", 1)).toEqual("1.");

        expect(stdFormat("{:.5g}", Math.PI)).toEqual("3.1416");

        expect(stdFormat("{:g}", 123.456789e+10)).toEqual("1.23457e+12");
        expect(stdFormat("{:g}", 123.456789)).toEqual("123.457");

        expect(stdFormat("{:.1g}", 9.9999e+4)).toEqual("1e+05");
        expect(stdFormat("{:.1g}", 9.9999)).toEqual("1e+01");
        expect(stdFormat("{:.1g}", 9.9999e-4)).toEqual("0.001");

        expect(stdFormat("{:.2g}", 0.0008379643567865)).toEqual("0.00084");
        expect(stdFormat("{:.2g}", 0.08379643567865)).toEqual("0.084");
        expect(stdFormat("{:.2g}", 8.379643567865)).toEqual("8.4");
        expect(stdFormat("{:.2g}", 837.9643567865)).toEqual("8.4e+02");
        expect(stdFormat("{:.2g}", 83796.43567865)).toEqual("8.4e+04");
        expect(stdFormat("{:.2g}", 8379643.567865)).toEqual("8.4e+06");
        expect(stdFormat("{:.2g}", 837964356.7865)).toEqual("8.4e+08");
        expect(stdFormat("{:.2g}", 83796435678.65)).toEqual("8.4e+10");
        expect(stdFormat("{:.2g}", 8379643567865)).toEqual("8.4e+12");

        expect(stdFormat("{:.6g}", 0.0008379643567865)).toEqual("0.000837964");
        expect(stdFormat("{:.6g}", 0.08379643567865)).toEqual("0.0837964");
        expect(stdFormat("{:.6g}", 8.379643567865)).toEqual("8.37964");
        expect(stdFormat("{:.6g}", 837.9643567865)).toEqual("837.964");
        expect(stdFormat("{:.6g}", 83796.43567865)).toEqual("83796.4");
        expect(stdFormat("{:.6g}", 8379643.567865)).toEqual("8.37964e+06");
        expect(stdFormat("{:.6g}", 837964356.7865)).toEqual("8.37964e+08");
        expect(stdFormat("{:.6g}", 83796435678.65)).toEqual("8.37964e+10");
        expect(stdFormat("{:.6g}", 8379643567865)).toEqual("8.37964e+12");

        // Trailing zeroes not removed with '#' specifier
        expect(stdFormat("{:#.3g}", 0.0)).toEqual("0.00");
        expect(stdFormat("{:#.3g}", 1.0)).toEqual("1.00");
        expect(stdFormat("{:#.3g}", 1e+6)).toEqual("1.00e+06");
        expect(stdFormat("{:#.3g}", 1e-6)).toEqual("1.00e-06");
    });

    it("type specifier a and A", () => {
        expect(stdFormat("{:+#.0a}", 0)).toEqual("+0.p+0");
        expect(stdFormat("{:#.2a}", 1)).toEqual("1.00p+0");

        expect(stdFormat("{:a}", 1.1)).toEqual("1.199999999999ap+0");
        expect(stdFormat("{: a}", 1.1)).toEqual(" 1.199999999999ap+0");
        expect(stdFormat("{:+a}", 1.1)).toEqual("+1.199999999999ap+0");
        expect(stdFormat("{:-a}", 1.1)).toEqual("1.199999999999ap+0");
        expect(stdFormat("{:-a}", -1.1)).toEqual("-1.199999999999ap+0");
        expect(stdFormat("{:.5a}", 1.1)).toEqual("1.1999ap+0");

        expect(stdFormat("{:.2a}", 1e-2)).toEqual("1.48p-7");
        expect(stdFormat("{:.2a}", 1e+2)).toEqual("1.90p+6");

        expect(stdFormat("{:.3a}", 1234567890)).toEqual("1.266p+30");
        expect(stdFormat("{:.3a}", -1234567890)).toEqual("-1.266p+30");
        expect(stdFormat("{:.3a}", 1234567890e-20)).toEqual("1.b26p-37");
        expect(stdFormat("{:.3a}", -1234567890e-20)).toEqual("-1.b26p-37");
    });

    it("type specifier %", () => {
        expect(stdFormat("{:.0%}", 0)).toEqual("0%");
        expect(stdFormat("{:.1%}", 0)).toEqual("0.0%");
        expect(stdFormat("{:.2%}", 0)).toEqual("0.00%");

        expect(stdFormat("{:.0%}", 1)).toEqual("100%");
        expect(stdFormat("{:.1%}", 1)).toEqual("100.0%");
        expect(stdFormat("{:.2%}", 1)).toEqual("100.00%");

        expect(stdFormat("{:#.0%}", 0)).toEqual("0.%");
        expect(stdFormat("{:#.0%}", 1)).toEqual("100.%");

        expect(stdFormat("{:#.3%}", 77.7777)).toEqual("7777.770%");
        expect(stdFormat("{:#.1%}", 77.7777)).toEqual("7777.8%");
    });

    it("float to integer throws", () => {
        expect(() => stdFormat("{:d}", 777.777)).toThrow();
        expect(() => stdFormat("{:d}", -777.777)).toThrow();

        expect(() => stdFormat("{:#x}", 222.222)).toThrow();
        expect(() => stdFormat("{:#X}", -222.222)).toThrow();

        expect(() => stdFormat("{:o}", 777.777)).toThrow();
        expect(() => stdFormat("{:o}", -777.777)).toThrow();

        expect(() => stdFormat("{:b}", 222.222)).toThrow();
        expect(() => stdFormat("{:#b}", -222.222)).toThrow();

        expect(() => stdFormat("{:x}", 0.123)).toThrow();
        expect(() => stdFormat("{:x}", 1.23)).toThrow();
    });

    it("all together", () => {
        expect(stdFormat("{:*<+10.4f}", Math.PI, 314)).toEqual("+3.1416***");
        expect(stdFormat("{:+#09x}", 314)).toEqual("+0x00013a");
    });

    it("invalid argument object", () => {
        expect(() => stdFormat("{}", {})).toThrow();
    });

    it("supported arguments", () => {
        stdSpecificationHint("cpp");
        // boolean, string, char, number, bigint
        expect(stdFormat("{:s} {:s} {:c} {:d} {:d}", true, "string", "c", 10, BigInt("999"))).toEqual("true string c 10 999");
    });

    it("bigint", () => {
        // bigint has no separate negative/positive zero, just zero
        expect(stdFormat("{}", BigInt("-0"))).toEqual("0");
        expect(stdFormat("{}", BigInt("+0"))).toEqual("0");

        expect(stdFormat("{:d}", BigInt("123456789012345678901234567890"))).toEqual("123456789012345678901234567890");
        expect(stdFormat("{:d}", BigInt("-123456789012345678901234567890"))).toEqual("-123456789012345678901234567890");

        expect(stdFormat("{}", BigInt("90000000000000000000000"))).toEqual("90000000000000000000000");
        expect(stdFormat("{}", BigInt("0000000009"))).toEqual("9");

        expect(stdFormat("{:.02f}", BigInt(1234))).toEqual("1234.00");
        expect(stdFormat("{:.02f}", BigInt(9876))).toEqual("9876.00");

        expect(stdFormat("{:.02e}", BigInt(1234))).toEqual("1.23e+03");
        expect(stdFormat("{:.02e}", BigInt(9876))).toEqual("9.88e+03");

        expect(stdFormat("{:d}", BigInt("0x0A"))).toEqual("10");
        expect(stdFormat("{:x}", BigInt("0x0A"))).toEqual("a");
        expect(stdFormat("{}", BigInt("0b0011"))).toEqual("3");
    });

    it("number digitizer algorithm", () => {
        // Handle zeroes around decimal dot
        expect(stdFormat("{:.3f}", 230.023)).toEqual("230.023");
        expect(stdFormat("{:.5f}", 500.005)).toEqual("500.00500");
    });
});
