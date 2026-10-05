import type { ReactNode } from "react";

import { guides } from "../lib/guides";
import { Brand } from "./Brand";

interface Check
{
    href: string;
    question: string;
    reach: string;
    needs: string;
    drawing: ReactNode;
}

const checks: Check[] = [
    {
        href: "loyer/",
        question: "Mon loyer dépasse-t-il le plafond légal ?",
        reach: "À Paris, avec l'encadrement des loyers.",
        needs: "Votre bail sous la main, environ 3 minutes.",
        drawing: (
            <>
                <path d="M4 15 16 5l12 10" />
                <path d="M7 13v14h18V13" />
                <path d="M19.5 15.8a4.2 4.2 0 1 0 0 6.4" />
                <path d="M12 18h6M12 20.6h6" />
            </>
        ),
    },
    {
        href: "dpe/",
        question: "Mon logement est-il une passoire thermique ?",
        reach: "En France métropolitaine, d'après le DPE.",
        needs: "L'adresse ou le numéro du DPE, environ 2 minutes.",
        drawing: (
            <g stroke="none">
                <path d="M4 5h11l2.5 2.5L15 10H4z" fill="#009C6D" />
                <path d="M4 11.5h14.5L21 14l-2.5 2.5H4z" fill="#C9B800" />
                <path d="M4 18h18l2.5 2.5L22 23H4z" fill="#EB8235" />
                <path d="M4 24.5h21.5L28 27l-2.5 2.5H4z" fill="#D7221F" />
            </g>
        ),
    },
    {
        href: "depot/",
        question: "Mon dépôt de garantie m'a-t-il été rendu à temps ?",
        reach: "Partout en France, d'après la loi du 6 juillet 1989.",
        needs: "Les dates et les montants, environ 2 minutes.",
        drawing: (
            <>
                <circle cx="10" cy="16" r="5.5" />
                <circle cx="10" cy="16" r="1.6" />
                <path d="M15.5 16H28M23 16v4.5M27 16v3" />
            </>
        ),
    },
    {
        href: "charges/",
        question: "Ma régularisation de charges est-elle juste ?",
        reach: "Partout en France, d'après le décret du 26 août 1987.",
        needs: "Votre décompte annuel, environ 5 minutes.",
        drawing: (
            <>
                <path d="M7 4h18v24l-3-2-3 2-3-2-3 2-3-2-3 2z" />
                <path d="M11 10h10M11 14.5h10" />
                <path d="M20.5 18.6a2.8 2.8 0 1 0 0 4.3" />
                <path d="M15.5 20h3.5M15.5 21.6h3.5" />
            </>
        ),
    },
];

export function Home()
{
    return (
        <main className="screen">
            <Brand />
            <h1 className="title">Que voulez-vous vérifier ?</h1>
            <p className="lead">
                Quatre vérifications gratuites pour les locataires. Chacune se termine par une lettre prête à envoyer au propriétaire.
            </p>
            <nav className="checks" aria-label="Vérifications">
                {checks.map((check) => (
                    <a key={check.href} href={check.href} className="check">
                        <span className="drawing">
                            <svg
                                aria-hidden="true"
                                viewBox="0 0 32 32"
                                width="34"
                                height="34"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.2"
                                strokeLinejoin="round"
                                strokeLinecap="round"
                            >
                                {check.drawing}
                            </svg>
                        </span>
                        <span className="words">
                            <strong>{check.question}</strong>
                            <span>{check.reach}</span>
                            <span className="needs">{check.needs}</span>
                        </span>
                    </a>
                ))}
            </nav>
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
