import { expect, test } from "vitest";

import { nextNotice, noticeStart, type NoticeEvent, type NoticeFields, type NoticeStep } from "../lib/notice-flow";

const world = { on: "2027-03-10" };
const filled: NoticeFields = {
    address: "12 Rue des Lilas 69003 Lyon",
    rent: "1 200",
    furnished: "no",
    tense: "yes",
    reason: "none",
    receivedOn: "2027-03-15",
};

function walk(...events: NoticeEvent[]): NoticeStep
{
    return events.reduce<NoticeStep>((step, event) => nextNotice(step, event, world), noticeStart);
}

test("the check starts on an empty form with no reason picked", () =>
{
    expect(noticeStart).toMatchObject({ at: "form", errors: {} });
    expect(noticeStart.fields).toEqual({ address: "", rent: "", furnished: "", tense: "", reason: "none", receivedOn: "" });
});

test("each missing answer is asked for under its own field", () =>
{
    const missing = walk({ type: "answered", fields: { ...filled, rent: "", receivedOn: "", tense: "" } });

    expect(missing).toMatchObject({ at: "form", errors: { rent: expect.any(String), receivedOn: expect.any(String), tense: expect.any(String) } });
    expect(missing.at === "form" && Object.keys(missing.errors).sort()).toEqual(["receivedOn", "rent", "tense"]);
});

test("a furnished flat needs neither the zone nor a reason", () =>
{
    expect(walk({ type: "answered", fields: { ...filled, furnished: "yes", tense: "", reason: "" } })).toMatchObject({
        at: "result",
        check: { months: 1, furnished: true, endsOn: "2027-04-15" },
    });
});

test("an empty flat in a tense zone gets one month, and the letter says why", () =>
{
    const result = walk({ type: "answered", fields: filled });

    expect(result).toMatchObject({ at: "result", check: { months: 1, reason: { id: "tense" }, endsOn: "2027-04-15" }, ifTense: null });
    expect(result.at === "result" && result.letter.closing.join(" ")).toContain("zone tendue");
});

test("a reason picked shortens the notice even outside a tense zone", () =>
{
    expect(walk({ type: "answered", fields: { ...filled, tense: "no", reason: "transfer" } })).toMatchObject({
        at: "result",
        check: { months: 1, reason: { id: "transfer" } },
    });
});

test("a tenant unsure of the zone sees the three months and what one month would give", () =>
{
    expect(walk({ type: "answered", fields: { ...filled, tense: "unknown" } })).toMatchObject({
        at: "result",
        check: { months: 3, reason: null, endsOn: "2027-06-15" },
        ifTense: { months: 1, endsOn: "2027-04-15" },
    });
    expect(walk({ type: "answered", fields: { ...filled, tense: "unknown", reason: "health" } })).toMatchObject({ ifTense: null });
    expect(walk({ type: "answered", fields: { ...filled, tense: "no" } })).toMatchObject({ check: { months: 3 }, ifTense: null });
    expect(walk({ type: "answered", fields: { ...filled, furnished: "yes", tense: "unknown" } })).toMatchObject({ check: { months: 1 }, ifTense: null });
});

test("an answer outside the choices offered is refused", () =>
{
    expect(walk({ type: "answered", fields: { ...filled, reason: "holiday" } })).toMatchObject({ at: "form", errors: { reason: expect.any(String) } });
    expect(walk({ type: "answered", fields: { ...filled, reason: "tense" } })).toMatchObject({ at: "form", errors: { reason: expect.any(String) } });
});

test("going back keeps what was typed, and free help returns to the same result", () =>
{
    const result = walk({ type: "answered", fields: filled });
    const letter = nextNotice(result, { type: "wrote" }, world);
    const help = nextNotice(result, { type: "helped" }, world);

    expect(letter.at).toBe("letter");
    expect(nextNotice(letter, { type: "back" }, world)).toMatchObject({ at: "result" });
    expect(nextNotice(result, { type: "back" }, world)).toMatchObject({ at: "form", fields: filled, errors: {} });
    expect(nextNotice(help, { type: "back" }, world)).toBe(result);
});
