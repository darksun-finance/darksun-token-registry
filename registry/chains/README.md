# Chain Metadata Guide

This folder contains blockchain-level public metadata used by DarkSun applications.

## What Belongs Here

Typical chain metadata includes:

- chain name and display metadata
- public LCD / REST endpoints
- public RPC endpoints
- public explorer and ecosystem links
- token references for the chain

## Public-Only Rule

Only include information intended for public application use.

Allowed examples:

- public LCD endpoints
- public RPC endpoints
- public explorer URLs
- official chain website and public links

Do not add:

- private infrastructure
- internal failover endpoints
- allowlisted infrastructure URLs
- staging environments
- admin tools or dashboards

## Common File Pattern

Typical file:

- `registry/chains/terra_classic.json`

## Before Editing

Check that:

- the chain key is correct
- all URLs are public and intentional
- token references point to valid identifiers and assets
- the data remains chain-specific where needed
- the file still matches the schema

## Validation

Run:

```bash
node scripts/validate-registry.mjs
```
