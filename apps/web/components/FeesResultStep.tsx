import { dayBefore, euros, feeZones, frenchDay, squareMetres } from "@plafond/domain";
import type { AgencyFees, FeesCheck, NoCaps } from "@plafond/domain";

export interface FeesResultProps
{
    paid: AgencyFees;
    check: FeesCheck | NoCaps;
    writable: boolean;
    onWrite?: () => void;
    onHelp?: () => void;
    onBack?: () => void;
}

export function FeesResultStep({ paid, check, writable, onWrite, onHelp, onBack }: FeesResultProps)
{
    return (
        <main className="screen result">
            {onBack !== undefined && <button type="button" className="back" onClick={onBack}>Modifier les réponses</button>}
            {check.kind === "no-caps" ? <Uncapped check={check} /> : <Capped paid={paid} check={check} />}
            <div className="grow" />
            <div className="stack">
                {writable && <button type="button" className="primary" onClick={onWrite}>Préparer la lettre à l'agence</button>}
                {onHelp !== undefined && <button type="button" className="secondary" onClick={onHelp}>Trouver une aide gratuite</button>}
            </div>
            <p className="fine">Une estimation, pas un conseil juridique.</p>
        </main>
    );
}

function Uncapped({ check }: { check: NoCaps })
{
    return (
        <>
            <h1 className="title">Pas de plafond connu pour ce bail</h1>
            <p className="lead">
                {check.side === "before"
                    ? `Les honoraires facturés au locataire ne sont plafonnés que pour les baux signés à partir du ${frenchDay(check.from)}.`
                    : `Plafond connaît les plafonds jusqu'au ${frenchDay(dayBefore(check.until))}. Ceux qui s'appliquent ensuite n'y sont pas encore repris.`}
            </p>
        </>
    );
}

function Capped({ paid, check }: { paid: AgencyFees; check: FeesCheck })
{
    return (
        <>
            {check.excess > 0
                ? <h1 className="headline"><span className="amount">{euros(check.excess)}</span> au-delà du plafond</h1>
                : <h1 className="title">Les honoraires respectent le plafond</h1>}
            <dl className="figures">
                <div className="figure">
                    <dt>Facturé par l'agence</dt>
                    <dd>{euros(paid.letting + paid.inspection)}</dd>
                </div>
                <div className="figure">
                    <dt>Plafond visite, dossier et bail</dt>
                    <dd>{euros(check.lettingCap)}</dd>
                </div>
                <div className="figure">
                    <dt>Plafond état des lieux</dt>
                    <dd>{euros(check.inspectionCap)}</dd>
                </div>
            </dl>
            <section className="findings">
                <p>
                    Plafonds retenus&nbsp;: {euros(check.caps.letting[check.zone])} par m² {feeZones[check.zone]} et {euros(check.caps.inspection)} par
                    m² pour l'état des lieux, pour {squareMetres(paid.surface)} (<a href={check.caps.url}>{check.caps.title}</a>).
                </p>
                {check.assumed && (
                    <p>
                        Faute de zone, Plafond retient le plafond le plus haut, celui de la zone très tendue. Si le logement est ailleurs, le
                        plafond est plus bas et le trop-perçu plus grand.
                    </p>
                )}
                <p>La part du locataire ne peut pas non plus dépasser celle du propriétaire.</p>
            </section>
        </>
    );
}
