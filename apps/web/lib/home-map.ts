import { outlineOf, type FeeZone, type Quartier } from "@plafond/domain";

type Ring = Quartier["rings"][number];
type Spot = [number, number];

// What a touch on the map of the first screen tells: the check a tenant can run there and the page that says more.
export type ShapeKind = "capped" | "plain";

export interface Shape
{
    name: string;
    d: string;  // SVG path in the drawing's own units
    kind: ShapeKind;
    group: "paris" | "est-ensemble" | "plaine-commune" | "lyon" | "villeurbanne" | "plain";
    page: string;  // relative to the first screen
    code?: string;  // the INSEE code of the commune, Paris's or Lyon's for an arrondissement
    zone?: FeeZone;  // what its agency fees follow
    tense?: boolean;  // in part 1 of the list, which the notice and the reletting rent follow
}

export interface Label
{
    text: string;
    x: number;
    y: number;
    kind: "territory" | "area" | "region";
}

export interface Drawing
{
    width: number;
    height: number;
    shapes: Shape[];
    borders: string;  // dashed lines between départements
    outline: string;  // the edge of the métropole
    city: string;  // the edge of the city whose rents are capped
    labels: Label[];
    inset?: { regions: string; frame: string; width: number; height: number };
}

export interface Projection
{
    (point: readonly number[]): Spot;
}

// An equirectangular projection, scaled at the middle latitude so a kilometre is as long north-south as east-west.
export function projectionOf(rings: readonly Ring[], width: number, height: number, padding: number, margin = 0): Projection
{
    const lons = rings.flatMap((ring) => ring.map(([lon]) => lon));
    const lats = rings.flatMap((ring) => ring.map(([, lat]) => lat));
    const [west, east, south, north] = [Math.min(...lons), Math.max(...lons), Math.min(...lats), Math.max(...lats)];
    const squash = Math.cos(((south + north) / 2) * Math.PI / 180);
    const [spanX, spanY] = [(east - west) * squash * (1 + 2 * margin), (north - south) * (1 + 2 * margin)];
    const scale = Math.min((width - 2 * padding) / spanX, (height - 2 * padding) / spanY);
    const [left, top] = [(width - (east - west) * squash * scale) / 2, (height - (north - south) * scale) / 2];

    return ([lon, lat]) => [(lon! - west) * squash * scale + left, (north - lat!) * scale + top];
}

// The algorithm of Ramer, Douglas and Peucker on the projected points: a point closer than the tolerance to the line it sits on adds nothing.
export function simplified(points: readonly Spot[], tolerance: number): Spot[]
{
    if (points.length < 3)
    {
        return [...points];
    }

    const [first, last] = [points[0]!, points.at(-1)!];
    const [dx, dy] = [last[0] - first[0], last[1] - first[1]];
    const length = Math.hypot(dx, dy);
    let [far, at] = [-1, 0];
    for (let index = 1; index < points.length - 1; index += 1)
    {
        const [x, y] = points[index]!;
        const distance = length === 0 ? Math.hypot(x - first[0], y - first[1]) : Math.abs(dy * x - dx * y + last[0] * first[1] - last[1] * first[0]) / length;
        if (distance > far)
        {
            [far, at] = [distance, index];
        }
    }

    return far > tolerance
        ? [...simplified(points.slice(0, at + 1), tolerance).slice(0, -1), ...simplified(points.slice(at), tolerance)]
        : [first, last];
}

const figure = (value: number) => (Math.round(value * 10) / 10).toString();

// A closed ring is cut in two before simplifying, or its first and last points, being one, would erase it.
export function pathOf(rings: readonly Ring[], project: Projection, tolerance: number, closed = true): string
{
    return rings.map((ring) =>
    {
        const spots = ring.map(project);
        const half = Math.floor(spots.length / 2);
        const kept = closed && spots.length > 3
            ? [...simplified(spots.slice(0, half + 1), tolerance).slice(0, -1), ...simplified(spots.slice(half), tolerance)]
            : simplified(spots, tolerance);

        return `M${kept.map(([x, y]) => `${figure(x)},${figure(y)}`).join("L")}${closed ? "Z" : ""}`;
    }).join("");
}

