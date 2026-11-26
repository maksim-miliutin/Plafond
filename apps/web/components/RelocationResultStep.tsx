import type { ReactNode } from "react";

import { dayBefore, euros, frenchDay, indexPoints, ordinal, undecentFrom } from "@plafond/domain";
import type { IndexRow, Relocation, RelocationCheck, RelocationField, RelocationPeriod } from "@plafond/domain";

export interface RelocationResultProps
{
    communeName: string;
    capped: boolean;
    lease: Relocation;
    firstAssumed: boolean;
    basisAssumed: boolean;
    check: RelocationCheck;
    onHelp?: () => void;
    onBack?: () => void;
}

const sources = {
    law: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000043977087/2026-01-15",
    vacancy: "https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000035318982/2026-08-06",
    index: "https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000035318984/2026-10-03",
    exceptions: "https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000035318986/2026-10-03",
};

const fieldNames: Record<RelocationField, string> = {
    lastRent: "le dernier loyer hors charges du locataire précédent",
    dpe: "la classe énergie (DPE) du logement",
    vacancy: "la durée pendant laquelle le logement est resté vide",
    revised: "si ce dernier loyer a été révisé dans les 12 mois avant votre bail",
    index: "l'indice de référence des loyers publié à la signature du bail",
};

export function RelocationResultStep({ communeName, capped, lease, firstAssumed, basisAssumed, check, onHelp, onBack }: RelocationResultProps)
{
    return (
        <main className="screen result">
            {onBack !== undefined && <button type="button" className="back" onClick={onBack}>Modifier les réponses</button>}
            <Finding lease={lease} check={check} communeName={communeName} />
            <section className="findings">
                {firstAssumed && check.kind !== "first-letting" && <p>Si c'est la première location du logement, cette règle ne s'applique pas.</p>}
                {basisAssumed && (check.kind === "kept" || check.kind === "indexed") && (
                    <p>Si le bail justifie la hausse par des travaux ou par un ancien loyer trop bas, le décret peut permettre davantage.</p>
                )}
                {capped && (
                    <p>
                        À {communeName}, le loyer est aussi plafonné par un loyer de référence&nbsp;: le loyer du bail doit respecter les deux limites.{" "}
                        <a href="../loyer/">Vérifier le plafond du loyer</a>
                    </p>
                )}
                <Source check={check} />
            </section>
            <div className="grow" />
            <div className="stack">
                {onHelp !== undefined && <button type="button" className="secondary" onClick={onHelp}>Trouver une aide gratuite</button>}
            </div>
            <p className="fine">Une estimation, pas un conseil juridique.</p>
        </main>
    );
}

