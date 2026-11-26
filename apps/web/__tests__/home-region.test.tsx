import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import { Home } from "../components/Home";
import { departmentCounts } from "../lib/region";
import { homeMaps } from "./fixtures";
import { regionList } from "./zone-seeds";

const page = renderToStaticMarkup(<Home shapes={{ paris: "M1,1Z", lyon: "M2,2Z" }} maps={homeMaps} departments={departmentCounts(regionList)} />)
    .replaceAll("&#x27;", "'");

test("under the map, the home says every commune of Île-de-France is there and searches it by name", () =>
{
    expect(page).toContain("Votre commune n'est pas sur la carte");
    expect(page).toContain("1\u202F266 communes d'Île-de-France sont toutes sur Plafond");
    const form = /<form[^>]*>/.exec(page)?.[0] ?? "";

    expect(form).toContain('action="ile-de-france/"');
    expect(form).toContain('method="get"');
    const field = /<input id="region-q"[^>]*>/.exec(page)?.[0] ?? "";

    expect(field).toContain('name="q"');
    expect(field).toContain('type="search"');
});

test("each department leads to its communes, with how many it holds", () =>
{
    const links = [...page.matchAll(/<a href="ile-de-france\/\?departement=(\d\d)"><strong>([^<]+)<\/strong><span>([^<]+)<\/span>/g)].map((found) => found.slice(1));

    expect(links).toHaveLength(8);
    expect(links.find((link) => link[0] === "77")).toEqual(["77", "Seine-et-Marne (77)", "507 communes"]);
    expect(links.find((link) => link[0] === "75")).toEqual(["75", "Paris (75)", "1 commune"]);
});
