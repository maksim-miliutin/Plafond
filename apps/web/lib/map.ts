import type { Point, Quartier } from "@plafond/domain";

export interface Frame
{
    width: number;
    height: number;
}

export interface Outline
{
    number: number;
    own: boolean;
    d: string;
}

export interface Drawing
{
    paths: Outline[];
    pin: { x: number; y: number };
}

const margin = 0.25;  // share of the quartier's size left clear on each side

export function drawing(own: Quartier, around: readonly Quartier[], point: Point, frame: Frame): Drawing
{
    const positions = own.rings.flat();
    const lats = positions.map(([, lat]) => lat);
    const south = Math.min(...lats);
    const north = Math.max(...lats);

    // A degree of longitude spans cos(latitude) of a degree of latitude; without this Paris comes out wide.
    const shrink = Math.cos(((south + north) / 2) * (Math.PI / 180));
    const xs = positions.map(([lon]) => lon * shrink);
    const west = Math.min(...xs);
    const east = Math.max(...xs);

    const scale = Math.min(frame.width / ((east - west) * (1 + 2 * margin)), frame.height / ((north - south) * (1 + 2 * margin)));
    const middle = { x: (west + east) / 2, y: (south + north) / 2 };

    const place = (lon: number, lat: number) => ({
        x: frame.width / 2 + (lon * shrink - middle.x) * scale,
        y: frame.height / 2 - (lat - middle.y) * scale,
    });

    const outline = (quartier: Quartier): Outline => ({
        number: quartier.number,
        own: quartier === own,
        d: quartier.rings
            .map((ring) => "M" + ring.map(([lon, lat]) => spot(place(lon, lat))).join("L") + "Z")
            .join(""),
    });

    return { paths: [own, ...around].map(outline), pin: place(point.lon, point.lat) };
}

function spot({ x, y }: { x: number; y: number }): string
{
    return `${x.toFixed(1)},${y.toFixed(1)}`;
}
