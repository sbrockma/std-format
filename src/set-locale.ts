import { GroupingInfo } from "./grouping-info";

// Get user/system locale
const defaultLocale = (function getUserLocale(): string | undefined {
    try {
        return (navigator?.languages ? navigator.languages[0] : navigator?.language) ?? Intl.DateTimeFormat().resolvedOptions().locale;
    }
    catch (e) {
        return undefined;
    }
})() ?? "en-UK";

// Locale's grouping info.
let localeGroupingInfo: GroupingInfo | undefined = undefined;

// Get locale's grouping info.
export function getLocaleGroupingInfo(): GroupingInfo {
    if (localeGroupingInfo === undefined) {
        localeGroupingInfo = GroupingInfo.getFromLocale(defaultLocale);
    }

    return localeGroupingInfo;
}

// Set locale.
export function setLocale(locale?: string) {
    localeGroupingInfo = GroupingInfo.getFromLocale(locale ?? defaultLocale);
}
