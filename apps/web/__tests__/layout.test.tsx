import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import RootLayout from "../app/layout";

const page = renderToStaticMarkup(<RootLayout><main>screen</main></RootLayout>);

// The trial notice stood until the rents matched the DRIHL map; packages/import/__tests__/drihl.test.ts now holds that.
test("no screen calls itself a trial any more, and each page carries only itself", () =>
{
    expect(page).not.toContain("Version d&#x27;essai");
    expect(page).toMatch(/<body><main>screen<\/main><\/body>/);
});
