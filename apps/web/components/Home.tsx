import { cityCopy, type MappedCity } from "../lib/city-copy";
import type { Drawing } from "../lib/home-map";
import { Brand } from "./Brand";
import { CheckLinks } from "./Checks";
import { HomeMap, type MapName } from "./HomeMap";

export function Home({ shapes, maps }: { shapes: Record<MappedCity, string>; maps: Record<MapName, Drawing> })
{
    return (
        <main className="screen home">
            <Brand />
            <p className="lead">
                Sept vérifications gratuites pour les locataires. Quand votre cas le justifie, Plafond prépare la lettre au propriétaire ou à l'agence.
            </p>
            <h1 className="title">Où se trouve votre logement ?</h1>
            <HomeMap maps={maps} />
            <nav className="checks cities" aria-label="Villes">
                {(Object.keys(cityCopy) as MappedCity[]).map((city) => (
                    <a key={city} href={`${city}/`} className="check">
                        <span className="drawing">
                            <svg aria-hidden="true" viewBox="0 0 32 32" width="34" height="34">
                                <path d={shapes[city]} fillRule="evenodd" />
                            </svg>
                        </span>
                        <span className="words">
                            <strong>{cityCopy[city].name}</strong>
                            <span>{cityCopy[city].door}</span>
                        </span>
                    </a>
                ))}
            </nav>
            <p className="elsewhere">
                <a href="grand-paris/">Autre commune du Grand Paris</a>&nbsp;: où le loyer est plafonné autour de Paris.
            </p>
            <p className="elsewhere">
                <a href="ile-de-france/">Autre commune en Île-de-France</a>&nbsp;: la zone et les vérifications de chacune des 1&nbsp;266 communes.
            </p>
            <p className="elsewhere">
                <a href="ailleurs/">Autre ville en France</a>&nbsp;: les six vérifications qui valent partout.
            </p>
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