// The sides two outlines share only once each: between communes of two départements, the border of the départements.
export function sharedSides<Area extends { rings: readonly Ring[] }>(areas: readonly Area[], groupOf: (area: Area) => string, project: Projection): string
{
    const key = ([lon, lat]: readonly number[]) => `${lon!.toFixed(5)},${lat!.toFixed(5)}`;
    const groups = new Map<string, Set<string>>();
    const ends = new Map<string, [readonly number[], readonly number[]]>();
    for (const area of areas)
    {
        for (const ring of area.rings)
        {
            for (let index = 0; index + 1 < ring.length; index += 1)
            {
                const [a, b] = [ring[index]!, ring[index + 1]!];
                const side = [key(a), key(b)].sort().join(" ");
                groups.set(side, (groups.get(side) ?? new Set()).add(groupOf(area)));
                ends.set(side, [a, b]);
            }
        }
    }

    return [...groups].filter(([, owners]) => owners.size > 1).map(([side]) =>
    {
        const [[x1, y1], [x2, y2]] = ends.get(side)!.map(project) as [Spot, Spot];
        return `M${figure(x1)},${figure(y1)}L${figure(x2)},${figure(y2)}`;
    }).join("");
}

export interface Outline
{
    code: string;
    name: string;
    rings: Quartier["rings"];
}

export interface GrandParisInput
{
    arrondissements: { number: number; slug: string; rings: Quartier["rings"] }[];
    communes: (Outline & { territory: "est-ensemble" | "plaine-commune" | null; zone: FeeZone; tense: boolean })[];  // every commune but Paris
    paris: Quartier["rings"];  // the outline the rent check searches
    parisZone: FeeZone;
    parisTense: boolean;
    parisContour: Quartier["rings"];  // Paris among the outlines of the communes, which share its borders exactly
    departments: Outline[];
}

const ordinalOf = (number: number) => (number === 1 ? "1er" : `${number}e`);

// The Grand Paris on a 600 by 640 frame: Paris by arrondissement, the two territories and the other communes in grey.
export function grandParisDrawing({ arrondissements, communes, paris, parisZone, parisTense, parisContour, departments }: GrandParisInput, tolerance: number): Drawing
{
    const [width, height] = [600, 640];
    const everything = [...paris, ...communes.flatMap((commune) => commune.rings)];
    const project = projectionOf(everything, width, height, 12);
    const shapes: Shape[] = [
        ...communes.filter((commune) => commune.territory === null).map((commune): Shape => ({ name: commune.name, d: pathOf(commune.rings, project, tolerance), kind: "plain", group: "plain", page: "grand-paris/", code: commune.code, zone: commune.zone, tense: commune.tense })),
        ...communes.filter((commune) => commune.territory !== null).map((commune): Shape => ({ name: commune.name, d: pathOf(commune.rings, project, tolerance), kind: "capped", group: commune.territory!, page: `grand-paris/${commune.territory}/`, code: commune.code, zone: commune.zone, tense: commune.tense })),
        ...arrondissements.map(({ number, slug, rings }): Shape => ({ name: `Paris ${ordinalOf(number)}`, d: pathOf(rings, project, tolerance), kind: "capped", group: "paris", page: `arrondissements/${slug}/`, code: "75056", zone: parisZone, tense: parisTense })),
    ];
    const all = [{ code: "75056", rings: parisContour }, ...communes];
    const metropole = outlineOf(all.map((area, number) => ({ number, name: area.code, rings: area.rings })));
    const regions = projectionOf(departments.flatMap((department) => department.rings), 120, 100, 3);
    const label = (text: string, lon: number, lat: number, kind: Label["kind"]): Label =>
    {
        const [x, y] = project([lon, lat]);
        return { text, x: Math.round(x), y: Math.round(y), kind };
    };

    return {
        width,
        height,
        shapes,
        borders: sharedSides(all, (area) => area.code.slice(0, 2), project),
        outline: pathOf(metropole, project, tolerance),
        city: pathOf(paris, project, tolerance),
        labels: [
            label("Paris", 2.303, 48.8369, "territory"),
            label("Plaine Commune", 2.4457, 48.9689, "territory"),
            label("Est Ensemble", 2.5658, 48.894, "territory"),
            label("Hauts-de-Seine", 2.2109, 48.7662, "region"),
            label("Seine-Saint-Denis", 2.5794, 48.8435, "region"),
            label("Val-de-Marne", 2.4891, 48.7246, "region"),
            label("Val-d'Oise", 2.1856, 48.9874, "region"),
            label("Essonne", 2.4078, 48.658, "region"),
        ],
        inset: {
            width: 120,
            height: 100,
            regions: pathOf(departments.flatMap((department) => department.rings), regions, 0.6),
            frame: pathOf(metropole, regions, 0.4),
        },
    };
}

