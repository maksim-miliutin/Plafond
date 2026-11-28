import { author } from "../lib/site";

// The footer sits under every page, so its link to the legal notice starts from the root of the site.
const siteRoot = process.env.NEXT_PUBLIC_SITE_ROOT ?? "";

export function SiteFooter()
{
    return (
        <footer className="site-footer">
            <div className="site-footer-inner">
                <p>Réalisé par {author.name}</p>
                <ul aria-label="Liens">
                    <li><a href={author.github} rel="me">GitHub</a></li>
                    <li><a href={author.linkedin} rel="me">LinkedIn</a></li>
                    <li><a href={`${siteRoot}/mentions/`}>Mentions légales</a></li>
                </ul>
            </div>
        </footer>
    );
}
