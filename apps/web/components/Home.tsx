export function Home()
{
    return (
        <main className="screen">
            <p className="wordmark">Plafond</p>
            <h1 className="title">Que voulez-vous vérifier ?</h1>
            <p className="lead">Des vérifications gratuites pour les locataires, faites sur votre appareil, sans compte.</p>
            <nav className="checks" aria-label="Vérifications">
                <a href="loyer/" className="check">
                    <strong>Mon loyer dépasse-t-il le plafond légal ?</strong>
                    <span>À Paris, avec l'encadrement des loyers.</span>
                </a>
                <a href="dpe/" className="check">
                    <strong>Mon logement est-il une passoire thermique ?</strong>
                    <span>En France métropolitaine, d'après le DPE.</span>
                </a>
                <a href="depot/" className="check">
                    <strong>Mon dépôt de garantie m'a-t-il été rendu à temps ?</strong>
                    <span>Partout en France, d'après la loi du 6 juillet 1989.</span>
                </a>
                <a href="charges/" className="check">
                    <strong>Ma régularisation de charges est-elle juste ?</strong>
                    <span>Partout en France, d'après le décret du 26 août 1987.</span>
                </a>
            </nav>
            <div className="grow" />
            <p className="fine">Une estimation, pas un conseil juridique. <a href="mentions/">Mentions légales</a></p>
        </main>
    );
}
