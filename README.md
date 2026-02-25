# DarkSun Token Registry

Community-maintained multi-chain token registry for DarkSun.finance.

This repository stores token metadata, logos, and verification status used by DarkSun.finance.

## Repository Structure

- `registry/index.json`: chain index used by integrators.
- `registry/chains/<chain>.json`: one file per blockchain (source of truth).
- `schemas/*.json`: JSON schema references.
- `assets/tokens/*`: token logos.
- `.github/workflows/validate-registry.yml`: CI validation.
- `scripts/validate-registry.mjs`: validation script.

## Quick Start

1. Add or update tokens in `registry/chains/<chain>.json`.
2. Ensure logos exist in `assets/tokens/`.
3. Run validation locally:

```bash
node scripts/validate-registry.mjs
```

4. Open PR.

## Token Types

- `native`: ex. `uluna`, `uusd`
- `cw20`: contract address
- `ibc`: IBC denom

## Required Fields per token

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

## Price Source Priority

For each token, use ordered `priceSources` with this fallback policy:

1. `coinmarketcap`
2. `coingecko`
3. `vyntrex`

Example:

```json
"priceSources": [
  { "provider": "coinmarketcap", "id": "4172", "priority": 1, "enabled": true },
  { "provider": "coingecko", "id": "terra-luna", "priority": 2, "enabled": true },
  { "provider": "vyntrex", "contract": "terra1...", "api": "https://api.vyntrex.io", "priority": 3, "enabled": true }
]
```

## Notes

- Keep symbols uppercase.
- Keep IDs unique globally.
- Prefer lowercase addresses/denoms for identifiers.
- Use meaningful tags (`defi`, `stablecoin`, `meme`, `governance`, etc.).

## License

MIT
