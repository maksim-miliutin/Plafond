export function Mentions()
{
    return (
        <main className="screen">
            <a className="back" href="../">Toutes les vérifications</a>
            <h1 className="title">Mentions légales et données</h1>
            <section className="findings">
                <h2>Éditeur</h2>
                <p>
                    Plafond est publié par une personne physique, à titre non professionnel et gratuit. Comme le permet la loi
                    pour la confiance dans l'économie numérique, ses coordonnées ne sont pas rendues publiques et ont été
                    communiquées à l'hébergeur.
                </p>
                <p>
                    Pour toute question, ouvrez un ticket sur le <a href="https://github.com/maksim-miliutin/Plafond/issues">dépôt du projet</a>.
                </p>
            </section>
            <section className="findings">
                <h2>Hébergeur</h2>
                <p>GitHub, Inc. (GitHub Pages), 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, États-Unis.</p>
                <p>Téléphone&nbsp;: +1 415 735 4488.</p>
            </section>
            <section className="findings">
                <h2>Données personnelles</h2>
                <p>
                    Plafond ne crée pas de compte, n'utilise ni cookie ni mesure d'audience et n'enregistre rien sur un serveur.
                    Les calculs se font sur votre appareil, et le loyer, les dates et la lettre n'en sortent pas.
                </p>
                <p>
                    Pour trouver le quartier ou le DPE, votre appareil envoie l'adresse saisie au service public de géocodage de
                    la Géoplateforme, tenu par l'IGN, qui fournit aussi le plan du quartier. Pour le DPE, il envoie ensuite
                    l'identifiant de l'adresse, ou le numéro du DPE, aux données ouvertes de l'ADEME.
                </p>
                <p>Comme pour tout site hébergé par GitHub Pages, GitHub enregistre l'adresse IP des visiteurs pour sa sécurité.</p>
            </section>
            <section className="findings">
                <h2>Sources</h2>
                <p>
                    Loyers de référence de la Ville de Paris et arrêtés du préfet de la région Île-de-France, adresses et plan de
                    l'IGN, diagnostics de performance énergétique publiés par l'ADEME.
                </p>
            </section>
            <p className="fine">
                Plafond donne une estimation et prépare un modèle de lettre, pas un conseil juridique. L'ADIL de votre département
                vous conseille gratuitement.
            </p>
        </main>
    );
}
