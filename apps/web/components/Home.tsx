import type { City } from "@plafond/domain";

import { cityCopy } from "../lib/city-copy";
import { Brand } from "./Brand";

export function Home({ shapes }: { shapes: Record<City, string> })
{
    return (
        <main className="screen">
            <Brand />
            <p className="lead">
                Sept vérifications gratuites pour les locataires. Chacune se termine par une lettre prête à envoyer au propriétaire.
            </p>
            <h1 className="title">Où se trouve votre logement ?</h1>
            <nav className="checks cities" aria-label="Villes">
                {(Object.keys(cityCopy) as City[]).map((city) => (
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
            <div className="grow" />
            <p className="fine">
                Le calcul se fait sur votre appareil, sans compte. Une estimation, pas un conseil juridique.{" "}
                <a href="mentions/">Mentions légales</a>
            </p>
        </main>
    );
}
