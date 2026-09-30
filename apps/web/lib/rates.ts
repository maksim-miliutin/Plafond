import { unpack } from "@plafond/domain";
import type { Rate } from "@plafond/domain";
import type { Fetcher } from "@plafond/address";

export const ratesFile = "rates.json";

export interface Unreachable
{
    kind: "unreachable";
}

export async function loadRates(fetcher: Fetcher): Promise<Rate[] | Unreachable>
{
    try
    {
        const response = await fetcher(`/${ratesFile}`);
        if (!response.ok)
        {
            return { kind: "unreachable" };
        }

        const body = await response.json();

        return unpack(body);
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
