export type Day = string;

export class DayError extends Error
{
    constructor(text: string)
    {
        super(`day: "${text}" is not a calendar day`);
        this.name = "DayError";
    }
}

interface Parts
{
    year: number;
    month: number;
    date: number;
}

const shape = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isDay(text: string): boolean
{
    return parse(text) !== null;
}

export function addMonths(start: Day, months: number): Day
{
    const from = parsed(start);
    const index = from.year * 12 + from.month - 1 + months;
    const year = Math.floor(index / 12);
    const month = index % 12 + 1;
    const date = Math.min(from.date, daysIn(year, month));

    return format({ year, month, date });
}

export function wholeMonths(from: Day, to: Day): number
{
    const start = parsed(from);
    const end = parsed(to);

    if (to <= from)
    {
        return 0;
    }

    const months = (end.year - start.year) * 12 + end.month - start.month;
    if (addMonths(from, months) > to)
    {
        return months - 1;
    }

    return months;
}

export function dayBefore(day: Day): Day
{
    const { year, month, date } = parsed(day);
    if (date > 1)
    {
        return format({ year, month, date: date - 1 });
    }

    const previous = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };

    return format({ ...previous, date: daysIn(previous.year, previous.month) });
}

function parse(text: string): Parts | null
{
    const match = shape.exec(text);
    if (match === null)
    {
        return null;
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const date = Number(match[3]);
    if (month < 1 || month > 12 || date < 1 || date > daysIn(year, month))
    {
        return null;
    }

    return { year, month, date };
}

function parsed(text: string): Parts
{
    const parts = parse(text);
    if (parts === null)
    {
        throw new DayError(text);
    }

    return parts;
}

function daysIn(year: number, month: number): number
{
    if (month === 2)
    {
        return isLeap(year) ? 29 : 28;
    }

    if (month === 4 || month === 6 || month === 9 || month === 11)
    {
        return 30;
    }

    return 31;
}

function isLeap(year: number): boolean
{
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function format(parts: Parts): Day
{
    const year = String(parts.year).padStart(4, "0");
    const month = String(parts.month).padStart(2, "0");
    const date = String(parts.date).padStart(2, "0");

    return `${year}-${month}-${date}`;
}
