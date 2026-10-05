import { dayBefore, euros, frenchDay, ordinal, periods, rooms } from "@plafond/domain";
import type { Period, Rooms } from "@plafond/domain";

import { districtSlug, type PlacePage, type Rent } from "../lib/places";
import { Brand } from "./Brand";

const sizes: readonly Rooms[] = [1, 2, 3, 4];
const ages: readonly Period[] = ["before-1946", "1946-1970", "1971-1990", "after-1990"];
const surface = 40;

export function QuartierPage({ place }: { place: PlacePage })
{
    const district = `${ordinal(place.arrondissement)} arrondissement`;
    const example = place.rents.find((rent) => rent.rooms === 2 && rent.period === "before-1946") ?? place.rents[0];

    return (
        <main className="screen guide">
            <a className="back" href="../../">Toutes les vérifications</a>
            <Brand />
            <h1 className="title">Loyer de référence à {place.name}</h1>
            <p className="lead">
                Quartier n° {place.number}, {district} de Paris. Pour un bail signé du {frenchDay(place.decree.from)} au{" "}
                {frenchDay(dayBefore(place.decree.until))}, le loyer de base ne peut pas dépasser ces montants par mètre carré, hors
                charges&nbsp;: ce sont les loyers de référence majorés de l'arrêté préfectoral.
            </p>
            <a className="primary link-button" href="../../loyer/">Vérifier mon loyer</a>
            <a className="rule" href={`../../arrondissements/${districtSlug(place.arrondissement)}/`}>Les autres quartiers du {district}</a>
            <Grid caption="Logement loué vide" rents={place.rents} pick={(rent) => rent.empty} />
            <Grid caption="Logement loué meublé" rents={place.rents} pick={(rent) => rent.furnished} />
            {example !== undefined && (
                <section className="findings">
                    <h2>Exemple</h2>
                    <p>
                        Un {rooms[example.rooms]} loué vide de {surface}&nbsp;m², construit {periods[example.period]}, ne peut pas être loué
                        plus de {euros(example.empty * surface)} par mois hors charges, sauf complément de loyer justifié.
                    </p>
                </section>
            )}
            <section className="findings">
                <h2>Sources</h2>
                <ul className="references">
                    <li><a href={place.decree.url}>{place.decree.title}</a></li>
                    <li><a href="http://www.referenceloyer.drihl.ile-de-france.developpement-durable.gouv.fr/">Carte officielle des loyers de référence (DRIHL)</a></li>
                </ul>
            </section>
            <p className="fine">Une information générale, pas un conseil juridique. <a href="../../mentions/">Mentions légales</a></p>
        </main>
    );
}

function Grid({ caption, rents, pick }: { caption: string; rents: readonly Rent[]; pick: (rent: Rent) => number })
{
    const cell = (size: Rooms, age: Period) => rents.find((rent) => rent.rooms === size && rent.period === age);

    return (
        <div className="grid-wrap">
            <table className="caps">
                <caption>{caption}, par m²</caption>
                <thead>
                    <tr>
                        <th scope="col">Construit</th>
                        {sizes.map((size) => <th key={size} scope="col">{rooms[size]}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {ages.map((age) => (
                        <tr key={age}>
                            <th scope="row">{periods[age]}</th>
                            {sizes.map((size) =>
                            {
                                const rent = cell(size, age);

                                return <td key={size}>{rent === undefined ? "" : euros(pick(rent))}</td>;
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
