import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import { NoticeFormStep } from "../components/NoticeFormStep";
import { noticeStart, type NoticeErrors, type NoticeFields } from "../lib/notice-flow";

function page(fields: Partial<NoticeFields> = {}, errors: NoticeErrors = {}): string
{
    return renderToStaticMarkup(<NoticeFormStep fields={{ ...noticeStart.fields, ...fields }} errors={errors} />);
}

test("every typed answer has its labelled field, and the three choices are named groups", () =>
{
    for (const id of ["address", "rent", "receivedOn"])
    {
        expect(page(), id).toMatch(new RegExp(`<label for="${id}"`));
    }

    expect(page().match(/name="furnished"/g)).toHaveLength(2);
    expect(page().match(/name="tense"/g)).toHaveLength(3);
    expect(page().match(/<legend/g)).toHaveLength(3);
});

test("every reason the law lists besides the zone is offered, after a choice of none that starts picked", () =>
{
    const reasons = page().match(/<input[^>]*name="reason"[^>]*>/g) ?? [];

    expect(reasons).toHaveLength(9);
    expect(reasons[0]).toMatch(/value="none"[^>]*checked=""|checked=""[^>]*value="none"/);
    expect(page()).toContain("Mutation");
    expect(page()).toContain("Attribution d&#x27;un logement social");
    expect(page()).not.toMatch(/name="reason" value="tense"/);
});

test("the zone question says which towns are tense, and allows not knowing", () =>
{
    expect(page()).toContain("la plupart des grandes agglomérations");
    expect(page()).toMatch(/name="tense" value="unknown"/);
});

test("the date asked is the landlord's, and a letter not yet sent takes a planned date", () =>
{
    expect(page()).toContain("Date de réception de la lettre par le propriétaire");
    expect(page()).toContain("indiquez la date prévue");
    expect(page().match(/<input[^>]*id="receivedOn"[^>]*>/)?.[0]).toContain('type="date"');
});

test("an error sits under its own field and is tied to it", () =>
{
    expect(page({}, { receivedOn: "Indiquez la date." })).toMatch(/<input[^>]*id="receivedOn"[^>]*aria-describedby="[^"]*receivedOn-error"/);
    expect(page({}, { tense: "Indiquez la zone." })).toMatch(/<fieldset[^>]*aria-describedby="tense-error"/);
});

test("the screen says nothing leaves the phone, sends nothing anywhere and leads back to all the checks", () =>
{
    expect(page()).toContain("Rien ne quitte votre appareil");
    expect(page()).toMatch(/<form[^>]*method="dialog"/);
    expect(page()).toMatch(/<a[^>]*href="\.\.\/"[^>]*>Toutes les vérifications<\/a>/);
    expect(page()).toMatch(/<a[^>]*href="\.\.\/mentions\/"[^>]*>Mentions légales<\/a>/);
});
