import { ordinal } from "@plafond/domain";

export function DistrictLinks({ districts }: { districts: readonly { slug: string; number: number }[] })
{
    return (
        <section className="findings">
            <h2>Les loyers de référence par arrondissement</h2>
            <ul className="references districts">
                {districts.map((district) => (
                    <li key={district.slug}><a href={`../../arrondissements/${district.slug}/`}>{ordinal(district.number)} arrondissement</a></li>
                ))}
            </ul>
        </section>
    );
}
