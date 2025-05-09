import { FormatError } from "../index";
import { isInteger } from "./common";

// Get symbol info (code point and symbol chars) at pos.
export function getCodePointAt(str: string, pos: number): number | undefined {
    if (pos < 0 || pos >= str.length) {
        return undefined;
    }

    // Get first 16-bit UTF-16 code unit
    const first = str.charCodeAt(pos);

    // Check if first is a high surrogate.
    if (first >= 0xD800 && first <= 0xDBFF && pos + 1 < str.length) {
        // Get second 16-bit UTF-16 code unit.
        let second = str.charCodeAt(pos + 1);
        if (second >= 0xDC00 && second <= 0xDFFF) {
            // Combine the surrogate pair.
            return ((first - 0xD800) << 10) + (second - 0xDC00) + 0x10000;
        }
    }

    // Not a surrogate pair.
    return first;
}

// Is this code unit a complete character by itself (i.e., not the start of a surrogate pair)?
function isSingleCodeUnit(str: string, pos: number): boolean {
    const charCode = str.charCodeAt(pos);
    return charCode < 0xD800 || charCode > 0xDBFF;
}

// Get grapheme at string pos.
// A grapheme = one visual character, even if made from many code points.
export function getGraphemeAt(str: string, pos: number): { grapheme: string, length: number } {
    // Speed optimization for single code unit.
    if (isSingleCodeUnit(str, pos)) {
        return { grapheme: str[pos], length: 1 };
    }

    const ZWJ = "\u200D";
    const VS15 = "\uFE0E";
    const VS16 = "\uFE0F";
    const KEYCAP = "\u20E3";

    let i = pos;
    let result = "";

    function readCodePoint(): string {
        const cp = getCodePointAt(str, i);
        if (!cp) return "";
        const len = cp > 0xFFFF ? 2 : 1;
        const ch = str.slice(i, i + len);
        i += len;
        return ch;
    }

    function maybeReadVSOrCombining() {
        // VS15 or VS16
        if (str[i] === VS15 || str[i] === VS16) {
            result += str[i++];
        }
        // Combining marks U+0300 to U+036F
        while (i < str.length) {
            const mark = getCodePointAt(str, i);
            if (mark !== undefined && mark >= 0x0300 && mark <= 0x036F) {
                result += readCodePoint();
            } else {
                break;
            }
        }
    }

    function maybeReadSkinTone() {
        const tone = getCodePointAt(str, i);
        if (tone !== undefined && tone >= 0x1F3FB && tone <= 0x1F3FF) {
            result += readCodePoint();
        }
    }

    // Read base char or emoji
    result += readCodePoint();
    maybeReadVSOrCombining();
    maybeReadSkinTone();

    // Handle keycap sequence: base + VS16 (optional) + keycap U+20E3
    if (str[i] === KEYCAP) {
        result += str[i++];
    }

    // Handle ZWJ sequences recursively
    while (str[i] === ZWJ) {
        result += str[i++];
        result += readCodePoint();
        maybeReadVSOrCombining();
        maybeReadSkinTone();
    }

    return { grapheme: result, length: i - pos };
}

// Is valid code point value?
export function isValidCodePoint(codePoint: number): boolean {
    return isInteger(codePoint) && codePoint >= 0 && codePoint <= 0x10FFFF;
}

// Get valid fill char. Fill char must be single code point.
export function getValidFillCharAt(str: string, pos: number): string | undefined {
    let codePoint = getCodePointAt(str, pos);

    if (
        codePoint === undefined ||
        (codePoint >= 0x0300 && codePoint <= 0x036F) ||  // combining diacritics
        (codePoint >= 0x1F3FB && codePoint <= 0x1F3FF) || // skin tone modifiers
        (codePoint >= 0x200C && codePoint <= 0x200F) ||   // ZWNJ/ZHJ/LRM/RLM
        codePoint === 0xFE0F || codePoint === 0xFE0E ||   // VS15/16
        codePoint === 0x200D ||                           // ZWJ
        codePoint === 0xFEFF                              // BOM
    ) {
        return undefined;
    }

    return codePoint > 0xFFFF ? str.slice(pos, pos + 2) : str[pos];
}

// Get symbol from code point.
export function getSymbol(codePoint: number): string {
    if (!isValidCodePoint(codePoint)) {
        throw new FormatError("Invalid code point " + codePoint);
    }

    if (codePoint <= 0xFFFF) {
        return String.fromCharCode(codePoint);
    }
    else {
        // Encode surrogate pair.
        codePoint -= 0x10000;

        const highSurrogate = 0xD800 + (codePoint >> 10);
        const lowSurrogate = 0xDC00 + (codePoint & 0x3FF);

        return String.fromCharCode(highSurrogate, lowSurrogate);
    }
}

// Get string real length
export function getStringRealLength(str: string): number {
    let curLen = 0;
    let charPos = 0;

    while (charPos < str.length) {
        let { length } = getGraphemeAt(str, charPos);
        if (length > 0) {
            curLen++;
            charPos += length;
        }
        else {
            charPos++; // fallback: shouldn't happen
        }
    }

    return curLen;
}

// Set string real length.
export function setStringRealLength(str: string, newLen: number): string {
    let curLen = 0;
    let charPos = 0;

    while (charPos < str.length && curLen < newLen) {
        let { length } = getGraphemeAt(str, charPos);
        if (length > 0) {
            curLen++;
            charPos += length;
        }
        else {
            charPos++; // fallback: shouldn't happen
        }
    }

    return str.substring(0, charPos);
}
