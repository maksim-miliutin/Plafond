"use client";

import "leaflet/dist/leaflet.css";

import { useEffect, useRef, useState } from "react";

import { deepest, planIgnTemplate, type CityMapArea } from "../lib/map";
import { territoryNames } from "../lib/metropole";

export function CityMap({ areas, label }: { areas: readonly CityMapArea[]; label: string })
{
    const box = useRef<HTMLDivElement>(null);
    const [failed, setFailed] = useState(false);
    const [blank, setBlank] = useState(false);
    const territories = areas.flatMap(({ territory }) => territory === undefined ? [] : [territory]);

    useEffect(() =>
    {
        let gone = false;
        let shown: import("leaflet").Map | null = null;

        import("leaflet")
            .then(({ default: leaflet }) =>
            {
                if (gone || box.current === null)
                {
                    return;
                }

                const map = leaflet.map(box.current, { zoomControl: false, attributionControl: false, scrollWheelZoom: false, zoomSnap: 0.25, minZoom: 10, maxZoom: deepest });
                shown = map;
                leaflet.control.zoom({ zoomInTitle: "Zoom avant", zoomOutTitle: "Zoom arrière" }).addTo(map);
                const tiles = leaflet.tileLayer(planIgnTemplate, { maxZoom: deepest }).addTo(map);
                let arrived = false;
                tiles.on("tileload", () =>
                {
                    arrived = true;
                });
                tiles.on("load", () => setBlank(!arrived));
                const zones = areas.map(({ rings, territory }) =>
                {
                    const points = rings.map((ring) => ring.map(([lon, lat]) => leaflet.latLng(lat, lon)));
                    const className = territory === undefined ? "zone" : `zone zone-${territory}`;
                    return leaflet.polygon(points, { className }).addTo(map);
                });
                const bounds = leaflet.featureGroup(zones).getBounds();
                map.fitBounds(bounds);
                map.setMaxBounds(bounds.pad(0.6));
                map.on("focus", () => map.scrollWheelZoom.enable());
                map.on("blur", () => map.scrollWheelZoom.disable());
            })
            .catch(() =>
            {
                shown?.remove();
                shown = null;
                if (!gone)
                {
                    setFailed(true);
                }
            });

        return () =>
        {
            gone = true;
            shown?.remove();
        };
    }, [areas]);

    return (
        <div className="city-block">
            {failed
                ? <p className="map-failed" role="status">Le plan n'a pas pu s'afficher. Rechargez la page, ou passez par la liste plus bas.</p>
                : <div ref={box} className="city-map" role="region" aria-label={label} />}
            {blank && (
                <p className="map-failed" role="status">
                    Le fond de plan IGN ne s'est pas chargé&nbsp;: seuls les contours s'affichent. Rechargez la page, ou passez par la
                    liste plus bas.
                </p>
            )}
            <p className="credit">
                Fond de carte © <a href="https://www.ign.fr/">IGN</a>, Plan IGN · Carte <a href="https://leafletjs.com/">Leaflet</a>
                {territories.length > 0 && (
                    <> · <a href="https://www.data.gouv.fr/datasets/contours-administratifs">Contours des communes</a> (ODbL)</>
                )}
            </p>
            {territories.length > 0 && (
                <ul className="map-legend" role="list" aria-label="Territoires de la carte">
                    {territories.map((territory) => (
                        <li key={territory} className={`zone-${territory}`}>
                            {territory === "paris"
                                ? <a href="../paris/">Paris</a>
                                : <a href={`../grand-paris/${territory}/`}>{territoryNames[territory]}</a>}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
