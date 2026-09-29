export class CsvError extends Error
{
    constructor(problem: string)
    {
        super(`csv: ${problem}`);
        this.name = "CsvError";
    }
}

interface Field
{
    value: string;
    next: number;
    closesRow: boolean;
}

const delimiter = ";";
const quote = "\"";
const byteOrderMark = "\uFEFF";

export function readRows(text: string): string[][]
{
    const source = text.startsWith(byteOrderMark) ? text.slice(1) : text;
    const rows: string[][] = [];
    let row: string[] = [];
    let at = 0;

    while (at < source.length)
    {
        const field = source[at] === quote ? quotedField(source, at) : plainField(source, at);
        row.push(field.value);
        at = field.next;

        if (field.closesRow)
        {
            rows.push(row);
            row = [];
        }
    }

    if (row.length > 0)
    {
        rows.push([...row, ""]);
    }

    return rows;
}

function plainField(source: string, start: number): Field
{
    let end = start;
    while (end < source.length && source[end] !== delimiter && source[end] !== "\n" && source[end] !== "\r")
    {
        end++;
    }

    return ending(source, source.slice(start, end), end);
}

function quotedField(source: string, start: number): Field
{
    let value = "";
    let from = start + 1;

    for (;;)
    {
        const close = source.indexOf(quote, from);
        if (close < 0)
        {
            throw new CsvError(`a quoted field opened on line ${lineOf(source, start)} is never closed`);
        }

        value += source.slice(from, close);
        if (source[close + 1] !== quote)
        {
            return ending(source, value, close + 1);
        }

        value += quote;
        from = close + 2;
    }
}

function ending(source: string, value: string, at: number): Field
{
    if (at >= source.length)
    {
        return { value, next: at, closesRow: true };
    }

    const next = source[at];
    if (next === delimiter)
    {
        return { value, next: at + 1, closesRow: false };
    }

    if (next === "\r" && source[at + 1] === "\n")
    {
        return { value, next: at + 2, closesRow: true };
    }

    if (next === "\n" || next === "\r")
    {
        return { value, next: at + 1, closesRow: true };
    }

    throw new CsvError(`text follows a closing quote on line ${lineOf(source, at)}`);
}

function lineOf(source: string, at: number): number
{
    return source.slice(0, at).split("\n").length;
}
