import { expect, test } from "vitest";

import { complementBars, noComplementFrom } from "../src/complement.js";

// Loi n° 2022-1158 du 16 août 2022, article 13, read in the answer to question n° 11593 (JO, 31 October 2023) and on
// service-public: in a lease signed from 18 August 2022, none of these nine may carry a complement.
test("a lease signed from 18 August 2022 is held to the nine characteristics that bar a complement, an older one to none", () =>
{
    expect(noComplementFrom).toBe("2022-08-18");
    expect(complementBars("2022-08-17")).toEqual([]);
    expect(complementBars("2022-08-18")).toHaveLength(9);
    expect(complementBars("2026-11-09")[0]).toBe("des sanitaires sur le palier");
    expect(complementBars("2026-11-09")).toContain("un diagnostic de performance énergétique de classe F ou G");
    expect(complementBars("2026-11-09").at(-1)).toBe("une mauvaise exposition de la pièce principale");
});
