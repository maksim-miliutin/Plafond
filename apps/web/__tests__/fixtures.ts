import type { Claim, Rate } from "@plafond/domain";

// The 2025 rate for St-Germain-l'Auxerrois, three rooms, 1946-1970, furnished, as the City's table publishes it.
export const rate: Rate = {
    flat: { quartier: 1, rooms: 3, period: "1946-1970", furnished: true },
    reference: 2670,
    majored: 3200,
    minored: 1870,
    decree: {
        title: "Arrêté préfectoral n° 2025-06-16-00003",
        url: "https://example.org/decree",
        from: "2025-07-01",
        until: "2026-07-01",
        contest: null,
    },
};

export const claim: Claim = {
    flat: rate.flat,
    surface: 4000,
    signedOn: "2025-09-01",
    startsOn: "2025-09-01",
    rent: 150000,
    complement: 0,
    on: "2026-09-29",
};
