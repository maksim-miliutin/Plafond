export interface Link
{
    text: string;
    href: string;
}

export interface Section
{
    heading: string;
    paragraphs: string[];
}

export interface GuideText
{
    slug: string;
    label: string;
    title: string;
    description: string;
    heading: string;
    intro: string;
    check: Link;
    sections: Section[];
    sources: Link[];
}

const adil: Link = { text: "Trouver l'ADIL de votre département", href: "https://www.anil.org/lanil-et-les-adil/votre-adil/" };
const conciliation: Link = { text: "Saisir la commission départementale de conciliation", href: "https://www.service-public.fr/particuliers/vosdroits/F1216" };

export const guides: readonly GuideText[] = [
    {
        slug: "depot-de-garantie",
        label: "Le dépôt de garantie",
        title: "Restitution du dépôt de garantie\u00A0: les règles | Plafond",
        description: "Un ou deux mois après la remise des clés, retenues justifiées, majoration de 10\u00A0% du loyer par mois de retard\u00A0: ce que dit la loi sur le dépôt de garantie.",
        heading: "Restitution du dépôt de garantie\u00A0: ce que dit la loi",
        intro: "Le dépôt de garantie versé à l'entrée dans le logement doit vous être rendu dans un délai fixé par la loi. Passé ce délai, le propriétaire vous doit une majoration.",
        check: { text: "Vérifier mon dépôt", href: "depot/" },
        sections: [
            {
                heading: "Combien le propriétaire peut-il demander\u00A0?",
                paragraphs: ["Le dépôt de garantie ne peut pas dépasser un mois de loyer hors charges pour un logement vide, et deux mois pour un logement meublé."],
            },
            {
                heading: "Dans quel délai doit-il être rendu\u00A0?",
                paragraphs: [
                    "Le délai court à partir de la remise des clés\u00A0: un mois si l'état des lieux de sortie est conforme à celui d'entrée, deux mois sinon.",
                ],
            },
            {
                heading: "Que peut-il retenir\u00A0?",
                paragraphs: [
                    "Le propriétaire peut déduire les sommes que vous lui devez encore, par exemple des réparations locatives, à condition de les justifier par des devis, des factures ou l'état des lieux.",
                ],
            },
            {
                heading: "Et en cas de retard\u00A0?",
                paragraphs: [
                    "Le dépôt restant dû est majoré de 10\u00A0% du loyer mensuel hors charges pour chaque période mensuelle commencée en retard. Cette majoration n'est pas due si le retard vient de ce que vous n'avez pas donné votre nouvelle adresse.",
                    "Exemple\u00A0: un loyer de 1\u202F200\u00A0€ hors charges, des clés rendues le 1er juillet, un état des lieux conforme. Le dépôt devait être rendu au plus tard le 1er août. Rendu le 2 septembre, il est majoré de deux périodes, soit 240\u00A0€.",
                ],
            },
            {
                heading: "Que faire\u00A0?",
                paragraphs: [
                    "Envoyez au propriétaire une lettre recommandée avec accusé de réception le mettant en demeure de restituer le dépôt et la majoration. Sans réponse, vous pouvez saisir gratuitement la commission départementale de conciliation, puis le juge.",
                ],
            },
        ],
        sources: [conciliation, adil],
    },
    {
        slug: "charges-recuperables",
        label: "Les charges récupérables",
        title: "Charges récupérables\u00A0: la liste et les erreurs | Plafond",
        description: "Ce que le propriétaire peut facturer au locataire selon le décret de 1987, ce qu'il ne peut pas, et comment contester une régularisation de charges.",
        heading: "Charges récupérables\u00A0: ce que le propriétaire peut vous facturer",
        intro: "Chaque année, le propriétaire compare les provisions versées avec les dépenses réelles. Il ne peut vous refacturer que les charges énumérées par le décret n° 87-713 du 26 août 1987, et cette liste est limitative.",
        check: { text: "Vérifier ma régularisation", href: "charges/" },
        sections: [
            {
                heading: "Ce qui peut vous être facturé",
                paragraphs: [
                    "L'eau froide et chaude, le chauffage collectif, l'électricité et le ménage des parties communes, l'entretien courant et les menues réparations de l'ascenseur, l'entretien des espaces verts, la taxe d'enlèvement des ordures ménagères.",
                ],
            },
            {
                heading: "Ce qui ne peut pas l'être",
                paragraphs: [
                    "Les honoraires du syndic et les frais de gestion, l'assurance de l'immeuble, la taxe foncière, les gros travaux et le ravalement, le remplacement d'équipements comme une chaudière, les frais d'avocat.",
                ],
            },
            {
                heading: "Le salaire du gardien",
                paragraphs: [
                    "75\u00A0% de son salaire peuvent vous être facturés s'il assure à la fois l'entretien des parties communes et l'élimination des déchets, 40\u00A0% s'il n'assure que l'une des deux tâches.",
                ],
            },
            {
                heading: "Vos droits lors de la régularisation",
                paragraphs: [
                    "Le propriétaire doit vous adresser un décompte par nature de charges un mois avant la régularisation, puis tenir les justificatifs à votre disposition pendant six mois.",
                    "Si la régularisation arrive après la fin de l'année civile qui suit l'année des charges, vous pouvez demander à payer le solde en douze mensualités.",
                ],
            },
            {
                heading: "Que faire\u00A0?",
                paragraphs: [
                    "Demandez par lettre recommandée le retrait des sommes non récupérables et le remboursement du trop-versé. Les sommes payées à tort peuvent être réclamées sur les trois dernières années.",
                ],
            },
        ],
        sources: [{ text: "Liste des charges récupérables (economie.gouv.fr)", href: "https://www.economie.gouv.fr/node/37790" }, conciliation, adil],
    },
    {
        slug: "encadrement-des-loyers-paris",
        label: "L'encadrement des loyers à Paris",
        title: "Encadrement des loyers à Paris\u00A0: les règles | Plafond",
        description: "Loyer de référence, plafond majoré, complément de loyer, trop-perçu\u00A0: comment fonctionne l'encadrement des loyers à Paris et comment vérifier le vôtre.",
        heading: "Encadrement des loyers à Paris\u00A0: comment vérifier votre loyer",
        intro: "À Paris, le loyer des logements loués en résidence principale, vides ou meublés, est encadré pour les baux signés depuis le 1er juillet 2019.",
        check: { text: "Vérifier mon loyer", href: "loyer/" },
        sections: [
            {
                heading: "Le plafond",
                paragraphs: [
                    "Chaque année, un arrêté du préfet fixe un loyer de référence par mètre carré selon le quartier, le nombre de pièces, l'époque de construction et le type de location. Le loyer de base ne peut pas dépasser le loyer de référence majoré, c'est-à-dire le loyer de référence augmenté de 20\u00A0%.",
                    "L'arrêté qui compte est celui en vigueur à la date de signature du bail.",
                ],
            },
            {
                heading: "Le complément de loyer",
                paragraphs: [
                    "Un complément peut s'ajouter au loyer de base pour un logement aux caractéristiques exceptionnelles, s'il est mentionné au bail. Il est interdit pour un logement classé F ou G au DPE dans les baux signés depuis le 18 août 2022.",
                    "Vous disposez de trois mois après la signature du bail pour le contester devant la commission départementale de conciliation.",
                ],
            },
            {
                heading: "Si votre loyer dépasse le plafond",
                paragraphs: [
                    "Vous pouvez demander au propriétaire de ramener le loyer au plafond et de vous rembourser le trop-perçu, dans la limite des trois dernières années. La Ville de Paris peut aussi infliger une amende administrative au propriétaire.",
                ],
            },
        ],
        sources: [{ text: "Carte officielle des loyers de référence (DRIHL)", href: "http://www.referenceloyer.drihl.ile-de-france.developpement-durable.gouv.fr/" }, conciliation, adil],
    },
    {
        slug: "dpe-passoire-thermique",
        label: "Le DPE et les passoires thermiques",
        title: "Passoire thermique\u00A0: ce que change le DPE | Plafond",
        description: "Gel des loyers des logements F et G, logements G indécents depuis 2025, complément de loyer interdit\u00A0: ce que le DPE change pour les locataires.",
        heading: "Passoire thermique\u00A0: ce que le DPE change pour votre loyer",
        intro: "Le diagnostic de performance énergétique classe chaque logement de A à G. Pour les logements classés F et G, la loi limite désormais le loyer et fixe un calendrier de décence.",
        check: { text: "Vérifier mon DPE", href: "dpe/" },
        sections: [
            {
                heading: "Le gel des loyers",
                paragraphs: [
                    "Depuis le 24 août 2022, le loyer d'un logement classé F ou G ne peut plus augmenter, ni en cours de bail ni lors d'un renouvellement, pour les baux signés ou renouvelés depuis cette date.",
                ],
            },
            {
                heading: "La décence",
                paragraphs: [
                    "Un logement classé G n'est plus considéré comme décent dans les baux signés ou renouvelés depuis le 1er janvier 2025. Suivront les logements classés F en 2028, puis E en 2034. Le locataire peut alors demander des travaux de mise en conformité.",
                ],
            },
            {
                heading: "Vérifier le DPE de votre logement",
                paragraphs: [
                    "Le DPE doit être annexé au bail. Il porte un numéro de 13 caractères attribué par l'ADEME, sans lequel il n'est pas valable, et son original se consulte sur l'observatoire de l'ADEME.",
                    "Depuis le 1er janvier 2026, le calcul est plus favorable aux logements chauffés à l'électricité\u00A0: une mise à jour peut changer la classe d'un DPE plus ancien.",
                ],
            },
        ],
        sources: [{ text: "Observatoire des DPE (ADEME)", href: "https://observatoire-dpe-audit.ademe.fr/" }, adil],
    },
    {
        slug: "preavis-de-depart",
        label: "Le préavis de départ",
        title: "Préavis de départ du locataire\u00A0: 1 ou 3 mois | Plafond",
        description: "Trois mois pour un logement vide, un mois en zone tendue, pour un meublé ou dans certains cas\u00A0: comment donner son préavis et quand il commence.",
        heading: "Préavis de départ\u00A0: combien de temps avant de quitter le logement\u00A0?",
        intro: "Le locataire peut quitter son logement à tout moment, à condition de prévenir le propriétaire et de respecter un délai de préavis.",
        check: { text: "Calculer mon préavis", href: "preavis/" },
        sections: [
            {
                heading: "La durée du préavis",
                paragraphs: [
                    "Pour un logement vide, le préavis est de trois mois. Il est réduit à un mois si le logement se trouve en zone tendue, comme Paris et les grandes agglomérations, ou en cas de mutation, de perte d'emploi, de nouvel emploi après une perte d'emploi, de raison de santé ou d'attribution d'un logement social.",
                    "Pour un logement meublé, le préavis est toujours d'un mois.",
                ],
            },
            {
                heading: "Comment le donner",
                paragraphs: [
                    "Par lettre recommandée avec accusé de réception, par acte de commissaire de justice ou par remise en main propre contre récépissé. Un simple e-mail ne suffit pas. Si vous demandez un préavis réduit, indiquez-en le motif et joignez le justificatif.",
                ],
            },
            {
                heading: "Quand il commence",
                paragraphs: [
                    "Le préavis court à partir du jour où le propriétaire reçoit la lettre, pas du jour où vous l'envoyez. Le loyer et les charges restent dus jusqu'à la fin du préavis, sauf si un nouveau locataire entre plus tôt avec l'accord du propriétaire.",
                ],
            },
            {
                heading: "Après le départ",
                paragraphs: [
                    "Le propriétaire doit vous rendre le dépôt de garantie dans un mois après la remise des clés si l'état des lieux de sortie est conforme à celui d'entrée, deux mois sinon. Pensez à lui donner votre nouvelle adresse.",
                ],
            },
        ],
        sources: [{ text: "Préavis du locataire (Service public)", href: "https://www.service-public.gouv.fr/particuliers/vosdroits/F1168" }, adil],
    },
    {
        slug: "revision-du-loyer",
        label: "La révision annuelle du loyer",
        title: "Révision du loyer et IRL\u00A0: règles et valeurs | Plafond",
        description: "Quand le propriétaire peut augmenter le loyer chaque année, comment l'indice de référence des loyers limite la hausse, et quand elle est interdite.",
        heading: "Révision annuelle du loyer\u00A0: ce que le propriétaire peut demander",
        intro: "En cours de bail, le loyer ne peut augmenter qu'une fois par an, et seulement si le bail le prévoit.",
        check: { text: "Vérifier ma hausse de loyer", href: "revision/" },
        sections: [
            {
                heading: "Une clause est nécessaire",
                paragraphs: [
                    "Le propriétaire ne peut réviser le loyer que si le bail contient une clause de révision. Sans cette clause, le loyer reste le même jusqu'au renouvellement du bail.",
                ],
            },
            {
                heading: "Une hausse plafonnée par l'indice",
                paragraphs: [
                    "La hausse ne peut pas dépasser la variation de l'indice de référence des loyers publié par l'Insee, entre le trimestre indiqué au bail et le même trimestre de l'année suivante.",
                ],
            },
            {
                heading: "Une demande dans l'année",
                paragraphs: [
                    "Le propriétaire dispose d'un an à partir de la date de révision prévue au bail pour la demander. Passé ce délai, il perd la hausse de l'année. Elle ne vaut que pour l'avenir, à partir de sa demande.",
                ],
            },
            {
                heading: "Une hausse interdite pour les logements F et G",
                paragraphs: [
                    "Depuis le 24 août 2022, le loyer d'un logement classé F ou G au DPE ne peut plus augmenter, ni en cours de bail ni lors d'un renouvellement, pour les baux signés ou renouvelés depuis cette date.",
                ],
            },
        ],
        sources: [adil],
    },
    {
        slug: "complement-de-loyer",
        label: "Le complément de loyer",
        title: "Complément de loyer à Paris\u00A0: le contester | Plafond",
        description: "Quand un complément de loyer peut s'ajouter au plafond à Paris, quand il est interdit, et comment le contester dans les trois mois après la signature.",
        heading: "Complément de loyer\u00A0: quand il est permis, comment le contester",
        intro: "Dans les villes où les loyers sont encadrés, le propriétaire peut ajouter au loyer de base un complément, à des conditions strictes.",
        check: { text: "Vérifier mon loyer", href: "loyer/" },
        sections: [
            {
                heading: "Les conditions",
                paragraphs: [
                    "Le complément doit correspondre à des caractéristiques de localisation ou de confort exceptionnelles par rapport aux logements du même quartier, et il doit être mentionné au bail avec son montant et ses raisons.",
                ],
            },
            {
                heading: "Les interdictions",
                paragraphs: [
                    "Depuis le 18 août 2022, aucun complément ne peut s'appliquer à un logement classé F ou G au DPE, ni à un logement qui présente certains défauts, comme des sanitaires sur le palier, des signes d'humidité ou des infiltrations.",
                ],
            },
            {
                heading: "Le contester",
                paragraphs: [
                    "Vous disposez de trois mois après la signature du bail pour contester le complément devant la commission départementale de conciliation. C'est gratuit, et c'est au propriétaire de démontrer les caractéristiques exceptionnelles du logement.",
                ],
            },
        ],
        sources: [conciliation, adil],
    },
    {
        slug: "encadrement-des-loyers-lyon",
        label: "L'encadrement des loyers à Lyon et Villeurbanne",
        title: "Encadrement des loyers à Lyon et Villeurbanne | Plafond",
        description: "Depuis novembre 2021, le loyer est plafonné à Lyon et Villeurbanne selon la zone, les pièces et l'époque\u00A0: les règles, l'arrêté annulé de 2023 et le recours.",
        heading: "Encadrement des loyers à Lyon et Villeurbanne\u00A0: comment vérifier votre loyer",
        intro: "À Lyon et à Villeurbanne, le loyer des logements loués en résidence principale, vides ou meublés, est encadré pour les baux signés depuis le 1er novembre 2021.",
        check: { text: "Vérifier mon loyer", href: "loyer/" },
        sections: [
            {
                heading: "Le plafond",
                paragraphs: [
                    "Chaque année, un arrêté du préfet du Rhône fixe un loyer de référence par mètre carré selon la zone, le nombre de pièces, l'époque de construction et le type de location. Le loyer de base ne peut pas dépasser le loyer de référence majoré, soit le loyer de référence augmenté de 20\u00A0%. Les arrêtés s'appliquent du 1er novembre au 31 octobre.",
                    "L'arrêté qui compte est celui en vigueur à la date de signature du bail. Les époques de construction vont jusqu'à «\u00A0après 2005\u00A0», et non «\u00A0après 1990\u00A0» comme à Paris.",
                ],
            },
            {
                heading: "L'arrêté de 2023 annulé",
                paragraphs: [
                    "Le 14 octobre 2025, le tribunal administratif de Lyon a annulé l'arrêté du 29 septembre 2023, qui s'appliquait aux baux signés entre le 1er novembre 2023 et le 31 octobre 2024, parce que sa carte ne permettait pas de situer précisément les zones. La préfecture a fait appel, et la portée de cette annulation pour les baux déjà signés n'est pas tranchée. Pour un bail de cette période, renseignez-vous auprès de l'ADIL du Rhône avant d'agir.",
                ],
            },
            {
                heading: "Si votre loyer dépasse le plafond",
                paragraphs: [
                    "Vous pouvez demander au propriétaire de ramener le loyer au plafond et de vous rembourser le trop-perçu, dans la limite des trois dernières années. Le préfet du Rhône peut aussi mettre le propriétaire en demeure et lui infliger une amende administrative.",
                ],
            },
        ],
        sources: [{ text: "Encadrement des loyers (préfecture du Rhône)", href: "https://www.rhone.gouv.fr/Actions-de-l-Etat/Amenagement-du-territoire-urbanisme-construction-logement/Logement/Encadrement-des-loyers" }, conciliation, adil],
    },
    {
        slug: "frais-d-agence",
        label: "Les frais d'agence",
        title: "Frais d'agence en location\u00A0: les plafonds | Plafond",
        description: "Ce qu'une agence peut facturer au locataire pour la visite, le dossier, le bail et l'état des lieux, selon la zone, et comment se faire rembourser.",
        heading: "Frais d'agence\u00A0: ce que l'agence peut facturer au locataire",
        intro: "Quand une agence loue un logement, ses honoraires sont à la charge du propriétaire, sauf quatre prestations partagées avec le locataire et plafonnées par m².",
        check: { text: "Vérifier mes frais d'agence", href: "frais-agence/" },
        sections: [
            {
                heading: "Ce que le locataire peut payer",
                paragraphs: [
                    "La visite du logement, la constitution du dossier, la rédaction du bail et l'état des lieux d'entrée. Tout le reste, comme la gestion locative, est à la charge du propriétaire.",
                    "Pour chacune de ces prestations, la part du locataire ne peut pas dépasser celle du propriétaire.",
                ],
            },
            {
                heading: "Un plafond par m² selon la zone",
                paragraphs: [
                    "La visite, le dossier et le bail ont ensemble un plafond par m² de surface habitable, qui dépend de la zone du logement. L'état des lieux d'entrée a son propre plafond, le même partout. Ces plafonds valent pour les baux, vides ou meublés, signés depuis le 15 septembre 2014, et peuvent être relevés selon l'indice de référence des loyers\u00A0: le tableau ci-dessous donne ceux de chaque période.",
                    "La zone très tendue réunit Paris et des communes proches, classées en zone A bis. La zone tendue regroupe les autres communes de la liste du décret n° 2013-392 du 10 mai 2013, dont Lyon, Marseille, Lille, Bordeaux et Toulouse. Le reste du territoire est hors zone tendue.",
                ],
            },
            {
                heading: "Se faire rembourser",
                paragraphs: [
                    "Écrivez à l'agence en recommandé avec accusé de réception pour demander le remboursement de ce qui dépasse le plafond, en vous appuyant sur la facture et sur le bail.",
                    "Le dépassement des plafonds peut aussi être signalé à la DGCCRF, qui peut infliger une amende administrative à l'agence.",
                ],
            },
        ],
        sources: [
            { text: "Décret n° 2014-890 du 1er août 2014 (Légifrance)", href: "https://www.legifrance.gouv.fr/loda/id/JORFTEXT000029337625/" },
            { text: "Arrêté du 17 juillet 2025 (Légifrance)", href: "https://www.legifrance.gouv.fr/loda/id/JORFTEXT000051949607/" },
            adil,
        ],
    },
];

export function guideFor(check: string): GuideText
{
    const found = guides.find((guide) => guide.check.href === check);
    if (found === undefined)
    {
        throw new GuideError(`no guide explains the check at "${check}"`);
    }

    return found;
}

export class GuideError extends Error
{
    constructor(problem: string)
    {
        super(`guides: ${problem}`);
        this.name = "GuideError";
    }
}

