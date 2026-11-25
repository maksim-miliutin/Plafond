import { frenchDay, type Day, type FeeZone } from "@plafond/domain";
import type { CommuneZone, ZoneLists } from "@plafond/import";

// A commune named by its INSEE code in a link, with its zone and the lists that give it.
export interface KnownCommune
{
    commune: CommuneZone;
    lists: ZoneLists;
}

// The code a link carries, read once: anything but a known five-character code is ignored and the form asks as usual.
export function communeFrom(search: string, communes: readonly CommuneZone[]): CommuneZone | undefined
{
    const code = new URLSearchParams(search).get("commune");

    return code === null || !/^\d[\dAB]\d{3}$/.test(code) ? undefined : communes.find((commune) => commune.code === code);
}

// Décret n° 2014-890 caps agency fees by the zone on the day the lease is signed. The table copies zone A bis as it stands
// since 26 June 2026 and the tense list since 24 December 2025: a commune of zone A bis is sure from the first day, any
// other only once both lists are in force, since before it might have been in zone A bis. Earlier, the tenant says.
function feeZoneSince(commune: CommuneZone, lists: ZoneLists): Day
{
    return commune.zone === "very-tense" ? lists.veryTense.from : [lists.tense.from, lists.veryTense.from].sort().at(-1)!;
}

export function feeZoneOn(commune: CommuneZone, day: Day, lists: ZoneLists): FeeZone | null
{
    return day >= feeZoneSince(commune, lists) ? commune.zone : null;
}

// Article 15 of loi n° 89-462 shortens the notice of an empty dwelling in the tense zone, as the list stands when the
// landlord receives the letter.
export function tenseOn(commune: CommuneZone, day: Day, lists: ZoneLists): boolean | null
{
    return day >= lists.tense.from ? commune.zone !== "other" : null;
}

const feeNames: Record<FeeZone, string> = { "very-tense": "zone très tendue", tense: "zone tendue", other: "hors zone tendue" };

export function feeZoneNote(commune: CommuneZone, zone: FeeZone | null, lists: ZoneLists): string
{
    const since = frenchDay(feeZoneSince(commune, lists));

    return zone === null
        ? `${commune.name} : pour un bail signé avant le ${since}, Plafond n'a pas la liste de l'époque. Choisissez la zone vous-même.`
        : `${commune.name} : ${feeNames[zone]}, d'après la liste en vigueur depuis le ${since}. Vous pouvez corriger ce choix.`;
}

export function tenseNote(commune: CommuneZone, tense: boolean | null, lists: ZoneLists): string
{
    if (tense === null)
    {
        return `${commune.name} : pour une lettre reçue avant le ${frenchDay(lists.tense.from)}, Plafond n'a pas la liste de l'époque. Répondez vous-même.`;
    }

    return `${commune.name} : ${tense ? "en zone tendue" : "hors zone tendue"}, d'après la liste en vigueur depuis le ${frenchDay(lists.tense.from)}. Vous pouvez corriger ce choix.`;
}