function Finding({ lease, check, communeName }: { lease: Relocation; check: RelocationCheck; communeName: string })
{
    switch (check.kind)
    {
        case "first-letting":
            return (
                <>
                    <h1 className="title">Première location&nbsp;: pas de loyer précédent à comparer</h1>
                    <p className="lead">La règle de la relocation compare le loyer du bail à celui du locataire précédent&nbsp;; elle ne s'applique pas ici.</p>
                </>
            );

        case "no-rules":
            return (
                <>
                    <h1 className="title">Règles non disponibles pour cette date de bail</h1>
                    <p className="lead">Plafond connaît les règles des baux signés {check.periods.map(spanOf).join(", ")}.</p>
                </>
            );

        case "untense":
            return (
                <>
                    <h1 className="title">Hors champ de cette vérification</h1>
                    <p className="lead">
                        {communeName} n'est pas dans la zone tendue que vise le décret&nbsp;: il ne limite pas le loyer à la relocation.
                    </p>
                    <p>Un logement classé F ou G garde en revanche son dernier loyer partout en France. <a href="../dpe/">Vérifier le DPE du logement</a></p>
                </>
            );

        case "missing":
            return (
                <>
                    <h1 className="title">Données insuffisantes</h1>
                    <p className="lead">Pour conclure, il manque {fieldNames[check.field]}.</p>
                    {check.field === "dpe" && <p><a href="../dpe/">Retrouver le DPE du logement</a></p>}
                </>
            );

        case "vacant":
            return (
                <>
                    <h1 className="title">Hors champ de cette vérification</h1>
                    <p className="lead">
                        Le logement est resté vide plus de 18 mois&nbsp;: le décret ne limite pas le loyer du nouveau bail (
                        <a href={sources.vacancy} rel="noopener">article 2</a>).
                    </p>
                </>
            );

        case "special":
            return (
                <>
                    <h1 className="title">Cas particulier à vérifier</h1>
                    <p className="lead">
                        {check.basis === "works"
                            ? "Le bail justifie la hausse par des travaux d'amélioration. Le décret la permet dans une limite qui dépend de leur nature et de leur coût, que Plafond ne demande pas."
                            : "Le bail justifie la hausse par un ancien loyer manifestement sous-évalué. Le décret la permet dans une limite fixée d'après des loyers comparables du voisinage, que Plafond ne connaît pas."}
                    </p>
                    <p><a href={sources.exceptions} rel="noopener">Lire l'article 4 du décret</a></p>
                </>
            );

        case "frozen":
            return (
                <Capped lease={lease} allowed={check.allowed} excess={check.excess}>
                    <p>
                        Logement classé {check.dpe}&nbsp;: depuis le 24 août 2022, le loyer d'un nouveau bail ne peut pas dépasser le dernier loyer du
                        locataire précédent, sans révision ni hausse pour travaux (<a href={sources.law} rel="noopener">article 17 de la loi du 6 juillet 1989</a>).
                    </p>
                    {check.dpe === "G" && <p>Depuis le {frenchDay(undecentFrom("G")!)}, un logement classé G n'est plus décent pour un nouveau bail.</p>}
                    <p><a href="../dpe/">Vérifier le DPE du logement</a></p>
                </Capped>
            );

        case "kept":
            return (
                <Capped lease={lease} allowed={check.allowed} excess={check.excess}>
                    <p>
                        Le dernier loyer a été révisé dans les 12 mois avant votre bail&nbsp;: le nouveau loyer ne peut pas le dépasser (
                        <a href={sources.index} rel="noopener">article 3 du décret</a>).
                    </p>
                </Capped>
            );

        case "indexed":
            return (
                <Capped lease={lease} allowed={check.allowed} excess={check.excess}>
                    <p>
                        Le dernier loyer n'a pas été révisé dans les 12 mois avant votre bail&nbsp;: il peut suivre l'indice de référence des loyers (
                        <a href={sources.index} rel="noopener">article 3 du décret</a>).
                    </p>
                    <p>{named(check.to)}, publié le {frenchDay(check.to.publishedOn)}. {named(check.from)}.</p>
                    <p>{euros(lease.lastRent ?? 0)} × {indexPoints(check.to.value)} / {indexPoints(check.from.value)} = {euros(check.allowed)}.</p>
                </Capped>
            );
    }
}

function Capped({ lease, allowed, excess, children }: { lease: Relocation; allowed: number; excess: number; children: ReactNode })
{
    return (
        <>
            {excess > 0
                ? <h1 className="headline"><span className="amount">{euros(excess)}</span> de trop chaque mois</h1>
                : <h1 className="title">Aucun dépassement détecté pour cette vérification</h1>}
            <dl className="figures">
                <div className="figure">
                    <dt>Loyer du bail</dt>
                    <dd>{euros(lease.proposed)}</dd>
                </div>
                <div className="figure">
                    <dt>Loyer maximum</dt>
                    <dd className="cap">{euros(allowed)}</dd>
                </div>
            </dl>
            <section className="findings">{children}</section>
        </>
    );
}

function Source({ check }: { check: RelocationCheck })
{
    const period: RelocationPeriod | null = "period" in check ? check.period : null;

    return period === null ? null : <p className="fine">Source&nbsp;: <a href={period.url} rel="noopener">{period.title}</a></p>;
}

const spanOf = (period: RelocationPeriod) => `du ${frenchDay(period.from)} au ${frenchDay(dayBefore(period.until))}`;
const named = (row: IndexRow) => `Indice du ${ordinal(row.quarter)} trimestre ${row.year} : ${indexPoints(row.value)}`;
