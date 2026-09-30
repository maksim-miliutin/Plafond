import { frenchDay } from "@plafond/domain";
import type { Contest } from "@plafond/domain";

export function ContestNote({ contest }: { contest: Contest })
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
            <p>Renseignez-vous auprès de l'ADIL de Paris avant d'agir.</p>
        </section>
    );
}
