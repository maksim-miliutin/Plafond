import { expect, test } from "vitest";

import { deepest, framing, fullView, isFull, panned, zoomed } from "../lib/map-view";

const full = fullView({ width: 600, height: 500 });

test("zooming halves the view around its centre and keeps the plan's proportions, up to eight times closer", () =>
{
    const closer = zoomed(full, full, 2);

    expect(closer).toEqual({ x: 150, y: 125, w: 300, h: 250 });
    expect(isFull(closer, full)).toBe(false);
    expect(zoomed(closer, full, 0.5)).toEqual(full);
    expect(zoomed(full, full, 100).w).toBe(600 / deepest);
    expect(zoomed(full, full, 0.5)).toEqual(full);
});

test("a view slides with the finger and stops at the plan's edges", () =>
{
    const closer = zoomed(full, full, 2);

    expect(panned(closer, full, 50, -20)).toEqual({ x: 200, y: 105, w: 300, h: 250 });
    expect(panned(closer, full, -1000, 1000)).toEqual({ x: 0, y: 250, w: 300, h: 250 });
});

test("framing a box gives the smallest view of the plan's proportions that holds it with a margin", () =>
{
    const view = framing({ x: 240, y: 180, w: 120, h: 80 }, full, 0);

    expect(view).toEqual({ x: 240, y: 170, w: 120, h: 100 });
    expect(framing({ x: 0, y: 0, w: 600, h: 500 }, full)).toEqual(full);
});
