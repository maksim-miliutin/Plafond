"use client";

import { useState, type MouseEvent } from "react";

import type { FeeZone } from "@plafond/domain";

import { communeActions } from "../lib/commune-actions";
import type { Drawing, Label, Shape } from "../lib/home-map";

export type MapName = "grand-paris" | "lyon";

const tabs: Record<MapName, { title: string; label: string; hint: string }> = {
    "grand-paris": {
        title: "Grand Paris",
        label: "Plan du Grand Paris : Paris par arrondissement, Est Ensemble, Plaine Commune et les autres communes de la Métropole",
        hint: "Touchez votre arrondissement ou votre commune sur le plan pour savoir ce que Plafond y vérifie.",
    },
    lyon: {
        title: "Lyon et Villeurbanne",
        label: "Plan de Lyon par arrondissement, de Villeurbanne et des communes voisines",
        hint: "Touchez votre arrondissement, Villeurbanne ou votre commune sur le plan pour savoir ce que Plafond y vérifie.",
    },
};

const legends: Record<MapName, { group: Shape["group"]; text: string }[]> = {
    "grand-paris": [
        { group: "paris", text: "Paris, loyer encadré" },
        { group: "est-ensemble", text: "Est Ensemble, loyer encadré" },
        { group: "plaine-commune", text: "Plaine Commune, loyer encadré" },
        { group: "plain", text: "Sans loyer de référence" },
    ],
    lyon: [
        { group: "lyon", text: "Lyon, loyer encadré" },
        { group: "villeurbanne", text: "Villeurbanne, loyer encadré" },
        { group: "plain", text: "Sans loyer de référence" },
    ],
};

const cappedText: Record<Exclude<Shape["group"], "plain">, string> = {
    paris: "Le loyer est encadré dans tout Paris. Plafond vérifie s'il dépasse le plafond légal de votre quartier.",
    "est-ensemble": "Le loyer est encadré dans les communes d'Est Ensemble. Plafond vérifie s'il dépasse le plafond légal de votre secteur.",
    "plaine-commune": "Le loyer est encadré dans les communes de Plaine Commune. Plafond vérifie s'il dépasse le plafond légal de votre secteur.",
    lyon: "Le loyer est encadré à Lyon et à Villeurbanne. Plafond vérifie s'il dépasse le plafond légal de votre zone.",
    villeurbanne: "Le loyer est encadré à Lyon et à Villeurbanne. Plafond vérifie s'il dépasse le plafond légal de votre zone.",
};

const pageOf: Record<Exclude<Shape["group"], "plain">, (name: string) => string> = {
    paris: (name) => `Les loyers de référence de ${name}`,
    "est-ensemble": () => "La page d'Est Ensemble",
    "plaine-commune": () => "La page de Plaine Commune",
    lyon: (name) => `Les loyers de référence de ${name}`,
    villeurbanne: () => "Les loyers de référence de Villeurbanne",
};

// What a tenant meets there without reference rents: the notice of an empty dwelling and the cap on agency fees.
export const zoneSentences: Record<FeeZone, string> = {
    "very-tense": "Zone très tendue : le préavis d'un logement vide est d'un mois, et les frais d'agence suivent le plafond le plus élevé.",
    tense: "Zone tendue : le préavis d'un logement vide est d'un mois, et les frais d'agence suivent le plafond de la zone tendue.",
    other: "Hors zone tendue : le préavis d'un logement vide est de trois mois, et les frais d'agence suivent le plafond le plus bas.",
};

