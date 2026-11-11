import { dayBefore, euros, feeZones, frenchDay } from "@plafond/domain";
import type { FeeCaps, FeeZone } from "@plafond/domain";

const zones: readonly FeeZone[] = ["very-tense", "tense", "other"];

export function FeeCapsTable({ caps }: { caps: readonly FeeCaps[] })
{
    return (
        <section className="findings">
            <h2>Les plafonds par m² de surface habitable</h2>
            {[...caps].reverse().map((row) => (
                <div key={row.from} className="grid-wrap">
                    <table className="caps">
                        <caption>Baux signés du {frenchDay(row.from)} au {frenchDay(dayBefore(row.until))}</caption>
                        <thead>
                            <tr>
                                <th scope="col">Logement situé</th>
                                <th scope="col">Visite, dossier et bail</th>
                                <th scope="col">État des lieux</th>
                            </tr>
                        </thead>
                        <tbody>
                            {zones.map((zone) => (
                                <tr key={zone}>
                                    <th scope="row">{feeZones[zone]}</th>
                                    <td>{euros(row.letting[zone])}</td>
                                    <td>{euros(row.inspection)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <p className="hint"><a href={row.url}>{row.title}</a></p>
                </div>
            ))}
        </section>
    );
}
