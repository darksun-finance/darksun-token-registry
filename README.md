# DarkSun Token Registry

Public registry for DarkSun token, validator, chain, DEX, farm, and proposal metadata.

This repository is designed to be shared with token and ecosystem owners so they can propose safe, reviewable metadata updates for the DarkSun frontend and backend.

## What This Repository Contains

The registry may include:

- token metadata and logos
- validator metadata and logos
- public chain endpoints and chain display metadata
- public DEX and farm metadata
- proposal and funding configuration used by governance features
- public source/provider metadata used by the UI

Everything committed here must be safe to publish publicly.

## Public-Only Policy

This repository is public-facing configuration.
Only commit information that is already public and intended to be consumed by applications and users.

Allowed examples:

- public project website and social links
- public token logos
- public validator logos
- public LCD/RPC/REST endpoints intended for application use
- public contract addresses
- public validator operator addresses
- public provider websites and logos

Never commit:

- API keys
- bearer tokens
- passwords
- private keys
- seed phrases / mnemonics
- admin or back-office URLs
- private RPC/LCD endpoints
- staging URLs not meant for end users
- unpublished contract addresses
- internal contacts or operational notes

## Repository Structure

```text
index.json
registry/
  index.json
  chains/
  dex/
  farms/
  proposals/
  ui/
  validators/
assets/
  dex/
  validators/
tokens/
  <chain>/
  sources/
schemas/
scripts/
```

Important paths:

- `registry/chains/<chain>.json`: chain metadata, public endpoints, token list references
- `registry/dex/<chain>.json`: DEX metadata and public contracts
- `registry/farms/<chain>.json`: farm metadata
- `registry/proposals/<chain>.json`: public proposal funding configuration
- `registry/validators/<chain>.json`: validator metadata such as moniker, website, logo
- `assets/validators/`: validator logo files
- `tokens/<chain>/`: token logos and token-specific assets
- `tokens/sources/`: provider/source logos used in the UI
- `schemas/`: JSON schemas used for validation

## What Token Owners Can Update

Token and ecosystem owners can propose updates for public metadata such as:

- token name, symbol, description, decimals
- token logo and branding links
- official website and social links
- price source references
- validator logo and website
- DEX / farm metadata that is already public

All submitted information should be verifiable from official public sources.

## Token Example

```json
{
  "symbol": "LUNC",
  "name": "Terra Luna Classic",
  "decimals": 6,
  "website": "https://terra-classic.money/",
  "x": "https://x.com/terra_money",
  "logo": "tokens/terra_classic/lunc.png",
  "coinmarketcapId": "4172",
  "coingeckoId": "terra-luna",
  "priceSources": ["coinmarketcap", "coingecko"]
}
```

## Source / Provider Example

Global provider metadata can be declared once and then referenced by key.

```json
{
  "sources": [
    {
      "key": "coingecko",
      "name": "CoinGecko",
      "url": "https://www.coingecko.com/",
      "icon": "tokens/sources/coingecko.svg",
      "tone": "cyan"
    }
  ]
}
```

A token can then reference it like this:

```json
{
  "symbol": "LUNC",
  "priceSources": ["coingecko", "coinmarketcap"]
}
```

## Validator Example

Validator metadata should only contain public information.

```json
{
  "validators": [
    {
      "operatorAddress": "terravaloper1...",
      "moniker": "Uncode Lounge",
      "website": "https://linktr.ee/uncodelounge",
      "logo": "assets/validators/uncode-lounge.jpg"
    }
  ]
}
```

## Assets

Use repository-hosted assets whenever possible.

Examples:

- `tokens/terra_classic/lunc.png`
- `tokens/sources/coingecko.svg`
- `assets/validators/uncode-lounge.jpg`

Guidelines:

- use clear, stable filenames
- prefer transparent backgrounds when possible
- avoid excessively large files
- keep branding assets official and up to date

## Public Endpoints

Chain files may include public application endpoints such as:

- LCD / REST API URLs
- RPC URLs
- explorer URLs
- governance / community links

Only include endpoints that are intended for public client use.
Do not add private infrastructure, rate-limit bypass URLs, or internal failover endpoints.

## Validation

Validate changes before opening a pull request.

```bash
node scripts/validate-registry.mjs
```

If your environment already has the approved command configured, run the same validation command from the repository root.

## Contribution Flow

1. Fork the repository.
2. Make small, focused metadata changes.
3. Add or update public assets if needed.
4. Run validation.
5. Open a pull request with proof links.

For detailed expectations, see [CONTRIBUTING.md](./CONTRIBUTING.md).
For disclosure and safe-publication guidance, see [SECURITY.md](./SECURITY.md).

## Review Expectations

Pull requests are reviewed for:

- correctness
- public verifiability
- schema validity
- asset quality
- security and publication safety

Maintainers may refuse changes that expose private infrastructure or unverifiable metadata.
