import { arrondissementOf, ordinal } from "@plafond/domain";
import type { City } from "@plafond/domain";
import type { Point, Quartier } from "@plafond/domain";

import { drawing, planIgn } from "../lib/map";
import { Progress } from "./Progress";

export interface QuartierProps
{
    city?: City;
    quartier: Quartier;
    around: readonly Quartier[];
    address: string;
    point: Point;
    onConfirm?: () => void;
    onBack?: () => void;
}

const frame = { width: 382, height: 300 };

export function QuartierStep({ city = "paris", quartier, around, address, point, onConfirm, onBack }: QuartierProps)
{
    const map = drawing(quartier, around, point, frame);

    return (
        <main className="screen">
            <Progress at={2} of={4} label={city === "paris" ? "votre quartier" : "votre secteur"} />
            <p className="step">{city === "paris" ? "Votre logement se trouve dans le quartier" : "Votre logement se trouve à"}</p>
            <h1 className="plaque">
                {city === "paris" && <span className="plaque-arr">{ordinal(arrondissementOf(quartier.number))} arrondissement</span>}
                <span className="plaque-name">{quartier.name}</span>
            </h1>
            <svg
                className="map"
                viewBox={`0 0 ${frame.width} ${frame.height}`}
                role="img"
                aria-label={`Plan du quartier ${quartier.name} avec l'adresse trouvée`}
            >
                {map.tiles.map((tile) => (
                    <image
                        key={`${tile.z}/${tile.x}/${tile.y}`}
                        href={planIgn(tile)}
                        x={tile.left}
                        y={tile.top}
                        width={tile.size + 0.5}
                        height={tile.size + 0.5}
                    />
                ))}
                {map.paths.map((path) => (
                    <path key={path.number} d={path.d} className={path.own ? "own" : "around"} fillRule="evenodd" />
                ))}
                <circle cx={map.pin.x} cy={map.pin.y} r="7" className="pin" />
            </svg>
            <p className="credit">
                Fond de carte © <a href="https://www.ign.fr/">IGN</a>, Plan IGN
            </p>
            <dl className="found">
                <dt>Adresse trouvée</dt>
                <dd>{address}</dd>
            </dl>
            <div className="grow" />
            <div className="stack">
                <button type="button" className="primary" onClick={onConfirm}>C'est bien ça</button>
                <button type="button" className="secondary" onClick={onBack}>Corriger l'adresse</button>
            </div>
            <p className="fine">
                {city === "paris"
                    ? "Les limites des quartiers viennent du plan officiel de la Ville de Paris."
                    : "Les limites des secteurs viennent des données publiées par la Métropole de Lyon."}
            </p>
        </main>
    );
}
