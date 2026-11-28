import type { Metadata } from "next";

import { euros, frenchDay, ordinal } from "@plafond/domain";

import { guides } from "./guides";
import { districtSlug, type CommunePage, type DistrictPage, type PlacePage } from "./places";

export interface Page
{
    path: string;
    title: string;
    description: string;
    // A page shared on its own carries its author and the moment it first went live, which link previews show.
    published?: string;
}

export const author = {
    name: "Maksim Miliutin",
    github: "https://github.com/maksim-miliutin",
    linkedin: "https://www.linkedin.com/in/miliutin-maksim/",
};

export class SiteError extends Error
{
    constructor(problem: string)
    {
        super(`site: ${problem}`);
        this.name = "SiteError";
    }
}

export function siteFrom(given: string | undefined): string
{
    const address = (given ?? "http://localhost:3000").replace(/\/$/, "");

    return address.startsWith("http://localhost") ? address : address.replace(/^http:\/\//, "https://");
}

// Search engines and link previews want absolute addresses; the deploy passes the site's own, a local run its port.
export const siteUrl = siteFrom(process.env.NEXT_PUBLIC_SITE_URL);

export const pages: readonly Page[] = [
    {
        path: "",
        title: "Plafond\u00A0: vérifiez vos droits de locataire",
        description: "Sept vérifications gratuites pour locataires\u00A0: loyer encadré, hausse, DPE, dépôt, charges, préavis, frais d'agence, et la lettre quand votre cas la justifie.",
    },
    {
        path: "paris/",
        title: "Loyer encadré à Paris\u00A0: le plan de la zone | Plafond",
        description: "Le plan de Paris avec la limite de l'encadrement des loyers, les loyers de référence par arrondissement et la vérification de votre loyer.",
    },
    {
        path: "lyon/",
        title: "Loyer encadré à Lyon et Villeurbanne\u00A0: le plan | Plafond",
        description: "Le plan de Lyon et Villeurbanne avec les limites de l'encadrement des loyers, les loyers de référence par commune et la vérification de votre loyer.",
    },
    {
        path: "grand-paris/",
        title: "Encadrement des loyers dans le Grand Paris | Plafond",
        description: "Les 130 communes de la Métropole du Grand Paris\u00A0: où le loyer est plafonné, ce que Plafond vérifie et le simulateur officiel pour les autres.",
    },
    {
        path: "grand-paris/est-ensemble/",
        title: "Encadrement des loyers à Est Ensemble | Plafond",
        description: "Vérifiez gratuitement le plafond du loyer de base à Montreuil, Pantin et dans les neuf communes d'Est Ensemble, selon l'arrêté du préfet.",
    },
    {
        path: "grand-paris/plaine-commune/",
        title: "Encadrement des loyers à Plaine Commune | Plafond",
        description: "Calculez le plafond de votre loyer de base à Saint-Denis, Saint-Ouen-sur-Seine et dans les autres communes de Plaine Commune.",
    },
    {
        path: "loyer/",
        title: "Loyer encadré\u00A0: vérifiez le plafond du vôtre | Plafond",
        description: "Vérifiez si votre loyer respecte l'encadrement à Paris, Lyon, Villeurbanne, Est Ensemble et Plaine Commune, et préparez la lettre.",
    },
    {
        path: "dpe/",
        title: "DPE F ou G\u00A0: gel du loyer et décence | Plafond",
        description: "Retrouvez le DPE de votre logement et vérifiez si une hausse de loyer était permise et si un logement classé G est encore décent. Gratuit et sans compte.",
    },
    {
        path: "depot/",
        title: "Dépôt de garantie non rendu\u00A0: délai et pénalité | Plafond",
        description: "Calculez si votre dépôt de garantie a été rendu à temps et la majoration de 10 % du loyer par mois de retard, puis préparez la lettre au propriétaire.",
    },
    {
        path: "charges/",
        title: "Régularisation des charges\u00A0: est-elle juste\u00A0? | Plafond",
        description: "Vérifiez ligne par ligne si les charges réclamées sont récupérables selon le décret de 1987, et calculez ce que le propriétaire doit vous rembourser.",
    },
    {
        path: "preavis/",
        title: "Calculer la fin de mon préavis de départ | Plafond",
        description: "Calculez quand finit votre préavis, un ou trois mois selon le logement et votre situation, le loyer du dernier mois, et préparez la lettre de congé.",
        // The GitHub Pages deploy of 861c577, the first to serve this page, finished then; later deploys keep the date.
        published: "2026-11-10T18:02:32Z",
    },
    {
        path: "frais-agence/",
        title: "Frais d'agence\u00A0: dépassent-ils le plafond\u00A0? | Plafond",
        description: "Vérifiez si les honoraires de location facturés par l'agence dépassent le plafond légal par m² de votre zone, et préparez la lettre de remboursement.",
    },
    {
        path: "revision/",
        title: "Hausse de loyer annuelle\u00A0: vérifiez l'indice | Plafond",
        description: "Vérifiez si la révision annuelle de votre loyer respecte l'indice de référence des loyers et les délais, et préparez la lettre au propriétaire.",
    },
    {
        path: "ile-de-france/",
        title: "Votre commune en Île-de-France | Plafond",
        description: "Les 1 266 communes d'Île-de-France\u00A0: zone tendue ou non, préavis, frais d'agence et hausse du loyer à la relocation, commune par commune.",
    },
    {
        path: "relocation/",
        title: "Hausse du loyer à la relocation\u00A0: vérifiez-la | Plafond",
        description: "Dans le Grand Paris, vérifiez si le loyer de votre nouveau bail dépasse celui du locataire précédent révisé selon l'indice, ou le gel des logements F et G.",
    },
    {
        path: "ailleurs/",
        title: "Locataires ailleurs en France\u00A0: six vérifications | Plafond",
        description: "Hausse annuelle, DPE, dépôt de garantie, charges, préavis et frais d'agence\u00A0: six vérifications gratuites qui ne dépendent pas de votre ville.",
    },
    {
        path: "mentions/",
        title: "Mentions légales et données | Plafond",
        description: "Qui publie Plafond, qui l'héberge, et ce que deviennent vos données\u00A0: rien n'est enregistré, le calcul se fait sur votre appareil.",
    },
    ...guides.map((guide) => ({ path: `guides/${guide.slug}/`, title: guide.title, description: guide.description })),
];

export function placeMetadata(place: PlacePage): Metadata
{
    const district = place.arrondissement === 1 ? "1er" : `${ordinal(place.arrondissement)}`;
    const title = `Loyer de référence ${place.name} (${district})`;

    return described({
        path: `quartiers/${place.slug}/`,
        title: title.length <= 50 ? `${title} | Plafond` : title,
        description: `Loyers maximum au m² à ${place.name}, Paris ${district}, selon les pièces, l'époque et la location, pour les baux signés depuis le ${frenchDay(place.decree.from)}.`,
    });
}

export function districtMetadata(district: DistrictPage): Metadata
{
    const name = `${ordinal(district.number)} arrondissement`;

    return described({
        path: `arrondissements/${districtSlug(district.number)}/`,
        title: `Encadrement des loyers dans le ${name} | Plafond`,
        description: `Plafonds de loyer au m² dans les quatre quartiers du ${name} de Paris, de ${euros(district.lowest)} à ${euros(district.highest)}, et vérification gratuite de votre loyer.`,
    });
}

export function communeMetadata(commune: CommunePage): Metadata
{
    const short = commune.name.replace(/ Arrondissement$/, "");

    return described({
        path: `lyon/${commune.slug}/`,
        title: `Loyer de référence ${short} | Plafond`,
        description: `Loyers maximum au m² à ${short}, selon la zone, les pièces, l'époque et la location, pour les baux signés depuis le ${frenchDay(commune.decree.from)}.`,
    });
}

export function pageMetadata(path: string): Metadata
{
    const page = pages.find((known) => known.path === path);
    if (page === undefined)
    {
        throw new SiteError(`no page is described at "${path}"`);
    }

    return described(page);
}

function described(page: Page): Metadata
{
    const url = `${siteUrl}/${page.path}`;
    const image = { url: `${siteUrl}/og.png`, width: 1200, height: 630, alt: "Plafond\u00A0: vérifiez vos droits de locataire" };

    const shared = { locale: "fr_FR", siteName: "Plafond", url, title: page.title, description: page.description, images: [image] };

    return {
        title: page.title,
        description: page.description,
        alternates: { canonical: url },
        ...(page.published === undefined ? {} : { authors: [{ name: author.name }] }),
        openGraph: page.published === undefined ? { type: "website", ...shared } : { type: "article", publishedTime: page.published, ...shared },
        twitter: { card: "summary_large_image", title: page.title, description: page.description, images: [image.url] },
    };
}
