import { arrondissementOf, ordinal } from "@plafond/domain";
import type { Point, Quartier } from "@plafond/domain";

import { drawing } from "../lib/map";

export interface QuartierProps
{
    quartier: Quartier;
    around: readonly Quartier[];
    address: string;
    point: Point;
}

const frame = { width: 382, height: 300 };

export function QuartierStep({ quartier, around, address, point }: QuartierProps)
{
    const map = drawing(quartier, around, point, frame);

    return (
        <main className="screen">
            <p className="step">Votre logement se trouve dans le quartier</p>
            <h1 className="plaque">
                <span className="plaque-arr">{ordinal(arrondissementOf(quartier.number))} arrondissement</span>
                <span className="plaque-name">{quartier.name}</span>
            </h1>
            <svg
                className="map"
                viewBox={`0 0 ${frame.width} ${frame.height}`}
                role="img"
                aria-label={`Plan du quartier ${quartier.name} avec l'adresse trouvée`}
            >
                {map.paths.map((path) => (
                    <path key={path.number} d={path.d} className={path.own ? "own" : "around"} fillRule="evenodd" />
                ))}
                <circle cx={map.pin.x} cy={map.pin.y} r="7" className="pin" />
            </svg>
            <dl className="found">
                <dt>Adresse trouvée</dt>
                <dd>{address}</dd>
            </dl>
            <div className="grow" />
            <div className="stack">
                <button type="button" className="primary">C'est bien ça</button>
                <button type="button" className="secondary">Corriger l'adresse</button>
            </div>
            <p className="fine">Les limites des quartiers viennent du plan officiel de la Ville de Paris.</p>
        </main>
    );
}
