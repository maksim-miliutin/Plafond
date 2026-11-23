import { dayBefore, dwellings, euros, frenchDay, letting, periods, rooms, squareMetres, type Check, type Span } from "@plafond/domain";

import { stretchesOf, type TerritoryCommune } from "../lib/places";
import type { TerritoryCopy } from "../lib/territory-copy";
import { Brand } from "./Brand";

export interface TerritoryPageProps
{
    copy: TerritoryCopy;
    communes: readonly TerritoryCommune[];
    spans: readonly Span[];
    example: Check;
    simulator: string;
}

const complement = "https://www.service-public.gouv.fr/particuliers/vosdroits/F34401";

export function TerritoryPage({ copy, communes, spans, example, simulator }: TerritoryPageProps)
{
    const { rate, cap } = example;
    const worked = copy.example;
    const article = worked.dwelling === "house" ? "une" : "un";
    const built = worked.dwelling === "house" ? "construite" : "construit";

    return (
        <main className="screen guide">
            <a className="back" href="../">Grand Paris</a>
            <Brand />
            <h1 className="title">Encadrement des loyers à {copy.name}</h1>
            <p className="lead">{copy.lead}</p>
            <a className="primary link-button" href="../../loyer/">Vérifier mon loyer à {copy.name}</a>
            <section className="findings">
                <h2>Comment vérifier votre loyer</h2>
                <ol className="references">
                    <li>Saisissez l'adresse exacte du logement, avec son numéro de rue.</li>
                    <li>
                        Indiquez le type de logement, le nombre de pièces principales, l'époque de construction, si la location est vide ou
                        meublée, la surface habitable, le loyer de base et les dates du bail.
                    </li>
                    <li>Comparez le plafond mensuel au loyer de base de votre bail. Le résultat affiche le secteur, le loyer au m² et l'arrêté appliqué.</li>
                </ol>
                <p>Plafond vérifie les baux signés {stretchesOf(spans)}.</p>
            </section>
            <section className="findings">
                <h2>Un exemple</h2>
                <p>
                    Prenons {article} {dwellings[worked.dwelling]} de {rooms[worked.rooms]}, {letting(worked.furnished, worked.dwelling)},
                    de {squareMetres(worked.surface)}, {built} {periods[worked.period]}, avec un bail signé le {frenchDay(worked.signedOn)}. Le {worked.address}, à {worked.town}, est dans le secteur {worked.sector}. Pour ces
                    caractéristiques, le loyer de référence majoré est de <strong>{euros(rate.majored)} par m²</strong>, soit un plafond
                    de <strong>{euros(cap)} par mois hors charges</strong>. Les caractéristiques du logement servent d'exemple.{" "}
                    <a href={`${rate.decree.url}#page=${worked.page}`}>{rate.decree.title}, page {worked.page}</a>
                </p>
                <p>{copy.split}</p>
            </section>
            <section className="findings">
                <h2>Communes couvertes</h2>
                <ul className="references">
                    {communes.map((commune) => (
                        <li key={commune.name}>
                            {commune.name}, {commune.sectors.length === 1 ? `secteur ${commune.sectors[0]}` : `secteurs ${commune.sectors.join(" et ")}`}
                        </li>
                    ))}
                </ul>
            </section>
            <section className="findings">
                <h2>Comprendre votre résultat</h2>
                <p>
                    Le plafond s'applique au loyer de base hors charges. Un complément de loyer obéit à ses propres conditions. Pour un bail
                    signé après le dernier arrêté connu, Plafond le dit et renvoie à cet arrêté.
                </p>
                <ul className="references">
                    <li><a href={copy.help}>Le loyer d'un bail à {copy.name} (Service Public)</a></li>
                    <li><a href={simulator}>Le simulateur officiel de la DRIHL (Service Public)</a></li>
                    <li><a href={complement}>Les règles du complément de loyer (Service Public)</a></li>
                    <li>
                        <a href={rate.decree.url}>{rate.decree.title}</a>, applicable du {frenchDay(rate.decree.from)} au{" "}
                        {frenchDay(dayBefore(rate.decree.until))}
                    </li>
                </ul>
            </section>
            <p className="fine">Une information générale, pas un conseil juridique. <a href="../../mentions/">Mentions légales</a></p>
        </main>
    );
}
