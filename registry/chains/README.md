# Chain Metadata Guide

This folder contains blockchain-level public metadata used by DarkSun applications.

## What Belongs Here

Typical chain metadata includes:

- chain name and display metadata
- public LCD / REST endpoints
- public RPC endpoints
- CAIP namespace and decimal chain ID for EVM networks
- network namespace, cluster identifier, and genesis hash for Solana networks
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
- EVM networks use `network.namespace: "eip155"`, include `network.chainId`, and may leave `network.lcd` empty
- Solana networks use `network.namespace: "solana"`, include `network.chainId` and `network.genesisHash`, and may leave `network.lcd` empty

## Validation

Run:

```bash
node scripts/validate-registry.mjs
```
