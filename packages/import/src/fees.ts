import { isDay, type Day, type FeeCaps } from "@plafond/domain";

export class FeeCapsError extends Error
{
    constructor(problem: string)
    {
        super(`fee caps: ${problem}`);
        this.name = "FeeCapsError";
    }
}

type Fields = Record<string, unknown>;

export function feeCapsOf(source: unknown): FeeCaps[]
{
    if (!Array.isArray(source) || source.length === 0)
    {
        throw new FeeCapsError("the table is not a list of rows");
    }

    const rows = source.map((item, index) => capsOf(record(item, `row ${index + 1}`), `row ${index + 1}`));
    const ordered = rows.sort((a, b) => a.from.localeCompare(b.from));
    for (const [index, next] of ordered.slice(1).entries())
    {
        const before = ordered[index]!;
        if (next.from !== before.until)
        {
            throw new FeeCapsError(`the caps from ${next.from} do not start the day the caps from ${before.from} end, ${before.until}`);
        }
    }

    return ordered;
}

function capsOf(fields: Fields, where: string): FeeCaps
{
    const from = day(fields, "from", where);
    const until = day(fields, "until", where);
    if (until <= from)
    {
        throw new FeeCapsError(`${where}: it ends on ${until}, no later than it starts`);
    }

    const letting = record(fields["letting"], `${where}, letting`);

    return {
        from,
        until,
        letting: { "very-tense": cents(letting, "very-tense", where), tense: cents(letting, "tense", where), other: cents(letting, "other", where) },
        inspection: cents(fields, "inspection", where),
        title: text(fields, "title", where),
        url: link(fields, "url", where),
    };
}

function record(value: unknown, where: string): Fields
{
    if (typeof value !== "object" || value === null || Array.isArray(value))
    {
        throw new FeeCapsError(`${where}: not a record`);
    }

    return value as Fields;
}

function cents(fields: Fields, name: string, where: string): number
{
    const value = fields[name];
    if (typeof value !== "number" || !Number.isInteger(value) || value <= 0)
    {
        throw new FeeCapsError(`${where}: ${name} is not a whole number of cents`);
    }

    return value;
}

function text(fields: Fields, name: string, where: string): string
{
    const value = fields[name];
    if (typeof value !== "string" || value.trim() === "")
    {
        throw new FeeCapsError(`${where}: ${name} is empty or not text`);
    }

    return value;
}

function day(fields: Fields, name: string, where: string): Day
{
    const value = text(fields, name, where);
    if (!isDay(value))
    {
        throw new FeeCapsError(`${where}: ${name} "${value}" is not a day`);
    }

    return value;
}

function link(fields: Fields, name: string, where: string): string
{
    const value = text(fields, name, where);
    if (!value.startsWith("https://"))
    {
        throw new FeeCapsError(`${where}: ${name} "${value}" is not an https link`);
    }

    return value;
}
