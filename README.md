# Plafond

Plafond checks whether a rent in a French city under rent control (encadrement des loyers) is above the legal cap, works out the overpayment since the lease began and drafts a formal notice (lettre de mise en demeure) for the tenant to send to the landlord. Paris comes first; other cities follow as their data is published.

## What it stands on

Reference rents are published open data: each rate is kept with the day it takes effect, the day it ends and the prefect's decree that sets it. A lease is always checked against the rates in force on the day it was signed.

The calculation runs on the device. The address and the rent are never stored on a server or written to logs. There are no accounts, no fees and no ads.

Plafond gives an estimate, not legal advice. Only the prefect's decree and the lease itself are authoritative.

## Status

The calculation core lives in `packages/domain` and is being built first. Screens come after its results match the official reference rent tool of the City of Paris.

## Development

The Node version is in `.nvmrc`.

```
npm ci
npm test
```
