# How To Update Your Token

This guide is for token or project owners who want to update public information in the DarkSun Token Registry.

## What You Can Update

You can propose updates for things like:

- token name and symbol
- token logo
- official website
- official social links
- public price-source references
- DAO DAO staking contracts and public DAO page (if your token uses DAO DAO staking)

## What You Should Not Add

Do not add anything private or sensitive.

That includes:

- API keys
- passwords
- private endpoints
- admin links
- unpublished contracts
- internal notes

## Typical Steps

1. Update the relevant token metadata file.
2. Add or replace the logo asset if needed.
3. Make sure links are official and public.
4. Run validation.
5. Open a pull request with proof links.

## Proof To Include

Please include official public proof such as:

- official website
- official docs
- official X / Telegram / Discord / GitHub
- public explorer page

## Validation

Run:

```bash
node scripts/validate-registry.mjs
```

## When In Doubt

If you are unsure whether a field is safe to publish, leave it out and ask a maintainer.
