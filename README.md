# DarkSun Token Registry

Community-maintained multi-chain registry used by DarkSun.finance.

This repository stores:

- token metadata and token logos
- chain network endpoints (LCD/RPC)
- DEX metadata (factory/router) and DEX logos
- proposal funding configuration per blockchain

## Repository Structure

- `registry/index.json`: global index used by integrators.
- `registry/chains/<chain>.json`: token metadata per blockchain.
- `registry/dex/<chain>.json`: DEX metadata per blockchain.
- `registry/farms/<chain>.json`: farming protocol metadata per blockchain.
- `registry/proposals/<chain>.json`: proposal categories, accepted funding assets, escrow routing, and USD targets.
- `tokens/<chain>/*`: token logos (`logoURI` paths).
- `assets/dex/*`: DEX logos (`logoURI` paths).
- `schemas/*.json`: schema references.
- `scripts/validate-registry.mjs`: validation script.

## Quick Start

1. Add/update chain metadata + tokens in `registry/chains/<chain>.json` (including `network.lcd`/`network.rpc`).
2. Add/update DEX entries in `registry/dex/<chain>.json`.
3. Add/update farming protocol entries in `registry/farms/<chain>.json`.
4. Add/update proposal rules in `registry/proposals/<chain>.json` if needed.
5. Ensure assets exist:
   - token logos in `tokens/<chain>/`
   - DEX logos in `assets/dex/`
6. Run validation locally:

```bash
node scripts/validate-registry.mjs
```

6. Open PR.

## Token Types

- `native`: ex. `uluna`, `uusd`
- `cw20`: contract address
- `ibc`: IBC denom

## Proposal Targets

Proposal config must use USD-only target fields:

- `targetAmountUsd`: default USD target for the category
- `targetAmountsUsd`: optional per-blockchain override in USD

`targetAmountsUsd` overrides `targetAmountUsd` for the matching blockchain. It does not add to it.

## Required Fields per Token

- `id`
- `chain`
- `type`
- `symbol`
- `name`
- `decimals`
- `verified`
- `tags`
- `logoURI`
- one identifier:
  - `denom` for native/ibc
  - `contract` for cw20

## Token Entry Format

File: `registry/chains/<chain>.json`

## Chain Network Endpoints

Each chain file must define:

- `network.lcd`: ordered list of LCD endpoints (first = primary, next = failover)
- `network.rpc`: ordered list of RPC endpoints (first = primary, next = failover)

Use full URLs, for example:

- `https://terra-classic-lcd.publicnode.com`
- `https://terra-classic-rpc.publicnode.com`


```json
{
  "chain": "terra_classic",
  "name": "Terra Classic",
  "network": {
    "lcd": ["https://terra-classic-lcd.publicnode.com"],
    "rpc": ["https://terra-classic-rpc.publicnode.com"]
  },
  "tokens": [
    {
      "id": "terra_classic/native/uluna",
      "chain": "terra_classic",
      "type": "native",
      "symbol": "LUNC",
      "name": "Terra Luna Classic",
      "denom": "uluna",
      "decimals": 6,
      "logoURI": "tokens/terra-classic/uluna.svg",
      "verified": true,
      "tags": ["native", "staking"]
    }
  ]
}
```

`logoURI` can be:

- relative path in this repository (recommended)
- absolute URL

## Farming Entry Format

File: `registry/farms/<chain>.json`

```json
{
  "chain": "terra-classic",
  "farms": [
    {
      "id": "terraswap-farms",
      "dexId": "terraswap",
      "adapter": "generic",
      "masterContract": "terra1...",
      "listQuery": {"pools": {"limit": 200}},
      "listPath": "data.pools",
      "contractFields": ["farm_contract", "staking_contract", "contract", "address"]
    }
  ]
}
```

`dexId` references an entry from `registry/dex/<chain>.json`.

## DEX Entry Format

File: `registry/dex/<chain>.json`

```json
{
  "chain": "terra-classic",
  "dexes": [
    {
      "id": "terraswap",
      "name": "Terraswap",
      "logoURI": "assets/dex/terraswap.svg",
      "factory": "terra1...",
      "router": "terra1..."
    }
  ]
}
```

`logoURI` can be:

- relative path in this repository (recommended)
- absolute URL

## Price Source Priority

For each token, use ordered `priceSources` with this fallback policy:

1. `coinmarketcap`
2. `coingecko`
3. `vyntrex`

## Notes

- Keep symbols uppercase.
- Keep IDs unique globally.
- Prefer lowercase addresses/denoms for identifiers.
- Use meaningful tags (`defi`, `stablecoin`, `meme`, `governance`, etc.).

## License

MIT
