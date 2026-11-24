import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import { SiteFooter } from "../components/SiteFooter";

const footer = renderToStaticMarkup(<SiteFooter />);

test("the footer names the author and links GitHub, LinkedIn and the legal notice from the root", () =>
{
    expect(footer).toContain("Réalisé par Maksim Miliutin");
    expect(footer).toContain('<a href="https://github.com/maksim-miliutin" rel="me">GitHub</a>');
    expect(footer).toContain('<a href="https://www.linkedin.com/in/miliutin-maksim/" rel="me">LinkedIn</a>');
    expect(footer).toContain('<a href="/mentions/">Mentions légales</a>');
});
