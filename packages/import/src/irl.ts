import { isDay, type IndexRow, type Quarter } from "@plafond/domain";

export class IndexError extends Error
{
    constructor(problem: string)
    {
        super(`index: ${problem}`);
        this.name = "IndexError";
    }
}

export interface RentIndex
{
    source: string;
    rows: IndexRow[];
}

type Fields = Record<string, unknown>;

const quarters: readonly Quarter[] = [1, 2, 3, 4];

export function indexOf(table: unknown): RentIndex
{
    const fields = record(table, "the table");
    const source = fields["source"];
    if (typeof source !== "string" || !source.startsWith("https://"))
    {
        throw new IndexError("the source is not an https link");
    }

    const listed = fields["rows"];
    if (!Array.isArray(listed) || listed.length === 0)
    {
        throw new IndexError("the table has no rows");
    }

    const read = listed.map((item, index) => rowOf(record(item, `row ${index + 1}`), `row ${index + 1}`))
        .sort((a, b) => a.year * 4 + a.quarter - (b.year * 4 + b.quarter));
    for (const [index, next] of read.slice(1).entries())
    {
        follows(read[index]!, next);
    }

    for (const one of read)
    {
        agrees(one, read.find((row) => row.year === one.year - 1 && row.quarter === one.quarter));
    }

    return { source, rows: read.map(({ year, quarter, value, publishedOn }) => ({ year, quarter, value, publishedOn })) };
}

interface Read extends IndexRow
{
    change: number;  // hundredths of a percent over the same quarter a year before, as published
}

function rowOf(fields: Fields, where: string): Read
{
    const quarter = quarters.find((one) => one === fields["quarter"]);
    if (quarter === undefined)
    {
        throw new IndexError(`${where}: the quarter is not 1, 2, 3 or 4`);
    }

    const publishedOn = fields["publishedOn"];
    if (typeof publishedOn !== "string" || !isDay(publishedOn))
    {
        throw new IndexError(`${where}: the day of publication is not a day`);
    }

    return {
        year: whole(fields, "year", where),
        quarter,
        value: whole(fields, "value", where),
        change: whole(fields, "change", where),
        publishedOn,
    };
}

function follows(before: Read, next: Read): void
{
    const step = next.year * 4 + next.quarter - (before.year * 4 + before.quarter);
    if (step !== 1)
    {
        throw new IndexError(`${next.year} T${next.quarter} does not follow ${before.year} T${before.quarter}`);
    }

    if (next.publishedOn <= before.publishedOn)
    {
        throw new IndexError(`${next.year} T${next.quarter} is published no later than the quarter before it`);
    }
}

function agrees(row: Read, yearBefore: Read | undefined): void
{
    if (yearBefore === undefined)
    {
        return;
    }

    const change = Math.round((row.value / yearBefore.value - 1) * 10000);
    if (change !== row.change)
    {
        throw new IndexError(`${row.year} T${row.quarter}: ${row.value} makes a change of ${change}, not the ${row.change} published`);
    }
}

function record(value: unknown, where: string): Fields
{
    if (typeof value !== "object" || value === null || Array.isArray(value))
    {
        throw new IndexError(`${where}: not a record`);
    }

    return value as Fields;
}

function whole(fields: Fields, name: string, where: string): number
{
    const value = fields[name];
    if (typeof value !== "number" || !Number.isInteger(value))
    {
        throw new IndexError(`${where}: ${name} is not a whole number`);
    }

    return value;
}
