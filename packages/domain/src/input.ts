export interface Unreadable
{
    kind: "unreadable";
}

const amount = /^(\d+(?:\s?\d{3})*)(?:[.,](\d{1,2}))?$/;

export function centsFrom(text: string): number | Unreadable
{
    return hundredths(text.trim().replace(/\s*€$/, ""));
}

export function hundredthsFrom(text: string): number | Unreadable
{
    return hundredths(text.trim().replace(/\s*m[²2]$/, ""));
}

function hundredths(text: string): number | Unreadable
{
    const match = amount.exec(text);
    if (match === null)
    {
        return { kind: "unreadable" };
    }

    const whole = Number((match[1] ?? "").replace(/\D/g, ""));
    const rest = Number((match[2] ?? "").padEnd(2, "0"));

    return whole * 100 + rest;
}
