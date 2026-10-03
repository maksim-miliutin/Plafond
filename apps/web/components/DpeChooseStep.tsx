import { frenchDay, ordinal, squareMetres } from "@plafond/domain";
import type { Listing } from "@plafond/ademe";

import { LabelBadge } from "./LabelBadge";

export interface DpeChooseProps
{
    listings: Listing[];
    onChoose?: (index: number) => void;
    onBack?: () => void;
}

export function DpeChooseStep({ listings, onChoose, onBack }: DpeChooseProps)
{
    return (
        <main className="screen">
            {onBack !== undefined && <button type="button" className="back" onClick={onBack}>Changer de recherche</button>}
            <h1 className="title">Lequel est votre logement ?</h1>
            <p className="lead">
                Un même immeuble peut avoir plusieurs diagnostics. Choisissez celui de votre logement d'après la surface et l'étage.
            </p>
            <ul className="listings">
                {listings.map((listing, index) => (
                    <li key={listing.dpe.number}>
                        <button type="button" className="listing" onClick={() => onChoose?.(index)}>
                            <LabelBadge label={listing.dpe.label} />
                            <span className="facts">
                                <strong>DPE du {frenchDay(listing.dpe.establishedOn)}</strong>
                                <span>{described(listing)}</span>
                                <span className="number">n° {listing.dpe.number}, {listing.address}</span>
                            </span>
                        </button>
                    </li>
                ))}
            </ul>
        </main>
    );
}

function described({ surface, floor, detail }: Listing): string
{
    const parts = [
        surface === null ? null : squareMetres(surface),
        floor === null ? null : floor === 0 ? "rez-de-chaussée" : `${ordinal(floor)} étage`,
        detail,
    ];

    return parts.filter((part) => part !== null).join(", ");
}
