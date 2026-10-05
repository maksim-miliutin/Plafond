import { euros, ordinal } from "@plafond/domain";

import type { DistrictPage as District } from "../lib/places";
import { Brand } from "./Brand";

export function DistrictPage({ district }: { district: District })
{
    const name = `${ordinal(district.number)} arrondissement`;

    return (
        <main className="screen guide">
            <a className="back" href="../../">Toutes les vérifications</a>
            <Brand />
            <h1 className="title">Encadrement des loyers dans le {name}</h1>
            <p className="lead">
                Dans le {name} de Paris, le loyer de base au mètre carré ne peut pas dépasser de {euros(district.lowest)} à{" "}
                {euros(district.highest)} selon le quartier, le nombre de pièces, l'époque de construction et le type de location.
                Choisissez votre quartier pour voir le détail.
            </p>
            <ul className="listings">
                {district.quartiers.map((quartier) => (
                    <li key={quartier.slug}>
                        <a className="listing" href={`../../quartiers/${quartier.slug}/`}>
                            <span className="facts">
                                <strong>{quartier.name}</strong>
                                <span>Quartier n° {quartier.number}</span>
                            </span>
                        </a>
                    </li>
                ))}
            </ul>
            <a className="primary link-button" href="../../loyer/">Vérifier mon loyer</a>
            <p className="fine">Une information générale, pas un conseil juridique. <a href="../../mentions/">Mentions légales</a></p>
        </main>
    );
}
