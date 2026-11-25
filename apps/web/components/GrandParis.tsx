import type { MetropoleCommune } from "@plafond/import";

import type { CityMapArea } from "../lib/map";
import { applicability, grandParisMapLabel } from "../lib/metropole";
import { Brand } from "./Brand";
import { CityMap } from "./CityMap";
import { CommuneSearch } from "./CommuneSearch";

const metropole = "https://www.insee.fr/fr/metadonnees/geographie/intercommunalite/200054781-le-grand-paris";

export function GrandParis({ communes, areas }: { communes: readonly MetropoleCommune[]; areas: readonly CityMapArea[] })
{
    return (
        <main className="screen">
            <a className="back" href="../">Accueil</a>
            <Brand />
            <h1 className="title">Grand Paris</h1>
            <p className="lead">
                Dans la Métropole du Grand Paris, un arrêté du préfet plafonne le loyer à Paris et dans les communes d'Est Ensemble
                et de Plaine Commune. Cherchez votre commune pour savoir ce que Plafond peut vérifier.
            </p>
            <CommuneSearch communes={communes} />
            <section className="findings">
                <h2>Les territoires où Plafond vérifie le loyer</h2>
                <CityMap areas={areas} label={grandParisMapLabel} />
            </section>
            <section className="findings">
                <h2>Sans loyer de référence</h2>
                <p>
                    Ailleurs dans la Métropole, aucun loyer de référence ne s'applique. La hausse du loyer entre deux locataires peut
                    tout de même être limitée selon la commune&nbsp;: le simulateur officiel le dit commune par commune.
                </p>
                <ul className="references">
                    <li><a href={applicability}>Votre commune est-elle concernée par l'encadrement des loyers&nbsp;? (Service Public)</a></li>
                    <li><a href="../ailleurs/">Les six vérifications qui valent partout</a></li>
                </ul>
            </section>
            <p className="fine">
                Les {communes.length} communes de la Métropole selon l'<a href={metropole}>Insee</a>.
            </p>
            <div className="grow" />
            <p className="fine">
                Le calcul se fait sur votre appareil, sans compte. Une estimation, pas un conseil juridique.{" "}
                <a href="../mentions/">Mentions légales</a>
            </p>
        </main>
    );
}
