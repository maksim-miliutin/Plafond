import { frenchDay, type Day, type FeeZone } from "@plafond/domain";
import type { RegionalCommune, ZoneLists } from "@plafond/import";

// A commune named by its INSEE code in a link, with the lists that give its zones.
export interface KnownCommune
{
    commune: RegionalCommune;
    lists: ZoneLists;
}

// The code a link carries, read as text: anything but a known five-character code is ignored and the form asks as usual.
export function communeFrom<Commune extends RegionalCommune>(search: string, communes: readonly Commune[]): Commune | undefined
{
    const code = new URLSearchParams(search).get("commune");

    return code === null || !/^\d[\dAB]\d{3}$/.test(code) ? undefined : communes.find((commune) => commune.code === code);
}

// Décret n° 2014-890 caps agency fees by the zone on the day the lease is signed: zone A bis first, as the arrêté of
// 5 September 2025 set it from 7 September 2025 and the arrêté of 23 June 2026 from 26 June 2026; then either part of the
// list of décret n° 2013-392, which Plafond holds as it stands since 24 December 2025. Earlier, the tenant says.
export function feeZoneOn(commune: RegionalCommune, day: Day, lists: ZoneLists): FeeZone | null
{
    const earlier = lists.earlierVeryTense;
    const veryTense = day >= lists.veryTense.from ? commune.abcZone === "Abis" : day >= earlier.from && day < earlier.until ? commune.veryTenseBefore : null;
    if (veryTense === true)
    {
        return "very-tense";
    }

    if (veryTense === null || day < lists.tense.from)
    {
        return null;
    }

    return commune.tensePart === 0 ? "other" : "tense";
}

// The first day from which the zone of the fees is known for every later day.
function feeZoneSince(commune: RegionalCommune, lists: ZoneLists): Day
{
    return commune.veryTenseBefore ? lists.earlierVeryTense.from : lists.tense.from;
}

// Article 15 of loi n° 89-462 shortens the notice of an empty dwelling in part 1 of the list, and the decree on reletting
// rents applies there. The official simulator reads the list on the day the lease was signed or last renewed.
export function tenseOn(commune: RegionalCommune, day: Day, lists: ZoneLists): boolean | null
{
    return day >= lists.tense.from ? commune.tensePart === 1 : null;
}

const feeNames: Record<FeeZone, string> = { "very-tense": "zone très tendue", tense: "zone tendue", other: "hors zone tendue" };

export function feeZoneNote(commune: RegionalCommune, zone: FeeZone | null, lists: ZoneLists): string
{
    return zone === null
        ? `${commune.name} : pour un bail signé avant le ${frenchDay(feeZoneSince(commune, lists))}, Plafond n'a pas les listes de l'époque. Choisissez la zone vous-même.`
        : `${commune.name} : ${feeNames[zone]} pour les frais d'agence, d'après les listes en vigueur à la date du bail. Vous pouvez corriger ce choix.`;
}

// For the notice, the day is the lease's signature or last renewal; without it the form asks.
export function tenseNote(commune: RegionalCommune, tense: boolean | null, lists: ZoneLists, dated: boolean): string
{
    if (!dated)
    {
        return `${commune.name} : indiquez la date de signature ou du dernier renouvellement du bail pour que Plafond retrouve la zone, ou répondez vous-même.`;
    }

    if (tense === null)
    {
        return `${commune.name} : pour un bail signé ou renouvelé avant le ${frenchDay(lists.tense.from)}, Plafond n'a pas la liste de l'époque. Répondez vous-même.`;
    }

    return tense
        ? `${commune.name} : en zone tendue, d'après la liste en vigueur à la date du bail. Vous pouvez corriger ce choix.`
        : `${commune.name} : hors zone tendue, d'après la liste en vigueur à la date du bail. Un autre motif peut tout de même réduire le préavis.`;
}
