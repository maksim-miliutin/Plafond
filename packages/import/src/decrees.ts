import { isDay, type Contest, type Day, type Decree } from "@plafond/domain";

export class DecreesError extends Error
{
    constructor(problem: string)
    {
        super(`decrees: ${problem}`);
        this.name = "DecreesError";
    }
}

type Fields = Record<string, unknown>;

const outcomes: readonly Contest["outcome"][] = ["annulled", "pending"];

export function decreesOf(source: unknown): ReadonlyMap<number, Decree>
{
    if (!Array.isArray(source))
    {
        throw new DecreesError("the table is not a list");
    }

    const decrees = new Map<number, Decree>();
    for (const [index, item] of source.entries())
    {
        const where = `entry ${index + 1}`;
        const fields = record(item, where);
        const year = fields["year"];
        if (typeof year !== "number" || !Number.isInteger(year))
        {
            throw new DecreesError(`${where}: the year is not a whole number`);
        }

        if (decrees.has(year))
        {
            throw new DecreesError(`${where}: a second decree for ${year}`);
        }

        decrees.set(year, decreeOf(fields, `${where} (${year})`));
    }

    const ordered = [...decrees].sort(([a], [b]) => a - b);
    for (const [index, [, decree]] of ordered.slice(1).entries())
    {
        const before = ordered[index]![1];
        if (decree.from < before.until)
        {
            throw new DecreesError(`${decree.title} starts on ${decree.from}, before ${before.title} ends`);
        }
    }

    return new Map(ordered);
}

function decreeOf(fields: Fields, where: string): Decree
{
    const from = day(fields, "from", where);
    const until = day(fields, "until", where);
    if (until <= from)
    {
        throw new DecreesError(`${where}: it ends on ${until}, no later than it starts`);
    }

    return {
        title: text(fields, "title", where),
        url: link(fields, "url", where),
        from,
        until,
        contest: fields["contest"] === null ? null : contestOf(record(fields["contest"], where), where),
    };
}

function contestOf(fields: Fields, where: string): Contest
{
    const outcome = outcomes.find((o) => o === fields["outcome"]);
    if (outcome === undefined)
    {
        throw new DecreesError(`${where}: the court outcome is neither ${outcomes.join(" nor ")}`);
    }

    return {
        outcome,
        court: text(fields, "court", where),
        decidedOn: day(fields, "decidedOn", where),
        claimsBy: fields["claimsBy"] === null ? null : day(fields, "claimsBy", where),
        source: link(fields, "source", where),
    };
}

function record(value: unknown, where: string): Fields
{
    if (typeof value !== "object" || value === null || Array.isArray(value))
    {
        throw new DecreesError(`${where}: not a record`);
    }

    return value as Fields;
}

function text(fields: Fields, name: string, where: string): string
{
    const value = fields[name];
    if (typeof value !== "string" || value.trim() === "")
    {
        throw new DecreesError(`${where}: ${name} is empty or not text`);
    }

    return value;
}

function day(fields: Fields, name: string, where: string): Day
{
    const value = text(fields, name, where);
    if (!isDay(value))
    {
        throw new DecreesError(`${where}: ${name} "${value}" is not a day`);
    }

    return value;
}

function link(fields: Fields, name: string, where: string): string
{
    const value = text(fields, name, where);
    if (!value.startsWith("https://"))
    {
        throw new DecreesError(`${where}: ${name} "${value}" is not an https link`);
    }

    return value;
}
