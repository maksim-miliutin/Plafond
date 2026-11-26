import { frenchDay, type Day, type FeeZone } from "@plafond/domain";
import type { RegionalCommune, TensePart, ZoneLists } from "@plafond/import";

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

const covers = (list: { from: Day; until: Day }, day: Day) => list.from <= day && day < list.until;

// The part of the list of décret n° 2013-392 the commune was in on a day: the current version from 24 December 2025, the
// older ones back to 13 May 2013, which had a single list that reads as part 1. Null before, or where Plafond lacks it.
function tensePartOn(commune: RegionalCommune, day: Day, lists: ZoneLists): TensePart | null
{
    if (day >= lists.tense.from)
    {
        return commune.tensePart;
    }

    const index = lists.tenseHistory.findIndex((list) => covers(list, day));

    return index < 0 ? null : commune.pastTense?.[index] ?? null;
}

// Whether the commune was in zone A bis on a day: since 26 June 2026, from 7 September 2025, and the older versions of the
// arrêté of 1 August 2014 back to 7 August 2014. Null before, or for a commune merged since from parts the zone treated apart.
function veryTenseOn(commune: RegionalCommune, day: Day, lists: ZoneLists): boolean | null
{
    if (day >= lists.veryTense.from)
    {
        return commune.abcZone === "Abis";
    }

    if (covers(lists.earlierVeryTense, day))
    {
        return commune.veryTenseBefore;
    }

    const index = lists.veryTenseHistory.findIndex((list) => covers(list, day));

    return index < 0 ? null : commune.pastVeryTense?.[index] ?? null;
}

// Décret n° 2014-890 caps agency fees by the zone on the day the lease is signed: zone A bis first, then either part of the
// list of décret n° 2013-392. When either is unknown for that day, the tenant says.
export function feeZoneOn(commune: RegionalCommune, day: Day, lists: ZoneLists): FeeZone | null
{
    const veryTense = veryTenseOn(commune, day, lists);
    if (veryTense === true)
    {
        return "very-tense";
    }

    const part = tensePartOn(commune, day, lists);
    if (veryTense === null || part === null)
    {
        return null;
    }

    return part === 0 ? "other" : "tense";
}

// Article 15 of loi n° 89-462 shortens the notice of an empty dwelling in part 1 of the list, and the decree on reletting
// rents applies there. The official simulator reads the list on the day the lease was signed, renewed or tacitly renewed.
export function tenseOn(commune: RegionalCommune, day: Day, lists: ZoneLists): boolean | null
{
    const part = tensePartOn(commune, day, lists);

    return part === null ? null : part === 1;
}

const feeNames: Record<FeeZone, string> = { "very-tense": "zone très tendue", tense: "zone tendue", other: "hors zone tendue" };

export function feeZoneNote(commune: RegionalCommune, zone: FeeZone | null, lists: ZoneLists, day: Day): string
{
    const first = [lists.tenseHistory[0]?.from ?? lists.tense.from, lists.veryTenseHistory[0]?.from ?? lists.earlierVeryTense.from].sort().at(-1)!;
    if (zone !== null)
    {
        return `${commune.name} : ${feeNames[zone]} pour les frais d'agence, d'après les listes en vigueur à la date du bail. Vous pouvez corriger ce choix.`;
    }

    return day < first
        ? `${commune.name} : pour un bail signé avant le ${frenchDay(first)}, Plafond n'a pas les listes de l'époque. Choisissez la zone vous-même.`
        : `${commune.name} : à cette date, la zone dépend de l'ancienne commune où se trouve le logement, réunie depuis à ${commune.name}. Choisissez la zone vous-même.`;
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
        return `${commune.name} : pour un bail signé ou renouvelé avant le ${frenchDay(lists.tenseHistory[0]?.from ?? lists.tense.from)}, Plafond n'a pas la liste de l'époque. Répondez vous-même.`;
    }

    return tense
        ? `${commune.name} : en zone tendue, d'après la liste en vigueur à la date du bail. Vous pouvez corriger ce choix.`
        : `${commune.name} : hors zone tendue, d'après la liste en vigueur à la date du bail. Un autre motif peut tout de même réduire le préavis.`;
}
