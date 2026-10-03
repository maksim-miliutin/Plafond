import type { Point } from "@plafond/domain";

export interface Located
{
    kind: "located";
    id: string;
    label: string;
    point: Point;
}

export type Lookup =
    | Located
    | { kind: "not-found" }
    | { kind: "not-paris"; label: string }
    | { kind: "overseas"; label: string }
    | { kind: "street-only"; label: string }
    | { kind: "unreachable" };

export interface Geocoder
{
    locate(text: string): Promise<Lookup>;
}

export interface Reply
{
    ok: boolean;
    status: number;
    json(): Promise<unknown>;
}

export type Fetcher = (url: string) => Promise<Reply>;

export class AddressError extends Error
{
    constructor(problem: string)
    {
        super(`address: ${problem}`);
        this.name = "AddressError";
    }
}

interface Match
{
    id: string;
    label: string;
    type: string;
    citycode: string;
    point: Point;
}

// The Base Adresse Nationale answers here since its own api-adresse.data.gouv.fr was
// switched off in January 2026. It takes 3 to 200 characters of text.
const endpoint = "https://data.geopf.fr/geocodage/search";
const shortest = 3;
const longest = 200;

export type Area = "paris" | "mainland";

const arrondissement = /^751(0[1-9]|1[0-9]|20)$/;

const areas: Record<Area, { holds: (citycode: string) => boolean; refusal: "not-paris" | "overseas" }> = {
    paris: { holds: (citycode) => arrondissement.test(citycode), refusal: "not-paris" },
    mainland: { holds: (citycode) => !citycode.startsWith("97"), refusal: "overseas" },
};

export function geoplateforme(fetcher: Fetcher, area: Area = "paris"): Geocoder
{
    return { locate: (text) => locate(fetcher, text.trim(), area) };
}

async function locate(fetcher: Fetcher, text: string, area: Area): Promise<Lookup>
{
    if (text.length < shortest || text.length > longest)
    {
        return { kind: "not-found" };
    }

    const body = await ask(fetcher, `${endpoint}?q=${encodeURIComponent(text)}&index=address&limit=1`);
    if (body === null)
    {
        return { kind: "unreachable" };
    }

    const match = firstMatch(body);
    if (match === null)
    {
        return { kind: "not-found" };
    }

    if (!areas[area].holds(match.citycode))
    {
        return { kind: areas[area].refusal, label: match.label };
    }

    if (match.type !== "housenumber")
    {
        return { kind: "street-only", label: match.label };
    }

    return { kind: "located", id: match.id, label: match.label, point: match.point };
}

async function ask(fetcher: Fetcher, url: string): Promise<unknown>
{
    try
    {
        const reply = await fetcher(url);

        return reply.ok ? await reply.json() : null;
    }
    catch
    {
        return null;
    }
}

function firstMatch(body: unknown): Match | null
{
    const features = field(body, "features");
    if (!Array.isArray(features))
    {
        throw new AddressError("the geocoder replied without a list of features");
    }

    if (features.length === 0)
    {
        return null;
    }

    const properties = field(features[0], "properties");
    const coordinates = field(field(features[0], "geometry"), "coordinates");
    const [lon, lat] = Array.isArray(coordinates) ? coordinates : [];
    const id = field(properties, "id");
    const label = field(properties, "label");
    const type = field(properties, "type");
    const citycode = field(properties, "citycode");
    if (typeof lon !== "number" || typeof lat !== "number" || typeof id !== "string" || typeof label !== "string" || typeof type !== "string" || typeof citycode !== "string")
    {
        throw new AddressError("the geocoder replied with a feature of an unexpected shape");
    }

    return { id, label, type, citycode, point: { lon, lat } };
}

function field(value: unknown, name: string): unknown
{
    return typeof value === "object" && value !== null ? (value as Record<string, unknown>)[name] : undefined;
}
