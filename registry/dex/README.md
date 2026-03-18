# DEX Metadata Guide

This folder contains public DEX metadata used by DarkSun applications.

## What Belongs Here

Typical DEX entries may include:

- DEX name and identifier
- public contract addresses such as factory or router
- public logo path
- public metadata needed by the frontend or backend

## Public-Only Rule

Only add information that is already public and intended for application use.

Allowed examples:

- public contract addresses
- official DEX website or branding
- public metadata required to discover pools or pairs

Do not add:

- private infrastructure
- admin URLs
- unpublished contracts
- internal notes about integration strategy
- credentials or tokens of any kind

## Logos

DEX logos should use repository-hosted assets when possible, typically under:

- `assets/dex/`

## Before Editing

Check that:

- the DEX id is stable and correct
- all addresses are public and verified
- logos point to valid files
- the metadata remains chain-specific where required

## Validation

Run:

```bash
node scripts/validate-registry.mjs
```
