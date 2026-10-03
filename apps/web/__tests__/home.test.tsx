import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import { Home } from "../components/Home";

const page = renderToStaticMarkup(<Home />);

test("the first screen offers both checks, each a link relative to the page, so it works under the project path too", () =>
{
    expect(page).toMatch(/<a[^>]*href="loyer\/"[^>]*>.*Mon loyer.*<\/a>/s);
    expect(page).toMatch(/<a[^>]*href="dpe\/"[^>]*>.*DPE.*<\/a>/s);
    expect(page.match(/<h1/g)).toHaveLength(1);
});
