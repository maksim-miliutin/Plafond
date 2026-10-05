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
];
