import { assert } from "./internal";

// Grouping info class.
export class GroupingInfo {
    // Grouping info constructor.
    constructor(private readonly decimalSeparator: string, private readonly groupingSeparator: string, private readonly groupSizes: number[]) { }

    // Grouping separator is ',', and group size is 3.
    static readonly comma3 = new GroupingInfo(".", ",", [3]);

    // Grouping separator is '_', and group size is 3.
    static readonly underscore3 = new GroupingInfo(".", "_", [3]);

    // Grouping separator is '_', and group size is 4.
    static readonly underscore4 = new GroupingInfo(".", "_", [4]);

    // No grouping
    static readonly noGrouping = new GroupingInfo(".", "", []);

    // Locale, grouping info cache.
    static cache: { [locale: string]: GroupingInfo } = {};

    // Get grouping info based on locale.
    static getFromLocale(locale: string): GroupingInfo {
        try {
            // Is grouping info for this locale in cache?
            if (this.cache[locale] !== undefined) {
                return this.cache[locale];
            }

            // Get number format parts of test value.
            const parts = Intl.NumberFormat(locale).formatToParts(1111111111111.111);

            // Extract decimal and group separators.
            let decimalSeparator = parts.find(part => part.type === "decimal")?.value;
            let groupingSeparator = parts.find(part => part.type === "group")?.value ?? "";

            // Get integer group sizes of the test value. Order from right to left.
            let groupSizes: number[] = parts.filter(part => part.type === "integer").map(p => p.value.length).reverse();

            if (!decimalSeparator) {
                // Error, decimal separator is required.
                decimalSeparator = ".";
                groupingSeparator = "";
                groupSizes = [];
            }
            else if (!groupingSeparator || groupSizes.length <= 1) {
                // No grouping.
                groupingSeparator = "";
                groupSizes = [];
            }
            else {
                // Dismiss left most group size because it can be partial.
                groupSizes.pop();

                // Need  at most 2 rightmost group sizes ("en-UK" has [3, 3], "hi-IN" has [3, 2], etc.)
                groupSizes.splice(2);
            }

            // Create grouping info, save it into cache and return it.
            return this.cache[locale] = new GroupingInfo(decimalSeparator, groupingSeparator, groupSizes);
        }
        catch (e) {
            console.log("Locale '" + locale + "' error.");

            // Return default no-grouping grouping info.
            return GroupingInfo.noGrouping;
        }
    }

    // Get decimal separator.
    getDecimalSeparator(): string {
        return this.decimalSeparator;
    }

    // Get grouping separator.
    getGroupingSeparator(): string {
        return this.groupingSeparator;
    }

    // Has grouping?
    hasGrouping(): boolean {
        return !!this.groupingSeparator && this.groupSizes.length > 0;
    }

    // Get group size.
    getGroupSize(groupId: number): number {
        assert(this.hasGrouping());
        return this.groupSizes[Math.min(groupId, this.groupSizes.length - 1)];
    }
}
