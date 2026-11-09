import { shortName } from "./LyonPage";

export function CommuneLinks({ communes }: { communes: readonly { slug: string; name: string }[] })
{
    return (
        <section className="findings">
            <h2>Les loyers de référence par commune</h2>
            <ul className="references districts">
                {communes.map((commune) => (
                    <li key={commune.slug}><a href={`../../lyon/${commune.slug}/`}>{shortName(commune.name)}</a></li>
                ))}
            </ul>
        </section>
    );
}
