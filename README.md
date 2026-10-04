# Plafond

Plafond is a set of free checks for tenants in France, each ending with a formal notice (lettre de mise en demeure) the tenant can send to the landlord.

- **Rent cap.** Whether a rent in a city under rent control (encadrement des loyers) is above the legal cap, and the overpayment since the lease began. Paris comes first; other cities follow as their data is published.
- **Deposit.** Whether the deposit came back within the month, or two, that the law allows after the keys, and the penalty of a tenth of the rent for each month started late.
- **Service charges.** Which lines of the yearly statement of charges the landlord may pass on under the decree of 26 August 1987, and what was charged wrongly.
- **Energy rating.** From the flat's energy diagnosis (DPE), whether a rent rise was allowed for an F or G flat and whether a G flat still counts as decent, across mainland France.

## What it stands on

Reference rents are published open data: each rate is kept with the day it takes effect, the day it ends and the prefect's decree that sets it. A lease is always checked against the rates in force on the day it was signed.

The calculation runs on the device. The address and the rent are never stored on a server or written to logs. To find the quartier, the device sends the address once, straight to the public geocoding service of the Géoplateforme, which runs the Base Adresse Nationale; it never passes through a Plafond server. The map of the quartier comes from the same service (Plan IGN), which learns the area shown but not the address. For the energy check, the BAN identifier of the address, or the diagnosis number, then goes to the open data of the ADEME, which publishes the diagnoses. There are no accounts, no fees and no ads.

Plafond gives an estimate, not legal advice. Only the prefect's decree and the lease itself are authoritative.

## Data

Reference rents for Paris come from the City of Paris open data portal, dataset [Logement - Encadrement des loyers](https://opendata.paris.fr/explore/dataset/logement-encadrement-des-loyers/), published under the [Open Database License](https://opendatacommons.org/licenses/odbl/). `db/seed/paris-rates.csv` is that table as last processed by the City on 17 June 2025, without its map columns. Data derived from it stays under the same licence.

The City's table stops at 2025. The rents in force from 1 July 2026 are copied from the annexes of the prefect's decree IDF-2026-06-12-00003: `db/seed/paris-sectors-2026.csv` holds annex 1 (the sector of each quartier) and `db/seed/paris-annex-2026.csv` holds annex 2 (the rents of each sector), in the decree's own layout. The import checks every line against the decree's own rules: the furnished reference is the empty one plus its supplement, the majored rent is the reference plus 20 percent and the reduced one the reference minus 30 percent.

`db/seed/paris-decrees.json` lists the prefect's decrees behind each year of rates, with the day each takes effect and ends, and the court decisions that concern them, each with its source. It is kept by hand from the pages of the DRIHL Île-de-France.

## Status

The app is live at https://maksim-miliutin.github.io/Plafond/ and can be added to the home screen of a phone. It walks from the address to the letter and shows only what the domain calculates. Until its figures are checked against the official reference rent tool, it is a trial version.

## Layout

- `packages/domain`: the calculation, the letter and the rules of law, in plain TypeScript with no framework, so that the web app and a later mobile app share them.
- `packages/import`: reads the published tables (the City's rents, the annexes of the decrees, the outlines of the quartiers) and checks them line by line.
- `packages/address`: the client of the Géoplateforme geocoder.
- `packages/ademe`: the client of the ADEME open data on energy diagnoses.
- `apps/web`: the Next.js app, exported as plain files and published on GitHub Pages; `e2e` holds the tests that run in real browsers, iPhones included.
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