export interface LyonInput
{
    areas: { name: string; slug: string; rings: Quartier["rings"]; code: string; zone: FeeZone; tense: boolean }[];  // Lyon's nine arrondissements and Villeurbanne
    communes: (Outline & { zone: FeeZone; tense: boolean })[];  // the other communes of the Métropole
}

// Lyon and Villeurbanne fill the frame; the communes around them show at its edges, cut by it.
export function lyonDrawing({ areas, communes }: LyonInput, tolerance: number): Drawing
{
    const [width, height] = [600, 640];
    const [lyon, villeurbanne] = [areas.filter((area) => area.name !== "Villeurbanne"), areas.filter((area) => area.name === "Villeurbanne")];
    const project = projectionOf(areas.flatMap((area) => area.rings), width, height, 56);
    const inFrame = (rings: Quartier["rings"]) => rings.some((ring) => ring.map(project).some(([x, y]) => x > -60 && x < width + 60 && y > -60 && y < height + 60));
    const shapes: Shape[] = [
        ...communes.filter((commune) => inFrame(commune.rings)).map((commune): Shape => ({ name: commune.name, d: pathOf(commune.rings, project, tolerance), kind: "plain", group: "plain", page: "ailleurs/", code: commune.code, zone: commune.zone, tense: commune.tense })),
        ...areas.map((area): Shape => ({
            name: area.name.replace(/ Arrondissement$/, ""),
            d: pathOf(area.rings, project, tolerance),
            kind: "capped",
            group: area.name === "Villeurbanne" ? "villeurbanne" : "lyon",
            page: `lyon/${area.slug}/`,
            code: area.code,
            zone: area.zone,
            tense: area.tense,
        })),
    ];
    const label = (text: string, lon: number, lat: number, kind: Label["kind"]): Label =>
    {
        const [x, y] = project([lon, lat]);
        return { text, x: Math.round(x), y: Math.round(y), kind };
    };
    const centre = (rings: Quartier["rings"]): Spot =>
    {
        const ring = [...rings].sort((a, b) => b.length - a.length)[0]!;
        let [area, x, y] = [0, 0, 0];
        for (let index = 0; index + 1 < ring.length; index += 1)
        {
            const [[x0, y0], [x1, y1]] = [ring[index]!, ring[index + 1]!] as [Spot, Spot];
            const cross = x0 * y1 - x1 * y0;
            [area, x, y] = [area + cross, x + (x0 + x1) * cross, y + (y0 + y1) * cross];
        }

        return project([x / (3 * area), y / (3 * area)]);
    };

    return {
        width,
        height,
        shapes,
        borders: "",
        outline: "",
        city: pathOf([lyon, villeurbanne].flatMap((part) => outlineOf(part.map((area, number) => ({ number, name: area.name, rings: area.rings })))), project, tolerance),
        labels: [
            label("Lyon", 4.792, 45.8071, "territory"),
            label("Villeurbanne", 4.904, 45.797, "territory"),
            ...areas.filter((area) => area.name !== "Villeurbanne").map((area) =>
            {
                const [x, y] = centre(area.rings);
                return { text: area.name.replace(/^Lyon /, "").replace(/ Arrondissement$/, ""), x: Math.round(x), y: Math.round(y), kind: "area" as const };
            }),
        ],
    };
}
