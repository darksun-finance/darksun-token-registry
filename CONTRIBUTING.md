# Contributing

Thanks for helping keep the DarkSun Token Registry accurate and safe.

This repository is meant for public metadata only. Many contributors will be token owners, validator operators, or ecosystem teams updating information used by the DarkSun application.

## Before You Submit

Please make sure your change is:

- public
- accurate
- verifiable
- limited in scope
- safe to publish

## What You Can Contribute

You can propose updates for:

- token metadata
- token logos
- official project links
- price source references
- validator metadata and validator logos
- public chain endpoints
- DEX and farm metadata
- proposal funding configuration that is already public

## What You Must Not Contribute

Do not add any of the following:

- API keys
- secrets or tokens
- passwords
- private keys
- seed phrases / mnemonics
- internal dashboards
- admin URLs
- private RPC / LCD / REST infrastructure
- staging endpoints not intended for production users
- unpublished contract addresses
- personal contact details unless already clearly public and official

If a value would help someone attack your infrastructure, it does not belong in this repository.

## Proof Requirements

Every metadata update should be supported by official public proof.

Examples of acceptable proof:

- official project website
- official X / Telegram / Discord / GitHub
- public documentation
- public explorer pages
- official validator page
- public governance or product documentation

Include proof links in the pull request description.

## Common Contribution Types

### Token update

Typical token updates include:

- display name
- symbol
- logo
- website
- socials
- public market data references such as `coinmarketcapId` or `coingeckoId`
- `priceSources`

Checklist:

- confirm the token identifier is correct
- confirm branding is official
- confirm links are official and public
- confirm any price source mapping is accurate

### Source / provider update

Provider metadata is defined globally and then referenced by key.

Typical updates include:

- provider name
- public website
- provider icon
- optional tone used by the UI

Checklist:

- use the official provider website
- store icons in `tokens/sources/`
- use a stable key name
- do not add private API endpoints or API credentials

### Validator update

Typical validator updates include:

- moniker correction
- official website
- validator logo

Checklist:

- validator operator address is correct
- moniker matches public validator identity
- logo is official
- website is public and official
- logo asset is stored in `assets/validators/`

## Asset Guidelines

Please keep assets clean and production-friendly.

Guidelines:

- prefer official source files
- use transparent backgrounds where possible
- avoid oversized images
- use stable filenames
- do not embed sensitive information in image metadata

## Validation

Run validation before you submit:

```bash
node scripts/validate-registry.mjs
```

If validation fails, fix the reported schema or reference issue before opening the PR.

## Pull Request Tips

A good pull request should:

- focus on one topic when possible
- explain what changed
- include proof links
- mention any new assets added
- mention any schema-relevant changes

## Review Notes

Maintainers may reject a change if:

- the information is not publicly verifiable
- the assets are low quality or unofficial
- the change exposes sensitive operational details
- the schema is not respected
- the scope is too broad for safe review

## Need Help?

If you are unsure whether a field is safe to publish, treat it as unsafe until confirmed otherwise.
Security comes before convenience in this repository.
