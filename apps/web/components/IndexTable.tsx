import { frenchDay, indexPoints, ordinal } from "@plafond/domain";

import type { RentIndex } from "@plafond/import";

// Three years of quarters: enough for any revision a tenant can still contest.
const shown = 12;

export function IndexTable({ index }: { index: RentIndex })
{
    return (
        <section className="findings">
            <h2>L'indice de référence des loyers, trimestre par trimestre</h2>
            <div className="grid-wrap">
                <table className="caps">
                    <caption>France hexagonale</caption>
                    <thead>
                        <tr>
                            <th scope="col">Trimestre</th>
                            <th scope="col">Indice</th>
                            <th scope="col">Publié le</th>
                        </tr>
                    </thead>
                    <tbody>
                        {index.rows.slice(-shown).reverse().map((row) => (
                            <tr key={`${row.year}-${row.quarter}`}>
                                <th scope="row">{ordinal(row.quarter)} trimestre {row.year}</th>
                                <td>{indexPoints(row.value)}</td>
                                <td>{frenchDay(row.publishedOn)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <p className="hint"><a href={index.source}>Tableau de l'IRL publié par l'ANIL</a></p>
        </section>
    );
}
