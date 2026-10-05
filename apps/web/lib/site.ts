import type { Metadata } from "next";

import { euros, frenchDay, ordinal } from "@plafond/domain";

import { guides } from "./guides";
import { districtSlug, type DistrictPage, type PlacePage } from "./places";

export interface Page
{
    path: string;
    title: string;
    description: string;
}

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
        description: "Quatre vérifications gratuites pour les locataires en France\u00A0: loyer encadré à Paris, DPE, dépôt de garantie et charges, avec la lettre au propriétaire.",
    },
    {
        path: "loyer/",
        title: "Votre loyer dépasse-t-il le plafond à Paris\u00A0? | Plafond",
        description: "Vérifiez si votre loyer respecte l'encadrement des loyers à Paris, calculez le trop-perçu depuis le début du bail et préparez la lettre au propriétaire.",
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

    return {
        title: page.title,
        description: page.description,
        alternates: { canonical: url },
        openGraph: { type: "website", locale: "fr_FR", siteName: "Plafond", url, title: page.title, description: page.description, images: [image] },
        twitter: { card: "summary_large_image", title: page.title, description: page.description, images: [image.url] },
    };
}
