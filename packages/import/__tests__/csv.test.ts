import { expect, test } from "vitest";

import { CsvError, readRows } from "../src/csv.js";

test("a quoted field keeps its delimiters, line breaks and doubled quotes", () =>
{
    const text = 'a;"b;c";"say ""hi"""\n"two\nlines";x;y\n';

    expect(readRows(text)).toEqual([
        ["a", "b;c", 'say "hi"'],
        ["two\nlines", "x", "y"],
    ]);
});

test("windows and unix line ends read the same", () =>
{
    expect(readRows("a;b\r\nc;d\r\n")).toEqual(readRows("a;b\nc;d\n"));
});

test("the byte order mark is not part of the first field", () =>
{
    expect(readRows("\uFEFF\"Année\";b\n")).toEqual([["Année", "b"]]);
});

test("a last line without a line end is still a row, and a final line end adds none", () =>
{
    expect(readRows("a;b\nc;d")).toEqual([["a", "b"], ["c", "d"]]);
    expect(readRows("a;b\n")).toEqual([["a", "b"]]);
});

test("empty fields stay empty rather than disappearing", () =>
{
    expect(readRows(";x;\n")).toEqual([["", "x", ""]]);
    expect(readRows(";x;")).toEqual([["", "x", ""]]);
});

test("an unclosed quote is a breakage that names where it opened", () =>
{
    expect(() => readRows('a;b\nc;"d\ne;f\n')).toThrow(CsvError);
    expect(() => readRows('a;b\nc;"d\ne;f\n')).toThrow("opened on line 2 is never closed");
});
