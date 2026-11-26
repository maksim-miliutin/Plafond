import type { DepartmentCount } from "../lib/region";

// Under the map of the Grand Paris: the rest of Île-de-France, by name or by department, on the page of the region.
export function RegionAsk({ departments }: { departments: readonly DepartmentCount[] })
{
    const total = departments.reduce((sum, department) => sum + department.count, 0);

    return (
        <section className="region-ask" aria-labelledby="region-ask">
            <h2 id="region-ask">Votre commune n'est pas sur la carte&nbsp;?</h2>
            <p>
                La carte montre le Grand Paris. Les {total.toLocaleString("fr-FR")} communes d'Île-de-France sont toutes sur Plafond, chacune avec
                sa zone et ses vérifications.
            </p>
            <form action="ile-de-france/" method="get" role="search">
                <label htmlFor="region-q" className="label">Votre commune en Île-de-France</label>
                <div className="region-row">
                    <input id="region-q" name="q" type="search" className="field" autoComplete="address-level2" />
                    <button type="submit" className="primary">Chercher</button>
                </div>
            </form>
            <ul className="department-links" aria-label="Les communes par département">
                {departments.map((department) => (
                    <li key={department.code}>
                        <a href={`ile-de-france/?departement=${department.code}`}>
                            <strong>{department.name} ({department.code})</strong>
                            <span>{department.count === 1 ? "1 commune" : `${department.count} communes`}</span>
                        </a>
                    </li>
                ))}
            </ul>
        </section>
    );
}
