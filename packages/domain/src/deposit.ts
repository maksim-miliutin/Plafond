import { addMonths, type Day } from "./day.js";
import { rounded } from "./money.js";

export interface Deposit
{
    paid: number;
    rent: number;  // cents a month, before charges
    furnished: boolean;
    keysOn: Day;
    conforming: boolean;
    addressGiven: boolean;
    returned: number;
    returnedOn: Day | null;
    on: Day;
}

export interface DepositCheck
{
    kind: "deposit";
    deadline: Day;
    owed: number;
    late: number;
    penalty: number;
    penaltyDue: boolean;
    allowed: number;
    excess: number;
}

export function deposit(held: Deposit): DepositCheck
{
    const deadline = addMonths(held.keysOn, held.conforming ? 1 : 2);
    const settledOn = held.returned >= held.paid && held.returnedOn !== null ? held.returnedOn : held.on;
    const late = periodsAfter(deadline, settledOn);
    const allowed = held.rent * (held.furnished ? 2 : 1);

    return {
        kind: "deposit",
        deadline,
        owed: Math.max(0, held.paid - held.returned),
        late,
        penalty: held.addressGiven ? late * rounded(held.rent, 10) : 0,
        penaltyDue: held.addressGiven,
        allowed,
        excess: Math.max(0, held.paid - allowed),
    };
}

// Each monthly period started after the deadline counts whole: one day late is one period, a month and a day is two.
function periodsAfter(deadline: Day, end: Day): number
{
    let count = 0;
    while (addMonths(deadline, count) < end)
    {
        count++;
    }

    return count;
}
