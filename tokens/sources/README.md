# Source Logo Guide

This folder stores provider and market-source logos used by the UI.

## What Belongs Here

Typical sources include:

- CoinGecko
- CoinMarketCap
- Vyntrex
- validator.info

Only store official provider logos that are safe to use publicly.

Examples:

- `tokens/sources/coingecko.svg`
- `tokens/sources/coinmarketcap.png`
- `tokens/sources/vyntrex.png`

## Best Practices

- prefer transparent backgrounds
- use clean and readable files at small sizes
- use stable lowercase filenames
- avoid oversized assets

## Related Metadata

These files are referenced from the global `sources` catalog in:

- `index.json`
- `registry/index.json`

Example:

```json
{
  "key": "coingecko",
  "name": "CoinGecko",
  "url": "https://www.coingecko.com/",
  "icon": "tokens/sources/coingecko.svg"
}
```
