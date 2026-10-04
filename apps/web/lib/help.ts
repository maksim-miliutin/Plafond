export interface Way
{
    text: string;
    href: string;
}

export interface Helper
{
    name: string;
    does: string;
    reach: Way[];
}

export const helpers: Helper[] = [
    {
        name: "L'ADIL de votre département",
        does: "Des juristes conseillent gratuitement et de façon neutre sur toutes les questions de logement, par téléphone ou sur rendez-vous.",
        reach: [{ text: "Trouver son ADIL", href: "https://www.anil.org/lanil-et-les-adil/votre-adil/" }],
    },
    {
        name: "La commission départementale de conciliation",
        does: "Elle cherche gratuitement un accord entre locataire et propriétaire, sur le loyer comme sur la décence. Pour un litige de loyer, "
            + "elle doit être saisie avant le juge.",
        reach: [{ text: "Comment la saisir", href: "https://www.service-public.fr/particuliers/vosdroits/F1216" }],
    },
    {
        name: "Les associations de locataires",
        does: "La CNL, la CLCV, la CGL ou la CSF tiennent des permanences et peuvent accompagner une démarche auprès du propriétaire.",
        reach: [],
    },
];

export const parisRent: Helper = {
    name: "L'ADIL de Paris, pour l'encadrement des loyers",
    does: "Une ligne et une adresse réservées à l'encadrement des loyers, avec des rendez-vous auprès de juristes spécialisés.",
    reach: [
        { text: "01 42 79 50 49", href: "tel:+33142795049" },
        { text: "loyer.paris@adil75.org", href: "mailto:loyer.paris@adil75.org" },
    ],
};
