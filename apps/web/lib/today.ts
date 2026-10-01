import type { Day } from "@plafond/domain";

// Every rent and every deadline counts in Paris days, whatever the time zone of the phone that asks.
const paris = new Intl.DateTimeFormat("en", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" });

export function todayInParis(now: Date): Day
{
    const part = (type: Intl.DateTimeFormatPartTypes) => paris.formatToParts(now).find((piece) => piece.type === type)?.value ?? "";

    return `${part("year")}-${part("month")}-${part("day")}`;
}
