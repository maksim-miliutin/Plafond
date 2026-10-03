import { isDay } from "@plafond/domain";
import type { Dpe, Label } from "@plafond/domain";
import type { Fetcher } from "@plafond/address";

export interface Listing
{
    dpe: Dpe;
    address: string;
    surface: number | null;  // hundredths of a square metre
    floor: number | null;
    detail: string | null;
    electric: boolean;
}

export class AdemeError extends Error
{
    constructor(problem: string)
    {
        super(`ademe: ${problem}`);
        this.name = "AdemeError";
    }
}

export interface Unreachable
{
    kind: "unreachable";
}

export interface Malformed
{
    kind: "malformed";
}

export interface DpeSource
{
    byNumber(number: string): Promise<Listing[] | Malformed | Unreachable>;
    atAddress(banId: string): Promise<Listing[] | Unreachable>;
}

const labels: readonly string[] = ["A", "B", "C", "D", "E", "F", "G"];

// ADEME's open data answers Elasticsearch query strings; an exact field match keeps the neighbours out.
const endpoint = "https://data.ademe.fr/data-fair/api/v1/datasets/dpe03existant/lines";
const read = 
[
    "numero_dpe",
    "etiquette_dpe",
    "date_etablissement_dpe",
    "date_fin_validite_dpe",
    "adresse_ban",
    "surface_habitable_logement",
    "numero_etage_appartement",
    "complement_adresse_logement",
    "type_energie_principale_chauffage",
];

export function ademe(fetcher: Fetcher): DpeSource
{
    return {
        byNumber: async (number) =>
        {
            const printed = number.replace(/\s/g, "").toUpperCase();

            return /^[0-9A-Z]{13}$/.test(printed) ? ask(fetcher, `numero_dpe:"${printed}"`) : { kind: "malformed" };
        },
        atAddress: async (banId) =>
        {
            if (!/^[0-9A-Za-z_]+$/.test(banId))
            {
                throw new AdemeError("a BAN identifier holds only letters, digits and underscores");
            }

            return ask(fetcher, `identifiant_ban:"${banId}"`);
        },
    };
}

async function ask(fetcher: Fetcher, query: string): Promise<Listing[] | Unreachable>
{
    const url = `${endpoint}?${new URLSearchParams({ qs: query, select: read.join(","), size: "100" })}`;
    try
    {
        const reply = await fetcher(url);
        if (!reply.ok)
        {
            return { kind: "unreachable" };
        }

        return listingsFrom(await reply.json());
    }
    catch (err)
    {
        if (err instanceof TypeError || err instanceof SyntaxError)
        {
            return { kind: "unreachable" };
        }

        throw err;
    }
}

export function listingsFrom(body: unknown): Listing[]
{
    const results = field(body, "results");
    if (!Array.isArray(results))
    {
        throw new AdemeError("the ADEME replied without a list of results");
    }

    return results
        .map(listingOf)
        .filter((listing) => listing !== null)
        .sort((a, b) => (a.dpe.establishedOn < b.dpe.establishedOn ? 1 : a.dpe.establishedOn > b.dpe.establishedOn ? -1 : 0));
}

function listingOf(line: unknown): Listing | null
{
    const number = field(line, "numero_dpe");
    const label = field(line, "etiquette_dpe");
    const establishedOn = field(line, "date_etablissement_dpe");
    const validUntil = field(line, "date_fin_validite_dpe");
    const address = field(line, "adresse_ban");
    if (typeof number !== "string" || typeof label !== "string" || !labels.includes(label) || !day(establishedOn) || !day(validUntil) || typeof address !== "string")
    {
        return null;
    }

    const surface = field(line, "surface_habitable_logement");
    const floor = field(line, "numero_etage_appartement");
    const detail = field(line, "complement_adresse_logement");

    return {
        dpe: { number, label: label as Label, establishedOn, validUntil },
        address,
        surface: typeof surface === "number" && surface > 0 ? Math.round(surface * 100) : null,
        floor: Number.isInteger(floor) ? (floor as number) : null,
        detail: typeof detail === "string" && detail.trim() !== "" ? detail : null,
        electric: field(line, "type_energie_principale_chauffage") === "Électricité",
    };
}

function day(value: unknown): value is string
{
    return typeof value === "string" && isDay(value);
}

function field(value: unknown, name: string): unknown
{
    return typeof value === "object" && value !== null ? (value as Record<string, unknown>)[name] : undefined;
}
