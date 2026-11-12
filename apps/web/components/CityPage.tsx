import { frenchDay, type City, type Quartier, type Span } from "@plafond/domain";

import { cityCopy, territories } from "../lib/city-copy";
import { guides } from "../lib/guides";
import { Brand } from "./Brand";
import { CheckList } from "./Checks";
import { CityMap } from "./CityMap";

export interface CityPageProps
{
    city: City;
    outlines: readonly Quartier["rings"][];
    span: Span;
    links: readonly { href: string; label: string }[];
}

export function CityPage({ city, outlines, span, links }: CityPageProps)
{
    const copy = cityCopy[city];

    return (
        <main className="screen">
            <a className="back" href="../">Changer de ville</a>
            <Brand />
            <h1 className="title">{copy.name}</h1>
            <p className="lead">
                Plafond vérifie les baux signés du {frenchDay(span.from)} au {frenchDay(span.lastDay)}, {copy.within}
            </p>
            <div className="city-block">
                <CityMap outlines={outlines} label={copy.mapLabel} />
                <p className="credit">
                    Fond de carte © <a href="https://www.ign.fr/">IGN</a>, Plan IGN · Carte <a href="https://leafletjs.com/">Leaflet</a>
                </p>
            </div>
            <section className="findings">
                <h2>Que voulez-vous vérifier ?</h2>
                <CheckList base="../" rentReach={copy.rentReach} />
            </section>
            <section className="findings">
                <h2>{copy.linksTitle}</h2>
                <ul className="references districts">
                    {links.map((link) => <li key={link.href}><a href={link.href}>{link.label}</a></li>)}
                </ul>
            </section>
            <section className="findings">
                <h2>Comprendre vos droits</h2>
                <ul className="references">
                    {guides.filter((guide) => guide.slug !== copy.otherGuide).map((guide) => <li key={guide.slug}><a href={`../guides/${guide.slug}/`}>{guide.label}</a></li>)}
                </ul>
            </section>
            <p className="fine">
                {copy.neighbours} <a href={territories.href}>{territories.label}</a>
            </p>
            <div className="grow" />
            <p className="fine">
                Le calcul se fait sur votre appareil, sans compte. Une estimation, pas un conseil juridique.{" "}
                <a href="../mentions/">Mentions légales</a>
            </p>
        </main>
    );
}
