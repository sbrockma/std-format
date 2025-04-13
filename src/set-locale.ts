// Get user/system locale
const defaultLocale = (function getUserLocale(): string | undefined {
    try {
        return (navigator?.languages ? navigator.languages[0] : navigator?.language) ?? Intl.DateTimeFormat().resolvedOptions().locale;
    }
    catch (e) {
        return undefined;
    }
})() ?? "en-UK";

// Locale's decimal and group separators.
export let localeDecimalSeparator = ".";
export let localeGroupSeparator = ",";

// Set locale that will be used in locale based formatting.
export function setLocale(locale?: string | undefined) {
    try {
        let nf = Intl.NumberFormat(locale ?? defaultLocale).formatToParts(33333.3);

        // Extract decimal and group separators.
        localeDecimalSeparator = nf.find(part => part.type === "decimal")?.value ?? ".";
        localeGroupSeparator = nf.find(part => part.type === "group")?.value ?? "";
    }
    catch (e) {
        if (locale) {
            console.log("Failed to fetch information for locale " + locale + ".");
        }
        localeDecimalSeparator = ".";
        localeGroupSeparator = ",";
    }
}

// Init with default locale
setLocale();
