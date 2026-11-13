import { dayBefore, euros, frenchDay, ordinal, periods, periodsOf, rooms } from "@plafond/domain";

import { districtSlug, type PlacePage } from "../lib/places";
import { Brand } from "./Brand";
import { RentGrid } from "./RentGrid";

const surface = 40;

export function QuartierPage({ place }: { place: PlacePage })
{
    const district = `${ordinal(place.arrondissement)} arrondissement`;
    const example = place.rents.find((rent) => rent.rooms === 2 && rent.period === "before-1946") ?? place.rents[0];

    return (
        <main className="screen guide">
            <a className="back" href="../../">Accueil</a>
            <Brand />
            <h1 className="title">Loyer de référence à {place.name}</h1>
            <p className="lead">
                Quartier n° {place.number}, {district} de Paris. Pour un bail signé du {frenchDay(place.decree.from)} au{" "}
                {frenchDay(dayBefore(place.decree.until))}, le loyer de base ne peut pas dépasser ces montants par mètre carré, hors
                charges&nbsp;: ce sont les loyers de référence majorés de l'arrêté préfectoral.
            </p>
            <a className="primary link-button" href="../../loyer/">Vérifier mon loyer</a>
            <a className="rule" href={`../../arrondissements/${districtSlug(place.arrondissement)}/`}>Les autres quartiers du {district}</a>
            <RentGrid caption="Logement loué vide" rents={place.rents} periods={periodsOf.paris} pick={(rent) => rent.empty} />
            <RentGrid caption="Logement loué meublé" rents={place.rents} periods={periodsOf.paris} pick={(rent) => rent.furnished} />
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
