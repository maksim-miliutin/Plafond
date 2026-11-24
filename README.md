# Plafond

Plafond is a set of free checks for tenants in France. When the tenant's case calls for it, a check ends with a letter to send to the landlord, or to the estate agent for agency fees, most often a formal notice (lettre de mise en demeure).

- **Rent cap.** Whether a rent in a city under rent control (encadrement des loyers) is above the legal cap, and the overpayment since the lease began. Paris, Lyon, Villeurbanne and the nine communes of Est Ensemble for now; other cities follow as their data is published.
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

Two years have no table from the Métropole, so their rents are copied from the annexes of the prefect's decrees, in the layout of the Paris annex and checked against the same rules. The first decree, DDT 69-2021-09-29-00005, applies to leases signed from 1 November 2021 to 31 October 2022: `db/seed/lyon-annex-2021.csv` copies its scanned annex 1, where one period covers every building after 1990 and stands for both later Lyon periods, as in the Métropole's 2022 file; `db/seed/lyon-sectors-2021.csv` reads its four zones off the map of annex 2, and they are the zones of 2022. The latest, DDT 69-2026-10-23-00004, applies to leases signed from 1 to 23 November 2026, before the Métropole has published it: `db/seed/lyon-annex-2026.csv` holds its annex 1, and `db/seed/lyon-sectors-2026.csv` gives each IRIS the sector that the overview map of annex 2 paints inside it; read that way, every IRIS keeps the zone it had in 2025.

Reference rents for Est Ensemble and Plaine Commune, the two territories of Seine-Saint-Denis under rent control, are copied from annexes 2 to 4 of the decrees of the prefect of the Île-de-France region, which the DRIHL Île-de-France publishes. `db/seed/grand-paris-rates.csv` holds one row per published category, 2021 to 2026, for both territories: the year and dates of the decree, the sector, the dwelling (from 2024 one grid prices houses and flats alike in sectors 307, 308 and 310), the number of rooms, the period, the letting, the three rents, and the PDF page they are printed on. The import checks every row against the decree's dates and rules and refuses a sector that misses a category or prices one twice. The rows of 2021, 2023, 2025 and 2026 were checked against the text of the decrees; those of 2022 come from scans and those of 2024 from the corrected publication of 21 June 2024, which restored the two Bondy grids missing in May. `db/seed/est-ensemble-decrees.json` lists the Est Ensemble decrees, kept by hand from the DRIHL's pages; the 2026 decree stops on 24 November 2026, as its article 4 says.

Annex 1 of each Est Ensemble decree puts every commune in a sector, and splits Montreuil between sectors 307 and 308 by the maps of its annex 5. `db/seed/est-ensemble-communes.csv` copies annex 1, unchanged in the decrees of 2021, 2023, 2025 and 2026, with each commune's INSEE code: an address finds its sector by the commune code the geocoder gives, and only in Montreuil by its point. `db/seed/est-ensemble-sectors.geojson` holds the two Montreuil sectors as the simulator of the DRIHL Île-de-France draws them, public information reused with its source named, as the Code des relations entre le public et l'administration allows. The tests place points read off annex 5 on both sides of the line, and real addresses the simulator itself placed, in their sectors.

Plaine Commune's decrees are read the same way from the same table. `db/seed/plaine-commune-decrees.json` lists them, the first being IDF-2021-04-01-00041 of 1 April 2021 for leases signed from 1 June 2021. `db/seed/plaine-commune-communes.csv` copies their annex 1: Saint-Denis is split between sectors 311 and 312, and Pierrefitte-sur-Seine, a commune déléguée of Saint-Denis since 1 January 2025, is sector 317, found under the code of Saint-Denis by its point or under its own former code. `db/seed/plaine-commune-sectors.geojson` holds those three sectors as the DRIHL's simulator draws them.

`db/seed/rent-control-law.json` holds the periods in which the law behind rent control applies, apart from the decrees that set the rents: article 140 of loi ELAN, from its publication on 24 November 2018 through 24 November 2026, the last day as the Paris decree of 12 June 2026 reads it, then loi n° 2026-1072 of 21 November 2026 (Journal officiel of 22 November), which made the experiment ten years instead of eight, from 25 November 2026 through 24 November 2028 by the same reading. A lease signed outside every period gets no verdict, whatever decree is known; an extension of the law is one more period.

`db/seed/agency-fees.json` holds the caps on what an estate agent may charge a tenant, per square metre of living space: one cap for the visits, the file and the lease together in each zone, and one for the entry inspection. The first row holds those of décret n° 2014-890 from 15 September 2014, the second those of the arrêté of 17 July 2025, as amended by the arrêté of 13 November 2025, from 1 January 2026. Each row ends the day the next one starts; the last ends on 1 January 2027, when the caps may be raised again, so a later lease is told that no caps are known for it yet.

`db/seed/irl.json` holds the reference rent index (IRL) of mainland France, quarter by quarter from 2017, as the ANIL publishes it from INSEE: each value in hundredths of a point, the day INSEE published it, and the change over the same quarter a year before in hundredths of a percent. The import recomputes each change from the values and refuses the table if one disagrees, which catches a value typed wrong. A new quarter is added by hand when INSEE publishes it, about the middle of the month after each quarter.

`db/seed/grand-paris-communes.csv` lists the 130 communes of the Métropole du Grand Paris as [INSEE](https://www.insee.fr/fr/metadonnees/geographie/intercommunalite/200054781-le-grand-paris) counts them, Paris as one commune, each with the territory whose decree caps its rents, if any, and the communes merged into it that tenants still name: Pierrefitte-sur-Seine joined Saint-Denis on 1 January 2025. The page `grand-paris/` reads it to tell each commune what Plafond checks there.

## Status

The app is live at https://maksim-miliutin.com/Plafond/ and can be added to the home screen of a phone. It walks from the address to the letter and shows only what the domain calculates. The rents of Paris were checked against the official map of reference rents of the DRIHL Île-de-France; those of Lyon are still to be checked against the Métropole's own simulator.

## Layout

- `packages/domain`: the calculation, the letter and the rules of law, in plain TypeScript with no framework, so that the web app and a later mobile app share them.
- `packages/import`: reads the published tables (the rents of Paris, Lyon and the territories around Paris, the annexes of the decrees, the outlines of the quartiers, of Lyon's areas and of the split communes) and checks them line by line.
- `packages/address`: the client of the Géoplateforme geocoder.
- `packages/ademe`: the client of the ADEME open data on energy diagnoses.
- `apps/web`: the Next.js app, exported as plain files and published on GitHub Pages; `e2e` holds the tests that run in real browsers, iPhones included. The pages of Paris and Lyon draw the plan of the city with Leaflet over Plan IGN; the limit drawn on it is the union, computed at build time, of the same outlines of quartiers and areas the rent check searches. The first screen asks for Paris or Lyon, then links each of the seven checks by its question; a tenant of any other town reaches the six checks that do not depend on the city through `ailleurs/`, which offers no rent cap. The legal notice lists the code and the fonts written by others that the site ships, as read off the browser source maps of a production build; the build writes their licence texts in full to `licences.txt`.
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
