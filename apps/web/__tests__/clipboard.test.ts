import { expect, test } from "vitest";

import { copy } from "../lib/clipboard";

test("the text lands on the clipboard as given", async () =>
{
    const written: string[] = [];
    const clipboard = {
        writeText: async (text: string) =>
        {
            written.push(text);
        },
    };

    expect(await copy("Madame, Monsieur,\n", clipboard)).toBe("copied");
    expect(written).toEqual(["Madame, Monsieur,\n"]);
});

test("a browser that refuses the clipboard is told apart, not thrown at the reader", async () =>
{
    const clipboard = {
        writeText: async () =>
        {
            throw new DOMException("denied", "NotAllowedError");
        },
    };

    expect(await copy("text", clipboard)).toBe("refused");
    expect(await copy("text", undefined)).toBe("refused");
});
