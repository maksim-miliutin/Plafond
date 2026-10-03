export function Home()
{
    return (
        <main className="screen">
            <p className="wordmark">Plafond</p>
            <h1 className="title">Que voulez-vous vérifier ?</h1>
            <p className="lead">Deux vérifications gratuites pour les locataires, faites sur votre appareil, sans compte.</p>
            <nav className="checks" aria-label="Vérifications">
                <a href="loyer/" className="check">
                    <strong>Mon loyer dépasse-t-il le plafond légal ?</strong>
                    <span>À Paris, avec l'encadrement des loyers.</span>
                </a>
                <a href="dpe/" className="check">
                    <strong>Mon logement est-il une passoire thermique ?</strong>
                    <span>En France métropolitaine, d'après le DPE.</span>
                </a>
            </nav>
            <div className="grow" />
            <p className="fine">Une estimation, pas un conseil juridique.</p>
        </main>
    );
}
