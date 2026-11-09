import { unpack, unpackQuartiers } from "@plafond/domain";
import type { City, Quartier, Rate } from "@plafond/domain";
import type { Fetcher } from "@plafond/address";

export const tableFiles: Record<City, { rates: string; areas: string }> = {
    paris: { rates: "rates.json", areas: "quartiers.json" },
    lyon: { rates: "lyon-rates.json", areas: "lyon-areas.json" },
};

export const ratesFile = tableFiles.paris.rates;
export const quartiersFile = tableFiles.paris.areas;

export interface Unreachable
{
    kind: "unreachable";
}

export interface Tables
{
    rates: Rate[];
    quartiers: Quartier[];
}

export async function loadTables(fetcher: Fetcher): Promise<Tables | Unreachable>
{
    const [rates, quartiers] = await Promise.all([loadRates(fetcher), loadQuartiers(fetcher)]);
    if ("kind" in rates || "kind" in quartiers)
    {
        return { kind: "unreachable" };
    }

    return { rates, quartiers };
}

export async function loadCity(fetcher: Fetcher, city: City): Promise<Tables | Unreachable>
{
    const files = tableFiles[city];
    const [rates, quartiers] = await Promise.all([load(fetcher, files.rates, unpack), load(fetcher, files.areas, unpackQuartiers)]);
    if ("kind" in rates || "kind" in quartiers)
    {
        return { kind: "unreachable" };
    }

    return { rates, quartiers };
}

export function loadRates(fetcher: Fetcher): Promise<Rate[] | Unreachable>
{
    return load(fetcher, ratesFile, unpack);
}

export function loadQuartiers(fetcher: Fetcher): Promise<Quartier[] | Unreachable>
{
    return load(fetcher, quartiersFile, unpackQuartiers);
}

async function load<T>(fetcher: Fetcher, file: string, read: (body: unknown) => T): Promise<T | Unreachable>
{
    try
    {
        const response = await fetcher(file);
        if (!response.ok)
        {
            return { kind: "unreachable" };
        }

        return read(await response.json());
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
