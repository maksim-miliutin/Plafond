import { euros, periods, rooms } from "@plafond/domain";
import type { Period, Rooms } from "@plafond/domain";

import type { Rent } from "../lib/places";

const sizes: readonly Rooms[] = [1, 2, 3, 4];

export function RentGrid({ caption, rents, periods: ages, pick }: { caption: string; rents: readonly Rent[]; periods: readonly Period[]; pick: (rent: Rent) => number })
{
    const cell = (size: Rooms, age: Period) => rents.find((rent) => rent.rooms === size && rent.period === age);

    return (
        <div className="grid-wrap">
            <table className="caps">
                <caption>{caption}, par m²</caption>
                <thead>
                    <tr>
                        <th scope="col">Construit</th>
                        {sizes.map((size) => <th key={size} scope="col">{rooms[size]}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {ages.map((age) => (
                        <tr key={age}>
                            <th scope="row">{periods[age]}</th>
                            {sizes.map((size) =>
                            {
                                const rent = cell(size, age);

                                return <td key={size}>{rent === undefined ? "" : euros(pick(rent))}</td>;
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
