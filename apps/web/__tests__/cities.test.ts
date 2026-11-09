import { expect, test } from "vitest";

import { cityOf } from "../lib/cities";

test("a commune code tells the city whose rules apply: Paris for 751, Lyon for its arrondissements and Villeurbanne", () =>
{
    expect(cityOf("75105")).toBe("paris");
    expect(cityOf("69383")).toBe("lyon");
    expect(cityOf("69266")).toBe("lyon");
});
