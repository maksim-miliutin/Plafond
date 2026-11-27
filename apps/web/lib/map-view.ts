// The part of a plan the svg shows, in the plan's own units. Zooming keeps the plan's proportions and stays inside it.
export interface View
{
    x: number;
    y: number;
    w: number;
    h: number;
}

export const deepest = 8;  // the plan's width divided by the narrowest view

export function fullView(plan: { width: number; height: number }): View
{
    return { x: 0, y: 0, w: plan.width, h: plan.height };
}

function inside(view: View, full: View): View
{
    const w = Math.min(full.w, Math.max(full.w / deepest, view.w));
    const h = w * full.h / full.w;

    return { x: Math.min(full.w - w, Math.max(0, view.x)), y: Math.min(full.h - h, Math.max(0, view.y)), w, h };
}

// Closer by a factor above 1, farther below it, around the view's centre.
export function zoomed(view: View, full: View, factor: number): View
{
    const w = view.w / factor;
    const h = w * full.h / full.w;

    return inside({ x: view.x + (view.w - w) / 2, y: view.y + (view.h - h) / 2, w, h }, full);
}

export function panned(view: View, full: View, dx: number, dy: number): View
{
    return inside({ ...view, x: view.x + dx, y: view.y + dy }, full);
}

// The smallest view of the plan's proportions that holds a box, with a margin around it.
export function framing(box: View, full: View, margin = 0.06): View
{
    const w = Math.max(box.w, box.h * full.w / full.h) * (1 + 2 * margin);
    const h = w * full.h / full.w;

    return inside({ x: box.x + box.w / 2 - w / 2, y: box.y + box.h / 2 - h / 2, w, h }, full);
}

export const isFull = (view: View, full: View) => view.w >= full.w;
