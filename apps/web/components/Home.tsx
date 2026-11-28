import { cityCopy } from "../lib/city-copy";
import type { Drawing } from "../lib/home-map";
import { Brand } from "./Brand";
import { CheckLinks } from "./Checks";
import type { DepartmentCount } from "../lib/region";
import { HomeMap, type MapName } from "./HomeMap";
import { RegionAsk } from "./RegionAsk";

export function Home({ maps, departments = [] }: { maps: Record<MapName, Drawing>; departments?: readonly DepartmentCount[] })
{
    return (
        <main className="screen home">
            <Brand />
            <p className="lead">
                Sept vérifications gratuites pour les locataires. Quand votre cas le justifie, Plafond prépare la lettre au propriétaire ou à l'agence.
            </p>
            <h1 className="title">Où se trouve votre logement ?</h1>
            <HomeMap maps={maps} />
            {departments.length > 0 && <RegionAsk departments={departments} />}
            {/* A commune on the map is picked with a pointer only, and a crawler finds no link in it: the city pages and the
                rest of France stay one plain link away. */}
            <nav className="elsewhere" aria-label="Villes">
                Sans passer par la carte&nbsp;: <a href="paris/">{cityCopy.paris.name}</a>, <a href="lyon/">{cityCopy.lyon.name}</a>{" "}
                ou <a href="ailleurs/">une autre ville en&nbsp;France</a>.
            </nav>
            <section className="findings" aria-labelledby="home-checks">
                <h2 id="home-checks">Les sept vérifications</h2>
                <CheckLinks base="" rentReach="À Paris, Lyon, Villeurbanne, Est Ensemble et Plaine Commune." />
            </section>
            <div className="grow" />
            <p className="fine">
                Le calcul se fait sur votre appareil, sans compte. Une estimation, pas un conseil juridique.{" "}
                <a href="mentions/">Mentions légales</a>
            </p>
        </main>
    );
}
