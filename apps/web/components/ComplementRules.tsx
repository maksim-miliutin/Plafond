import { frenchDay, noComplementFrom } from "@plafond/domain";

import { rulings, type Ruling } from "../lib/rulings";
import { ComplementBars } from "./ComplementBars";

export function ComplementRules()
{
    return (
        <>
            <section className="findings">
                <h2>Ce qui exclut tout complément</h2>
                <ComplementBars signedOn={noComplementFrom} dpe="../../dpe/" />
            </section>
            <section className="findings" id="juges">
                <h2>Ce que les juges ont admis</h2>
                <p>
                    Le juge apprécie chaque logement au cas par cas, par comparaison avec les logements de la même catégorie du même
                    secteur&nbsp;: ces décisions sont des exemples, pas une règle générale.
                </p>
                <Verdicts held="accepted" />
            </section>
            <section className="findings">
                <h2>Ce que les juges ont écarté</h2>
                <Verdicts held="rejected" />
                <p>
                    Pour les services de l'État en Île-de-France (DRIHL), des travaux de rénovation ne suffisent pas, à eux seuls, à
                    justifier un complément.
                </p>
            </section>
        </>
    );
}

function Verdicts({ held }: { held: Ruling["held"] })
{
    return (
        <ul className="verdicts">
            {rulings.filter((ruling) => ruling.held === held).map((ruling) => (
                <li key={ruling.what}>
                    <span>{ruling.what}</span>
                    <span>{ruling.court}, {frenchDay(ruling.on)}, {ruling.number}</span>
                </li>
            ))}
        </ul>
    );
}
