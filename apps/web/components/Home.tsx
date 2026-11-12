import { guides } from "../lib/guides";
import { Brand } from "./Brand";
import { CheckList } from "./Checks";

export function Home()
{
    return (
        <main className="screen">
            <Brand />
            <h1 className="title">Que voulez-vous vérifier ?</h1>
            <p className="lead">
                Sept vérifications gratuites pour les locataires. Chacune se termine par une lettre prête à envoyer au propriétaire.
            </p>
            <CheckList base="" rentReach="À Paris, Lyon et Villeurbanne, avec l'encadrement des loyers." />
            <section className="findings">
                <h2>Comprendre vos droits</h2>
                <ul className="references">
                    {guides.map((guide) => <li key={guide.slug}><a href={`guides/${guide.slug}/`}>{guide.label}</a></li>)}
                </ul>
            </section>
            <div className="grow" />
            <p className="fine">
                Le calcul se fait sur votre appareil, sans compte. Une estimation, pas un conseil juridique.{" "}
                <a href="mentions/">Mentions légales</a>
            </p>
        </main>
    );
}
