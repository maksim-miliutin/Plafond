import { expect, test } from "vitest";

import { deposit, type Deposit } from "../src/deposit.js";

// Loi du 6 juillet 1989, article 22, counted by hand: the deposit comes back within a month of the keys when the flat
// leaves as it came, two months otherwise; each monthly period started late adds 10 % of the monthly rent before charges.
const moved: Deposit = {
    paid: 120000,
    rent: 120000,
    furnished: false,
    keysOn: "2026-07-01",
    conforming: true,
    addressGiven: true,
    returned: 0,
    returnedOn: null,
    on: "2026-10-03",
};

test("a deposit still held three periods after the month allowed costs the landlord three tenths of a rent", () =>
{
    expect(deposit(moved)).toMatchObject({ deadline: "2026-08-01", owed: 120000, late: 3, penalty: 36000 });
});

test("a flat that did not leave as it came gives the landlord two months", () =>
{
    expect(deposit({ ...moved, conforming: false })).toMatchObject({ deadline: "2026-09-01", late: 2, penalty: 24000 });
});

test("a deposit returned on the last day is on time, and one day late starts a period", () =>
{
    expect(deposit({ ...moved, returned: 120000, returnedOn: "2026-08-01" })).toMatchObject({ owed: 0, late: 0, penalty: 0 });
    expect(deposit({ ...moved, returned: 120000, returnedOn: "2026-08-02" })).toMatchObject({ late: 1, penalty: 12000 });
    expect(deposit({ ...moved, returned: 120000, returnedOn: "2026-09-01" })).toMatchObject({ late: 1 });
    expect(deposit({ ...moved, returned: 120000, returnedOn: "2026-09-02" })).toMatchObject({ late: 2 });
});

test("part of the deposit returned in time leaves the rest running late until today", () =>
{
    expect(deposit({ ...moved, returned: 60000, returnedOn: "2026-07-20" })).toMatchObject({ owed: 60000, late: 3, penalty: 36000 });
});

test("a month counted from the 31st ends on the last day of a shorter month", () =>
{
    expect(deposit({ ...moved, keysOn: "2026-01-31", on: "2026-02-15" })).toMatchObject({ deadline: "2026-02-28", late: 0 });
});

test("no penalty is due when the tenant gave no new address, though the deposit still is", () =>
{
    expect(deposit({ ...moved, addressGiven: false })).toMatchObject({ owed: 120000, late: 3, penalty: 0, penaltyDue: false });
});

test("a tenth of a rent that falls between two cents is rounded half up, the one rule for money", () =>
{
    expect(deposit({ ...moved, rent: 123456, paid: 123456 })).toMatchObject({ penalty: 3 * 12346 });
});

test("a deposit above one month of rent, or two for a furnished flat, is flagged with the excess", () =>
{
    expect(deposit({ ...moved, paid: 240000 })).toMatchObject({ allowed: 120000, excess: 120000 });
    expect(deposit({ ...moved, paid: 240000, furnished: true })).toMatchObject({ allowed: 240000, excess: 0 });
});