export function HomeMap({ maps }: { maps: Record<MapName, Drawing> })
{
    const [shown, setShown] = useState<MapName>("grand-paris");
    const [picked, setPicked] = useState<number | null>(null);
    const drawing = maps[shown];
    const shape = picked === null ? undefined : drawing.shapes[picked];

    function show(name: MapName)
    {
        setShown(name);
        setPicked(null);
    }

    function pick(event: MouseEvent<SVGSVGElement>)
    {
        const target = (event.target as Element).closest("[data-shape]");
        if (target !== null)
        {
            setPicked(Number(target.getAttribute("data-shape")));
        }
    }

    return (
        <div className="home-map">
            <div role="tablist" aria-label="Choisir le plan" className="map-tabs">
                {(Object.keys(tabs) as MapName[]).map((name) => (
                    <button
                        key={name}
                        type="button"
                        role="tab"
                        id={`map-tab-${name}`}
                        aria-selected={shown === name}
                        aria-controls="map-panel"
                        onClick={() => show(name)}
                    >
                        {tabs[name].title}
                    </button>
                ))}
            </div>
            <div role="tabpanel" id="map-panel" aria-labelledby={`map-tab-${shown}`} className="map-panel">
                <svg role="img" aria-label={tabs[shown].label} viewBox={`0 0 ${drawing.width} ${drawing.height}`} onClick={pick}>
                    <defs>
                        <pattern id="hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                            <rect width="7" height="7" className="hatch-ground" />
                            <path d="M0 0V7" className="hatch-line" />
                        </pattern>
                    </defs>
                    {drawing.shapes.map((one, index) => (
                        <path key={index} d={one.d} data-shape={index} className={`shape ${one.group}${index === picked ? " picked" : ""}`}>
                            <title>{one.name}</title>
                        </path>
                    ))}
                    {drawing.borders !== "" && <path d={drawing.borders} className="borders" />}
                    {drawing.outline !== "" && <path d={drawing.outline} className="outline" />}
                    <path d={drawing.city} className="city" />
                    {drawing.labels.map((label) => <MapLabel key={label.text} label={label} />)}
                    {drawing.inset !== undefined && (
                        <g transform={`translate(${drawing.width - drawing.inset.width - 12},12)`} className="inset">
                            <rect x={-6} y={-6} width={drawing.inset.width + 12} height={drawing.inset.height + 12} rx={8} />
                            <path d={drawing.inset.regions} className="regions" />
                            <path d={drawing.inset.frame} className="frame" />
                        </g>
                    )}
                </svg>
                <ul className="map-key" aria-label="Légende">
                    {legends[shown].map((item) => <li key={item.group} className={item.group}>{item.text}</li>)}
                </ul>
                <div className="map-card" aria-live="polite">
                    {shape === undefined ? <p>{tabs[shown].hint}</p> : <Card shape={shape} />}
                </div>
                <p className="credit">
                    Contours des communes&nbsp;: <a href="https://www.data.gouv.fr/datasets/contours-administratifs">data.gouv.fr</a> (ODbL).
                    Zones&nbsp;: <a href="https://www.data.gouv.fr/datasets/liste-des-communes-selon-le-zonage-abc/">ministère du Logement</a> (Licence Ouverte).
                </p>
            </div>
        </div>
    );
}

function Card({ shape }: { shape: Shape })
{
    const capped = shape.group !== "plain";
    // A commune of the Grand Paris carries its code: the forms it leads to open with its zone filled in.
    const actions = shape.code === undefined
        ? (capped ? [{ href: "loyer/", label: "Vérifier le plafond du loyer" }] : [])
        : communeActions(shape.code, capped, "");

    return (
        <>
            <strong>{shape.name}</strong>
            {shape.code !== undefined && shape.zone !== "other" && <span className="zone-tag">Zone tendue</span>}
            <p>{shape.group === "plain" ? "Pas de loyer de référence dans cette commune. Les six autres vérifications s'appliquent." : cappedText[shape.group]}</p>
            {shape.zone !== undefined && <p>{zoneSentences[shape.zone]}</p>}
            {actions.length > 0 && (
                <ul className="map-actions">
                    {actions.map((action, index) => <li key={action.href}><a href={action.href} className={index === 0 ? "map-check" : undefined}>{action.label}</a></li>)}
                </ul>
            )}
            <p className="map-links">
                {shape.group === "plain"
                    ? <a href="ailleurs/">Les six vérifications</a>
                    : <a href={shape.page}>{pageOf[shape.group](shape.name)}</a>}
            </p>
        </>
    );
}

function MapLabel({ label }: { label: Label })
{
    if (label.kind === "territory")
    {
        const width = label.text.length * 10 + 22;
        return (
            <g className="tag" aria-hidden="true">
                <rect x={label.x - width / 2} y={label.y - 21} width={width} height={30} rx={5} />
                <text x={label.x} y={label.y}>{label.text}</text>
            </g>
        );
    }

    return <text x={label.x} y={label.y} className={label.kind} aria-hidden="true">{label.text}</text>;
}
