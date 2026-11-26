import { Brand } from "./Brand";
import { RegionSearch } from "./RegionSearch";

const sources = {
    tense: "https://www.data.gouv.fr/datasets/liste-des-communes-selon-le-zonage-tlv-1/",
    abc: "https://www.data.gouv.fr/datasets/liste-des-communes-selon-le-zonage-abc/",
    licence: "https://www.etalab.gouv.fr/wp-content/uploads/2017/04/ETALAB-Licence-Ouverte-v2.0.pdf",
};

export function IleDeFrance({ communes, count, capped }: { communes: string; count: number; capped: readonly string[] })
{
    return (
        <main className="screen">
            <a className="back" href="../">Accueil</a>
            <Brand />
            <h1 className="title">Votre commune en Île-de-France</h1>
            <p className="lead">
                La zone de chacune des {count.toLocaleString("fr-FR")} communes de la région, et les vérifications qui s'y appliquent&nbsp;:
                préavis, frais d'agence, hausse du loyer à la relocation et, où un arrêté le fixe, plafond du loyer.
            </p>
            <RegionSearch communes={communes} capped={capped} />
            <p className="elsewhere"><a href="../grand-paris/">Le Grand Paris commune par commune</a></p>
            <div className="grow" />
            <p className="fine">
                Zonages <a href={sources.tense}>TLV</a> et <a href={sources.abc}>ABC</a> du ministère du Logement sur data.gouv.fr,{" "}
                <a href={sources.licence}>Licence Ouverte 2.0</a>. Une estimation, pas un conseil juridique.{" "}
                <a href="../mentions/">Mentions légales</a>
            </p>
        </main>
    );
}
