"use client";

import { useRef, useState, type MouseEvent } from "react";

import type { FeeZone } from "@plafond/domain";

import { CommuneChecks } from "./CommuneChecks";
import type { Drawing, Label, Shape } from "../lib/home-map";
import { regionMapFile } from "../lib/load";
import { framing, fullView, isFull, panned, zoomed, type View } from "../lib/map-view";
import { departmentNames } from "../lib/region";

export type MapName = "grand-paris" | "lyon";
type TabName = MapName | "ile-de-france";

const tabs: Record<TabName, { title: string; label: string; hint: string }> = {
    "grand-paris": {
        title: "Grand Paris",
        label: "Plan du Grand Paris : Paris par arrondissement, Est Ensemble, Plaine Commune et les autres communes de la Métropole",
        hint: "Touchez votre arrondissement ou votre commune sur le plan pour savoir ce que Plafond y vérifie.",
    },
    lyon: {
        title: "Lyon",
        label: "Plan de Lyon par arrondissement, de Villeurbanne et des communes voisines",
        hint: "Touchez votre arrondissement, Villeurbanne ou votre commune sur le plan pour savoir ce que Plafond y vérifie.",
    },
    "ile-de-france": {
        title: "Île-de-France",
        label: "Plan des 1 266 communes d'Île-de-France, par département",
        hint: "Touchez votre commune sur le plan : les 1 266 communes de la région y sont. Agrandissez avec le bouton Grand Paris ou +, puis faites glisser le plan.",
    },
};

