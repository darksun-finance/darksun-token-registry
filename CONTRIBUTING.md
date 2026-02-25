# Contributing

Thanks for contributing to DarkSun Token Registry.

## Before You Open a PR

- Read `README.md`.
- Update one chain file per PR when possible.
- Make sure `node scripts/validate-registry.mjs` passes.
- Include proof links in PR description:
  - official website
  - official X / Telegram / docs
  - explorer page for denom/contract

## Token Update Checklist

- [ ] Correct chain file (`registry/chains/<chain>.json`)
- [ ] Identifier is correct (`denom` or `contract`)
- [ ] `symbol`, `name`, `decimals` are correct
- [ ] `logoURI` points to an existing local asset
- [ ] `verified` is set appropriately
- [ ] Tags are relevant

## Verification Policy

Set `verified: true` only when there are clear official references.

## Breaking Changes

Do not remove tokens unless clearly deprecated and discussed in PR.
