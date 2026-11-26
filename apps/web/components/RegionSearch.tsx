"use client";

import { useMemo, useState } from "react";

import { departmentNames, regionMatching, unpackRegion, zoneLineOf } from "../lib/region";
import { CommuneChecks } from "./CommuneChecks";

const shownAtMost = 20;

// The communes of Île-de-France by name, former name or INSEE code, each with its department, its zones and its checks.
export function RegionSearch({ communes, capped }: { communes: string; capped: readonly string[] })
{
    const region = useMemo(() => unpackRegion(communes), [communes]);
    const [typed, setTyped] = useState("");
    const found = regionMatching(region, typed);
    const shown = found.slice(0, shownAtMost);

    return (
        <div className="stack">
            <label htmlFor="commune" className="label">Votre commune</label>
            <input
                id="commune"
                type="search"
                className="field"
                autoComplete="address-level2"
                aria-describedby="commune-count"
                value={typed}
                onChange={(event) => setTyped(event.target.value)}
            />
            <p id="commune-count" className="hint" aria-live="polite">{countOf(typed, found.length)}</p>
            <ul className="region-results">
                {shown.map((commune) => (
                    <li key={commune.code}>
                        <strong>{commune.name}</strong>
                        <span className="department">{departmentNames[commune.department]} ({commune.department})</span>
                        {commune.former.length > 0 && <p className="hint">Avec {commune.former.join(", ")}.</p>}
                        <p>{zoneLineOf(commune)}</p>
                        <div className="commune-actions">
                            <CommuneChecks code={commune.code} reach={{ capped: capped.includes(commune.code), tense: commune.tensePart === 1 }} base="../" className="commune-links" />
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function countOf(typed: string, count: number): string
{
    if (typed.trim() === "")
    {
        return "Saisissez le nom de la commune ou son code Insee.";
    }

    if (count === 0)
    {
        return "Aucune commune d'Île-de-France ne porte ce nom ou ce code. Le code Insee n'est pas le code postal.";
    }

    if (count > shownAtMost)
    {
        return `${count} communes : les ${shownAtMost} premières. Précisez votre recherche.`;
    }

    return count === 1 ? "1 commune" : `${count} communes`;
}
