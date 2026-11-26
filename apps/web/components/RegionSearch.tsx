"use client";

import { useEffect, useMemo, useState } from "react";

import { departmentNames, regionMatching, unpackRegion, zoneLineOf } from "../lib/region";
import { CommuneChecks } from "./CommuneChecks";

const shownAtMost = 20;

// The communes of Île-de-France by name, former name or INSEE code, each with its department, its zones and its checks.
export function RegionSearch({ communes, capped }: { communes: string; capped: readonly string[] })
{
    const region = useMemo(() => unpackRegion(communes).sort((a, b) => a.name.localeCompare(b.name, "fr")), [communes]);
    const [typed, setTyped] = useState("");
    const [department, setDepartment] = useState("");
    const pool = department === "" ? region : region.filter((commune) => commune.department === department);
    const found = regionMatching(pool, typed);
    const shown = found.slice(0, shownAtMost);
    const browsing = typed.trim() === "" && department !== "";

    // The home sends a name or a department in the link; the page is built once, so the browser reads it.
    useEffect(() =>
    {
        const asked = new URLSearchParams(window.location.search);
        const name = asked.get("q");
        const code = asked.get("departement");
        if (name !== null)
        {
            setTyped(name.slice(0, 80));
        }

        if (code !== null && code in departmentNames)
        {
            setDepartment(code);
        }
    }, []);

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
            <label htmlFor="departement" className="label">Département</label>
            <select id="departement" className="field" value={department} onChange={(event) => setDepartment(event.target.value)}>
                <option value="">Tous les départements</option>
                {Object.entries(departmentNames).map(([code, name]) => <option key={code} value={code}>{name} ({code})</option>)}
            </select>
            <p id="commune-count" className="hint" aria-live="polite">
                {browsing ? `${pool.length} communes en ${departmentNames[department]} : touchez la vôtre ou tapez son nom.` : countOf(typed, found.length)}
            </p>
            {browsing && (
                <ul className="commune-index" aria-label={`Communes de ${departmentNames[department]}`}>
                    {pool.map((commune) => (
                        <li key={commune.code}>
                            <button type="button" onClick={() => setTyped(commune.name)}>{commune.name}</button>
                        </li>
                    ))}
                </ul>
            )}
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
