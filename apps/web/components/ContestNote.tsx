import { frenchDay } from "@plafond/domain";
import type { City, Contest } from "@plafond/domain";

const adil: Record<City, string> = { paris: "l'ADIL de Paris", lyon: "l'ADIL du Rhône" };

export function ContestNote({ contest, city }: { contest: Contest; city?: City })
{
    const decision = `${contest.court}, ${frenchDay(contest.decidedOn)}`;

    return (
        <section className="notice" role="note">
            {contest.outcome === "pending"
                ? <p>La validité de l'arrêté de cette période est contestée en justice ({decision}) et l'affaire n'est pas close.</p>
                : <p>L'arrêté de cette période a été annulé en justice ({decision}).</p>}
            {contest.claimsBy !== null && (
                <p>Le tribunal a limité les effets de cette annulation aux recours engagés au plus tard le {frenchDay(contest.claimsBy)}.</p>
            )}
            <p>Renseignez-vous auprès de {city === undefined ? "l'ADIL de votre département" : adil[city]} avant d'agir.</p>
        </section>
    );
}
