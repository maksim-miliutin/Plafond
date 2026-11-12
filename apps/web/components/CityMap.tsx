"use client";

import "leaflet/dist/leaflet.css";

import { useEffect, useRef } from "react";

import type { Quartier } from "@plafond/domain";

import { deepest, planIgnTemplate } from "../lib/map";

export function CityMap({ outlines, label }: { outlines: readonly Quartier["rings"][]; label: string })
{
    const box = useRef<HTMLDivElement>(null);

    useEffect(() =>
    {
        let gone = false;
        let shown: import("leaflet").Map | null = null;

        void import("leaflet").then(({ default: leaflet }) =>
        {
            if (gone || box.current === null)
            {
                return;
            }

            const map = leaflet.map(box.current, { zoomControl: false, attributionControl: false, scrollWheelZoom: false, zoomSnap: 0.25, minZoom: 10, maxZoom: deepest });
            leaflet.control.zoom({ zoomInTitle: "Zoom avant", zoomOutTitle: "Zoom arrière" }).addTo(map);
            leaflet.tileLayer(planIgnTemplate, { maxZoom: deepest }).addTo(map);
            const zones = outlines.map((rings) => leaflet.polygon(rings.map((ring) => ring.map(([lon, lat]) => leaflet.latLng(lat, lon))), { className: "zone" }).addTo(map));
            const bounds = leaflet.featureGroup(zones).getBounds();
            map.fitBounds(bounds);
            map.setMaxBounds(bounds.pad(0.6));
            map.on("focus", () => map.scrollWheelZoom.enable());
            map.on("blur", () => map.scrollWheelZoom.disable());
            shown = map;
        });

        return () =>
        {
            gone = true;
            shown?.remove();
        };
    }, [outlines]);

    return <div ref={box} className="city-map" role="region" aria-label={label} />;
}
