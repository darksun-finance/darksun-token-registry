# DarkSun Token Registry

Community-maintained multi-chain registry used by DarkSun.finance.

This repository stores:

- token metadata and token logos
- DEX metadata (factory/router) and DEX logos

## Repository Structure

- `registry/index.json`: global index used by integrators.
- `registry/chains/<chain>.json`: token metadata per blockchain.
- `registry/dex/<chain>.json`: DEX metadata per blockchain.
- `tokens/<chain>/*`: token logos (`logoURI` paths).
- `assets/dex/*`: DEX logos (`logoURI` paths).
- `schemas/*.json`: schema references.
- `scripts/validate-registry.mjs`: validation script.

## Quick Start

1. Add/update tokens in `registry/chains/<chain>.json`.
2. Add/update DEX entries in `registry/dex/<chain>.json`.
3. Ensure assets exist:
   - token logos in `tokens/<chain>/`
   - DEX logos in `assets/dex/`
4. Run validation locally:

```bash
node scripts/validate-registry.mjs
```

5. Open PR.

## Token Types

- `native`: ex. `uluna`, `uusd`
- `cw20`: contract address
- `ibc`: IBC denom

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
