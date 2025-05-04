import { NumberWrapper } from "./int-float";
import { FormatStringParser } from "./format-string-parser";

/**
 * Exceoption class, trown on format and value errors.
 * @public
 */
export class FormatError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "FormatError";
        // console.log(this.message);
    }
}
