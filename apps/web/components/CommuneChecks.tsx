import { communeActions, type CommuneReach } from "../lib/commune-actions";

// The tag and the links every commune shows, on the map and in both searches.
export function CommuneChecks({ code, reach, base, className, lead = false }: { code: string; reach: CommuneReach; base: string; className: string; lead?: boolean })
{
    return (
        <>
            {reach.tense && <span className="zone-tag">Zone tendue</span>}
            <ul className={className}>
                {communeActions(code, reach, base).map((action, index) => (
                    <li key={action.href}><a href={action.href} className={lead && index === 0 ? "map-check" : undefined}>{action.label}</a></li>
                ))}
            </ul>
        </>
    );
}
