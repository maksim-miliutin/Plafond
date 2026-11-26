/// <reference types="vite/client" />
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import { indexOf, relocationRulesOf, zoneListsOf } from "@plafond/import";

import { RelocationFormStep } from "../components/RelocationFormStep";
import { RelocationResultStep } from "../components/RelocationResultStep";
import { nextRelocation, relocationStart, type RelocationFields, type RelocationWorld } from "../lib/relocation-flow";

import sources from "../../../db/seed/zone-lists.json?raw";
import rules from "../../../db/seed/relocation-rules.json?raw";
import irl from "../../../db/seed/irl.json?raw";
import { regionList } from "./zone-seeds";

const world: RelocationWorld = {
    communes: regionList.filter((row) => ["94080", "93048", "75056", "91027", "77022"].includes(row.code)),
    lists: zoneListsOf(JSON.parse(sources)),
    capped: ["75056", "93048"],
    periods: relocationRulesOf(JSON.parse(rules)),
    index: indexOf(JSON.parse(irl)).rows,
};

const vincennes: RelocationFields = { commune: "94080", signedOn: "2026-09-01", proposed: "1080", first: "no", dpe: "D", vacancy: "within", lastRent: "1000", revised: "yes", basis: "none" };

const clean = (html: string) => html.replaceAll("&#x27;", "'").replaceAll(" ", " ").replaceAll(" ", " ");

function form(fields: Partial<RelocationFields> = {}): string
{
    return clean(renderToStaticMarkup(<RelocationFormStep fields={{ ...relocationStart.fields, ...fields }} errors={{}} communes={world.communes} />));
}

function result(fields: Partial<RelocationFields>): string
{
    const step = nextRelocation(relocationStart, { type: "answered", fields: { ...vincennes, ...fields } }, world);
    if (step.at !== "result")
    {
        throw new Error(`no result: ${JSON.stringify(step)}`);
    }

    return clean(renderToStaticMarkup(<RelocationResultStep communeName={step.commune.name} capped={step.capped} lease={step.lease} firstAssumed={step.firstAssumed} basisAssumed={step.basisAssumed} check={step.check} />));
}

test("opened from a commune, the form has it written; opened bare, it suggests the communes in order", () =>
{
    const field = (html: string) => /<input id="commune"[^>]*>/.exec(html)?.[0] ?? "";

    expect(field(form({ commune: "Vincennes (94)" }))).toContain('value="Vincennes (94)"');
    expect(field(form())).toContain('value=""');
    expect([...form().matchAll(/<option value="([^"]+)"/g)].map((found) => found[1])).toEqual(["Athis-Mons (91)", "Barbizon (77)", "Montreuil (93)", "Paris (75)", "Vincennes (94)"]);
});

test("the form asks only what the case needs", () =>
{
    expect(form({ first: "yes" })).not.toContain('name="dpe"');
    expect(form({ first: "no", dpe: "G" })).toContain('name="lastRent"');
    expect(form({ first: "no", dpe: "G" })).not.toContain('name="vacancy"');
    expect(form({ first: "no", dpe: "D" })).toContain('name="basis"');
});

test("Vincennes: the result names 80 € too much, the most allowed, the rule and the decree it comes from", () =>
{
    const page = result({});

    expect(page).toMatch(/<span class="amount">80,00 €<\/span> de trop chaque mois/);
    expect(page).toContain("1 000,00 €");
    expect(page).toContain("article 3 du décret");
    expect(page).toContain('href="https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000054451221"');
    expect(page).not.toContain("../loyer/");
});

test("within the limit the result says nothing too much was found, and in Montreuil it leads to the rent cap too", () =>
{
    const page = result({ commune: "93048", proposed: "1000" });

    expect(page).toContain("Aucun dépassement détecté pour cette vérification");
    expect(page).toContain('<a href="../loyer/">Vérifier le plafond du loyer</a>');
});

test("an unrevised rent shows the index published at signing and the sum", () =>
{
    const page = result({ revised: "no", signedOn: "2026-10-14" });

    expect(page).toContain("Indice du 2e trimestre 2026 : 148,37, publié le 10 juillet 2026.");
    expect(page).toContain("1 000,00 € × 148,37 / 146,68 = 1 011,52 €.");
});

test("each case the check cannot price says what it is and where to look", () =>
{
    expect(result({ commune: "77022" })).toContain("Barbizon n'est pas dans la zone tendue que vise le décret");
    expect(result({ commune: "77022" })).toContain('<a href="../dpe/">Vérifier le DPE du logement</a>');
    expect(result({ signedOn: "2027-08-01" })).toContain("Règles non disponibles pour cette date de bail");
    expect(result({ signedOn: "2027-08-01" })).toContain("Plafond connaît les règles des baux signés du 1er août 2017 au 31 juillet 2027.");
    expect(result({ dpe: "unknown" })).toContain("Données insuffisantes");
    expect(result({ dpe: "unknown" })).toContain('<a href="../dpe/">Retrouver le DPE du logement</a>');
    expect(result({ lastRent: "" })).toContain("il manque le dernier loyer hors charges du locataire précédent");
    expect(result({ vacancy: "beyond" })).toContain("Hors champ de cette vérification");
    expect(result({ basis: "works" })).toContain("Cas particulier à vérifier");
    expect(result({ first: "yes" })).toContain("Première location");
});

test("an F or G dwelling is held at its last rent by the law, with the way to its DPE", () =>
{
    const page = result({ dpe: "G", vacancy: "beyond" });

    expect(page).toContain("Logement classé G");
    expect(page).toContain("LEGIARTI000043977087");
    expect(page).toContain('<a href="../dpe/">Vérifier le DPE du logement</a>');
    expect(page).toContain("80,00 €");
});
