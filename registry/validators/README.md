# Validator Metadata Guide

This folder contains public validator metadata used by DarkSun applications.

## What Belongs Here

Validator entries may include:

- operator address
- moniker
- official website
- validator logo path stored in this repository

## Example

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

## Public-Only Rule

Only add public validator identity information.

Allowed examples:

- public operator address
- public validator moniker
- official website
- official validator branding assets

Do not add:

- private contact information
- operational notes
- internal validator infrastructure URLs
- private monitoring links

## Logos

Validator logos should be stored under:

- `assets/validators/`

Use stable filenames and official branding when possible.
If a validator has no official logo, it is better to omit the logo than to add an unofficial image.
