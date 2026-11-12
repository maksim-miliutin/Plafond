import { isDay, type Day, type LawPeriod } from "@plafond/domain";

export class LawTableError extends Error
{
    constructor(problem: string)
    {
        super(`law table: ${problem}`);
        this.name = "LawTableError";
    }
}

type Fields = Record<string, unknown>;

export function lawOf(source: unknown): LawPeriod[]
{
    const periods = record(source, "the table")["periods"];
    if (!Array.isArray(periods) || periods.length === 0)
    {
        throw new LawTableError("the table holds no periods");
    }

    const ordered = periods.map((item, index) => periodOf(record(item, `period ${index + 1}`), `period ${index + 1}`))
        .sort((a, b) => a.from.localeCompare(b.from));
    for (const [index, next] of ordered.slice(1).entries())
    {
        const before = ordered[index]!;
        if (next.from < before.until)
        {
            throw new LawTableError(`the period from ${next.from} starts before the period from ${before.from} ends, ${before.until}`);
        }
    }

    return ordered;
}

function periodOf(fields: Fields, where: string): LawPeriod
{
    const from = day(fields, "from", where);
    const until = day(fields, "until", where);
    if (until <= from)
    {
        throw new LawTableError(`${where}: it ends on ${until}, no later than it starts`);
    }

    return { from, until, title: text(fields, "title", where), url: link(fields, "url", where) };
}

function record(value: unknown, where: string): Fields
{
    if (typeof value !== "object" || value === null || Array.isArray(value))
    {
        throw new LawTableError(`${where}: not a record`);
    }

    return value as Fields;
}

function text(fields: Fields, name: string, where: string): string
{
    const value = fields[name];
    if (typeof value !== "string" || value.trim() === "")
    {
        throw new LawTableError(`${where}: ${name} is empty or not text`);
    }

    return value;
}

function day(fields: Fields, name: string, where: string): Day
{
    const value = text(fields, name, where);
    if (!isDay(value))
    {
        throw new LawTableError(`${where}: ${name} "${value}" is not a day`);
    }

    return value;
}

function link(fields: Fields, name: string, where: string): string
{
    const value = text(fields, name, where);
    if (!value.startsWith("https://"))
    {
        throw new LawTableError(`${where}: ${name} "${value}" is not an https link`);
    }

    return value;
}