const legends: Record<TabName, { group: Shape["group"] | "tinted"; text: string }[]> = {
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
    "ile-de-france": [
        { group: "paris", text: "Paris, loyer encadré" },
        { group: "est-ensemble", text: "Est Ensemble, loyer encadré" },
        { group: "plaine-commune", text: "Plaine Commune, loyer encadré" },
        { group: "tinted", text: "Zone tendue" },
        { group: "plain", text: "Hors zone tendue" },
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

// What a drag reads of a pointer event.
interface Pointer
{
    clientX: number;
    clientY: number;
    currentTarget: { clientWidth: number };
}

// The plan of the region weighs more than both others together: it is fetched the first time its tab is opened.
type Region = Drawing | "loading" | "failed" | null;

// Outside part 1 of the list the notice keeps three months, though part 2 or zone A bis still sets the fees' zone.
export function zoneSentenceOf(zone: FeeZone, tense: boolean): string
{
    if (tense || zone === "other")
    {
        return zoneSentences[zone];
    }

    return `Hors zone tendue pour le préavis : trois mois pour un logement vide, sauf autre motif. Les frais d'agence suivent le plafond de la zone ${zone === "very-tense" ? "très tendue" : "tendue"}.`;
}

export function HomeMap({ maps }: { maps: Record<MapName, Drawing> })
{
    const [shown, setShown] = useState<TabName>("grand-paris");
    const [picked, setPicked] = useState<number | null>(null);
    const [region, setRegion] = useState<Region>(null);
    const drawing = shown === "ile-de-france" ? (typeof region === "object" && region !== null ? region : undefined) : maps[shown];
    const shape = picked === null || drawing === undefined ? undefined : drawing.shapes[picked];
    // Only the plan of the region zooms: its small communes around Paris need it, the two city plans do not.
    const [view, setView] = useState<View | null>(null);
    const full = drawing === undefined ? null : fullView(drawing);
    const shownView = view !== null && full !== null && drawing?.focus !== undefined ? view : full;
    const close = shownView !== null && full !== null && !isFull(shownView, full);
    const drag = useRef<{ x: number; y: number; view: View; moved: boolean } | null>(null);
    const dragged = useRef(false);

    function zoom(next: (current: View, whole: View) => View)
    {
        if (full !== null)
        {
            setView(next(shownView ?? full, full));
        }
    }

    function grab(event: Pointer)
    {
        drag.current = close && shownView !== null ? { x: event.clientX, y: event.clientY, view: shownView, moved: false } : null;
    }

    function slide(event: Pointer)
    {
        const start = drag.current;
        if (start === null || full === null)
        {
            return;
        }

        const [dx, dy] = [event.clientX - start.x, event.clientY - start.y];
        start.moved ||= Math.hypot(dx, dy) > 6;
        if (start.moved)
        {
            const scale = start.view.w / event.currentTarget.clientWidth;
            setView(panned(start.view, full, -dx * scale, -dy * scale));
        }
    }

    function release()
    {
        dragged.current = drag.current?.moved ?? false;
        drag.current = null;
    }

    function show(name: TabName)
    {
        setShown(name);
        setPicked(null);
        setView(null);
        if (name === "ile-de-france" && (region === null || region === "failed"))
        {
            setRegion("loading");
            fetch(regionMapFile)
                .then((response) => (response.ok ? response.json() as Promise<Drawing> : Promise.reject(new Error(String(response.status)))))
                .then((loaded) => setRegion(loaded), () => setRegion("failed"));
        }
    }

    function pick(event: MouseEvent<SVGSVGElement>)
    {
        if (dragged.current)
        {
            dragged.current = false;
            return;
        }

        const target = (event.target as Element).closest("[data-shape]");
        if (target !== null)
        {
            setPicked(Number(target.getAttribute("data-shape")));
        }
    }

    return (
        <div className="home-map">
            <div role="tablist" aria-label="Choisir le plan" className="map-tabs">
                {(Object.keys(tabs) as TabName[]).map((name) => (
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
                {drawing === undefined && (
                    <p className="map-wait" aria-live="polite">
                        {region === "failed"
                            ? <>Le plan n'a pas pu se charger. <a href="ile-de-france/">Cherchez votre commune par son nom</a>.</>
                            : "Chargement du plan des 1 266 communes…"}
                    </p>
                )}
                {drawing?.focus !== undefined && full !== null && (
                    <div className="map-zoom" role="group" aria-label="Zoom du plan">
                        <button type="button" onClick={() => setView(framing(drawing.focus!, full))}>Grand Paris</button>
                        <button type="button" aria-label="Agrandir" onClick={() => zoom((current, whole) => zoomed(current, whole, 2))}>+</button>
                        <button type="button" aria-label="Réduire" disabled={!close} onClick={() => zoom((current, whole) => zoomed(current, whole, 0.5))}>−</button>
                        <button type="button" disabled={!close} onClick={() => setView(null)}>Toute la région</button>
                    </div>
                )}
                {drawing !== undefined && shownView !== null && <svg
                    role="img"
                    aria-label={tabs[shown].label}
                    viewBox={`${shownView.x} ${shownView.y} ${shownView.w} ${shownView.h}`}
                    className={close ? "zoomed" : undefined}
                    onClick={pick}
                    onPointerDown={grab}
                    onPointerMove={slide}
                    onPointerUp={release}
                    onPointerLeave={release}
                >
                    <defs>
                        <pattern id="hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                            <rect width="7" height="7" className="hatch-ground" />
                            <path d="M0 0V7" className="hatch-line" />
                        </pattern>
                    </defs>
                    {drawing.shapes.map((one, index) => (
                        <path key={index} d={one.d} data-shape={index} className={`shape ${one.group}${one.tinted === true ? " tinted" : ""}${index === picked ? " picked" : ""}`}>
                            <title>{one.name}</title>
                        </path>
                    ))}
                    {drawing.borders !== "" && <path d={drawing.borders} className="borders" />}
                    {drawing.outline !== "" && <path d={drawing.outline} className="outline" />}
                    <path d={drawing.city} className="city" />
                    {!close && drawing.labels.map((label) => <MapLabel key={label.text} label={label} />)}
                    {drawing.inset !== undefined && (
                        <g transform={`translate(${drawing.width - drawing.inset.width - 12},12)`} className="inset">
                            <rect x={-6} y={-6} width={drawing.inset.width + 12} height={drawing.inset.height + 12} rx={8} />
                            <path d={drawing.inset.regions} className="regions" />
                            <path d={drawing.inset.frame} className="frame" />
                        </g>
                    )}
                </svg>}
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

    return (
        <>
            <strong>{shape.name}</strong>
            {shape.department !== undefined && <span className="department">{departmentNames[shape.department]} ({shape.department})</span>}
            <p>{shape.group === "plain" ? "Pas de loyer de référence dans cette commune. Les six autres vérifications s'appliquent." : cappedText[shape.group]}</p>
            {shape.zone !== undefined && <p>{zoneSentenceOf(shape.zone, shape.tense ?? true)}</p>}
            {shape.code !== undefined
                ? <CommuneChecks code={shape.code} reach={{ capped, tense: shape.tense ?? false }} base="" className="map-actions" lead tag={false} />
                : capped && <ul className="map-actions"><li><a href="loyer/" className="map-check">Vérifier le plafond du loyer</a></li></ul>}
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
