# Validator Asset Guide

This folder contains validator logo assets referenced by validator registry files.

## Usage

A validator entry can point to one of these files, for example:

```json
{
  "operatorAddress": "terravaloper1...",
  "moniker": "Uncode Lounge",
  "logo": "assets/validators/uncode-lounge.jpg"
}
```

## Asset Guidelines

- use official validator branding only
- keep filenames stable and descriptive
- prefer transparent backgrounds when possible
- make sure the image is readable in small UI avatars
- avoid very large files

## Do Not Store

Do not store:

- temporary mockups
- third-party branding that is not the validator's official asset
- images containing private or sensitive information

If you are unsure whether a validator logo is official, include proof in the pull request.
