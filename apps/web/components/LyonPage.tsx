import { dayBefore, frenchDay, periodsOf } from "@plafond/domain";

import type { CommunePage } from "../lib/places";
import { Brand } from "./Brand";
import { RentGrid } from "./RentGrid";

export function shortName(name: string): string
{
    return name.replace(/ Arrondissement$/, "");
}

export function LyonPage({ commune }: { commune: CommunePage })
{
    const zones = commune.zones.map((zone) => zone.zone).join(", ");

    return (
        <main className="screen guide">
            <a className="back" href="../../">Accueil</a>
            <Brand />
            <h1 className="title">Loyer de référence à {shortName(commune.name)}</h1>
            <p className="lead">
                Pour un bail signé du {frenchDay(commune.decree.from)} au {frenchDay(dayBefore(commune.decree.until))}, le loyer de
                base ne peut pas dépasser ces montants par mètre carré, hors charges. {shortName(commune.name)} s'étend sur{" "}
                {commune.zones.length === 1 ? `la zone ${zones}` : `les zones ${zones}`} de l'arrêté du préfet du Rhône&nbsp;: la zone
                dépend de l'adresse exacte, que Plafond retrouve pour vous.
            </p>
            <a className="primary link-button" href="../../loyer/">Vérifier mon loyer</a>
            {commune.zones.map((zone) => (
                <section key={zone.zone} className="findings">
                    <h2>Zone {zone.zone}</h2>
                    <RentGrid caption="Logement loué vide" rents={zone.rents} periods={periodsOf.lyon} pick={(rent) => rent.empty} />
                    <RentGrid caption="Logement loué meublé" rents={zone.rents} periods={periodsOf.lyon} pick={(rent) => rent.furnished} />
                </section>
            ))}
            <section className="findings">
                <h2>Sources</h2>
                <ul className="references">
                    <li><a href={commune.decree.url}>{commune.decree.title}</a></li>
                </ul>
            </section>
            <p className="fine">Une information générale, pas un conseil juridique. <a href="../../mentions/">Mentions légales</a></p>
        </main>
    );
}
