import { freezeFrom, frenchDay, undecentFrom } from "@plafond/domain";
import type { Day, DecencyFinding, IncreaseFinding, Label } from "@plafond/domain";
import type { Listing } from "@plafond/ademe";

import { LabelBadge } from "./LabelBadge";

export interface DpeResultProps
{
    listing: Listing;
    raisedOn: Day | null;
    decency: DecencyFinding;
    increase: IncreaseFinding | null;
    writable: boolean;
    onWrite?: () => void;
    onBack?: () => void;
}

// The formula of 1 January 2026 counts electricity lower; an F or G rated before it may come out better once updated.
const reform: Day = "2026-01-01";

export function DpeResultStep({ listing, raisedOn, decency, increase, writable, onWrite, onBack }: DpeResultProps)
{
    const { dpe } = listing;
    const updatable = listing.electric && dpe.establishedOn < reform && (dpe.label === "F" || dpe.label === "G");

    return (
        <main className="screen result">
            {onBack !== undefined && <button type="button" className="back" onClick={onBack}>Modifier le bail</button>}
            <h1 className="headline-dpe">
                <LabelBadge label={dpe.label} />
                <span>Logement classé {dpe.label}</span>
            </h1>
            <p className="lead">
                DPE n° {dpe.number}, établi le {frenchDay(dpe.establishedOn)}, valable jusqu'au {frenchDay(dpe.validUntil)}.
            </p>
            <section className="findings">
                <h2>Ce que cela change pour vous</h2>
                {increase !== null && raisedOn !== null && <p>{risen(increase, raisedOn, dpe.label)}</p>}
                <p>{decent(decency, dpe.label)}</p>
                {updatable && (
                    <p>
                        Ce DPE date d'avant le {frenchDay(reform)}. Le calcul a changé depuis en faveur des logements chauffés à
                        l'électricité, et une mise à jour gratuite du DPE peut améliorer la classe.
                    </p>
                )}
            </section>
            <div className="grow" />
            <div className="stack">
                {writable && <button type="button" className="primary" onClick={onWrite}>Préparer la lettre au propriétaire</button>}
            </div>
            <p className="fine">Une estimation, pas un conseil juridique.</p>
        </main>
    );
}

function risen(finding: IncreaseFinding, raisedOn: Day, label: Label): string
{
    const rise = `L'augmentation du ${frenchDay(raisedOn)}`;
    const freeze = frenchDay(freezeFrom);

    switch (finding.kind)
    {
        case "forbidden":
            return `${rise} n'était pas permise : le loyer d'un logement classé ${label} ne peut plus augmenter dans un bail `
                + `signé ou renouvelé depuis le ${freeze}, et votre bail en cours a commencé le ${frenchDay(finding.since)}.`;

        case "unknown":
            return `Ce DPE a été établi après l'augmentation du ${frenchDay(raisedOn)} : il ne dit pas quelle était la classe du logement à ce moment-là.`;

        case "allowed":
            return finding.reason === "label"
                ? `${rise} était permise : le gel ne concerne que les logements classés F ou G.`
                : finding.reason === "before-freeze"
                    ? `${rise} était permise : elle précède le gel du ${freeze}.`
                    : `${rise} était permise : votre bail en cours a commencé avant le ${freeze}, et le gel ne s'appliquera qu'à son renouvellement.`;
    }
}

function decent(finding: DecencyFinding, label: Label): string
{
    switch (finding.kind)
    {
        case "not-decent":
            return `Ce logement n'est plus décent : un logement classé ${label} ne l'est plus dans un bail signé ou renouvelé depuis `
                + `le ${frenchDay(undecentFrom(label) ?? finding.since)}, et votre bail en cours a commencé le ${frenchDay(finding.since)}. `
                + "Vous pouvez demander au propriétaire de faire des travaux.";

        case "from":
            return `Le critère énergétique de décence s'appliquera à votre bail à son renouvellement, le ${frenchDay(finding.on)}.`;

        case "decent":
            return "Le logement respecte le critère énergétique de décence.";
    }
}
