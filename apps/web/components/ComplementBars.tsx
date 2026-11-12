import { complementBars, frenchDay, noComplementFrom } from "@plafond/domain";
import type { Day } from "@plafond/domain";

export function ComplementBars({ signedOn, dpe }: { signedOn: Day; dpe: string })
{
    const bars = complementBars(signedOn);
    if (bars.length === 0)
    {
        return null;
    }

    return (
        <>
            <p>
                Pour un bail signé depuis le {frenchDay(noComplementFrom)}, aucun complément de loyer ne peut être appliqué si le
                logement présente l'une de ces caractéristiques&nbsp;:
            </p>
            <ul className="bars">
                {bars.map((bar) => <li key={bar}>{bar}</li>)}
            </ul>
            <p><a href={dpe}>Vérifier le DPE du logement</a></p>
        </>
    );
}
