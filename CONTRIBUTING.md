# Contributing

Thanks for contributing to DarkSun Token Registry.

## Before You Open a PR

- Read `README.md`.
- Keep PR scope focused (prefer one chain per PR).
- Make sure `node scripts/validate-registry.mjs` passes.
- Include proof links in PR description:
  - official website
  - official X / Telegram / docs
  - explorer page for denom/contract/factory

## Token Update Checklist

- [ ] Correct chain file (`registry/chains/<chain>.json`)
- [ ] Identifier is correct (`denom` or `contract`)
- [ ] `symbol`, `name`, `decimals` are correct
- [ ] `logoURI` points to an existing local asset under `tokens/<chain>/` (or valid absolute URL)
- [ ] `verified` is set appropriately
- [ ] Tags are relevant

## DEX Update Checklist

- [ ] Correct DEX file (`registry/dex/<chain>.json`)
- [ ] `id`, `name`, `factory` are correct
- [ ] `router` is correct when available
- [ ] `logoURI` points to an existing local asset under `assets/dex/` (or valid absolute URL)
- [ ] Optional fields are valid (`extra_pools`, `pairsQuery`, etc.)

## Verification Policy

Set `verified: true` only when there are clear official references.

## Breaking Changes

Do not remove tokens/DEX entries unless clearly deprecated and discussed in PR.
