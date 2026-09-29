import { DayError, isDay, type Day } from "./day.js";

export class FormatError extends Error
{
    constructor(problem: string)
    {
        super(`format: ${problem}`);
        this.name = "FormatError";
    }
}

// French typography: groups of thousands take a narrow no-break space, a unit or a sign a no-break space.
const thin = "\u202F";
const hard = "\u00A0";

const months = [
    "janvier",
    "février",
    "mars",
    "avril",
    "mai",
    "juin",
    "juillet",
    "août",
    "septembre",
    "octobre",
    "novembre",
    "décembre",
];

export function euros(cents: number): string
{
    const [whole, rest] = split(cents);

    return `${grouped(whole)},${String(rest).padStart(2, "0")}${hard}€`;
}

export function squareMetres(hundredths: number): string
{
    const [whole, rest] = split(hundredths);
    if (rest === 0)
    {
        return `${grouped(whole)}${hard}m²`;
    }

    return `${grouped(whole)},${String(rest).padStart(2, "0").replace(/0$/, "")}${hard}m²`;
}

export function frenchDay(day: Day): string
{
    if (!isDay(day))
    {
        throw new DayError(day);
    }

    const [year, month, date] = day.split("-").map(Number) as [number, number, number];

    return `${date === 1 ? "1er" : date} ${months[month - 1]} ${year}`;
}

function split(hundredths: number): [number, number]
{
    if (!Number.isInteger(hundredths) || hundredths < 0)
    {
        throw new FormatError(`${hundredths} is not a whole number of hundredths`);
    }

    return [Math.floor(hundredths / 100), hundredths % 100];
}

function grouped(whole: number): string
{
    return String(whole).replace(/\B(?=(\d{3})+(?!\d))/g, thin);
}
