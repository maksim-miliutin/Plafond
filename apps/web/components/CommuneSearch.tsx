"use client";

import { useState } from "react";

import type { FeeZone } from "@plafond/domain";
import type { MetropoleCommune } from "@plafond/import";

import { communeActions } from "../lib/commune-actions";
import { checkedTerritories, isNumber, matching, reachOf, simulators, territoryNames, type Outer, type Reach } from "../lib/metropole";

export interface CommuneSearchProps
{
    communes: readonly MetropoleCommune[];
    checked?: readonly Outer[];
    zones?: Readonly<Record<string, FeeZone>>;  // by INSEE code: a commune with a zone offers the checks that read it
}

export function CommuneSearch({ communes, checked = checkedTerritories, zones = {} }: CommuneSearchProps)
{
    const [typed, setTyped] = useState("");
    const shown = matching(communes, typed);

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
            <p id="commune-count" className="hint" aria-live="polite">{isNumber(typed) ? "Saisissez le nom de la commune plutôt qu'un code." : countOf(shown.length)}</p>
            <ul className="references">
                {shown.map((commune) => (
                    <li key={commune.code}>
                        <strong>{commune.name}</strong>
                        {commune.former.length > 0 && <> (avec {commune.former.join(", ")})</>}
                        <span className="reach"><ReachText reach={reachOf(commune, checked)} /></span>
                        {zones[commune.code] !== undefined && (
                            <span className="commune-actions">
                                {zones[commune.code] !== "other" && <span className="zone-tag">Zone tendue</span>}
                                {communeActions(commune.code, false, "../").map((action) => <a key={action.href} href={action.href}>{action.label}</a>)}
                            </span>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}

function countOf(count: number): string
{
    if (count === 0)
    {
        return "Aucune commune de la Métropole du Grand Paris ne porte ce nom.";
    }

    return count === 1 ? "1 commune" : `${count} communes`;
}

function ReachText({ reach }: { reach: Reach })
{
    switch (reach.kind)
    {
        case "checked":
            return <>Loyer encadré&nbsp;: <a href="../loyer/">vérifier mon loyer</a></>;

        case "capped":
            return (
                <>
                    Loyer encadré par l'arrêté pour {territoryNames[reach.territory]}, que Plafond ne vérifie pas encore&nbsp;:{" "}
                    <a href={simulators[reach.territory]}>simulateur officiel</a>
                </>
            );

        case "uncapped":
            return <>Pas de loyer de référence&nbsp;: <a href="../ailleurs/">les six autres vérifications</a></>;
    }
}
