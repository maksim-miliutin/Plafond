import { expect, test } from "vitest";

import { notice, noticeReasons, type Leaving } from "../src/notice.js";

// Loi du 6 juillet 1989, article 15: three months for an empty flat, one month in a tense zone or for the reasons
// listed in 2° to 6°; article 25-8: one month for a furnished flat. Counted by hand.
const leaving: Leaving = {
    furnished: false,
    reasons: [],
    receivedOn: "2027-03-15",
    rent: 120000,
};

test("an empty flat with no reason to shorten it takes three months from the day the landlord gets the letter", () =>
{
    expect(notice(leaving)).toMatchObject({ months: 3, reason: null, furnished: false, endsOn: "2027-06-15" });
});

test("a furnished flat takes one month, whatever else is true", () =>
{
    expect(notice({ ...leaving, furnished: true, reasons: ["health"] })).toMatchObject({ months: 1, reason: null, furnished: true, endsOn: "2027-04-15" });
});

test("each reason the law lists shortens an empty flat's notice to one month", () =>
{
    for (const reason of noticeReasons)
    {
        expect(notice({ ...leaving, reasons: [reason.id] }), reason.id).toMatchObject({ months: 1, endsOn: "2027-04-15" });
    }
});

test("the law's six cases are all there: the tense zone, work, health, benefits, social housing and protection", () =>
{
    expect(noticeReasons.map((reason) => reason.id)).toEqual(
        ["tense", "first-job", "transfer", "job-loss", "new-job", "health", "benefits", "social-housing", "protection"],
    );
});

test("only the tense zone needs no proof sent with the letter", () =>
{
    for (const reason of noticeReasons)
    {
        expect(reason.proof === null, reason.id).toBe(reason.id === "tense");
        expect(reason.label.length, reason.id).toBeGreaterThan(5);
        expect(reason.motive.length, reason.id).toBeGreaterThan(5);
    }
});

test("of several reasons, the letter names the tense zone first, since it needs no proof", () =>
{
    expect(notice({ ...leaving, reasons: ["health", "tense"] }).reason?.id).toBe("tense");
    expect(notice({ ...leaving, reasons: ["social-housing", "health"] }).reason?.id).toBe("health");
});

// Code de procédure civile, articles 641 and 642: a delay in months ends on the same date of the last month, or on that
// month's last day when it has no such date, at midnight.
test("a notice received on a date the last month lacks ends on that month's last day", () =>
{
    expect(notice({ ...leaving, reasons: ["tense"], receivedOn: "2027-01-31" }).endsOn).toBe("2027-02-28");
    expect(notice({ ...leaving, receivedOn: "2027-11-30" }).endsOn).toBe("2028-02-29");
});

test("rent and charges are owed until the end, the last month by its days", () =>
{
    expect(notice(leaving).lastMonth).toEqual({ days: 15, of: 30, owed: 60000 });
    expect(notice({ ...leaving, reasons: ["tense"], receivedOn: "2027-01-31" }).lastMonth).toEqual({ days: 28, of: 28, owed: 120000 });
    expect(notice({ ...leaving, furnished: true, receivedOn: "2027-05-10", rent: 95000 }).lastMonth).toEqual({ days: 10, of: 30, owed: 31667 });
});

test("the last month's share is rounded half up, the one rule for money", () =>
{
    expect(notice({ ...leaving, reasons: ["tense"], receivedOn: "2027-06-14", rent: 77777 }).lastMonth.owed).toBe(35125);
    expect(notice({ ...leaving, reasons: ["tense"], receivedOn: "2027-06-15", rent: 81234 }).lastMonth.owed).toBe(39307);
});
