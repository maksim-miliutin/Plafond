import { arrondissementOf } from "@plafond/domain";
import type { Decree, Period, Quartier, Rate, Rooms } from "@plafond/domain";

export interface Rent
{
    rooms: Rooms;
    period: Period;
    empty: number;  // majored rent, cents per square metre
    furnished: number;
}

export interface PlacePage
{
    slug: string;
    number: number;
    name: string;
    arrondissement: number;
    decree: Decree;
    rents: Rent[];
}

export interface DistrictPage
{
    slug: string;
    number: number;
    quartiers: PlacePage[];
    lowest: number;
    highest: number;
}

export function slugOf(name: string): string
{
    return name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

export function placePages(rates: readonly Rate[], quartiers: readonly Quartier[]): PlacePage[]
{
    const latest = rates.reduce((last, rate) => (rate.decree.from > last ? rate.decree.from : last), "");
    const current = rates.filter((rate) => rate.decree.from === latest);

    return [...quartiers]
        .sort((a, b) => a.number - b.number)
        .map((quartier) => ({
            slug: slugOf(quartier.name),
            number: quartier.number,
            name: quartier.name,
            arrondissement: arrondissementOf(quartier.number),
            decree: current[0]!.decree,
            rents: rentsOf(current.filter((rate) => rate.flat.quartier === quartier.number)),
        }));
}

function rentsOf(rates: readonly Rate[]): Rent[]
{
    return rates
        .filter((rate) => !rate.flat.furnished)
        .map((empty) => ({
            rooms: empty.flat.rooms,
            period: empty.flat.period,
            empty: empty.majored,
            furnished: rates.find((rate) => rate.flat.furnished && rate.flat.rooms === empty.flat.rooms && rate.flat.period === empty.flat.period)?.majored ?? 0,
        }))
        .sort((a, b) => a.rooms - b.rooms || order.indexOf(a.period) - order.indexOf(b.period));
}

const order: readonly Period[] = ["before-1946", "1946-1970", "1971-1990", "after-1990", "1991-2005", "after-2005"];

export function arrondissementPages(places: readonly PlacePage[]): DistrictPage[]
{
    const numbers = [...new Set(places.map((place) => place.arrondissement))].sort((a, b) => a - b);

    return numbers.map((number) =>
    {
        const quartiers = places.filter((place) => place.arrondissement === number);
        const caps = quartiers.flatMap((place) => place.rents.flatMap((rent) => [rent.empty, rent.furnished]));

        return { slug: districtSlug(number), number, quartiers, lowest: Math.min(...caps), highest: Math.max(...caps) };
    });
}

export function districtSlug(arrondissement: number): string
{
    return `paris-${arrondissement === 1 ? "1er" : `${arrondissement}e`}`;
}

export interface ZoneRents
{
    zone: number;
    rents: Rent[];
}

export interface CommunePage
{
    slug: string;
    name: string;
    decree: Decree;
    zones: ZoneRents[];
}

export function communePages(rates: readonly Rate[], outlines: readonly Quartier[], zoning: ReadonlyMap<number, number>): CommunePage[]
{
    const latest = rates.reduce((last, rate) => (rate.decree.from > last ? rate.decree.from : last), "");
    const current = rates.filter((rate) => rate.decree.from === latest);
    const names = [...new Set(outlines.map((outline) => outline.name))].sort();

    return names.map((name) =>
    {
        const zones = [...new Set(outlines.filter((outline) => outline.name === name).map((outline) => zoning.get(outline.number)!))].sort((a, b) => a - b);

        return {
            slug: slugOf(name),
            name,
            decree: current[0]!.decree,
            zones: zones.map((zone) =>
            {
                const iris = [...zoning].find(([, known]) => known === zone)![0];

                return { zone, rents: rentsOf(current.filter((rate) => rate.flat.quartier === iris)) };
            }),
        };
    });
}

