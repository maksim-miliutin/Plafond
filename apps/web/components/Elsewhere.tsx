import { territories } from "../lib/city-copy";
import { Brand } from "./Brand";
import { CheckList } from "./Checks";

export function Elsewhere()
{
    return (
        <main className="screen">
            <a className="back" href="../">Accueil</a>
            <Brand />
            <h1 className="title">Ailleurs en France</h1>
            <p className="lead">
                Ces six vérifications ne dépendent pas de la ville&nbsp;: chacune dit où elle s'applique. Le plafond des loyers n'existe que dans
                certains territoires, et Plafond le vérifie à Paris, à Lyon, à Villeurbanne et dans les communes d'Est Ensemble et de Plaine Commune.
            </p>
            <section className="findings">
                <h2>Que voulez-vous vérifier ?</h2>
                <CheckList base="../" rentReach={null} />
            </section>
            <p className="fine">
                Votre ville encadre peut-être aussi les loyers&nbsp;: <a href={territories.href}>{territories.label}</a>
            </p>
            <div className="grow" />
            <p className="fine">
                Le calcul se fait sur votre appareil, sans compte. Une estimation, pas un conseil juridique.{" "}
                <a href="../mentions/">Mentions légales</a>
            </p>
        </main>
    );
}
