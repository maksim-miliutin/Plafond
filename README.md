# Plafond

Plafond is a set of free checks for tenants in France, each ending with a letter the tenant can send to the landlord, most often a formal notice (lettre de mise en demeure).

- **Rent cap.** Whether a rent in a city under rent control (encadrement des loyers) is above the legal cap, and the overpayment since the lease began. Paris, Lyon and Villeurbanne for now; other cities follow as their data is published.
- **Deposit.** Whether the deposit came back within the month, or two, that the law allows after the keys, and the penalty of a tenth of the rent for each month started late.
- **Service charges.** Which lines of the yearly statement of charges the landlord may pass on under the decree of 26 August 1987, and what was charged wrongly.
- **Notice to leave.** When the tenant's notice ends, one month or three by the letting and the reasons the law accepts, what the last month costs, and the letter giving notice (lettre de congé).
- **Agency fees.** Whether what an estate agent charged the tenant for the visits, the file, the lease and the entry inspection stays within the caps per square metre of the flat's zone, and the letter asking the agency to pay back the rest.
- **Yearly rent rise.** Whether the landlord's yearly revision stays within the change of the reference rent index (IRL) of the lease's quarter, was asked within the year and counts only from the request, and the letter contesting what goes beyond.
- **Energy rating.** From the flat's energy diagnosis (DPE), whether a rent rise was allowed for an F or G flat and whether a G flat still counts as decent, across mainland France.

## What it stands on

Reference rents are published open data: each rate is kept with the day it takes effect, the day it ends and the prefect's decree that sets it. A lease is always checked against the rates in force on the day it was signed.

The calculation runs on the device. The address and the rent are never stored on a server or written to logs. To find the quartier, the device sends the address once, straight to the public geocoding service of the Géoplateforme, which runs the Base Adresse Nationale; it never passes through a Plafond server. The map of the quartier comes from the same service (Plan IGN), which learns the area shown but not the address. For the energy check, the BAN identifier of the address, or the diagnosis number, then goes to the open data of the ADEME, which publishes the diagnoses. There are no accounts, no fees and no ads.

Plafond gives an estimate, not legal advice. Only the prefect's decree and the lease itself are authoritative.

## Data

Reference rents for Paris come from the City of Paris open data portal, dataset [Logement - Encadrement des loyers](https://opendata.paris.fr/explore/dataset/logement-encadrement-des-loyers/), published under the [Open Database License](https://opendatacommons.org/licenses/odbl/). `db/seed/paris-rates.csv` is that table as last processed by the City on 17 June 2025, without its map columns. Data derived from it stays under the same licence.

The City's table stops at 2025. The rents in force from 1 July 2026 are copied from the annexes of the prefect's decree IDF-2026-06-12-00003: `db/seed/paris-sectors-2026.csv` holds annex 1 (the sector of each quartier) and `db/seed/paris-annex-2026.csv` holds annex 2 (the rents of each sector), in the decree's own layout. The import checks every line against the decree's own rules: the furnished reference is the empty one plus its supplement, the majored rent is the reference plus 20 percent and the reduced one the reference minus 30 percent.

`db/seed/paris-decrees.json` lists the prefect's decrees behind each year of rates, with the day each takes effect and ends, and the court decisions that concern them, each with its source. It is kept by hand from the pages of the DRIHL Île-de-France.

Reference rents for Lyon and Villeurbanne come from the open data of the Métropole de Lyon on data.grandlyon.com, one dataset for each year of the prefect's decree (`car_care.carencadrmtloyer_2022_2023` and the years after it). `db/seed/lyon-2022-2023.csv`, `db/seed/lyon-2023-2024.geojson`, `db/seed/lyon-2024-2025.geojson` and `db/seed/lyon-2025-2026.csv` are those files as the Métropole published them, each year in its own layout; the import reads all four, listed once in `seedsFrom` for the pages and the check alike. Each holds, for every small statistical area (IRIS), its zone and its rents; the latest file that carries the outlines of the areas is the one the app uses to find the zone of an address. `db/seed/lyon-decrees.json` lists the decrees of the prefect of the Rhône, kept by hand from the prefecture's page on rent control, with the judgment that annulled the 2023 decree.

`db/seed/rent-control-law.json` holds the periods in which the law behind rent control applies, apart from the decrees that set the rents: article 140 of loi ELAN, from its publication on 24 November 2018 through 24 November 2026, the last day as the Paris decree of 12 June 2026 reads it. A lease signed outside every period gets no verdict, whatever decree is known; an extension of the law is one more period.

`db/seed/agency-fees.json` holds the caps on what an estate agent may charge a tenant, per square metre of living space: one cap for the visits, the file and the lease together in each zone, and one for the entry inspection. The first row holds those of décret n° 2014-890 from 15 September 2014, the second those of the arrêté of 17 July 2025, as amended by the arrêté of 13 November 2025, from 1 January 2026. Each row ends the day the next one starts; the last ends on 1 January 2027, when the caps may be raised again, so a later lease is told that no caps are known for it yet.

`db/seed/irl.json` holds the reference rent index (IRL) of mainland France, quarter by quarter from 2017, as the ANIL publishes it from INSEE: each value in hundredths of a point, the day INSEE published it, and the change over the same quarter a year before in hundredths of a percent. The import recomputes each change from the values and refuses the table if one disagrees, which catches a value typed wrong. A new quarter is added by hand when INSEE publishes it, about the middle of the month after each quarter.

## Status

The app is live at https://maksim-miliutin.com/Plafond/ and can be added to the home screen of a phone. It walks from the address to the letter and shows only what the domain calculates. The rents of Paris were checked against the official map of reference rents of the DRIHL Île-de-France; those of Lyon are still to be checked against the Métropole's own simulator.

## Layout

- `packages/domain`: the calculation, the letter and the rules of law, in plain TypeScript with no framework, so that the web app and a later mobile app share them.
- `packages/import`: reads the published tables (the rents of Paris and Lyon, the annexes of the decrees, the outlines of the quartiers and of Lyon's areas) and checks them line by line.
- `packages/address`: the client of the Géoplateforme geocoder.
- `packages/ademe`: the client of the ADEME open data on energy diagnoses.
- `apps/web`: the Next.js app, exported as plain files and published on GitHub Pages; `e2e` holds the tests that run in real browsers, iPhones included. The pages of Paris and Lyon draw the plan of the city with Leaflet over Plan IGN; the limit drawn on it is the union, computed at build time, of the same outlines of quartiers and areas the rent check searches.
- `db/seed`: the published data the build reads, each file described above.
- `.github/workflows`: the checks every change goes through, and the deploy.

## Development

The Node version is in `.nvmrc`; the test tools need 24.15 or newer.

```
npm ci
npm test
npm run dev
```

`npm run dev` builds the shared packages, then serves the app at http://localhost:3000.
