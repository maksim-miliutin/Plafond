import type { ReactNode } from "react";

import type { GuideText } from "../lib/guides";
import { Brand } from "./Brand";

export function Guide({ guide, more }: { guide: GuideText; more?: ReactNode })
{
    const check = <a className="primary link-button" href={`../../${guide.check.href}`}>{guide.check.text}</a>;

    return (
        <main className="screen guide">
            <a className="back" href="../../">Toutes les vérifications</a>
            <Brand />
            <h1 className="title">{guide.heading}</h1>
            <p className="lead">{guide.intro}</p>
            {check}
            {guide.sections.map((section) => (
                <section key={section.heading} className="findings">
                    <h2>{section.heading}</h2>
                    {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                </section>
            ))}
            {check}
            {more}
            <section className="findings">
                <h2>Sources</h2>
                <ul className="references">
                    {guide.sources.map((source) => <li key={source.href}><a href={source.href}>{source.text}</a></li>)}
                </ul>
            </section>
            <p className="fine">Une information générale, pas un conseil juridique. <a href="../../mentions/">Mentions légales</a></p>
        </main>
    );
}
